import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import "../styles/globals.css";

const STYLES = [
  { id: "pixar3d",    label: "Pixar 3D",      emoji: "🎬", color: "#16a34a" },
  { id: "disney2d",  label: "Classic Disney", emoji: "✨", color: "#15803d" },
  { id: "stopmotion",label: "Stop Motion",    emoji: "🧸", color: "#166534" },
  { id: "storybook", label: "Παραμύθι",       emoji: "📖", color: "#14532d" },
];

const CHARACTER_SUGGESTIONS = [
  "a tiny dragon with oversized wings",
  "an old lighthouse keeper",
  "a clumsy robot learning to dance",
  "a brave little snail",
  "a grumpy cloud",
  "a lost baby elephant",
];
const ACTION_SUGGESTIONS = [
  "discovers a hidden glowing door",
  "tries to return a magic lantern",
  "learns to fly for the first time",
  "says goodbye to their best friend",
  "finds a secret treasure map",
  "saves the entire village",
];
const SETTING_SUGGESTIONS = [
  "a foggy enchanted forest",
  "a floating sky city at sunset",
  "the bottom of the ocean",
  "a tiny mushroom village",
  "an abandoned toy factory",
  "a magical bakery at midnight",
];

function buildPrompt(styleId, character, action, setting) {
  const styleMap = {
    pixar3d:    "Pixar 3D CGI animation style, subsurface scattering skin shaders, expressive oversized eyes, smooth cloth simulation, volumetric rim lighting, warm cinematic color grading, shallow depth of field, filmic lens flare",
    disney2d:   "Classic Walt Disney hand-drawn 2D animation style, fluid ink outlines, watercolor background washes, multiplane camera depth, expressive squash-and-stretch, golden hour warm palette, vintage film warmth",
    stopmotion: "Laika-style stop motion animation, visible felt and clay texture, slight motion blur, warm practical set lighting, shallow depth of field, handcrafted feel, 16mm film grain overlay",
    storybook:  "Illustrated storybook animation style, soft painterly textures, Ghibli-inspired backgrounds, gentle camera drift, pastel palette with warm golden accents, dreamy soft-focus edges, magical light rays",
  };
  const mood = (action.includes("goodbye") || action.includes("lost"))
    ? "bittersweet and emotionally resonant, swelling orchestral undertone"
    : "wondrous and uplifting, full of childlike wonder and magic";
  return `${styleMap[styleId] || styleMap.pixar3d}. Scene: ${character} ${action} in ${setting}. Mood: ${mood}. Camera: slow cinematic push-in, medium wide shot transitioning to close-up on character face revealing emotion. Lighting: golden hour volumetric rays, soft ambient occlusion, warm rim light. No text, no watermarks, no real human faces, original fictional characters only. 5-second cinematic clip.`;
}

function Pill({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "#fff", border: "2px solid #1a1a1a", borderRadius: "20px",
      padding: "0.25rem 0.75rem", fontSize: "0.66rem", cursor: "pointer",
      fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: "#1a1a1a",
      boxShadow: "2px 2px 0 #1a1a1a", transition: "all 0.12s", whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );
}

function Field({ label, emoji, value, onChange, suggestions, placeholder, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span style={{ fontSize: "1.2rem" }}>{emoji}</span>
        <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1rem" }}>{label}</span>
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: "#fff", border: `3px solid ${value ? color : "#d0d0d0"}`,
          borderRadius: "12px", padding: "0.75rem 1rem", fontSize: "0.85rem",
          fontFamily: "'Nunito', sans-serif", fontWeight: 600, color: "#1a1a1a",
          boxShadow: value ? `3px 3px 0 ${color}` : "2px 2px 0 #d0d0d0",
          transition: "all 0.18s", width: "100%",
        }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {suggestions.map(s => <Pill key={s} label={s} onClick={() => onChange(s)} />)}
      </div>
    </div>
  );
}

export default function Home() {
  const [style, setStyle]         = useState("pixar3d");
  const [character, setCharacter] = useState("");
  const [action, setAction]       = useState("");
  const [setting, setSetting]     = useState("");
  const [phase, setPhase]         = useState("create");
  const [progress, setProgress]   = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [videoUrl, setVideoUrl]   = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");
  const [history, setHistory]     = useState([]);
  const [builtPrompt, setBuiltPrompt] = useState("");
  const pollRef = useRef(null);

  const activeStyle = STYLES.find(s => s.id === style);
  const canGenerate = character.trim() && action.trim() && setting.trim();
  const GREEN = "#16a34a", LIGHT = "#f0fdf4", MID = "#bbf7d0";

  const handleGenerate = async () => {
    if (!canGenerate) return;
    const prompt = buildPrompt(style, character.trim(), action.trim(), setting.trim());
    setBuiltPrompt(prompt);
    setPhase("generating");
    setProgress(15);
    setErrorMsg("");
    setVideoUrl(null);

    try {
      setStatusMsg("🚀 Αποστολή στο Sora 2...");
      setProgress(35);

      const createRes = await fetch("/api/create-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || `HTTP ${createRes.status}`);

      const genId = createData.id;
      setProgress(50);
      setStatusMsg("🎨 Το Sora 2 ζωγραφίζει τα καρέ σου...");

      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await fetch(`/api/poll-video?generation_id=${genId}`);
          const result = await pollRes.json();
          if (!pollRes.ok) throw new Error(result.error || `Poll HTTP ${pollRes.status}`);

          setProgress(Math.min(50 + (result.progress || 0) * 0.47, 97));

          if (result.status === "completed") {
            clearInterval(pollRef.current);
            const url = result.video?.url || result.generations?.[0]?.url || result.url || result.output;
            if (url) {
              setVideoUrl(url);
              setHistory(prev => [{ url, style: activeStyle.label, title: `${character} ${action}`, emoji: activeStyle.emoji }, ...prev.slice(0, 5)]);
              setProgress(100);
              setPhase("result");
            } else throw new Error("Ολοκληρώθηκε αλλά δεν βρέθηκε URL βίντεο.");
          } else if (result.status === "failed" || result.status === "error") {
            clearInterval(pollRef.current);
            throw new Error(result.error?.message || result.error || "Η δημιουργία απέτυχε.");
          } else if (attempts > 80) {
            clearInterval(pollRef.current);
            throw new Error("Λήξη χρόνου. Δοκίμασε ξανά.");
          }
        } catch (e) { clearInterval(pollRef.current); setErrorMsg(e.message); setPhase("error"); }
      }, 10000);
    } catch (e) { setErrorMsg(e.message); setPhase("error"); }
  };

  const handleReset = () => { setPhase("create"); setProgress(0); setVideoUrl(null); setStatusMsg(""); setBuiltPrompt(""); };
  const handleFresh = () => { handleReset(); setCharacter(""); setAction(""); setSetting(""); };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const preview = (character || action || setting)
    ? `${character || "[χαρακτήρας]"} ${action || "[ενέργεια]"}${setting ? " in " + setting : ""}`
    : null;

  return (
    <>
      <Head>
        <title>FilmCraft AI — Pixar & Disney Video Maker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* TICKER */}
      <div style={{ background: "#14532d", color: MID, padding: "0.4rem 0", overflow: "hidden" }}>
        <div style={{ display: "flex", animation: "marquee 22s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
          {[...Array(8)].map((_, i) => (
            <span key={i} style={{ fontSize: "0.68rem", letterSpacing: "0.1em", marginRight: "2.5rem", fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>
              🎬 FILMCRAFT AI &nbsp;★&nbsp; PIXAR & DISNEY ΣΤΥΛ &nbsp;★&nbsp; ΠΕΡΙΓΡΑΨΕ ΤΟ. ΔΕΙΤΟ. &nbsp;★&nbsp; POWERED BY SORA 2 &nbsp;★&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <header style={{ background: GREEN, borderBottom: "4px solid #1a1a1a", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.6rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <span className="float" style={{ fontSize: "2.2rem", display: "inline-block" }}>🎥</span>
          <div>
            <div style={{ fontSize: "2rem", color: "#fff", lineHeight: 1, textShadow: "3px 3px 0 #14532d" }}>FilmCraft</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.6rem", color: MID, fontWeight: 800, letterSpacing: "0.12em" }}>ΔΗΜΙΟΥΡΓΟΣ ΒΙΝΤΕΟ AI — PIXAR & DISNEY</div>
          </div>
        </div>
        {phase !== "create" && (
          <button onClick={handleFresh} className="btn-pop" style={{ background: "#fff", border: "3px solid #1a1a1a", borderRadius: "20px", padding: "0.35rem 1.1rem", fontSize: "0.8rem", cursor: "pointer", fontFamily: "'Fredoka One', cursive", boxShadow: "3px 3px 0 #1a1a1a" }}>
            + ΝΕΑ ΣΚΗΝΗ
          </button>
        )}
      </header>

      <main style={{ maxWidth: 660, margin: "0 auto", padding: "1.8rem 1rem 4rem" }}>

        {/* CREATE */}
        {phase === "create" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", gap: "1.6rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(1.9rem,6vw,3rem)", lineHeight: 1.15, marginBottom: "0.7rem" }}>
                Φτιάξε τη δική σου<br />
                <span style={{ background: MID, padding: "2px 12px", border: "3px solid #1a1a1a", borderRadius: "10px", display: "inline-block", transform: "rotate(-1.5deg)", boxShadow: "4px 4px 0 #1a1a1a", color: "#14532d" }}>ταινία Pixar</span>
                &nbsp;✨
              </div>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.85rem", color: "#555", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
                Συμπλήρωσε 3 κενά → φτιάχνουμε το τέλειο Sora 2 prompt → παίρνεις κινηματογραφικό AI βίντεο
              </p>
            </div>

            {/* Style picker */}
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.7rem", color: "#6b7280", marginBottom: "0.7rem", letterSpacing: "0.08em", fontWeight: 800 }}>ΔΙΑΛΕΞΕ ΣΤΥΛ ANIMATION</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.6rem" }}>
                {STYLES.map(s => (
                  <div key={s.id} className="style-card" onClick={() => setStyle(s.id)} style={{
                    background: style === s.id ? s.color : "#fff",
                    border: "3px solid #1a1a1a", borderRadius: "14px 16px 14px 12px",
                    padding: "0.8rem 0.4rem", textAlign: "center",
                    boxShadow: style === s.id ? "5px 5px 0 #1a1a1a" : "3px 3px 0 #1a1a1a",
                    transform: style === s.id ? "translateY(-3px)" : "none",
                  }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.3rem" }}>{s.emoji}</div>
                    <div style={{ fontSize: "0.65rem", fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: style === s.id ? "#fff" : "#1a1a1a", lineHeight: 1.2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mad Libs */}
            <div style={{ background: "#fff", border: "3px solid #1a1a1a", borderRadius: "18px", boxShadow: "5px 5px 0 #1a1a1a", padding: "1.4rem", display: "flex", flexDirection: "column", gap: "1.3rem" }}>
              <div style={{ background: activeStyle?.color || GREEN, border: "2px solid #1a1a1a", borderRadius: "12px", padding: "0.8rem 1rem", fontFamily: "'Nunito', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "#fff", lineHeight: 1.6, minHeight: 56, display: "flex", alignItems: "center", boxShadow: "3px 3px 0 #1a1a1a" }}>
                {preview ? <span>📽️ &nbsp;<em>{preview}</em></span> : <span style={{ opacity: 0.75 }}>📽️ &nbsp;Η ιστορία σου θα εμφανιστεί εδώ καθώς γράφεις...</span>}
              </div>
              <Field label="Ποιος είναι ο χαρακτήρας σου;" emoji="🦸" value={character} onChange={setCharacter} placeholder="π.χ. a tiny dragon with oversized wings" suggestions={CHARACTER_SUGGESTIONS} color={activeStyle?.color || GREEN} />
              <Field label="Τι κάνει;" emoji="⚡" value={action} onChange={setAction} placeholder="π.χ. discovers a hidden glowing door" suggestions={ACTION_SUGGESTIONS} color={activeStyle?.color || GREEN} />
              <Field label="Πού γίνεται;" emoji="🌍" value={setting} onChange={setSetting} placeholder="π.χ. a foggy enchanted forest" suggestions={SETTING_SUGGESTIONS} color={activeStyle?.color || GREEN} />
              <button onClick={handleGenerate} disabled={!canGenerate} className="btn-pop"
                style={{ background: canGenerate ? "#14532d" : "#e0e0e0", color: canGenerate ? MID : "#aaa", border: "3px solid #1a1a1a", borderRadius: "14px", padding: "0.9rem", fontSize: "1.1rem", cursor: canGenerate ? "pointer" : "not-allowed", fontFamily: "'Fredoka One', cursive", boxShadow: canGenerate ? "4px 4px 0 #1a1a1a" : "none", width: "100%", marginTop: "0.3rem" }}>
                {canGenerate ? "✨ ΦΤΙΑΞΕ ΤΟ ΒΙΝΤΕΟ ΜΟΥ ✨" : "Συμπλήρωσε και τα 3 πεδία →"}
              </button>
            </div>

            {history.length > 0 && (
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.7rem", color: "#9ca3af", marginBottom: "0.6rem", fontWeight: 800 }}>📼 ΠΡΟΣΦΑΤΕΣ ΣΚΗΝΕΣ</div>
                {history.map((h, i) => (
                  <div key={i} style={{ background: "#fff", border: "2px solid #1a1a1a", borderRadius: "10px", padding: "0.65rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", boxShadow: "2px 2px 0 #1a1a1a" }}>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.78rem", fontWeight: 700 }}>{h.emoji} {h.title}</div>
                    <a href={h.url} target="_blank" rel="noreferrer" style={{ background: MID, border: "2px solid #1a1a1a", borderRadius: "8px", padding: "0.25rem 0.7rem", fontSize: "0.65rem", fontFamily: "'Nunito', sans-serif", fontWeight: 800, textDecoration: "none", color: "#14532d", boxShadow: "2px 2px 0 #1a1a1a" }}>ΔΕΙΤΟ ↗</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GENERATING */}
        {phase === "generating" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 460, gap: "2rem", textAlign: "center" }}>
            <span style={{ fontSize: "5rem", display: "inline-block", animation: "float 1.8s ease-in-out infinite" }}>🎬</span>
            <div style={{ background: activeStyle?.color || GREEN, border: "3px solid #1a1a1a", borderRadius: "16px 20px 18px 14px", padding: "1.2rem 2rem", maxWidth: 360, boxShadow: "4px 4px 0 #1a1a1a" }}>
              <div style={{ fontSize: "1.1rem", color: "#fff", textShadow: "1px 1px 0 #14532d", marginBottom: "0.3rem" }}>{statusMsg}</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", color: "#d1fae5" }}>Το Sora 2 χρειάζεται 1–3 λεπτά ☕</div>
            </div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.88rem", fontWeight: 700, color: "#6b7280", fontStyle: "italic" }}>
              "{character} {action}{setting ? ` in ${setting}` : ""}"
            </div>
            <div style={{ width: "100%", maxWidth: 400 }}>
              <div style={{ background: "#d1fae5", border: "3px solid #1a1a1a", borderRadius: "20px", height: 26, overflow: "hidden", boxShadow: "4px 4px 0 #1a1a1a", position: "relative" }}>
                <div style={{ height: "100%", background: `linear-gradient(90deg,${GREEN},#4ade80)`, width: `${progress}%`, transition: "width 1s ease", borderRadius: "17px" }}>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(255,255,255,0.15) 6px,rgba(255,255,255,0.15) 12px)", borderRadius: "17px" }} />
                </div>
                {progress > 8 && <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.65rem", fontFamily: "'Nunito', sans-serif", fontWeight: 800, color: "#14532d" }}>{Math.round(progress)}%</div>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.6rem", fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: "#9ca3af" }}>
                <span>🚀 Αποστολή</span><span>🎨 Rendering</span><span>🎉 Έτοιμο!</span>
              </div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === "result" && (
          <div className="pop-in" style={{ display: "flex", flexDirection: "column", gap: "1.3rem" }}>
            <div style={{ background: activeStyle?.color || GREEN, border: "3px solid #1a1a1a", borderRadius: "16px", padding: "1rem 1.3rem", boxShadow: "5px 5px 0 #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.7rem" }}>
              <div>
                <div style={{ fontSize: "1.2rem", color: "#fff", textShadow: "2px 2px 0 #14532d" }}>{activeStyle?.emoji} {character} {action}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.68rem", color: "#d1fae5", fontWeight: 700, marginTop: "2px" }}>{activeStyle?.label} · {setting}</div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <a href={videoUrl} download="filmcraft.mp4" style={{ background: "#fff", border: "3px solid #1a1a1a", borderRadius: "10px", padding: "0.45rem 1rem", fontSize: "0.75rem", fontFamily: "'Nunito', sans-serif", fontWeight: 800, textDecoration: "none", color: "#1a1a1a", boxShadow: "3px 3px 0 #1a1a1a" }}>↓ ΑΠΟΘΗΚΕΥΣΗ</a>
                <button onClick={handleFresh} className="btn-pop" style={{ background: "#14532d", color: MID, border: "3px solid #1a1a1a", borderRadius: "10px", padding: "0.45rem 1.1rem", fontSize: "0.85rem", cursor: "pointer", fontFamily: "'Fredoka One', cursive", boxShadow: "3px 3px 0 #1a1a1a" }}>ΝΕΑ →</button>
              </div>
            </div>
            <div style={{ border: "4px solid #1a1a1a", borderRadius: "18px", overflow: "hidden", boxShadow: "6px 6px 0 #1a1a1a" }}>
              <video src={videoUrl} controls autoPlay loop />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
              <button onClick={handleReset} className="btn-pop" style={{ background: MID, border: "3px solid #1a1a1a", borderRadius: "12px", padding: "0.7rem", fontSize: "0.82rem", cursor: "pointer", fontFamily: "'Fredoka One', cursive", boxShadow: "3px 3px 0 #1a1a1a", color: "#14532d" }}>🔄 Ίδια ιδέα, άλλο στυλ</button>
              <button onClick={handleFresh} className="btn-pop" style={{ background: "#fff", border: "3px solid #1a1a1a", borderRadius: "12px", padding: "0.7rem", fontSize: "0.82rem", cursor: "pointer", fontFamily: "'Fredoka One', cursive", boxShadow: "3px 3px 0 #1a1a1a" }}>✨ Ολοκαίνουρια σκηνή</button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div className="slide-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.6rem", textAlign: "center", minHeight: 380, justifyContent: "center" }}>
            <span className="wiggle" style={{ fontSize: "4.5rem", display: "inline-block" }}>😵</span>
            <div style={{ background: "#ef4444", border: "3px solid #1a1a1a", borderRadius: "16px", padding: "1.3rem 1.8rem", maxWidth: 420, boxShadow: "4px 4px 0 #1a1a1a" }}>
              <div style={{ fontSize: "1.3rem", color: "#fff", textShadow: "2px 2px 0 #7f1d1d", marginBottom: "0.5rem" }}>Ουπς! Κάτι πήγε στραβά 😬</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.72rem", color: "#fecaca", lineHeight: 1.6, wordBreak: "break-word", textAlign: "left" }}>{errorMsg}</div>
            </div>
            <button onClick={handleReset} className="btn-pop" style={{ background: MID, border: "3px solid #1a1a1a", borderRadius: "14px", padding: "0.75rem 2rem", fontSize: "1rem", cursor: "pointer", fontFamily: "'Fredoka One', cursive", boxShadow: "4px 4px 0 #1a1a1a", color: "#14532d" }}>
              ΔΟΚΙΜΑΣΕ ΞΑΝΑ 🔄
            </button>
          </div>
        )}

      </main>

      <footer style={{ background: "#14532d", color: MID, textAlign: "center", padding: "1rem", fontSize: "0.7rem", fontFamily: "'Nunito', sans-serif", fontWeight: 800, letterSpacing: "0.08em", borderTop: "4px solid #1a1a1a" }}>
        ✦ FILMCRAFT AI · ΔΗΜΙΟΥΡΓΟΣ ΒΙΝΤΕΟ PIXAR & DISNEY · POWERED BY SORA 2 ✦
      </footer>
    </>
  );
}
