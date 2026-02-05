"use client";

import { useState, useMemo, useCallback } from "react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function toRoman(num) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}

function fromRoman(str) {
  const map = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    const curr = map[str[i]] || 0;
    const next = map[str[i+1]] || 0;
    total += curr < next ? -curr : curr;
  }
  return total;
}

const LETTER_MAP = {};
const ROMAN_MAP = {};
for (let i = 0; i < 26; i++) {
  const letter = ALPHABET[i];
  const roman = toRoman(i + 1);
  LETTER_MAP[letter] = { number: i + 1, roman };
  ROMAN_MAP[roman] = letter;
}

function encodeText(text) {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  return words.map(word => {
    return [...word]
      .filter(ch => /[A-Z]/.test(ch))
      .map(ch => LETTER_MAP[ch]?.roman || "")
      .filter(Boolean)
      .join(".");
  }).join(" - ");
}

function decodeText(encoded) {
  const words = encoded.split(" - ");
  return words.map(word => {
    const numerals = word.split(".");
    return numerals
      .map(n => {
        const num = fromRoman(n.trim().toUpperCase());
        if (num >= 1 && num <= 26) return ALPHABET[num - 1];
        return "?";
      })
      .join("");
  }).join(" ");
}

function encodeWithNumbers(text) {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  return words.map(word => {
    return [...word]
      .filter(ch => /[A-Z]/.test(ch))
      .map(ch => LETTER_MAP[ch]?.number || "")
      .filter(Boolean)
      .join(".");
  }).join(" - ");
}

function copyToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(el);
  el.select();
  el.setSelectionRange(0, 99999);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  document.body.removeChild(el);
  return ok;
}

export default function RomanCipher() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("encode");
  const [copied, setCopied] = useState(false);
  const [showRef, setShowRef] = useState(false);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    if (mode === "encode") return encodeText(input);
    return decodeText(input);
  }, [input, mode]);

  const numericBreakdown = useMemo(() => {
    if (!input.trim() || mode !== "encode") return "";
    return encodeWithNumbers(input);
  }, [input, mode]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const success = await copyToClipboard(output);
    if (success !== false) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const exampleWords = [
    { label: "HELLO", value: "hello" },
    { label: "ROME", value: "rome" },
    { label: "CARPE DIEM", value: "carpe diem" },
    { label: "VENI VIDI VICI", value: "veni vidi vici" },
  ];

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "#FAFAF8",
      color: "#2a2520",
      fontFamily: "'Cormorant Garamond', 'Georgia', serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Cinzel:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 100;
          opacity: 0.018;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .hero-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, #b8960c 20%, #d4af37 50%, #b8960c 80%, transparent);
          opacity: 0.4;
          margin: 0 auto;
          width: 80%;
          max-width: 700px;
        }

        .glow-accent {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          pointer-events: none;
        }

        textarea {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          background: #FFFFFF;
          border: 1.5px solid rgba(184, 150, 12, 0.2);
          border-radius: 10px;
          color: #2a2520;
          padding: 14px 16px;
          width: 100%;
          resize: none;
          outline: none;
          transition: border-color 0.3s, box-shadow 0.3s;
          letter-spacing: 0.5px;
        }
        textarea:focus {
          border-color: rgba(212, 175, 55, 0.5);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.08), 0 4px 20px rgba(212, 175, 55, 0.06);
        }
        textarea::placeholder {
          color: rgba(0, 0, 0, 0.32);
          font-style: italic;
        }

        .mode-btn {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          padding: 10px 24px;
          border: 1.5px solid rgba(184, 150, 12, 0.2);
          border-radius: 6px;
          background: #FFFFFF;
          color: rgba(0, 0, 0, 0.45);
          cursor: pointer;
          transition: all 0.35s ease;
        }
        .mode-btn:hover {
          border-color: rgba(212, 175, 55, 0.45);
          color: rgba(0, 0, 0, 0.7);
          box-shadow: 0 2px 12px rgba(212, 175, 55, 0.08);
        }
        .mode-btn.active {
          background: linear-gradient(135deg, #d4af37 0%, #c5a028 50%, #b8960c 100%);
          border-color: #d4af37;
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(212, 175, 55, 0.2), 0 1px 3px rgba(212, 175, 55, 0.15);
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .example-chip {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 2px;
          padding: 6px 14px;
          border: 1px solid rgba(184, 150, 12, 0.15);
          border-radius: 20px;
          background: #FFFFFF;
          color: rgba(0, 0, 0, 0.5);
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
        }
        .example-chip:hover {
          border-color: rgba(212, 175, 55, 0.4);
          color: #b8960c;
          background: rgba(212, 175, 55, 0.04);
          box-shadow: 0 2px 8px rgba(212, 175, 55, 0.08);
        }

        .output-box {
          background: #FFFFFF;
          border: 1.5px solid rgba(184, 150, 12, 0.2);
          border-radius: 10px;
          padding: 16px;
          min-height: 60px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          letter-spacing: 1.5px;
          line-height: 1.8;
          color: #9a7b0a;
          word-break: break-all;
          position: relative;
          box-shadow: 0 2px 16px rgba(212, 175, 55, 0.05);
        }

        .copy-btn {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 6px 16px;
          border: 1.5px solid rgba(184, 150, 12, 0.25);
          border-radius: 6px;
          background: #FFFFFF;
          color: #b8960c;
          cursor: pointer;
          transition: all 0.3s;
        }
        .copy-btn:hover {
          background: linear-gradient(135deg, #d4af37 0%, #b8960c 100%);
          border-color: #d4af37;
          color: #FFFFFF;
          box-shadow: 0 3px 12px rgba(212, 175, 55, 0.18);
        }
        .copy-btn.copied {
          background: linear-gradient(135deg, #d4af37 0%, #b8960c 100%);
          border-color: #d4af37;
          color: #FFFFFF;
        }

        .ref-toggle {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          background: none;
          border: 1px solid rgba(184, 150, 12, 0.2);
          border-radius: 6px;
          color: rgba(0, 0, 0, 0.4);
          cursor: pointer;
          padding: 8px 20px;
          transition: all 0.3s;
        }
        .ref-toggle:hover {
          color: rgba(0, 0, 0, 0.7);
          border-color: rgba(212, 175, 55, 0.4);
        }

        .ref-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
          gap: 5px;
        }

        .ref-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 4px;
          border: 1px solid rgba(184, 150, 12, 0.1);
          border-radius: 8px;
          background: #FFFFFF;
          gap: 2px;
        }
        .ref-letter {
          font-family: 'Cinzel', serif;
          font-size: 15px;
          font-weight: 600;
          color: #b8960c;
        }
        .ref-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(0, 0, 0, 0.38);
        }
        .ref-roman {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(0, 0, 0, 0.6);
          font-weight: 500;
        }

        .breakdown {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.45);
          letter-spacing: 1px;
          padding: 8px 0;
        }

        .sheet-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 200;
          animation: fadeInBackdrop 0.25s ease forwards;
        }

        .sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 201;
          background: #FAFAF8;
          border-radius: 20px 20px 0 0;
          padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
          max-height: 70dvh;
          overflow-y: auto;
          animation: slideUp 0.3s ease forwards;
          box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.1);
        }

        .sheet-handle {
          width: 36px;
          height: 4px;
          background: rgba(0, 0, 0, 0.15);
          border-radius: 2px;
          margin: 0 auto 16px;
        }

        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeIn 0.6s ease forwards; }
        .fade-in-d1 { animation: fadeIn 0.6s ease 0.1s forwards; opacity: 0; }
        .fade-in-d2 { animation: fadeIn 0.6s ease 0.2s forwards; opacity: 0; }
        .fade-in-d3 { animation: fadeIn 0.6s ease 0.3s forwards; opacity: 0; }
      `}</style>

      <div className="grain" />
      <div className="glow-accent" style={{ top: "-250px", left: "-200px", background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)" }} />
      <div className="glow-accent" style={{ bottom: "-250px", right: "-200px", background: "radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)" }} />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 0", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div className="fade-in" style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "rgba(0, 0, 0, 0.3)",
            marginBottom: 10,
          }}>Numeris Romanis</p>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(24px, 5vw, 38px)",
            fontWeight: 400,
            letterSpacing: 4,
            color: "#2a2520",
            lineHeight: 1.2,
          }}>Roman Numeral</h1>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(24px, 5vw, 38px)",
            fontWeight: 700,
            letterSpacing: 4,
            background: "linear-gradient(135deg, #d4af37 0%, #b8960c 40%, #d4af37 70%, #c5a028 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1.2,
            marginBottom: 10,
          }}>Cipher</h1>
          <div className="hero-line" />
          <p style={{
            fontSize: 14,
            color: "rgba(0, 0, 0, 0.45)",
            marginTop: 10,
            fontStyle: "italic",
            fontWeight: 300,
            lineHeight: 1.5,
          }}>
            Transform words into ancient numerals
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="fade-in-d1" style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 20 }}>
          <button
            className={`mode-btn ${mode === "encode" ? "active" : ""}`}
            onClick={() => { setMode("encode"); setInput(""); }}
          >Encode</button>
          <button
            className={`mode-btn ${mode === "decode" ? "active" : ""}`}
            onClick={() => { setMode("decode"); setInput(""); }}
          >Decode</button>
        </div>

        {/* Input */}
        <div className="fade-in-d2" style={{ marginBottom: 8 }}>
          <label style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 10,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(0, 0, 0, 0.45)",
            display: "block",
            marginBottom: 8,
          }}>
            {mode === "encode" ? "Enter text to encode" : "Enter Roman numerals to decode"}
          </label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "Type any word, phrase, or sentence..."
                : "e.g. VIII.V.XII.XII.XV - XXIII.XV.XVIII.XII.IV"
            }
            rows={2}
          />
        </div>

        {/* Example Chips */}
        {mode === "encode" && (
          <div className="fade-in-d2" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 9,
              letterSpacing: 2,
              color: "rgba(0, 0, 0, 0.3)",
              alignSelf: "center",
              marginRight: 2,
            }}>TRY:</span>
            {exampleWords.map(ex => (
              <button
                key={ex.label}
                className="example-chip"
                onClick={() => setInput(ex.value)}
              >{ex.label}</button>
            ))}
          </div>
        )}

        {/* Numeric Breakdown */}
        {numericBreakdown && mode === "encode" && (
          <div className="breakdown fade-in" style={{ marginBottom: 4 }}>
            <span style={{ color: "rgba(0, 0, 0, 0.35)", marginRight: 8 }}>NUMERIC:</span>
            {numericBreakdown}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="fade-in" style={{ marginBottom: 16 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}>
              <label style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 10,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "rgba(0, 0, 0, 0.45)",
              }}>
                {mode === "encode" ? "Roman Numeral Cipher" : "Decoded Text"}
              </label>
              <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                {copied ? "\u2713 Copied" : "Copy"}
              </button>
            </div>
            <div className="output-box">
              {mode === "decode" ? (
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 20,
                  letterSpacing: 4,
                  color: "#2a2520",
                }}>{output}</span>
              ) : (
                output
              )}
            </div>
          </div>
        )}

        {/* Format Guide */}
        {!output && (
          <div className="fade-in-d3" style={{
            textAlign: "center",
            padding: "20px 16px",
            color: "rgba(0, 0, 0, 0.4)",
          }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: 2, marginBottom: 8, color: "rgba(0,0,0,0.5)" }}>
              FORMAT GUIDE
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, lineHeight: 2, letterSpacing: 1 }}>
              Letters separated by <span style={{ color: "#b8960c" }}>.</span> (dot)<br/>
              Words separated by <span style={{ color: "#b8960c" }}> - </span> (dash)<br/>
              <span style={{ color: "rgba(0, 0, 0, 0.45)", marginTop: 4, display: "inline-block" }}>
{'"LOVE STAMP" \u2192 XII.XV.XXII.V - XIX.XX.I.XIII.XVI'}
              </span>
            </p>
          </div>
        )}

        {/* Spacer + Footer */}
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "center", paddingBottom: 20 }}>
          <div className="hero-line" style={{ marginBottom: 16 }} />
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
            <button className="ref-toggle" onClick={() => setShowRef(true)}>
              Reference Table
            </button>
          </div>
          <div style={{
            marginTop: 16,
            color: "rgba(0, 0, 0, 0.18)",
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: 4,
          }}>
            LETTERIS &middot; IN &middot; NUMERIS &middot; ROMANIS
          </div>
        </div>
      </div>

      {/* Reference Table Bottom Sheet */}
      {showRef && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowRef(false)} />
          <div className="sheet">
            <div className="sheet-handle" />
            <p style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 12,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "rgba(0, 0, 0, 0.5)",
              textAlign: "center",
              marginBottom: 16,
            }}>Reference Table</p>
            <div className="ref-grid">
              {ALPHABET.split("").map((letter, i) => (
                <div className="ref-cell" key={letter}>
                  <span className="ref-letter">{letter}</span>
                  <span className="ref-num">{i + 1}</span>
                  <span className="ref-roman">{toRoman(i + 1)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
