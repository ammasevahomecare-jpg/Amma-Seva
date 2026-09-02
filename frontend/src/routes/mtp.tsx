import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, contact } from "@/components/SiteLayout";
import {
  Car,
  Clock,
  ShieldCheck,
  Award,
  HeartHandshake,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Sparkles,
  Users,
  ChevronRight,
  Send,
  HelpCircle,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/mtp")({
  head: () => ({
    meta: [
      { title: "MTP (Multi Tasking Professionals) — Join Amma Seva Hyderabad" },
      {
        name: "description",
        content:
          "Register as a Multi Tasking Professional (MTP) with Amma Seva. Flexible part-time gigs: patient hospital dropping, elderly walking, medicine pickup, and home support.",
      },
      { property: "og:title", content: "MTP (Multi Tasking Professionals) — Amma Seva" },
      {
        property: "og:description",
        content: "Flexible, part-time and on-demand care gigs in Hyderabad. Weekly payouts, choose your hours.",
      },
      { property: "og:url", content: "/mtp" },
    ],
    links: [{ rel: "canonical", href: "/mtp" }],
  }),
  component: MTPPage,
});

const HYDERABAD_ZONES = [
  "Banjara Hills & Jubilee Hills",
  "Gachibowli & Hitec City",
  "Madhapur & Kondapur",
  "Kukatpally & Miyapur",
  "Secunderabad & Begumpet",
  "Ameerpet & SR Nagar",
  "Mehdipatnam & Tolichowki",
  "LB Nagar & Dilsukhnagar",
  "Uppal & Habsiguda",
  "Other Localities across Hyderabad"
];

export interface MTPTaskItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  shiftType?: string;
  earningEstimate?: string;
  active?: boolean;
}

function MTPPage() {
  // Dynamic Tasks strictly fetched from Database
  const [mtpTasks, setMtpTasks] = useState<MTPTaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [age, setAge] = useState("");
  const [locality, setLocality] = useState(HYDERABAD_ZONES[0]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [availability, setAvailability] = useState("Part-time (Flexible)");
  const [vehicle, setVehicle] = useState("Two-wheeler (Bike / Scooty)");
  const [drivingLicense, setDrivingLicense] = useState("Yes");
  const [experience, setExperience] = useState("Fresher / Ready to Learn");
  const [skillsSummary, setSkillsSummary] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  // Fetch dynamic MTP Tasks from DB
  useEffect(() => {
    setIsLoadingTasks(true);
    fetch("/api/mtp/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const activeTasks = data.filter((t) => t.active !== false);
          setMtpTasks(activeTasks);
          if (activeTasks.length > 0 && selectedRoles.length === 0) {
            setSelectedRoles([`${activeTasks[0].icon || "🚗"} ${activeTasks[0].title}`]);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch MTP tasks from database:", err))
      .finally(() => setIsLoadingTasks(false));
  }, []);

  const toggleRole = (roleLabel: string) => {
    if (selectedRoles.includes(roleLabel)) {
      if (selectedRoles.length === 1) {
        toast.error("Please select at least one task or role.");
        return;
      }
      setSelectedRoles(selectedRoles.filter((r) => r !== roleLabel));
    } else {
      setSelectedRoles([...selectedRoles, roleLabel]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Please select at least one preferred task or role.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim(),
        gender,
        age: age.trim(),
        city: "Hyderabad",
        locality,
        roles: selectedRoles,
        availability,
        vehicle,
        drivingLicense,
        experience,
        skillsSummary: skillsSummary.trim(),
        aadhaar: aadhaar.trim(),
        emergencyContact: emergencyContact.trim(),
      };

      const res = await fetch("/api/mtp/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("MTP Registration successful! Welcome to the Amma Seva Network.");
        setSubmittedData(data.data || payload);
      } else {
        toast.error(data.error || "Failed to submit registration. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fbfbfe] via-cream/30 to-white pb-12 pt-10 border-b border-border/40">
        <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-gold/10 blur-3xl opacity-60" />
        <div className="absolute top-20 left-10 -z-10 h-80 w-80 rounded-full bg-primary/5 blur-3xl opacity-60" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-bold text-gold tracking-wider uppercase mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Hyderabad&apos;s Multi Tasking Professionals (MTP)
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight text-primary sm:text-5xl lg:text-6xl font-display">
                Earn with Purpose. <br />
                <span className="text-gold italic font-medium">Work with Total Flexibility.</span>
              </h1>
              <p className="max-w-3xl text-base sm:text-lg text-slate-600 leading-relaxed">
                Join Amma Seva as an <strong>MTP (Multi Tasking Professional)</strong>. Anyone can register to provide on-demand support — from <strong>patient hospital dropping &amp; escort</strong> to <strong>elderly walking, medicine errands, and flexible homecare shifts</strong> across Hyderabad.
              </p>

              {/* Badges row */}
              <div className="pt-2 flex flex-wrap gap-2.5 sm:gap-3 text-xs font-semibold text-primary">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                  <Clock className="h-4 w-4 text-gold" /> Choose Your Own Hours
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                  <Award className="h-4 w-4 text-gold" /> Weekly Direct Payouts
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                  <MapPin className="h-4 w-4 text-gold" /> Hyperlocal Neighborhood Gigs
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
                  <ShieldCheck className="h-4 w-4 text-gold" /> Official Amma Seva Digital ID
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/90 backdrop-blur-md rounded-2xl border border-gold/30 p-6 shadow-xl space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold font-bold">
                  <Car className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gold">Fast Track Onboarding</div>
                  <div className="text-lg font-bold text-primary font-display">Instant Registration</div>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Fill the form below in 2 minutes. Our Hyderabad Care Coordination desk will verify and activate your profile within 4–12 hours.
              </p>
              <a
                href="#register-form"
                className="w-full inline-flex items-center justify-center gap-2 btn-gold py-2.5 text-sm font-bold shadow-md"
              >
                Register as MTP Now <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What is an MTP & Tasks Grid */}
      <section className="py-12 bg-white border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-left">
          <div className="max-w-3xl mb-10">
            <h2 className="gold-rule text-3xl font-extrabold text-primary sm:text-4xl font-display">
              What Does an MTP Do?
            </h2>
            <p className="mt-2 text-base text-slate-600">
              MTPs are versatile, compassionate problem-solvers who assist local families with everyday care, logistics, and mobility tasks:
            </p>
          </div>

          {isLoadingTasks ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-slate-100 border border-slate-200" />
              ))}
            </div>
          ) : mtpTasks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
              No active MTP task categories available currently.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mtpTasks.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-slate-200/80 bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl"
                >
                  <div className="text-2xl mb-3">{item.icon || "🚗"}</div>
                  <h3 className="text-lg font-bold text-primary font-display mb-2 group-hover:text-gold transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-gold">
                    <span>{item.shiftType || "Part-time / On-Demand"}</span>
                    <span>{item.earningEstimate || "₹300 - ₹1,500 / task"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why Join Benefits */}
      <section className="py-12 bg-cream/35 border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-left">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase tracking-wider">
                Why Join Amma Seva
              </span>
              <h2 className="text-3xl font-extrabold text-primary sm:text-4xl font-display leading-tight">
                Designed for Part-Timers, Students &amp; Professionals
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Whether you have 2 spare hours every morning, want to do weekend runs, or seek daily shift opportunities — Amma Seva connects you with verified families right in your neighborhood.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-sm text-primary block">No Rigid Medical Degree Required</strong>
                    <span className="text-xs text-slate-500">Basic empathy, punctual attitude, and valid ID are all you need to start.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-sm text-primary block">Direct UPI / Bank Payouts</strong>
                    <span className="text-xs text-slate-500">Fast, transparent payments credited every week with zero hidden deductions.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <strong className="text-sm text-primary block">Verified Safe Patient Families</strong>
                    <span className="text-xs text-slate-500">All client bookings are pre-screened and logged on our central system.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works Steps */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-primary font-display mb-6">
                How Onboarding Works (4 Simple Steps)
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    01
                  </div>
                  <h4 className="font-bold text-primary text-sm">Register Online</h4>
                  <p className="text-xs text-slate-500">Fill your contact, preferred localities and task interests below.</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    02
                  </div>
                  <h4 className="font-bold text-primary text-sm">Quick Phone Check</h4>
                  <p className="text-xs text-slate-500">Our coordinator verifies your ID and gives a 10-min safety briefing.</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    03
                  </div>
                  <h4 className="font-bold text-primary text-sm">Receive Gig Alerts</h4>
                  <p className="text-xs text-slate-500">Get nearby task requests via WhatsApp or phone call. Accept what fits.</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    04
                  </div>
                  <h4 className="font-bold text-primary text-sm">Complete &amp; Get Paid</h4>
                  <p className="text-xs text-slate-500">Deliver quality care and receive direct payouts to your account.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form Section */}
      <section id="register-form" className="py-12 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {submittedData ? (
            <div className="rounded-3xl border-2 border-emerald-400 bg-emerald-50/50 p-8 sm:p-12 text-center space-y-6 shadow-xl animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Registration Successful
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-primary font-display">
                  Welcome aboard, {submittedData.name}!
                </h3>
                <p className="text-sm text-slate-600 max-w-lg mx-auto">
                  Your application to join Amma Seva as a <strong>Multi Tasking Professional (MTP)</strong> has been recorded under Reference ID <strong>#{submittedData.id || "MTP-PENDING"}</strong>.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-200 p-5 max-w-md mx-auto text-left text-xs space-y-2 text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Applicant Name:</span>
                  <span className="font-bold text-primary">{submittedData.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Mobile Number:</span>
                  <span className="font-bold text-primary">{submittedData.phone}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Preferred Zone:</span>
                  <span className="font-bold text-primary">{submittedData.locality}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-400">Availability:</span>
                  <span className="font-bold text-primary">{submittedData.availability}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-600">Pending Coordinator Review</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <a
                  href={`https://wa.me/${contact.WHATSAPP}?text=Hi%20Amma%20Seva%20Team,%20I%20just%20registered%20as%20an%20MTP%20(${submittedData.name}%20-%20${submittedData.phone}).%20Please%20verify%20my%20profile.`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-600 transition-all"
                >
                  <MessageCircle className="h-4 w-4" /> Message Coordinator on WhatsApp
                </a>
                <button
                  onClick={() => {
                    setSubmittedData(null);
                    setName("");
                    setPhone("");
                    setEmail("");
                    setSkillsSummary("");
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Register Another Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-border/80 bg-background p-6 sm:p-10 shadow-xl text-left space-y-8">
              <div className="border-b border-slate-100 pb-6">
                <div className="flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-wider mb-1">
                  <Briefcase className="h-4 w-4" /> Official Registration Form
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-primary font-display">
                  MTP Registration — Amma Seva Network
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Fill in your accurate details below. No application fees. Safe, transparent and flexible.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Basic Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gold" /> 1. Personal &amp; Contact Details
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar / Anitha Reddy"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="10-digit mobile number"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                        <input
                          type="number"
                          min={18}
                          max={70}
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="e.g. 25"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Location & Zone */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gold" /> 2. Hyderabad Locality &amp; Transport
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Primary Preferred Locality / Zone
                      </label>
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                      >
                        {HYDERABAD_ZONES.map((zone) => (
                          <option key={zone} value={zone}>
                            {zone}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Vehicle Available for Commute / Dropping
                      </label>
                      <select
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                      >
                        <option value="Two-wheeler (Bike / Scooty)">Two-wheeler (Bike / Scooty)</option>
                        <option value="Four-wheeler (Car)">Four-wheeler (Car)</option>
                        <option value="No Vehicle (Public Transport / Walking)">No Vehicle (Public Transport / Walking)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Do you have a Valid Driving License?
                      </label>
                      <select
                        value={drivingLicense}
                        onChange={(e) => setDrivingLicense(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                      >
                        <option value="Yes">Yes, Active License</option>
                        <option value="No">No Driving License</option>
                        <option value="Learning">Learning / Applied</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Availability Preference
                      </label>
                      <select
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                      >
                        <option value="Part-time (Morning Shifts)">Part-time (Morning Shifts)</option>
                        <option value="Part-time (Evening Shifts)">Part-time (Evening Shifts)</option>
                        <option value="Weekends Only (Sat/Sun)">Weekends Only (Sat/Sun)</option>
                        <option value="Part-time (Flexible)">Part-time (Flexible / On-Demand)</option>
                        <option value="Full-time (12h Shifts)">Full-time (12h Shifts)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Preferred Tasks / Roles */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gold" /> 3. Select Tasks You Can Do
                    </h3>
                    <span className="text-[11px] text-slate-400 font-semibold">Select all that apply</span>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {mtpTasks.map((t) => {
                      const roleLabel = `${t.icon || "🚗"} ${t.title}`;
                      const isChecked = selectedRoles.includes(roleLabel) || selectedRoles.includes(t.title);
                      return (
                        <div
                          key={t.id}
                          onClick={() => toggleRole(roleLabel)}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isChecked
                              ? "border-gold bg-gold/10 text-primary font-medium shadow-xs"
                              : "border-slate-200 bg-slate-50/40 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRole(roleLabel)}
                            className="mt-1 h-4 w-4 rounded text-gold focus:ring-gold border-slate-300 pointer-events-none"
                          />
                          <div className="text-xs leading-relaxed">
                            <span className="font-bold text-primary block">{roleLabel}</span>
                            <span className="text-[11px] text-slate-500">{t.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Experience & Background Details */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gold" /> 4. Background &amp; Emergency Info
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Prior Experience
                      </label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                      >
                        <option value="Fresher / Ready to Learn">Fresher / Ready to Learn</option>
                        <option value="1-2 Years Experience">1-2 Years Experience</option>
                        <option value="3-5 Years Experience">3-5 Years Experience</option>
                        <option value="5+ Years Healthcare/Driver/Helper">5+ Years Healthcare / Driver / Helper</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Aadhaar Number (For Fast-Track Verification)
                      </label>
                      <input
                        type="text"
                        maxLength={14}
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value)}
                        placeholder="12-digit Aadhaar Number"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Emergency Contact (Name &amp; Phone)
                      </label>
                      <input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="e.g. Brother: Suresh (98480xxxxx)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Languages Spoken &amp; Short Bio (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={skillsSummary}
                        onChange={(e) => setSkillsSummary(e.target.value)}
                        placeholder="e.g. Fluent in Telugu and Hindi. Familiar with Banjara Hills & Gachibowli routes. Gentle and patient with elderly."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-primary focus:border-gold focus:bg-white focus:outline-none transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-400 max-w-sm">
                    🔒 By registering, you agree to undergo basic KYC background check and adhere to Amma Seva care code of conduct.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-gold px-8 py-3.5 text-sm font-bold shadow-lg shadow-gold/25 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>Processing Registration...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Submit MTP Registration
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* MTP Frequently Asked Questions */}
      <section className="py-12 bg-cream/35 border-t border-border/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-left">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary font-display">
              Frequently Asked Questions about MTP
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Everything you need to know about joining and working as a Multi Tasking Professional.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "What does an MTP (Multi Tasking Professional) do?",
                a: "MTPs handle flexible local assistance tasks including: safely accompanying seniors or patients for hospital doctor visits & dropping, picking up urgent medicines/prescriptions, assisting elders with morning walks, and providing part-time mother/newborn home support."
              },
              {
                q: "Who is eligible to join as an MTP?",
                a: "Anyone aged 18+ with a valid Aadhaar card, clean background, and compassionate mindset. Students, gig workers, part-timers, drivers, attendants, and home helpers can all register."
              },
              {
                q: "Do I need a bike or car to join?",
                a: "Having a two-wheeler (bike/scooty) is a great plus for patient dropping and medicine delivery, but is not mandatory. You can also accept walking and home-attendant shifts in your immediate locality."
              },
              {
                q: "How and when do I get paid?",
                a: "Payouts are transferred directly to your bank account or UPI every week. Rates range from ₹300 for quick errand runs to ₹800–₹1,500+ for hospital escorts and half-day shifts."
              },
              {
                q: "Is there any registration fee?",
                a: "No! Registration with Amma Seva is 100% free. We never charge any upfront fees from our care professionals."
              }
            ].map((faq, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-slate-200/80 bg-white p-4.5 transition-all duration-200 open:border-gold open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-primary group-open:text-gold outline-none select-none">
                  <span>{faq.q}</span>
                  <ChevronRight className="h-4 w-4 text-gold transition-transform group-open:rotate-90 shrink-0" />
                </summary>
                <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed pl-2 border-l-2 border-gold/40">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

          {/* Need help banner */}
          <div className="mt-8 rounded-2xl bg-[#1e2a5a] text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
            <div className="space-y-1 text-left">
              <div className="font-bold font-display text-base">Have more questions about MTP?</div>
              <div className="text-xs text-slate-300">Call our Hyderabad care desk coordinator directly: <strong>{contact.PHONE}</strong></div>
            </div>
            <a
              href={`tel:${contact.PHONE_TEL}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#b08b3a] transition-all whitespace-nowrap"
            >
              <Phone className="h-3.5 w-3.5" /> Call Coordinator
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
