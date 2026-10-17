"use client";

import React, { useState, useRef } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { QrCode, Download, Sparkles, Copy, Check, Palette, ArrowRight, Link as LinkIcon, RefreshCw } from "lucide-react";
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

export default function QrTab({ onCreateClick, userLinks = [] }: QrTabProps) {
  const initialUrl = userLinks.length > 0 ? userLinks[0].short_url : "https://picolink.dev";
  const [qrValue, setQrValue] = useState(initialUrl);
  const [fgColor, setFgColor] = useState("#4f46e5");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const downloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `picolink_qr_${Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    toast.success("QR Code downloaded as PNG!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("QR destination URL copied!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Feature Hero */}
      <div className="text-center space-y-4 max-w-xl mx-auto">
        <div className="relative w-48 h-48 mx-auto p-4 rounded-3xl bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 shadow-2xl flex flex-col items-center justify-center">
          <div className="p-3 bg-white rounded-2xl shadow-lg">
            <QRCodeCanvas
              ref={canvasRef}
              value={qrValue}
              size={110}
              fgColor={fgColor}
              bgColor={bgColor}
              level="H"
            />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/40">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Dynamic QR Codes for Every Link
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Create trackable QR codes from your shortened links. Select an existing link, customize colors, download high-res PNG, and start scanning.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={downloadQr}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
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
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" />
            <span>Interactive QR Customizer</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Error Correction: Level H</span>
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
              Custom Foreground
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
              Custom Background
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
