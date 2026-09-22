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
  AlertCircle,
  FileCheck,
  Maximize2,
  Minimize2,
  CheckCircle2
} from "lucide-react";

export interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  docUrl: string | null;
  docTitle?: string;
  applicantName?: string;
  category?: string;
}

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
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset zoom & rotation when document changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setShowDownloadSuccess(false);
    }
  }, [isOpen, docUrl]);

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

  if (!isOpen || !docUrl) return null;

  // Determine file type
  const urlLower = docUrl.toLowerCase();
  const isPdf = 
    docUrl.startsWith("data:application/pdf") || 
    urlLower.endsWith(".pdf") || 
    urlLower.includes(".pdf?") ||
    urlLower.includes("/raw/") ||
    urlLower.includes("pdf");

  const isImage = 
    !isPdf && (
      docUrl.startsWith("data:image/") ||
      urlLower.endsWith(".jpg") ||
      urlLower.endsWith(".jpeg") ||
      urlLower.endsWith(".png") ||
      urlLower.endsWith(".webp") ||
      urlLower.endsWith(".svg") ||
      urlLower.endsWith(".gif") ||
      urlLower.includes("/image/") ||
      urlLower.includes("cloudinary.com")
    );

  // Generate safe filename for download
  const cleanApplicant = applicantName ? applicantName.replace(/[^a-zA-Z0-9]/g, "_") + "_" : "";
  const cleanTitle = docTitle.replace(/[^a-zA-Z0-9]/g, "_");
  const ext = isPdf ? ".pdf" : isImage ? ".jpg" : "";
  const downloadFileName = `${cleanApplicant}${cleanTitle}${ext}`;

  // Handle safe download
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
        // Fetch or direct anchor
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

  // Handle print
  const handlePrint = () => {
    if (isImage) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${docTitle} - ${applicantName}</title>
              <style>
                body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; }
                img { max-width: 95%; max-height: 95%; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${docUrl}" onload="window.print();window.close();" />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex flex-col bg-slate-950 rounded-2xl sm:rounded-3xl border-2 border-slate-800 shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen 
            ? "w-full h-full max-w-none max-h-none rounded-none" 
            : "w-full max-w-5xl h-[90vh] max-h-[920px]"
        }`}
      >
        {/* TOP CONTROL & METADATA TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#091438] via-[#0e2254] to-[#091438] px-4 py-3 sm:px-6 border-b border-white/15 text-white shrink-0">
          
          {/* Left: Document Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              {isPdf ? (
                <FileText className="h-5 w-5 text-rose-400" />
              ) : isImage ? (
                <ImageIcon className="h-5 w-5 text-[#ffd700]" />
              ) : (
                <FileCheck className="h-5 w-5 text-emerald-400" />
              )}
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-md">
                  {docTitle}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40 shrink-0">
                  {isPdf ? "PDF Document" : isImage ? "Image Proof" : "Attachment"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-0.5">
                {applicantName && (
                  <span className="font-semibold text-amber-200">
                    {applicantName}
                  </span>
                )}
                {applicantName && <span className="text-slate-500">•</span>}
                <span className="text-slate-400">{category}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions (Zoom, Download, Print, Close) */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            
            {/* Image Zoom & Rotate Controls */}
            {isImage && (
              <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/10 mr-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 hover:bg-white/15 rounded-lg text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-[11px] font-mono px-1 font-bold text-[#ffd700] min-w-[42px] text-center">
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
              className="hidden md:inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/15 transition-all cursor-pointer"
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
        <div className="relative flex-1 w-full bg-slate-900 overflow-auto flex items-center justify-center p-2 sm:p-4">
          
          {/* 1. PDF VIEWER */}
          {isPdf ? (
            <div className="w-full h-full rounded-xl overflow-hidden bg-white shadow-inner flex flex-col">
              <iframe
                src={docUrl}
                title={docTitle}
                className="w-full h-full border-0 rounded-xl bg-white"
              />
            </div>
          ) : isImage ? (
            /* 2. IMAGE VIEWER */
            <div className="relative w-full h-full flex items-center justify-center overflow-auto">
              <div 
                className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`
                }}
              >
                <img
                  src={docUrl}
                  alt={docTitle}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl border border-white/10 select-none pointer-events-auto"
                />
              </div>
            </div>
          ) : (
            /* 3. OTHER DOCUMENT / GENERIC FALLBACK */
            <div className="text-center p-8 max-w-md bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-[#ffd700]/15 border border-[#ffd700]/30 flex items-center justify-center text-[#ffd700]">
                <FileText className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">{docTitle}</h4>
                <p className="text-xs text-slate-400">
                  This document type can be previewed in a dedicated browser tab or downloaded directly.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-amber-300" /> Open File
                </a>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-[#ffd700] hover:bg-[#ffd700]/90 text-slate-950 text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM FOOTER STATUS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#070f28] border-t border-white/10 text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#ffd700]" />
            <span>Confidential &amp; Verified Admin Review • Amma Seva Healthcare</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 hidden sm:inline">
              Preview mode (Click Download above if you need an offline copy)
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
