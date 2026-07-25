import { createFileRoute } from "@tanstack/react-router";
import { Phone, MessageCircle, Mail, MapPin } from "lucide-react";
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
      <section className="border-b border-border bg-cream/40">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Contact</span>
          <h1 className="mt-4 text-4xl font-semibold text-primary sm:text-5xl">Talk to our care team</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            We&apos;re available 24/7. Reach out to book a service or ask a question — we&apos;ll respond quickly.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="space-y-4">
              <ContactRow icon={Phone} label="Phone" value={contact.PHONE} href={`tel:${contact.PHONE_TEL}`} />
              <ContactRow icon={MessageCircle} label="WhatsApp" value="Chat with us on WhatsApp" href={`https://wa.me/${contact.WHATSAPP}`} />
              <ContactRow icon={Mail} label="Email" value={contact.EMAIL} href={`mailto:${contact.EMAIL}`} />
              <ContactRow icon={MapPin} label="Office" value="Hyderabad, Telangana, India" />
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-border shadow-sm">
              <iframe
                title="Amma Seva location"
                src="https://www.google.com/maps?q=Hyderabad&output=embed"
                className="h-72 w-full"
                loading="lazy"
              />
            </div>
          </div>

          <form
            className="rounded-2xl border border-border bg-background p-6 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              const data = {
                name: formData.get("name") as string,
                phone: formData.get("phone") as string,
                email: formData.get("email") as string,
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
            <h2 className="text-xl font-semibold text-primary">Send us a message</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" required />
              <Field label="Phone" name="phone" type="tel" required />
              <Field label="Email" name="email" type="email" />
              <Field label="Service" name="service" />
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Message</label>
              <textarea
                name="message"
                rows={5}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                required
              />
            </div>
            <button type="submit" className="btn-primary mt-5 w-full">Send message</button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

function ContactRow({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string }) {
  const Wrap = href ? "a" : "div";
  return (
    <Wrap {...(href ? { href } : {})} className="flex items-start gap-4 rounded-xl border border-border bg-background p-4 shadow-sm transition-colors hover:border-gold">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-gold">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-medium text-primary">{value}</div>
      </div>
    </Wrap>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
      />
    </div>
  );
}