import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, Component, type ErrorInfo, type ReactNode } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { validateName, validatePhone, validateEmail, validateAddress, validateAadhaar, validatePAN, sanitizeIndianPhone, sanitizeName } from "@/lib/validation";
import { downloadIdCardImage, getCleanIdCardDesignation } from "@/lib/idCardDownload";
import logoAsset from "@/assets/amma-seva-logo.png";
import { 
  Trash2, RefreshCw, Mail, Phone, MapPin, ClipboardList, 
  Users, Calendar, DollarSign, ShieldAlert, LogOut, CheckCircle2, 
  XCircle, Edit3, Save, Check, LayoutDashboard, CalendarDays,
  UserCheck, MessageSquare, Sliders, Bell, Search, Plus, Send, TrendingDown,
  ArrowUpRight, Star, BookOpen, HelpCircle, Menu, X, Image, Coins, Clock,
  Briefcase, Car, Eye, MessageCircle, FileText, Sparkles,
  GraduationCap, CreditCard, ShieldCheck, FileCheck, User, ExternalLink,
  Gift, Copy, Share2, Heart, AlertTriangle, Zap, Navigation, Printer, Download, BadgeCheck,
  Receipt, Landmark, FileSpreadsheet, Filter
} from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// Helper to compute / format Referral Code (FIRSTNAME + LAST 4 DIGITS OF PHONE)
export function getCaregiverReferralCode(c: { name?: string; phone?: string; uniqueId?: string; referCode?: string; referralCode?: string } | null | undefined): string {
  if (!c) return "STAFF0000";
  if (c.referCode && !c.referCode.startsWith("AMMASEVA-")) return c.referCode;
  if (c.referralCode && !c.referralCode.startsWith("AMMASEVA-")) return c.referralCode;
  if (c.uniqueId && !c.uniqueId.startsWith("AMMASEVA-")) return c.uniqueId;
  const rawName = (c.name || "STAFF").trim();
  const nameWithoutTitle = rawName.replace(/^(dr\.?|mr\.?|mrs\.?|ms\.?|sister|nurse)\s+/i, "").trim();
  const firstName = (nameWithoutTitle.split(/\s+/)[0] || "STAFF").replace(/[^a-zA-Z]/g, "").toUpperCase() || "STAFF";
  const cleanPhone = (c.phone || "").replace(/[^0-9]/g, "");
  const last4 = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : (cleanPhone.padEnd(4, "0") || "0000");
  return `${firstName}${last4}`;
}

// Helper: format any time string (e.g. "09:00 AM", "9:00", "14:30") to HH:mm for HTML5 <input type="time">
export function formatTimeTo24H(val: string): string {
  if (!val) return "09:00";
  const cleaned = val.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return cleaned.slice(0, 5);
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3] ? match[3].toUpperCase() : null;
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

// Helper: format 24H HH:mm to friendly AM/PM string
export function formatTimeTo12H(val: string): string {
  if (!val) return "09:00 AM";
  const match = val.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return val;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

interface AdminErrorBoundaryProps {
  children: ReactNode;
  activeTab: string;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AdminErrorBoundary extends Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): AdminErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || "Render error" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AmmaSeva Admin ErrorBoundary] Caught render error in tab:", this.props.activeTab, error, errorInfo);
  }

  componentDidUpdate(prevProps: AdminErrorBoundaryProps) {
    if (prevProps.activeTab !== this.props.activeTab && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: "" });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-amber-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ⚠️
          </div>
          <h3 className="text-lg font-bold text-slate-800">Display adjusted for this section</h3>
          <p className="text-xs text-slate-500">
            A temporary display error in &ldquo;{this.props.activeTab}&rdquo; was safely intercepted. You can retry or reload.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => this.setState({ hasError: false, errorMessage: "" })}
              className="px-4 py-2 bg-[#1e2a5a] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#283875] transition-colors"
            >
              Retry View
            </button>
            <button
              onClick={() => { window.location.href = "/admin"; }}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  assignedStaffId?: number | null;
  assignedStaffRole?: string | null;
  assignedStaffPhone?: string | null;
  amount: number;
  baseAmount?: number;
  gstAmount?: number;
  paymentStatus: string;
  createdAt: string;
  patientName?: string;
  patientAge?: string;
  patientNeeds?: string;
  prescription?: string;
  googleMapLocation?: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: string;
  isReviewed?: boolean;
  review?: {
    rating: number;
    comment?: string;
  };
  advancePaid?: number;
  balanceAmount?: number;
  caretakerPayout?: number | null;
  caretakerPayoutStatus?: string;
  caretakerPayoutMethod?: string;
  caretakerPayoutRef?: string;
  email?: string;
  userId?: number;
  isMtp?: boolean | number;
  mtpAcceptedAt?: string | null;
  mtpAcceptedBy?: string | null;
  mtpAcceptedById?: number | null;
  mtpAcceptedPhone?: string | null;
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
  aadhaar?: string;
  pan?: string;
  certificates?: string;
  profilePhoto?: string;
  experienceDetails?: string;
  workingLocations?: string;
  availableTimings?: string;
  state?: string;
  city?: string;
  googleMapLocation?: string;
  experienceCertificate?: string;
  policeVerification?: string;
  additionalCertificates?: string;
  rating?: number | string;
  reviews?: any[];
  uniqueId?: string;
  referCode?: string;
  referralCode?: string;
  referredBy?: string;
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

interface UserRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface ServiceRecord {
  id: number;
  title: string;
  description: string;
  price: string;
  category: string;
  image?: string;
  advance?: number | string;
  unit?: string;
  rate?: number;
  isMtp?: boolean;
}

interface NotificationRecord {
  id: number;
  recipient: string;
  message: string;
  type: string;
  sentAt: string;
}

interface ReferralReferee {
  id: number;
  candidateId?: number;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  experience: number;
  status: string;
  joinedAt: string;
  state?: string;
  city?: string;
  googleMapLocation?: string;
  experienceDetails?: string;
  workingLocations?: string;
  availableTimings?: string;
  aadhaar?: string;
  pan?: string;
  certificates?: string;
  profilePhoto?: string;
  experienceCertificate?: string;
  policeVerification?: string;
  additionalCertificates?: string;
  referredBy: string;
  referrerName: string;
  referrerPhone: string;
  referrerCode: string;
}

interface ReferrerGroup {
  id: number | null;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  status: string;
  joinedAt: string;
  referCode: string;
  profilePhoto?: string;
  city?: string;
  state?: string;
  referredCount: number;
  verifiedCount: number;
  pendingCount: number;
  referees: ReferralReferee[];
}

interface ReferralsData {
  summary: {
    totalCaregivers: number;
    activeReferrersCount: number;
    totalReferred: number;
    totalVerified: number;
    totalPending: number;
  };
  referrers: ReferrerGroup[];
  allReferredCandidates: ReferralReferee[];
}

function AdminPage() {
  const navigate = useNavigate();

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("ammaseva_admin_token"));

  const handleLogout = () => {
    localStorage.removeItem("ammaseva_admin_token");
    setIsLoggedIn(false);
    navigate({ to: "/login" });
  };

  const VALID_ADMIN_TABS = [
    "overview", "bookings", "accounts", "invoices", "caregivers", "referrals", "mtps", "id-cards",
    "users", "services", "payments", "salaries", "notifications", 
    "enquiries", "blogs", "faqs", "gallery"
  ] as const;
  type AdminTab = typeof VALID_ADMIN_TABS[number];

  const getInitialAdminTab = (): AdminTab => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const paramTab = searchParams.get("tab") as AdminTab;
      if (paramTab && VALID_ADMIN_TABS.includes(paramTab)) {
        return paramTab;
      }
      const savedTab = localStorage.getItem("ammaseva_admin_active_tab") as AdminTab;
      if (savedTab && VALID_ADMIN_TABS.includes(savedTab)) {
        return savedTab;
      }
    } catch (e) {
      console.error("Failed to read initial admin tab:", e);
    }
    return "overview";
  };

  type MtpSubTab = "applicants" | "tasks" | "pricing";

  const getInitialMtpSubTab = (): MtpSubTab => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const sub = searchParams.get("subtab") as MtpSubTab;
      if (sub === "applicants" || sub === "tasks" || sub === "pricing") return sub;
      const saved = localStorage.getItem("ammaseva_admin_mtp_subtab") as MtpSubTab;
      if (saved === "applicants" || saved === "tasks" || saved === "pricing") return saved;
    } catch (e) {}
    return "applicants";
  };

  // Navigation and Search
  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialAdminTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Database lists
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [mtps, setMTPs] = useState<any[]>([]);
  const [mtpTasks, setMtpTasks] = useState<any[]>([]);
  const [mtpPrices, setMtpPrices] = useState<any[]>([]);
  const [mtpSubTab, setMtpSubTab] = useState<MtpSubTab>(getInitialMtpSubTab);

  // Referral Network State
  const [referralsData, setReferralsData] = useState<ReferralsData | null>(null);
  const [referralsViewMode, setReferralsViewMode] = useState<"by-referrer" | "all-candidates">("by-referrer");
  const [referralsSearch, setReferralsSearch] = useState("");
  const [referralsStatusFilter, setReferralsStatusFilter] = useState("All");
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<ReferralReferee | null>(null);
  const [expandedReferrerCode, setExpandedReferrerCode] = useState<string | null>(null);

  // MTP Filter & Detail state
  const [mtpSearch, setMtpSearch] = useState("");
  const [mtpStatusFilter, setMtpStatusFilter] = useState("All");
  const [mtpLocalityFilter, setMtpLocalityFilter] = useState("All");
  const [selectedMTPDetail, setSelectedMTPDetail] = useState<any | null>(null);
  const [mtpAdminNotes, setMtpAdminNotes] = useState("");

  // MTP Task Field Modal State
  const [isMtpTaskModalOpen, setIsMtpTaskModalOpen] = useState(false);
  const [mtpTaskModalMode, setMtpTaskModalMode] = useState<"add" | "edit">("add");
  const [editingMtpTaskId, setEditingMtpTaskId] = useState<number | null>(null);
  const [taskIcon, setTaskIcon] = useState("🚗");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskShiftType, setTaskShiftType] = useState("Part-time / On-Demand");
  const [taskEarningEstimate, setTaskEarningEstimate] = useState("₹300 - ₹1,500 / task");

  // MTP Price Package Modal State
  const [isMtpPriceModalOpen, setIsMtpPriceModalOpen] = useState(false);
  const [mtpPriceModalMode, setMtpPriceModalMode] = useState<"add" | "edit">("add");
  const [editingMtpPriceId, setEditingMtpPriceId] = useState<number | null>(null);
  const [priceHours, setPriceHours] = useState(2);
  const [priceLabel, setPriceLabel] = useState("2 Hours Package");
  const [priceBase, setPriceBase] = useState(300);
  const [priceAdvancePercentage, setPriceAdvancePercentage] = useState(20);
  const [priceGstRate, setPriceGstRate] = useState(18);
  const [priceDescription, setPriceDescription] = useState("");
  const [priceIsActive, setPriceIsActive] = useState(true);
  const [isSavingMtpPrice, setIsSavingMtpPrice] = useState(false);

  // Staff ID Cards & Credentials State
  interface StaffIdCard {
    id: string;
    originalId: number;
    type: "employee" | "caregiver" | "mtp";
    source: "employees" | "caregivers" | "mtps";
    staffCategory: "EMP" | "MTP" | "NUR" | "CGV";
    categoryLabel: string;
    employeeId: string;
    name: string;
    phone: string;
    email: string;
    designation: string;
    specialty?: string;
    profilePhoto?: string;
    status: string;
    joinedAt: string;
    state?: string;
    city?: string;
  }

  const [idCards, setIdCards] = useState<StaffIdCard[]>([]);
  const [idCardCategoryTab, setIdCardCategoryTab] = useState<"ALL" | "EMP" | "MTP" | "NUR" | "CGV">("ALL");
  const [idCardSearch, setIdCardSearch] = useState("");
  const [selectedCardForView, setSelectedCardForView] = useState<StaffIdCard | null>(null);

  // Issue New Employee Modal State
  const [isIssueEmployeeModalOpen, setIsIssueEmployeeModalOpen] = useState(false);
  const [newEmpCategory, setNewEmpCategory] = useState<"EMP" | "MTP" | "NUR" | "CGV">("EMP");
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpPhone, setNewEmpPhone] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpDesignation, setNewEmpDesignation] = useState("Operations Coordinator");
  const [newEmpPhoto, setNewEmpPhoto] = useState("");
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);

  // Edit Staff ID Card Modal State
  const [isEditIdCardModalOpen, setIsEditIdCardModalOpen] = useState(false);
  const [editingCardData, setEditingCardData] = useState<StaffIdCard | null>(null);
  const [editCardName, setEditCardName] = useState("");
  const [editCardDesignation, setEditCardDesignation] = useState("");
  const [editCardCategory, setEditCardCategory] = useState<"EMP" | "MTP" | "NUR" | "CGV">("NUR");
  const [editCardPhoto, setEditCardPhoto] = useState("");
  const [editCardStatus, setEditCardStatus] = useState("Verified");
  const [isSavingCardEdit, setIsSavingCardEdit] = useState(false);

  // WhatsApp Pay Balance Modal State
  const [whatsAppModalBooking, setWhatsAppModalBooking] = useState<any | null>(null);
  const [isSendingWhatsAppReminder, setIsSendingWhatsAppReminder] = useState(false);
  const [whatsAppReminderStatus, setWhatsAppReminderStatus] = useState<string | null>(null);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isCopiedMessage, setIsCopiedMessage] = useState(false);
  const [copiedBookingLinkId, setCopiedBookingLinkId] = useState<number | string | null>(null);

  const handleCopyBookingPayLink = (bookingId: number | string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in";
    const payUrl = `${origin}/pay-balance?id=${bookingId}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(payUrl);
      setCopiedBookingLinkId(bookingId);
      setTimeout(() => {
        setCopiedBookingLinkId(prev => (prev === bookingId ? null : prev));
      }, 2500);
    }
  };

  const handleOpenWhatsAppPayModal = (b: any) => {
    setWhatsAppModalBooking(b);
    setWhatsAppReminderStatus(null);
    setIsCopiedLink(false);
    setIsCopiedMessage(false);
  };

  const getWhatsAppPayText = (b: any) => {
    if (!b) return "";
    const customerName = b.name || b.patientName || "Customer";
    const bookingId = b.id;
    const isPaid = String(b.paymentStatus || "").toLowerCase() === "paid" || Number(b.balanceAmount) <= 0;
    const totalAmt = Number(b.amount || 0);
    const balance = isPaid ? 0 : (Number(b.balanceAmount) || Math.max(0, totalAmt - Number(b.advancePaid || 0)));
    const advance = isPaid ? totalAmt : Number(b.advancePaid || 0);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in";
    const payUrl = `${baseUrl}/pay-balance?id=${bookingId}`;

    if (isPaid || balance <= 0) {
      return `🙏 Namaste *${customerName}*,\n\nThank you for choosing *Amma Seva Home Healthcare*!\n\n📋 *Payment Receipt & Confirmation:*\n• *Booking ID:* #${bookingId}\n• *Service:* ${b.service || "Healthcare"}\n• *Schedule:* ${b.date || "Scheduled"}${b.time ? " at " + b.time : ""}\n• *Total Shift Value:* ₹${totalAmt.toLocaleString("en-IN")}\n• *Amount Paid:* ₹${totalAmt.toLocaleString("en-IN")}\n• *Payment Status:* *FULLY PAID (SETTLED) ✓*\n• *Outstanding Balance:* *₹0.00*\n\n📄 *View/Download Your Digital Invoice:*\n👉 ${payUrl}\n\nNeed assistance? Call our 24/7 Helpline at +91 94905 87575.`;
    }

    return `🙏 Namaste *${customerName}*,\n\nThank you for choosing *Amma Seva Home Healthcare*!\n\n📋 *Care Reservation Details:*\n• *Booking ID:* #${bookingId}\n• *Service:* ${b.service || "Healthcare"}\n• *Schedule:* ${b.date || "Scheduled"}${b.time ? " at " + b.time : ""}\n• *Total Shift Value:* ₹${totalAmt.toLocaleString("en-IN")}\n• *Advance Paid:* ₹${advance.toLocaleString("en-IN")}\n• *Pending Balance Due:* *₹${balance.toLocaleString("en-IN")}*\n\n💳 *Click here to pay balance securely online:*\n👉 ${payUrl}\n_(Google Pay, PhonePe, UPI, Cards, NetBanking accepted)_\n\nNeed assistance? Call our 24/7 Coordinator at +91 94905 87575.`;
  };

  const handleOpenWhatsAppDirect = (b: any) => {
    if (!b) return;
    const rawPhone = String(b.phone || "").replace(/\D/g, "").slice(-10);
    const targetPhone = rawPhone.length === 10 ? `91${rawPhone}` : "919490587575";
    const message = getWhatsAppPayText(b);
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleTriggerServerWhatsAppReminder = async (b: any) => {
    if (!b) return;
    setIsSendingWhatsAppReminder(true);
    setWhatsAppReminderStatus(null);
    try {
      const token = localStorage.getItem("ammaseva_token") || localStorage.getItem("token");
      const res = await fetch(`/api/admin/booking/${b.id}/send-balance-reminder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch WhatsApp reminder");
      }
      setWhatsAppReminderStatus("✓ WhatsApp notification successfully sent to customer!");
    } catch (err: any) {
      setWhatsAppReminderStatus("❌ Error: " + err.message);
    } finally {
      setIsSendingWhatsAppReminder(false);
    }
  };

  const [sendingStaffReminderId, setSendingStaffReminderId] = useState<number | string | null>(null);
  const [reminderIntervals, setReminderIntervals] = useState<Record<string | number, string>>({});

  const handleSendStaffReminder = async (b: any, customInterval?: string) => {
    if (!b || !b.id) return;
    if (!b.assignedStaff) {
      alert("⚠️ No staff member has been allocated for this shift yet.");
      return;
    }
    const interval = customInterval || reminderIntervals[b.id] || "1 hour";
    const token = localStorage.getItem("ammaseva_admin_token");
    setSendingStaffReminderId(b.id);
    try {
      const res = await fetch(`/api/admin/booking/${b.id}/send-staff-reminder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ interval })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch staff reminder");
      }

      const intervalLabel = data.interval || (interval.includes("10") ? "10 Minutes" : interval.includes("30") ? "30 Minutes" : interval.includes("24") ? "24 Hours" : interval.includes("2") ? "2 Hours" : "1 Hour");

      // Update local state to mark reminder sent with interval
      setBookings((prev: any[]) => prev.map(item => item.id === b.id ? { 
        ...item, 
        staffReminderSent: 1, 
        staffReminderSentAt: new Date().toISOString(),
        staffReminderInterval: intervalLabel
      } : item));

      alert(`✅ ${data.message || `WhatsApp ${intervalLabel} shift reminder successfully dispatched to ${b.assignedStaff}!`}`);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSendingStaffReminderId(null);
    }
  };

  // ==========================================
  // REAL-TIME INVOICE & BILLING GENERATOR STATE
  // ==========================================
  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = useState<string>("custom");
  const [invoiceCustomerName, setInvoiceCustomerName] = useState<string>("");
  const [invoiceCustomerPhone, setInvoiceCustomerPhone] = useState<string>("");
  const [invoiceCustomerEmail, setInvoiceCustomerEmail] = useState<string>("");
  const [invoicePatientName, setInvoicePatientName] = useState<string>("");
  const [invoicePatientAge, setInvoicePatientAge] = useState<string>("");
  const [invoiceService, setInvoiceService] = useState<string>("Elder Care Assistant (24 Hours)");
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [invoiceTime, setInvoiceTime] = useState<string>("08:00 AM");
  const [invoiceDuration, setInvoiceDuration] = useState<string>("24 Hours Shift");
  const [invoiceAddress, setInvoiceAddress] = useState<string>("Hyderabad, Telangana");
  const [invoiceTotalAmount, setInvoiceTotalAmount] = useState<number | string>(600);
  const [invoiceAdvancePaid, setInvoiceAdvancePaid] = useState<number | string>(100);
  const [invoiceBalanceAmount, setInvoiceBalanceAmount] = useState<number | string>(608);
  // GST Tax Mode: "exclusive" (Base + 18% GST Extra - Amma Seva standard) | "inclusive" (18% included) | "exempt" (0% GST)
  const [invoiceTaxMode, setInvoiceTaxMode] = useState<"inclusive" | "exclusive" | "exempt">("exclusive");
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState<"cash" | "bank_account" | "upi" | "razorpay" | "pay_on_service">("cash");
  const [invoicePaymentStatus, setInvoicePaymentStatus] = useState<"Paid" | "Advance Paid" | "Unpaid">("Advance Paid");
  const [invoiceTransactionId, setInvoiceTransactionId] = useState<string>(() => `CASH-REC-${Date.now().toString().slice(-4)}`);
  const [invoiceNotes, setInvoiceNotes] = useState<string>("Healthcare shift service executed and payment received.");
  const [isSavingInvoice, setIsSavingInvoice] = useState<boolean>(false);
  const [invoiceStatusMsg, setInvoiceStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>("");

  // Helper to compute tax and totals based on selected mode
  const getInvoiceTaxDetails = (amountVal: number | string, taxMode: "inclusive" | "exclusive" | "exempt") => {
    const num = Math.max(0, Number(amountVal) || 0);
    if (taxMode === "exempt") {
      return {
        baseAmount: num,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        gstAmount: 0,
        totalAmount: num,
        rateLabel: "0% GST Exempt",
        cgstRateText: "0%",
        sgstRateText: "0%",
        igstRateText: "0%",
        isExempt: true,
        isInclusive: false,
        isExclusive: false
      };
    }
    if (taxMode === "inclusive") {
      // Amount entered is gross total with 18% IGST included inside it
      const baseAmount = Math.round(num / 1.18);
      const gstAmount = Math.max(0, num - baseAmount);
      return {
        baseAmount,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: gstAmount,
        gstAmount,
        totalAmount: num,
        rateLabel: "18% IGST Included",
        cgstRateText: "0%",
        sgstRateText: "0%",
        igstRateText: "18.0%",
        isExempt: false,
        isInclusive: true,
        isExclusive: false
      };
    }
    // DEFAULT (taxMode === "exclusive"):
    // In Amma Seva, user pays: Base Service Rate + 18% IGST!
    const baseAmount = num;
    const gstAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + gstAmount;
    return {
      baseAmount,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: gstAmount,
      gstAmount,
      totalAmount,
      rateLabel: "Base + 18% IGST (Tax Extra)",
      cgstRateText: "0%",
      sgstRateText: "0%",
      igstRateText: "18.0%",
      isExempt: false,
      isInclusive: false,
      isExclusive: true
    };
  };

  const handleSelectBookingForInvoice = (bookingIdStr: string) => {
    setSelectedInvoiceBookingId(bookingIdStr);
    setInvoiceStatusMsg(null);
    if (bookingIdStr === "custom") {
      setInvoiceCustomerName("");
      setInvoiceCustomerPhone("");
      setInvoiceCustomerEmail("");
      setInvoicePatientName("");
      setInvoicePatientAge("");
      setInvoiceService("Elder Care Assistant (24 Hours)");
      setInvoiceDate(new Date().toISOString().split("T")[0]);
      setInvoiceTime("08:00 AM");
      setInvoiceDuration("1 Shift");
      setInvoiceAddress("");
      setInvoiceTaxMode("exclusive");
      setInvoiceTotalAmount(600);
      setInvoiceAdvancePaid(100);
      setInvoiceBalanceAmount(608); // 600 + 108 - 100 = 608
      setInvoicePaymentMethod("cash");
      setInvoicePaymentStatus("Advance Paid");
      setInvoiceTransactionId(`CASH-REC-${Date.now().toString().slice(-4)}`);
      return;
    }
    const b = bookings.find(item => String(item.id) === String(bookingIdStr));
    if (!b) return;

    setInvoiceCustomerName(b.name || "");
    setInvoiceCustomerPhone(b.phone || "");
    setInvoiceCustomerEmail(b.email || "");
    setInvoicePatientName(b.patientName || b.name || "");
    setInvoicePatientAge(b.patientAge ? String(b.patientAge) : "");
    setInvoiceService(String(b.service || "Healthcare Service").replace(/Medical Transport Partner/gi, "Multi Tasking Professional"));
    setInvoiceDate(b.date || new Date().toISOString().split("T")[0]);
    setInvoiceTime(b.time || "08:00 AM");
    setInvoiceDuration(b.duration || "1 Shift");
    setInvoiceAddress(b.address || "");
    
    const rawAmt = Number(b.amount) || 0;
    const rawBase = b.baseAmount !== undefined && b.baseAmount !== null ? Number(b.baseAmount) : 0;
    const rawGst = b.gstAmount !== undefined && b.gstAmount !== null ? Number(b.gstAmount) : 0;
    
    // In Amma Seva: User pays Base + 18% GST
    let base = 0;
    if (rawBase > 0) {
      base = rawBase;
    } else if (rawGst > 0 && rawAmt > rawGst) {
      base = rawAmt - rawGst;
    } else {
      // The booking amount in Amma Seva represents the Base Service Rate (e.g. ₹600)
      base = rawAmt;
    }

    const gst = Math.round(base * 0.18);
    const tot = base + gst;
    
    const isPaid = b.paymentStatus === "Paid" || (b.advancePaid !== undefined && Number(b.advancePaid) >= tot && tot > 0);
    const adv = isPaid ? tot : (Number(b.advancePaid) || 0);
    const bal = isPaid ? 0 : Math.max(0, tot - adv);

    setInvoiceTaxMode("exclusive");
    setInvoiceTotalAmount(base);
    setInvoiceAdvancePaid(adv);
    setInvoiceBalanceAmount(bal);
    
    const method = String(b.paymentMethod || "").toLowerCase();
    if (method.includes("cash")) {
      setInvoicePaymentMethod("cash");
    } else if (method.includes("bank") || method.includes("account") || method.includes("neft") || method.includes("imps")) {
      setInvoicePaymentMethod("bank_account");
    } else if (method.includes("upi") || method.includes("phonepe") || method.includes("gpay")) {
      setInvoicePaymentMethod("upi");
    } else if (method.includes("razorpay") || method.includes("card") || method.includes("online")) {
      setInvoicePaymentMethod("razorpay");
    } else {
      setInvoicePaymentMethod(bal === 0 ? "cash" : "pay_on_service");
    }
    
    setInvoicePaymentStatus(isPaid ? "Paid" : adv > 0 ? "Advance Paid" : "Unpaid");
    setInvoiceTransactionId(b.transactionId || (b.paymentMethod === "cash" ? `CASH-REC-${b.id}` : `TXN-${b.id}`));
  };

  const handleTaxModeChange = (newMode: "inclusive" | "exclusive" | "exempt") => {
    setInvoiceTaxMode(newMode);
    const taxDetails = getInvoiceTaxDetails(invoiceTotalAmount, newMode);
    const effectiveTotal = taxDetails.totalAmount;
    const adv = Number(invoiceAdvancePaid) || 0;
    const bal = Math.max(0, effectiveTotal - adv);
    setInvoiceBalanceAmount(bal);
    if (adv >= effectiveTotal && effectiveTotal > 0) {
      setInvoicePaymentStatus("Paid");
    } else if (adv > 0) {
      setInvoicePaymentStatus("Advance Paid");
    } else {
      setInvoicePaymentStatus("Unpaid");
    }
  };

  const handleUpdateInvoiceAmounts = (
    newTotal: number | string, 
    newAdv: number | string, 
    newStatus?: "Paid" | "Advance Paid" | "Unpaid",
    forcedTaxMode?: "inclusive" | "exclusive" | "exempt"
  ) => {
    const rawNum = Math.max(0, Number(newTotal) || 0);
    const mode = forcedTaxMode || invoiceTaxMode;
    const taxDetails = getInvoiceTaxDetails(rawNum, mode);
    const effectiveTotal = taxDetails.totalAmount;
    const advNum = Math.max(0, Number(newAdv) || 0);
    const balNum = Math.max(0, effectiveTotal - advNum);
    
    setInvoiceTotalAmount(rawNum);
    setInvoiceAdvancePaid(advNum);
    setInvoiceBalanceAmount(balNum);
    
    if (newStatus) {
      setInvoicePaymentStatus(newStatus);
    } else if (advNum >= effectiveTotal && effectiveTotal > 0) {
      setInvoicePaymentStatus("Paid");
    } else if (advNum > 0) {
      setInvoicePaymentStatus("Advance Paid");
    } else {
      setInvoicePaymentStatus("Unpaid");
    }
  };

  const handleSaveInvoiceToDatabase = async () => {
    if (!selectedInvoiceBookingId || selectedInvoiceBookingId === "custom") {
      setInvoiceStatusMsg({
        type: "success",
        text: "✓ Custom Tax Invoice is ready! You can now Print directly or Share via WhatsApp."
      });
      return;
    }

    setIsSavingInvoice(true);
    setInvoiceStatusMsg(null);
    try {
      const token = localStorage.getItem("ammaseva_token") || localStorage.getItem("token");
      const methodLabel = 
        invoicePaymentMethod === "cash" ? "Cash" :
        invoicePaymentMethod === "bank_account" ? "Bank Account Transfer" :
        invoicePaymentMethod === "upi" ? "UPI (PhonePe/GPay)" :
        invoicePaymentMethod === "razorpay" ? "Razorpay Online" : "Pay on Service";

      const taxDetails = getInvoiceTaxDetails(invoiceTotalAmount, invoiceTaxMode);
      const payload = {
        name: invoiceCustomerName.trim(),
        phone: invoiceCustomerPhone.replace(/\D/g, ""),
        service: invoiceService,
        date: invoiceDate,
        time: invoiceTime,
        duration: invoiceDuration,
        address: invoiceAddress.trim(),
        amount: taxDetails.totalAmount,
        baseAmount: taxDetails.baseAmount,
        gstAmount: taxDetails.gstAmount,
        advancePaid: Number(invoiceAdvancePaid) || 0,
        balanceAmount: Number(invoiceBalanceAmount) || 0,
        paymentStatus: invoicePaymentStatus,
        paymentMethod: methodLabel,
        transactionId: invoiceTransactionId || `REC-${Date.now().toString().slice(-6)}`,
        paymentDate: new Date().toISOString(),
        patientName: invoicePatientName,
        patientAge: invoicePatientAge
      };

      const res = await fetch(`/api/admin/booking/${selectedInvoiceBookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update booking invoice in database");
      }

      setBookings(prev => prev.map(b => {
        if (String(b.id) === String(selectedInvoiceBookingId)) {
          return {
            ...b,
            ...payload
          };
        }
        return b;
      }));

      setInvoiceStatusMsg({
        type: "success",
        text: `✓ Booking #${selectedInvoiceBookingId} invoice & payment record (${methodLabel} - ₹${Number(taxDetails.totalAmount).toLocaleString()}) updated and verified everywhere!`
      });
    } catch (err: any) {
      setInvoiceStatusMsg({
        type: "error",
        text: `❌ Error saving invoice: ${err.message}`
      });
    } finally {
      setIsSavingInvoice(false);
    }
  };

  const handleSendInvoiceWhatsApp = () => {
    const rawPhone = String(invoiceCustomerPhone || "").replace(/\D/g, "").slice(-10);
    const targetPhone = rawPhone.length === 10 ? `91${rawPhone}` : "919490587575";
    const paymentModeLabel = 
      invoicePaymentMethod === "cash" ? "Cash Receipt" :
      invoicePaymentMethod === "bank_account" ? "Bank Account Transfer" :
      invoicePaymentMethod === "upi" ? "UPI (PhonePe / GPay)" :
      invoicePaymentMethod === "razorpay" ? "Razorpay Online Gateway" : "Pay on Service / Escrow";

    const origin = typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in";
    const viewUrl = selectedInvoiceBookingId && selectedInvoiceBookingId !== "custom" 
      ? `${origin}/pay-balance?id=${selectedInvoiceBookingId}` 
      : `${origin}/dashboard`;
    
    const taxDetails = getInvoiceTaxDetails(invoiceTotalAmount, invoiceTaxMode);
    
    const msg = `🙏 *AMMA SEVA HOME HEALTHCARE SERVICES*\n📄 *OFFICIAL GST TAX INVOICE & RECEIPT*\n\n` +
      `📋 *INVOICE DETAILS:*\n` +
      `• *Invoice No:* #INV-2026-${selectedInvoiceBookingId === "custom" ? "CUST" : selectedInvoiceBookingId}\n` +
      `• *Date:* ${invoiceDate}\n` +
      `• *Client Name:* ${invoiceCustomerName || "Valued Customer"}\n` +
      `• *Mobile:* ${invoiceCustomerPhone || "-"}\n` +
      (invoicePatientName ? `• *Patient:* ${invoicePatientName} ${invoicePatientAge ? `(${invoicePatientAge} yrs)` : ""}\n` : "") +
      `• *Service:* ${invoiceService}\n` +
      `• *Schedule:* ${invoiceDate} at ${invoiceTime} (${invoiceDuration})\n` +
      `• *Location:* ${invoiceAddress || "Hyderabad / Vijayawada"}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 *TAX BREAKDOWN (${taxDetails.rateLabel}):*\n` +
      `• *Taxable Base:* ₹${taxDetails.baseAmount.toLocaleString("en-IN")}\n` +
      `• *IGST (Integrated Tax 18%):* ₹${taxDetails.gstAmount.toLocaleString("en-IN")}\n` +
      `💰 *Total Shift Value (Gross):* ₹${taxDetails.totalAmount.toLocaleString("en-IN")}\n` +
      `✅ *Paid / Advance:* ₹${Number(invoiceAdvancePaid).toLocaleString("en-IN")}\n` +
      `⏳ *Balance Due:* ₹${Number(invoiceBalanceAmount).toLocaleString("en-IN")}\n` +
      `💳 *Payment Mode:* *${paymentModeLabel}*\n` +
      `📊 *Payment Status:* *${invoicePaymentStatus.toUpperCase()}*\n` +
      (invoiceTransactionId ? `🔖 *Receipt/UTR Ref:* ${invoiceTransactionId}\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔗 *Online Invoice & Ledger:* ${viewUrl}\n\n` +
      `🏢 *LUXDHANA GLOBAL PRIVATE LIMITED*\n` +
      `GSTIN: 33AAGCL5078A1ZS | State Code: 33 (Tamil Nadu) | SAC: 999312\n` +
      `Principal Office: Shop No. S101, Door No. 769, Spencer Plaza, Anna Salai, Chennai - 600002\n` +
      `24/7 Helpline: +91 94945 16543 | www.ammaseva.in\n\n` +
      `Thank you for trusting Amma Seva! 🙏`;

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Document Viewer Modal State
  const [docViewerState, setDocViewerState] = useState<{
    isOpen: boolean;
    docUrl: string | null;
    docTitle: string;
    applicantName: string;
    category: string;
  }>({
    isOpen: false,
    docUrl: null,
    docTitle: "",
    applicantName: "",
    category: "",
  });

  const openDocViewer = (docUrl?: string | null, docTitle = "Verification Document", applicantName = "", category = "Verification Record") => {
    if (!docUrl) return;
    setDocViewerState({
      isOpen: true,
      docUrl,
      docTitle,
      applicantName,
      category,
    });
  };

  // Modal Control
  const [modalType, setModalType] = useState<"booking" | "caregiver" | "service" | "notification" | "blog" | "faq" | "gallery" | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Form states - Booking
  const getTodayISO = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayISO();

  // Full Service Catalog & Pricing Defaults
  const ADMIN_STANDARD_SERVICES = [
    { id: 1, title: "Elderly Care at Home", price: "Starting ₹500 / visit", defaultRate: 500, unit: "visit" },
    { id: 2, title: "Mother & Baby Care", price: "Starting ₹18,000 / month", defaultRate: 18000, unit: "month" },
    { id: 3, title: "Pregnancy Care", price: "Starting ₹700 / visit", defaultRate: 700, unit: "visit" },
    { id: 4, title: "Newborn Baby Care", price: "Starting ₹20,000 / month", defaultRate: 20000, unit: "month" },
    { id: 5, title: "Home Nursing Services", price: "Starting ₹800 / visit", defaultRate: 800, unit: "visit" },
    { id: 6, title: "Injection Services", price: "Starting ₹299 / visit", defaultRate: 299, unit: "visit" },
    { id: 7, title: "Post-Surgery Care", price: "Starting ₹1,500 / day", defaultRate: 1500, unit: "day" },
    { id: 8, title: "Patient Care Attendant", price: "Starting ₹900 / day", defaultRate: 900, unit: "day" },
    { id: 9, title: "Bedridden Patient Care", price: "Starting ₹1,200 / day", defaultRate: 1200, unit: "day" },
    { id: 10, title: "ICU / Home Recovery Support", price: "Starting ₹2,500 / day", defaultRate: 2500, unit: "day" },
    { id: 11, title: "Physiotherapy at Home", price: "Starting ₹799 / session", defaultRate: 799, unit: "session" },
    { id: 12, title: "Doctor Consultation at Home", price: "Starting ₹999 / visit", defaultRate: 999, unit: "visit" },
  ];

  const ADMIN_MTP_SERVICES = [
    { id: 101, title: "Multi Tasking Professional (MTP) - Hospital Escort & Dropping", price: "₹300 - ₹1,000 / task" },
    { id: 102, title: "Multi Tasking Professional (MTP) - Medicine Delivery & Urgent Errands", price: "₹300 - ₹1,000 / task" },
    { id: 103, title: "Multi Tasking Professional (MTP) - Senior Walking & Companionship", price: "₹300 - ₹1,000 / task" },
    { id: 104, title: "Multi Tasking Professional (MTP) - Mother & Baby Support Helper", price: "₹300 - ₹1,000 / task" },
    { id: 105, title: "Multi Tasking Professional (MTP) - Bedside & Post-Surgery Attendant", price: "₹300 - ₹1,000 / task" },
    { id: 106, title: "Multi Tasking Professional (MTP) - Emergency On-Demand Task Force", price: "₹300 - ₹1,000 / task" },
  ];

  const ADMIN_MTP_DEFAULT_TIERS = [
    { id: 1, hours: 2, label: "2 Hours Package", price: 300, advancePercentage: 20, gstRate: 18 },
    { id: 2, hours: 4, label: "4 Hours Package", price: 600, advancePercentage: 20, gstRate: 18 },
    { id: 3, hours: 6, label: "6 Hours Package", price: 800, advancePercentage: 20, gstRate: 18 },
    { id: 4, hours: 8, label: "8 Hours Package", price: 1000, advancePercentage: 20, gstRate: 18 },
  ];

  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingService, setBookingService] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingModalEndDate, setBookingModalEndDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState("Daily");
  const [bookingDurationCount, setBookingDurationCount] = useState("1");
  const [bookingAddress, setBookingAddress] = useState("");
  const [bookingBaseAmount, setBookingBaseAmount] = useState("");
  const [bookingGstAmount, setBookingGstAmount] = useState("");
  const [bookingAmount, setBookingAmount] = useState("");
  const [bookingAdvancePaid, setBookingAdvancePaid] = useState("0");
  const [bookingBalanceAmount, setBookingBalanceAmount] = useState("0");
  const [bookingSelectedMtpTierId, setBookingSelectedMtpTierId] = useState<number>(1);
  const [bookingStatus, setBookingStatus] = useState("Pending");
  const [bookingAssignedStaff, setBookingAssignedStaff] = useState("");
  const [bookingAssignedStaffId, setBookingAssignedStaffId] = useState<number | null>(null);
  const [bookingAssignedStaffRole, setBookingAssignedStaffRole] = useState<string | null>(null);
  const [bookingAssignedStaffPhone, setBookingAssignedStaffPhone] = useState<string | null>(null);
  const [bookingPaymentStatus, setBookingPaymentStatus] = useState("Unpaid");
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("UPI");
  const [bookingTransactionId, setBookingTransactionId] = useState("");
  const [bookingPaymentDate, setBookingPaymentDate] = useState("");
  const [bookingCaretakerPayout, setBookingCaretakerPayout] = useState("");
  const [bookingCaretakerPayoutStatus, setBookingCaretakerPayoutStatus] = useState("Unpaid");
  const [bookingCaretakerPayoutMethod, setBookingCaretakerPayoutMethod] = useState("");
  const [bookingCaretakerPayoutRef, setBookingCaretakerPayoutRef] = useState("");
  const [payoutCalcMode, setPayoutCalcMode] = useState<"percentage" | "fixed">("percentage");
  const [payoutPercentValue, setPayoutPercentValue] = useState("85");
  const [isRecordCaretakerPaymentMode, setIsRecordCaretakerPaymentMode] = useState(false);

  // Date calculation helpers for multi-day bookings
  const calculateDaysBetween = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 1;
    const start = new Date(startStr + "T00:00:00");
    const end = new Date(endStr + "T00:00:00");
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const addDaysToDate = (startStr: string, days: number): string => {
    if (!startStr) return "";
    const d = new Date(startStr + "T00:00:00");
    d.setDate(d.getDate() + Math.max(0, days - 1));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper to extract rates for standard service
  const getStandardServiceRates = (serviceTitle: string) => {
    const allStd = [...(Array.isArray(services) && services.length > 0 ? services : []), ...ADMIN_STANDARD_SERVICES];
    const s = allStd.find(x => x.title === serviceTitle) || allStd[0];
    const priceStr = (s?.price || s?.pricing || "").toString();
    const matches = priceStr.replace(/,/g, '').match(/\d+/);
    const rate = matches ? Number(matches[0]) : (s?.defaultRate || 1200);
    const unit = (s?.unit || priceStr).toLowerCase();

    let hourly = 0;
    let daily = 0;
    let weekly = 0;
    let monthly = 0;

    if (unit.includes('month')) {
      monthly = rate;
      daily = Math.round(monthly / 30);
      weekly = Math.round(daily * 7);
      hourly = Math.round(daily / 24);
    } else if (unit.includes('hour')) {
      hourly = rate;
      daily = Math.round(hourly * 24);
      weekly = Math.round(daily * 7);
      monthly = Math.round(daily * 30);
    } else if (unit.includes('visit') || unit.includes('session') || unit.includes('consultation')) {
      daily = rate;
      hourly = rate;
      weekly = rate * 7;
      monthly = rate * 30;
    } else {
      daily = rate;
      hourly = Math.round(daily / 24);
      weekly = Math.round(daily * 7);
      monthly = Math.round(daily * 30);
    }

    return { hourly, daily, weekly, monthly, rawRate: rate, unit: s?.unit || unit };
  };

  // Helper to get active MTP pricing tiers
  const getActiveMtpTiers = () => {
    const list = Array.isArray(mtpPrices) && mtpPrices.length > 0 
      ? mtpPrices.filter(p => p.isActive !== false && p.isActive !== 0)
      : ADMIN_MTP_DEFAULT_TIERS;
    return list.length > 0 ? list : ADMIN_MTP_DEFAULT_TIERS;
  };

  // Helper to select an MTP tier
  const selectMtpTier = (tier: any) => {
    setBookingSelectedMtpTierId(tier.id);
    const base = Number(tier.price) || 300;
    const gstRate = Number(tier.gstRate) || 18;
    const gst = Math.round(base * (gstRate / 100));
    const total = base + gst;
    const advPct = tier.advancePercentage !== undefined ? Number(tier.advancePercentage) : 20;
    const adv = Math.round((total * advPct) / 100);
    const bal = Math.max(0, total - adv);

    setBookingDuration(`${tier.hours} Hours (MTP Package)`);
    setBookingBaseAmount(base.toString());
    setBookingGstAmount(gst.toString());
    setBookingAmount(total.toString());
    setBookingAdvancePaid(adv.toString());
    setBookingBalanceAmount(bal.toString());
    if (adv >= total && total > 0) {
      setBookingPaymentStatus("Paid");
    } else if (adv > 0) {
      setBookingPaymentStatus("Advance Paid");
    } else {
      setBookingPaymentStatus("Pay on Service");
    }

    if (payoutCalcMode === "percentage") {
      const pct = Number(payoutPercentValue) || 85;
      setBookingCaretakerPayout(Math.round(total * (pct / 100)).toString());
    }
  };

  // Helper to calculate rate for standard care service
  const calculateRatesForStandardService = (serviceTitle: string, duration: string, countStr: string) => {
    const { hourly, daily, weekly, monthly } = getStandardServiceRates(serviceTitle);
    const count = Math.max(1, Number(countStr) || 1);
    let base = daily * count;
    if (duration === "Hourly") base = hourly * count;
    else if (duration === "Daily") base = daily * count;
    else if (duration === "Weekly") base = weekly * count;
    else if (duration === "Monthly") base = monthly * count;

    const gst = Math.round(base * 0.18);
    const total = base + gst;
    return { base, gst, total };
  };

  // Recalculate and update financial states
  const applyStandardPricing = (serviceTitle: string, duration: string, countStr: string) => {
    const { base, gst, total } = calculateRatesForStandardService(serviceTitle, duration, countStr);
    setBookingBaseAmount(base.toString());
    setBookingGstAmount(gst.toString());
    setBookingAmount(total.toString());
    const currentAdv = Number(bookingAdvancePaid) || 0;
    setBookingBalanceAmount(Math.max(0, total - currentAdv).toString());

    if (payoutCalcMode === "percentage") {
      const pct = Number(payoutPercentValue) || 85;
      setBookingCaretakerPayout(Math.round(total * (pct / 100)).toString());
    }
  };

  // Handler when service changes
  const handleServiceChange = (serviceTitle: string) => {
    setBookingService(serviceTitle);
    const isMtp = /mtp|escort|errand|walking|companion|hospital dropping/i.test(serviceTitle);
    setBookingIsMtp(isMtp);

    if (isMtp) {
      const tiers = getActiveMtpTiers();
      const firstTier = tiers[0] || ADMIN_MTP_DEFAULT_TIERS[0];
      selectMtpTier(firstTier);
    } else {
      applyStandardPricing(serviceTitle, bookingDuration, bookingDurationCount);
    }
  };

  // Handler when start date changes
  const handleStartDateChange = (newStartDate: string) => {
    setBookingDate(newStartDate);
    if (!newStartDate) return;

    if (bookingIsMtp || bookingDuration === "Hourly") {
      setBookingModalEndDate(newStartDate);
      return;
    }

    if (bookingDuration === "Daily") {
      if (bookingModalEndDate && bookingModalEndDate >= newStartDate) {
        const calculatedDays = calculateDaysBetween(newStartDate, bookingModalEndDate);
        setBookingDurationCount(calculatedDays.toString());
        applyStandardPricing(bookingService, "Daily", calculatedDays.toString());
      } else {
        const targetDays = Number(bookingDurationCount) > 0 ? Number(bookingDurationCount) : 1;
        setBookingModalEndDate(addDaysToDate(newStartDate, targetDays));
      }
    } else if (bookingDuration === "Weekly") {
      const days = (Number(bookingDurationCount) || 1) * 7;
      setBookingModalEndDate(addDaysToDate(newStartDate, days));
    } else if (bookingDuration === "Monthly") {
      const days = (Number(bookingDurationCount) || 1) * 30;
      setBookingModalEndDate(addDaysToDate(newStartDate, days));
    }
  };

  // Handler when end date changes
  const handleEndDateChange = (newEndDate: string) => {
    setBookingModalEndDate(newEndDate);
    if (!newEndDate) return;

    if (!bookingDate) {
      setBookingDate(newEndDate);
      setBookingDurationCount("1");
      return;
    }

    if (newEndDate < bookingDate) {
      setBookingModalEndDate(bookingDate);
      setBookingDurationCount("1");
      return;
    }

    if (bookingDuration === "Daily") {
      const calculatedDays = calculateDaysBetween(bookingDate, newEndDate);
      setBookingDurationCount(calculatedDays.toString());
      applyStandardPricing(bookingService, "Daily", calculatedDays.toString());
    } else if (bookingDuration === "Weekly") {
      const days = calculateDaysBetween(bookingDate, newEndDate);
      const weeks = Math.max(1, Math.round(days / 7));
      setBookingDurationCount(weeks.toString());
      applyStandardPricing(bookingService, "Weekly", weeks.toString());
    } else if (bookingDuration === "Monthly") {
      const days = calculateDaysBetween(bookingDate, newEndDate);
      const months = Math.max(1, Math.round(days / 30));
      setBookingDurationCount(months.toString());
      applyStandardPricing(bookingService, "Monthly", months.toString());
    }
  };

  // Handler when duration unit changes
  const handleDurationChange = (newDuration: string, countStr: string) => {
    setBookingDuration(newDuration);
    const count = Math.max(1, Number(countStr) || 1);
    if (bookingDate) {
      if (newDuration === "Hourly") {
        setBookingModalEndDate(bookingDate);
      } else if (newDuration === "Daily") {
        setBookingModalEndDate(addDaysToDate(bookingDate, count));
      } else if (newDuration === "Weekly") {
        setBookingModalEndDate(addDaysToDate(bookingDate, count * 7));
      } else if (newDuration === "Monthly") {
        setBookingModalEndDate(addDaysToDate(bookingDate, count * 30));
      }
    }
    if (!bookingIsMtp) {
      applyStandardPricing(bookingService, newDuration, countStr);
    }
  };

  // Handler when duration count changes
  const handleDurationCountChange = (countStr: string) => {
    setBookingDurationCount(countStr);
    const count = Math.max(1, Number(countStr) || 1);
    if (bookingDate) {
      if (bookingDuration === "Daily") {
        setBookingModalEndDate(addDaysToDate(bookingDate, count));
      } else if (bookingDuration === "Weekly") {
        setBookingModalEndDate(addDaysToDate(bookingDate, count * 7));
      } else if (bookingDuration === "Monthly") {
        setBookingModalEndDate(addDaysToDate(bookingDate, count * 30));
      } else if (bookingDuration === "Hourly") {
        setBookingModalEndDate(bookingDate);
      }
    }
    if (!bookingIsMtp) {
      applyStandardPricing(bookingService, bookingDuration, countStr);
    }
  };

  // Handler when Base Amount is manually changed
  const handleBaseAmountChange = (val: string) => {
    setBookingBaseAmount(val);
    const base = Number(val) || 0;
    const gst = Math.round(base * 0.18);
    const total = base + gst;
    setBookingGstAmount(gst.toString());
    setBookingAmount(total.toString());
    const adv = Number(bookingAdvancePaid) || 0;
    setBookingBalanceAmount(Math.max(0, total - adv).toString());

    if (payoutCalcMode === "percentage") {
      const pct = Number(payoutPercentValue) || 85;
      setBookingCaretakerPayout(Math.round(total * (pct / 100)).toString());
    }
  };

  // Handler when GST Amount is manually changed
  const handleGstAmountChange = (val: string) => {
    setBookingGstAmount(val);
    const base = Number(bookingBaseAmount) || 0;
    const gst = Number(val) || 0;
    const total = base + gst;
    setBookingAmount(total.toString());
    const adv = Number(bookingAdvancePaid) || 0;
    setBookingBalanceAmount(Math.max(0, total - adv).toString());

    if (payoutCalcMode === "percentage") {
      const pct = Number(payoutPercentValue) || 85;
      setBookingCaretakerPayout(Math.round(total * (pct / 100)).toString());
    }
  };

  // Handler when Total Fee is manually changed
  const handleTotalAmountChange = (val: string) => {
    setBookingAmount(val);
    const total = Number(val) || 0;
    const base = Math.round(total / 1.18);
    const gst = total - base;
    setBookingBaseAmount(base.toString());
    setBookingGstAmount(gst.toString());
    const adv = Number(bookingAdvancePaid) || 0;
    setBookingBalanceAmount(Math.max(0, total - adv).toString());

    if (payoutCalcMode === "percentage") {
      const pct = Number(payoutPercentValue) || 85;
      setBookingCaretakerPayout(Math.round(total * (pct / 100)).toString());
    }
  };

  // Handler when Advance Paid is changed
  const handleAdvancePaidChange = (val: string) => {
    setBookingAdvancePaid(val);
    const total = Number(bookingAmount) || 0;
    const adv = Number(val) || 0;
    const bal = Math.max(0, total - adv);
    setBookingBalanceAmount(bal.toString());

    if (adv >= total && total > 0) {
      setBookingPaymentStatus("Paid");
      setBookingBalanceAmount("0");
    } else if (adv > 0) {
      setBookingPaymentStatus("Advance Paid");
    } else {
      setBookingPaymentStatus("Pay on Service");
    }
  };

  // Handler when Payment Status dropdown is changed directly by Admin
  const handleBookingPaymentStatusChange = (newStatus: string) => {
    setBookingPaymentStatus(newStatus);
    const total = Number(bookingAmount) || 0;
    if (newStatus === "Paid") {
      setBookingAdvancePaid(total.toString());
      setBookingBalanceAmount("0");
    } else if (newStatus === "Unpaid") {
      setBookingAdvancePaid("0");
      setBookingBalanceAmount(total.toString());
    } else if (newStatus === "Advance Paid") {
      const adv = Number(bookingAdvancePaid) > 0 ? Number(bookingAdvancePaid) : Math.round(total * 0.2);
      setBookingAdvancePaid(adv.toString());
      setBookingBalanceAmount(Math.max(0, total - adv).toString());
    } else if (newStatus === "Pay on Service") {
      setBookingAdvancePaid("0");
      setBookingBalanceAmount(total.toString());
    }
  };

  // Handler when Balance Amount is manually edited
  const handleBalanceAmountChange = (val: string) => {
    setBookingBalanceAmount(val);
    const total = Number(bookingAmount) || 0;
    const bal = Number(val) || 0;
    if (bal <= 0 && total > 0) {
      setBookingPaymentStatus("Paid");
      setBookingAdvancePaid(total.toString());
      setBookingBalanceAmount("0");
    } else {
      const adv = Math.max(0, total - bal);
      setBookingAdvancePaid(adv.toString());
      if (adv > 0) {
        setBookingPaymentStatus("Advance Paid");
      } else {
        setBookingPaymentStatus("Unpaid");
      }
    }
  };
  const [bookingPatientName, setBookingPatientName] = useState("");
  const [bookingPatientAge, setBookingPatientAge] = useState("");
  const [bookingPatientNeeds, setBookingPatientNeeds] = useState("");
  const [bookingPrescription, setBookingPrescription] = useState("");
  const [bookingGoogleMapLocation, setBookingGoogleMapLocation] = useState("");

  // MTP Gig Tracking States & Actions
  const [bookingIsMtp, setBookingIsMtp] = useState(false);
  const [bookingMtpAcceptedAt, setBookingMtpAcceptedAt] = useState<string | null>(null);
  const [bookingMtpAcceptedBy, setBookingMtpAcceptedBy] = useState<string | null>(null);
  const [bookingMtpAcceptedById, setBookingMtpAcceptedById] = useState<number | null>(null);
  const [bookingMtpAcceptedPhone, setBookingMtpAcceptedPhone] = useState<string | null>(null);
  const [isReleasingGig, setIsReleasingGig] = useState(false);
  const [isRebroadcasting, setIsRebroadcasting] = useState(false);

  const handleReleaseMTPGig = async (bookingId: number | string) => {
    if (!confirm("Are you sure you want to release this MTP task back to the open pool? It will immediately become available again on the MTP Gig Radar for other companions to accept.")) return;
    const token = localStorage.getItem("ammaseva_admin_token");
    setIsReleasingGig(true);
    try {
      const res = await fetch(`/api/admin/release-mtp-gig/${bookingId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to release gig.");
      alert("✅ Gig released! It has been returned to the open MTP radar and re-broadcasted to all MTPs.");
      setBookingAssignedStaff("");
      setBookingAssignedStaffId(null);
      setBookingAssignedStaffRole(null);
      setBookingAssignedStaffPhone(null);
      setBookingMtpAcceptedAt(null);
      setBookingMtpAcceptedBy(null);
      setBookingMtpAcceptedById(null);
      setBookingMtpAcceptedPhone(null);
      setBookingStatus("Pending");
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to release gig.");
    } finally {
      setIsReleasingGig(false);
    }
  };

  const handleRebroadcastMTPGig = async (bookingId: number | string) => {
    const token = localStorage.getItem("ammaseva_admin_token");
    setIsRebroadcasting(true);
    try {
      const res = await fetch(`/api/admin/rebroadcast-mtp-gig/${bookingId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to rebroadcast.");
      alert("📢 Alert dispatched! Email notifications sent to all verified MTP partners.");
    } catch (err: any) {
      alert(err.message || "Failed to rebroadcast.");
    } finally {
      setIsRebroadcasting(false);
    }
  };

  // Form states - Caregiver
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [caregiverSpecialty, setCaregiverSpecialty] = useState("Elderly Care");
  const [caregiverExperience, setCaregiverExperience] = useState("3");
  const [caregiverStatus, setCaregiverStatus] = useState("Pending");
  const [caregiverAadhaar, setCaregiverAadhaar] = useState("");
  const [caregiverPan, setCaregiverPan] = useState("");
  const [caregiverCertificates, setCaregiverCertificates] = useState("");
  const [caregiverProfilePhoto, setCaregiverProfilePhoto] = useState("");
  const [caregiverExperienceDetails, setCaregiverExperienceDetails] = useState("");
  const [caregiverWorkingLocations, setCaregiverWorkingLocations] = useState("");
  const [caregiverAvailableTimings, setCaregiverAvailableTimings] = useState("");
  
  const [caregiverState, setCaregiverState] = useState("");
  const [caregiverCity, setCaregiverCity] = useState("");
  const [caregiverGoogleMapLocation, setCaregiverGoogleMapLocation] = useState("");
  const [caregiverExperienceCertificate, setCaregiverExperienceCertificate] = useState("");
  const [caregiverPoliceVerification, setCaregiverPoliceVerification] = useState("");
  const [caregiverAdditionalCertificates, setCaregiverAdditionalCertificates] = useState("");
  const [caregiverReferredBy, setCaregiverReferredBy] = useState("");

  // Form states - Service
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [servicePriceVal, setServicePriceVal] = useState("1200");
  const [servicePriceUnit, setServicePriceUnit] = useState("day");
  const [serviceAdvanceVal, setServiceAdvanceVal] = useState("300");
  const [serviceCategory, setServiceCategory] = useState("care");
  const [serviceShort, setServiceShort] = useState("");
  const [serviceBenefits, setServiceBenefits] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");
  const [serviceComingSoon, setServiceComingSoon] = useState(false);
  const [serviceImage, setServiceImage] = useState("");
  const [serviceAbout, setServiceAbout] = useState("");
  const [serviceHighlights, setServiceHighlights] = useState("");
  const [serviceImages, setServiceImages] = useState("");

  // Form states - Blog
  const [blogTitle, setBlogTitle] = useState("");
  const [blogDescription, setBlogDescription] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogImage, setBlogImage] = useState("");
  const [blogCategory, setBlogCategory] = useState("General");
  const [blogAuthor, setBlogAuthor] = useState("Amma Seva Care Team");
  const [blogDate, setBlogDate] = useState("");

  // Form states - FAQ
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  // Form states - Gallery
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryImageUrl, setGalleryImageUrl] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFileState: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileState(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form states - Notification
  const [notifRecipient, setNotifRecipient] = useState("All Users");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("Email");

  // Collapsible Reviews modal state
  const [selectedCaregiverForReviews, setSelectedCaregiverForReviews] = useState<any | null>(null);
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);
  const [reviewsSortOrder, setReviewsSortOrder] = useState<"high-to-low" | "low-to-high">("high-to-low");
  const [reviewsSearchQuery, setReviewsSearchQuery] = useState("");
  const [expandedCaregiverId, setExpandedCaregiverId] = useState<number | null>(null);

  // Local Page Search & Date Range Filters
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<any | null>(null);

  const [patientSearch, setPatientSearch] = useState("");
  const [patientStartDate, setPatientStartDate] = useState("");
  const [patientEndDate, setPatientEndDate] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "customer" | "caregiver" | "mtp">("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("All");
  const [userDeleteConfirmModal, setUserDeleteConfirmModal] = useState<{
    isOpen: boolean;
    account: any | null;
    isDeleting: boolean;
    error: string | null;
  }>({
    isOpen: false,
    account: null,
    isDeleting: false,
    error: null,
  });

  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStartDate, setPaymentStartDate] = useState("");
  const [paymentEndDate, setPaymentEndDate] = useState("");
  
  // Accounts Ledger & Financials State
  const [accountsSearch, setAccountsSearch] = useState("");
  const [accountsStartDate, setAccountsStartDate] = useState("");
  const [accountsEndDate, setAccountsEndDate] = useState("");
  const [accountsMonthFilter, setAccountsMonthFilter] = useState("all");
  const [accountsStatusFilter, setAccountsStatusFilter] = useState<"all" | "settled" | "pending">("all");
  const [isSettlingBookingId, setIsSettlingBookingId] = useState<number | string | null>(null);
  const [accountsSuccessToast, setAccountsSuccessToast] = useState<string | null>(null);

  const [salarySearch, setSalarySearch] = useState("");
  const [salaryStartDate, setSalaryStartDate] = useState("");
  const [salaryEndDate, setSalaryEndDate] = useState("");
  const [selectedCaregiverForLedger, setSelectedCaregiverForLedger] = useState<any | null>(null);
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerTimeFilter, setLedgerTimeFilter] = useState<"all" | "past" | "present" | "future">("all");

  // Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem("ammaseva_admin_token");
    if (!token) {
      navigate({ to: "/login" });
    }
  }, [navigate, isLoggedIn]);

  // Scroll to top on initial mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // Sync activeTab to URL query parameter and localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ammaseva_admin_active_tab", activeTab);
      const url = new URL(window.location.href);
      if (activeTab === "overview") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", activeTab);
      }
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      console.error("Failed to sync admin active tab:", e);
    }
    // Always scroll page & main panel to top on tab change
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [activeTab]);

  // Sync mtpSubTab to URL & localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ammaseva_admin_mtp_subtab", mtpSubTab);
      const url = new URL(window.location.href);
      if (activeTab === "mtps" && (mtpSubTab === "tasks" || mtpSubTab === "pricing")) {
        url.searchParams.set("subtab", mtpSubTab);
      } else {
        url.searchParams.delete("subtab");
      }
      window.history.replaceState({}, "", url.toString());
    } catch (e) {}
  }, [mtpSubTab, activeTab]);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const paramTab = (searchParams.get("tab") as AdminTab) || "overview";
      if (VALID_ADMIN_TABS.includes(paramTab)) {
        setActiveTab(paramTab);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("ammaseva_admin_token");

    const fetchWithAuth = async (url: string) => {
      try {
        const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if (res.status === 401) {
          handleLogout();
          throw new Error("Unauthorized");
        }
        if (!res.ok) {
          console.warn(`[AmmaSeva Admin] ${url} returned HTTP ${res.status}`);
          return [];
        }
        return await res.json();
      } catch (err: any) {
        if (err?.message === "Unauthorized") throw err;
        console.warn(`[AmmaSeva Admin] Request to ${url} failed:`, err);
        return [];
      }
    };

    const safeFetchJson = async (url: string) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return [];
        return await res.json();
      } catch (e) {
        console.warn(`[AmmaSeva Admin] Public request to ${url} failed:`, e);
        return [];
      }
    };

    try {
      const [
        bookingsRes,
        caregiversRes,
        enquiriesRes,
        usersRes,
        servicesRes,
        notificationsRes,
        blogsRes,
        faqsRes,
        galleryRes,
        mtpsRes,
        mtpTasksRes,
        mtpPricesRes,
        referralsRes,
        idCardsRes
      ] = await Promise.all([
        fetchWithAuth("/api/bookings"),
        fetchWithAuth("/api/caregivers"),
        fetchWithAuth("/api/enquiries"),
        fetchWithAuth("/api/admin/users"),
        fetchWithAuth("/api/services"),
        fetchWithAuth("/api/notifications"),
        safeFetchJson("/api/blogs"),
        safeFetchJson("/api/faqs"),
        safeFetchJson("/api/gallery"),
        fetchWithAuth("/api/admin/mtps"),
        safeFetchJson("/api/mtp/tasks"),
        safeFetchJson("/api/mtp/prices"),
        fetchWithAuth("/api/admin/referrals"),
        fetchWithAuth("/api/admin/id-cards").then(res => (res && res.data) ? res.data : (Array.isArray(res) ? res : []))
      ]);

      setBookings((Array.isArray(bookingsRes) ? bookingsRes : []).map((b: any) => ({
        ...b,
        name: b?.name || b?.patientName || "Customer",
        phone: b?.phone || "",
        service: b?.service || "Home Healthcare Support",
        date: b?.date || "",
        time: b?.time || "",
        duration: b?.duration || "Standard Shift",
        address: b?.address || "",
        status: b?.status || "Pending",
        paymentStatus: b?.paymentStatus || "Unpaid",
        amount: Number(b?.amount) || 0
      })));
      setCaregivers((Array.isArray(caregiversRes) ? caregiversRes : []).map((c: any) => ({
        ...c,
        name: c?.name || "Staff Member",
        phone: c?.phone || "",
        specialty: c?.specialty || "Care Professional",
        status: c?.status || "Pending"
      })));
      setEnquiries(Array.isArray(enquiriesRes) ? enquiriesRes : []);
      setUsers((Array.isArray(usersRes) ? usersRes : []).map((u: any) => ({
        ...u,
        name: u?.name || "User",
        phone: u?.phone || "",
        email: u?.email || ""
      })));
      setServices((Array.isArray(servicesRes) ? servicesRes : []).map((s: any) => ({
        ...s,
        title: s?.title || "Healthcare Service",
        description: s?.description || ""
      })));
      setNotifications((Array.isArray(notificationsRes) ? notificationsRes : []).map((n: any) => ({
        ...n,
        recipient: n?.recipient || "",
        message: n?.message || ""
      })));
      setBlogs(Array.isArray(blogsRes) ? blogsRes : []);
      setFaqs(Array.isArray(faqsRes) ? faqsRes : []);
      setGallery(Array.isArray(galleryRes) ? galleryRes : []);
      setMTPs(Array.isArray(mtpsRes) ? mtpsRes : []);
      setMtpTasks(Array.isArray(mtpTasksRes) ? mtpTasksRes : []);
      setMtpPrices(Array.isArray(mtpPricesRes) ? mtpPricesRes : []);
      let consolidatedCards: StaffIdCard[] = Array.isArray(idCardsRes) ? [...idCardsRes] : [];
      const existingCardKeys = new Set(consolidatedCards.map(c => `${c.source}_${c.originalId}`));

      // Ensure all MTPs are seamlessly included in ID cards
      if (Array.isArray(mtpsRes)) {
        mtpsRes.forEach((m: any) => {
          const key = `mtps_${m.id}`;
          if (!existingCardKeys.has(key)) {
            existingCardKeys.add(key);
            consolidatedCards.push({
              id: `mtp_${m.id}`,
              originalId: m.id,
              type: "mtp",
              source: "mtps",
              staffCategory: "MTP",
              categoryLabel: "MTP Partner",
              employeeId: m.employeeId || `AS - MTP - 26-${String(m.id).padStart(3, "0")}`,
              name: m.name,
              phone: m.phone || "",
              email: m.email || "",
              designation: "MTP",
              specialty: m.roles || "Multi Tasking Professional & Companion Partner",
              profilePhoto: m.profilePhoto || "",
              status: m.status || "Pending",
              joinedAt: m.createdAt || m.joinedAt || "2026-01-01T00:00:00.000Z",
              state: m.state || "Telangana",
              city: m.city || "Hyderabad"
            });
          }
        });
      }

      // Ensure all Caregivers & Nurses are seamlessly included in ID cards
      if (Array.isArray(caregiversRes)) {
        caregiversRes.forEach((c: any) => {
          const key = `caregivers_${c.id}`;
          if (!existingCardKeys.has(key)) {
            existingCardKeys.add(key);
            const isNurse = (c.staffCategory === "NUR") || 
                            (c.employeeId && c.employeeId.includes("NUR")) || 
                            /nurse|nursing|icu|gnm|clinical|sister|dr\./i.test(c.specialty || "") ||
                            /nurse|sister|dr\./i.test(c.name || "") ||
                            /nurse/i.test(c.designation || "");
            const cat = isNurse ? "NUR" : "CGV";
            const catLabel = isNurse ? "Registered Nurse" : "Caregiver";
            const desig = isNurse ? "Nurse" : "Caregiver";
            consolidatedCards.push({
              id: `cgv_${c.id}`,
              originalId: c.id,
              type: "caregiver",
              source: "caregivers",
              staffCategory: cat,
              categoryLabel: catLabel,
              employeeId: c.employeeId || `AS - ${cat} - 26-${String(c.id).padStart(3, "0")}`,
              name: c.name,
              phone: c.phone || "",
              email: c.email || "",
              designation: desig,
              specialty: c.specialty || (isNurse ? "Clinical Care & Vitals" : "Bedside & Elderly Care"),
              profilePhoto: c.profilePhoto || "",
              status: c.status || "Pending",
              joinedAt: c.joinedAt || "2026-01-01T00:00:00.000Z",
              state: c.state || "Telangana",
              city: c.city || "Hyderabad"
            });
          }
        });
      }

      setIdCards(consolidatedCards);
      if (referralsRes && referralsRes.success) {
        setReferralsData(referralsRes);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message === "Unauthorized") {
        return; // Redirect handled by handleLogout
      }
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



  // Quick verify/reject for caregivers
  const handleUpdateCaregiverStatus = (id: number, status: "Verified" | "Rejected" | "Pending") => {
    const token = localStorage.getItem("ammaseva_admin_token");
    fetch(`/api/caregiver/${id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCaregivers(prev => 
            prev.map(c => (c.id === id || (c as any).candidateId === id) ? { ...c, status } : c)
          );
          // Also update referral candidate if open or in state
          setSelectedCandidateDetail(prev => 
            prev && (prev.id === id || prev.candidateId === id) ? { ...prev, status } : prev
          );
          // Sync whole dashboard data
          fetchDashboardData();
        } else {
          alert(data.error || "Failed to update status.");
        }
      })
      .catch(err => {
        console.error(err);
        alert("Failed to update status due to network error.");
      });
  };

  // Staff ID Card Actions
  const handleOpenIssueEmployeeModal = (initialCategory: "EMP" | "MTP" | "NUR" | "CGV" = "EMP") => {
    const cat = initialCategory || (idCardCategoryTab !== "ALL" ? idCardCategoryTab : "EMP");
    setNewEmpCategory(cat);
    setNewEmpName("");
    setNewEmpPhone("");
    setNewEmpEmail("");
    const defaultDesigs = {
      EMP: "Operations Coordinator",
      MTP: "MTP Partner",
      NUR: "Registered Staff Nurse",
      CGV: "Certified Senior Caregiver"
    };
    setNewEmpDesignation(defaultDesigs[cat] || "Operations Coordinator");
    setNewEmpPhoto("");
    setIsIssueEmployeeModalOpen(true);
  };

  const handleIssueEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newEmpName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      alert("⚠️ Please enter a valid full name (minimum 2 characters).");
      return;
    }
    const cleanPhone = newEmpPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert("⚠️ Phone number must be exactly 10 digits (e.g. 9876543210).");
      return;
    }
    const cleanEmail = newEmpEmail.trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      alert("⚠️ Please enter a complete valid email address (e.g. name@example.com).");
      return;
    }
    const trimmedDesig = newEmpDesignation.trim();
    if (!trimmedDesig) {
      alert("⚠️ Please specify an official designation or role.");
      return;
    }

    const token = localStorage.getItem("ammaseva_admin_token");
    setIsSubmittingEmployee(true);
    try {
      const res = await fetch("/api/admin/id-cards/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          category: newEmpCategory,
          staffCategory: newEmpCategory,
          name: trimmedName,
          phone: cleanPhone,
          email: cleanEmail,
          designation: trimmedDesig,
          profilePhoto: newEmpPhoto.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue staff ID card.");
      alert(`✅ Official ${newEmpCategory} ID Card Issued!\nAssigned ID: ${data.data?.employeeId}\nName: ${data.data?.name}\nRole: ${data.data?.designation || trimmedDesig}`);
      setIsIssueEmployeeModalOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to create staff ID card.");
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  const handleOpenEditIdCardModal = (card: StaffIdCard) => {
    setEditingCardData(card);
    setEditCardName(card.name || "");
    setEditCardDesignation(getCleanIdCardDesignation(card));
    setEditCardCategory(card.staffCategory || "NUR");
    setEditCardPhoto(card.profilePhoto || "");
    setEditCardStatus(card.status || "Verified");
    setIsEditIdCardModalOpen(true);
  };

  const handleSaveCardEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCardData) return;
    const token = localStorage.getItem("ammaseva_admin_token");
    setIsSavingCardEdit(true);
    try {
      const res = await fetch(`/api/admin/id-cards/${editingCardData.source}/${editingCardData.originalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editCardName.trim(),
          designation: editCardDesignation.trim(),
          staffCategory: editCardCategory,
          profilePhoto: editCardPhoto.trim(),
          status: editCardStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update ID card details.");
      alert("✅ Staff credentials updated successfully!");
      setIsEditIdCardModalOpen(false);
      setEditingCardData(null);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to update staff credentials.");
    } finally {
      setIsSavingCardEdit(false);
    }
  };

  const handleDeleteEmployee = async (empId: number, name: string) => {
    if (!confirm(`Are you sure you want to delete employee record "${name}"? This action cannot be undone.`)) return;
    const token = localStorage.getItem("ammaseva_admin_token");
    try {
      const res = await fetch(`/api/admin/id-cards/employee/${empId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete employee.");
      alert("Employee record deleted.");
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Failed to delete employee.");
    }
  };

  const handlePrintIdCard = (card: StaffIdCard) => {
    setSelectedCardForView(card);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // DELETE actions
  const handleDeleteBooking = (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this booking record?")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/booking/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBookings(prev => prev.filter(b => b.id !== id));
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleDeleteCaregiver = (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this caregiver/staff employee record?")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/caregiver/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setCaregivers(prev => prev.filter(c => c.id !== id));
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleDeleteUser = (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this user customer account? All associated bookings and data will be wiped from the database.")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/admin/user/${id}?role=customer`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUsers(prev => prev.filter(u => u.id !== id));
            fetchDashboardData();
          } else {
            alert(data.error || "Failed to delete user account.");
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleDeleteAccountPermanently = async (account: any) => {
    if (!account || !account.id) return;
    const token = localStorage.getItem("ammaseva_admin_token");
    setUserDeleteConfirmModal(prev => ({ ...prev, isDeleting: true, error: null }));
    try {
      const roleQuery = account.role || "customer";
      const res = await fetch(`/api/admin/user/${account.id}?role=${roleQuery}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        if (account.role === "customer" || account.role === "user") {
          setUsers(prev => prev.filter(u => u.id !== account.id));
        } else if (account.role === "caregiver") {
          setCaregivers(prev => prev.filter(c => c.id !== account.id));
        } else if (account.role === "mtp") {
          setMTPs(prev => prev.filter(m => m.id !== account.id));
        }
        setUserDeleteConfirmModal({ isOpen: false, account: null, isDeleting: false, error: null });
        if (selectedUserForDetails && selectedUserForDetails.id === account.id) {
          setSelectedUserForDetails(null);
        }
        fetchDashboardData();
      } else {
        setUserDeleteConfirmModal(prev => ({ ...prev, isDeleting: false, error: data.error || "Failed to delete account from database." }));
      }
    } catch (err: any) {
      console.error("Delete account error:", err);
      setUserDeleteConfirmModal(prev => ({ ...prev, isDeleting: false, error: "Network error while purging account from database." }));
    }
  };

  // MTP Handlers
  const handleUpdateMTPStatus = (id: number, status: "Pending" | "Verified" | "Contacted" | "Rejected", notes?: string) => {
    const token = localStorage.getItem("ammaseva_admin_token");
    fetch(`/api/admin/mtp/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status, adminNotes: notes !== undefined ? notes : mtpAdminNotes })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMTPs(prev => prev.map(m => m.id === id ? { ...m, status, adminNotes: notes !== undefined ? notes : mtpAdminNotes } : m));
          if (selectedMTPDetail && selectedMTPDetail.id === id) {
            setSelectedMTPDetail((prev: any) => ({ ...prev, status, adminNotes: notes !== undefined ? notes : mtpAdminNotes }));
          }
        }
      })
      .catch(err => console.error(err));
  };

  const handleDeleteMTP = (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this MTP applicant record?")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/admin/mtp/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setMTPs(prev => prev.filter(m => m.id !== id));
            if (selectedMTPDetail && selectedMTPDetail.id === id) {
              setSelectedMTPDetail(null);
            }
          }
        })
        .catch(err => console.error(err));
    }
  };

  // MTP Task Management Handlers
  const handleOpenAddMtpTask = () => {
    setMtpTaskModalMode("add");
    setEditingMtpTaskId(null);
    setTaskIcon("🚗");
    setTaskTitle("");
    setTaskDescription("");
    setTaskShiftType("Part-time / On-Demand");
    setTaskEarningEstimate("₹300 - ₹1,500 / task");
    setIsMtpTaskModalOpen(true);
  };

  const handleOpenEditMtpTask = (task: any) => {
    setMtpTaskModalMode("edit");
    setEditingMtpTaskId(task.id);
    setTaskIcon(task.icon || "🚗");
    setTaskTitle(task.title || "");
    setTaskDescription(task.description || "");
    setTaskShiftType(task.shiftType || "Part-time / On-Demand");
    setTaskEarningEstimate(task.earningEstimate || "₹300 - ₹1,500 / task");
    setIsMtpTaskModalOpen(true);
  };

  const refreshMtpTasks = () => {
    fetch("/api/mtp/tasks")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMtpTasks(data);
      })
      .catch(err => console.error(err));
  };

  const handleSaveMtpTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDescription.trim()) {
      alert("Please enter a title and description for this MTP task.");
      return;
    }

    const token = localStorage.getItem("ammaseva_admin_token");
    const payload = {
      icon: taskIcon,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      shiftType: taskShiftType.trim(),
      earningEstimate: taskEarningEstimate.trim()
    };

    if (mtpTaskModalMode === "add") {
      fetch("/api/admin/mtp/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsMtpTaskModalOpen(false);
            refreshMtpTasks();
          } else {
            alert(data.error || "Failed to create MTP task.");
          }
        })
        .catch(err => console.error(err));
    } else if (editingMtpTaskId) {
      fetch(`/api/admin/mtp/tasks/${editingMtpTaskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsMtpTaskModalOpen(false);
            refreshMtpTasks();
          } else {
            alert(data.error || "Failed to update MTP task.");
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleDeleteMtpTask = (id: number) => {
    if (window.confirm("Are you sure you want to delete this MTP task category? It will no longer be visible on the public website.")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/admin/mtp/tasks/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            refreshMtpTasks();
          } else {
            alert(data.error || "Failed to delete MTP task.");
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleSeedDefaultMtpTasks = () => {
    if (window.confirm("Do you want to restore and save all 6 standard MTP task categories into the database?")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch("/api/admin/mtp/tasks/seed-defaults", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            refreshMtpTasks();
          } else {
            alert(data.error || "Failed to seed default tasks.");
          }
        })
        .catch(err => console.error(err));
    }
  };

  // MTP Hourly Pricing & Packages Handlers
  const refreshMtpPrices = () => {
    fetch("/api/mtp/prices")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMtpPrices(data);
      })
      .catch(err => console.error(err));
  };

  const handleOpenAddMtpPrice = () => {
    setMtpPriceModalMode("add");
    setEditingMtpPriceId(null);
    setPriceHours(2);
    setPriceLabel("2 Hours Package");
    setPriceBase(300);
    setPriceAdvancePercentage(20);
    setPriceGstRate(18);
    setPriceDescription("Hospital escort & doctor consultation companion");
    setPriceIsActive(true);
    setIsMtpPriceModalOpen(true);
  };

  const handleOpenEditMtpPrice = (tier: any) => {
    setMtpPriceModalMode("edit");
    setEditingMtpPriceId(tier.id);
    setPriceHours(Number(tier.hours) || 2);
    setPriceLabel(tier.label || `${tier.hours} Hours Package`);
    setPriceBase(Number(tier.price) || 0);
    setPriceAdvancePercentage(tier.advancePercentage !== undefined ? Number(tier.advancePercentage) : 20);
    setPriceGstRate(tier.gstRate !== undefined ? Number(tier.gstRate) : 18);
    setPriceDescription(tier.description || "");
    setPriceIsActive(tier.isActive !== false && tier.isActive !== 0);
    setIsMtpPriceModalOpen(true);
  };

  const handleSaveMtpPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (priceHours <= 0 || priceBase < 0) {
      alert("Please enter a valid duration in hours (> 0) and base price.");
      return;
    }
    const token = localStorage.getItem("ammaseva_admin_token");
    const payload = {
      hours: Number(priceHours),
      label: priceLabel.trim() || `${priceHours} Hours Package`,
      price: Number(priceBase),
      advancePercentage: Math.max(0, Math.min(100, Number(priceAdvancePercentage))),
      gstRate: Number(priceGstRate) || 18,
      description: priceDescription.trim(),
      isActive: priceIsActive
    };

    setIsSavingMtpPrice(true);
    try {
      const url = mtpPriceModalMode === "add" 
        ? "/api/admin/mtp/prices" 
        : `/api/admin/mtp/prices/${editingMtpPriceId}`;
      const method = mtpPriceModalMode === "add" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsMtpPriceModalOpen(false);
        refreshMtpPrices();
      } else {
        alert(data.error || "Failed to save MTP pricing tier.");
      }
    } catch (err: any) {
      alert("Error saving MTP pricing tier: " + err.message);
    } finally {
      setIsSavingMtpPrice(false);
    }
  };

  const handleDeleteMtpPrice = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this MTP pricing package?")) return;
    const token = localStorage.getItem("ammaseva_admin_token");
    try {
      const res = await fetch(`/api/admin/mtp/prices/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        refreshMtpPrices();
      } else {
        alert(data.error || "Failed to delete MTP pricing tier.");
      }
    } catch (err: any) {
      alert("Error deleting MTP pricing tier: " + err.message);
    }
  };

  const handleToggleMtpPriceActive = async (tier: any) => {
    const token = localStorage.getItem("ammaseva_admin_token");
    const newStatus = !(tier.isActive !== false && tier.isActive !== 0);
    try {
      const res = await fetch(`/api/admin/mtp/prices/${tier.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...tier, isActive: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        refreshMtpPrices();
      }
    } catch (err) {}
  };

  const handleDeleteService = (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this service?")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/services/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setServices(prev => prev.filter(s => s.id !== id));
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleDeleteBlog = (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this health blog article?")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/blogs/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setBlogs(prev => prev.filter(b => b.id !== id));
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleDeleteFaq = (id: number) => {
    if (window.confirm("Are you sure you want to permanently delete this FAQ item?")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/faqs/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFaqs(prev => prev.filter(f => f.id !== id));
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleDeleteGallery = (id: number) => {
    if (window.confirm("Are you sure you want to delete this gallery image?")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/gallery/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setGallery(prev => prev.filter(g => g.id !== id));
          }
        })
        .catch(err => console.error(err));
    }
  };

  const handleDeleteEnquiry = (id: number) => {
    if (window.confirm("Are you sure you want to delete this customer inquiry lead?")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/enquiry/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setEnquiries(prev => prev.filter(e => e.id !== id));
          }
        })
        .catch(err => console.error(err));
    }
  };

  // Open modal forms
  const openAddModal = (type: "booking" | "caregiver" | "service" | "notification" | "blog" | "faq" | "gallery") => {
    setModalType(type);
    setModalMode("add");
    setSelectedId(null);

    // Reset forms
    if (type === "booking") {
      const initialService = services[0]?.title || "Elderly Care at Home";
      setBookingName("");
      setBookingPhone("");
      setBookingService(initialService);
      setBookingDate(getTodayISO());
      setBookingModalEndDate(getTodayISO());
      setBookingTime("09:00 AM");
      setBookingDuration("Daily");
      setBookingDurationCount("1");
      setBookingAddress("");
      setBookingBaseAmount("500");
      setBookingGstAmount("90");
      setBookingAmount("590");
      setBookingAdvancePaid("0");
      setBookingBalanceAmount("590");
      setBookingPatientName("");
      setBookingPatientAge("");
      setBookingPatientNeeds("");
      setBookingStatus("Pending");
      setBookingAssignedStaff("");
      setBookingAssignedStaffId(null);
      setBookingAssignedStaffRole(null);
      setBookingAssignedStaffPhone(null);
      setBookingPaymentStatus("Unpaid");
      setBookingPaymentMethod("UPI");
      setBookingTransactionId("");
      setBookingPaymentDate("");
      setBookingCaretakerPayout("502");
      setBookingCaretakerPayoutStatus("Unpaid");
      setBookingCaretakerPayoutMethod("");
      setBookingCaretakerPayoutRef("");
      setPayoutCalcMode("percentage");
      setPayoutPercentValue("85");
      setBookingIsMtp(false);
      setBookingSelectedMtpTierId(1);
      setBookingMtpAcceptedAt(null);
      setBookingMtpAcceptedBy(null);
      setBookingMtpAcceptedById(null);
      setBookingMtpAcceptedPhone(null);
    } else if (type === "caregiver") {
      setCaregiverName("");
      setCaregiverPhone("");
      setCaregiverEmail("");
      setCaregiverSpecialty("Elderly Care");
      setCaregiverExperience("3");
      setCaregiverStatus("Pending");
      setCaregiverAadhaar("");
      setCaregiverPan("");
      setCaregiverCertificates("");
      setCaregiverProfilePhoto("");
      setCaregiverExperienceDetails("");
      setCaregiverWorkingLocations("");
      setCaregiverAvailableTimings("");
      setCaregiverState("");
      setCaregiverCity("");
      setCaregiverGoogleMapLocation("");
      setCaregiverExperienceCertificate("");
      setCaregiverPoliceVerification("");
      setCaregiverAdditionalCertificates("");
      setCaregiverReferredBy("");
    } else if (type === "service") {
      setServiceTitle("");
      setServiceShort("");
      setServiceDescription("");
      setServiceBenefits("");
      setServiceDuration("");
      setServicePrice("₹1,200/day");
      setServicePriceVal("1200");
      setServicePriceUnit("day");
      setServiceAdvanceVal("300");
      setServiceCategory("care");
      setServiceComingSoon(false);
      setServiceImage("");
      setServiceAbout("");
      setServiceHighlights("");
      setServiceImages("");
    } else if (type === "blog") {
      setBlogTitle("");
      setBlogDescription("");
      setBlogContent("");
      setBlogImage("");
      setBlogCategory("General");
      setBlogAuthor("Amma Seva Care Team");
      setBlogDate(new Date().toISOString().split("T")[0]);
    } else if (type === "notification") {
      setNotifRecipient("All Users");
      setNotifMessage("");
      setNotifType("Email");
    } else if (type === "faq") {
      setFaqQuestion("");
      setFaqAnswer("");
    } else if (type === "gallery") {
      setGalleryTitle("");
      setGalleryImageUrl("");
    }
  };

  const openEditModal = (type: "booking" | "caregiver" | "service" | "blog" | "faq", record: any) => {
    setModalType(type);
    setModalMode("edit");
    setSelectedId(record.id);

    if (type === "booking") {
      setBookingName(record.name);
      setBookingPhone(record.phone);
      setBookingService(record.service);

      // Parse date range: e.g. "2026-10-22 to 2026-10-25" or single date "2026-10-22"
      let parsedStartDate = getTodayISO();
      let parsedEndDate = getTodayISO();
      if (record.date) {
        if (record.date.includes(" to ")) {
          const parts = record.date.split(" to ");
          parsedStartDate = parts[0]?.trim() || getTodayISO();
          parsedEndDate = parts[1]?.trim() || parsedStartDate;
        } else {
          parsedStartDate = record.date.trim();
          parsedEndDate = record.date.trim();
        }
      }
      setBookingDate(parsedStartDate);
      setBookingModalEndDate(parsedEndDate);
      setBookingTime(record.time || "09:00 AM");

      const rawDur = record.duration || "Daily";
      let parsedDurUnit = "Daily";
      let parsedCount = "1";
      if (rawDur.includes("Hour")) {
        parsedDurUnit = "Hourly";
      } else if (rawDur.includes("Week")) {
        parsedDurUnit = "Weekly";
      } else if (rawDur.includes("Month")) {
        parsedDurUnit = "Monthly";
      } else {
        parsedDurUnit = "Daily";
      }
      setBookingDuration(parsedDurUnit);

      const matchNum = String(rawDur).match(/\d+/);
      if (matchNum) {
        parsedCount = matchNum[0];
      } else if (parsedStartDate && parsedEndDate && parsedStartDate !== parsedEndDate) {
        parsedCount = calculateDaysBetween(parsedStartDate, parsedEndDate).toString();
      }
      setBookingDurationCount(parsedCount);

      setBookingAddress(record.address);
      setBookingStatus(record.status || "Pending");
      let foundId = record.assignedStaffId ? Number(record.assignedStaffId) : null;
      let foundRole = record.assignedStaffRole || null;
      let foundPhone = record.assignedStaffPhone || null;
      if (!foundId && record.assignedStaff) {
        const matchedCg = caregivers.find(c => c.name?.trim().toLowerCase() === record.assignedStaff.trim().toLowerCase());
        if (matchedCg) {
          foundId = matchedCg.id;
          foundRole = "caregiver";
          foundPhone = matchedCg.phone;
        } else {
          const matchedMtp = mtps.find(m => m.name?.trim().toLowerCase() === record.assignedStaff.trim().toLowerCase());
          if (matchedMtp) {
            foundId = matchedMtp.id;
            foundRole = "mtp";
            foundPhone = matchedMtp.phone;
          }
        }
      }
      setBookingAssignedStaff(record.assignedStaff || "");
      setBookingAssignedStaffId(foundId);
      setBookingAssignedStaffRole(foundRole);
      setBookingAssignedStaffPhone(foundPhone);
      const isMtpRecord = Boolean(record.isMtp || (record.service && record.service.toLowerCase().includes("mtp")) || (foundRole === "mtp"));
      setBookingIsMtp(isMtpRecord);
      setBookingMtpAcceptedAt(record.mtpAcceptedAt || null);
      setBookingMtpAcceptedBy(record.mtpAcceptedBy || record.assignedStaff || null);
      setBookingMtpAcceptedById(record.mtpAcceptedById || foundId || null);
      setBookingMtpAcceptedPhone(record.mtpAcceptedPhone || foundPhone || null);
      const parsedAmt = Number(record.amount) || 0;
      const parsedBase = record.baseAmount !== undefined ? Number(record.baseAmount) : (parsedAmt ? Math.round(parsedAmt / 1.18) : 0);
      const parsedGst = record.gstAmount !== undefined ? Number(record.gstAmount) : Math.max(0, parsedAmt - parsedBase);
      setBookingAmount(parsedAmt.toString());
      setBookingBaseAmount(parsedBase.toString());
      setBookingGstAmount(parsedGst.toString());
      setBookingPatientName(record.patientName || "");
      setBookingPatientAge(record.patientAge || "");
      setBookingPatientNeeds(record.patientNeeds || "");
      const isPaidRec = (record.paymentStatus || "").toLowerCase() === "paid" || 
                        (record.balanceAmount !== undefined && Number(record.balanceAmount) <= 0 && parsedAmt > 0) ||
                        (record.advancePaid !== undefined && Number(record.advancePaid) >= parsedAmt && parsedAmt > 0);
      const adv = isPaidRec ? parsedAmt.toString() : (record.advancePaid !== undefined ? record.advancePaid.toString() : "0");
      const bal = isPaidRec ? "0" : (record.balanceAmount !== undefined ? record.balanceAmount.toString() : Math.max(0, parsedAmt - (Number(adv) || 0)).toString());
      setBookingAdvancePaid(adv);
      setBookingBalanceAmount(bal);
      setBookingPaymentStatus(isPaidRec ? "Paid" : (record.paymentStatus || "Unpaid"));
      setBookingPaymentMethod(record.paymentMethod || "");
      setBookingTransactionId(record.transactionId || "");
      setBookingPaymentDate(record.paymentDate || "");
      setBookingCaretakerPayout(record.caretakerPayout?.toString() || "0");
      setBookingCaretakerPayoutStatus(record.caretakerPayoutStatus || "Unpaid");
      setBookingCaretakerPayoutMethod(record.caretakerPayoutMethod || "");
      setBookingCaretakerPayoutRef(record.caretakerPayoutRef || "");
      
      const payoutVal = Number(record.caretakerPayout || 0);
      const bookingAmt = Number(record.amount || 0);
      if (bookingAmt > 0 && payoutVal > 0) {
        const pct = Math.round((payoutVal / bookingAmt) * 100);
        setPayoutPercentValue(pct.toString());
        setPayoutCalcMode(pct === 85 || pct === 15 || pct > 0 ? "percentage" : "fixed");
      } else {
        setPayoutPercentValue("85");
        setPayoutCalcMode("percentage");
      }
      setBookingPatientName(record.patientName || "");
      setBookingPatientAge(record.patientAge || "");
      setBookingPatientNeeds(record.patientNeeds || "");
      setBookingPrescription(record.prescription || "");
      setBookingGoogleMapLocation(record.googleMapLocation || "");
    } else if (type === "caregiver") {
      setCaregiverName(record.name);
      setCaregiverPhone(record.phone);
      setCaregiverEmail(record.email || "");
      setCaregiverSpecialty(record.specialty);
      setCaregiverExperience(record.experience?.toString() || "0");
      setCaregiverStatus(record.status || "Pending");
      setCaregiverAadhaar(record.aadhaar || "");
      setCaregiverPan(record.pan || "");
      setCaregiverCertificates(record.certificates || "");
      setCaregiverProfilePhoto(record.profilePhoto || "");
      setCaregiverExperienceDetails(record.experienceDetails || "");
      setCaregiverWorkingLocations(record.workingLocations || "");
      setCaregiverAvailableTimings(record.availableTimings || "");
      setCaregiverState(record.state || "");
      setCaregiverCity(record.city || "");
      setCaregiverGoogleMapLocation(record.googleMapLocation || "");
      setCaregiverExperienceCertificate(record.experienceCertificate || "");
      setCaregiverPoliceVerification(record.policeVerification || "");
      setCaregiverAdditionalCertificates(record.additionalCertificates || "");
      setCaregiverReferredBy(record.referredBy || "");
    } else if (type === "service") {
      setServiceTitle(record.title);
      setServiceShort(record.short || "");
      setServiceDescription(record.description || "");
      setServiceBenefits(Array.isArray(record.benefits) ? record.benefits.join("\n") : "");
      setServiceDuration(record.duration || "");
      setServicePrice(record.price);
      
      const matchPrice = record.price ? record.price.replace(/,/g, '').match(/\d+/) : null;
      setServicePriceVal(matchPrice ? matchPrice[0] : "1200");
      setServiceAdvanceVal(record.advance !== undefined ? String(record.advance) : "300");
      const lowerPrice = (record.price || "").toLowerCase();
      let extractedUnit = "day";
      if (lowerPrice.includes("month")) extractedUnit = "month";
      else if (lowerPrice.includes("week")) extractedUnit = "week";
      else if (lowerPrice.includes("hour")) extractedUnit = "hour";
      setServicePriceUnit(extractedUnit);

      setServiceCategory(record.category || "care");
      setServiceComingSoon(!!record.comingSoon);
      setServiceImage(record.image || "");
      setServiceAbout(record.about || "");
      setServiceHighlights(Array.isArray(record.highlights) ? record.highlights.join("\n") : "");
      setServiceImages(Array.isArray(record.images) ? record.images.join("\n") : "");
    } else if (type === "blog") {
      setBlogTitle(record.title);
      setBlogDescription(record.description || "");
      setBlogContent(record.content || "");
      setBlogImage(record.image || "");
      setBlogCategory(record.category || "General");
      setBlogAuthor(record.author || "Amma Seva Care Team");
      setBlogDate(record.date || new Date().toISOString().split("T")[0]);
    } else if (type === "faq") {
      setFaqQuestion(record.question);
      setFaqAnswer(record.answer);
    }
  };

  // Quick settle booking balance in Accounts
  const handleQuickSettleBooking = async (b: Booking) => {
    const tot = Number(b.amount || 0);
    const adv = Number(b.advancePaid || 0);
    const balDue = (b.balanceAmount !== undefined && b.balanceAmount !== null)
      ? Number(b.balanceAmount)
      : Math.max(0, tot - adv);

    if (!window.confirm(`Mark Booking #${b.id} (${b.name}) as 100% Settled?\n\n• Current Outstanding Balance: ₹${balDue.toLocaleString('en-IN')}\n• This will set remaining balance to ₹0 and update payment status to Settled.\n\nProceed with settlement?`)) {
      return;
    }

    setIsSettlingBookingId(b.id);
    try {
      const token = localStorage.getItem("ammaseva_admin_token");
      const res = await fetch(`/api/admin/booking/${b.id}/settle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod: "Direct Cash / UPI Settlement",
          transactionId: `ADMIN-SETTLE-${Date.now().toString().slice(-6)}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setAccountsSuccessToast(`✅ Booking #${b.id} (${b.name}) has been 100% settled! Remaining balance is now ₹0.`);
        setTimeout(() => setAccountsSuccessToast(null), 4500);
        await fetchDashboardData();
      } else {
        alert(data.error || "Failed to settle booking balance.");
      }
    } catch (err: any) {
      console.error("Settlement error:", err);
      alert("Error occurred while processing settlement.");
    } finally {
      setIsSettlingBookingId(null);
    }
  };

  // Download filtered accounts data as clean Excel-compatible CSV with UTF-8 BOM
  const handleDownloadAccountsExcel = (records: Booking[]) => {
    if (!records || records.length === 0) {
      alert("No accounting records found in current filter to export.");
      return;
    }

    const headers = [
      "Booking Ref",
      "Booking Date",
      "Customer Name",
      "Patient Name",
      "Phone Number",
      "Service Booked",
      "Base Taxable Value (INR)",
      "CGST 9% (INR)",
      "SGST 9% (INR)",
      "Total GST 18% (INR)",
      "Gross Invoiced Total (INR)",
      "Total Collected (INR)",
      "Balance Due (INR)",
      "Settlement Status",
      "Payment Mode",
      "Transaction Ref",
      "Payment Date"
    ];

    const cleanField = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${str}"`;
    };

    let totalBase = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;
    let totalGross = 0;
    let totalCollected = 0;
    let totalBalance = 0;

    const rows = records.map((b) => {
      const totalAmount = Number(b.amount || 0);
      const isPaid = (b.paymentStatus || "").toLowerCase() === "paid" || 
                     (b.balanceAmount !== undefined && Number(b.balanceAmount) <= 0 && totalAmount > 0) ||
                     (b.advancePaid !== undefined && Number(b.advancePaid) >= totalAmount && totalAmount > 0);
      const collected = isPaid ? totalAmount : (b.advancePaid !== undefined ? Number(b.advancePaid) : 0);
      const balanceDue = isPaid ? 0 : (b.balanceAmount !== undefined && b.balanceAmount !== null ? Math.max(0, Number(b.balanceAmount)) : Math.max(0, totalAmount - collected));
      const baseAmount = Number(b.baseAmount) || Math.round(totalAmount / 1.18);
      const gstAmount = Number(b.gstAmount) !== undefined ? Number(b.gstAmount) : Math.max(0, totalAmount - baseAmount);
      const cgst = Math.round(gstAmount / 2);
      const sgst = gstAmount - cgst;
      const statusLabel = balanceDue <= 0 ? "Settled" : "Pending Balance";

      totalBase += baseAmount;
      totalCgst += cgst;
      totalSgst += sgst;
      totalGst += gstAmount;
      totalGross += totalAmount;
      totalCollected += collected;
      totalBalance += balanceDue;

      return [
        cleanField(`BK-${b.id}`),
        cleanField(b.date || (b.createdAt ? b.createdAt.slice(0, 10) : "")),
        cleanField(b.name || "Customer"),
        cleanField(b.patientName || b.name || "—"),
        cleanField(b.phone || ""),
        cleanField(b.service || "Healthcare Support"),
        baseAmount,
        cgst,
        sgst,
        gstAmount,
        totalAmount,
        collected,
        balanceDue,
        cleanField(statusLabel),
        cleanField(b.paymentMethod || (isPaid ? "Paid" : "Pending")),
        cleanField(b.transactionId || "—"),
        cleanField(b.paymentDate || "—")
      ].join(",");
    });

    // Summary row at the bottom
    const summaryRow = [
      cleanField("TOTAL / SUMMARY"),
      cleanField(""),
      cleanField(`${records.length} Transactions`),
      cleanField(""),
      cleanField(""),
      cleanField(""),
      totalBase,
      totalCgst,
      totalSgst,
      totalGst,
      totalGross,
      totalCollected,
      totalBalance,
      cleanField(totalBalance <= 0 ? "All 100% Settled" : `Pending Balance: INR ${totalBalance.toLocaleString('en-IN')}`),
      cleanField(""),
      cleanField(""),
      cleanField("")
    ].join(",");

    const csvContent = "\uFEFF" + [headers.join(","), ...rows, summaryRow].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `Amma_Seva_Accounts_Ledger_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Submit forms
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("ammaseva_admin_token");

    let url = "";
    let method = "POST";
    let bodyData: any = {};

    if (modalType === "booking") {
      const nameErr = validateName(bookingName, "Customer name");
      if (nameErr) {
        alert(nameErr);
        return;
      }

      const phoneErr = validatePhone(bookingPhone, "Customer phone number");
      if (phoneErr) {
        alert(phoneErr);
        return;
      }

      const addrErr = validateAddress(bookingAddress, "Patient location address");
      if (addrErr) {
        alert(addrErr);
        return;
      }

      const finalBookingDate = (!bookingIsMtp && bookingDuration !== "Hourly" && bookingModalEndDate && bookingModalEndDate !== bookingDate)
        ? `${bookingDate} to ${bookingModalEndDate}`
        : (bookingDate || getTodayISO());

      const displayCount = Number(bookingDurationCount) || 1;
      const formattedDuration = bookingIsMtp
        ? bookingDuration
        : `${displayCount} ${
            bookingDuration === "Hourly" ? (displayCount === 1 ? "Hour" : "Hours") :
            bookingDuration === "Daily" ? (displayCount === 1 ? "Day" : "Days") :
            bookingDuration === "Weekly" ? (displayCount === 1 ? "Week" : "Weeks") :
            (displayCount === 1 ? "Month" : "Months")
          }`;

      setIsLoading(true);
      url = modalMode === "add" ? "/api/admin/booking" : `/api/admin/booking/${selectedId}`;
      method = modalMode === "add" ? "POST" : "PUT";
      const finalAmountNum = Number(bookingAmount) || 1200;
      const isPaidBooking = bookingPaymentStatus === "Paid" || 
                           (bookingBalanceAmount !== undefined && Number(bookingBalanceAmount) <= 0 && finalAmountNum > 0) ||
                           (bookingAdvancePaid !== undefined && Number(bookingAdvancePaid) >= finalAmountNum && finalAmountNum > 0);
      const finalAdvancePaid = isPaidBooking ? finalAmountNum : (Number(bookingAdvancePaid) || 0);
      const finalBalanceAmount = isPaidBooking ? 0 : (Number(bookingBalanceAmount) !== undefined ? Math.max(0, Number(bookingBalanceAmount)) : Math.max(0, finalAmountNum - finalAdvancePaid));
      const finalPaymentStatus = isPaidBooking || finalBalanceAmount <= 0 ? "Paid" : (finalAdvancePaid > 0 ? "Advance Paid" : (bookingPaymentStatus || "Unpaid"));

      bodyData = {
        name: bookingName.trim(),
        phone: bookingPhone.replace(/\D/g, ""),
        service: bookingService,
        date: finalBookingDate,
        time: bookingTime,
        duration: formattedDuration,
        address: bookingAddress.trim(),
        amount: finalAmountNum,
        baseAmount: Number(bookingBaseAmount) || Math.round(finalAmountNum / 1.18),
        gstAmount: Number(bookingGstAmount) !== undefined ? Number(bookingGstAmount) : Math.round(finalAmountNum - (Number(bookingBaseAmount) || Math.round(finalAmountNum / 1.18))),
        advancePaid: finalAdvancePaid,
        balanceAmount: finalBalanceAmount,
        caretakerPayout: Number(bookingCaretakerPayout) || 0,
        caretakerPayoutStatus: bookingCaretakerPayoutStatus,
        caretakerPayoutMethod: bookingCaretakerPayoutMethod,
        caretakerPayoutRef: bookingCaretakerPayoutRef,
        status: bookingStatus,
        assignedStaff: bookingAssignedStaff || null,
        assignedStaffId: bookingAssignedStaffId || null,
        assignedStaffRole: bookingAssignedStaffRole || null,
        assignedStaffPhone: bookingAssignedStaffPhone || null,
        paymentStatus: finalPaymentStatus,
        paymentMethod: bookingPaymentMethod || (isPaidBooking ? "Cash/Direct" : ""),
        transactionId: bookingTransactionId,
        paymentDate: bookingPaymentDate || (isPaidBooking ? new Date().toISOString() : ""),
        patientName: bookingPatientName,
        patientAge: bookingPatientAge,
        patientNeeds: bookingPatientNeeds,
        prescription: bookingPrescription,
        googleMapLocation: bookingGoogleMapLocation,
        isMtp: bookingIsMtp ? 1 : 0,
        mtpAcceptedAt: bookingMtpAcceptedAt,
        mtpAcceptedBy: bookingMtpAcceptedBy,
        mtpAcceptedById: bookingMtpAcceptedById,
        mtpAcceptedPhone: bookingMtpAcceptedPhone
      };
    } else if (modalType === "caregiver") {
      const nameErr = validateName(caregiverName, "Staff full name");
      if (nameErr) {
        alert(nameErr);
        return;
      }

      const phoneErr = validatePhone(caregiverPhone, "Staff phone number");
      if (phoneErr) {
        alert(phoneErr);
        return;
      }

      const emailErr = validateEmail(caregiverEmail, true, "Staff email address");
      if (emailErr) {
        alert(emailErr);
        return;
      }

      const aadhaarErr = validateAadhaar(caregiverAadhaar, false);
      if (aadhaarErr) {
        alert(aadhaarErr);
        return;
      }

      const panErr = validatePAN(caregiverPan, false);
      if (panErr) {
        alert(panErr);
        return;
      }

      setIsLoading(true);
      url = modalMode === "add" ? "/api/caregiver" : `/api/admin/caregiver/${selectedId}`;
      method = modalMode === "add" ? "POST" : "PUT";
      bodyData = {
        name: caregiverName.trim(),
        phone: caregiverPhone.replace(/\D/g, ""),
        email: caregiverEmail.trim().toLowerCase(),
        specialty: caregiverSpecialty,
        experience: Number(caregiverExperience) || 1,
        status: caregiverStatus,
        aadhaar: caregiverAadhaar,
        pan: caregiverPan,
        certificates: caregiverCertificates,
        profilePhoto: caregiverProfilePhoto,
        experienceDetails: caregiverExperienceDetails,
        workingLocations: caregiverWorkingLocations,
        availableTimings: caregiverAvailableTimings,
        state: caregiverState,
        city: caregiverCity,
        googleMapLocation: caregiverGoogleMapLocation,
        experienceCertificate: caregiverExperienceCertificate,
        policeVerification: caregiverPoliceVerification,
        additionalCertificates: caregiverAdditionalCertificates,
        referredBy: caregiverReferredBy.trim().toUpperCase()
      };
      if (modalMode === "add") {
        bodyData.password = Math.random().toString(36).slice(-8) + "A1!";
      }
    } else if (modalType === "service") {
      url = modalMode === "add" ? "/api/services" : `/api/services/${selectedId}`;
      method = modalMode === "add" ? "POST" : "PUT";
      
      const priceString = `Starting ₹${servicePriceVal} / ${servicePriceUnit}`;
      
      bodyData = {
        title: serviceTitle,
        slug: serviceTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        short: serviceShort,
        description: serviceDescription,
        benefits: serviceBenefits.split("\n").map(b => b.trim()).filter(Boolean),
        duration: serviceDuration,
        price: priceString,
        category: serviceCategory,
        comingSoon: serviceComingSoon,
        image: serviceImage,
        about: serviceAbout,
        highlights: serviceHighlights.split("\n").map(h => h.trim()).filter(Boolean),
        images: serviceImages.split("\n").map(img => img.trim()).filter(Boolean),
        advance: Number(serviceAdvanceVal) || 0
      };
    } else if (modalType === "blog") {
      url = modalMode === "add" ? "/api/blogs" : `/api/blogs/${selectedId}`;
      method = modalMode === "add" ? "POST" : "PUT";
      bodyData = {
        title: blogTitle,
        slug: blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: blogDescription,
        content: blogContent,
        image: blogImage,
        category: blogCategory,
        author: blogAuthor,
        date: blogDate
      };
    } else if (modalType === "notification") {
      url = "/api/notifications";
      method = "POST";
      bodyData = {
        recipient: notifRecipient,
        message: notifMessage,
        type: notifType
      };

      if (notifType === "Broadcast") {
        // Also broadcast system wide notice
        fetch("/api/announcements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            message: notifMessage,
            target: notifRecipient === "All Users" || notifRecipient === "All" ? "All" : 
                    notifRecipient.toLowerCase().includes("caregiver") || notifRecipient.toLowerCase().includes("staff") ? "Caregivers" : "Patients"
          })
        }).catch(err => console.error("Announcement broadcast failed:", err));
      }
    } else if (modalType === "faq") {
      url = modalMode === "add" ? "/api/faqs" : `/api/faqs/${selectedId}`;
      method = modalMode === "add" ? "POST" : "PUT";
      bodyData = {
        question: faqQuestion,
        answer: faqAnswer
      };
    } else if (modalType === "gallery") {
      url = modalMode === "add" ? "/api/gallery" : `/api/gallery/${selectedId}`;
      method = modalMode === "add" ? "POST" : "PUT";
      bodyData = {
        title: galleryTitle,
        imageUrl: galleryImageUrl
      };
    }

    fetch(url, {
      method,
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(bodyData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchDashboardData();
          setModalType(null);
          if (modalType === "notification") {
            setNotifMessage("");
            alert(`✅ ${data.message || "Alert notification successfully dispatched!"}`);
          }
        } else {
          alert(data.error || "Failed to update record.");
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  // Calculations for Reports / Overview
  const totalRevenue = bookings
    .filter(b => b?.paymentStatus === "Paid" && b?.status !== "Cancelled")
    .reduce((sum, b) => sum + (Number(b?.amount) || 0), 0);

  const pendingBookingsCount = bookings.filter(b => b?.status === "Pending").length;
  const verifiedCaregiversCount = caregivers.filter(c => c?.status === "Verified").length;
  const caregiverUtilizationRate = caregivers.length > 0 
    ? Math.round((bookings.filter(b => b?.status === "Confirmed" && b?.assignedStaff).length / caregivers.length) * 100)
    : 0;

  // Caregiver Ratings & Reviews aggregate
  const verifiedCaregivers = caregivers.filter(c => c?.status === "Verified" && Number(c?.rating) > 0);
  const avgPlatformRating = verifiedCaregivers.length > 0
    ? Number((verifiedCaregivers.reduce((sum, c) => sum + (Number(c?.rating) || 0), 0) / verifiedCaregivers.length).toFixed(1))
    : 4.8;

  // Collect, filter, and sort all caregiver reviews for the global Care Rating card view
  const allPlatformReviews = caregivers.flatMap(cg => 
    (cg?.reviews || []).map((rev: any) => ({
      ...rev,
      caregiverId: cg?.id,
      caregiverName: cg?.name || "Staff Member",
      caregiverSpecialty: cg?.specialty || "Care Professional",
      caregiverPhoto: cg?.profilePhoto || ""
    }))
  );

  const filteredAndSortedPlatformReviews = allPlatformReviews
    .filter((rev: any) => {
      const q = reviewsSearchQuery.toLowerCase();
      const matchCg = (rev?.caregiverName || "").toLowerCase().includes(q);
      const matchComment = rev?.comment && rev.comment.toLowerCase().includes(q);
      return !reviewsSearchQuery || matchCg || matchComment;
    })
    .sort((a: any, b: any) => {
      const ratingA = Number(a?.rating || 0);
      const ratingB = Number(b?.rating || 0);
      if (reviewsSortOrder === "high-to-low") {
        return ratingB - ratingA;
      } else {
        return ratingA - ratingB;
      }
    });

  const activeShiftsCount = bookings.filter(b => b?.status === "Active").length;

  // Monthly Revenue Data (last 6 months)
  const getMonthlyRevenueData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthIdx = d.getMonth();
      const monthLabel = months[monthIdx];
      
      const monthlyRevenue = bookings
        .filter(b => {
          if (b?.paymentStatus !== "Paid" || b?.status === "Cancelled") return false;
          const bDate = new Date(b?.createdAt || b?.date || Date.now());
          return !isNaN(bDate.getTime()) && bDate.getMonth() === monthIdx;
        })
        .reduce((sum, b) => sum + (Number(b?.amount) || 0), 0);

      data.push({ label: monthLabel, value: monthlyRevenue });
    }
    const maxVal = Math.max(...data.map(d => d.value), 1000);
    return data.map(d => ({
      label: d.label,
      value: d.value,
      height: Math.max(10, Math.round((d.value / (maxVal || 1000)) * 80))
    }));
  };
  const monthlyRevenueChart = getMonthlyRevenueData();

  // Service distribution details
  const getServiceDistribution = () => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      const sName = (b?.service && b.service.trim()) || "Home Healthcare Support";
      counts[sName] = (counts[sName] || 0) + 1;
    });
    const total = bookings.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count).slice(0, 4);
  };
  const serviceDistribution = getServiceDistribution();

  // Search logic
  const filteredBookings = bookings.filter(b => 
    (b?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b?.phone || "").includes(searchQuery) ||
    (b?.service || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCaregivers = caregivers.filter(c => {
    const q = searchQuery.toLowerCase();
    const refCode = getCaregiverReferralCode(c).toLowerCase();
    return (
      (c?.name || "").toLowerCase().includes(q) ||
      (c?.phone || "").includes(searchQuery) ||
      (c?.specialty || "").toLowerCase().includes(q) ||
      refCode.includes(q) ||
      ((c?.uniqueId || "").toLowerCase().includes(q)) ||
      ((c?.referCode || "").toLowerCase().includes(q)) ||
      ((c?.referralCode || "").toLowerCase().includes(q))
    );
  });

  const filteredEnquiries = enquiries.filter(e => 
    (e?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e?.phone || "").includes(searchQuery) ||
    ((e?.service || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = users.filter(u => 
    (u?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u?.phone || "").includes(searchQuery) ||
    ((u?.email || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredServices = services.filter(s => 
    (s?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    ((s?.description || "").toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredNotifications = notifications.filter(n => 
    (n?.recipient || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n?.message || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1e2a5a] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground font-medium">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:h-screen lg:overflow-hidden bg-[#fafafc] text-slate-800 font-sans flex flex-col lg:flex-row">
      
      {/* LEFT SIDEBAR Layout */}
      <aside className="w-full lg:w-64 xl:w-72 bg-[#1e2a5a] text-slate-100 border-b lg:border-b-0 lg:border-r border-[#1e2a5a]/10 flex flex-col shrink-0 lg:h-full lg:overflow-y-auto z-30 shadow-xl shadow-black/10">
        
        {/* Brand Header */}
        <div className="px-6 py-4 lg:py-6 border-b border-white/10 flex items-center justify-between gap-3 bg-[#172147]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#c9a24c] to-[#f4d793] flex items-center justify-center font-bold text-xl text-[#1e2a5a] shadow-md shadow-black/20">
              A
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white font-display">
                Amma Seva
              </span>
              <p className="text-[9px] text-[#c9a24c] tracking-widest uppercase font-bold">Systems admin</p>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 text-slate-300 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          >
            {isMobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Sidebar Nav Items and bottom components - collapses on mobile */}
        <div className={`flex-col flex-1 lg:flex ${isMobileNavOpen ? "flex bg-[#1e2a5a]" : "hidden lg:flex"}`}>
          <nav className="p-4 space-y-1.5 flex-1">
            {[
              { id: "overview", label: "Dashboard", icon: LayoutDashboard },
              { id: "bookings", label: "Manage Bookings", icon: CalendarDays },
              { 
                id: "accounts", 
                label: "Accounts", 
                icon: Landmark,
                badge: bookings.filter(b => {
                  const tot = Number(b.amount || 0);
                  const isPaid = (b.paymentStatus || "").toLowerCase() === "paid" || 
                                 (b.balanceAmount !== undefined && Number(b.balanceAmount) <= 0 && tot > 0) ||
                                 (b.advancePaid !== undefined && Number(b.advancePaid) >= tot && tot > 0);
                  return !isPaid && b.status !== "Cancelled";
                }).length 
              },
              { id: "invoices", label: "Invoices & Billing", icon: Receipt },
              { id: "caregivers", label: "Employees & Staff", icon: UserCheck },
              { id: "id-cards", label: "Staff ID Cards", icon: CreditCard, badge: idCards.length },
              { id: "referrals", label: "Referral Network", icon: Gift, badge: referralsData?.summary?.totalPending || 0 },
              { id: "mtps", label: "MTP Registrations", icon: Briefcase, badge: mtps.filter(m => m.status === "Pending").length },
              { id: "users", label: "All Users", icon: Users },
              { id: "services", label: "Services", icon: Sliders },
              { id: "payments", label: "Payment Status", icon: DollarSign },
              { id: "salaries", label: "Staff Salaries", icon: Coins },
              { id: "notifications", label: "Alert Notifications", icon: Bell },
              { id: "enquiries", label: "Customer Leads", icon: MessageSquare },
              { id: "blogs", label: "Health Blogs", icon: BookOpen },
              { id: "faqs", label: "Manage FAQs", icon: HelpCircle },
              { id: "gallery", label: "Photo Gallery", icon: Image }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const pendingCount = (item as any).badge || 0;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/10 text-[#c9a24c] border-l-4 border-[#c9a24c] rounded-r-xl rounded-l-none pl-3"
                      : "text-slate-300 hover:bg-white/5 hover:text-white rounded-xl"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[#c9a24c]" : "text-slate-400"}`} />
                    {item.label}
                  </div>
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white shadow-xs">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status Indicators & Sign Out bottom */}
          <div className="p-4 border-t border-white/10 space-y-4">
            <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">MySQL Database</span>
                <span className="text-[#59e3a6] font-bold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Live
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Environment</span>
                <span className="font-semibold text-white">Production</span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-300 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out Session
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN PANEL Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-full lg:overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0">
          
          {/* Search box */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:border-[#c9a24c] transition-colors text-slate-700"
            />
          </div>

          {/* User profile / notification buttons */}
          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={fetchDashboardData}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative transition-colors"
              title="Sync Database"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#1e2a5a] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
            </button>
            
            <div className="h-9 w-9 rounded-full bg-[#1e2a5a] border border-[#c9a24c]/40 flex items-center justify-center text-sm font-bold text-white uppercase select-none shadow-sm shadow-black/10">
              A
            </div>
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-7 flex-1 overflow-y-auto">
          <AdminErrorBoundary activeTab={activeTab}>
            {isLoading && bookings.length === 0 ? (
              <div className="space-y-6 animate-pulse text-left">
                {/* Top Banner Skeleton */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-slate-200 rounded-lg"></div>
                    <div className="h-3.5 w-72 bg-slate-100 rounded-md"></div>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-[#1e2a5a] bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60">
                    <div className="w-4 h-4 border-2 border-[#1e2a5a] border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading database records...</span>
                  </div>
                </div>

                {/* 5 Metric Cards Skeleton */}
                <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-5 h-28 flex flex-col justify-between">
                      <div className="h-3 w-20 bg-slate-200 rounded"></div>
                      <div className="h-7 w-28 bg-slate-300 rounded-md"></div>
                      <div className="h-2.5 w-24 bg-slate-100 rounded"></div>
                    </div>
                  ))}
                </div>

                {/* Content Box Skeleton */}
                <div className="grid gap-6 lg:grid-cols-12">
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 h-64 lg:col-span-4 flex flex-col justify-between">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="w-28 h-28 rounded-full bg-slate-100 mx-auto"></div>
                    <div className="h-3 w-40 bg-slate-100 rounded"></div>
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 h-64 lg:col-span-8 flex flex-col justify-between">
                    <div className="h-4 w-40 bg-slate-200 rounded"></div>
                    <div className="h-36 bg-slate-50 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ) : error && bookings.length === 0 ? (
              <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ⚠️
                </div>
                <h3 className="text-lg font-bold text-slate-800">Connection to Database Delayed</h3>
                <p className="text-xs text-slate-500">
                  Could not sync live records automatically. Click retry to reconnect.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={fetchDashboardData}
                    className="px-4 py-2 bg-[#1e2a5a] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#283875] transition-colors"
                  >
                    Retry Sync
                  </button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "overview" && (() => {
            // Helper to draw circular stats
            const renderCircularProgress = (percentage: number, strokeColor: string, label: string) => (
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f8fafc" strokeWidth="3.5" />
                  <circle 
                    cx="18" cy="18" r="15.915" fill="none" 
                    stroke={strokeColor} strokeWidth="3.5" 
                    strokeDasharray={`${Math.min(100, Math.max(5, percentage))}, 100`} 
                    strokeLinecap="round" 
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-[#1e2a5a] font-sans">
                  {label}
                </div>
              </div>
            );

            // Compute donut ring stats for service distribution
            const topServices = serviceDistribution.slice(0, 3);
            const totalServiceCount = topServices.reduce((sum, s) => sum + s.count, 0) || 1;

            return (
              <div className="space-y-6 text-left animate-in fade-in duration-200">
                {/* Row 1: Five Premium Metric Cards */}
                <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {/* Revenue Card */}
                  <div 
                    onClick={() => setActiveTab("payments")}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card flex justify-between items-center relative overflow-hidden border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Revenue</span>
                      <span className="text-2xl font-black font-display text-slate-950 mt-1 block">
                        ₹{totalRevenue.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-extrabold block mt-0.5">● Collected Payouts</span>
                    </div>
                    {renderCircularProgress(85, "#10b981", "85%")}
                  </div>

                  {/* Bookings Card */}
                  <div 
                    onClick={() => setActiveTab("bookings")}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card flex justify-between items-center relative overflow-hidden border-l-4 border-l-[#1e2a5a] cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Bookings</span>
                      <span className="text-2xl font-black font-display text-slate-950 mt-1 block">
                        {bookings.length}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">● Total allocation request</span>
                    </div>
                    {renderCircularProgress(72, "#1e2a5a", `${bookings.length}`)}
                  </div>

                  {/* All Users Card */}
                  <div 
                    onClick={() => setActiveTab("users")}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card flex justify-between items-center relative overflow-hidden border-l-4 border-l-cyan-500 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">All Registered Users</span>
                      <span className="text-2xl font-black font-display text-slate-950 mt-1 block">
                        {users.length + caregivers.length + mtps.length}
                      </span>
                      <span className="text-[9px] text-cyan-700 font-bold block mt-0.5">● {users.length} Patients • {caregivers.length} Staff • {mtps.length} MTP</span>
                    </div>
                    {renderCircularProgress(90, "#06b6d4", `${users.length + caregivers.length + mtps.length}`)}
                  </div>

                  {/* Caretakers Card */}
                  {(() => {
                    const verifiedCgs = caregivers.filter(c => c.status === "Verified").length;
                    const cgPercentage = caregivers.length > 0 ? Math.round((verifiedCgs / caregivers.length) * 100) : 100;
                    return (
                      <div 
                        onClick={() => setActiveTab("caregivers")}
                        className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card flex justify-between items-center relative overflow-hidden border-l-4 border-l-indigo-500 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Caretakers</span>
                          <span className="text-2xl font-black font-display text-slate-950 mt-1 block">
                            {caregivers.length}
                          </span>
                          <span className="text-[9px] text-indigo-600 font-bold block mt-0.5">● Verified: {verifiedCgs} active</span>
                        </div>
                        {renderCircularProgress(cgPercentage, "#6366f1", `${cgPercentage}%`)}
                      </div>
                    );
                  })()}

                  {/* Ratings Card */}
                  <div 
                    onClick={() => setIsAllReviewsModalOpen(true)}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card flex justify-between items-center relative overflow-hidden border-l-4 border-l-[#c9a24c] cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Care Rating</span>
                      <span className="text-2xl font-black font-display text-slate-950 mt-1 block">
                        {avgPlatformRating.toFixed(1)} ⭐
                      </span>
                      <span className="text-[9px] text-[#c9a24c] font-bold block mt-0.5">● Platform average score</span>
                    </div>
                    {renderCircularProgress(avgPlatformRating * 20, "#c9a24c", `${avgPlatformRating.toFixed(1)}`)}
                  </div>
                </div>

                {/* Row 2: Analytics & Charts */}
                <div className="grid gap-6 lg:grid-cols-12">
                  {/* Service Distribution Pie/Donut Legend */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-4 flex flex-col justify-between hover:shadow-md transition-all premium-card">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e2a5a] mb-4">Service distribution</h3>
                      
                      <div className="flex justify-center py-4 relative">
                        {/* Custom visual Concentric Donut Rings */}
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f8fafc" strokeWidth="3" />
                          {topServices.map((item, idx) => {
                            const colors = ["#1e2a5a", "#c9a24c", "#06b6d4"];
                            const radius = 15.915 - idx * 2.5;
                            const percentage = Math.round((item.count / totalServiceCount) * 100);
                            return (
                              <circle 
                                key={item.name}
                                cx="18" cy="18" r={radius} fill="none" 
                                stroke={colors[idx % colors.length]} strokeWidth="2.2" 
                                strokeDasharray={`${percentage}, 100`} 
                                strokeLinecap="round"
                              />
                            );
                          })}
                        </svg>
                      </div>

                      <div className="space-y-3.5 mt-4">
                        {serviceDistribution.map((item, idx) => {
                          const colors = ["bg-[#1e2a5a]", "bg-[#c9a24c]", "bg-[#06b6d4]", "bg-slate-400"];
                          return (
                            <div key={item.name} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-slate-700 truncate max-w-[70%] font-semibold flex items-center gap-1.5">
                                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${colors[idx % colors.length]}`} />
                                  {item.name}
                                </span>
                                <span className="text-slate-400 font-extrabold">{item.percentage}% ({item.count})</span>
                              </div>
                            </div>
                          );
                        })}
                        {serviceDistribution.length === 0 && (
                          <p className="text-xs text-slate-400 italic">No service bookings found.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Revenue Trends Column Chart */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm lg:col-span-8 flex flex-col justify-between hover:shadow-md transition-all premium-card">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e2a5a]">Financial Revenue Trends</h3>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Monthly platform earnings metrics based on completed shifts.</span>
                      </div>
                      <button 
                        onClick={() => window.print()}
                        className="px-3.5 py-1.5 rounded-xl border border-[#1e2a5a]/25 bg-slate-50 hover:bg-slate-100 text-[#1e2a5a] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                      >
                        Generate Report PDF
                      </button>
                    </div>

                    {/* SVG Column Chart with proper dynamic height rendering */}
                    <div className="h-44 flex items-end justify-between gap-6 px-4">
                      {monthlyRevenueChart.map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                          <div className="w-full flex items-end justify-center h-32 relative">
                            {/* Payout hover tooltip indicator */}
                            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1e2a5a] text-[#c9a24c] text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none z-10">
                              ₹{item.value.toLocaleString()}
                            </div>
                            
                            <div 
                              style={{ height: `${item.height}%` }}
                              className="bg-gradient-to-t from-[#1e2a5a]/80 to-[#1e2a5a] group-hover:from-[#c9a24c] group-hover:to-[#c9a24c] transition-all duration-300 rounded-t-lg w-8 sm:w-10 shadow-sm flex flex-col justify-end items-center text-[8px] text-white font-extrabold pb-1.5"
                            >
                              {item.value > 0 && <span className="mb-0.5 truncate px-0.5">₹{item.value > 999 ? `${(item.value/1000).toFixed(0)}k` : item.value}</span>}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 3: Recently Registered Caregivers / Staff */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all premium-card">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1e2a5a]">Active staff &amp; caretakers</h3>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Recently registered health professionals and their current credentials.</span>
                    </div>
                    <button
                      onClick={() => setActiveTab("caregivers")}
                      className="text-xs font-bold text-[#c9a24c] hover:underline cursor-pointer"
                    >
                      Manage Staff &rarr;
                    </button>
                  </div>

                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {caregivers.slice(0, 4).map((cg) => (
                      <div key={cg.id} className="border border-slate-100 hover:border-[#c9a24c]/40 rounded-xl p-4 bg-slate-50/30 flex flex-col justify-between items-center text-center gap-3 transition-colors">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#1e2a5a]/20 to-[#1e2a5a]/5 flex items-center justify-center font-bold text-[#1e2a5a] border border-[#1e2a5a]/10">
                          {(cg?.name || "S").charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{cg?.name || "Staff Member"}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{cg?.specialty || "Care Professional"}</span>
                          <span className="text-[9px] text-slate-450 font-medium block mt-0.5">{cg?.phone || "—"}</span>
                        </div>
                        <div>
                          {cg.status === "Verified" ? (
                            <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-bold">
                              ● Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {caregivers.length === 0 && (
                      <p className="col-span-full py-6 text-center text-xs text-slate-400 italic">No registered staff found in records.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Bookings View panel */}
          {activeTab === "bookings" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Top Title & Action Header */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm premium-card gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-[#1e2a5a]/10 text-[#1e2a5a] flex items-center justify-center font-bold">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-extrabold text-[#1e2a5a] font-display">Manage Bookings</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Monitor real-time patient requests, assign caregivers, track shift statuses, and collect payments.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={fetchDashboardData}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    title="Refresh Bookings"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => openAddModal("booking")}
                    className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="h-4 w-4" /> Add New Booking
                  </button>
                </div>
              </div>

              {/* Quick Bookings Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 text-left">
                <div 
                  onClick={() => setBookingStatusFilter("all")}
                  className={`bg-white border rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xs sm:shadow-sm flex items-center gap-2 sm:gap-3.5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    bookingStatusFilter === "all" ? "border-[#1e2a5a] ring-2 ring-[#1e2a5a]/20" : "border-slate-200/80 hover:border-slate-300"
                  }`}
                >
                  <div className="p-2 sm:p-3 bg-indigo-50 text-[#1e2a5a] rounded-lg sm:rounded-xl shrink-0">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">
                      <span className="hidden sm:inline">Total Bookings</span>
                      <span className="sm:hidden">Total</span>
                    </span>
                    <span className="text-base sm:text-xl font-extrabold text-[#1e2a5a] font-display block truncate">
                      {bookings.length}
                    </span>
                  </div>
                </div>

                <div 
                  onClick={() => setBookingStatusFilter("unassigned")}
                  className={`bg-white border rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xs sm:shadow-sm flex items-center gap-2 sm:gap-3.5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    bookingStatusFilter === "unassigned" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200/80 hover:border-amber-300"
                  }`}
                >
                  <div className="p-2 sm:p-3 bg-amber-50 text-amber-700 rounded-lg sm:rounded-xl shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">
                      <span className="hidden sm:inline">Unassigned Shifts</span>
                      <span className="sm:hidden">Unassigned</span>
                    </span>
                    <span className="text-base sm:text-xl font-extrabold text-amber-800 font-display block truncate">
                      {bookings.filter(b => !b.assignedStaff && b.status !== "Cancelled").length}
                    </span>
                  </div>
                </div>

                <div 
                  onClick={() => setBookingStatusFilter("active")}
                  className={`bg-white border rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xs sm:shadow-sm flex items-center gap-2 sm:gap-3.5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    bookingStatusFilter === "active" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200/80 hover:border-emerald-300"
                  }`}
                >
                  <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl shrink-0">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">
                      <span className="hidden sm:inline">Active Shifts</span>
                      <span className="sm:hidden">Active</span>
                    </span>
                    <span className="text-base sm:text-xl font-extrabold text-emerald-700 font-display block truncate">
                      {bookings.filter(b => b.status === "Confirmed" || b.status === "Active").length}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xs sm:shadow-sm flex items-center gap-2 sm:gap-3.5">
                  <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl shrink-0">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block truncate">
                      <span className="hidden sm:inline">Advance Revenue</span>
                      <span className="sm:hidden">Advance</span>
                    </span>
                    <span 
                      className="text-xs xs:text-sm sm:text-base md:text-xl font-black text-emerald-800 font-display block truncate"
                      title={`₹${bookings.reduce((sum, b) => sum + Number(b.advancePaid || 0), 0).toLocaleString()}`}
                    >
                      ₹{bookings.reduce((sum, b) => sum + Number(b.advancePaid || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Filter Tabs & Search / Date Range Controls */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 premium-card">
                
                {/* Horizontal Quick Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: "all", label: "All Bookings", count: bookings.length },
                    { id: "Pending", label: "Pending", count: bookings.filter(b => b.status === "Pending").length },
                    { id: "active", label: "Active / Confirmed", count: bookings.filter(b => b.status === "Confirmed" || b.status === "Active").length },
                    { id: "unassigned", label: "Unassigned Shifts", count: bookings.filter(b => !b.assignedStaff && b.status !== "Cancelled").length },
                    { id: "Completed", label: "Completed", count: bookings.filter(b => b.status === "Completed").length },
                    { id: "Cancelled", label: "Cancelled", count: bookings.filter(b => b.status === "Cancelled").length },
                  ].map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setBookingStatusFilter(pill.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        bookingStatusFilter === pill.id
                          ? "bg-[#1e2a5a] text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      <span>{pill.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        bookingStatusFilter === pill.id ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200"
                      }`}>
                        {pill.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search & Date Filter Inputs */}
                <div className="grid gap-3 grid-cols-1 md:grid-cols-12 items-center">
                  <div className="relative md:col-span-6">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by Patient, Phone, Service, or Staff..."
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-3 flex items-center gap-2 bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">From</span>
                    <input
                      type="date"
                      value={bookingStartDate}
                      onChange={(e) => setBookingStartDate(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs font-bold text-slate-700"
                    />
                  </div>

                  <div className="md:col-span-3 flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">To</span>
                      <input
                        type="date"
                        value={bookingEndDate}
                        onChange={(e) => setBookingEndDate(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs font-bold text-slate-700"
                      />
                    </div>
                    {(bookingSearch || bookingStartDate || bookingEndDate || bookingStatusFilter !== "all") && (
                      <button
                        onClick={() => {
                          setBookingSearch("");
                          setBookingStartDate("");
                          setBookingEndDate("");
                          setBookingStatusFilter("all");
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all cursor-pointer shrink-0"
                        title="Reset all filters"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* Bookings Modular Cards List */}
              <div className="space-y-4">
                {(() => {
                  const filtered = bookings.filter((b) => {
                    // Status filter
                    if (bookingStatusFilter === "unassigned") {
                      if (b.assignedStaff || b.status === "Cancelled") return false;
                    } else if (bookingStatusFilter === "active") {
                      if (b.status !== "Confirmed" && b.status !== "Active") return false;
                    } else if (bookingStatusFilter !== "all") {
                      if (b.status?.toLowerCase() !== bookingStatusFilter.toLowerCase()) return false;
                    }

                    // Search query filter
                    if (bookingSearch.trim()) {
                      const q = bookingSearch.toLowerCase();
                      const matchesSearch =
                        (b?.name || "").toLowerCase().includes(q) ||
                        (b?.phone || "").includes(q) ||
                        (b?.service || "").toLowerCase().includes(q) ||
                        ((b?.assignedStaff || "").toLowerCase().includes(q)) ||
                        ((b?.patientName || "").toLowerCase().includes(q));
                      if (!matchesSearch) return false;
                    }

                    // Date range filter
                    if (bookingStartDate || bookingEndDate) {
                      const bDateStr = (b?.date || "").split(" to ")[0];
                      const bDate = new Date(bDateStr || b?.createdAt || Date.now());
                      if (bookingStartDate) {
                        const start = new Date(bookingStartDate);
                        if (bDate < start) return false;
                      }
                      if (bookingEndDate) {
                        const end = new Date(bookingEndDate);
                        if (bDate > end) return false;
                      }
                    }

                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-sm font-semibold premium-card space-y-2">
                        <Calendar className="h-10 w-10 mx-auto text-slate-300" />
                        <div className="text-slate-700 font-bold">No booking records matched your search or status filter.</div>
                        <p className="text-xs text-slate-400">Try adjusting your keyword, resetting date filters, or selecting "All Bookings".</p>
                        {(bookingSearch || bookingStartDate || bookingEndDate || bookingStatusFilter !== "all") && (
                          <button
                            onClick={() => {
                              setBookingSearch("");
                              setBookingStartDate("");
                              setBookingEndDate("");
                              setBookingStatusFilter("all");
                            }}
                            className="mt-3 px-4 py-2 bg-[#1e2a5a] text-white text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-slate-500 px-1">
                        Showing <strong className="text-slate-800">{filtered.length}</strong> of{" "}
                        <strong className="text-slate-800">{bookings.length}</strong> booking records
                      </div>

                      {filtered.map((b) => {
                        const isPaidBookingRow = String(b.paymentStatus || "").toLowerCase() === "paid" || Number(b.balanceAmount) <= 0;
                        const totalAmtRow = Number(b.amount || 0);
                        const rowAdvPaid = isPaidBookingRow ? totalAmtRow : Number(b.advancePaid || 0);
                        const rowBalDue = isPaidBookingRow ? 0 : (b.balanceAmount !== undefined && b.balanceAmount !== null ? Math.max(0, Number(b.balanceAmount)) : Math.max(0, totalAmtRow - rowAdvPaid));

                        return (
                          <div
                            key={b.id}
                          className="bg-white border border-slate-200/80 hover:border-[#c9a24c]/60 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all text-left space-y-4 premium-card"
                        >
                          {/* TOP BAR: Client Header, ID, Contact, Date & Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#1e2a5a] to-[#2d3e7d] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0 select-none">
                                {(b?.name || "C").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-extrabold text-[#1e2a5a] text-base leading-tight">
                                    {b?.name || "Customer"}
                                  </h4>
                                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                                    #{b.id}
                                  </span>
                                  {(b.isMtp || (b.service && b.service.toLowerCase().includes("mtp"))) && (
                                    <span className="text-[9px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                                      🚗 MTP
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-500 font-medium">
                                  {b.phone ? (
                                    <a
                                      href={`tel:${b.phone}`}
                                      className="flex items-center gap-1 hover:text-[#1e2a5a] font-semibold text-slate-600"
                                    >
                                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                                      {b.phone}
                                    </a>
                                  ) : (
                                    <span className="text-slate-400 font-medium italic">No phone</span>
                                  )}
                                  <span className="text-slate-300">•</span>
                                  <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    {b.date || "Flexible Date"}
                                  </span>
                                  {b.time && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="flex items-center gap-1 text-slate-600 font-semibold">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        {b.time}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Booking Status Pill */}
                            <div className="flex items-center gap-2 self-start sm:self-center">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-2xs ${
                                  b.status === "Confirmed" || b.status === "Active"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : b.status === "Completed"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : b.status === "Cancelled"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {b.status}
                              </span>
                            </div>
                          </div>

                          {/* MAIN CONTENT GRID: 3 Columns on Tablet/Desktop */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            
                            {/* COL 1: Service & Patient Details */}
                            <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3.5 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                  Service &amp; Patient
                                </span>
                                <span className="text-[10px] font-black uppercase text-[#c9a24c] bg-[#c9a24c]/10 px-2 py-0.5 rounded-full border border-[#c9a24c]/20">
                                  {b.duration || "Standard Shift"}
                                </span>
                              </div>

                              <div className="font-extrabold text-[#1e2a5a] text-sm leading-snug">
                                {String(b.service || "").replace(/Medical Transport Partner/gi, "Multi Tasking Professional")}
                              </div>

                              {(b.patientName || b.patientAge) && (
                                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <span className="text-slate-400">👤 Patient:</span>
                                  <span>{b.patientName || "Client"} {b.patientAge ? `(${b.patientAge} yrs)` : ""}</span>
                                </div>
                              )}

                              {b.address && (
                                <div className="text-xs text-slate-500 font-medium truncate" title={b.address}>
                                  📍 {b.address}
                                </div>
                              )}

                              {b.patientNeeds && (
                                <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60 italic">
                                  &ldquo;{b.patientNeeds}&rdquo;
                                </div>
                              )}

                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                {b.googleMapLocation && (
                                  <a
                                    href={b.googleMapLocation}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-[#c9a24c] hover:underline flex items-center gap-1 bg-[#c9a24c]/10 px-2 py-0.5 rounded-md border border-[#c9a24c]/20"
                                  >
                                    🗺️ Open Map
                                  </a>
                                )}
                                {b.prescription && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openDocViewer(
                                        b.prescription,
                                        "Doctor Prescription / Case File",
                                        `${b.patientName || b.name} (Booking #${b.id})`,
                                        "Patient Medical Record"
                                      )
                                    }
                                    className="text-[10px] text-teal-700 font-bold hover:underline flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3 text-teal-600" />
                                    Case File
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* COL 2: Caregiver / Staff Assignment */}
                            <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                              <div>
                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                                  {b.isMtp || (b.service && (b.service.toLowerCase().includes("mtp") || b.service.toLowerCase().includes("escort") || b.service.toLowerCase().includes("companion")))
                                    ? "MTP Companion Assignment"
                                    : "Assigned Caregiver / Staff"}
                                </div>

                                {b.isMtp || (b.service && (b.service.toLowerCase().includes("mtp") || b.service.toLowerCase().includes("escort") || b.service.toLowerCase().includes("companion"))) ? (
                                  b.assignedStaff || b.mtpAcceptedBy ? (
                                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                          🚗
                                        </div>
                                        <div>
                                          <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                                            {b.assignedStaff || b.mtpAcceptedBy}
                                            <span className="text-[9px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.2 rounded">Accepted</span>
                                          </div>
                                          {(b.mtpAcceptedPhone || b.assignedStaffPhone) && (
                                            <div className="text-[10px] text-slate-500 font-medium">📞 {b.mtpAcceptedPhone || b.assignedStaffPhone}</div>
                                          )}
                                        </div>
                                      </div>
                                      {b.mtpAcceptedAt && (
                                        <div className="text-[9px] text-slate-400 pl-10">⏱️ {b.mtpAcceptedAt}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 space-y-1">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800">
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                        </span>
                                        ⚡ Open Gig Radar (MTP Network)
                                      </span>
                                      <p className="text-[10px] text-amber-700">Awaiting MTP partner pickup</p>
                                    </div>
                                  )
                                ) : b.assignedStaff ? (
                                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#1e2a5a] to-[#2d3e7d] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                        {(b.assignedStaff || "S").charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-extrabold text-[#1e2a5a] truncate">
                                          {b.assignedStaff}
                                        </div>
                                        {b.assignedStaffPhone ? (
                                          <div className="text-[10px] text-slate-500 font-medium">
                                            📞 {b.assignedStaffPhone}
                                          </div>
                                        ) : (
                                          <div className="text-[10px] text-emerald-600 font-bold">
                                            ✓ Active Caregiver
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                                      <div className="flex items-center shadow-2xs rounded-md">
                                        <div className="relative inline-flex items-center">
                                          <Clock className="w-3 h-3 text-amber-700 absolute left-1.5 pointer-events-none" />
                                          <select
                                            value={reminderIntervals[b.id] || "1 hour"}
                                            onChange={(e) => setReminderIntervals(prev => ({ ...prev, [b.id]: e.target.value }))}
                                            className="text-[10px] font-extrabold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-l-md pl-5 pr-1.5 py-1 outline-none cursor-pointer appearance-none transition-colors"
                                            title="Select Shift Reminder Timing (10m, 30m, 1h, 2h, 24h)"
                                          >
                                            <option value="10 minutes">10m</option>
                                            <option value="30 minutes">30m</option>
                                            <option value="1 hour">1h</option>
                                            <option value="2 hours">2h</option>
                                            <option value="24 hours">24h</option>
                                          </select>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleSendStaffReminder(b, reminderIntervals[b.id] || "1 hour")}
                                          disabled={sendingStaffReminderId === b.id}
                                          className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-900 bg-amber-200 hover:bg-amber-300 border border-l-0 border-amber-300 rounded-r-md px-2 py-1 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                                          title={`Auto Dispatch Shift Alert (${reminderIntervals[b.id] || "1 hour"})`}
                                        >
                                          {sendingStaffReminderId === b.id ? (
                                            <span className="animate-spin text-amber-800">⌛</span>
                                          ) : (
                                            <Send className="w-3 h-3 text-amber-800" />
                                          )}
                                          <span>{sendingStaffReminderId === b.id ? "..." : "Ping"}</span>
                                        </button>
                                        {b.assignedStaffPhone && (
                                          <a
                                            href={`https://wa.me/91${String(b.assignedStaffPhone).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`⏰ *Amma Seva Shift Reminder*\n\n🙏 Namaste *${b.assignedStaff}*,\nYour scheduled healthcare shift starts in *${reminderIntervals[b.id] || "1 hour"}*.\n\n📋 *Shift Details:*\n• Booking ID: #${b.id}\n• Service: ${b.service || "Home Care"}\n• Patient: ${b.patientName || b.name || "Patient"}\n• Shift: ${b.date || "Scheduled Date"} at ${b.time || "Scheduled Time"}\n• Location: ${b.address || "Contact coordinator"}\n\n📍 Please report to duty on time.\n📞 Helpline: +91 94945 16543\n🌐 Amma Seva Home Care`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center p-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[9px] font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                                            title="Open Direct WhatsApp chat with caregiver"
                                          >
                                            <MessageSquare className="w-3 h-3" />
                                          </a>
                                        )}
                                      </div>

                                      {b.staffReminderSent ? (
                                        <span 
                                          className="inline-flex items-center gap-1 text-[8px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                                          title={b.staffReminderSentAt ? `Last reminder sent at ${new Date(b.staffReminderSentAt).toLocaleTimeString()}` : "Shift reminder dispatched"}
                                        >
                                          <Check className="w-2.5 h-2.5 text-emerald-600" /> Sent ({b.staffReminderInterval || "1-Hr"})
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 space-y-2">
                                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-700">
                                      🚫 Caregiver Unassigned
                                    </div>
                                    <p className="text-[10px] text-rose-600 leading-tight">
                                      No staff member has been allocated for this shift yet.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsRecordCaretakerPaymentMode(false);
                                        openEditModal("booking", b);
                                      }}
                                      className="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" /> Assign Staff Now
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-400 font-medium">
                                {b.notes ? `Note: ${b.notes}` : "Shift scheduled & monitored"}
                              </div>
                            </div>

                            {/* COL 3: Billing & Financial Breakdown */}
                            <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                  Financial Summary
                                </span>
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                  isPaidBookingRow
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {isPaidBookingRow ? "Paid in Full" : (b.paymentStatus || "Balance Pending")}
                                </span>
                              </div>

                              <div>
                                <div className="text-lg font-black text-slate-900 font-display">
                                  ₹{totalAmtRow.toLocaleString()}
                                  <span className="text-[10px] font-semibold text-slate-400 ml-1">Total Shift Value</span>
                                </div>
                                {(b.baseAmount !== undefined && b.gstAmount !== undefined && Number(b.gstAmount) > 0) ? (
                                  <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                    Base: ₹{Number(b.baseAmount).toLocaleString()} + 18% GST: ₹{Number(b.gstAmount).toLocaleString()}
                                  </div>
                                ) : null}
                              </div>

                              {/* Advance Paid vs Balance Due Badges */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div className="bg-white p-2 rounded-lg border border-slate-200/70">
                                  <div className="text-[9px] uppercase font-bold text-slate-400">Advance Paid</div>
                                  <div className="text-xs font-black text-emerald-700 mt-0.5">
                                    ₹{rowAdvPaid.toLocaleString()}
                                  </div>
                                </div>
                                <div className={`p-2 rounded-lg border ${
                                  rowBalDue > 0 
                                    ? "bg-amber-50 border-amber-200 text-amber-900" 
                                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                                }`}>
                                  <div className="text-[9px] uppercase font-bold text-slate-500">
                                    {rowBalDue > 0 ? "Balance Due" : "Settlement"}
                                  </div>
                                  <div className="text-xs font-black mt-0.5">
                                    {rowBalDue > 0 
                                      ? `₹${rowBalDue.toLocaleString()}` 
                                      : "Cleared ✓"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* BOTTOM BAR: Due Payment Link & Action Controls */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                            
                            {/* Left: Payment Link or Cleared Receipt */}
                            <div className="flex-1 max-w-xl">
                              {rowBalDue > 0 ? (
                                <div className="flex items-center gap-2 bg-amber-50/90 border border-amber-200 p-2 rounded-xl text-xs">
                                  <span className="text-[10px] font-black uppercase text-amber-900 shrink-0 flex items-center gap-1">
                                    <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                                    Due Pay Link:
                                  </span>
                                  <div
                                    className="flex-1 bg-white px-2 py-1 rounded-lg border border-amber-200 text-[10px] font-mono text-slate-700 truncate select-all"
                                    title={`${typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in"}/pay-balance?id=${b.id}`}
                                  >
                                    /pay-balance?id={b.id}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyBookingPayLink(b.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0 ${
                                      copiedBookingLinkId === b.id
                                        ? "bg-emerald-600 text-white"
                                        : "bg-amber-600 hover:bg-amber-700 text-white"
                                    }`}
                                  >
                                    {copiedBookingLinkId === b.id ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                  <a
                                    href={`/pay-balance?id=${b.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs shrink-0"
                                    title="Open Due Payment Page"
                                  >
                                    <ExternalLink className="w-3 h-3 text-slate-600" />
                                  </a>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs">
                                  <span className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    Payment Cleared in Full
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <a
                                    href={`/pay-balance?id=${b.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                                  >
                                    Settlement Receipt <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Right: Action Buttons */}
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {rowBalDue > 0 ? (
                                <button
                                  onClick={() => handleOpenWhatsAppPayModal(b)}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                                  title="Send Payment Link via WhatsApp to Customer"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  <span>Send Pay Link</span>
                                </button>
                              ) : (
                                <a
                                  href={`/pay-balance?id=${b.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Receipt</span>
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectBookingForInvoice(String(b.id));
                                  setActiveTab("invoices");
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                                title="Generate Official Tax Invoice"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                <span>Invoice</span>
                              </button>

                              <button
                                onClick={() => {
                                  setIsRecordCaretakerPaymentMode(false);
                                  openEditModal("booking", b);
                                }}
                                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-[#c9a24c]/10 text-[#c9a24c] border border-slate-200 hover:border-[#c9a24c]/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => handleDeleteBooking(b.id)}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-xs"
                                title="Delete Booking"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ACCOUNTS & FINANCIAL LEDGER (COMPANY COLLECTIONS & GST)  */}
          {/* ======================================================== */}
          {activeTab === "accounts" && (() => {
            // Helper to extract ISO date from booking
            const getBookingISODate = (b: Booking): string => {
              if (b.date) {
                const firstPart = b.date.includes(" to ") ? b.date.split(" to ")[0].trim() : b.date.trim();
                if (/^\d{4}-\d{2}-\d{2}/.test(firstPart)) return firstPart.slice(0, 10);
              }
              if (b.createdAt) {
                return b.createdAt.slice(0, 10);
              }
              return "";
            };

            // Distinct Month options generated from active bookings
            const availableMonths = Array.from(new Set(
              bookings.map(b => {
                const iso = getBookingISODate(b);
                return iso ? iso.slice(0, 7) : "";
              }).filter(Boolean)
            )).sort().reverse();

            const formatMonthDisplay = (mStr: string) => {
              try {
                const [year, month] = mStr.split("-");
                const d = new Date(Number(year), Number(month) - 1, 1);
                return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
              } catch (e) {
                return mStr;
              }
            };

            // Filter bookings for accounts ledger
            const filteredBookings = bookings.filter((b) => {
              // Exclude cancelled bookings from accounts ledger calculations unless specifically searched
              if (b.status === "Cancelled" && !accountsSearch) return false;

              // Search query
              if (accountsSearch.trim()) {
                const q = accountsSearch.toLowerCase();
                const match = (b.name || "").toLowerCase().includes(q) ||
                              (b.patientName || "").toLowerCase().includes(q) ||
                              (b.phone || "").includes(q) ||
                              (b.service || "").toLowerCase().includes(q) ||
                              `#${b.id}`.includes(q) ||
                              String(b.id) === q;
                if (!match) return false;
              }

              // Date range
              const bDate = getBookingISODate(b);
              if (accountsStartDate && bDate && bDate < accountsStartDate) return false;
              if (accountsEndDate && bDate && bDate > accountsEndDate) return false;

              // Month filter
              if (accountsMonthFilter !== "all") {
                const today = new Date();
                const thisMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
                const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

                if (accountsMonthFilter === "this_month") {
                  if (!bDate.startsWith(thisMonthStr)) return false;
                } else if (accountsMonthFilter === "last_month") {
                  if (!bDate.startsWith(lastMonthStr)) return false;
                } else {
                  if (!bDate.startsWith(accountsMonthFilter)) return false;
                }
              }

              // Status filter
              const tot = Number(b.amount || 0);
              const isPaid = (b.paymentStatus || "").toLowerCase() === "paid" || 
                             (b.balanceAmount !== undefined && Number(b.balanceAmount) <= 0 && tot > 0) ||
                             (b.advancePaid !== undefined && Number(b.advancePaid) >= tot && tot > 0);
              const balanceDue = isPaid ? 0 : (b.balanceAmount !== undefined && b.balanceAmount !== null ? Math.max(0, Number(b.balanceAmount)) : Math.max(0, tot - Number(b.advancePaid || 0)));

              if (accountsStatusFilter === "settled" && balanceDue > 0) return false;
              if (accountsStatusFilter === "pending" && balanceDue <= 0) return false;

              return true;
            });

            // Calculate aggregates dynamically based on filtered records
            let sumBase = 0;
            let sumCgst = 0;
            let sumSgst = 0;
            let sumGst = 0;
            let sumGross = 0;
            let sumCollections = 0;
            let sumBalance = 0;
            let countSettled = 0;
            let countPending = 0;

            filteredBookings.forEach((b) => {
              const tot = Number(b.amount || 0);
              const isPaid = (b.paymentStatus || "").toLowerCase() === "paid" || 
                             (b.balanceAmount !== undefined && Number(b.balanceAmount) <= 0 && tot > 0) ||
                             (b.advancePaid !== undefined && Number(b.advancePaid) >= tot && tot > 0);
              const collected = isPaid ? tot : (b.advancePaid !== undefined ? Number(b.advancePaid) : 0);
              const balance = isPaid ? 0 : (b.balanceAmount !== undefined && b.balanceAmount !== null ? Math.max(0, Number(b.balanceAmount)) : Math.max(0, tot - collected));
              const base = Number(b.baseAmount) || Math.round(tot / 1.18);
              const gst = Number(b.gstAmount) !== undefined ? Number(b.gstAmount) : Math.max(0, tot - base);
              const cgst = Math.round(gst / 2);
              const sgst = gst - cgst;

              sumBase += base;
              sumCgst += cgst;
              sumSgst += sgst;
              sumGst += gst;
              sumGross += tot;
              sumCollections += collected;
              sumBalance += balance;

              if (balance <= 0) countSettled++;
              else countPending++;
            });

            const hasActiveFilters = Boolean(accountsSearch || accountsStartDate || accountsEndDate || accountsMonthFilter !== "all" || accountsStatusFilter !== "all");

            return (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Success Toast */}
                {accountsSuccessToast && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-150 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <span>{accountsSuccessToast}</span>
                    </div>
                    <button
                      onClick={() => setAccountsSuccessToast(null)}
                      className="text-emerald-700 hover:text-emerald-900 font-extrabold cursor-pointer ml-4 px-2 py-0.5 rounded-lg hover:bg-emerald-100"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Header Banner */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-[#1e2a5a] text-[#c9a24c] flex items-center justify-center font-bold shadow-xs">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-[#1e2a5a] font-display">Accounts &amp; Collections Ledger</h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Real-time collections, zero-balance settlements, 18% GST (CGST/SGST) audit, and exportable ledger.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    <button
                      type="button"
                      onClick={() => fetchDashboardData()}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      title="Refresh Accounting Data"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                      <span>Refresh</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadAccountsExcel(filteredBookings)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-700/20 active:scale-[0.98]"
                      title="Download Filtered Ledger in Excel (.csv)"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Download Excel ({filteredBookings.length})</span>
                    </button>
                  </div>
                </div>

                {/* 4 Financial Stat Cards (Real-time dynamic recalculation) */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Total Collections */}
                  <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-50 rounded-bl-full -z-0 opacity-60 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">Total Collections</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black font-display text-emerald-600 mt-2">
                        ₹{sumCollections.toLocaleString("en-IN")}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-500 flex items-center justify-between">
                        <span>{countSettled} accounts settled</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                          {sumGross > 0 ? `${Math.round((sumCollections / sumGross) * 100)}% Recovered` : "100%"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Outstanding Balance */}
                  <div className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${
                    sumBalance > 0 ? "border-amber-200/80" : "border-emerald-200/80"
                  }`}>
                    <div className={`absolute top-0 right-0 h-16 w-16 rounded-bl-full -z-0 opacity-60 group-hover:scale-110 transition-transform ${
                      sumBalance > 0 ? "bg-amber-50" : "bg-emerald-50"
                    }`} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                          sumBalance > 0 ? "text-amber-700" : "text-emerald-700"
                        }`}>
                          Outstanding Balance
                        </span>
                        <Clock className={`h-4 w-4 ${sumBalance > 0 ? "text-amber-500" : "text-emerald-500"}`} />
                      </div>
                      <div className={`text-2xl sm:text-3xl font-black font-display mt-2 ${
                        sumBalance > 0 ? "text-amber-600" : "text-emerald-600"
                      }`}>
                        ₹{sumBalance.toLocaleString("en-IN")}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-500 flex items-center justify-between">
                        <span>
                          {sumBalance <= 0 ? "All accounts cleared" : `${countPending} accounts with balance`}
                        </span>
                        {sumBalance <= 0 ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" /> Zero Due
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md text-[10px]">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 18% GST Breakdown */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-blue-50 rounded-bl-full -z-0 opacity-60 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">GST (18% Total)</span>
                        <Receipt className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black font-display text-[#1e2a5a] mt-2">
                        ₹{sumGst.toLocaleString("en-IN")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          CGST 9%: ₹{sumCgst.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          SGST 9%: ₹{sumSgst.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gross Invoiced Total */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-slate-100 rounded-bl-full -z-0 opacity-60 group-hover:scale-110 transition-transform" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Gross Invoiced Total</span>
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 mt-2">
                        ₹{sumGross.toLocaleString("en-IN")}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-500 flex items-center justify-between">
                        <span>Base: ₹{sumBase.toLocaleString("en-IN")}</span>
                        <span className="text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                          {filteredBookings.length} Bookings
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-[#c9a24c]" />
                      <span className="text-xs font-extrabold text-[#1e2a5a] uppercase tracking-wider">
                        Filter Accounts Ledger
                      </span>
                    </div>

                    {/* Status Pill Filters */}
                    <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
                      {[
                        { id: "all", label: "All Bookings", count: bookings.filter(b => b.status !== "Cancelled").length },
                        { id: "settled", label: "Settled (₹0 Due)", count: bookings.filter(b => {
                          const tot = Number(b.amount || 0);
                          const isPaid = (b.paymentStatus || "").toLowerCase() === "paid" || (b.balanceAmount !== undefined && Number(b.balanceAmount) <= 0 && tot > 0) || (b.advancePaid !== undefined && Number(b.advancePaid) >= tot && tot > 0);
                          return isPaid && b.status !== "Cancelled";
                        }).length },
                        { id: "pending", label: "Pending Balance", count: bookings.filter(b => {
                          const tot = Number(b.amount || 0);
                          const isPaid = (b.paymentStatus || "").toLowerCase() === "paid" || (b.balanceAmount !== undefined && Number(b.balanceAmount) <= 0 && tot > 0) || (b.advancePaid !== undefined && Number(b.advancePaid) >= tot && tot > 0);
                          return !isPaid && b.status !== "Cancelled";
                        }).length }
                      ].map((tab) => {
                        const isSelected = accountsStatusFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setAccountsStatusFilter(tab.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white text-[#1e2a5a] shadow-xs font-extrabold"
                                : "text-slate-600 hover:text-[#1e2a5a]"
                            }`}
                          >
                            {tab.label} <span className="text-[10px] opacity-75">({tab.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Filter Inputs Grid */}
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 items-center">
                    {/* Search Field */}
                    <div className="lg:col-span-4 relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search Client, Patient, Phone, #ID, Service..."
                        value={accountsSearch}
                        onChange={(e) => setAccountsSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-semibold text-slate-800"
                      />
                    </div>

                    {/* Quick Month Selector */}
                    <div className="lg:col-span-3 flex items-center gap-2 bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">Month</span>
                      <select
                        value={accountsMonthFilter}
                        onChange={(e) => {
                          setAccountsMonthFilter(e.target.value);
                          if (e.target.value !== "all") {
                            setAccountsStartDate("");
                            setAccountsEndDate("");
                          }
                        }}
                        className="w-full bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="all">All Months (All Time)</option>
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                        {availableMonths.map((m) => (
                          <option key={m} value={m}>
                            {formatMonthDisplay(m)} ({m})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* From Date */}
                    <div className="lg:col-span-2 flex items-center gap-2 bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">From</span>
                      <input
                        type="date"
                        value={accountsStartDate}
                        onChange={(e) => {
                          setAccountsStartDate(e.target.value);
                          setAccountsMonthFilter("all");
                        }}
                        className="w-full bg-transparent outline-none text-xs font-bold text-slate-700"
                      />
                    </div>

                    {/* To Date */}
                    <div className="lg:col-span-2 flex items-center gap-2 bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">To</span>
                      <input
                        type="date"
                        value={accountsEndDate}
                        onChange={(e) => {
                          setAccountsEndDate(e.target.value);
                          setAccountsMonthFilter("all");
                        }}
                        className="w-full bg-transparent outline-none text-xs font-bold text-slate-700"
                      />
                    </div>

                    {/* Clear Button */}
                    {hasActiveFilters && (
                      <div className="lg:col-span-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountsSearch("");
                            setAccountsStartDate("");
                            setAccountsEndDate("");
                            setAccountsMonthFilter("all");
                            setAccountsStatusFilter("all");
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all cursor-pointer text-center"
                          title="Reset All Filters"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active Filter Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="font-semibold">
                      Showing <strong className="text-[#1e2a5a]">{filteredBookings.length}</strong> ledger records
                      {accountsMonthFilter !== "all" && (
                        <span> • Month: <strong className="text-slate-800">{accountsMonthFilter === "this_month" ? "This Month" : accountsMonthFilter === "last_month" ? "Last Month" : formatMonthDisplay(accountsMonthFilter)}</strong></span>
                      )}
                      {(accountsStartDate || accountsEndDate) && (
                        <span> • Range: <strong className="text-slate-800">{accountsStartDate || "Start"}</strong> to <strong className="text-slate-800">{accountsEndDate || "Present"}</strong></span>
                      )}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Collections: <strong className="text-emerald-700 font-extrabold">₹{sumCollections.toLocaleString("en-IN")}</strong> • Pending: <strong className="text-amber-700 font-extrabold">₹{sumBalance.toLocaleString("en-IN")}</strong>
                    </span>
                  </div>
                </div>

                {/* Accounts Table */}
                <div className="bg-white border border-slate-200/80 rounded-2xl shadow-md shadow-slate-100/30 overflow-hidden premium-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm min-w-[1000px]">
                      <thead>
                        <tr className="bg-[#1e2a5a]/5 border-b border-slate-200/80 text-[#1e2a5a] text-xs font-bold uppercase tracking-wider">
                          <th className="py-4 px-5">Ref &amp; Date</th>
                          <th className="py-4 px-5">Client &amp; Patient</th>
                          <th className="py-4 px-5">Service Booked</th>
                          <th className="py-4 px-4 text-right">Taxable Base</th>
                          <th className="py-4 px-4 text-right">18% GST</th>
                          <th className="py-4 px-4 text-right">Gross Total</th>
                          <th className="py-4 px-4 text-right">Collected</th>
                          <th className="py-4 px-4 text-right">Balance Due</th>
                          <th className="py-4 px-4 text-center">Settlement Status</th>
                          <th className="py-4 px-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredBookings.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-12 text-center text-slate-400 text-sm font-semibold">
                              No ledger entries found matching your selected date and filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredBookings.map((b) => {
                            const tot = Number(b.amount || 0);
                            const isPaid = (b.paymentStatus || "").toLowerCase() === "paid" || 
                                           (b.balanceAmount !== undefined && Number(b.balanceAmount) <= 0 && tot > 0) ||
                                           (b.advancePaid !== undefined && Number(b.advancePaid) >= tot && tot > 0);
                            const collected = isPaid ? tot : (b.advancePaid !== undefined ? Number(b.advancePaid) : 0);
                            const balanceDue = isPaid ? 0 : (b.balanceAmount !== undefined && b.balanceAmount !== null ? Math.max(0, Number(b.balanceAmount)) : Math.max(0, tot - collected));
                            const base = Number(b.baseAmount) || Math.round(tot / 1.18);
                            const gst = Number(b.gstAmount) !== undefined ? Number(b.gstAmount) : Math.max(0, tot - base);
                            const isSettlingThis = isSettlingBookingId === b.id;

                            return (
                              <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                                {/* Ref & Date */}
                                <td className="py-4 px-5">
                                  <div className="font-mono font-extrabold text-[#1e2a5a] text-xs">
                                    #BK-{b.id}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                    {b.date || (b.createdAt ? b.createdAt.slice(0, 10) : "—")}
                                  </div>
                                </td>

                                {/* Client & Patient */}
                                <td className="py-4 px-5">
                                  <div className="font-bold text-slate-900 leading-tight">
                                    {b.name || "Customer"}
                                  </div>
                                  {b.patientName && b.patientName !== b.name && (
                                    <div className="text-xs text-slate-600 font-medium mt-0.5">
                                      Patient: <span className="font-semibold">{b.patientName}</span>
                                    </div>
                                  )}
                                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                    {b.phone || "—"}
                                  </div>
                                </td>

                                {/* Service */}
                                <td className="py-4 px-5">
                                  <div className="font-semibold text-slate-800 text-xs leading-tight">
                                    {b.service || "Healthcare Support"}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {b.duration || "Standard Shift"}
                                  </div>
                                </td>

                                {/* Base */}
                                <td className="py-4 px-4 text-right font-mono text-xs text-slate-700 font-bold">
                                  ₹{base.toLocaleString("en-IN")}
                                </td>

                                {/* GST 18% */}
                                <td className="py-4 px-4 text-right">
                                  <div className="font-mono text-xs font-bold text-blue-900">
                                    ₹{gst.toLocaleString("en-IN")}
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-mono">
                                    9%+9%
                                  </div>
                                </td>

                                {/* Gross Total */}
                                <td className="py-4 px-4 text-right font-mono text-xs font-black text-slate-900">
                                  ₹{tot.toLocaleString("en-IN")}
                                </td>

                                {/* Collected */}
                                <td className="py-4 px-4 text-right font-mono text-xs font-extrabold text-emerald-700 bg-emerald-50/30">
                                  ₹{collected.toLocaleString("en-IN")}
                                </td>

                                {/* Balance Due */}
                                <td className={`py-4 px-4 text-right font-mono text-xs font-black ${
                                  balanceDue <= 0 ? "text-emerald-600 bg-emerald-50/20" : "text-amber-600 bg-amber-50/30"
                                }`}>
                                  {balanceDue <= 0 ? (
                                    <span className="inline-flex items-center gap-1 font-extrabold text-emerald-600">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> ₹0
                                    </span>
                                  ) : (
                                    `₹${balanceDue.toLocaleString("en-IN")}`
                                  )}
                                </td>

                                {/* Settlement Status */}
                                <td className="py-4 px-4 text-center">
                                  {balanceDue <= 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> Settled ✓
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                      <Clock className="h-3 w-3 text-amber-600" /> Pending Due
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {balanceDue > 0 ? (
                                      <>
                                        <button
                                          type="button"
                                          disabled={isSettlingThis}
                                          onClick={() => handleQuickSettleBooking(b)}
                                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                                          title="Instant Balance Settlement to ₹0"
                                        >
                                          {isSettlingThis ? (
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <CheckCircle2 className="h-3 w-3" />
                                          )}
                                          <span>Settle ₹0</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleCopyBookingPayLink(b.id)}
                                          className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                          title="Copy direct balance payment link"
                                        >
                                          {copiedBookingLinkId === b.id ? (
                                            <Check className="h-3 w-3 text-emerald-600" />
                                          ) : (
                                            <Copy className="h-3 w-3 text-slate-500" />
                                          )}
                                          <span className="hidden sm:inline">Pay Link</span>
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleSelectBookingForInvoice(String(b.id));
                                          setActiveTab("invoices");
                                          window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                        title="Open in Tax Invoice Generator"
                                      >
                                        <Receipt className="h-3.5 w-3.5 text-amber-700" />
                                        <span>Invoice</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsRecordCaretakerPaymentMode(false);
                                        openEditModal("booking", b);
                                      }}
                                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
                                      title="Edit Booking or Record Payment Details"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>

                      {/* Summary Table Footer */}
                      {filteredBookings.length > 0 && (
                        <tfoot>
                          <tr className="bg-slate-50/90 border-t-2 border-slate-300 text-slate-900 font-extrabold text-xs">
                            <td colSpan={3} className="py-4 px-5 uppercase tracking-wider text-[#1e2a5a]">
                              Ledger Column Totals ({filteredBookings.length} records)
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-bold text-slate-700">
                              ₹{sumBase.toLocaleString("en-IN")}
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-bold text-blue-900">
                              ₹{sumGst.toLocaleString("en-IN")}
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-black text-slate-900">
                              ₹{sumGross.toLocaleString("en-IN")}
                            </td>
                            <td className="py-4 px-4 text-right font-mono font-black text-emerald-700 bg-emerald-50/40">
                              ₹{sumCollections.toLocaleString("en-IN")}
                            </td>
                            <td className={`py-4 px-4 text-right font-mono font-black ${
                              sumBalance <= 0 ? "text-emerald-600 bg-emerald-50/30" : "text-amber-600 bg-amber-50/40"
                            }`}>
                              ₹{sumBalance.toLocaleString("en-IN")}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                sumBalance <= 0 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {sumBalance <= 0 ? "100% Settled" : `${countPending} Pending`}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right text-[11px] text-slate-400 font-medium">
                              Ledger Audit ✓
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* INVOICES & BILLING GENERATOR (REAL-TIME TAX INVOICES)   */}
          {/* ======================================================== */}
          {activeTab === "invoices" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Top Banner & Stats */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-extrabold text-[#1e2a5a] font-display">Invoices &amp; Billing Hub</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Generate official GST Tax Invoices in real-time, record Cash or Bank Account payments, and share instantly via WhatsApp or Print.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectBookingForInvoice("custom")}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Custom Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-[#1e2a5a] hover:bg-[#152046] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Invoice
                  </button>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs premium-card">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Billed Volume</span>
                  <span className="text-2xl font-black font-display text-slate-900 mt-1 block">
                    ₹{bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Across all client reservations</span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs premium-card">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Collected (Cash &amp; Online)</span>
                  <span className="text-2xl font-black font-display text-emerald-600 mt-1 block">
                    ₹{bookings.reduce((sum, b) => {
                      const isPaid = String(b.paymentStatus || "").toLowerCase() === "paid" || Number(b.balanceAmount) <= 0;
                      return sum + (isPaid ? (Number(b.amount) || 0) : (Number(b.advancePaid) || 0));
                    }, 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium font-semibold">✓ Settled &amp; advance payments</span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs premium-card">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Pending Balance Due</span>
                  <span className="text-2xl font-black font-display text-amber-600 mt-1 block">
                    ₹{bookings.filter(b => {
                      const isPaid = String(b.paymentStatus || "").toLowerCase() === "paid" || Number(b.balanceAmount) <= 0;
                      return !isPaid && b.status !== "Cancelled";
                    }).reduce((sum, b) => {
                      const adv = Number(b.advancePaid) || 0;
                      const bal = b.balanceAmount !== undefined && b.balanceAmount !== null ? Number(b.balanceAmount) : Math.max(0, (Number(b.amount) || 0) - adv);
                      return sum + Math.max(0, bal);
                    }, 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">⏳ Post-service collections pending</span>
                </div>
              </div>

              {/* Client / Booking Selector Card */}
              <div className="bg-gradient-to-r from-slate-50 via-amber-50/40 to-slate-50 border border-amber-200/80 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#1e2a5a] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-600" />
                    Select Client / Booking for Instant Real-Time Invoice:
                  </label>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {bookings.length} reservations available in database
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 items-center">
                  <select
                    value={selectedInvoiceBookingId}
                    onChange={(e) => handleSelectBookingForInvoice(e.target.value)}
                    className="w-full sm:flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-[#c9a24c] shadow-xs cursor-pointer"
                  >
                    <option value="custom">➕ Create Custom Walk-in / Direct Client Invoice</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        #{b.id} — {b.name} ({b.phone}) • {b.service} • ₹{Number(b.amount).toLocaleString()} [{b.paymentStatus || "Unpaid"}] {b.paymentMethod ? `(${b.paymentMethod})` : ""}
                      </option>
                    ))}
                  </select>

                  {selectedInvoiceBookingId !== "custom" && (
                    <button
                      type="button"
                      onClick={() => handleSelectBookingForInvoice("custom")}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>

              {/* Status Notice */}
              {invoiceStatusMsg && (
                <div className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between shadow-xs ${
                  invoiceStatusMsg.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                    : "bg-rose-50 text-rose-900 border-rose-300"
                }`}>
                  <span>{invoiceStatusMsg.text}</span>
                  <button
                    type="button"
                    onClick={() => setInvoiceStatusMsg(null)}
                    className="text-xs opacity-60 hover:opacity-100 cursor-pointer ml-3"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Main Dual-Column: Left = Form Controls, Right = Live Invoice Sheet */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: Invoice Parameters & Payment Method (5 cols on lg) */}
                <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-extrabold text-[#1e2a5a] text-sm flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#c9a24c]" />
                      Payment Mode &amp; Ledger Status
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {selectedInvoiceBookingId === "custom" ? "Custom" : `#${selectedInvoiceBookingId}`}
                    </span>
                  </div>

                  {/* Payment Mode Selector ("Cash iste Cash, Account ayite Account") */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                      Payment Mode:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInvoicePaymentMethod("cash");
                          if (!invoiceTransactionId || invoiceTransactionId.startsWith("UTR-") || invoiceTransactionId.startsWith("TXN-")) {
                            setInvoiceTransactionId(`CASH-REC-${Date.now().toString().slice(-4)}`);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          invoicePaymentMethod === "cash"
                            ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/30 text-emerald-950 font-bold shadow-xs"
                            : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span>💵 Cash</span>
                          {invoicePaymentMethod === "cash" && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                        </div>
                        <div className="text-[9.5px] text-slate-500 font-normal mt-0.5">
                          Handover to caregiver/driver
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInvoicePaymentMethod("bank_account");
                          if (!invoiceTransactionId || invoiceTransactionId.startsWith("CASH-")) {
                            setInvoiceTransactionId(`UTR-${Date.now().toString().slice(-6)}`);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          invoicePaymentMethod === "bank_account"
                            ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/30 text-blue-950 font-bold shadow-xs"
                            : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span>🏦 Bank Account / NEFT</span>
                          {invoicePaymentMethod === "bank_account" && <Check className="w-3.5 h-3.5 text-blue-600 ml-auto" />}
                        </div>
                        <div className="text-[9.5px] text-slate-500 font-normal mt-0.5">
                          Bank transfer / IMPS / RTGS
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInvoicePaymentMethod("upi");
                          if (!invoiceTransactionId || invoiceTransactionId.startsWith("CASH-")) {
                            setInvoiceTransactionId(`UPI-${Date.now().toString().slice(-6)}`);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          invoicePaymentMethod === "upi"
                            ? "bg-purple-50 border-purple-400 ring-2 ring-purple-500/30 text-purple-950 font-bold shadow-xs"
                            : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span>📱 UPI / PhonePe / GPay</span>
                          {invoicePaymentMethod === "upi" && <Check className="w-3.5 h-3.5 text-purple-600 ml-auto" />}
                        </div>
                        <div className="text-[9.5px] text-slate-500 font-normal mt-0.5">
                          Direct mobile UPI QR scan
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInvoicePaymentMethod("razorpay");
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          invoicePaymentMethod === "razorpay"
                            ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/30 text-indigo-950 font-bold shadow-xs"
                            : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span>💳 Razorpay Gateway</span>
                          {invoicePaymentMethod === "razorpay" && <Check className="w-3.5 h-3.5 text-indigo-600 ml-auto" />}
                        </div>
                        <div className="text-[9.5px] text-slate-500 font-normal mt-0.5">
                          Online Debit/Credit Cards
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Payment Status Selector */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                      Payment Clearance Status:
                    </label>
                    <div className="flex gap-2">
                      {(["Paid", "Advance Paid", "Unpaid"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            const details = getInvoiceTaxDetails(invoiceTotalAmount, invoiceTaxMode);
                            if (status === "Paid") {
                              handleUpdateInvoiceAmounts(invoiceTotalAmount, details.totalAmount, "Paid");
                            } else if (status === "Advance Paid") {
                              const adv = Math.round(Number(details.totalAmount) * 0.2);
                              handleUpdateInvoiceAmounts(invoiceTotalAmount, adv, "Advance Paid");
                            } else {
                              handleUpdateInvoiceAmounts(invoiceTotalAmount, 0, "Unpaid");
                            }
                          }}
                          className={`flex-1 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer text-center ${
                            invoicePaymentStatus === status
                              ? status === "Paid"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : status === "Advance Paid"
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                  : "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {status === "Paid" ? "✓ Fully Paid" : status === "Advance Paid" ? "Advance Paid" : "Unpaid / Due"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GST Tax Calculation Mode (Include vs Exclude vs Exempt) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                        GST Calculation Mode:
                      </label>
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        SAC 999312
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTaxModeChange("exclusive")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          invoiceTaxMode === "exclusive"
                            ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 font-bold shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-black">
                          <span>➕ Base + 18% GST</span>
                          {invoiceTaxMode === "exclusive" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <div className="text-[9px] text-slate-500 font-normal mt-0.5 leading-tight">
                          Base Rate + 18% GST (Default)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTaxModeChange("inclusive")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          invoiceTaxMode === "inclusive"
                            ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-black">
                          <span>🏷️ 18% Included</span>
                          {invoiceTaxMode === "inclusive" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div className="text-[9px] text-slate-500 font-normal mt-0.5 leading-tight">
                          GST Included in Rate (Inclusive)
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTaxModeChange("exempt")}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          invoiceTaxMode === "exempt"
                            ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-950 font-bold shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-black">
                          <span>⚪ 0% Exempt</span>
                          {invoiceTaxMode === "exempt" && <Check className="w-3.5 h-3.5 text-purple-600" />}
                        </div>
                        <div className="text-[9px] text-slate-500 font-normal mt-0.5 leading-tight">
                          Tax Exemption (Zero GST)
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Amount Breakdown Inputs */}
                  <div className="space-y-2.5 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                          {invoiceTaxMode === "exclusive" ? "Base Service Fee (₹)" : "Total Amount (₹)"}
                        </label>
                        <input
                          type="number"
                          value={invoiceTotalAmount}
                          onChange={(e) => handleUpdateInvoiceAmounts(e.target.value, invoiceAdvancePaid)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 outline-none focus:ring-1 focus:ring-[#c9a24c]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-800 mb-1">
                          Advance Paid (₹)
                        </label>
                        <input
                          type="number"
                          value={invoiceAdvancePaid}
                          onChange={(e) => handleUpdateInvoiceAmounts(invoiceTotalAmount, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-black text-emerald-900 outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-extrabold uppercase tracking-wider text-amber-800 mb-1">
                          Balance Due (₹)
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={invoiceBalanceAmount}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-black outline-none select-all border ${
                            Number(invoiceBalanceAmount) > 0 
                              ? "bg-amber-50 border-amber-300 text-amber-950 font-black" 
                              : "bg-slate-100 border-slate-300 text-slate-700"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Dynamic Real-Time Math Strip */}
                    {(() => {
                      const curTax = getInvoiceTaxDetails(invoiceTotalAmount, invoiceTaxMode);
                      return (
                        <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[10px]">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-slate-600">
                            <div>
                              Base: <strong className="text-slate-900 font-mono">₹{curTax.baseAmount.toLocaleString("en-IN")}</strong>
                            </div>
                            <div>
                              IGST (18%): <strong className="text-amber-800 font-mono font-bold">+₹{curTax.gstAmount.toLocaleString("en-IN")}</strong>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-1 bg-blue-50/90 px-2.5 py-1.5 rounded-lg border border-blue-200">
                            <span className="font-extrabold text-[#1e2a5a]">
                              Gross Payable Value:
                            </span>
                            <span className="font-mono font-black text-xs text-[#1e2a5a]">
                              ₹{curTax.totalAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Transaction Ref Input */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                      UTR / Transaction Ref / Cash Voucher No.:
                    </label>
                    <input
                      type="text"
                      value={invoiceTransactionId}
                      onChange={(e) => setInvoiceTransactionId(e.target.value)}
                      placeholder="e.g. UTR92837482910 or CASH-REC-14"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#c9a24c]"
                    />
                  </div>

                  {/* Client & Patient Details */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1e2a5a] block">
                      Customer &amp; Patient Information
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Customer Name</label>
                        <input
                          type="text"
                          value={invoiceCustomerName}
                          onChange={(e) => setInvoiceCustomerName(e.target.value)}
                          placeholder="Client Full Name"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-[#c9a24c]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Mobile Phone</label>
                        <input
                          type="text"
                          value={invoiceCustomerPhone}
                          onChange={(e) => setInvoiceCustomerPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-[#c9a24c]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Patient Name (Optional)</label>
                        <input
                          type="text"
                          value={invoicePatientName}
                          onChange={(e) => setInvoicePatientName(e.target.value)}
                          placeholder="Patient Full Name"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-[#c9a24c]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Patient Age</label>
                        <input
                          type="text"
                          value={invoicePatientAge}
                          onChange={(e) => setInvoicePatientAge(e.target.value)}
                          placeholder="e.g. 68"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-[#c9a24c]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Service Description</label>
                      <input
                        type="text"
                        value={invoiceService}
                        onChange={(e) => setInvoiceService(e.target.value)}
                        placeholder="e.g. Elder Care Assistant (24 Hours)"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-[#c9a24c]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Schedule Date</label>
                        <input
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#c9a24c]" /> Shift Time
                        </label>
                        <input
                          type="time"
                          value={formatTimeTo24H(invoiceTime)}
                          onChange={(e) => setInvoiceTime(formatTimeTo12H(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Duration</label>
                        <input
                          type="text"
                          value={invoiceDuration}
                          onChange={(e) => setInvoiceDuration(e.target.value)}
                          placeholder="24 Hours Shift"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-500 mb-0.5">Residence Address</label>
                      <input
                        type="text"
                        value={invoiceAddress}
                        onChange={(e) => setInvoiceAddress(e.target.value)}
                        placeholder="House / Flat No, Street, Landmark, City"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-[#c9a24c]"
                      />
                    </div>
                  </div>

                  {/* Form Action Controls */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                    {selectedInvoiceBookingId !== "custom" && (
                      <button
                        type="button"
                        onClick={handleSaveInvoiceToDatabase}
                        disabled={isSavingInvoice}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isSavingInvoice ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Updating Database Record...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save &amp; Update in Database
                          </>
                        )}
                      </button>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSendInvoiceWhatsApp}
                        className="flex-1 py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Send Tax Invoice Breakdown to Customer via WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Send via WhatsApp
                      </button>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="py-2.5 px-4 bg-[#1e2a5a] hover:bg-[#152046] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Print Invoice directly onto A4 Sheet"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Official Real-Time Live Tax Invoice Preview (7 cols on lg) */}
                <div className="lg:col-span-7 space-y-3">
                  {(() => {
                    const currentTax = getInvoiceTaxDetails(invoiceTotalAmount, invoiceTaxMode);
                    return (
                      <>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                          <span className="flex items-center gap-1 text-[#1e2a5a] font-extrabold">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Live Tax Invoice Preview
                          </span>
                          <span className="text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                            A4 Single Page Format
                          </span>
                        </div>

                        {/* The Official Printable Invoice Document */}
                        <div
                          id="admin-invoice-print-root"
                          className="bg-white rounded-2xl border border-slate-300 shadow-xl p-5 sm:p-7 space-y-4 text-slate-800"
                        >
                          {/* Header: Company & Invoice Info */}
                          <div className="flex justify-between items-start gap-4 border-b-2 border-[#1e2a5a] pb-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={logoAsset}
                                alt="Amma Seva Healthcare Logo"
                                className="h-12 sm:h-14 w-auto object-contain shrink-0"
                              />
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl sm:text-2xl font-black font-display text-[#1e2a5a] tracking-tight">AMMA SEVA</span>
                                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300">
                                    TAX INVOICE / RECEIPT
                                  </span>
                                </div>
                                <p className="text-[11px] font-extrabold text-slate-800">LUXDHANA GLOBAL PRIVATE LIMITED</p>
                                <p className="text-[9.5px] text-slate-500 leading-tight">
                                  GSTIN: <strong className="font-mono text-slate-900">33AAGCL5078A1ZS</strong> &nbsp;|&nbsp; State Code: <strong>33 (Tamil Nadu)</strong><br />
                                  Shop No. S101, Door No. 769, Spencer Plaza, Anna Salai, Chennai, Tamil Nadu - 600002<br />
                                  24/7 Helpline: +91 94945 16543 &nbsp;|&nbsp; support@ammaseva.in &nbsp;|&nbsp; www.ammaseva.in
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="inline-block bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 mb-1.5">
                                <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest block">Original for Recipient</span>
                                <span className="text-base font-black text-[#1e2a5a] font-mono block">
                                  #INV-2026-{selectedInvoiceBookingId === "custom" ? "CUST" : selectedInvoiceBookingId}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-600 font-medium">
                                Date: <strong className="text-slate-900">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                              </div>
                              <div className="mt-1.5">
                                <span className={`inline-block text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                  invoicePaymentStatus === "Paid"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : invoicePaymentStatus === "Advance Paid"
                                      ? "bg-blue-50 text-blue-800 border-blue-300"
                                      : "bg-amber-50 text-amber-800 border-amber-300"
                                }`}>
                                  ● {invoicePaymentStatus}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Client & Service Delivery Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-0.5">
                              <span className="block text-slate-400 font-extrabold text-[8.5px] uppercase tracking-wider mb-1">Billed To (Client / Patient)</span>
                              <span className="block font-black text-slate-900 text-xs sm:text-sm">{invoiceCustomerName || "Valued Client"}</span>
                              <span className="block text-slate-600 font-mono text-xs">📞 {invoiceCustomerPhone || "—"}</span>
                              {invoiceCustomerEmail && <span className="block text-slate-600 text-[10px]">✉️ {invoiceCustomerEmail}</span>}
                              {invoicePatientName && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-[10.5px] text-slate-700">
                                  Patient: <strong className="text-slate-900">{invoicePatientName}</strong> {invoicePatientAge ? `(${invoicePatientAge} yrs)` : ""}
                                </div>
                              )}
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-0.5">
                              <span className="block text-slate-400 font-extrabold text-[8.5px] uppercase tracking-wider mb-1">Service &amp; Delivery Details</span>
                              <span className="block font-black text-[#1e2a5a] text-xs sm:text-sm">{String(invoiceService || "").replace(/Medical Transport Partner/gi, "Multi Tasking Professional")}</span>
                              <span className="block text-slate-700 text-[10.5px]">
                                Schedule: <strong className="text-slate-900">{invoiceDate}</strong> at <strong className="text-slate-900">{invoiceTime}</strong> ({invoiceDuration})
                              </span>
                              <span className="block text-slate-600 truncate text-[10px]" title={invoiceAddress}>
                                Location: {invoiceAddress || "Customer Residence"}
                              </span>
                              <span className="block text-[9px] text-slate-500 pt-1">
                                Place of Supply: <strong>Telangana (36) / Andhra Pradesh (37)</strong>
                              </span>
                            </div>
                          </div>

                          {/* Itemized Table */}
                          <div className="overflow-hidden rounded-xl border border-slate-300 text-[11px]">
                            <table className="w-full table-fixed border-collapse">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[9px] uppercase tracking-wider">
                                  <th className="py-2.5 px-3 text-left w-[46%]">Service &amp; Scope Description</th>
                                  <th className="py-2.5 px-2 text-center w-[14%]">SAC Code</th>
                                  <th className="py-2.5 px-2 text-center w-[16%]">Duration</th>
                                  <th className="py-2.5 px-3 text-right w-[24%]">Taxable Subtotal (₹)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                <tr>
                                  <td className="py-2.5 px-3 font-bold text-[#1e2a5a]">
                                    <div className="font-extrabold text-xs">{String(invoiceService || "").replace(/Medical Transport Partner/gi, "Multi Tasking Professional")}</div>
                                    <span className="block text-[9px] font-normal text-slate-500 mt-0.5">Verified Healthcare Attendant &amp; Nursing Care Support</span>
                                  </td>
                                  <td className="py-2.5 px-2 text-center font-mono text-slate-600 font-medium">999312</td>
                                  <td className="py-2.5 px-2 text-center text-slate-700 font-medium">{invoiceDuration}</td>
                                  <td className="py-2.5 px-3 text-right font-black text-slate-900 font-mono text-xs whitespace-nowrap">
                                    ₹{currentTax.baseAmount.toLocaleString("en-IN")}
                                  </td>
                                </tr>
                              </tbody>
                              <tfoot className="bg-slate-50/90 divide-y divide-slate-200 font-semibold text-[10.5px]">
                                <tr>
                                  <td colSpan={3} className="py-1.5 px-3 text-right text-slate-600">Taxable Subtotal (Base Rate):</td>
                                  <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                                    ₹{currentTax.baseAmount.toLocaleString("en-IN")}
                                  </td>
                                </tr>
                                <tr className="text-amber-900 bg-amber-50/60 font-semibold text-[10.5px]">
                                  <td colSpan={3} className="py-1.5 px-3 text-right">IGST (Integrated Tax @ {currentTax.igstRateText || "18.0%"}):</td>
                                  <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-900 whitespace-nowrap">
                                    +₹{currentTax.gstAmount.toLocaleString("en-IN")}
                                  </td>
                                </tr>
                                <tr className="bg-slate-100/90 font-black text-xs text-slate-900">
                                  <td colSpan={3} className="py-2 px-3 text-right text-[#1e2a5a] uppercase tracking-wider">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span>Total Shift Value (Gross Payable):</span>
                                      <span className="text-[8.5px] px-1.5 py-0.2 rounded font-bold uppercase tracking-tight bg-blue-100 text-blue-900 border border-blue-200">
                                        {invoiceTaxMode === "inclusive" ? "GST Included" : invoiceTaxMode === "exclusive" ? "Base + 18% GST" : "GST Exempt"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-[#1e2a5a] text-sm whitespace-nowrap font-black">
                                    ₹{currentTax.totalAmount.toLocaleString("en-IN")}
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          {/* Settlement & Payment Mode Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                            <div className="space-y-1.5">
                              <div className="text-[10px] uppercase font-bold text-slate-400">Payment Reconciliation</div>
                              <div className="flex justify-between items-center text-emerald-800 font-bold">
                                <span>Advance / Paid Amount:</span>
                                <span className="font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  ₹{Number(invoiceAdvancePaid || 0).toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="flex justify-between items-center font-bold">
                                <span className={Number(invoiceBalanceAmount) > 0 ? "text-amber-900" : "text-slate-600"}>
                                  Balance Due:
                                </span>
                                <span className={`font-mono px-2 py-0.5 rounded border ${
                                  Number(invoiceBalanceAmount) > 0
                                    ? "bg-amber-100 text-amber-950 border-amber-300 font-black"
                                    : "bg-emerald-100 text-emerald-900 border-emerald-300"
                                }`}>
                                  ₹{Number(invoiceBalanceAmount || 0).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-3">
                              <div className="text-[10px] uppercase font-bold text-slate-400">Payment Mode &amp; Receipt Status</div>
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <span className="shrink-0 text-slate-600 text-[11px]">Mode:</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border truncate ${
                                  invoicePaymentMethod === "cash"
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                    : invoicePaymentMethod === "bank_account"
                                      ? "bg-blue-100 text-blue-900 border-blue-300"
                                      : invoicePaymentMethod === "upi"
                                        ? "bg-purple-100 text-purple-900 border-purple-300"
                                        : "bg-indigo-100 text-indigo-900 border-indigo-300"
                                }`}>
                                  {invoicePaymentMethod === "cash" ? "💵 CASH PAYMENT" :
                                   invoicePaymentMethod === "bank_account" ? "🏦 BANK ACCOUNT / NEFT" :
                                   invoicePaymentMethod === "upi" ? "📱 UPI (PHONEPE / GPAY)" :
                                   invoicePaymentMethod === "razorpay" ? "💳 RAZORPAY GATEWAY" : "⏳ POST-SERVICE ESCROW"}
                                </span>
                              </div>
                              {invoiceTransactionId && (
                                <div className="text-[9.5px] text-slate-600 font-mono flex items-start gap-1 pt-0.5">
                                  <span className="shrink-0 font-sans text-slate-500 font-semibold">Ref / UTR:</span>
                                  <span className="font-bold text-slate-900 break-all bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    {invoiceTransactionId}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer notes & Signatory */}
                          <div className="flex justify-between items-end pt-2 text-[9.5px] text-slate-500 border-t border-slate-200">
                            <div className="space-y-0.5 max-w-sm">
                              <p className="font-bold text-slate-700">Thank you for trusting Amma Seva Home Healthcare.</p>
                              <p className="leading-tight">All caregiver &amp; nursing attendants are background-verified. Computer-generated tax document; no physical stamp required.</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-[#1e2a5a] text-[10.5px]">LUXDHANA GLOBAL PRIVATE LIMITED</div>
                              <div className="text-[8.5px] text-slate-400 mt-5 uppercase tracking-wider">Authorized Signatory / Accounts Desk</div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

              </div>

              {/* RECENT INVOICES & RESERVATIONS TABLE */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h4 className="font-extrabold text-[#1e2a5a] text-base font-display">Client Reservations &amp; Invoices Directory</h4>
                    <p className="text-xs text-slate-400 font-medium">Click &quot;Load in Generator&quot; on any booking to immediately generate or print their official invoice.</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by client, phone, or service..."
                      value={invoiceSearchQuery}
                      onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-[#c9a24c]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-[10px] uppercase tracking-wider">
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Customer &amp; Phone</th>
                        <th className="py-3 px-4">Service &amp; Schedule</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {(() => {
                        const q = invoiceSearchQuery.toLowerCase();
                        const list = bookings.filter(b => {
                          if (!invoiceSearchQuery) return true;
                          return (
                            b.name.toLowerCase().includes(q) ||
                            b.phone.includes(q) ||
                            b.service.toLowerCase().includes(q) ||
                            String(b.id).includes(q)
                          );
                        });

                        if (list.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400">
                                No booking records match your search query.
                              </td>
                            </tr>
                          );
                        }

                        return list.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#1e2a5a]">
                              #INV-{b.id}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{b.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{b.phone}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{b.service}</div>
                              <div className="text-[10px] text-slate-400">{b.date} • {b.duration}</div>
                            </td>
                            <td className="py-3 px-4 font-extrabold text-slate-900 font-mono">
                              ₹{Number(b.amount).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                {b.paymentMethod || "Cash on Service"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                                b.paymentStatus === "Paid"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : b.paymentStatus === "Advance Paid"
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}>
                                {b.paymentStatus || "Unpaid"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectBookingForInvoice(String(b.id));
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#1e2a5a] hover:text-white text-slate-700 text-[11px] font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                              >
                                <Receipt className="w-3 h-3" />
                                Load in Generator
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Employees & Staff panel */}
          {activeTab === "caregivers" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Employees &amp; Staff</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Total: {filteredCaregivers.length} employees</p>
                </div>
                <button
                  onClick={() => openAddModal("caregiver")}
                  className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="h-4 w-4" /> Add New Staff
                </button>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-md shadow-slate-100/30 premium-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 min-w-[750px]">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-[#1e2a5a]/5 text-xs text-[#1e2a5a] uppercase font-bold tracking-wider">
                        <th className="py-4 px-6">Staff details</th>
                        <th className="py-4 px-6">Specialty &amp; Locations</th>
                        <th className="py-4 px-6">Verification Documents</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Verification &amp; Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCaregivers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              {c.profilePhoto ? (
                                <img src={c.profilePhoto} className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-sm" alt="profile" />
                              ) : (
                                <div className="h-12 w-12 rounded-xl bg-[#1e2a5a]/5 border border-[#1e2a5a]/10 flex items-center justify-center text-[#1e2a5a] font-bold text-lg shadow-sm">
                                  {(c?.name || "S").charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-bold text-[#1e2a5a] font-display text-base leading-tight">{c?.name || "Staff Member"}</div>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-[#c9a24c]/15 text-[#8c6b16] border border-[#c9a24c]/30 font-mono tracking-wider shadow-2xs">
                                    <Gift className="h-3 w-3 text-[#b08726]" />
                                    REF: {getCaregiverReferralCode(c)}
                                  </span>
                                  <button
                                    type="button"
                                    title="Copy Referral Code"
                                    onClick={() => {
                                      const code = getCaregiverReferralCode(c);
                                      navigator.clipboard.writeText(code);
                                      alert(`Copied Referral Code: ${code}`);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-[#1e2a5a] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 transition-colors font-semibold cursor-pointer"
                                  >
                                    <Copy className="h-2.5 w-2.5" />
                                    Copy Code
                                  </button>
                                  <button
                                    type="button"
                                    title="Copy Careers Application Referral Link"
                                    onClick={() => {
                                      const code = getCaregiverReferralCode(c);
                                      const link = `${window.location.origin}/login?ref=${code}&type=caretaker`;
                                      navigator.clipboard.writeText(link);
                                      alert(`Copied Caregiver Application Referral Link:\n${link}`);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors font-bold cursor-pointer"
                                  >
                                    <Share2 className="h-2.5 w-2.5 text-indigo-600" />
                                    Share Link
                                  </button>
                                  {c.referredBy && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                                      👤 Ref by: {c.referredBy}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 mt-1.5 font-semibold">{c.phone}</div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">{c.email}</div>
                                {Number(c.rating) > 0 ? (
                                  <button
                                    onClick={() => setSelectedCaregiverForReviews(c)}
                                    className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 mt-2 flex items-center gap-0.5 w-fit cursor-pointer"
                                  >
                                    ⭐ {c.rating} ({c.reviews?.length || 0} reviews)
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-semibold block mt-1.5">No reviews</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-800">{c.specialty}</div>
                            <div className="text-xs text-slate-400 mt-1 font-bold">{c.experience} years experience</div>
                            {(c.city || c.state) && (
                              <div className="text-xs text-slate-700 mt-1.5 flex items-center gap-1 font-medium">
                                🏠 {c.city ? c.city : ""}{c.state ? `, ${c.state}` : ""}
                              </div>
                            )}
                            {c.googleMapLocation && (
                              <a 
                                href={c.googleMapLocation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#c9a24c] hover:underline font-bold block mt-1"
                              >
                                🗺️ Open Map Location
                              </a>
                            )}
                            {c.workingLocations && <div className="text-[10px] text-[#1e2a5a] mt-1 font-bold">📍 Pref: {c.workingLocations}</div>}
                            {c.availableTimings && <div className="text-[10px] text-slate-500 mt-0.5 font-medium">🕒 {c.availableTimings}</div>}
                          </td>
                          <td className="py-4 px-6 text-xs">
                            <div className="space-y-1">
                              {c.aadhaar ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(c.aadhaar, "Aadhaar Card Document", c.name, "Staff / Nurse Verification")}
                                  className="text-[#c9a24c] font-bold hover:underline flex items-center gap-1 text-[10px] cursor-pointer text-left"
                                >
                                  <Eye className="h-2.5 w-2.5" /> Aadhaar Card Verified
                                </button>
                              ) : <span className="text-slate-300 block text-[10px]">❌ Aadhaar Card</span>}
                              
                              {c.pan ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(c.pan, "PAN Card Document", c.name, "Staff / Nurse Verification")}
                                  className="text-[#c9a24c] font-bold hover:underline flex items-center gap-1 text-[10px] cursor-pointer text-left"
                                >
                                  <Eye className="h-2.5 w-2.5" /> PAN Card Verified
                                </button>
                              ) : <span className="text-slate-300 block text-[10px]">❌ PAN Card</span>}
                              
                              {c.certificates ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(c.certificates, "Nursing / Education Qualification Certificate", c.name, "Staff / Nurse Verification")}
                                  className="text-[#c9a24c] font-bold hover:underline flex items-center gap-1 text-[10px] cursor-pointer text-left"
                                >
                                  <Eye className="h-2.5 w-2.5" /> Edu Certificate Verified
                                </button>
                              ) : <span className="text-slate-300 block text-[10px]">❌ Edu Certificate</span>}

                              {c.experienceCertificate ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(c.experienceCertificate, "Experience Certificate", c.name, "Staff / Nurse Verification")}
                                  className="text-[#c9a24c] font-bold hover:underline flex items-center gap-1 text-[10px] cursor-pointer text-left"
                                >
                                  <Eye className="h-2.5 w-2.5" /> Experience Certificate
                                </button>
                              ) : <span className="text-slate-300 block text-[10px]">❌ Experience Cert</span>}

                              {c.policeVerification ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(c.policeVerification, "Police Verification Certificate (PCC)", c.name, "Staff / Nurse Verification")}
                                  className="text-[#c9a24c] font-bold hover:underline flex items-center gap-1 text-[10px] cursor-pointer text-left"
                                >
                                  <Eye className="h-2.5 w-2.5" /> Police Verification Cert
                                </button>
                              ) : <span className="text-slate-300 block text-[10px]">❌ Police verification</span>}

                              {c.additionalCertificates ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(c.additionalCertificates, "Additional Verification Documents", c.name, "Staff / Nurse Verification")}
                                  className="text-[#c9a24c] font-bold hover:underline flex items-center gap-1 text-[10px] cursor-pointer text-left"
                                >
                                  <Eye className="h-2.5 w-2.5" /> Additional Docs
                                </button>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full border ${
                              c.status === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" :
                              c.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200/60" :
                              "bg-amber-50 text-amber-700 border-amber-200/60"
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex gap-2 justify-end">
                              {c.status !== "Verified" && (
                                <button
                                  onClick={() => handleUpdateCaregiverStatus(c.id, "Verified")}
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-500 border border-emerald-200 hover:border-emerald-500 text-emerald-600 hover:text-white text-xs font-semibold flex items-center transition-colors cursor-pointer"
                                  title="Approve & Verify"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              {c.status !== "Rejected" && (
                                <button
                                  onClick={() => handleUpdateCaregiverStatus(c.id, "Rejected")}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-500 border border-rose-200 hover:border-rose-500 text-rose-600 hover:text-white text-xs font-semibold flex items-center transition-colors cursor-pointer"
                                  title="Reject Application"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const isNurse = (c.staffCategory === "NUR") || 
                                                  (c.employeeId && c.employeeId.includes("NUR")) || 
                                                  /nurse|nursing|icu|gnm|clinical|sister|dr\./i.test(c.specialty || "") ||
                                                  /nurse|sister|dr\./i.test(c.name || "") ||
                                                  /nurse/i.test(c.designation || "");
                                  const cat = isNurse ? "NUR" : "CGV";
                                  const catLabel = isNurse ? "Registered Nurse" : "Caregiver";
                                  const desig = isNurse ? "Nurse" : "Caregiver";
                                  const matchingCard = idCards.find(card => card.source === "caregivers" && card.originalId === c.id) || {
                                    id: `cgv_${c.id}`,
                                    originalId: c.id,
                                    type: "caregiver" as const,
                                    source: "caregivers" as const,
                                    staffCategory: cat as const,
                                    categoryLabel: catLabel,
                                    employeeId: c.employeeId || `AS - ${cat} - 26-${String(c.id).padStart(3, "0")}`,
                                    name: c.name,
                                    phone: c.phone || "",
                                    email: c.email || "",
                                    designation: c.designation || desig,
                                    specialty: c.specialty || "",
                                    profilePhoto: c.profilePhoto || "",
                                    status: c.status || "Pending",
                                    joinedAt: c.joinedAt || "2026-01-01T00:00:00.000Z",
                                    state: c.state || "Telangana",
                                    city: c.city || "Hyderabad"
                                  };
                                  setSelectedCardForView(matchingCard);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="View Official Staff ID Card"
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal("caregiver", c)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-[#c9a24c]/15 text-[#c9a24c] border border-slate-200 hover:border-[#c9a24c]/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Edit Staff"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCaregiver(c.id)}
                                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 text-rose-500 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Remove Staff"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (() => {
            // Aggregate all accounts from users, caregivers, and mtps
            const allUnifiedAccounts = [
              ...users.map((u) => {
                const userBookings = bookings.filter(
                  (b) => b.phone === u.phone || (u.email && b.email && b.email.toLowerCase() === u.email.toLowerCase()) || b.userId === u.id || b.name.toLowerCase() === u.name.toLowerCase()
                );
                return {
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  phone: u.phone,
                  role: "customer" as const,
                  roleLabel: "Customer / Patient",
                  status: "Active",
                  createdAt: u.createdAt,
                  uniqueId: `USER${String(u.phone || "").slice(-4)}`,
                  city: "Hyderabad",
                  state: "Telangana",
                  activityCount: userBookings.length,
                  activityLabel: "Bookings",
                  bookings: userBookings,
                  rawData: u
                };
              }),
              ...caregivers.map((c) => {
                const assignedShifts = bookings.filter(
                  (b) => (b.assignedStaffId && Number(b.assignedStaffId) === c.id) ||
                         (b.assignedStaff && b.assignedStaff.trim().toLowerCase() === c.name.trim().toLowerCase())
                );
                return {
                  id: c.id,
                  name: c.name,
                  email: c.email || "N/A",
                  phone: c.phone,
                  role: "caregiver" as const,
                  roleLabel: `Caregiver (${c.specialty || "Staff"})`,
                  status: c.status || "Pending",
                  createdAt: c.joinedAt,
                  uniqueId: getCaregiverReferralCode(c),
                  city: c.city || "Hyderabad",
                  state: c.state || "Telangana",
                  activityCount: assignedShifts.length,
                  activityLabel: "Shifts",
                  bookings: assignedShifts,
                  rawData: c
                };
              }),
              ...mtps.map((m) => {
                const assignedShifts = bookings.filter(
                  (b) => (b.assignedStaffId && Number(b.assignedStaffId) === m.id) ||
                         (b.assignedStaff && b.assignedStaff.trim().toLowerCase() === m.name.trim().toLowerCase())
                );
                const roleList = Array.isArray(m.roles) ? m.roles : (m.roles ? [m.roles] : []);
                return {
                  id: m.id,
                  name: m.name,
                  email: m.email || "N/A",
                  phone: m.phone,
                  role: "mtp" as const,
                  roleLabel: `MTP Partner (${roleList.length} Tasks)`,
                  status: m.status || "Pending",
                  createdAt: m.createdAt,
                  uniqueId: `MTP${String(m.phone || "").slice(-4)}`,
                  city: m.locality || m.city || "Hyderabad",
                  state: m.state || "Telangana",
                  activityCount: assignedShifts.length,
                  activityLabel: "Tasks",
                  bookings: assignedShifts,
                  rawData: m
                };
              })
            ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            // Counts for filter tabs
            const customerCount = users.length;
            const caregiverCount = caregivers.length;
            const mtpCount = mtps.length;
            const totalAccountsCount = allUnifiedAccounts.length;

            // Apply Filters
            const filteredAccounts = allUnifiedAccounts.filter((acc) => {
              // Role Filter
              if (userRoleFilter !== "all" && acc.role !== userRoleFilter) {
                return false;
              }

              // Status Filter
              if (userStatusFilter !== "All") {
                if ((acc?.status || "").toLowerCase() !== userStatusFilter.toLowerCase()) {
                  return false;
                }
              }

              // Search Filter
              if (patientSearch.trim()) {
                const q = patientSearch.toLowerCase();
                const matches =
                  (acc?.name || "").toLowerCase().includes(q) ||
                  (acc?.email || "").toLowerCase().includes(q) ||
                  (acc?.phone || "").includes(q) ||
                  (acc?.uniqueId || "").toLowerCase().includes(q) ||
                  (acc?.city || "").toLowerCase().includes(q) ||
                  (acc?.roleLabel || "").toLowerCase().includes(q);
                if (!matches) return false;
              }

              // Date Range Filter
              if (patientStartDate || patientEndDate) {
                const regDate = new Date(acc.createdAt);
                if (patientStartDate) {
                  const start = new Date(patientStartDate);
                  if (regDate < start) return false;
                }
                if (patientEndDate) {
                  const end = new Date(patientEndDate);
                  end.setHours(23, 59, 59, 999);
                  if (regDate > end) return false;
                }
              }

              return true;
            });

            return (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-[#1e2a5a]/10 flex items-center justify-center text-[#1e2a5a]">
                        <Users className="h-5 w-5" />
                      </div>
                      <h3 className="text-xl font-extrabold text-[#1e2a5a] font-display tracking-tight">
                        All Registered Users & Accounts
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Master control center to manage, inspect, and permanently delete accounts across Customers, Caregiver Staff, and MTP Partners from the database.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchDashboardData}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                      Refresh Data
                    </button>
                  </div>
                </div>

                {/* 4 Summary Stats Cards */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <div 
                    onClick={() => setUserRoleFilter("all")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      userRoleFilter === "all"
                        ? "bg-gradient-to-br from-[#1e2a5a] to-[#121936] text-white border-[#1e2a5a] shadow-md shadow-[#1e2a5a]/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-800 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${userRoleFilter === "all" ? "text-slate-300" : "text-slate-400"}`}>
                        All Accounts
                      </span>
                      <Users className={`h-4 w-4 ${userRoleFilter === "all" ? "text-[#c9a24c]" : "text-slate-400"}`} />
                    </div>
                    <span className="text-2xl font-black font-display mt-2 block tracking-tight">
                      {totalAccountsCount}
                    </span>
                    <span className={`text-[10px] font-semibold block mt-0.5 ${userRoleFilter === "all" ? "text-slate-300" : "text-slate-500"}`}>
                      Total in Database
                    </span>
                  </div>

                  <div 
                    onClick={() => setUserRoleFilter("customer")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      userRoleFilter === "customer"
                        ? "bg-gradient-to-br from-blue-700 to-blue-900 text-white border-blue-700 shadow-md shadow-blue-700/20"
                        : "bg-white border-slate-200/80 hover:border-blue-300 text-slate-800 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${userRoleFilter === "customer" ? "text-blue-100" : "text-blue-600"}`}>
                        Patients / Users
                      </span>
                      <Heart className={`h-4 w-4 ${userRoleFilter === "customer" ? "text-blue-200" : "text-blue-500"}`} />
                    </div>
                    <span className="text-2xl font-black font-display mt-2 block tracking-tight">
                      {customerCount}
                    </span>
                    <span className={`text-[10px] font-semibold block mt-0.5 ${userRoleFilter === "customer" ? "text-blue-100" : "text-slate-500"}`}>
                      Customer Bookings
                    </span>
                  </div>

                  <div 
                    onClick={() => setUserRoleFilter("caregiver")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      userRoleFilter === "caregiver"
                        ? "bg-gradient-to-br from-emerald-700 to-emerald-900 text-white border-emerald-700 shadow-md shadow-emerald-700/20"
                        : "bg-white border-slate-200/80 hover:border-emerald-300 text-slate-800 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${userRoleFilter === "caregiver" ? "text-emerald-100" : "text-emerald-600"}`}>
                        Caregiver Staff
                      </span>
                      <ShieldCheck className={`h-4 w-4 ${userRoleFilter === "caregiver" ? "text-emerald-200" : "text-emerald-500"}`} />
                    </div>
                    <span className="text-2xl font-black font-display mt-2 block tracking-tight">
                      {caregiverCount}
                    </span>
                    <span className={`text-[10px] font-semibold block mt-0.5 ${userRoleFilter === "caregiver" ? "text-emerald-100" : "text-slate-500"}`}>
                      Nurses & Attendants
                    </span>
                  </div>

                  <div 
                    onClick={() => setUserRoleFilter("mtp")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      userRoleFilter === "mtp"
                        ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white border-amber-600 shadow-md shadow-amber-600/20"
                        : "bg-white border-slate-200/80 hover:border-amber-300 text-slate-800 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${userRoleFilter === "mtp" ? "text-amber-100" : "text-amber-600"}`}>
                        MTP Partners
                      </span>
                      <Briefcase className={`h-4 w-4 ${userRoleFilter === "mtp" ? "text-amber-200" : "text-amber-500"}`} />
                    </div>
                    <span className="text-2xl font-black font-display mt-2 block tracking-tight">
                      {mtpCount}
                    </span>
                    <span className={`text-[10px] font-semibold block mt-0.5 ${userRoleFilter === "mtp" ? "text-amber-100" : "text-slate-500"}`}>
                      On-Demand Partners
                    </span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card space-y-4">
                  {/* Role Switcher Pills */}
                  <div className="flex flex-wrap gap-2 items-center border-b border-slate-100 pb-4">
                    <span className="text-xs font-bold text-slate-500 mr-1">Filter by Role:</span>
                    {[
                      { id: "all", label: "All Accounts", count: totalAccountsCount },
                      { id: "customer", label: "Patients / Customers", count: customerCount },
                      { id: "caregiver", label: "Caregivers & Staff", count: caregiverCount },
                      { id: "mtp", label: "MTP Partners", count: mtpCount },
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setUserRoleFilter(pill.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          userRoleFilter === pill.id
                            ? "bg-[#1e2a5a] text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        {pill.label}
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          userRoleFilter === pill.id ? "bg-white/20 text-white" : "bg-white text-slate-600 border border-slate-200"
                        }`}>
                          {pill.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Search, Date, and Status Controls */}
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-12 items-center">
                    <div className="relative sm:col-span-5">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by Name, Phone, Email, Unique ID, or City..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-semibold text-slate-800"
                      />
                    </div>
                    
                    <div className="sm:col-span-2">
                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active / Verified</option>
                        <option value="Pending">Pending Review</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="date"
                        value={patientStartDate}
                        onChange={(e) => setPatientStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-500"
                        title="Start Date"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="date"
                        value={patientEndDate}
                        onChange={(e) => setPatientEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-500"
                        title="End Date"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      {(patientSearch || patientStartDate || patientEndDate || userRoleFilter !== "all" || userStatusFilter !== "All") && (
                        <button
                          type="button"
                          onClick={() => {
                            setPatientSearch("");
                            setPatientStartDate("");
                            setPatientEndDate("");
                            setUserRoleFilter("all");
                            setUserStatusFilter("All");
                          }}
                          className="w-full py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition-all cursor-pointer text-center"
                          title="Reset all filters"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unified Accounts Table */}
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-md shadow-slate-100/30 premium-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700 min-w-[850px]">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-[#1e2a5a]/5 text-xs text-[#1e2a5a] uppercase font-bold tracking-wider">
                          <th className="py-4 px-6">User & Profile</th>
                          <th className="py-4 px-6">Contact Details</th>
                          <th className="py-4 px-6">Account Role</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Registered On</th>
                          <th className="py-4 px-6 text-center">Activity</th>
                          <th className="py-4 px-6 text-right">Database Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 text-sm font-semibold">
                              <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                              No registered accounts matched your search and filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredAccounts.map((acc) => {
                            const isCustomer = acc.role === "customer";
                            const isCaregiver = acc.role === "caregiver";
                            const isMtp = acc.role === "mtp";

                            return (
                              <tr key={`${acc.role}-${acc.id}`} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-xs shrink-0 ${
                                      isCustomer ? "bg-gradient-to-tr from-blue-600 to-cyan-600" :
                                      isCaregiver ? "bg-gradient-to-tr from-emerald-600 to-teal-600" :
                                      "bg-gradient-to-tr from-amber-600 to-yellow-600"
                                    }`}>
                                      {(acc?.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-[#1e2a5a] font-display text-sm leading-snug">
                                        {acc?.name || "User"}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-mono font-bold text-[#c9a24c] bg-[#c9a24c]/10 px-1.5 py-0.2 rounded border border-[#c9a24c]/20">
                                          {acc.uniqueId}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                          📍 {acc.city}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 px-6">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                                      <Phone className="h-3 w-3 text-slate-400" />
                                      <a href={`tel:${acc.phone}`} className="hover:text-[#c9a24c] hover:underline">
                                        +91 {acc.phone}
                                      </a>
                                      {acc.phone && (
                                        <a
                                          href={`https://wa.me/91${String(acc.phone).replace(/\D/g, "").slice(-10)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-emerald-600 hover:text-emerald-700"
                                          title="Chat on WhatsApp"
                                        >
                                          <MessageCircle className="h-3.5 w-3.5" />
                                        </a>
                                      )}
                                    </div>
                                    {acc.email && acc.email !== "N/A" && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                        <a href={`mailto:${acc.email}`} className="hover:text-[#c9a24c] hover:underline truncate">
                                          {acc.email}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                                    isCustomer ? "bg-blue-50 text-blue-700 border-blue-200/70" :
                                    isCaregiver ? "bg-emerald-50 text-emerald-700 border-emerald-200/70" :
                                    "bg-amber-50 text-amber-700 border-amber-200/70"
                                  }`}>
                                    {isCustomer && "💙 Patient"}
                                    {isCaregiver && "🩺 Caregiver"}
                                    {isMtp && "🚗 MTP Partner"}
                                  </span>
                                </td>

                                <td className="py-4 px-6">
                                  <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full border ${
                                    acc.status === "Verified" || acc.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" :
                                    acc.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200/60" :
                                    "bg-amber-50 text-amber-700 border-amber-200/60"
                                  }`}>
                                    {acc.status}
                                  </span>
                                </td>

                                <td className="py-4 px-6 text-xs text-slate-500 font-bold">
                                  {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                                </td>

                                <td className="py-4 px-6 text-center">
                                  <span className="text-xs font-black text-[#1e2a5a] bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                    {acc.activityCount} {acc.activityLabel}
                                  </span>
                                </td>

                                <td className="py-4 px-6 text-right">
                                  <div className="flex gap-2 justify-end items-center">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedUserForDetails(acc)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#c9a24c]/15 text-[#c9a24c] border border-slate-200 hover:border-[#c9a24c]/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                      title="View Detailed Profile & History"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      View
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setUserDeleteConfirmModal({
                                        isOpen: true,
                                        account: acc,
                                        isDeleting: false,
                                        error: null
                                      })}
                                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                      title="Permanently Delete Account from Database"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Permanent Delete Safety Confirmation Modal */}
                {userDeleteConfirmModal.isOpen && userDeleteConfirmModal.account && (
                  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 text-left">
                      {/* Modal Top Warning Header */}
                      <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-6 text-white text-left relative">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center text-white border border-white/20 shrink-0">
                            <ShieldAlert className="h-7 w-7 text-white" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-lg tracking-tight font-display text-white">
                              Permanently Delete User?
                            </h4>
                            <p className="text-xs text-rose-100 mt-0.5 font-medium">
                              This action will wipe all data directly from the database.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUserDeleteConfirmModal({ isOpen: false, account: null, isDeleting: false, error: null })}
                          className="absolute top-5 right-5 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-all"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Modal Content */}
                      <div className="p-6 space-y-4 bg-slate-50/50">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase">Account Name:</span>
                            <span className="font-black text-[#1e2a5a] text-sm">{userDeleteConfirmModal.account.name}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase">Mobile Number:</span>
                            <span className="font-bold text-slate-700">+91 {userDeleteConfirmModal.account.phone}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400 font-bold uppercase">Account Role:</span>
                            <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase text-[10px]">
                              {userDeleteConfirmModal.account.roleLabel}
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1.5 leading-relaxed font-medium">
                          <div className="flex items-center gap-1.5 font-bold text-rose-900">
                            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>Database Wipe Warning</span>
                          </div>
                          <p>
                            Deleting this user will permanently purge their profile, authentication credentials, linked booking orders, medical records, and OTP verification entries from the database.
                          </p>
                        </div>

                        {userDeleteConfirmModal.error && (
                          <div className="p-3 bg-rose-100 text-rose-800 text-xs font-bold rounded-xl border border-rose-300">
                            {userDeleteConfirmModal.error}
                          </div>
                        )}
                      </div>

                      {/* Modal Footer Buttons */}
                      <div className="border-t border-slate-100 p-4 bg-white flex justify-end gap-3">
                        <button
                          type="button"
                          disabled={userDeleteConfirmModal.isDeleting}
                          onClick={() => setUserDeleteConfirmModal({ isOpen: false, account: null, isDeleting: false, error: null })}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={userDeleteConfirmModal.isDeleting}
                          onClick={() => handleDeleteAccountPermanently(userDeleteConfirmModal.account)}
                          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-rose-600/20 flex items-center gap-2"
                        >
                          {userDeleteConfirmModal.isDeleting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Purging from DB...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              <span>Yes, Delete from Database</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unified User Details Modal */}
                {selectedUserForDetails && (() => {
                  const acc = selectedUserForDetails;
                  const accBookings = acc.bookings || [];
                  const totalSpent = accBookings
                    .filter((b: any) => b.paymentStatus === "Paid")
                    .reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);

                  return (
                    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 text-left border border-slate-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#1e2a5a] to-[#121936] p-6 flex justify-between items-center border-b border-[#c9a24c]/20">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#c9a24c] to-[#e5c06b] flex items-center justify-center font-black text-2xl text-[#1e2a5a] shadow-md border border-white/20 shrink-0">
                              {(acc?.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-xl tracking-tight text-white font-display">{acc?.name || "User"}</h4>
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#c9a24c] text-[#1e2a5a]">
                                  {acc.roleLabel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1 font-semibold">
                                {acc.email} • +91 {acc.phone} • {acc.uniqueId}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedUserForDetails(null)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-all border border-white/5"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#1e2a5a] rounded-xl p-4 shadow-sm text-center">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Activity</span>
                              <span className="text-xl font-black text-[#1e2a5a] mt-1 block">{accBookings.length} {acc.activityLabel}</span>
                            </div>
                            <div className="bg-white border border-slate-200/80 border-l-4 border-l-emerald-500 rounded-xl p-4 shadow-sm text-center">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Account Status</span>
                              <span className="text-base font-black text-emerald-600 mt-1 block">{acc.status}</span>
                            </div>
                            <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#c9a24c] rounded-xl p-4 shadow-sm text-center">
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                                {acc.role === "customer" ? "Total Paid Value" : "Location Zone"}
                              </span>
                              <span className="text-base font-black text-[#c9a24c] mt-1 block">
                                {acc.role === "customer" ? `₹${totalSpent.toLocaleString()}` : (acc.city || "Hyderabad")}
                              </span>
                            </div>
                          </div>

                          {/* Historical Bookings / Shifts */}
                          <div className="space-y-3">
                            <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
                              <div>
                                <h5 className="text-xs font-bold text-[#1e2a5a] uppercase tracking-wider">
                                  {acc.role === "customer" ? "Patient Shift & Booking History" : "Assigned Duty Allocations"}
                                </h5>
                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                  Audit logs associated with this user.
                                </span>
                              </div>
                              <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                {accBookings.length} Records
                              </span>
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                              {accBookings.map((b: any) => (
                                <div key={b.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2 hover:border-[#c9a24c]/30 transition-colors">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-extrabold text-[#1e2a5a] text-sm">{b.service}</div>
                                      <div className="text-[10px] text-slate-400 mt-0.5 font-bold">📅 {b.date} • {b.time} ({b.duration})</div>
                                    </div>
                                    <div className="flex gap-2">
                                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                                        b.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" :
                                        b.status === "Completed" ? "bg-blue-50 text-blue-700 border-blue-200/50" :
                                        b.status === "Cancelled" ? "bg-rose-50 text-rose-700 border-rose-200/50" :
                                        "bg-amber-50 text-amber-700 border-amber-200/50"
                                      }`}>
                                        {b.status}
                                      </span>
                                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${
                                        b.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-amber-50 text-amber-700 border-amber-200/50"
                                      }`}>
                                        ₹{b.amount} ({b.paymentStatus})
                                      </span>
                                    </div>
                                  </div>

                                  {b.assignedStaff && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold border-t border-slate-50 pt-2">
                                      <span>Assigned Staff:</span>
                                      <span className="font-bold text-[#1e2a5a]">{b.assignedStaff}</span>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {accBookings.length === 0 && (
                                <p className="text-center text-xs text-slate-400 italic py-6 bg-white border border-slate-200/80 rounded-2xl">
                                  No service booking records attached to this profile.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-100 p-4 bg-white flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setUserDeleteConfirmModal({
                                isOpen: true,
                                account: acc,
                                isDeleting: false,
                                error: null
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-rose-200"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Account from Database
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedUserForDetails(null)}
                            className="px-5 py-2 rounded-xl bg-[#1e2a5a] hover:bg-[#121936] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Close Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            );
          })()}

          {/* Payments & Transaction tracking panel */}
          {activeTab === "payments" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Payment Status & Invoices</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Track and record payments for all customer bookings.</p>
                </div>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit self-start sm:self-auto border border-slate-200/50">
                  {["all", "Paid", "Unpaid"].map((filter) => {
                    const count = bookings.filter(b => filter === "all" ? true : (b?.paymentStatus || "Unpaid") === filter).length;
                    const isActive = filter === "all" ? !paymentSearch : paymentSearch.toLowerCase() === filter.toLowerCase();
                    return (
                      <button
                        key={filter}
                        onClick={() => setPaymentSearch(filter === "all" ? "" : filter)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                          isActive ? "bg-white shadow-xs text-[#1e2a5a] font-extrabold" : "text-slate-600 hover:text-[#1e2a5a]"
                        }`}
                      >
                        {filter} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payments Stats Summary Cards */}
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-100/30 premium-card">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Booked Value</span>
                  <span className="text-2xl font-extrabold font-display text-slate-950 mt-1 block">
                    ₹{bookings.reduce((sum, b) => sum + (Number(b?.amount) || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-100/30 premium-card">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Paid (Collected)</span>
                  <span className="text-2xl font-extrabold font-display text-emerald-600 mt-1 block">
                    ₹{bookings.filter(b => b?.paymentStatus === "Paid").reduce((sum, b) => sum + (Number(b?.amount) || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-100/30 premium-card">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Outstanding (Unpaid)</span>
                  <span className="text-2xl font-extrabold font-display text-amber-600 mt-1 block">
                    ₹{bookings.filter(b => b?.paymentStatus !== "Paid").reduce((sum, b) => sum + (Number(b?.amount) || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Local Filter Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm premium-card grid gap-3 grid-cols-1 md:grid-cols-12 items-center">
                <div className="relative md:col-span-6">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Customer, Phone, Service, or Status..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-semibold text-slate-800"
                  />
                </div>
                <div className="md:col-span-3 flex items-center gap-2 bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">From</span>
                  <input
                    type="date"
                    value={paymentStartDate}
                    onChange={(e) => setPaymentStartDate(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs font-bold text-slate-700"
                  />
                </div>
                <div className="md:col-span-3 flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">To</span>
                    <input
                      type="date"
                      value={paymentEndDate}
                      onChange={(e) => setPaymentEndDate(e.target.value)}
                      className="w-full bg-transparent outline-none text-xs font-bold text-slate-700"
                    />
                  </div>
                  {(paymentSearch || paymentStartDate || paymentEndDate) && (
                    <button
                      onClick={() => {
                        setPaymentSearch("");
                        setPaymentStartDate("");
                        setPaymentEndDate("");
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-all cursor-pointer shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Payments Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-md shadow-slate-100/30 overflow-hidden premium-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm min-w-[750px]">
                    <thead>
                      <tr className="bg-[#1e2a5a]/5 border-b border-slate-200/80 text-[#1e2a5a] text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Customer Details</th>
                        <th className="py-4 px-6">Service Details</th>
                        <th className="py-4 px-6">Billable Amount</th>
                        <th className="py-4 px-6">Payment Status</th>
                        <th className="py-4 px-6">Transaction Details</th>
                        <th className="py-4 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const filtered = bookings.filter((b) => {
                          // Search query filter
                          const q = paymentSearch.toLowerCase();
                          const matchesSearch = !paymentSearch || 
                            (b?.name || "").toLowerCase().includes(q) ||
                            (b?.phone || "").includes(q) ||
                            (b?.service || "").toLowerCase().includes(q) ||
                            (b?.paymentStatus || "").toLowerCase().includes(q);

                          // Date range filter
                          let matchesDate = true;
                          if (paymentStartDate || paymentEndDate) {
                            const bDate = new Date(b?.date || b?.createdAt || Date.now());
                            if (paymentStartDate) {
                              const start = new Date(paymentStartDate);
                              if (bDate < start) matchesDate = false;
                            }
                            if (paymentEndDate) {
                              const end = new Date(paymentEndDate);
                              if (bDate > end) matchesDate = false;
                            }
                          }

                          return matchesSearch && matchesDate;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 text-sm font-semibold">
                                No payment logs matched your search and date filters.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-[#1e2a5a] font-display text-base leading-tight">{b?.name || "Customer"}</div>
                              <div className="text-xs text-slate-400 mt-1 font-semibold">{b?.phone || "—"}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-semibold text-slate-800">{b?.service || "Healthcare Support"}</div>
                              <div className="text-[10px] text-slate-400 mt-1 font-medium">{b?.date || "—"} • {b?.time || "—"}</div>
                            </td>
                            <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                              ₹{(Number(b?.amount) || 0).toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-1 rounded border ${
                                b?.paymentStatus === "Paid" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" 
                                  : "bg-amber-50 text-amber-700 border-amber-200/60"
                              }`}>
                                {b?.paymentStatus || "Unpaid"}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {b.paymentStatus === "Paid" ? (
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-slate-700">Method: <span className="font-bold text-slate-900">{b.paymentMethod || "N/A"}</span></div>
                                  {b.transactionId && <div className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded w-fit">Ref: {b.transactionId}</div>}
                                  {b.paymentDate && <div className="text-[10px] text-slate-400 font-medium">Date: {b.paymentDate}</div>}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic font-medium">No transaction recorded</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectBookingForInvoice(String(b.id));
                                    setActiveTab("invoices");
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="px-2.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors inline-flex"
                                  title="Open in Tax Invoice Generator"
                                >
                                  <Receipt className="h-3.5 w-3.5 text-amber-700" /> Invoice
                                </button>
                                <button
                                  onClick={() => {
                                   setIsRecordCaretakerPaymentMode(false);
                                   openEditModal("booking", b);
                                 }}
                                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-[#c9a24c]/15 text-[#c9a24c] hover:border-[#c9a24c]/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors inline-flex"
                                >
                                  <Edit3 className="h-3.5 w-3.5" /> Record Payment
                                </button>
                              </div>
                            </td>
                        </tr>
                      ));
                    })()}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-sm font-semibold">
                            No bookings found to display payment logs.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {activeTab === "salaries" && (() => {
            // Helper to get caretaker payout
            const getPayoutValue = (b: any) => {
              return b.caretakerPayout !== undefined && b.caretakerPayout !== null && Number(b.caretakerPayout) > 0
                ? Number(b.caretakerPayout)
                : Math.round(Number(b.amount || 0) * 0.85);
            };

            const completedBookings = bookings.filter(b => b.status === "Completed");
            
            // Filter completed bookings based on local dates
            const filteredCompletedBookings = completedBookings.filter(b => {
              if (salaryStartDate || salaryEndDate) {
                const bDate = new Date(b.date);
                if (salaryStartDate) {
                  const start = new Date(salaryStartDate);
                  if (bDate < start) return false;
                }
                if (salaryEndDate) {
                  const end = new Date(salaryEndDate);
                  if (bDate > end) return false;
                }
              }
              return true;
            });

            const totalCaretakerEarned = filteredCompletedBookings.reduce((sum, b) => sum + getPayoutValue(b), 0);
            const totalCaretakerPaid = filteredCompletedBookings.filter(b => b.caretakerPayoutStatus === "Paid").reduce((sum, b) => sum + getPayoutValue(b), 0);
            const totalCaretakerOutstanding = totalCaretakerEarned - totalCaretakerPaid;

            return (
              <div className="space-y-6 animate-in fade-in duration-200 text-left">
                {selectedCaregiverForLedger ? (() => {
                  const cg = selectedCaregiverForLedger;
                  const cgBookings = bookings.filter(b => (b?.assignedStaffId && Number(b.assignedStaffId) === cg?.id) || (b?.assignedStaff && b.assignedStaff.trim().toLowerCase() === (cg?.name || "").trim().toLowerCase()));
                  const earned = cgBookings.filter(b => b?.status === "Completed").reduce((sum, b) => sum + getPayoutValue(b), 0);
                  const paid = cgBookings.filter(b => b?.status === "Completed" && b?.caretakerPayoutStatus === "Paid").reduce((sum, b) => sum + getPayoutValue(b), 0);
                  const unpaid = earned - paid;

                  const filteredLedgerBookings = cgBookings.filter(b => {
                    const q = ledgerSearch.toLowerCase();
                    const matchesSearch = !ledgerSearch || 
                      (b?.name || "").toLowerCase().includes(q) || 
                      (b?.service || "").toLowerCase().includes(q) ||
                      ((b?.phone || "").includes(q));

                    let matchesTime = true;
                    const today = new Date().toISOString().split('T')[0];
                    const isCompleted = b.status === "Completed";
                    if (ledgerTimeFilter === "past") {
                      matchesTime = b.date < today || isCompleted;
                    } else if (ledgerTimeFilter === "present") {
                      matchesTime = b.date === today && !isCompleted;
                    } else if (ledgerTimeFilter === "future") {
                      matchesTime = b.date > today && !isCompleted;
                    }

                    return matchesSearch && matchesTime;
                  });

                  return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaregiverForLedger(null);
                              setLedgerSearch("");
                              setLedgerTimeFilter("all");
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                          >
                            ← Back to Salaries
                          </button>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">{cg.name}</h3>
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-[#c9a24c]/15 text-[#8c6b16] border border-[#c9a24c]/30 font-mono tracking-wider shadow-2xs">
                                <Gift className="h-3 w-3 text-[#b08726]" />
                                REFER: {getCaregiverReferralCode(cg)}
                              </span>
                              <button
                                type="button"
                                title="Copy Referral Code"
                                onClick={() => {
                                  const code = getCaregiverReferralCode(cg);
                                  navigator.clipboard.writeText(code);
                                  alert(`Copied Referral Code: ${code}`);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-[#1e2a5a] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 transition-colors font-semibold cursor-pointer"
                              >
                                <Copy className="h-2.5 w-2.5" />
                                Copy
                              </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 font-semibold">{cg.specialty} • {cg.phone}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#1e2a5a] rounded-2xl p-5 shadow-sm premium-card">
                          <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider block">Total Earned (Completed)</span>
                          <span className="text-2xl font-black text-[#1e2a5a] mt-1 block">
                            ₹{earned.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-white border border-slate-200/80 border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-sm premium-card">
                          <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider block">Total Settled (Paid)</span>
                          <span className="text-2xl font-black text-emerald-600 mt-1 block">
                            ₹{paid.toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#c9a24c] rounded-2xl p-5 shadow-sm premium-card">
                          <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider block">Outstanding (Unpaid)</span>
                          <span className="text-2xl font-black text-amber-600 mt-1 block">
                            ₹{unpaid.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-1/3">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search ledger by patient, service..."
                            value={ledgerSearch}
                            onChange={(e) => setLedgerSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            type="button"
                            onClick={() => setLedgerTimeFilter("all")}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                              ledgerTimeFilter === "all"
                                ? "bg-[#1e2a5a] text-white border-[#1e2a5a]"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            All Shifts ({cgBookings.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setLedgerTimeFilter("past")}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                              ledgerTimeFilter === "past"
                                ? "bg-[#1e2a5a] text-white border-[#1e2a5a]"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Past / Completed
                          </button>
                          <button
                            type="button"
                            onClick={() => setLedgerTimeFilter("present")}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                              ledgerTimeFilter === "present"
                                ? "bg-[#1e2a5a] text-white border-[#1e2a5a]"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Present / Today
                          </button>
                          <button
                            type="button"
                            onClick={() => setLedgerTimeFilter("future")}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                              ledgerTimeFilter === "future"
                                ? "bg-[#1e2a5a] text-white border-[#1e2a5a]"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            Future / Scheduled
                          </button>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm premium-card">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-slate-700 min-w-[750px]">
                            <thead>
                              <tr className="border-b border-slate-200/80 bg-[#1e2a5a]/5 text-xs text-[#1e2a5a] uppercase font-black tracking-wider">
                                <th className="py-4 px-6">Patient Name</th>
                                <th className="py-4 px-6">Service Parameter</th>
                                <th className="py-4 px-6">Customer Paid Amount</th>
                                <th className="py-4 px-6">Nurse Payout Amount</th>
                                <th className="py-4 px-6">Payout Status</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredLedgerBookings.map((b) => {
                                const calculatedPayout = getPayoutValue(b);
                                const isCompleted = b.status === "Completed";
                                const today = new Date().toISOString().split('T')[0];
                                const bType = b.date < today || isCompleted ? "PAST" : b.date === today ? "PRESENT" : "FUTURE";

                                return (
                                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-6 font-bold text-[#1e2a5a]">
                                      {b.name}
                                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">📅 {b.date} • {b.time}</div>
                                    </td>
                                    <td className="py-4 px-6">
                                      <div className="font-bold text-slate-800">{b.service}</div>
                                      <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">Duration: {b.duration || "Daily"}</div>
                                    </td>
                                    <td className="py-4 px-6 font-bold text-slate-900">
                                      ₹{(Number(b.amount) || 0).toLocaleString()}
                                    </td>
                                    <td className="py-4 px-6 font-bold text-[#c9a24c]">
                                      ₹{calculatedPayout.toLocaleString()}
                                    </td>
                                    <td className="py-4 px-6">
                                      <div className="flex flex-col gap-1 items-start">
                                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                                          bType === "PAST" ? "bg-slate-100 text-slate-600 border border-slate-200/50" :
                                          bType === "PRESENT" ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" :
                                          "bg-blue-50 text-blue-700 border-blue-200/50"
                                        }`}>
                                          {bType}
                                        </span>
                                        {isCompleted ? (
                                          <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${
                                            b.caretakerPayoutStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-amber-50 text-amber-700 border-amber-200/50"
                                          }`}>
                                            {b.caretakerPayoutStatus === "Paid" ? "Paid" : "Unpaid"}
                                          </span>
                                        ) : (
                                          <span className="text-[9px] text-slate-400 italic font-semibold">Scheduled Shift</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsRecordCaretakerPaymentMode(true);
                                          openEditModal("booking", b);
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-[#c9a24c]/40 hover:bg-[#c9a24c]/10 text-[#c9a24c] text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer"
                                      >
                                        {b.caretakerPayoutStatus === "Paid" ? "Edit Details" : "Record Payment"}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {filteredLedgerBookings.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic font-semibold">
                                    No shifts found matching your filters.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card gap-4">
                      <div>
                        <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Staff Salaries & Payout Settlements</h3>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">Track payroll, salary status, and payout logs for all registered care staff.</p>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card grid gap-4 grid-cols-1 sm:grid-cols-4 items-center">
                      <div className="relative col-span-1 sm:col-span-2">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by Caregiver name, specialty, or Unique ID..."
                          value={salarySearch}
                          onChange={(e) => setSalarySearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <input
                          type="date"
                          value={salaryStartDate}
                          onChange={(e) => setSalaryStartDate(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={salaryEndDate}
                          onChange={(e) => setSalaryEndDate(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-500"
                        />
                        {(salarySearch || salaryStartDate || salaryEndDate) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSalarySearch("");
                              setSalaryStartDate("");
                              setSalaryEndDate("");
                            }}
                            className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-100/30 premium-card">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Caregiver Earnings</span>
                        <span className="text-2xl font-extrabold font-display text-slate-950 mt-1 block">
                          ₹{totalCaretakerEarned.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-100/30 premium-card">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Settled (Paid)</span>
                        <span className="text-2xl font-extrabold font-display text-emerald-600 mt-1 block">
                          ₹{totalCaretakerPaid.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-100/30 premium-card">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Outstanding (Unpaid)</span>
                        <span className="text-2xl font-extrabold font-display text-amber-600 mt-1 block">
                          ₹{totalCaretakerOutstanding.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Caregiver Payroll Listing */}
                    <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-[#1e2a5a] uppercase tracking-wider">Employee Salaries Breakdown</h4>
                    
                    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm premium-card">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                          <thead>
                            <tr className="border-b border-slate-200/80 bg-[#1e2a5a]/5 text-xs text-[#1e2a5a] uppercase font-black tracking-wider">
                              <th className="py-4 px-6">Staff Member</th>
                              <th className="py-4 px-6">Total Earned</th>
                              <th className="py-4 px-6">Total Settled (Paid)</th>
                              <th className="py-4 px-6 text-amber-600">Outstanding (Unpaid)</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {caregivers
                              .filter((cg) => {
                                const q = salarySearch.toLowerCase();
                                const refCode = getCaregiverReferralCode(cg).toLowerCase();
                                return !salarySearch || 
                                  (cg?.name || "").toLowerCase().includes(q) || 
                                  (cg?.specialty || "").toLowerCase().includes(q) ||
                                  refCode.includes(q) ||
                                  ((cg?.uniqueId || "").toLowerCase().includes(q));
                              })
                              .map((cg) => {
                                const cgBookings = bookings.filter(b => (b?.assignedStaffId && Number(b.assignedStaffId) === cg?.id) || (b?.assignedStaff && b.assignedStaff.trim().toLowerCase() === (cg?.name || "").trim().toLowerCase()));
                                const completed = cgBookings.filter(b => b?.status === "Completed");
                                const earned = completed.reduce((sum, b) => sum + getPayoutValue(b), 0);
                                const paid = completed.filter(b => b?.caretakerPayoutStatus === "Paid").reduce((sum, b) => sum + getPayoutValue(b), 0);
                                const unpaid = earned - paid;

                                return (
                                  <tr key={cg.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                      <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#1e2a5a]/10 to-[#1e2a5a]/5 flex items-center justify-center font-bold text-base text-[#1e2a5a] border border-[#1e2a5a]/10 shrink-0">
                                          {(cg?.name || "S").charAt(0)}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <div className="font-extrabold text-[#1e2a5a] text-sm leading-tight">{cg?.name || "Staff Member"}</div>
                                            <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-[#c9a24c]/15 text-[#8c6b16] border border-[#c9a24c]/30 font-mono tracking-wider">
                                              <Gift className="h-2.5 w-2.5 text-[#b08726]" />
                                              {getCaregiverReferralCode(cg)}
                                            </span>
                                            <button
                                              type="button"
                                              title="Copy Referral Code"
                                              onClick={() => {
                                                const code = getCaregiverReferralCode(cg);
                                                navigator.clipboard.writeText(code);
                                                alert(`Copied Referral Code: ${code}`);
                                              }}
                                              className="text-[9px] text-slate-500 hover:text-[#1e2a5a] bg-slate-100 hover:bg-slate-200 px-1 py-0.5 rounded border border-slate-200 transition-colors font-semibold cursor-pointer flex items-center gap-0.5"
                                            >
                                              <Copy className="h-2.5 w-2.5" />
                                            </button>
                                          </div>
                                          <p className="text-[10px] text-slate-400 font-semibold mt-1">{cg.phone} • {cg.specialty}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-4 px-6 font-bold text-slate-900">
                                      ₹{earned.toLocaleString()}
                                    </td>
                                    <td className="py-4 px-6 font-bold text-emerald-600">
                                      ₹{paid.toLocaleString()}
                                    </td>
                                    <td className="py-4 px-6 font-bold text-amber-600">
                                      ₹{unpaid.toLocaleString()}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedCaregiverForLedger(cg)}
                                        className="px-3.5 py-1.5 rounded-lg border border-[#c9a24c]/40 hover:bg-[#c9a24c]/10 text-[#c9a24c] text-xs font-extrabold tracking-wider uppercase transition-all cursor-pointer shadow-sm"
                                      >
                                        👁️ View Ledger ({cgBookings.length})
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}

                            {caregivers.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic font-semibold">
                                  No caregivers registered to compile salary payroll.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  </>
                )}
              </div>
            );
          })()}

          {activeTab === "services" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Active Services</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Total: {filteredServices.length} service offerings</p>
                </div>
                <button
                  onClick={() => openAddModal("service")}
                  className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="h-4 w-4" /> Add New Service
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {filteredServices.map((service) => (
                  <div key={service.id} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-100/30 flex flex-col justify-between hover:shadow-lg transition-all premium-card">
                    <div>
                      <div className="flex gap-4">
                        {service.image && (
                          <img 
                            src={service.image} 
                            className="h-20 w-20 rounded-xl object-cover border border-slate-200/80 shrink-0 shadow-sm" 
                            alt={service.title} 
                          />
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                            <h4 className="text-lg font-bold text-[#1e2a5a] font-display truncate">{service.title}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded w-fit">{service.price}</span>
                              <span className="text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded w-fit">
                                Adv: ₹{(Number(service.advance) || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3 font-medium">{service.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                      <button 
                        onClick={() => openEditModal("service", service)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-[#c9a24c]/15 text-[#c9a24c] hover:border-[#c9a24c]/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit details
                      </button>
                      <button 
                        onClick={() => handleDeleteService(service.id)}
                        className="px-3 py-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-500 hover:text-white text-rose-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alert Notifications panel */}
          {activeTab === "notifications" && (() => {
            const cleanTargetPhone = String(notifRecipient || '').replace(/\D/g, '').slice(-10);
            const isPhoneTarget = cleanTargetPhone.length === 10;

            return (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  
                  {/* Notification dispatcher form */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/30 md:col-span-1 h-fit premium-card">
                    <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display mb-4">Send Alert Notification</h3>
                    
                    <form onSubmit={handleModalSubmit} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Recipient Target</label>
                          <span className="text-[10px] text-slate-400 font-medium">Quick click or type phone</span>
                        </div>

                        {/* Quick Recipient Target Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setNotifRecipient("9490587575");
                              setNotifType("WhatsApp");
                            }}
                            className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all border ${
                              notifRecipient === "9490587575"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            }`}
                            title="Target Amma Seva Admin Mobile directly"
                          >
                            👑 Admin (9490587575)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifRecipient("All Users");
                              setNotifType("Broadcast");
                            }}
                            className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all border ${
                              notifRecipient === "All Users"
                                ? "bg-[#1e2a5a] text-white border-[#1e2a5a] shadow-sm"
                                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            👥 All Users
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifRecipient("All Caregivers");
                              setNotifType("WhatsApp");
                            }}
                            className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all border ${
                              notifRecipient === "All Caregivers"
                                ? "bg-[#c9a24c] text-white border-[#c9a24c] shadow-sm"
                                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            🩺 Caregivers
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNotifRecipient("All MTPs");
                              setNotifType("WhatsApp");
                            }}
                            className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all border ${
                              notifRecipient === "All MTPs"
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                            }`}
                          >
                            🚗 MTP Staff
                          </button>
                        </div>

                        <input 
                          type="text"
                          required
                          value={notifRecipient}
                          onChange={(e) => setNotifRecipient(e.target.value)}
                          placeholder="e.g. 9490587575, All Users, admin@ammaseva.in"
                          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-background outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] transition-all bg-slate-50/50"
                        />

                        {isPhoneTarget && (
                          <div className="mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-md px-2.5 py-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Phone Target: <b>+91 {cleanTargetPhone}</b>
                            </span>
                            <span className="text-[10px] text-emerald-800 font-extrabold uppercase bg-emerald-100/80 px-1.5 py-0.5 rounded">WhatsApp & SMS Ready</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Delivery Method</label>
                        <select
                          value={notifType}
                          onChange={(e) => setNotifType(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-background outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] cursor-pointer bg-slate-50/50"
                        >
                          <option value="WhatsApp">💬 WhatsApp Message (Automated & Direct)</option>
                          <option value="SMS">📱 Mobile SMS Alert (MSG91 Flow)</option>
                          <option value="Email">📧 Email Message (Official SMTP)</option>
                          <option value="Broadcast">📢 Broadcast Dashboard Alert</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Alert Message</label>
                        <textarea
                          required
                          rows={4}
                          value={notifMessage}
                          onChange={(e) => setNotifMessage(e.target.value)}
                          placeholder="Type alert notification details here..."
                          className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-background outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] bg-slate-50/50"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          onClick={() => setModalType("notification")}
                          className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                        >
                          <Send className="h-4 w-4" /> Send Dispatch
                        </button>
                        {isPhoneTarget && (
                          <a
                            href={`https://wa.me/91${cleanTargetPhone}?text=${encodeURIComponent(notifMessage || '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer whitespace-nowrap"
                            title="Open WhatsApp chat directly with this typed message"
                          >
                            <MessageSquare className="h-4 w-4" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Notifications Dispatch Logs */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/30 md:col-span-2 premium-card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Dispatched Alerts Log</h3>
                      <span className="text-xs text-slate-400 font-bold">{filteredNotifications.length} alerts logged</span>
                    </div>
                    
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {filteredNotifications.map((notif) => {
                        const cleanLogPhone = String(notif.recipient || '').replace(/\D/g, '').slice(-10);
                        const hasValidPhone = cleanLogPhone.length === 10;
                        return (
                          <div key={notif.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-center gap-2 text-[10px] font-bold text-slate-400 mb-2">
                              <span className="text-[#1e2a5a] bg-[#1e2a5a]/5 border border-[#1e2a5a]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">{notif.type}</span>
                              <span>{new Date(notif.sentAt).toLocaleString()}</span>
                            </div>
                            <div className="text-sm font-bold text-[#1e2a5a] mb-1 flex items-center justify-between flex-wrap gap-2">
                              <span>To: {notif.recipient}</span>
                              {hasValidPhone && (
                                <a
                                  href={`https://wa.me/91${cleanLogPhone}?text=${encodeURIComponent(notif.message || '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-sm transition-all"
                                  title="Open WhatsApp chat with this message pre-filled"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">{notif.message}</p>
                          </div>
                        );
                      })}
                      {filteredNotifications.length === 0 && (
                        <p className="text-center text-xs text-slate-400 py-10 font-bold">No notification logs recorded.</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* MTP (Multi Tasking Professionals) Panel */}
          {activeTab === "mtps" && (() => {
            const filteredMTPs = mtps.filter((m) => {
              const matchesSearch =
                m.name?.toLowerCase().includes(mtpSearch.toLowerCase()) ||
                m.phone?.includes(mtpSearch) ||
                m.locality?.toLowerCase().includes(mtpSearch.toLowerCase()) ||
                m.roles?.toLowerCase().includes(mtpSearch.toLowerCase());
              const matchesStatus = mtpStatusFilter === "All" || m.status === mtpStatusFilter;
              const matchesLocality = mtpLocalityFilter === "All" || m.locality === mtpLocalityFilter;
              return matchesSearch && matchesStatus && matchesLocality;
            });

            const pendingCount = mtps.filter((m) => m.status === "Pending").length;
            const verifiedCount = mtps.filter((m) => m.status === "Verified").length;
            const withVehicleCount = mtps.filter((m) => m.vehicle?.toLowerCase().includes("wheeler") || m.vehicle?.toLowerCase().includes("car") || m.vehicle?.toLowerCase().includes("bike")).length;

            return (
              <div className="space-y-6 text-left">
                
                {/* Header Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registered MTPs</div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-[#1e2a5a] font-display">{mtps.length}</span>
                      <Briefcase className="h-5 w-5 text-[#c9a24c]" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-sm">
                    <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-amber-700 font-display">{pendingCount}</span>
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-sm">
                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Verified / Active</div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-emerald-700 font-display">{verifiedCount}</span>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200/80 bg-sky-50/50 p-5 shadow-sm">
                    <div className="text-xs font-bold text-sky-700 uppercase tracking-wider">Task Categories Live</div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-sky-700 font-display">{mtpTasks.length}</span>
                      <Sliders className="h-5 w-5 text-sky-600" />
                    </div>
                  </div>
                </div>

                {/* Sub-Tabs: Applicants vs Task Categories */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                  <button
                    onClick={() => setMtpSubTab("applicants")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                      mtpSubTab === "applicants"
                        ? "bg-[#1e2a5a] text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Applicant Registrations ({mtps.length})
                    {pendingCount > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white">
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setMtpSubTab("tasks")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                      mtpSubTab === "tasks"
                        ? "bg-[#1e2a5a] text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Sliders className="h-4 w-4" />
                    Manage MTP Tasks &amp; Roles ({mtpTasks.length})
                  </button>

                  <button
                    onClick={() => setMtpSubTab("pricing")}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                      mtpSubTab === "pricing"
                        ? "bg-[#1e2a5a] text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <Coins className="h-4 w-4" />
                    Hourly Pricing &amp; Advance % ({mtpPrices.length})
                  </button>
                </div>

                {/* VIEW 1: APPLICANTS */}
                {mtpSubTab === "applicants" && (
                  <div className="space-y-4">
                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={mtpSearch}
                          onChange={(e) => setMtpSearch(e.target.value)}
                          placeholder="Search name, phone, roles, zone..."
                          className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#c9a24c] focus:bg-white transition-colors"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                        <select
                          value={mtpStatusFilter}
                          onChange={(e) => setMtpStatusFilter(e.target.value)}
                          className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#c9a24c]"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Pending Review</option>
                          <option value="Verified">Verified</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Rejected">Rejected</option>
                        </select>

                        <button
                          onClick={fetchDashboardData}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Refresh MTPs list"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Applicants Grid / Table */}
                    {filteredMTPs.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
                        <Briefcase className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                        <div className="font-bold text-primary">No MTP applications found</div>
                        <div className="text-xs mt-1">Try adjusting your search or status filter.</div>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {filteredMTPs.map((m) => {
                          const statusColor =
                            m.status === "Verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : m.status === "Contacted"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : m.status === "Rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200";

                          return (
                            <div
                              key={m.id}
                              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between gap-5"
                            >
                              <div className="space-y-3 flex-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    ID #{m.id}
                                  </span>
                                  <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-full ${statusColor}`}>
                                    {m.status || "Pending"}
                                  </span>
                                  {m.availability && (
                                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                      ⏱️ {m.availability}
                                    </span>
                                  )}
                                  {m.vehicle && (
                                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                      🚗 {m.vehicle}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-slate-400 ml-auto">
                                    Applied: {new Date(m.createdAt || Date.now()).toLocaleDateString()}
                                  </span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div>
                                    <h3 className="text-lg font-bold text-[#1e2a5a] font-display flex items-center gap-2">
                                      {m.name}
                                      {m.gender && <span className="text-xs font-normal text-slate-400">({m.gender}{m.age ? `, ${m.age}y` : ""})</span>}
                                    </h3>
                                    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 font-medium">
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3.5 w-3.5 text-[#c9a24c]" />
                                        <a href={`tel:${m.phone}`} className="hover:underline font-bold text-primary">{m.phone}</a>
                                      </span>
                                      {m.email && (
                                        <span className="flex items-center gap-1">
                                          <Mail className="h-3.5 w-3.5 text-[#c9a24c]" />
                                          {m.email}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5 text-[#c9a24c]" />
                                        {m.locality || "Hyderabad"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Quick Call / WhatsApp actions */}
                                  <div className="flex items-center gap-2 pt-1 sm:pt-0">
                                    <a
                                      href={`tel:${m.phone}`}
                                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#1e2a5a] hover:text-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                                      title="Call Applicant"
                                    >
                                      <Phone className="h-3.5 w-3.5" /> Call
                                    </a>
                                    <a
                                      href={`https://wa.me/91${(m.phone || "").replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(m.name || "Partner")},%20this%20is%20Amma%20Seva%20regarding%20your%20MTP%20registration.`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-all border border-emerald-200"
                                      title="Chat on WhatsApp"
                                    >
                                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                    </a>
                                  </div>
                                </div>

                                {/* Roles / Skills tags */}
                                {m.roles && typeof m.roles === "string" && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {m.roles.split(",").map((r: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="text-[11px] font-semibold bg-gold/10 text-primary border border-gold/20 px-2.5 py-0.5 rounded-lg"
                                      >
                                        {r.trim()}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {m.adminNotes && (
                                  <div className="text-xs bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl text-amber-900 font-medium">
                                    <strong>Admin Note:</strong> {m.adminNotes}
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons Column */}
                              <div className="flex lg:flex-col justify-end items-end shrink-0 gap-2 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                                <button
                                  onClick={() => {
                                    setSelectedMTPDetail(m);
                                    setMtpAdminNotes(m.adminNotes || "");
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" /> Full Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const matchingCard = idCards.find(c => c.source === "mtps" && c.originalId === m.id) || {
                                      id: `mtp_${m.id}`,
                                      originalId: m.id,
                                      type: "mtp" as const,
                                      source: "mtps" as const,
                                      staffCategory: "MTP" as const,
                                      categoryLabel: "MTP Partner",
                                      employeeId: m.employeeId || `AS - MTP - 26-${String(m.id).padStart(3, "0")}`,
                                      name: m.name,
                                      phone: m.phone || "",
                                      email: m.email || "",
                                      designation: "MTP",
                                      specialty: m.roles || "Multi Tasking Professional & Companion Partner",
                                      profilePhoto: m.profilePhoto || "",
                                      status: m.status || "Pending",
                                      joinedAt: m.createdAt || m.joinedAt || "2026-01-01T00:00:00.000Z",
                                      state: m.state || "Telangana",
                                      city: m.city || "Hyderabad"
                                    };
                                    setSelectedCardForView(matchingCard);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                                  title="View Official MTP ID Card"
                                >
                                  <CreditCard className="h-3.5 w-3.5 text-white" /> ID Card
                                </button>

                                <div className="flex gap-1.5">
                                  {m.status !== "Verified" && (
                                    <button
                                      onClick={() => handleUpdateMTPStatus(m.id, "Verified")}
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-xs font-bold transition-all border border-emerald-200 cursor-pointer"
                                      title="Approve / Verify"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  {m.status !== "Contacted" && (
                                    <button
                                      onClick={() => handleUpdateMTPStatus(m.id, "Contacted")}
                                      className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white text-xs font-bold transition-all border border-sky-200 cursor-pointer"
                                      title="Mark as Contacted"
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteMTP(m.id)}
                                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white text-xs font-bold transition-all border border-rose-200 cursor-pointer"
                                    title="Delete MTP Record"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 2: MANAGE MTP TASKS / CARDS */}
                {mtpSubTab === "tasks" && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div>
                        <h3 className="text-lg font-bold text-[#1e2a5a] font-display">
                          Live MTP Task Categories ({mtpTasks.length})
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Create, edit, or remove task cards. Changes are stored in the database and immediately appear on the public website &amp; registration form.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={refreshMtpTasks}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Refresh tasks from DB"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Refresh
                        </button>

                        <button
                          onClick={handleSeedDefaultMtpTasks}
                          className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Seed standard 6 MTP categories into DB"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> Populate 6 Default Tasks
                        </button>

                        <button
                          onClick={handleOpenAddMtpTask}
                          className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                        >
                          <Plus className="h-4 w-4" /> Add New Task Field
                        </button>
                      </div>
                    </div>

                    {/* Task cards grid or empty state */}
                    {mtpTasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400 space-y-4">
                        <Sliders className="mx-auto h-12 w-12 text-slate-300" />
                        <div>
                          <div className="font-bold text-primary text-base">No MTP Task Categories in Database</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Click below to populate the database with the standard 6 care and dropping services, or add your own custom task.
                          </div>
                        </div>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={handleSeedDefaultMtpTasks}
                            className="btn-gold px-5 py-2 text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                          >
                            <Sparkles className="h-4 w-4" /> Populate 6 Default Care Tasks to DB
                          </button>
                          <button
                            onClick={handleOpenAddMtpTask}
                            className="btn-primary px-5 py-2 text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" /> Add Custom Task
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {mtpTasks.map((t) => (
                        <div
                          key={t.id}
                          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-3xl">{t.icon || "🚗"}</span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                ID #{t.id}
                              </span>
                            </div>

                            <h4 className="text-base font-bold text-[#1e2a5a] font-display">
                              {t.title}
                            </h4>

                            <p className="text-xs text-slate-600 leading-relaxed">
                              {t.description}
                            </p>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-gold">
                              <span className="bg-gold/10 px-2 py-0.5 rounded-md text-primary">
                                {t.shiftType || "Part-time / On-Demand"}
                              </span>
                              <span>{t.earningEstimate || "₹300 - ₹1,500 / task"}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleOpenEditMtpTask(t)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#1e2a5a] hover:text-white text-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMtpTask(t.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 text-xs font-bold flex items-center gap-1 transition-all border border-rose-200 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )}

                {/* VIEW 3: HOURLY PRICING & ADVANCE % PACKAGES */}
                {mtpSubTab === "pricing" && (
                  <div className="space-y-5">
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div>
                        <h3 className="text-lg font-bold text-[#1e2a5a] font-display flex items-center gap-2">
                          <span>💰 MTP Hourly Packages &amp; Advance Deposit Pricing</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Configure hourly tiers (2h, 4h, 6h, 8h, etc.), 18% GST calculation, and advance deposit percentage (e.g. 10%, 20%) stored dynamically in backend database.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={refreshMtpPrices}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Refresh prices from DB"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Refresh
                        </button>

                        <button
                          onClick={handleOpenAddMtpPrice}
                          className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer"
                        >
                          <Plus className="h-4 w-4" /> Add Hourly Price Tier
                        </button>
                      </div>
                    </div>

                    {/* Metric highlights */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-left">
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Active Tiers</span>
                        <span className="text-2xl font-black text-[#1e2a5a] font-display mt-1 block">
                          {mtpPrices.filter(p => p.isActive !== false && p.isActive !== 0).length} / {mtpPrices.length}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Live on Booking Screen</span>
                      </div>

                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Base Price Range</span>
                        <span className="text-2xl font-black text-[#c9a24c] font-display mt-1 block">
                          {mtpPrices.length > 0 ? `₹${Math.min(...mtpPrices.map(p => Number(p.price)))} - ₹${Math.max(...mtpPrices.map(p => Number(p.price)))}` : "₹300 - ₹1,000"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">+ 18% Mandatory GST</span>
                      </div>

                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Advance Deposit %</span>
                        <span className="text-2xl font-black text-indigo-700 font-display mt-1 block">
                          {mtpPrices.length > 0 ? `${mtpPrices[0]?.advancePercentage ?? 20}%` : "20%"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Online via Razorpay UPI</span>
                      </div>

                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Remaining Balance</span>
                        <span className="text-2xl font-black text-amber-700 font-display mt-1 block">
                          {mtpPrices.length > 0 ? `${100 - (mtpPrices[0]?.advancePercentage ?? 20)}%` : "80%"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Settled Post-Service</span>
                      </div>
                    </div>

                    {/* Pricing Cards Grid */}
                    {mtpPrices.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400 space-y-3">
                        <Coins className="mx-auto h-12 w-12 text-slate-300" />
                        <div className="font-bold text-primary text-base">No MTP Price Packages Found</div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Add custom hourly packages or standard tiers (2 Hours ₹300, 4 Hours ₹600, 6 Hours ₹800, 8 Hours ₹1,000) with 18% GST and your preferred advance payment percentage.
                        </p>
                        <button
                          onClick={handleOpenAddMtpPrice}
                          className="btn-primary px-5 py-2 text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" /> Add First Hourly Price Tier
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {mtpPrices.map((tier) => {
                          const base = Number(tier.price) || 0;
                          const gstRate = tier.gstRate !== undefined ? Number(tier.gstRate) : 18;
                          const gstAmount = Math.round(base * (gstRate / 100));
                          const total = base + gstAmount;
                          const advPercent = tier.advancePercentage !== undefined ? Number(tier.advancePercentage) : 20;
                          const advanceAmount = Math.round(total * (advPercent / 100));
                          const balanceAmount = total - advanceAmount;
                          const isTierActive = tier.isActive !== false && tier.isActive !== 0;

                          return (
                            <div
                              key={tier.id}
                              className={`rounded-3xl border bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 text-left relative overflow-hidden ${
                                isTierActive ? "border-slate-200/90" : "border-slate-200 opacity-60 bg-slate-50/50"
                              }`}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-900 font-black text-xs border border-amber-500/20">
                                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                                    <span>{tier.hours} Hours Package</span>
                                  </div>
                                  <button
                                    onClick={() => handleToggleMtpPriceActive(tier)}
                                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer transition-all ${
                                      isTierActive 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                                        : "bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200"
                                    }`}
                                    title="Click to toggle active status"
                                  >
                                    {isTierActive ? "● Active" : "○ Inactive"}
                                  </button>
                                </div>

                                <div>
                                  <h4 className="text-base font-extrabold text-[#1e2a5a] font-display">
                                    {tier.label || `${tier.hours} Hours Package`}
                                  </h4>
                                  {tier.description && (
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                                      {tier.description}
                                    </p>
                                  )}
                                </div>

                                {/* Price Breakdown Card */}
                                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-amber-50/30 border border-slate-200/70 space-y-1.5 text-xs font-semibold">
                                  <div className="flex items-center justify-between text-slate-600">
                                    <span>Base Hourly Price:</span>
                                    <span className="font-bold text-slate-900 font-mono">₹{base.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-600">
                                    <span>+ {gstRate}% GST:</span>
                                    <span className="font-bold text-amber-800 font-mono">+₹{gstAmount.toLocaleString()}</span>
                                  </div>
                                  <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-slate-900 font-extrabold">
                                    <span>Total Shift Value:</span>
                                    <span className="text-sm font-black text-[#1e2a5a] font-display">₹{total.toLocaleString()}</span>
                                  </div>
                                </div>

                                {/* Advance vs Balance Split */}
                                <div className="grid grid-cols-2 gap-2 text-center">
                                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70">
                                    <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                                      Advance ({advPercent}%)
                                    </span>
                                    <span className="text-xs font-black text-emerald-900 block mt-0.5 font-mono">
                                      ₹{advanceAmount.toLocaleString()}
                                    </span>
                                    <span className="text-[8px] text-emerald-600 font-medium">Pay Online</span>
                                  </div>

                                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70">
                                    <span className="text-[9px] font-extrabold text-amber-800 uppercase tracking-wider block">
                                      Balance ({100 - advPercent}%)
                                    </span>
                                    <span className="text-xs font-black text-amber-950 block mt-0.5 font-mono">
                                      ₹{balanceAmount.toLocaleString()}
                                    </span>
                                    <span className="text-[8px] text-amber-700 font-medium">Post-Service</span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                  onClick={() => handleOpenEditMtpPrice(tier)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#1e2a5a] hover:text-white text-slate-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5" /> Edit Tier
                                </button>
                                <button
                                  onClick={() => handleDeleteMtpPrice(tier.id)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 text-xs font-bold flex items-center gap-1 transition-all border border-rose-200 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MODAL: ADD / EDIT MTP TASK FIELD */}
                {isMtpTaskModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
                    <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden text-left flex flex-col">
                      <div className="px-6 py-4 bg-gradient-to-r from-[#091438] via-[#112255] to-[#1e2a5a] border-b border-[#c9a24c]/30 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-white/10 border border-[#c9a24c]/40 flex items-center justify-center text-lg">
                            {taskIcon || "🚗"}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-[#f5d77f] uppercase tracking-wider block">
                              {mtpTaskModalMode === "add" ? "Create New Category" : `Edit Task #${editingMtpTaskId}`}
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-white font-display">
                              {mtpTaskModalMode === "add" ? "Add MTP Task Category" : "Edit MTP Task Category"}
                            </h3>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsMtpTaskModalOpen(false)}
                          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-white/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveMtpTask} className="p-6 space-y-4 text-xs">
                        {/* Icon selection */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            Icon / Emoji
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              required
                              value={taskIcon}
                              onChange={(e) => setTaskIcon(e.target.value)}
                              className="w-14 text-center text-lg rounded-xl border border-slate-200 bg-slate-50 p-1.5 outline-none focus:border-[#c9a24c]"
                            />
                            <div className="flex flex-wrap gap-1">
                              {["🚗", "💊", "👴", "🍼", "🩺", "⚡", "🛒", "🏢", "🤝", "🏥", "🦽", "👵"].map((emoji) => (
                                <button
                                  type="button"
                                  key={emoji}
                                  onClick={() => setTaskIcon(emoji)}
                                  className={`p-1.5 rounded-lg text-sm hover:bg-slate-100 cursor-pointer ${taskIcon === emoji ? "bg-gold/20 border border-gold" : ""}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            Task Title <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="e.g. Patient Hospital Dropping & Escort"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-primary focus:bg-white focus:border-[#c9a24c] outline-none"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            Description <span className="text-rose-500">*</span>
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            placeholder="e.g. Accompany patients/seniors safely to doctors, diagnostics & therapy"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-primary focus:bg-white focus:border-[#c9a24c] outline-none resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                              Shift / Type
                            </label>
                            <input
                              type="text"
                              value={taskShiftType}
                              onChange={(e) => setTaskShiftType(e.target.value)}
                              placeholder="e.g. Part-time / On-Demand"
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-primary focus:bg-white focus:border-[#c9a24c] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                              Earning Estimate
                            </label>
                            <input
                              type="text"
                              value={taskEarningEstimate}
                              onChange={(e) => setTaskEarningEstimate(e.target.value)}
                              placeholder="e.g. ₹300 - ₹1,500 / task"
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-primary focus:bg-white focus:border-[#c9a24c] outline-none"
                            />
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setIsMtpTaskModalOpen(false)}
                            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#091438] to-[#1e2a5a] text-white border border-[#c9a24c]/40 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                          >
                            <Save className="h-3.5 w-3.5 text-[#f5d77f]" /> Save Task Category
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MODAL: ADD / EDIT MTP PRICE TIER */}
                {isMtpPriceModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden text-left flex flex-col">
                      <div className="px-6 py-4 bg-gradient-to-r from-[#091438] via-[#112255] to-[#1e2a5a] border-b border-[#c9a24c]/30 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-white/10 border border-[#c9a24c]/40 flex items-center justify-center text-lg text-amber-300">
                            💰
                          </div>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-[#f5d77f] uppercase tracking-wider block">
                              {mtpPriceModalMode === "add" ? "New Pricing Package" : `Edit Package #${editingMtpPriceId}`}
                            </span>
                            <h3 className="text-base sm:text-lg font-bold text-white font-display">
                              {mtpPriceModalMode === "add" ? "Create MTP Hourly Price Tier" : "Edit MTP Hourly Price Tier"}
                            </h3>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsMtpPriceModalOpen(false)}
                          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-white/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveMtpPrice} className="p-6 space-y-4 text-xs">
                        <div className="grid grid-cols-2 gap-3.5">
                          {/* Hours */}
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                              Duration (Hours) <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="number"
                              required
                              min={1}
                              max={24}
                              value={priceHours}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setPriceHours(val);
                                if (!priceLabel || priceLabel.includes("Hours Package")) {
                                  setPriceLabel(`${val} Hours Package`);
                                }
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-primary focus:bg-white focus:border-[#c9a24c] outline-none"
                            />
                          </div>

                          {/* Base Price */}
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                              Base Price (₹) <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="number"
                              required
                              min={0}
                              step={10}
                              value={priceBase}
                              onChange={(e) => setPriceBase(Number(e.target.value))}
                              placeholder="e.g. 300, 600, 800, 1000"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-primary focus:bg-white focus:border-[#c9a24c] outline-none font-mono"
                            />
                          </div>
                        </div>

                        {/* Label */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            Display Label
                          </label>
                          <input
                            type="text"
                            value={priceLabel}
                            onChange={(e) => setPriceLabel(e.target.value)}
                            placeholder="e.g. 2 Hours Package"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-primary focus:bg-white focus:border-[#c9a24c] outline-none"
                          />
                        </div>

                        {/* Advance Percentage with Quick Chips */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                              Advance Payment Required (%) <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {priceAdvancePercentage}% Advance
                            </span>
                          </div>

                          <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={priceAdvancePercentage}
                            onChange={(e) => setPriceAdvancePercentage(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />

                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Select:</span>
                            {[10, 15, 20, 25, 30, 50, 100].map((pct) => (
                              <button
                                type="button"
                                key={pct}
                                onClick={() => setPriceAdvancePercentage(pct)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                                  priceAdvancePercentage === pct
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                              >
                                {pct}%
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* GST Rate */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            GST Tax Rate (%)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={28}
                              value={priceGstRate}
                              onChange={(e) => setPriceGstRate(Number(e.target.value))}
                              className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-primary focus:bg-white focus:border-[#c9a24c] outline-none"
                            />
                            <span className="text-xs text-slate-500 font-semibold">Standard 18% IGST</span>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            Package Description / Scope
                          </label>
                          <textarea
                            rows={2}
                            value={priceDescription}
                            onChange={(e) => setPriceDescription(e.target.value)}
                            placeholder="e.g. Safe patient transit, doctor appointment assistance & dropping"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-primary focus:bg-white focus:border-[#c9a24c] outline-none resize-none"
                          />
                        </div>

                        {/* Active Toggle */}
                        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={priceIsActive}
                            onChange={(e) => setPriceIsActive(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-[#1e2a5a] focus:ring-[#c9a24c] cursor-pointer accent-[#1e2a5a]"
                          />
                          <span className="text-xs font-bold text-slate-700">
                            Enable package (Visible on customer booking screen)
                          </span>
                        </label>

                        {/* Live Calculation Preview */}
                        {(() => {
                          const base = Number(priceBase) || 0;
                          const gstAmt = Math.round(base * ((Number(priceGstRate) || 18) / 100));
                          const totalAmt = base + gstAmt;
                          const advAmt = Math.round(totalAmt * ((Number(priceAdvancePercentage) || 0) / 100));
                          const balAmt = totalAmt - advAmt;
                          return (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 space-y-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block pb-1 border-b border-amber-300/40">
                                📊 Live Price Breakdown Preview
                              </span>
                              <div className="flex justify-between text-xs font-semibold">
                                <span>Base Service Amount:</span>
                                <span className="font-mono font-bold">₹{base.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs font-semibold">
                                <span>+ 18% GST:</span>
                                <span className="font-mono font-bold text-amber-900">+₹{gstAmt.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs font-extrabold text-[#1e2a5a] pt-1 border-t border-amber-300/40">
                                <span>Total Amount:</span>
                                <span className="font-mono text-sm">₹{totalAmt.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold text-emerald-800">
                                <span>Advance Required Now ({priceAdvancePercentage}%):</span>
                                <span className="font-mono">₹{advAmt.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold text-amber-900">
                                <span>Remaining Balance (After Service):</span>
                                <span className="font-mono">₹{balAmt.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setIsMtpPriceModalOpen(false)}
                            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingMtpPrice}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#091438] to-[#1e2a5a] text-white border border-[#c9a24c]/40 text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Save className="h-3.5 w-3.5 text-[#f5d77f]" />
                            {isSavingMtpPrice ? "Saving..." : "Save Pricing Package"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* MTP Applicant Full Detail Modal */}
                {selectedMTPDetail && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
                    <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200/90 max-h-[90vh] overflow-hidden flex flex-col text-left">
                      <div className="px-6 py-4 bg-gradient-to-r from-[#091438] via-[#112255] to-[#1e2a5a] border-b border-[#c9a24c]/30 flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#f5d77f] bg-white/10 px-2 py-0.5 rounded border border-white/10">
                            MTP Application #{selectedMTPDetail.id}
                          </span>
                          <h2 className="text-lg sm:text-xl font-bold text-white font-display mt-1">
                            {selectedMTPDetail.name}
                          </h2>
                          <p className="text-[11px] text-slate-300">
                            Applied on {new Date(selectedMTPDetail.createdAt || Date.now()).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedMTPDetail(null)}
                          className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-white/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                        {/* Detail fields */}
                        <div className="grid sm:grid-cols-2 gap-3.5">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Contact</span>
                            <div className="font-bold text-primary text-xs">{selectedMTPDetail.phone}</div>
                            <div className="text-slate-500">{selectedMTPDetail.email || "No email provided"}</div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Location &amp; Zone</span>
                            <div className="font-bold text-primary text-xs">{selectedMTPDetail.locality || "Hyderabad"}</div>
                            <div className="text-slate-500">
                              {selectedMTPDetail.city || "Hyderabad"}{selectedMTPDetail.state ? `, ${selectedMTPDetail.state}` : ""}
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Availability &amp; Transport</span>
                            <div className="font-bold text-primary">{selectedMTPDetail.availability}</div>
                            <div className="text-slate-500">Vehicle: {selectedMTPDetail.vehicle} (License: {selectedMTPDetail.drivingLicense || "N/A"})</div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Experience &amp; ID</span>
                            <div className="font-bold text-primary">{selectedMTPDetail.experience}</div>
                            <div className="text-slate-500">Aadhaar: {selectedMTPDetail.aadhaar || "Not provided yet"}</div>
                          </div>

                          {selectedMTPDetail.emergencyContact && (
                            <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Emergency Contact</span>
                              <div className="font-semibold text-primary">{selectedMTPDetail.emergencyContact}</div>
                            </div>
                          )}

                          {selectedMTPDetail.skillsSummary && (
                            <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-1">
                              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Languages &amp; Bio</span>
                              <div className="text-slate-700 leading-relaxed">{selectedMTPDetail.skillsSummary}</div>
                            </div>
                          )}

                          <div className="sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2">
                            <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Roles &amp; Tasks Interested In</span>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedMTPDetail.roles ? (
                                selectedMTPDetail.roles.split(",").map((r: string, idx: number) => (
                                  <span key={idx} className="bg-[#c9a24c]/15 text-primary border border-[#c9a24c]/30 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
                                    {r.trim()}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400">No roles selected</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Uploaded Verification Documents */}
                        <div className="space-y-2.5 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-[#c9a24c]" /> Uploaded KYC Documents
                            </span>
                            <span className="text-[10px] text-slate-400">Click to view on screen with zero forced download</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Aadhaar */}
                            <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileCheck className="h-4 w-4 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-primary truncate">Aadhaar Document</div>
                                  <div className="text-[10px] text-slate-500">{selectedMTPDetail.aadhaarDoc ? "Uploaded" : "Not Provided"}</div>
                                </div>
                              </div>
                              {selectedMTPDetail.aadhaarDoc ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(selectedMTPDetail.aadhaarDoc, "Aadhaar Document", selectedMTPDetail.name, "MTP Partner Verification")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3 w-3" /> View
                                </button>
                              ) : (
                                <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-semibold">Missing</span>
                              )}
                            </div>

                            {/* PAN */}
                            <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <CreditCard className="h-4 w-4 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-primary truncate">PAN Card</div>
                                  <div className="text-[10px] text-slate-500">{selectedMTPDetail.panDoc ? "Uploaded" : "Not Provided"}</div>
                                </div>
                              </div>
                              {selectedMTPDetail.panDoc ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(selectedMTPDetail.panDoc, "PAN Card", selectedMTPDetail.name, "MTP Partner Verification")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3 w-3" /> View
                                </button>
                              ) : (
                                <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-semibold">Missing</span>
                              )}
                            </div>

                            {/* Driving License */}
                            <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Car className="h-4 w-4 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-primary truncate">Driving Licence</div>
                                  <div className="text-[10px] text-slate-500">{selectedMTPDetail.drivingLicenseDoc ? "Uploaded" : "Optional / None"}</div>
                                </div>
                              </div>
                              {selectedMTPDetail.drivingLicenseDoc ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(selectedMTPDetail.drivingLicenseDoc, "Driving Licence Document", selectedMTPDetail.name, "MTP Partner Verification")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3 w-3" /> View
                                </button>
                              ) : (
                                <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-semibold">N/A</span>
                              )}
                            </div>

                            {/* 10th Certificate */}
                            <div className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-primary truncate">10th Certificate</div>
                                  <div className="text-[10px] text-slate-500">{selectedMTPDetail.tenthCertificateDoc ? "Uploaded" : "Optional / None"}</div>
                                </div>
                              </div>
                              {selectedMTPDetail.tenthCertificateDoc ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(selectedMTPDetail.tenthCertificateDoc, "10th Certificate / Education Proof", selectedMTPDetail.name, "MTP Partner Verification")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3 w-3" /> View
                                </button>
                              ) : (
                                <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded font-semibold">N/A</span>
                              )}
                            </div>

                            {/* Police Verification */}
                            <div className="sm:col-span-2 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-primary truncate">Police Verification Certificate (PCC)</div>
                                  <div className="text-[10px] text-slate-500">{selectedMTPDetail.policeVerificationDoc ? "Uploaded & Available" : "Not Provided"}</div>
                                </div>
                              </div>
                              {selectedMTPDetail.policeVerificationDoc ? (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(selectedMTPDetail.policeVerificationDoc, "Police Verification Certificate (PCC)", selectedMTPDetail.name, "MTP Partner Verification")}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3 w-3" /> View PCC
                                </button>
                              ) : (
                                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">Missing</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Notes Section */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                            Internal Admin Notes
                          </label>
                          <textarea
                            rows={2}
                            value={mtpAdminNotes}
                            onChange={(e) => setMtpAdminNotes(e.target.value)}
                            placeholder="Add coordinator notes, interview outcome, ID verification status..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-primary focus:bg-white focus:border-[#c9a24c] outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* Modal Actions */}
                      <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateMTPStatus(selectedMTPDetail.id, "Verified")}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Mark Verified
                          </button>
                          <button
                            onClick={() => handleUpdateMTPStatus(selectedMTPDetail.id, "Contacted")}
                            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Mark Contacted
                          </button>
                          <button
                            onClick={() => handleUpdateMTPStatus(selectedMTPDetail.id, "Rejected")}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            Reject
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const matchingCard = idCards.find(c => c.source === "mtps" && c.originalId === selectedMTPDetail.id) || {
                                id: `mtp_${selectedMTPDetail.id}`,
                                originalId: selectedMTPDetail.id,
                                type: "mtp" as const,
                                source: "mtps" as const,
                                staffCategory: "MTP" as const,
                                categoryLabel: "MTP Partner",
                                employeeId: selectedMTPDetail.employeeId || `AS - MTP - 26-${String(selectedMTPDetail.id).padStart(3, "0")}`,
                                name: selectedMTPDetail.name,
                                phone: selectedMTPDetail.phone || "",
                                email: selectedMTPDetail.email || "",
                                designation: "MTP",
                                specialty: selectedMTPDetail.roles || "Multi Tasking Professional & Companion Partner",
                                profilePhoto: selectedMTPDetail.profilePhoto || "",
                                status: selectedMTPDetail.status || "Pending",
                                joinedAt: selectedMTPDetail.createdAt || "2026-01-01T00:00:00.000Z",
                                state: selectedMTPDetail.state || "Telangana",
                                city: selectedMTPDetail.city || "Hyderabad"
                              };
                              setSelectedMTPDetail(null);
                              setSelectedCardForView(matchingCard);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <CreditCard className="h-3.5 w-3.5" /> View ID Card
                          </button>
                          <button
                            onClick={() => {
                              handleUpdateMTPStatus(selectedMTPDetail.id, selectedMTPDetail.status, mtpAdminNotes);
                              setSelectedMTPDetail(null);
                            }}
                            className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-[#091438] to-[#1e2a5a] text-white border border-[#c9a24c]/40 text-xs font-bold shadow-md cursor-pointer"
                          >
                            Save &amp; Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Staff ID Cards Management Panel */}
          {activeTab === "id-cards" && (() => {
            const countAll = idCards.length;
            const countEmp = idCards.filter(c => c.staffCategory === "EMP").length;
            const countMtp = idCards.filter(c => c.staffCategory === "MTP").length;
            const countNur = idCards.filter(c => c.staffCategory === "NUR").length;
            const countCgv = idCards.filter(c => c.staffCategory === "CGV").length;

            const filteredIdCards = idCards.filter(card => {
              if (idCardCategoryTab !== "ALL" && card.staffCategory !== idCardCategoryTab) return false;
              if (!idCardSearch.trim()) return true;
              const q = idCardSearch.toLowerCase().trim();
              return (
                (card.employeeId && card.employeeId.toLowerCase().includes(q)) ||
                (card.name && card.name.toLowerCase().includes(q)) ||
                (card.designation && card.designation.toLowerCase().includes(q)) ||
                (card.phone && card.phone.toLowerCase().includes(q)) ||
                (card.email && card.email.toLowerCase().includes(q)) ||
                (card.specialty && card.specialty.toLowerCase().includes(q))
              );
            });

            return (
              <div className="space-y-6 text-left animate-in fade-in duration-200">
                {/* Header with Title and Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-[#091438] text-[#c9a24c] shadow-xs">
                        <CreditCard className="w-5 h-5" />
                      </span>
                      <h2 className="text-xl font-black text-slate-900 font-display">
                        Staff ID Cards &amp; Official Credentials
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
                      Official Amma Seva PVC biometric badges with verified serial numbering starting from 001 per staff category. Preview, customize, issue, and print high-resolution CR80 cards.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fetchDashboardData()}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                      Sync
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenIssueEmployeeModal(idCardCategoryTab !== "ALL" ? idCardCategoryTab : "EMP")}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#091438] to-[#1e2a5a] text-white hover:from-[#172147] hover:to-[#26356b] border border-[#c9a24c]/40 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#091438]/10 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#c9a24c]" />
                      + Issue Staff ID Card
                    </button>
                  </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* EMP */}
                  <div 
                    onClick={() => setIdCardCategoryTab("EMP")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      idCardCategoryTab === "EMP" 
                        ? "bg-indigo-50/70 border-indigo-400 shadow-sm" 
                        : "bg-white border-slate-200/80 hover:border-indigo-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                        Employees
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">AS - EMP - 26-xxx</span>
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{countEmp}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">Office Staff</span>
                    </div>
                  </div>

                  {/* MTP */}
                  <div 
                    onClick={() => setIdCardCategoryTab("MTP")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      idCardCategoryTab === "MTP" 
                        ? "bg-amber-50/70 border-amber-400 shadow-sm" 
                        : "bg-white border-slate-200/80 hover:border-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                        MTP Partners
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">AS - MTP - 26-xxx</span>
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{countMtp}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">Transport Escorts</span>
                    </div>
                  </div>

                  {/* NUR */}
                  <div 
                    onClick={() => setIdCardCategoryTab("NUR")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      idCardCategoryTab === "NUR" 
                        ? "bg-teal-50/70 border-teal-400 shadow-sm" 
                        : "bg-white border-slate-200/80 hover:border-teal-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                        Registered Nurses
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">AS - NUR - 26-xxx</span>
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{countNur}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">Clinical Staff</span>
                    </div>
                  </div>

                  {/* CGV */}
                  <div 
                    onClick={() => setIdCardCategoryTab("CGV")}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      idCardCategoryTab === "CGV" 
                        ? "bg-blue-50/70 border-blue-400 shadow-sm" 
                        : "bg-white border-slate-200/80 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                        Care Givers
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">AS - CGV - 26-xxx</span>
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{countCgv}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">Attendants</span>
                    </div>
                  </div>
                </div>

                {/* Filter Tabs & Search Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setIdCardCategoryTab("ALL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        idCardCategoryTab === "ALL"
                          ? "bg-white text-[#1e2a5a] shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🌟 All Staff
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 font-mono">
                        {countAll}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIdCardCategoryTab("EMP")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        idCardCategoryTab === "EMP"
                          ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      💼 Employees (AS - EMP - 26-xxx)
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${idCardCategoryTab === "EMP" ? "bg-indigo-700 text-white" : "bg-slate-200/70"}`}>
                        {countEmp}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIdCardCategoryTab("MTP")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        idCardCategoryTab === "MTP"
                          ? "bg-amber-600 text-white shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🚗 MTPs (AS - MTP - 26-xxx)
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${idCardCategoryTab === "MTP" ? "bg-amber-700 text-white" : "bg-slate-200/70"}`}>
                        {countMtp}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIdCardCategoryTab("NUR")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        idCardCategoryTab === "NUR"
                          ? "bg-teal-600 text-white shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🩺 Nurses (AS - NUR - 26-xxx)
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${idCardCategoryTab === "NUR" ? "bg-teal-700 text-white" : "bg-slate-200/70"}`}>
                        {countNur}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIdCardCategoryTab("CGV")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        idCardCategoryTab === "CGV"
                          ? "bg-blue-600 text-white shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      🤲 Care Givers (AS - CGV - 26-xxx)
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${idCardCategoryTab === "CGV" ? "bg-blue-700 text-white" : "bg-slate-200/70"}`}>
                        {countCgv}
                      </span>
                    </button>
                  </div>

                  {/* Real-time Search Box */}
                  <div className="relative min-w-[280px] sm:min-w-[320px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ID, name, designation, phone..."
                      value={idCardSearch}
                      onChange={(e) => setIdCardSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1e2a5a] focus:bg-white transition-all"
                    />
                    {idCardSearch && (
                      <button
                        type="button"
                        onClick={() => setIdCardSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Results count text */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    Showing <strong className="text-slate-800">{filteredIdCards.length}</strong> of{" "}
                    <strong className="text-slate-800">{idCards.length}</strong> total credential records
                    {idCardCategoryTab !== "ALL" && (
                      <span className="ml-1 text-[#1e2a5a] font-bold">({idCardCategoryTab} tab)</span>
                    )}
                  </span>
                  {idCardSearch && (
                    <button
                      type="button"
                      onClick={() => setIdCardSearch("")}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Clear search filter
                    </button>
                  )}
                </div>

                {/* Cards Grid */}
                {filteredIdCards.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-700">No staff credentials found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {idCardSearch 
                        ? `No results match your search "${idCardSearch}". Try searching by another keyword or reset the category filter.`
                        : "No records found in this category. You can register staff or issue new office employee credentials."}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      {idCardSearch && (
                        <button
                          type="button"
                          onClick={() => setIdCardSearch("")}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenIssueEmployeeModal(idCardCategoryTab !== "ALL" ? idCardCategoryTab : "EMP")}
                        className="px-4 py-2 rounded-xl bg-[#091438] text-white text-xs font-bold hover:bg-[#172147] cursor-pointer"
                      >
                        + Issue Staff ID Card
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredIdCards.map((card) => {
                      const catBadgeColors = {
                        EMP: "bg-indigo-50 text-indigo-700 border-indigo-200",
                        MTP: "bg-amber-50 text-amber-700 border-amber-200",
                        NUR: "bg-teal-50 text-teal-700 border-teal-200",
                        CGV: "bg-blue-50 text-blue-700 border-blue-200"
                      }[card.staffCategory] || "bg-slate-50 text-slate-700 border-slate-200";

                      return (
                        <div
                          key={card.id}
                          className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-[#c9a24c]/40 transition-all flex flex-col justify-between group"
                        >
                          {/* Card Top */}
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${catBadgeColors}`}>
                                {card.categoryLabel || card.staffCategory}
                              </span>
                              <span className="text-xs font-mono font-black text-[#091438] bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200">
                                {card.employeeId}
                              </span>
                            </div>

                            {/* Staff Info block */}
                            <div className="flex items-center gap-3.5 mt-4">
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border-2 border-[#d4af37]/60 shrink-0 shadow-xs">
                                {card.profilePhoto ? (
                                  <img
                                    src={card.profilePhoto}
                                    alt={card.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-b from-slate-50 to-slate-200">
                                    <User className="w-6 h-6 text-slate-400" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-extrabold text-slate-900 truncate">
                                  {card.name}
                                </h4>
                                <p className="text-[11px] font-bold text-[#c9a24c] truncate mt-0.5">
                                  {getCleanIdCardDesignation(card)}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                    card.status === "Verified" 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}>
                                    {card.status === "Verified" ? "● Verified" : "● Pending"}
                                  </span>
                                  {card.phone && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {card.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedCardForView(card)}
                              className="px-3 py-1.5 rounded-xl bg-[#091438] hover:bg-[#172147] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-[#c9a24c]" />
                              View ID Card
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                title="Print Badge"
                                onClick={() => handlePrintIdCard(card)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                              >
                                <Printer className="w-4 h-4 text-slate-600" />
                              </button>
                              <button
                                type="button"
                                title="Edit Details"
                                onClick={() => handleOpenEditIdCardModal(card)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4 text-slate-600" />
                              </button>
                              {card.source === "employees" && (
                                <button
                                  type="button"
                                  title="Delete Employee"
                                  onClick={() => handleDeleteEmployee(card.originalId, card.name)}
                                  className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Enquiries Leads panel */}
          {activeTab === "enquiries" && (
            <div className="grid gap-6">
              {filteredEnquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-100/30 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between gap-6 premium-card"
                >
                  <div className="space-y-4 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded">
                        ID: {enq.id}
                      </span>
                      {enq.service && (
                        <span className="text-xs font-bold text-[#c9a24c] bg-[#c9a24c]/10 border border-[#c9a24c]/20 px-2.5 py-0.5 rounded-full">
                          {enq.service}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-semibold">
                        {new Date(enq.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#1e2a5a] font-display">{enq.name}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-[#c9a24c] shrink-0" />
                          {enq.phone}
                        </span>
                        {enq.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4 text-[#c9a24c] shrink-0" />
                            {enq.email}
                          </span>
                        )}
                        {enq.city && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-[#c9a24c] shrink-0" />
                            {enq.city}
                          </span>
                        )}
                      </div>
                    </div>

                    {enq.message && (
                      <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-100 text-xs text-slate-600 italic leading-relaxed font-medium">
                        &ldquo;{enq.message}&rdquo;
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col justify-end items-start md:items-end shrink-0 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                    <button
                      onClick={() => handleDeleteEnquiry(enq.id)}
                      className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-500 border border-rose-100 hover:border-rose-500 text-rose-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Lead
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Blogs Management Panel */}
          {activeTab === "blogs" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/40 premium-card">
                <div className="text-left">
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Health Articles &amp; Blogs</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Publish and manage clinical advice pages for the Amma Seva Blog.</p>
                </div>
                <button
                  onClick={() => {
                    openAddModal("blog");
                  }}
                  className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="h-4 w-4" /> Add Blog Post
                </button>
              </div>

              <div className="grid gap-4">
                {blogs.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.category.toLowerCase().includes(searchQuery.toLowerCase())).map((b) => (
                  <div
                    key={b.id}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-100/30 hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row gap-5 items-start sm:items-center premium-card"
                  >
                    {b.image && (
                      <div className="h-20 w-32 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 shadow-sm">
                        <img src={b.image} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                    <div className="flex-1 text-left space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#c9a24c]/10 text-[#c9a24c] border border-[#c9a24c]/20 px-2.5 py-0.5 rounded">
                          {b.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          📅 {b.date} | ✍️ {b.author}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#1e2a5a] leading-snug font-display">{b.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">{b.description}</p>
                    </div>

                    <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => openEditModal("blog", b)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-[#c9a24c]/15 text-[#c9a24c] border border-slate-200 hover:border-[#c9a24c]/30 transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(b.id)}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {blogs.length === 0 && (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-white p-6 shadow-sm">
                    <p className="text-slate-400 text-sm font-semibold">No health articles loaded. Click "Add Blog Post" to publish the first guide!</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "faqs" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Manage FAQs</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Total: {faqs.length} FAQ questions</p>
                </div>
                <button
                  onClick={() => openAddModal("faq")}
                  className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="h-4 w-4" /> Add FAQ Item
                </button>
              </div>

              <div className="grid gap-4">
                {faqs
                  .filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((f) => (
                    <div
                      key={f.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-100/30 hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row gap-5 items-start sm:items-center text-left premium-card"
                    >
                      <div className="flex-1 text-left space-y-1.5">
                        <h4 className="text-base font-bold text-[#1e2a5a] leading-snug font-display">{f.question}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.answer}</p>
                      </div>

                      <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => openEditModal("faq", f)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-[#c9a24c]/15 text-[#c9a24c] border border-slate-200 hover:border-[#c9a24c]/30 transition-colors cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(f.id)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                {faqs.length === 0 && (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-white p-6 shadow-sm">
                    <p className="text-slate-400 text-sm font-semibold">No FAQ items loaded. Click "Add FAQ Item" to publish the first guide!</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "gallery" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Manage Photo Gallery</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Total: {gallery.length} photos</p>
                </div>
                <button
                  onClick={() => openAddModal("gallery")}
                  className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="h-4 w-4" /> Add Gallery Image
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {gallery
                  .filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((g) => (
                    <div
                      key={g.id}
                      className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-md shadow-slate-100/30 flex flex-col justify-between hover:shadow-lg transition-all premium-card"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-150">
                        <img src={g.imageUrl} className="w-full h-full object-cover" alt={g.title} />
                      </div>
                      <div className="p-4 text-left space-y-1.5">
                        <h4 className="text-sm font-bold text-[#1e2a5a] truncate font-display">{g.title}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">Added: {new Date(g.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="px-4 pb-4 flex justify-end border-t border-slate-50 pt-2.5">
                        <button
                          onClick={() => handleDeleteGallery(g.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 text-rose-500 transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete Image
                        </button>
                      </div>
                    </div>
                  ))}

                {gallery.length === 0 && (
                  <div className="col-span-full text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-white p-6 shadow-sm">
                    <p className="text-slate-400 text-sm font-semibold">No images uploaded. Click "Add Gallery Image" to publish the first photo!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Referral Network Intelligence & Tracking Panel */}
          {activeTab === "referrals" && (() => {
            const summary = referralsData?.summary || {
              totalCaregivers: caregivers?.length || 0,
              activeReferrersCount: (referralsData?.referrers || []).filter(r => (r?.referredCount || 0) > 0).length || 0,
              totalReferred: (referralsData?.allReferredCandidates || []).length || 0,
              totalVerified: (referralsData?.allReferredCandidates || []).filter(c => c?.status === "Verified").length || 0,
              totalPending: (referralsData?.allReferredCandidates || []).filter(c => c?.status !== "Verified").length || 0
            };

            const referrersList = referralsData?.referrers || [];
            const allCandidatesList = referralsData?.allReferredCandidates || [];

            // Filter candidates
            const filteredCandidates = allCandidatesList.filter(c => {
              const q = referralsSearch.toLowerCase();
              const matchesSearch = 
                (c?.name || "").toLowerCase().includes(q) ||
                (c?.phone || "").includes(referralsSearch) ||
                (c?.email || "").toLowerCase().includes(q) ||
                (c?.specialty || "").toLowerCase().includes(q) ||
                (c?.referrerName || "").toLowerCase().includes(q) ||
                (c?.referrerCode || "").toLowerCase().includes(q) ||
                ((c?.city || "").toLowerCase().includes(q));
              
              const matchesStatus = referralsStatusFilter === "All" || c?.status === referralsStatusFilter;
              return matchesSearch && matchesStatus;
            });

            // Filter referrers
            const filteredReferrers = referrersList.filter(r => {
              const q = referralsSearch.toLowerCase();
              const matchesSearch = 
                (r?.name || "").toLowerCase().includes(q) ||
                (r?.phone || "").includes(referralsSearch) ||
                (r?.referCode || "").toLowerCase().includes(q) ||
                (r?.specialty || "").toLowerCase().includes(q) ||
                (Array.isArray(r?.referees) && r.referees.some((ref: any) => (ref?.name || "").toLowerCase().includes(q)));
              
              const matchesStatus = referralsStatusFilter === "All" 
                || (referralsStatusFilter === "Active" && r.referredCount > 0)
                || (referralsStatusFilter === "Verified" && r.verifiedCount > 0)
                || (referralsStatusFilter === "Pending" && r.pendingCount > 0);

              return matchesSearch && matchesStatus;
            });

            return (
              <div className="space-y-6 text-left animate-in fade-in duration-200">
                {/* Header with Title & Controls */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 flex flex-col md:flex-row md:items-center justify-between gap-4 premium-card">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-[#9e761a] bg-[#c9a24c]/15 px-2.5 py-0.5 rounded-full border border-[#c9a24c]/30 flex items-center gap-1 font-mono">
                        <Gift className="h-3 w-3 text-[#c9a24c]" /> Staff Referral Tracking
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">• Admin Confidential</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#1e2a5a] font-display">
                      Referral Network &amp; Candidate Intelligence
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Track which caretakers shared referral links, who joined through their links, and inspect full candidate KYC dossiers.
                    </p>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setReferralsViewMode("by-referrer")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        referralsViewMode === "by-referrer"
                          ? "bg-[#1e2a5a] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" /> By Caretaker / Referrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setReferralsViewMode("all-candidates")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        referralsViewMode === "all-candidates"
                          ? "bg-[#1e2a5a] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5" /> All Referred Candidates ({allCandidatesList.length})
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Ribbon */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Staff</span>
                    <span className="text-2xl font-black text-[#1e2a5a] font-display">{summary.totalCaregivers}</span>
                    <span className="text-[10px] text-slate-500 font-medium block">In database</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-[#c9a24c] uppercase tracking-wider block">Active Referrers</span>
                    <span className="text-2xl font-black text-[#c9a24c] font-display">{summary.activeReferrersCount}</span>
                    <span className="text-[10px] text-slate-500 font-medium block">Shared links &amp; invited staff</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Total Candidates Joined</span>
                    <span className="text-2xl font-black text-indigo-600 font-display">{summary.totalReferred}</span>
                    <span className="text-[10px] text-slate-500 font-medium block">Joined via caretaker links</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Verified Candidates</span>
                    <span className="text-2xl font-black text-emerald-600 font-display">{summary.totalVerified}</span>
                    <span className="text-[10px] text-slate-500 font-medium block">Approved for patient shifts</span>
                  </div>

                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Pending Review</span>
                    <span className="text-2xl font-black text-amber-600 font-display">{summary.totalPending}</span>
                    <span className="text-[10px] text-slate-500 font-medium block">Awaiting KYC verification</span>
                  </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search referrer, referee, code, phone, city..."
                      value={referralsSearch}
                      onChange={(e) => setReferralsSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] transition-all text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Filter Status:</span>
                    <select
                      value={referralsStatusFilter}
                      onChange={(e) => setReferralsStatusFilter(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:border-[#c9a24c]"
                    >
                      <option value="All">All Records</option>
                      <option value="Verified">Verified Only</option>
                      <option value="Pending">Pending Only</option>
                      <option value="Rejected">Rejected Only</option>
                    </select>
                  </div>
                </div>

                {/* VIEW MODE 1: GROUPED BY REFERRER / CARETAKER */}
                {referralsViewMode === "by-referrer" && (
                  <div className="space-y-4">
                    {filteredReferrers.length === 0 ? (
                      <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                        <Gift className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-semibold">No referral records match your criteria.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 grid-cols-1">
                        {filteredReferrers.map((referrer) => {
                          const isExpanded = expandedReferrerCode === referrer.referCode;
                          return (
                            <div
                              key={referrer.referCode}
                              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all premium-card"
                            >
                              {/* Referrer Header Card */}
                              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/70 to-white border-b border-slate-100">
                                <div className="flex items-center gap-4">
                                  {referrer.profilePhoto ? (
                                    <img
                                      src={referrer.profilePhoto}
                                      alt={referrer.name}
                                      className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-xl bg-[#1e2a5a]/10 border border-[#1e2a5a]/20 flex items-center justify-center text-[#1e2a5a] font-bold text-lg">
                                      {referrer.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-base text-[#1e2a5a] font-display">
                                        {referrer.name}
                                      </h4>
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-[#c9a24c]/15 text-[#8c6b16] border border-[#c9a24c]/30 font-mono tracking-wider">
                                        <Gift className="h-3 w-3 text-[#b08726]" />
                                        REF CODE: {referrer.referCode}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                                      <span>🩺 {referrer.specialty}</span>
                                      {referrer.phone !== "N/A" && <span>📞 {referrer.phone}</span>}
                                      {referrer.email !== "N/A" && <span>✉️ {referrer.email}</span>}
                                      {referrer.city && <span>📍 {referrer.city}</span>}
                                    </div>
                                  </div>
                                </div>

                                {/* Referrer Actions and Counters */}
                                <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-extrabold">
                                      {referrer.referredCount} {referrer.referredCount === 1 ? "Member Joined" : "Members Joined"}
                                    </span>
                                    {referrer.verifiedCount > 0 && (
                                      <span className="px-2 py-1 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold">
                                        ✓ {referrer.verifiedCount} Verified
                                      </span>
                                    )}
                                    {referrer.pendingCount > 0 && (
                                      <span className="px-2 py-1 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold">
                                        ⏳ {referrer.pendingCount} Pending
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      title="Copy Referrer Code"
                                      onClick={() => {
                                        navigator.clipboard.writeText(referrer.referCode);
                                        alert(`Copied Referral Code: ${referrer.referCode}`);
                                      }}
                                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Copy Careers Application Link"
                                      onClick={() => {
                                        const link = `${window.location.origin}/login?ref=${referrer.referCode}&type=caretaker`;
                                        navigator.clipboard.writeText(link);
                                        alert(`Copied Registration Link:\n${link}`);
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Share2 className="h-3.5 w-3.5" /> Link
                                    </button>

                                    {referrer.referredCount > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedReferrerCode(isExpanded ? null : referrer.referCode)}
                                        className="px-3 py-1.5 rounded-lg bg-[#1e2a5a] hover:bg-[#283875] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                      >
                                        {isExpanded ? "Hide Members ▲" : `View ${referrer.referredCount} Joiners ▼`}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Nested Members Joined List */}
                              {isExpanded && (
                                <div className="p-5 bg-slate-50/40 border-t border-slate-100 space-y-3">
                                  <h5 className="text-xs font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5">
                                    <UserCheck className="h-4 w-4 text-[#c9a24c]" />
                                    Members Who Joined Using {referrer.name}&apos;s Referral Code ({referrer.referees.length})
                                  </h5>

                                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {referrer.referees.map((candidate) => (
                                      <div
                                        key={candidate.id}
                                        className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs hover:border-[#c9a24c]/50 transition-all space-y-3"
                                      >
                                        <div className="flex justify-between items-start gap-2">
                                          <div>
                                            <h6 className="font-bold text-sm text-[#1e2a5a]">{candidate.name}</h6>
                                            <span className="text-xs text-slate-500 block">{candidate.specialty}</span>
                                          </div>
                                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            candidate.status === "Verified" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                            candidate.status === "Rejected" ? "bg-rose-50 text-rose-800 border-rose-200" :
                                            "bg-amber-50 text-amber-800 border-amber-200"
                                          }`}>
                                            {candidate.status}
                                          </span>
                                        </div>

                                        <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                                          <div>📞 <a href={`tel:${candidate.phone}`} className="hover:underline">{candidate.phone}</a></div>
                                          <div>✉️ <span className="text-slate-500">{candidate.email}</span></div>
                                          <div>⏱️ <span className="font-semibold">{candidate.experience} yrs exp</span> • Joined: {new Date(candidate.joinedAt).toLocaleDateString()}</div>
                                          {candidate.city && <div>📍 {candidate.city}, {candidate.state}</div>}
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setSelectedCandidateDetail(candidate)}
                                            className="w-full py-1.5 px-3 rounded-lg bg-[#1e2a5a]/5 hover:bg-[#1e2a5a] text-[#1e2a5a] hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                                          >
                                            <Eye className="h-3.5 w-3.5" /> View Full Profile &amp; KYC
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW MODE 2: FLAT ALL CANDIDATES TABLE */}
                {referralsViewMode === "all-candidates" && (
                  <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-md shadow-slate-100/30 premium-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-700 min-w-[750px]">
                        <thead>
                          <tr className="border-b border-slate-200/80 bg-[#1e2a5a]/5 text-xs text-[#1e2a5a] uppercase font-bold tracking-wider">
                            <th className="py-4 px-6">Referred Candidate</th>
                            <th className="py-4 px-6">Referred By (Referrer)</th>
                            <th className="py-4 px-6">Specialty &amp; Experience</th>
                            <th className="py-4 px-6">KYC Documents</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCandidates.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400">
                                No referred candidate applications found matching your criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredCandidates.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    {c.profilePhoto ? (
                                      <img src={c.profilePhoto} className="h-10 w-10 rounded-xl object-cover border border-slate-200" alt="profile" />
                                    ) : (
                                      <div className="h-10 w-10 rounded-xl bg-[#1e2a5a]/10 border border-[#1e2a5a]/20 flex items-center justify-center text-[#1e2a5a] font-bold text-sm">
                                        {(c?.name || "C").charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-bold text-[#1e2a5a] text-sm">{c?.name || "Candidate"}</div>
                                      <div className="text-xs text-slate-500 font-medium">📞 {c.phone}</div>
                                      <div className="text-[11px] text-slate-400">✉️ {c.email}</div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">Joined: {new Date(c.joinedAt).toLocaleDateString()}</div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 px-6">
                                  <div className="space-y-1">
                                    <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                                      <span>👤 {c.referrerName}</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-[#c9a24c]/15 text-[#8c6b16] border border-[#c9a24c]/30 font-mono tracking-wider">
                                      <Gift className="h-3 w-3 text-[#b08726]" />
                                      CODE: {c.referrerCode}
                                    </span>
                                    {c.referrerPhone !== "N/A" && (
                                      <div className="text-xs text-slate-500">📞 {c.referrerPhone}</div>
                                    )}
                                  </div>
                                </td>

                                <td className="py-4 px-6">
                                  <div className="font-bold text-slate-800">{c.specialty}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{c.experience} years experience</div>
                                  {c.city && <div className="text-xs text-slate-600 mt-1">📍 {c.city}, {c.state}</div>}
                                </td>

                                <td className="py-4 px-6 text-xs">
                                  <div className="space-y-1">
                                    {c.aadhaar ? (
                                      <button
                                        type="button"
                                        onClick={() => openDocViewer(c.aadhaar, "Aadhaar Card Document", c.name, "Referred Caregiver")}
                                        className="text-[#c9a24c] font-bold hover:underline flex items-center gap-1 text-[10px] cursor-pointer"
                                      >
                                        <Eye className="h-2.5 w-2.5" /> Aadhaar Uploaded
                                      </button>
                                    ) : (
                                      <span className="text-slate-400 text-[10px] block">No Aadhaar</span>
                                    )}

                                    {c.pan ? (
                                      <button
                                        type="button"
                                        onClick={() => openDocViewer(c.pan, "PAN Card Document", c.name, "Referred Caregiver")}
                                        className="text-indigo-600 font-bold hover:underline flex items-center gap-1 text-[10px] cursor-pointer"
                                      >
                                        <Eye className="h-2.5 w-2.5" /> PAN Uploaded
                                      </button>
                                    ) : null}

                                    {c.certificates && (
                                      <button
                                        type="button"
                                        onClick={() => openDocViewer(c.certificates, "Educational Cert", c.name, "Referred Caregiver")}
                                        className="text-emerald-600 font-bold hover:underline flex items-center gap-1 text-[10px] cursor-pointer"
                                      >
                                        <Eye className="h-2.5 w-2.5" /> Certifications
                                      </button>
                                    )}
                                  </div>
                                </td>

                                <td className="py-4 px-6">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                    c.status === "Verified" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                    c.status === "Rejected" ? "bg-rose-50 text-rose-800 border-rose-200" :
                                    "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>

                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedCandidateDetail(c)}
                                      className="px-3 py-1.5 rounded-lg bg-[#1e2a5a] text-white hover:bg-[#283875] text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                                    >
                                      <Eye className="h-3.5 w-3.5" /> Full Details
                                    </button>

                                    {c.status !== "Verified" && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCaregiverStatus(c.id, "Verified")}
                                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition-colors cursor-pointer"
                                        title="Approve & Verify"
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </button>
                                    )}

                                    {c.status !== "Rejected" && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCaregiverStatus(c.id, "Rejected")}
                                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition-colors cursor-pointer"
                                        title="Reject"
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
              </>
            )}
          </AdminErrorBoundary>
        </main>
      </div>

      {/* DYNAMIC FORMS EDITING MODALS - LUXURY WIDE & COMPACT REDESIGN */}
      {modalType && modalType !== "notification" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl shadow-indigo-950/40 w-full max-w-5xl xl:max-w-6xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header: Royal Navy Gradient with Gold Accent */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#091438] via-[#112255] to-[#1e2a5a] border-b border-[#c9a24c]/30 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-[#c9a24c]/40 flex items-center justify-center text-lg shadow-inner">
                  {modalType === "caregiver" ? "👩‍⚕️" : modalType === "booking" ? "📅" : modalType === "service" ? "🩺" : modalType === "blog" ? "📰" : modalType === "faq" ? "❓" : "🖼️"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#c9a24c]/20 text-[#f5d77f] border border-[#c9a24c]/40 font-mono">
                      {modalMode === "add" ? "Create New" : "Edit Record"}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-white font-display tracking-wide uppercase">
                      {modalType === "caregiver" ? "Caregiver & Staff Profile" : modalType === "booking" ? "Patient Booking & Shift" : modalType === "service" ? "Healthcare Service Tier" : modalType}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">
                    {modalType === "caregiver" && "Manage staff professional credentials, active verification status & uploaded KYC files"}
                    {modalType === "booking" && "Configure client schedule, caregiver assignment, financial split & patient address"}
                    {modalType === "service" && "Configure service tier, pricing units, detailed offerings & highlights"}
                    {modalType === "blog" && "Publish or edit care guides, health articles & patient resources"}
                    {modalType === "faq" && "Manage customer frequently asked questions & verified answers"}
                    {modalType === "gallery" && "Upload and showcase service moments & media"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalType(null)} 
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer transition-all border border-white/10"
                title="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Scrollable Form Body with Multi-Column Efficiency */}
            <form id="admin-dynamic-form" onSubmit={handleModalSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              {/* Form elements for Booking */}
              {modalType === "booking" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* Left Column: Client & Schedule Info */}
                    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                      <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-[#c9a24c]" /> Customer &amp; Schedule Details
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {bookingIsMtp ? "🚗 MTP Companion Task" : "🩺 Home Healthcare Service"}
                        </span>
                      </div>

                      {/* Customer Name & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Customer Name *</label>
                          <input 
                            type="text" required value={bookingName} onChange={e => setBookingName(sanitizeName(e.target.value))}
                            disabled={isRecordCaretakerPaymentMode}
                            placeholder="Full Name"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 disabled:opacity-70 disabled:bg-slate-100/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Phone Number *</label>
                          <input 
                            type="tel" inputMode="numeric" maxLength={10} required value={bookingPhone} onChange={e => setBookingPhone(sanitizeIndianPhone(e.target.value))}
                            placeholder="10-digit number"
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 font-mono disabled:opacity-70 disabled:bg-slate-100/50"
                          />
                        </div>
                      </div>

                      {/* Optional Patient Details Sub-grid */}
                      <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/70 space-y-2">
                        <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                          <span>Patient / Beneficiary Info (Optional)</span>
                          <span className="text-[9px] text-slate-400">If different from customer</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <input 
                              type="text" 
                              value={bookingPatientName} 
                              onChange={e => setBookingPatientName(sanitizeName(e.target.value))}
                              disabled={isRecordCaretakerPaymentMode}
                              placeholder="Patient Name (e.g. Mother / Father)"
                              className="w-full px-2.5 py-1 border border-slate-200 rounded-lg outline-none text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <input 
                              type="text" 
                              value={bookingPatientAge} 
                              onChange={e => setBookingPatientAge(e.target.value)}
                              disabled={isRecordCaretakerPaymentMode}
                              placeholder="Age (e.g. 72)"
                              className="w-full px-2.5 py-1 border border-slate-200 rounded-lg outline-none text-xs text-slate-800"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Service Type Selection - Comprehensive Categorized Dropdown */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Service Type *</label>
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            User-side parity
                          </span>
                        </div>
                        <select 
                          value={bookingService} 
                          onChange={e => handleServiceChange(e.target.value)}
                          disabled={isRecordCaretakerPaymentMode}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#c9a24c]/40 bg-white text-xs font-bold text-[#1e2a5a] cursor-pointer disabled:opacity-70 disabled:bg-slate-100/50 shadow-2xs"
                        >
                          <option value="" disabled>-- Select a Service --</option>
                          
                          <optgroup label="🩺 Standard Clinical &amp; Home Care Services">
                            {ADMIN_STANDARD_SERVICES.map(s => (
                              <option key={`std-${s.id}`} value={s.title}>
                                {s.title} ({s.price})
                              </option>
                            ))}
                            {services
                              .filter(s => !ADMIN_STANDARD_SERVICES.some(as => as.title.toLowerCase() === s.title.toLowerCase()) && !/mtp|escort|errand|walking|companion|hospital dropping/i.test(s.title))
                              .map(s => (
                                <option key={`db-${s.id}`} value={s.title}>
                                  {s.title} ({s.price})
                                </option>
                              ))}
                          </optgroup>

                          <optgroup label="🚗 Multi Tasking Professional (MTP) Companion &amp; Tasks">
                            {ADMIN_MTP_SERVICES.map(m => (
                              <option key={`mtp-${m.id}`} value={m.title}>
                                {m.title} ({m.price})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* If MTP: Package selector buttons */}
                      {bookingIsMtp ? (
                        <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                              <span>⏱️ MTP Shift Package (Select Hours)</span>
                            </label>
                            <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              Base + 18% IGST
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {getActiveMtpTiers().map((tier: any) => {
                              const isSelected = bookingSelectedMtpTierId === tier.id || bookingDuration.startsWith(`${tier.hours} Hours`);
                              const bPrice = Number(tier.price) || 300;
                              const gPrice = Math.round(bPrice * 0.18);
                              const tPrice = bPrice + gPrice;
                              return (
                                <button
                                  key={tier.id}
                                  type="button"
                                  onClick={() => selectMtpTier(tier)}
                                  disabled={isRecordCaretakerPaymentMode}
                                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                    isSelected 
                                      ? "bg-[#1e2a5a] text-white border-[#1e2a5a] shadow-sm ring-2 ring-[#c9a24c]/40" 
                                      : "bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50/40"
                                  }`}
                                >
                                  <div className={`text-[11px] font-black ${isSelected ? "text-white" : "text-[#1e2a5a]"}`}>
                                    {tier.hours} Hours
                                  </div>
                                  <div className={`text-[10px] font-extrabold ${isSelected ? "text-[#f5d77f]" : "text-amber-800"}`}>
                                    ₹{tPrice.toLocaleString()}
                                  </div>
                                  <div className={`text-[8px] ${isSelected ? "text-slate-200" : "text-slate-400"}`}>
                                    ₹{bPrice} + 18%
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Standard Service: Duration & Count */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Duration Unit</label>
                            <select 
                              value={bookingDuration} 
                              onChange={e => handleDurationChange(e.target.value, bookingDurationCount)}
                              disabled={isRecordCaretakerPaymentMode}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 cursor-pointer disabled:opacity-70 disabled:bg-slate-100/50"
                            >
                              <option value="Daily">Daily shift</option>
                              <option value="Hourly">Hourly visit</option>
                              <option value="Weekly">Weekly log</option>
                              <option value="Monthly">Monthly companion</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                              Duration Quantity ({bookingDuration === "Hourly" ? "Hours" : bookingDuration === "Monthly" ? "Months" : bookingDuration === "Weekly" ? "Weeks" : "Shifts / Days"})
                            </label>
                            <div className="relative">
                              <input 
                                type="number"
                                min="1"
                                value={bookingDurationCount}
                                onChange={e => handleDurationCountChange(e.target.value)}
                                disabled={isRecordCaretakerPaymentMode}
                                placeholder="1"
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 disabled:opacity-70 disabled:bg-slate-100/50"
                              />
                              {bookingDuration === "Daily" && Number(bookingDurationCount) > 0 && (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md pointer-events-none select-none">
                                  {Number(bookingDurationCount) === 1 ? "1 day" : `${bookingDurationCount} days`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Booking Date Range (Start Date to End Date) & Preferred Time */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            Start Date <span className="text-rose-500">*</span>
                          </label>
                          <input 
                            type="date" 
                            required 
                            min={todayStr}
                            max="2099-12-31"
                            value={bookingDate} 
                            onChange={e => {
                              let val = e.target.value;
                              if (val) {
                                const parts = val.split("-");
                                if (parts[0] && parts[0].length > 4) {
                                  parts[0] = parts[0].slice(0, 4);
                                  val = parts.join("-");
                                }
                              }
                              handleStartDateChange(val);
                            }}
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 disabled:opacity-70 disabled:bg-slate-100/50 cursor-pointer"
                          />
                        </div>

                        {!bookingIsMtp && bookingDuration !== "Hourly" ? (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                End Date (Upto) <span className="text-rose-500">*</span>
                              </label>
                              <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                auto-calc
                              </span>
                            </div>
                            <input 
                              type="date" 
                              required 
                              min={bookingDate || todayStr}
                              max="2099-12-31"
                              value={bookingModalEndDate || bookingDate} 
                              onChange={e => {
                                let val = e.target.value;
                                if (val) {
                                  const parts = val.split("-");
                                  if (parts[0] && parts[0].length > 4) {
                                    parts[0] = parts[0].slice(0, 4);
                                    val = parts.join("-");
                                  }
                                }
                                handleEndDateChange(val);
                              }}
                              disabled={isRecordCaretakerPaymentMode}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 disabled:opacity-70 disabled:bg-slate-100/50 cursor-pointer"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-[#c9a24c]" /> Preferred Time *
                              </span>
                              <span className="text-[10px] font-bold text-slate-600">{bookingTime || "09:00 AM"}</span>
                            </label>
                            <input 
                              type="time" 
                              required 
                              value={formatTimeTo24H(bookingTime)} 
                              onChange={e => setBookingTime(formatTimeTo12H(e.target.value))}
                              disabled={isRecordCaretakerPaymentMode}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-bold text-slate-800 disabled:opacity-70 disabled:bg-slate-100/50 cursor-pointer shadow-2xs"
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {["08:00 AM", "09:00 AM", "12:00 PM", "02:00 PM", "08:00 PM"].map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  disabled={isRecordCaretakerPaymentMode}
                                  onClick={() => setBookingTime(t)}
                                  className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all border ${
                                    bookingTime === t 
                                      ? "bg-[#1e2a5a] text-white border-[#1e2a5a]" 
                                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* If Multi-day (Daily/Weekly/Monthly), separate row for Preferred Time */}
                      {!bookingIsMtp && bookingDuration !== "Hourly" && (
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#c9a24c]" /> Preferred Shift Start Time *
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">{bookingTime || "09:00 AM"}</span>
                          </label>
                          <input 
                            type="time" 
                            required 
                            value={formatTimeTo24H(bookingTime)} 
                            onChange={e => setBookingTime(formatTimeTo12H(e.target.value))}
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-bold text-slate-800 disabled:opacity-70 disabled:bg-slate-100/50 cursor-pointer shadow-2xs"
                          />
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {["08:00 AM", "09:00 AM", "12:00 PM", "02:00 PM", "08:00 PM"].map(t => (
                              <button
                                key={t}
                                type="button"
                                disabled={isRecordCaretakerPaymentMode}
                                onClick={() => setBookingTime(t)}
                                className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all border ${
                                  bookingTime === t 
                                    ? "bg-[#1e2a5a] text-white border-[#1e2a5a]" 
                                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Live Date-to-Date & Calculation Summary ("Edi, Enduku, Ela, Enni Days") */}
                      <div className="bg-gradient-to-r from-amber-50/70 via-indigo-50/40 to-emerald-50/60 rounded-xl p-3 border border-amber-200/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1e2a5a] flex items-center gap-1.5">
                            <span>📅 Schedule &amp; Duration Breakdown</span>
                          </span>
                          <span className="text-[10px] font-black text-[#1e2a5a] bg-white/90 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
                            {bookingIsMtp ? (
                              <span>{bookingDuration}</span>
                            ) : (
                              <span>
                                {bookingDuration === "Daily" 
                                  ? `${Number(bookingDurationCount) || 1} ${(Number(bookingDurationCount) || 1) === 1 ? "Day" : "Days"} (${Number(bookingDurationCount) || 1} Shifts)` 
                                  : bookingDuration === "Weekly" 
                                  ? `${Number(bookingDurationCount) || 1} ${(Number(bookingDurationCount) || 1) === 1 ? "Week" : "Weeks"} (${(Number(bookingDurationCount) || 1) * 7} Days)` 
                                  : bookingDuration === "Monthly" 
                                  ? `${Number(bookingDurationCount) || 1} ${(Number(bookingDurationCount) || 1) === 1 ? "Month" : "Months"} (~${(Number(bookingDurationCount) || 1) * 30} Days)` 
                                  : `${Number(bookingDurationCount) || 1} ${(Number(bookingDurationCount) || 1) === 1 ? "Hour" : "Hours"}`
                                }
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-200/50">
                          <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">From (Start Date)</span>
                            <span className="font-extrabold text-slate-800">
                              {bookingDate || todayStr}
                            </span>
                          </div>
                          <div className="bg-white/80 p-2 rounded-lg border border-slate-200/60">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">
                              {bookingDuration === "Hourly" || bookingIsMtp ? "Same Day" : "To (End Date)"}
                            </span>
                            <span className="font-extrabold text-slate-800">
                              {bookingDuration === "Hourly" || bookingIsMtp ? (bookingDate || todayStr) : (bookingModalEndDate || bookingDate || todayStr)}
                            </span>
                          </div>
                        </div>

                        {!bookingIsMtp && (
                          <div className="text-[10px] bg-white/90 p-2 rounded-lg border border-slate-200/80 font-medium text-slate-700 flex flex-col gap-0.5">
                            <div className="flex items-center justify-between text-slate-500 font-semibold text-[9px] uppercase">
                              <span>Service Rate Basis</span>
                              <span>Formula (Rate × Units)</span>
                            </div>
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>
                                {bookingDuration === "Hourly" ? `₹${getStandardServiceRates(bookingService).hourly} / hr` :
                                 bookingDuration === "Weekly" ? `₹${getStandardServiceRates(bookingService).weekly} / wk` :
                                 bookingDuration === "Monthly" ? `₹${getStandardServiceRates(bookingService).monthly} / mo` :
                                 `₹${getStandardServiceRates(bookingService).daily} / day`}
                              </span>
                              <span className="text-[#1e2a5a]">
                                {bookingDurationCount || 1} {bookingDuration === "Hourly" ? "hrs" : bookingDuration === "Weekly" ? "wks" : bookingDuration === "Monthly" ? "mos" : "days"} × ₹{
                                  bookingDuration === "Hourly" ? getStandardServiceRates(bookingService).hourly :
                                  bookingDuration === "Weekly" ? getStandardServiceRates(bookingService).weekly :
                                  bookingDuration === "Monthly" ? getStandardServiceRates(bookingService).monthly :
                                  getStandardServiceRates(bookingService).daily
                                } = ₹{bookingBaseAmount || "0"} Base
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                              <span>+ 18% IGST: ₹{bookingGstAmount || "0"}</span>
                              <span className="font-extrabold text-emerald-700">Total: ₹{bookingAmount || "0"}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Patient Location Address */}
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Patient Location Address *</label>
                        <textarea 
                          required rows={2} value={bookingAddress} onChange={e => setBookingAddress(e.target.value)}
                          disabled={isRecordCaretakerPaymentMode}
                          placeholder="Complete door address, flat/plot, landmark, city..."
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800 resize-none disabled:opacity-70 disabled:bg-slate-100/50"
                        />
                      </div>

                      {/* Care Needs / Special Instructions */}
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Special Needs / Instructions (Optional)</label>
                        <input 
                          type="text" 
                          value={bookingPatientNeeds} 
                          onChange={e => setBookingPatientNeeds(e.target.value)}
                          disabled={isRecordCaretakerPaymentMode}
                          placeholder="e.g. Post-stroke bed care, wheelchair escort, diabetic diet..."
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800 disabled:opacity-70 disabled:bg-slate-100/50"
                        />
                      </div>
                    </div>

                    {/* Right Column: Financials, 18% GST Breakdown, Caregiver Payout & Assignments */}
                    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                      <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-[#c9a24c]" /> Payout &amp; Financial Breakdown
                        </span>
                        <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          18% IGST Compliant
                        </span>
                      </div>

                      {/* MTP Radar Notice if MTP */}
                      {bookingIsMtp && (
                        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2 shadow-2xs">
                          <span className="text-sm">⚡</span>
                          <div className="text-[10px] text-amber-900 leading-snug">
                            <strong className="font-extrabold">On-Demand MTP Gig Radar Active:</strong> Admin manual assignment is not required for MTP services. Approved MTP companions receive task notifications and accept directly from their dashboard (Rapido model). Once accepted, it is atomically locked and assigned.
                          </div>
                        </div>
                      )}

                      {/* Prominent Financial Breakdown & 18% GST Calculation Box */}
                      <div className="bg-gradient-to-br from-[#0a1538] via-[#102256] to-[#1e2a5a] text-white p-3.5 rounded-2xl border border-slate-700/60 shadow-md space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#f5d77f] flex items-center gap-1.5">
                              🧾 Pricing &amp; GST Calculation (18% IGST)
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-300">
                            Auto-Synchronized
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                              Base Shift Fee (₹)
                            </label>
                            <input 
                              type="number"
                              value={bookingBaseAmount}
                              onChange={e => handleBaseAmountChange(e.target.value)}
                              disabled={isRecordCaretakerPaymentMode}
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-bold outline-none focus:ring-1 focus:ring-[#f5d77f] focus:bg-white/15"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-amber-300 mb-1">
                              + GST (18% IGST) (₹)
                            </label>
                            <input 
                              type="number"
                              value={bookingGstAmount}
                              onChange={e => handleGstAmountChange(e.target.value)}
                              disabled={isRecordCaretakerPaymentMode}
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 bg-amber-500/10 border border-amber-400/30 rounded-xl text-amber-200 text-xs font-bold outline-none focus:ring-1 focus:ring-amber-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold uppercase tracking-wider text-[#f5d77f] mb-1">
                              Total Fee (₹) *
                            </label>
                            <input 
                              type="number"
                              required
                              value={bookingAmount}
                              onChange={e => handleTotalAmountChange(e.target.value)}
                              disabled={isRecordCaretakerPaymentMode}
                              placeholder="0"
                              className="w-full px-2.5 py-1.5 bg-[#f5d77f]/20 border border-[#f5d77f]/50 rounded-xl text-white text-xs font-black outline-none focus:ring-1 focus:ring-[#f5d77f]"
                            />
                          </div>
                        </div>

                        {/* Visual equation pill */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-wrap items-center justify-between text-[11px] font-medium text-slate-200 gap-2">
                          <div className="flex items-center gap-1.5">
                            <span>₹{(Number(bookingBaseAmount) || 0).toLocaleString()} Base</span>
                            <span className="text-amber-300 font-bold">+</span>
                            <span className="text-amber-200 font-bold">₹{(Number(bookingGstAmount) || 0).toLocaleString()} (18% IGST)</span>
                            <span className="text-emerald-400 font-bold">=</span>
                          </div>
                          <div className="font-extrabold text-sm text-[#f5d77f]">
                            ₹{(Number(bookingAmount) || 0).toLocaleString()} Total Shift Fee
                          </div>
                        </div>
                      </div>

                      {/* Advance Paid vs Balance Due Configuration */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                              ✓ Advance Paid Amount (₹)
                            </label>
                            <span className="text-[9px] font-bold text-slate-400">
                              {Number(bookingAmount) > 0 && Number(bookingAdvancePaid) > 0 ? `${Math.round((Number(bookingAdvancePaid) / Number(bookingAmount)) * 100)}%` : ""}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={bookingAdvancePaid}
                            onChange={e => handleAdvancePaidChange(e.target.value)}
                            placeholder="0"
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-emerald-300 rounded-xl outline-none bg-emerald-50/30 text-xs font-black text-emerald-950 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                              ⏳ Remaining Balance Due (₹)
                            </label>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                              Number(bookingBalanceAmount) > 0 ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                            }`}>
                              {Number(bookingBalanceAmount) > 0 ? "Pending" : "Settled"}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={bookingBalanceAmount}
                            onChange={e => handleBalanceAmountChange(e.target.value)}
                            placeholder="0"
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-amber-300 rounded-xl outline-none bg-amber-50/30 text-xs font-black text-amber-950 focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Booking Status & Assignments */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Booking Status</label>
                          <select 
                            value={bookingStatus} onChange={e => setBookingStatus(e.target.value)}
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none bg-white text-xs font-semibold text-slate-800 cursor-pointer disabled:opacity-70"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                            {bookingIsMtp ? "🚗 MTP Companion / Staff" : "Assign Nurse / Staff"}
                          </label>
                          <div className="space-y-1.5">
                            {bookingIsMtp && (
                              bookingAssignedStaff || bookingMtpAcceptedBy ? (
                                <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-2 space-y-1 shadow-2xs">
                                  <div className="flex items-center justify-between">
                                    <div className="text-[10px] font-extrabold text-emerald-950 flex items-center gap-1.5 truncate">
                                      <span>🚗 Locked:</span>
                                      <strong className="truncate">{bookingAssignedStaff || bookingMtpAcceptedBy}</strong>
                                    </div>
                                    {selectedId && (
                                      <button
                                        type="button"
                                        onClick={() => handleReleaseMTPGig(selectedId)}
                                        disabled={isReleasingGig}
                                        className="py-0.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-extrabold cursor-pointer shrink-0"
                                      >
                                        {isReleasingGig ? "..." : "🔄 Release"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-1.5 flex items-center justify-between shadow-2xs">
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-900">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    Broadcasting on Radar
                                  </div>
                                  {selectedId && (
                                    <button
                                      type="button"
                                      onClick={() => handleRebroadcastMTPGig(selectedId)}
                                      disabled={isRebroadcasting}
                                      className="py-0.5 px-2 rounded-lg bg-white hover:bg-amber-100/70 text-amber-800 border border-amber-300 text-[9px] font-extrabold cursor-pointer shrink-0"
                                    >
                                      {isRebroadcasting ? "..." : "📢 Alert"}
                                    </button>
                                  )}
                                </div>
                              )
                            )}

                            <select 
                              value={
                                bookingAssignedStaffId && bookingAssignedStaffRole
                                  ? `${bookingAssignedStaffRole}:${bookingAssignedStaffId}`
                                  : (bookingAssignedStaff || "")
                              }
                              onChange={e => {
                                const val = e.target.value;
                                if (!val) {
                                  setBookingAssignedStaff("");
                                  setBookingAssignedStaffId(null);
                                  setBookingAssignedStaffRole(null);
                                  setBookingAssignedStaffPhone(null);
                                  setBookingMtpAcceptedBy(null);
                                  setBookingMtpAcceptedById(null);
                                  setBookingMtpAcceptedPhone(null);
                                  return;
                                }
                                if (val.startsWith("caregiver:")) {
                                  const id = Number(val.split(":")[1]);
                                  const cg = caregivers.find(c => c.id === id);
                                  if (cg) {
                                    setBookingAssignedStaff(cg.name);
                                    setBookingAssignedStaffId(cg.id);
                                    setBookingAssignedStaffRole("caregiver");
                                    setBookingAssignedStaffPhone(cg.phone);
                                  }
                                } else if (val.startsWith("mtp:")) {
                                  const id = Number(val.split(":")[1]);
                                  const m = mtps.find(item => item.id === id);
                                  if (m) {
                                    setBookingAssignedStaff(m.name);
                                    setBookingAssignedStaffId(m.id);
                                    setBookingAssignedStaffRole("mtp");
                                    setBookingAssignedStaffPhone(m.phone);
                                    setBookingMtpAcceptedBy(m.name);
                                    setBookingMtpAcceptedById(m.id);
                                    setBookingMtpAcceptedPhone(m.phone);
                                    if (!bookingMtpAcceptedAt) {
                                      setBookingMtpAcceptedAt(new Date().toLocaleString("en-IN"));
                                    }
                                  }
                                } else {
                                  setBookingAssignedStaff(val);
                                  const cg = caregivers.find(c => (c?.name || "").toLowerCase() === val.toLowerCase());
                                  if (cg) {
                                    setBookingAssignedStaffId(cg.id);
                                    setBookingAssignedStaffRole("caregiver");
                                    setBookingAssignedStaffPhone(cg.phone);
                                  } else {
                                    const m = mtps.find(item => (item?.name || "").toLowerCase() === val.toLowerCase());
                                    if (m) {
                                      setBookingAssignedStaffId(m.id);
                                      setBookingAssignedStaffRole("mtp");
                                      setBookingAssignedStaffPhone(m.phone);
                                      setBookingMtpAcceptedBy(m.name);
                                      setBookingMtpAcceptedById(m.id);
                                      setBookingMtpAcceptedPhone(m.phone);
                                    } else {
                                      setBookingAssignedStaffId(null);
                                      setBookingAssignedStaffRole(null);
                                      setBookingAssignedStaffPhone(null);
                                    }
                                  }
                                }
                              }}
                              disabled={isRecordCaretakerPaymentMode}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none bg-white text-xs font-semibold text-slate-800 cursor-pointer disabled:opacity-70 shadow-2xs"
                            >
                              <option value="">-- Unassigned (Pending Allocation) --</option>
                              {bookingAssignedStaff && 
                                !caregivers.some(c => c.id === bookingAssignedStaffId || c.name === bookingAssignedStaff) && 
                                !mtps.some(m => m.id === bookingAssignedStaffId || m.name === bookingAssignedStaff) && (
                                  <option value={bookingAssignedStaff}>Current: {bookingAssignedStaff}</option>
                                )}
                              {caregivers.filter(c => (c.status || "").toLowerCase() === "verified" || (c.status || "").toLowerCase() === "active").length > 0 && (
                                <optgroup label="🩺 Verified Caregivers &amp; Nurses">
                                  {caregivers
                                    .filter(c => (c.status || "").toLowerCase() === "verified" || (c.status || "").toLowerCase() === "active")
                                    .map(c => (
                                      <option key={`cg-${c.id}`} value={`caregiver:${c.id}`}>
                                        🩺 {c.name} — [{getCaregiverReferralCode(c)}] ({c.specialty || "Caregiver"})
                                      </option>
                                    ))}
                                </optgroup>
                              )}
                              {mtps.filter(m => {
                                const st = (m?.status || "").toLowerCase();
                                return st === "verified" || st === "approved" || st === "active";
                              }).length > 0 && (
                                <optgroup label="🚗 Verified Multi Tasking Professionals (MTP)">
                                  {mtps
                                    .filter(m => {
                                      const st = (m?.status || "").toLowerCase();
                                      return st === "verified" || st === "approved" || st === "active";
                                    })
                                    .map(m => (
                                      <option key={`mtp-${m.id}`} value={`mtp:${m.id}`}>
                                        🚗 {m.name} — [{m.employeeId || getCaregiverReferralCode(m)}] ({m.locality || m.roles || "MTP Companion"})
                                      </option>
                                    ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Client Payment</label>
                          <select 
                            value={bookingPaymentStatus} onChange={e => handleBookingPaymentStatusChange(e.target.value)}
                            disabled={isRecordCaretakerPaymentMode}
                            className={`w-full px-3 py-1.5 border rounded-xl outline-none text-xs font-extrabold cursor-pointer ${
                              bookingPaymentStatus === "Paid" ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
                              bookingPaymentStatus === "Advance Paid" ? "bg-indigo-50 text-indigo-800 border-indigo-300" :
                              bookingPaymentStatus === "Pay on Service" ? "bg-amber-50 text-amber-900 border-amber-300" :
                              "bg-slate-50 text-slate-700 border-slate-300"
                            }`}
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Advance Paid">Advance Paid</option>
                            <option value="Pay on Service">Pay on Service</option>
                            <option value="Paid">Paid (Full)</option>
                          </select>
                        </div>
                      </div>

                      {/* Customer Online Due Payment Link (When Editing) */}
                      {selectedId && (
                        <div className={`p-3 rounded-2xl space-y-2 border ${
                          Number(bookingBalanceAmount) <= 0 || bookingPaymentStatus === "Paid"
                            ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200/90"
                            : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/90"
                        }`}>
                          <div className="flex items-center justify-between">
                            <label className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                              Number(bookingBalanceAmount) <= 0 || bookingPaymentStatus === "Paid" ? "text-emerald-900" : "text-amber-900"
                            }`}>
                              <CreditCard className={`w-3.5 h-3.5 ${Number(bookingBalanceAmount) <= 0 || bookingPaymentStatus === "Paid" ? "text-emerald-700" : "text-amber-700"}`} />
                              {Number(bookingBalanceAmount) <= 0 || bookingPaymentStatus === "Paid" ? "Payment Cleared & Settled in Full" : "Customer Online Due Payment Link"}
                            </label>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                              Number(bookingBalanceAmount) > 0 && bookingPaymentStatus !== "Paid"
                                ? "bg-amber-100 text-amber-900 border border-amber-300" 
                                : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            }`}>
                              {Number(bookingBalanceAmount) > 0 && bookingPaymentStatus !== "Paid" ? `Due: ₹${Number(bookingBalanceAmount).toLocaleString("en-IN")}` : "✓ Fully Paid (₹0 Due)"}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                            <input
                              type="text"
                              readOnly
                              value={`${typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in"}/pay-balance?id=${selectedId}`}
                              className="flex-1 min-w-[200px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 select-all"
                            />
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyBookingPayLink(selectedId)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                                  copiedBookingLinkId === selectedId
                                    ? "bg-emerald-600 text-white"
                                    : Number(bookingBalanceAmount) <= 0 || bookingPaymentStatus === "Paid"
                                      ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                                      : "bg-amber-600 hover:bg-amber-700 text-white"
                                }`}
                                title={Number(bookingBalanceAmount) <= 0 || bookingPaymentStatus === "Paid" ? "Copy Receipt Link" : "Copy Payment Link"}
                              >
                                {copiedBookingLinkId === selectedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedBookingLinkId === selectedId ? "Copied!" : "Copy Link"}</span>
                              </button>
                              <a
                                href={`/pay-balance?id=${selectedId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                                title="Open in New Tab"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                              </a>
                              {Number(bookingBalanceAmount) > 0 && bookingPaymentStatus !== "Paid" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenWhatsAppPayModal({
                                    id: selectedId,
                                    name: bookingName,
                                    phone: bookingPhone,
                                    service: bookingService,
                                    date: (!bookingIsMtp && bookingDuration !== "Hourly" && bookingModalEndDate && bookingModalEndDate !== bookingDate) ? `${bookingDate} to ${bookingModalEndDate}` : bookingDate,
                                    time: bookingTime,
                                    amount: bookingAmount,
                                    advancePaid: bookingAdvancePaid,
                                    balanceAmount: bookingBalanceAmount
                                  })}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                  title="Send Link via WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Caretaker Payout Box */}
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-wider text-[#1e2a5a]">Caretaker Payout Configuration</label>
                          <div className="text-[10px] font-bold text-slate-500">
                            Client Total: <span className="font-extrabold text-[#1e2a5a]">₹{(Number(bookingAmount) || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPayoutCalcMode("percentage");
                                const amt = Number(bookingAmount) || 0;
                                const pct = Number(payoutPercentValue) || 85;
                                setBookingCaretakerPayout(Math.round(amt * (pct / 100)).toString());
                              }}
                              className={`flex-1 py-1 px-2 rounded-lg border text-[10px] font-extrabold transition-all cursor-pointer ${
                                payoutCalcMode === "percentage"
                                  ? "bg-[#1e2a5a] text-white border-[#1e2a5a]"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              % Split
                            </button>
                            <button
                              type="button"
                              onClick={() => setPayoutCalcMode("fixed")}
                              className={`flex-1 py-1 px-2 rounded-lg border text-[10px] font-extrabold transition-all cursor-pointer ${
                                payoutCalcMode === "fixed"
                                  ? "bg-[#1e2a5a] text-white border-[#1e2a5a]"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              Flat ₹
                            </button>
                          </div>

                          {payoutCalcMode === "percentage" ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={payoutPercentValue}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPayoutPercentValue(val);
                                  const amt = Number(bookingAmount) || 0;
                                  const pct = Number(val) || 0;
                                  setBookingCaretakerPayout(Math.round(amt * (pct / 100)).toString());
                                }}
                                className="w-16 px-2 py-1 border border-slate-200 rounded-lg outline-none text-xs font-bold text-slate-800"
                                min="0"
                                max="100"
                              />
                              <span className="text-[10px] text-slate-500 font-bold">% of client fee</span>
                            </div>
                          ) : (
                            <input
                              type="number"
                              value={bookingCaretakerPayout}
                              onChange={(e) => setBookingCaretakerPayout(e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded-lg outline-none text-xs font-bold text-[#1e2a5a]"
                              placeholder="Flat payout ₹"
                            />
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                          <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100/80">
                            <span className="text-[9px] font-bold text-amber-800 uppercase block">Caretaker Net</span>
                            <span className="font-black text-[#c9a24c] text-xs">₹{(Number(bookingCaretakerPayout) || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-500 uppercase block">Amma Seva Margin</span>
                            <span className="font-bold text-slate-700 text-xs">₹{Math.max(0, (Number(bookingAmount) || 0) - (Number(bookingCaretakerPayout) || 0)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Caretaker Payout Status</label>
                          <select 
                            value={bookingCaretakerPayoutStatus} onChange={e => setBookingCaretakerPayoutStatus(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none bg-white text-xs font-bold text-slate-700 cursor-pointer"
                          >
                            <option value="Unpaid">Unpaid / Pending</option>
                            <option value="Paid">Paid / Settled</option>
                          </select>
                        </div>
                        {bookingCaretakerPayoutStatus === "Paid" && (
                          <div>
                            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#c9a24c] mb-1">Payout Ref / Method</label>
                            <input 
                              type="text" placeholder="UPI Ref / Txn ID" value={bookingCaretakerPayoutRef} onChange={e => setBookingCaretakerPayoutRef(e.target.value)}
                              className="w-full px-3 py-1.5 border border-[#c9a24c]/40 rounded-xl outline-none bg-white text-xs font-bold text-slate-900"
                            />
                          </div>
                        )}
                      </div>

                      {/* Customer Payment Details if Paid */}
                      {bookingPaymentStatus === "Paid" && (
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-emerald-800 mb-0.5">Method</label>
                            <select 
                              value={bookingPaymentMethod} onChange={e => setBookingPaymentMethod(e.target.value)}
                              disabled={isRecordCaretakerPaymentMode}
                              className="w-full px-2 py-1 border border-emerald-200 rounded-lg outline-none bg-white text-[11px] text-emerald-950 cursor-pointer"
                            >
                              <option value="UPI">UPI / GPay</option>
                              <option value="Cash">Cash</option>
                              <option value="Bank Transfer">Bank Transfer</option>
                              <option value="Card">Card</option>
                              <option value="Razorpay">Razorpay</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-emerald-800 mb-0.5">Txn ID</label>
                            <input 
                              type="text" value={bookingTransactionId} onChange={e => setBookingTransactionId(e.target.value)}
                              placeholder="TXN..."
                              disabled={isRecordCaretakerPaymentMode}
                              className="w-full px-2 py-1 border border-emerald-200 rounded-lg outline-none bg-white text-[11px] text-emerald-950 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase text-emerald-800 mb-0.5">Date</label>
                            <input 
                              type="date" value={bookingPaymentDate} onChange={e => setBookingPaymentDate(e.target.value)}
                              disabled={isRecordCaretakerPaymentMode}
                              className="w-full px-2 py-1 border border-emerald-200 rounded-lg outline-none bg-white text-[11px] text-emerald-950"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Caregiver Form - 2 Column Side-by-Side Sections + Verification Documents Hub */}
              {modalType === "caregiver" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* Left Column: Personal & Professional Profile */}
                    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                      <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-[#c9a24c]" /> Basic &amp; Professional Info</span>
                        <span className="text-[10px] font-mono font-bold text-[#b08726] bg-[#c9a24c]/15 px-2 py-0.5 rounded border border-[#c9a24c]/30 flex items-center gap-1">
                          <Gift className="h-3 w-3 text-[#c9a24c]" />
                          REF: {getCaregiverReferralCode({ name: caregiverName, phone: caregiverPhone })}
                        </span>
                      </div>

                      {/* Live Referral Code Summary Card */}
                      <div className="bg-gradient-to-r from-[#1e2a5a]/5 to-[#c9a24c]/10 border border-[#c9a24c]/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            Staff Referral &amp; Unique ID
                          </div>
                          <div className="text-xs font-black text-[#1e2a5a] font-mono mt-0.5 tracking-wider">
                            {getCaregiverReferralCode({ name: caregiverName, phone: caregiverPhone })}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const code = getCaregiverReferralCode({ name: caregiverName, phone: caregiverPhone });
                              const link = `${window.location.origin}/login?ref=${code}&type=caretaker`;
                              navigator.clipboard.writeText(link);
                              alert(`Copied Referral Link:\n${link}`);
                            }}
                            className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Share2 className="h-3 w-3 text-indigo-600" />
                            Copy Link
                          </button>
                          <span className="text-[9px] font-bold text-slate-500 bg-white/80 px-2 py-1 rounded-lg border border-slate-200 font-mono hidden sm:inline-block">
                            Auto (First Name + Last 4)
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Staff Name *</label>
                          <input 
                            type="text" required value={caregiverName} onChange={e => setCaregiverName(sanitizeName(e.target.value))}
                            placeholder="Full Name"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Phone Number *</label>
                          <input 
                            type="tel" inputMode="numeric" maxLength={10} required value={caregiverPhone} onChange={e => setCaregiverPhone(sanitizeIndianPhone(e.target.value))}
                            placeholder="10-digit phone"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] bg-white text-xs font-semibold text-slate-800 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Email Address *</label>
                          <input 
                            type="email" required value={caregiverEmail} onChange={e => setCaregiverEmail(e.target.value)}
                            placeholder="staff@ammaseva.in"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Experience (Years) *</label>
                          <input 
                            type="number" required value={caregiverExperience} onChange={e => setCaregiverExperience(e.target.value)}
                            placeholder="e.g. 3"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Specialty Domain</label>
                          <select 
                            value={caregiverSpecialty} onChange={e => setCaregiverSpecialty(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="Elderly Care">Elderly Care</option>
                            <option value="Mother & Baby Care">Mother & Baby Care</option>
                            <option value="Home Nursing Services">Home Nursing</option>
                            <option value="ICU/Home Recovery Support">ICU Support</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Verification Status</label>
                          <select 
                            value={caregiverStatus} onChange={e => setCaregiverStatus(e.target.value)}
                            className={`w-full px-3 py-1.5 border rounded-xl outline-none text-xs font-extrabold cursor-pointer ${
                              caregiverStatus === "Verified" ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
                              caregiverStatus === "Rejected" ? "bg-rose-50 text-rose-800 border-rose-300" :
                              "bg-amber-50 text-amber-800 border-amber-300"
                            }`}
                          >
                            <option value="Pending">🟡 Pending Verification</option>
                            <option value="Verified">🟢 Verified &amp; Active</option>
                            <option value="Rejected">🔴 Rejected</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Experience Details / Skills Summary</label>
                        <textarea 
                          value={caregiverExperienceDetails} onChange={e => setCaregiverExperienceDetails(e.target.value)}
                          rows={2}
                          placeholder="List previous hospital or home nursing postings and special competencies..."
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                          <span>Referred By (Partner / Staff Referral Code)</span>
                          <span className="text-[9px] text-slate-400 font-normal">Optional</span>
                        </label>
                        <input 
                          type="text" 
                          value={caregiverReferredBy} 
                          onChange={e => setCaregiverReferredBy(e.target.value.toUpperCase())}
                          placeholder="e.g. PRIYA3210 (Leave blank if direct)"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-mono font-bold text-slate-800 uppercase"
                        />
                      </div>
                    </div>

                    {/* Right Column: Location, Address & Timings */}
                    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                      <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                        <MapPin className="h-3.5 w-3.5 text-[#c9a24c]" /> Address, Location &amp; Timings
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">State</label>
                          <select 
                            value={caregiverState} onChange={e => setCaregiverState(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">City / Town</label>
                          <input 
                            type="text" value={caregiverCity} onChange={e => setCaregiverCity(e.target.value)}
                            placeholder="e.g. Hyderabad"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1 flex justify-between items-center">
                          <span>Google Maps Live Location URL</span>
                          {caregiverGoogleMapLocation && (
                            <a 
                              href={caregiverGoogleMapLocation} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" /> Test Map Link
                            </a>
                          )}
                        </label>
                        <input 
                          type="text" value={caregiverGoogleMapLocation} onChange={e => setCaregiverGoogleMapLocation(e.target.value)}
                          placeholder="https://maps.google.com/..."
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-mono text-slate-700"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Preferred Localities</label>
                          <input 
                            type="text" value={caregiverWorkingLocations} onChange={e => setCaregiverWorkingLocations(e.target.value)}
                            placeholder="e.g. Madhapur, Gachibowli"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Available Shift Timings</label>
                          <input 
                            type="text" value={caregiverAvailableTimings} onChange={e => setCaregiverAvailableTimings(e.target.value)}
                            placeholder="e.g. 24-hr Live-in / 12-hr Day"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Uploaded KYC Verification Documents Grid */}
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-[#c9a24c]" /> Verification Documents &amp; Certificates
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Click &ldquo;View&rdquo; to review full documents on screen with zero forced download
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-1">
                      {/* Profile Photo */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 flex flex-col justify-between items-center text-center gap-1.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500">Profile Photo</span>
                        {caregiverProfilePhoto ? (
                          <div className="space-y-1 w-full flex flex-col items-center">
                            <img src={caregiverProfilePhoto} className="h-10 w-10 rounded-lg object-cover border border-slate-200 shadow-2xs" alt="Profile" />
                            <button
                              type="button"
                              onClick={() => openDocViewer(caregiverProfilePhoto, "Profile Photo", caregiverName, "Staff Profile")}
                              className="px-2 py-0.5 rounded-md bg-gold/10 hover:bg-gold/20 text-slate-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="h-2.5 w-2.5 text-[#c9a24c]" /> View
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic py-2">Not uploaded</span>
                        )}
                      </div>

                      {/* Aadhaar */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 flex flex-col justify-between items-center text-center gap-1.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500">Aadhaar Card</span>
                        {caregiverAadhaar ? (
                          <div className="space-y-1 w-full flex flex-col items-center">
                            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Attached</span>
                            <button
                              type="button"
                              onClick={() => openDocViewer(caregiverAadhaar, "Aadhaar Card", caregiverName, "Identity Verification")}
                              className="px-2 py-0.5 rounded-md bg-gold/10 hover:bg-gold/20 text-slate-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="h-2.5 w-2.5 text-[#c9a24c]" /> View
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic py-2">Not uploaded</span>
                        )}
                      </div>

                      {/* PAN Card */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 flex flex-col justify-between items-center text-center gap-1.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500">PAN Card</span>
                        {caregiverPan ? (
                          <div className="space-y-1 w-full flex flex-col items-center">
                            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Attached</span>
                            <button
                              type="button"
                              onClick={() => openDocViewer(caregiverPan, "PAN Card Document", caregiverName, "Identity Verification")}
                              className="px-2 py-0.5 rounded-md bg-gold/10 hover:bg-gold/20 text-slate-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="h-2.5 w-2.5 text-[#c9a24c]" /> View
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic py-2">Not uploaded</span>
                        )}
                      </div>

                      {/* Education / Nursing Certs */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 flex flex-col justify-between items-center text-center gap-1.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500">Nursing / Degree</span>
                        {caregiverCertificates ? (
                          <div className="space-y-1 w-full flex flex-col items-center">
                            <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Attached</span>
                            <button
                              type="button"
                              onClick={() => openDocViewer(caregiverCertificates, "Educational Degree / Diploma", caregiverName, "Qualification Verification")}
                              className="px-2 py-0.5 rounded-md bg-gold/10 hover:bg-gold/20 text-slate-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="h-2.5 w-2.5 text-[#c9a24c]" /> View
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic py-2">Not uploaded</span>
                        )}
                      </div>

                      {/* Experience Cert */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 flex flex-col justify-between items-center text-center gap-1.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500">Exp Certificate</span>
                        {caregiverExperienceCertificate ? (
                          <div className="space-y-1 w-full flex flex-col items-center">
                            <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Attached</span>
                            <button
                              type="button"
                              onClick={() => openDocViewer(caregiverExperienceCertificate, "Experience Certificate", caregiverName, "Work Verification")}
                              className="px-2 py-0.5 rounded-md bg-gold/10 hover:bg-gold/20 text-slate-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="h-2.5 w-2.5 text-[#c9a24c]" /> View
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic py-2">Not uploaded</span>
                        )}
                      </div>

                      {/* Police Verification */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 flex flex-col justify-between items-center text-center gap-1.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500">Police Check</span>
                        {caregiverPoliceVerification ? (
                          <div className="space-y-1 w-full flex flex-col items-center">
                            <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Attached</span>
                            <button
                              type="button"
                              onClick={() => openDocViewer(caregiverPoliceVerification, "Police Verification Document", caregiverName, "Background Security Check")}
                              className="px-2 py-0.5 rounded-md bg-gold/10 hover:bg-gold/20 text-slate-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="h-2.5 w-2.5 text-[#c9a24c]" /> View
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic py-2">Not uploaded</span>
                        )}
                      </div>

                      {/* Additional Certs */}
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 flex flex-col justify-between items-center text-center gap-1.5 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-500">Extra / BLS Cert</span>
                        {caregiverAdditionalCertificates ? (
                          <div className="space-y-1 w-full flex flex-col items-center">
                            <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Attached</span>
                            <button
                              type="button"
                              onClick={() => openDocViewer(caregiverAdditionalCertificates, "Additional Certificates", caregiverName, "Certifications")}
                              className="px-2 py-0.5 rounded-md bg-gold/10 hover:bg-gold/20 text-slate-800 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Eye className="h-2.5 w-2.5 text-[#c9a24c]" /> View
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic py-2">Not uploaded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form elements for Service */}
              {modalType === "service" && (
                <div className="space-y-4">
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                      <Briefcase className="h-3.5 w-3.5 text-[#c9a24c]" /> Service Configuration &amp; Pricing
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Service Title *</label>
                        <input 
                          type="text" required value={serviceTitle} onChange={e => setServiceTitle(e.target.value)}
                          placeholder="e.g. Newborn Care shift"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Category Badge Tag</label>
                        <input 
                          type="text" required value={serviceCategory} onChange={e => setServiceCategory(e.target.value)}
                          placeholder="e.g. Intensive, Specialized"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Pricing (₹) &amp; Unit</label>
                        <div className="flex gap-1.5">
                          <input 
                            type="number" required value={servicePriceVal} onChange={e => setServicePriceVal(e.target.value)}
                            placeholder="1200"
                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                          />
                          <select 
                            value={servicePriceUnit} onChange={e => setServicePriceUnit(e.target.value)}
                            className="w-20 px-2 py-1.5 border border-slate-200 rounded-xl outline-none bg-white text-xs font-semibold text-slate-800 cursor-pointer"
                          >
                            <option value="hour">/ hr</option>
                            <option value="day">/ day</option>
                            <option value="week">/ wk</option>
                            <option value="month">/ mo</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Advance Booking (₹)</label>
                        <input 
                          type="number" required value={serviceAdvanceVal} onChange={e => setServiceAdvanceVal(e.target.value)}
                          placeholder="300"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Duration Options</label>
                        <input 
                          type="text" required value={serviceDuration} onChange={e => setServiceDuration(e.target.value)}
                          placeholder="e.g. Hourly, Daily, or Live-in"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Service Banner Image</label>
                        <div className="flex items-center gap-2">
                          {serviceImage && (
                            <img src={serviceImage} className="h-7 w-7 rounded-lg object-cover border border-slate-200 shrink-0" alt="Preview" />
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => handleFileChange(e, setServiceImage)}
                            className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[9px] file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Short Summary (For Cards)</label>
                      <input 
                        type="text" required value={serviceShort} onChange={e => setServiceShort(e.target.value)}
                        placeholder="Compassionate postnatal care for mothers and newborns..."
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Detailed Scope &amp; Responsibilities</label>
                      <textarea 
                        required rows={3} value={serviceDescription} onChange={e => setServiceDescription(e.target.value)}
                        placeholder="Describe daily caregiver tasks and routines covered..."
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800 resize-none"
                      />
                    </div>

                    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Key Benefits / Tasks Included</label>
                        <span className="text-[9px] text-slate-400 font-medium">One per line</span>
                      </div>
                      <textarea 
                        rows={3} value={serviceBenefits} onChange={e => setServiceBenefits(e.target.value)}
                        placeholder="Personal hygiene & grooming&#10;Medication reminders&#10;Meal preparation"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-mono text-slate-800 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form elements for Blog */}
              {modalType === "blog" && (
                <div className="space-y-4">
                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                      <BookOpen className="h-3.5 w-3.5 text-[#c9a24c]" /> Blog Article Setup
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Blog Title *</label>
                        <input 
                          type="text" required value={blogTitle} onChange={e => setBlogTitle(e.target.value)}
                          placeholder="e.g. Caring for an Elderly Loved One at Home"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                        <input 
                          type="text" required value={blogCategory} onChange={e => setBlogCategory(e.target.value)}
                          placeholder="Elderly Care"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Author</label>
                        <input 
                          type="text" required value={blogAuthor} onChange={e => setBlogAuthor(e.target.value)}
                          placeholder="Dr. Lakshmi"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Short Excerpt / Description</label>
                      <input 
                        type="text" required value={blogDescription} onChange={e => setBlogDescription(e.target.value)}
                        placeholder="One-line summary for the blog cards listing..."
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Post Content (Markdown / Text)</label>
                    <textarea 
                      required rows={6} value={blogContent} onChange={e => setBlogContent(e.target.value)}
                      placeholder="Write your full medical or caregiving guide content here..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Form elements for FAQ */}
              {modalType === "faq" && (
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    <HelpCircle className="h-3.5 w-3.5 text-[#c9a24c]" /> FAQ Question &amp; Answer
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Question *</label>
                    <input 
                      type="text" required value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)}
                      placeholder="e.g. Are your caregivers and nurses background verified?"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Answer *</label>
                    <textarea 
                      required rows={4} value={faqAnswer} onChange={e => setFaqAnswer(e.target.value)}
                      placeholder="Write the official verified answer here..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Form elements for Gallery */}
              {modalType === "gallery" && (
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                  <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    <Image className="h-3.5 w-3.5 text-[#c9a24c]" /> Gallery Photo Details
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Photo Title / Caption *</label>
                    <input 
                      type="text" required value={galleryTitle} onChange={e => setGalleryTitle(e.target.value)}
                      placeholder="e.g. In-Home Physiotherapy Session"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Select Photo File</label>
                    <div className="flex items-center gap-3">
                      {galleryImageUrl && (
                        <img src={galleryImageUrl} className="h-14 w-14 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0" alt="Preview" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => handleFileChange(e, setGalleryImageUrl)}
                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-800 hover:file:bg-slate-300 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Sticky Action Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/90 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-400 font-semibold hidden sm:block">
                All changes instantly synchronize with live database records.
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="admin-dynamic-form"
                  disabled={isLoading}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#091438] via-[#112255] to-[#1e2a5a] hover:from-[#112255] hover:to-[#2b3a75] text-white border border-[#c9a24c]/40 font-bold text-xs shadow-md shadow-indigo-950/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-[#f5d77f]" />
                  )}
                  <span>{isLoading ? "Saving..." : "Save Record"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Caregiver Reviews Modal */}
      {/* Collapsible Caregiver Reviews Modal */}
      {selectedCaregiverForReviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh] premium-card">
            <div className="px-6 py-4 bg-gradient-to-r from-[#091438] via-[#112255] to-[#1e2a5a] border-b border-[#c9a24c]/30 flex justify-between items-center text-left">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-[#c9a24c]/40 flex items-center justify-center text-lg">
                  ⭐
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white font-display flex items-center gap-2">
                    Reviews for {selectedCaregiverForReviews.name}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">Overall Rating: <span className="text-[#f5d77f] font-bold">⭐ {selectedCaregiverForReviews.rating || "N/A"} / 5.0</span></p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCaregiverForReviews(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/40">
              {!selectedCaregiverForReviews.reviews || selectedCaregiverForReviews.reviews.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
                  <p className="text-xs text-slate-400 font-semibold">No feedback reviews submitted for this caregiver yet.</p>
                </div>
              ) : (
                selectedCaregiverForReviews.reviews.map((r: any) => (
                  <div key={r.id} className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-2 text-left shadow-2xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-black">
                        ⭐ {r.rating}.0
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 italic font-medium">&ldquo;{r.comment || "No written feedback."}&rdquo;</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Care Rating & Reviews Modal */}
      {isAllReviewsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh] premium-card">
            
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#091438] via-[#112255] to-[#1e2a5a] border-b border-[#c9a24c]/30 flex justify-between items-center text-left">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-[#c9a24c]/40 flex items-center justify-center text-lg">
                  ⭐
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white font-display flex items-center gap-2">
                    Platform Feedback &amp; Reviews
                  </h3>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Platform Average Score: <span className="text-[#f5d77f] font-black">{avgPlatformRating.toFixed(1)} / 5.0</span> • Total: {allPlatformReviews.length} feedback logs
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAllReviewsModalOpen(false);
                  setReviewsSearchQuery("");
                }}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 bg-white border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by staff name or comment..."
                  value={reviewsSearchQuery}
                  onChange={(e) => setReviewsSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl outline-none bg-slate-50/50 text-xs font-semibold focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c]"
                />
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2 text-left justify-end">
                <span className="text-[10px] uppercase font-bold text-slate-400">Sort Rating:</span>
                <select
                  value={reviewsSortOrder}
                  onChange={(e) => setReviewsSortOrder(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-xl outline-none bg-slate-50/50 text-xs font-bold text-slate-650 cursor-pointer focus:ring-1 focus:ring-[#c9a24c]"
                >
                  <option value="high-to-low">⭐ Top Rated First</option>
                  <option value="low-to-high">⭐ Lowest Rated First</option>
                </select>
              </div>
            </div>

            {/* Content List */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 bg-slate-50/30">
              {filteredAndSortedPlatformReviews.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white p-6">
                  <p className="text-xs text-slate-400 font-semibold">
                    No platform reviews match your search filter.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-1">
                  {filteredAndSortedPlatformReviews.map((r: any, idx: number) => (
                    <div 
                      key={r.id || idx} 
                      className="p-4 bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-2xs space-y-2 text-left transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        {/* Caretaker Info */}
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#1e2a5a] to-[#0f1530] border border-slate-200/50 flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0">
                            {r.caregiverName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block text-xs font-extrabold text-[#1e2a5a]">{r.caregiverName}</span>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide">{r.caregiverSpecialty}</span>
                          </div>
                        </div>

                        {/* Rating Badges */}
                        <div className="text-right">
                          <span className="inline-block text-[10px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-black">
                            ⭐ {Number(r.rating || 0).toFixed(1)}
                          </span>
                          <span className="block text-[9px] text-slate-400 font-bold mt-0.5">
                            {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Comment Message */}
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">
                          &ldquo;{r.comment || "No written feedback comments submitted."}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* REFERRED CANDIDATE FULL KYC & DOSSIER MODAL */}
      {selectedCandidateDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col premium-card">
            
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#091438] via-[#112255] to-[#1e2a5a] border-b border-[#c9a24c]/30 flex justify-between items-center text-left shrink-0">
              <div className="flex items-center gap-3.5">
                {selectedCandidateDetail.profilePhoto ? (
                  <img
                    src={selectedCandidateDetail.profilePhoto}
                    alt={selectedCandidateDetail.name}
                    className="h-12 w-12 rounded-2xl object-cover border-2 border-[#c9a24c]/40 shadow-sm"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-2xl bg-white/10 border border-[#c9a24c]/40 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                    {selectedCandidateDetail.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-extrabold text-white font-display">
                      {selectedCandidateDetail.name}
                    </h3>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                      selectedCandidateDetail.status === "Verified" ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" :
                      selectedCandidateDetail.status === "Rejected" ? "bg-rose-500/20 text-rose-300 border-rose-400/40" :
                      "bg-amber-500/20 text-amber-300 border-amber-400/40"
                    }`}>
                      {selectedCandidateDetail.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    {selectedCandidateDetail.specialty} • {selectedCandidateDetail.experience} Years Exp • Joined {new Date(selectedCandidateDetail.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidateDetail(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-left flex-1 bg-slate-50/50">
              
              {/* Referrer Attribution Banner */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                      Referral Attribution &amp; Link Provider
                    </span>
                    <h4 className="text-sm font-extrabold text-[#1e2a5a]">
                      Referred by: {selectedCandidateDetail.referrerName}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Referral Code Used: <span className="font-mono font-bold text-purple-700">{selectedCandidateDetail.referrerCode}</span>
                      {selectedCandidateDetail.referrerPhone !== "N/A" && (
                        <span> • Phone: <a href={`tel:${selectedCandidateDetail.referrerPhone}`} className="text-indigo-600 hover:underline">{selectedCandidateDetail.referrerPhone}</a></span>
                      )}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-indigo-800 bg-white px-3 py-1 rounded-xl border border-indigo-200 shadow-2xs">
                  Auto Locked at Registration
                </span>
              </div>

              {/* Personal & Contact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone Number</span>
                  <a href={`tel:${selectedCandidateDetail.phone}`} className="text-sm font-bold text-[#1e2a5a] hover:underline flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-[#c9a24c]" /> {selectedCandidateDetail.phone}
                  </a>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Email Address</span>
                  <a href={`mailto:${selectedCandidateDetail.email}`} className="text-sm font-semibold text-slate-800 hover:underline flex items-center gap-1 truncate">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {selectedCandidateDetail.email}
                  </a>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Location &amp; State</span>
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {selectedCandidateDetail.city ? `${selectedCandidateDetail.city}, ` : ""}{selectedCandidateDetail.state || "Telangana"}
                  </span>
                  {selectedCandidateDetail.googleMapLocation && (
                    <a
                      href={selectedCandidateDetail.googleMapLocation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#c9a24c] font-bold hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="h-3 w-3" /> View Map Location
                    </a>
                  )}
                </div>
              </div>

              {/* Work Preferences & Experience Details */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
                <h4 className="text-xs font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Briefcase className="h-4 w-4 text-[#c9a24c]" /> Experience Details &amp; Availability
                </h4>

                <div className="text-xs text-slate-700 leading-relaxed space-y-2">
                  <div>
                    <span className="font-bold text-slate-500 block mb-0.5">Clinical Skills &amp; Past Postings:</span>
                    <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                      {selectedCandidateDetail.experienceDetails || "No detailed summary written during registration."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {selectedCandidateDetail.workingLocations && (
                      <div>
                        <span className="font-bold text-slate-500 block">Preferred Localities:</span>
                        <span className="font-semibold text-[#1e2a5a]">{selectedCandidateDetail.workingLocations}</span>
                      </div>
                    )}
                    {selectedCandidateDetail.availableTimings && (
                      <div>
                        <span className="font-bold text-slate-500 block">Available Timings:</span>
                        <span className="font-semibold text-slate-800">{selectedCandidateDetail.availableTimings}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Uploaded KYC Documents Hub */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Uploaded KYC Verification Documents
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Click to preview document in high resolution</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* Aadhaar */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Aadhaar Card</span>
                      <span className="text-[10px] text-slate-400">Government Identity Record</span>
                    </div>
                    {selectedCandidateDetail.aadhaar ? (
                      <button
                        type="button"
                        onClick={() => openDocViewer(selectedCandidateDetail.aadhaar, "Aadhaar Card Document", selectedCandidateDetail.name, "Referred Caregiver")}
                        className="py-1.5 px-3 rounded-lg bg-[#c9a24c] hover:bg-[#b08726] text-[#1e2a5a] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Aadhaar Card
                      </button>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-bold bg-rose-50 py-1 px-2 rounded text-center">
                        ⚠️ Document Not Provided
                      </span>
                    )}
                  </div>

                  {/* PAN Card */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">PAN Card</span>
                      <span className="text-[10px] text-slate-400">Tax ID &amp; Payment Record</span>
                    </div>
                    {selectedCandidateDetail.pan ? (
                      <button
                        type="button"
                        onClick={() => openDocViewer(selectedCandidateDetail.pan, "PAN Card Document", selectedCandidateDetail.name, "Referred Caregiver")}
                        className="py-1.5 px-3 rounded-lg bg-[#1e2a5a] hover:bg-[#283875] text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> View PAN Card
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 py-1 px-2 rounded text-center">
                        Optional / Not Uploaded
                      </span>
                    )}
                  </div>

                  {/* Certificates */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Educational Cert</span>
                      <span className="text-[10px] text-slate-400">Nursing / Clinical Training</span>
                    </div>
                    {selectedCandidateDetail.certificates ? (
                      <button
                        type="button"
                        onClick={() => openDocViewer(selectedCandidateDetail.certificates, "Educational Cert", selectedCandidateDetail.name, "Referred Caregiver")}
                        className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Certificate
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 py-1 px-2 rounded text-center">
                        Not Uploaded
                      </span>
                    )}
                  </div>

                  {/* Experience Certificate */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Experience Letter</span>
                      <span className="text-[10px] text-slate-400">Hospital Service Reference</span>
                    </div>
                    {selectedCandidateDetail.experienceCertificate ? (
                      <button
                        type="button"
                        onClick={() => openDocViewer(selectedCandidateDetail.experienceCertificate, "Experience Certificate", selectedCandidateDetail.name, "Referred Caregiver")}
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Experience Cert
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 py-1 px-2 rounded text-center">
                        Not Uploaded
                      </span>
                    )}
                  </div>

                  {/* Police Verification */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Police Verification</span>
                      <span className="text-[10px] text-slate-400">Background Safety Check</span>
                    </div>
                    {selectedCandidateDetail.policeVerification ? (
                      <button
                        type="button"
                        onClick={() => openDocViewer(selectedCandidateDetail.policeVerification, "Police Verification Record", selectedCandidateDetail.name, "Referred Caregiver")}
                        className="py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Police Clearance
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 py-1 px-2 rounded text-center">
                        Not Uploaded
                      </span>
                    )}
                  </div>

                  {/* Additional Certificates */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Additional Certs</span>
                      <span className="text-[10px] text-slate-400">Special Clinical Courses</span>
                    </div>
                    {selectedCandidateDetail.additionalCertificates ? (
                      <button
                        type="button"
                        onClick={() => openDocViewer(selectedCandidateDetail.additionalCertificates, "Additional Certificates", selectedCandidateDetail.name, "Referred Caregiver")}
                        className="py-1.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Extra Certs
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 py-1 px-2 rounded text-center">
                        None
                      </span>
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span>Update Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full ${
                  selectedCandidateDetail.status === "Verified" ? "bg-emerald-100 text-emerald-800" :
                  selectedCandidateDetail.status === "Rejected" ? "bg-rose-100 text-rose-800" :
                  "bg-amber-100 text-amber-800"
                }`}>
                  Current: {selectedCandidateDetail.status}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleUpdateCaregiverStatus(selectedCandidateDetail.candidateId || selectedCandidateDetail.id, "Verified")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Approve &amp; Verify Staff
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateCaregiverStatus(selectedCandidateDetail.candidateId || selectedCandidateDetail.id, "Pending")}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Clock className="h-4 w-4" /> Mark Pending
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateCaregiverStatus(selectedCandidateDetail.candidateId || selectedCandidateDetail.id, "Rejected")}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* WHATSAPP PAY BALANCE LINK MODAL */}
      {whatsAppModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#091438] via-[#10235b] to-[#091438] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Send WhatsApp Pay Link</h3>
                  <p className="text-xs text-slate-300">
                    Booking #{whatsAppModalBooking.id} • {whatsAppModalBooking.name || "Customer"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppModalBooking(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Financial Snapshot */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Customer Mobile:</span>
                  <span className="font-bold text-slate-900 font-mono">{whatsAppModalBooking.phone || "Not recorded"}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Service:</span>
                  <span className="font-semibold text-slate-900">{whatsAppModalBooking.service}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Shift Value:</span>
                  <span className="font-semibold text-slate-900">₹{Number(whatsAppModalBooking.amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Advance Already Paid:</span>
                  <span className="font-bold">₹{Number(whatsAppModalBooking.advancePaid || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-amber-800 bg-amber-100/60 p-2.5 rounded-xl border border-amber-200 font-bold text-sm">
                  <span>Remaining Balance Due:</span>
                  <span>₹{(Number(whatsAppModalBooking.balanceAmount) || Math.max(0, Number(whatsAppModalBooking.amount) - Number(whatsAppModalBooking.advancePaid || 0))).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Direct Payment URL */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Customer Public Pay Balance URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in"}/pay-balance?id=${whatsAppModalBooking.id}`}
                    className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 select-all"
                  />
                  <button
                    onClick={() => {
                      const url = `${typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in"}/pay-balance?id=${whatsAppModalBooking.id}`;
                      navigator.clipboard.writeText(url);
                      setIsCopiedLink(true);
                      setTimeout(() => setIsCopiedLink(false), 2000);
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopiedLink ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Pre-formatted WhatsApp Message Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    WhatsApp Message Preview
                  </label>
                  <button
                    onClick={() => {
                      const text = getWhatsAppPayText(whatsAppModalBooking);
                      navigator.clipboard.writeText(text);
                      setIsCopiedMessage(true);
                      setTimeout(() => setIsCopiedMessage(false), 2000);
                    }}
                    className="text-[#0e2254] hover:underline font-bold text-[11px] flex items-center gap-1"
                  >
                    {isCopiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {isCopiedMessage ? "Copied All" : "Copy Text"}
                  </button>
                </div>
                <div className="bg-[#e7fedb] border border-[#b2e29e] rounded-2xl p-3.5 font-sans text-slate-800 whitespace-pre-wrap text-[11px] leading-relaxed shadow-inner">
                  {getWhatsAppPayText(whatsAppModalBooking)}
                </div>
              </div>

              {/* Status Notice if server reminder clicked */}
              {whatsAppReminderStatus && (
                <div className={`p-3 rounded-xl border text-xs font-semibold ${
                  whatsAppReminderStatus.startsWith("✓")
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}>
                  {whatsAppReminderStatus}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2.5 justify-between items-center">
              <button
                type="button"
                onClick={() => handleTriggerServerWhatsAppReminder(whatsAppModalBooking)}
                disabled={isSendingWhatsAppReminder}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSendingWhatsAppReminder ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Sending via Server...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Dispatch MSG91 API
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWhatsAppModalBooking(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenWhatsAppDirect(whatsAppModalBooking)}
                  className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open WhatsApp &amp; Send →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENTERPRISE DOCUMENT VIEWER MODAL */}
      <DocumentViewerModal
        isOpen={docViewerState.isOpen}
        onClose={() => setDocViewerState(s => ({ ...s, isOpen: false }))}
        docUrl={docViewerState.docUrl}
        docTitle={docViewerState.docTitle}
        applicantName={docViewerState.applicantName}
        category={docViewerState.category}
      />

      {/* STAFF ID CARD PREVIEW & PRINT MODAL */}
      {selectedCardForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col my-auto max-h-[95vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#091438] via-[#10235b] to-[#091438] p-5 text-white flex items-center justify-between border-b border-[#c9a24c]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#c9a24c]/40 flex items-center justify-center text-[#c9a24c]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#c9a24c] text-[#091438]">
                      {selectedCardForView.staffCategory} • {selectedCardForView.categoryLabel}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {selectedCardForView.employeeId}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-white mt-0.5">
                    Official Staff ID Badge
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardForView(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: High Resolution ID Badge Preview */}
            <div className="p-6 bg-slate-100/70 overflow-y-auto flex flex-col items-center">
              {/* Exact Card Component matching uploaded template */}
              <div
                id="printable-id-card"
                className="relative rounded-3xl overflow-hidden shadow-2xl bg-white select-none border border-slate-300/80 shrink-0"
                style={{
                  width: "340px",
                  height: "510.6px",
                  aspectRatio: "682 / 1024"
                }}
              >
                {/* Blank Template Artwork */}
                <img
                  src="/assets/id-card-template.png"
                  alt="Amma Seva ID Card Template"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* Staff Photo Box */}
                <div
                  className="absolute overflow-hidden flex items-center justify-center bg-slate-100 rounded-xl"
                  style={{
                    top: "28.3%",
                    left: "29.7%",
                    width: "40.6%",
                    height: "29.8%",
                    border: "2px solid #d4af37",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                  }}
                >
                  {selectedCardForView.profilePhoto ? (
                    <img
                      src={selectedCardForView.profilePhoto}
                      alt={selectedCardForView.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <User className="w-12 h-12 text-slate-300 mb-1" />
                      <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">PHOTO HERE</span>
                    </div>
                  )}
                </div>

                {/* Employee ID text */}
                <div
                  className="absolute flex items-center"
                  style={{
                    top: "62.4%",
                    left: "45.5%",
                    width: "46%",
                    height: "3.6%"
                  }}
                >
                  <span className="text-[12.5px] sm:text-[13.5px] font-black text-[#091438] tracking-wide truncate font-sans">
                    {selectedCardForView.employeeId}
                  </span>
                </div>

                {/* Name text */}
                <div
                  className="absolute flex items-center"
                  style={{
                    top: "69.4%",
                    left: "45.5%",
                    width: "46%",
                    height: "3.6%"
                  }}
                >
                  <span className="text-[12.5px] sm:text-[13.5px] font-black text-[#091438] tracking-wide truncate font-sans">
                    {selectedCardForView.name}
                  </span>
                </div>

                {/* Designation text */}
                <div
                  className="absolute flex items-center"
                  style={{
                    top: "76.4%",
                    left: "45.5%",
                    width: "46%",
                    height: "3.6%"
                  }}
                >
                  <span className="text-[12.5px] sm:text-[13.5px] font-black text-[#091438] tracking-wide truncate font-sans">
                    {getCleanIdCardDesignation(selectedCardForView)}
                  </span>
                </div>
              </div>

              {/* Card Specs Callout */}
              <div className="mt-4 text-center max-w-xs">
                <span className="text-[11px] font-bold text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  CR80 PVC Standard • 54mm × 85.6mm Printable Badge
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Compatible with standard card printers, thermal dye-sublimation, and laser badge holders.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const card = selectedCardForView;
                  setSelectedCardForView(null);
                  handleOpenEditIdCardModal(card);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Details
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCardForView(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await downloadIdCardImage({
                        employeeId: selectedCardForView.employeeId,
                        name: selectedCardForView.name,
                        designation: getCleanIdCardDesignation(selectedCardForView),
                        profilePhoto: selectedCardForView.profilePhoto
                      });
                    } catch (err) {
                      console.error("ID card download error:", err);
                      alert("Failed to download ID card image. Please try again.");
                    }
                  }}
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  title="Download 682x1024 high resolution PNG card image"
                >
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>Download ID Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintIdCard(selectedCardForView)}
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#091438] to-[#1e2a5a] hover:from-[#172147] hover:to-[#26356b] text-white font-black text-xs flex items-center gap-2 shadow-md shadow-[#091438]/20 border border-[#c9a24c]/40 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#c9a24c]" />
                  Print ID Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE NEW OFFICIAL STAFF ID CARD MODAL */}
      {isIssueEmployeeModalOpen && (() => {
        const categoryMeta = {
          EMP: {
            title: "Office Employee ID Card",
            subtitle: "Internal Office & Operations Staff",
            prefix: "AS - EMP - 26-xxx",
            badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
            headerGradient: "from-[#091438] via-[#10235b] to-[#1e2a5a]",
            presets: ["Employee"],
            defaultDesig: "Employee",
            btnLabel: "Issue Employee ID"
          },
          MTP: {
            title: "MTP Partner ID Card",
            subtitle: "Multi Tasking Professional, Escort & Errands Partner",
            prefix: "AS - MTP - 26-xxx",
            badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
            headerGradient: "from-[#382309] via-[#5a3810] to-[#091438]",
            presets: ["MTP"],
            defaultDesig: "MTP",
            btnLabel: "Issue MTP Partner ID"
          },
          NUR: {
            title: "Registered Nurse ID Card",
            subtitle: "Clinical Nursing, GNM & Critical Care Staff",
            prefix: "AS - NUR - 26-xxx",
            badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
            headerGradient: "from-[#093833] via-[#105b51] to-[#091438]",
            presets: ["Nurse"],
            defaultDesig: "Nurse",
            btnLabel: "Issue Nurse ID"
          },
          CGV: {
            title: "Caregiver ID Card",
            subtitle: "Bedside Attendant & Patient Support Staff",
            prefix: "AS - CGV - 26-xxx",
            badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
            headerGradient: "from-[#092238] via-[#103a5b] to-[#091438]",
            presets: ["Caregiver"],
            defaultDesig: "Caregiver",
            btnLabel: "Issue Caregiver ID"
          }
        }[newEmpCategory];

        const cleanPhoneDigits = newEmpPhone.replace(/\D/g, "");
        const isPhoneValid = cleanPhoneDigits.length === 10;
        const isPhoneIncomplete = cleanPhoneDigits.length > 0 && cleanPhoneDigits.length < 10;

        const isEmailEntered = Boolean(newEmpEmail.trim());
        const isEmailValid = !isEmailEntered || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmpEmail.trim());

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col my-auto max-h-[95vh]">
              {/* Header */}
              <div className={`bg-gradient-to-r ${categoryMeta.headerGradient} p-5 text-white flex items-center justify-between border-b border-[#c9a24c]/30`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-[#c9a24c]/40 flex items-center justify-center text-[#c9a24c] shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#c9a24c] text-[#091438] font-mono">
                        {newEmpCategory}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {categoryMeta.prefix}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-white mt-0.5">
                      Issue {categoryMeta.title}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIssueEmployeeModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleIssueEmployee} className="p-6 space-y-4 overflow-y-auto text-left">
                {/* Category Selection Tabs */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Select Staff Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setNewEmpCategory("EMP");
                        setNewEmpDesignation("Employee");
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                        newEmpCategory === "EMP"
                          ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                    >
                      <span className="text-sm">💼</span>
                      <span>Employee</span>
                      <span className="text-[9px] opacity-80 font-mono">AS-EMP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewEmpCategory("MTP");
                        setNewEmpDesignation("MTP");
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                        newEmpCategory === "MTP"
                          ? "bg-amber-600 text-white shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                    >
                      <span className="text-sm">🚗</span>
                      <span>MTP</span>
                      <span className="text-[9px] opacity-80 font-mono">AS-MTP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewEmpCategory("NUR");
                        setNewEmpDesignation("Nurse");
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                        newEmpCategory === "NUR"
                          ? "bg-teal-600 text-white shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                    >
                      <span className="text-sm">🩺</span>
                      <span>Nurse</span>
                      <span className="text-[9px] opacity-80 font-mono">AS-NUR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewEmpCategory("CGV");
                        setNewEmpDesignation("Caregiver");
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                        newEmpCategory === "CGV"
                          ? "bg-blue-600 text-white shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                      }`}
                    >
                      <span className="text-sm">🤲</span>
                      <span>Caregiver</span>
                      <span className="text-[9px] opacity-80 font-mono">AS-CGV</span>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    placeholder="e.g. Ramesh Varma"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#1e2a5a] focus:outline-hidden"
                  />
                </div>

                {/* Official Designation with quick preset tags */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Official Designation <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Quick suggestions below</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. ${categoryMeta.defaultDesig}`}
                    value={newEmpDesignation}
                    onChange={(e) => setNewEmpDesignation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#1e2a5a] focus:outline-hidden"
                  />
                  {/* Preset Tags */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {categoryMeta.presets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewEmpDesignation(preset)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          newEmpDesignation === preset
                            ? "bg-[#091438] text-white border-[#091438]"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Phone */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[10px] font-mono font-bold ${
                        isPhoneValid ? "text-emerald-600" : isPhoneIncomplete ? "text-amber-600" : "text-slate-400"
                      }`}>
                        {cleanPhoneDigits.length}/10 digits
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit mobile"
                        value={newEmpPhone}
                        onChange={(e) => setNewEmpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-hidden transition-all ${
                          isPhoneValid 
                            ? "border-emerald-400 focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20" 
                            : isPhoneIncomplete 
                            ? "border-amber-400 focus:ring-2 focus:ring-amber-500 bg-amber-50/20" 
                            : "border-slate-300 focus:ring-2 focus:ring-[#1e2a5a]"
                        }`}
                      />
                      {isPhoneValid && (
                        <Check className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                    {isPhoneIncomplete && (
                      <p className="text-[10px] text-amber-600 font-bold mt-1">
                        ⚠️ Please enter all 10 digits ({10 - cleanPhoneDigits.length} remaining)
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      {isEmailEntered && isEmailValid && (
                        <span className="text-[10px] font-bold text-emerald-600">✓ Valid</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="staff@ammaseva.in"
                        value={newEmpEmail}
                        onChange={(e) => setNewEmpEmail(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-hidden transition-all ${
                          !isEmailValid
                            ? "border-rose-400 focus:ring-2 focus:ring-rose-500 bg-rose-50/20"
                            : isEmailEntered
                            ? "border-emerald-400 focus:ring-2 focus:ring-emerald-500 bg-emerald-50/20"
                            : "border-slate-300 focus:ring-2 focus:ring-[#1e2a5a]"
                        }`}
                      />
                      {isEmailEntered && isEmailValid && (
                        <Check className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                    {!isEmailValid && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1">
                        ⚠️ Complete email required (e.g. name@example.com)
                      </p>
                    )}
                  </div>
                </div>

                {/* Profile Photo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Profile Photo <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {newEmpPhoto && (
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 shrink-0">
                        <img src={newEmpPhoto} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Paste image URL or browse file"
                      value={newEmpPhoto}
                      onChange={(e) => setNewEmpPhoto(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#1e2a5a] focus:outline-hidden"
                    />
                    <label className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer">
                      Browse
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, setNewEmpPhoto)}
                      />
                    </label>
                  </div>
                </div>

                {/* Live Serial Generation Info Callout */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-[#c9a24c] shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${categoryMeta.badgeClass}`}>
                        {newEmpCategory} Credential
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {categoryMeta.prefix}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Assigned sequentially from 001. Immediately available for high-res PVC CR80 badge preview, customization, and printing.
                    </p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsIssueEmployeeModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEmployee || (newEmpPhone.length > 0 && !isPhoneValid) || !isEmailValid}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#091438] to-[#1e2a5a] text-white font-black text-xs shadow-md shadow-[#091438]/20 border border-[#c9a24c]/40 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingEmployee ? "Issuing ID..." : categoryMeta.btnLabel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* EDIT STAFF ID CARD DETAILS MODAL */}
      {isEditIdCardModalOpen && editingCardData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#091438] to-[#1e2a5a] p-5 text-white flex items-center justify-between border-b border-[#c9a24c]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-[#c9a24c]/40 flex items-center justify-center text-[#c9a24c]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Edit ID Card Details</h3>
                  <p className="text-[11px] text-slate-300 font-mono">{editingCardData.employeeId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditIdCardModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCardEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editCardName}
                  onChange={(e) => setEditCardName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#1e2a5a] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Critical Care Nurse, Elderly Care Attendant"
                  value={editCardDesignation}
                  onChange={(e) => setEditCardDesignation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#1e2a5a] focus:outline-hidden"
                />
              </div>

              {editingCardData.source === "caregivers" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff Role Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditCardCategory("NUR")}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        editCardCategory === "NUR" 
                          ? "bg-teal-50 border-teal-500 text-teal-900 shadow-xs ring-1 ring-teal-500" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>🩺</span>
                        <span>Registered Nurse</span>
                      </div>
                      <span className="text-[10px] text-teal-600 block mt-0.5 font-mono">AS - NUR - 26-xxx</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditCardCategory("CGV")}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                        editCardCategory === "CGV" 
                          ? "bg-blue-50 border-blue-500 text-blue-900 shadow-xs ring-1 ring-blue-500" 
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>🤲</span>
                        <span>Caregiver / Attendant</span>
                      </div>
                      <span className="text-[10px] text-blue-600 block mt-0.5 font-mono">AS - CGV - 26-xxx</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Image URL or upload"
                    value={editCardPhoto}
                    onChange={(e) => setEditCardPhoto(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#1e2a5a] focus:outline-hidden"
                  />
                  <label className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer">
                    Browse
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setEditCardPhoto)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Verification Status</label>
                <select
                  value={editCardStatus}
                  onChange={(e) => setEditCardStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#1e2a5a] focus:outline-hidden"
                >
                  <option value="Verified">Verified (Active Badge)</option>
                  <option value="Pending">Pending Verification</option>
                  <option value="Rejected">Suspended / Rejected</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditIdCardModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCardEdit}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#091438] to-[#1e2a5a] text-white font-extrabold text-xs shadow-md shadow-[#091438]/20 border border-[#c9a24c]/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingCardEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT STYLESHEET FOR CR80 BIOMETRIC ID BADGE PRINTING */}
      <style>{`
        @media print {
          @page {
            size: 54mm 85.6mm;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-id-card, #printable-id-card * {
            visibility: visible !important;
          }
          #printable-id-card {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 54mm !important;
            height: 85.6mm !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            z-index: 9999999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>


    </div>
  );
}

// Side widget helper for Metric grids
function HorizontalMetric({ icon: Icon, iconColor, label, value }: { icon: any; iconColor: string; label: string; value: string }) {
  let finalColorClasses = iconColor;
  if (iconColor.includes("indigo") || iconColor.includes("#1e2a5a")) {
    finalColorClasses = "text-[#1e2a5a] bg-[#1e2a5a]/5 border border-[#1e2a5a]/10";
  } else if (iconColor.includes("amber") || iconColor.includes("#c9a24c")) {
    finalColorClasses = "text-[#c9a24c] bg-[#c9a24c]/10 border border-[#c9a24c]/25";
  } else if (iconColor.includes("rose") || iconColor.includes("teal")) {
    finalColorClasses = "text-teal-600 bg-teal-50 border border-teal-100";
  } else if (iconColor.includes("yellow") || iconColor.includes("star")) {
    finalColorClasses = "text-amber-500 bg-amber-500/5 border border-amber-200/50";
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
      <div className={`p-3 rounded-xl shrink-0 ${finalColorClasses}`}>
        <Icon className="h-5.5 w-5.5" />
      </div>
      <div>
        <span className="block text-2xl font-black font-display text-slate-900 leading-none">{value}</span>
        <span className="block text-[10px] text-slate-400 mt-1.5 font-bold uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}
