import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Amma Seva" },
      { name: "description", content: "How Amma Seva collects, uses and protects your personal information." },
      { property: "og:title", content: "Privacy Policy — Amma Seva" },
      { property: "og:description", content: "How we handle your information." },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <LegalShell title="Privacy Policy">
        <p>This page is maintained by Amma Seva to explain how we collect and use information when you use our services.</p>
        <h3>Information we collect</h3>
        <p>Contact details you share (name, phone, email, address) and details needed to arrange care (patient information, service preferences).</p>
        <h3>How we use it</h3>
        <p>To arrange, deliver and improve our services, communicate about bookings, and comply with legal requirements.</p>
        <h3>How we protect it</h3>
        <p>We restrict access to authorised staff and follow reasonable safeguards to protect your information.</p>
        <h3>Your choices</h3>
        <p>You can request access, correction or deletion of your personal data by contacting our care team.</p>
        <p className="text-sm text-muted-foreground">This is a general summary. For specific questions, please contact us.</p>
      </LegalShell>
    </SiteLayout>
  );
}

export function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="bg-[#fbfbfe] min-h-screen pb-16">
      {/* Top tinted header banner */}
      <section className="bg-gradient-to-b from-cream/60 to-background border-b border-border/60 py-10">
        <div className="mx-auto max-w-4xl px-4 text-left sm:px-6 lg:px-8">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold border border-gold/20 tracking-wider uppercase">
              Official Agreement
            </span>
            <h1 className="text-4xl font-extrabold text-primary sm:text-5xl font-display leading-tight">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
              <span>Amma Seva Homecare</span>
              <span>•</span>
              <span>Last updated: {currentDate}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Spacious premium documentation card */}
      <section className="mt-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="premium-card bg-white rounded-3xl p-8 sm:p-12 shadow-sm text-left">
            <div className="prose prose-slate max-w-none space-y-6 text-slate-650 leading-relaxed text-sm [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-primary [&>h3]:font-display [&>h3]:mt-6">
              {children}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}