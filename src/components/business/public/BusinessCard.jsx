import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Download,
  Sparkles,
  Share2,
  Copy,
  Save,
  Undo2,
  Redo2,
  RefreshCcw,
  FlipHorizontal2,
  Upload,
  Type,
  LayoutTemplate,
  Palette as PaletteIcon,
  Wand2,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import toast, { Toaster } from "react-hot-toast";

/** -----------------------------
 * Helper: tiny palette generator
 * ------------------------------*/
const CATEGORY_STYLES = {
  plumbing: { color: "#0ea5e9", font: "Poppins", tagline: "Fast • Reliable • Local" },
  restaurant: { color: "#ef4444", font: "Playfair Display", tagline: "Fresh Taste, Warm Welcome" },
  salon: { color: "#a855f7", font: "Inter", tagline: "Style that fits you" },
  tech: { color: "#22c55e", font: "Inter", tagline: "Smart Solutions, Simplified" },
  retail: { color: "#f59e0b", font: "Poppins", tagline: "Quality you can trust" },
  default: { color: "#0ea5e9", font: "Inter", tagline: "Proudly serving our community" },
};

const SYSTEM_FONTS = [
  "Inter",
  "Poppins",
  "Playfair Display",
  "Montserrat",
  "Nunito",
  "Roboto",
  "System UI",
];

const BG_TEXTURES = [
  { key: "none", label: "None" },
  { key: "soft-radial", label: "Soft Radial" },
  { key: "diagonal", label: "Diagonal Lines" },
  { key: "dots", label: "Dots" },
  { key: "paper", label: "Paper Grain" },
];

const LAYOUTS = [
  { key: "default", label: "Default (Bar + QR)" },
  { key: "vertical", label: "Vertical Focus" },
  { key: "minimal", label: "Minimal Centered" },
];

/** -----------------------------
 * Main
 * ------------------------------*/
export default function BusinessCard() {
  const { id } = useParams();
  const navigate = useNavigate();

  // business data
  const [business, setBusiness] = useState(null);

  // design state
  const [cardPalette, setCardPalette] = useState("emablue");
  const [customPrimary, setCustomPrimary] = useState("#0ea5e9");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [layout, setLayout] = useState("default");
  const [bgTexture, setBgTexture] = useState("none");
  const [tagline, setTagline] = useState("");

  // live-editable fields (do not mutate DB, just for design)
  const [displayName, setDisplayName] = useState("");
  const [displayCategory, setDisplayCategory] = useState("");
  const [displayVillage, setDisplayVillage] = useState("");
  const [displayAddress, setDisplayAddress] = useState("");
  const [displayPhone, setDisplayPhone] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [cardLogoUrl, setCardLogoUrl] = useState("");

  // 🆕 watermark opacity (0–1)
  const [logoOpacity, setLogoOpacity] = useState(0.1);

  // history (undo/redo)
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // template management
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // preview refs
  const frontRef = useRef(null);
  const backRef = useRef(null);

  // flip state
  const [flip, setFlip] = useState(false);

  // fetch business
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error(error);
        toast.error("Failed to load business.");
      } else {
        setBusiness(data);
        // initialize display fields
        setDisplayName(data.name || "");
        setDisplayCategory(data.category || "");
        setDisplayVillage(data.village || "");
        setDisplayAddress(data.address || "");
        setDisplayPhone(data.phone || "");
        setDisplayEmail(data.contact || "");
        setCardLogoUrl(data.image_url || "");
        setTagline(
          CATEGORY_STYLES[data.category?.toLowerCase()]?.tagline ??
            CATEGORY_STYLES.default.tagline
        );
      }
    })();
  }, [id]);

  // load existing templates
  useEffect(() => {
    if (!business) return;
    (async () => {
      setLoadingTemplates(true);
      const { data, error } = await supabase
        .from("business_card_templates")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });
      if (error) {
        // ok if table doesn't exist
        console.warn("Template fetch:", error.message);
      } else {
        setTemplates(data || []);
      }
      setLoadingTemplates(false);
    })();
  }, [business]);

  // derive palette color
  const paletteColor = useMemo(() => {
    if (cardPalette === "emablue") return "#0ea5e9";
    if (cardPalette === "gray") return "#6b7280";
    return customPrimary || "#0ea5e9";
  }, [cardPalette, customPrimary]);

  const paletteTextOn = useMemo(() => {
    try {
      const c = paletteColor.replace("#", "");
      const r = parseInt(c.slice(0, 2), 16);
      const g = parseInt(c.slice(2, 4), 16);
      const b = parseInt(c.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.6 ? "white" : "#111827";
    } catch {
      return "white";
    }
  }, [paletteColor]);

  const businessUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/business/${id}`;
  }, [id]);

  /** -----------------------------
   * Undo / Redo
   * ------------------------------*/
  const snapshotDesign = useCallback(
    () => ({
      cardPalette,
      customPrimary,
      fontFamily,
      layout,
      bgTexture,
      tagline,
      displayName,
      displayCategory,
      displayVillage,
      displayAddress,
      displayPhone,
      displayEmail,
      cardLogoUrl,
      logoOpacity, // 🆕 include in snapshots/templates
    }),
    [
      cardPalette,
      customPrimary,
      fontFamily,
      layout,
      bgTexture,
      tagline,
      displayName,
      displayCategory,
      displayVillage,
      displayAddress,
      displayPhone,
      displayEmail,
      cardLogoUrl,
      logoOpacity,
    ]
  );

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h, snapshotDesign()]);
    setFuture([]); // clear redo stack
  }, [snapshotDesign]);

  const restoreDesign = (d) => {
    setCardPalette(d.cardPalette);
    setCustomPrimary(d.customPrimary);
    setFontFamily(d.fontFamily);
    setLayout(d.layout);
    setBgTexture(d.bgTexture);
    setTagline(d.tagline);
    setDisplayName(d.displayName);
    setDisplayCategory(d.displayCategory);
    setDisplayVillage(d.displayVillage);
    setDisplayAddress(d.displayAddress);
    setDisplayPhone(d.displayPhone);
    setDisplayEmail(d.displayEmail);
    setCardLogoUrl(d.cardLogoUrl);
    if (typeof d.logoOpacity === "number") setLogoOpacity(d.logoOpacity); // 🆕 restore
  };

  const undo = () => {
    setHistory((h) => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [snapshotDesign(), ...f]);
      restoreDesign(prev);
      return h.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      setHistory((h) => [...h, snapshotDesign()]);
      restoreDesign(next);
      return f.slice(1);
    });
  };

  /** -----------------------------
   * Logo Upload (Supabase Storage)
   * ------------------------------*/
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !business) return;
    pushHistory();
    const fileExt = file.name.split(".").pop();
    const path = `biz-${business.id}/${Date.now()}.${fileExt}`;
    try {
      const { error: upErr } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(path);
      if (!urlData?.publicUrl)
        throw new Error("No public URL for uploaded logo.");

      setCardLogoUrl(urlData.publicUrl);
      toast.success("Logo uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed (check 'logos' bucket exists & is public).");
    } finally {
      e.target.value = null;
    }
  };

  /** -----------------------------
   * AI Smart Style
   * ------------------------------*/
  const generateSmartStyle = () => {
    if (!business) return;
    pushHistory();

    const key = (business.category || "").toLowerCase();
    const preset = CATEGORY_STYLES[key] || CATEGORY_STYLES.default;

    // Slight color shift
    const shade = tinyShiftColor(preset.color, 6);
    setCardPalette("custom");
    setCustomPrimary(shade);

    // Font + Tagline
    setFontFamily(preset.font);
    setTagline(preset.tagline);

    toast.success("Smart style applied ✨");
    ensureGoogleFontLoaded(preset.font);
  };

  function tinyShiftColor(hex, amount = 6) {
    try {
      const c = hex.replace("#", "");
      let r = parseInt(c.slice(0, 2), 16);
      let g = parseInt(c.slice(2, 4), 16);
      let b = parseInt(c.slice(4, 6), 16);
      r = Math.min(255, Math.max(0, r + amount));
      g = Math.min(255, Math.max(0, g - amount));
      b = Math.min(255, Math.max(0, b + amount));
      return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    } catch {
      return hex;
    }
  }

  /** -----------------------------
   * Fonts (Google Fonts on demand)
   * ------------------------------*/
  const ensureGoogleFontLoaded = (font) => {
    if (!font || font === "System UI") return;
    const id = `gf-${font.replace(/\s+/g, "-").toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      font
    )}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);
  };

  useEffect(() => {
    ensureGoogleFontLoaded(fontFamily);
  }, [fontFamily]);

  /** -----------------------------
   * Export: PNG / PDF (best-effort)
   * ------------------------------*/
  const exportPNG = useCallback(
    async (side) => {
      const node = side === "front" ? frontRef.current : backRef.current;
      if (!node) return;
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${displayName || "Business"}-Card-${side}.png`;
      a.click();
    },
    [displayName]
  );

  const exportPDF = useCallback(
    async (side) => {
      try {
        const node = side === "front" ? frontRef.current : backRef.current;
        if (!node) return;
        const canvas = await html2canvas(node, {
          backgroundColor: "white",
          scale: 2,
          useCORS: true,
        });
        const img = canvas.toDataURL("image/png");

        const jsPDF = (await import("jspdf")).default;
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: [340, 200],
        });
        pdf.addImage(img, "PNG", 0, 0, 340, 200);
        pdf.save(`${displayName || "Business"}-Card-${side}.pdf`);
      } catch (err) {
        console.warn("PDF export error:", err?.message);
        toast.error("PDF export needs 'jspdf' installed. Try PNG instead.");
      }
    },
    [displayName]
  );

  /** -----------------------------
   * vCard download
   * ------------------------------*/
  const downloadVCard = () => {
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${displayName}`,
      `FN:${displayName}`,
      displayPhone ? `TEL;TYPE=cell:${displayPhone}` : "",
      displayEmail ? `EMAIL:${displayEmail}` : "",
      displayAddress ? `ADR;TYPE=work:;;${displayAddress};;;;` : "",
      `URL:${businessUrl}`,
      "END:VCARD",
    ].filter(Boolean);
    const blob = new Blob([lines.join("\n")], {
      type: "text/vcard;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${displayName || "contact"}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** -----------------------------
   * Share link
   * ------------------------------*/
  const shareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: displayName || "My Business",
          text: "Check out my business on Nexaloc!",
          url: businessUrl,
        });
      } else {
        await navigator.clipboard.writeText(businessUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      await navigator.clipboard.writeText(businessUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  /** -----------------------------
   * Save / Load Templates (Supabase)
   * ------------------------------*/
  const saveTemplate = async () => {
    if (!business) return;
    setSavingTemplate(true);
    try {
      const record = {
        business_id: business.id,
        name: `Template ${new Date().toLocaleString()}`,
        config: snapshotDesign(),
      };
      const { error } = await supabase
        .from("business_card_templates")
        .insert(record);
      if (error) throw error;
      toast.success("Template saved!");
      const { data } = await supabase
        .from("business_card_templates")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });
      setTemplates(data || []);
    } catch (err) {
      console.warn(err?.message);
      toast.error(
        "Template save failed (ensure table exists & RLS allows inserts)."
      );
    } finally {
      setSavingTemplate(false);
    }
  };

  const applyTemplate = async (tpl) => {
    if (!tpl?.config) return;
    pushHistory();
    restoreDesign(tpl.config);
    toast.success(`Applied: ${tpl.name || "Template"}`);
  };

  /** -----------------------------
   * Background styles
   * ------------------------------*/
  const bgStyle = useMemo(() => {
    switch (bgTexture) {
      case "soft-radial":
        return {
          background:
            "radial-gradient(1200px circle at 0% 0%, rgba(0,0,0,0.05), rgba(0,0,0,0) 40%)",
        };
      case "diagonal":
        return {
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 4px, transparent 4px, transparent 10px)",
        };
      case "dots":
        return {
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.07) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        };
      case "paper":
        return {
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)",
          backgroundPosition: "0 0, 5px 5px",
          backgroundSize: "10px 10px",
        };
      default:
        return {};
    }
  }, [bgTexture]);

  /** -----------------------------
   * Layout blocks
   * ------------------------------*/
  const CardFrontContent = () => (
    <div
      ref={frontRef}
      className="relative w-[340px] h-[200px] rounded-xl shadow-md overflow-hidden bg-white dark:bg-slate-900 border border-slate-200"
    >
      {/* Background watermark logo */}
      {cardLogoUrl && (
        <img
          src={cardLogoUrl}
          alt="watermark"
          className="absolute inset-0 m-auto scale-150 object-contain"
          style={{ opacity: logoOpacity }}
        />
      )}

      {/* Business Name */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-center">
        <h2
          className="text-lg font-bold tracking-wide"
          style={{
            color: paletteColor,
            fontFamily:
              fontFamily === "System UI"
                ? "system-ui"
                : `'${fontFamily}', system-ui, -apple-system`,
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          {displayName || "Your Business Name"}
        </h2>
        <div className="w-12 h-[2px] bg-slate-300 mx-auto mt-1 rounded-full" />
      </div>

      {/* Info Section */}
      <div
        className="absolute inset-x-4 top-12 bottom-4 text-center flex flex-col justify-center text-[11px] leading-relaxed space-y-1 text-slate-600"
        style={{
          fontFamily:
            fontFamily === "System UI"
              ? "system-ui"
              : `'${fontFamily}', system-ui, -apple-system`,
        }}
      >
        {displayCategory && <div className="font-semibold">{displayCategory}</div>}
        {tagline && <div className="italic text-slate-500">{tagline}</div>}
        {displayAddress && <div>{displayAddress}</div>}
        {displayVillage && <div>{displayVillage}</div>}
        {displayPhone && <div>📞 {displayPhone}</div>}
        {displayEmail && <div>✉️ {displayEmail}</div>}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: paletteColor }}
      />
    </div>
  );

  const CardBackContent = () => {
    return (
      <div
        ref={backRef}
        className="relative w-[340px] h-[200px] rounded-xl shadow-md overflow-hidden bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
        style={bgStyle}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex flex-col items-center gap-2"
            style={{
              fontFamily:
                fontFamily === "System UI"
                  ? "system-ui"
                  : `'${fontFamily}', system-ui, -apple-system`,
            }}
          >
            <div
              className="px-2 py-1 rounded text-xs font-semibold"
              style={{
                backgroundColor: paletteColor,
                color: paletteTextOn,
              }}
            >
              Thank you for choosing us!
            </div>

            {/* Single QR code on the back, with optional logo overlay */}
            <div className="relative">
              <QRCodeCanvas value={businessUrl} size={86} level="H" includeMargin />
              {cardLogoUrl && (
                <img
                  src={cardLogoUrl}
                  alt="logo overlay"
                  className="absolute rounded-md"
                  style={{
                    width: 22,
                    height: 22,
                    top: 32,
                    left: 32,
                    background: "white",
                  }}
                />
              )}
            </div>

            <div className="text-[10px] text-slate-500">Scan to view details</div>
          </div>
        </div>

        <div className="absolute bottom-1 right-2 text-[10px] text-slate-400">
          Nexaloc
        </div>

        <div
          className="absolute left-0 right-0 top-0 h-1"
          style={{ backgroundColor: paletteColor }}
        />
      </div>
    );
  };

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-300">
        Loading business card...
      </div>
    );
  }

  /** -----------------------------
   * Render
   * ------------------------------*/
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6">
      <Toaster position="top-center" />

      {/* Header / Back */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sky-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back 
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </button>
          <button
            onClick={redo}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
            Redo
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[360px_1fr] gap-6">
        {/* Controls */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-5">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Wand2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold">Design Controls</h3>
          </div>

          {/* AI Smart Style */}
          <button
            onClick={() => {
              pushHistory();
              generateSmartStyle();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-600 text-white hover:opacity-90"
          >
            <Sparkles className="w-4 h-4" />
            Auto-Generate Style
          </button>

          {/* Palette */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium">
              <PaletteIcon className="w-4 h-4 text-sky-500" /> Palette
            </label>
            <div className="flex items-center gap-2">
              <select
                value={cardPalette}
                onChange={(e) => {
                  pushHistory();
                  setCardPalette(e.target.value);
                }}
                className="border rounded px-2 py-1 bg-white dark:bg-slate-900 dark:bg-slate-800 w-full"
              >
                <option value="emablue">Nexaloc Blue (#0ea5e9)</option>
                <option value="gray">Neutral Gray</option>
                <option value="custom">Custom…</option>
              </select>
              {cardPalette === "custom" && (
                <input
                  type="color"
                  value={customPrimary}
                  onChange={(e) => {
                    pushHistory();
                    setCustomPrimary(e.target.value);
                  }}
                  className="w-10 h-10 rounded border border-slate-300 dark:border-slate-600 p-0"
                  title="Pick custom brand color"
                />
              )}
            </div>
          </div>

          {/* Font */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium">
              <Type className="w-4 h-4 text-sky-500" /> Font
            </label>
            <select
              value={fontFamily}
              onChange={(e) => {
                pushHistory();
                setFontFamily(e.target.value);
              }}
              className="border rounded px-2 py-1 bg-white dark:bg-slate-900 dark:bg-slate-800 w-full"
            >
              {SYSTEM_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Layout */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium">
              <LayoutTemplate className="w-4 h-4 text-sky-500" /> Layout
            </label>
            <select
              value={layout}
              onChange={(e) => {
                pushHistory();
                setLayout(e.target.value);
              }}
              className="border rounded px-2 py-1 bg-white dark:bg-slate-900 dark:bg-slate-800 w-full"
            >
              {LAYOUTS.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Background Texture */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium">
              <RefreshCcw className="w-4 h-4 text-sky-500" /> Background
            </label>
            <select
              value={bgTexture}
              onChange={(e) => {
                pushHistory();
                setBgTexture(e.target.value);
              }}
              className="border rounded px-2 py-1 bg-white dark:bg-slate-900 dark:bg-slate-800 w-full"
            >
              {BG_TEXTURES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-medium">
              <Upload className="w-4 h-4 text-sky-500" /> Logo
            </label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} />
          </div>

          {/* 🆕 Logo Transparency */}
          <div className="space-y-2">
            <label htmlFor="opacityRange" className="font-medium">
              Logo Transparency
            </label>
            <input
              id="opacityRange"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={logoOpacity}
              onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
              onMouseUp={pushHistory}
              onTouchEnd={pushHistory}
              className="w-full"
            />
            <div className="text-xs text-slate-500">
              Current: {(logoOpacity * 100).toFixed(0)}%
            </div>
          </div>

          {/* Text Fields */}
          <div className="space-y-2">
            <label className="font-medium">Business Name</label>
            <input
              className="border rounded px-3 py-2 w-full bg-white dark:bg-slate-900 dark:bg-slate-800"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={pushHistory}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="font-medium">Category</label>
              <input
                className="border rounded px-3 py-2 w-full bg-white dark:bg-slate-900 dark:bg-slate-800"
                value={displayCategory}
                onChange={(e) => setDisplayCategory(e.target.value)}
                onBlur={pushHistory}
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Village</label>
              <input
                className="border rounded px-3 py-2 w-full bg-white dark:bg-slate-900 dark:bg-slate-800"
                value={displayVillage}
                onChange={(e) => setDisplayVillage(e.target.value)}
                onBlur={pushHistory}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Address</label>
            <input
              className="border rounded px-3 py-2 w-full bg-white dark:bg-slate-900 dark:bg-slate-800"
              value={displayAddress}
              onChange={(e) => setDisplayAddress(e.target.value)}
              onBlur={pushHistory}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="font-medium">Phone</label>
              <input
                className="border rounded px-3 py-2 w-full bg-white dark:bg-slate-900 dark:bg-slate-800"
                value={displayPhone}
                onChange={(e) => setDisplayPhone(e.target.value)}
                onBlur={pushHistory}
              />
            </div>
            <div className="space-y-2">
              <label className="font-medium">Email</label>
              <input
                className="border rounded px-3 py-2 w-full bg-white dark:bg-slate-900 dark:bg-slate-800"
                value={displayEmail}
                onChange={(e) => setDisplayEmail(e.target.value)}
                onBlur={pushHistory}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Tagline</label>
            <input
              className="border rounded px-3 py-2 w-full bg-white dark:bg-slate-900 dark:bg-slate-800"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              onBlur={pushHistory}
            />
          </div>

          {/* Actions: Save Template / Share / vCard */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={saveTemplate}
              disabled={savingTemplate}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              Save Template
            </button>
            <button
              onClick={downloadVCard}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Type className="w-4 h-4" />
              Download vCard
            </button>
          </div>

          <button
            onClick={shareLink}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Share2 className="w-4 h-4" />
            Share Link
          </button>

          {/* Templates List */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <LayoutTemplate className="w-4 h-4 text-sky-500" />
              <span className="font-semibold">My Templates</span>
            </div>
            {loadingTemplates ? (
              <div className="text-sm text-slate-500">Loading templates…</div>
            ) : templates.length ? (
              <div className="space-y-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {t.name || "Template"}{" "}
                    <span className="text-xs text-slate-500">
                      {new Date(t.created_at).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                No templates saved yet.
              </div>
            )}
          </div>
        </div>

        {/* Preview + Exports */}
        <div className="bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Business Card Preview</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFlip((f) => !f)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <FlipHorizontal2 className="w-4 h-4" />
                Flip
              </button>
              <button
                onClick={() => exportPNG(flip ? "back" : "front")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-700"
              >
                <Download className="w-4 h-4" />
                PNG ({flip ? "Back" : "Front"})
              </button>
              <button
                onClick={() => exportPDF(flip ? "back" : "front")}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Download className="w-4 h-4" />
                PDF ({flip ? "Back" : "Front"})
              </button>
            </div>
          </div>

          {/* 3D flip preview (Front/Back) */}
          <div className="relative w-[340px] h-[200px] mx-auto perspective-[1200px]">
            <AnimatePresence mode="wait" initial={false}>
              {!flip ? (
                <motion.div
                  key="front"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <CardFrontContent />
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <CardBackContent />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Deep link & Copy */}
          <div className="mt-6 flex items-center gap-2">
            <div className="text-sm text-slate-500 break-all">{businessUrl}</div>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(businessUrl);
                toast.success("Copied link!");
              }}
              className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
