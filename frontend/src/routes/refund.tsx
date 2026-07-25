import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { LegalShell } from "./privacy";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Amma Seva" },
      { name: "description", content: "Amma Seva's refund and cancellation policy." },
      { property: "og:title", content: "Refund Policy — Amma Seva" },
      { property: "og:description", content: "Refund and cancellation policy." },
      { property: "og:url", content: "/refund" },
    ],
    links: [{ rel: "canonical", href: "/refund" }],
  }),
  component: Refund,
});

function Refund() {
  return (
    <SiteLayout>
      <LegalShell title="Refund Policy">
        <h3>Cancellations</h3>
        <p>You may cancel a booking free of charge up to 4 hours before the scheduled start time. Later cancellations may incur a partial charge.</p>
        <h3>Refunds</h3>
        <p>Eligible refunds are processed within 5–7 working days to the original payment method.</p>
        <h3>Service concerns</h3>
        <p>If a service falls short of expectations, please contact our helpline within 24 hours so we can make it right.</p>
      </LegalShell>
    </SiteLayout>
  );
}