import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Phone, MessageCircle, Mail, MapPin, Send, ArrowRight, Instagram, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { validateName, validatePhone, validateEmail, sanitizeIndianPhone, sanitizeName } from "@/lib/validation";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Amma Seva — Book Care & Talk to Our Team" },
      { name: "description", content: "Call, WhatsApp or email Amma Seva to book home healthcare and caregiving services." },
      { property: "og:title", content: "Contact Amma Seva" },
      { property: "og:description", content: "Reach us by phone, WhatsApp, email or through our contact form." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const validateForm = () => {
    const nameError = validateName(name, "Full name");
    if (nameError) return nameError;

    const phoneError = validatePhone(phone, "Phone number");
    if (phoneError) return phoneError;

    const emailError = validateEmail(email, false, "Email address");
    if (emailError) return emailError;

    if (!message.trim() || message.trim().length < 5) {
      return "Please describe your care requirements (minimum 5 characters).";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setFormStatus({ type: "error", message: error });
      return;
    }

    setSubmitting(true);
    setFormStatus({ type: "idle", message: "" });

    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          email: email.trim(),
          service,
          message: message.trim(),
        }),
      });
      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.success) {
        setFormStatus({
          type: "success",
          message: resData.message || "Thank you! Your care enquiry has been submitted. Our team will contact you shortly.",
        });
        setName("");
        setPhone("");
        setEmail("");
        setMessage("");
      } else {
        setFormStatus({
          type: "error",
          message: resData.error || "Failed to submit enquiry. Please check your inputs.",
        });
      }
    } catch (err) {
      console.error(err);
      setFormStatus({
        type: "error",
        message: "Unable to submit enquiry at this time. Please call our 24/7 helpline at +91 94945 16543.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppSubmit = () => {
    const error = validateForm();
    if (error) {
      setFormStatus({ type: "error", message: error });
      return;
    }

    const waText = `Hello Amma Seva, I need home healthcare assistance.\n\n` +
      `*Name:* ${name.trim()}\n` +
      `*Phone:* +91 ${phone.trim()}\n` +
      (email.trim() ? `*Email:* ${email.trim()}\n` : "") +
      `*Service:* ${service}\n` +
      `*Details:* ${message.trim()}`;

    window.open(`https://wa.me/919494516543?text=${encodeURIComponent(waText)}`, "_blank");
  };

  return (
    <SiteLayout>
      {/* Premium Hero Header Section */}
      <section className="bg-gradient-to-b from-cream/60 to-background border-b border-border/60 py-10">
        <div className="mx-auto max-w-[1440px] px-4 text-left sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center rounded-full bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold border border-gold/20 tracking-wider uppercase">
              Get in Touch
            </span>
            <h1 className="text-4xl font-extrabold text-primary sm:text-5xl leading-tight">
              Talk to our <span className="text-gold">care team</span>
            </h1>
            <p className="max-w-2xl text-base text-slate-500 leading-relaxed">
              We&apos;re available 24/7. Reach out to book a service or ask a clinical question — our expert advisors will respond quickly.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Layout Grid */}
      <section className="py-8 bg-background">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8 xl:px-12">
          
          {/* Left Column - Contact Channels & Location Map */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Contact Rows Container */}
            <div className="space-y-4">
              <ContactRow 
                icon={Phone} 
                label="Emergency Call Support" 
                value={contact.PHONE} 
                subtext="Speak to a care coordinator immediately."
                href={`tel:${contact.PHONE_TEL}`} 
              />
              <ContactRow 
                icon={MessageCircle} 
                label="WhatsApp Care Desk" 
                value="Chat with us on WhatsApp" 
                subtext="Message for fast consultation and rates."
                href={contact.WHATSAPP_URL} 
              />
              <ContactRow 
                icon={Mail} 
                label="Email Inquiries" 
                value={contact.EMAIL} 
                subtext="For partnership, careers or feedback."
                href={`mailto:${contact.EMAIL}`} 
              />
              <ContactRow 
                icon={Instagram} 
                label="Official Instagram" 
                value="@ammaseva.in" 
                subtext="Follow us for care tips, moments, and updates."
                href={contact.INSTAGRAM} 
              />
            </div>

            {/* Premium Google Map Card */}
            <div className="premium-card bg-background rounded-3xl overflow-hidden shadow-sm text-left">
              <div className="px-5 py-4 border-b border-border/60 bg-slate-50/50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary font-display font-semibold">Service Coverage Area</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-150 px-2 py-0.5 rounded font-bold">Active</span>
              </div>
              <div className="p-1.5">
                <iframe
                  title="Amma Seva location"
                  src="https://www.google.com/maps?q=Banjara+Hills+Hyderabad+Telangana+LUXDHANA+GLOBAL+PRIVATE+LIMITED&output=embed"
                  className="h-80 w-full rounded-2xl border border-slate-100/60"
                  style={{ width: "100%" }}
                  width="100%"
                  loading="lazy"
                />
              </div>
            </div>

          </div>

          {/* Right Column - Premium Message Form */}
          <div className="lg:col-span-7">
            <form
              className="rounded-3xl premium-card bg-white p-6 sm:p-8 shadow-md text-left space-y-5"
              onSubmit={handleSubmit}
            >
              <div>
                <h3 className="text-xl font-bold text-primary">Send us a message</h3>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                  Have specific nursing requirements? Fill out this quick inquiry and a doctor or coordinator will call you back.
                </p>
              </div>

              {/* Status Banner */}
              {formStatus.type === "success" && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{formStatus.message}</span>
                </div>
              )}
              {formStatus.type === "error" && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{formStatus.message}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field 
                  label="Full Name" 
                  name="name" 
                  required 
                  placeholder="John Doe" 
                  value={name}
                  onChange={setName}
                />
                <Field 
                  label="Phone Number" 
                  name="phone" 
                  type="tel" 
                  required 
                  placeholder="98765 43210" 
                  value={phone}
                  onChange={setPhone}
                />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Field 
                  label="Email Address" 
                  name="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  value={email}
                  onChange={setEmail}
                />
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Preferred Service</label>
                  <select
                    name="service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold text-slate-800"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Elderly Care">Elderly Care</option>
                    <option value="Mother & Baby Care">Mother &amp; Baby Care</option>
                    <option value="Home Nursing">Home Nursing</option>
                    <option value="Post-Surgery Care">Post-Surgery Care</option>
                    <option value="Physiotherapy">Physiotherapy / Rehab</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Your Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your patient requirements (e.g. medical conditions, required hours, start date)..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold text-slate-800"
                />
              </div>

              {/* Action Buttons: Standard Enquiry + Direct WhatsApp Submission */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 font-semibold text-sm disabled:opacity-60 cursor-pointer touch-manipulation"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send Enquiry Message <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppSubmit}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-102 active:scale-98 cursor-pointer touch-manipulation"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </form>


            {/* Office & Branch Locations */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ContactRow 
                icon={MapPin} 
                label="Head Office" 
                value="Chennai, Tamil Nadu" 
                subtext="Shop No. S101, Door No. 769, Spencer Plaza, Anna Salai, Anna Road, Chennai, Tamil Nadu, 600002, India"
              />
              <ContactRow 
                icon={MapPin} 
                label="Branches" 
                value="Amaravathi &amp; Hyderabad" 
                subtext="Amaravathi, Hyderabad"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Spacing spacer */}
      <div className="py-6" />
    </SiteLayout>
  );
}

function ContactRow({ icon: Icon, label, value, subtext, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; subtext: string; href?: string }) {
  const Wrap = href ? "a" : "div";
  return (
    <Wrap 
      {...(href ? { href } : {})} 
      className="flex items-start gap-4 rounded-2xl premium-card bg-background p-4 shadow-sm text-left cursor-pointer group"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold border border-gold/25 group-hover:bg-gold group-hover:text-[#0b183b] transition-all duration-300">
        <Icon className="h-5 w-5" />
      </span>
      <div className="space-y-0.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="font-bold text-primary group-hover:text-gold transition-colors">{value}</div>
        <div className="text-xs text-slate-400 font-medium leading-relaxed">{subtext}</div>
      </div>
    </Wrap>
  );
}

function Field({ 
  label, 
  name, 
  type = "text", 
  required, 
  placeholder,
  value,
  onChange 
}: { 
  label: string; 
  name: string; 
  type?: string; 
  required?: boolean; 
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
}) {
  const [internalVal, setInternalVal] = React.useState("");
  const isControlled = value !== undefined;
  const currentVal = isControlled ? value : internalVal;
  const isTel = type === "tel";

  return (
    <div className="text-left">
      <label className="text-xs font-semibold text-slate-600 block mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative flex items-center">
        {isTel && (
          <div className="absolute left-3 flex items-center gap-1.5 text-xs font-extrabold text-slate-700 pointer-events-none select-none border-r border-slate-200 pr-2.5">
            <span>🇮🇳</span>
            <span>+91</span>
          </div>
        )}
        <input
          name={name}
          type={type}
          inputMode={isTel ? "numeric" : undefined}
          maxLength={isTel ? 10 : undefined}
          required={required}
          value={currentVal}
          onChange={(e) => {
            let val = e.target.value;
            if (isTel) {
              val = sanitizeIndianPhone(val);
            } else if (name === "name" || label.toLowerCase().includes("name")) {
              val = sanitizeName(val);
            }
            if (isControlled) {
              onChange?.(val);
            } else {
              setInternalVal(val);
            }
          }}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold text-slate-800 ${
            isTel ? "pl-20 pr-3 font-mono font-bold tracking-wider" : "px-3"
          }`}
        />
      </div>
      {isTel && <p className="text-[10px] text-slate-400 mt-1">10-digit Indian mobile number</p>}
    </div>
  );
}