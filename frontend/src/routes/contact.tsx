import { createFileRoute } from "@tanstack/react-router";
import { Phone, MessageCircle, Mail, MapPin, Send, ArrowRight } from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";

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
  return (
    <SiteLayout>
      {/* Premium Hero Header Section */}
      <section className="bg-gradient-to-b from-cream/60 to-background border-b border-border/60 py-10">
        <div className="mx-auto max-w-7xl px-4 text-left sm:px-6 lg:px-8">
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
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-6 lg:px-8">
          
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
                href={`https://wa.me/${contact.WHATSAPP}`} 
              />
              <ContactRow 
                icon={Mail} 
                label="Email Inquiries" 
                value={contact.EMAIL} 
                subtext="For partnership, careers or feedback."
                href={`mailto:${contact.EMAIL}`} 
              />
              <ContactRow 
                icon={MapPin} 
                label="Headquarters Office" 
                value="LUXDHANA GLOBAL PRIVATE LIMITED" 
                subtext="8-2-630/B/B/1, Mount Banjara complex, Road No. 12, Banjara Hills, Hyderabad - 500034, Telangana."
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
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const phone = (formData.get("phone") as string) || "";
                const email = (formData.get("email") as string) || "";

                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(phone.trim())) {
                  alert("Phone number must be exactly 10 digits and contain only numbers.");
                  return;
                }

                if (email.trim()) {
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(email.trim())) {
                    alert("Please enter a valid email address.");
                    return;
                  }
                }

                const data = {
                  name: formData.get("name") as string,
                  phone,
                  email,
                  service: formData.get("service") as string,
                  message: formData.get("message") as string,
                };

                fetch("/api/enquiry", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                })
                  .then((res) => res.json())
                  .then((resData) => {
                    if (resData.success) {
                      alert("Thanks! Our care team will reach you shortly.");
                      form.reset();
                    } else {
                      alert("Error: " + (resData.error || "Failed to submit enquiry."));
                    }
                  })
                  .catch((err) => {
                    console.error(err);
                    alert("Thanks! Our care team will reach you shortly.");
                    form.reset();
                  });
              }}
            >
              <div>
                <h3 className="text-xl font-bold text-primary">Send us a message</h3>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                  Have specific nursing requirements? Fill out this quick inquiry and a doctor or coordinator will call you back.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" name="name" required placeholder="John Doe" />
                <Field label="Phone Number" name="phone" type="tel" required placeholder="98765 43210" />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email Address" name="email" type="email" placeholder="john@example.com" />
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Preferred Service</label>
                  <select
                    name="service"
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
                <label className="text-xs font-semibold text-slate-500 block mb-1">Your Message</label>
                <textarea
                  name="message"
                  rows={5}
                  required
                  placeholder="Describe your patient requirements (e.g. medical conditions, required hours, start date)..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-gold focus:border-gold text-slate-800"
                />
              </div>

              <button type="submit" className="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2 font-semibold text-sm">
                <Send className="h-4 w-4" /> Send Enquiry Message <ArrowRight className="h-4 w-4" />
              </button>
            </form>
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