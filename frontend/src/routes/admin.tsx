import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { 
  Trash2, RefreshCw, Mail, Phone, MapPin, ClipboardList, 
  Users, Calendar, DollarSign, ShieldAlert, LogOut, CheckCircle2, 
  XCircle, Edit3, Save, Check, LayoutDashboard, CalendarDays,
  UserCheck, MessageSquare, Sliders, Bell, Search, Plus, Send, TrendingDown,
  ArrowUpRight, Star, BookOpen, HelpCircle, Menu, X, Image, Coins, Clock,
  Briefcase, Car, Eye, MessageCircle, FileText, Sparkles,
  GraduationCap, CreditCard, ShieldCheck, FileCheck, User, ExternalLink,
  Gift, Copy, Share2
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
  caretakerPayoutStatus?: string;
  caretakerPayoutMethod?: string;
  caretakerPayoutRef?: string;
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

  // Navigation and Search
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "caregivers" | "mtps" | "enquiries" | "services" | "users" | "notifications" | "payments" | "blogs" | "faqs" | "gallery" | "salaries" | "referrals">("overview");
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
  const [mtpSubTab, setMtpSubTab] = useState<"applicants" | "tasks">("applicants");

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
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingService, setBookingService] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState("Daily");
  const [bookingAddress, setBookingAddress] = useState("");
  const [bookingAmount, setBookingAmount] = useState("");
  const [bookingStatus, setBookingStatus] = useState("Pending");
  const [bookingAssignedStaff, setBookingAssignedStaff] = useState("");
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
  const [bookingPatientName, setBookingPatientName] = useState("");
  const [bookingPatientAge, setBookingPatientAge] = useState("");
  const [bookingPatientNeeds, setBookingPatientNeeds] = useState("");
  const [bookingPrescription, setBookingPrescription] = useState("");
  const [bookingGoogleMapLocation, setBookingGoogleMapLocation] = useState("");

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
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<any | null>(null);

  const [patientSearch, setPatientSearch] = useState("");
  const [patientStartDate, setPatientStartDate] = useState("");
  const [patientEndDate, setPatientEndDate] = useState("");

  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStartDate, setPaymentStartDate] = useState("");
  const [paymentEndDate, setPaymentEndDate] = useState("");

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

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("ammaseva_admin_token");

    const fetchWithAuth = async (url: string) => {
      const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.status === 401) {
        handleLogout();
        throw new Error("Unauthorized");
      }
      return res.json();
    };

    try {
      const [bookingsRes, caregiversRes, enquiriesRes, usersRes, servicesRes, notificationsRes, blogsRes, faqsRes, galleryRes, mtpsRes, mtpTasksRes, referralsRes] = await Promise.all([
        fetchWithAuth("/api/bookings"),
        fetchWithAuth("/api/caregivers"),
        fetchWithAuth("/api/enquiries"),
        fetchWithAuth("/api/admin/users"),
        fetchWithAuth("/api/services"),
        fetchWithAuth("/api/notifications"),
        fetch("/api/blogs").then(res => res.json()),
        fetch("/api/faqs").then(res => res.json()),
        fetch("/api/gallery").then(res => res.json()),
        fetchWithAuth("/api/admin/mtps").catch(() => []),
        fetch("/api/mtp/tasks").then(res => res.json()).catch(() => []),
        fetchWithAuth("/api/admin/referrals").catch(() => null)
      ]);
      setBookings(Array.isArray(bookingsRes) ? bookingsRes : []);
      setCaregivers(Array.isArray(caregiversRes) ? caregiversRes : []);
      setEnquiries(Array.isArray(enquiriesRes) ? enquiriesRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setServices(Array.isArray(servicesRes) ? servicesRes : []);
      setNotifications(Array.isArray(notificationsRes) ? notificationsRes : []);
      setBlogs(Array.isArray(blogsRes) ? blogsRes : []);
      setFaqs(Array.isArray(faqsRes) ? faqsRes : []);
      setGallery(Array.isArray(galleryRes) ? galleryRes : []);
      setMTPs(Array.isArray(mtpsRes) ? mtpsRes : []);
      setMtpTasks(Array.isArray(mtpTasksRes) ? mtpTasksRes : []);
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
            prev.map(c => c.id === id ? { ...c, status } : c)
          );
          // Also update referral candidate if open or in state
          setSelectedCandidateDetail(prev => prev && prev.id === id ? { ...prev, status } : prev);
          // Refetch referral network to sync counts
          const fetchWithAuth = async (url: string) => {
            const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
            return res.json();
          };
          fetchWithAuth("/api/admin/referrals")
            .then(res => { if (res && res.success) setReferralsData(res); })
            .catch(() => {});
        }
      })
      .catch(err => console.error(err));
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
    if (window.confirm("Are you sure you want to permanently delete this user customer account?")) {
      const token = localStorage.getItem("ammaseva_admin_token");
      fetch(`/api/admin/user/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUsers(prev => prev.filter(u => u.id !== id));
          }
        })
        .catch(err => console.error(err));
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
      setBookingName("");
      setBookingPhone("");
      setBookingService(services[0]?.title || "Elderly Care at Home");
      setBookingDate("");
      setBookingTime("");
      setBookingDuration("Daily");
      setBookingAddress("");
      setBookingAmount("1200");
      setBookingStatus("Pending");
      setBookingAssignedStaff("");
      setBookingPaymentStatus("Unpaid");
      setBookingPaymentMethod("UPI");
      setBookingTransactionId("");
      setBookingPaymentDate("");
      setBookingCaretakerPayout("0");
      setBookingCaretakerPayoutStatus("Unpaid");
      setBookingCaretakerPayoutMethod("");
      setBookingCaretakerPayoutRef("");
      setPayoutCalcMode("percentage");
      setPayoutPercentValue("85");
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
      setBookingDate(record.date);
      setBookingTime(record.time);
      setBookingDuration(record.duration || "Daily");
      setBookingAddress(record.address);
      setBookingStatus(record.status || "Pending");
      setBookingAssignedStaff(record.assignedStaff || "");
      setBookingAmount(record.amount?.toString() || "0");
      setBookingPaymentStatus(record.paymentStatus || "Unpaid");
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

  // Submit forms
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("ammaseva_admin_token");

    let url = "";
    let method = "POST";
    let bodyData: any = {};

    if (modalType === "booking") {
      const trimmedPhone = bookingPhone.trim();
      if (!trimmedPhone) {
        alert("Please enter a valid 10-digit phone number.");
        return;
      }
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        alert("Phone number must be exactly 10 digits and contain only numbers.");
        return;
      }

      setIsLoading(true);
      url = modalMode === "add" ? "/api/admin/booking" : `/api/admin/booking/${selectedId}`;
      method = modalMode === "add" ? "POST" : "PUT";
      bodyData = {
        name: bookingName,
        phone: bookingPhone,
        service: bookingService,
        date: bookingDate,
        time: bookingTime,
        duration: bookingDuration,
        address: bookingAddress,
        amount: Number(bookingAmount) || 1200,
        caretakerPayout: Number(bookingCaretakerPayout) || 0,
        caretakerPayoutStatus: bookingCaretakerPayoutStatus,
        caretakerPayoutMethod: bookingCaretakerPayoutMethod,
        caretakerPayoutRef: bookingCaretakerPayoutRef,
        status: bookingStatus,
        assignedStaff: bookingAssignedStaff || null,
        paymentStatus: bookingPaymentStatus,
        paymentMethod: bookingPaymentMethod,
        transactionId: bookingTransactionId,
        paymentDate: bookingPaymentDate
      };
    } else if (modalType === "caregiver") {
      const trimmedPhone = caregiverPhone.trim();
      if (!trimmedPhone) {
        alert("Please enter a valid 10-digit phone number.");
        return;
      }
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        alert("Phone number must be exactly 10 digits and contain only numbers.");
        return;
      }
      const trimmedEmail = caregiverEmail.trim();
      if (!trimmedEmail) {
        alert("Please enter caregiver's email address.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        alert("Please enter a valid email address.");
        return;
      }

      setIsLoading(true);
      url = modalMode === "add" ? "/api/caregiver" : `/api/admin/caregiver/${selectedId}`;
      method = modalMode === "add" ? "POST" : "PUT";
      bodyData = {
        name: caregiverName,
        phone: caregiverPhone,
        email: caregiverEmail,
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
        bodyData.password = "123456"; // Default password
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
        } else {
          alert(data.error || "Failed to update record.");
        }
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  // Calculations for Reports / Overview
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === "Paid" && b.status !== "Cancelled")
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const pendingBookingsCount = bookings.filter(b => b.status === "Pending").length;
  const verifiedCaregiversCount = caregivers.filter(c => c.status === "Verified").length;
  const caregiverUtilizationRate = caregivers.length > 0 
    ? Math.round((bookings.filter(b => b.status === "Confirmed" && b.assignedStaff).length / caregivers.length) * 100)
    : 0;

  // Caregiver Ratings & Reviews aggregate
  const verifiedCaregivers = caregivers.filter(c => c.status === "Verified" && Number(c.rating) > 0);
  const avgPlatformRating = verifiedCaregivers.length > 0
    ? Number((verifiedCaregivers.reduce((sum, c) => sum + Number(c.rating), 0) / verifiedCaregivers.length).toFixed(1))
    : 4.8;

  // Collect, filter, and sort all caregiver reviews for the global Care Rating card view
  const allPlatformReviews = caregivers.flatMap(cg => 
    (cg.reviews || []).map((rev: any) => ({
      ...rev,
      caregiverId: cg.id,
      caregiverName: cg.name,
      caregiverSpecialty: cg.specialty,
      caregiverPhoto: cg.profilePhoto
    }))
  );

  const filteredAndSortedPlatformReviews = allPlatformReviews
    .filter((rev: any) => {
      const q = reviewsSearchQuery.toLowerCase();
      const matchCg = rev.caregiverName.toLowerCase().includes(q);
      const matchComment = rev.comment && rev.comment.toLowerCase().includes(q);
      return !reviewsSearchQuery || matchCg || matchComment;
    })
    .sort((a: any, b: any) => {
      const ratingA = Number(a.rating || 0);
      const ratingB = Number(b.rating || 0);
      if (reviewsSortOrder === "high-to-low") {
        return ratingB - ratingA;
      } else {
        return ratingA - ratingB;
      }
    });

  const activeShiftsCount = bookings.filter(b => b.status === "Active").length;

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
          if (b.paymentStatus !== "Paid" || b.status === "Cancelled") return false;
          const bDate = new Date(b.createdAt || b.date);
          return bDate.getMonth() === monthIdx;
        })
        .reduce((sum, b) => sum + Number(b.amount), 0);

      data.push({ label: monthLabel, value: monthlyRevenue });
    }
    const maxVal = Math.max(...data.map(d => d.value), 1000);
    return data.map(d => ({
      label: d.label,
      value: d.value,
      height: Math.max(10, Math.round((d.value / maxVal) * 80))
    }));
  };
  const monthlyRevenueChart = getMonthlyRevenueData();

  // Service distribution details
  const getServiceDistribution = () => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.service] = (counts[b.service] || 0) + 1;
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
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone.includes(searchQuery) ||
    b.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCaregivers = caregivers.filter(c => {
    const q = searchQuery.toLowerCase();
    const refCode = getCaregiverReferralCode(c).toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(searchQuery) ||
      c.specialty.toLowerCase().includes(q) ||
      refCode.includes(q) ||
      (c.uniqueId && c.uniqueId.toLowerCase().includes(q)) ||
      (c.referCode && c.referCode.toLowerCase().includes(q)) ||
      (c.referralCode && c.referralCode.toLowerCase().includes(q))
    );
  });

  const filteredEnquiries = enquiries.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.phone.includes(searchQuery) ||
    (e.service && e.service.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredNotifications = notifications.filter(n => 
    n.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
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
      <aside className="w-full lg:w-72 bg-[#1e2a5a] text-slate-100 border-b lg:border-b-0 lg:border-r border-[#1e2a5a]/10 flex flex-col shrink-0 lg:h-full lg:overflow-y-auto z-30 shadow-xl shadow-black/10">
        
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
              { id: "caregivers", label: "Employees & Staff", icon: UserCheck },
              { id: "referrals", label: "Referral Network", icon: Gift, badge: referralsData?.summary?.totalPending || 0 },
              { id: "mtps", label: "MTP Registrations", icon: Briefcase, badge: mtps.filter(m => m.status === "Pending").length },
              { id: "users", label: "Patients", icon: Users },
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
        <header className="sticky top-0 z-20 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between gap-4 shrink-0">
          
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
        <main className="p-6 sm:p-8 flex-1 overflow-y-auto">
          
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
                <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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

                  {/* Patients Card */}
                  <div 
                    onClick={() => setActiveTab("users")}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card flex justify-between items-center relative overflow-hidden border-l-4 border-l-cyan-500 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Patients Registered</span>
                      <span className="text-2xl font-black font-display text-slate-950 mt-1 block">
                        {users.length}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">● Unique health profiles</span>
                    </div>
                    {renderCircularProgress(90, "#06b6d4", `${users.length}`)}
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
                          {cg.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{cg.name}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{cg.specialty}</span>
                          <span className="text-[9px] text-slate-450 font-medium block mt-0.5">{cg.phone}</span>
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
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Manage Bookings</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Total: {filteredBookings.length} booking records</p>
                </div>
                <button
                  onClick={() => openAddModal("booking")}
                  className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="h-4 w-4" /> Add New Booking
                </button>
              </div>

              {/* Quick Bookings Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-[#1e2a5a] rounded-xl shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bookings</span>
                    <span className="text-base font-extrabold text-[#1e2a5a] font-display">{bookings.length}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-amber-50 text-amber-800 rounded-xl shrink-0">
                    <Clock className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Unassigned Shifts</span>
                    <span className="text-base font-extrabold text-amber-800 font-display">
                      {bookings.filter(b => !b.assignedStaff && b.status !== "Cancelled").length}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-750 rounded-xl shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Shifts</span>
                    <span className="text-base font-extrabold text-emerald-700 font-display">
                      {bookings.filter(b => b.status === "Confirmed" || b.status === "Active").length}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-705 rounded-xl shrink-0">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Advance Revenue</span>
                    <span className="text-base font-extrabold text-emerald-800 font-display">
                      ₹{bookings.reduce((sum, b) => sum + Number(b.advancePaid || 0), 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Local Filter Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card grid gap-4 grid-cols-1 sm:grid-cols-4 items-center">
                <div className="relative col-span-1 sm:col-span-2">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Patient, Phone, Service, or Staff..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={bookingStartDate}
                    onChange={(e) => setBookingStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={bookingEndDate}
                    onChange={(e) => setBookingEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-500"
                  />
                  {(bookingSearch || bookingStartDate || bookingEndDate) && (
                    <button
                      onClick={() => {
                        setBookingSearch("");
                        setBookingStartDate("");
                        setBookingEndDate("");
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const filtered = bookings.filter((b) => {
                    // Search query filter
                    const q = bookingSearch.toLowerCase();
                    const matchesSearch = !bookingSearch || 
                      b.name.toLowerCase().includes(q) ||
                      b.phone.includes(q) ||
                      b.service.toLowerCase().includes(q) ||
                      (b.assignedStaff && b.assignedStaff.toLowerCase().includes(q));

                    // Date range filter
                    let matchesDate = true;
                    if (bookingStartDate || bookingEndDate) {
                      const bDate = new Date(b.date);
                      if (bookingStartDate) {
                        const start = new Date(bookingStartDate);
                        if (bDate < start) matchesDate = false;
                      }
                      if (bookingEndDate) {
                        const end = new Date(bookingEndDate);
                        if (bDate > end) matchesDate = false;
                      }
                    }

                    return matchesSearch && matchesDate;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 text-sm font-semibold premium-card">
                        No booking records matched your search and date filters.
                      </div>
                    );
                  }

                  return (
                    <div className="grid gap-4 grid-cols-1">
                      {filtered.map((b) => (
                        <div key={b.id} className="bg-white border border-slate-200/70 hover:border-[#c9a24c]/45 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center premium-card text-left">
                          
                          {/* Patient profile details */}
                          <div className="flex items-start gap-4 min-w-[260px] max-w-sm">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#1e2a5a] to-[#0f1530] text-white flex items-center justify-center font-black text-base shadow-md shadow-[#1e2a5a]/10 shrink-0 select-none">
                              {b.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-[200px]">
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-[#1e2a5a] text-sm sm:text-base leading-tight">{b.name}</h4>
                                <span className="text-[8px] font-bold text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                                  #{b.id}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400 shrink-0" /> {b.phone}
                              </div>
                              
                              {/* Address */}
                              <div className="text-[10px] text-slate-500 font-semibold italic truncate max-w-[200px]" title={b.address}>
                                {b.address}
                              </div>
                              
                              {/* Metadata Mini Card */}
                              {(b.patientName || b.patientNeeds) && (
                                <div className="mt-2.5 p-3 rounded-xl bg-slate-50/50 border border-slate-200/40 text-left space-y-1.5 max-w-xs">
                                  {b.patientName && (
                                    <div className="text-[10px] text-[#1e2a5a] font-extrabold flex items-center gap-1">
                                      👤 {b.patientName} ({b.patientAge} yrs)
                                    </div>
                                  )}
                                  {b.patientNeeds && (
                                    <div className="text-[9px] text-slate-500 leading-relaxed font-semibold italic">
                                      &ldquo;{b.patientNeeds}&rdquo;
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex gap-3 pt-1">
                                {b.googleMapLocation && (
                                  <a href={b.googleMapLocation} target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#c9a24c] font-black hover:underline flex items-center gap-0.5">
                                    🗺️ Map Location
                                  </a>
                                )}
                                {b.prescription && (
                                  <button
                                    type="button"
                                    onClick={() => openDocViewer(b.prescription, "Doctor Prescription / Case File", `${b.patientName || b.name} (Booking #${b.id})`, "Patient Medical Record")}
                                    className="text-[9px] text-teal-700 font-black hover:underline flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs cursor-pointer"
                                    title="Click to view full prescription / case file"
                                  >
                                    <Eye className="h-2.5 w-2.5 text-teal-600" />
                                    <span>Case File</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Service Details */}
                          <div className="space-y-1 min-w-[130px]">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Service Category</span>
                            <div className="font-extrabold text-slate-800 text-xs sm:text-sm leading-snug">{b.service}</div>
                            <span className="inline-block text-[9px] text-[#c9a24c] bg-[#c9a24c]/10 border border-[#c9a24c]/20 font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-1.5">{b.duration}</span>
                          </div>

                          {/* Date & Time */}
                          <div className="space-y-1 min-w-[120px]">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Shift Date &amp; Time</span>
                            <div className="font-extrabold text-slate-700 text-xs flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" /> {b.date}
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400 animate-pulse" /> {b.time}
                            </div>
                          </div>

                          {/* Assigned Nurse/Staff */}
                          <div className="space-y-1.5 min-w-[140px]">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Assigned Nurse/Staff</span>
                            {b.assignedStaff ? (
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#1e2a5a] to-[#0f1530] border border-slate-200/50 flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0">
                                  {b.assignedStaff.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-extrabold text-[#1e2a5a]">{b.assignedStaff}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg">
                                🚫 Unassigned
                              </span>
                            )}
                          </div>

                          {/* Status and Payouts */}
                          <div className="flex flex-row lg:flex-col items-center lg:items-start gap-4 min-w-[130px]">
                            <div className="space-y-1 text-left">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Booking Status</span>
                              <span className={`inline-block text-[9px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full border ${
                                b.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" :
                                b.status === "Completed" ? "bg-blue-50 text-blue-700 border-blue-200/60" :
                                b.status === "Cancelled" ? "bg-rose-50 text-rose-700 border-rose-200/60" :
                                "bg-amber-50 text-amber-700 border-amber-200/60"
                              }`}>
                                {b.status}
                              </span>
                            </div>
                            <div className="space-y-1 text-left">
                              <div className="text-xs font-black text-slate-800">Total: ₹{b.amount.toLocaleString()}</div>
                              
                              {/* Custom Advance vs Balance badge */}
                              {b.advancePaid !== undefined && Number(b.advancePaid) > 0 ? (
                                <div className="space-y-0.5 mt-1">
                                  <span className="inline-block text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    Adv: ₹{b.advancePaid.toLocaleString()}
                                  </span>
                                  {Number(b.balanceAmount) > 0 && (
                                    <span className="block text-[8px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                                      Bal: ₹{b.balanceAmount?.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={`inline-block text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                  b.paymentStatus === "Paid" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" 
                                    : "bg-amber-50 text-amber-700 border-amber-200/60"
                                }`}>
                                  {b.paymentStatus}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="flex gap-2 self-stretch lg:self-auto justify-end border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0 shrink-0">
                            <button
                              onClick={() => {
                                setIsRecordCaretakerPaymentMode(false);
                                openEditModal("booking", b);
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-[#c9a24c]/10 text-[#c9a24c] border border-slate-200 hover:border-[#c9a24c]/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:translate-y-[-1px] shadow-sm"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 text-rose-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all hover:translate-y-[-1px] shadow-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  );
                })()}
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
                  <table className="w-full text-left text-sm text-slate-700">
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
                                  {c.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-bold text-[#1e2a5a] font-display text-base leading-tight">{c.name}</div>
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

          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Patients</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Total: {filteredUsers.length} registered patients</p>
                </div>
              </div>

              {/* Local Filter Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card grid gap-4 grid-cols-1 sm:grid-cols-4 items-center">
                <div className="relative col-span-1 sm:col-span-2">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Patient name, phone, or email..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={patientStartDate}
                    onChange={(e) => setPatientStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={patientEndDate}
                    onChange={(e) => setPatientEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-500"
                  />
                  {(patientSearch || patientStartDate || patientEndDate) && (
                    <button
                      onClick={() => {
                        setPatientSearch("");
                        setPatientStartDate("");
                        setPatientEndDate("");
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-md shadow-slate-100/30 premium-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200/80 bg-[#1e2a5a]/5 text-xs text-[#1e2a5a] uppercase font-bold tracking-wider">
                        <th className="py-4 px-6">Patient Name</th>
                        <th className="py-4 px-6">Email Address</th>
                        <th className="py-4 px-6">Phone Number</th>
                        <th className="py-4 px-6">Registration Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const filtered = users.filter((u) => {
                          // Search query filter
                          const q = patientSearch.toLowerCase();
                          const matchesSearch = !patientSearch || 
                            u.name.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q) ||
                            u.phone.includes(q);

                          // Registration Date filter
                          let matchesDate = true;
                          if (patientStartDate || patientEndDate) {
                            const regDate = new Date(u.createdAt);
                            if (patientStartDate) {
                              const start = new Date(patientStartDate);
                              if (regDate < start) matchesDate = false;
                            }
                            if (patientEndDate) {
                              const end = new Date(patientEndDate);
                              if (regDate > end) matchesDate = false;
                            }
                          }

                          return matchesSearch && matchesDate;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 text-sm font-semibold">
                                No registered patients matched your search and date filters.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-[#1e2a5a] font-display text-base">
                              {u.name}
                            </td>
                            <td className="py-4 px-6 text-slate-650 font-medium">
                              {u.email}
                            </td>
                            <td className="py-4 px-6 text-slate-650 font-semibold">
                              {u.phone}
                            </td>
                            <td className="py-4 px-6 text-xs text-slate-400 font-bold">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setSelectedUserForDetails(u)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-[#c9a24c]/15 text-[#c9a24c] border border-slate-200 hover:border-[#c9a24c]/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                >
                                  👁️ View Details
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 text-rose-500 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Remove Account
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Patient Details Overlay Modal */}
              {selectedUserForDetails && (() => {
                const u = selectedUserForDetails;
                // Filter all bookings of this patient by phone or name
                const userBookings = bookings.filter(b => 
                  b.phone === u.phone || 
                  b.name.toLowerCase() === u.name.toLowerCase()
                );
                
                const totalSpent = userBookings
                  .filter(b => b.paymentStatus === "Paid")
                  .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

                return (
                  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 text-left border border-slate-200">
                      
                      {/* Modal Header */}
                      <div className="bg-gradient-to-r from-[#1e2a5a] to-[#121936] p-6 flex justify-between items-center border-b border-[#c9a24c]/20">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#c9a24c] to-[#e5c06b] flex items-center justify-center font-black text-2xl text-[#1e2a5a] shadow-md border border-white/20 shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xl tracking-tight text-white font-display">{u.name}</h4>
                            <p className="text-xs text-slate-300 mt-1.5 font-semibold">{u.email} • {u.phone}</p>
                          </div>
                        </div>
                        <button 
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
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Bookings</span>
                            <span className="text-xl font-black text-[#1e2a5a] mt-1 block">{userBookings.length}</span>
                          </div>
                          <div className="bg-white border border-slate-200/80 border-l-4 border-l-emerald-500 rounded-xl p-4 shadow-sm text-center">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Completed Shifts</span>
                            <span className="text-xl font-black text-emerald-600 mt-1 block">
                              {userBookings.filter(b => b.status === "Completed").length}
                            </span>
                          </div>
                          <div className="bg-white border border-slate-200/80 border-l-4 border-l-[#c9a24c] rounded-xl p-4 shadow-sm text-center">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Paid Value</span>
                            <span className="text-xl font-black text-[#c9a24c] mt-1 block">₹{totalSpent.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Booking Logs History list */}
                        <div className="space-y-3">
                          <div className="border-b border-slate-100 pb-2 mb-3">
                            <h5 className="text-xs font-bold text-[#1e2a5a] uppercase tracking-wider">Historical Booking Logs</h5>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Audit records of patient medical shift allocations.</span>
                          </div>
                          
                          <div className="space-y-3">
                            {userBookings.map((b) => (
                              <div key={b.id} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3 hover:border-[#c9a24c]/30 transition-colors">
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
                                    <span>Assigned Nurse:</span>
                                    <span className="font-bold text-[#1e2a5a]">{b.assignedStaff}</span>
                                  </div>
                                )}

                                {b.patientNeeds && (
                                  <div className="text-[10px] text-slate-650 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                                    <span className="font-bold text-slate-700">Patient Needs:</span> {b.patientNeeds}
                                  </div>
                                )}

                                <div className="flex gap-3 text-[10px] border-t border-slate-50 pt-2">
                                  {b.googleMapLocation && (
                                    <a href={b.googleMapLocation} target="_blank" rel="noopener noreferrer" className="text-[#c9a24c] font-bold hover:underline">
                                      🗺️ Map Location
                                    </a>
                                  )}
                                  {b.prescription && (
                                    <button
                                      type="button"
                                      onClick={() => openDocViewer(b.prescription, "Doctor Prescription / Case File", `${b.patientName || b.name} (Booking #${b.id})`, "Patient Medical Record")}
                                      className="text-teal-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                      <Eye className="h-3 w-3" />
                                      <span>📄 Case File / Prescription</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}

                            {userBookings.length === 0 && (
                              <p className="text-center text-xs text-slate-400 italic py-6 bg-white border border-slate-200/80 rounded-2xl">No historical shift logs found for this patient.</p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Modal Footer */}
                      <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
                        <button
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
          )}

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
                    const count = bookings.filter(b => filter === "all" ? true : b.paymentStatus === filter).length;
                    return (
                      <button
                        key={filter}
                        onClick={() => setSearchQuery(filter === "all" ? "" : filter)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-white hover:shadow-sm text-slate-600 hover:text-[#1e2a5a] transition-all cursor-pointer capitalize"
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
                    ₹{bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-100/30 premium-card">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Paid (Collected)</span>
                  <span className="text-2xl font-extrabold font-display text-emerald-600 mt-1 block">
                    ₹{bookings.filter(b => b.paymentStatus === "Paid").reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-100/30 premium-card">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Outstanding (Unpaid)</span>
                  <span className="text-2xl font-extrabold font-display text-amber-600 mt-1 block">
                    ₹{bookings.filter(b => b.paymentStatus !== "Paid").reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Local Filter Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card grid gap-4 grid-cols-1 sm:grid-cols-4 items-center">
                <div className="relative col-span-1 sm:col-span-2">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Customer, Phone, Service, or Status..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={paymentStartDate}
                    onChange={(e) => setPaymentStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={paymentEndDate}
                    onChange={(e) => setPaymentEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none bg-slate-50/50 focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] text-xs font-bold text-slate-500"
                  />
                  {(paymentSearch || paymentStartDate || paymentEndDate) && (
                    <button
                      onClick={() => {
                        setPaymentSearch("");
                        setPaymentStartDate("");
                        setPaymentEndDate("");
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Payments Table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-md shadow-slate-100/30 overflow-hidden premium-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
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
                            b.name.toLowerCase().includes(q) ||
                            b.phone.includes(q) ||
                            b.service.toLowerCase().includes(q) ||
                            b.paymentStatus.toLowerCase().includes(q);

                          // Date range filter
                          let matchesDate = true;
                          if (paymentStartDate || paymentEndDate) {
                            const bDate = new Date(b.date);
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
                              <div className="font-bold text-[#1e2a5a] font-display text-base leading-tight">{b.name}</div>
                              <div className="text-xs text-slate-400 mt-1 font-semibold">{b.phone}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-semibold text-slate-800">{b.service}</div>
                              <div className="text-[10px] text-slate-400 mt-1 font-medium">{b.date} • {b.time}</div>
                            </td>
                            <td className="py-4 px-6 font-extrabold text-slate-900 text-sm">
                              ₹{Number(b.amount).toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-1 rounded border ${
                                b.paymentStatus === "Paid" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" 
                                  : "bg-amber-50 text-amber-700 border-amber-200/60"
                              }`}>
                                {b.paymentStatus}
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
                              <button
                                onClick={() => {
                                 setIsRecordCaretakerPaymentMode(false);
                                 openEditModal("booking", b);
                               }}
                                className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-[#c9a24c]/15 text-[#c9a24c] hover:border-[#c9a24c]/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors inline-flex"
                              >
                                <Edit3 className="h-3.5 w-3.5" /> Record Payment
                              </button>
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
                  const cgBookings = bookings.filter(b => b.assignedStaff === cg.name);
                  const earned = cgBookings.filter(b => b.status === "Completed").reduce((sum, b) => sum + getPayoutValue(b), 0);
                  const paid = cgBookings.filter(b => b.status === "Completed" && b.caretakerPayoutStatus === "Paid").reduce((sum, b) => sum + getPayoutValue(b), 0);
                  const unpaid = earned - paid;

                  const filteredLedgerBookings = cgBookings.filter(b => {
                    const q = ledgerSearch.toLowerCase();
                    const matchesSearch = !ledgerSearch || 
                      b.name.toLowerCase().includes(q) || 
                      b.service.toLowerCase().includes(q) ||
                      (b.phone && b.phone.includes(q));

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
                          <table className="w-full text-left text-sm text-slate-700">
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
                                  cg.name.toLowerCase().includes(q) || 
                                  cg.specialty.toLowerCase().includes(q) ||
                                  refCode.includes(q) ||
                                  (cg.uniqueId && cg.uniqueId.toLowerCase().includes(q));
                              })
                              .map((cg) => {
                                const cgBookings = bookings.filter(b => b.assignedStaff === cg.name);
                                const completed = cgBookings.filter(b => b.status === "Completed");
                                const earned = completed.reduce((sum, b) => sum + getPayoutValue(b), 0);
                                const paid = completed.filter(b => b.caretakerPayoutStatus === "Paid").reduce((sum, b) => sum + getPayoutValue(b), 0);
                                const unpaid = earned - paid;

                                return (
                                  <tr key={cg.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                      <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#1e2a5a]/10 to-[#1e2a5a]/5 flex items-center justify-center font-bold text-base text-[#1e2a5a] border border-[#1e2a5a]/10 shrink-0">
                                          {cg.name.charAt(0)}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <div className="font-extrabold text-[#1e2a5a] text-sm leading-tight">{cg.name}</div>
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
                            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded w-fit shrink-0">{service.price}</span>
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
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                
                {/* Notification dispatcher form */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/30 md:col-span-1 h-fit premium-card">
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display mb-4">Send Alert Notification</h3>
                  
                  <form onSubmit={handleModalSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Recipient Target</label>
                      <input 
                        type="text"
                        required
                        value={notifRecipient}
                        onChange={(e) => setNotifRecipient(e.target.value)}
                        placeholder="e.g. All Users, email@test.com"
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-background outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] transition-all bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Delivery Method</label>
                      <select
                        value={notifType}
                        onChange={(e) => setNotifType(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-background outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] cursor-pointer bg-slate-50/50"
                      >
                        <option value="Email">Email Message</option>
                        <option value="SMS">SMS / WhatsApp Alert</option>
                        <option value="Broadcast">Broadcast Dashboard Alert</option>
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

                    <button
                      type="submit"
                      disabled={isLoading}
                      onClick={() => setModalType("notification")}
                      className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
                    >
                      <Send className="h-4 w-4" /> Send Dispatch
                    </button>
                  </form>
                </div>

                {/* Notifications Dispatch Logs */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/30 md:col-span-2 premium-card">
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display mb-4">Dispatched Alerts Log</h3>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {filteredNotifications.map((notif) => (
                      <div key={notif.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-center gap-2 text-[10px] font-bold text-slate-400 mb-2">
                          <span className="text-[#1e2a5a] bg-[#1e2a5a]/5 border border-[#1e2a5a]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">{notif.type}</span>
                          <span>{new Date(notif.sentAt).toLocaleString()}</span>
                        </div>
                        <div className="text-sm font-bold text-[#1e2a5a] mb-1">To: {notif.recipient}</div>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">{notif.message}</p>
                      </div>
                    ))}
                    {filteredNotifications.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-10 font-bold">No notification logs recorded.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

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
                                      href={`https://wa.me/91${m.phone.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(m.name)},%20this%20is%20Amma%20Seva%20regarding%20your%20MTP%20registration.`}
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
                                {m.roles && (
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
                            <div className="text-slate-500">{selectedMTPDetail.city || "Hyderabad"}</div>
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
              const matchesSearch = 
                c.name.toLowerCase().includes(referralsSearch.toLowerCase()) ||
                c.phone.includes(referralsSearch) ||
                c.email.toLowerCase().includes(referralsSearch.toLowerCase()) ||
                c.specialty.toLowerCase().includes(referralsSearch.toLowerCase()) ||
                c.referrerName.toLowerCase().includes(referralsSearch.toLowerCase()) ||
                c.referrerCode.toLowerCase().includes(referralsSearch.toLowerCase()) ||
                (c.city && c.city.toLowerCase().includes(referralsSearch.toLowerCase()));
              
              const matchesStatus = referralsStatusFilter === "All" || c.status === referralsStatusFilter;
              return matchesSearch && matchesStatus;
            });

            // Filter referrers
            const filteredReferrers = referrersList.filter(r => {
              const matchesSearch = 
                r.name.toLowerCase().includes(referralsSearch.toLowerCase()) ||
                r.phone.includes(referralsSearch) ||
                r.referCode.toLowerCase().includes(referralsSearch.toLowerCase()) ||
                r.specialty.toLowerCase().includes(referralsSearch.toLowerCase()) ||
                r.referees.some(ref => ref.name.toLowerCase().includes(referralsSearch.toLowerCase()));
              
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
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
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
                      <table className="w-full text-left text-sm text-slate-700">
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
                                        {c.name.charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-bold text-[#1e2a5a] text-sm">{c.name}</div>
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
                      <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                        <Users className="h-3.5 w-3.5 text-[#c9a24c]" /> Customer &amp; Schedule Details
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Customer Name *</label>
                          <input 
                            type="text" required value={bookingName} onChange={e => setBookingName(e.target.value)}
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 disabled:opacity-70 disabled:bg-slate-100/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Phone Number *</label>
                          <input 
                            type="tel" required value={bookingPhone} onChange={e => setBookingPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                            placeholder="10-digit number"
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 font-mono disabled:opacity-70 disabled:bg-slate-100/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Service Type *</label>
                          <select 
                            value={bookingService} onChange={e => setBookingService(e.target.value)}
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 cursor-pointer disabled:opacity-70 disabled:bg-slate-100/50"
                          >
                            {services.map(s => (
                              <option key={s.id} value={s.title}>{s.title} ({s.price})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Duration Shift</label>
                          <select 
                            value={bookingDuration} onChange={e => setBookingDuration(e.target.value)}
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 cursor-pointer disabled:opacity-70 disabled:bg-slate-100/50"
                          >
                            <option value="Hourly">Hourly visit</option>
                            <option value="Daily">Daily shift</option>
                            <option value="Weekly">Weekly log</option>
                            <option value="Monthly">Monthly companion</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Booking Date</label>
                          <input 
                            type="date" required value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 disabled:opacity-70 disabled:bg-slate-100/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Time</label>
                          <input 
                            type="text" required placeholder="e.g. 09:00 AM" value={bookingTime} onChange={e => setBookingTime(e.target.value)}
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs font-semibold text-slate-800 disabled:opacity-70 disabled:bg-slate-100/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Patient Location Address</label>
                        <textarea 
                          required rows={2} value={bookingAddress} onChange={e => setBookingAddress(e.target.value)}
                          disabled={isRecordCaretakerPaymentMode}
                          placeholder="Complete door address, flat/plot, landmark..."
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] bg-white text-xs text-slate-800 resize-none disabled:opacity-70 disabled:bg-slate-100/50"
                        />
                      </div>
                    </div>

                    {/* Right Column: Financials, Caregiver Payout & Assignments */}
                    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                      <div className="text-[11px] font-extrabold text-[#1e2a5a] uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                        <DollarSign className="h-3.5 w-3.5 text-[#c9a24c]" /> Payout &amp; Assignment Status
                      </div>

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
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Assign Staff</label>
                          <select 
                            value={bookingAssignedStaff} onChange={e => setBookingAssignedStaff(e.target.value)}
                            disabled={isRecordCaretakerPaymentMode}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none bg-white text-xs font-semibold text-slate-800 cursor-pointer disabled:opacity-70"
                          >
                            <option value="">-- Unassigned --</option>
                            {caregivers
                              .filter(c => c.status === "Verified")
                              .map(c => (
                                <option key={c.id} value={c.name}>{c.name} — [{getCaregiverReferralCode(c)}] ({c.specialty})</option>
                              ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Client Payment</label>
                          <select 
                            value={bookingPaymentStatus} onChange={e => setBookingPaymentStatus(e.target.value)}
                            disabled={isRecordCaretakerPaymentMode}
                            className={`w-full px-3 py-1.5 border rounded-xl outline-none text-xs font-extrabold cursor-pointer ${
                              bookingPaymentStatus === "Paid" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>
                      </div>

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
                            type="text" required value={caregiverName} onChange={e => setCaregiverName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-[#c9a24c] focus:border-[#c9a24c] bg-white text-xs font-semibold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Phone Number *</label>
                          <input 
                            type="tel" required value={caregiverPhone} onChange={e => setCaregiverPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
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
                  onClick={() => handleUpdateCaregiverStatus(selectedCandidateDetail.id, "Verified")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Approve &amp; Verify Staff
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateCaregiverStatus(selectedCandidateDetail.id, "Pending")}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Clock className="h-4 w-4" /> Mark Pending
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateCaregiverStatus(selectedCandidateDetail.id, "Rejected")}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <XCircle className="h-4 w-4" /> Reject
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
