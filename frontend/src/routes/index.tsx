import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Phone, Calendar, ShieldCheck, HeartHandshake, Clock, BadgeCheck, 
  Star, ChevronRight, Sparkles, Car, CheckCircle2, 
  UserCheck, MessageCircle, Activity, ArrowRight, 
  Zap, Stethoscope, Check, HelpCircle, Users, Headphones,
  Shield, Heart
} from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { fetchServices } from "@/lib/services";
import { fetchFaqs } from "@/lib/faqs";
import hero from "@/assets/hero-care.jpg";
import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";
import physiotherapy from "@/assets/service-physiotherapy.jpg";
import icuRecovery from "@/assets/service-icu-recovery.jpg";
import bedsideAttendant from "@/assets/service-bedside-attendant.jpg";
import doctor from "@/assets/service-doctor.jpg";
import mtp from "@/assets/service-mtp.jpg";
import cartoonHealthcareCare from "@/assets/cartoon-healthcare-care.png";

const HERO_IMAGES = [hero, motherBaby, physiotherapy, elderly, icuRecovery, bedsideAttendant, doctor];

export const Route = createFileRoute("/")({
  loader: async () => {
    const services = await fetchServices();
    const faqs = await fetchFaqs();
    return { services, faqs };
  },
  staleTime: 30000,
  head: () => ({
    meta: [
      { title: "Amma Seva — Premier Home Healthcare & Caregiving in Hyderabad" },
      { name: "description", content: "Qualified nurses, certified elderly care attendants, mother & baby care, and on-demand MTP hospital escorts delivered to your home in Hyderabad." },
      { property: "og:title", content: "Amma Seva — Premier Home Healthcare & Caregiving" },
      { property: "og:description", content: "Professional care with a mother's touch. Book verified home nurses and caregivers across Hyderabad." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
  }),
  component: Home,
});

function getServiceDetails(slug: string) {
  const details: Record<string, { category: string; badgeClass: string; image: string; highlights: string[] }> = {
    "elderly-care": {
      category: "Elderly Care",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      image: elderly,
      highlights: ["Daily Mobility Assistance", "Medication Management", "Companionship & Hygiene"],
    },
    "mother-baby-care": {
      category: "Maternal & Newborn",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
      image: motherBaby,
      highlights: ["Postnatal Mother Care", "Newborn Bathing & Feeding", "Night-Shift Sleep Support"],
    },
    "pregnancy-care": {
      category: "Prenatal Care",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
      image: motherBaby,
      highlights: ["Diet & Nutrition Assistance", "Vital Signs Monitoring", "Doctor Visit Support"],
    },
    "newborn-baby-care": {
      category: "Pediatric Care",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80",
      image: motherBaby,
      highlights: ["Infant Hygiene & Massage", "Sleep Scheduling", "24/7 Nursery Supervision"],
    },
    "home-nursing": {
      category: "Clinical Nursing",
      badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
      image: nursing,
      highlights: ["IV / IM Injections", "Wound Dressing & Catheter", "Post-Op Clinical Checks"],
    },
    "injection-services": {
      category: "Clinical Nursing",
      badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
      image: nursing,
      highlights: ["Safe Sterile Administration", "On-Demand Doorstep Visit", "Doctor Prescription Adherence"],
    },
    "post-surgery-care": {
      category: "Recovery & Rehab",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
      image: icuRecovery,
      highlights: ["Surgical Wound Management", "Pain Monitoring", "Physiotherapy Alignment"],
    },
    "patient-care-attendant": {
      category: "Bedside Attendant",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80",
      image: bedsideAttendant,
      highlights: ["Feeding & Diaper Care", "Bed-to-Wheelchair Transfer", "24/7 Attendant Shifts"],
    },
    "bedridden-patient-care": {
      category: "Specialized Care",
      badgeClass: "bg-teal-50 text-teal-700 border-teal-200/80",
      image: bedsideAttendant,
      highlights: ["Bed Sore Prevention", "Tube Feeding & Sponge Bath", "Full Dignity Care"],
    },
    "icu-home-recovery": {
      category: "Intensive Care",
      badgeClass: "bg-red-50 text-red-700 border-red-200/80",
      image: icuRecovery,
      highlights: ["Tracheostomy & BiPAP Care", "Critical Vitals Logging", "ICU-Trained Nurse"],
    },
    "physiotherapy": {
      category: "Therapy & Rehab",
      badgeClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80",
      image: physiotherapy,
      highlights: ["Stroke & Joint Rehab", "Geriatric Balance Training", "Custom Exercise Regimen"],
    },
    "doctor-consultation": {
      category: "Medical Consult",
      badgeClass: "bg-slate-50 text-slate-700 border-slate-200/80",
      image: doctor,
      highlights: ["Home Doctor Visits", "Comprehensive Diagnosis", "Prescription Review"],
    },
    "mtp": {
      category: "Medical Transport",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      image: mtp,
      highlights: ["Wheelchair & Stretcher Transit", "Paramedic Escort Onboard", "Zero Surge Pricing"],
    },
  };
  return details[slug] || {
    category: "Specialized Care",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200/80",
    image: nursing,
    highlights: ["Verified Care Professional", "Personalized Home Plan", "24/7 Family Support"],
  };
}

const WHY = [
  { 
    icon: BadgeCheck, 
    title: "100% Background Cleared", 
    desc: "Every caregiver undergoes rigorous 3-tier police verification, Aadhaar authentication, and medical screening." 
  },
  { 
    icon: Stethoscope, 
    title: "Certified Clinical Protocols", 
    desc: "Trained ANM/GNM nurses and skilled attendants working strictly as per treating doctor guidelines." 
  },
  { 
    icon: Clock, 
    title: "Punctual 60-Min Response", 
    desc: "Rapid emergency dispatch across Hyderabad with guaranteed staff punctuality and instant standby replacements." 
  },
  { 
    icon: HeartHandshake, 
    title: "Warmth of a Mother's Touch", 
    desc: "Empathetic, dignifying, and loving care that respects your family's personal routines and traditions." 
  },
  { 
    icon: ShieldCheck, 
    title: "Transparent & Zero Hidden Costs", 
    desc: "Fixed affordable shift rates, clear GST invoices, and secure digital transaction protection." 
  },
  { 
    icon: UserCheck, 
    title: "Dedicated Care Manager", 
    desc: "A personal coordinator on WhatsApp & phone ensuring seamless daily supervision and patient vitals tracking." 
  },
];

const STEPS = [
  { 
    n: "01", 
    t: "Tell Us Your Requirement", 
    d: "Select the service, shift timings (12h/24h), and your location in Hyderabad via website or call." 
  },
  { 
    n: "02", 
    t: "Instant Matching & Confirmation", 
    d: "We assign a verified, skilled caregiver or nurse tailored specifically to the patient's medical needs." 
  },
  { 
    n: "03", 
    t: "Doorstep Care Commences", 
    d: "Our certified professional arrives punctually at your home with hygiene gear and begins dedicated care." 
  },
  { 
    n: "04", 
    t: "Continuous Quality Supervision", 
    d: "Enjoy daily health tracking, easy shift rescheduling, and 24/7 assistance from our care helpline." 
  },
];

const TESTIMONIALS = [
  { 
    name: "Priya R.", 
    location: "Banjara Hills, Hyderabad",
    role: "Daughter of Elderly Patient", 
    quote: "The caregiver treated my mother with the utmost patience and affection. Punctual, gentle, and highly skilled — Amma Seva gave our entire family true peace of mind.",
    tag: "Elderly Care",
    rating: 5
  },
  { 
    name: "Rahul M.", 
    location: "Gachibowli, Hyderabad",
    role: "New Father", 
    quote: "Our newborn caregiver was an absolute blessing. Calm, certified, and incredibly supportive during the postpartum recovery period for my wife and baby.",
    tag: "Mother & Baby Care",
    rating: 5
  },
  { 
    name: "Dr. Anitha K.", 
    location: "Jubilee Hills, Hyderabad",
    role: "Consultant Physician", 
    quote: "I regularly recommend Amma Seva for post-surgical care. Their nurses follow sterile clinical protocols and maintain thorough vitals logs with total professionalism.",
    tag: "Post-Surgery Nursing",
    rating: 5
  },
];

function getBookingUrl(serviceSlug?: string) {
  const dest = serviceSlug ? `/dashboard?service=${serviceSlug}` : "/dashboard";
  if (typeof window !== "undefined" && localStorage.getItem("ammaseva_user_token")) {
    return dest;
  }
  return `/login?redirect=${encodeURIComponent(dest)}`;
}

import { HealthcareSilhouetteBorder } from "@/components/HealthcareSilhouetteBorder";

function Home() {
  const { services, faqs } = Route.useLoaderData();
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [selectedTag, setSelectedTag] = useState("All");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <SiteLayout showInauguration={true}>
      {/* ============================================================ */}
      {/* 1. HERO SECTION (NOBLE CENTERED HEALTHCARE WITH BG CAROUSEL) */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-[#faf8f5] pt-3 sm:pt-4 pb-0 border-b border-slate-100">
        
        {/* Background Image Carousel Layer with Light Opacity & Cross-Fade */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {HERO_IMAGES.map((imgSrc, idx) => (
            <img 
              key={imgSrc}
              src={imgSrc} 
              alt="Amma Seva Healthcare Services" 
              className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 ease-in-out ${
                idx === currentBgIndex ? "opacity-35 scale-100" : "opacity-0 scale-105"
              }`}
            />
          ))}
          {/* Subtle light gradient wash to ensure crystal-clear text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#faf8f5]/65 via-[#faf8f5]/45 to-[#faf8f5]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#faf8f5]/60 via-transparent to-[#faf8f5]/60" />
        </div>

        {/* Subtle background ambient glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-0 h-[400px] w-[1000px] rounded-full bg-gradient-to-b from-amber-200/30 via-gold/10 to-transparent blur-[140px] pointer-events-none" />
        <div className="absolute top-10 left-8 z-0 h-64 w-64 rounded-full bg-[#0b183b]/5 blur-[100px] pointer-events-none" />
        <div className="absolute top-10 right-8 z-0 h-64 w-64 rounded-full bg-gold/15 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-1 sm:pt-2 pb-6 sm:pb-8 text-center flex flex-col items-center relative z-10">
          
          {/* Premium Pill Badge (Centered) */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 px-4 sm:px-5 py-1.5 text-[11px] sm:text-xs font-extrabold text-[#8f6414] tracking-wider uppercase shadow-xs mb-3.5 sm:mb-4 hover:scale-102 transition-transform">
            <Sparkles className="h-3.5 w-3.5 text-[#b8860b] animate-pulse" />
            <span>HYDERABAD&apos;S #1 TRUSTED HOME HEALTHCARE &amp; CAREGIVING NETWORK</span>
          </div>

          {/* Main Headline (Single Line on Desktop with rich contrast) */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[46px] xl:text-[52px] font-extrabold text-[#0b183b] font-display tracking-tight leading-tight max-w-5xl text-center whitespace-normal lg:whitespace-nowrap">
            Professional Bedside Healthcare, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b38228] via-[#d4af37] to-[#8c6014] font-bold">with a Mother&apos;s Touch.</span>
          </h1>

          {/* Subtitle (Refined, Warm & Crystal-Clear) */}
          <p className="mt-3.5 max-w-3xl lg:max-w-4xl mx-auto text-xs sm:text-sm md:text-base text-slate-700 leading-relaxed font-sans font-medium text-center">
            Doctor-supervised nurses, compassionate elderly caregivers, and verified hospital escorts — <br className="hidden sm:inline" />delivering trusted, hospital-standard clinical care in the comfort of your home.
          </p>

          {/* Verified Trust Badges (Centered) */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-semibold text-slate-700 pt-4">
            <span className="inline-flex items-center gap-1.5 bg-white/95 px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> 100% Police &amp; Aadhaar Verified
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/95 px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-2xs">
              <Clock className="h-4 w-4 text-gold" /> 60-Min Quick Hyderabad Dispatch
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/95 px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-2xs">
              <Star className="h-4 w-4 fill-gold text-gold" /> 4.9 / 5.0 (5,000+ Families Assisted)
            </span>
          </div>

          {/* Dual Action Buttons (Centered) */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 pt-5">
            <a 
              href={getBookingUrl()} 
              className="px-7 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[#0b183b] via-[#14234f] to-[#1e2a5a] hover:from-[#07112b] hover:to-[#121c3d] text-white font-bold text-xs sm:text-sm shadow-xl shadow-[#0b183b]/25 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-gold" />
              <span>Book a Verified Caregiver</span>
            </a>

            <a 
              href={`tel:${contact.PHONE_TEL}`} 
              className="px-7 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[#c9a24c] via-[#dfba63] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-white font-bold text-xs sm:text-sm shadow-lg shadow-gold/25 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <Phone className="h-4 w-4" />
              <span>24/7 Care Helpline</span>
            </a>
          </div>

        </div>

        {/* ============================================================ */}
        {/* PANORAMIC SILHOUETTE HEALTHCARE BORDER ACROSS HERO BOTTOM    */}
        {/* ============================================================ */}
        <div className="w-full relative mt-2 overflow-hidden">
          <HealthcareSilhouetteBorder
            fillColor="#0b183b"
            accentColor="#c9a24c"
            className="w-full h-24 sm:h-32 md:h-40 lg:h-48 text-[#0b183b]"
          />
        </div>

      </section>

      {/* ============================================================ */}
      {/* 2. FLOATING 4-METRIC STATS OVERLAY BAR                      */}
      {/* ============================================================ */}
      <div className="relative z-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 mt-4 sm:mt-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/5 p-6 sm:p-7 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-left">
          
          {/* Stat 1 */}
          <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-3">
            <div className="h-13 w-13 rounded-2xl bg-gradient-to-br from-[#0b183b] to-[#1e2a5a] flex items-center justify-center text-gold shrink-0 shadow-md">
              <Users className="h-6 w-6 text-gold" />
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#0b183b] tracking-tight">
                <AnimatedCounter target={5000} suffix="+" duration={1800} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">HAPPY FAMILIES</div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-6">
            <div className="h-13 w-13 rounded-2xl bg-gradient-to-br from-[#0b183b] to-[#1e2a5a] flex items-center justify-center text-gold shrink-0 shadow-md">
              <BadgeCheck className="h-6 w-6 text-gold" />
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#0b183b] tracking-tight">
                <AnimatedCounter target={500} suffix="+" duration={1600} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">VERIFIED STAFF</div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-6">
            <div className="h-13 w-13 rounded-2xl bg-gradient-to-br from-[#0b183b] to-[#1e2a5a] flex items-center justify-center text-gold shrink-0 shadow-md">
              <Headphones className="h-6 w-6 text-gold" />
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#0b183b] tracking-tight">
                <AnimatedCounter target={24} suffix="/7" formatCommas={false} duration={1200} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">CARE HELPLINE</div>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-6">
            <div className="h-13 w-13 rounded-2xl bg-gradient-to-br from-[#0b183b] to-[#1e2a5a] flex items-center justify-center text-gold shrink-0 shadow-md">
              <ShieldCheck className="h-6 w-6 text-gold" />
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#0b183b] tracking-tight">
                <AnimatedCounter target={100} suffix="%" formatCommas={false} duration={1400} />
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">POLICE VERIFIED</div>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. 4-PILLAR FEATURE ROW (EXPERT, SAFE, COMPASSION, RAPID)   */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 bg-white text-left">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3 hover:border-gold/50 hover:bg-white hover:shadow-lg transition-all duration-300">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/80 border border-indigo-200/60 flex items-center justify-center text-indigo-700 shadow-2xs group-hover:scale-105 transition-transform">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#0b183b] text-sm font-display">Hospital-Trained Staff</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Qualified ANM/GNM nurses and trained attendants for clinical &amp; daily care.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3 hover:border-gold/50 hover:bg-white hover:shadow-lg transition-all duration-300">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-105 transition-transform">
                <Shield className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#0b183b] text-sm font-display">100% Background Cleared</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Rigorous 3-tier police, Aadhaar, and medical background verification.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3 hover:border-gold/50 hover:bg-white hover:shadow-lg transition-all duration-300">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/80 border border-rose-200/60 flex items-center justify-center text-rose-700 shadow-2xs group-hover:scale-105 transition-transform">
                <Heart className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#0b183b] text-sm font-display">Compassionate Care</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dignifying, empathetic assistance with a warm mother&apos;s touch in every shift.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3 hover:border-gold/50 hover:bg-white hover:shadow-lg transition-all duration-300">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-700 shadow-2xs group-hover:scale-105 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#0b183b] text-sm font-display">Punctual &amp; On-Time</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Guaranteed punctuality with 24/7 standby replacement coverage across Hyderabad.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. COMPREHENSIVE SERVICES CATALOG                           */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-slate-50/60 border-t border-slate-200/80">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 text-left">
            <div className="max-w-xl lg:max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#966b1a]">
                <Activity className="h-3.5 w-3.5 text-gold" /> Personalized Healthcare Solutions
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b183b] font-display">
                Tailored Home Healthcare Services
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                From newborn nourishment to compassionate geriatric support — specialized clinical &amp; daily care tailored to your family.
              </p>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 self-start md:self-center">
              <img 
                src={cartoonHealthcareCare} 
                alt="Amma Seva Compassionate Doctors & Nurses" 
                className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto object-contain select-none drop-shadow-sm hover:scale-105 transition-transform duration-300"
              />
              <Link 
                to="/services" 
                className="px-5 py-2.5 rounded-xl border border-[#0b183b] text-[#0b183b] hover:bg-[#0b183b] hover:text-white font-bold text-xs transition-all duration-200 flex items-center gap-1.5 shrink-0 max-w-fit shadow-sm"
              >
                <span>Explore All 12+ Services</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Interactive Category Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-8 text-left">
            {[
              { label: "✨ All Services", value: "All" },
              { label: "👴 Elderly & Senior Care", value: "Elderly" },
              { label: "🍼 Maternal & Newborn", value: "Maternal" },
              { label: "🩺 Clinical Nursing & ICU", value: "Clinical" },
            ].map((tag) => (
              <button
                key={tag.value}
                onClick={() => setSelectedTag(tag.value)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer ${
                  selectedTag === tag.value
                    ? "bg-[#0b183b] text-white border-[#0b183b] shadow-md shadow-[#0b183b]/20 scale-[1.02]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-gold hover:text-gold"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(() => {
              const elderlySlugs = ["elderly-care", "patient-care-attendant", "bedridden-patient-care", "physiotherapy"];
              const maternalSlugs = ["mother-baby-care", "pregnancy-care", "newborn-baby-care"];
              const clinicalSlugs = ["home-nursing", "injection-services", "post-surgery-care", "icu-home-recovery", "doctor-consultation"];

              const filteredServices = services.filter((s: any) => {
                if (selectedTag === "All") return true;
                if (selectedTag === "Elderly") return elderlySlugs.includes(s.slug);
                if (selectedTag === "Maternal") return maternalSlugs.includes(s.slug);
                if (selectedTag === "Clinical") return clinicalSlugs.includes(s.slug);
                return true;
              });

              return filteredServices.slice(0, 8).map((s: any) => {
                const details = getServiceDetails(s.slug);
                const cardImage = s.image || details.image;
                const cardPrice = s.price || s.pricing || "Starting ₹799 / shift";
                const cardHighlights = (s.highlights && s.highlights.length > 0) ? s.highlights.slice(0, 3) : details.highlights;

                return (
                  <div
                    key={s.slug}
                    className="group flex flex-col overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-[0_22px_45px_-12px_rgba(201,162,76,0.25)] hover:border-gold/70 transition-all duration-500 ease-out hover:-translate-y-2 text-left relative"
                  >
                    {/* Card Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <img 
                        src={cardImage} 
                        alt={s.title} 
                        width={1200} 
                        height={900} 
                        loading="lazy" 
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Price Pill */}
                      <div className="absolute top-3.5 right-3.5 bg-[#0b183b]/90 backdrop-blur-xs text-white px-3 py-1 rounded-xl text-xs font-bold shadow-md border border-white/20 group-hover:border-gold/50 transition-colors">
                        {cardPrice}
                      </div>

                      {/* Verified Badge */}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-emerald-800 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" /> 100% Verified
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex flex-1 flex-col p-5 justify-between space-y-4">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${details.badgeClass}`}>
                          {s.category || details.category}
                        </span>

                        <Link
                          to="/services/$slug"
                          params={{ slug: s.slug }}
                          className="block text-lg font-bold text-[#0b183b] group-hover:text-gold transition-colors font-display"
                        >
                          {s.title}
                        </Link>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {s.short}
                        </p>

                        {/* Feature Highlights */}
                        <div className="pt-2 space-y-1.5">
                          {cardHighlights.map((h: string, i: number) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <Link
                          to="/services/$slug"
                          params={{ slug: s.slug }}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#0b183b] hover:text-white text-[#0b183b] text-xs font-bold transition-all text-center"
                        >
                          Details
                        </Link>
                        <a
                          href={getBookingUrl(s.slug)}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#0b183b] to-[#1e2a5a] hover:from-[#07112b] hover:to-[#141f42] text-white text-xs font-bold transition-all text-center shadow-xs hover:shadow-md flex items-center justify-center gap-1 group/btn cursor-pointer"
                        >
                          <span>Book</span>
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. SPOTLIGHT: MTP (MULTI-TASKING PROFESSIONALS) SERVICES    */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-gradient-to-br from-[#060b17] via-[#0f1a38] to-[#1e2a5a] text-white relative overflow-hidden text-left">
        {/* Glow circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-gold/15 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-indigo-500/15 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 border-b border-white/10 pb-8">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-gold/30 bg-gold/10 text-xs text-[#edd392] font-semibold uppercase tracking-wider">
                <Car className="h-3.5 w-3.5 text-gold" /> Introducing MTP Services
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display leading-tight tracking-tight">
                Multi-Tasking Professionals <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#edd392] via-[#c9a24c] to-[#f5e6be]">
                  For Flexible On-Demand Support
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Need someone to escort a parent safely to the hospital, pick up urgent prescriptions, or assist a mother? Our verified MTP Task Force is on standby.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a 
                href={getBookingUrl("mtp")} 
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-[#081023] font-extrabold text-xs shadow-lg shadow-gold/20 hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Book MTP Care Task</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link 
                to="/mtp" 
                className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Join as MTP Partner</span>
              </Link>
            </div>
          </div>

          {/* 4 MTP Showcase Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-white/[0.06] border border-white/15 backdrop-blur-md hover:bg-white/[0.12] hover:border-gold/70 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.5),0_0_25px_rgba(201,162,76,0.3)] flex flex-col justify-between space-y-4 relative group">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                  <Car className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold font-display text-white group-hover:text-[#edd392] transition-colors">Hospital Escort &amp; Dropping</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Safely escorting elderly &amp; patients to doctor appointments, OPD queues, scans &amp; diagnostic visits.
                </p>
              </div>
              <div className="text-[11px] font-bold text-[#edd392] pt-3 border-t border-white/10 flex items-center justify-between">
                <span>Part-time / Hourly</span>
                <span>From ₹300 / task</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.06] border border-white/15 backdrop-blur-md hover:bg-white/[0.12] hover:border-gold/70 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.5),0_0_25px_rgba(201,162,76,0.3)] flex flex-col justify-between space-y-4 relative group">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-emerald-400/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold font-display text-white group-hover:text-[#edd392] transition-colors">Medicine &amp; Errand Delivery</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Urgent pharmacy pickups, grocery support, and medical report fetching directly to your door.
                </p>
              </div>
              <div className="text-[11px] font-bold text-[#edd392] pt-3 border-t border-white/10 flex items-center justify-between">
                <span>Rapid Delivery</span>
                <span>From ₹200 / task</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.06] border border-white/15 backdrop-blur-md hover:bg-white/[0.12] hover:border-gold/70 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.5),0_0_25px_rgba(201,162,76,0.3)] flex flex-col justify-between space-y-4 relative group">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-500/10 border border-indigo-400/40 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold font-display text-white group-hover:text-[#edd392] transition-colors">Senior Walking &amp; Companion</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Morning/evening park strolls, uplifting conversations, mobility assistance &amp; reading support.
                </p>
              </div>
              <div className="text-[11px] font-bold text-[#edd392] pt-3 border-t border-white/10 flex items-center justify-between">
                <span>Morning / Evening</span>
                <span>From ₹350 / shift</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/[0.06] border border-white/15 backdrop-blur-md hover:bg-white/[0.12] hover:border-gold/70 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.5),0_0_25px_rgba(201,162,76,0.3)] flex flex-col justify-between space-y-4 relative group">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500/30 to-rose-500/10 border border-rose-400/40 flex items-center justify-center text-rose-300 group-hover:scale-110 transition-transform">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold font-display text-white group-hover:text-[#edd392] transition-colors">Mother &amp; Baby Helper</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Support for new mothers with nursery setup, laundry, light baby tasks &amp; household assistance.
                </p>
              </div>
              <div className="text-[11px] font-bold text-[#edd392] pt-3 border-t border-white/10 flex items-center justify-between">
                <span>Flexible Hours</span>
                <span>From ₹500 / shift</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. 6 PILLARS OF TRUST (WHY AMMA SEVA - AUTO SCROLLING)       */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-white via-amber-50/10 to-slate-50/60 border-t border-slate-100 text-left overflow-hidden relative">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12 mb-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-gold/30 bg-gold/10 text-xs font-bold text-[#966b1a] uppercase tracking-wider shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" /> The Amma Seva Assurance
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b183b] font-display tracking-tight">
              Why 5,000+ Hyderabad Families Trust Us
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium max-w-2xl mx-auto">
              We understand that inviting someone into your home for healthcare requires unwavering trust, clinical competence, and deep empathy.
            </p>
          </div>

        </div>

        {/* Auto-scrolling Ribbon Wrapper with Edge Fade Mask */}
        <div className="relative w-full overflow-hidden group py-4">
          {/* Left Gradient Fade */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          {/* Right Gradient Fade */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

          {/* Marquee Track (Duplicated for Seamless Infinite Loop) */}
          <div className="flex animate-marquee gap-6 items-stretch">
            {[...WHY, ...WHY].map((w, index) => {
              const originalIndex = index % WHY.length;
              return (
                <div 
                  key={`${w.title}-${index}`} 
                  className="w-[300px] sm:w-[380px] lg:w-[410px] shrink-0 rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-7 shadow-md shadow-slate-900/4 hover:shadow-[0_20px_40px_-10px_rgba(201,162,76,0.28)] hover:border-gold hover:bg-white transition-all duration-300 hover:-translate-y-2 relative flex flex-col justify-between group/card cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0b183b] to-[#1e2a5a] text-gold shadow-md group-hover/card:scale-110 group-hover/card:shadow-gold/20 transition-all">
                        <w.icon className="h-6 w-6 text-gold" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 group-hover/card:border-gold/50 group-hover/card:text-[#8c6b16] group-hover/card:bg-gold/10 transition-colors">
                        0{originalIndex + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0b183b] font-display mb-2 group-hover/card:text-gold transition-colors">
                      {w.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed font-medium">
                      {w.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Verified Standard
                    </span>
                    <span className="text-gold font-mono">AMMA-SEVA</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Tip Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ping" />
          <span className="text-slate-500 text-[11px] font-medium">✨ Smooth Auto-Scroll • Hover any card to pause &amp; read</span>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. HOW IT WORKS (SEAMLESS 4-STEP TIMELINE)                  */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-slate-50 to-amber-50/20 border-t border-slate-200/80 text-left">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-bold text-[#0b183b] uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-gold" /> Effortless Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b183b] font-display">
              Doorstep Care in 4 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              From inquiry to caregiver arrival at your doorstep — swift, transparent, and hassle-free.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
            {STEPS.map((s, idx) => (
              <div 
                key={s.n} 
                className="relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-[0_20px_40px_-10px_rgba(201,162,76,0.2)] hover:border-gold/60 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="h-10 w-10 rounded-2xl bg-[#0b183b] text-gold font-black text-sm flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      {s.n}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Step {idx + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0b183b] font-display group-hover:text-gold transition-colors">
                    {s.t}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {s.d}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Guaranteed Support
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. VERIFIED REVIEWS & PATIENT TESTIMONIALS                  */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-100 text-left">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-xs font-bold text-[#966b1a] uppercase tracking-wider">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" /> Real Family Experiences
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b183b] font-display">
                Loved by Families Across Hyderabad
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Hear what daughters, sons, doctors, and new mothers say about our home care services.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-[#0b183b]">
              <div className="flex text-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <span>4.9 / 5 Average Rating</span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure 
                key={t.name} 
                className="relative rounded-3xl border border-slate-200/90 bg-slate-50/50 p-6 shadow-sm hover:shadow-[0_20px_40px_-10px_rgba(201,162,76,0.2)] hover:bg-white hover:border-gold/60 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1 text-gold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 group-hover:border-gold/40 transition-colors">
                      {t.tag}
                    </span>
                  </div>
                  <blockquote className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                    “{t.quote}”
                  </blockquote>
                </div>

                <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-200/70 pt-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0b183b] to-[#1e2a5a] flex items-center justify-center font-bold text-gold text-xs shrink-0 shadow-xs group-hover:scale-110 transition-transform">
                    {t.name[0]}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-[#0b183b] font-display text-sm group-hover:text-gold transition-colors">{t.name}</div>
                    <div className="text-slate-400 font-medium">{t.role} • <span className="text-slate-500">{t.location}</span></div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. 24/7 EMERGENCY HELP & SEVA PARCHMENT PAPER BANNER         */}
      {/* ============================================================ */}
      <section className="py-10 sm:py-14 seva-paper-bg text-slate-800 text-left relative overflow-hidden border-t border-b border-[#c9a24c]/25">
        
        {/* Sacred Seva Lotus / Mandala Decorative SVG Watermark 1 (Top Right) */}
        <div className="absolute -top-12 -right-12 w-64 h-64 text-[#c9a24c]/10 pointer-events-none transform rotate-12">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <circle cx="100" cy="100" r="80" strokeDasharray="4 4" />
            <circle cx="100" cy="100" r="60" />
            <circle cx="100" cy="100" r="40" />
            <path d="M100 20 C110 50, 150 60, 180 100 C150 140, 110 150, 100 180 C90 150, 50 140, 20 100 C50 60, 90 50, 100 20 Z" />
            <path d="M100 40 C108 65, 135 72, 160 100 C135 128, 108 135, 100 160 C92 135, 65 128, 40 100 C65 72, 92 65, 100 40 Z" />
            <circle cx="100" cy="100" r="15" fill="currentColor" fillOpacity="0.15" />
          </svg>
        </div>

        {/* Sacred Seva Lotus / Mandala Decorative SVG Watermark 2 (Bottom Left) */}
        <div className="absolute -bottom-16 -left-16 w-72 h-72 text-[#c9a24c]/8 pointer-events-none transform -rotate-45">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
            <circle cx="100" cy="100" r="85" strokeDasharray="6 3" />
            <circle cx="100" cy="100" r="65" />
            <circle cx="100" cy="100" r="35" />
            <path d="M100 15 C115 50, 150 65, 185 100 C150 135, 115 150, 100 185 C85 150, 50 135, 15 100 C50 65, 85 50, 100 15 Z" />
            <circle cx="100" cy="100" r="12" fill="currentColor" fillOpacity="0.2" />
          </svg>
        </div>

        {/* Ambient Subtle Golden Light Orbs */}
        <div className="absolute top-10 left-1/3 w-80 h-80 rounded-full bg-amber-400/10 blur-[110px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-gold/12 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          
          {/* Main Seva Parchment Paper Card (Compact & Refined) */}
          <div className="relative rounded-3xl seva-paper-card border-2 border-[#c9a24c]/45 p-6 sm:p-8 lg:p-9 overflow-hidden ring-1 ring-[#c9a24c]/20">
            
            {/* Traditional Gold Filigree Corner Accents */}
            <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-[#c9a24c]/70 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-[#c9a24c]/70 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-[#c9a24c]/70 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-[#c9a24c]/70 rounded-br-lg pointer-events-none" />

            {/* Ambient Gold Header Line */}
            <div className="absolute top-0 left-16 right-16 h-[2px] bg-gradient-to-r from-transparent via-[#c9a24c]/70 to-transparent" />

            {/* Decorative Helping Hands Watermark in Card Background */}
            <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-52 h-52 text-[#c9a24c]/8 pointer-events-none">
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
                <path d="M25 65 C20 60, 18 50, 22 42 C25 36, 32 38, 35 44 C38 50, 42 58, 48 64" />
                <path d="M75 65 C80 60, 82 50, 78 42 C75 36, 68 38, 65 44 C62 50, 58 58, 52 64" />
                <path d="M50 48 C44 38, 36 42, 42 52 L50 62 L58 52 C64 42, 56 38, 50 48 Z" fill="currentColor" fillOpacity="0.12" />
                <line x1="50" y1="28" x2="50" y2="34" strokeDasharray="1 1" />
                <line x1="38" y1="32" x2="42" y2="37" strokeDasharray="1 1" />
                <line x1="62" y1="32" x2="58" y2="37" strokeDasharray="1 1" />
              </svg>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              
              {/* Left Column: Heading, Badges, Value Guarantees */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Live Radar Pill + Helping Hands Sticker Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e2a5a] text-white text-[11px] font-extrabold border border-[#c9a24c]/40 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    <span className="text-[#edd392] tracking-wider uppercase font-bold">
                      24/7 Clinical Dispatch
                    </span>
                  </div>

                  {/* Helping Hands Sticker Seal */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-50 border border-dashed border-[#c9a24c]/70 text-[#8c6b16] text-[10px] font-black uppercase tracking-wide shadow-2xs transform -rotate-1 hover:rotate-0 transition-transform cursor-pointer">
                    <span>🤲</span>
                    <span>Seva Helping Hands</span>
                  </div>
                </div>

                {/* Headline */}
                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display leading-tight tracking-tight text-[#0b183b]">
                    Need In-Home Care Assistance in Hyderabad?
                  </h2>
                  <p className="text-sm sm:text-base font-display font-bold text-[#966b1a]">
                    Verified Nurses, Attendants &amp; ICU Care at Your Doorstep in 60 Minutes.
                  </p>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed max-w-xl font-medium">
                  Emergency bedside elderly care, nursing, and recovery support dispatched across Hyderabad with motherly compassion.
                </p>

                {/* 3 Value Guarantee Cards (Compact Parchment Seal Tiles) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 border border-[#c9a24c]/30 shadow-2xs space-y-0.5 hover:border-[#c9a24c] hover:shadow-xs transition-all group/tile">
                    <div className="flex items-center gap-1.5 text-[#966b1a]">
                      <Zap className="h-3.5 w-3.5 text-[#c9a24c] group-hover/tile:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-[#0b183b]">&lt; 60 Min Arrival</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium">Fast doorstep dispatch</p>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 border border-[#c9a24c]/30 shadow-2xs space-y-0.5 hover:border-[#c9a24c] hover:shadow-xs transition-all group/tile">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 group-hover/tile:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-[#0b183b]">100% Verified</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium">Police &amp; medically cleared</p>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/90 border border-[#c9a24c]/30 shadow-2xs space-y-0.5 hover:border-[#c9a24c] hover:shadow-xs transition-all group/tile">
                    <div className="flex items-center gap-1.5 text-indigo-700">
                      <Headphones className="h-3.5 w-3.5 text-indigo-600 group-hover/tile:scale-110 transition-transform" />
                      <span className="text-[11px] font-bold text-[#0b183b]">24/7 Live Desk</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-medium">Zero waiting time</p>
                  </div>
                </div>

              </div>

              {/* Right Column: Compact Action Hub (Royal Navy & Gold Seal Box) */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-gradient-to-b from-[#0b183b] via-[#11214a] to-[#1e2a5a] border-2 border-[#c9a24c]/50 p-4 sm:p-6 text-white shadow-xl space-y-3 sm:space-y-3.5 text-left relative group">
                  
                  {/* Floating Helping Hands Stamp */}
                  <div className="absolute -top-3 -right-2 sm:-right-3 bg-gradient-to-r from-[#c9a24c] via-[#f7e4b2] to-[#b38938] text-[#081023] text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md border border-white/80 flex items-center gap-1 transform rotate-2 group-hover:rotate-0 transition-transform z-20 whitespace-nowrap">
                    <span>🤝</span>
                    <span>Helping Hands Care</span>
                  </div>

                  {/* Glowing ambient ring */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold/15 rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between border-b border-white/15 pb-2.5 sm:pb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#edd392] font-bold block">
                        Direct Care Hotline
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white font-display">Speak to Coordinator</h3>
                    </div>
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow-xs shrink-0">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-bounce" />
                    </div>
                  </div>

                  {/* Primary CTA: Phone Button */}
                  <a
                    href={`tel:${contact.PHONE_TEL}`}
                    className="w-full py-2.5 sm:py-3 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-[#c9a24c] via-[#dfba63] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-[#081023] font-black text-xs shadow-md hover:shadow-lg hover:scale-101 transition-all flex items-center justify-between group/btn cursor-pointer"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-[#081023]/15 flex items-center justify-center shrink-0">
                        <Phone className="h-3.5 w-3.5 text-[#081023]" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-[9px] font-extrabold uppercase tracking-widest text-[#081023]/70">Tap to Call 24/7</div>
                        <div className="text-xs font-black tracking-wide whitespace-nowrap">+91 94945 16543</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#081023] transition-transform group-hover/btn:translate-x-1 shrink-0" />
                  </a>

                  {/* Secondary CTA: WhatsApp Button */}
                  <a
                    href={`https://wa.me/${contact.WHATSAPP}?text=Hello%20Amma%20Seva%2C%20I%20need%20urgent%20home%20healthcare%20support`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-3.5 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 text-white font-bold text-[11px] shadow-md hover:scale-101 transition-all flex items-center justify-between group/wa cursor-pointer"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <MessageCircle className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="text-[9px] uppercase tracking-wider text-emerald-200">Instant Consultation</div>
                        <div className="text-[11px] font-bold whitespace-nowrap">Chat on WhatsApp</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-white transition-transform group-hover/wa:translate-x-1 shrink-0" />
                  </a>

                  {/* Social Proof & Trust Footer */}
                  <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-slate-300">
                    <div className="flex items-center gap-1 text-[#edd392] font-bold whitespace-nowrap">
                      <Star className="h-3 w-3 fill-[#edd392] text-[#edd392] shrink-0" />
                      <span>4.9 / 5 Rating</span>
                    </div>
                    <span className="text-slate-300 font-medium whitespace-nowrap">5,000+ Shifts</span>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 10. FREQUENTLY ASKED QUESTIONS                              */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-slate-50/70 border-t border-slate-200/80 text-left">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 xl:px-12">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-bold text-[#0b183b] uppercase tracking-wider">
              <HelpCircle className="h-3.5 w-3.5 text-gold" /> Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b183b] font-display">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Everything you need to know about our nurses, caregivers, shift policies, and safety standards.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 items-start">
            {faqs.map((f: any) => (
              <details 
                key={f.id} 
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 hover:border-gold/70 transition-all duration-300 open:border-gold/80 open:shadow-[0_10px_25px_-5px_rgba(201,162,76,0.15)] hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-[#0b183b] transition-colors group-open:text-gold select-none outline-none">
                  <span className="pr-4">{f.question}</span>
                  <ChevronRight className="h-4 w-4 text-gold/80 transition-transform group-open:rotate-90 shrink-0" />
                </summary>
                <div className="mt-3 text-xs text-slate-600 leading-relaxed pl-3.5 border-l-2 border-gold/40">
                  {f.answer}
                </div>
              </details>
            ))}
          </div>

        </div>
      </section>

    </SiteLayout>
  );
}

