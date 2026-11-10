import React from "react";
import { ShieldCheck, Award, Sparkles, Building2, CheckCircle2 } from "lucide-react";
import founderPhoto from "@/assets/founder-sai-kiran.jpg";

interface FounderSectionProps {
  className?: string;
}

export const FounderSection: React.FC<FounderSectionProps> = ({ className = "" }) => {
  return (
    <section
      aria-label="Amma Seva Founder & Leadership"
      className={`bg-background py-8 sm:py-12 lg:py-14 transition-all ${className}`}
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
        
        {/* Main Prestige Card with Dark Gradient & Gold Accents */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#070e1f] via-[#101c3d] to-[#0a1228] text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-[#c9a24c]/40">
          
          {/* Background Decorative Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 bg-[#c9a24c]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 sm:w-96 h-72 sm:h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 lg:gap-12">
            
            {/* Founder Portrait Frame */}
            <div className="relative shrink-0 group">
              {/* Gold Ambient Ring */}
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#c9a24c] via-amber-300 to-[#c9a24c] opacity-80 blur-sm group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative h-48 w-44 sm:h-56 sm:w-52 lg:h-64 lg:w-56 rounded-3xl overflow-hidden border-2 border-[#c9a24c]/90 shadow-2xl bg-[#0b1329]">
                <img
                  src={founderPhoto}
                  alt="SRI SAI KIRAN VEMULAMADA — Founder and Managing Director, Amma Seva"
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  width={240}
                  height={280}
                />
              </div>

              {/* Verified Founder Badge */}
              <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-[#c9a24c] via-amber-400 to-[#c9a24c] text-slate-950 px-4 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-xl flex items-center gap-1.5 border border-white/50">
                <ShieldCheck className="h-4 w-4 text-slate-950" />
                <span>Founder &amp; MD</span>
              </div>
            </div>

            {/* Founder Details & Leadership Message */}
            <div className="flex-1 text-center md:text-left space-y-3.5 mt-4 md:mt-0">
              
              {/* Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#c9a24c]/15 border border-[#c9a24c]/30 text-[#c9a24c] text-xs font-bold tracking-wider uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Leadership &amp; Vision</span>
              </div>

              {/* Founder Name & Designation */}
              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-white uppercase drop-shadow-sm">
                  SRI SAI KIRAN VEMULAMADA
                </h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-base sm:text-lg font-bold text-amber-400">
                    Founder and Managing Director
                  </span>
                  <span className="text-slate-400 hidden sm:inline">•</span>
                  <span className="text-base sm:text-lg font-extrabold text-white">
                    Amma Seva
                  </span>
                </div>
              </div>

              {/* Mission Statement */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl pt-1">
                “Our mission at <strong className="text-white font-semibold">Amma Seva</strong> is to ensure that every patient, recovering individual, and elderly parent receives hospital-grade clinical healthcare and compassionate companionship in the comfort and dignity of their own home — delivered with the sincere warmth of a mother’s touch.”
              </p>

              {/* Trust Badges */}
              <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] sm:text-xs font-semibold text-slate-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>24/7 Verified Care Network</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] sm:text-xs font-semibold text-slate-200">
                  <Building2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Hyderabad &amp; Telangana</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-[11px] sm:text-xs font-semibold text-slate-200">
                  <Award className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span>Inaugurated by Thiru Sandeep Nanduri, IAS</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
