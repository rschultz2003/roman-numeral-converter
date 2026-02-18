"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

const THEMES = {
  dark: {
    bgPrimary: "#0a0a08",
    bgElevated: "#141410",
    bgInput: "rgba(255, 255, 255, 0.05)",
    bgInputSecondary: "rgba(255, 255, 255, 0.04)",
    textPrimary: "#e8e4df",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textTertiary: "rgba(255, 255, 255, 0.55)",
    textMuted: "rgba(255, 255, 255, 0.5)",
    textFaint: "rgba(255, 255, 255, 0.4)",
    textPlaceholder: "rgba(255, 255, 255, 0.35)",
    textGhost: "rgba(255, 255, 255, 0.3)",
    accentGold: "#d4af37",
    accentGoldMid: "#c5a028",
    accentGoldDeep: "#b8960c",
    accentGoldText: "#d4af37",
    cipherGradient: "linear-gradient(135deg, #d4af37 0%, #b8960c 40%, #d4af37 70%, #c5a028 100%)",
    glowAccent: "rgba(212, 175, 55, 0.06)",
    expandContentGold: "#d4af37",
    expandContentSecondary: "rgba(255, 255, 255, 0.7)",
  },
  light: {
    bgPrimary: "#f5f0e8",
    bgElevated: "#ece6d9",
    bgInput: "rgba(0, 0, 0, 0.04)",
    bgInputSecondary: "rgba(0, 0, 0, 0.03)",
    textPrimary: "#1a1a18",
    textSecondary: "rgba(0, 0, 0, 0.6)",
    textTertiary: "rgba(0, 0, 0, 0.5)",
    textMuted: "rgba(0, 0, 0, 0.45)",
    textFaint: "rgba(0, 0, 0, 0.35)",
    textPlaceholder: "rgba(0, 0, 0, 0.3)",
    textGhost: "rgba(0, 0, 0, 0.22)",
    accentGold: "#9a7b1a",
    accentGoldMid: "#8a6d15",
    accentGoldDeep: "#7a5f10",
    accentGoldText: "#8b6914",
    cipherGradient: "linear-gradient(135deg, #9a7b1a 0%, #7a5f10 40%, #9a7b1a 70%, #8a6d15 100%)",
    glowAccent: "rgba(180, 150, 40, 0.04)",
    expandContentGold: "#8b6914",
    expandContentSecondary: "rgba(0, 0, 0, 0.6)",
  },
};

function useTheme() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = prefersDark ? "dark" : "light";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!localStorage.getItem("theme")) {
        const next = e.matches ? "dark" : "light";
        setTheme(next);
        document.documentElement.dataset.theme = next;
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  const colors = THEMES[theme];
  return { theme, toggleTheme, colors };
}

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
  const { theme, toggleTheme, colors } = useTheme();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("encode");
  const [copied, setCopied] = useState(false);
  const [copiedNumeric, setCopiedNumeric] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [expandedOutput, setExpandedOutput] = useState(null); // "roman" | "numeric" | null

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

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: colors.bgPrimary,
      color: colors.textPrimary,
      fontFamily: "'Cormorant Garamond', 'Georgia', serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        :root, [data-theme="dark"] {
          --bg-input: rgba(255, 255, 255, 0.05);
          --bg-input-secondary: rgba(255, 255, 255, 0.04);
          --bg-elevated: #141410;
          --text-primary: #e8e4df;
          --text-secondary: rgba(255, 255, 255, 0.7);
          --text-tertiary: rgba(255, 255, 255, 0.55);
          --text-muted: rgba(255, 255, 255, 0.5);
          --text-faint: rgba(255, 255, 255, 0.4);
          --text-placeholder: rgba(255, 255, 255, 0.35);
          --text-ghost: rgba(255, 255, 255, 0.3);
          --accent-gold: #d4af37;
          --accent-gold-mid: #c5a028;
          --accent-gold-deep: #b8960c;
          --accent-gold-text: #d4af37;
          --border-gold: rgba(184, 150, 12, 0.2);
          --border-gold-light: rgba(184, 150, 12, 0.12);
          --border-gold-strong: rgba(184, 150, 12, 0.25);
          --border-focus: rgba(212, 175, 55, 0.5);
          --shadow-focus: rgba(212, 175, 55, 0.1);
          --shadow-focus-outer: rgba(212, 175, 55, 0.08);
          --hover-border: rgba(212, 175, 55, 0.45);
          --hover-text: rgba(255, 255, 255, 0.85);
          --hover-shadow: rgba(212, 175, 55, 0.12);
          --output-shadow: rgba(212, 175, 55, 0.06);
          --active-gradient: linear-gradient(135deg, #d4af37 0%, #c5a028 50%, #b8960c 100%);
          --copy-hover-gradient: linear-gradient(135deg, #d4af37 0%, #b8960c 100%);
          --hero-gradient: linear-gradient(90deg, transparent, #b8960c 20%, #d4af37 50%, #b8960c 80%, transparent);
          --backdrop-color: rgba(0, 0, 0, 0.5);
          --sheet-backdrop: rgba(0, 0, 0, 0.3);
          --sheet-shadow: rgba(0, 0, 0, 0.4);
          --modal-shadow: rgba(0, 0, 0, 0.5);
          --modal-outline: rgba(184, 150, 12, 0.1);
          --close-border: rgba(255, 255, 255, 0.15);
          --close-text: rgba(255, 255, 255, 0.6);
          --close-hover-border: rgba(255, 255, 255, 0.3);
          --close-hover-text: rgba(255, 255, 255, 0.9);
          --sheet-handle: rgba(255, 255, 255, 0.2);
          --grain-opacity: 0.03;
          --btn-inactive-text: rgba(255, 255, 255, 0.6);
          --copy-hover-shadow: rgba(212, 175, 55, 0.18);
          --ref-hover-border: rgba(212, 175, 55, 0.4);
          --ref-hover-text: rgba(255, 255, 255, 0.8);
        }

        [data-theme="light"] {
          --bg-input: rgba(0, 0, 0, 0.04);
          --bg-input-secondary: rgba(0, 0, 0, 0.03);
          --bg-elevated: #ece6d9;
          --text-primary: #1a1a18;
          --text-secondary: rgba(0, 0, 0, 0.6);
          --text-tertiary: rgba(0, 0, 0, 0.5);
          --text-muted: rgba(0, 0, 0, 0.45);
          --text-faint: rgba(0, 0, 0, 0.35);
          --text-placeholder: rgba(0, 0, 0, 0.3);
          --text-ghost: rgba(0, 0, 0, 0.22);
          --accent-gold: #9a7b1a;
          --accent-gold-mid: #8a6d15;
          --accent-gold-deep: #7a5f10;
          --accent-gold-text: #8b6914;
          --border-gold: rgba(120, 90, 5, 0.25);
          --border-gold-light: rgba(120, 90, 5, 0.15);
          --border-gold-strong: rgba(120, 90, 5, 0.3);
          --border-focus: rgba(120, 90, 5, 0.5);
          --shadow-focus: rgba(120, 90, 5, 0.12);
          --shadow-focus-outer: rgba(120, 90, 5, 0.06);
          --hover-border: rgba(120, 90, 5, 0.4);
          --hover-text: rgba(0, 0, 0, 0.75);
          --hover-shadow: rgba(120, 90, 5, 0.1);
          --output-shadow: rgba(120, 90, 5, 0.06);
          --active-gradient: linear-gradient(135deg, #b8960c 0%, #9a7b1a 50%, #7a5f10 100%);
          --copy-hover-gradient: linear-gradient(135deg, #b8960c 0%, #7a5f10 100%);
          --hero-gradient: linear-gradient(90deg, transparent, #9a7b1a 20%, #b8960c 50%, #9a7b1a 80%, transparent);
          --backdrop-color: rgba(0, 0, 0, 0.3);
          --sheet-backdrop: rgba(0, 0, 0, 0.15);
          --sheet-shadow: rgba(0, 0, 0, 0.12);
          --modal-shadow: rgba(0, 0, 0, 0.15);
          --modal-outline: rgba(120, 90, 5, 0.08);
          --close-border: rgba(0, 0, 0, 0.15);
          --close-text: rgba(0, 0, 0, 0.5);
          --close-hover-border: rgba(0, 0, 0, 0.3);
          --close-hover-text: rgba(0, 0, 0, 0.8);
          --sheet-handle: rgba(0, 0, 0, 0.15);
          --grain-opacity: 0.02;
          --btn-inactive-text: rgba(0, 0, 0, 0.5);
          --copy-hover-shadow: rgba(120, 90, 5, 0.18);
          --ref-hover-border: rgba(120, 90, 5, 0.4);
          --ref-hover-text: rgba(0, 0, 0, 0.7);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        *, *::before, *::after {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 100;
          opacity: var(--grain-opacity);
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        .hero-line {
          height: 1px;
          background: var(--hero-gradient);
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
          background: var(--bg-input);
          border: 1.5px solid var(--border-gold);
          border-radius: 10px;
          color: var(--text-primary);
          padding: 12px 16px;
          width: 100%;
          height: 84px;
          resize: none;
          outline: none;
          transition: border-color 0.3s, box-shadow 0.3s, background-color 0.3s, color 0.3s;
          letter-spacing: 0.5px;
          overflow-y: auto;
          overflow-x: hidden;
          line-height: 1.5;
          vertical-align: top;
          -webkit-appearance: none;
          appearance: none;
          box-sizing: border-box;
        }
        textarea:focus {
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px var(--shadow-focus), 0 4px 20px var(--shadow-focus-outer);
        }
        textarea::placeholder {
          color: var(--text-placeholder);
          font-style: italic;
        }

        .mode-btn {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          padding: 10px 24px;
          border: 1.5px solid var(--border-gold);
          border-radius: 6px;
          background: var(--bg-input);
          color: var(--btn-inactive-text);
          cursor: pointer;
          transition: all 0.35s ease;
        }
        .mode-btn:hover {
          border-color: var(--hover-border);
          color: var(--hover-text);
          box-shadow: 0 2px 12px var(--hover-shadow);
        }
        .mode-btn.active {
          background: var(--active-gradient);
          border-color: var(--accent-gold);
          color: #FFFFFF;
          box-shadow: 0 4px 16px var(--hover-shadow), 0 1px 3px var(--hover-shadow);
          text-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }


        .output-box {
          background: var(--bg-input);
          border: 1.5px solid var(--border-gold);
          border-radius: 10px;
          padding: 12px 16px;
          height: 110px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          letter-spacing: 1.5px;
          line-height: 1.8;
          color: var(--accent-gold-text);
          word-break: break-all;
          position: relative;
          box-shadow: 0 2px 16px var(--output-shadow);
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
          border: 1.5px solid var(--border-gold-strong);
          border-radius: 6px;
          background: var(--bg-input);
          color: var(--accent-gold-text);
          cursor: pointer;
          transition: all 0.3s;
        }
        .copy-btn:hover {
          background: var(--copy-hover-gradient);
          border-color: var(--accent-gold);
          color: #FFFFFF;
          box-shadow: 0 3px 12px var(--copy-hover-shadow);
        }
        .copy-btn.copied {
          background: var(--copy-hover-gradient);
          border-color: var(--accent-gold);
          color: #FFFFFF;
        }

        .ref-toggle {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          background: none;
          border: 1px solid var(--border-gold);
          border-radius: 6px;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px 20px;
          transition: all 0.3s;
        }
        .ref-toggle:hover {
          color: var(--ref-hover-text);
          border-color: var(--ref-hover-border);
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
          color: var(--accent-gold-deep);
          font-size: clamp(14px, 2.5vw, 18px);
        }
        .example-letter {
          color: var(--text-tertiary);
          font-size: clamp(13px, 2.2vw, 16px);
          margin-top: 3px;
          font-family: 'Cinzel', serif;
        }
        .example-dash {
          color: var(--text-ghost);
          font-size: clamp(14px, 2.5vw, 18px);
        }

        .ref-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 4px;
          border: 1px solid var(--border-gold-light);
          border-radius: 8px;
          background: var(--bg-input-secondary);
          gap: 2px;
        }
        .ref-letter {
          font-family: 'Cinzel', serif;
          font-size: 15px;
          font-weight: 600;
          color: var(--accent-gold-text);
        }
        .ref-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--text-muted);
        }
        .ref-roman {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--text-secondary);
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
          background: var(--bg-input-secondary);
          border: 1.5px solid var(--border-gold-light);
          border-radius: 10px;
          padding: 12px 16px;
          height: 78px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          letter-spacing: 1.5px;
          line-height: 1.8;
          color: var(--text-secondary);
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
          background: var(--backdrop-color);
          z-index: 300;
          animation: fadeInBackdrop 0.2s ease forwards;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .expand-modal {
          background: var(--bg-elevated);
          border: 1.5px solid var(--border-gold-strong);
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 560px;
          max-height: 70dvh;
          overflow-y: auto;
          animation: fadeIn 0.25s ease forwards;
          box-shadow: 0 8px 40px var(--modal-shadow), 0 0 0 1px var(--modal-outline);
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
          border: 1.5px solid var(--close-border);
          border-radius: 6px;
          background: none;
          color: var(--close-text);
          cursor: pointer;
          transition: all 0.3s;
        }
        .expand-close:hover {
          border-color: var(--close-hover-border);
          color: var(--close-hover-text);
        }

        .sheet-backdrop {
          position: fixed;
          inset: 0;
          background: var(--sheet-backdrop);
          z-index: 200;
          animation: fadeInBackdrop 0.25s ease forwards;
        }

        .sheet {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 201;
          background: var(--bg-elevated);
          border-radius: 20px 20px 0 0;
          padding: 20px 24px calc(20px + env(safe-area-inset-bottom));
          width: 100%;
          max-width: 620px;
          max-height: 70dvh;
          overflow-y: auto;
          overflow-x: hidden;
          animation: slideUp 0.3s ease forwards;
          box-shadow: 0 -4px 30px var(--sheet-shadow);
        }

        .sheet-handle {
          width: 36px;
          height: 4px;
          background: var(--sheet-handle);
          border-radius: 2px;
          margin: 0 auto 16px;
        }

        .theme-toggle {
          font-family: 'Cinzel', serif;
          font-size: 16px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-gold);
          border-radius: 50%;
          background: var(--bg-input);
          color: var(--accent-gold-text);
          cursor: pointer;
          transition: all 0.3s;
          padding: 0;
          line-height: 1;
        }
        .theme-toggle:hover {
          border-color: var(--hover-border);
          box-shadow: 0 2px 12px var(--hover-shadow);
        }

        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
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
      <div className="glow-accent" style={{ top: "-250px", left: "-200px", background: `radial-gradient(circle, ${colors.glowAccent} 0%, transparent 70%)` }} />
      <div className="glow-accent" style={{ bottom: "-250px", right: "-200px", background: `radial-gradient(circle, ${colors.glowAccent} 0%, transparent 70%)` }} />

      <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: "16px 20px 0", position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Theme Toggle */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "\u2600" : "\u263E"}
          </button>
        </div>

        {/* Header */}
        <div className="fade-in" style={{ textAlign: "center", marginBottom: 8 }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(24px, 5vw, 38px)",
            fontWeight: 400,
            letterSpacing: 4,
            color: colors.textPrimary,
            lineHeight: 1.2,
          }}>Roman Numeral</h1>
          <h1 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "clamp(24px, 5vw, 38px)",
            fontWeight: 700,
            letterSpacing: 4,
            backgroundImage: colors.cipherGradient,
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
            color: colors.textMuted,
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
            color: colors.textTertiary,
            display: "block",
            marginBottom: 4,
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
                color: colors.textTertiary,
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
                  color: colors.textPrimary,
                }}>{output}</span>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 0", alignItems: "stretch" }}>
                  {letterBreakdown.map((word, wi) => (
                    <div key={wi} style={{ display: "flex", alignItems: "stretch" }}>
                      {wi > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", margin: "0 6px" }}>
                          <span style={{ color: colors.accentGoldText, fontSize: 15, fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.8" }}>-</span>
                          <span style={{ fontSize: 11, visibility: "hidden" }}>-</span>
                        </div>
                      )}
                      {word.map((item, li) => (
                        <div key={li} style={{ display: "flex", alignItems: "stretch" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ color: colors.accentGoldText, fontSize: 15, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0, lineHeight: "1.8" }}>{item.roman}</span>
                            <span style={{ fontFamily: "'Cinzel', serif", color: colors.textSecondary, fontSize: 11 }}>{item.letter}</span>
                          </div>
                          {li < word.length - 1 && (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ color: colors.accentGoldText, fontSize: 15, fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.8" }}>.</span>
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
                color: colors.textTertiary,
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
            color: colors.textFaint,
          }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 17, letterSpacing: 4, marginBottom: 12, color: colors.textMuted }}>
              FORMAT GUIDE
            </p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, lineHeight: 2, letterSpacing: 1, marginBottom: 14 }}>
              Letters separated by <span style={{ color: colors.accentGoldDeep }}>.</span> (dot)<br/>
              Words separated by <span style={{ color: colors.accentGoldDeep }}> - </span> (dash)
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
                color: colors.textTertiary,
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
              color: expandedOutput === "roman" ? colors.expandContentGold : colors.expandContentSecondary,
            }}>
              {expandedOutput === "roman" ? (
                mode === "decode" ? (
                  <span style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 20,
                    letterSpacing: 4,
                    color: colors.textPrimary,
                  }}>{output}</span>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 0", alignItems: "stretch" }}>
                    {letterBreakdown.map((word, wi) => (
                      <div key={wi} style={{ display: "flex", alignItems: "stretch" }}>
                        {wi > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", margin: "0 6px" }}>
                            <span style={{ color: colors.accentGoldText, fontSize: 15, fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.8" }}>-</span>
                            <span style={{ fontSize: 11, visibility: "hidden" }}>-</span>
                          </div>
                        )}
                        {word.map((item, li) => (
                          <div key={li} style={{ display: "flex", alignItems: "stretch" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                              <span style={{ color: colors.accentGoldText, fontSize: 15, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0, lineHeight: "1.8" }}>{item.roman}</span>
                              <span style={{ fontFamily: "'Cinzel', serif", color: colors.textSecondary, fontSize: 11 }}>{item.letter}</span>
                            </div>
                            {li < word.length - 1 && (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ color: colors.accentGoldText, fontSize: 15, fontFamily: "'JetBrains Mono', monospace", lineHeight: "1.8" }}>.</span>
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
              color: colors.textTertiary,
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
