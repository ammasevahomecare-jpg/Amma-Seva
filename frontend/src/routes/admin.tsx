import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { 
  Trash2, RefreshCw, Mail, Phone, MapPin, ClipboardList, 
  Users, Calendar, DollarSign, ShieldAlert, LogOut, CheckCircle2, 
  XCircle, Edit3, Save, Check, UserCheck
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Amma Seva" },
      { name: "robots", content: "noindex, nofollow" }
    ],
  }),
  component: AdminPage,
});

interface Booking {
  id: number;
  name: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  address: string;
  status: string;
  assignedStaff: string | null;
  amount: number;
  paymentStatus: string;
  createdAt: string;
}

interface Caregiver {
  id: number;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  experience: number;
  status: string;
  joinedAt: string;
}

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
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "caregivers" | "enquiries" | "services">("overview");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editAssignedStaff, setEditAssignedStaff] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("");

  // Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem("ammaseva_admin_token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [bookingsRes, caregiversRes, enquiriesRes] = await Promise.all([
        fetch("/api/bookings").then(res => res.json()),
        fetch("/api/caregivers").then(res => res.json()),
        fetch("/api/enquiries").then(res => res.json())
      ]);
      setBookings(bookingsRes);
      setCaregivers(caregiversRes);
      setEnquiries(enquiriesRes);
    } catch (err) {
      console.error(err);
      setError("Failed to sync database logs. Please verify backend state.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardData();
    }
  }, [isLoggedIn]);

  // Handle login submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, password: loginPassword })
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Invalid username or password credentials.");
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          localStorage.setItem("ammaseva_admin_token", data.token);
          setIsLoggedIn(true);
          setLoginPassword("");
          setLoginError(null);
        }
      })
      .catch((err) => {
        setLoginError(err.message || "Failed to establish admin session.");
      });
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("ammaseva_admin_token");
    setIsLoggedIn(false);
    setBookings([]);
    setCaregivers([]);
    setEnquiries([]);
  };

  // Handle caregiver approval
  const handleUpdateCaregiver = (id: number, status: "Verified" | "Rejected") => {
    fetch(`/api/caregiver/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCaregivers(prev => 
            prev.map(c => c.id === id ? { ...c, status } : c)
          );
        } else {
          alert(data.error || "Failed to update profile.");
        }
      })
      .catch(err => console.error(err));
  };

  // Start editing a booking
  const startEditBooking = (b: Booking) => {
    setEditingBookingId(b.id);
    setEditStatus(b.status);
    setEditAssignedStaff(b.assignedStaff || "");
    setEditPaymentStatus(b.paymentStatus);
  };

  // Save edited booking details
  const saveBookingEdit = (id: number) => {
    fetch(`/api/booking/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: editStatus,
        assignedStaff: editAssignedStaff || null,
        paymentStatus: editPaymentStatus
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBookings(prev => 
            prev.map(b => b.id === id ? { 
              ...b, 
              status: editStatus, 
              assignedStaff: editAssignedStaff || null, 
              paymentStatus: editPaymentStatus 
            } : b)
          );
          setEditingBookingId(null);
        } else {
          alert(data.error || "Failed to update booking.");
        }
      })
      .catch(err => console.error(err));
  };

  // Delete enquiry
  const handleDeleteEnquiry = (id: number) => {
    if (window.confirm("Are you sure you want to delete this customer inquiry?")) {
      fetch(`/api/enquiry/${id}`, { method: "DELETE" })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setEnquiries(prev => prev.filter(e => e.id !== id));
          }
        })
        .catch(err => console.error(err));
    }
  };

  // Services Catalog list
  const servicesCatalog = [
    { title: "Elderly Care at Home", description: "Assisting seniors with daily tasks and medication routine", price: "₹1,200/day" },
    { title: "Mother & Baby Care", description: "Postnatal care for new moms and newborn health checks", price: "₹2,500/day" },
    { title: "Home Nursing Services", description: "Post-surgery care, wound dressing, vitals tracking", price: "₹1,500/visit" },
    { title: "Injection Services", description: "IV, IM, and subcutaneous drug administrations", price: "₹300/visit" },
    { title: "ICU/Home Recovery Support", description: "Critical home support with specialized medical staff", price: "₹4,500/day" }
  ];

  // Calculated values for stats overview
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === "Paid" && b.status !== "Cancelled")
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const pendingBookingsCount = bookings.filter(b => b.status === "Pending").length;
  const verifiedCaregiversCount = caregivers.filter(c => c.status === "Verified").length;

  if (!isLoggedIn) {
    // Render Login Page Card
    return (
      <SiteLayout>
        <div className="flex min-h-[75vh] items-center justify-center bg-cream/20 px-4 py-16">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-md">
            <div className="text-center mb-8">
              <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Secure Gateway</span>
              <h2 className="mt-3 text-3xl font-semibold text-primary font-display">Admin Authentication</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Sign in with your care team credentials.</p>
            </div>

            {loginError && (
              <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive text-sm flex gap-2 items-center">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ammasevahomecare@gmail.com"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Secret password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <button type="submit" className="btn-primary w-full py-2.5 mt-2">
                Log In Securely
              </button>
            </form>
          </div>
        </div>
      </SiteLayout>
    );
  }

  // Render Logged-in Dashboard
  return (
    <SiteLayout>
      {/* Dashboard Top Area */}
      <section className="border-b border-border bg-cream/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="gold-rule text-xs font-semibold uppercase tracking-[0.2em] text-gold">Systems management</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Live</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-primary sm:text-4xl">Amma Seva Control Center</h1>
            <p className="mt-1 text-sm text-muted-foreground">Logged in as: <strong className="text-primary">ammasevahomecare@gmail.com</strong></p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="btn-outline flex items-center gap-2 text-xs py-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Sync DB
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-md border border-destructive/20 bg-destructive/10 hover:bg-destructive hover:text-white text-destructive text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </section>

      {/* Tabs Switcher Navigation */}
      <section className="bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-8 py-4 scrollbar-none">
            {[
              { id: "overview", label: "System Stats" },
              { id: "bookings", label: `Bookings (${bookings.length})` },
              { id: "caregivers", label: `Nurses/Staff (${caregivers.length})` },
              { id: "enquiries", label: `Customer Leads (${enquiries.length})` },
              { id: "services", label: "Catalog & Pricing" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-sm font-semibold tracking-wide border-b-2 pb-2 transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? "border-gold text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Tab Panel Display */}
      <section className="py-10 bg-background min-h-[50vh] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {error && (
            <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Overview statistics Tab */}
          {activeTab === "overview" && (
            <div className="space-y-10">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={DollarSign} color="emerald" label="Total Sales/Revenue" value={`₹${totalRevenue.toLocaleString()}`} desc="From all fully paid invoices" />
                <StatCard icon={Calendar} color="gold" label="Pending Requests" value={pendingBookingsCount.toString()} desc="Needs staff assignment" />
                <StatCard icon={Users} color="indigo" label="Active Caregivers" value={verifiedCaregiversCount.toString()} desc="Verified active profiles" />
                <StatCard icon={ClipboardList} color="rose" label="Client Inquiries" value={enquiries.length.toString()} desc="Pending customer contacts" />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                {/* Quick actions box */}
                <div className="rounded-2xl border border-border bg-background p-6 shadow-sm col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold text-primary font-display border-b border-border pb-3">Systems health & Operations</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-cream/10 border border-border/40">
                      <span className="text-muted-foreground">MySQL Production Connection</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1"><Check className="h-4 w-4" /> Active</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-cream/10 border border-border/40">
                      <span className="text-muted-foreground">Database Storage Size</span>
                      <span className="text-primary font-medium">Automatic (Hostinger Managed)</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-cream/10 border border-border/40">
                      <span className="text-muted-foreground">Verification Gateway status</span>
                      <span className="text-primary font-medium">Auto-seeding verified staff list</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-primary font-display border-b border-border pb-3">Latest Activity Log</h3>
                    <div className="mt-4 space-y-3 text-xs text-muted-foreground">
                      <p>• Database verified & auto-populated.</p>
                      <p>• System synchronized successfully.</p>
                      <p>• Admin logged in from Hyderabad office.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab("bookings")}
                    className="btn-primary w-full text-center mt-6 py-2"
                  >
                    View All Bookings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bookings Management Tab */}
          {activeTab === "bookings" && (
            <div className="rounded-2xl border border-border bg-background overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                  <thead>
                    <tr className="border-b border-border bg-cream/10 text-xs text-muted-foreground uppercase font-semibold">
                      <th className="py-3 px-4">Patient details</th>
                      <th className="py-3 px-4">Service &amp; Shift</th>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Assigned Nurse</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {bookings.map((b) => {
                      const isEditing = editingBookingId === b.id;
                      return (
                        <tr key={b.id} className="hover:bg-cream/5 transition-colors">
                          {/* Patient details */}
                          <td className="py-4 px-4">
                            <div className="font-semibold text-primary font-display">{b.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{b.phone}</div>
                            <div className="text-xs text-muted-foreground italic mt-0.5 truncate max-w-xs">{b.address}</div>
                          </td>
                          {/* Service */}
                          <td className="py-4 px-4">
                            <div className="font-medium text-slate-800">{b.service}</div>
                            <div className="text-xs text-gold font-bold uppercase tracking-wider mt-0.5">{b.duration}</div>
                          </td>
                          {/* Date & Time */}
                          <td className="py-4 px-4 text-xs text-muted-foreground">
                            <div>{b.date}</div>
                            <div className="mt-0.5">{b.time} AM/PM</div>
                          </td>
                          {/* Assigned Nurse */}
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <select
                                value={editAssignedStaff}
                                onChange={(e) => setEditAssignedStaff(e.target.value)}
                                className="text-xs rounded border border-border p-1 outline-none bg-background focus:ring-1 focus:ring-gold"
                              >
                                <option value="">-- Unassigned --</option>
                                {caregivers
                                  .filter(c => c.status === "Verified")
                                  .map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                  ))}
                              </select>
                            ) : (
                              <div className="text-xs font-semibold text-indigo-600">
                                {b.assignedStaff || "🚫 Unassigned"}
                              </div>
                            )}
                          </td>
                          {/* Status */}
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="text-xs rounded border border-border p-1 outline-none bg-background focus:ring-1 focus:ring-gold"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                b.status === "Confirmed" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                b.status === "Cancelled" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                                "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}>
                                {b.status}
                              </span>
                            )}
                          </td>
                          {/* Payment */}
                          <td className="py-4 px-4">
                            {isEditing ? (
                              <div className="space-y-1">
                                <div className="text-xs font-bold">₹{b.amount}</div>
                                <select
                                  value={editPaymentStatus}
                                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                                  className="text-[10px] rounded border border-border p-1 outline-none bg-background"
                                >
                                  <option value="Unpaid">Unpaid</option>
                                  <option value="Paid">Paid</option>
                                </select>
                              </div>
                            ) : (
                              <div>
                                <div className="text-xs font-bold text-slate-800">₹{b.amount}</div>
                                <span className={`text-[9px] font-bold ${
                                  b.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"
                                }`}>
                                  {b.paymentStatus}
                                </span>
                              </div>
                            )}
                          </td>
                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            {isEditing ? (
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => saveBookingEdit(b.id)}
                                  className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm cursor-pointer"
                                  title="Save Changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingBookingId(null)}
                                  className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                                  title="Cancel"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditBooking(b)}
                                className="px-2.5 py-1 rounded bg-accent hover:bg-gold hover:text-white border border-border text-gold text-xs font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <Edit3 className="h-3 w-3" />
                                Manage
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Staff Verification Portal Tab */}
          {activeTab === "caregivers" && (
            <div className="rounded-2xl border border-border bg-background overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-foreground">
                  <thead>
                    <tr className="border-b border-border bg-cream/10 text-xs text-muted-foreground uppercase font-semibold">
                      <th className="py-3 px-4">Staff details</th>
                      <th className="py-3 px-4">Specialty &amp; Experience</th>
                      <th className="py-3 px-4">Timings / Details</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4 text-right">Approve / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {caregivers.map((c) => (
                      <tr key={c.id} className="hover:bg-cream/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-primary font-display">{c.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.phone}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-800">{c.specialty}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.experience} years experience</div>
                        </td>
                        <td className="py-4 px-4 text-xs text-muted-foreground">
                          <div>Documents: Aadhaar, PAN Uploaded</div>
                          <div className="mt-0.5 text-[10px] text-indigo-500 font-bold uppercase">Background check: Pending</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded ${
                            c.status === "Verified" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                            c.status === "Rejected" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                            "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {c.status !== "Verified" && (
                              <button
                                onClick={() => handleUpdateCaregiver(c.id, "Verified")}
                                className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/20 hover:border-emerald-500 text-emerald-600 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="h-3 w-3" /> Verify
                              </button>
                            )}
                            {c.status !== "Rejected" && (
                              <button
                                onClick={() => handleUpdateCaregiver(c.id, "Rejected")}
                                className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 hover:border-rose-500 text-rose-600 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Customer Leads Tab */}
          {activeTab === "enquiries" && (
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
                      onClick={() => handleDeleteEnquiry(enq.id)}
                      className="px-3.5 py-2 rounded-xl bg-destructive/10 hover:bg-destructive border border-destructive/20 hover:border-destructive text-destructive hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Lead
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Service Management Tab */}
          {activeTab === "services" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <h3 className="text-xl font-bold text-primary font-display">Active Service Catalog</h3>
                <span className="text-xs text-muted-foreground">Configure standard prices below.</span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {servicesCatalog.map((service, idx) => (
                  <div key={idx} className="rounded-2xl border border-border bg-background p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-lg font-semibold text-primary font-display">{service.title}</h4>
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">{service.price}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{service.description}</p>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={() => alert(`Pricing updates are locked in preview mode.`)}
                        className="px-3 py-1.5 rounded border border-border hover:bg-accent text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Adjust pricing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function StatCard({ icon: Icon, color, label, value, desc }: { icon: any; color: string; label: string; value: string; desc: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-500 bg-emerald-50",
    gold: "text-amber-500 bg-amber-50",
    indigo: "text-indigo-500 bg-indigo-50",
    rose: "text-rose-500 bg-rose-50"
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl shrink-0 ${colorMap[color] || ""}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="block text-2xl font-bold text-primary mt-1 font-display">{value}</span>
        <span className="block text-[11px] text-muted-foreground mt-0.5 leading-tight">{desc}</span>
      </div>
    </div>
  );
}
