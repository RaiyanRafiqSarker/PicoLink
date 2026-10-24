"use client";

import React, { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  QrCode,
  Download,
  Sparkles,
  Copy,
  Check,
  Palette,
  ArrowRight,
  Link as LinkIcon,
  RefreshCw,
  Frame,
  Type,
} from "lucide-react";
import { toast } from "sonner";

interface QrTabProps {
  onCreateClick: () => void;
  userLinks?: Array<{
    id: number;
    short_code: string;
    short_url: string;
    original_url: string;
    total_clicks?: number;
  }>;
}

const COLOR_PRESETS = [
  { name: "Indigo Classic", fg: "#4f46e5", bg: "#ffffff" },
  { name: "Emerald Mint", fg: "#059669", bg: "#ffffff" },
  { name: "Violet Royal", fg: "#7c3aed", bg: "#ffffff" },
  { name: "Rose Sunset", fg: "#e11d48", bg: "#ffffff" },
  { name: "Cyber Black", fg: "#0f172a", bg: "#ffffff" },
];

const FRAME_PRESETS = [
  { id: "none", label: "No Frame" },
  { id: "scan_me", label: "SCAN ME" },
  { id: "visit_menu", label: "VISIT MENU" },
  { id: "get_app", label: "GET APP" },
  { id: "follow_us", label: "FOLLOW US" },
  { id: "custom", label: "Custom Text" },
];

export default function QrTab({ onCreateClick, userLinks = [] }: QrTabProps) {
  const initialUrl = userLinks.length > 0 ? userLinks[0].short_url : "https://picolink.dev";
  const [qrValue, setQrValue] = useState(initialUrl);
  const [fgColor, setFgColor] = useState("#4f46e5");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Phase 3.1: Dynamic QR Code CTA Frames State
  const [framePreset, setFramePreset] = useState("scan_me");
  const [customFrameText, setCustomFrameText] = useState("SCAN ME");
  const [frameColor, setFrameColor] = useState("#4f46e5");
  const [frameTextColor, setFrameTextColor] = useState("#ffffff");
  const [framePosition, setFramePosition] = useState<"top" | "bottom">("top");

  const effectiveFrameText =
    framePreset === "none"
      ? ""
      : framePreset === "custom"
      ? customFrameText
      : FRAME_PRESETS.find((p) => p.id === framePreset)?.label || "SCAN ME";

  const downloadQrWithFrame = () => {
    const qrCanvas = canvasRef.current;
    if (!qrCanvas) return;

    if (framePreset === "none") {
      // Export standard QR code without frame
      const pngUrl = qrCanvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `picolink_qr_${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success("QR Code downloaded as PNG!");
      return;
    }

    // Paint full stylized frame onto high-res canvas
    const exportCanvas = document.createElement("canvas");
    const width = 600;
    const height = 720;
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Outer Background Fill
    ctx.fillStyle = bgColor;
    ctx.roundRect(0, 0, width, height, 40);
    ctx.fill();

    // Outer border frame
    ctx.lineWidth = 14;
    ctx.strokeStyle = frameColor;
    ctx.roundRect(7, 7, width - 14, height - 14, 36);
    ctx.stroke();

    // CTA Text Badge Header / Footer
    const badgeHeight = 90;
    const badgeY = framePosition === "top" ? 7 : height - badgeHeight - 7;
    ctx.fillStyle = frameColor;
    if (framePosition === "top") {
      ctx.beginPath();
      ctx.roundRect(7, 7, width - 14, badgeHeight, [32, 32, 0, 0]);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.roundRect(7, badgeY, width - 14, badgeHeight, [0, 0, 32, 32]);
      ctx.fill();
    }

    // Draw CTA text
    ctx.fillStyle = frameTextColor;
    ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(effectiveFrameText, width / 2, badgeY + badgeHeight / 2);

    // Draw QR Code centered inside
    const qrSize = 420;
    const qrX = (width - qrSize) / 2;
    const qrY = framePosition === "top" ? 170 : 80;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // Trigger download
    const pngUrl = exportCanvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `picolink_framed_qr_${Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success("Framed QR Code downloaded as high-res PNG!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("QR destination URL copied!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fade-in">
      {/* Feature Hero */}
      <div className="text-center space-y-4 max-w-xl mx-auto">
        {/* Dynamic Canvas Container with Frame Preview */}
        <div className="relative inline-block mx-auto p-6 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl">
          <div
            className="p-4 rounded-2xl shadow-xl transition-all"
            style={{
              backgroundColor: bgColor,
              border: framePreset !== "none" ? `4px solid ${frameColor}` : "none",
            }}
          >
            {/* Top Frame Badge */}
            {framePreset !== "none" && framePosition === "top" && (
              <div
                className="py-1.5 px-4 mb-3 rounded-lg text-xs font-black uppercase tracking-wider text-center"
                style={{ backgroundColor: frameColor, color: frameTextColor }}
              >
                {effectiveFrameText}
              </div>
            )}

            <div className="p-2 bg-white rounded-xl shadow-inner flex items-center justify-center">
              <QRCodeCanvas
                ref={canvasRef}
                value={qrValue}
                size={160}
                fgColor={fgColor}
                bgColor={bgColor}
                level="H"
              />
            </div>

            {/* Bottom Frame Badge */}
            {framePreset !== "none" && framePosition === "bottom" && (
              <div
                className="py-1.5 px-4 mt-3 rounded-lg text-xs font-black uppercase tracking-wider text-center"
                style={{ backgroundColor: frameColor, color: frameTextColor }}
              >
                {effectiveFrameText}
              </div>
            )}
          </div>

          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/40 shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dynamic QR Codes with CTA Frames
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed mt-1">
            Create high-engagement, scan-ready QR codes with customizable call-to-action badge frames, color palettes, and high-res export.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={downloadQrWithFrame}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res PNG</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy URL"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Customizer Panel */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto space-y-6 shadow-sm">
        {/* Phase 3.1: QR Code Frame CTA Presets */}
        <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Frame className="w-4 h-4 text-indigo-500" />
              <span>CTA Badge Frame Presets</span>
            </h3>
            <span className="text-[11px] text-indigo-500 font-semibold">Phase 3 Feature</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FRAME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setFramePreset(preset.id);
                  if (preset.id !== "custom" && preset.id !== "none") {
                    setCustomFrameText(preset.label);
                  }
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition text-center ${
                  framePreset === preset.id
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {framePreset !== "none" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Badge Frame Text
                </label>
                <input
                  type="text"
                  value={customFrameText}
                  onChange={(e) => {
                    setCustomFrameText(e.target.value);
                    setFramePreset("custom");
                  }}
                  maxLength={24}
                  placeholder="e.g. SCAN ME or GET APP"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Badge Position
                </label>
                <div className="inline-flex w-full p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFramePosition("top")}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold transition ${
                      framePosition === "top"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    Top
                  </button>
                  <button
                    type="button"
                    onClick={() => setFramePosition("bottom")}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold transition ${
                      framePosition === "bottom"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-500"
                    }`}
                  >
                    Bottom
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Frame Color Controls */}
          {framePreset !== "none" && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Frame Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={frameColor}
                    onChange={(e) => setFrameColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{frameColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Badge Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={frameTextColor}
                    onChange={(e) => setFrameTextColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{frameTextColor}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Source Link Selector */}
        {userLinks.length > 0 && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Select One of Your Shortened Links
            </label>
            <select
              value={qrValue}
              onChange={(e) => setQrValue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {userLinks.map((ul) => (
                <option key={ul.id} value={ul.short_url}>
                  /{ul.short_code} — {ul.original_url.substring(0, 40)}...
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Manual Target URL */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
            QR Target URL or Custom Content
          </label>
          <input
            type="text"
            value={qrValue}
            onChange={(e) => setQrValue(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Color Presets */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Palette Presets
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setFgColor(preset.fg);
                  setBgColor(preset.bg);
                  setFrameColor(preset.fg);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                  fgColor === preset.fg
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white font-semibold"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: preset.fg }}
                />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Hex Color Pickers */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              QR Foreground Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{fgColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              QR Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-slate-700 dark:text-slate-300">{bgColor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
