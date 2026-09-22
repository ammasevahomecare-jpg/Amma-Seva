import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Download, 
  ExternalLink, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  Image as ImageIcon, 
  ShieldCheck, 
  Maximize2, 
  Minimize2, 
  CheckCircle2,
  RefreshCw,
  Eye,
  Sparkles,
  Layers,
  AlertCircle,
  FileCheck,
  Globe,
  Zap,
  RotateCcw
} from "lucide-react";

export interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  docUrl: string | null;
  docTitle?: string;
  applicantName?: string;
  category?: string;
}

type ViewerEngine = "google" | "proxy" | "native" | "image";

export function DocumentViewerModal({
  isOpen,
  onClose,
  docUrl,
  docTitle = "Verification Document",
  applicantName = "",
  category = "Verification Record"
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeEngine, setActiveEngine] = useState<ViewerEngine>("google");
  const modalRef = useRef<HTMLDivElement>(null);

  // Safe lower URL
  const urlLower = (docUrl || "").toLowerCase();

  // Determine file formats
  const isBase64Image = !!docUrl && docUrl.startsWith("data:image/");
  const isBase64Pdf = !!docUrl && docUrl.startsWith("data:application/pdf");
  const isDirectImage = !!docUrl && (
    isBase64Image ||
    urlLower.endsWith(".jpg") ||
    urlLower.endsWith(".jpeg") ||
    urlLower.endsWith(".png") ||
    urlLower.endsWith(".webp") ||
    urlLower.endsWith(".svg") ||
    urlLower.endsWith(".gif") ||
    urlLower.endsWith(".bmp") ||
    (urlLower.includes("/image/upload/") && !urlLower.endsWith(".pdf") && !urlLower.includes(".pdf?"))
  );

  const isPdf = !!docUrl && !isDirectImage && (
    isBase64Pdf ||
    urlLower.endsWith(".pdf") ||
    urlLower.includes(".pdf?") ||
    urlLower.includes("/raw/") ||
    urlLower.includes("pdf") ||
    urlLower.startsWith("http://") ||
    urlLower.startsWith("https://")
  );

  // Reset state whenever modal opens or docUrl changes
  useEffect(() => {
    if (isOpen && docUrl) {
      setZoom(1);
      setRotation(0);
      setShowDownloadSuccess(false);
      setIsLoading(true);
      setLoadError(false);

      // Default engine selection
      if (isDirectImage) {
        setActiveEngine("image");
      } else if (isBase64Pdf || !docUrl.startsWith("http")) {
        setActiveEngine("native");
      } else {
        // Remote URL (Cloudinary, AWS, server) -> Use Google Docs Viewer for 100% reliable in-modal preview
        setActiveEngine("google");
      }
    }
  }, [isOpen, docUrl, isDirectImage, isBase64Pdf]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fallback timeout for iframe loading indicator
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, activeEngine]);

  if (!isOpen || !docUrl) return null;

  // Generate safe filename for download
  const cleanApplicant = applicantName ? applicantName.replace(/[^a-zA-Z0-9]/g, "_") + "_" : "";
  const cleanTitle = docTitle.replace(/[^a-zA-Z0-9]/g, "_");
  const ext = isDirectImage ? ".jpg" : ".pdf";
  const downloadFileName = `${cleanApplicant}${cleanTitle}${ext}`;

  // Build rendered URLs based on selected engine
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`;
  const proxyViewerUrl = `/api/proxy-document?url=${encodeURIComponent(docUrl)}`;
  const cloudinaryImageUrl = docUrl.includes("cloudinary.com") 
    ? docUrl.replace(/\.pdf($|\?)/i, ".jpg") 
    : docUrl;

  // Safe download trigger
  const handleDownload = () => {
    try {
      if (docUrl.startsWith("data:") || docUrl.startsWith("blob:")) {
        const link = document.createElement("a");
        link.href = docUrl;
        link.download = downloadFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const link = document.createElement("a");
        link.href = docUrl;
        link.download = downloadFileName;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setShowDownloadSuccess(true);
      setTimeout(() => setShowDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Download failed, opening in new tab instead", err);
      window.open(docUrl, "_blank");
    }
  };

  // Safe print trigger
  const handlePrint = () => {
    if (isDirectImage || activeEngine === "image") {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${docTitle} - ${applicantName}</title>
              <style>
                body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
                img { max-width: 95%; max-height: 95%; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${docUrl}" onload="window.print();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      window.open(docUrl, "_blank");
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex flex-col bg-slate-950 rounded-2xl sm:rounded-3xl border-2 border-slate-800 shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen 
            ? "w-full h-full max-w-none max-h-none rounded-none" 
            : "w-full max-w-5xl h-[92vh] max-h-[940px]"
        }`}
      >
        {/* TOP CONTROL & METADATA TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#091438] via-[#0e2254] to-[#091438] px-4 py-3 sm:px-6 border-b border-white/15 text-white shrink-0">
          
          {/* Left: Document Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              {isDirectImage ? (
                <ImageIcon className="h-5 w-5 text-[#ffd700]" />
              ) : isPdf ? (
                <FileText className="h-5 w-5 text-rose-400" />
              ) : (
                <FileCheck className="h-5 w-5 text-emerald-400" />
              )}
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-md">
                  {docTitle}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40 shrink-0">
                  {isDirectImage ? "Image Proof" : isPdf ? "PDF Document" : "Attachment"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
                {applicantName && (
                  <span className="font-semibold text-amber-200">
                    {applicantName}
                  </span>
                )}
                {applicantName && <span className="text-slate-500">•</span>}
                <span className="text-slate-400 truncate max-w-[200px]">{category}</span>
              </div>
            </div>
          </div>

          {/* Center/Right: Engine Switcher for Remote PDFs */}
          {!isDirectImage && docUrl.startsWith("http") && (
            <div className="hidden lg:flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setActiveEngine("google");
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeEngine === "google" 
                    ? "bg-[#ffd700] text-slate-950 shadow-sm" 
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                title="Google Docs Cloud Engine (Best compatibility)"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Google View</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setActiveEngine("proxy");
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeEngine === "proxy" 
                    ? "bg-[#ffd700] text-slate-950 shadow-sm" 
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                title="Direct Stream Engine"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Direct Stream</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setActiveEngine("native");
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeEngine === "native" 
                    ? "bg-[#ffd700] text-slate-950 shadow-sm" 
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                title="Native Browser PDF Engine"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Native Engine</span>
              </button>
            </div>
          )}

          {/* Right: Actions (Zoom, Download, Print, Close) */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            
            {/* Image Zoom & Rotate Controls */}
            {(isDirectImage || activeEngine === "image") && (
              <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/10 mr-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 hover:bg-white/15 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-[11px] font-mono px-1 font-bold text-[#ffd700] min-w-[38px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1.5 hover:bg-white/15 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                  className="p-1.5 hover:bg-white/15 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 hover:bg-white/15 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer border-l border-white/10 ml-0.5 pl-1.5"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/15 transition-all cursor-pointer"
              title="Print Document"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>

            {/* Open in New Tab */}
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/15 transition-all cursor-pointer"
              title="Open raw file in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden sm:inline">New Tab</span>
            </a>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 bg-[#ffd700] hover:bg-[#ffd700]/90 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
              title="Download file to computer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:inline-flex p-2 hover:bg-white/15 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/10"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-xl transition-colors cursor-pointer ml-1"
              aria-label="Close document viewer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST: DOWNLOAD STARTED */}
        {showDownloadSuccess && (
          <div className="absolute top-16 right-6 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl border border-emerald-400 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Document download started: {downloadFileName}</span>
          </div>
        )}

        {/* MAIN VIEWER CANVAS */}
        <div className="relative flex-1 w-full bg-slate-900 overflow-hidden flex items-center justify-center p-1 sm:p-3">
          
          {/* SKELETON / LOADING SPINNER */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs gap-3">
              <div className="h-10 w-10 rounded-full border-3 border-[#ffd700] border-t-transparent animate-spin" />
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#ffd700] animate-pulse" />
                <span>Rendering verified document preview...</span>
              </div>
            </div>
          )}

          {/* 1. DIRECT IMAGE VIEWER */}
          {(isDirectImage || activeEngine === "image") ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
              <div 
                className="transition-transform duration-200 ease-out origin-center flex items-center justify-center max-w-full max-h-full"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`
                }}
              >
                <img
                  src={activeEngine === "image" ? cloudinaryImageUrl : docUrl}
                  alt={docTitle}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError(true);
                  }}
                  className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10 select-none pointer-events-auto bg-white"
                />
              </div>
            </div>
          ) : (
            /* 2. PDF & DOCUMENT VIEWER ENGINES */
            <div className="w-full h-full rounded-xl overflow-hidden bg-white shadow-2xl flex flex-col relative">
              
              {/* GOOGLE DOCS VIEWER ENGINE (DEFAULT FOR REMOTE URLS) */}
              {activeEngine === "google" && (
                <iframe
                  src={googleViewerUrl}
                  title={docTitle}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError(true);
                  }}
                  className="w-full h-full border-0 rounded-xl bg-white"
                />
              )}

              {/* AMMA SEVA INLINE STREAM PROXY ENGINE */}
              {activeEngine === "proxy" && (
                <iframe
                  src={proxyViewerUrl}
                  title={docTitle}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError(true);
                  }}
                  className="w-full h-full border-0 rounded-xl bg-white"
                />
              )}

              {/* NATIVE OBJECT / IFRAME ENGINE */}
              {activeEngine === "native" && (
                <object
                  data={docUrl}
                  type="application/pdf"
                  className="w-full h-full rounded-xl border-0 bg-white"
                  onLoad={() => setIsLoading(false)}
                >
                  <iframe
                    src={docUrl}
                    title={docTitle}
                    onLoad={() => setIsLoading(false)}
                    className="w-full h-full border-0 bg-white"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3 bg-slate-900 text-white">
                      <FileText className="h-10 w-10 text-[#ffd700]" />
                      <p className="text-sm font-semibold">Your browser did not allow direct inline embedding.</p>
                      <button
                        type="button"
                        onClick={() => setActiveEngine("google")}
                        className="px-4 py-2 rounded-xl bg-[#ffd700] text-slate-950 font-bold text-xs"
                      >
                        Switch to Google Viewer
                      </button>
                    </div>
                  </iframe>
                </object>
              )}

              {/* ERROR STATE OVERLAY */}
              {loadError && (
                <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h4 className="text-base font-bold text-white">Document Preview Options</h4>
                    <p className="text-xs text-slate-400">
                      The current rendering engine encountered an access restriction. Switch viewing mode below or open directly.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoadError(false);
                        setIsLoading(true);
                        setActiveEngine("google");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#ffd700] text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Globe className="h-3.5 w-3.5" /> View with Google Engine
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoadError(false);
                        setIsLoading(true);
                        setActiveEngine("proxy");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-300" /> Direct Stream
                    </button>
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
                    </a>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* BOTTOM FOOTER STATUS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#070f28] border-t border-white/10 text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#ffd700]" />
            <span className="font-medium text-slate-300">Confidential &amp; Verified Admin Review • Amma Seva Healthcare</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Engine switcher quick badges on mobile / small screens */}
            {!isDirectImage && (
              <div className="flex sm:hidden items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveEngine(activeEngine === "google" ? "proxy" : "google")}
                  className="px-2 py-0.5 rounded bg-white/10 text-amber-300 font-bold border border-white/15"
                >
                  Switch Engine
                </button>
              </div>
            )}

            <span className="text-slate-500 hidden sm:inline">
              Active Mode: <strong className="text-slate-300 uppercase">{activeEngine}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-amber-300 hover:text-white underline underline-offset-2 cursor-pointer font-medium"
            >
              Close Window (Esc)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
