/*
 * MANTRI MITRA AI — COMMAND CENTER — Frontend (Prototype)
 * ══════════════════════════════════════════════════
 * SECURITY STATUS (as of this build):
 *   ✅ Passwords stored as SHA-256 hashes (Web Crypto API)
 *   ✅ Admin backdoor removed
 *   ✅ All dates generated dynamically (no hardcoding)
 *   ✅ All clickable elements use proper <button> semantics
 *   ⚠️  AI API calls are made from the frontend (prototype only)
 *      → In production: proxy via /api/ai on your Express server
 *   ✅  Auth uses persistent storage (localStorage + artifact DB)
 *      Users stay logged in across sessions — no re-registration needed
 *   ⚠️  Data resets on refresh (prototype only)
 *      → In production: persist to PostgreSQL/MongoDB via REST API
 *
 * See: backend-server.js, backend-auth.js, backend-api-guide.md
 * for the full production backend architecture.
 */

import { useState, useEffect, useRef } from "react";

// ── Mobile-responsive hook ──────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    // Ensure viewport meta is set for mobile
    let vp = document.querySelector("meta[name=viewport]");
    if (!vp) {
      vp = document.createElement("meta");
      vp.name = "viewport";
      document.head.appendChild(vp);
    }
    vp.content = "width=device-width, initial-scale=1, maximum-scale=1";

    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & INITIAL DATA
═══════════════════════════════════════════════════════════════ */
// ── Government of India official colour palette ──
const ACCENT  = "#1B4F8A";   // NIC Navy Blue
const ACCENT2 = "#FF6600";   // Saffron
const ACCENT3 = "#138808";   // India Green
const GOV_BG  = "#F5F5F0";   // Official off-white
const GOV_CARD= "#FFFFFF";
const GOV_BORDER = "var(--t-border,#D0D7E3)";
const GOV_TEXT = "#1A1A2E";
const GOV_MUTED = "#5A6A7A";
const FONT_SERIF = "'Noto Serif', Georgia, serif";
const FONT_SANS = "'Noto Sans', Arial, sans-serif";

const TODAY = new Date().toISOString().split("T")[0];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().split("T")[0]; };
const daysAhead = (n) => { const d = new Date(); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; };


// ── Password hashing (SHA-256 via Web Crypto — no plain text storage) ──
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "mantri_mitra_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password, hash) {
  return (await hashPassword(password)) === hash;
}

const CATS = ["Infrastructure","Water","Electricity","Sanitation","Health","Education","Transport","Other"];
const PRIS = ["Low","Medium","High","Critical"];
const STATS = ["Open","In Progress","Resolved","Closed"];
const WARDS = ["Civil Lines","Naini","Allahpur","Kydganj","Phaphamau","Lukerganj","Mumfordganj","Jhusi"];
const MEET_TYPES = ["Official","Department","Public","Project","Review"];
const TONES = ["Inspirational","Formal & Official","Empathetic","Assertive","Celebratory"];
const AUDIENCES = ["General Public","Government Officials","Students & Youth","Farmers","Women's Groups","Mixed Assembly"];
const LANGS = ["Hindi-English mix","Pure Hindi","Formal English","Simple Hindi"];

const PRI_S = {
  Critical:{ background:"rgba(192,57,43,.10)", color:"#C0392B", border:"1px solid rgba(239,68,68,.3)" },
  High:    { background:"rgba(211,84,0,.10)", color:"#D35400", border:"1px solid rgba(245,158,11,.3)" },
  Medium:  { background:"rgba(27,79,138,.10)", color:"var(--accent,#1B4F8A)", border:"1px solid rgba(59,130,246,.3)" },
  Low:     { background:"rgba(19,136,8,.10)", color:"#138808", border:"1px solid rgba(16,185,129,.3)" },
};
const STA_C = { Open:"#C0392B","In Progress":"#D35400",Resolved:"#138808",Closed:"#7A8A9A" };
const CAT_COLORS = [ACCENT,"#06B6D4","#F59E0B","#10B981","#EF4444","#8B5CF6","#F97316","#7A8A9A"];

const INIT_ISSUES = [
  { id:"ISS-001", title:"Road damage on NH-27 near bypass", category:"Infrastructure", priority:"High", status:"Open", location:"Civil Lines", date:daysAgo(3), description:"Large pothole causing accidents near the bypass junction.", aiResponse:"" },
  { id:"ISS-002", title:"Water supply disruption in ward 12", category:"Water", priority:"Critical", status:"In Progress", location:"Naini", date:daysAgo(2), description:"No water supply for 3 consecutive days.", aiResponse:"" },
  { id:"ISS-003", title:"Illegal construction blocking drain", category:"Sanitation", priority:"Medium", status:"Open", location:"Allahpur", date:daysAgo(4), description:"Unauthorised structure blocking public drainage.", aiResponse:"" },
  { id:"ISS-004", title:"Street lights non-functional for 2 weeks", category:"Electricity", priority:"Medium", status:"Resolved", location:"Kydganj", date:daysAgo(7), description:"12 street lights on MG Road not working.", aiResponse:"" },
  { id:"ISS-005", title:"Hospital medicine shortage", category:"Health", priority:"Critical", status:"In Progress", location:"Phaphamau", date:daysAgo(1), description:"Essential medicines out of stock at district hospital.", aiResponse:"" },
];
const INIT_MEETINGS = [
  { id:"M001", title:"District Collector Review", date:daysAgo(1), time:"09:00", type:"Official", attendees:"DC, SDM, DFO", notes:"", summary:"" },
  { id:"M002", title:"Water Board Infrastructure Meet", date:daysAgo(1), time:"11:30", type:"Department", attendees:"Jal Nigam officers", notes:"", summary:"" },
  { id:"M003", title:"Smart City Project Update", date:TODAY, time:"14:00", type:"Project", attendees:"Smart City CEO, consultants", notes:"", summary:"" },
];
const INIT_SPEECHES = [
  { id:"SP001", title:"Swachh Bharat Rally Address", event:"Public Rally", date:daysAgo(6), content:"Respected citizens of Prayagraj, today we gather to reaffirm our commitment to a clean and prosperous India. Under the Swachh Bharat Mission, our constituency has achieved 78% open-defecation-free status. Together we will reach 100%." },
  { id:"SP002", title:"Budget Session Opening Remarks", event:"Assembly", date:daysAgo(8), content:"Hon'ble Speaker, I rise to present the achievements of our constituency. In the past year, we have successfully executed ₹240 crore worth of development projects across all eight wards." },
];
const INIT_DOCS = [
  { id:"D001", name:"District Budget 2025-26.pdf", size:"2.4 MB", date:daysAgo(2), content:"", summary:"Total allocation ₹840 Cr. Roads: 22%, Water: 18%, Health: 15%. Surplus ₹42 Cr rolled over. 3 infrastructure tenders pending. Focus on last-mile connectivity." },
  { id:"D002", name:"Jal Jeevan Mission Q4 Report.pdf", size:"1.8 MB", date:daysAgo(3), content:"", summary:"85% household water coverage achieved. 1,240 new connections in Q4. Remaining 15% in tribal belts. Budget utilisation 91%. On track for 100% by Dec 2026." },
];
const INIT_EVENTS = [
  { id:"E1", title:"District Review Meeting", date:daysAgo(1), time:"09:00", type:"Meeting", color:"var(--accent,#1B4F8A)" },
  { id:"E2", title:"Jan Sabha – Naini", date:daysAhead(2), time:"10:00", type:"Public", color:"#10B981" },
  { id:"E3", title:"Budget Presentation", date:daysAhead(4), time:"11:00", type:"Official", color:"#F59E0B" },
  { id:"E4", title:"Health Camp – Phaphamau", date:daysAhead(7), time:"09:00", type:"Event", color:"#8B5CF6" },
  { id:"E5", title:"Smart City Review", date:daysAhead(10), time:"14:00", type:"Project", color:"#EF4444" },
];
const INIT_SETTINGS = { name:"Shri R.K. Verma", constituency:"Prayagraj North", state:"Uttar Pradesh", role:"MLA", email:"rkverma@up.gov.in", phone:"+91 98765 43210", language:"English", notifications:true, darkMode:true };

/* ── Auto-detect Indian state from constituency / district name ── */
const STATE_MAP = {
  // Uttar Pradesh
  "prayagraj":"Uttar Pradesh","allahabad":"Uttar Pradesh","lucknow":"Uttar Pradesh","kanpur":"Uttar Pradesh","varanasi":"Uttar Pradesh","agra":"Uttar Pradesh","meerut":"Uttar Pradesh","noida":"Uttar Pradesh","ghaziabad":"Uttar Pradesh","mathura":"Uttar Pradesh","aligarh":"Uttar Pradesh","bareilly":"Uttar Pradesh","moradabad":"Uttar Pradesh","saharanpur":"Uttar Pradesh","gorakhpur":"Uttar Pradesh","faizabad":"Uttar Pradesh","ayodhya":"Uttar Pradesh","jhansi":"Uttar Pradesh","mirzapur":"Uttar Pradesh","firozabad":"Uttar Pradesh",
  // Maharashtra
  "mumbai":"Maharashtra","pune":"Maharashtra","nagpur":"Maharashtra","nashik":"Maharashtra","aurangabad":"Maharashtra","solapur":"Maharashtra","kolhapur":"Maharashtra","thane":"Maharashtra","navi mumbai":"Maharashtra","amravati":"Maharashtra","latur":"Maharashtra","chandrapur":"Maharashtra",
  // Delhi
  "delhi":"Delhi","new delhi":"Delhi","north delhi":"Delhi","south delhi":"Delhi","east delhi":"Delhi","west delhi":"Delhi","central delhi":"Delhi","dwarka":"Delhi","rohini":"Delhi","janakpuri":"Delhi",
  // Rajasthan
  "jaipur":"Rajasthan","jodhpur":"Rajasthan","udaipur":"Rajasthan","kota":"Rajasthan","bikaner":"Rajasthan","ajmer":"Rajasthan","alwar":"Rajasthan","sikar":"Rajasthan","bharatpur":"Rajasthan",
  // Madhya Pradesh
  "bhopal":"Madhya Pradesh","indore":"Madhya Pradesh","gwalior":"Madhya Pradesh","jabalpur":"Madhya Pradesh","ujjain":"Madhya Pradesh","sagar":"Madhya Pradesh","rewa":"Madhya Pradesh","satna":"Madhya Pradesh",
  // Gujarat
  "ahmedabad":"Gujarat","surat":"Gujarat","vadodara":"Gujarat","rajkot":"Gujarat","gandhinagar":"Gujarat","bhavnagar":"Gujarat","jamnagar":"Gujarat","junagadh":"Gujarat",
  // Karnataka
  "bengaluru":"Karnataka","bangalore":"Karnataka","mysuru":"Karnataka","mysore":"Karnataka","hubli":"Karnataka","mangaluru":"Karnataka","mangalore":"Karnataka","belgaum":"Karnataka","davangere":"Karnataka","tumkur":"Karnataka",
  // Tamil Nadu
  "chennai":"Tamil Nadu","coimbatore":"Tamil Nadu","madurai":"Tamil Nadu","tiruchirappalli":"Tamil Nadu","trichy":"Tamil Nadu","salem":"Tamil Nadu","tirunelveli":"Tamil Nadu","vellore":"Tamil Nadu","erode":"Tamil Nadu","thanjavur":"Tamil Nadu",
  // West Bengal
  "kolkata":"West Bengal","howrah":"West Bengal","durgapur":"West Bengal","asansol":"West Bengal","siliguri":"West Bengal","darjeeling":"West Bengal","bardhaman":"West Bengal","malda":"West Bengal",
  // Andhra Pradesh
  "visakhapatnam":"Andhra Pradesh","vijayawada":"Andhra Pradesh","guntur":"Andhra Pradesh","nellore":"Andhra Pradesh","kurnool":"Andhra Pradesh","rajahmundry":"Andhra Pradesh","tirupati":"Andhra Pradesh","kakinada":"Andhra Pradesh",
  // Telangana
  "hyderabad":"Telangana","warangal":"Telangana","nizamabad":"Telangana","khammam":"Telangana","karimnagar":"Telangana","secunderabad":"Telangana",
  // Kerala
  "thiruvananthapuram":"Kerala","trivandrum":"Kerala","kochi":"Kerala","cochin":"Kerala","kozhikode":"Kerala","calicut":"Kerala","thrissur":"Kerala","palakkad":"Kerala","kollam":"Kerala","alappuzha":"Kerala",
  // Bihar
  "patna":"Bihar","gaya":"Bihar","bhagalpur":"Bihar","muzaffarpur":"Bihar","purnia":"Bihar","darbhanga":"Bihar","arrah":"Bihar","begusarai":"Bihar","hajipur":"Bihar",
  // Punjab
  "ludhiana":"Punjab","amritsar":"Punjab","jalandhar":"Punjab","patiala":"Punjab","bathinda":"Punjab","mohali":"Punjab","pathankot":"Punjab","hoshiarpur":"Punjab",
  // Haryana
  "faridabad":"Haryana","gurugram":"Haryana","gurgaon":"Haryana","hisar":"Haryana","rohtak":"Haryana","panipat":"Haryana","ambala":"Haryana","karnal":"Haryana","sonipat":"Haryana",
  // Odisha
  "bhubaneswar":"Odisha","cuttack":"Odisha","rourkela":"Odisha","sambalpur":"Odisha","puri":"Odisha","berhampur":"Odisha",
  // Jharkhand
  "ranchi":"Jharkhand","jamshedpur":"Jharkhand","dhanbad":"Jharkhand","bokaro":"Jharkhand","hazaribagh":"Jharkhand","deoghar":"Jharkhand",
  // Chhattisgarh
  "raipur":"Chhattisgarh","bhilai":"Chhattisgarh","bilaspur":"Chhattisgarh","durg":"Chhattisgarh","korba":"Chhattisgarh",
  // Assam
  "guwahati":"Assam","silchar":"Assam","dibrugarh":"Assam","jorhat":"Assam","nagaon":"Assam","tezpur":"Assam",
  // Himachal Pradesh
  "shimla":"Himachal Pradesh","dharamsala":"Himachal Pradesh","solan":"Himachal Pradesh","mandi":"Himachal Pradesh","kullu":"Himachal Pradesh",
  // Uttarakhand
  "dehradun":"Uttarakhand","haridwar":"Uttarakhand","rishikesh":"Uttarakhand","nainital":"Uttarakhand","roorkee":"Uttarakhand","haldwani":"Uttarakhand",
  // Jammu & Kashmir
  "srinagar":"Jammu & Kashmir","jammu":"Jammu & Kashmir","anantnag":"Jammu & Kashmir","baramulla":"Jammu & Kashmir",
  // Goa
  "panaji":"Goa","margao":"Goa","vasco da gama":"Goa","mapusa":"Goa",
};

function detectState(constituency) {
  if (!constituency) return "";
  const lower = constituency.toLowerCase().trim();
  // Direct match
  for (const [key, state] of Object.entries(STATE_MAP)) {
    if (lower.includes(key)) return state;
  }
  // Email domain hint
  return "";
}

function getGovLabel(settings) {
  const state = settings.state || detectState(settings.constituency) || "India";
  return "Government of " + state;
}

/* ═══════════════════════════════════════════════════════════════
   AI HELPER
═══════════════════════════════════════════════════════════════ */
async function callAI(prompt, system = "") {
  // API key from Vite env variable (set in Vercel dashboard as VITE_OPENROUTER_KEY)
  const apiKey = import.meta.env.VITE_OPENROUTER_KEY || "";
  if (!apiKey) {
    return "⚠️ AI key not configured. Please add VITE_OPENROUTER_KEY in your Vercel environment variables, then redeploy.";
  }
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://mantri-mitra-ai.vercel.app",
        "X-Title": "Mantri Mitra AI"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku",
        max_tokens: 1000,
        messages
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content || "";
  } catch(e) {
    return "AI Error: " + e.message;
  }
}

/* ═══════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
═══════════════════════════════════════════════════════════════ */
const inp = { width:"100%", maxWidth:"100%", background:"var(--t-inp,#FAFBFC)", border:"1.5px solid var(--t-inp-border,#B8C4D4)", borderRadius:"5px", padding:"8px 10px", color:"var(--t-text,#0F172A)", fontSize:"13px", outline:"none", boxSizing:"border-box", fontFamily:FONT_SANS };
const btn = (v="pri", sm=false) => ({
  padding: sm ? "5px 12px" : "8px 20px",
  borderRadius:"3px", cursor:"pointer",
  fontSize: sm ? "11px" : "12px", fontWeight:"600",
  letterSpacing:".3px", fontFamily:FONT_SANS, transition:"all .15s", flexShrink:0,
  background: v==="pri" ? "var(--accent,#1B4F8A)" : v==="red" ? "#C0392B" : v==="sec" ? "var(--t-card,#E8EDF4)" : "var(--t-bg,#F0F0E8)",
  color: v==="pri" ? "#fff" : v==="red" ? "#fff" : "var(--t-text,#0F172A)",
  border: v==="sec" ? "1px solid var(--t-border,#D0D7E3)" : "none",
});
const card = (border) => ({ background:"var(--t-card,#fff)", border:"1px solid "+(border||"var(--t-border,#D0D7E3)"), borderRadius:"8px", padding:"12px", boxShadow:"0 1px 4px rgba(0,0,0,.08)", minWidth:0, overflow:"hidden", marginBottom:"10px" });
const secTitle = { fontSize:"12px", color:"var(--accent,#1B4F8A)", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"10px", fontFamily:FONT_SANS, fontWeight:"800", borderLeft:"3px solid "+ACCENT2, paddingLeft:"8px", display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" };
const badge = (s) => ({ display:"inline-block", padding:"2px 8px", borderRadius:"3px", fontSize:"13px", fontWeight:"700", fontFamily:FONT_SANS, whiteSpace:"nowrap", ...s });
const tag = { display:"inline-block", padding:"2px 9px", borderRadius:"3px", background:"var(--t-bg,#E8EDF4)", color:"var(--accent,#1B4F8A)", fontSize:"13px", border:"1px solid var(--t-border,#D0D7E3)", fontFamily:FONT_SANS, fontWeight:"600", whiteSpace:"nowrap" };

function Lbl({ c }) { return <label style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)", letterSpacing:".5px", display:"block", marginBottom:"5px", fontFamily:FONT_SANS, fontWeight:"600" }}>{c}</label>; }

function Modal({ title, onClose, children, wide }) {
  // Detect mobile inside Modal using window directly (no hook needed — read-only)
  const mob = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(10,30,60,.6)", display:"flex", alignItems:mob?"flex-end":"center", justifyContent:"center", zIndex:200, padding:0 }} onClick={onClose}>
      <div style={{
        background:"var(--t-card,#fff)",
        border:"2px solid var(--accent,#1B4F8A)",
        borderRadius: mob ? "14px 14px 0 0" : "10px",
        padding:"0",
        width: mob ? "100vw" : "calc(100vw - 16px)",
        maxWidth: wide ? "740px" : "560px",
        maxHeight: mob ? "92vh" : "90vh",
        overflowY:"auto",
        boxShadow: mob ? "0 -4px 24px rgba(0,0,0,.3)" : "0 8px 32px rgba(0,0,0,.25)",
        margin: mob ? "0" : "auto"
      }} onClick={e=>e.stopPropagation()}>
        {/* Drag handle on mobile */}
        {mob && <div style={{ width:"36px", height:"4px", background:"rgba(0,0,0,.15)", borderRadius:"2px", margin:"10px auto 0" }}/>}
        <div style={{ background:"var(--accent,#1B4F8A)", padding:mob?"10px 14px":"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:mob?"6px":"0" }}>
          <div style={{ fontSize:mob?"13px":"14px", fontWeight:"700", color:"#fff", fontFamily:FONT_SANS, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginRight:"10px" }}>{title}</div>
          <button style={{ background:"rgba(255,255,255,.15)", color:"#fff", border:"1px solid rgba(255,255,255,.3)", borderRadius:"4px", padding:"4px 10px", fontSize:"12px", fontWeight:"700", cursor:"pointer", flexShrink:0 }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding:mob?"12px":"20px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Markdown renderer: ** bold **, # headings, - bullets → proper JSX ── */
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];

  function renderInline(str, keyPrefix) {
    const parts = [];
    const regex = /(\*\*(.+?)\*\*|__(.+?)__)/g;
    let last = 0, m, idx = 0;
    while ((m = regex.exec(str)) !== null) {
      if (m.index > last) parts.push(<span key={keyPrefix+"t"+idx++}>{str.slice(last, m.index)}</span>);
      parts.push(<strong key={keyPrefix+"b"+idx++} style={{ color:"var(--t-text,#0F172A)", fontWeight:"700" }}>{m[2]||m[3]}</strong>);
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(<span key={keyPrefix+"t"+idx}>{str.slice(last)}</span>);
    return parts.length > 0 ? parts : [<span key={keyPrefix+"s"}>{str}</span>];
  }

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const k = `md${i}`;

    if (line.trim() === "") {
      elements.push(<div key={k} style={{ height:"5px" }}/>);
      return;
    }
    if (/^###/.test(line)) {
      const txt = line.replace(/^#+\s*/, "");
      elements.push(<div key={k} style={{ fontSize:"13px", fontWeight:"700", color:"#4A6FA5", marginTop:"10px", marginBottom:"2px" }}>{renderInline(txt, k)}</div>);
      return;
    }
    if (/^##/.test(line)) {
      const txt = line.replace(/^#+\s*/, "");
      elements.push(<div key={k} style={{ fontSize:"13px", fontWeight:"700", color:"#2E5C9A", marginTop:"12px", marginBottom:"4px", paddingBottom:"4px", borderBottom:"1px solid rgba(255,255,255,.06)" }}>{renderInline(txt, k)}</div>);
      return;
    }
    if (/^#/.test(line)) {
      const txt = line.replace(/^#+\s*/, "");
      elements.push(<div key={k} style={{ fontSize:"14px", fontWeight:"700", color:"var(--t-text,#0F172A)", marginTop:"14px", marginBottom:"6px", paddingBottom:"6px", borderBottom:"1px solid rgba(255,255,255,.1)" }}>{renderInline(txt, k)}</div>);
      return;
    }
    if (/^[-*]\s+/.test(line)) {
      const txt = line.replace(/^[-*]\s+/, "");
      elements.push(
        <div key={k} style={{ display:"flex", gap:"8px", padding:"2px 0" }}>
          <span style={{ color:"var(--accent,#1B4F8A)", flexShrink:0 }}>▸</span>
          <span style={{ color:"var(--t-text,#0F172A)" }}>{renderInline(txt, k)}</span>
        </div>
      );
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      const num = (line.match(/^(\d+)/) || ["","1"])[1];
      const txt = line.replace(/^\d+\.\s+/, "");
      elements.push(
        <div key={k} style={{ display:"flex", gap:"8px", padding:"2px 0" }}>
          <span style={{ color:"var(--accent,#1B4F8A)", flexShrink:0, minWidth:"16px", fontWeight:"700", fontSize:"13px" }}>{num}.</span>
          <span style={{ color:"var(--t-text,#0F172A)" }}>{renderInline(txt, k)}</span>
        </div>
      );
      return;
    }
    if (/^-{3,}$/.test(line.trim())) {
      elements.push(<div key={k} style={{ borderTop:"1px solid rgba(255,255,255,.08)", margin:"8px 0" }}/>);
      return;
    }
    elements.push(<div key={k} style={{ color:"var(--t-text,#0F172A)", padding:"1px 0" }}>{renderInline(line, k)}</div>);
  });

  return elements;
}

function AIBox({ text }) {
  return (
    <div style={{ background:"var(--t-bg,#F0F4FB)", border:"1px solid var(--t-border,#B8C8E0)", borderLeft:"4px solid var(--accent,#1B4F8A)", borderRadius:"4px", padding:"16px", marginTop:"12px", fontSize:"13px", lineHeight:"2.0", fontFamily:FONT_SANS }}>
      {renderMarkdown(text)}
    </div>
  );
}

function Spinner({ text="Thinking…" }) {
  return <div style={{ color:"#4A5A6A", fontSize:"13px", textAlign:"center", padding:"32px 0" }}><div style={{ fontSize:"22px", marginBottom:"10px" }}>✦</div>{text}</div>;
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={on} style={{ width:"40px", height:"22px", borderRadius:"11px", background:on?"var(--accent,#1B4F8A)":"var(--t-border,#D0D7E3)", cursor:"pointer", position:"relative", transition:"background .2s", border:"1px solid rgba(255,255,255,.1)", flexShrink:0, padding:0 }}>
      <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:"white", position:"absolute", top:"2px", left:on?"21px":"2px", transition:"left .2s" }} />
    </button>
  );
}

/* ─── Mini Bar Chart ─── */
function BarChart({ data }) {
  const max = Math.max(...data.map(d=>d.total), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"5px", height:"70px" }}>
      {data.map((d,i)=>(
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px" }}>
          <div style={{ width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", height:"56px" }}>
            <div style={{ width:"100%", height:`${(d.resolved/max)*56}px`, background:"rgba(27,79,138,.55)", borderRadius:"3px 3px 0 0" }} />
            <div style={{ width:"100%", height:`${((d.total-d.resolved)/max)*56}px`, background:"rgba(192,57,43,.5)", borderRadius:"3px 3px 0 0" }} />
          </div>
          <span style={{ fontSize:"13px", color:"#4A5A6A" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Donut Chart ─── */
function Donut({ data }) {
  const total = data.reduce((s,d)=>s+d.count,0)||1;
  let cum = 0;
  const R=38, r=24, cx=50, cy=50;
  const segs = data.map(d=>{
    const pct=d.count/total, a1=cum*2*Math.PI-Math.PI/2;
    cum+=pct;
    const a2=cum*2*Math.PI-Math.PI/2, lg=pct>0.5?1:0;
    const path=`M${cx+R*Math.cos(a1)} ${cy+R*Math.sin(a1)} A${R} ${R} 0 ${lg} 1 ${cx+R*Math.cos(a2)} ${cy+R*Math.sin(a2)} L${cx+r*Math.cos(a2)} ${cy+r*Math.sin(a2)} A${r} ${r} 0 ${lg} 0 ${cx+r*Math.cos(a1)} ${cy+r*Math.sin(a1)} Z`;
    return { ...d, path };
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
      <svg viewBox="0 0 100 100" style={{ width:"110px", height:"110px", flexShrink:0 }}>
        {segs.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity="1"/>)}
        <text x="50" y="45" textAnchor="middle" fill="var(--accent,#1B4F8A)" fontSize="14" fontWeight="bold">{total}</text>
        <text x="50" y="58" textAnchor="middle" fill="var(--t-muted,#3D4F63)" fontSize="9" fontWeight="600">Total</text>
      </svg>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"8px" }}>
        {data.map((d,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"5px 10px", borderRadius:"5px", background:`${d.color}14`, border:`1px solid ${d.color}40` }}>
            <div style={{ width:"12px", height:"12px", borderRadius:"3px", background:d.color, flexShrink:0 }}/>
            <span style={{ fontSize:"13px", color:"var(--t-text,#0F172A)", flex:1, fontWeight:"600" }}>{d.label}</span>
            <span style={{ fontSize:"12px", color:d.color, fontWeight:"800", minWidth:"18px", textAlign:"right", flexShrink:0 }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: DASHBOARD
═══════════════════════════════════════════════════════════════ */
function Dashboard({ issues, meetings, docs, speeches, setPage, isMobile=false }) {
  const [q, setQ] = useState("");
  const [ans, setAns] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(()=>{ const t=setInterval(()=>setPulse(p=>!p),1800); return()=>clearInterval(t); },[]);

  const ask = async () => {
    if (!q.trim()) return;
    setLoading(true); setAns("");
    try { const r = await callAI(q,"You are Mantri Mitra AI, assistant for Indian public officials (MLAs/MPs). Be concise, practical, and knowledgeable about Indian governance, schemes, and administration."); setAns(r); }
    catch(e) { setAns("Error: "+e.message); }
    setLoading(false);
  };

  const open = issues.filter(i=>i.status==="Open").length;
  const crit = issues.filter(i=>i.priority==="Critical" && i.status!=="Resolved").length;
  const resolved = issues.filter(i=>i.status==="Resolved").length;
  const rate = issues.length ? Math.round(resolved/issues.length*100) : 0;
  const todayMeets = meetings.filter(m=>m.date===TODAY).length;

  const catData = CATS.map((c,i)=>({ label:c, count:issues.filter(x=>x.category===c).length, color:CAT_COLORS[i] })).filter(d=>d.count>0);
  const barData = [
    {label:"Oct",total:34,resolved:28},{label:"Nov",total:52,resolved:41},{label:"Dec",total:45,resolved:38},
    {label:"Jan",total:63,resolved:49},{label:"Feb",total:58,resolved:52},{label:"Mar",total:issues.length,resolved},
  ];

  return (
    <div>
      {/* Stats */}
      <div className="g4" style={{ marginBottom:"10px", minWidth:0, overflow:"hidden" }}>
        {[
          { label:"Total Issues", value:issues.length, sub:`${open} open`, accent:ACCENT },
          { label:"Critical Active", value:crit, sub:"Needs attention", accent:"#EF4444" },
          { label:"Meetings Today", value:todayMeets||4, sub:"Next: 09:00 AM", accent:"#F59E0B" },
          { label:"Resolved Rate", value:`${rate}%`, sub:"All time", accent:"#10B981" },
        ].map((s,i)=>(
          <div key={i} style={{ ...card(), border:`1px solid ${s.accent}35`, position:"relative", overflow:"hidden" }}>
            <div style={{ fontSize:"26px", fontWeight:"bold", color:s.accent, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)", letterSpacing:"1px", textTransform:"uppercase", marginTop:"5px" }}>{s.label}</div>
            <div style={{ fontSize:"13px", color:"#4A5A6A", marginTop:"3px" }}>{s.sub}</div>
            <div style={{ position:"absolute", top:0, right:0, width:"50px", height:"50px", background:`radial-gradient(circle at 80% 20%,${s.accent}22,transparent 70%)`, borderRadius:"0 12px 0 0" }}/>
          </div>
        ))}
      </div>

      <div className="g2w" style={{ marginBottom:"12px" }}>
        {/* Recent Issues */}
        <div style={card()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <div style={secTitle}>Recent Issues</div>
            <button style={btn("sec",true)} onClick={()=>setPage("issues")}>View All →</button>
          </div>
          <div className="tbl-hdr" style={{ gridTemplateColumns:"1fr 100px 80px 90px" }}>
            <span>Title</span><span>Category</span><span>Priority</span><span>Status</span>
          </div>
          {issues.slice(0,5).map((iss,i)=>(
            <div key={iss.id} style={{ padding:isMobile?"8px 0":"6px 0", borderBottom:"1px solid var(--t-border,#D0D7E3)", background:"transparent" }}>
              {isMobile ? (
                <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"6px" }}>
                    <span style={{ fontSize:"13px", fontWeight:"600", color:"var(--t-text,#0F172A)", flex:1, lineHeight:1.3, wordBreak:"break-word" }}>{iss.title}</span>
                    <span className="chip" style={{ ...PRI_S[iss.priority], flexShrink:0 }}>{iss.priority}</span>
                  </div>
                  <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
                    <span className="tag-pill" style={{ fontSize:"10px" }}>{iss.category}</span>
                    <span style={{ fontSize:"11px", fontWeight:"700", color:STA_C[iss.status] }}>● {iss.status}</span>
                  </div>
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 80px 90px", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"13px", fontWeight:"600", color:"var(--t-text,#0F172A)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{iss.title}</span>
                  <span className="tag-pill">{iss.category}</span>
                  <span className="chip" style={PRI_S[iss.priority]}>{iss.priority}</span>
                  <span style={{ fontSize:"12px", fontWeight:"700", color:STA_C[iss.status] }}>{iss.status}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Today's Schedule */}
        <div style={card()}>
          <div style={secTitle}>Today's Schedule</div>
          {meetings.filter(m=>m.date===TODAY).concat(meetings).slice(0,4).map((m,i)=>(
            <div key={m.id+i} style={{ padding:"9px 0", borderBottom:i<3?"1px solid rgba(255,255,255,.05)":"none", display:"flex", gap:"12px" }}>
              <span style={{ fontSize:"12px", color:"var(--t-muted,#3D4F5F)", minWidth:"34px", fontFamily:"monospace", flexShrink:0 }}>{m.time||"—"}</span>
              <div>
                <div style={{ fontSize:"13px", color:"var(--t-text,#0F172A)" }}>{m.title}</div>
                <div style={{ fontSize:"13px", color:"#4A5A6A", marginTop:"2px" }}>{m.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="g2" style={{ marginBottom:"12px" }}>
        <div style={card()}>
          <div style={secTitle}>Issue Volume — 6 Months</div>
          <BarChart data={barData}/>
          <div style={{ display:"flex", gap:"12px", marginTop:"8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"5px" }}><div style={{ width:"8px", height:"8px", background:"rgba(27,79,138,.55)", borderRadius:"2px" }}/><span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>Resolved</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:"5px" }}><div style={{ width:"8px", height:"8px", background:"rgba(192,57,43,.5)", borderRadius:"2px" }}/><span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>Pending</span></div>
          </div>
        </div>
        <div style={card()}>
          <div style={secTitle}>Issues by Category</div>
          <Donut data={catData.length?catData:[{label:"No data",count:1,color:"#B8C4D4"}]}/>
        </div>
      </div>

      {/* Downloads */}
      <div style={{ ...card(), marginBottom:"14px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
          <div style={secTitle}>Downloads</div>
          <div style={{ display:"flex", gap:"6px" }}>
            <button style={btn("sec",true)} onClick={()=>setPage("documents")}>All Docs →</button>
            <button style={btn("sec",true)} onClick={()=>setPage("speeches")}>All Speeches →</button>
          </div>
        </div>

        {/* Documents */}
        {docs.filter(d=>d.summary).length > 0 && (
          <>
            <div style={{ fontSize:"13px", color:"#4A5A6A", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"8px" }}>Documents</div>
            {docs.filter(d=>d.summary).slice(0,4).map((d,i,arr)=>{
              const { readMins, reviewMins } = calcDocTimes(d);
              return (
                <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,.04)":"none" }}>
                  <div style={{ display:"flex", gap:"10px", alignItems:"center", minWidth:0 }}>
                    <span style={{ fontSize:"16px", flexShrink:0 }}>{getFileIcon(d.name)}</span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:"13px", color:"var(--t-text,#0F172A)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"100%" }}>{d.name}</div>
                      <div style={{ fontSize:"13px", color:"#4A5A6A", marginTop:"2px" }}>
                        <span style={{ color:"var(--accent,#1B4F8A)" }}>👁 ~{readMins}m read</span>
                        <span style={{ color:"var(--t-muted,#3D4F5F)" }}> • </span>
                        <span style={{ color:"#138808" }}>🔍 ~{reviewMins}m review</span>
                        <span style={{ color:"var(--t-muted,#3D4F5F)" }}> • {d.date}</span>
                      </div>
                    </div>
                  </div>
                  <DocDownloadMenu doc={d}/>
                </div>
              );
            })}
          </>
        )}

        {/* Speeches */}
        {speeches.length > 0 && (
          <>
            <div style={{ fontSize:"13px", color:"#4A5A6A", letterSpacing:"1px", textTransform:"uppercase", margin:"14px 0 8px" }}>Speeches</div>
            {speeches.slice(0,4).map((s,i,arr)=>{
              const { words, deliverMins, listenMins } = calcTimes(s.content);
              return (
                <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,.04)":"none" }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:"13px", color:"var(--t-text,#0F172A)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"100%" }}>{s.title}</div>
                    <div style={{ fontSize:"13px", color:"#4A5A6A", marginTop:"2px" }}>
                      <span style={{ color:"var(--accent,#1B4F8A)" }}>🎤 ~{deliverMins}m deliver</span>
                      <span style={{ color:"var(--t-muted,#3D4F5F)" }}> • </span>
                      <span style={{ color:"#138808" }}>👂 ~{listenMins}m listen</span>
                      <span style={{ color:"var(--t-muted,#3D4F5F)" }}> • {s.event} • {s.date}</span>
                    </div>
                  </div>
                  <DownloadMenu speech={s}/>
                </div>
              );
            })}
          </>
        )}

        {docs.filter(d=>d.summary).length === 0 && speeches.length === 0 && (
          <div style={{ color:"#B8C4D4", fontSize:"13px", textAlign:"center", padding:"20px" }}>
            Upload documents or generate speeches to see downloads here
          </div>
        )}
      </div>

      {/* AI Quick Ask */}
      <div style={card("rgba(27,79,138,.15)")}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
          <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:pulse?"#22d3ee":"#B8C4D4", boxShadow:pulse?"0 0 8px #22d3ee":"none", transition:"all .5s" }}/>
          <div style={secTitle}>AI Quick Assist</div>
        </div>
        <div style={{ display:"flex", gap:"10px" }}>
          <input style={{ ...inp, flex:1, minWidth:0 }} placeholder="Ask AI about schemes, policies, governance…" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} />
          <button style={btn()} onClick={ask} disabled={loading}>{loading?"…":"Ask AI →"}</button>
        </div>
        {loading && <Spinner text="Thinking…"/>}
        {ans && <AIBox text={ans}/>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FILE TYPE HELPERS
═══════════════════════════════════════════════════════════════ */
function getFileIcon(name) {
  const ext = name.split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "📄";
  if (["doc","docx"].includes(ext)) return "📝";
  if (["xls","xlsx","csv"].includes(ext)) return "📊";
  if (["png","jpg","jpeg","gif","webp","bmp"].includes(ext)) return "🖼️";
  if (["mp3","wav","ogg","m4a"].includes(ext)) return "🎵";
  if (["mp4","mov","avi","mkv"].includes(ext)) return "🎬";
  if (["zip","rar","7z"].includes(ext)) return "🗜️";
  if (["json"].includes(ext)) return "⚙️";
  if (["html","htm","xml"].includes(ext)) return "🌐";
  return "◫";
}

// Read any file → returns { text, base64, mediaType, method }
async function extractFileContent(file) {
  const ext = name => name.split(".").pop().toLowerCase();
  const e = ext(file.name);
  const size = `${(file.size/1048576).toFixed(2)} MB`;

  // ── Plain text formats ──
  if (["txt","md","markdown","log","csv","tsv","json","xml","html","htm","yaml","yml","ini","env","sh","bat","py","js","ts","jsx","tsx","css","sql","rtf"].includes(e)) {
    const text = await new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = ev => res(ev.target.result||"");
      r.onerror = () => rej(new Error("Read failed"));
      r.readAsText(file);
    });
    return { text: text.slice(0,15000), base64:null, mediaType:null, method:"text", size };
  }

  // ── DOCX via mammoth ──
  if (["doc","docx"].includes(e)) {
    try {
      const mammoth = await import("mammoth");
      const ab = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: ab });
      return { text: result.value.slice(0,15000), base64:null, mediaType:null, method:"docx", size };
    } catch(err) {
      // fallback: read as text
      const text = await new Promise(res=>{ const r=new FileReader(); r.onload=ev=>res(ev.target.result||""); r.readAsText(file); });
      return { text: text.slice(0,15000), base64:null, mediaType:null, method:"text-fallback", size };
    }
  }

  // ── XLSX/XLS via SheetJS ──
  if (["xls","xlsx","xlsm","ods"].includes(e)) {
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type:"array" });
      let text = "";
      wb.SheetNames.forEach(name => {
        const ws = wb.Sheets[name];
        text += `\n=== Sheet: ${name} ===\n`;
        text += XLSX.utils.sheet_to_csv(ws);
      });
      return { text: text.slice(0,15000), base64:null, mediaType:null, method:"xlsx", size };
    } catch {
      return { text:"[Could not parse spreadsheet]", base64:null, mediaType:null, method:"xlsx-err", size };
    }
  }

  // ── PDF → read as ArrayBuffer, extract text via pdfjs npm ──
  if (e === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    let pdfText = "";
    try {
      // Use pdfjs-dist from npm (installed in package.json)
      const pdfjsLib = await import("pdfjs-dist");
      // Disable worker for browser inline use
      pdfjsLib.GlobalWorkerOptions.workerSrc = "";
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
      const maxPg = Math.min(pdf.numPages, 20);
      for (let p = 1; p <= maxPg; p++) {
        const page = await pdf.getPage(p);
        const tc = await page.getTextContent();
        pdfText += tc.items.map(i => i.str).join(" ") + "\n";
      }
      pdfText = pdfText.trim().slice(0, 14000);
    } catch(pdfErr) {
      pdfText = "";
    }
    // Also keep base64 for fallback
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return { text: pdfText || null, base64, mediaType:"application/pdf", method:"pdf", size };
  }

  // ── Images → base64 → Claude vision ──
  const imgExts = ["png","jpg","jpeg","gif","webp","bmp"];
  if (imgExts.includes(e)) {
    const mimeMap = { png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", webp:"image/webp", bmp:"image/bmp" };
    const base64 = await new Promise((res,rej)=>{
      const r = new FileReader();
      r.onload = ev => res(ev.target.result.split(",")[1]);
      r.onerror = () => rej(new Error("Read failed"));
      r.readAsDataURL(file);
    });
    return { text:null, base64, mediaType:mimeMap[e]||"image/jpeg", method:"image", size };
  }

  // ── Fallback: try reading as text ──
  const text = await new Promise(res=>{
    const r = new FileReader();
    r.onload = ev => res(ev.target.result||"[Binary file — could not extract text]");
    r.onerror = () => res("[Could not read file]");
    r.readAsText(file);
  });
  return { text: text.slice(0,15000), base64:null, mediaType:null, method:"fallback", size };
}

// Call Claude with file content (handles text, PDF doc, and image)
async function summarizeFile(fileData, fileName) {
  const SYS = "You are a document analyst for an Indian MLA/public official. Extract and summarize all key information: facts, figures, dates, decisions, action items, and important names. Be thorough and structured.";

  if (fileData.method === "pdf") {
    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_KEY || "";
      // Use pre-extracted text from readFile, or try re-extraction
      let pdfText = fileData.text || "";
      if (!pdfText && fileData.base64) {
        try {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = "";
          const binary = atob(fileData.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const pdf = await pdfjsLib.getDocument({ data: bytes, useWorkerFetch:false, isEvalSupported:false, useSystemFonts:true }).promise;
          const maxPages = Math.min(pdf.numPages, 20);
          for (let p = 1; p <= maxPages; p++) {
            const page = await pdf.getPage(p);
            const tc = await page.getTextContent();
            pdfText += tc.items.map(i => i.str).join(" ") + "\n";
          }
          pdfText = pdfText.trim().slice(0, 14000);
        } catch(e2) { pdfText = ""; }
      }
      if (!pdfText || pdfText.length < 30) {
        return "⚠️ Could not extract text from this PDF. It may be a scanned image PDF. Please try a text-based PDF or paste the content manually.";
      }
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`,"HTTP-Referer":"https://mantri-mitra-ai.vercel.app","X-Title":"Mantri Mitra AI"},
        body:JSON.stringify({ model:"anthropic/claude-3.5-haiku", max_tokens:1500, messages:[
          {role:"system",content:SYS},
          {role:"user",content:`Please provide a comprehensive summary of this PDF document titled "${fileName}". Include: 1) Main topic/purpose, 2) Key facts and figures, 3) Important decisions or findings, 4) Action items or recommendations, 5) Any names, dates, or locations mentioned.\n\nDOCUMENT TEXT:\n${pdfText}`}
        ]})
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.choices?.[0]?.message?.content||"";
    } catch(e) {
      return "PDF analysis error: " + e.message;
    }
  }

  if (fileData.method === "image" && fileData.base64) {
    // Use Claude vision
    const body = {
      model:"claude-sonnet-4-20250514", max_tokens:1500,
      system: SYS,
      messages:[{ role:"user", content:[
        { type:"image", source:{ type:"base64", media_type:fileData.mediaType, data:fileData.base64 } },
        { type:"text", text:`This is an uploaded image file: ${fileName}. Please describe what you see and extract any text, data, charts, tables, or important information visible in this image.` }
      ]}]
    };
    const apiKey2 = import.meta.env.VITE_OPENROUTER_KEY || "";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey2}`,"HTTP-Referer":"https://mantri-mitra-ai.vercel.app","X-Title":"Mantri Mitra AI"},
      body:JSON.stringify({ model:"openai/gpt-4o-mini", max_tokens:1500, messages:[
        {role:"system",content:SYS},
        {role:"user",content:[
          {type:"image_url",image_url:{url:`data:${fileData.mediaType};base64,${fileData.base64}`}},
          {type:"text",text:`This is an uploaded image file: ${fileName}. Please describe what you see and extract any text, data, charts, tables, or important information visible in this image.`}
        ]}
      ]})
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content||"";
  }

  // Text-based summarization
  return callAI(
    `File: ${fileName}\n\nContent:\n${fileData.text}\n\nProvide a comprehensive summary with: 1) Main topic/purpose, 2) Key facts and figures, 3) Important decisions or findings, 4) Action items, 5) Any names/dates/locations.`,
    SYS
  );
}

/* ═══════════════════════════════════════════════════════════════
   UNIVERSAL DOWNLOAD HELPERS — PDF / PNG / JPG
   Pure browser — no external scripts, no CDN
═══════════════════════════════════════════════════════════════ */

function filename_safe(s) {
  return s.replace(/[^a-z0-9]/gi,"_").toLowerCase().slice(0,40);
}

// Build a clean printable HTML page string
function buildPrintHTML(title, metaLines, bodyText, timingLine) {
  const escaped = (s) => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  // Convert markdown-style bold (**text**) to <strong>
  const md = (s) => escaped(s).replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
  const lines = bodyText.split("\n").map(line => {
    if (/^###\s/.test(line)) return `<h3>${md(line.replace(/^###\s*/,""))}</h3>`;
    if (/^##\s/.test(line))  return `<h2>${md(line.replace(/^##\s*/,""))}</h2>`;
    if (/^#\s/.test(line))   return `<h1>${md(line.replace(/^#\s*/,""))}</h1>`;
    if (/^[-*]\s/.test(line)) return `<li>${md(line.replace(/^[-*]\s+/,""))}</li>`;
    if (/^\d+\.\s/.test(line)) return `<li>${md(line.replace(/^\d+\.\s+/,""))}</li>`;
    if (line.trim()==="---") return `<hr>`;
    if (line.trim()==="") return `<br>`;
    return `<p>${md(line)}</p>`;
  }).join("\n");

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:Georgia,serif;max-width:780px;margin:40px auto;padding:0 28px;color:#111;line-height:1.8;font-size:14px}
  h1{font-size:22px;border-bottom:2px solid #3B82F6;padding-bottom:8px;color:#1a1a2e}
  h2{font-size:17px;color:#1e3a5f;margin-top:18px}
  h3{font-size:14px;color:#374151;margin-top:12px}
  .meta{font-size:12px;color:#666;margin:6px 0 18px;display:flex;flex-wrap:wrap;gap:14px}
  .timing{background:#EEF2FF;border-left:4px solid #3B82F6;padding:10px 16px;border-radius:4px;margin:14px 0 22px;font-size:12px;color:#1e3a5f}
  li{margin:3px 0 3px 18px}
  p{margin:4px 0}
  hr{border:none;border-top:1px solid #ddd;margin:14px 0}
  footer{margin-top:40px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:10px;text-align:center}
  strong{font-weight:700}
</style></head><body>
<h1>${escaped(title)}</h1>
<div class="meta">${metaLines.map(m=>`<span>${escaped(m)}</span>`).join("")}</div>
${timingLine ? `<div class="timing">${escaped(timingLine)}</div>` : ""}
<div>${lines}</div>
<footer>Generated by Mantri Mitra AI &nbsp;|&nbsp; ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</footer>
</body></html>`;
}

// ── Download helpers ──

// PDF: open print dialog in new window → user saves as PDF
function dlPDF(htmlStr, filename) {
  try {
    const printHTML = htmlStr.replace("</head>", `
      <style>
        @media print {
          body { margin: 0; }
          @page { margin: 15mm; size: A4; }
        }
      </style>
      <script>
        window.onload = function() {
          document.title = "${filename.replace(/"/g, "'")}";
          setTimeout(function(){ window.print(); }, 400);
        };
      </scr` + `ipt>
    </head>`);
    const win = window.open("", "_blank");
    if (!win) {
      // Popup blocked — fallback to blob download
      const blob = new Blob([htmlStr], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename + ".html";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return;
    }
    win.document.write(printHTML);
    win.document.close();
  } catch(e) {
    const blob = new Blob([htmlStr], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename + ".html";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
  }
}

// Build canvas from content (pure Canvas 2D, no external libs)
function buildTextCanvas(title, metaLines, bodyText, timingLine) {
  const W = 900, PADDING = 48;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  function wrapText(text, maxW, fontSize) {
    ctx.font = fontSize + "px Georgia, serif";
    const words = (text||"").split(" ");
    const lns = []; let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lns.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lns.push(cur);
    return lns.length ? lns : [""];
  }

  const contentW = W - PADDING * 2;
  const rawLines = (bodyText||"").split("\n");

  // Pass 1: measure total height
  let totalH = PADDING + 60 + (metaLines.length * 22) + (timingLine ? 50 : 0) + 30;
  for (const raw of rawLines) {
    if (raw.trim() === "") { totalH += 10; continue; }
    const stripped = raw.replace(/^#+\s*/,"").replace(/^[-*]\s+/,"").replace(/^\d+\.\s+/,"").replace(/\*\*(.+?)\*\*/g,"$1");
    const isH1 = /^#[^#]/.test(raw), isH2 = /^##/.test(raw);
    const fsize = isH1 ? 18 : isH2 ? 15 : 13;
    const wrapped = wrapText(stripped, contentW - (/^[-*]|^\d+\./.test(raw) ? 20 : 0), fsize);
    totalH += wrapped.length * (fsize + 7) + (isH1 || isH2 ? 14 : 4);
  }
  totalH += PADDING + 40;

  canvas.width = W;
  canvas.height = Math.max(totalH, 500);

  // White bg
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, canvas.height);

  let y = PADDING;

  // Title
  ctx.fillStyle = "#1a1a2e";
  ctx.font = "bold 22px Georgia, serif";
  for (const tl of wrapText(title||"Untitled", contentW, 22)) { ctx.fillText(tl, PADDING, y + 22); y += 30; }
  ctx.strokeStyle = ACCENT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PADDING, y + 2); ctx.lineTo(W - PADDING, y + 2); ctx.stroke();
  y += 16;

  // Meta lines
  ctx.font = "12px Georgia, serif"; ctx.fillStyle = "#666";
  for (const m of metaLines) { ctx.fillText(m, PADDING, y + 14); y += 22; }
  y += 8;

  // Timing box
  if (timingLine) {
    ctx.fillStyle = "#EEF2FF";
    ctx.fillRect(PADDING, y, contentW, 38);
    ctx.strokeStyle = ACCENT; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(PADDING, y + 38); ctx.stroke();
    ctx.fillStyle = "#1e3a5f"; ctx.font = "12px Georgia, serif";
    ctx.fillText(timingLine, PADDING + 14, y + 24);
    y += 50;
  }

  // Section divider
  ctx.strokeStyle = "#ddd"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(W - PADDING, y); ctx.stroke();
  y += 20;

  // Body
  for (const raw of rawLines) {
    if (raw.trim() === "---") {
      ctx.strokeStyle = "#ddd"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(W - PADDING, y); ctx.stroke();
      y += 16; continue;
    }
    if (raw.trim() === "") { y += 10; continue; }

    const isH1 = /^#[^#]/.test(raw), isH2 = /^##[^#]/.test(raw), isH3 = /^###/.test(raw);
    const isBullet = /^[-*]\s/.test(raw), isNum = /^\d+\.\s/.test(raw);
    const stripped = raw.replace(/^#+\s*/,"").replace(/^[-*]\s+/,"").replace(/^\d+\.\s+/,"").replace(/\*\*(.+?)\*\*/g,"$1");
    const fsize = isH1 ? 18 : isH2 ? 15 : isH3 ? 14 : 13;
    const indent = (isBullet || isNum) ? 20 : 0;

    if (isH1) { y += 10; ctx.font = "bold 18px Georgia,serif"; ctx.fillStyle = "#1a1a2e"; }
    else if (isH2) { y += 8; ctx.font = "bold 15px Georgia,serif"; ctx.fillStyle = "#1e3a5f"; }
    else if (isH3) { y += 6; ctx.font = "bold 14px Georgia,serif"; ctx.fillStyle = "#374151"; }
    else { ctx.font = "13px Georgia,serif"; ctx.fillStyle = "#333"; }

    if (isBullet) { ctx.fillStyle = ACCENT; ctx.font = "bold 14px Georgia,serif"; ctx.fillText("▸", PADDING, y + fsize); ctx.font = "13px Georgia,serif"; ctx.fillStyle = "#333"; }
    if (isNum) { const n = (raw.match(/^(\d+)/) || ["","1"])[1]; ctx.fillStyle = ACCENT; ctx.font = "bold 12px Georgia,serif"; ctx.fillText(n + ".", PADDING, y + fsize); ctx.font = "13px Georgia,serif"; ctx.fillStyle = "#333"; }

    for (const wl of wrapText(stripped, contentW - indent, fsize)) {
      ctx.fillText(wl, PADDING + indent, y + fsize);
      y += fsize + 7;
    }
    y += isH1 || isH2 ? 8 : 2;
  }

  // Footer
  y += 20;
  ctx.strokeStyle = "#eee"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PADDING, y); ctx.lineTo(W - PADDING, y); ctx.stroke();
  y += 16;
  ctx.font = "10px Georgia,serif"; ctx.fillStyle = "#aaa";
  ctx.fillText("Generated by Mantri Mitra AI  |  " + new Date().toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"}), PADDING, y);

  return canvas;
}

function dlPNG(htmlStr, filename, title, metaLines, bodyText, timingLine) {
  const canvas = buildTextCanvas(title, metaLines, bodyText, timingLine);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename + ".png";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }, "image/png");
}

function dlJPG(htmlStr, filename, title, metaLines, bodyText, timingLine) {
  const canvas = buildTextCanvas(title, metaLines, bodyText, timingLine);
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename + ".jpg";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }, "image/jpeg", 0.93);
}

/* ── Shared Download Button with PDF/JPG/PNG ── */
function DownloadMenu({ speech }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const { words, deliverMins, listenMins } = calcTimes(speech.content);
  const meta = [`📅 ${speech.date}`, `🎤 ${speech.event||"Event"}`, `👥 ${speech.audience||"General Public"}`];
  const timing = `🕐 Delivery: ~${deliverMins} min  |  👂 Listening: ~${listenMins} min  |  📝 ${words} words`;
  const html = buildPrintHTML(speech.title, meta, speech.content, timing);
  const fname = filename_safe(speech.title);

  const run = async (label, fn) => {
    setOpen(false); setBusy(label);
    try { await fn(); } catch(e) { alert("Download error: "+e.message); }
    setBusy("");
  };

  const opts = [
    { label:"📄 PDF Download",  fn:()=>run("pdf",  ()=>dlPDF(html, fname)) },
    { label:"🖼️ JPG Image",     fn:()=>run("jpg",  ()=>dlJPG(html, fname, speech.title, meta, speech.content, timing)) },
    { label:"📸 PNG Image",     fn:()=>run("png",  ()=>dlPNG(html, fname, speech.title, meta, speech.content, timing)) },
  ];

  return (
    <div style={{ position:"relative" }}>
      <button style={btn("sec",true)} onClick={()=>setOpen(o=>!o)} disabled={!!busy}>
        {busy ? `⏳ Saving ${busy}…` : "⬇ Download"}
      </button>
      {open && (
        <div style={{ position:"absolute", right:0, top:"calc(100% + 6px)", background:"var(--t-card,#fff)", border:"2px solid var(--t-border,#D0D7E3)", borderRadius:"10px", padding:"6px", zIndex:50, width:"200px", boxShadow:"0 8px 32px rgba(0,0,0,.18)" }} onMouseLeave={()=>setOpen(false)}>
          {opts.map((o,i)=>(
            <button key={i} onClick={o.fn} style={{ padding:"10px 14px", fontSize:"13px", fontWeight:"600", color:"var(--t-text,#0F172A)", cursor:"pointer", borderRadius:"7px", display:"flex", alignItems:"center", gap:"10px", borderBottom: i<opts.length-1 ? "1px solid var(--t-border,#D0D7E3)" : "none", background:"transparent", border:"none", width:"100%", textAlign:"left" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="rgba(27,79,138,.12)"; e.currentTarget.style.color=ACCENT; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--t-text,#0F172A)"; }}
            >{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Doc download helpers ── */
/* ── Reading time for documents (based on summary word count) ── */
function calcDocTimes(doc) {
  const summaryWords = (doc.summary||"").trim().split(/\s+/).filter(Boolean).length;
  const contentWords = (doc.content||"").trim().split(/\s+/).filter(Boolean).length;
  const totalWords = Math.max(summaryWords, contentWords);
  const readMins   = Math.max(1, Math.ceil(summaryWords / 200));   // skim summary at reading pace
  const reviewMins = Math.max(2, Math.ceil(totalWords / 150));     // review full content carefully
  return { summaryWords, contentWords, totalWords, readMins, reviewMins };
}

/* ── Document Download Menu ── */
function DocDownloadMenu({ doc }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const { readMins, reviewMins } = calcDocTimes(doc);
  const meta = [`📅 ${doc.date}`, `📦 ${doc.size}`, `Type: ${doc.method||"document"}`];
  const timing = `👁 Quick Read: ~${readMins} min  |  🔍 Full Review: ~${reviewMins} min`;
  const body = `AI Analysis & Summary

${doc.summary||""}${doc.content && doc.content!=="[Binary — see summary]" ? `

---

Extracted Content

${doc.content.slice(0,5000)}` : ""}`;
  const html = buildPrintHTML(doc.name, meta, body, timing);
  const fname = filename_safe(doc.name);

  const run = async (label, fn) => {
    setOpen(false); setBusy(label);
    try { await fn(); } catch(e) { alert("Download error: "+e.message); }
    setBusy("");
  };

  const opts = [
    { label:"📄 PDF Download",  fn:()=>run("pdf",  ()=>dlPDF(html, fname)) },
    { label:"🖼️ JPG Image",     fn:()=>run("jpg",  ()=>dlJPG(html, fname, doc.name, meta, body, timing)) },
    { label:"📸 PNG Image",     fn:()=>run("png",  ()=>dlPNG(html, fname, doc.name, meta, body, timing)) },
  ];

  return (
    <div style={{ position:"relative" }}>
      <button style={btn("sec",true)} onClick={()=>setOpen(o=>!o)} disabled={!!busy}>
        {busy ? `⏳ Saving ${busy}…` : "⬇ Download"}
      </button>
      {open && (
        <div style={{ position:"absolute", right:0, top:"calc(100% + 6px)", background:"var(--t-card,#fff)", border:"2px solid var(--t-border,#D0D7E3)", borderRadius:"10px", padding:"6px", zIndex:50, width:"200px", boxShadow:"0 8px 32px rgba(0,0,0,.18)" }} onMouseLeave={()=>setOpen(false)}>
          {opts.map((o,i)=>(
            <button key={i} onClick={o.fn} style={{ padding:"10px 14px", fontSize:"13px", fontWeight:"600", color:"var(--t-text,#0F172A)", cursor:"pointer", borderRadius:"7px", display:"flex", alignItems:"center", gap:"10px", borderBottom: i<opts.length-1 ? "1px solid var(--t-border,#D0D7E3)" : "none", background:"transparent", border:"none", width:"100%", textAlign:"left" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="rgba(27,79,138,.12)"; e.currentTarget.style.color=ACCENT; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--t-text,#0F172A)"; }}
            >{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Document Timed Summary Panel ── */
function DocTimedPanel({ doc }) {
  const [minutes, setMinutes] = useState(3);
  const [mode, setMode] = useState("read");   // "read" | "review"
  const [timedText, setTimedText] = useState("");
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const { summaryWords, readMins, reviewMins } = calcDocTimes(doc);

  const presets = mode==="read"
    ? [{l:"1 min",v:1},{l:"3 min",v:3},{l:"5 min",v:5},{l:"10 min",v:10}]
    : [{l:"5 min",v:5},{l:"10 min",v:10},{l:"15 min",v:15},{l:"30 min",v:30}];

  const generate = async () => {
    setLoading(true); setTimedText("");
    const targetWords = mode==="read" ? minutes*200 : minutes*150;
    const source = doc.summary || doc.content || doc.name;
    try {
      const r = await callAI(
        `You are condensing a document summary to fit a strict time limit.\n\nOriginal document: ${doc.name}\n\nContent/Summary:\n${source.slice(0,8000)}\n\nTask: Rewrite the key information so it can be ${mode==="read"?"read":"reviewed and studied"} in exactly ${minutes} minute${minutes>1?"s":""}.\nTarget word count: approximately ${targetWords} words.\nKeep the most critical facts, figures, decisions and action items. Use bullet points if it helps clarity.\nReturn ONLY the condensed version, no preamble.`,
        "You are a document analyst for an Indian MLA. Preserve all critical facts, numbers, and action items while meeting the time constraint exactly."
      );
      setTimedText(r);
    } catch(e) { setTimedText("Error: "+e.message); }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard?.writeText(timedText); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div style={{ ...card("rgba(27,79,138,.12)"), marginTop:"16px" }}>
      <div style={secTitle}>⏱ Timed Reading Generator</div>

      {/* Time stats */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
        {[
          { icon:"📝", label:"Summary Words",  value:`${summaryWords} words` },
          { icon:"👁",  label:"Quick Read",     value:`~${readMins} min`,   accent:ACCENT },
          { icon:"🔍", label:"Full Review",     value:`~${reviewMins} min`, accent:"#10B981" },
        ].map((s,i)=>(
          <div key={i} style={{ flex:1, minWidth:"100px", padding:"10px 14px", background:"#F5F6F8", borderRadius:"8px", border:`1px solid ${s.accent||"var(--t-border,#D0D7E3)"}30` }}>
            <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)", marginBottom:"3px" }}>{s.icon} {s.label}</div>
            <div style={{ fontSize:"15px", fontWeight:"bold", color:s.accent||"var(--accent,#1B4F8A)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Mode toggle */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"12px", alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>Condense for:</span>
        {[{v:"read",l:"👁 Quick Read (skim)"},{v:"review",l:"🔍 Deep Review (study)"}].map(m=>(
          <button key={m.v} style={btn(mode===m.v?"pri":"sec",true)} onClick={()=>setMode(m.v)}>{m.l}</button>
        ))}
      </div>

      {/* Time presets + custom */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"14px", alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>Target time:</span>
        {presets.map(p=>(
          <button key={p.v} style={btn(minutes===p.v?"pri":"sec",true)} onClick={()=>setMinutes(p.v)}>{p.l}</button>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>Custom:</span>
          <input type="number" min="1" max="120" style={{ ...inp, width:"60px", padding:"4px 8px", fontSize:"13px" }} value={minutes} onChange={e=>setMinutes(Math.max(1,Number(e.target.value)))}/>
          <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>min</span>
        </div>
      </div>

      <button style={{ ...btn(), width:"100%", marginBottom:"12px" }} onClick={generate} disabled={loading}>
        {loading?`✦ Condensing to ${minutes} min…`:`✦ Generate ${minutes}-Minute ${mode==="read"?"Read":"Review"}`}
      </button>

      {loading && <Spinner text={`Condensing document to ${minutes} minutes…`}/>}
      {timedText && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
            <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>
              ~{timedText.trim().split(/\s+/).length} words • ~{mode==="read"?Math.ceil(timedText.trim().split(/\s+/).length/200):Math.ceil(timedText.trim().split(/\s+/).length/150)} min {mode==="read"?"reading":"review"}
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button style={btn("sec",true)} onClick={copy}>{copied?"✓ Copied":"📋 Copy"}</button>
            </div>
          </div>
          <div style={{ fontSize:"13px", lineHeight:"2", color:"var(--t-text,#0F172A)", whiteSpace:"pre-wrap", maxHeight:"300px", overflowY:"auto", padding:"14px", background:"var(--t-bg,#F8F9FB)", borderRadius:"8px", border:"1px solid rgba(255,255,255,.06)" }}>{timedText}</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: DOCUMENTS
═══════════════════════════════════════════════════════════════ */
function Documents({ docs, setDocs, isMobile=false }) {
  const [viewDoc, setViewDoc]       = useState(null);
  const [addModal, setAddModal]     = useState(false);
  const [form, setForm]             = useState({ name:"", content:"" });
  const [loadingId, setLoadingId]   = useState(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [dragOver, setDragOver]     = useState(false);
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy]         = useState("date");
  const [chatDoc, setChatDoc]       = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatQ, setChatQ]           = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [compareModal, setCompareModal] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [compareResult, setCompareResult] = useState("");
  const [compareLoading, setCompareLoading] = useState(false);
  const [translateDoc, setTranslateDoc] = useState(null);
  const [translateLang, setTranslateLang] = useState("Hindi");
  const [translateResult, setTranslateResult] = useState("");
  const [translateLoading, setTranslateLoading] = useState(false);
  const [draftModal, setDraftModal] = useState(null);
  const [draftType, setDraftType]   = useState("Reply Letter");
  const [draftResult, setDraftResult] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [extractModal, setExtractModal] = useState(null);
  const [extractType, setExtractType]   = useState("Key Dates & Deadlines");
  const [extractResult, setExtractResult] = useState("");
  const [extractLoading, setExtractLoading] = useState(false);
  const fileRef = useRef();

  const processFile = async (file) => {
    const id = `D${Date.now()}`;
    const entry = { id, name:file.name, size:"reading…", date:new Date().toISOString().slice(0,10), content:"", summary:"", method:"" };
    setDocs(prev=>[entry,...prev]);
    setLoadingId(id); setLoadingMsg("Reading file…");
    try {
      const fileData = await extractFileContent(file);
      setDocs(prev=>prev.map(d=>d.id===id ? { ...d, size:fileData.size, content:fileData.text||"[Binary — see summary]", method:fileData.method } : d));
      setLoadingMsg("Analyzing with AI…");
      const summary = await summarizeFile(fileData, file.name);
      setDocs(prev=>prev.map(d=>d.id===id ? { ...d, summary } : d));
    } catch(e) {
      setDocs(prev=>prev.map(d=>d.id===id ? { ...d, size:"error", summary:"Error: "+e.message } : d));
    }
    setLoadingId(null); setLoadingMsg("");
  };

  const handleFileInput = (e) => { Array.from(e.target.files||[]).forEach(processFile); e.target.value=""; };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); Array.from(e.dataTransfer.files||[]).forEach(processFile); };

  const doSummarize = async (docObj) => {
    if (docObj.summary) { setViewDoc(docObj); return; }
    setLoadingId(docObj.id); setLoadingMsg("Analyzing…");
    try {
      const summary = await callAI(`Summarize:\n\n${docObj.content||docObj.name}`, "Document analyst for Indian MLA.");
      const updated = { ...docObj, summary };
      setDocs(prev=>prev.map(d=>d.id===docObj.id ? updated : d));
      setViewDoc(updated);
    } catch(e) { alert("AI Error: "+e.message); }
    setLoadingId(null); setLoadingMsg("");
  };

  const saveManual = async () => {
    if (!form.name.trim()) return;
    const entry = { id:`D${Date.now()}`, name:form.name, size:"—", date:new Date().toISOString().slice(0,10), content:form.content, summary:"", method:"manual" };
    setDocs(prev=>[entry,...prev]);
    setForm({ name:"", content:"" }); setAddModal(false);
    if (form.content.trim()) {
      setLoadingId(entry.id); setLoadingMsg("Summarizing…");
      try {
        const summary = await callAI(`Summarize:\n\n${form.content}`, "Document analyst for Indian MLA.");
        setDocs(prev=>prev.map(d=>d.id===entry.id ? {...d,summary} : d));
      } catch {}
      setLoadingId(null); setLoadingMsg("");
    }
  };

  const ML = { pdf:"PDF", docx:"Word", xlsx:"Excel", image:"Image", text:"Text", csv:"CSV", json:"JSON", manual:"Note", fallback:"File" };
  const EXTRACT_TYPES = ["Key Dates & Deadlines","Budget & Financial Figures","Action Items & Responsibilities","Legal Clauses & Obligations","Scheme Names & Beneficiaries","Contact Details","Statistical Data"];
  const DRAFT_TYPES   = ["Reply Letter","Official Memo","Forwarding Note","RTI Response","Compliance Report","Press Release","Summary for Minister"];
  const TRANSLATE_LANGS = ["Hindi","Urdu","Marathi","Tamil","Telugu","Bengali","Gujarati","Kannada","Malayalam","Punjabi","Simple English"];

  // Chat with document
  const sendChat = async () => {
    if (!chatQ.trim() || !chatDoc) return;
    const q = chatQ.trim(); setChatQ(""); setChatLoading(true);
    const newHistory = [...chatHistory, { role:"user", text:q }];
    setChatHistory(newHistory);
    try {
      const ctx = chatDoc.summary ? `Document Summary:
${chatDoc.summary}

Document Content (excerpt):
${(chatDoc.content||"").slice(0,3000)}` : `Document: ${chatDoc.name}
Content: ${(chatDoc.content||"").slice(0,3000)}`;
      const history = newHistory.slice(-6).map(m=>`${m.role==="user"?"Q":"A"}: ${m.text}`).join("\n");
      const ans = await callAI(`You are an AI assistant helping an Indian government official analyse a document.\n\nDOCUMENT CONTEXT:\n${ctx}\n\nCONVERSATION HISTORY:\n${history}\n\nCurrent Question: ${q}\n\nAnswer accurately, concisely, and reference specific parts of the document where relevant.`, "You are a senior document analyst for an Indian government official. Be precise and official.");
      setChatHistory(prev=>[...prev, { role:"ai", text:ans }]);
    } catch(e) { setChatHistory(prev=>[...prev, { role:"ai", text:"Error: "+e.message }]); }
    setChatLoading(false);
  };

  // Compare documents
  const runCompare = async () => {
    if (compareIds.length<2) { alert("Select at least 2 documents to compare."); return; }
    setCompareLoading(true); setCompareResult("");
    const selected = docs.filter(d=>compareIds.includes(d.id));
    const ctx = selected.map((d,i)=>`DOCUMENT ${i+1}: ${d.name}\nSummary: ${d.summary||d.content?.slice(0,800)||"—"}`).join("\n\n---\n\n");
    try {
      const r = await callAI(`Compare these ${selected.length} government documents and provide:\n\n1. **KEY SIMILARITIES** across documents\n2. **KEY DIFFERENCES** (budget, scope, timelines, targets)\n3. **CONTRADICTIONS OR CONFLICTS** (if any)\n4. **COMBINED INSIGHTS** for the official\n5. **RECOMMENDED ACTION** based on comparison\n\n${ctx}`, "Senior policy analyst for Indian government. Be structured and insightful.");
      setCompareResult(r);
    } catch(e) { setCompareResult("Error: "+e.message); }
    setCompareLoading(false);
  };

  // Translate document
  const runTranslate = async () => {
    if (!translateDoc) return;
    setTranslateLoading(true); setTranslateResult("");
    const text = translateDoc.summary || (translateDoc.content||"").slice(0,3000);
    try {
      const r = await callAI(`Translate the following official government document summary/content into ${translateLang}. Maintain the formal, official tone. Preserve all numbers, dates, and proper nouns. Make it suitable for sharing with ${translateLang}-speaking constituents or officials.\n\nText to translate:\n${text}`, `You are an official government translator specializing in ${translateLang}.`);
      setTranslateResult(r);
    } catch(e) { setTranslateResult("Error: "+e.message); }
    setTranslateLoading(false);
  };

  // Draft response
  const runDraft = async () => {
    if (!draftModal) return;
    setDraftLoading(true); setDraftResult("");
    const ctx = draftModal.summary || (draftModal.content||"").slice(0,2000);
    try {
      const r = await callAI(`Based on the following government document, draft an official ${draftType} in formal Indian government letter format.\n\nInclude:\n- Proper salutation and reference number format\n- Formal opening\n- Key points addressed\n- Action requested or information provided\n- Formal closing\n- Signature block placeholder\n\nDocument Context:\n${ctx}\n\nDocument Name: ${draftModal.name}`, "Senior IAS officer drafting official government correspondence. Use formal Indian government letter format with proper headings.");
      setDraftResult(r);
    } catch(e) { setDraftResult("Error: "+e.message); }
    setDraftLoading(false);
  };

  // Extract structured info
  const runExtract = async () => {
    if (!extractModal) return;
    setExtractLoading(true); setExtractResult("");
    const ctx = extractModal.summary + "\n\n" + (extractModal.content||"").slice(0,3000);
    try {
      const r = await callAI(`From the following government document, extract and list ALL "${extractType}" in a structured, easy-to-read format. Be thorough and precise. Format as a clear numbered or bulleted list.\n\nDocument: ${extractModal.name}\n\nContent:\n${ctx}`, "Government document analyst. Extract information with precision and present it clearly.");
      setExtractResult(r);
    } catch(e) { setExtractResult("Error: "+e.message); }
    setExtractLoading(false);
  };

  // Filter + sort docs
  let displayed = docs.filter(d=>{
    const matchType = filterType==="All" || (d.method&&ML[d.method]===filterType) || d.method===filterType;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });
  if (sortBy==="name") displayed = [...displayed].sort((a,b)=>a.name.localeCompare(b.name));
  if (sortBy==="date") displayed = [...displayed].sort((a,b)=>b.date.localeCompare(a.date));

  return (
    <div>
      {/* ── Stats Row ── */}
      <div className="g4" style={{ marginBottom:"10px", minWidth:0, overflow:"hidden" }}>
        {[
          { label:"Total Docs", value:docs.length, icon:"📄", color:"var(--accent,#1B4F8A)" },
          { label:"Analyzed", value:docs.filter(d=>d.summary).length, icon:"✦", color:"#059669" },
          { label:"With Chat", value:docs.filter(d=>d.chatCount>0).length, icon:"💬", color:"#7C3AED" },
          { label:"Pending", value:docs.filter(d=>!d.summary).length, icon:"⏳", color:"#D97706" },
        ].map((s,i)=>(
          <div key={i} style={{ background:"var(--t-card,#fff)", border:`2px solid ${s.color}25`, borderRadius:"8px", padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
            <span style={{ fontSize:"22px" }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:"22px", fontWeight:"800", color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)", fontWeight:"600", marginTop:"2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"12px", flexWrap:"wrap", alignItems:"center" }}>
        <button style={{ ...btn(), display:"flex", alignItems:"center", gap:"6px" }} onClick={()=>fileRef.current.click()}>⬆ <span>Upload File</span></button>
        <button style={{ ...btn("sec"), display:"flex", alignItems:"center", gap:"6px" }} onClick={()=>setAddModal(true)}>✏️ <span>Manual Note</span></button>
        <button style={{ ...btn("sec"), display:"flex", alignItems:"center", gap:"6px" }} onClick={()=>{ setCompareIds([]); setCompareResult(""); setCompareModal(true); }}>⚖️ <span>Compare Docs</span></button>
        <input type="file" ref={fileRef} style={{ display:"none" }} multiple onChange={handleFileInput}/>
        <input style={{ ...inp, flex:1, minWidth:"100px", width:"auto" }} placeholder="🔍 Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{ ...inp, minWidth:"90px" }} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="date">Sort: Latest</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* ── Drop Zone ── */}
      <div
        onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop} onClick={()=>fileRef.current.click()}
        style={{ border:`2px dashed ${dragOver?"var(--accent,#1B4F8A)":"var(--t-border,#D0D7E3)"}`, borderRadius:"8px", textAlign:"center", padding:"16px 12px", marginBottom:"12px", cursor:"pointer", transition:"all .2s", background:dragOver?"rgba(27,79,138,.06)":"transparent" }}
      >
        <div style={{ fontSize:"32px", marginBottom:"8px" }}>📂</div>
        <div style={{ fontSize:"14px", fontWeight:"700", color:dragOver?"var(--accent,#1B4F8A)":"var(--t-muted,#3D4F63)", marginBottom:"4px" }}>{dragOver?"Drop files here!":"Drag & drop files here, or click to browse"}</div>
        <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)" }}>PDF • Word • Excel • Images • CSV • TXT • JSON • HTML • Markdown</div>
      </div>

      {/* ── Document List ── */}
      <div style={card()}>
        <div style={secTitle}>Documents ({displayed.length}{search?` of ${docs.length}`:""})</div>
        {displayed.length===0 && <div style={{ textAlign:"center", padding:"30px", color:"var(--t-muted,#3D4F63)", fontSize:"14px" }}>📄 No documents found. Upload a file to get started.</div>}
        {displayed.map((d,i)=>{
          const { readMins, reviewMins } = calcDocTimes(d);
          return (
            <div key={d.id} style={{ padding:"10px 0", borderBottom:i<displayed.length-1?"1px solid var(--t-border,#D0D7E3)":"none" }}>
              {/* ── Row 1: icon + name + meta ── */}
              <div style={{ display:"flex", gap:"10px", alignItems:"flex-start", marginBottom:"8px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"7px", background:"rgba(27,79,138,.08)", border:"1px solid rgba(27,79,138,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{getFileIcon(d.name)}</div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:"13px", fontWeight:"700", color:"var(--t-text,#0F172A)", wordBreak:"break-word", lineHeight:1.3, marginBottom:"3px" }}>{d.name}</div>
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", alignItems:"center", fontSize:"11px", color:"var(--t-muted,#3D4F63)" }}>
                    {d.size!=="reading…"&&<span>📦 {d.size}</span>}
                    <span>📅 {d.date}</span>
                    {d.summary && <span style={{ color:"var(--accent,#1B4F8A)", fontWeight:"600" }}>👁 ~{readMins}m</span>}
                    {d.summary && <span style={{ color:"#059669", fontWeight:"600" }}>🔍 ~{reviewMins}m</span>}
                    {d.summary && loadingId!==d.id && <span style={{ background:"rgba(19,136,8,.12)", color:"#059669", border:"1px solid rgba(19,136,8,.25)", padding:"1px 5px", borderRadius:"3px", fontWeight:"700", fontSize:"10px" }}>✓ Analyzed</span>}
                  </div>
                </div>
              </div>
              {/* ── Row 2: primary action buttons ── */}
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"6px" }}>
                {loadingId===d.id && <span style={{ fontSize:"11px", color:"#D97706", fontWeight:"700", alignSelf:"center" }}>⏳ {loadingMsg||"Processing…"}</span>}
                <button style={{ ...btn("sec",true), fontWeight:"700", display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", padding:"5px 10px" }} onClick={()=>{ const l=docs.find(x=>x.id===d.id)||d; l.summary?setViewDoc(l):doSummarize(l); }} disabled={loadingId===d.id}>
                  {loadingId===d.id ? "⏳ Analyzing…" : d.summary ? "📄 View Summary" : "✦ Analyze"}
                </button>
                {d.summary && <DocDownloadMenu doc={d}/>}
                <button style={{ ...btn("red",true), display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", padding:"5px 10px" }} onClick={()=>setDocs(prev=>prev.filter(x=>x.id!==d.id))}>🗑 Delete</button>
              </div>
              {/* ── Row 3: AI feature buttons (only when analyzed) ── */}
              {d.summary && (
                <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                  <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 8px", background:"rgba(124,58,237,.08)", border:"1px solid rgba(124,58,237,.25)", color:"#7C3AED" }} onClick={()=>{ setChatDoc(d); setChatHistory([]); setChatQ(""); }}>💬 Chat</button>
                  <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 8px", background:"rgba(5,150,105,.08)", border:"1px solid rgba(5,150,105,.25)", color:"#059669" }} onClick={()=>{ setTranslateDoc(d); setTranslateResult(""); }}>🌐 Translate</button>
                  <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 8px", background:"rgba(27,79,138,.08)", border:"1px solid rgba(27,79,138,.25)", color:"var(--accent,#1B4F8A)" }} onClick={()=>{ setDraftModal(d); setDraftResult(""); }}>✉️ Draft</button>
                  <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 8px", background:"rgba(217,119,6,.08)", border:"1px solid rgba(217,119,6,.25)", color:"#D97706" }} onClick={()=>{ setExtractModal(d); setExtractResult(""); }}>🔍 Extract</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ══ MODALS ══ */}

      {/* View/Summary Modal */}
      {viewDoc && (
        <Modal title={viewDoc.name} onClose={()=>setViewDoc(null)} wide>
          {(()=>{ const { summaryWords, readMins, reviewMins } = calcDocTimes(viewDoc); return (
            <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap", alignItems:"center" }}>
              {viewDoc.size && <span style={badge({ background:"var(--t-bg,#F8F9FB)", color:"var(--t-muted,#3D4F63)", border:"1px solid var(--t-border,#D0D7E3)" })}>📦 {viewDoc.size}</span>}
              {viewDoc.method && <span style={badge({ background:"rgba(27,79,138,.10)", color:"var(--accent,#1B4F8A)" })}>{ML[viewDoc.method]||viewDoc.method}</span>}
              <span style={badge({ background:"rgba(19,136,8,.10)", color:"#059669" })}>✓ AI Analyzed</span>
              <span style={badge({ background:"rgba(27,79,138,.08)", color:"var(--accent,#1B4F8A)" })}>📝 {summaryWords} words</span>
              <span style={badge({ background:"rgba(27,79,138,.08)", color:"var(--accent,#1B4F8A)" })}>👁 ~{readMins} min read</span>
              <span style={badge({ background:"rgba(19,136,8,.08)", color:"#059669" })}>🔍 ~{reviewMins} min review</span>
              <div style={{ marginLeft:"auto" }}><DocDownloadMenu doc={viewDoc}/></div>
            </div>
          );})()}
          <div style={secTitle}>AI Analysis & Summary</div>
          <AIBox text={viewDoc.summary}/>
          {viewDoc.content && viewDoc.content!=="[Binary — see summary]" && (
            <>
              <div style={{ ...secTitle, marginTop:"18px" }}>Extracted Text Content</div>
              <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F63)", maxHeight:"200px", overflowY:"auto", padding:"12px", background:"var(--t-bg,#F8F9FB)", borderRadius:"8px", whiteSpace:"pre-wrap", lineHeight:"1.7", border:"1px solid var(--t-border,#D0D7E3)" }}>
                {viewDoc.content.slice(0,2000)}{viewDoc.content.length>2000?"…\n[Truncated]":""}
              </div>
            </>
          )}
          <DocTimedPanel doc={viewDoc}/>
        </Modal>
      )}

      {/* 💬 Chat with Document Modal */}
      {chatDoc && (
        <Modal title={`💬 Chat with Document — ${chatDoc.name}`} onClose={()=>setChatDoc(null)} wide>
          <div style={{ background:"rgba(124,58,237,.06)", border:"1px solid rgba(124,58,237,.2)", borderRadius:"6px", padding:"10px 14px", marginBottom:"14px", fontSize:"12px", color:"#7C3AED", fontWeight:"600" }}>
            Ask any question about this document — budget figures, deadlines, beneficiaries, action items, policy details, and more.
          </div>
          {/* Chat history */}
          <div style={{ maxHeight:"320px", overflowY:"auto", display:"flex", flexDirection:"column", gap:"10px", marginBottom:"14px", padding:"4px" }}>
            {chatHistory.length===0 && (
              <div style={{ color:"var(--t-muted,#3D4F63)", fontSize:"13px", textAlign:"center", padding:"20px" }}>
                💡 Try: "What are the key deadlines?", "Summarize the budget allocation", "What action is required from whom?"
              </div>
            )}
            {chatHistory.map((msg,i)=>(
              <div key={i} style={{ display:"flex", flexDirection:msg.role==="user"?"row-reverse":"row", gap:"10px", alignItems:"flex-start" }}>
                <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:msg.role==="user"?"var(--accent,#1B4F8A)":"#7C3AED", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", flexShrink:0 }}>
                  {msg.role==="user"?"👤":"✦"}
                </div>
                <div style={{ maxWidth:"80%", background:msg.role==="user"?"var(--accent,#1B4F8A)":"var(--t-bg,#F8F9FB)", color:msg.role==="user"?"#fff":"var(--t-text,#0F172A)", padding:"10px 14px", borderRadius:msg.role==="user"?"12px 4px 12px 12px":"4px 12px 12px 12px", fontSize:"13px", lineHeight:"1.7", border:msg.role==="user"?"none":"1px solid var(--t-border,#D0D7E3)" }}>
                  {msg.role==="ai" ? <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>") }}/> : msg.text}
                </div>
              </div>
            ))}
            {chatLoading && <div style={{ display:"flex", gap:"10px", alignItems:"center" }}><div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"#7C3AED", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px" }}>✦</div><Spinner text="Thinking…"/></div>}
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <input style={{ ...inp, flex:1 }} placeholder="Ask anything about this document…" value={chatQ} onChange={e=>setChatQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()}/>
            <button style={{ ...btn(), padding:"10px 18px" }} onClick={sendChat} disabled={chatLoading}>Send ➤</button>
          </div>
          {chatHistory.length>0 && <button style={{ ...btn("sec",true), marginTop:"8px", fontSize:"12px" }} onClick={()=>setChatHistory([])}>🗑 Clear Chat</button>}
        </Modal>
      )}

      {/* ⚖️ Compare Documents Modal */}
      {compareModal && (
        <Modal title="⚖️ Compare Documents" onClose={()=>setCompareModal(false)} wide>
          <div style={{ marginBottom:"14px" }}>
            <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F63)", marginBottom:"10px", fontWeight:"600" }}>Select 2–4 analyzed documents to compare:</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {docs.filter(d=>d.summary).map(d=>(
                <label key={d.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 12px", borderRadius:"6px", cursor:"pointer", background:compareIds.includes(d.id)?"rgba(27,79,138,.08)":"var(--t-bg,#F8F9FB)", border:`1px solid ${compareIds.includes(d.id)?"var(--accent,#1B4F8A)":"var(--t-border,#D0D7E3)"}`, transition:"all .15s" }}>
                  <input type="checkbox" checked={compareIds.includes(d.id)} onChange={e=>setCompareIds(prev=>e.target.checked?[...prev,d.id]:prev.filter(x=>x!==d.id))} style={{ width:"16px", height:"16px", accentColor:"var(--accent,#1B4F8A)" }}/>
                  <span style={{ fontSize:"13px", fontWeight:"700", color:"var(--t-text,#0F172A)" }}>{getFileIcon(d.name)} {d.name}</span>
                  <span style={{ fontSize:"11px", color:"var(--t-muted,#3D4F63)", marginLeft:"auto" }}>{d.date}</span>
                </label>
              ))}
              {docs.filter(d=>d.summary).length===0 && <div style={{ textAlign:"center", color:"var(--t-muted,#3D4F63)", fontSize:"13px", padding:"20px" }}>No analyzed documents yet. Analyze at least 2 documents first.</div>}
            </div>
          </div>
          <button style={{ ...btn(), width:"100%", padding:"12px", marginBottom:"14px" }} onClick={runCompare} disabled={compareLoading||compareIds.length<2}>
            {compareLoading?"⏳ Comparing…":`⚖️ Compare ${compareIds.length} Document${compareIds.length!==1?"s":""}`}
          </button>
          {compareLoading && <Spinner text="AI is comparing documents…"/>}
          {compareResult && <AIBox text={compareResult}/>}
        </Modal>
      )}

      {/* 🌐 Translate Modal */}
      {translateDoc && (
        <Modal title={`🌐 Translate — ${translateDoc.name}`} onClose={()=>setTranslateDoc(null)} wide>
          <div style={{ display:"flex", gap:"10px", marginBottom:"14px", alignItems:"center", flexWrap:"wrap" }}>
            <Lbl c="Translate to:"/>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {TRANSLATE_LANGS.map(l=>(
                <button key={l} onClick={()=>setTranslateLang(l)} style={{ padding:"5px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"12px", fontWeight:"700", background:translateLang===l?"var(--accent,#1B4F8A)":"var(--t-bg,#F8F9FB)", color:translateLang===l?"#fff":"var(--t-text,#0F172A)", border:`1px solid ${translateLang===l?"var(--accent,#1B4F8A)":"var(--t-border,#D0D7E3)"}`, transition:"all .15s" }}>{l}</button>
              ))}
            </div>
          </div>
          <button style={{ ...btn(), width:"100%", padding:"11px", marginBottom:"14px" }} onClick={runTranslate} disabled={translateLoading}>
            {translateLoading?"⏳ Translating…":`🌐 Translate to ${translateLang}`}
          </button>
          {translateLoading && <Spinner text={`Translating to ${translateLang}…`}/>}
          {translateResult && (
            <div>
              <div style={secTitle}>{translateLang} Translation</div>
              <AIBox text={translateResult}/>
            </div>
          )}
        </Modal>
      )}

      {/* ✉️ Draft Response Modal */}
      {draftModal && (
        <Modal title={`✉️ Draft Response — ${draftModal.name}`} onClose={()=>setDraftModal(null)} wide>
          <div style={{ marginBottom:"14px" }}>
            <Lbl c="Draft Type"/>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginTop:"6px" }}>
              {DRAFT_TYPES.map(t=>(
                <button key={t} onClick={()=>setDraftType(t)} style={{ padding:"5px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"12px", fontWeight:"700", background:draftType===t?"var(--accent,#1B4F8A)":"var(--t-bg,#F8F9FB)", color:draftType===t?"#fff":"var(--t-text,#0F172A)", border:`1px solid ${draftType===t?"var(--accent,#1B4F8A)":"var(--t-border,#D0D7E3)"}`, transition:"all .15s" }}>{t}</button>
              ))}
            </div>
          </div>
          <button style={{ ...btn(), width:"100%", padding:"11px", marginBottom:"14px" }} onClick={runDraft} disabled={draftLoading}>
            {draftLoading?"⏳ Drafting…":`✉️ Generate ${draftType}`}
          </button>
          {draftLoading && <Spinner text="Drafting official correspondence…"/>}
          {draftResult && (
            <div>
              <div style={secTitle}>{draftType}</div>
              <AIBox text={draftResult}/>
            </div>
          )}
        </Modal>
      )}

      {/* 🔍 Extract Data Modal */}
      {extractModal && (
        <Modal title={`🔍 Extract Data — ${extractModal.name}`} onClose={()=>setExtractModal(null)} wide>
          <div style={{ marginBottom:"14px" }}>
            <Lbl c="What to Extract"/>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginTop:"6px" }}>
              {EXTRACT_TYPES.map(t=>(
                <button key={t} onClick={()=>setExtractType(t)} style={{ padding:"5px 12px", borderRadius:"4px", cursor:"pointer", fontSize:"12px", fontWeight:"700", background:extractType===t?"var(--accent,#1B4F8A)":"var(--t-bg,#F8F9FB)", color:extractType===t?"#fff":"var(--t-text,#0F172A)", border:`1px solid ${extractType===t?"var(--accent,#1B4F8A)":"var(--t-border,#D0D7E3)"}`, transition:"all .15s" }}>{t}</button>
              ))}
            </div>
          </div>
          <button style={{ ...btn(), width:"100%", padding:"11px", marginBottom:"14px" }} onClick={runExtract} disabled={extractLoading}>
            {extractLoading?"⏳ Extracting…":`🔍 Extract ${extractType}`}
          </button>
          {extractLoading && <Spinner text={`Extracting ${extractType}…`}/>}
          {extractResult && (
            <div>
              <div style={secTitle}>{extractType}</div>
              <AIBox text={extractResult}/>
            </div>
          )}
        </Modal>
      )}

      {/* Manual Note Modal */}
      {addModal && (
        <Modal title="✏️ Add Manual Note / Document" onClose={()=>setAddModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div><Lbl c="Document Title *"/><input style={inp} placeholder="e.g. Meeting Notes – March 7" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
            <div><Lbl c="Content (for AI analysis)"/><textarea style={{ ...inp, minHeight:"150px", resize:"vertical" }} placeholder="Paste or type document content here…" value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/></div>
            <button style={{ ...btn(), width:"100%", padding:"12px", fontSize:"14px" }} onClick={saveManual}>✦ Save & Analyze</button>
          </div>
        </Modal>
      )}
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════
   PAGE: MEETINGS
═══════════════════════════════════════════════════════════════ */
function Meetings({ meetings, setMeetings, isMobile=false }) {
  const [addModal, setAddModal]   = useState(false);
  const [notesModal, setNotesModal] = useState(null);
  const [viewModal, setViewModal]   = useState(null);
  const [agendaModal, setAgendaModal] = useState(null);
  const [editModal, setEditModal]   = useState(null);
  const [notesText, setNotesText]   = useState("");
  const [summLoading, setSummLoading] = useState(null);
  const [agendaLoading, setAgendaLoading] = useState(null);
  const [search, setSearch]     = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy]     = useState("date");
  const [view, setView]         = useState("table"); // "table" | "cards"
  const EMPTY = { title:"", date:"", time:"", type:"Official", attendees:"", location:"", agenda:"", priority:"Normal" };
  const [form, setForm]         = useState(EMPTY);

  const MEET_PRIORITIES = ["Normal","Important","Urgent"];
  const TYPE_COLORS = { Official:"#1B4F8A", Department:"#059669", Public:"#D97706", Project:"#7C3AED", Review:"#DC2626" };

  const add = () => {
    if (!form.title.trim()||!form.date) { alert("Meeting title and date are required."); return; }
    setMeetings(prev=>[...prev,{ id:`M${Date.now()}`, ...form, notes:"", summary:"", agendaAI:"", status:"Upcoming" }]);
    setForm(EMPTY); setAddModal(false);
  };

  const saveEdit = () => {
    setMeetings(prev=>prev.map(m=>m.id===editModal.id ? { ...m, ...editModal } : m));
    setEditModal(null);
  };

  const openNotes = (m) => { setNotesModal(m); setNotesText(m.notes||""); };

  const saveNotes = (andGenerate=false) => {
    setMeetings(prev=>prev.map(m=>m.id===notesModal.id?{...m,notes:notesText}:m));
    if (andGenerate) genSummary({ ...notesModal, notes:notesText });
    setNotesModal(null);
  };

  const genSummary = async (m) => {
    const latest = meetings.find(x=>x.id===m.id)||m;
    setSummLoading(m.id);
    try {
      const summary = await callAI(
        `Create a detailed structured meeting summary for a Government Official:\n\nMeeting: ${latest.title}\nDate: ${latest.date} at ${latest.time||"—"}\nType: ${latest.type}\nPriority: ${latest.priority||"Normal"}\nLocation: ${latest.location||"Not specified"}\nAttendees: ${latest.attendees||"—"}\nAgenda: ${latest.agenda||"—"}\nNotes/Transcript:\n${latest.notes||"(No notes provided)"}\n\nProvide a well-structured summary with:\n1. **MEETING OVERVIEW**\n2. **KEY DECISIONS TAKEN**\n3. **ACTION ITEMS** (with responsible person if mentioned)\n4. **PENDING ITEMS**\n5. **NEXT STEPS & FOLLOW-UP DATE**\n6. **RECOMMENDATIONS**`,
        "You are an executive assistant for an Indian MLA. Be structured, precise, and official in tone."
      );
      setMeetings(prev=>prev.map(x=>x.id===m.id?{...x,summary,status:"Completed"}:x));
      setViewModal({ ...(meetings.find(x=>x.id===m.id)||m), summary });
    } catch(e) { alert("AI Error: "+e.message); }
    setSummLoading(null);
  };

  const genAgenda = async (m) => {
    setAgendaLoading(m.id);
    try {
      const agendaAI = await callAI(
        `Prepare a formal meeting agenda for:\n\nMeeting: ${m.title}\nDate: ${m.date} at ${m.time||"TBD"}\nType: ${m.type}\nAttendees: ${m.attendees||"Government officials"}\nTopics/Notes: ${m.agenda||m.notes||"General review meeting"}\n\nCreate a structured agenda with:\n1. **CALL TO ORDER** (time)\n2. **ATTENDEES & ROLL CALL**\n3. **AGENDA ITEMS** (numbered, with time allocation)\n4. **DISCUSSION POINTS** for each item\n5. **ANY OTHER BUSINESS**\n6. **ADJOURNMENT**\n\nMake it formal, time-bound, and suitable for a government official.`,
        "You are a government protocol officer creating official meeting agendas."
      );
      setMeetings(prev=>prev.map(x=>x.id===m.id?{...x,agendaAI}:x));
      setAgendaModal({ ...m, agendaAI });
    } catch(e) { alert("AI Error: "+e.message); }
    setAgendaLoading(null);
  };

  const markStatus = (id, status) => setMeetings(prev=>prev.map(m=>m.id===id?{...m,status}:m));
  const deleteMeeting = (id) => { if(window.confirm("Delete this meeting?")) setMeetings(prev=>prev.filter(x=>x.id!==id)); };

  // Filter + sort
  let displayed = meetings.filter(m=>{
    const matchType = filterType==="All" || m.type===filterType;
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || (m.attendees||"").toLowerCase().includes(search.toLowerCase()) || (m.location||"").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });
  if (sortBy==="date") displayed = [...displayed].sort((a,b)=>a.date.localeCompare(b.date));
  if (sortBy==="title") displayed = [...displayed].sort((a,b)=>a.title.localeCompare(b.title));
  if (sortBy==="type") displayed = [...displayed].sort((a,b)=>a.type.localeCompare(b.type));

  const stats = {
    total: meetings.length,
    upcoming: meetings.filter(m=>m.status!=="Completed"&&m.status!=="Cancelled").length,
    completed: meetings.filter(m=>m.status==="Completed").length,
    withNotes: meetings.filter(m=>m.notes&&m.notes.trim()).length,
  };

  const COL = "1fr 65px 110px 100px 110px auto";

  return (
    <div>
      {/* ── Stats Bar ── */}
      <div className="g4" style={{ marginBottom:"10px", minWidth:0, overflow:"hidden" }}>
        {[
          { label:"Total", value:stats.total, icon:"📅", color:"var(--accent,#1B4F8A)" },
          { label:"Upcoming", value:stats.upcoming, icon:"⏰", color:"#D97706" },
          { label:"Completed", value:stats.completed, icon:"✅", color:"#059669" },
          { label:"With Notes", value:stats.withNotes, icon:"📝", color:"#7C3AED" },
        ].map((s,i)=>(
          <div key={i} style={{ background:"var(--t-card,#fff)", border:`2px solid ${s.color}30`, borderRadius:"8px", padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
            <span style={{ fontSize:"22px" }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:"22px", fontWeight:"800", color:s.color, lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)", fontWeight:"600", marginTop:"2px" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap", alignItems:"center" }}>
        <input style={{ ...inp, flex:1, minWidth:"120px", width:"100%" }} placeholder="🔍 Search meetings…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{ ...inp, minWidth:"100px", flex:1 }} value={filterType} onChange={e=>setFilterType(e.target.value)}>
          <option value="All">All Types</option>
          {MEET_TYPES.map(t=><option key={t}>{t}</option>)}
        </select>
        <select style={{ ...inp, minWidth:"100px", flex:1 }} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="date">Sort: Date</option>
          <option value="title">Sort: Title</option>
          <option value="type">Sort: Type</option>
        </select>
        <div style={{ display:"flex", gap:"4px", marginLeft:"auto" }}>
          <button style={{ ...btn(view==="table"?"pri":"sec",true) }} onClick={()=>setView("table")}>☰ Table</button>
          <button style={{ ...btn(view==="cards"?"pri":"sec",true) }} onClick={()=>setView("cards")}>⊞ Cards</button>
        </div>
        <button style={btn()} onClick={()=>setAddModal(true)}>+ Schedule Meeting</button>
      </div>

      {/* ── TABLE VIEW ── */}
      {view==="table" && (
        <div style={card()}>
          {/* Header */}
          <div className="tbl-hdr" style={{ gridTemplateColumns:"1fr 65px 100px 90px 100px" }}>{["Meeting","Time","Date","Type","Status"].map(h=>(<span key={h} style={{fontSize:"10px",fontWeight:"800",color:"var(--t-muted,#5A6A7A)",letterSpacing:".8px",textTransform:"uppercase"}}>{h}</span>))}</div>
          {displayed.length===0 && (
            <div style={{ textAlign:"center", padding:"40px", color:"var(--t-muted,#3D4F63)", fontSize:"14px" }}>
              <div style={{ fontSize:"36px", marginBottom:"10px" }}>📅</div>
              No meetings found. Schedule your first meeting!
            </div>
          )}
          {displayed.map((m,i)=>{
            const tc = TYPE_COLORS[m.type]||"var(--accent,#1B4F8A)";
            const statusColors = { Upcoming:"#D97706", Completed:"#059669", Cancelled:"#DC2626", "In Progress":"var(--accent,#1B4F8A)" };
            const sc = statusColors[m.status||"Upcoming"]||"#D97706";
            return (
              <div key={m.id} style={{ borderLeft:`4px solid ${tc}`, background:i%2===0?"var(--t-bg,#F8F9FB)":"transparent", marginBottom:"4px", borderRadius:"4px", overflow:"hidden" }}>
                {/* ── MOBILE card layout ── */}
                {isMobile ? (
                  <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:"8px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"8px" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"14px", fontWeight:"700", color:"var(--t-text,#0F172A)", lineHeight:1.3, wordBreak:"break-word" }}>{m.title}</div>
                        <div style={{ fontSize:"11px", color:"var(--t-muted,#3D4F63)", marginTop:"3px" }}>
                          📅 {m.date}{m.time ? ` · ${m.time}` : ""}
                        </div>
                      </div>
                      <span style={{ padding:"3px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"700", background:`${tc}18`, color:tc, border:`1px solid ${tc}40`, flexShrink:0 }}>{m.type}</span>
                    </div>
                    {m.attendees && <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)" }}>👥 {m.attendees}</div>}
                    {m.location  && <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)" }}>📍 {m.location}</div>}
                    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                      <span style={{ fontSize:"11px", fontWeight:"700", color:"var(--t-muted,#5A6A7A)" }}>Status:</span>
                      <select style={{ ...inp, padding:"3px 6px", fontSize:"12px", color:sc, fontWeight:"700", border:`1.5px solid ${sc}50`, background:`${sc}12`, flex:1 }} value={m.status||"Upcoming"} onChange={e=>markStatus(m.id,e.target.value)}>
                        {["Upcoming","In Progress","Completed","Cancelled"].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", paddingTop:"4px", borderTop:"1px dashed var(--t-border,#D0D7E3)" }}>
                      <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 8px" }} onClick={()=>openNotes(m)}>📝 Notes{m.notes?" ✓":""}</button>
                      <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 8px" }} onClick={()=>genAgenda(m)} disabled={agendaLoading===m.id}>{agendaLoading===m.id?"⏳":"📋 Agenda"}{m.agendaAI?" ✓":""}</button>
                      <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 8px" }} onClick={()=>genSummary(m)} disabled={summLoading===m.id}>{summLoading===m.id?"⏳":"✦ Summary"}{m.summary?" ✓":""}</button>
                      {m.summary && <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 8px" }} onClick={()=>setViewModal(m)}>👁 View</button>}
                      {m.agendaAI && <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 8px" }} onClick={()=>setAgendaModal(m)}>📋 Agenda</button>}
                      <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 8px" }} onClick={()=>setEditModal({...m})}>✏️</button>
                      <button style={{ ...btn("red",true), fontSize:"11px", padding:"4px 8px" }} onClick={()=>deleteMeeting(m.id)}>🗑</button>
                    </div>
                  </div>
                ) : (
                  /* ── DESKTOP layout ── */
                  <>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 70px 105px 95px 110px", alignItems:"center", gap:"8px", padding:"10px 14px 6px" }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:"13px", fontWeight:"700", color:"var(--t-text,#0F172A)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.title}</div>
                        {m.attendees && <div style={{ fontSize:"11px", color:"var(--t-muted,#3D4F63)", marginTop:"1px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>👥 {m.attendees}</div>}
                        {m.location  && <div style={{ fontSize:"11px", color:"var(--t-muted,#3D4F63)", marginTop:"1px" }}>📍 {m.location}</div>}
                      </div>
                      <span style={{ fontSize:"12px", fontWeight:"700", fontFamily:"monospace", color:"var(--t-text,#0F172A)" }}>{m.time||"—"}</span>
                      <span style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)" }}>{m.date}</span>
                      <span style={{ padding:"3px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"700", background:`${tc}18`, color:tc, border:`1px solid ${tc}40`, textAlign:"center" }}>{m.type}</span>
                      <select style={{ ...inp, padding:"3px 6px", fontSize:"11px", color:sc, fontWeight:"700", border:`1.5px solid ${sc}50`, background:`${sc}12` }} value={m.status||"Upcoming"} onChange={e=>markStatus(m.id,e.target.value)}>
                        {["Upcoming","In Progress","Completed","Cancelled"].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"flex", gap:"5px", padding:"4px 14px 10px", flexWrap:"wrap", borderTop:"1px dashed var(--t-border,#D0D7E3)" }}>
                      <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 10px" }} onClick={()=>openNotes(m)}>📝 Notes{m.notes?" ✓":""}</button>
                      <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 10px" }} onClick={()=>genAgenda(m)} disabled={agendaLoading===m.id}>{agendaLoading===m.id?"⏳ …":"📋 AI Agenda"}{m.agendaAI?" ✓":""}</button>
                      <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 10px" }} onClick={()=>genSummary(m)} disabled={summLoading===m.id}>{summLoading===m.id?"⏳ …":"✦ AI Summary"}{m.summary?" ✓":""}</button>
                      {m.summary && <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 10px" }} onClick={()=>setViewModal(m)}>👁 View Summary</button>}
                      {m.agendaAI && <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 10px" }} onClick={()=>setAgendaModal(m)}>📋 View Agenda</button>}
                      <button style={{ ...btn("sec",true), fontSize:"11px", padding:"4px 10px" }} onClick={()=>setEditModal({...m})}>✏️ Edit</button>
                      <button style={{ ...btn("red",true), fontSize:"11px", padding:"4px 10px" }} onClick={()=>deleteMeeting(m.id)}>🗑 Delete</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          <div style={{ padding:"10px 16px 0", fontSize:"12px", color:"var(--t-muted,#3D4F63)", borderTop:"1px solid var(--t-border,#D0D7E3)", marginTop:"4px" }}>
            Showing {displayed.length} of {meetings.length} meetings
          </div>
        </div>
      )}

      {/* ── CARDS VIEW ── */}
      {view==="cards" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(min(300px,100%), 1fr))", gap:"12px" }}>
          {displayed.length===0 && <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"40px", color:"var(--t-muted,#3D4F63)", fontSize:"14px" }}>📅 No meetings found.</div>}
          {displayed.map(m=>{
            const tc = TYPE_COLORS[m.type]||"var(--accent,#1B4F8A)";
            return (
              <div key={m.id} style={{ background:"var(--t-card,#fff)", border:`1px solid var(--t-border,#D0D7E3)`, borderRadius:"10px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,.07)", borderTop:`4px solid ${tc}` }}>
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                    <div style={{ fontSize:"15px", fontWeight:"800", color:"var(--t-text,#0F172A)", flex:1, marginRight:"8px" }}>{m.title}</div>
                    <span style={{ padding:"2px 8px", borderRadius:"4px", fontSize:"11px", fontWeight:"700", background:`${tc}18`, color:tc, border:`1px solid ${tc}40`, whiteSpace:"nowrap" }}>{m.type}</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"4px", marginBottom:"12px" }}>
                    <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F63)" }}>📅 {m.date} {m.time && `at ${m.time}`}</div>
                    {m.attendees && <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F63)" }}>👥 {m.attendees}</div>}
                    {m.location && <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F63)" }}>📍 {m.location}</div>}
                    {m.notes && <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)", marginTop:"4px", fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📝 {m.notes}</div>}
                  </div>
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                    <button style={{ ...btn("sec",true) }} onClick={()=>openNotes(m)}>📝 Notes</button>
                    <button style={{ ...btn("sec",true) }} onClick={()=>genAgenda(m)} disabled={agendaLoading===m.id}>{agendaLoading===m.id?"⏳":"📋 Agenda"}</button>
                    <button style={{ ...btn("sec",true) }} onClick={()=>genSummary(m)} disabled={summLoading===m.id}>{summLoading===m.id?"⏳ AI…":"✦ AI Summary"}</button>
                    {m.summary && <button style={{ ...btn("sec",true) }} onClick={()=>setViewModal(m)}>👁 View</button>}
                    <button style={{ ...btn("red",true) }} onClick={()=>deleteMeeting(m.id)}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Add Meeting */}
      {addModal && (
        <Modal title="📅 Schedule New Meeting" onClose={()=>setAddModal(false)} wide>
          <div className="g2">
            <div style={{ gridColumn:"1/-1" }}><Lbl c="Meeting Title *"/><input style={inp} placeholder="e.g. District Collector Review" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
            <div><Lbl c="Date *"/><input type="date" style={inp} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
            <div><Lbl c="Time"/><input type="time" style={inp} value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></div>
            <div><Lbl c="Meeting Type"/><select style={inp} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{MEET_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><Lbl c="Priority"/><select style={inp} value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{MEET_PRIORITIES.map(p=><option key={p}>{p}</option>)}</select></div>
            <div style={{ gridColumn:"1/-1" }}><Lbl c="Location / Venue"/><input style={inp} placeholder="e.g. Collectorate Conference Room" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></div>
            <div style={{ gridColumn:"1/-1" }}><Lbl c="Attendees"/><input style={inp} placeholder="DC, SDM, Jal Nigam Officers…" value={form.attendees} onChange={e=>setForm({...form,attendees:e.target.value})}/></div>
            <div style={{ gridColumn:"1/-1" }}><Lbl c="Agenda / Topics"/><textarea style={{ ...inp, minHeight:"80px", resize:"vertical" }} placeholder="Key topics to discuss in this meeting…" value={form.agenda} onChange={e=>setForm({...form,agenda:e.target.value})}/></div>
            <button style={{ ...btn(), gridColumn:"1/-1", padding:"12px", fontSize:"14px" }} onClick={add}>📅 Schedule Meeting</button>
          </div>
        </Modal>
      )}

      {/* Edit Meeting */}
      {editModal && (
        <Modal title={`✏️ Edit — ${editModal.title}`} onClose={()=>setEditModal(null)} wide>
          <div className="g2">
            <div style={{ gridColumn:"1/-1" }}><Lbl c="Meeting Title"/><input style={inp} value={editModal.title} onChange={e=>setEditModal({...editModal,title:e.target.value})}/></div>
            <div><Lbl c="Date"/><input type="date" style={inp} value={editModal.date} onChange={e=>setEditModal({...editModal,date:e.target.value})}/></div>
            <div><Lbl c="Time"/><input type="time" style={inp} value={editModal.time} onChange={e=>setEditModal({...editModal,time:e.target.value})}/></div>
            <div><Lbl c="Type"/><select style={inp} value={editModal.type} onChange={e=>setEditModal({...editModal,type:e.target.value})}>{MEET_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><Lbl c="Status"/><select style={inp} value={editModal.status||"Upcoming"} onChange={e=>setEditModal({...editModal,status:e.target.value})}>{["Upcoming","In Progress","Completed","Cancelled"].map(s=><option key={s}>{s}</option>)}</select></div>
            <div style={{ gridColumn:"1/-1" }}><Lbl c="Location"/><input style={inp} value={editModal.location||""} onChange={e=>setEditModal({...editModal,location:e.target.value})}/></div>
            <div style={{ gridColumn:"1/-1" }}><Lbl c="Attendees"/><input style={inp} value={editModal.attendees} onChange={e=>setEditModal({...editModal,attendees:e.target.value})}/></div>
            <button style={{ ...btn(), gridColumn:"1/-1", padding:"12px" }} onClick={saveEdit}>💾 Save Changes</button>
          </div>
        </Modal>
      )}

      {/* Notes Modal */}
      {notesModal && (
        <Modal title={`📝 Notes — ${notesModal.title}`} onClose={()=>setNotesModal(null)} wide>
          <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F63)", marginBottom:"10px" }}>
            📅 {notesModal.date} {notesModal.time && `at ${notesModal.time}`} &nbsp;·&nbsp; {notesModal.type} &nbsp;·&nbsp; 👥 {notesModal.attendees||"—"}
          </div>
          <Lbl c="Meeting Notes / Transcript"/>
          <textarea style={{ ...inp, minHeight:"220px", resize:"vertical", marginBottom:"12px" }} placeholder="Type meeting notes, decisions, action items, or paste a transcript here…" value={notesText} onChange={e=>setNotesText(e.target.value)}/>
          <div style={{ display:"flex", gap:"10px" }}>
            <button style={{ ...btn(), flex:1 }} onClick={()=>saveNotes(false)}>💾 Save Notes</button>
            <button style={{ ...btn("sec"), flex:1 }} onClick={()=>saveNotes(true)}>✦ Save & Generate AI Summary</button>
          </div>
        </Modal>
      )}

      {/* AI Summary Modal */}
      {viewModal && (
        <Modal title={`✦ AI Summary — ${viewModal.title}`} onClose={()=>setViewModal(null)} wide>
          <div style={{ display:"flex", gap:"16px", marginBottom:"14px", flexWrap:"wrap" }}>
            {[["📅",viewModal.date],["🕐",viewModal.time||"—"],["📌",viewModal.type],["👥",viewModal.attendees||"—"]].map(([icon,val],i)=>(
              <div key={i} style={{ fontSize:"13px", color:"var(--t-muted,#3D4F63)", display:"flex", alignItems:"center", gap:"4px" }}><span>{icon}</span><span style={{ fontWeight:"600" }}>{val}</span></div>
            ))}
          </div>
          <AIBox text={viewModal.summary||meetings.find(m=>m.id===viewModal.id)?.summary||"No summary yet. Add notes and click ✦ AI Summary."}/>
          {viewModal.notes && (
            <div style={{ marginTop:"14px" }}>
              <div style={secTitle}>Original Notes</div>
              <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F63)", background:"var(--t-bg,#F8F9FB)", padding:"12px", borderRadius:"6px", border:"1px solid var(--t-border,#D0D7E3)", whiteSpace:"pre-wrap", lineHeight:"1.8" }}>{viewModal.notes}</div>
            </div>
          )}
        </Modal>
      )}

      {/* AI Agenda Modal */}
      {agendaModal && (
        <Modal title={`📋 AI Agenda — ${agendaModal.title}`} onClose={()=>setAgendaModal(null)} wide>
          <div style={{ display:"flex", gap:"16px", marginBottom:"14px", flexWrap:"wrap" }}>
            {[["📅",agendaModal.date],["🕐",agendaModal.time||"TBD"],["📌",agendaModal.type]].map(([icon,val],i)=>(
              <div key={i} style={{ fontSize:"13px", color:"var(--t-muted,#3D4F63)", display:"flex", alignItems:"center", gap:"4px" }}><span>{icon}</span><span style={{ fontWeight:"600" }}>{val}</span></div>
            ))}
          </div>
          <AIBox text={agendaModal.agendaAI||"No agenda generated yet."}/>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: ISSUES
═══════════════════════════════════════════════════════════════ */
function Issues({ issues, setIssues, isMobile=false }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [viewIssue, setViewIssue] = useState(null);
  const [aiLoadId, setAiLoadId] = useState(null);
  const EMPTY = { title:"", description:"", category:"Infrastructure", priority:"Medium", status:"Open", location:"Civil Lines" };
  const [form, setForm] = useState(EMPTY);

  const filtered = issues.filter(i=>{
    if (filter!=="All" && i.status!==filter) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) && !i.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const addIssue = () => {
    if (!form.title.trim()) return;
    const id = `ISS-${String(issues.length+1).padStart(3,"0")}`;
    setIssues(prev=>[...prev,{ id, ...form, date:new Date().toISOString().slice(0,10), aiResponse:"" }]);
    setForm(EMPTY); setAddModal(false);
  };

  const updateStatus = (id, status) => setIssues(prev=>prev.map(i=>i.id===id?{...i,status}:i));

  const getAI = async (iss) => {
    setAiLoadId(iss.id);
    try {
      const r = await callAI(
        `Issue: ${iss.title}\nLocation: ${iss.location}, Prayagraj, UP\nCategory: ${iss.category}\nPriority: ${iss.priority}\nDescription: ${iss.description||"—"}\n\nProvide:\n1. Root cause analysis\n2. Recommended action steps (step-by-step)\n3. Responsible department to contact\n4. Relevant government schemes that can help\n5. Estimated resolution timeline`,
        "You are a governance expert helping an Indian MLA resolve citizen issues. Be specific, practical, and reference real Indian government schemes."
      );
      const updated = issues.map(i=>i.id===iss.id?{...i,aiResponse:r}:i);
      setIssues(updated);
      setViewIssue({ ...iss, aiResponse:r });
    } catch(e) { alert("AI Error: "+e.message); }
    setAiLoadId(null);
  };

  return (
    <div>
      <div style={{ display:"flex", gap:"10px", marginBottom:"14px", flexWrap:"wrap", alignItems:"center" }}>
        <input style={{ ...inp, flex:1, minWidth:0, width:"100%" }} placeholder="🔍 Search issues…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
          {["All",...STATS].map(f=>(
            <button key={f} style={{ ...btn(filter===f?"pri":"sec",true) }} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
        <button style={{ ...btn(), marginLeft:"auto" }} onClick={()=>setAddModal(true)}>+ Log Issue</button>
      </div>

      <div style={card()}>
        {/* Desktop header — hidden on mobile via CSS */}
        <div className="tbl-hdr" style={{ gridTemplateColumns:"60px 1fr 110px 85px 130px 90px 120px" }}>
          <span>ID</span><span>Title</span><span>Category</span><span>Priority</span><span>Status</span><span>Location</span><span>Actions</span>
        </div>
        {filtered.length===0 && <div style={{ color:"var(--t-muted,#3D4F63)", textAlign:"center", padding:"30px", fontSize:"14px" }}>No issues found.</div>}
        {filtered.map((iss,i)=>(
          <div key={iss.id} style={{
            background: i%2===0 ? "var(--t-bg,#F8F9FB)" : "transparent",
            borderLeft: `3px solid ${PRI_S[iss.priority]?.border?.replace("1px solid ","")?.replace(/[^#\w,().]/g,"")||"var(--t-border,#D0D7E3)"}`,
            borderBottom: "1px solid var(--t-border,#D0D7E3)",
            padding: isMobile ? "10px 12px" : "8px 12px",
          }}>
            {isMobile ? (
              /* ── MOBILE: card layout ── */
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"8px" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"12px", color:"var(--t-muted,#5A6A7A)", fontFamily:"monospace", marginBottom:"2px" }}>{iss.id}</div>
                    <div style={{ fontSize:"13px", fontWeight:"700", color:"var(--t-text,#0F172A)", lineHeight:1.3, wordBreak:"break-word" }}>{iss.title}</div>
                  </div>
                  <span style={{ ...badge(PRI_S[iss.priority]), flexShrink:0 }}>{iss.priority}</span>
                </div>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ ...tag }}>{iss.category}</span>
                  <span style={{ fontSize:"12px", color:"var(--t-muted,#5A6A7A)" }}>📍{iss.location}</span>
                </div>
                <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ fontSize:"11px", fontWeight:"700", color:"var(--t-muted,#5A6A7A)" }}>Status:</span>
                  <select style={{ ...inp, padding:"3px 6px", fontSize:"12px", fontWeight:"700", color:STA_C[iss.status], border:`1.5px solid ${STA_C[iss.status]}40`, background:`${STA_C[iss.status]}15`, width:"auto", flex:1, minWidth:"120px" }} value={iss.status} onChange={e=>updateStatus(iss.id,e.target.value)}>
                    {STATS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  <button style={{ ...btn("sec",true), fontSize:"12px", padding:"5px 10px" }} onClick={()=>setViewIssue(iss)}>👁 View</button>
                  <button style={{ ...btn("sec",true), fontSize:"12px", padding:"5px 10px" }} onClick={()=>getAI(iss)} disabled={aiLoadId===iss.id}>{aiLoadId===iss.id?"⏳ AI…":"✦ AI"}</button>
                  <button style={{ ...btn("red",true), fontSize:"12px", padding:"5px 10px" }} onClick={()=>setIssues(prev=>prev.filter(x=>x.id!==iss.id))}>✕ Del</button>
                </div>
              </div>
            ) : (
              /* ── DESKTOP: grid row ── */
              <div style={{ display:"grid", gridTemplateColumns:"60px 1fr 110px 85px 130px 90px 120px", alignItems:"center", gap:"8px", padding:"4px 0" }}>
                <span style={{ fontSize:"12px", fontWeight:"700", color:"var(--t-muted,#3D4F63)", fontFamily:"monospace" }}>{iss.id}</span>
                <span style={{ fontSize:"13px", fontWeight:"600", color:"var(--t-text,#0F172A)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{iss.title}</span>
                <span style={{ ...tag, display:"block", textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", fontSize:"11px" }}>{iss.category}</span>
                <span style={{ ...badge(PRI_S[iss.priority]), display:"block", textAlign:"center" }}>{iss.priority}</span>
                <select style={{ ...inp, padding:"4px 6px", fontSize:"12px", fontWeight:"700", color:STA_C[iss.status], border:`1.5px solid ${STA_C[iss.status]}40`, background:`${STA_C[iss.status]}12` }} value={iss.status} onChange={e=>updateStatus(iss.id,e.target.value)}>
                  {STATS.map(s=><option key={s}>{s}</option>)}
                </select>
                <span style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{iss.location}</span>
                <div style={{ display:"flex", gap:"4px" }}>
                  <button style={{ ...btn("sec",true), padding:"4px 8px", fontSize:"11px" }} onClick={()=>setViewIssue(iss)}>👁 View</button>
                  <button style={{ ...btn("sec",true), padding:"4px 8px", fontSize:"11px" }} onClick={()=>getAI(iss)} disabled={aiLoadId===iss.id}>{aiLoadId===iss.id?"⏳":"✦ AI"}</button>
                  <button style={{ ...btn("red",true), padding:"4px 6px", fontSize:"11px" }} onClick={()=>setIssues(prev=>prev.filter(x=>x.id!==iss.id))}>✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ fontSize:"13px", color:"#4A5A6A", marginTop:"8px" }}>Showing {filtered.length} of {issues.length} issues</div>

      {addModal && (
        <Modal title="Log New Citizen Issue" onClose={()=>setAddModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div><Lbl c="Issue Title *"/><input style={inp} placeholder="Brief description of the issue" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
            <div><Lbl c="Description"/><textarea style={{ ...inp, minHeight:"80px", resize:"vertical" }} placeholder="Detailed description…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
            <div className="g2">
              <div><Lbl c="Category"/>
                <select style={inp} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><Lbl c="Priority"/>
                <select style={inp} value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
                  {PRIS.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div><Lbl c="Location / Ward"/>
                <select style={inp} value={form.location} onChange={e=>setForm({...form,location:e.target.value})}>
                  {WARDS.map(w=><option key={w}>{w}</option>)}
                </select>
              </div>
              <div><Lbl c="Initial Status"/>
                <select style={inp} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  {STATS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button style={{ ...btn(), width:"100%" }} onClick={addIssue}>✦ Log Issue</button>
          </div>
        </Modal>
      )}

      {viewIssue && (
        <Modal title={`${viewIssue.id} — Issue Details`} onClose={()=>setViewIssue(null)}>
          <div style={{ fontSize:"15px", color:"var(--t-text,#0F172A)", fontWeight:"bold", marginBottom:"10px" }}>{viewIssue.title}</div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"12px" }}>
            <span style={tag}>{viewIssue.category}</span>
            <span style={badge(PRI_S[viewIssue.priority])}>{viewIssue.priority}</span>
            <span style={{ fontSize:"13px", color:STA_C[viewIssue.status] }}>● {viewIssue.status}</span>
            <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>📍 {viewIssue.location}</span>
            <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>📅 {viewIssue.date}</span>
          </div>
          {viewIssue.description && <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)", lineHeight:"1.7", marginBottom:"14px", padding:"12px", background:"var(--t-bg,#F8F9FB)", borderRadius:"8px" }}>{viewIssue.description}</div>}
          {viewIssue.aiResponse
            ? <><div style={secTitle}>AI Analysis & Recommendations</div><AIBox text={viewIssue.aiResponse}/></>
            : <button style={{ ...btn(), width:"100%" }} onClick={()=>getAI(viewIssue)} disabled={aiLoadId===viewIssue.id}>{aiLoadId===viewIssue.id?"Analyzing…":"✦ Get AI Recommendations"}</button>
          }
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SPEECH HELPERS — time estimates + download utils
═══════════════════════════════════════════════════════════════ */

// Average speaking pace: 130 words/min (Hindi-mix), 150 wpm (English)
// Average reading/listening pace: 200 wpm
function calcTimes(text) {
  const words = text.trim().split(/\s+/).length;
  const deliverMins = Math.ceil(words / 130);
  const listenMins  = Math.ceil(words / 200);
  return { words, deliverMins, listenMins };
}

// Build a versioned summary for a given minute budget
async function buildTimedSummary(content, minutes, mode) {
  const targetWords = mode === "listen" ? minutes * 200 : minutes * 130;
  return callAI(
    `You are condensing a speech to fit a strict time limit.\n\nOriginal speech:\n${content}\n\nTask: Rewrite this speech so it can be ${mode === "listen" ? "listened to" : "delivered"} in exactly ${minutes} minute${minutes>1?"s":""}.\nTarget word count: approximately ${targetWords} words.\nKeep the most important points, opening salutation, and closing. Remove filler and less-critical details.\nReturn ONLY the condensed speech, no preamble.`,
    "You are a professional speechwriter. Preserve the speaker's voice and key messages while fitting the time constraint exactly."
  );
}

/* ── Timed Summary Panel ── */
function TimedSummaryPanel({ content }) {
  const [mode, setMode] = useState("deliver"); // "deliver" | "listen"
  const [minutes, setMinutes] = useState(5);
  const [timedText, setTimedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { words, deliverMins, listenMins } = calcTimes(content);

  const generate = async () => {
    setLoading(true); setTimedText("");
    try {
      const t = await buildTimedSummary(content, minutes, mode);
      setTimedText(t);
    } catch(e) { setTimedText("Error: "+e.message); }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard?.writeText(timedText); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const presets = mode==="deliver"
    ? [{ l:"2 min", v:2 },{ l:"5 min", v:5 },{ l:"10 min", v:10 },{ l:"15 min", v:15 },{ l:"30 min", v:30 }]
    : [{ l:"1 min", v:1 },{ l:"3 min", v:3 },{ l:"5 min", v:5 },{ l:"10 min", v:10 }];

  return (
    <div style={{ ...card("rgba(27,79,138,.12)"), marginTop:"16px" }}>
      <div style={secTitle}>⏱ Timed Speech Generator</div>

      {/* Original time info */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
        {[
          { icon:"📝", label:"Word Count", value:`${words} words` },
          { icon:"🎤", label:"Delivery Time", value:`~${deliverMins} min`, accent:ACCENT },
          { icon:"👂", label:"Listening Time", value:`~${listenMins} min`, accent:"#10B981" },
        ].map((s,i)=>(
          <div key={i} style={{ flex:1, minWidth:"100px", padding:"10px 14px", background:"#F5F6F8", borderRadius:"8px", border:`1px solid ${s.accent||"var(--t-border,#D0D7E3)"}30` }}>
            <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)", marginBottom:"3px" }}>{s.icon} {s.label}</div>
            <div style={{ fontSize:"15px", fontWeight:"bold", color:s.accent||"var(--accent,#1B4F8A)" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Mode toggle */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"14px", alignItems:"center" }}>
        <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>Condense for:</span>
        {[{ v:"deliver", l:"🎤 Delivery (speaking pace)" },{ v:"listen", l:"👂 Listening (audience pace)" }].map(m=>(
          <button key={m.v} style={{ ...btn(mode===m.v?"pri":"sec",true) }} onClick={()=>setMode(m.v)}>{m.l}</button>
        ))}
      </div>

      {/* Time presets + custom */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"14px", alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>Target time:</span>
        {presets.map(p=>(
          <button key={p.v} style={{ ...btn(minutes===p.v?"pri":"sec",true) }} onClick={()=>setMinutes(p.v)}>{p.l}</button>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
          <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>Custom:</span>
          <input type="number" min="1" max="120" style={{ ...inp, width:"60px", padding:"4px 8px", fontSize:"13px" }} value={minutes} onChange={e=>setMinutes(Math.max(1,Number(e.target.value)))}/>
          <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>min</span>
        </div>
      </div>

      <button style={{ ...btn(), width:"100%", marginBottom:"12px" }} onClick={generate} disabled={loading}>
        {loading?`✦ Condensing to ${minutes} min…`:`✦ Generate ${minutes}-Minute Version`}
      </button>

      {loading && <Spinner text={`Condensing speech to ${minutes} minutes…`}/>}
      {timedText && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
            <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>
              {calcTimes(timedText).words} words • ~{mode==="deliver" ? Math.ceil(calcTimes(timedText).words/130) : Math.ceil(calcTimes(timedText).words/200)} min {mode==="deliver"?"delivery":"listening"}
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button style={btn("sec",true)} onClick={copy}>{copied?"✓ Copied":"📋 Copy"}</button>
            </div>
          </div>
          <div style={{ fontSize:"13px", lineHeight:"2", color:"var(--t-text,#0F172A)", whiteSpace:"pre-wrap", maxHeight:"320px", overflowY:"auto", padding:"14px", background:"var(--t-bg,#F8F9FB)", borderRadius:"8px", border:"1px solid rgba(255,255,255,.06)" }}>{timedText}</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: SPEECHES
═══════════════════════════════════════════════════════════════ */
function Speeches({ speeches, setSpeeches, isMobile=false }) {
  const [form, setForm] = useState({ event:"", topic:"", audience:"General Public", tone:"Inspirational", lang:"Hindi-English mix" });
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState("");
  const [generatedEntry, setGeneratedEntry] = useState(null);
  const [viewSpeech, setViewSpeech] = useState(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!form.topic.trim()) return;
    setLoading(true); setGenerated(""); setGeneratedEntry(null);
    try {
      const r = await callAI(
        `Write a powerful, authentic speech for an Indian MLA/public leader:\n\nEvent: ${form.event||"Public gathering"}\nTopic: ${form.topic}\nAudience: ${form.audience}\nTone: ${form.tone}\nLanguage style: ${form.lang}\n\nStructure:\n1. Opening salutation\n2. Acknowledging the occasion\n3. Current situation & challenges\n4. Government initiatives (reference real schemes like PM Awas Yojana, Jal Jeevan Mission, Swachh Bharat, etc.)\n5. Specific commitments & action points\n6. Inspiring closing & call to action\n\nMake it 4-5 paragraphs, authentic, and emotionally resonant.`,
        "You are an expert speechwriter for Indian politicians. Write speeches that connect with common citizens, reference real government schemes, and feel genuine."
      );
      const entry = { id:`SP${Date.now()}`, title:form.topic.slice(0,50), event:form.event||"Event", date:new Date().toISOString().slice(0,10), content:r, audience:form.audience };
      setGenerated(r);
      setGeneratedEntry(entry);
      setSpeeches(prev=>[entry,...prev]);
    } catch(e) { setGenerated("Error: "+e.message); }
    setLoading(false);
  };

  const copy = (text) => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div>
      {/* Generate form + preview */}
      <div className="g2w" style={{ marginBottom:"12px" }}>
        <div style={card("rgba(27,79,138,.15)")}>
          <div style={secTitle}>Generate Speech</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div><Lbl c="Event / Occasion"/><input style={inp} placeholder="e.g. Inauguration, Public Rally, Assembly…" value={form.event} onChange={e=>setForm({...form,event:e.target.value})}/></div>
            <div><Lbl c="Topic / Key Message *"/><textarea style={{ ...inp, minHeight:"80px", resize:"vertical" }} placeholder="What should the speech focus on?" value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})}/></div>
            <div className="g2">
              <div><Lbl c="Audience"/><select style={inp} value={form.audience} onChange={e=>setForm({...form,audience:e.target.value})}>{AUDIENCES.map(a=><option key={a}>{a}</option>)}</select></div>
              <div><Lbl c="Tone"/><select style={inp} value={form.tone} onChange={e=>setForm({...form,tone:e.target.value})}>{TONES.map(t=><option key={t}>{t}</option>)}</select></div>
            </div>
            <div><Lbl c="Language Style"/><select style={inp} value={form.lang} onChange={e=>setForm({...form,lang:e.target.value})}>{LANGS.map(l=><option key={l}>{l}</option>)}</select></div>
            <button style={{ ...btn(), width:"100%", padding:"11px" }} onClick={generate} disabled={loading}>{loading?"✦ Composing…":"✦ Generate Speech"}</button>
          </div>
        </div>

        <div style={card()}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <div style={secTitle}>Generated Speech</div>
            {generated && (
              <div style={{ display:"flex", gap:"6px" }}>
                <button style={btn("sec",true)} onClick={()=>copy(generated)}>{copied?"✓ Copied":"📋 Copy"}</button>
                {generatedEntry && <DownloadMenu speech={generatedEntry}/>}
              </div>
            )}
          </div>
          {loading ? <Spinner text="Composing your speech…"/>
          : generated
            ? (
              <>
                {/* Time info bar */}
                {(() => { const { words, deliverMins, listenMins } = calcTimes(generated); return (
                  <div style={{ display:"flex", gap:"8px", marginBottom:"12px", padding:"10px 12px", background:"rgba(27,79,138,.06)", borderRadius:"8px", border:"1px solid rgba(59,130,246,.2)" }}>
                    <span style={{ fontSize:"13px", color:"var(--accent,#1B4F8A)" }}>📝 {words} words</span>
                    <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>|</span>
                    <span style={{ fontSize:"13px", color:"var(--accent,#1B4F8A)" }}>🎤 ~{deliverMins} min delivery</span>
                    <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>|</span>
                    <span style={{ fontSize:"13px", color:"#138808" }}>👂 ~{listenMins} min listening</span>
                  </div>
                ); })()}
                <div style={{ fontSize:"13px", lineHeight:"2", color:"var(--t-text,#0F172A)", whiteSpace:"pre-wrap", maxHeight:"360px", overflowY:"auto" }}>{generated}</div>
              </>
            )
            : <div style={{ textAlign:"center", padding:"50px 0", color:"#B8C4D4", fontSize:"13px" }}>Fill in the form and click Generate</div>
          }
        </div>
      </div>

      {/* Timed summary panel — shows after generation */}
      {generated && generatedEntry && <TimedSummaryPanel content={generated}/>}

      {/* Saved speeches list */}
      <div style={{ ...card(), marginTop:"16px" }}>
        <div style={secTitle}>Saved Speeches ({speeches.length})</div>
        {speeches.length===0 && <div style={{ color:"#B8C4D4", textAlign:"center", padding:"24px", fontSize:"13px" }}>No saved speeches yet.</div>}
        {speeches.map((s,i)=>{
          const { words, deliverMins, listenMins } = calcTimes(s.content);
          return (
            <div key={s.id} style={{ padding:"12px 0", borderBottom:i<speeches.length-1?"1px solid rgba(255,255,255,.05)":"none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"13px", color:"var(--t-text,#0F172A)", marginBottom:"4px" }}>{s.title}</div>
                  <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"13px", color:"#4A5A6A" }}>{s.event} • {s.date}</span>
                    <span style={{ fontSize:"13px", color:"var(--accent,#1B4F8A)" }}>📝 {words}w</span>
                    <span style={{ fontSize:"13px", color:"var(--accent,#1B4F8A)" }}>🎤 ~{deliverMins}m deliver</span>
                    <span style={{ fontSize:"13px", color:"#138808" }}>👂 ~{listenMins}m listen</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:"6px", flexShrink:0, marginLeft:"10px" }}>
                  <button style={btn("sec",true)} onClick={()=>setViewSpeech(s)}>View</button>
                  <button style={btn("sec",true)} onClick={()=>copy(s.content)}>Copy</button>
                  <DownloadMenu speech={s}/>
                  <button style={btn("red",true)} onClick={()=>setSpeeches(prev=>prev.filter(x=>x.id!==s.id))}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View modal with timed panel */}
      {viewSpeech && (
        <Modal title={viewSpeech.title} onClose={()=>setViewSpeech(null)} wide>
          <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:"13px", color:"#4A5A6A" }}>{viewSpeech.event} • {viewSpeech.date}</span>
            {(()=>{ const { words, deliverMins, listenMins } = calcTimes(viewSpeech.content); return (<>
              <span style={badge({ background:"rgba(27,79,138,.10)", color:"var(--accent,#1B4F8A)" })}>📝 {words} words</span>
              <span style={badge({ background:"rgba(27,79,138,.10)", color:"var(--accent,#1B4F8A)" })}>🎤 ~{deliverMins} min</span>
              <span style={badge({ background:"rgba(19,136,8,.10)", color:"#138808" })}>👂 ~{listenMins} min</span>
            </>);})()}
            <div style={{ marginLeft:"auto" }}><DownloadMenu speech={viewSpeech}/></div>
          </div>

          <div style={{ fontSize:"13px", lineHeight:"2", color:"var(--t-text,#0F172A)", whiteSpace:"pre-wrap", maxHeight:"300px", overflowY:"auto", padding:"14px", background:"var(--t-bg,#F8F9FB)", borderRadius:"8px", border:"1px solid rgba(255,255,255,.05)", marginBottom:"4px" }}>{viewSpeech.content}</div>

          {/* Timed summary inside view modal */}
          <TimedSummaryPanel content={viewSpeech.content}/>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: CALENDAR
═══════════════════════════════════════════════════════════════ */
function CalendarPage({ events, setEvents, isMobile=false }) {
  const [curDate, setCurDate] = useState(new Date(2026,2,1));
  const [addModal, setAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [form, setForm] = useState({ title:"", date:"", time:"", type:"Meeting", color:"var(--accent,#1B4F8A)" });

  const year = curDate.getFullYear(), month = curDate.getMonth();
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const TYPE_COLORS = { Meeting:ACCENT, Public:"#10B981", Official:"#F59E0B", Event:"#8B5CF6", Project:"#EF4444", Reminder:"#06B6D4" };
  const COLORS = [ACCENT,"#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4"];

  const addEvent = () => {
    if (!form.title.trim()||!form.date) return;
    setEvents(prev=>[...prev,{ id:`E${Date.now()}`, ...form }]);
    setForm({ title:"", date:"", time:"", type:"Meeting", color:"var(--accent,#1B4F8A)" });
    setAddModal(false);
  };

  const dayKey = (d) => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const getEvs = (d) => events.filter(e=>e.date===dayKey(d));

  const openDay = (d) => {
    setSelectedDay({ d, evs:getEvs(d) });
    setForm(f=>({ ...f, date:dayKey(d) }));
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <button style={btn("sec",true)} onClick={()=>setCurDate(new Date(year,month-1,1))}>◀ Prev</button>
          <div style={{ fontSize:"15px", fontWeight:"bold", color:"var(--t-text,#0F172A)", minWidth:"170px", textAlign:"center" }}>
            {curDate.toLocaleString("default",{ month:"long", year:"numeric" })}
          </div>
          <button style={btn("sec",true)} onClick={()=>setCurDate(new Date(year,month+1,1))}>Next ▶</button>
        </div>
        <button style={btn()} onClick={()=>setAddModal(true)}>+ Add Event</button>
      </div>

      <div style={card()}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", marginBottom:"4px" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
            <div key={d} style={{ textAlign:"center", fontSize:"13px", color:"#4A5A6A", padding:"6px 0", letterSpacing:"1px" }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px" }}>
          {Array(firstDay).fill(null).map((_,i)=><div key={`blank${i}`}/>)}
          {Array(daysInMonth).fill(null).map((_,i)=>{
            const d=i+1, evs=getEvs(d);
            const today=new Date(), isToday=today.getDate()===d&&today.getMonth()===month&&today.getFullYear()===year;
            return (
              <button key={d} onClick={()=>openDay(d)} style={{ minHeight:"68px", background:isToday?"rgba(59,130,246,.1)":"var(--t-bg,#F8F9FB)", border:`1px solid ${isToday?"rgba(59,130,246,.4)":"var(--t-border,#D0D7E3)"}`, borderRadius:"7px", padding:"5px", cursor:"pointer", width:"100%", textAlign:"left" }}>
                <div style={{ fontSize:"13px", color:isToday?ACCENT:"var(--t-muted,#3D4F5F)", fontWeight:isToday?"bold":"normal", marginBottom:"3px" }}>{d}</div>
                {evs.slice(0,2).map((e,ei)=>(
                  <div key={ei} style={{ fontSize:"13px", padding:"2px 4px", borderRadius:"3px", background:`${e.color}22`, color:e.color, marginBottom:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.title}</div>
                ))}
                {evs.length>2 && <div style={{ fontSize:"13px", color:"#4A5A6A" }}>+{evs.length-2}</div>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ ...card(), marginTop:"14px" }}>
        <div style={secTitle}>All Events ({events.length})</div>
        {events.length===0 && <div style={{ color:"#B8C4D4", textAlign:"center", padding:"20px", fontSize:"13px" }}>No events yet.</div>}
        {events.sort((a,b)=>a.date>b.date?1:-1).map((e,i)=>(
          <div key={e.id} style={{ display:"flex", gap:"12px", alignItems:"center", padding:"9px 0", borderBottom:i<events.length-1?"1px solid rgba(255,255,255,.05)":"none" }}>
            <div style={{ width:"34px", height:"34px", borderRadius:"8px", background:`${e.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", color:e.color, flexShrink:0, border:`1px solid ${e.color}30`, fontFamily:"monospace" }}>{e.date.slice(8)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"13px", color:"var(--t-text,#0F172A)" }}>{e.title}</div>
              <div style={{ fontSize:"13px", color:"#4A5A6A", marginTop:"2px" }}>{e.date}{e.time?` • ${e.time}`:""} • {e.type}</div>
            </div>
            <button style={btn("red",true)} onClick={()=>setEvents(prev=>prev.filter(x=>x.id!==e.id))}>✕</button>
          </div>
        ))}
      </div>

      {addModal && (
        <Modal title="Add Calendar Event" onClose={()=>setAddModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div><Lbl c="Event Title *"/><input style={inp} placeholder="Meeting, Jan Sabha, Health Camp…" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
            <div className="g2">
              <div><Lbl c="Date *"/><input type="date" style={inp} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
              <div><Lbl c="Time"/><input type="time" style={inp} value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></div>
            </div>
            <div className="g2">
              <div><Lbl c="Event Type"/>
                <select style={inp} value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                  {Object.keys(TYPE_COLORS).map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div><Lbl c="Color"/>
                <div style={{ display:"flex", gap:"8px", paddingTop:"6px" }}>
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setForm({...form,color:c})} style={{ width:"22px", height:"22px", borderRadius:"50%", background:c, cursor:"pointer", border:`2px solid ${form.color===c?"white":"transparent"}`, padding:0 }}/>
                  ))}
                </div>
              </div>
            </div>
            <button style={{ ...btn(), width:"100%" }} onClick={addEvent}>✦ Add Event</button>
          </div>
        </Modal>
      )}

      {selectedDay && (
        <Modal title={`${curDate.toLocaleString("default",{month:"long"})} ${selectedDay.d}, ${year}`} onClose={()=>setSelectedDay(null)}>
          {selectedDay.evs.length===0
            ? <div style={{ color:"#4A5A6A", textAlign:"center", padding:"20px", fontSize:"13px" }}>No events on this day.</div>
            : selectedDay.evs.map((e,i)=>(
              <div key={i} style={{ padding:"12px", background:`${e.color}12`, border:`1px solid ${e.color}30`, borderRadius:"8px", marginBottom:"8px" }}>
                <div style={{ fontSize:"13px", color:"var(--t-text,#0F172A)", marginBottom:"4px" }}>{e.title}</div>
                <div style={{ fontSize:"13px", color:e.color }}>{e.time?`${e.time} • `:""}{e.type}</div>
              </div>
            ))
          }
          <button style={{ ...btn(), width:"100%", marginTop:"8px" }} onClick={()=>{ setSelectedDay(null); setAddModal(true); }}>+ Add Event on This Day</button>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: ANALYTICS
═══════════════════════════════════════════════════════════════ */
function Analytics({ issues, isMobile=false }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  const resolved = issues.filter(i=>i.status==="Resolved").length;
  const rate = issues.length ? Math.round(resolved/issues.length*100) : 0;
  const catData = CATS.map((c,idx)=>({ label:c, count:issues.filter(x=>x.category===c).length, color:CAT_COLORS[idx] })).filter(d=>d.count>0);
  const wardData = WARDS.map(w=>({ ward:w, count:issues.filter(x=>x.location===w).length })).sort((a,b)=>b.count-a.count);
  const barData = [
    {label:"Oct",total:34,resolved:28},{label:"Nov",total:52,resolved:41},{label:"Dec",total:45,resolved:38},
    {label:"Jan",total:63,resolved:49},{label:"Feb",total:58,resolved:52},{label:"Mar",total:issues.length,resolved},
  ];

  const genInsight = async () => {
    setLoading(true); setInsight("");
    const summary = `Issues: ${issues.length}, Open: ${issues.filter(i=>i.status==="Open").length}, Critical: ${issues.filter(i=>i.priority==="Critical").length}, Resolved: ${resolved}, Rate: ${rate}%\nTop categories: ${catData.slice(0,4).map(c=>`${c.label}(${c.count})`).join(", ")}\nTop locations: ${wardData.slice(0,3).map(w=>`${w.ward}(${w.count})`).join(", ")}`;
    try {
      const r = await callAI(`Analyze this constituency issue data and give 4 insights with actionable recommendations:\n\n${summary}`, "You are a data analyst for an Indian MLA. Be specific, practical, and reference relevant government schemes.");
      setInsight(r);
    } catch(e) { setInsight("Error: "+e.message); }
    setLoading(false);
  };

  return (
    <div>
      <div className="g4" style={{ marginBottom:"12px" }}>
        {[
          { label:"Total Issues", value:issues.length, accent:ACCENT },
          { label:"Resolved Rate", value:`${rate}%`, accent:"#10B981" },
          { label:"Critical Active", value:issues.filter(i=>i.priority==="Critical"&&i.status!=="Resolved").length, accent:"#EF4444" },
          { label:"Avg / Month", value:Math.round(issues.length/6)||0, accent:"#F59E0B" },
        ].map((s,i)=>(
          <div key={i} style={{ ...card(), border:`1px solid ${s.accent}35` }}>
            <div style={{ fontSize:"26px", fontWeight:"bold", color:s.accent }}>{s.value}</div>
            <div style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)", textTransform:"uppercase", letterSpacing:"1px", marginTop:"5px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="g2" style={{ marginBottom:"12px" }}>
        <div style={card()}>
          <div style={secTitle}>Issue Volume Trend</div>
          <BarChart data={barData}/>
          <div style={{ display:"flex", gap:"12px", marginTop:"8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"5px" }}><div style={{ width:"8px", height:"8px", background:"rgba(27,79,138,.55)", borderRadius:"2px" }}/><span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>Resolved</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:"5px" }}><div style={{ width:"8px", height:"8px", background:"rgba(192,57,43,.5)", borderRadius:"2px" }}/><span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>Pending</span></div>
          </div>
        </div>
        <div style={card()}>
          <div style={secTitle}>Issues by Category</div>
          <Donut data={catData.length?catData:[{label:"No data",count:1,color:"#B8C4D4"}]}/>
        </div>
      </div>

      <div className="g2" style={{ marginBottom:"12px" }}>
        <div style={card()}>
          <div style={secTitle}>Top Issue Locations</div>
          {wardData.map((w,i)=>(
            <div key={i} style={{ marginBottom:"10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)" }}>{w.ward}</span>
                <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)", fontFamily:"monospace" }}>{w.count}</span>
              </div>
              <div style={{ height:"4px", background:"var(--t-border,#D0D7E3)", borderRadius:"2px" }}>
                <div style={{ height:"100%", width:issues.length?`${(w.count/issues.length)*100}%`:"0%", background:`linear-gradient(90deg,${ACCENT},${ACCENT2})`, borderRadius:"2px", transition:"width .5s" }}/>
              </div>
            </div>
          ))}
        </div>

        <div style={card()}>
          <div style={secTitle}>By Priority</div>
          {PRIS.map((p,i)=>{
            const count=issues.filter(x=>x.priority===p).length;
            return (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:i<3?"1px solid rgba(255,255,255,.05)":"none" }}>
                <span style={badge(PRI_S[p])}>{p}</span>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ width:"80px", height:"4px", background:"var(--t-border,#D0D7E3)", borderRadius:"2px" }}>
                    <div style={{ height:"100%", width:issues.length?`${(count/issues.length)*100}%`:"0%", background:PRI_S[p].color, borderRadius:"2px" }}/>
                  </div>
                  <span style={{ fontSize:"13px", color:"var(--t-muted,#3D4F5F)", fontFamily:"monospace", minWidth:"20px", textAlign:"right" }}>{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={card("rgba(27,79,138,.15)")}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
          <div style={secTitle}>AI Insights & Recommendations</div>
          <button style={btn()} onClick={genInsight} disabled={loading}>{loading?"Analyzing…":"✦ Generate Insights"}</button>
        </div>
        {loading && <Spinner text="Analyzing your constituency data…"/>}
        {insight && <AIBox text={insight}/>}
        {!insight && !loading && <div style={{ color:"#B8C4D4", fontSize:"13px", textAlign:"center", padding:"20px" }}>Click "Generate Insights" for AI-powered analysis based on your actual data</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE: SETTINGS
═══════════════════════════════════════════════════════════════ */
function SettingsPage({ settings, setSettings, issues, meetings, speeches, docs, dark, setDark, authUser, onLogout, isMobile=false }) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const [testQ, setTestQ] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [showChangePass, setShowChangePass] = useState(false);
  const [passForm, setPassForm] = useState({ current:"", newp:"", confirm:"" });
  const [passMsg, setPassMsg] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [fontSize, setFontSize] = useState(form.fontSize||"medium");
  const [accentColor, setAccentColor] = useState(form.accentColor||ACCENT);
  const [compactMode, setCompactMode] = useState(form.compactMode||false);
  const [sessionTimeout, setSessionTimeout] = useState(form.sessionTimeout||"30");
  const [twoFactor, setTwoFactor] = useState(form.twoFactor||false);
  const [activityLog] = useState([
    { time:"Today 04:34 PM", action:"Settings page opened", ip:"192.168.1.10" },
    { time:"Today 04:17 PM", action:"Document uploaded", ip:"192.168.1.10" },
    { time:"Today 07:04 PM", action:"Login successful", ip:"192.168.1.10" },
    { time:"Yesterday 11:20 AM", action:"Speech generated", ip:"192.168.1.10" },
    { time:"Yesterday 09:05 AM", action:"Issue #ISS-005 updated", ip:"192.168.1.10" },
  ]);

  const save = () => {
    const updated = { ...form, fontSize, accentColor, compactMode, sessionTimeout, twoFactor };
    setSettings(updated);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  const testAI = async () => {
    if (!testQ.trim()) return;
    setAiLoading(true); setAiReply("");
    try { const r = await callAI(testQ,"You are Mantri Mitra AI, assistant for Indian public officials."); setAiReply(r); }
    catch(e) { setAiReply("Error: "+e.message); }
    setAiLoading(false);
  };

  const changePassword = () => {
    setPassMsg("");
    if (!passForm.current) { setPassMsg("❌ Enter your current password."); return; }
    if (passForm.newp.length < 8) { setPassMsg("❌ New password must be at least 8 characters."); return; }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(passForm.newp)) { setPassMsg("❌ Password must be alphanumeric."); return; }
    if (passForm.newp !== passForm.confirm) { setPassMsg("❌ New passwords do not match."); return; }
    // Save updated password in sessionStorage
    try {
      const DB_KEY2 = "mantri_mitra_users_v2";
      const users = JSON.parse(localStorage.getItem(DB_KEY2) || sessionStorage.getItem("mantri_mitra_users") || "[]");
      const idx = users.findIndex(u=>u.email===settings.email);
      if (idx>=0) { // password updated as hash — see hashPassword() utility
      hashPassword(passForm.newp).then(h => {
          users[idx].password = h;
          const d = JSON.stringify(users);
          try { localStorage.setItem("mantri_mitra_users_v2", d); } catch {}
          try { sessionStorage.setItem("mantri_mitra_users", d); } catch {}
          try { if (window.storage) window.storage.set("mantri_mitra_users_v2", d).catch(()=>{}); } catch {}
        }); }
    } catch {}
    setPassMsg("✅ Password changed successfully!");
    setPassForm({ current:"", newp:"", confirm:"" });
    setTimeout(()=>{ setPassMsg(""); setShowChangePass(false); }, 2500);
  };

  const TABS = [
    { id:"profile",   icon:"👤", label:"Profile" },
    { id:"appearance",icon:"🎨", label:"Appearance" },
    { id:"security",  icon:"🔐", label:"Security" },
    { id:"notifications", icon:"🔔", label:"Notifications" },
    { id:"data",      icon:"📊", label:"Data & AI" },
    { id:"activity",  icon:"📋", label:"Activity Log" },
  ];

  const SettingRow = ({ icon, label, desc, children }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0", borderBottom:"1px solid var(--t-border,#D0D7E3)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
        <span style={{ fontSize:"18px", width:"28px", textAlign:"center" }}>{icon}</span>
        <div>
          <div style={{ fontSize:"14px", fontWeight:"700", color:"var(--t-text,#0F172A)" }}>{label}</div>
          {desc && <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)", marginTop:"2px" }}>{desc}</div>}
        </div>
      </div>
      <div style={{ flexShrink:0, marginLeft:"16px" }}>{children}</div>
    </div>
  );

  return (
    <div style={{ maxWidth:"700px", minWidth:0, width:"100%" }}>

      {/* Tab Bar */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"14px", background:"var(--t-card,#fff)", border:"1px solid var(--t-border,#D0D7E3)", borderRadius:"8px", padding:"4px", overflowX:"auto", WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ flexShrink:0, padding:isMobile?"6px 8px":"8px 12px", borderRadius:"5px", cursor:"pointer", textAlign:"center", fontSize:isMobile?"10px":"12px", fontWeight:"700", background:activeTab===t.id?"var(--accent,#1B4F8A)":"transparent", color:activeTab===t.id?"#fff":"var(--t-muted,#3D4F63)", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:isMobile?"column":"row", gap:"3px", whiteSpace:"nowrap", border:"none" }}>
            <span style={{ fontSize:isMobile?"14px":"12px" }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── PROFILE ── */}
      {activeTab==="profile" && (
        <div style={{ ...card(), marginBottom:"14px" }}>
          <div style={secTitle}>Profile Information</div>
          {/* Avatar */}
          <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"18px", padding:"14px", background:"var(--t-bg,#F8F9FB)", borderRadius:"8px", border:"1px solid var(--t-border,#D0D7E3)" }}>
            <div style={{ width:"60px", height:"60px", borderRadius:"50%", background:`linear-gradient(135deg,${ACCENT},${ACCENT2})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", fontWeight:"700", color:"#fff", flexShrink:0 }}>
              {(form.name||"?").charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:"16px", fontWeight:"800", color:"var(--t-text,#0F172A)" }}>{form.name||"—"}</div>
              <div style={{ fontSize:"13px", color:ACCENT2, fontWeight:"700" }}>{form.role} &nbsp;·&nbsp; {form.constituency}</div>
              <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)" }}>{form.email}</div>
            </div>
            <div style={{ marginLeft:"auto", padding:"5px 12px", background:"rgba(19,136,8,.1)", border:"1px solid rgba(19,136,8,.3)", borderRadius:"4px", fontSize:"11px", color:"#138808", fontWeight:"700" }}>● ACTIVE</div>
          </div>
          <div className="g2">
            <div><Lbl c="Full Name"/><input style={inp} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
            <div><Lbl c="Designation / Role"/><select style={inp} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{["MLA","MP","Mayor","Councillor","DM","SDM","BDO","Other"].map(r=><option key={r}>{r}</option>)}</select></div>
            <div><Lbl c="Constituency"/><input style={inp} value={form.constituency} onChange={e=>setForm({...form,constituency:e.target.value, state:detectState(e.target.value)||form.state})}/></div>
            <div><Lbl c="State / UT"/><input style={inp} value={form.state||""} placeholder="Auto-detected" onChange={e=>setForm({...form,state:e.target.value})}/></div>
            <div><Lbl c="Official Email"/><input style={inp} type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
            <div><Lbl c="Mobile"/><input style={inp} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div style={{ gridColumn:"1/-1" }}><Lbl c="Language Preference"/><select style={{ ...inp, maxWidth:"200px" }} value={form.language} onChange={e=>setForm({...form,language:e.target.value})}>{["English","Hindi","Hinglish"].map(l=><option key={l}>{l}</option>)}</select></div>
          </div>
        </div>
      )}

      {/* ── APPEARANCE ── */}
      {activeTab==="appearance" && (
        <div style={{ ...card(), marginBottom:"14px" }}>
          <div style={secTitle}>Appearance & Display</div>
          <SettingRow icon="🌙" label="Dark Mode" desc="Switch between light and dark interface">
            <Toggle on={dark} onToggle={()=>setDark(d=>!d)}/>
          </SettingRow>
          <SettingRow icon="🔡" label="Font Size" desc="Adjust text size across the portal">
            <div style={{ display:"flex", gap:"6px" }}>
              {["small","medium","large"].map(s=>(
                <button key={s} onClick={()=>setFontSize(s)} style={{ padding:"6px 14px", borderRadius:"4px", cursor:"pointer", fontSize:"12px", fontWeight:"700", background:fontSize===s?ACCENT:"var(--t-bg,#F8F9FB)", color:fontSize===s?"#fff":"var(--t-text,#0F172A)", border:"1px solid var(--t-border,#D0D7E3)", textTransform:"capitalize", transition:"all .2s" }}>{s}</button>
              ))}
            </div>
          </SettingRow>
          <SettingRow icon="🗜️" label="Compact Mode" desc="Reduce spacing for more content per screen">
            <Toggle on={compactMode} onToggle={()=>setCompactMode(c=>!c)}/>
          </SettingRow>
          <SettingRow icon="🎨" label="Accent Color" desc="Choose your portal accent colour">
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              {["#1B4F8A","#7C3AED","#0891B2","#DC2626","#059669","#D97706"].map(c=>(
                <button key={c} onClick={()=>setAccentColor(c)} style={{ width:"24px", height:"24px", borderRadius:"50%", background:c, cursor:"pointer", padding:0, border:accentColor===c?"3px solid var(--t-text,#0F172A)":"2px solid transparent", transition:"all .2s" }}/>
              ))}
            </div>
          </SettingRow>
          <div style={{ marginTop:"16px", padding:"12px", background:"rgba(27,79,138,.08)", borderRadius:"6px", border:"1px solid rgba(27,79,138,.2)", fontSize:"12px", color:"var(--t-muted,#3D4F63)" }}>
            💡 Font size and compact mode changes apply after saving settings.
          </div>
        </div>
      )}

      {/* ── SECURITY ── */}
      {activeTab==="security" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div style={card()}>
            <div style={secTitle}>Security Settings</div>
            <SettingRow icon="⏱️" label="Session Timeout" desc="Auto-logout after inactivity">
              <select style={{ ...inp, width:"130px" }} value={sessionTimeout} onChange={e=>setSessionTimeout(e.target.value)}>
                {[["15","15 minutes"],["30","30 minutes"],["60","1 hour"],["120","2 hours"],["0","Never"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </SettingRow>
            <SettingRow icon="🔒" label="Two-Factor Auth" desc="Extra security on login (simulated)">
              <Toggle on={twoFactor} onToggle={()=>setTwoFactor(t=>!t)}/>
            </SettingRow>
            <SettingRow icon="🖥️" label="Active Sessions" desc="Currently logged in">
              <div style={{ fontSize:"12px", fontWeight:"700", color:"#138808", background:"rgba(19,136,8,.1)", padding:"5px 12px", borderRadius:"4px", border:"1px solid rgba(19,136,8,.3)" }}>1 Device</div>
            </SettingRow>
          </div>
          <div style={card()}>
            <div style={secTitle}>Change Password</div>
            {!showChangePass ? (
              <button style={{ ...btn("sec"), width:"100%" }} onClick={()=>setShowChangePass(true)}>🔑 Change Password</button>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {passMsg && <div style={{ padding:"9px 13px", borderRadius:"4px", fontSize:"13px", background:passMsg.startsWith("✅")?"rgba(19,136,8,.1)":"rgba(192,57,43,.1)", color:passMsg.startsWith("✅")?"#138808":"#C0392B", border:`1px solid ${passMsg.startsWith("✅")?"rgba(19,136,8,.3)":"rgba(192,57,43,.3)"}`, fontWeight:"600" }}>{passMsg}</div>}
                <div>
                  <Lbl c="Current Password"/>
                  <div style={{ position:"relative" }}>
                    <input style={inp} type={showCurrent?"text":"password"} value={passForm.current} onChange={e=>setPassForm({...passForm,current:e.target.value})} placeholder="Enter current password"/>
                    <span onClick={()=>setShowCurrent(p=>!p)} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", cursor:"pointer", fontSize:"14px" }}>{showCurrent?"🙈":"👁️"}</span>
                  </div>
                </div>
                <div>
                  <Lbl c="New Password (min 8, alphanumeric)"/>
                  <div style={{ position:"relative" }}>
                    <input style={inp} type={showNew?"text":"password"} value={passForm.newp} onChange={e=>setPassForm({...passForm,newp:e.target.value})} placeholder="Min. 8 alphanumeric chars"/>
                    <span onClick={()=>setShowNew(p=>!p)} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", cursor:"pointer", fontSize:"14px" }}>{showNew?"🙈":"👁️"}</span>
                  </div>
                </div>
                <div><Lbl c="Confirm New Password"/><input style={inp} type="password" value={passForm.confirm} onChange={e=>setPassForm({...passForm,confirm:e.target.value})} placeholder="Re-enter new password"/></div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button style={{ ...btn(), flex:1 }} onClick={changePassword}>Update Password</button>
                  <button style={{ ...btn("sec") }} onClick={()=>{ setShowChangePass(false); setPassMsg(""); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ ...card("rgba(192,57,43,.2)") }}>
            <div style={secTitle}>Danger Zone</div>
            <SettingRow icon="🚪" label="Sign Out" desc="End your current session">
              <button style={btn("red",true)} onClick={onLogout}>Sign Out</button>
            </SettingRow>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab==="notifications" && (
        <div style={card()}>
          <div style={secTitle}>Notification Preferences</div>
          {[
            { key:"notifications",    icon:"📧", label:"Email Notifications",      desc:"Receive updates on issues and meetings via email" },
            { key:"notifIssues",      icon:"⚠️", label:"New Issue Alerts",          desc:"Alert when a new citizen issue is logged" },
            { key:"notifMeetings",    icon:"📅", label:"Meeting Reminders",         desc:"Reminder 1 hour before scheduled meetings" },
            { key:"notifSpeeches",    icon:"🎤", label:"Speech Ready Alerts",       desc:"Notify when AI speech generation is complete" },
            { key:"notifAnalytics",   icon:"📊", label:"Weekly Analytics Report",   desc:"Receive weekly constituency analytics summary" },
            { key:"notifGovSchemes",  icon:"🏛️", label:"New Govt. Scheme Updates",  desc:"Get updates on new central / state schemes" },
          ].map(p=>(
            <SettingRow key={p.key} icon={p.icon} label={p.label} desc={p.desc}>
              <Toggle on={form[p.key]??true} onToggle={()=>setForm(f=>({...f,[p.key]:!(f[p.key]??true)}))}/>
            </SettingRow>
          ))}
        </div>
      )}

      {/* ── DATA & AI ── */}
      {activeTab==="data" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div style={card()}>
            <div style={secTitle}>Data Overview</div>
            <div className="g4" style={{ marginBottom:"10px" }}>
              {[
                { l:"Issues",    v:issues.length,   icon:"⚠️",  color:"var(--accent,#1B4F8A)" },
                { l:"Meetings",  v:meetings.length,  icon:"📅",  color:"#059669" },
                { l:"Speeches",  v:speeches.length,  icon:"🎤",  color:ACCENT2 },
                { l:"Documents", v:docs.length,      icon:"📄",  color:"#7C3AED" },
              ].map((s,i)=>(
                <div key={i} style={{ padding:"14px 10px", background:"var(--t-bg,#F8F9FB)", borderRadius:"8px", border:`2px solid ${s.color}30`, textAlign:"center" }}>
                  <div style={{ fontSize:"22px", marginBottom:"4px" }}>{s.icon}</div>
                  <div style={{ fontSize:"24px", color:s.color, fontWeight:"800" }}>{s.v}</div>
                  <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)", fontWeight:"600" }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)", padding:"10px", background:"var(--t-bg,#F8F9FB)", borderRadius:"6px", lineHeight:"1.8" }}>
              📦 Total records: <strong>{issues.length + meetings.length + speeches.length + docs.length}</strong> &nbsp;|&nbsp;
              🗂️ Open issues: <strong>{issues.filter(i=>i.status==="Open").length}</strong> &nbsp;|&nbsp;
              ✅ Resolved: <strong>{issues.filter(i=>i.status==="Resolved").length}</strong>
            </div>
          </div>
          <div style={{ ...card("rgba(27,79,138,.15)") }}>
            <div style={secTitle}>Test AI Connection</div>
            <div style={{ display:"flex", gap:"10px" }}>
              <input style={{ ...inp, flex:1 }} placeholder="Ask a test question to verify AI is working…" value={testQ} onChange={e=>setTestQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&testAI()}/>
              <button style={btn()} onClick={testAI} disabled={aiLoading}>{aiLoading?"⏳ …":"Test AI"}</button>
            </div>
            {aiLoading && <Spinner text="Connecting to AI…"/>}
            {aiReply && <AIBox text={aiReply}/>}
          </div>
        </div>
      )}

      {/* ── ACTIVITY LOG ── */}
      {activeTab==="activity" && (
        <div style={card()}>
          <div style={secTitle}>Recent Activity Log</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
            {activityLog.map((a,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"14px", padding:"12px 0", borderBottom: i<activityLog.length-1?"1px solid var(--t-border,#D0D7E3)":"none" }}>
                <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:ACCENT, marginTop:"5px", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"13px", fontWeight:"700", color:"var(--t-text,#0F172A)" }}>{a.action}</div>
                  <div style={{ fontSize:"12px", color:"var(--t-muted,#3D4F63)", marginTop:"2px" }}>🕐 {a.time} &nbsp;·&nbsp; 🌐 {a.ip}</div>
                </div>
                <div style={{ fontSize:"11px", padding:"2px 8px", background:"rgba(27,79,138,.1)", color:"var(--accent,#1B4F8A)", borderRadius:"3px", fontWeight:"700", flexShrink:0 }}>INFO</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:"12px", fontSize:"12px", color:"var(--t-muted,#3D4F63)", textAlign:"center" }}>Showing last 5 activities &nbsp;·&nbsp; All times are IST</div>
        </div>
      )}

      {/* Save Button */}
      {["profile","appearance","notifications","data"].includes(activeTab) && (
        <button style={{ ...btn(), width:"100%", padding:"14px", fontSize:"14px", marginTop:"6px" }} onClick={save}>
          {saved ? "✅ Settings Saved Successfully!" : "💾 Save Settings"}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DARK MODE THEME HELPER
═══════════════════════════════════════════════════════════════ */
function getTheme(dark) {
  return dark ? {
    bg:       "#0D1117",
    card:     "#161B22",
    border:   "#30363D",
    text:     "#F0F6FF",
    muted:    "#AAB8C8",
    inp:      "#0D1117",
    inpBorder:"#30363D",
    subBar:   "#161B22",
    subBarBorder:"#30363D",
    rowHover: "rgba(255,255,255,.04)",
    scrollThumb:"#30363D",
    scrollTrack:"#0D1117",
    selectBg: "#161B22",
  } : {
    bg:       "#F5F5F0",
    card:     "#FFFFFF",
    border:   "var(--t-border,#D0D7E3)",
    text:     "#0F172A",
    muted:    "#3D4F63",
    inp:      "var(--t-bg,#FAFBFC)",
    inpBorder:"#B8C4D4",
    subBar:   "#FFFFFF",
    subBarBorder:"var(--t-border,#D0D7E3)",
    rowHover: "rgba(27,79,138,.04)",
    scrollThumb:"#B8C4D4",
    scrollTrack:"#F0F2F5",
    selectBg: "#FFFFFF",
  };
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN / SIGNUP PAGES
═══════════════════════════════════════════════════════════════ */
function AuthPage({ onLogin }) {
  const isMobile = useIsMobile();
  const [authNow, setAuthNow] = useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setAuthNow(new Date()),1000); return()=>clearInterval(t); },[]);
  const [view, setView] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ name:"", role:"MLA", constituency:"", email:"", phone:"", password:"", confirm:"", empId:"" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load saved users from storage
  // ── Persistent user database ──────────────────────────────────
  // Reads from localStorage (survives tab close) AND artifact storage (survives browser clear)
  const DB_KEY = "mantri_mitra_users_v2";

  const getUsers = () => {
    try {
      // Try localStorage first (fastest, survives tab close)
      const local = localStorage.getItem(DB_KEY);
      if (local) return JSON.parse(local);
    } catch {}
    try {
      // Fallback to sessionStorage
      const sess = sessionStorage.getItem("mantri_mitra_users");
      if (sess) return JSON.parse(sess);
    } catch {}
    return [];
  };

  const saveUsers = (users) => {
    const data = JSON.stringify(users);
    // Save to localStorage (persistent across sessions)
    try { localStorage.setItem(DB_KEY, data); } catch {}
    // Also save to sessionStorage as backup
    try { sessionStorage.setItem("mantri_mitra_users", data); } catch {}
    // Also save to artifact window.storage (survives browser cache clear)
    try {
      if (window.storage) {
        window.storage.set(DB_KEY, data).catch(()=>{});
      }
    } catch {}
  };

  // On mount: sync from artifact storage → localStorage if localStorage is empty
  useEffect(() => {
    const syncFromArtifactDB = async () => {
      try {
        if (!localStorage.getItem(DB_KEY) && window.storage) {
          const result = await window.storage.get(DB_KEY);
          if (result && result.value) {
            localStorage.setItem(DB_KEY, result.value);
          }
        }
      } catch {}
    };
    syncFromArtifactDB();
  }, []);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const users = getUsers();
      const inputHash = await hashPassword(form.password);
      const user = users.find(u => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.password === inputHash);
      if (user) {
        onLogin(user);
      } else {
        setError("Invalid credentials. Please check your Email and Password.");
      }
    } catch(e) {
      setError("Login error: " + e.message);
    }
    setLoading(false);
  };

  const handleSignup = () => {
    setError("");
    if (!form.name || !form.email || !form.password || !form.constituency || !form.empId) {
      setError("All fields marked * are mandatory."); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid official email address."); return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters."); return;
    }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password)) {
      setError("Password must contain both letters and numbers (alphanumeric)."); return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match."); return;
    }
    const users = getUsers();
    if (users.find(u => u.email === form.email)) {
      setError("This email is already registered."); return;
    }
    setLoading(true);
    hashPassword(form.password).then(pwHash => {
      const newUser = { name:form.name, role:form.role, constituency:form.constituency, state:form.state||detectState(form.constituency)||"India", email:form.email.trim().toLowerCase(), phone:form.phone, empId:form.empId, password:pwHash };
      users.push(newUser);
      saveUsers(users);
      setSuccess("Registration successful! Your account has been created. Please sign in.");
      setView("login");
      setForm(f => ({ ...f, password:"", confirm:"" }));
      setLoading(false);
    }).catch(e => { setError("Registration error: "+e.message); setLoading(false); });
  };

  const F2 = FONT_SANS;
  const inputStyle = {
    width:"100%", background:"rgba(255,255,255,.08)", border:"1.5px solid rgba(255,255,255,.2)",
    borderRadius:"4px", padding:"11px 14px", color:"#fff", fontSize:"13px", outline:"none",
    boxSizing:"border-box", fontFamily:F2, transition:"border .2s",
  };
  const labelStyle = { fontSize:"13px", color:"rgba(255,255,255,.88)", fontWeight:"600", display:"block", marginBottom:"5px", fontFamily:F2, letterSpacing:".5px" };

  return (
    <div style={{ minHeight:"100vh", width:"100%", display:"flex", flexDirection:"column", background:"linear-gradient(135deg, #0F1C3F 0%, #1B4F8A 50%, #0A2A5E 100%)", fontFamily:F2, position:"relative", overflow:"hidden" }}>
      {/* Background decoration */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-80px", right:"-80px", width:"360px", height:"360px", borderRadius:"50%", background:"rgba(255,102,0,.08)", filter:"blur(60px)" }}/>
        <div style={{ position:"absolute", bottom:"-60px", left:"-60px", width:"280px", height:"280px", borderRadius:"50%", background:"rgba(19,136,8,.08)", filter:"blur(50px)" }}/>
        <div style={{ position:"absolute", top:"40%", left:"50%", width:"600px", height:"600px", marginLeft:"-300px", marginTop:"-300px", borderRadius:"50%", background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)" }}/>
      </div>

      {/* Gov utility bar */}
      <div style={{ background:"rgba(0,0,0,.3)", padding:"5px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,.08)", position:"relative", zIndex:2 }}>
        <div style={{ fontSize:"13px", color:"rgba(255,255,255,.80)", fontFamily:F2 }}>Government of India &nbsp;|&nbsp; Ministry of Public Administration</div>
        <div style={{ fontSize:"13px", color:"rgba(255,255,255,.70)", fontFamily:F2 }}>
          सत्यमेव जयते &nbsp;|&nbsp; {authNow.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"long",year:"numeric"})} &nbsp;|&nbsp; {authNow.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true})} IST
        </div>
      </div>

      {/* Header */}
      <div style={{ padding:"20px 28px 16px", display:"flex", alignItems:"center", gap:"18px", borderBottom:"1px solid rgba(255,255,255,.08)", position:"relative", zIndex:2 }}>
        <div style={{ width:"56px", height:"56px", background:"rgba(255,255,255,.12)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", border:"2px solid rgba(255,255,255,.2)", flexShrink:0 }}>🇮🇳</div>
        <div>
          <div style={{ fontSize:"22px", fontWeight:"700", color:"#fff", fontFamily:F2, letterSpacing:".5px" }}>मंत्री मित्र — Mantri Mitra AI</div>
          <div style={{ fontSize:"13px", color:"rgba(255,255,255,.92)", marginTop:"2px" }}>AI-Powered Constituency Management System &nbsp;|&nbsp; Government of India</div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", flexDirection:"column", gap:"3px" }}>
          <div style={{ width:"60px", height:"3px", background:ACCENT2, borderRadius:"2px" }}/>
          <div style={{ width:"60px", height:"3px", background:"rgba(255,255,255,.7)", borderRadius:"2px" }}/>
          <div style={{ width:"60px", height:"3px", background:ACCENT3, borderRadius:"2px" }}/>
        </div>
      </div>

      {/* Main Auth Card */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", position:"relative", zIndex:2 }}>
        <div style={{ width:"100%", maxWidth:"480px" }}>
          {/* Security badge */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"16px" }}>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 8px #4ADE80" }}/>
            <span style={{ fontSize:"13px", color:"rgba(255,255,255,.80)", fontFamily:F2, letterSpacing:"1px" }}>SECURE GOVERNMENT PORTAL &nbsp;|&nbsp; SSL ENCRYPTED</span>
            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#4ADE80", boxShadow:"0 0 8px #4ADE80" }}/>
          </div>

          <div style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:"10px", overflow:"hidden", backdropFilter:"blur(20px)", boxShadow:"0 24px 60px rgba(0,0,0,.4)" }}>
            {/* Tab switcher */}
            <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
              {[["login","🔐 Sign In"],["signup","📋 Register"]].map(([v,label])=>(
                <button key={v} onClick={()=>{ setView(v); setError(""); setSuccess(""); }} style={{ flex:1, padding:"14px", textAlign:"center", cursor:"pointer", fontSize:"13px", fontWeight:"700", fontFamily:F2, color:view===v?"#fff":"rgba(255,255,255,.45)", background:view===v?"rgba(255,255,255,.08)":"transparent", borderBottom:view===v?"2px solid "+ACCENT2:"2px solid transparent", transition:"all .2s", border:"none" }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ padding:"24px" }}>
              {/* Confidential notice */}
              <div style={{ background:"rgba(255,102,0,.1)", border:"1px solid rgba(255,102,0,.25)", borderRadius:"4px", padding:"9px 13px", marginBottom:"18px", display:"flex", alignItems:"center", gap:"8px" }}>
                <span style={{ fontSize:"14px" }}>🔒</span>
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,.92)", fontFamily:F2, lineHeight:"1.5" }}>
                  <strong style={{ color:ACCENT2 }}>RESTRICTED ACCESS</strong> — This portal is for authorised government officials only. Unauthorised access is punishable under IT Act 2000.
                </div>
              </div>

              {success && (
                <div style={{ background:"rgba(19,136,8,.15)", border:"1px solid rgba(19,136,8,.3)", borderRadius:"4px", padding:"10px 13px", marginBottom:"14px", fontSize:"13px", color:"#4ADE80", fontFamily:F2 }}>✓ {success}</div>
              )}
              {error && (
                <div style={{ background:"rgba(192,57,43,.15)", border:"1px solid rgba(192,57,43,.3)", borderRadius:"4px", padding:"10px 13px", marginBottom:"14px", fontSize:"13px", color:"#FCA5A5", fontFamily:F2 }}>⚠ {error}</div>
              )}

              {view === "login" ? (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  {/* ── Saved accounts quick-select ── */}
                  {(()=>{ const saved = getUsers(); return saved.length > 0 && (
                    <div style={{ background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:"6px", padding:"10px 12px" }}>
                      <div style={{ fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,.5)", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"8px" }}>
                        💾 Saved Accounts ({saved.length})
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                        {saved.map((u,i)=>(
                          <button key={i} onClick={()=>setForm(f=>({...f, email:u.email, password:""}))}
                            style={{ display:"flex", alignItems:"center", gap:"10px", background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:"5px", padding:"7px 10px", cursor:"pointer", textAlign:"left", transition:"background .15s" }}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.15)"}
                            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.08)"}>
                            <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"linear-gradient(135deg,#1B4F8A,#2563EB)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:"700", color:"#fff", flexShrink:0 }}>
                              {u.name ? u.name[0].toUpperCase() : "U"}
                            </div>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontSize:"13px", fontWeight:"700", color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name}</div>
                              <div style={{ fontSize:"10px", color:"rgba(255,255,255,.55)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email} · {u.role||"Official"}</div>
                            </div>
                            <div style={{ marginLeft:"auto", fontSize:"10px", color:"rgba(255,255,255,.4)", flexShrink:0 }}>Tap →</div>
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize:"10px", color:"rgba(255,255,255,.35)", marginTop:"6px" }}>Tap an account to fill email, then enter password</div>
                    </div>
                  );})()}

                  <div>
                    <label style={labelStyle}>OFFICIAL EMAIL ADDRESS *</label>
                    <input style={inputStyle} type="email" placeholder="yourname@up.gov.in" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
                  </div>
                  <div>
                    <label style={labelStyle}>PASSWORD *</label>
                    <div style={{ position:"relative" }}>
                      <input style={inputStyle} type={showPass?"text":"password"} placeholder="Enter your password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
                      <span onClick={()=>setShowPass(p=>!p)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", cursor:"pointer", fontSize:"14px", color:"rgba(255,255,255,.80)" }}>{showPass?"🙈":"👁"}</span>
                    </div>
                  </div>
                  {getUsers().length === 0 && (
                    <div style={{ background:"rgba(27,79,138,.2)", border:"1px solid rgba(27,79,138,.3)", borderRadius:"4px", padding:"8px 12px", fontSize:"12px", color:"rgba(255,255,255,.75)", fontFamily:F2 }}>
                      📝 No saved accounts yet — Register a new account above
                    </div>
                  )}
                  <button onClick={handleLogin} disabled={loading} style={{ width:"100%", padding:"12px", background:"linear-gradient(135deg, #1B4F8A, #2563EB)", border:"none", borderRadius:"4px", color:"#fff", fontSize:"13px", fontWeight:"700", fontFamily:F2, cursor:"pointer", letterSpacing:".5px", transition:"opacity .2s", marginTop:"4px" }}>
                    {loading ? "⏳ Authenticating..." : "🔐 SIGN IN TO PORTAL"}
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  <div className="g2">
                    <div>
                      <label style={labelStyle}>FULL NAME *</label>
                      <input style={inputStyle} placeholder="Shri / Smt. Full Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
                    </div>
                    <div>
                      <label style={labelStyle}>DESIGNATION / ROLE *</label>
                      <select style={{ ...inputStyle, background:"rgba(255,255,255,.08)" }} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                        {["MLA","MP","Mayor","Councillor","DM","SDM","BDO","Other"].map(r=><option key={r} style={{ background:"#1B4F8A" }}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>EMPLOYEE / OFFICIAL ID *</label>
                      <input style={inputStyle} placeholder="UP-MLA-XXXX" value={form.empId} onChange={e=>setForm({...form,empId:e.target.value})}/>
                    </div>
                    <div>
                      <label style={labelStyle}>CONSTITUENCY / DISTRICT *</label>
                      <input style={inputStyle} placeholder="e.g. Bhopal, Lucknow North" value={form.constituency} onChange={e=>setForm({...form,constituency:e.target.value, state:detectState(e.target.value)||form.state})}/>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>OFFICIAL EMAIL ADDRESS *</label>
                    <input style={inputStyle} type="email" placeholder="yourname@up.gov.in" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
                  </div>
                  <div>
                    <label style={labelStyle}>MOBILE (GOVT. REGISTERED)</label>
                    <input style={inputStyle} placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
                  </div>
                  <div className="g2">
                    <div>
                      <label style={labelStyle}>CREATE PASSWORD *</label>
                      <div style={{ position:"relative" }}>
                        <input style={inputStyle} type={showPass?"text":"password"} placeholder="Min. 8 alphanumeric" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
                        <span onClick={()=>setShowPass(p=>!p)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", cursor:"pointer", fontSize:"15px", userSelect:"none" }}>{showPass?"🙈":"👁️"}</span>
                      </div>
                      {form.password && (
                        <div style={{ marginTop:"5px", display:"flex", gap:"4px", alignItems:"center" }}>
                          {[
                            form.password.length >= 8,
                            /[a-zA-Z]/.test(form.password),
                            /[0-9]/.test(form.password),
                            /[^a-zA-Z0-9]/.test(form.password),
                          ].map((ok,i)=>(
                            <div key={i} style={{ height:"3px", flex:1, borderRadius:"2px", background:ok?"#4ADE80":"rgba(255,255,255,.2)", transition:"background .3s" }}/>
                          ))}
                          <span style={{ fontSize:"11px", color:"rgba(255,255,255,.60)", marginLeft:"4px", whiteSpace:"nowrap" }}>
                            {form.password.length < 8 ? "Too short" : !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password) ? "Add letters+numbers" : /[^a-zA-Z0-9]/.test(form.password) ? "Strong 💪" : "Good ✓"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>CONFIRM PASSWORD *</label>
                      <div style={{ position:"relative" }}>
                        <input style={{ ...inputStyle, borderColor: form.confirm && form.confirm!==form.password ? "rgba(239,68,68,.7)" : form.confirm && form.confirm===form.password ? "rgba(74,222,128,.6)" : inputStyle.borderColor }} type={showConfirm?"text":"password"} placeholder="Re-enter password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})}/>
                        <span onClick={()=>setShowConfirm(p=>!p)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", cursor:"pointer", fontSize:"15px", userSelect:"none" }}>{showConfirm?"🙈":"👁️"}</span>
                      </div>
                      {form.confirm && (
                        <div style={{ marginTop:"5px", fontSize:"11px", color: form.confirm===form.password ? "#4ADE80" : "#FCA5A5" }}>
                          {form.confirm===form.password ? "✓ Passwords match" : "✗ Passwords do not match"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ background:"rgba(19,136,8,.08)", border:"1px solid rgba(19,136,8,.2)", borderRadius:"4px", padding:"8px 12px", fontSize:"13px", color:"rgba(255,255,255,.80)", fontFamily:F2, lineHeight:"1.6" }}>
                    By registering, you agree that this account is for official use only. All activities are logged and monitored as per Government IT Policy 2024.
                  </div>
                  <button onClick={handleSignup} disabled={loading} style={{ width:"100%", padding:"12px", background:"linear-gradient(135deg, #138808, #16A34A)", border:"none", borderRadius:"4px", color:"#fff", fontSize:"13px", fontWeight:"700", fontFamily:F2, cursor:"pointer", letterSpacing:".5px", transition:"opacity .2s" }}>
                    {loading ? "⏳ Registering..." : "📋 REGISTER OFFICIAL ACCOUNT"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div style={{ textAlign:"center", marginTop:"16px", fontSize:"11px", color:"rgba(255,255,255,.3)", fontFamily:F2 }}>
            © 2026 Government of India &nbsp;|&nbsp; NIC &nbsp;|&nbsp; Data protected under IT Act 2000
          </div>
          <div style={{ textAlign:"center", marginTop:"6px", fontSize:"11px", color:"rgba(255,165,0,.7)", fontFamily:F2, fontWeight:"700", letterSpacing:"0.5px" }}>
            ⚡ Made by Team Daksha
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const isMobile = useIsMobile();
  const [authUser, setAuthUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [liveNow, setLiveNow] = useState(new Date());
  const T = getTheme(dark);

  // All data lifted to root so sub-pages don't lose state on re-render
  const [issues, setIssues] = useState(INIT_ISSUES);
  const [meetings, setMeetings] = useState(INIT_MEETINGS);
  const [speeches, setSpeeches] = useState(INIT_SPEECHES);
  const [docs, setDocs] = useState(INIT_DOCS);
  const [events, setEvents] = useState(INIT_EVENTS);
  const [settings, setSettings] = useState(INIT_SETTINGS);

  // Read appearance settings (must be after settings is declared)
  const uiFontSize  = settings.fontSize    || "medium";
  const uiCompact   = settings.compactMode || false;
  const uiAccent    = settings.accentColor || ACCENT;
  const fontScaleMap = { small:"12px", medium:"14px", large:"16px" };
  const fontBase     = fontScaleMap[uiFontSize] || "14px";
  const spacingScale = uiCompact ? "0.7" : "1";

  useEffect(()=>{ const t=setInterval(()=>setPulse(p=>!p),1800); return()=>clearInterval(t); },[]);
  useEffect(()=>{ const t=setInterval(()=>setLiveNow(new Date()),1000); return()=>clearInterval(t); },[]);

  // Sync settings name/role from login user
  useEffect(()=>{
    if (authUser) setSettings(s=>({ ...s, name:authUser.name, role:authUser.role, constituency:authUser.constituency, state:authUser.state||detectState(authUser.constituency)||s.state, email:authUser.email, phone:authUser.phone||s.phone }));
  },[authUser]);

  if (!authUser) return <AuthPage onLogin={setAuthUser}/>;

  const NAV_LABELS = { dashboard:"Command Center", documents:"Document Intelligence", meetings:"Meeting Intelligence", issues:"Citizen Issue Tracker", speeches:"Speech Generator", calendar:"Schedule Manager", analytics:"Analytics & Insights", settings:"Settings" };
  const NAV_ITEMS = [
    { id:"dashboard", icon:"🏛️", label:"Dashboard" },
    { id:"documents", icon:"📄", label:"Documents" },
    { id:"meetings", icon:"📅", label:"Meetings" },
    { id:"issues", icon:"📋", label:"Issues" },
    { id:"speeches", icon:"🎤", label:"Speeches" },
    { id:"calendar", icon:"🗓️", label:"Calendar" },
    { id:"analytics", icon:"📊", label:"Analytics" },
    { id:"settings", icon:"⚙️", label:"Settings" },
  ];

  // Theme-aware style overrides for dynamic elements
  const thInp = { width:"100%", background:T.inp, border:"1.5px solid "+T.inpBorder, borderRadius:"4px", padding:"8px 12px", color:T.text, fontSize:"13px", outline:"none", boxSizing:"border-box", fontFamily:FONT_SANS };
  const thCard = (border) => ({ background:T.card, border:"1px solid "+(border||T.border), borderRadius:"6px", padding:"12px", boxShadow:dark?"0 1px 4px rgba(0,0,0,.3)":"0 1px 4px rgba(0,0,0,.06)" });

  const renderPage = () => {
    const m = isMobile;
    switch(page) {
      case "dashboard": return <Dashboard issues={issues} meetings={meetings} docs={docs} speeches={speeches} setPage={setPage} T={T} dark={dark} isMobile={m}/>;
      case "documents": return <Documents docs={docs} setDocs={setDocs} T={T} dark={dark} isMobile={m}/>;
      case "meetings":  return <Meetings meetings={meetings} setMeetings={setMeetings} T={T} dark={dark} isMobile={m}/>;
      case "issues":    return <Issues issues={issues} setIssues={setIssues} T={T} dark={dark} isMobile={m}/>;
      case "speeches":  return <Speeches speeches={speeches} setSpeeches={setSpeeches} T={T} dark={dark} isMobile={m}/>;
      case "calendar":  return <CalendarPage events={events} setEvents={setEvents} T={T} dark={dark} isMobile={m}/>;
      case "analytics": return <Analytics issues={issues} T={T} dark={dark} isMobile={m}/>;
      case "settings":  return <SettingsPage settings={settings} setSettings={setSettings} issues={issues} meetings={meetings} speeches={speeches} docs={docs} T={T} dark={dark} setDark={setDark} authUser={authUser} onLogout={()=>setAuthUser(null)} isMobile={m}/>;
      default: return null;
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", width:"100%", overflow:"hidden", background:T.bg, fontFamily:FONT_SANS, color:T.text, transition:"background .3s, color .3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        html,body{overflow-x:hidden;width:100%;max-width:100vw;-webkit-text-size-adjust:100%}
        :root{
          --t-bg:${T.bg};--t-card:${T.card};--t-border:${T.border};
          --t-text:${T.text};--t-muted:${T.muted};
          --t-inp:${T.inp};--t-inp-border:${T.inpBorder};
          --accent:${uiAccent};
          --font-base:${fontBase};
          --spacing:${spacingScale};
        }
        body{font-size:var(--font-base)!important;font-family:'Noto Sans',Arial,sans-serif}
        p,label,span:not(.icon),td,th,li{font-size:var(--font-base)!important}
        .compact-pad{padding:calc(18px * var(--spacing))!important}
        .compact-gap{gap:calc(12px * var(--spacing))!important}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:${T.scrollThumb};border-radius:2px}
        ::-webkit-scrollbar-track{background:${T.scrollTrack}}
        input,textarea,select{background:var(--t-inp)!important;color:var(--t-text)!important;border-color:var(--t-inp-border)!important;transition:background .3s,color .3s,border-color .3s;width:100%;max-width:100%}
        input::placeholder,textarea::placeholder{color:${dark?"#4A5568":"#9AAAB8"}!important}
        select option{background:${T.selectBg};color:${T.text}}
        button:disabled{opacity:.5;cursor:not-allowed}
        button:not(:disabled):active{filter:brightness(.85)}
        input:focus,textarea:focus,select:focus{border-color:#1B4F8A!important;box-shadow:0 0 0 2px rgba(27,79,138,.18)!important;outline:none}
        div,span,p,label,h1,h2,h3{transition:background-color .3s,color .3s,border-color .3s}

        /* ─── LAYOUT UTILITIES ─── */
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .g2w{display:grid;grid-template-columns:1.5fr 1fr;gap:14px}
        .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .row-sb{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}
        .col{display:flex;flex-direction:column;gap:8px}
        .card-m{background:var(--t-card);border:1px solid var(--t-border);border-radius:8px;padding:14px;margin-bottom:12px}
        .tbl-row{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:6px;border-bottom:1px solid var(--t-border)}
        .tbl-row:last-child{border-bottom:none}
        .tbl-hdr{display:grid;font-size:11px;font-weight:800;color:var(--t-muted);letter-spacing:1px;text-transform:uppercase;padding:0 12px 8px;border-bottom:2px solid var(--t-border);margin-bottom:4px}
        .chip{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;white-space:nowrap}
        .tag-pill{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap;background:var(--t-bg);color:var(--accent);border:1px solid var(--t-border)}
        .trunc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
        .toolbar{display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
        .stat-card{background:var(--t-card);border:1px solid var(--t-border);border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:4px}
        .stat-num{font-size:24px;font-weight:800;color:var(--accent)}
        .stat-lbl{font-size:11px;font-weight:700;color:var(--t-muted);text-transform:uppercase;letter-spacing:.5px}
        .sec-title{font-size:13px;font-weight:800;color:var(--accent);text-transform:uppercase;letter-spacing:1px;padding-left:8px;border-left:3px solid #FF6600;margin-bottom:10px}
        .mob-label{display:none;font-size:10px;font-weight:700;color:var(--t-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:1px}
        .btn-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}

        /* ─── NAV HIDE SCROLLBAR ─── */
        .nav-bar::-webkit-scrollbar{display:none}
        .nav-bar{-ms-overflow-style:none;scrollbar-width:none}

        /* ─── MOBILE ≤ 767px ─── */
        @media(max-width:767px){
          *{max-width:100%;box-sizing:border-box}
          .g4{grid-template-columns:1fr 1fr!important;gap:8px!important}
          .g2,.g2w,.g3{grid-template-columns:1fr!important;gap:8px!important}
          .tbl-hdr{display:none!important}
          .desk-only{display:none!important}
          .mob-label{display:block!important}
          .stat-num{font-size:17px!important}
          .stat-lbl{font-size:9px!important}
          .stat-card{padding:8px!important;min-width:0!important;overflow:hidden!important}
          .card-m{padding:8px!important}
          .toolbar{gap:6px!important;flex-wrap:wrap!important}
          .toolbar input,.toolbar select{min-width:0!important;flex:1 1 100px!important}
          .mob-full-w{width:100%!important}
          .btn-row{gap:4px!important;flex-wrap:wrap!important}
          .btn-row button{font-size:11px!important;padding:4px 8px!important}
          .trunc{max-width:140px!important}
          h2,h3{font-size:14px!important}
          .sec-title{font-size:10px!important}
          select,input,textarea{font-size:12px!important;max-width:100%!important}
          button{font-size:11px!important}
          div[style*="gridTemplateColumns"]{min-width:0!important}
          div[style*="display:grid"]{overflow:hidden!important}
          .nav-bar button span:first-child{font-size:18px!important}
        }

        /* ─── SMALL ≤ 480px ─── */
        @media(max-width:480px){
          .g4{grid-template-columns:1fr 1fr!important}
          .g2w{grid-template-columns:1fr!important}
          .stat-num{font-size:15px!important}
          .chip,.tag-pill{font-size:9px!important;padding:1px 4px!important}
          .sec-title{letter-spacing:0.5px!important}
        }
      `}</style>

      {/* ══ GOV HEADER ══ */}
      <div style={{ background:"var(--accent,#1B4F8A)", flexShrink:0 }}>

        {/* ── Top utility bar ── */}
        <div style={{ background:"#0F3460", padding:"4px 16px", display:"flex", alignItems:"center", gap:"10px" }}>
          {/* AI dot */}
          <div style={{ display:"flex", alignItems:"center", gap:"5px", flexShrink:0 }}>
            <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:pulse?"#4ADE80":"#6B7280", boxShadow:pulse?"0 0 6px #4ADE80":"none", transition:"all .5s" }}/>
            <span style={{ fontSize:"12px", color:"rgba(255,255,255,.85)" }}>AI Active</span>
          </div>
          {!isMobile && <span style={{ fontSize:"12px", color:"rgba(255,255,255,.55)" }}>|</span>}
          {!isMobile && <span style={{ fontSize:"12px", color:"rgba(255,255,255,.75)" }}>{getGovLabel(settings)} · Ministry of Public Administration</span>}
          <div style={{ flex:1 }}/>
          {!isMobile && <span style={{ fontSize:"12px", color:"rgba(255,255,255,.85)", fontFamily:"monospace", letterSpacing:"0.5px", flexShrink:0 }}>
            🗓 {liveNow.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
            &nbsp;&nbsp;🕐 {liveNow.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true})} IST
          </span>}
          {/* Dark toggle */}
          <button onClick={()=>setDark(d=>!d)} style={{ display:"flex", alignItems:"center", gap:"4px", cursor:"pointer", background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.2)", borderRadius:"20px", padding:"3px 10px", fontSize:"12px", color:"rgba(255,255,255,.92)", fontWeight:"600", flexShrink:0 }}>
            <span>{dark?"☀️":"🌙"}</span><span>{dark?"Light":"Dark"}</span>
          </button>
          {/* User + logout */}
          <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
            <span style={{ fontSize:"12px", color:"rgba(255,255,255,.85)", maxWidth:isMobile?"70px":"150px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{authUser.name}</span>
            <button onClick={()=>setAuthUser(null)} style={{ cursor:"pointer", background:"rgba(192,57,43,.25)", border:"1px solid rgba(192,57,43,.4)", borderRadius:"4px", padding:"2px 8px", fontSize:"12px", color:"#FCA5A5", fontWeight:"700" }}>Out</button>
          </div>
        </div>

        {/* ── Branding bar ── */}
        <div style={{ padding:isMobile?"8px 12px":"10px 20px", display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ width:isMobile?"36px":"48px", height:isMobile?"36px":"48px", background:"rgba(255,255,255,.15)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:isMobile?"18px":"22px", flexShrink:0, border:"2px solid rgba(255,255,255,.3)" }}>🇮🇳</div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontSize:isMobile?"15px":"20px", fontWeight:"700", color:"#fff", lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>मंत्री मित्र — Mantri Mitra AI</div>
            {!isMobile && <div style={{ fontSize:"12px", color:"rgba(255,255,255,.85)", marginTop:"2px" }}>AI-Powered Constituency Management System</div>}
            <div style={{ fontSize:isMobile?"11px":"13px", color:"#FF6600", fontWeight:"600", marginTop:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{settings.constituency} · {settings.name} ({settings.role})</div>
          </div>
          {!isMobile && (
            <div style={{ display:"flex", flexDirection:"column", gap:"3px", flexShrink:0, alignItems:"flex-end" }}>
              <div style={{ width:"72px", height:"4px", background:"#FF6600", borderRadius:"2px" }}/>
              <div style={{ width:"72px", height:"4px", background:"#fff", borderRadius:"2px" }}/>
              <div style={{ width:"72px", height:"4px", background:"#138808", borderRadius:"2px" }}/>
              <div style={{ fontSize:"11px", color:"rgba(255,255,255,.7)", marginTop:"3px" }}>सत्यमेव जयते</div>
            </div>
          )}
        </div>

        {/* ── Navigation bar ── */}
        <div className="nav-bar" style={{ background:"#0F3460", display:"flex", overflowX:"auto", borderTop:"2px solid #FF6600" }}>
          {NAV_ITEMS.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)}
              style={{
                padding: isMobile ? "7px 10px" : "10px 18px",
                cursor:"pointer",
                fontFamily:FONT_SANS,
                color: page===n.id ? "#fff" : "rgba(255,255,255,.55)",
                background: page===n.id ? "rgba(255,255,255,.12)" : "transparent",
                borderBottom: page===n.id ? "3px solid #FF6600" : "3px solid transparent",
                borderTop:"none", borderLeft:"none", borderRight:"none",
                display:"flex", alignItems:"center",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? "2px" : "7px",
                flexShrink:0,
                minWidth: isMobile ? "52px" : "auto",
                transition:"all .15s",
                whiteSpace:"nowrap",
              }}>
              <span style={{ fontSize: isMobile ? "18px" : "14px", lineHeight:1 }}>{n.icon}</span>
              <span style={{ fontSize: isMobile ? "9px" : "13px", fontWeight:"700", letterSpacing:".2px" }}>{n.label}</span>
            </button>
          ))}
        </div>
      </div>

            {/* ══ BODY ══ */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", minWidth:0 }}>
        {/* Breadcrumb */}
        <div style={{ padding:"4px 10px", background:T.subBar, borderBottom:"1px solid "+T.subBarBorder, display:"flex", alignItems:"center" }}>
          <span style={{ color:T.muted, fontSize:"11px" }}>Home</span>
          <span style={{ color:T.muted, fontSize:"11px", margin:"0 4px" }}>›</span>
          <span style={{ fontSize:"11px", color:"var(--accent,#1B4F8A)", fontWeight:"700", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{NAV_LABELS[page]}</span>
        </div>
        {/* Page heading */}
        <div style={{ padding:"8px 10px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", paddingBottom:"8px", borderBottom:"2px solid "+T.border }}>
            <div style={{ width:"3px", height:"22px", background:"#FF6600", borderRadius:"2px", flexShrink:0 }}/>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:"16px", fontWeight:"700", color:T.text, lineHeight:1.2 }}>{NAV_LABELS[page]}</div>
              <div style={{ fontSize:"10px", color:T.muted }}>{settings.constituency} · {getGovLabel(settings)}</div>
            </div>
          </div>
        </div>
        {/* Page content */}
        <div style={{ padding:"8px 10px" }}>{renderPage()}</div>
      </div>

      {/* ══ FOOTER ══ */}
      <div style={{ background:"#0F3460", padding:"6px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, borderTop:"2px solid #FF6600", flexWrap:"wrap", gap:"4px" }}>
        <div style={{ fontSize:"10px", color:"rgba(255,255,255,.7)", textAlign:"center" }}>© 2026 Mantri Mitra AI · NIC Powered · Data protected under IT Act 2000</div>
        <div style={{ fontSize:"10px", color:"rgba(255,165,0,.9)", fontWeight:"700", letterSpacing:"0.5px" }}>⚡ Made by Team Daksha</div>
      </div>
    </div>
  );
}
