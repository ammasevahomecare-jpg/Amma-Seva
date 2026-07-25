import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Trash2, RefreshCw, Mail, Phone, MapPin, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Amma Seva" },
      { name: "robots", content: "noindex, nofollow" }
    ],
  }),
  component: AdminPage,
});

interface Enquiry {
  id: number;
  name: string;
  phone: string;
  email?: string;
  service?: string;
  city?: string;
  message?: string;
  submittedAt: string;
}

function AdminPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnquiries = () => {
    setIsLoading(true);
    fetch("/api/enquiries")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load enquiries.");
        }
        return res.json();
      })
      .then((data) => {
        setEnquiries(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("Error connecting to server. Please ensure the backend is running.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this enquiry record?")) {
      fetch(`/api/enquiry/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setEnquiries((prev) => prev.filter((item) => item.id !== id));
          } else {
            alert("Delete failed: " + (data.error || "Unknown error"));
          }
        })
        .catch((err) => {
          console.error(err);
          alert("Failed to communicate with database server.");
        });
    }
  };

  return (
    <SiteLayout>
      <section className="border-b border-border bg-cream/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Management</span>
            <h1 className="mt-3 text-3xl font-semibold text-primary sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review and manage incoming caregiving enquiries and service requests.
            </p>
          </div>
          <button
            onClick={fetchEnquiries}
            className="btn-primary self-start sm:self-center flex items-center gap-2 text-sm py-2.5"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Leads
          </button>
        </div>
      </section>

      <section className="py-12 bg-background min-h-[50vh]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
              ⚠️ {error}
            </div>
          )}

          {isLoading && enquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-gold" />
              <p className="text-sm font-medium">Fetching enquiries database...</p>
            </div>
          ) : enquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl bg-cream/10">
              <ClipboardList className="h-12 w-12 text-muted-foreground/60 mb-3" />
              <p className="text-base font-semibold text-primary">No enquiries yet</p>
              <p className="text-xs mt-1">New submissions from the contact and service forms will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col md:flex-row justify-between gap-6"
                >
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-mono font-bold text-muted-foreground bg-accent px-2 py-0.5 rounded">
                        ID: {enq.id}
                      </span>
                      {enq.service && (
                        <span className="text-xs font-bold text-primary bg-gold/15 text-gold border border-gold/25 px-2.5 py-0.5 rounded-full">
                          {enq.service}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(enq.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-primary font-display">{enq.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-gold shrink-0" />
                          {enq.phone}
                        </span>
                        {enq.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4 text-gold shrink-0" />
                            {enq.email}
                          </span>
                        )}
                        {enq.city && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-gold shrink-0" />
                            {enq.city}
                          </span>
                        )}
                      </div>
                    </div>

                    {enq.message && (
                      <div className="rounded-xl bg-cream/15 p-4 border border-border/60 text-sm text-foreground italic leading-relaxed">
                        &ldquo;{enq.message}&rdquo;
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col justify-end items-start md:items-end shrink-0">
                    <button
                      onClick={() => handleDelete(enq.id)}
                      className="px-3.5 py-2 rounded-xl bg-destructive/10 hover:bg-destructive border border-destructive/20 hover:border-destructive text-destructive hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete lead
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
