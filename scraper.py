"""
BLAZO Prospect Scraper
Finds and scores local businesses using Google Maps + website analysis.
Output: {CITY}_{BUSINESS_TYPE}_prospects.csv

Setup (run once):
    pip install playwright pandas
    playwright install chromium

Run:
    python scraper.py
"""

import asyncio
import csv
import re
from dataclasses import dataclass, field, asdict
from pathlib import Path

from playwright.async_api import async_playwright, Page, BrowserContext

# ─── CONFIG ─────────────────────────────────────────────────────────────────
CITY          = "Downey"
BUSINESS_TYPE = "law firm"
STATE         = "California"
MAX_RESULTS   = 25          # Max prospects per run
HEADLESS      = True        # Set False to watch the browser
OUTPUT_FILE   = f"{CITY}_{BUSINESS_TYPE.replace(' ', '_')}_prospects.csv"

# Scoring weights (must sum to 1.0)
SCORING_WEIGHTS = {
    "automation_gap":   0.50,
    "web_presence":     0.25,
    "social_presence":  0.25,
}
# ─────────────────────────────────────────────────────────────────────────────

PERSONAL_EMAIL_DOMAINS = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"}

BOOKING_KEYWORDS = [
    "calendly", "acuityscheduling", "booksy", "mindbody", "schedulicity",
    "setmore", "vagaro", "book a", "schedule a", "book now", "schedule now",
    "book online", "schedule online", "request a consultation",
]

GENERIC_LANGUAGE = [
    "call us", "give us a call", "contact us by phone",
    "call today", "call for a free", "call to schedule",
]

TECH_STACK_SIGNALS = [
    "wordpress", "wix", "squarespace", "webflow", "shopify",
    "hubspot", "mailchimp", "salesforce", "zoho",
]


@dataclass
class Prospect:
    business_name: str = ""
    city: str = ""
    email_domain: str = ""
    phone: str = ""
    website: str = ""
    web_presence_score: float = 0.0
    social_presence_score: float = 0.0
    automation_gap_score: float = 0.0
    overall_fit_score: float = 0.0
    recommended_message_angle: str = ""
    best_channel: str = "email"
    # Internal — not exported to CSV
    _instagram_url: str = field(default="", repr=False)
    _linkedin_url: str = field(default="", repr=False)


async def get_map_listings(page: Page, city: str, business_type: str) -> list[dict]:
    """
    Search Google Maps and return a list of {name, maps_url} dicts.
    Uses multiple selectors as fallbacks — Maps changes its DOM frequently.
    """
    query = f"{business_type} in {city}, {STATE}"
    encoded = query.replace(" ", "+")
    await page.goto(f"https://www.google.com/maps/search/{encoded}", wait_until="networkidle")
    await page.wait_for_timeout(2500)

    results = []
    seen_names = set()

    for scroll_attempt in range(8):
        # Primary selector: anchor tags with a /maps/place/ href
        listings = await page.query_selector_all('a[href*="/maps/place/"]')

        for el in listings:
            href = await el.get_attribute("href") or ""
            # Prefer aria-label; fall back to inner text
            name = (await el.get_attribute("aria-label") or "").strip()
            if not name:
                name = (await el.inner_text()).strip().split("\n")[0]
            if name and href and name not in seen_names:
                seen_names.add(name)
                results.append({"name": name, "maps_url": href})

        if len(results) >= MAX_RESULTS:
            break

        # Scroll the results feed
        feed = await page.query_selector('div[role="feed"]')
        if feed:
            await feed.evaluate("el => el.scrollBy(0, 900)")
        else:
            await page.evaluate("window.scrollBy(0, 900)")
        await page.wait_for_timeout(1200)

    return results[:MAX_RESULTS]


async def get_place_details(page: Page, maps_url: str) -> dict:
    """
    Navigate to a Maps place page and extract phone + website URL.
    """
    details = {"phone": "", "website": ""}
    try:
        await page.goto(maps_url, wait_until="networkidle", timeout=18000)
        await page.wait_for_timeout(1500)

        # Phone — Maps stores it in data-item-id
        phone_el = await page.query_selector('button[data-item-id*="phone"]')
        if phone_el:
            raw = await phone_el.get_attribute("data-item-id") or ""
            details["phone"] = raw.replace("phone:", "").strip()

        # Website link
        site_el = await page.query_selector('a[data-item-id="authority"]')
        if site_el:
            details["website"] = (await site_el.get_attribute("href") or "").strip()

    except Exception:
        pass
    return details


async def analyze_website(context: BrowserContext, url: str) -> dict:
    """
    Visit the business website and extract qualification signals.
    Returns a dict of signals used for scoring.
    """
    result = {
        "load_ok": False,
        "email_domain": "",
        "has_form": False,
        "has_booking": False,
        "has_generic_language": False,
        "instagram_url": "",
        "linkedin_url": "",
        "tech_stack": [],
    }
    if not url:
        return result

    page = await context.new_page()
    try:
        resp = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
        if not resp or resp.status >= 400:
            return result
        result["load_ok"] = True
        await page.wait_for_timeout(1500)

        html = (await page.content()).lower()
        text = (await page.inner_text("body")).lower()

        # Email detection — grab first real email address found in page source
        emails_found = re.findall(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}", html)
        for email in emails_found:
            domain = email.split("@")[-1]
            # Skip common CDN/image/noreply patterns
            if any(x in domain for x in ["sentry", "example", "noreply", "amazonaws", "cloudflare"]):
                continue
            result["email_domain"] = domain
            break

        # Lead capture form
        result["has_form"] = bool(await page.query_selector("form"))

        # Booking/scheduling tool signals
        result["has_booking"] = any(kw in html for kw in BOOKING_KEYWORDS)

        # Generic "just call us" language — automation gap signal
        result["has_generic_language"] = any(phrase in text for phrase in GENERIC_LANGUAGE)

        # Social links
        for link in await page.query_selector_all("a[href]"):
            href = (await link.get_attribute("href") or "").lower()
            if "instagram.com" in href and not result["instagram_url"]:
                result["instagram_url"] = href
            if "linkedin.com" in href and not result["linkedin_url"]:
                result["linkedin_url"] = href

        # Tech stack fingerprinting
        result["tech_stack"] = [s for s in TECH_STACK_SIGNALS if s in html]

    except Exception:
        pass
    finally:
        await page.close()

    return result


async def check_instagram_activity(context: BrowserContext, url: str) -> bool:
    """
    Visit the Instagram profile and check for post activity.
    Returns True if the account appears active (3+ posts visible).
    """
    if not url:
        return False
    page = await context.new_page()
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=12000)
        await page.wait_for_timeout(2000)
        posts = await page.query_selector_all("article")
        return len(posts) >= 3
    except Exception:
        return False
    finally:
        await page.close()


# ─── SCORING ─────────────────────────────────────────────────────────────────

def score_web_presence(site: dict) -> float:
    """
    0–10: How polished/effective is their current web presence?
    Higher = better web presence (lower automation opportunity, but signals they're serious).
    """
    if not site.get("load_ok"):
        return 1.0  # site doesn't load = basically no web presence
    score = 4.0     # baseline for a live site
    if site.get("has_form"):
        score += 2.0
    if site.get("has_booking"):
        score += 2.0
    if site.get("tech_stack"):
        score += 1.0
    email = site.get("email_domain", "")
    if email and email not in PERSONAL_EMAIL_DOMAINS:
        score += 1.0  # branded email = slightly more established
    return min(score, 10.0)


def score_social_presence(site: dict, ig_active: bool) -> float:
    """
    0–10: Do they have an active social media presence?
    """
    score = 0.0
    if site.get("instagram_url"):
        score += 4.0
        if ig_active:
            score += 3.0
        else:
            score += 1.0  # account exists but inactive
    if site.get("linkedin_url"):
        score += 3.0
    return min(score, 10.0)


def score_automation_gap(site: dict) -> float:
    """
    0–10: How much do they need automation? Higher = bigger opportunity for BLAZO.
    Signals: personal email, no form, no booking, generic language, no site.
    """
    score = 0.0

    email = site.get("email_domain", "")
    if not email:
        score += 2.0              # no email found at all
    elif email in PERSONAL_EMAIL_DOMAINS:
        score += 3.0              # Gmail/Yahoo = strong signal

    if not site.get("has_form"):
        score += 3.0              # no lead capture form
    if not site.get("has_booking"):
        score += 2.0              # no booking/scheduling tool
    if site.get("has_generic_language"):
        score += 2.0              # "call us" = no digital workflow

    return min(score, 10.0)


def pick_message_angle(web: float, social: float, auto_gap: float) -> str:
    if auto_gap >= 6:
        return "Automation & Workflow Efficiency"
    if web < 4:
        return "Website & Digital Presence"
    if social < 3:
        return "Social Media & Online Visibility"
    return "Full Tech Transformation"


def pick_best_channel(site: dict) -> str:
    """
    Prefer Instagram (warm, visible) → branded email → LinkedIn (flag) → default email.
    """
    if site.get("instagram_url"):
        return "instagram"
    email = site.get("email_domain", "")
    if email and email not in PERSONAL_EMAIL_DOMAINS:
        return "email"
    if site.get("linkedin_url"):
        return "linkedin (verify manually)"
    return "email"


# ─── OUTPUT ──────────────────────────────────────────────────────────────────

EXPORT_FIELDS = [
    "business_name", "city", "email_domain", "phone", "website",
    "web_presence_score", "social_presence_score", "automation_gap_score",
    "overall_fit_score", "recommended_message_angle", "best_channel",
]


def save_csv(prospects: list[Prospect], path: str) -> None:
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=EXPORT_FIELDS)
        writer.writeheader()
        for p in prospects:
            row = asdict(p)
            row = {k: v for k, v in row.items() if k in EXPORT_FIELDS}
            for score_col in ["web_presence_score", "social_presence_score",
                               "automation_gap_score", "overall_fit_score"]:
                row[score_col] = round(float(row[score_col]), 1)
            writer.writerow(row)


# ─── MAIN ────────────────────────────────────────────────────────────────────

async def main():
    print(f"\n BLAZO Prospect Scraper")
    print(f" Target: {BUSINESS_TYPE} in {CITY}, {STATE}")
    print(f" Max results: {MAX_RESULTS}")
    print(f" Output: {OUTPUT_FILE}\n")

    prospects: list[Prospect] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=HEADLESS)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            )
        )
        maps_page = await context.new_page()

        print("Searching Google Maps...")
        listings = await get_map_listings(maps_page, CITY, BUSINESS_TYPE)
        print(f"Found {len(listings)} listings\n")

        for i, listing in enumerate(listings, 1):
            name = listing["name"]
            print(f"[{i}/{len(listings)}] {name}")

            p = Prospect(business_name=name, city=CITY)

            # Pull phone + website from Maps place page
            details = await get_place_details(maps_page, listing["maps_url"])
            p.phone   = details["phone"]
            p.website = details["website"]

            # Analyze the business website
            site = {}
            if p.website:
                print(f"         → site: {p.website}")
                site = await analyze_website(context, p.website)
                p.email_domain   = site.get("email_domain", "")
                p._instagram_url = site.get("instagram_url", "")
                p._linkedin_url  = site.get("linkedin_url", "")

            # Check Instagram activity
            ig_active = False
            if p._instagram_url:
                print(f"         → checking Instagram")
                ig_active = await check_instagram_activity(context, p._instagram_url)

            # Score
            web_score    = score_web_presence(site)
            social_score = score_social_presence(site, ig_active)
            auto_score   = score_automation_gap(site)

            p.web_presence_score    = web_score
            p.social_presence_score = social_score
            p.automation_gap_score  = auto_score
            p.overall_fit_score     = round(
                auto_score   * SCORING_WEIGHTS["automation_gap"]   +
                web_score    * SCORING_WEIGHTS["web_presence"]     +
                social_score * SCORING_WEIGHTS["social_presence"],
                1
            )
            p.recommended_message_angle = pick_message_angle(web_score, social_score, auto_score)
            p.best_channel              = pick_best_channel(site)

            print(f"         fit={p.overall_fit_score}  |  {p.recommended_message_angle}  |  {p.best_channel}")
            prospects.append(p)

            await asyncio.sleep(1.5)  # polite delay between prospects

        await browser.close()

    # Save + summary
    save_csv(prospects, OUTPUT_FILE)
    print(f"\n Saved {len(prospects)} prospects → {OUTPUT_FILE}")

    hot  = [p for p in prospects if p.overall_fit_score >= 7]
    warm = [p for p in prospects if 4 <= p.overall_fit_score < 7]
    cold = [p for p in prospects if p.overall_fit_score < 4]
    print(f" Hot (7+): {len(hot)}   Warm (4-7): {len(warm)}   Cold (<4): {len(cold)}")
    print("\n Top 5 prospects:")
    for p in sorted(prospects, key=lambda x: x.overall_fit_score, reverse=True)[:5]:
        print(f"   {p.overall_fit_score:4.1f}  {p.business_name[:42]:<42}  {p.best_channel}")


if __name__ == "__main__":
    asyncio.run(main())
