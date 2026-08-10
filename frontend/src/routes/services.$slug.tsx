import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, Phone, Clock, IndianRupee } from "lucide-react";
import { SiteLayout, contact } from "@/components/SiteLayout";
import { fetchServices } from "@/lib/services";
import motherBaby from "@/assets/service-mother-baby.jpg";
import nursing from "@/assets/service-nursing.jpg";
import elderly from "@/assets/service-elderly.jpg";

const IMAGE_BY_SLUG: Record<string, string> = {
  "mother-baby-care": motherBaby,
  "home-nursing": nursing,
  "elderly-care": elderly,
};

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ params }) => {
    const list = await fetchServices();
    const service = list.find((s) => s.slug === params.slug);
    if (!service) throw notFound();
    return { service, allServices: list };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service not found — Amma Seva" }, { name: "robots", content: "noindex" }] };
    }
    const s = loaderData.service;
    return {
      meta: [
        { title: `${s.title} — Amma Seva` },
        { name: "description", content: s.short },
        { property: "og:title", content: `${s.title} — Amma Seva` },
        { property: "og:description", content: s.short },
        { property: "og:url", content: `/services/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/services/${params.slug}` }],
    };
  },
  component: ServicePage,
});

function ServicePage() {
  const { service, allServices } = Route.useLoaderData();
  const others = allServices.filter((s: any) => s.slug !== service.slug).slice(0, 3);
  return (
    <SiteLayout>
      <section className="border-b border-border bg-cream/40">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1">
            <Link to="/services" className="text-sm text-muted-foreground hover:text-primary">← All services</Link>
            <h1 className="mt-4 text-4xl font-semibold text-primary sm:text-5xl">{service.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">{service.description}</p>
            {service.comingSoon && (
              <span className="mt-4 inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">Launching soon</span>
            )}
          </div>
          {(service.image || IMAGE_BY_SLUG[service.slug]) && (
            <div className="w-full md:w-80 h-52 shrink-0 rounded-2xl overflow-hidden border border-border shadow-md">
              <img 
                src={service.image || IMAGE_BY_SLUG[service.slug]} 
                alt={service.title} 
                className="w-full h-full object-cover" 
              />
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold text-primary">Key benefits</h2>
            <ul className="mt-5 space-y-3">
              {service.benefits.map((b: string) => (
                <li key={b} className="flex items-start gap-3 text-foreground">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-gold">
                    <Check className="h-4 w-4" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <InfoTile icon={Clock} label="Duration options" value={service.duration} />
              {service.pricing && <InfoTile icon={IndianRupee} label="Indicative pricing" value={service.pricing} />}
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-background p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-primary">Enquire about this service</h3>
            <p className="mt-1 text-sm text-muted-foreground">We'll respond within a few hours.</p>
            <form
              className="mt-5 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                const data = {
                  name: formData.get("name") as string,
                  phone: formData.get("phone") as string,
                  city: formData.get("city") as string,
                  message: formData.get("message") as string,
                  service: service.title,
                };

                fetch("/api/enquiry", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                })
                  .then((res) => res.json())
                  .then((resData) => {
                    if (resData.success) {
                      alert("Thank you! Our care team will contact you shortly.");
                      form.reset();
                    } else {
                      alert("Error: " + (resData.error || "Failed to submit enquiry."));
                    }
                  })
                  .catch((err) => {
                    console.error(err);
                    alert("Thank you! Our care team will contact you shortly.");
                    form.reset();
                  });
              }}
            >
              <Field label="Your name" name="name" required />
              <Field label="Phone number" name="phone" type="tel" required />
              <Field label="City" name="city" />
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Message</label>
                <textarea
                  name="message"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                  placeholder="Tell us a little about your requirement"
                />
              </div>
              <button type="submit" className="btn-primary w-full">Send enquiry</button>
              <a href={`tel:${contact.PHONE_TEL}`} className="btn-outline w-full text-sm">
                <Phone className="h-4 w-4" /> Call {contact.PHONE}
              </a>
            </form>
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-cream/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-primary">Other services you may need</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {others.map((o: any) => (
              <Link key={o.slug} to="/services/$slug" params={{ slug: o.slug }} className="rounded-xl border border-border bg-background p-5 shadow-sm hover:shadow-md">
                <div className="font-semibold text-primary">{o.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{o.short}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 text-gold"><Icon className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-wider">{label}</span></div>
      <div className="mt-2 font-medium text-primary">{value}</div>
    </div>
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