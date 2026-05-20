import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔴 METTEZ VOTRE CLÉ API ICI :
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SPOILER_KEYWORDS = [
  "mort", "meurt", "mourir", "tué", "tue", "assassiné", "assassine",
  "révèle", "révélation", "twist", "retournement", "surprise",
  "fin", "finale", "dénouement", "conclusion", "vrai", "identité", 
  "secret", "trahison", "trahi", "traître", "dies", "dead", "death", 
  "killed", "reveal", "ending", "plot twist", "spoiler", "père", 
  "mère", "sœur", "frère", "fils", "fille", "survit", "villain", "coupable"
];

async function fetchAIContent(title) {
  if (GEMINI_API_KEY === "VOTRE_CLE_API_GEMINI" || !GEMINI_API_KEY) {
    throw new Error("Veuillez configurer votre clé API Gemini à la ligne 5 du code.");
  }
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Fais un résumé très COURT, global et condensé du film ou de la série "${title}".
Règles strictes :
- Découpe le résumé et fait en sorte que cela fasse 4 lignes par paragraphe).
- Le style doit être général et aller à l'essentiel sans trop de détails secondaires et sans spoil, surtout pas d'indice sur la fin ou sur le dénouement majeur ect vraiment rester vague mais donner envie..
- Ne mets aucun titre, aucune introduction, pas de gras.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export default function App() {
  const [title, setTitle] = useState("");
  const [paragraphs, setParagraphs] = useState([]);
  const [revealed, setRevealed] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [searchedTitle, setSearchedTitle] = useState("");
  const [stats, setStats] = useState(null);

  const isSpoiler = (text) => {
    const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
    const words = cleanText.split(/\s+/);
    return SPOILER_KEYWORDS.some((kw) => words.includes(kw));
  };

  const fetchContent = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    setParagraphs([]);
    setRevealed({});
    setStats(null);
    setLoadingMsg("Génération en cours…");

    try {
      const rawText = await fetchAIContent(title.trim());

      const rawParagraphs = rawText
        .split("\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 15);

      if (rawParagraphs.length === 0) throw new Error("Format invalide.");

      const processed = rawParagraphs.map((p, i) => ({
        id: i,
        text: p,
        spoiler: isSpoiler(p),
      }));

      const spoilerCount = processed.filter((p) => p.spoiler).length;
      setParagraphs(processed);
      setSearchedTitle(title.trim());
      setStats({ total: processed.length, spoilers: spoilerCount });
    } catch (e) {
      setError(e.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const toggleReveal = (id) => setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  const revealAll = () => {
    const all = {};
    paragraphs.forEach((p) => { if (p.spoiler) all[p.id] = true; });
    setRevealed(all);
  };
  const hideAll = () => setRevealed({});

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Georgia',serif", color: "#e8e0d0" }}>
      <div style={{ background: "#111118", borderBottom: "1px solid #2a2a3a", padding: "2.5rem 2rem 2rem" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e63946" }} />
            <span style={{ fontSize: "11px", letterSpacing: "3px", color: "#888", textTransform: "uppercase", fontFamily: "monospace" }}>Spoiler Protection System</span>
          </div>
          <h1 style={{ fontSize: "2.8rem", fontWeight: "400", margin: "0 0 6px", color: "#f5f0e8" }}>
            Spoiler<span style={{ color: "#e63946" }}>.</span>Blocker
          </h1>
          <p style={{ fontSize: "15px", color: "#666", margin: 0, fontFamily: "monospace" }}>
            
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem 2rem" }}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "2rem" }}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchContent()}
            placeholder="Entrez un film ou une série..."
            style={{ flex: 1, background: "#111118", border: "1px solid #2a2a3a", borderRadius: "6px", padding: "14px", fontSize: "16px", color: "#e8e0d0", fontFamily: "monospace", outline: "none" }}
          />
          <button onClick={fetchContent} disabled={loading || !title.trim()} style={{ background: "#e63946", color: "#fff", border: "none", borderRadius: "6px", padding: "14px 24px", fontFamily: "monospace", cursor: "pointer" }}>
            {loading ? "SCAN…" : "SCANNER"}
          </button>
        </div>

        {error && <div style={{ background: "#1a0a0a", border: "1px solid #5a1a1a", borderRadius: "6px", padding: "14px", color: "#e66", fontFamily: "monospace", marginBottom: "2rem" }}>⚠ {error}</div>}

        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#888", fontFamily: "monospace" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px", display: "inline-block", animation: "spin 1s linear infinite" }}>◌</div>
            <p style={{ fontSize: "14px", letterSpacing: "1px" }}>{loadingMsg}</p>
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </div>
        )}

        {stats && paragraphs.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111118", border: "1px solid #2a2a3a", borderRadius: "6px", padding: "14px 18px", marginBottom: "2rem" }}>
            <div>
              <span style={{ color: "#888", fontFamily: "monospace" }}>{searchedTitle.toUpperCase()} — </span>
              <span style={{ color: "#e63946", fontFamily: "monospace" }}>{stats.spoilers} bloc(s) masqué(s)</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={revealAll} style={{ background: "transparent", border: "1px solid #3a3a4a", color: "#888", padding: "6px 14px", fontFamily: "monospace", fontSize: "12px", cursor: "pointer" }}>TOUT RÉVÉLER</button>
              <button onClick={hideAll} style={{ background: "transparent", border: "1px solid #3a3a4a", color: "#888", padding: "6px 14px", fontFamily: "monospace", fontSize: "12px", cursor: "pointer" }}>TOUT MASQUER</button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {paragraphs.map((para) => (
            <ParagraphBlock key={para.id} para={para} revealed={!!revealed[para.id]} onToggle={() => toggleReveal(para.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ParagraphBlock({ para, revealed, onToggle }) {
  if (!para.spoiler) {
    return <div style={{ padding: "18px 20px", background: "#0f0f18", border: "1px solid #1a1a2a", borderRadius: "6px", lineHeight: "1.8", fontSize: "15.5px", color: "#c8c0b0" }}>{para.text}</div>;
  }

  return (
    <div style={{ position: "relative", borderRadius: "6px", overflow: "hidden", border: revealed ? "1px solid #3a1a1a" : "1px solid #2a1a1a", marginBottom: "10px" }}>
      <div style={{ background: revealed ? "#1a0a0a" : "#150808", padding: "7px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #2a1010" }}>
        <span style={{ color: "#e63946", fontSize: "11px", fontFamily: "monospace", letterSpacing: "2px" }}>SPOILER DÉTECTÉ</span>
        <button onClick={onToggle} style={{ background: "transparent", border: "1px solid #3a1a1a", borderRadius: "3px", color: "#e63946", fontFamily: "monospace", fontSize: "11px", padding: "3px 10px", cursor: "pointer" }}>
          {revealed ? "MASQUER" : "RÉVÉLER"}
        </button>
      </div>
      <div style={{ padding: "18px 20px", background: "#0f0808", lineHeight: "1.8", fontSize: "15.5px", position: "relative" }}>
        <span style={{ color: revealed ? "#c8b0b0" : "transparent", filter: revealed ? "none" : "blur(12px)", userSelect: revealed ? "auto" : "none", display: "block", transition: "filter 0.3s ease" }}>
          {para.text}
        </span>
        {!revealed && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,8,8,0.6)" }}>
            <span style={{ background: "#1a0505", border: "1px solid #3a0a0a", color: "#e63946", fontFamily: "monospace", fontSize: "12px", padding: "8px 16px", borderRadius: "4px" }}>
              ████ CONTENU MASQUÉ ████
            </span>
          </div>
        )}
      </div>
    </div>
  );
}