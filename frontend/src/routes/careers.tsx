import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { HeartHandshake, ShieldCheck, Award, Clock, ArrowRight, Phone } from "lucide-react";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers — Join Amma Seva as a Nurse or Caregiver" },
      { name: "description", content: "Nurses, caregivers and healthcare professionals — build a rewarding career with Amma Seva." },
      { property: "og:title", content: "Careers at Amma Seva" },
      { property: "og:description", content: "Join our team of verified nurses and caregivers." },
      { property: "og:url", content: "/careers" },
    ],
    links: [{ rel: "canonical", href: "/careers" }],
  }),
  component: Careers,
});

function Careers() {
  return (
    <SiteLayout>
      {/* Premium Hero Header Section */}
      <section className="bg-gradient-to-b from-cream/60 to-background border-b border-border/60 py-10">
        <div className="mx-auto max-w-7xl px-4 text-left sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center rounded-full bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold border border-gold/20 tracking-wider uppercase">
              Join Our Care Team
            </span>
            <h1 className="text-4xl font-extrabold text-primary sm:text-5xl leading-tight">
              Build a career <span className="text-gold">of purpose</span>
            </h1>
            <p className="max-w-2xl text-base text-slate-500 leading-relaxed">
              We&apos;re always looking for compassionate nurses, caregivers, physiotherapists and support staff to join Hyderabad&apos;s most trusted home healthcare network.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout Grid */}
      <section className="py-8 bg-background">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8">
          
          {/* Left Column Information Cards */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Why Work With Us Card */}
            <div className="border border-border/85 bg-background rounded-2xl p-6 shadow-sm text-left">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                <span className="h-6 w-1.5 bg-gold rounded-full" /> Why Work With Us?
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                We believe in providing the same care to our staff as we do to our patients. Here are the core benefits we offer:
              </p>
              
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <BenefitTile 
                  icon={Clock} 
                  title="Flexible Shift Options" 
                  desc="Choose from 12-hour shifts, 24-hour live-in care, or hourly home visits to fit your lifestyle." 
                />
                <BenefitTile 
                  icon={Award} 
                  title="Competitive Payouts" 
                  desc="Transparent payouts paid out reliably and directly to your bank account with no hidden cuts." 
                />
                <BenefitTile 
                  icon={HeartHandshake} 
                  title="Clinical Support" 
                  desc="Work with confidence under the supervision and guidance of our experienced panel of doctors." 
                />
                <BenefitTile 
                  icon={ShieldCheck} 
                  title="Continuous Learning" 
                  desc="Ongoing professional training and workshops to keep your healthcare skills sharp and verified." 
                />
              </div>
            </div>

            {/* Onboarding Timeline Card */}
            <div className="border border-border/85 bg-background rounded-2xl p-6 shadow-sm text-left">
              <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-6">
                <span className="h-6 w-1.5 bg-gold rounded-full" /> Our Onboarding Process
              </h2>
              
              <div className="relative border-l border-slate-100 pl-6 space-y-6">
                <TimelineStep 
                  number="1" 
                  title="Submit Application" 
                  desc="Fill out the application form on this page with your basic details and years of healthcare experience." 
                />
                <TimelineStep 
                  number="2" 
                  title="Document Verification" 
                  desc="Our backoffice team will verify your credentials, Aadhaar registration, and police record clearance." 
                />
                <TimelineStep 
                  number="3" 
                  title="Practical Induction" 
                  desc="Attend a basic training and check-in workshop with our clinical advisors to align on homecare safety." 
                />
                <TimelineStep 
                  number="4" 
                  title="Start Active Shifts" 
                  desc="Get matched directly to nursing or caregiver requests in Hyderabad nearest to your preferred locations!" 
                />
              </div>
            </div>

          </div>

          {/* Right Column Application Form */}
          <div className="lg:col-span-5">
            <aside className="rounded-2xl border border-border bg-background p-6 shadow-md sticky top-24 text-left space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Apply to join</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Full onboarding, document screening, and identity checks will follow after our coordinator reviews your lead.
                </p>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const phoneVal = (formData.get("phone") as string) || "";
                  const emailVal = (formData.get("email") as string) || "";

                  const phoneRegex = /^[0-9]{10}$/;
                  if (!phoneRegex.test(phoneVal.trim())) {
                    alert("Phone number must be exactly 10 digits and contain only numbers.");
                    return;
                  }

                  if (emailVal.trim()) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(emailVal.trim())) {
                      alert("Please enter a valid email address.");
                      return;
                    }
                  }

                  alert("Thank you for applying! Our onboarding team will contact you shortly.");
                  (e.target as HTMLFormElement).reset();
                  window.location.reload();
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" name="name" required placeholder="Jane Doe" />
                  <Field label="Phone" name="phone" type="tel" required placeholder="98765 43210" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email" name="email" type="email" placeholder="jane@example.com" />
                  <Field label="City" name="city" required placeholder="Hyderabad" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Role Applying For</label>
                    <select
                      name="role"
                      required
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                    >
                      <option value="caregiver">Caregiver / Attendant</option>
                      <option value="nurse">Registered Nurse</option>
                      <option value="physiotherapist">Physiotherapist</option>
                      <option value="other">Support Staff</option>
                    </select>
                  </div>
                  <Field label="Experience (Years)" name="experience" type="number" placeholder="e.g. 3" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Brief Background</label>
                  <textarea
                    name="about"
                    rows={4}
                    placeholder="Tell us a little about your clinical experience and specialties..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-1.5 font-semibold text-sm">
                  Submit Application <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="border-t border-border/60 pt-4 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  Prefer to speak first? Call our HR team at{" "}
                  <a href={`tel:${contact.PHONE_TEL}`} className="font-bold text-primary hover:underline flex items-center justify-center gap-1 mt-1 text-sm text-gold">
                    <Phone className="h-4 w-4" /> {contact.PHONE}
                  </a>
                </p>
              </div>
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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold border border-gold/25 shadow-xs">
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
      {/* Circle indicator */}
      <span className="absolute -left-10 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-bold border-2 border-white shadow-xs">
        {number}
      </span>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  const [val, setVal] = React.useState("");
  return (
    <div className="text-left">
      <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        value={val}
        onChange={(e) => {
          let value = e.target.value;
          if (type === "tel") {
            value = value.replace(/[^0-9]/g, "").slice(0, 10);
          }
          setVal(value);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold text-slate-800"
      />
    </div>
  );
}