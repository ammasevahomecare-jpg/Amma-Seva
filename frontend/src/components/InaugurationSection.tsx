import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Award, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ZoomIn, 
  ShieldCheck, 
  Building2, 
  HeartHandshake, 
  Calendar,
  CheckCircle2,
  ExternalLink,
  Camera
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
    <section className="relative overflow-hidden bg-gradient-to-b from-[#07112c] via-[#0b1b44] to-[#081438] text-white border-t-2 border-[#d4af37]/40 shadow-2xl py-14 sm:py-20">
      {/* Background Decorative Gold Ambient Gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#d4af37]/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 bg-primary/40 blur-[100px] rounded-full" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* TOP COMMEMORATIVE HEADER */}
        <div className="text-center max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/60 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-[#ffd700] shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <Award className="h-4 w-4 text-[#ffd700]" />
            <span>Official State Inauguration &amp; Dedication</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Grand Inauguration of <span className="text-[#ffd700] underline decoration-[#d4af37]/60 underline-offset-8">Amma Seva</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl mx-auto">
            Amma Seva Home Healthcare was officially inaugurated and dedicated to community public health service by esteemed dignitary <strong className="text-white font-semibold">Thiru Sandeep Nanduri, IAS.</strong>
          </p>
        </div>

        {/* MAIN SHOWCASE: DIGNITARY HERO CARD + CEREMONIAL PHOTO GALLERY */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: DIGNITARY PROFILE & HONORS (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-6 sm:p-8 border-2 border-[#d4af37]/50 shadow-[0_0_35px_rgba(0,0,0,0.4)] backdrop-blur-md">
            <div>
              {/* Photo Frame */}
              <div 
                onClick={() => setActivePhotoIndex(5)} 
                className="group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-[#ffd700] shadow-[0_0_25px_rgba(212,175,55,0.3)] bg-slate-950 aspect-[16/11]"
              >
                <img
                  src={iasPhoto}
                  alt="Thiru Sandeep Nanduri, IAS., Secretary to Government"
                  className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Floating Badge */}
                <div className="absolute top-3 left-3 bg-[#09132e]/90 border border-[#ffd700]/70 rounded-full px-3 py-1 text-[11px] font-bold text-[#ffd700] uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                  <Award className="h-3.5 w-3.5 text-[#ffd700]" />
                  <span>Chief Guest &amp; Dignitary</span>
                </div>

                {/* Bottom overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-6 flex items-center justify-between text-white text-xs">
                  <span className="flex items-center gap-1 text-amber-200 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#ffd700]" /> Government of Tamil Nadu
                  </span>
                  <span className="bg-[#ffd700] text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                    IAS Officer
                  </span>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#09132e]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="bg-white/95 text-slate-950 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <ZoomIn className="h-4 w-4 text-[#d4af37]" /> View Portrait
                  </span>
                </div>
              </div>

              {/* Dignitary Name & Official Designation */}
              <div className="mt-5 space-y-2 text-left">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-[#ffd700]/15 border border-[#ffd700]/40 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#ffd700]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#ffd700]" />
                  <span>Inaugurated &amp; Dedicated By</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-wide leading-snug">
                  Thiru Sandeep Nanduri, <span className="text-[#ffd700]">IAS.</span>
                </h3>

                <div className="rounded-xl bg-white/[0.05] p-3.5 border border-white/10 space-y-1">
                  <p className="text-sm font-bold text-amber-300">
                    Secretary to Government
                  </p>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    Youth Welfare and Sports Development Department, Government of Tamil Nadu
                  </p>
                </div>

                {/* Quote / Commemoration Note */}
                <blockquote className="italic text-xs text-slate-300 border-l-2 border-[#ffd700] pl-3 py-1 my-3 bg-white/[0.02] rounded-r-lg">
                  &ldquo;A transformative healthcare step ensuring every household receives authentic, hospital-grade nursing, patient rehabilitation, and caregiving at home.&rdquo;
                </blockquote>
              </div>
            </div>

            {/* Commemorative Highlights Pills */}
            <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-2.5 border border-white/10 text-slate-200">
                <Building2 className="h-4 w-4 text-[#ffd700] shrink-0" />
                <span className="text-[11px] font-medium leading-tight">State Administrative Dedication</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-2.5 border border-white/10 text-slate-200">
                <HeartHandshake className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-medium leading-tight">Compassionate Home Healthcare</span>
              </div>
            </div>
          </div>

          {/* RIGHT: INAUGURATION CEREMONY PHOTO GALLERY (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-6 sm:p-8 border border-white/15 shadow-xl backdrop-blur-md">
            <div className="space-y-4">
              
              {/* Gallery Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[#ffd700]" />
                    Inauguration Ceremony Moments
                  </h3>
                  <p className="text-xs text-slate-300">
                    Capturing key memories from the launch event with the Chief Guest &amp; team
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-amber-300 bg-[#ffd700]/15 border border-[#ffd700]/30 px-3 py-1 rounded-full shrink-0 w-fit">
                  {INAUGURATION_MOMENTS.length} Authentic Photos
                </span>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {INAUGURATION_MOMENTS.map((moment, idx) => (
                  <div
                    key={moment.id}
                    onClick={() => setActivePhotoIndex(idx)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl bg-slate-900 border border-white/15 hover:border-[#ffd700] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col aspect-[4/3]"
                  >
                    <img
                      src={moment.image}
                      alt={moment.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Top Tag */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-[#09132e]/90 backdrop-blur-xs text-[#ffd700] border border-[#ffd700]/40 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider shadow-sm">
                        {moment.tag}
                      </span>
                    </div>

                    {/* Hover Zoom Overlay */}
                    <div className="absolute inset-0 bg-[#09132e]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-2.5 text-center">
                      <div className="mb-1 rounded-full bg-[#ffd700] p-1.5 text-slate-950 shadow-md transform scale-75 group-hover:scale-100 transition-transform">
                        <ZoomIn className="h-4 w-4" />
                      </div>
                      <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                        {moment.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Featured Moment Highlight Card */}
              <div className="rounded-2xl bg-[#09132e]/80 border border-[#ffd700]/30 p-4 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] text-amber-300 font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-[#ffd700]" />
                    <span>A Historic Milestone for Home Healthcare in Telangana &amp; Beyond</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Explore all certified care moments, doctor consultations, bedside assistance, and post-operative recovery galleries.
                  </p>
                </div>
                <Link
                  to="/gallery"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#ffd700] hover:bg-[#ffd700]/90 text-slate-950 px-4 py-2 text-xs font-extrabold transition-all shadow-md shrink-0 hover:scale-105 active:scale-95"
                >
                  <span>Explore Gallery</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

            </div>

            {/* Bottom Note */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#ffd700]" />
                Official Inauguration Archive
              </span>
              <span className="text-[#ffd700] font-medium">
                Click any photo to view full resolution
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
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-[#ffd700] hover:text-slate-950 text-white p-3 rounded-full cursor-pointer transition-all z-50 shadow-xl"
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
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-[#ffd700] hover:text-slate-950 text-white p-3 rounded-full cursor-pointer transition-all z-50 shadow-xl"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Modal Content Box */}
          <div
            className="relative max-h-[92vh] max-w-5xl w-full bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-2 border-[#ffd700]/60 flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Container */}
            <div className="relative bg-black flex items-center justify-center max-h-[65vh] overflow-hidden">
              <img
                src={activePhoto.image}
                alt={activePhoto.title}
                className="max-h-[65vh] w-full object-contain"
              />
              
              {/* Photo Counter */}
              <div className="absolute top-4 left-4 bg-slate-950/80 border border-[#ffd700]/50 rounded-full px-3 py-1 text-xs font-bold text-[#ffd700] backdrop-blur-md">
                Photo {activePhotoIndex + 1} of {INAUGURATION_MOMENTS.length}
              </div>

              {/* Tag Badge */}
              <div className="absolute top-4 right-14 sm:right-4 bg-[#ffd700] text-slate-950 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider shadow-md">
                {activePhoto.tag}
              </div>
            </div>

            {/* Photo Narrative */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#07112c] via-[#091535] to-[#07112c] text-left space-y-2 border-t border-[#ffd700]/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                  {activePhoto.title}
                </h3>
                <span className="text-xs text-amber-300 font-medium">
                  Inaugurated by Thiru Sandeep Nanduri, IAS.
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
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
                        ? "border-[#ffd700] scale-105 shadow-md shadow-[#ffd700]/30"
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
