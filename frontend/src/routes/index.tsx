import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Phone, Calendar, ShieldCheck, HeartHandshake, Clock, BadgeCheck, 
  Star, ChevronRight, Sparkles, Car, CheckCircle2, 
  UserCheck, MessageCircle, Activity, ArrowRight, 
  Zap, Stethoscope, Search, Check, HelpCircle, Users, Headphones
} from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { fetchServices } from "@/lib/services";
import { fetchFaqs } from "@/lib/faqs";
import hero from "@/assets/hero-care.jpg";
import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";

const HERO_IMAGES = [hero, motherBaby, nursing, elderly];

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
      image: nursing,
      highlights: ["Surgical Wound Management", "Pain Monitoring", "Physiotherapy Alignment"],
    },
    "patient-care-attendant": {
      category: "Bedside Attendant",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200/80",
      image: elderly,
      highlights: ["Feeding & Diaper Care", "Bed-to-Wheelchair Transfer", "24/7 Attendant Shifts"],
    },
    "bedridden-patient-care": {
      category: "Specialized Care",
      badgeClass: "bg-teal-50 text-teal-700 border-teal-200/80",
      image: elderly,
      highlights: ["Bed Sore Prevention", "Tube Feeding & Sponge Bath", "Full Dignity Care"],
    },
    "icu-home-recovery": {
      category: "Intensive Care",
      badgeClass: "bg-red-50 text-red-700 border-red-200/80",
      image: nursing,
      highlights: ["Tracheostomy & BiPAP Care", "Critical Vitals Logging", "ICU-Trained Nurse"],
    },
    "physiotherapy": {
      category: "Therapy & Rehab",
      badgeClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80",
      image: elderly,
      highlights: ["Stroke & Joint Rehab", "Geriatric Balance Training", "Custom Exercise Regimen"],
    },
    "doctor-consultation": {
      category: "Medical Consult",
      badgeClass: "bg-slate-50 text-slate-700 border-slate-200/80",
      image: nursing,
      highlights: ["Home Doctor Visits", "Comprehensive Diagnosis", "Prescription Review"],
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
    title: "100% Background Verified", 
    desc: "Every caregiver undergoes rigorous 3-tier police, Aadhaar, and medical background clearance." 
  },
  { 
    icon: Stethoscope, 
    title: "Certified Clinical Protocols", 
    desc: "Trained ANM/GNM nurses and skilled attendants working strictly as per treating doctor guidelines." 
  },
  { 
    icon: Clock, 
    title: "Punctual & Rapid Response", 
    desc: "60-minute emergency dispatch with guaranteed staff punctuality and instant standby replacements." 
  },
  { 
    icon: HeartHandshake, 
    title: "Warmth of a Mother's Touch", 
    desc: "Empathetic, dignifying, and loving care that respects your family's personal routines and traditions." 
  },
  { 
    icon: ShieldCheck, 
    title: "Transparent, Zero-Hidden Costs", 
    desc: "Fixed affordable shift rates, clear GST invoices, and secure digital transaction protection." 
  },
  { 
    icon: UserCheck, 
    title: "Dedicated Care Manager", 
    desc: "A personal coordinator on WhatsApp & phone ensuring seamless daily supervision and updates." 
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
    tag: "Elderly Care"
  },
  { 
    name: "Rahul M.", 
    location: "Gachibowli, Hyderabad",
    role: "New Father", 
    quote: "Our newborn caregiver was an absolute blessing. Calm, certified, and incredibly supportive during the postpartum recovery period for my wife and baby.",
    tag: "Mother & Baby Care"
  },
  { 
    name: "Dr. Anitha K.", 
    location: "Jubilee Hills, Hyderabad",
    role: "Consultant Physician", 
    quote: "I regularly recommend Amma Seva for post-surgical care. Their nurses follow sterile clinical protocols and maintain thorough vitals logs with total professionalism.",
    tag: "Post-Surgery Nursing"
  },
];

const HYDERABAD_AREAS = [
  "Banjara Hills", "Jubilee Hills", "Gachibowli", "Madhapur", "Kondapur",
  "Kukatpally", "Miyapur", "Secunderabad", "Begumpet", "Hitec City",
  "Manikonda", "Attapur", "Dilsukhnagar", "LB Nagar", "Kompally"
];

function Home() {
  const { services, faqs } = Route.useLoaderData();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedTag, setSelectedTag] = useState("All");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <SiteLayout>
      {/* ============================================================ */}
      {/* 1. HERO SECTION (CURVED LUXURY ORGANIC LAYOUT)               */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#fbf8f2] via-[#faf6ee] to-[#f5eee3] border-b border-slate-100">
        
        {/* Subtle background ambient glows */}
        <div className="absolute top-0 left-0 -z-10 h-96 w-96 rounded-full bg-gold/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-[#1e2a5a]/5 blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-20 sm:pb-24 lg:pt-14 lg:pb-32">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8 items-center">
            
            {/* Left Column: Text & CTAs */}
            <div className="flex flex-col justify-center text-left lg:col-span-6 space-y-5 z-10">
              
              {/* Crown Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50/90 px-3.5 py-1 text-[11px] font-extrabold text-[#966b1a] tracking-wider uppercase max-w-fit shadow-xs">
                <span>👑</span>
                <span>HYDERABAD&apos;S TRUSTED PROFESSIONAL CARE NETWORK</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-[#142247] font-display tracking-tight leading-[1.12]">
                Professional Care <br />
                with a <span className="text-[#c9a24c] italic font-medium">Mother&apos;s Touch.</span>
              </h1>

              {/* Heart Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-[1.5px] w-12 bg-amber-200" />
                <span className="text-sm text-gold">🤎</span>
                <div className="h-[1.5px] w-24 bg-amber-200" />
              </div>

              {/* Subtitle */}
              <p className="max-w-xl text-sm sm:text-base text-slate-600 leading-relaxed font-sans font-medium">
                Qualified nurses and compassionate caregivers for elderly care, mothers, newborns, and patients — delivered to the comfort of your home.
              </p>

              {/* Dual Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link 
                  to="/contact" 
                  className="px-7 py-3.5 rounded-2xl bg-[#0f1b3d] hover:bg-[#091228] text-white font-bold text-xs sm:text-sm shadow-xl shadow-slate-900/20 hover:scale-102 transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <Calendar className="h-4 w-4 text-gold" />
                  <span>Book a Service</span>
                </Link>

                <a 
                  href={`tel:${contact.PHONE_TEL}`} 
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-white font-bold text-xs sm:text-sm shadow-lg shadow-gold/25 hover:scale-102 transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  <span>Call Now</span>
                </a>
              </div>

            </div>

            {/* Right Column: Hero Visual Container */}
            <div className="relative flex items-center justify-center lg:col-span-6">
              
              {/* Organic Curved Container */}
              <div className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] border-4 border-white/80 shadow-2xl aspect-[4/3] sm:aspect-[16/12] w-full bg-slate-100 group">
                {HERO_IMAGES.map((imgSrc, idx) => (
                  <img
                    key={imgSrc}
                    src={imgSrc}
                    alt="Amma Seva professional home care"
                    width={1600}
                    height={1200}
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out group-hover:scale-104 ${
                      idx === currentImageIndex ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  />
                ))}

                {/* Subtle lighting overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>

            </div>

          </div>
        </div>

        {/* Bottom Curved Wave Transition */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-white pointer-events-none rounded-t-[3rem]" />
      </section>

      {/* ============================================================ */}
      {/* 2. FLOATING 4-METRIC STATS OVERLAY BAR                      */}
      {/* ============================================================ */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-200/60 p-6 sm:p-7 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-left">
          
          {/* Stat 1 */}
          <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:pl-3">
            <div className="h-12 w-12 rounded-full border border-amber-200 bg-amber-50/70 flex items-center justify-center text-gold shrink-0 shadow-xs">
              <Users className="h-5 w-5 text-[#c9a24c]" />
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#1e2a5a] tracking-tight">5,000+</div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">HAPPY FAMILIES</div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:pl-6">
            <div className="h-12 w-12 rounded-full border border-amber-200 bg-amber-50/70 flex items-center justify-center text-gold shrink-0 shadow-xs">
              <BadgeCheck className="h-5 w-5 text-[#c9a24c]" />
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#1e2a5a] tracking-tight">500+</div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">VERIFIED STAFF</div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:pl-6">
            <div className="h-12 w-12 rounded-full border border-amber-200 bg-amber-50/70 flex items-center justify-center text-gold shrink-0 shadow-xs">
              <Headphones className="h-5 w-5 text-[#c9a24c]" />
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#1e2a5a] tracking-tight">24/7</div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">CARE HELPLINE</div>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="flex items-center gap-3.5 pt-4 sm:pt-0 sm:pl-6">
            <div className="h-12 w-12 rounded-full border border-amber-200 bg-amber-50/70 flex items-center justify-center text-gold shrink-0 shadow-xs">
              <ShieldCheck className="h-5 w-5 text-[#c9a24c]" />
            </div>
            <div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#1e2a5a] tracking-tight">100%</div>
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">TRUST &amp; SAFETY</div>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. 4-PILLAR FEATURE ROW (EXPERT, SAFE, COMPASSION, AVAILABLE)*/}
      {/* ============================================================ */}
      <section className="py-10 sm:py-14 bg-white text-left">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-xs">
                👩‍⚕️
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#1e2a5a] text-sm">Expert Caregivers</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Trained and verified professionals you can trust for your loved ones.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-xs">
                🛡️
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#1e2a5a] text-sm">Safe &amp; Reliable</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Background verified staff ensuring safety, hygiene &amp; punctuality.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-xs">
                💖
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#1e2a5a] text-sm">Compassionate Care</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Care with empathy, respect and a mother&apos;s warmth in every service.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-xs">
                ⏰
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#1e2a5a] text-sm">Always Available</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Round-the-clock support whenever you need care, anytime anywhere.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SPOTLIGHT: MTP (MULTI-TASKING PROFESSIONALS) SERVICES    */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-[#0c1427] via-[#101b38] to-[#1e2a5a] text-white relative overflow-hidden text-left">
        {/* Glow circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-gold/10 blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-indigo-500/15 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 border-b border-white/10 pb-8">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-xs text-[#edd392] font-semibold uppercase tracking-wider">
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
              <Link 
                to="/mtp" 
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-[#0d1427] font-extrabold text-xs shadow-lg shadow-gold/20 hover:scale-102 transition-all flex items-center gap-1.5"
              >
                <span>Book MTP Care Task</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                to="/mtp" 
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-1.5"
              >
                <span>Join as MTP Partner</span>
              </Link>
            </div>
          </div>

          {/* 4 MTP Showcase Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md hover:bg-white/[0.09] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-gold/20 flex items-center justify-center text-2xl">
                  🚗
                </div>
                <h3 className="text-lg font-bold font-display text-white">Hospital Escort &amp; Dropping</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Safely escorting elderly &amp; patients to appointments, OPD queues, scans &amp; diagnostic visits.
                </p>
              </div>
              <div className="text-[11px] font-bold text-[#edd392] pt-3 border-t border-white/10 flex items-center justify-between">
                <span>Part-time / Hourly</span>
                <span>From ₹300/task</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md hover:bg-white/[0.09] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl">
                  💊
                </div>
                <h3 className="text-lg font-bold font-display text-white">Medicine &amp; Errand Delivery</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Urgent pharmacy pickups, grocery support, and medical report fetching directly to your door.
                </p>
              </div>
              <div className="text-[11px] font-bold text-[#edd392] pt-3 border-t border-white/10 flex items-center justify-between">
                <span>Rapid Delivery</span>
                <span>From ₹200/task</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md hover:bg-white/[0.09] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-2xl">
                  🚶‍♂️
                </div>
                <h3 className="text-lg font-bold font-display text-white">Senior Walking &amp; Companion</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Morning/evening park strolls, uplifting conversations, mobility assistance &amp; reading support.
                </p>
              </div>
              <div className="text-[11px] font-bold text-[#edd392] pt-3 border-t border-white/10 flex items-center justify-between">
                <span>Morning / Evening</span>
                <span>From ₹350/shift</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md hover:bg-white/[0.09] transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-2xl">
                  🍼
                </div>
                <h3 className="text-lg font-bold font-display text-white">Mother &amp; Baby Helper</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Support for new mothers with nursery setup, laundry, light baby tasks &amp; household assistance.
                </p>
              </div>
              <div className="text-[11px] font-bold text-[#edd392] pt-3 border-t border-white/10 flex items-center justify-between">
                <span>Flexible Hours</span>
                <span>From ₹500/shift</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. COMPREHENSIVE SERVICES CATALOG                           */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-slate-50/60 border-t border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 text-left">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#966b1a]">
                <Activity className="h-3.5 w-3.5 text-gold" /> Personalized Healthcare Solutions
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e2a5a] font-display">
                Tailored Home Healthcare Services
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                From newborn nourishment to compassionate geriatric support — specialized clinical &amp; daily care tailored to your family.
              </p>
            </div>

            <Link 
              to="/services" 
              className="px-5 py-2.5 rounded-xl border border-[#1e2a5a] text-[#1e2a5a] hover:bg-[#1e2a5a] hover:text-white font-bold text-xs transition-all duration-200 flex items-center gap-1.5 shrink-0 max-w-fit"
            >
              <span>Explore All 12+ Services</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
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
                    ? "bg-[#1e2a5a] text-white border-[#1e2a5a] shadow-md shadow-[#1e2a5a]/20 scale-[1.02]"
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
                return (
                  <div
                    key={s.slug}
                    className="group flex flex-col overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-gold/50 transition-all duration-300 hover:-translate-y-1.5 text-left"
                  >
                    {/* Card Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <img 
                        src={details.image} 
                        alt={s.title} 
                        width={1200} 
                        height={900} 
                        loading="lazy" 
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Price Pill */}
                      <div className="absolute top-3.5 right-3.5 bg-[#1e2a5a]/95 backdrop-blur-xs text-white px-3 py-1 rounded-xl text-xs font-bold shadow-md border border-white/20">
                        {s.price || "₹799 / Shift"}
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
                          className="block text-lg font-bold text-[#1e2a5a] hover:text-gold transition-colors font-display"
                        >
                          {s.title}
                        </Link>

                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                          {s.short}
                        </p>

                        {/* Feature Highlights */}
                        <div className="pt-2 space-y-1.5">
                          {details.highlights.map((h, i) => (
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
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#1e2a5a] hover:text-white text-[#1e2a5a] text-xs font-bold transition-all text-center"
                        >
                          Details
                        </Link>
                        <Link
                          to="/contact"
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#1e2a5a] to-[#2b3c7b] hover:from-[#141d3e] hover:to-[#223068] text-white text-xs font-bold transition-all text-center shadow-xs flex items-center justify-center gap-1"
                        >
                          <span>Book</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
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
      {/* 5. 6 PILLARS OF TRUST (WHY AMMA SEVA)                        */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-100 text-left">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-gold/30 bg-gold/10 text-xs font-bold text-[#966b1a] uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" /> The Amma Seva Assurance
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1e2a5a] font-display">
              Why 5,000+ Hyderabad Families Trust Us
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              We understand that inviting someone into your home for healthcare requires unwavering trust, clinical competence, and deep empathy.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((w, index) => (
              <div 
                key={w.title} 
                className="group rounded-3xl border border-slate-200/90 bg-slate-50/50 p-6 shadow-sm hover:shadow-xl hover:border-gold/40 hover:bg-white transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e2a5a] to-[#2a3a78] text-gold shadow-md group-hover:scale-110 transition-transform">
                    <w.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#1e2a5a] font-display mb-2">
                  {w.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {w.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. HOW IT WORKS (SEAMLESS 4-STEP TIMELINE)                  */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-slate-50 to-amber-50/20 border-t border-slate-200/80 text-left">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-bold text-[#1e2a5a] uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-gold" /> Effortless Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e2a5a] font-display">
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
                className="relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="h-10 w-10 rounded-2xl bg-[#1e2a5a] text-gold font-black text-sm flex items-center justify-center shadow-md">
                      {s.n}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Step {idx + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1e2a5a] font-display">
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
      {/* 7. VERIFIED REVIEWS & PATIENT TESTIMONIALS                  */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-100 text-left">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-xs font-bold text-[#966b1a] uppercase tracking-wider">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" /> Real Family Experiences
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e2a5a] font-display">
                Loved by Families Across Hyderabad
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Hear what daughters, sons, doctors, and new mothers say about our home care services.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-[#1e2a5a]">
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
                className="relative rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 shadow-sm hover:shadow-xl hover:bg-white hover:border-gold/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-1 text-gold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {t.tag}
                    </span>
                  </div>
                  <blockquote className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
                    “{t.quote}”
                  </blockquote>
                </div>

                <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-200/70 pt-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e2a5a] to-[#2a3a78] flex items-center justify-center font-bold text-gold text-xs shrink-0 shadow-xs">
                    {t.name[0]}
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-[#1e2a5a] font-display text-sm">{t.name}</div>
                    <div className="text-slate-400 font-medium">{t.role} • <span className="text-slate-500">{t.location}</span></div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. 24/7 EMERGENCY HELP & DIRECT WHATSAPP BANNER             */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-[#1e2a5a] via-[#23336c] to-[#1e2a5a] text-white text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold/15 blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 rounded-3xl bg-white/[0.07] border border-white/15 backdrop-blur-md p-8 sm:p-10 shadow-2xl">
            
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                24/7 Care Coordination Desk Ready
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display leading-tight">
                Need Immediate In-Home Care Assistance in Hyderabad?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Our care coordinators can deploy qualified nurses or patient attendants to your doorstep in as little as 60 minutes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3.5 shrink-0">
              <a
                href={`tel:${contact.PHONE_TEL}`}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#c9a24c] to-[#b38938] hover:from-[#b38938] hover:to-[#966b1a] text-[#0d1427] font-extrabold text-sm shadow-xl shadow-gold/20 hover:scale-102 transition-all flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                <span>Call +91 94945 16543</span>
              </a>

              <a
                href={`https://wa.me/${contact.WHATSAPP}?text=Hello%20Amma%20Seva%2C%20I%20need%20urgent%20home%20healthcare%20support`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-950/20 hover:scale-102 transition-all flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp Care Desk</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 9. FREQUENTLY ASKED QUESTIONS                               */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 bg-slate-50/70 border-t border-slate-200/80 text-left">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-bold text-[#1e2a5a] uppercase tracking-wider">
              <HelpCircle className="h-3.5 w-3.5 text-gold" /> Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e2a5a] font-display">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Everything you need to know about our nurses, caregivers, shift policies, and safety standards.
            </p>
          </div>

          <div className="grid gap-3.5 md:grid-cols-2 items-start">
            {faqs.map((f: any) => (
              <details 
                key={f.id} 
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 hover:border-gold/60 transition-all duration-200 open:border-gold open:shadow-md hover:shadow-xs"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-[#1e2a5a] transition-colors group-open:text-gold select-none outline-none">
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
