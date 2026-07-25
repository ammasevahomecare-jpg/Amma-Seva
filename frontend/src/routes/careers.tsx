import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, contact } from "@/components/SiteLayout";

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
      <section className="border-b border-border bg-cream/40">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Careers</span>
          <h1 className="mt-4 text-4xl font-semibold text-primary sm:text-5xl">Build a career of purpose</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            We&apos;re always looking for compassionate nurses, caregivers, physiotherapists and support staff to join Amma Seva.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <form
            className="rounded-2xl border border-border bg-background p-6 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you for applying! We'll be in touch after review.");
              (e.target as HTMLFormElement).reset();
            }}
          >
            <h2 className="text-xl font-semibold text-primary">Apply to join</h2>
            <p className="mt-1 text-sm text-muted-foreground">Full onboarding (documents & verification) will follow after our team reviews your application.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" required />
              <Field label="Phone" name="phone" type="tel" required />
              <Field label="Email" name="email" type="email" />
              <Field label="City" name="city" required />
              <Field label="Role you're applying for" name="role" placeholder="Nurse, Caregiver, etc." required />
              <Field label="Years of experience" name="experience" type="number" />
            </div>
            <div className="mt-4">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Brief background</label>
              <textarea
                name="about"
                rows={4}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <button type="submit" className="btn-primary mt-5 w-full">Submit application</button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Prefer to speak first? Call our team at{" "}
            <a href={`tel:${contact.PHONE_TEL}`} className="font-medium text-primary hover:underline">{contact.PHONE}</a>.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
      />
    </div>
  );
}