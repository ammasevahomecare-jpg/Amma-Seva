import { useState, useEffect, useCallback } from "react";
import { 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  ShieldCheck, 
  Building2, 
  HeartHandshake, 
  Calendar,
  CheckCircle2,
  Camera,
  Sparkles
} from "lucide-react";

import iasPhoto from "@/assets/sandeep-nanduri-ias.jpg";
import inauguLamp from "@/assets/img_8775.jpg";
import inauguRibbon from "@/assets/img_8818.jpg";
import inauguUnveil from "@/assets/img_8821.jpg";
import inauguSpeech from "@/assets/img_8822.jpg";
import inauguTeam from "@/assets/img_8828.jpg";

export interface InaugurationMoment {
  id: string;
  image: string;
  title: string;
  tag: string;
  description: string;
}

export const INAUGURATION_MOMENTS: InaugurationMoment[] = [
  {
    id: "ribbon",
    image: inauguRibbon,
    title: "Official Ribbon Cutting Ceremony",
    tag: "Ribbon Cutting",
    description: "Thiru Sandeep Nanduri, IAS, presiding over the ceremonial ribbon cutting to officially inaugurate the Amma Seva Healthcare initiative.",
  },
  {
    id: "lamp",
    image: inauguLamp,
    title: "Auspicious Lamp Lighting Blessing",
    tag: "Lamp Lighting",
    description: "Lighting of the traditional ceremonial lamp by esteemed dignitaries, invoking blessings for Amma Seva's compassionate healthcare mission.",
  },
  {
    id: "unveil",
    image: inauguUnveil,
    title: "Unveiling & Dedication of Healthcare Initiative",
    tag: "Platform Dedication",
    description: "Official dedication and unveiling of the Amma Seva digital platform and 24/7 home clinical care services.",
  },
  {
    id: "speech",
    image: inauguSpeech,
    title: "Keynote Address by Chief Guest",
    tag: "Inaugural Address",
    description: "Thiru Sandeep Nanduri, IAS, delivering the inaugural address on the vital importance of high-standard, dignified home care and patient recovery.",
  },
  {
    id: "team",
    image: inauguTeam,
    title: "Commemorative Moment with Leadership & Care Team",
    tag: "Team Felicitation",
    description: "Commemorative moment with Thiru Sandeep Nanduri, IAS, founders, and healthcare staff marking the historic launch milestone.",
  },
  {
    id: "dignitary",
    image: iasPhoto,
    title: "Thiru Sandeep Nanduri, IAS — Chief Guest",
    tag: "Chief Guest",
    description: "Secretary to Government, Youth Welfare and Sports Development Department, Government of Tamil Nadu, gracing the grand inauguration.",
  },
];

export function InaugurationSection() {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (activePhotoIndex === null) return;
      if (e.key === "Escape") {
        setActivePhotoIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActivePhotoIndex((prev) => 
          prev !== null ? (prev === 0 ? INAUGURATION_MOMENTS.length - 1 : prev - 1) : null
        );
      } else if (e.key === "ArrowRight") {
        setActivePhotoIndex((prev) => 
          prev !== null ? (prev === INAUGURATION_MOMENTS.length - 1 ? 0 : prev + 1) : null
        );
      }
    },
    [activePhotoIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const activePhoto = activePhotoIndex !== null ? INAUGURATION_MOMENTS[activePhotoIndex] : null;

  return (
    <section className="relative overflow-hidden bg-white text-slate-800 py-8 sm:py-10 border-t border-slate-200/80">
      {/* Background Subtle Soft Gradients */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-amber-100/40 via-gold/5 to-transparent blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 bg-primary/5 blur-[90px] rounded-full" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* TOP COMMEMORATIVE HEADER */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-50 via-amber-100/70 to-amber-50 border border-amber-300/80 px-4 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#8f6414] shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#b8860b]" />
            <span>Official State Inauguration &amp; Dedication</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0b183b] tracking-tight leading-tight">
            Grand Inauguration of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b38228] via-[#d4af37] to-[#8c6014]">Amma Seva</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
            Amma Seva Home Healthcare was officially inaugurated and dedicated to public healthcare service by esteemed dignitary <strong className="text-[#0b183b] font-bold">Thiru Sandeep Nanduri, IAS.</strong>
          </p>
        </div>

        {/* MAIN SHOWCASE: DIGNITARY HERO CARD + CEREMONIAL PHOTO GALLERY */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          
          {/* LEFT: DIGNITARY PROFILE & HONORS (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-slate-50/70 p-5 sm:p-7 border border-slate-200/90 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all">
            <div className="space-y-4">
              {/* Photo Frame */}
              <div 
                onClick={() => setActivePhotoIndex(5)} 
                className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-[#d4af37] shadow-md bg-slate-900 aspect-[16/10]"
              >
                <img
                  src={iasPhoto}
                  alt="Thiru Sandeep Nanduri, IAS., Secretary to Government"
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Floating Badge */}
                <div className="absolute top-3 left-3 bg-[#0b183b]/90 border border-gold/60 rounded-full px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-md">
                  <Award className="h-3.5 w-3.5 text-gold" />
                  <span>Chief Guest &amp; Dignitary</span>
                </div>

                {/* Bottom overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-6 flex items-center justify-between text-white text-xs">
                  <span className="flex items-center gap-1 text-amber-200 text-[11px] font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-gold" /> Government of Tamil Nadu
                  </span>
                  <span className="bg-gradient-to-r from-gold via-amber-300 to-gold text-[#0b183b] px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-xs">
                    IAS Officer
                  </span>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#0b183b]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="bg-white text-[#0b183b] px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xl">
                    <ZoomIn className="h-4 w-4 text-gold" /> View Full Portrait
                  </span>
                </div>
              </div>

              {/* Dignitary Name & Official Designation */}
              <div className="space-y-2.5 text-left">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#8f6414]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#8f6414]" />
                  <span>Inaugurated &amp; Dedicated By</span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0b183b] tracking-tight">
                    Thiru Sandeep Nanduri, <span className="text-[#a8781d]">IAS.</span>
                  </h3>
                  <div className="mt-1.5 rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs space-y-0.5">
                    <p className="text-xs font-extrabold text-[#0b183b]">
                      Secretary to Government
                    </p>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Youth Welfare and Sports Development Department, Government of Tamil Nadu
                    </p>
                  </div>
                </div>

                {/* Quote / Commemoration Note */}
                <blockquote className="text-xs text-slate-700 italic border-l-3 border-[#c9a24c] pl-3 py-1 bg-amber-50/60 rounded-r-xl leading-relaxed">
                  &ldquo;A transformative healthcare step ensuring every household receives authentic, hospital-grade nursing, patient rehabilitation, and caregiving at home.&rdquo;
                </blockquote>
              </div>
            </div>

            {/* Commemorative Highlights Pills */}
            <div className="grid grid-cols-2 gap-2.5 pt-4 mt-3 border-t border-slate-200/70 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-slate-200/80 text-slate-700 shadow-2xs">
                <Building2 className="h-4 w-4 text-gold shrink-0" />
                <span className="text-[11px] font-bold text-[#0b183b] leading-tight">State Administrative Dedication</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-slate-200/80 text-slate-700 shadow-2xs">
                <HeartHandshake className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-bold text-[#0b183b] leading-tight">Compassionate Home Healthcare</span>
              </div>
            </div>
          </div>

          {/* RIGHT: INAUGURATION CEREMONY PHOTO GALLERY (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-slate-50/70 p-5 sm:p-7 border border-slate-200/90 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all">
            <div className="space-y-4">
              
              {/* Gallery Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                <div className="text-left">
                  <h3 className="text-base sm:text-lg font-black text-[#0b183b] flex items-center gap-2">
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-gold" />
                    Inauguration Ceremony Moments
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Capturing key memories from the launch event with the Chief Guest &amp; team
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-[#8f6414] bg-amber-100/80 border border-amber-300/80 px-2.5 py-1 rounded-full shrink-0 w-fit">
                  {INAUGURATION_MOMENTS.length} Authentic Photos
                </span>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                {INAUGURATION_MOMENTS.map((moment, idx) => (
                  <div
                    key={moment.id}
                    onClick={() => setActivePhotoIndex(idx)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-900 border border-slate-200 hover:border-gold shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col aspect-[4/3]"
                  >
                    <img
                      src={moment.image}
                      alt={moment.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                    />
                    
                    {/* Top Tag - Clean Pill */}
                    <div className="absolute top-2 left-2 right-2 z-10 pointer-events-none flex items-start">
                      <span className="inline-block max-w-full truncate bg-[#0b183b]/90 backdrop-blur-xs text-amber-200 border border-gold/40 rounded-full px-2 py-0.5 text-[8.5px] font-black uppercase tracking-tight shadow-sm whitespace-nowrap">
                        {moment.tag}
                      </span>
                    </div>

                    {/* Hover Zoom Overlay */}
                    <div className="absolute inset-0 bg-[#0b183b]/65 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-2.5 text-center">
                      <div className="mb-1 rounded-full bg-gold p-1 text-slate-950 shadow-md transform scale-75 group-hover:scale-100 transition-transform">
                        <ZoomIn className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[9.5px] font-bold text-white line-clamp-2 leading-tight">
                        {moment.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Bottom Note */}
            <div className="pt-3.5 mt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-3.5 w-3.5 text-gold" />
                Official Inauguration Archive
              </span>
              <span className="text-[#8f6414] font-bold text-[11px] cursor-pointer hover:underline">
                Click any photo to view in HD →
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      {activePhoto && activePhotoIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setActivePhotoIndex(null)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full cursor-pointer transition-colors z-50 shadow-xl"
            aria-label="Close photo preview"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIndex(
                activePhotoIndex === 0 ? INAUGURATION_MOMENTS.length - 1 : activePhotoIndex - 1
              );
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-gold hover:text-slate-950 text-white p-3 rounded-full cursor-pointer transition-all z-50 shadow-xl"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Next Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActivePhotoIndex(
                activePhotoIndex === INAUGURATION_MOMENTS.length - 1 ? 0 : activePhotoIndex + 1
              );
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-gold hover:text-slate-950 text-white p-3 rounded-full cursor-pointer transition-all z-50 shadow-xl"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Modal Content Box */}
          <div
            className="relative max-h-[92vh] max-w-4xl w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-2 border-gold/60 flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Container */}
            <div className="relative bg-black flex items-center justify-center max-h-[62vh] overflow-hidden">
              <img
                src={activePhoto.image}
                alt={activePhoto.title}
                className="max-h-[62vh] w-full object-contain"
              />
              
              {/* Photo Counter */}
              <div className="absolute top-4 left-4 bg-slate-950/80 border border-gold/50 rounded-full px-3 py-1 text-xs font-bold text-gold backdrop-blur-md">
                Photo {activePhotoIndex + 1} of {INAUGURATION_MOMENTS.length}
              </div>

              {/* Tag Badge */}
              <div className="absolute top-4 right-14 sm:right-4 bg-gradient-to-r from-gold via-amber-300 to-gold text-[#0b183b] rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider shadow-md">
                {activePhoto.tag}
              </div>
            </div>

            {/* Photo Narrative */}
            <div className="p-5 sm:p-6 bg-[#0b183b] text-left space-y-2 border-t border-gold/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  {activePhoto.title}
                </h3>
                <span className="text-xs text-amber-300 font-medium">
                  Inaugurated by Thiru Sandeep Nanduri, IAS.
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {activePhoto.description}
              </p>

              {/* Thumbnails strip */}
              <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1">
                {INAUGURATION_MOMENTS.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative h-12 w-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      idx === activePhotoIndex
                        ? "border-gold scale-105 shadow-md shadow-gold/30"
                        : "border-white/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={m.image} alt={m.title} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
