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
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-primary">{title}</h1>
        <div className="prose prose-slate mt-6 max-w-none space-y-4 text-foreground [&>h3]:mt-6 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-primary">
          {children}
        </div>
      </div>
    </section>
  );
}