import { useState, useCallback } from "react";
import Papa from "papaparse";

const PLATFORM_CONFIG = {
  email: {
    label: "Email",
    icon: "✉",
    maxLen: 300,
    tone: "professional, concise, consultant-to-peer. Include subject line. 3 short paragraphs max.",
  },
  linkedin: {
    label: "LinkedIn DM",
    icon: "in",
    maxLen: 200,
    tone: "warm, direct, peer-to-peer. No fluff. Under 150 words. No subject line.",
  },
  instagram: {
    label: "Instagram DM",
    icon: "ig",
    maxLen: 150,
    tone: "casual, conversational, curious. Under 80 words. Feel like a real person noticed something.",
  },
};

async function generateOutreach(prospect, platform) {
  const config = PLATFORM_CONFIG[platform];
  const angle = prospect.recommended_message_angle || "Full Tech Transformation";
  const gaps = [];
  if (parseFloat(prospect.web_presence_score) < 5) gaps.push("weak website");
  if (parseFloat(prospect.social_presence_score) < 5) gaps.push("low social presence");
  if (parseFloat(prospect.automation_gap_score) > 5) gaps.push("likely manual workflows");
  if ((prospect.email_domain || "").toLowerCase().includes("gmail")) gaps.push("non-branded email");

  const prompt = `You are a tech consultant reaching out to a small local business. Write a ${platform} outreach message.

Business: ${prospect.business_name}
City: ${prospect.city}
Identified gaps: ${gaps.join(", ") || "general tech improvements needed"}
Recommended angle: ${angle}
Your offer: Web design, workflow automation, and full tech consulting for local businesses in Southern California.
Goal: Get a 15-minute discovery call. Ask for their availability naturally.

Tone: ${config.tone}
Max length: ${config.maxLen} words

${platform === "email" ? "Start with: Subject: [subject line]\n\n" : ""}Write only the message. No preamble.`;

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
  return data.content?.[0]?.text || "Error generating message.";
}

// Normalize best_channel from CSV to a platform key
function resolveBestChannel(prospect) {
  const raw = (prospect.best_channel || "email").toLowerCase();
  if (raw.includes("instagram") || raw.includes("ig")) return "instagram";
  if (raw.includes("linkedin") || raw.includes("li")) return "linkedin";
  return "email";
}

function ProspectCard({ prospect, index }) {
  const bestChannel = resolveBestChannel(prospect);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState({});
  const [activeTab, setActiveTab] = useState(bestChannel);
  const [showOthers, setShowOthers] = useState(false);
  const [copied, setCopied] = useState(null);

  const generate = async (platform) => {
    setLoading((p) => ({ ...p, [platform]: true }));
    const msg = await generateOutreach(prospect, platform);
    setMessages((p) => ({ ...p, [platform]: msg }));
    setLoading((p) => ({ ...p, [platform]: false }));
  };

  const generateAll = async () => {
    for (const platform of ["email", "linkedin", "instagram"]) {
      setLoading((p) => ({ ...p, [platform]: true }));
      const msg = await generateOutreach(prospect, platform);
      setMessages((p) => ({ ...p, [platform]: msg }));
      setLoading((p) => ({ ...p, [platform]: false }));
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const fitScore = parseFloat(prospect.overall_fit_score) || 0;
  const fitColor = fitScore >= 7 ? "#00e5a0" : fitScore >= 4 ? "#f5c518" : "#ff5a5a";
  
  // Tabs: always show best channel first, others behind toggle
  const orderedTabs = [bestChannel, ...["email", "linkedin", "instagram"].filter(p => p !== bestChannel)];

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 16,
      padding: "24px",
      marginBottom: 20,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>#{index + 1}</span>
            <h3 style={{ margin: 0, color: "#fff", fontSize: 17, fontWeight: 600 }}>
              {prospect.business_name}
            </h3>
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>
            {prospect.city} · {prospect.email_domain}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: fitColor, fontSize: 22, fontWeight: 700 }}>{fitScore.toFixed(1)}</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>fit score</div>
        </div>
      </div>

      {/* Scores */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "Web", val: prospect.web_presence_score },
          { label: "Social", val: prospect.social_presence_score },
          { label: "Automation Gap", val: prospect.automation_gap_score },
        ].map(({ label, val }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 8,
            padding: "5px 12px",
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
          }}>
            {label}: <span style={{ color: "#fff", fontWeight: 600 }}>{parseFloat(val || 0).toFixed(1)}</span>
          </div>
        ))}
        <div style={{
          background: "rgba(0,229,160,0.1)",
          border: "1px solid rgba(0,229,160,0.3)",
          borderRadius: 8,
          padding: "5px 12px",
          fontSize: 12,
          color: "#00e5a0",
        }}>
          {prospect.recommended_message_angle || "Tech Transformation"}
        </div>
        <div style={{
          background: "rgba(245,197,24,0.1)",
          border: "1px solid rgba(245,197,24,0.3)",
          borderRadius: 8,
          padding: "5px 12px",
          fontSize: 12,
          color: "#f5c518",
        }}>
          ⚡ Best: {PLATFORM_CONFIG[bestChannel].label}
          {bestChannel === "linkedin" && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginLeft: 4 }}>(verify manually)</span>}
        </div>
      </div>

      {/* Platform Tabs — best channel first, others behind toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        {(showOthers ? orderedTabs : [bestChannel]).map((key) => {
          const cfg = PLATFORM_CONFIG[key];
          const isRecommended = key === bestChannel;
          return (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: activeTab === key ? "1px solid rgba(0,229,160,0.6)" : isRecommended ? "1px solid rgba(245,197,24,0.4)" : "1px solid rgba(255,255,255,0.1)",
              background: activeTab === key ? "rgba(0,229,160,0.12)" : "transparent",
              color: activeTab === key ? "#00e5a0" : isRecommended ? "#f5c518" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {cfg.icon} {cfg.label}{isRecommended ? " ★" : ""}
            </button>
          );
        })}
        <button onClick={() => setShowOthers(v => !v)} style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent",
          color: "rgba(255,255,255,0.3)",
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {showOthers ? "Hide others" : "+ Other channels"}
        </button>
      </div>

      {/* Message Area */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        borderRadius: 10,
        padding: 16,
        minHeight: 100,
        marginBottom: 12,
        fontSize: 14,
        lineHeight: 1.7,
        color: messages[activeTab] ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)",
        whiteSpace: "pre-wrap",
        fontFamily: messages[activeTab] ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
      }}>
        {loading[activeTab]
          ? "Generating..."
          : messages[activeTab] || "Click Generate to create a personalized message."}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => generate(activeTab)} disabled={loading[activeTab]} style={{
          padding: "8px 18px",
          borderRadius: 8,
          border: "none",
          background: "rgba(0,229,160,0.15)",
          color: "#00e5a0",
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
        }}>
          {loading[activeTab] ? "Generating..." : `Generate ${PLATFORM_CONFIG[activeTab].label}${activeTab === bestChannel ? " ★" : ""}`}
        </button>
        <button onClick={generateAll} style={{
          padding: "8px 18px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "transparent",
          color: "rgba(255,255,255,0.5)",
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Generate All 3
        </button>
        {messages[activeTab] && (
          <button onClick={() => copy(messages[activeTab], activeTab)} style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: copied === activeTab ? "#00e5a0" : "rgba(255,255,255,0.5)",
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {copied === activeTab ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function OutreachAgent() {
  const [prospects, setProspects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => setProspects(results.data),
    });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const filtered = prospects.filter((p) => {
    const score = parseFloat(p.overall_fit_score) || 0;
    const matchFilter = filter === "all" || (filter === "hot" && score >= 7) || (filter === "warm" && score >= 4 && score < 7) || (filter === "cold" && score < 4);
    const matchSearch = !search || (p.business_name || "").toLowerCase().includes(search.toLowerCase()) || (p.city || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      padding: "32px 24px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: "#00e5a0", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
          AI Outreach Agent
        </div>
        <h1 style={{ margin: 0, color: "#fff", fontSize: 28, fontWeight: 700 }}>
          Prospect Outreach Generator
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 6 }}>
          Upload your scraped CSV → Review prospects → Generate personalized pitches
        </p>
      </div>

      {/* Upload */}
      {prospects.length === 0 ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          style={{
            border: `2px dashed ${dragging ? "#00e5a0" : "rgba(255,255,255,0.15)"}`,
            borderRadius: 16,
            padding: "60px 32px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            background: dragging ? "rgba(0,229,160,0.05)" : "transparent",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Drop your prospects CSV here
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 20 }}>
            Generated by the Scraper Agent
          </div>
          <label style={{
            padding: "10px 24px",
            background: "rgba(0,229,160,0.15)",
            border: "1px solid rgba(0,229,160,0.4)",
            borderRadius: 8,
            color: "#00e5a0",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}>
            Browse File
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          </label>

          {/* Demo button */}
          <div style={{ marginTop: 20 }}>
            <button onClick={() => setProspects([
              { business_name: "Martinez & Associates Law", city: "Downey", email_domain: "gmail.com", phone: "310-555-0123", website: "martinez-law.com", web_presence_score: "3.2", social_presence_score: "2.0", automation_gap_score: "8.5", overall_fit_score: "7.8", recommended_message_angle: "Automation & Workflow Efficiency", best_channel: "email" },
              { business_name: "Hawthorne Legal Group", city: "Hawthorne", email_domain: "hawthornelaw.com", phone: "310-555-0456", website: "hawthornelaw.com", web_presence_score: "5.0", social_presence_score: "3.5", automation_gap_score: "6.0", overall_fit_score: "5.8", recommended_message_angle: "Social Media & Online Visibility", best_channel: "instagram" },
              { business_name: "Reyes Family Law", city: "Lynwood", email_domain: "gmail.com", phone: "310-555-0789", website: "none", web_presence_score: "1.0", social_presence_score: "1.0", automation_gap_score: "9.0", overall_fit_score: "8.5", recommended_message_angle: "Website & Digital Presence", best_channel: "linkedin" },
            ])} style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 13,
              padding: "8px 16px",
              borderRadius: 8,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Load Demo Data
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Total", val: prospects.length, color: "#fff" },
              { label: "Hot (7+)", val: prospects.filter(p => parseFloat(p.overall_fit_score) >= 7).length, color: "#00e5a0" },
              { label: "Warm (4-7)", val: prospects.filter(p => { const s = parseFloat(p.overall_fit_score); return s >= 4 && s < 7; }).length, color: "#f5c518" },
              { label: "Cold (<4)", val: prospects.filter(p => parseFloat(p.overall_fit_score) < 4).length, color: "#ff5a5a" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "12px 20px",
              }}>
                <div style={{ color, fontSize: 22, fontWeight: 700 }}>{val}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{label}</div>
              </div>
            ))}
            <button onClick={() => setProspects([])} style={{
              marginLeft: "auto",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 13,
              padding: "8px 16px",
              borderRadius: 8,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Upload New CSV
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <input
              placeholder="Search by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: 200,
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff",
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                outline: "none",
              }}
            />
            {["all", "hot", "warm", "cold"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: filter === f ? "1px solid rgba(0,229,160,0.5)" : "1px solid rgba(255,255,255,0.1)",
                background: filter === f ? "rgba(0,229,160,0.1)" : "transparent",
                color: filter === f ? "#00e5a0" : "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                textTransform: "capitalize",
              }}>
                {f}
              </button>
            ))}
          </div>

          {/* Prospect Cards */}
          {filtered.map((prospect, i) => (
            <ProspectCard key={i} prospect={prospect} index={i} />
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 40 }}>
              No prospects match your filter.
            </div>
          )}
        </>
      )}
    </div>
  );
}
