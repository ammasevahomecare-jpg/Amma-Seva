import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { 
  Trash2, RefreshCw, Mail, Phone, MapPin, ClipboardList, 
  Users, Calendar, DollarSign, ShieldAlert, LogOut, CheckCircle2, 
  XCircle, Edit3, Save, Check, LayoutDashboard, CalendarDays,
  UserCheck, MessageSquare, Sliders, Bell, Search, Settings as SettingsIcon,
  ChevronRight, TrendingDown, ArrowUpRight
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Control Center — Amma Seva" },
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
  const navigate = useNavigate();

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("ammaseva_admin_token"));
  const [loginEmail, setLoginEmail] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [authStep, setAuthStep] = useState<"email" | "otp">("email");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Dashboard layout/navigation state
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "caregivers" | "enquiries" | "services">("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Database states
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
    if (!token) {
      navigate({ to: "/login" });
    }
  }, [navigate, isLoggedIn]);

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

  useEffect(() => {
    if (isLoggedIn) {
      fetchDashboardData();
    }
  }, [isLoggedIn]);

  // Handle OTP request submit
  const handleRequestOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginEmail) {
      setLoginError("Please enter your admin email address.");
      return;
    }

    setLoginError(null);
    setIsSendingOtp(true);
    setOtpSentMessage(null);

    fetch("/api/admin/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to dispatch verification email.");
        }
        return data;
      })
      .then((data) => {
        if (data.success) {
          setAuthStep("otp");
          setOtpSentMessage("Verification code has been sent to " + loginEmail);
          setCountdown(30);
          setLoginError(null);
        }
      })
      .catch((err) => {
        setLoginError(err.message || "Failed to connect to backend service.");
      })
      .finally(() => {
        setIsSendingOtp(false);
      });
  };

  // Handle login submit (verify OTP)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtp || loginOtp.length < 6) {
      setLoginError("Please enter the complete 6-digit OTP code.");
      return;
    }
    setLoginError(null);

    fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginEmail, otp: loginOtp })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Invalid verification OTP code.");
        }
        return data;
      })
      .then((data) => {
        if (data.success) {
          localStorage.setItem("ammaseva_admin_token", data.token);
          setIsLoggedIn(true);
          setLoginOtp("");
          setLoginError(null);
          setOtpSentMessage(null);
        }
      })
      .catch((err) => {
        setLoginError(err.message || "Failed to verify admin credentials.");
      });
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("ammaseva_admin_token");
    setIsLoggedIn(false);
    navigate({ to: "/login" });
  };

  // Handle caregiver status change
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

  const servicesCatalog = [
    { title: "Elderly Care at Home", description: "Assisting seniors with daily tasks and medication routine", price: "₹1,200/day" },
    { title: "Mother & Baby Care", description: "Postnatal care for new moms and newborn health checks", price: "₹2,500/day" },
    { title: "Home Nursing Services", description: "Post-surgery care, wound dressing, vitals tracking", price: "₹1,500/visit" },
    { title: "Injection Services", description: "IV, IM, and subcutaneous drug administrations", price: "₹300/visit" },
    { title: "ICU/Home Recovery Support", description: "Critical home support with specialized medical staff", price: "₹4,500/day" }
  ];

  // Calculated overview stats
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === "Paid" && b.status !== "Cancelled")
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const pendingBookingsCount = bookings.filter(b => b.status === "Pending").length;
  const verifiedCaregiversCount = caregivers.filter(c => c.status === "Verified").length;

  // Search filtering logic
  const filteredBookings = bookings.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone.includes(searchQuery) ||
    b.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCaregivers = caregivers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEnquiries = enquiries.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.phone.includes(searchQuery) ||
    (e.service && e.service.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col lg:flex-row">
      
      {/* LEFT SIDEBAR Layout (White base, grey border) */}
      <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-slate-200/60 flex flex-col shrink-0">
        
        {/* Brand Header */}
        <div className="px-6 py-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-md">
            A
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-primary">
              Amma Seva
            </span>
            <p className="text-[9px] text-slate-400 tracking-widest uppercase font-semibold">Systems admin</p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="p-4 space-y-1.5 flex-1">
          {[
            { id: "overview", label: "Dashboard", icon: LayoutDashboard },
            { id: "bookings", label: "Manage Bookings", icon: CalendarDays },
            { id: "caregivers", label: "Staff Approvals", icon: UserCheck },
            { id: "enquiries", label: "Customer Leads", icon: MessageSquare },
            { id: "services", label: "Catalog & Pricing", icon: Sliders }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-100 text-primary"
                    : "text-slate-600 hover:bg-slate-55 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? "text-primary" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Status Indicators & Sign Out bottom */}
        <div className="p-4 border-t border-slate-100 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">MySQL Database</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="h-3 w-3" /> Live
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Environment</span>
              <span className="font-semibold text-slate-700">Production</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-white text-destructive text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN PANEL Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-slate-200/60 px-6 sm:px-8 flex items-center justify-between gap-4 shrink-0">
          
          {/* Search box (Metoxi style) */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings, caregivers or enquiries..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:border-gold transition-colors text-slate-700"
            />
          </div>

          {/* User profile / notification buttons */}
          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={fetchDashboardData}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative"
              title="Sync Database"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            
            <div className="h-9 w-9 rounded-full bg-slate-900 border border-slate-200 flex items-center justify-center text-sm font-bold text-white uppercase select-none">
              A
            </div>
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <main className="p-6 sm:p-8 flex-1 overflow-y-auto">
          
          {/* Dashboard Overview tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* Row 1: Weekly bookings line chart & Metric widgets */}
              <div className="grid gap-6 lg:grid-cols-3">
                
                {/* Weekly bookings line chart Card */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm col-span-1 lg:col-span-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="block text-3xl font-bold font-display text-slate-900">₹{totalRevenue.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 mt-1 block">Average Weekly Sales</span>
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                        <TrendingDown className="h-3.5 w-3.5" /> 8.6%
                      </span>
                    </div>
                  </div>
                  
                  {/* SVG line chart representation */}
                  <div className="h-28 mt-6">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 80 Q 50 20 100 60 T 200 30 T 300 50"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 0 80 Q 50 20 100 60 T 200 30 T 300 50 L 300 100 L 0 100 Z"
                        fill="url(#chartGradient)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Grid of 4 horizontal cards (Metoxi style) */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm col-span-1 lg:col-span-2 grid grid-cols-2 gap-y-8 gap-x-6">
                  <HorizontalMetric icon={Calendar} iconColor="text-indigo-500 bg-indigo-50" label="Bookings" value={bookings.length.toString()} />
                  <HorizontalMetric icon={DollarSign} iconColor="text-emerald-500 bg-emerald-50" label="Revenue" value={`₹${totalRevenue.toLocaleString()}`} />
                  <HorizontalMetric icon={Users} iconColor="text-rose-500 bg-rose-50" label="Nurses" value={caregivers.length.toString()} />
                  <HorizontalMetric icon={ClipboardList} iconColor="text-amber-500 bg-amber-50" label="Inquiries" value={enquiries.length.toString()} />
                </div>
              </div>

              {/* Row 2: Sales comparison double bar chart & progress circles */}
              <div className="grid gap-6 lg:grid-cols-3">
                
                {/* Users progress cards */}
                <div className="grid gap-6 col-span-1">
                  
                  {/* Total Users bar chart widget */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="block text-2xl font-bold font-display text-slate-900">{caregivers.length} Staff</span>
                        <span className="text-xs text-slate-400">Total Caregivers</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+12.5%</span>
                    </div>
                    {/* SVG mini bar chart */}
                    <div className="h-16 flex items-end justify-between gap-1.5 pt-2">
                      {[15, 30, 45, 20, 35, 50, 40, 25, 45, 60, 55, 65].map((val, idx) => (
                        <div key={idx} className="bg-rose-500 rounded-t-sm w-full" style={{ height: `${val}%` }} />
                      ))}
                    </div>
                  </div>

                  {/* Active Users progress gauge */}
                  <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex items-center justify-between gap-4">
                    <div>
                      <span className="block text-2xl font-bold font-display text-slate-900">78%</span>
                      <span className="text-xs text-slate-400">Caregiver Utilization</span>
                      <p className="text-[10px] text-slate-400 mt-2">Active nurses assigned to active shifts</p>
                    </div>
                    {/* SVG circular progress */}
                    <div className="relative w-18 h-18 shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-indigo-600"
                          strokeWidth="3.5"
                          strokeDasharray="78, 100"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Sales & Views Double Bar Chart Card (Metoxi style) */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm col-span-1 lg:col-span-2 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Sales &amp; Leads</h3>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-indigo-600" /> Bookings</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-purple-400" /> Enquiries</span>
                    </div>
                  </div>

                  {/* SVG Double Bar Chart */}
                  <div className="h-44 flex items-end justify-between gap-6 px-2">
                    {[
                      { b: 40, e: 30, m: "Jan" },
                      { b: 20, e: 45, m: "Feb" },
                      { b: 85, e: 60, m: "Mar" },
                      { b: 30, e: 40, m: "Apr" },
                      { b: 50, e: 45, m: "May" },
                      { b: 40, e: 30, m: "Jun" },
                      { b: 60, e: 55, m: "Jul" },
                      { b: 30, e: 25, m: "Aug" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex items-end justify-center gap-1 h-32">
                          <div className="bg-indigo-600 rounded-t-sm w-3.5" style={{ height: `${item.b}%` }} />
                          <div className="bg-purple-400 rounded-t-sm w-3.5" style={{ height: `${item.e}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">{item.m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Target Goal Progress Card */}
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm col-span-1 md:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-lg font-bold text-slate-900 font-display">₹65,129 Goal Progress</span>
                    <p className="text-xs text-slate-400">Total platform revenue target set for Q3 2026</p>
                  </div>
                  
                  <div className="flex-1 max-w-md w-full">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-1.5">
                      <span>78% completed</span>
                      <span>₹65,129 Goal</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: "78%" }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Bookings View panel */}
          {activeTab === "bookings" && (
            <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/55 text-xs text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-4 px-6">Patient details</th>
                      <th className="py-4 px-6">Service &amp; Shift</th>
                      <th className="py-4 px-6">Date &amp; Time</th>
                      <th className="py-4 px-6">Assigned Nurse</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Payment</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => {
                      const isEditing = editingBookingId === b.id;
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-primary font-display text-base">{b.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{b.phone}</div>
                            <div className="text-xs text-slate-400 italic mt-0.5 truncate max-w-xs">{b.address}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-800">{b.service}</div>
                            <div className="text-[10px] text-gold font-extrabold uppercase tracking-wider mt-0.5">{b.duration}</div>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500">
                            <div>{b.date}</div>
                            <div className="mt-0.5">{b.time} AM/PM</div>
                          </td>
                          <td className="py-4 px-6">
                            {isEditing ? (
                              <select
                                value={editAssignedStaff}
                                onChange={(e) => setEditAssignedStaff(e.target.value)}
                                className="text-xs rounded border border-slate-200 p-1.5 outline-none bg-background focus:ring-1 focus:ring-gold"
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
                          <td className="py-4 px-6">
                            {isEditing ? (
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="text-xs rounded border border-slate-200 p-1.5 outline-none bg-background focus:ring-1 focus:ring-gold"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                b.status === "Confirmed" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                                b.status === "Cancelled" ? "bg-rose-50 text-rose-800 border border-rose-100" :
                                "bg-amber-50 text-amber-800 border border-amber-100"
                              }`}>
                                {b.status}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            {isEditing ? (
                              <div className="space-y-1">
                                <div className="text-xs font-bold">₹{b.amount}</div>
                                <select
                                  value={editPaymentStatus}
                                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                                  className="text-[10px] rounded border border-slate-200 p-1 bg-background"
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
                          <td className="py-4 px-6 text-right">
                            {isEditing ? (
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => saveBookingEdit(b.id)}
                                  className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                                  title="Save"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingBookingId(null)}
                                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                  title="Cancel"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditBooking(b)}
                                className="px-3 py-1 rounded-xl bg-slate-50 hover:bg-gold hover:text-white border border-slate-200 text-gold text-xs font-semibold flex items-center gap-1.5 ml-auto cursor-pointer transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
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

          {/* Caregivers approvals panel */}
          {activeTab === "caregivers" && (
            <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/55 text-xs text-slate-400 uppercase font-bold tracking-wider">
                      <th className="py-4 px-6">Staff details</th>
                      <th className="py-4 px-6">Specialty &amp; Experience</th>
                      <th className="py-4 px-6">Timings / Details</th>
                      <th className="py-4 px-6">Verification</th>
                      <th className="py-4 px-6 text-right">Approve / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCaregivers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-primary font-display text-base">{c.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{c.phone}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{c.email}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-800">{c.specialty}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{c.experience} years experience</div>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500">
                          <div>Documents: Aadhaar, PAN Uploaded</div>
                          <div className="mt-0.5 text-[10px] text-indigo-500 font-bold uppercase">Background check: Pending</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded ${
                            c.status === "Verified" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                            c.status === "Rejected" ? "bg-rose-50 text-rose-800 border border-rose-100" :
                            "bg-amber-50 text-amber-800 border border-amber-100"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex gap-2 justify-end">
                            {c.status !== "Verified" && (
                              <button
                                onClick={() => handleUpdateCaregiver(c.id, "Verified")}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-500 border border-slate-200 text-emerald-600 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Check className="h-4.5 w-4.5" /> Verify
                              </button>
                            )}
                            {c.status !== "Rejected" && (
                              <button
                                onClick={() => handleUpdateCaregiver(c.id, "Rejected")}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-500 border border-slate-200 text-rose-600 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <XCircle className="h-4.5 w-4.5" /> Reject
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

          {/* Enquiries Leads panel */}
          {activeTab === "enquiries" && (
            <div className="grid gap-6">
              {filteredEnquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col md:flex-row justify-between gap-6"
                >
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                        ID: {enq.id}
                      </span>
                      {enq.service && (
                        <span className="text-xs font-bold text-primary bg-gold/15 text-gold border border-gold/25 px-2.5 py-0.5 rounded-full">
                          {enq.service}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(enq.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-primary font-display">{enq.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
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
                      <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-sm text-slate-600 italic leading-relaxed">
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

          {/* Services Tab panel */}
          {activeTab === "services" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
                <h3 className="text-xl font-bold text-primary font-display">Active Service Catalog</h3>
                <span className="text-xs text-slate-400">Configure standard prices below.</span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {servicesCatalog.map((service, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-lg font-semibold text-primary font-display">{service.title}</h4>
                        <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100">{service.price}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{service.description}</p>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={() => alert(`Pricing updates are locked in preview mode.`)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Adjust pricing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// Side widget helper for Metric grids
function HorizontalMetric({ icon: Icon, iconColor, label, value }: { icon: any; iconColor: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full shrink-0 ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <span className="block text-2xl font-bold font-display text-slate-900 leading-none">{value}</span>
        <span className="block text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}
