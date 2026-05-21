import { useState } from "react";

const CONTENT_TYPES = {
  tip: { label: "Tech Tip", color: "#00e5a0", bg: "rgba(0,229,160,0.1)" },
  bts: { label: "Behind the Scenes", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  result: { label: "Client Result", color: "#f5c518", bg: "rgba(245,197,24,0.1)" },
  story: { label: "Story/Reel", color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  engagement: { label: "Engagement", color: "#38bdf8", bg: "rgba(56,189,248,0.1)" },
};

const PLATFORMS = {
  linkedin: { label: "LinkedIn", icon: "in", color: "#0077b5" },
  instagram: { label: "Instagram", icon: "ig", color: "#e1306c" },
};

// 30-day content plan
const CALENDAR = [
  // WEEK 1 — Establish Authority
  { day: 1, platform: "linkedin", type: "tip", hook: "Most SoCal law firms are losing leads every day without knowing it.", idea: "Post about the #1 automation gap you see in local businesses: manual lead review. Explain how one law firm went from missing 40% of leads to catching all of them.", cta: "Comment 'AUDIT' and I'll review your process for free." },
  { day: 1, platform: "instagram", type: "story", hook: "Day 1 of building in public 🚀", idea: "Story: Quick intro — who you are, what you're building, why SoCal businesses need a tech consultant. Raw, authentic, phone camera.", cta: "Follow along for the journey." },
  { day: 2, platform: "linkedin", type: "bts", hook: "I just started a tech consulting agency from scratch. Here's my exact gameplan.", idea: "Transparent post about your starting point — 1 proof of concept client, building systems, targeting SoCal businesses. People love the underdog story.", cta: "Save this to follow the journey." },
  { day: 2, platform: "instagram", type: "tip", hook: "Is your business using Gmail for client emails? 🚩", idea: "Carousel: 5 signs your business looks unprofessional online. Gmail, no website, outdated design, no booking system, no social presence.", cta: "Tag a local business that needs this." },
  { day: 3, platform: "linkedin", type: "tip", hook: "A $500 fix that could double your law firm's response rate.", idea: "Breakdown of automated lead intake — what it is, how it works, what it costs, what it returns. Make it tangible.", cta: "DM me 'LEADS' to see how this works." },
  { day: 3, platform: "instagram", type: "story", hook: "Behind my screen today 👀", idea: "Story series: show your workspace setup, tools you use, what a day of building looks like. Human and relatable.", cta: "Reply with questions." },
  { day: 4, platform: "linkedin", type: "engagement", hook: "Unpopular opinion: most small business websites are actively hurting sales.", idea: "Controversial take to spark comments. List 3 website mistakes that repel customers. Invite people to share their worst examples.", cta: "Drop your website below — I'll give honest feedback." },
  { day: 4, platform: "instagram", type: "result", hook: "We automated this law firm's entire lead review process. Here's what changed.", idea: "Before/after post about your NJ proof of concept. No firm name needed. Focus on the outcome: time saved, leads captured, revenue impact.", cta: "Could your business use this? DM 'YES'." },
  { day: 5, platform: "linkedin", type: "tip", hook: "3 tech tools every local service business should be using in 2025.", idea: "Practical listicle: CRM, scheduling/booking automation, and branded email. Simple, actionable, shareable.", cta: "Which one are you missing? Comment below." },
  { day: 5, platform: "instagram", type: "tip", hook: "Your competitor just automated their follow-ups. Are you still doing it manually?", idea: "Reel script: quick 30-second explainer on what workflow automation looks like for a small business. Keep it visual.", cta: "Follow for weekly tech tips for local businesses." },
  { day: 6, platform: "linkedin", type: "bts", hook: "What I learned in my first week building a solo tech consultancy.", idea: "Personal reflection post. Honest about the challenges. Share what's working (outreach, building tools) and what isn't. Vulnerability builds trust.", cta: "Save + share with a founder who needs to hear this." },
  { day: 6, platform: "instagram", type: "story", hook: "Weekend check-in ✅", idea: "Story: weekly recap. What you built, who you talked to, what's coming next week. Keep followers invested in your journey.", cta: "Drop questions for next week." },
  { day: 7, platform: "linkedin", type: "engagement", hook: "SoCal business owners — what's your biggest tech headache right now?", idea: "Pure engagement post. Ask a question, collect intel on pain points, reply to every comment. This doubles as market research.", cta: "Drop it in the comments." },
  { day: 7, platform: "instagram", type: "tip", hook: "5 questions to ask before hiring a web designer.", idea: "Carousel establishing your expertise. Positions you as the consultant who helps businesses make smarter tech decisions.", cta: "Save this before your next hire." },

  // WEEK 2 — Build Trust
  { day: 8, platform: "linkedin", type: "tip", hook: "The website mistake that's costing local businesses $1,000s in missed leads.", idea: "Deep dive: no clear call-to-action, slow load times, not mobile optimized. With screenshots of good vs bad examples (generic, not real clients).", cta: "Comment your website — I'll tell you what's costing you." },
  { day: 8, platform: "instagram", type: "bts", hook: "Building a client outreach system from scratch 🔧", idea: "Reel/carousel showing the tools and process behind your outreach agent. Keep it high level but interesting. Tech founders love this content.", cta: "Follow to see how this turns out." },
  { day: 9, platform: "linkedin", type: "result", hook: "How we saved a law firm 10+ hours a week without changing their team.", idea: "More detail on your proof of concept. Walk through the exact process change. What was manual, what is now automated, time/money saved.", cta: "DM me 'WORKFLOW' to explore this for your business." },
  { day: 9, platform: "instagram", type: "story", hook: "Storytime: the moment I realized local businesses are being left behind 📱", idea: "Personal story about why you started this. Make it emotional and real. Why SoCal? Why small businesses?", cta: "Share if you know a business owner who needs help." },
  { day: 10, platform: "linkedin", type: "tip", hook: "What a tech audit actually looks like for a small business.", idea: "Demystify what you offer. Walk through the 5 things you check in a tech audit: website, email, automation, social, CRM.", cta: "Want a free 15-min version? Drop 'AUDIT' below." },
  { day: 10, platform: "instagram", type: "tip", hook: "Your Google Business profile is free money. Are you using it?", idea: "Carousel: how to optimize Google Business for a local service business. Practical and immediately useful.", cta: "Save this and do it today." },
  { day: 11, platform: "linkedin", type: "bts", hook: "I built an AI tool that finds local businesses that need my help. Here's how.", idea: "High-level breakdown of your scraper concept. Don't give away the code — sell the vision. This attracts both clients AND collaborators.", cta: "Thoughts? Would you use something like this?" },
  { day: 11, platform: "instagram", type: "engagement", hook: "Be honest: what does your business website score out of 10? 👇", idea: "Simple engagement post. Ask followers to rate their own website. Reply to everyone. Great for algorithm and intel.", cta: "Drop your score below." },
  { day: 12, platform: "linkedin", type: "tip", hook: "The 3-step tech stack every law firm under 20 people should have.", idea: "Niche down to your proof of concept audience. Specific = credible. CRM + intake automation + branded communication tools.", cta: "Save this. Share with a lawyer friend." },
  { day: 12, platform: "instagram", type: "story", hook: "Mid-month check-in 📊", idea: "Story: share your real numbers — posts made, DMs sent, conversations started. Transparency builds a following.", cta: "Follow to see the end-of-month results." },
  { day: 13, platform: "linkedin", type: "engagement", hook: "What's stopping most small businesses from growing online? Pick one:", idea: "Poll or list post: A) No time B) No budget C) Don't know where to start D) Bad past experience. Massive engagement post.", cta: "Vote + explain in comments." },
  { day: 13, platform: "instagram", type: "result", hook: "Before: chasing leads manually. After: leads come to them.", idea: "Transformation carousel. Generic client story (no names). Focus on the emotional journey — stress to relief.", cta: "DM 'STORY' to get your own transformation." },
  { day: 14, platform: "linkedin", type: "bts", hook: "Two weeks in. Here's what's actually working.", idea: "Honest update post. Building in public — what got traction, what flopped, what you're changing. Vulnerable = relatable = shareable.", cta: "Save + follow for weekly updates." },
  { day: 14, platform: "instagram", type: "tip", hook: "If your business doesn't have these 3 things online, you're invisible.", idea: "Reel: fast-paced, punchy. Google presence, mobile website, one active social account. Make it urgent.", cta: "Tag a business owner who needs to hear this." },

  // WEEK 3 — Demonstrate Value
  { day: 15, platform: "linkedin", type: "tip", hook: "I audited 10 SoCal business websites this week. Here's what I found.", idea: "Aggregated findings post — no individual names. Common patterns: no CTAs, slow load, not mobile optimized, generic stock photos, no reviews.", cta: "Want me to audit yours? Comment 'YES'." },
  { day: 15, platform: "instagram", type: "bts", hook: "What my work week actually looks like 📅", idea: "Story/reel day-in-the-life. Morning routine, outreach time, building time, learning time. Aspirational but real.", cta: "Follow for more behind-the-scenes." },
  { day: 16, platform: "linkedin", type: "tip", hook: "Stop using Calendly wrong. Here's how it should work for service businesses.", idea: "Practical deep dive on booking automation. How to set it up, how to embed it, how to connect it to your CRM. Immediately useful.", cta: "Share with a service business owner." },
  { day: 16, platform: "instagram", type: "tip", hook: "3 automations that will save you 5 hours a week 🔥", idea: "Carousel: lead intake form → CRM, appointment reminders, follow-up email sequences. Simple, visual, actionable.", cta: "Save this. You'll thank me later." },
  { day: 17, platform: "linkedin", type: "result", hook: "What happens when a service business finally gets its tech right.", idea: "Storytelling post. Generic composite client. Before state (chaos, manual, stressed) → intervention (audit, recommendations, implementation) → after state (automated, growing, confident).", cta: "Is your business in the 'before' state? DM me." },
  { day: 17, platform: "instagram", type: "story", hook: "Real talk: building a business is hard 😤", idea: "Honest story about a challenge you faced this week. Rejection, slow progress, technical issue. Being real builds loyalty.", cta: "Reply if you're building something too." },
  { day: 18, platform: "linkedin", type: "tip", hook: "Why your business email matters more than you think.", idea: "Post specifically about branded email vs Gmail. Perception, trust, deliverability. Include data if possible.", cta: "Still on Gmail? Let's fix that. DM me." },
  { day: 18, platform: "instagram", type: "engagement", hook: "Which of these would help your business most right now?", idea: "Engagement carousel/poll: A) Better website B) Automated workflows C) Stronger social D) All of the above. Market research disguised as content.", cta: "Vote in comments." },
  { day: 19, platform: "linkedin", type: "bts", hook: "I'm building my agency's entire tech stack in public. Week 3 update.", idea: "Show the tools you're using to run your own business — CRM, outreach tools, content scheduler, project management. Practice what you preach.", cta: "What tools are you using? Drop below." },
  { day: 19, platform: "instagram", type: "tip", hook: "Your Instagram bio is either getting you clients or losing them.", idea: "Reel or carousel: how to write a local business Instagram bio that converts. Clear offer, location, CTA, link.", cta: "Drop your bio below for a free review." },
  { day: 20, platform: "linkedin", type: "engagement", hook: "Hot take: most 'web designers' aren't actually helping local businesses grow.", idea: "Slightly controversial post that differentiates you — you're a tech consultant, not just a designer. You look at the whole system.", cta: "Agree or disagree? Comment below." },
  { day: 20, platform: "instagram", type: "result", hook: "They thought they couldn't afford a website. We proved them wrong.", idea: "Story about a business that was intimidated by cost. Break down what's actually affordable and what the ROI looks like.", cta: "DM 'COST' to get real pricing info." },
  { day: 21, platform: "linkedin", type: "tip", hook: "The cheapest way to look like a legit business online (under $50/month).", idea: "Practical stack: branded email ($6/mo), simple website ($15/mo), scheduling tool ($10/mo), Google Business (free). Accessible and shareable.", cta: "Save this and share with a small business owner." },
  { day: 21, platform: "instagram", type: "story", hook: "Week 3 done ✅ Here's where things stand.", idea: "Progress update story. Real numbers, real feelings. Keep followers invested in your journey.", cta: "1 week left in the month. Follow to see the final update." },

  // WEEK 4 — Convert & Close
  { day: 22, platform: "linkedin", type: "tip", hook: "How to know if your business is ready to invest in automation.", idea: "Qualifying post that pre-sells your service. If you're doing X manually more than 5x a week, it's time. Makes readers self-identify as ready.", cta: "Ready? DM me 'READY' and let's talk." },
  { day: 22, platform: "instagram", type: "bts", hook: "What I wish I knew before starting a tech consulting business.", idea: "Lessons learned carousel. Honest, educational, personal. Great for shares.", cta: "Save + share with a fellow builder." },
  { day: 23, platform: "linkedin", type: "result", hook: "3 months after their tech overhaul — here's where this firm stands.", idea: "Longer-form success story post. Imagine what your NJ client's 3-month results could look like. Make it aspirational.", cta: "Want results like this? DM me." },
  { day: 23, platform: "instagram", type: "tip", hook: "The one thing that separates thriving local businesses from struggling ones.", idea: "Reel: systems. The businesses winning have systems for everything — leads, follow-up, reviews, social. Make it punchy.", cta: "Follow for weekly systems content." },
  { day: 24, platform: "linkedin", type: "tip", hook: "What I check first when auditing a local business's tech presence.", idea: "Behind-the-process post. Walk through your audit framework — website speed, mobile, email, social activity, booking, CRM. Builds authority.", cta: "Want me to run this on your business? DM 'AUDIT'." },
  { day: 24, platform: "instagram", type: "engagement", hook: "If you could fix ONE thing about your business's online presence, what would it be?", idea: "Simple question post. High engagement, great intel, shows you care about their answer.", cta: "Drop it below 👇" },
  { day: 25, platform: "linkedin", type: "bts", hook: "I almost quit this week. Here's what kept me going.", idea: "Vulnerable post about a hard moment. Real, human, relatable. These get the most shares and comments.", cta: "Save this if you're building something hard right now." },
  { day: 25, platform: "instagram", type: "story", hook: "5 days left in the month 👀", idea: "Story: tease something coming — a new tool, a client win, an announcement. Build anticipation.", cta: "Stay tuned." },
  { day: 26, platform: "linkedin", type: "tip", hook: "Why local businesses in SoCal are 2 years behind on tech — and how to catch up fast.", idea: "Regional angle — SoCal specific. Makes locals feel seen. Talk about the competitive landscape and what catching up actually takes.", cta: "Are you a SoCal business owner? Let's connect." },
  { day: 26, platform: "instagram", type: "result", hook: "This is what happens when you take your digital presence seriously 📈", idea: "Data-driven carousel. Stats about businesses with strong online presence vs weak. Make the ROI undeniable.", cta: "DM 'SERIOUS' to get started." },
  { day: 27, platform: "linkedin", type: "engagement", hook: "Month 1 done. Ask me anything about building a tech consultancy from scratch.", idea: "AMA-style post. Invites massive engagement and positions you as someone worth following.", cta: "Drop your question below." },
  { day: 27, platform: "instagram", type: "bts", hook: "Month 1 recap: what actually happened 📊", idea: "Honest numbers reel/carousel. Posts made, DMs sent, conversations, any clients. Real > perfect.", cta: "Follow for month 2." },
  { day: 28, platform: "linkedin", type: "tip", hook: "My exact outreach process for landing local business clients (steal this).", idea: "Value-bomb post that also showcases your system. Walk through research → personalization → channel selection → message → follow-up.", cta: "Save this. Share with a consultant friend." },
  { day: 28, platform: "instagram", type: "tip", hook: "Still sending cold DMs with zero research? Do this instead.", idea: "Reel: quick tip on personalized outreach. Check their profile, mention something specific, lead with value. 60 seconds.", cta: "Follow for more outreach tips." },
  { day: 29, platform: "linkedin", type: "result", hook: "What 30 days of consistent content did for my consulting pipeline.", idea: "Reflection post tying your content journey to business results. Conversations started, leads generated, lessons learned.", cta: "Follow for month 2." },
  { day: 29, platform: "instagram", type: "story", hook: "Last day of the month tomorrow 🎯", idea: "Story: set up the month 2 announcement. What's coming, what you're building next, how followers can work with you.", cta: "DM me if you want to be first in line." },
  { day: 30, platform: "linkedin", type: "bts", hook: "Month 1 complete. Here's everything I built, learned, and what's next.", idea: "Capstone post. Full month recap — content stats, outreach results, tools built, lessons, month 2 goals. Make it comprehensive and shareable.", cta: "Follow for month 2. DM me if you want to work together." },
  { day: 30, platform: "instagram", type: "engagement", hook: "We made it to day 30. What content helped you most this month? 👇", idea: "Engagement post that closes the loop. Thank your followers, invite them to share what resonated, tease what's coming.", cta: "Follow for month 2 content starting tomorrow." },
];

async function generateFullPost(item) {
  const prompt = `You are a tech consultant and agency owner in Southern California targeting local small businesses (especially law firms). Write a complete ${item.platform} post.

Day ${item.day} — ${item.type.toUpperCase()} post
Hook: ${item.hook}
Content idea: ${item.idea}
CTA: ${item.cta}

Platform: ${item.platform}
${item.platform === "linkedin" ? "Format: Text-based. 150-300 words. Use line breaks for readability. No hashtag spam — max 3 relevant hashtags at end." : ""}
${item.platform === "instagram" ? item.type === "story" ? "Format: Story script — 3-5 slides with text overlay copy. Each slide under 10 words. Punchy and visual." : "Format: Caption for a carousel or reel. 80-150 words. Conversational tone. 5-8 relevant hashtags at end." : ""}

Tone: Confident, real, peer-to-peer. Not corporate. Sounds like a smart 20-something founder who knows their stuff.
Write only the post. No preamble or labels.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "Error generating post.";
}

function PostCard({ item, weekFilter, platformFilter }) {
  const [post, setPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (weekFilter !== "all" && Math.ceil(item.day / 7) !== parseInt(weekFilter)) return null;
  if (platformFilter !== "all" && item.platform !== platformFilter) return null;

  const type = CONTENT_TYPES[item.type];
  const platform = PLATFORMS[item.platform];

  const generate = async () => {
    setLoading(true);
    setExpanded(true);
    const result = await generateFullPost(item);
    setPost(result);
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 10,
      transition: "border-color 0.2s",
    }}>
      {/* Row header */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          cursor: "pointer",
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {item.day}
        </div>

        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: item.platform === "linkedin" ? "rgba(0,119,181,0.15)" : "rgba(225,48,108,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: platform.color, fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>
          {platform.icon}
        </div>

        <div style={{
          padding: "3px 8px", borderRadius: 6,
          background: type.bg, color: type.color,
          fontSize: 11, fontWeight: 600, flexShrink: 0,
        }}>
          {type.label}
        </div>

        <div style={{
          color: "rgba(255,255,255,0.75)", fontSize: 13,
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {item.hook}
        </div>

        {post && (
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#00e5a0", flexShrink: 0,
          }} />
        )}

        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 18px 16px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ paddingTop: 14, marginBottom: 10 }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 6 }}>Content Brief</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6 }}>{item.idea}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 6 }}>CTA: {item.cta}</div>
          </div>

          {post && (
            <div style={{
              background: "rgba(0,0,0,0.3)", borderRadius: 8,
              padding: 14, marginBottom: 10,
              color: "rgba(255,255,255,0.85)", fontSize: 13,
              lineHeight: 1.7, whiteSpace: "pre-wrap",
              fontFamily: "'DM Mono', monospace",
            }}>
              {post}
            </div>
          )}

          {loading && (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "8px 0" }}>
              Writing your post...
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={generate} disabled={loading} style={{
              padding: "7px 16px", borderRadius: 7, border: "none",
              background: "rgba(0,229,160,0.15)", color: "#00e5a0",
              cursor: "pointer", fontSize: 12, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {loading ? "Writing..." : post ? "Regenerate" : "Write Post"}
            </button>
            {post && (
              <button onClick={copy} style={{
                padding: "7px 16px", borderRadius: 7,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: copied ? "#00e5a0" : "rgba(255,255,255,0.4)",
                cursor: "pointer", fontSize: 12,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContentCalendar() {
  const [weekFilter, setWeekFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [generatingAll, setGeneratingAll] = useState(false);

  const totalPosts = CALENDAR.length;
  const linkedinPosts = CALENDAR.filter(i => i.platform === "linkedin").length;
  const instagramPosts = CALENDAR.filter(i => i.platform === "instagram").length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08080e",
      padding: "32px 24px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: "#00e5a0", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
          Content Engine
        </div>
        <h1 style={{ margin: 0, color: "#fff", fontSize: 26, fontWeight: 700 }}>
          30-Day Content Calendar
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 6 }}>
          LinkedIn + Instagram · Daily posts + stories/reels · Click any post to write it with AI
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total Posts", val: totalPosts, color: "#fff" },
          { label: "LinkedIn", val: linkedinPosts, color: "#0077b5" },
          { label: "Instagram", val: instagramPosts, color: "#e1306c" },
          { label: "Weeks", val: 4, color: "#a78bfa" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "12px 18px",
          }}>
            <div style={{ color, fontSize: 20, fontWeight: 700 }}>{val}</div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(CONTENT_TYPES).map(([key, { label, color, bg }]) => (
          <div key={key} style={{
            padding: "4px 10px", borderRadius: 6,
            background: bg, color, fontSize: 11, fontWeight: 600,
          }}>
            {label}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "1", "2", "3", "4"].map(w => (
            <button key={w} onClick={() => setWeekFilter(w)} style={{
              padding: "7px 14px", borderRadius: 7,
              border: weekFilter === w ? "1px solid rgba(0,229,160,0.5)" : "1px solid rgba(255,255,255,0.08)",
              background: weekFilter === w ? "rgba(0,229,160,0.1)" : "transparent",
              color: weekFilter === w ? "#00e5a0" : "rgba(255,255,255,0.4)",
              cursor: "pointer", fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {w === "all" ? "All Weeks" : `Week ${w}`}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "linkedin", "instagram"].map(p => (
            <button key={p} onClick={() => setPlatformFilter(p)} style={{
              padding: "7px 14px", borderRadius: 7,
              border: platformFilter === p ? "1px solid rgba(0,229,160,0.5)" : "1px solid rgba(255,255,255,0.08)",
              background: platformFilter === p ? "rgba(0,229,160,0.1)" : "transparent",
              color: platformFilter === p ? "#00e5a0" : "rgba(255,255,255,0.4)",
              cursor: "pointer", fontSize: 12, textTransform: "capitalize",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {p === "all" ? "All Platforms" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {CALENDAR.map((item, i) => (
        <PostCard
          key={i}
          item={item}
          weekFilter={weekFilter}
          platformFilter={platformFilter}
        />
      ))}
    </div>
  );
}
