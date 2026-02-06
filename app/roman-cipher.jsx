"use client";

import { useState, useMemo, useCallback, useRef } from "react";

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

function encodeBreakdown(text) {
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  return words.map(word => {
    return [...word]
      .filter(ch => /[A-Z]/.test(ch))
      .map(ch => ({ letter: ch, roman: LETTER_MAP[ch]?.roman || "" }))
      .filter(item => item.roman);
  }).filter(word => word.length > 0);
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
  const [copiedNumeric, setCopiedNumeric] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [expandedOutput, setExpandedOutput] = useState(null); // "roman" | "numeric" | null
  const [scanningSource, setScanningSource] = useState(null); // "file" | "camera" | null
  const [scanError, setScanError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    if (mode === "encode") return encodeText(input);
    return decodeText(input);
  }, [input, mode]);

  const numericBreakdown = useMemo(() => {
    if (!input.trim() || mode !== "encode") return "";
    return encodeWithNumbers(input);
  }, [input, mode]);

  const letterBreakdown = useMemo(() => {
    if (!input.trim() || mode !== "encode") return [];
    return encodeBreakdown(input);
  }, [input, mode]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    const success = await copyToClipboard(output);
    if (success !== false) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  const handleCopyNumeric = useCallback(async () => {
    if (!numericBreakdown) return;
    const success = await copyToClipboard(numericBreakdown);
    if (success !== false) {
      setCopiedNumeric(true);
      setTimeout(() => setCopiedNumeric(false), 2000);
    }
  }, [numericBreakdown]);

  // Validate if text looks like Roman numerals or numeric cipher
  const validateCipherFormat = useCallback((text) => {
    // Clean the text first
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9.\-\s]/g, '').trim();

    if (!cleaned) return { valid: false, text: '' };

    // Try to extract valid Roman numeral sequences
    const romanMatches = cleaned.match(/[IVXLCDM]+/g);
    const numericMatches = cleaned.match(/\b\d{1,2}\b/g);

    // Check if we have meaningful Roman numeral content
    if (romanMatches && romanMatches.length >= 1) {
      // Verify they're valid Roman numerals (letters that form valid numbers)
      const validRomanNumerals = romanMatches.filter(match => {
        // Check if it only contains valid Roman numeral characters
        // and follows basic Roman numeral rules
        return /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(match) ||
               /^[IVXLCDM]{1,6}$/.test(match); // Simpler check for short numerals
      });

      if (validRomanNumerals.length >= 1) {
        // Reconstruct with proper format
        const formatted = validRomanNumerals.join('.');
        return { valid: true, text: formatted, type: 'roman' };
      }
    }

    // Check if we have numeric cipher content (numbers 1-26)
    if (numericMatches && numericMatches.length >= 1) {
      const validNumbers = numericMatches.filter(n => {
        const num = parseInt(n, 10);
        return num >= 1 && num <= 26;
      });

      if (validNumbers.length >= 1) {
        const formatted = validNumbers.join('.');
        return { valid: true, text: formatted, type: 'numeric' };
      }
    }

    return { valid: false, text: cleaned };
  }, []);

  const processImage = useCallback(async (file, source) => {
    setScanningSource(source);
    setScanError(null);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // Clean up the OCR text - normalize whitespace
      const cleanedText = text
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanedText) {
        setScanError("No text detected in image");
        return;
      }

      // Validate the format
      const validation = validateCipherFormat(cleanedText);

      if (validation.valid) {
        setInput(validation.text);
      } else {
        setScanError("Could not identify Roman numerals or numeric cipher. Please use a clearer image.");
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setScanError("Could not read text from image");
    } finally {
      setScanningSource(null);
    }
  }, [validateCipherFormat]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file, 'file');
    }
    e.target.value = ''; // Reset for same file re-upload
  }, [processImage]);

  const handleCameraSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file, 'camera');
    }
    e.target.value = ''; // Reset for same file re-upload
  }, [processImage]);


  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "#0a0a08",
      color: "#e8e4df",
      fontFamily: "'Cormorant Garamond', 'Georgia', serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 100;
          opacity: 0.03;
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
          font-size: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid rgba(184, 150, 12, 0.2);
          border-radius: 10px;
          color: #e8e4df;
          padding: 12px 16px;
          width: 100%;
          height: 68px;
          resize: none;
          outline: none;
          transition: border-color 0.3s, box-shadow 0.3s;
          letter-spacing: 0.5px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        textarea:focus {
          border-color: rgba(212, 175, 55, 0.5);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1), 0 4px 20px rgba(212, 175, 55, 0.08);
        }
        textarea::placeholder {
          color: rgba(255, 255, 255, 0.35);
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
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.35s ease;
        }
        .mode-btn:hover {
          border-color: rgba(212, 175, 55, 0.45);
          color: rgba(255, 255, 255, 0.85);
          box-shadow: 0 2px 12px rgba(212, 175, 55, 0.12);
        }
        .mode-btn.active {
          background: linear-gradient(135deg, #d4af37 0%, #c5a028 50%, #b8960c 100%);
          border-color: #d4af37;
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(212, 175, 55, 0.2), 0 1px 3px rgba(212, 175, 55, 0.15);
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }


        .output-box {
          background: rgba(255, 255, 255, 0.05);
          border: 1.5px solid rgba(184, 150, 12, 0.2);
          border-radius: 10px;
          padding: 12px 16px;
          height: 110px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          letter-spacing: 1.5px;
          line-height: 1.8;
          color: #d4af37;
          word-break: break-all;
          position: relative;
          box-shadow: 0 2px 16px rgba(212, 175, 55, 0.06);
          overflow-y: auto;
          overflow-x: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }

        .copy-btn {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 6px 16px;
          border: 1.5px solid rgba(184, 150, 12, 0.25);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #d4af37;
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
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 8px 20px;
          transition: all 0.3s;
        }
        .ref-toggle:hover {
          color: rgba(255, 255, 255, 0.8);
          border-color: rgba(212, 175, 55, 0.4);
        }

        .ref-grid {
          display: grid;
          grid-template-columns: repeat(13, 1fr);
          gap: 5px;
        }
        @media (max-width: 600px) {
          .ref-grid {
            grid-template-columns: repeat(9, 1fr);
          }
        }

        .example-grid {
          display: inline-flex;
          gap: clamp(12px, 3vw, 24px);
          align-items: flex-start;
        }
        .example-roman {
          font-family: 'JetBrains Mono', monospace;
          color: #b8960c;
          font-size: clamp(14px, 2.5vw, 18px);
        }
        .example-letter {
          color: rgba(255, 255, 255, 0.55);
          font-size: clamp(13px, 2.2vw, 16px);
          margin-top: 3px;
          font-family: 'Cinzel', serif;
        }
        .example-dash {
          color: rgba(255,255,255,0.3);
          font-size: clamp(14px, 2.5vw, 18px);
        }

        .ref-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 4px;
          border: 1px solid rgba(184, 150, 12, 0.12);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          gap: 2px;
        }
        .ref-letter {
          font-family: 'Cinzel', serif;
          font-size: 15px;
          font-weight: 600;
          color: #d4af37;
        }
        .ref-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: rgba(255, 255, 255, 0.45);
        }
        .ref-roman {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .output-box::before,
        .output-box::after,
        .output-box-secondary::before,
        .output-box-secondary::after {
          content: '';
          flex: 1 1 auto;
        }

        .output-box-secondary {
          background: rgba(255, 255, 255, 0.04);
          border: 1.5px solid rgba(184, 150, 12, 0.12);
          border-radius: 10px;
          padding: 12px 16px;
          height: 78px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          letter-spacing: 1.5px;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.7);
          word-break: break-all;
          overflow-y: auto;
          overflow-x: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }

        .expand-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 300;
          animation: fadeInBackdrop 0.2s ease forwards;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .expand-modal {
          background: #141410;
          border: 1.5px solid rgba(184, 150, 12, 0.25);
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 560px;
          max-height: 70dvh;
          overflow-y: auto;
          animation: fadeIn 0.25s ease forwards;
          box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(184, 150, 12, 0.1);
        }

        .expand-content {
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          letter-spacing: 1.5px;
          line-height: 1.8;
          word-break: break-all;
          margin-bottom: 20px;
        }

        .expand-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .expand-close {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 6px 16px;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          background: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s;
        }
        .expand-close:hover {
          border-color: rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.9);
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
          left: 50%;
          transform: translateX(-50%);
          z-index: 201;
          background: #141410;
          border-radius: 20px 20px 0 0;
          padding: 20px 24px calc(20px + env(safe-area-inset-bottom));
          width: 100%;
          max-width: 620px;
          max-height: 70dvh;
          overflow-y: auto;
          overflow-x: hidden;
          animation: slideUp 0.3s ease forwards;
          box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.4);
        }

        .sheet-handle {
          width: 36px;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          margin: 0 auto 16px;
        }

        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .scan-btn {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 8px 14px;
          border: 1.5px solid rgba(184, 150, 12, 0.25);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .scan-btn:hover {
          border-color: rgba(212, 175, 55, 0.45);
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.08);
        }
        .scan-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .scan-btn svg {
          width: 14px;
          height: 14px;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(212, 175, 55, 0.3);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .scan-error {
          color: #e57373;
          font-size: 11px;
          margin-top: 6px;
          font-family: 'JetBrains Mono', monospace;
        }

        .mobile-only {
          display: none;
        }
        @media (max-width: 600px) {
          .mobile-only {
            display: inline-flex;
          }
        }

        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100%); }
          to { transform: translateX(-50%) translateY(0); }
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
      <div className="glow-accent" style={{ top: "-250px", left: "-200px", background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)" }} />
      <div className="glow-accent" style={{ bottom: "-250px", right: "-200px", background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)" }} />

      <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: "16px 20px 0", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Header */}
        <div className="fade-in" style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(24px, 5vw, 38px)",
            fontWeight: 400,
            letterSpacing: 4,
            color: "#e8e4df",
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
            marginBottom: 6,
          }}>Cipher</h1>
          <div className="hero-line" />
          <p style={{
            fontFamily: "'Cormorant Garamond', 'Georgia', serif",
            fontSize: 20,
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: 6,
            fontStyle: "italic",
            fontWeight: 300,
            lineHeight: 1.5,
            letterSpacing: 1,
          }}>
            Transform words into ancient numerals
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="fade-in-d1" style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <button
            className={`mode-btn ${mode === "encode" ? "active" : ""}`}
            onClick={() => { setMode("encode"); setInput(""); setScanError(null); }}
          >Encode</button>
          <button
            className={`mode-btn ${mode === "decode" ? "active" : ""}`}
            onClick={() => { setMode("decode"); setInput(""); setScanError(null); }}
          >Decode</button>
        </div>

        {/* Input */}
        <div className="fade-in-d2" style={{ marginBottom: 8 }}>
          <label style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 10,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.55)",
            display: "block",
            marginBottom: 4,
          }}>
            {mode === "encode" ? "Enter text to encode" : "Enter Roman numerals to decode"}
          </label>

          {/* Scanner buttons - Decode mode only */}
          {mode === "decode" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <button
                className="scan-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={scanningSource !== null}
              >
                {scanningSource === 'file' ? (
                  <span className="spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                )}
                {scanningSource === 'file' ? "Scanning..." : "Upload Image"}
              </button>
              <button
                className="scan-btn mobile-only"
                onClick={() => cameraInputRef.current?.click()}
                disabled={scanningSource !== null}
              >
                {scanningSource === 'camera' ? (
                  <span className="spinner" />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
                {scanningSource === 'camera' ? "Scanning..." : "Scan Camera"}
              </button>
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraSelect}
                style={{ display: "none" }}
              />
            </div>
          )}

          {/* Scan error message */}
          {scanError && mode === "decode" && (
            <p className="scan-error">{scanError}</p>
          )}

          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); setScanError(null); }}
            placeholder={
              mode === "encode"
                ? "Type any word, phrase, or sentence..."
                : "e.g. VIII.V.XII.XII.XV - XXIII.XV.XVIII.XII.IV"
            }
          />
        </div>


        {/* Output */}
        {output && (
          <div className="fade-in" style={{ marginBottom: 8 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}>
              <label style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 10,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.55)",
              }}>
                {mode === "encode" ? "Roman Numeral Cipher" : "Decoded Text"}
              </label>
              <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                {copied ? "\u2713 Copied" : "Copy"}
              </button>
            </div>
            <div className="output-box" onClick={() => setExpandedOutput("roman")}>
              {mode === "decode" ? (
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 20,
                  letterSpacing: 4,
                  color: "#e8e4df",
                }}>{output}</span>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 0", alignItems: "flex-start" }}>
                  {letterBreakdown.map((word, wi) => (
                    <div key={wi} style={{ display: "flex", alignItems: "flex-start" }}>
                      {wi > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "0 6px" }}>
                          <span style={{ color: "#d4af37", fontSize: 15, fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.8" }}>-</span>
                          <span style={{ fontSize: 11, visibility: "hidden" }}>-</span>
                        </div>
                      )}
                      {word.map((item, li) => (
                        <div key={li} style={{ display: "flex", alignItems: "flex-start" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ color: "#d4af37", fontSize: 15, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0, lineHeight: "1.8" }}>{item.roman}</span>
                            <span style={{ fontFamily: "'Cinzel', serif", color: "rgba(255, 255, 255, 0.7)", fontSize: 11 }}>{item.letter}</span>
                          </div>
                          {li < word.length - 1 && (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <span style={{ color: "#d4af37", fontSize: 15, fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.8" }}>.</span>
                              <span style={{ fontSize: 11, visibility: "hidden" }}>.</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Numeric Cipher */}
        {numericBreakdown && mode === "encode" && (
          <div className="fade-in" style={{ marginBottom: 8 }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}>
              <label style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 10,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.55)",
              }}>
                Numeric Cipher
              </label>
              <button className={`copy-btn ${copiedNumeric ? "copied" : ""}`} onClick={handleCopyNumeric}>
                {copiedNumeric ? "\u2713 Copied" : "Copy"}
              </button>
            </div>
            <div className="output-box-secondary" onClick={() => setExpandedOutput("numeric")}>
              <span>{numericBreakdown}</span>
            </div>
          </div>
        )}

        {/* Spacer + Format Guide (centered between content and footer) */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="fade-in-d3" style={{
            textAlign: "center",
            padding: "10px 16px",
            color: "rgba(255, 255, 255, 0.4)",
          }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 17, letterSpacing: 4, marginBottom: 12, color: "rgba(255,255,255,0.5)" }}>
              FORMAT GUIDE
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, lineHeight: 2, letterSpacing: 1, marginBottom: 14 }}>
              Letters separated by <span style={{ color: "#b8960c" }}>.</span> (dot)<br/>
              Words separated by <span style={{ color: "#b8960c" }}> - </span> (dash)
            </p>
            <div className="example-grid">
              {/* LOVE */}
              <div style={{ display: "flex", gap: "clamp(4px, 1vw, 8px)", alignItems: "flex-start" }}>
                {[
                  { letter: "L", roman: "XII" },
                  { letter: "O", roman: "XV" },
                  { letter: "V", roman: "XXII" },
                  { letter: "E", roman: "V" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "clamp(30px, 6vw, 44px)" }}>
                    <span className="example-roman">{item.roman}</span>
                    <span className="example-letter">{item.letter}</span>
                  </div>
                ))}
              </div>
              {/* Dash separator */}
              <div style={{ display: "flex", alignItems: "flex-start", paddingTop: 2 }}>
                <span className="example-dash">-</span>
              </div>
              {/* STAMP */}
              <div style={{ display: "flex", gap: "clamp(4px, 1vw, 8px)", alignItems: "flex-start" }}>
                {[
                  { letter: "S", roman: "XIX" },
                  { letter: "T", roman: "XX" },
                  { letter: "A", roman: "I" },
                  { letter: "M", roman: "XIII" },
                  { letter: "P", roman: "XVI" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "clamp(30px, 6vw, 44px)" }}>
                    <span className="example-roman">{item.roman}</span>
                    <span className="example-letter">{item.letter}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", paddingBottom: 10 }}>
          <div className="hero-line" style={{ marginBottom: 8 }} />
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
            <button className="ref-toggle" onClick={() => setShowRef(true)}>
              Reference Table
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Output Widget */}
      {expandedOutput && (
        <div className="expand-backdrop" onClick={() => setExpandedOutput(null)}>
          <div className="expand-modal" onClick={e => e.stopPropagation()}>
            <div className="expand-header">
              <label style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "rgba(255, 255, 255, 0.55)",
              }}>
                {expandedOutput === "roman"
                  ? (mode === "encode" ? "Roman Numeral Cipher" : "Decoded Text")
                  : "Numeric Cipher"}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={`copy-btn ${
                    expandedOutput === "roman" ? (copied ? "copied" : "") : (copiedNumeric ? "copied" : "")
                  }`}
                  onClick={expandedOutput === "roman" ? handleCopy : handleCopyNumeric}
                >
                  {expandedOutput === "roman"
                    ? (copied ? "\u2713 Copied" : "Copy")
                    : (copiedNumeric ? "\u2713 Copied" : "Copy")}
                </button>
                <button className="expand-close" onClick={() => setExpandedOutput(null)}>Close</button>
              </div>
            </div>
            <div className="expand-content" style={{
              color: expandedOutput === "roman" ? "#d4af37" : "rgba(255, 255, 255, 0.7)",
            }}>
              {expandedOutput === "roman" ? (
                mode === "decode" ? (
                  <span style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 20,
                    letterSpacing: 4,
                    color: "#e8e4df",
                  }}>{output}</span>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 0", alignItems: "flex-start" }}>
                    {letterBreakdown.map((word, wi) => (
                      <div key={wi} style={{ display: "flex", alignItems: "flex-start" }}>
                        {wi > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "0 6px" }}>
                            <span style={{ color: "#d4af37", fontSize: 15, fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.8" }}>-</span>
                            <span style={{ fontSize: 11, visibility: "hidden" }}>-</span>
                          </div>
                        )}
                        {word.map((item, li) => (
                          <div key={li} style={{ display: "flex", alignItems: "flex-start" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                              <span style={{ color: "#d4af37", fontSize: 15, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0, lineHeight: "1.8" }}>{item.roman}</span>
                              <span style={{ fontFamily: "'Cinzel', serif", color: "rgba(255, 255, 255, 0.7)", fontSize: 11 }}>{item.letter}</span>
                            </div>
                            {li < word.length - 1 && (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <span style={{ color: "#d4af37", fontSize: 15, fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.8" }}>.</span>
                                <span style={{ fontSize: 11, visibility: "hidden" }}>.</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                numericBreakdown
              )}
            </div>
          </div>
        </div>
      )}

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
              color: "rgba(255, 255, 255, 0.55)",
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
