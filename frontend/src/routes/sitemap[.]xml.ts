import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { services } from "@/lib/services";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticPaths = [
          { path: "/", priority: "1.0", changefreq: "weekly" as const },
          { path: "/services", priority: "0.9", changefreq: "weekly" as const },
          { path: "/about", priority: "0.6", changefreq: "monthly" as const },
          { path: "/contact", priority: "0.7", changefreq: "monthly" as const },
          { path: "/careers", priority: "0.5", changefreq: "monthly" as const },
          { path: "/blog", priority: "0.5", changefreq: "weekly" as const },
          { path: "/privacy", priority: "0.3", changefreq: "yearly" as const },
          { path: "/terms", priority: "0.3", changefreq: "yearly" as const },
          { path: "/refund", priority: "0.3", changefreq: "yearly" as const },
        ];
        const servicePaths = services.map((s) => ({
          path: `/services/${s.slug}`,
          priority: "0.8",
          changefreq: "monthly" as const,
        }));
        const urls = [...staticPaths, ...servicePaths].map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            `    <changefreq>${e.changefreq}</changefreq>`,
            `    <priority>${e.priority}</priority>`,
            `  </url>`,
          ].join("\n"),
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});