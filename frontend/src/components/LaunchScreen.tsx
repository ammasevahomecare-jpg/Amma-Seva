import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import logoAsset from "@/assets/amma-seva-logo.png";
import iasPhoto from "@/assets/sandeep-nanduri-ias.jpg";
import { Sparkles, Award, Volume2, ShieldCheck, HeartHandshake, Building2, Star, CheckCircle2 } from "lucide-react";

// Synthesize an uplifting ceremonial fanfare chime using native browser Web Audio API
function playFanfareChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Notes: C5, E5, G5, C6 (Celebratory Major Chime)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.4);
    });
  } catch (e) {
    console.log("Audio not allowed or supported", e);
  }
}

// Grand celebratory confetti cannon burst
function triggerLaunchConfetti() {
  const count = 250;
  const defaults = {
    origin: { y: 0.65 },
    colors: ["#c9a24c", "#ffd700", "#1e3a8a", "#10b981", "#ffffff", "#f59e0b", "#ec4899"],
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Left & Right Fireworks
  fire(0.25, { spread: 35, startVelocity: 60, origin: { x: 0.15, y: 0.6 } });
  fire(0.25, { spread: 35, startVelocity: 60, origin: { x: 0.85, y: 0.6 } });
  fire(0.2, { spread: 70, origin: { x: 0.5, y: 0.55 } });
  fire(0.35, { spread: 120, decay: 0.91, scalar: 0.9, origin: { x: 0.5, y: 0.5 } });
  fire(0.1, { spread: 140, startVelocity: 30, decay: 0.92, scalar: 1.3, origin: { x: 0.5, y: 0.6 } });

  // Staggered secondary waves for 4 seconds
  const interval = setInterval(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 65,
      origin: { x: 0 },
      colors: ["#c9a24c", "#ffd700", "#ffffff"],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 65,
      origin: { x: 1 },
      colors: ["#c9a24c", "#ffd700", "#ffffff"],
    });
  }, 350);

  setTimeout(() => clearInterval(interval), 3500);
}

// Global in-memory state: always starts false on fresh page load/reload, true once launched
let isGlobalSiteLaunched = false;

export function triggerReplayLaunch() {
  window.dispatchEvent(new CustomEvent("ammaseva_open_launch"));
}

export function LaunchScreen() {
  const [isLaunched, setIsLaunched] = useState(isGlobalSiteLaunched);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPortal, setShowPortal] = useState(!isGlobalSiteLaunched);

  useEffect(() => {
    const handleOpen = () => {
      setShowPortal(true);
      setIsLaunched(false);
    };

    window.addEventListener("ammaseva_open_launch", handleOpen);
    return () => window.removeEventListener("ammaseva_open_launch", handleOpen);
  }, []);

  const handleLaunch = () => {
    setIsAnimating(true);
    playFanfareChime();
    triggerLaunchConfetti();

    isGlobalSiteLaunched = true;

    setTimeout(() => {
      setIsLaunched(true);
    }, 900);

    setTimeout(() => {
      setShowPortal(false);
      setIsAnimating(false);
    }, 1400);
  };

  if (!showPortal) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto lg:overflow-hidden bg-gradient-to-b from-[#030712] via-[#071330] to-[#020617] p-2.5 sm:p-4 text-white transition-all duration-1000 ease-out ${
        isLaunched ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Dynamic ambient background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-[#c9a24c]/20 via-[#1e3a8a]/25 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#c9a24c]/15 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-[#1e40af]/20 blur-[100px] pointer-events-none" />

      {/* Decorative Gold Border Frame - Fitted for 100vh without vertical scrollbar */}
      <div className="relative w-full max-w-4xl lg:max-w-5xl mx-auto rounded-2xl sm:rounded-3xl border-2 border-[#e5c06e]/50 bg-[#09132e]/95 p-3.5 sm:p-5 lg:p-6 shadow-[0_0_80px_rgba(201,162,76,0.3)] backdrop-blur-2xl text-left my-auto">
        
        {/* Luxury Gold Corner Brackets */}
        <div className="absolute -top-2.5 -left-2.5 w-7 h-7 border-t-4 border-l-4 border-[#ffd700] rounded-tl-lg shadow-sm" />
        <div className="absolute -top-2.5 -right-2.5 w-7 h-7 border-t-4 border-r-4 border-[#ffd700] rounded-tr-lg shadow-sm" />
        <div className="absolute -bottom-2.5 -left-2.5 w-7 h-7 border-b-4 border-l-4 border-[#ffd700] rounded-bl-lg shadow-sm" />
        <div className="absolute -bottom-2.5 -right-2.5 w-7 h-7 border-b-4 border-r-4 border-[#ffd700] rounded-br-lg shadow-sm" />

        {/* Top Header Bar: Ceremonial Ribbon & Brand */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-3 border-b border-white/15">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#c9a24c] to-[#ffd700] opacity-75 blur-xs animate-pulse" />
              <img
                src={logoAsset}
                alt="Amma Seva Logo"
                className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-white p-1 border border-[#e5c06e] object-contain shadow-lg"
              />
            </div>
            <div>
              <div className="font-display text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                Amma <span className="text-[#ffd700]">Seva</span>
              </div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-300 font-medium mt-0.5">
                Home Healthcare &amp; Caregiving Network
              </p>
            </div>
          </div>

          {/* Grand Inauguration Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd700]/70 bg-gradient-to-r from-[#ffd700]/25 via-[#c9a24c]/20 to-[#ffd700]/25 px-3.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <Sparkles className="h-3.5 w-3.5 text-[#ffd700] animate-spin" style={{ animationDuration: "6s" }} />
            <span>Grand Digital Portal Launch</span>
            <Sparkles className="h-3.5 w-3.5 text-[#ffd700] animate-spin" style={{ animationDuration: "6s" }} />
          </div>
        </div>

        {/* Main Content Area: Large Dignitary Photo + Official Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-6 items-center py-3 sm:py-4">
          
          {/* LEFT: BIG SIZE HD DIGNITARY IMAGE */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="relative w-full max-w-md lg:max-w-none group">
              
              {/* Radiant outer glow behind the photo */}
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-[#ffd700] via-[#c9a24c] to-[#1e3a8a] opacity-45 blur-lg transition-all duration-500 group-hover:opacity-70" />
              
              {/* Photo Container */}
              <div className="relative w-full aspect-[16/10] max-h-[220px] sm:max-h-[250px] lg:max-h-[265px] rounded-xl sm:rounded-2xl border-2 sm:border-3 border-[#ffd700] shadow-[0_0_30px_rgba(201,162,76,0.35)] overflow-hidden bg-slate-950">
                <img
                  src={iasPhoto}
                  alt="Thiru Sandeep Nanduri, IAS., Secretary to Government"
                  className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />
                
                {/* Official Gold Badge Ribbon in the Corner */}
                <div className="absolute top-2.5 left-2.5 bg-[#09132e]/90 border border-[#ffd700]/60 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-[#ffd700] uppercase tracking-wider backdrop-blur-md flex items-center gap-1 shadow-md">
                  <Award className="h-3 w-3 text-[#ffd700]" />
                  <span>Chief Guest &amp; Inaugurator</span>
                </div>

                {/* Bottom Overlay Gradient for photo depth */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[10px] font-medium">
                  <span className="flex items-center gap-1 text-amber-200">
                    <CheckCircle2 className="h-3 w-3 text-[#ffd700]" /> Government of Tamil Nadu
                  </span>
                  <span className="bg-[#ffd700]/20 border border-[#ffd700]/40 px-1.5 py-0.5 rounded text-[9px] text-[#ffd700] font-bold">
                    IAS Dignitary
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: DIGNITARY DETAILS & CEREMONIAL ACTION */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-2.5 text-center lg:text-left">
            
            {/* Honor Tag & Dignitary Name */}
            <div>
              <div className="inline-flex items-center gap-1 rounded bg-[#ffd700]/20 border border-[#ffd700]/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ffd700] shadow-xs mb-1">
                <Star className="h-3 w-3 fill-[#ffd700] text-[#ffd700]" />
                <span>Officially Inaugurated &amp; Dedicated By</span>
              </div>

              {/* Dignitary Name */}
              <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-wide leading-tight">
                Thiru Sandeep Nanduri, <span className="text-[#ffd700] font-sans">IAS.</span>
              </h2>

              {/* Dignitary Designation & Department */}
              <div className="mt-1.5 space-y-0.5 rounded-lg bg-white/5 p-2 sm:p-2.5 border border-white/10 backdrop-blur-md">
                <p className="text-sm sm:text-base font-bold text-amber-300 leading-tight">
                  Secretary to Government
                </p>
                <p className="text-[11px] sm:text-xs text-slate-200 font-medium leading-snug">
                  Youth Welfare and Sports Development Department
                </p>
              </div>
            </div>

            {/* Dignitary Honor Highlights */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="flex items-center gap-1.5 rounded-lg bg-white/5 p-1.5 sm:p-2 border border-white/10 text-[11px] text-slate-200">
                <Building2 className="h-3.5 w-3.5 text-[#ffd700] shrink-0" />
                <span>State Administration</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-white/5 p-1.5 sm:p-2 border border-white/10 text-[11px] text-slate-200">
                <HeartHandshake className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Community Healthcare</span>
              </div>
            </div>

            {/* GRAND CEREMONIAL LAUNCH BUTTON */}
            <div className="pt-1 space-y-1.5">
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isAnimating}
                className="group relative w-full inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f3e5ab] to-[#c9a24c] px-4 sm:px-6 py-2.5 sm:py-3.5 text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-950 shadow-[0_0_35px_rgba(255,215,0,0.5)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_55px_rgba(255,215,0,0.8)] active:scale-95 cursor-pointer disabled:opacity-80 border border-white/50"
              >
                {/* Dynamic sweeping shimmer shine */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-slate-950 animate-bounce" />
                <span className="drop-shadow-xs font-bold">✨ INAUGURATE &amp; LAUNCH WEBSITE ✨</span>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-slate-950 animate-bounce" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-slate-300 font-medium">
                <Volume2 className="h-3.5 w-3.5 text-[#ffd700] animate-pulse" />
                <span>Tap to officially declare the Amma Seva portal live</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer info & Direct access link */}
        <div className="pt-2.5 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] text-slate-400">
          <span>Amma Seva Digital Home Healthcare • Official State Inauguration</span>
          <button
            type="button"
            onClick={() => {
              isGlobalSiteLaunched = true;
              setShowPortal(false);
              setIsLaunched(true);
            }}
            className="text-amber-300 hover:text-white transition-colors underline underline-offset-4 cursor-pointer font-medium"
          >
            Direct to Website &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}

// Commemorative Top Ribbon to stay on top of the website
export function CommemorativeLaunchBanner({ onReplayLaunch }: { onReplayLaunch?: () => void }) {
  const handleReplay = () => {
    if (onReplayLaunch) {
      onReplayLaunch();
    } else {
      triggerReplayLaunch();
    }
  };

  return (
    <div className="relative z-30 bg-gradient-to-r from-[#060c1d] via-[#101e44] to-[#060c1d] text-white border-b border-[#ffd700]/50 px-3 py-2 text-xs shadow-md">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left px-2">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ffd700]/20 border border-[#ffd700]/60 px-2 py-0.5 text-[10px] font-bold text-[#ffd700] uppercase tracking-wider shadow-xs">
            ★ Official Launch
          </span>
          <span className="text-slate-200 text-xs sm:text-sm">
            Inaugurated &amp; Dedicated by <strong className="text-[#ffd700] font-semibold">Thiru Sandeep Nanduri, IAS.</strong>, Secretary to Government, Youth Welfare and Sports Development Dept.
          </span>
        </div>

        <button
          type="button"
          onClick={handleReplay}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#ffd700]/50 bg-[#ffd700]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#ffd700] hover:bg-[#ffd700] hover:text-slate-950 transition-all shrink-0 cursor-pointer shadow-sm"
        >
          <Sparkles className="h-3 w-3" /> Replay Launch Ceremony
        </button>
      </div>
    </div>
  );
}
