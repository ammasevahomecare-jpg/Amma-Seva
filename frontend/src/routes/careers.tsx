import React, { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { 
  HeartHandshake, ShieldCheck, Award, Clock, ArrowRight, Phone, 
  Gift, CheckCircle2, Lock, Sparkles, AlertCircle, Check 
} from "lucide-react";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers & Staff Onboarding — Join Amma Seva as a Nurse or Caregiver" },
      { name: "description", content: "Nurses, caregivers and healthcare professionals — build a rewarding career with Amma Seva. Apply with your referral code." },
      { property: "og:title", content: "Careers at Amma Seva — Refer & Join" },
      { property: "og:description", content: "Join our network of background-verified nurses and caregivers with top payouts and flexible shifts." },
      { property: "og:url", content: "/careers" },
    ],
    links: [{ rel: "canonical", href: "/careers" }],
  }),
  component: Careers,
});

function Careers() {
  const [referralCode, setReferralCode] = useState("");
  const [isLockedFromUrl, setIsLockedFromUrl] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [role, setRole] = useState("caregiver");
  const [experience, setExperience] = useState("3");
  const [about, setAbout] = useState("");

  useEffect(() => {
    // Check URL search parameters for referral code
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get("ref") || params.get("refer") || params.get("referral") || params.get("code");
    
    if (refParam && refParam.trim()) {
      const cleanRef = refParam.trim().toUpperCase();
      setReferralCode(cleanRef);
      setIsLockedFromUrl(true);
      try {
        sessionStorage.setItem("ammaseva_ref_code", cleanRef);
      } catch (e) {
        // ignore storage error
      }
    } else {
      // Check session storage if previously navigated with ref link
      try {
        const storedRef = sessionStorage.getItem("ammaseva_ref_code");
        if (storedRef && storedRef.trim()) {
          setReferralCode(storedRef.trim().toUpperCase());
          setIsLockedFromUrl(true);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.replace(/[^0-9]/g, "").trim();
    if (cleanPhone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: cleanPhone,
          email: email.trim(),
          city: city.trim(),
          role,
          experience: Number(experience) || 1,
          about: about.trim(),
          referredBy: referralCode.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application. Please try again.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please contact us via phone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      {/* Premium Hero Header Section */}
      <section className="bg-gradient-to-b from-[#fbf8f2] via-background to-background border-b border-border/60 py-12">
        <div className="mx-auto max-w-7xl px-4 text-left sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c9a24c]/15 px-3.5 py-1 text-xs font-bold text-[#9e761a] border border-[#c9a24c]/30 tracking-wider uppercase">
                <Sparkles className="h-3 w-3 text-[#c9a24c]" /> Join Hyderabad&apos;s #1 Care Team
              </span>
              {isLockedFromUrl && referralCode && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-black text-emerald-800 border border-emerald-200 tracking-wider font-mono">
                  <Gift className="h-3.5 w-3.5 text-emerald-600" /> Referral Partner: {referralCode}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1e2a5a] font-display leading-tight">
              Build a rewarding healthcare career <span className="text-[#c9a24c]">with purpose</span>
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-slate-500 leading-relaxed">
              We&apos;re welcoming certified nurses, compassionate caregivers, physiotherapists and bedside attendants across Hyderabad. Enjoy top industry pay, verified assignments, and doctor-backed support.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout Grid */}
      <section className="py-10 bg-background">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8">
          
          {/* Left Column Information Cards */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Referral Welcome Banner if coming from referral link */}
            {isLockedFromUrl && referralCode && (
              <div className="bg-gradient-to-r from-[#1e2a5a]/5 via-[#c9a24c]/10 to-emerald-50/60 border-2 border-[#c9a24c]/40 rounded-3xl p-6 text-left shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#c9a24c]/20 border border-[#c9a24c]/40 flex items-center justify-center text-[#9e761a] shrink-0 shadow-inner">
                    <Gift className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                        Referral Link Verified
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-[#1e2a5a] font-display">
                      Invited by Care Partner: <span className="text-[#c9a24c] font-mono font-black">{referralCode}</span>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      You are applying through a trusted staff referral. Your referral code is automatically linked to your application and locked for priority onboarding.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Why Work With Us Card */}
            <div className="border border-border/85 bg-white rounded-3xl p-6 sm:p-8 shadow-sm text-left">
              <h2 className="text-xl font-extrabold text-[#1e2a5a] font-display flex items-center gap-2">
                <span className="h-6 w-1.5 bg-[#c9a24c] rounded-full" /> Why Join Amma Seva?
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                We provide the same compassionate care to our staff as we do to our patients. Here are the core benefits our team enjoys:
              </p>
              
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <BenefitTile 
                  icon={Clock} 
                  title="Flexible Shift Options" 
                  desc="Choose from 12-hour day/night shifts, 24-hour live-in care, or hourly home visits nearest your location." 
                />
                <BenefitTile 
                  icon={Award} 
                  title="Direct & Reliable Payouts" 
                  desc="Transparent payout tracking with timely bank transfers directly into your account." 
                />
                <BenefitTile 
                  icon={HeartHandshake} 
                  title="Clinical Doctor Supervision" 
                  desc="Work with confidence under the daily guidance and clinical protocol support of experienced physicians." 
                />
                <BenefitTile 
                  icon={ShieldCheck} 
                  title="Verified Credentials & Safety" 
                  desc="Official ID cards, background verification support, and professional training workshops." 
                />
              </div>
            </div>

            {/* Onboarding Timeline Card */}
            <div className="border border-border/85 bg-white rounded-3xl p-6 sm:p-8 shadow-sm text-left">
              <h2 className="text-xl font-extrabold text-[#1e2a5a] font-display flex items-center gap-2 mb-6">
                <span className="h-6 w-1.5 bg-[#c9a24c] rounded-full" /> Simple 4-Step Onboarding
              </h2>
              
              <div className="relative border-l-2 border-[#1e2a5a]/15 pl-6 space-y-6">
                <TimelineStep 
                  number="1" 
                  title="Submit Application & Referral" 
                  desc="Fill out the application form on this page with your basic details and experience." 
                />
                <TimelineStep 
                  number="2" 
                  title="Quick Screening & Identity Check" 
                  desc="Our coordinator will connect with you via phone or WhatsApp to verify your credentials." 
                />
                <TimelineStep 
                  number="3" 
                  title="Clinical Alignment Workshop" 
                  desc="Attend a brief induction on patient care standards, safety protocols, and attendance logs." 
                />
                <TimelineStep 
                  number="4" 
                  title="Start Shift & Earn" 
                  desc="Get matched to high-paying shifts in Banjara Hills, Jubilee Hills, Gachibowli, Secunderabad, and more!" 
                />
              </div>
            </div>

          </div>

          {/* Right Column Application Form */}
          <div className="lg:col-span-5">
            <aside className="rounded-3xl border border-border bg-white p-6 sm:p-7 shadow-lg shadow-slate-200/50 sticky top-24 text-left space-y-5">
              
              {isSuccess ? (
                <div className="text-center py-8 space-y-4 animate-in fade-in duration-300">
                  <div className="h-16 w-16 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#1e2a5a] font-display">Application Received!</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Thank you for applying to join Amma Seva. Our HR onboarding coordinator will review your profile and contact you within 24 hours.
                  </p>
                  {referralCode && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c9a24c]/15 text-[#9e761a] border border-[#c9a24c]/30 text-xs font-mono font-bold">
                      <Gift className="h-3.5 w-3.5 text-[#c9a24c]" /> Referral Code Applied: {referralCode}
                    </div>
                  )}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSuccess(false);
                        setFullName("");
                        setPhone("");
                        setEmail("");
                        setAbout("");
                      }}
                      className="text-xs font-bold text-[#1e2a5a] underline hover:text-[#c9a24c]"
                    >
                      Submit Another Application
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display flex items-center justify-between">
                      <span>Apply for Caregiver / Nursing Role</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#c9a24c]/15 text-[#9e761a] border border-[#c9a24c]/30">
                        Immediate Joining
                      </span>
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      Fill out your details below. Screening coordinator will contact you directly.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    
                    {/* Referral Code Banner / Field */}
                    {isLockedFromUrl ? (
                      <div className="bg-gradient-to-r from-[#1e2a5a]/5 to-[#c9a24c]/10 border border-[#c9a24c]/40 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-[#c9a24c]/20 border border-[#c9a24c]/30 flex items-center justify-center text-[#9e761a] shrink-0 font-bold">
                            <Lock className="h-4 w-4 text-[#9e761a]" />
                          </div>
                          <div>
                            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              Referred By Staff Code
                            </div>
                            <div className="text-xs font-black text-[#1e2a5a] font-mono tracking-wider">
                              {referralCode}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                          <Check className="h-3 w-3 text-emerald-600" /> Locked Link
                        </span>
                      </div>
                    ) : (
                      <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#1e2a5a] flex items-center gap-1">
                            <Gift className="h-3.5 w-3.5 text-[#c9a24c]" /> Have a Referral Code? (Optional)
                          </label>
                          <span className="text-[10px] text-slate-400 font-semibold">Staff Unique ID</span>
                        </div>
                        <input
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                          placeholder="e.g. PRIYA3210 or PANDU3210"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-bold text-[#1e2a5a] outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] uppercase tracking-wider"
                        />
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Enter the Name + Last 4 digits of the caregiver who invited you.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Mobile Phone (10-Digits) *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                          placeholder="9876543210"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">City / Town *</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Hyderabad"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Role Applying For *</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] cursor-pointer"
                        >
                          <option value="caregiver">Caregiver / Attendant</option>
                          <option value="nurse">Registered GNM/B.Sc Nurse</option>
                          <option value="physiotherapist">Physiotherapist</option>
                          <option value="other">Postnatal &amp; Baby Care Helper</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Experience (Years) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="40"
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          placeholder="3"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Brief Background / Hospital Experience</label>
                      <textarea
                        rows={2}
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        placeholder="Tell us about previous home nursing, hospital postings, or patient care experience..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] resize-none"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          Submit Application <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="border-t border-border/60 pt-4 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                      Already registered?{" "}
                      <Link to="/login" className="font-bold text-[#1e2a5a] hover:text-[#c9a24c] underline">
                        Partner Sign In
                      </Link>
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Prefer speaking with HR? Call{" "}
                      <a href={`tel:${contact.PHONE_TEL}`} className="font-bold text-[#c9a24c] hover:underline inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {contact.PHONE}
                      </a>
                    </p>
                  </div>
                </>
              )}

            </aside>
          </div>

        </div>
      </section>

      {/* Bottom spacer helper */}
      <div className="py-6" />
    </SiteLayout>
  );
}

function BenefitTile({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#c9a24c]/10 text-[#9e761a] border border-[#c9a24c]/25 shadow-xs">
        <Icon className="h-5 w-5" />
      </span>
      <div className="space-y-0.5">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function TimelineStep({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <div className="relative">
      <span className="absolute -left-9 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#1e2a5a] text-white text-[11px] font-black border-2 border-white shadow-xs">
        {number}
      </span>
      <div className="space-y-0.5">
        <h4 className="text-sm font-bold text-[#1e2a5a]">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}