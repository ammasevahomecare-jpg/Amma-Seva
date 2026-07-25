import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { LegalShell } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Amma Seva" },
      { name: "description", content: "Terms governing the use of Amma Seva services." },
      { property: "og:title", content: "Terms & Conditions — Amma Seva" },
      { property: "og:description", content: "Service terms and conditions." },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <LegalShell title="Terms & Conditions">
        <p>These terms govern your use of Amma Seva services. By booking a service you agree to these terms.</p>
        <h3>Services</h3>
        <p>Amma Seva provides trained nurses and caregivers for home healthcare. Specific services, pricing and availability are as listed on our website or shared by our team.</p>
        <h3>Bookings & payments</h3>
        <p>Bookings can be made online, by phone or WhatsApp. Payments are collected via approved channels; taxes and charges may apply.</p>
        <h3>Conduct</h3>
        <p>Customers agree to provide a safe environment for our staff. Staff are held to professional standards; concerns can be reported to our helpline.</p>
        <h3>Liability</h3>
        <p>While we take every care to deliver safe services, our liability is limited to the value of the specific service booked.</p>
        <p className="text-sm text-muted-foreground">These terms may be updated from time to time.</p>
      </LegalShell>
    </SiteLayout>
  );
}