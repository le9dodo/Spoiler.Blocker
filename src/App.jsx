import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔴 CONFIGURATION DE LA CLÉ SÉCURISÉE (pour l'étape Vercel)
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
  if (!GEMINI_API_KEY) {
    throw new Error("Veuillez configurer votre clé API Gemini (Variable d'environnement manquante).");
  }
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Fais un résumé très COURT, global et condensé du film ou de la série "${title}".
Règles strictes à respecter :
- Rédige exactement 4 paragraphes distincts.
- Chaque paragraphe doit être très court et faire environ 3 à 4 lignes maximum.
- Le style doit être général, mystérieux et accrocheur pour donner envie de regarder.
- Interdiction absolue de mettre des indices sur la fin, le dénouement majeur, les trahisons ou les twists. Reste vague.
- Ne mets aucun titre, aucune introduction, pas de gras, pas de listes. Sépare juste les paragraphes par un saut de ligne.`;

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
  const [likedMovies, setLikedMovies] = useState([]); // Liste des films aimés
  const [email, setEmail] = useState(""); // Email de l'utilisateur
  const [emailStatus, setEmailStatus] = useState(""); // Message de succès pour l'email
  const [recommendation, setRecommendation] = useState(""); // Film similaire proposé par l'IA

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
    setRecommendation(""); // Réinitialise la recommandation
    setLoadingMsg("Génération en cours…");

    try {
      const rawText = await fetchAIContent(title.trim());

      // 💡 Demande à l'IA une proposition similaire à la volée
      const recPrompt = `Donne-moi uniquement le titre d'un seul film ou d'une seule série très similaire à "${title.trim()}". Ne fais pas de phrase, écris juste le titre. Exemple: Inception`;
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const recResult = await model.generateContent(recPrompt);
      const recResponse = await recResult.response;
      setRecommendation(recResponse.text().trim());

      const rawParagraphs = rawText
        .split("\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 15);

      if (rawParagraphs.length === 0) throw new Error("Format de réponse invalide.");

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

  // Ajouter ou retirer un film des favoris
  const toggleLike = () => {
    if (!searchedTitle) return;
    if (likedMovies.includes(searchedTitle)) {
      setLikedMovies(likedMovies.filter(m => m !== searchedTitle));
    } else {
      setLikedMovies([...likedMovies, searchedTitle]);
    }
  };

// Vrai envoi de l'inscription et des likes vers Formspree
const handleEmailSubmit = async (e) => {
  e.preventDefault();
  if (!email.trim()) return;

  setEmailStatus("Inscription en cours...");

  try {
    const response = await fetch("https://formspree.io/f/mwvzlwwz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email: email.trim(),
        films_sautegardes: likedMovies.join(", ") || "Aucun film aimé pour le moment"
      })
    });

    if (response.ok) {
      setEmailStatus("Inscription réussie ! Vous recevrez votre récapitulatif mensuel. 🍿");
      setEmail("");
    } else {
      throw new Error();
    }
  } catch (err) {
    setEmailStatus("❌ Une erreur est survenue lors de l'inscription. Réessayez.");
  }

  setTimeout(() => setEmailStatus(""), 4000);
};

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Georgia',serif", color: "#e8e0d0" }}>
      
      {/* EN-TÊTE AVEC BOUTON DE DONATION */}
      <div style={{ background: "#111118", borderBottom: "1px solid #2a2a3a", padding: "2.5rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e63946" }} />
              <span style={{ fontSize: "11px", letterSpacing: "3px", color: "#888", textTransform: "uppercase", fontFamily: "monospace" }}>Spoiler Protection System</span>
            </div>
            <h1 style={{ fontSize: "2.8rem", fontWeight: "400", margin: 0, color: "#f5f0e8" }}>
              Spoiler<span style={{ color: "#e63946" }}>.</span>Blocker
            </h1>
          </div>

          <a 
            href="https://buymeacoffee.com/alubac51j" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              background: "#e63946", 
              borderRadius: "6px", 
              color: "#ffffff", 
              padding: "10px 18px", 
              fontFamily: "monospace", 
              fontSize: "13px", 
              fontWeight: "bold",
              textDecoration: "none",
              letterSpacing: "1px", 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(230, 57, 70, 0.2)",
              transition: "transform 0.2s, background-color 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#cc2b37"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#e63946"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            ☕ OFFRIR UN CAFÉ
          </a>
        </div>
      </div>

      {/* DISPOSITION EN DEUX COLONNES (GAUCHE / DROITE) */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 2rem", display: "flex", gap: "40px", flexWrap: "wrap" }}>
        
        {/* COLONNE PRINCIPALE (GAUCHE - ZONE DE RECHERCHE ET RÉSULTATS) */}
        <div style={{ flex: 3, minWidth: "300px" }}>
          
          {/* Barre de recherche */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "1rem" }}>
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

          {/* RECTANGLE DE RECOMMANDATION SIMILAIRE IA */}
          {recommendation && (
            <div style={{ background: "rgba(230, 57, 70, 0.05)", border: "1px dashed #e63946", borderRadius: "6px", padding: "12px 16px", marginBottom: "2rem", fontFamily: "monospace", fontSize: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>🍿 Proposition similaire : <strong style={{ color: "#f5f0e8" }}>{recommendation}</strong></span>
              <button onClick={() => { setTitle(recommendation); }} style={{ background: "transparent", border: "none", color: "#e63946", cursor: "pointer", textDecoration: "underline", fontFamily: "monospace" }}>Scanner ce film</button>
            </div>
          )}

          {error && <div style={{ background: "#1a0a0a", border: "1px solid #5a1a1a", borderRadius: "6px", padding: "14px", color: "#e66", fontFamily: "monospace", marginBottom: "2rem" }}>⚠ {error}</div>}

          {loading && (
            <div style={{ textAlign: "center", padding: "4rem 0", color: "#888", fontFamily: "monospace" }}>
              <div style={{ fontSize: "28px", marginBottom: "12px", display: "inline-block", animation: "spin 1s linear infinite" }}>◌</div>
              <p style={{ fontSize: "14px", letterSpacing: "1px" }}>{loadingMsg}</p>
              <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
            </div>
          )}

          {/* Barre de statistiques + BOUTON LIKE COEUR */}
          {stats && paragraphs.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111118", border: "1px solid #2a2a3a", borderRadius: "6px", padding: "14px 18px", marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <div>
                  <span style={{ color: "#888", fontFamily: "monospace" }}>{searchedTitle.toUpperCase()} — </span>
                  <span style={{ color: "#e63946", fontFamily: "monospace" }}>{stats.spoilers} bloc(s) masqué(s)</span>
                </div>
                {/* Bouton Coeur dynamique */}
                <button onClick={toggleLike} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", transition: "transform 0.2s", outline: "none" }} onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.8)"} onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}>
                  {likedMovies.includes(searchedTitle) ? "❤️" : "🤍"}
                </button>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={revealAll} style={{ background: "transparent", border: "1px solid #3a3a4a", color: "#888", padding: "6px 14px", fontFamily: "monospace", fontSize: "12px", cursor: "pointer" }}>TOUT RÉVÉLER</button>
                <button onClick={hideAll} style={{ background: "transparent", border: "1px solid #3a3a4a", color: "#888", padding: "6px 14px", fontFamily: "monospace", fontSize: "12px", cursor: "pointer" }}>TOUT MASQUER</button>
              </div>
            </div>
          )}

          {/* Blocs de paragraphes de résumé */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {paragraphs.map((para) => (
              <ParagraphBlock key={para.id} para={para} revealed={!!revealed[para.id]} onToggle={() => toggleReveal(para.id)} />
            ))}
          </div>
        </div>

        {/* COLONNE LATÉRALE (DROITE - FAVORIS ET NEWSLETTER) */}
        <div style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* BLOC : DÉFILÉ AUTOMATIQUE DES FILMS LIKÉS */}
          <div style={{ background: "#111118", border: "1px solid #2a2a3a", borderRadius: "6px", padding: "20px", fontFamily: "monospace" }}>
            <h3 style={{ color: "#f5f0e8", marginTop: 0, fontSize: "14px", letterSpacing: "1px", borderBottom: "1px solid #2a2a3a", paddingBottom: "10px" }}>❤️ FILMS AIMÉS</h3>
            {likedMovies.length === 0 ? (
              <p style={{ color: "#666", fontSize: "12px", margin: "10px 0 0" }}>Aucun film aimé pour le moment.</p>
            ) : (
              <div style={{ maxHeight: "160px", overflow: "hidden", position: "relative", marginTop: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", animation: likedMovies.length > 3 ? "scrollUp 12s linear infinite" : "none" }}>
                  {likedMovies.map((movie, index) => (
                    <div key={index} style={{ background: "#0a0a0f", padding: "8px 12px", borderRadius: "4px", border: "1px solid #1a1a2a", color: "#c8c0b0", fontSize: "13px" }}>
                      🎬 {movie}
                    </div>
                  ))}
                  {likedMovies.length > 3 && likedMovies.map((movie, index) => (
                    <div key={`dup-${index}`} style={{ background: "#0a0a0f", padding: "8px 12px", borderRadius: "4px", border: "1px solid #1a1a2a", color: "#c8c0b0", fontSize: "13px" }}>
                      🎬 {movie}
                    </div>
                  ))}
                </div>
                <style>{`
                  @keyframes scrollUp {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                  }
                `}</style>
              </div>
            )}
          </div>

          {/* BLOC : FORMULAIRE RAPPEL EMAIL */}
          <div style={{ background: "#111118", border: "1px solid #2a2a3a", borderRadius: "6px", padding: "20px", fontFamily: "monospace" }}>
            <h3 style={{ color: "#f5f0e8", marginTop: 0, fontSize: "14px", letterSpacing: "1px" }}>📅 RAPPEL MENSUEL</h3>
            <p style={{ color: "#888", fontSize: "12px", lineHeight: "1.5" }}>Recevez chaque mois la liste de vos films sauvegardés à regarder absolument.</p>
            <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email..."
                style={{ background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: "4px", padding: "10px", color: "#e8e0d0", fontSize: "12px", outline: "none" }}
              />
              <button type="submit" style={{ background: "#e63946", color: "#fff", border: "none", borderRadius: "4px", padding: "10px", fontSize: "12px", fontWeight: "bold", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#cc2b37"} onMouseLeave={(e) => e.currentTarget.style.background = "#e63946"}>
                M'INSCRIRE
              </button>
            </form>
            {emailStatus && <p style={{ color: "#4caf50", fontSize: "11px", marginTop: "10px", lineHeight: "1.4" }}>{emailStatus}</p>}
          </div>

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