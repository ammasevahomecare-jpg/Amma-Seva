import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { DocumentViewerModal } from "@/components/DocumentViewerModal";
import { validateName, validatePhone, validateEmail, validateAddress, sanitizeIndianPhone, sanitizeName } from "@/lib/validation";
import { fetchServices, type Service } from "../lib/services";
import { 
  Calendar, Clock, MapPin, User, Users, FileText, CheckCircle2, 
  AlertTriangle, RefreshCw, XCircle, Download, CreditCard, 
  Phone, Briefcase, ChevronRight, Check, DollarSign, QrCode, Upload,
  Star, MessageSquare, Eye, Gift, Copy, Send, Share2, ExternalLink, Sparkles,
  Shield, ArrowRight, ShieldCheck, Filter, Search, RotateCcw
} from "lucide-react";

// Helper to compute / format Referral Code (FIRSTNAME + LAST 4 DIGITS OF PHONE)
function getCaregiverReferralCode(c: { name?: string; phone?: string; uniqueId?: string; referCode?: string; referralCode?: string } | null | undefined): string {
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

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const sortShiftsOrBookings = (list: any[]) => {
  return [...list].sort((a, b) => {
    const aFinished = (a.status === "Completed" || a.status === "Cancelled") ? 1 : 0;
    const bFinished = (b.status === "Completed" || b.status === "Cancelled") ? 1 : 0;
    if (aFinished !== bFinished) {
      return aFinished - bFinished;
    }
    return b.id - a.id;
  });
};

const filterShiftsOrBookings = (list: any[], search: string, startDate: string, endDate: string) => {
  let filtered = list;

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(item => {
      const service = (item.service || "").toLowerCase();
      const name = (item.name || item.patientName || "").toLowerCase();
      const phone = (item.phone || "").toLowerCase();
      const email = (item.email || item.customerEmail || "").toLowerCase();
      const address = (item.address || "").toLowerCase();
      const needs = (item.patientNeeds || "").toLowerCase();
      
      return service.includes(q) || 
             name.includes(q) || 
             phone.includes(q) || 
             email.includes(q) || 
             address.includes(q) || 
             needs.includes(q);
    });
  }

  if (startDate) {
    filtered = filtered.filter(item => item.date >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(item => item.date <= endDate);
  }

  return filtered;
};

const formatStepTime = (isoString?: string) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) + 
           " at " + 
           d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch (e) {
    return "";
  }
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Customer Dashboard — Amma Seva" },
      { name: "description", content: "Book healthcare services, reschedule visits, track caregiver status, and view invoices." }
    ],
  }),
  component: CustomerDashboard,
});

interface UserDetails {
  id: number;
  name: string;
  email: string;
  phone: string;
}

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
  caregiverDetails?: {
    name: string;
    phone: string;
    email?: string;
    specialty: string;
    experience: number;
    profilePhoto?: string;
    experienceDetails?: string;
  };
}

const SERVICES_CATALOG: any[] = [];

function CustomerDashboard() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const userToken = localStorage.getItem("ammaseva_user_token");
    const userDetails = localStorage.getItem("ammaseva_user_details");
    const caretakerToken = localStorage.getItem("ammaseva_caretaker_token");
    const caretakerDetails = localStorage.getItem("ammaseva_caretaker_details");
    return !!(userToken && userDetails) || !!(caretakerToken && caretakerDetails);
  });

  const handleLogout = () => {
    localStorage.removeItem("ammaseva_user_token");
    localStorage.removeItem("ammaseva_user_details");
    localStorage.removeItem("ammaseva_caretaker_token");
    localStorage.removeItem("ammaseva_caretaker_details");
    setIsAuthenticated(false);
    navigate({ to: "/login" });
  };

  const [user, setUser] = useState<UserDetails | null>(null);
  
  // Role selection
  const [isCaretaker, setIsCaretaker] = useState(false);
  const [caretaker, setCaretaker] = useState<any | null>(null);

  // Caretaker form states
  const [caretakerName, setCaretakerName] = useState("");
  const [caretakerPhone, setCaretakerPhone] = useState("");
  const [caretakerSpecialty, setCaretakerSpecialty] = useState("Elderly Care");
  const [caretakerExperience, setCaretakerExperience] = useState("3");
  const [servicesList, setServicesList] = useState<any[]>(SERVICES_CATALOG);
  const [caretakerExperienceDetails, setCaretakerExperienceDetails] = useState("");
  const [caretakerWorkingLocations, setCaretakerWorkingLocations] = useState("");
  const [caretakerAvailableTimings, setCaretakerAvailableTimings] = useState("");
  const [caretakerAadhaar, setCaretakerAadhaar] = useState("");
  const [caretakerPan, setCaretakerPan] = useState("");
  const [caretakerCertificates, setCaretakerCertificates] = useState("");
  const [caretakerProfilePhoto, setCaretakerProfilePhoto] = useState("");
  
  const [caretakerExperienceCertificate, setCaretakerExperienceCertificate] = useState("");
  const [caretakerPoliceVerification, setCaretakerPoliceVerification] = useState("");
  const [caretakerAdditionalCertificates, setCaretakerAdditionalCertificates] = useState("");
  
  const [caretakerState, setCaretakerState] = useState("");
  const [caretakerCity, setCaretakerCity] = useState("");
  const [caretakerGoogleMapLocation, setCaretakerGoogleMapLocation] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  const [isCaretakerSaving, setIsCaretakerSaving] = useState(false);
  const [caretakerError, setCaretakerError] = useState<string | null>(null);
  const [caretakerSuccess, setCaretakerSuccess] = useState<string | null>(null);

  // Caretaker file upload helper
  const handleCaretakerFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFileState: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileState(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch announcements helper
  const fetchAnnouncements = async (role: 'user' | 'caretaker') => {
    const token = localStorage.getItem(role === 'caretaker' ? "ammaseva_caretaker_token" : "ammaseva_user_token");
    if (!token) return;
    try {
      const res = await fetch("/api/announcements", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    }
  };

  // Fetch caretaker assigned bookings
  const fetchCaretakerBookings = async () => {
    const token = localStorage.getItem("ammaseva_caretaker_token");
    if (!token) return;
    setIsLoading(true);
    setDashboardError(null);
    try {
      const res = await fetch("/api/caretaker/bookings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load assigned shifts.");
      }
      setCaretakerBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setDashboardError(err.message || "Failed to load assigned shifts.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveVitalsAndLogs = async (bookingId: number, currentBooking: any) => {
    const token = localStorage.getItem("ammaseva_caretaker_token");
    if (!token) return;
    setIsSavingLog(true);
    const vitalsObj = {
      bloodPressure: vitalBP,
      pulseRate: `${vitalPulse} bpm`,
      bodyTemp: `${vitalTemp} °F`,
      bloodGlucose: `${vitalSugar} mg/dL`,
      updatedAt: new Date().toISOString()
    };
    let logsArray: any[] = [];
    if (currentBooking.careLogs) {
      try {
        logsArray = typeof currentBooking.careLogs === 'string' 
          ? JSON.parse(currentBooking.careLogs) 
          : currentBooking.careLogs;
      } catch (e) {
        logsArray = [];
      }
    }
    if (!Array.isArray(logsArray)) logsArray = [];
    if (logMessage.trim()) {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeStr = `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
      logsArray.push({
        time: timeStr,
        text: logMessage.trim(),
        loggedAt: now.toISOString()
      });
    }
    try {
      const res = await fetch(`/api/booking/${bookingId}/vitals-log`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          vitals: vitalsObj,
          careLogs: logsArray
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update vitals and progress logs.");
      }
      alert("Shift vitals and care logs updated successfully!");
      setLogMessage("");
      setActiveLogShiftId(null);
      fetchCaretakerBookings();
    } catch (err: any) {
      alert(err.message || "Failed to update logs.");
    } finally {
      setIsSavingLog(false);
    }
  };

  // Fetch caretaker profile
  const fetchCaretakerProfile = async () => {
    const token = localStorage.getItem("ammaseva_caretaker_token");
    if (!token) return;
    setIsLoading(true);
    setCaretakerError(null);
    try {
      const res = await fetch("/api/caretaker/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load profile.");
      }
      const details = data.details;
      setCaretaker(details);
      setCaretakerReviews(details.reviews || []);
      setCaretakerAvgRating(details.rating !== undefined ? details.rating : 0);
      setCaretakerName(details.name || "");
      setCaretakerPhone(details.phone || "");
      setCaretakerSpecialty(details.specialty || "Elderly Care");
      setCaretakerExperience(String(details.experience || "3"));
      setCaretakerExperienceDetails(details.experienceDetails || "");
      setCaretakerWorkingLocations(details.workingLocations || "");
      setCaretakerAvailableTimings(details.availableTimings || "");
      setCaretakerAadhaar(details.aadhaar || "");
      setCaretakerPan(details.pan || "");
      setCaretakerCertificates(details.certificates || "");
      setCaretakerProfilePhoto(details.profilePhoto || "");
      setCaretakerState(details.state || "");
      setCaretakerCity(details.city || "");
      setCaretakerGoogleMapLocation(details.googleMapLocation || "");
      setCaretakerExperienceCertificate(details.experienceCertificate || "");
      setCaretakerPoliceVerification(details.policeVerification || "");
      setCaretakerAdditionalCertificates(details.additionalCertificates || "");
    } catch (err: any) {
      setCaretakerError(err.message || "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch caretaker referrals network intelligence
  const fetchCaretakerReferrals = async () => {
    const token = localStorage.getItem("ammaseva_caretaker_token");
    if (!token) return;
    setIsLoadingReferrals(true);
    try {
      const res = await fetch("/api/caretaker/referrals", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setCaretakerReferralsData(data);
      }
    } catch (err) {
      console.error("Failed to load caretaker referrals:", err);
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  // Save caretaker details
  const handleCaretakerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCaretakerError(null);
    setCaretakerSuccess(null);

    const nameErr = validateName(caretakerName, "Full name");
    if (nameErr) {
      setCaretakerError(nameErr);
      return;
    }

    const phoneErr = validatePhone(caretakerPhone, "Phone number");
    if (phoneErr) {
      setCaretakerError(phoneErr);
      return;
    }

    if (!caretakerExperienceDetails.trim() || caretakerExperienceDetails.trim().length < 5) {
      setCaretakerError("Please provide experience and skills summary (at least 5 characters).");
      return;
    }

    if (!caretakerWorkingLocations.trim()) {
      setCaretakerError("Please enter preferred working locations/localities.");
      return;
    }

    if (!caretakerAvailableTimings.trim()) {
      setCaretakerError("Please enter available shift timings.");
      return;
    }

    if (!caretakerState.trim()) {
      setCaretakerError("Please select State.");
      return;
    }

    if (!caretakerCity.trim() || caretakerCity.trim().length < 2) {
      setCaretakerError("Please enter City.");
      return;
    }

    setIsCaretakerSaving(true);
    try {
      const token = localStorage.getItem("ammaseva_caretaker_token");
      const res = await fetch("/api/caretaker/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: caretakerName,
          phone: caretakerPhone,
          specialty: caretakerSpecialty,
          experience: Number(caretakerExperience),
          experienceDetails: caretakerExperienceDetails,
          workingLocations: caretakerWorkingLocations,
          availableTimings: caretakerAvailableTimings,
          aadhaar: caretakerAadhaar,
          pan: caretakerPan,
          certificates: caretakerCertificates,
          profilePhoto: caretakerProfilePhoto,
          state: caretakerState,
          city: caretakerCity,
          googleMapLocation: caretakerGoogleMapLocation,
          experienceCertificate: caretakerExperienceCertificate,
          policeVerification: caretakerPoliceVerification,
          additionalCertificates: caretakerAdditionalCertificates
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }
      setCaretakerSuccess("Profile successfully updated!");
      setCaretaker(data.details);
      // Update local storage too so headers display correct name
      localStorage.setItem("ammaseva_caretaker_details", JSON.stringify(data.details));
      setTimeout(() => setCaretakerSuccess(null), 3000);
    } catch (err: any) {
      setCaretakerError(err.message || "Failed to save profile.");
    } finally {
      setIsCaretakerSaving(false);
    }
  };

  // View states
  const [activeView, setActiveView] = useState<"bookings" | "new-booking">(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("service") || urlParams.get("book") === "true") {
        return "new-booking";
      }
    }
    return "bookings";
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [caretakerBookings, setCaretakerBookings] = useState<Booking[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Submit Review States
  const [submittingReviewBookingId, setSubmittingReviewBookingId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  // Caretaker dashboard filter states
  const [caretakerSearch, setCaretakerSearch] = useState("");
  const [caretakerStartDate, setCaretakerStartDate] = useState("");
  const [caretakerEndDate, setCaretakerEndDate] = useState("");
  const [caretakerReviews, setCaretakerReviews] = useState<any[]>([]);
  const [caretakerAvgRating, setCaretakerAvgRating] = useState<number>(5);
  // Customer dashboard filter states
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerStartDate, setCustomerStartDate] = useState("");
  const [customerEndDate, setCustomerEndDate] = useState("");
  const [expandedBookingIds, setExpandedBookingIds] = useState<Record<number, boolean>>({});

  // New Booking State
  const [selectedServiceId, setSelectedServiceId] = useState("elderly");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingDuration, setBookingDuration] = useState("Daily");
  const [durationCount, setDurationCount] = useState<number>(1);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingAddress, setBookingAddress] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientNeeds, setPatientNeeds] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pay_later" | "razorpay">("razorpay");
  
  const [prescriptionFile, setPrescriptionFile] = useState("");
  const [bookingGoogleMapLocation, setBookingGoogleMapLocation] = useState("");
  const [isFetchingLocationBooking, setIsFetchingLocationBooking] = useState(false);
  const [agreeTermsBooking, setAgreeTermsBooking] = useState(false);

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

  const openDocViewer = (docUrl?: string | null, docTitle = "Medical Document", applicantName = "", category = "Patient Medical Record") => {
    if (!docUrl) return;
    setDocViewerState({
      isOpen: true,
      docUrl,
      docTitle,
      applicantName,
      category,
    });
  };
 
  // Booking result/modals state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);
 
  // Action Modals State
  const [rescheduleBookingId, setRescheduleBookingId] = useState<number | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBookingId, setEditBookingId] = useState<number | null>(null);
  const [editPatientName, setEditPatientName] = useState("");
  const [editPatientAge, setEditPatientAge] = useState("");
  const [editPatientNeeds, setEditPatientNeeds] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editGoogleMapLocation, setEditGoogleMapLocation] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [activeInvoice, setActiveInvoice] = useState<Booking | null>(null);
  const [activeLogShiftId, setActiveLogShiftId] = useState<number | null>(null);
  const [vitalBP, setVitalBP] = useState("120/80");
  const [vitalPulse, setVitalPulse] = useState("72");
  const [vitalTemp, setVitalTemp] = useState("98.4");
  const [vitalSugar, setVitalSugar] = useState("115");
  const [logMessage, setLogMessage] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [activeCaregiverTab, setActiveCaregiverTab] = useState("shifts");
  const hasServiceParam = !!(new URLSearchParams(window.location.search).get("service"));

  // Caretaker Referral Network State
  const [caretakerReferralsData, setCaretakerReferralsData] = useState<{
    referCode: string;
    totalJoined: number;
    totalVerified: number;
    totalPending: number;
    members: any[];
  } | null>(null);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
 
  // Check login on mount
  useEffect(() => {
    const userToken = localStorage.getItem("ammaseva_user_token");
    const userDetails = localStorage.getItem("ammaseva_user_details");
    const caretakerToken = localStorage.getItem("ammaseva_caretaker_token");
    const caretakerDetails = localStorage.getItem("ammaseva_caretaker_details");
 
    if (caretakerToken && caretakerDetails) {
      setIsCaretaker(true);
      const parsedCaretaker = JSON.parse(caretakerDetails);
      setCaretaker(parsedCaretaker);
      fetchCaretakerProfile();
      fetchCaretakerBookings();
      fetchCaretakerReferrals();
      fetchAnnouncements('caretaker');
      if (parsedCaretaker.status !== "Verified") {
        setActiveCaregiverTab("profile");
      } else {
        setActiveCaregiverTab("shifts");
      }
    } else if (userToken && userDetails) {
      setIsCaretaker(false);
      setUser(JSON.parse(userDetails));
      fetchAnnouncements('user');
    } else {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  useEffect(() => {
    if (isCaretaker && activeCaregiverTab === "referrals") {
      fetchCaretakerReferrals();
    }
  }, [activeCaregiverTab, isCaretaker]);
 
  // Load dynamic services for specialty dropdown and booking catalog
  useEffect(() => {
    fetchServices().then((list) => {
      const formatted = list.map((s) => {
        let rate = 1200;
        const matches = s.pricing?.replace(/,/g, '').match(/\d+/);
        if (matches) {
          rate = Number(matches[0]);
        }

        // Determine price basis unit from the pricing string (e.g. ₹900 / day -> day)
        let unit = "day";
        const priceStr = (s.pricing || "").toLowerCase();
        if (priceStr.includes("month")) {
          unit = "month";
        } else if (priceStr.includes("hour")) {
          unit = "hour";
        } else if (priceStr.includes("week")) {
          unit = "week";
        } else if (priceStr.includes("day") || priceStr.includes("visit") || priceStr.includes("session") || priceStr.includes("consultation")) {
          unit = "day";
        } else {
          // fallback to duration if pricing string doesn't specify unit
          const durStr = (s.duration || "").toLowerCase();
          if (durStr.includes("month")) unit = "month";
          else if (durStr.includes("hour")) unit = "hour";
          else if (durStr.includes("week")) unit = "week";
          else if (durStr.includes("task")) unit = "task";
          else unit = "day";
        }

        const isMtpService = !!s.isMtp || s.slug.startsWith("mtp") || (s.category && s.category.toLowerCase().includes("mtp"));

        return {
          id: s.slug,
          title: s.title,
          rate: isMtpService ? 0 : rate,
          unit: isMtpService ? "task" : unit,
          desc: s.short || s.description,
          advance: isMtpService ? 0 : (s.advance !== undefined ? Number(s.advance) : Math.round(rate * 0.2)),
          isMtp: isMtpService,
          category: s.category || (isMtpService ? "MTP & Companion Tasks" : "Standard Care"),
          pricing: s.pricing || (isMtpService ? "Pay on Service / Custom Quote" : undefined)
        };
      });
      if (formatted.length > 0) {
        setServicesList(formatted);
        
        // Pre-select service from URL query params if present
        const urlParams = new URLSearchParams(window.location.search);
        const preSelectedService = urlParams.get("service");
        const matchingService = formatted.find(s => s.id === preSelectedService || (preSelectedService && s.id.startsWith(preSelectedService)));
        if (matchingService) {
          setSelectedServiceId(matchingService.id);
          setActiveView("new-booking");
        } else {
          setSelectedServiceId(formatted[0].id);
        }
      }
    });
  }, []);

  // Load Razorpay checkout script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);
 
  // Fetch customer bookings
  const fetchBookings = async () => {
    const token = localStorage.getItem("ammaseva_user_token");
    if (!token) return;
    setIsLoading(true);
    setDashboardError(null);
    try {
      const res = await fetch("/api/user/bookings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load bookings log.");
      }
      setBookings(data);
    } catch (err: any) {
      setDashboardError(err.message || "Failed to load dashboard logs.");
    } finally {
      setIsLoading(false);
    }
  };
 
  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, activeView]);

  // Automatically adjust billing option based on selected service's pricing unit
  useEffect(() => {
    const current = servicesList.find(s => s.id === selectedServiceId) || servicesList[0];
    if (!current) return;
    if (current.isMtp || (selectedServiceId && selectedServiceId.startsWith("mtp"))) {
      setBookingDuration("Daily");
      setDurationCount(1);
      return;
    }
    const unit = (current.unit || 'day').toLowerCase();
    if (unit.includes('month')) {
      setBookingDuration("Monthly");
    } else if (unit.includes('hour')) {
      setBookingDuration("Hourly");
    } else if (unit.includes('week')) {
      setBookingDuration("Weekly");
    } else {
      setBookingDuration("Daily");
    }
    setDurationCount(1);
  }, [selectedServiceId, servicesList]);
 
  // Calculate pricing
  const currentService = servicesList.find(s => s.id === selectedServiceId) || SERVICES_CATALOG.find(s => s.id === selectedServiceId) || servicesList[0] || SERVICES_CATALOG[0];
  
  const getServiceRates = () => {
    if (!currentService) return { hourly: 0, daily: 0, weekly: 0, monthly: 0, basis: 'day' };
    if (currentService.isMtp || (selectedServiceId && selectedServiceId.startsWith("mtp"))) {
      return { hourly: 0, daily: 0, weekly: 0, monthly: 0, basis: 'task' };
    }
    const base = currentService.rate || 1200;
    const unit = (currentService.unit || 'day').toLowerCase();

    let hourly = 0;
    let daily = 0;
    let weekly = 0;
    let monthly = 0;
    let basis = 'day';

    if (unit.includes('month')) {
      basis = 'month';
      monthly = base;
      daily = Math.round(monthly / 30);
      weekly = Math.round(daily * 7);
      hourly = Math.round(daily / 24);
    } else if (unit.includes('hour')) {
      basis = 'hour';
      hourly = base;
      daily = Math.round(hourly * 24);
      weekly = Math.round(daily * 7);
      monthly = Math.round(daily * 30);
    } else if (unit.includes('visit') || unit.includes('session') || unit.includes('consultation')) {
      basis = 'day';
      daily = base;
      hourly = base;
      weekly = base * 7;
      monthly = base * 30;
    } else { // default to 'day'
      basis = 'day';
      daily = base;
      hourly = Math.round(daily / 24);
      weekly = Math.round(daily * 7);
      monthly = Math.round(daily * 30);
    }

    return { hourly, daily, weekly, monthly, basis };
  };

  const calculateTotal = () => {
    if (currentService?.isMtp || (selectedServiceId && selectedServiceId.startsWith("mtp"))) {
      return 0;
    }
    const rates = getServiceRates();
    const count = Number(durationCount) || 1;
    switch (bookingDuration) {
      case "Hourly": return rates.hourly * count;
      case "Daily": return rates.daily * count;
      case "Weekly": return rates.weekly * count;
      case "Monthly": return rates.monthly * count;
      default: return rates.daily * count;
    }
  };

  const calculateAdvance = () => {
    const service = servicesList.find(s => s.id === selectedServiceId) || SERVICES_CATALOG.find(s => s.id === selectedServiceId) || servicesList[0] || SERVICES_CATALOG[0];
    if (!service) return 300;
    if (service.isMtp || (selectedServiceId && selectedServiceId.startsWith("mtp"))) {
      return 0; // Zero advance for dynamic MTP bookings
    }
    const baseAdvance = service.advance !== undefined ? Number(service.advance) : Math.round((service.rate || 1200) * 0.2);
    const count = Number(durationCount) || 1;
    return baseAdvance * count;
  };

  const validateStep1 = () => {
    if (!bookingDate || !bookingTime) {
      alert("Please select the care shift starting Date and Time.");
      return false;
    }
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (bookingDate < todayStr) {
      alert("Booking date cannot be in the past. Please select today or a future date.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const nameErr = validateName(patientName, "Patient name");
    if (nameErr) {
      alert(nameErr);
      return false;
    }
    const age = Number(patientAge);
    if (!patientAge || isNaN(age) || age < 0 || age > 125) {
      alert("Please enter a valid patient age between 0 and 125.");
      return false;
    }
    return true;
  };
 
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const addrErr = validateAddress(bookingAddress, "Care address");
    if (addrErr) {
      alert(addrErr);
      return;
    }

    setIsSubmitting(true);
 
    const submitBooking = async (payStatus: string) => {
      try {
        const token = localStorage.getItem("ammaseva_user_token");
        const isMtpBooking = !!currentService?.isMtp || (selectedServiceId && selectedServiceId.startsWith("mtp"));
        const formattedDuration = isMtpBooking
          ? `${durationCount} ${durationCount === 1 ? "Task / Visit" : "Tasks / Visits"}`
          : `${durationCount} ${
              bookingDuration === "Hourly" ? (durationCount === 1 ? "Hour" : "Hours") :
              bookingDuration === "Daily" ? (durationCount === 1 ? "Day" : "Days") :
              bookingDuration === "Weekly" ? (durationCount === 1 ? "Week" : "Weeks") :
              (durationCount === 1 ? "Month" : "Months")
            }`;

        const totalCost = isMtpBooking ? 0 : calculateTotal();
        const advPaid = isMtpBooking ? 0 : (payStatus === "Advance Paid" ? calculateAdvance() : 0);
        const balDue = isMtpBooking ? 0 : (totalCost - advPaid);

        const res = await fetch("/api/booking", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            name: user?.name || patientName || "Customer",
            phone: user?.phone || "9490587575",
            email: user?.email || "",
            service: currentService?.title || "Home Care Healthcare",
            date: bookingDate || new Date().toISOString().split("T")[0],
            time: bookingTime || "09:00 AM",
            duration: formattedDuration || "1 Day",
            address: bookingAddress || "Hyderabad, Telangana",
            amount: totalCost,
            patientName: patientName || user?.name || "Customer",
            patientAge,
            patientNeeds,
            paymentMethod: isMtpBooking ? "pay_on_service" : paymentMethod,
            paymentStatus: isMtpBooking ? "Pay on Service" : payStatus,
            userId: user?.id,
            prescription: prescriptionFile,
            googleMapLocation: bookingGoogleMapLocation,
            advancePaid: advPaid,
            balanceAmount: balDue
          })
        });
        if (res.status === 401) {
          handleLogout();
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Booking submission error.");
        }
        setSuccessBooking(data.data);
        // Reset form
        setBookingDate("");
        setBookingAddress("");
        setPatientName("");
        setPatientAge("");
        setPatientNeeds("");
        setPrescriptionFile("");
        setBookingGoogleMapLocation("");
        setAgreeTermsBooking(false);
        setDurationCount(1);
      } catch (err: any) {
        alert("Booking failed: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    // If MTP task, skip payment gateway directly
    if (currentService?.isMtp || (selectedServiceId && selectedServiceId.startsWith("mtp"))) {
      await submitBooking("Pay on Service");
      return;
    }

    if (paymentMethod === "razorpay") {
      try {
        const orderRes = await fetch("/api/payment/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: calculateAdvance() })
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) {
          throw new Error(orderData.error || "Failed to initiate online payment order.");
        }
        if (!orderData.keyId && !orderData.isSimulation) {
          throw new Error("Razorpay Key ID not configured on the server.");
        }

        const handleSuccessBooking = async (response: any) => {
          setIsSubmitting(true);
          try {
            const token = localStorage.getItem("ammaseva_user_token");
            const formattedDuration = `${durationCount} ${
              bookingDuration === "Hourly" ? (durationCount === 1 ? "Hour" : "Hours") :
              bookingDuration === "Daily" ? (durationCount === 1 ? "Day" : "Days") :
              bookingDuration === "Weekly" ? (durationCount === 1 ? "Week" : "Weeks") :
              (durationCount === 1 ? "Month" : "Months")
            }`;

            const res = await fetch("/api/booking", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                name: user?.name || patientName || "Customer",
                phone: user?.phone || "9490587575",
                email: user?.email || "",
                service: currentService?.title || "Home Care Healthcare",
                date: bookingDate || new Date().toISOString().split("T")[0],
                time: bookingTime || "09:00 AM",
                duration: formattedDuration || "1 Day",
                address: bookingAddress || "Hyderabad, Telangana",
                amount: calculateTotal(),
                patientName: patientName || user?.name || "Customer",
                patientAge,
                patientNeeds,
                paymentMethod: "razorpay",
                userId: user?.id,
                prescription: prescriptionFile,
                googleMapLocation: bookingGoogleMapLocation,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                advancePaid: calculateAdvance(),
                balanceAmount: calculateTotal() - calculateAdvance()
              })
            });
            if (res.status === 401) {
              handleLogout();
              return;
            }
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || "Booking submission error.");
            }
            setSuccessBooking(data.data);
            // Reset form
            setBookingDate("");
            setBookingAddress("");
            setPatientName("");
            setPatientAge("");
            setPatientNeeds("");
            setPrescriptionFile("");
            setBookingGoogleMapLocation("");
            setAgreeTermsBooking(false);
            setDurationCount(1);
          } catch (err: any) {
            alert("Booking failed: " + err.message);
          } finally {
            setIsSubmitting(false);
          }
        };

        // If server provided simulation fallback order or SDK is not present, complete directly
        if (orderData.isSimulation || !(window as any).Razorpay) {
          await handleSuccessBooking({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: `sig_sim_${Date.now()}`
          });
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Amma Seva",
          description: `Care Booking - ${currentService.title}`,
          order_id: orderData.orderId,
          handler: handleSuccessBooking,
          prefill: {
            name: user?.name || patientName || "",
            email: user?.email || "",
            contact: user?.phone || ""
          },
          theme: {
            color: "#0e2254"
          },
          modal: {
            ondismiss: function() {
              setIsSubmitting(false);
            }
          }
        };

        try {
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } catch (rzpErr) {
          console.warn("[Razorpay SDK warning] Falling back to direct confirmation:", rzpErr);
          await handleSuccessBooking({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: `sig_sim_${Date.now()}`
          });
        }
      } catch (err: any) {
        alert("Payment initialization notice: " + err.message);
        setIsSubmitting(false);
      }
    } else {
      await submitBooking("Unpaid");
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBookingId) return;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!rescheduleDate || rescheduleDate < todayStr) {
      alert("Reschedule date cannot be in the past. Please select today or a future date.");
      return;
    }
    try {
      const token = localStorage.getItem("ammaseva_user_token");
      const res = await fetch(`/api/booking/${rescheduleBookingId}/reschedule`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ date: rescheduleDate, time: rescheduleTime })
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not reschedule shift.");
      }
      alert("Shift rescheduled successfully!");
      setRescheduleBookingId(null);
      fetchBookings();
    } catch (err: any) {
      alert("Reschedule failed: " + err.message);
    }
  };

  const handleSaveDetails = async () => {
    if (!editBookingId) return;

    const nameErr = validateName(editPatientName, "Patient name");
    if (nameErr) {
      alert(nameErr);
      return;
    }

    const addrErr = validateAddress(editAddress, "Care address");
    if (addrErr) {
      alert(addrErr);
      return;
    }

    setIsSavingDetails(true);
    try {
      const token = localStorage.getItem("ammaseva_user_token");
      const res = await fetch(`/api/booking/${editBookingId}/details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          patientName: editPatientName,
          patientAge: editPatientAge,
          patientNeeds: editPatientNeeds,
          address: editAddress,
          googleMapLocation: editGoogleMapLocation
        })
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update details.");
      }

      alert("Booking details updated successfully!");
      setIsEditModalOpen(false);
      fetchBookings();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handlePayBalance = async (booking: Booking) => {
    const balanceVal = Number(booking.balanceAmount);
    if (isNaN(balanceVal) || balanceVal <= 0) {
      alert("No pending balance amount found for this booking.");
      return;
    }

    try {
      // 1. Create order for balance amount
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: balanceVal })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to initiate online payment order.");
      }

      const verifyBalancePayment = async (response: any) => {
        try {
          const token = localStorage.getItem("ammaseva_user_token");
          const res = await fetch(`/api/booking/${booking.id}/pay-balance`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          if (res.status === 401) {
            handleLogout();
            return;
          }

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Verification of balance payment failed.");
          }

          alert("Balance payment completed and verified successfully!");
          fetchBookings();
        } catch (err: any) {
          alert("Payment verification failed: " + err.message);
        }
      };

      // If simulation mode or Razorpay SDK not available
      if (orderData.isSimulation || !(window as any).Razorpay) {
        await verifyBalancePayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: `sig_sim_${Date.now()}`
        });
        return;
      }

      // 2. Open Razorpay checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Amma Seva",
        description: `Balance Payment for Booking #${booking.id}`,
        order_id: orderData.orderId,
        handler: verifyBalancePayment,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || ""
        },
        theme: {
          color: "#0e2254"
        }
      };

      try {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (rzpErr) {
        await verifyBalancePayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}`,
          razorpay_signature: `sig_sim_${Date.now()}`
        });
      }
    } catch (err: any) {
      alert("Payment notice: " + err.message);
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const token = localStorage.getItem("ammaseva_user_token");
      const res = await fetch(`/api/booking/${id}/cancel`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not cancel shift.");
      }
      alert("Booking successfully cancelled.");
      fetchBookings();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#1e2a5a] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground font-medium">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (isCaretaker) {
    return (
      <SiteLayout>
        <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
          <div className="mx-auto max-w-[1440px] space-y-6">
            
            {/* Premium Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              
              {/* Left Column - Sticky Profile Overview & Switcher */}
              <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 self-start">
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 space-y-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-indigo-50 border-2 border-slate-100 flex items-center justify-center text-indigo-600 shadow-inner relative overflow-hidden mb-4 shrink-0">
                      {caretakerProfilePhoto ? (
                        <img src={caretakerProfilePhoto} alt={caretakerName} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-12 w-12 text-slate-400" />
                      )}
                    </div>
                    
                    <h2 className="text-xl font-bold text-[#1e2a5a] font-display">{caretakerName || caretaker?.name || "Caregiver Partner"}</h2>
                    <p className="text-xs text-[#c9a24c] font-bold uppercase tracking-wider mt-0.5">{caretakerSpecialty || caretaker?.specialty || "Caregiver"}</p>
                    
                    {caretaker?.rating > 0 && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1 mt-2">
                        ⭐ {caretaker.rating} ({caretaker.reviews?.length || 0} reviews)
                      </span>
                    )}

                    <div className="mt-4 w-full">
                      {caretaker?.status === "Verified" ? (
                        <div className="space-y-2">
                          <span className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active Partner
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveCaregiverTab("reviews")}
                            className="flex items-center justify-center gap-1 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200/40 px-2.5 py-1 rounded-xl w-max mx-auto shadow-inner text-xs font-extrabold text-amber-700 cursor-pointer transition-all hover:scale-105"
                            title="View Customer Reviews"
                          >
                            ★ {caretakerReviews.length > 0 ? caretakerAvgRating.toFixed(1) : "0.0"} <span className="text-[10px] text-slate-400 font-bold ml-0.5">({caretakerReviews.length})</span>
                          </button>
                        </div>
                      ) : caretaker?.status === "Rejected" ? (
                        <span className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-100 text-xs font-bold uppercase tracking-wider">
                          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 text-xs font-bold uppercase tracking-wider">
                          <Clock className="h-3.5 w-3.5" /> Pending Verification
                        </span>
                      )}
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Vertical Tab Navigation */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveCaregiverTab("shifts")}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 cursor-pointer transition-all ${
                        activeCaregiverTab === "shifts"
                          ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                          : "text-slate-500 hover:text-[#1e2a5a] hover:bg-slate-50 border border-transparent hover:border-slate-200/50"
                      }`}
                    >
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span className="text-left flex-1">Assigned Shifts</span>
                      {caretakerBookings.length > 0 && caretaker?.status === "Verified" && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          activeCaregiverTab === "shifts" ? "bg-white text-[#1e2a5a]" : "bg-[#1e2a5a] text-white"
                        }`}>
                          {caretakerBookings.filter(b => b.status !== "Completed" && b.status !== "Cancelled").length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveCaregiverTab("profile")}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 cursor-pointer transition-all ${
                        activeCaregiverTab === "profile"
                          ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                          : "text-slate-500 hover:text-[#1e2a5a] hover:bg-slate-50 border border-transparent hover:border-slate-200/50"
                      }`}
                    >
                      <User className="h-4 w-4 shrink-0" />
                      <span className="text-left flex-1">Profile Details</span>
                    </button>

                    {caretaker?.status === "Verified" && (
                      <button
                        type="button"
                        onClick={() => setActiveCaregiverTab("reviews")}
                        className={`w-full py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 cursor-pointer transition-all ${
                          activeCaregiverTab === "reviews"
                            ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                            : "text-slate-500 hover:text-[#1e2a5a] hover:bg-slate-50 border border-transparent hover:border-slate-200/50"
                        }`}
                      >
                        <Star className="h-4 w-4 shrink-0" />
                        <span className="text-left flex-1">Customer Reviews</span>
                        {caretakerReviews.length > 0 && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            activeCaregiverTab === "reviews" ? "bg-[#c9a24c] text-[#1e2a5a]" : "bg-[#c9a24c]/20 text-[#c9a24c]"
                          }`}>
                            {caretakerReviews.length}
                          </span>
                        )}
                      </button>
                    )}

                    {caretaker?.status === "Verified" && (
                      <button
                        type="button"
                        onClick={() => setActiveCaregiverTab("earnings")}
                        className={`w-full py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 cursor-pointer transition-all ${
                          activeCaregiverTab === "earnings"
                            ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                            : "text-slate-500 hover:text-[#1e2a5a] hover:bg-slate-50 border border-transparent hover:border-slate-200/50"
                        }`}
                      >
                        <DollarSign className="h-4 w-4 shrink-0 text-[#c9a24c]" />
                        <span className="text-left flex-1 font-sans">Earnings &amp; Duty Logs</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveCaregiverTab("referrals")}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 cursor-pointer transition-all ${
                        activeCaregiverTab === "referrals"
                          ? "bg-[#1e2a5a] text-white shadow-md shadow-[#1e2a5a]/20"
                          : "text-slate-500 hover:text-[#1e2a5a] hover:bg-slate-50 border border-transparent hover:border-slate-200/50"
                      }`}
                    >
                      <Gift className="h-4 w-4 shrink-0 text-[#c9a24c]" />
                      <span className="text-left flex-1 font-sans">Refer &amp; Share Link</span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#c9a24c]/20 text-[#c9a24c]">
                        NEW
                      </span>
                    </button>

                    {caretaker?.status !== "Verified" && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                    )}
                  </div>

                  <hr className="border-slate-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full py-3 border border-rose-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-bold uppercase tracking-wider rounded-2xl cursor-pointer flex items-center justify-center gap-2 transition-all"
                  >
                    Log Out
                  </button>
                </div>
              </div>

              {/* Right Column - Main Dynamic Workspace */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Personal Referral & Share Link Quick Card */}
                <div className="bg-gradient-to-r from-[#1e2a5a] via-[#162044] to-[#0f1738] rounded-3xl p-6 text-white shadow-lg shadow-[#1e2a5a]/20 border border-slate-700/50 space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-[#f0d48b] bg-[#c9a24c]/20 px-2.5 py-0.5 rounded-full border border-[#c9a24c]/30 flex items-center gap-1">
                          <Gift className="h-3 w-3 text-[#f0d48b]" /> Care Partner Referral
                        </span>
                        <span className="text-xs text-slate-300 font-medium">Earn Referral Rewards</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold font-display text-white">
                        Invite Caregivers &amp; Nurses to Amma Seva
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                        When caregivers apply using your link, their application automatically locks your referral code.
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3 shrink-0">
                      <div>
                        <div className="text-[9px] uppercase font-extrabold tracking-wider text-slate-300">Your Referral Code</div>
                        <div className="text-lg font-black text-[#f5d77f] font-mono tracking-widest">
                          {getCaregiverReferralCode(caretaker)}
                        </div>
                      </div>
                      <button
                        type="button"
                        title="Copy Referral Code"
                        onClick={() => {
                          const code = getCaregiverReferralCode(caretaker);
                          navigator.clipboard.writeText(code);
                          alert(`Copied Referral Code: ${code}`);
                        }}
                        className="h-9 w-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-all border border-white/20"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="w-full sm:flex-1 bg-black/20 rounded-xl px-3.5 py-2 border border-white/10 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-xs text-slate-300 font-mono truncate select-all">
                        {typeof window !== "undefined" ? `${window.location.origin}/login?ref=${getCaregiverReferralCode(caretaker)}&type=caretaker` : `/login?ref=${getCaregiverReferralCode(caretaker)}&type=caretaker`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/login?ref=${getCaregiverReferralCode(caretaker)}&type=caretaker`;
                          navigator.clipboard.writeText(url);
                          alert(`Copied your personal referral link:\n${url}`);
                        }}
                        className="text-[11px] font-bold text-[#f5d77f] hover:underline shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Copy Link
                      </button>
                    </div>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Namaste! Join Amma Seva as a caregiver or nurse in Hyderabad. Great daily/monthly payouts, flexible shift options & doctor-backed support.\n\nRegister directly using my referral link:\n${typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in"}/login?ref=${getCaregiverReferralCode(caretaker)}&type=caretaker`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" /> Share on WhatsApp
                    </a>
                  </div>
                </div>

                {/* Announcement Banners for Caretaker */}
                {announcements.map((ann) => (
                  <div key={ann.id} className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white px-6 py-4 rounded-3xl flex items-center justify-between shadow-sm border border-indigo-700/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📢</span>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">System Announcement</span>
                        <p className="text-sm font-semibold">{ann.message}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-300 font-semibold shrink-0 ml-4">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}

                {/* Application Status Banner */}
                {caretaker?.status === "Verified" ? (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 flex gap-4 items-start shadow-sm">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-emerald-900 font-display">Profile Approved &amp; Active</h3>
                      <p className="text-sm text-emerald-800 leading-relaxed">
                        Your caretaker profile is fully verified by the administrator. Your profile is visible in the care network, and you can now be assigned to customer booking shifts.
                      </p>
                    </div>
                  </div>
                ) : caretaker?.status === "Rejected" ? (
                  <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 flex gap-4 items-start shadow-sm">
                    <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-rose-900 font-display">Application Rejected</h3>
                      <p className="text-sm text-rose-800 leading-relaxed">
                        Your caregiver profile has been rejected by the administrator. Please update and fill your details accurately below, re-upload clear copies of all required documents, and submit for re-verification.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 flex gap-4 items-start shadow-sm">
                    <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-amber-900 font-display">Verification Pending</h3>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Your caretaker registration is currently undergoing administrative background checks. To speed up verification, make sure all your profile details and required documents are complete and up-to-date below.
                      </p>
                    </div>
                  </div>
                )}

            {/* Shifts Content View */}
            {activeCaregiverTab === "shifts" && (
              <>
                {caretaker?.status === "Verified" ? (
                  <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-primary font-display flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-indigo-600" /> My Assigned Patient Shifts
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Below are the patient homecare shifts you have been assigned to by the administrator.</p>
                    </div>
 
                    {/* Premium Filter Controls */}
                    <div className="grid gap-4 md:grid-cols-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/50 text-left">
                      {/* Search Anything */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Anything</label>
                        <input
                          type="text"
                          value={caretakerSearch}
                          onChange={(e) => setCaretakerSearch(e.target.value)}
                          placeholder="Search location, name, number, issue..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#1e2a5a] focus:ring-2 focus:ring-[#1e2a5a]/5 transition-all text-slate-800"
                        />
                      </div>
                      
                      {/* Start Date */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">From Date</label>
                        <input
                          type="date"
                          value={caretakerStartDate}
                          onChange={(e) => setCaretakerStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#1e2a5a] focus:ring-2 focus:ring-[#1e2a5a]/5 transition-all text-slate-850"
                        />
                      </div>

                      {/* End Date */}
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">To Date</label>
                        <input
                          type="date"
                          value={caretakerEndDate}
                          onChange={(e) => setCaretakerEndDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-[#1e2a5a] focus:ring-2 focus:ring-[#1e2a5a]/5 transition-all text-slate-850"
                        />
                      </div>
                    </div>
 
                    {(() => {
                      const sortedFiltered = sortShiftsOrBookings(
                        filterShiftsOrBookings(caretakerBookings, caretakerSearch, caretakerStartDate, caretakerEndDate)
                      );
                      
                      if (isLoading) {
                        return (
                          <div className="flex justify-center py-6">
                            <div className="w-6 h-6 border-2 border-[#1e2a5a] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        );
                      }
                      
                      if (caretakerBookings.length === 0) {
                        return (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-slate-500">
                            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold">No assigned shifts yet</p>
                            <p className="text-xs text-slate-400 mt-0.5">You will be notified once a customer booking is allocated to your profile.</p>
                          </div>
                        );
                      }

                      if (sortedFiltered.length === 0) {
                        return (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-slate-500">
                            <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-semibold">No matching shifts</p>
                            <p className="text-xs text-slate-400 mt-0.5">Adjust your search query or date range filters to find other patient bookings.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {sortedFiltered.map((shift: any) => {
                            const isExpanded = expandedBookingIds[shift.id] !== undefined
                              ? expandedBookingIds[shift.id]
                              : (shift.status !== "Completed" && shift.status !== "Cancelled");

                            return (
                              <div key={shift.id} className="rounded-3xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/20 p-6 space-y-4 hover:border-[#c9a24c]/40 hover:shadow-md hover:shadow-slate-100/30 transition-all duration-300 text-left">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#c9a24c]">Shift #{shift.id}</span>
                                    <h4 className="text-base font-bold text-[#1e2a5a] font-display">{shift.service}</h4>
                                    {!isExpanded && (
                                      <p className="text-xs text-slate-400 font-semibold mt-1 text-left">
                                        Date: {shift.date} at {shift.time} • Patient: {shift.name || shift.patientName} • Contact: {shift.phone}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-xl border ${
                                      shift.status === "Confirmed" ? "bg-emerald-50 text-emerald-800 border-emerald-100" :
                                      shift.status === "Active" ? "bg-indigo-50 text-indigo-850 border-indigo-100 animate-pulse" :
                                      shift.status === "Completed" ? "bg-slate-50 text-slate-650 border-slate-200" :
                                      "bg-rose-50 text-rose-800 border-rose-100"
                                    }`}>
                                      {shift.status}
                                    </span>

                                    {(shift.status === "Completed" || shift.status === "Cancelled") && (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedBookingIds(prev => ({ ...prev, [shift.id]: !isExpanded }))}
                                        className="px-3 py-1 border border-[#c9a24c]/40 hover:bg-[#c9a24c]/10 text-[#c9a24c] rounded-xl text-xs font-bold transition-all cursor-pointer"
                                      >
                                        {isExpanded ? "Hide Details" : "View Details"}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <>
                            {/* Patient & Care Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-slate-100/80 text-left">
                              <div>
                                <span className="text-slate-400 block mb-0.5">Patient Name</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1">
                                  <User className="h-3.5 w-3.5 text-slate-400" /> {shift.patientName || shift.name || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Patient Age</span>
                                <span className="font-semibold text-slate-800">{shift.patientAge || "N/A"} yrs</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Shift Date & Time</span>
                                <span className="font-semibold text-slate-800 flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" /> {shift.date} at {shift.time}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Duration Option</span>
                                <span className="font-semibold text-slate-800">{shift.duration}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Customer Contact</span>
                                <a href={`tel:${shift.phone}`} className="font-semibold text-[#1e2a5a] hover:underline flex items-center gap-1">
                                  <Phone className="h-3.5 w-3.5" /> {shift.phone}
                                </a>
                              </div>
                              <div>
                                <span className="text-slate-400 block mb-0.5">Shift Remuneration</span>
                                <span className="font-bold text-slate-800">₹{shift.amount}</span>
                              </div>
                            </div>

                            {shift.address && (
                              <div className="text-xs pt-2 border-t border-slate-100/60 text-left">
                                <span className="text-slate-400 block mb-0.5">Patient Care Address</span>
                                <span className="text-slate-700 flex items-start gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" /> {shift.address}
                                </span>
                              </div>
                            )}

                            {shift.patientNeeds && (
                              <div className="text-xs bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-left">
                                <span className="text-[#1e2a5a] font-bold block mb-0.5 uppercase tracking-wider text-[10px]">Special Instructions & Patient Needs</span>
                                <p className="text-slate-600 leading-relaxed italic">&ldquo;{shift.patientNeeds}&rdquo;</p>
                              </div>
                            )}

                            {/* Check-In / Check-Out Shift Tracking actions */}
                            {shift.status !== "Completed" && shift.status !== "Cancelled" && (
                              <div className="flex gap-3 pt-3 border-t border-slate-100/60 justify-end">
                                {shift.status === "Confirmed" ? (
                                  <button
                                    onClick={async () => {
                                      const token = localStorage.getItem("ammaseva_caretaker_token");
                                      if (!token) return;
                                      try {
                                        const res = await fetch(`/api/booking/${shift.id}/status`, {
                                          method: "PUT",
                                          headers: { 
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${token}` 
                                          },
                                          body: JSON.stringify({ status: "Active" })
                                        });
                                        if (res.ok) {
                                          fetchCaretakerBookings();
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                                  >
                                    <Check className="h-4 w-4" /> Start Shift (Check-In)
                                  </button>
                                ) : shift.status === "Active" ? (
                                  <div className="flex gap-2.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (activeLogShiftId === shift.id) {
                                          setActiveLogShiftId(null);
                                        } else {
                                          setActiveLogShiftId(shift.id);
                                          if (shift.vitals) {
                                            try {
                                              const parsedVitals = typeof shift.vitals === 'string'
                                                ? JSON.parse(shift.vitals)
                                                : shift.vitals;
                                              setVitalBP(parsedVitals.bloodPressure || "120/80");
                                              setVitalPulse(parsedVitals.pulseRate?.replace(" bpm", "") || "72");
                                              setVitalTemp(parsedVitals.bodyTemp?.replace(" °F", "") || "98.4");
                                              setVitalSugar(parsedVitals.bloodGlucose?.replace(" mg/dL", "") || "115");
                                            } catch (e) {
                                              // Ignore
                                            }
                                          }
                                        }
                                      }}
                                      className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                                    >
                                      📝 {activeLogShiftId === shift.id ? "Hide Form" : "Record Vitals & Activity"}
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const token = localStorage.getItem("ammaseva_caretaker_token");
                                        if (!token) return;
                                        try {
                                          const res = await fetch(`/api/booking/${shift.id}/status`, {
                                            method: "PUT",
                                            headers: { 
                                              "Content-Type": "application/json",
                                              "Authorization": `Bearer ${token}` 
                                            },
                                            body: JSON.stringify({ status: "Completed" })
                                          });
                                          if (res.ok) {
                                            fetchCaretakerBookings();
                                          }
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }}
                                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                                    >
                                      <CheckCircle2 className="h-4 w-4" /> Complete Shift (Check-Out)
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )}

                            {/* Caregiver Vitals and Progress Logging Form */}
                            {activeLogShiftId === shift.id && (
                              <div className="mt-4 p-5 bg-white border border-indigo-150 rounded-2xl space-y-4 animate-fade-in text-left">
                                <h5 className="text-xs font-bold text-indigo-700 uppercase tracking-wider border-b border-indigo-50 pb-1.5 flex items-center gap-1">
                                  📝 Record Patient Vitals & Progress Log
                                </h5>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Blood Pressure</label>
                                    <input
                                      type="text"
                                      value={vitalBP}
                                      onChange={(e) => setVitalBP(e.target.value)}
                                      placeholder="e.g. 120/80"
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-gold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Pulse Rate (bpm)</label>
                                    <input
                                      type="number"
                                      value={vitalPulse}
                                      onChange={(e) => setVitalPulse(e.target.value)}
                                      placeholder="e.g. 72"
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-gold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Body Temp (°F)</label>
                                    <input
                                      type="text"
                                      value={vitalTemp}
                                      onChange={(e) => setVitalTemp(e.target.value)}
                                      placeholder="e.g. 98.4"
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-gold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Blood Glucose (mg/dL)</label>
                                    <input
                                      type="number"
                                      value={vitalSugar}
                                      onChange={(e) => setVitalSugar(e.target.value)}
                                      placeholder="e.g. 110"
                                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-gold"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">New Shift Activity Log Entry</label>
                                  <textarea
                                    value={logMessage}
                                    onChange={(e) => setLogMessage(e.target.value)}
                                    placeholder="Describe current activity (e.g. Administered prescribed insulin dose, assisted with daily walk)"
                                    rows={2}
                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-gold"
                                  />
                                </div>

                                <div className="flex justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setActiveLogShiftId(null)}
                                    className="px-3.5 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSavingLog}
                                    onClick={() => handleSaveVitalsAndLogs(shift.id, shift)}
                                    className="px-4 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer flex items-center gap-1 shadow-sm disabled:opacity-50"
                                  >
                                    {isSavingLog && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                                    {isSavingLog ? "Saving..." : "Save Vitals & Log Entry"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm text-center py-12 space-y-4">
                    <div className="h-14 w-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto">
                      <Clock className="h-7 w-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-lg font-bold text-[#1e2a5a] font-display">Shifts Not Available</h3>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        Your profile must be fully verified and approved by the administrator before you can view or accept patient homecare shifts.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveCaregiverTab("profile")}
                        className="mt-2 text-xs font-bold text-[#c9a24c] hover:underline cursor-pointer"
                      >
                        Complete Profile Registration &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Earnings & Duty Logs tab */}
            {activeCaregiverTab === "earnings" && (() => {
              const completedShifts = caretakerBookings.filter(b => b.status === "Completed");
              
              const getShiftPayout = (b: any) => {
                return b.caretakerPayout !== undefined && b.caretakerPayout !== null && Number(b.caretakerPayout) > 0
                  ? Number(b.caretakerPayout)
                  : Math.round(Number(b.amount || 0) * 0.85);
              };

              const estimatedEarnings = completedShifts.reduce((sum, b) => sum + getShiftPayout(b), 0);
              const estimatedHours = completedShifts.length * 8; // Simulating 8 hours per completed shift duration

              return (
                <div className="space-y-6 text-left animate-in fade-in duration-300">
                  {/* Earnings Metric Grid */}
                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-3">
                    <div className="rounded-3xl border border-[#c9a24c]/30 bg-gradient-to-tr from-[#1e2a5a] to-[#151c3e] p-6 text-white shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a24c]/10 rounded-full blur-xl pointer-events-none"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9a24c]">Earnings Payout</span>
                      <div className="text-3xl font-bold font-display mt-2">₹{estimatedEarnings.toLocaleString()}</div>
                      <p className="text-[10px] text-slate-350 mt-1 leading-relaxed">Total payout amount approved and scheduled by administrator.</p>
                    </div>

                    <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Shifts Completed</span>
                      <div className="text-3xl font-bold text-[#1e2a5a] font-display mt-2">{completedShifts.length}</div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Active allocations assigned & delivered successfully.</p>
                    </div>

                    <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estimated On-Duty Hours</span>
                      <div className="text-3xl font-bold text-[#1e2a5a] font-display mt-2">{estimatedHours} Hrs</div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Calculated based on standard completed duty logs.</p>
                    </div>
                  </div>

                  {/* Earnings Graph simulator using clean custom CSS */}
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-[#1e2a5a] font-display">Monthly Shift Activity Analytics</h3>
                      <p className="text-xs text-slate-450 mt-0.5">Visual representation of shifts completed over recent booking intervals.</p>
                    </div>

                    {completedShifts.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-end justify-between gap-3 h-40 pt-4 px-2 border-b border-slate-100">
                          {completedShifts.slice(-6).map((shift) => {
                            const payout = getShiftPayout(shift);
                            const maxPayout = Math.max(...completedShifts.map(s => getShiftPayout(s))) || 1;
                            const barHeight = Math.min(100, Math.max(20, Math.round((payout / maxPayout) * 100)));
                            return (
                              <div key={shift.id} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                <div className="text-[9px] font-extrabold text-[#c9a24c] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  ₹{payout}
                                </div>
                                <div 
                                  style={{ height: `${barHeight}%` }} 
                                  className="w-full sm:w-12 rounded-t-lg bg-gradient-to-t from-[#1e2a5a]/70 to-[#1e2a5a] group-hover:from-[#c9a24c] group-hover:to-[#c9a24c] transition-all duration-300 shadow-sm"
                                ></div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-full">
                                  Shift #{shift.id}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold px-2">
                          <span>Oldest Completed</span>
                          <span>Most Recent Shift</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-450">
                        <DollarSign className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold">No completed shift transactions recorded to compile analytics.</p>
                      </div>
                    )}
                  </div>

                  {/* Premium Shift Logs list */}
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-[#1e2a5a] font-display border-b border-slate-100 pb-3">Historical Payout Records</h3>
                    {completedShifts.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {completedShifts.map((shift) => (
                          <div key={shift.id} className="py-3.5 flex justify-between items-center text-xs">
                            <div>
                              <div className="font-bold text-slate-800">{shift.service}</div>
                              <div className="text-slate-400 text-[10px] font-semibold mt-0.5">{shift.date} • Patient: {shift.patientName || shift.name}</div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="font-extrabold text-emerald-600">+₹{getShiftPayout(shift)}</div>
                              {shift.caretakerPayoutStatus === "Paid" ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-[9px] text-emerald-750 bg-emerald-50 border border-emerald-200/60 font-bold px-1.5 py-0.5 rounded-md">
                                    ✓ Settled
                                  </span>
                                  {shift.caretakerPayoutMethod && (
                                    <div className="text-[8px] text-slate-400 font-medium font-sans">
                                      {shift.caretakerPayoutMethod} {shift.caretakerPayoutRef ? `(${shift.caretakerPayoutRef})` : ''}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] text-amber-750 bg-amber-50 border border-amber-200/60 font-bold px-1.5 py-0.5 rounded-md">
                                  ● Pending Settle
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-450 italic">No historical shift logs found for your profile.</p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Customer Reviews tab */}
            {activeCaregiverTab === "reviews" && (
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-6 text-left animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-bold text-primary font-display flex items-center gap-2">
                    <Star className="h-5 w-5 text-[#c9a24c]" /> Customer Ratings &amp; Reviews
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time feedback and ratings submitted by patients and families.</p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                  <div className="text-center space-y-1">
                    <span className="text-4xl font-extrabold text-[#1e2a5a] font-display">{caretakerAvgRating.toFixed(1)}</span>
                    <div className="flex justify-center text-amber-500 text-sm mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>{i < Math.round(caretakerAvgRating) ? "★" : "☆"}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-1">Average rating</p>
                  </div>
                  
                  <div className="sm:col-span-2 space-y-2 border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-4 sm:pt-0 sm:pl-6 text-xs text-slate-500 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-right">Excellent</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(caretakerReviews.filter(r => r.rating >= 4.5).length / (caretakerReviews.length || 1)) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold">{caretakerReviews.filter(r => r.rating >= 4.5).length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-right">Good</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${(caretakerReviews.filter(r => r.rating >= 3.5 && r.rating < 4.5).length / (caretakerReviews.length || 1)) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold">{caretakerReviews.filter(r => r.rating >= 3.5 && r.rating < 4.5).length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-right">Average</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${(caretakerReviews.filter(r => r.rating < 3.5).length / (caretakerReviews.length || 1)) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right font-semibold">{caretakerReviews.filter(r => r.rating < 3.5).length}</span>
                    </div>
                  </div>
                </div>

                {caretakerReviews.length === 0 ? (
                  <div className="text-center text-slate-400 py-10">
                    <MessageSquare className="h-10 w-10 text-slate-350 mx-auto mb-2" />
                    <p className="text-sm font-semibold">No reviews submitted yet</p>
                    <p className="text-xs">Feedback details will appear here once shift checkouts are rated.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {caretakerReviews.map((rev: any, idx: number) => (
                      <div key={idx} className="p-5 bg-slate-50/50 border border-slate-200/50 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">Patient Booking #{rev.bookingId || "N/A"}</span>
                          <span className="text-xs text-amber-500 font-bold">{"★".repeat(rev.rating)}</span>
                        </div>
                        <p className="text-xs text-slate-650 italic leading-relaxed">&ldquo;{rev.comment || "No written comments."}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Form Card */}
            {activeCaregiverTab === "profile" && (
              <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-8">
              <div>
                <h2 className="text-xl font-bold text-[#1e2a5a] font-display">Complete & Update Profile Details</h2>
                <p className="text-xs text-slate-400 mt-0.5">Keep your details up-to-date to receive relevant shift opportunities.</p>
              </div>

              {caretakerError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm flex gap-2 items-center">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{caretakerError}</span>
                </div>
              )}

              {caretakerSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 text-sm flex gap-2 items-center">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{caretakerSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCaretakerSubmit} className="space-y-8">
                
                {/* Profile Photo Upload and Preview */}
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-slate-50 to-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                  <div className="h-24 w-24 rounded-full border-2 border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 overflow-hidden relative group shrink-0 shadow-inner">
                    {caretakerProfilePhoto ? (
                      <img src={caretakerProfilePhoto} alt="Profile preview" className="h-full w-full object-cover animate-in fade-in duration-300" />
                    ) : (
                      <User className="h-10 w-10 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <span className="block text-xs font-bold text-[#1e2a5a] uppercase tracking-wider">Profile Picture</span>
                    <p className="text-[11px] text-slate-400">Upload a professional face photo for patient trust and security.</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCaretakerFileChange(e, setCaretakerProfilePhoto)}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#1e2a5a]/5 file:text-[#1e2a5a] hover:file:bg-[#1e2a5a]/10 cursor-pointer transition-colors"
                    />
                  </div>
                </div>

                {/* Form Field Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={caretakerName}
                      onChange={(e) => setCaretakerName(sanitizeName(e.target.value))}
                      placeholder="e.g. Pandu R."
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={caretakerPhone}
                      onChange={(e) => setCaretakerPhone(sanitizeIndianPhone(e.target.value))}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Specialty / Role Category</label>
                    <select
                      value={caretakerSpecialty}
                      onChange={(e) => setCaretakerSpecialty(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                    >
                      {servicesList.map((s) => (
                        <option key={s.title} value={s.title}>{s.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Years of Experience</label>
                    <select
                      value={caretakerExperience}
                      onChange={(e) => setCaretakerExperience(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                    >
                      <option value="0">0-1 years</option>
                      <option value="1">1-2 years</option>
                      <option value="3">3-5 years</option>
                      <option value="6">6-9 years</option>
                      <option value="10">10+ years</option>
                    </select>
                  </div>

                  {/* Address Section */}
                  <div className="md:col-span-2 border border-slate-200/60 rounded-3xl p-6 bg-gradient-to-br from-slate-50 to-white space-y-6 shadow-sm">
                    <div className="text-xs font-bold text-[#1e2a5a] uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#c9a24c]" /> Address & GPS Location
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">State</label>
                        <select
                          required
                          value={caretakerState}
                          onChange={(e) => setCaretakerState(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">City</label>
                        <input
                          type="text"
                          required
                          value={caretakerCity}
                          onChange={(e) => setCaretakerCity(e.target.value)}
                          placeholder="e.g. Hyderabad"
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Google Map Location (GPS Link)</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          readOnly
                          required
                          value={caretakerGoogleMapLocation}
                          placeholder="Click button to fetch GPS coordinates..."
                          className="flex-1 w-full px-4 py-3 text-xs rounded-2xl border border-slate-200 bg-slate-100/50 outline-none truncate font-mono text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!navigator.geolocation) {
                              alert("Geolocation is not supported by your browser");
                              return;
                            }
                            setIsFetchingLocation(true);
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                setCaretakerGoogleMapLocation(`https://www.google.com/maps?q=${lat},${lng}`);
                                setIsFetchingLocation(false);
                              },
                              (err) => {
                                alert("Failed to fetch location. Please ensure location permissions are enabled.");
                                setIsFetchingLocation(false);
                              }
                            );
                          }}
                          disabled={isFetchingLocation}
                          className="px-5 py-3 bg-[#1e2a5a] hover:bg-[#1e2a5a]/90 text-white text-xs font-bold uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm shadow-[#1e2a5a]/10 transition-all hover:translate-y-[-1px] w-full sm:w-auto text-center"
                        >
                          {isFetchingLocation ? "Fetching..." : "Fetch GPS Location"}
                        </button>
                      </div>
                      {caretakerGoogleMapLocation && (
                        <div className="flex items-center justify-between text-[11px] mt-2 px-1">
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            ✓ Geolocation coordinates fetched
                          </span>
                          <a
                            href={caretakerGoogleMapLocation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#c9a24c] hover:text-[#c9a24c]/85 hover:underline font-bold"
                          >
                            Open on Google Maps &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Working Locations (Areas / Localities)</label>
                    <input
                      type="text"
                      value={caretakerWorkingLocations}
                      onChange={(e) => setCaretakerWorkingLocations(e.target.value)}
                      placeholder="e.g. Kukatpally, Gachibowli, Madhapur"
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Available Timings / Shifts</label>
                    <input
                      type="text"
                      value={caretakerAvailableTimings}
                      onChange={(e) => setCaretakerAvailableTimings(e.target.value)}
                      placeholder="e.g. Day Shift, Night Shift, 24/7 Live-in"
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Detailed Experience & Skills Summary</label>
                  <textarea
                    value={caretakerExperienceDetails}
                    onChange={(e) => setCaretakerExperienceDetails(e.target.value)}
                    placeholder="Describe your qualifications, hospital training, types of patients managed, special clinical equipment handled (e.g. Ryles tube, catheter, IV line, oxygen)..."
                    rows={4}
                    className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-white outline-none transition-all hover:border-slate-300 focus:border-[#1e2a5a] focus:ring-4 focus:ring-[#1e2a5a]/5"
                  />
                </div>

                {/* Documents Upload Section */}
                <div className="border border-slate-200/60 rounded-3xl p-6 bg-gradient-to-br from-slate-50 to-white space-y-6 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <FileText className="h-5 w-5 text-[#c9a24c]" />
                    <span className="text-sm font-bold text-[#1e2a5a] uppercase tracking-wider">Verification Documents</span>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    
                    {/* Aadhaar */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Aadhaar Card</label>
                        <p className="text-[10px] text-slate-400">Government identity card for address & verification.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerAadhaar)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerAadhaar ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerAadhaar ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-rose-500 font-bold bg-rose-50 py-1 rounded-xl">
                          ⚠ Missing Aadhaar Card
                        </span>
                      )}
                    </div>

                    {/* PAN Card */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">PAN Card</label>
                        <p className="text-[10px] text-slate-400">Tax registration card for payment processing.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerPan)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerPan ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerPan ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-rose-500 font-bold bg-rose-50 py-1 rounded-xl">
                          ⚠ Missing PAN Card
                        </span>
                      )}
                    </div>

                    {/* Certificates */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Educational Cert(s)</label>
                        <p className="text-[10px] text-slate-400">Nursing, clinical training, or first-aid certs.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerCertificates)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerCertificates ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerCertificates ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-rose-500 font-bold bg-rose-50 py-1 rounded-xl">
                          ⚠ Missing Certification
                        </span>
                      )}
                    </div>

                    {/* Experience Certificate */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Experience Letters</label>
                        <p className="text-[10px] text-slate-400">Past service references or hospital discharge letters.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerExperienceCertificate)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerExperienceCertificate ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerExperienceCertificate ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 py-1 rounded-xl">
                          Optional Document
                        </span>
                      )}
                    </div>

                    {/* Police Verification */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Police verification</label>
                        <p className="text-[10px] text-slate-400">Mandatory background verification certificate.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerPoliceVerification)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerPoliceVerification ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerPoliceVerification ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 py-1 rounded-xl">
                          Optional Document
                        </span>
                      )}
                    </div>

                    {/* Additional Certificates */}
                    <div className="space-y-2.5 flex flex-col justify-between h-full bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Additional Certificates</label>
                        <p className="text-[10px] text-slate-400">Any other courses, seminars or care credentials.</p>
                      </div>
                      <div className="relative group border border-slate-200 hover:border-[#c9a24c]/40 rounded-xl bg-slate-50/50 hover:bg-[#c9a24c]/5 p-4 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleCaretakerFileChange(e, setCaretakerAdditionalCertificates)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center py-1">
                          <Upload className="h-5 w-5 text-slate-400 group-hover:text-[#c9a24c] mb-1 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-600 block">
                            {caretakerAdditionalCertificates ? "Change Document" : "Choose File"}
                          </span>
                        </div>
                      </div>
                      {caretakerAdditionalCertificates ? (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 py-1 rounded-xl">
                          ✓ Document Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-50 py-1 rounded-xl">
                          Optional Document
                        </span>
                      )}
                    </div>

                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isCaretakerSaving}
                    className="btn-primary py-2.5 px-8 font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isCaretakerSaving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span>}
                    {isCaretakerSaving ? "Saving profile details..." : "Save Profile Details"}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* Referrals & Partner Share Tab */}
          {activeCaregiverTab === "referrals" && (
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-8 text-left animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#9e761a] bg-[#c9a24c]/15 px-2.5 py-0.5 rounded-full border border-[#c9a24c]/30 flex items-center gap-1 font-mono">
                      <Gift className="h-3 w-3 text-[#c9a24c]" /> Staff Referral System
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">• Live Attribution</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#1e2a5a] font-display">
                    Refer Caregivers, Nurses &amp; Staff
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Share your personalized referral code or 1-click link to invite friends, coworkers, and healthcare professionals.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchCaretakerReferrals}
                  disabled={isLoadingReferrals}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingReferrals ? "animate-spin" : ""}`} />
                  Sync Referral Data
                </button>
              </div>

              {/* 3 Real-time KPI Metric Badges */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 border border-indigo-100 rounded-2xl p-5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                    Total Members Joined
                  </span>
                  <div className="text-3xl font-black text-[#1e2a5a] font-display">
                    {caretakerReferralsData?.totalJoined || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Applied using your referral link</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50/70 to-emerald-50/20 border border-emerald-100 rounded-2xl p-5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    Verified Staff
                  </span>
                  <div className="text-3xl font-black text-emerald-700 font-display">
                    {caretakerReferralsData?.totalVerified || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Approved by admin for shifts</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50/70 to-amber-50/20 border border-amber-100 rounded-2xl p-5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                    Pending Verification
                  </span>
                  <div className="text-3xl font-black text-amber-700 font-display">
                    {caretakerReferralsData?.totalPending || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Under KYC document review</p>
                </div>
              </div>

              {/* Main Highlight Card */}
              <div className="bg-gradient-to-br from-[#1e2a5a] via-[#152047] to-[#0f1738] rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-xl shadow-[#1e2a5a]/20 border border-slate-700/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#f5d77f] uppercase tracking-wider block">Your Unique Referral Code</span>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white bg-white/10 px-4 py-2 rounded-2xl border border-white/20 shadow-inner">
                        {caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const code = caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker);
                          navigator.clipboard.writeText(code);
                          alert(`Copied Referral Code: ${code}`);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#c9a24c] hover:bg-[#b08726] text-[#1e2a5a] font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                      >
                        <Copy className="h-4 w-4" /> Copy Code
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Generated automatically from your name + phone number.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#f5d77f] uppercase tracking-wider block">1-Click Shareable Apply Link</span>
                    <div className="bg-black/30 rounded-2xl p-3 border border-white/15 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-xs font-mono text-slate-200 truncate select-all">
                        {typeof window !== "undefined" ? `${window.location.origin}/login?ref=${caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker)}&type=caretaker` : `/login?ref=${getCaregiverReferralCode(caretaker)}&type=caretaker`}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/login?ref=${caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker)}&type=caretaker`;
                          navigator.clipboard.writeText(url);
                          alert(`Copied your personal referral link:\n${url}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-all border border-white/20"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      When someone clicks this link, your code is auto-locked into their registration!
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Namaste! Join Amma Seva as a caregiver or nurse in Hyderabad. Great daily/monthly payouts, flexible shifts & doctor-backed support.\n\nRegister directly using my referral link:\n${typeof window !== "undefined" ? window.location.origin : "https://ammaseva.in"}/login?ref=${caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker)}&type=caretaker`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <Send className="h-4 w-4" /> Share on WhatsApp
                  </a>

                  <a
                    href={typeof window !== "undefined" ? `/login?ref=${caretakerReferralsData?.referCode || getCaregiverReferralCode(caretaker)}&type=caretaker` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4" /> Preview Caretaker Registration Page
                  </a>
                </div>
              </div>

              {/* Members Joined via My Referral Code Table / Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#c9a24c]" /> Members Joined via My Referral Link ({caretakerReferralsData?.members?.length || 0})
                  </h3>
                </div>

                {(!caretakerReferralsData?.members || caretakerReferralsData.members.length === 0) ? (
                  <div className="bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-500 space-y-3">
                    <Gift className="h-10 w-10 text-slate-300 mx-auto" />
                    <div>
                      <h4 className="font-bold text-base text-slate-800">No members have joined yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Share your referral link on WhatsApp with other nurses, elder care attendants, and health assistants. Once they apply, they will appear here!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/80 text-xs text-[#1e2a5a] uppercase font-bold tracking-wider">
                            <th className="py-3.5 px-5">Candidate Name</th>
                            <th className="py-3.5 px-5">Specialty</th>
                            <th className="py-3.5 px-5">Experience</th>
                            <th className="py-3.5 px-5">Joined Date</th>
                            <th className="py-3.5 px-5">Location</th>
                            <th className="py-3.5 px-5 text-right">Verification Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {caretakerReferralsData.members.map((member: any) => (
                            <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3.5 px-5">
                                <div className="font-bold text-[#1e2a5a]">{member.name}</div>
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-600 font-medium">
                                {member.specialty}
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-500">
                                {member.experience} years
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-500">
                                {new Date(member.joinedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-600">
                                {member.city}, {member.state}
                              </td>
                              <td className="py-3.5 px-5 text-right">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                                  member.status === "Verified" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                                  member.status === "Rejected" ? "bg-rose-50 text-rose-800 border-rose-200" :
                                  "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                  {member.status === "Verified" ? "✓ Verified" :
                                   member.status === "Rejected" ? "✗ Rejected" : "⏳ Review Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* How it Works Step-by-Step */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-base font-extrabold text-[#1e2a5a] font-display">
                  How the Referral Program Works
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                    <span className="h-8 w-8 rounded-full bg-[#1e2a5a] text-white flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">Share Your Link</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Send your link to nurses, geriatric caregivers, post-operative attendants, and physiotherapists.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                    <span className="h-8 w-8 rounded-full bg-[#c9a24c] text-[#1e2a5a] flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">Automatic Code Lock</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      The applicant submits with your referral code automatically locked so you receive 100% credit.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                    <span className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">Verification &amp; Payouts</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Admin verifies their KYC credentials and assigns them to active customer shifts across Hyderabad.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</SiteLayout>
);
}

  return (
    <SiteLayout>
      <div className="min-h-screen bg-[#faf8f5] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-[#c9a24c]/20 selection:text-[#0b183b]">
        {/* Ambient background soft glow effects */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#c9a24c]/10 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="mx-auto max-w-[1440px] relative z-10">
          
          {/* Executive Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-[#c9a24c]/35 bg-gradient-to-r from-[#091129] via-[#0f1d44] to-[#182858] p-6 sm:p-9 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 text-left">
            {/* Ambient inner glow orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#c9a24c]/15 via-transparent to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-5 relative z-10">
              {/* Dual-ring gold avatar */}
              <div className="p-0.5 rounded-2xl bg-gradient-to-tr from-[#c9a24c] via-[#ecd599] to-[#c9a24c] shadow-lg shadow-black/30 shrink-0">
                <div className="h-16 w-16 rounded-[14px] bg-[#091129] flex items-center justify-center font-display font-black text-2xl text-[#c9a24c] uppercase tracking-wider select-none">
                  {(user?.name || "P").substring(0, 2)}
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-bold uppercase tracking-widest text-[#e4c277] mb-1.5 shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Verified Customer Portal</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display leading-tight text-white">
                  Welcome back, <span className="bg-gradient-to-r from-[#edd69c] via-[#f7e8c2] to-[#c9a24c] bg-clip-text text-transparent">{user?.name || "Patient"}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300/90 mt-1 max-w-xl leading-relaxed">
                  Manage your homecare bookings, track assigned verified caregivers, and schedule new care shifts.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 relative z-10">
              <button
                onClick={() => setActiveView(activeView === "bookings" ? "new-booking" : "bookings")}
                className="px-6 py-3.5 bg-gradient-to-r from-[#d8b456] via-[#c9a24c] to-[#b88d30] hover:from-[#e0be67] hover:to-[#c4983b] text-[#091129] text-xs font-extrabold uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#c9a24c]/20 hover:shadow-xl hover:shadow-[#c9a24c]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all font-sans w-full sm:w-auto"
              >
                {activeView === "bookings" ? (
                  <>
                    <Calendar className="h-4 w-4" /> Book New Service
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" /> View My Bookings
                  </>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-3.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-rose-500/15 hover:border-rose-500/40 text-slate-200 hover:text-rose-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 active:translate-y-0 backdrop-blur-md font-sans w-full sm:w-auto"
              >
                Sign Out
              </button>
            </div>
          </div>
 
          {/* Quick Metrics Statistics Grid */}
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* 1. Total Bookings */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-6 text-left shadow-sm hover:border-[#c9a24c]/50 hover:shadow-xl hover:shadow-[#c9a24c]/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <Calendar className="absolute -right-3 -bottom-3 h-24 w-24 text-slate-100/70 group-hover:text-amber-500/10 transition-colors pointer-events-none -z-0" />
              <div className="flex items-center gap-4 relative z-10">
                <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-[#b38b32] border border-amber-500/25 shadow-inner">
                  <Calendar className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Bookings</div>
                  <div className="text-2xl font-black text-[#0b183b] font-display mt-0.5">{bookings.length}</div>
                  <span className="inline-block text-[10px] text-slate-500 font-semibold mt-0.5">Lifetime care requests</span>
                </div>
              </div>
            </div>
 
            {/* 2. Assigned Caregivers */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-6 text-left shadow-sm hover:border-[#c9a24c]/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <User className="absolute -right-3 -bottom-3 h-24 w-24 text-slate-100/70 group-hover:text-indigo-500/10 transition-colors pointer-events-none -z-0" />
              <div className="flex items-center gap-4 relative z-10">
                <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e2a5a]/15 to-[#1e2a5a]/5 text-[#1e2a5a] border border-[#1e2a5a]/25 shadow-inner">
                  <User className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Caregivers</div>
                  <div className="text-2xl font-black text-[#0b183b] font-display mt-0.5">
                    {bookings.filter(b => b.assignedStaff && b.status !== "Cancelled").length} Active
                  </div>
                  <span className="inline-block text-[10px] text-emerald-600 font-semibold mt-0.5">Verified clinical staff</span>
                </div>
              </div>
            </div>
 
            {/* 3. Total Spend (Paid) */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-6 text-left shadow-sm hover:border-[#c9a24c]/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <DollarSign className="absolute -right-3 -bottom-3 h-24 w-24 text-slate-100/70 group-hover:text-emerald-500/10 transition-colors pointer-events-none -z-0" />
              <div className="flex items-center gap-4 relative z-10">
                <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 border border-emerald-500/25 shadow-inner">
                  <DollarSign className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Spend (Paid)</div>
                  <div className="text-2xl font-black text-slate-800 font-display mt-0.5 font-sans">
                    ₹{bookings.reduce((sum, b) => sum + Number(b.advancePaid || 0), 0).toLocaleString()}
                  </div>
                  <span className="inline-block text-[10px] text-emerald-600 font-semibold mt-0.5">Verified advance paid</span>
                </div>
              </div>
            </div>
 
            {/* 4. Pending Balance */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-6 text-left shadow-sm hover:border-[#c9a24c]/50 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
              <CreditCard className="absolute -right-3 -bottom-3 h-24 w-24 text-slate-100/70 group-hover:text-rose-500/10 transition-colors pointer-events-none -z-0" />
              <div className="flex items-center gap-4 relative z-10">
                <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-rose-600 border border-rose-500/25 shadow-inner">
                  <CreditCard className="h-6 w-6" />
                </span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Balance</div>
                  <div className="text-2xl font-black text-slate-800 font-display mt-0.5 font-sans">
                    ₹{bookings.filter(b => b.status !== "Cancelled" && b.paymentStatus !== "Paid").reduce((sum, b) => sum + Number(b.balanceAmount || 0), 0).toLocaleString()}
                  </div>
                  <span className="inline-block text-[10px] text-amber-600 font-semibold mt-0.5">Pay after service delivery</span>
                </div>
              </div>
            </div>
          </div>
 
          {/* Main Workspace View */}
          {/* Announcement Banners for Customer */}
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-gradient-to-r from-amber-600 via-amber-700 to-[#b88d30] text-white px-6 py-4 rounded-3xl flex items-center justify-between shadow-md border border-amber-400/40 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xl animate-bounce">📢</span>
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-100">Broadcaster Alert</span>
                  <p className="text-sm font-semibold">{ann.message}</p>
                </div>
              </div>
              <span className="text-[10px] text-amber-100 font-semibold shrink-0 ml-4">{new Date(ann.createdAt).toLocaleDateString()}</span>
            </div>
          ))}

          {activeView === "bookings" ? (
            
            // MY BOOKINGS VIEW
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#0b183b] font-display flex items-center gap-2.5 text-left">
                    <Calendar className="h-6 w-6 text-[#c9a24c]" /> My Healthcare Shifts
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 text-left">View active shifts, monitor live caregiver allocations, download invoices, or reschedule.</p>
                </div>

                <button
                  onClick={() => setActiveView("new-booking")}
                  className="px-5 py-2.5 bg-[#0b183b] hover:bg-[#162554] text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition-all self-start sm:self-auto"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#c9a24c]" /> Schedule New Shift
                </button>
              </div>

              {/* Luxury Filter Controls */}
              <div className="grid gap-4 md:grid-cols-3 bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm text-left">
                {/* Search Anything */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Search className="h-3 w-3 text-slate-400" /> Search Shifts
                  </label>
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search service, name, address, needs..."
                    className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/15 transition-all text-slate-800"
                  />
                </div>
                
                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" /> From Date
                  </label>
                  <input
                    type="date"
                    value={customerStartDate}
                    onChange={(e) => setCustomerStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/15 transition-all text-slate-800"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-400" /> To Date
                  </label>
                  <input
                    type="date"
                    value={customerEndDate}
                    onChange={(e) => setCustomerEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:border-[#c9a24c] focus:ring-2 focus:ring-[#c9a24c]/15 transition-all text-slate-800"
                  />
                </div>
              </div>
 
              {(() => {
                const sortedFiltered = sortShiftsOrBookings(
                  filterShiftsOrBookings(bookings, customerSearch, customerStartDate, customerEndDate)
                );
 
                if (isLoading) {
                  return (
                    <div className="flex justify-center py-20">
                      <div className="w-10 h-10 border-3 border-[#c9a24c] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  );
                }
 
                if (dashboardError) {
                  return (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-destructive flex gap-3 items-center text-left">
                      <AlertTriangle className="h-6 w-6 shrink-0" />
                      <div>
                        <span className="font-bold">Sync Error: </span>{dashboardError}
                      </div>
                    </div>
                  );
                }
 
                if (bookings.length === 0) {
                  return (
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-12 text-center shadow-sm">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-primary">No active bookings</h3>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">You haven't requested any care shifts yet. Get started by booking a verified homecare service.</p>
                      <button
                        onClick={() => setActiveView("new-booking")}
                        className="btn-primary mt-6 text-xs py-2 px-4 cursor-pointer"
                      >
                        Request Booking Now
                      </button>
                    </div>
                  );
                }
 
                if (sortedFiltered.length === 0) {
                  return (
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-12 text-center shadow-sm">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-[#1e2a5a] font-display">No matching bookings</h3>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Adjust your search query or date range filters to find other requested shifts.</p>
                    </div>
                  );
                }
 
                return (
                  <div className="grid gap-6">
                    {sortedFiltered.map((booking) => {
                      const isExpanded = expandedBookingIds[booking.id] !== undefined
                        ? expandedBookingIds[booking.id]
                        : (booking.status !== "Completed" && booking.status !== "Cancelled");
                      const isActive = booking.status !== "Completed" && booking.status !== "Cancelled";

                      return (
                        <div
                          key={booking.id}
                          className={`rounded-3xl border border-slate-200/60 p-6 sm:p-7 shadow-sm transition-all duration-300 flex flex-col lg:flex-row justify-between gap-6 text-left ${
                            isActive
                              ? "bg-white border-l-4 border-l-[#c9a24c] hover:shadow-md hover:shadow-slate-100/40 hover:border-[#c9a24c]/50"
                              : booking.status === "Cancelled"
                                ? "bg-gradient-to-br from-white to-rose-50/5 hover:border-slate-300"
                                : "bg-gradient-to-br from-white to-slate-50/40 hover:border-slate-350"
                          }`}
                        >
                          <div className="space-y-4 flex-1">
                            {/* Summary Header */}
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-[#c9a24c]">Shift #{booking.id}</span>
                                <h3 className="text-xl font-bold text-[#1e2a5a] font-display mt-0.5">{booking.service}</h3>
                                {!isExpanded && (
                                  <div className="flex items-center gap-2 flex-wrap mt-2.5">
                                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-500 font-bold">📅 {booking.date} at {booking.time}</span>
                                    <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-500 font-bold">⏱ {booking.duration}</span>
                                    <span className="inline-flex items-center gap-1 bg-[#c9a24c]/10 px-2 py-0.5 rounded text-[10px] text-[#c9a24c] font-extrabold">₹{booking.amount}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-xl border ${
                                  booking.status === "Confirmed" ? "bg-emerald-50 text-emerald-800 border-emerald-100 shadow-sm" :
                                  booking.status === "Cancelled" ? "bg-rose-50 text-rose-800 border-rose-100 shadow-sm" :
                                  booking.status === "Completed" ? "bg-indigo-50 text-indigo-800 border-indigo-100 shadow-sm" :
                                  "bg-amber-50 text-amber-800 border-amber-100 shadow-sm animate-pulse"
                                }`}>
                                  {booking.status}
                                </span>
                                
                                {(booking.status === "Completed" || booking.status === "Cancelled") && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedBookingIds(prev => ({ ...prev, [booking.id]: !isExpanded }))}
                                    className="px-3 py-1.5 border border-[#c9a24c]/50 hover:bg-[#c9a24c] hover:text-white text-[#c9a24c] rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                                  >
                                    {isExpanded ? "Hide Details" : "View Details"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <>
 
                        {/* Booking Tracker Visual Pipeline (Stepper) */}
                        {booking.status !== "Cancelled" && (
                          <div className="pt-4 pb-2 border-t border-slate-150/60">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 text-left">Care tracker status</span>
                            <div className="grid grid-cols-4 gap-2 relative">
                              {/* Connecting timeline background bar */}
                              <div className="absolute top-[11px] left-[12%] right-[12%] h-[3px] bg-slate-100 -z-0" />
                              {/* Connecting timeline active filled bar */}
                              <div 
                                className="absolute top-[11px] left-[12%] h-[3px] bg-[#c9a24c] transition-all duration-500 -z-0" 
                                style={{ 
                                  width: booking.status === "Completed" ? "76%" : 
                                         (booking.status === "Confirmed" || booking.status === "Active") && booking.assignedStaff ? "51%" :
                                         booking.status === "Confirmed" || booking.status === "Active" ? "25%" : "0%"
                                }} 
                              />
                              {/* Step 1: Request Pending */}
                              <div className="text-center relative z-10">
                                <div className="h-6 w-6 rounded-full bg-[#c9a24c] text-white flex items-center justify-center mx-auto text-xs font-bold shadow-sm border border-white">
                                  <Check className="h-3.5 w-3.5" />
                                </div>
                                <span className="block text-[9px] font-bold text-slate-650 mt-1">Requested</span>
                                <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{formatStepTime(booking.createdAt)}</span>
                              </div>
 
                              {/* Step 2: Confirmed */}
                              <div className="text-center relative z-10">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold border border-white ${
                                  booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed"
                                    ? "bg-[#1e2a5a] text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed" ? <Check className="h-3.5 w-3.5" /> : "2"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-650 mt-1">Confirmed</span>
                                <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{booking.confirmedAt ? formatStepTime(booking.confirmedAt) : "Pending"}</span>
                              </div>
 
                              {/* Step 3: Caretaker Assigned */}
                              <div className="text-center relative z-10">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold border border-white ${
                                  (booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed") && booking.assignedStaff
                                    ? "bg-[#1e2a5a] text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {(booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed") && booking.assignedStaff ? <Check className="h-3.5 w-3.5" /> : "3"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-650 mt-1">
                                  {booking.status === "Active" ? "Staff Active" : "Staff Assigned"}
                                </span>
                                <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{booking.assignedAt ? formatStepTime(booking.assignedAt) : "Pending"}</span>
                              </div>
 
                              {/* Step 4: Completed */}
                              <div className="text-center relative z-10">
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold border border-white ${
                                  booking.status === "Completed"
                                    ? "bg-[#c9a24c] text-white shadow-sm"
                                    : "bg-slate-100 text-slate-400"
                                }`}>
                                  {booking.status === "Completed" ? <Check className="h-3.5 w-3.5" /> : "4"}
                                </div>
                                <span className="block text-[9px] font-bold text-slate-650 mt-1">Delivered</span>
                                <span className="block text-[8px] text-slate-400 font-bold mt-0.5">{booking.completedAt ? formatStepTime(booking.completedAt) : "Pending"}</span>
                              </div>
 
                            </div>
                          </div>
                        )}

                        {/* Metadata Rows */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block mb-0.5">Date &amp; Time</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" /> {booking.date} at {booking.time}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Duration</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-400" /> {booking.duration}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Caregiver Assigned</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              {booking.assignedStaff || "Allocating staff..."}
                            </span>
                          </div>
                          <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-2xl space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Invoice Billing</span>
                            <div className="flex justify-between items-center gap-1.5">
                              <span className="text-xs font-extrabold text-[#1e2a5a]">
                                ₹{Number(booking.amount).toLocaleString()}
                              </span>
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${
                                booking.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                booking.paymentStatus === 'Advance Paid' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                {booking.paymentStatus}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-500 border-t border-slate-200/60 pt-1 flex justify-between gap-2 font-medium">
                              <span>Paid: <strong className="text-slate-700">₹{Number(booking.advancePaid || 0).toLocaleString()}</strong></span>
                              <span>Bal: <strong className="text-amber-750">₹{Number(booking.balanceAmount || 0).toLocaleString()}</strong></span>
                            </div>
                          </div>
                        </div>

                        {booking.address && (
                          <div className="text-xs pt-2">
                            <span className="text-slate-400 block mb-0.5">Care Address</span>
                            <span className="text-slate-600 flex items-start gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" /> {booking.address}
                            </span>
                          </div>
                        )}

                        {(booking.patientName || booking.prescription || booking.googleMapLocation) && (
                          <div className="text-xs pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-100/50 mt-2">
                            {booking.patientName && (
                              <div>
                                <span className="text-slate-400 block mb-0.5">Patient Details</span>
                                <span className="text-slate-700 font-semibold">
                                  👤 {booking.patientName} ({booking.patientAge} years)
                                </span>
                                {booking.patientNeeds && (
                                  <p className="text-[10px] text-slate-500 italic mt-0.5">Needs: {booking.patientNeeds}</p>
                                )}
                              </div>
                            )}
                            <div className="space-y-1">
                              {booking.googleMapLocation && (
                                <a 
                                  href={booking.googleMapLocation} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] text-indigo-600 hover:underline font-bold block"
                                >
                                  🗺 Open Google Map Location
                                </a>
                              )}
                              {booking.prescription && (
                                <button
                                  type="button"
                                  onClick={() => openDocViewer(booking.prescription, "Doctor Prescription / Case File", booking.patientName || booking.name, "Patient Medical Record")}
                                  className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                                >
                                  <Eye className="h-2.5 w-2.5" />
                                  <span>📄 Doctor Prescription / Case File</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {booking.caregiverDetails && (
                          <div className="mt-4 border border-indigo-100 bg-indigo-50/20 p-5 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-indigo-100/50">
                              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 font-display">
                                <User className="h-4 w-4" /> Assigned Caregiver Profile
                              </span>
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-semibold">Verified Professional</span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                              {booking.caregiverDetails.profilePhoto ? (
                                <img 
                                  src={booking.caregiverDetails.profilePhoto} 
                                  className="h-16 w-16 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" 
                                  alt={booking.caregiverDetails.name} 
                                />
                              ) : (
                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200 shadow-sm">
                                  <User className="h-8 w-8" />
                                </div>
                              )}
                              
                              <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
                                <h4 className="text-base font-bold text-slate-800">{booking.caregiverDetails.name}</h4>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-slate-500">
                                  <span>Role: <strong className="text-slate-700 font-semibold">{booking.caregiverDetails.specialty}</strong></span>
                                  <span>•</span>
                                  <span>Experience: <strong className="text-slate-700 font-semibold">{booking.caregiverDetails.experience}+ years</strong></span>
                                </div>
                                {booking.caregiverDetails.experienceDetails && (
                                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed italic">
                                    &ldquo;{booking.caregiverDetails.experienceDetails}&rdquo;
                                  </p>
                                )}
                              </div>

                              <div className="shrink-0 pt-1">
                                <a 
                                  href={`tel:${booking.caregiverDetails.phone}`} 
                                  className="btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
                                >
                                  <Phone className="h-3.5 w-3.5" /> Call Caregiver
                                </a>
                              </div>
                            </div>
                           {/* Digital Shift Care Log & Vitals Tracker */}
                        {booking.assignedStaff && (booking.status === "Confirmed" || booking.status === "Active" || booking.status === "Completed") && (() => {
                          let vitalsObj = null;
                          if (booking.vitals) {
                            try {
                              vitalsObj = typeof booking.vitals === 'string' ? JSON.parse(booking.vitals) : booking.vitals;
                            } catch (e) {
                              vitalsObj = null;
                            }
                          }
                          let logsArray = [];
                          if (booking.careLogs) {
                            try {
                              logsArray = typeof booking.careLogs === 'string' ? JSON.parse(booking.careLogs) : booking.careLogs;
                            } catch (e) {
                              logsArray = [];
                            }
                          }
                          return (
                            <div className="mt-4 border border-emerald-100 bg-emerald-50/15 p-5 rounded-2xl space-y-4">
                              <div className="flex justify-between items-center pb-2 border-b border-emerald-100/50">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 font-display">
                                  📊 Real-Time Vitals & Care Log
                                </span>
                                <span className={`text-[9px] px-2.5 py-0.5 rounded-full border font-bold tracking-wider uppercase ${
                                  booking.status === 'Active' ? 'text-emerald-600 bg-emerald-50 border-emerald-200/50 animate-pulse' : 'text-slate-400 bg-slate-105 border-slate-200'
                                }`}>
                                  {booking.status === 'Active' ? 'Live Updates' : 'Shift Log History'}
                                </span>
                              </div>

                              {vitalsObj ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/40 text-left">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Blood Pressure</span>
                                    <span className="block text-sm font-extrabold text-slate-800 mt-0.5">{vitalsObj.bloodPressure || 'N/A'}</span>
                                    <span className="text-[8px] text-emerald-600 font-semibold block mt-0.5">Updated</span>
                                  </div>
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/40 text-left">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Pulse Rate</span>
                                    <span className="block text-sm font-extrabold text-slate-800 mt-0.5">{vitalsObj.pulseRate || 'N/A'}</span>
                                    <span className="text-[8px] text-emerald-600 font-semibold block mt-0.5">Updated</span>
                                  </div>
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/40 text-left">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Body Temp</span>
                                    <span className="block text-sm font-extrabold text-slate-800 mt-0.5">{vitalsObj.bodyTemp || 'N/A'}</span>
                                    <span className="text-[8px] text-emerald-600 font-semibold block mt-0.5">Updated</span>
                                  </div>
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100/40 text-left">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Blood Glucose</span>
                                    <span className="block text-sm font-extrabold text-slate-800 mt-0.5">{vitalsObj.bloodGlucose || 'N/A'}</span>
                                    <span className="text-[8px] text-emerald-600 font-semibold block mt-0.5 font-sans">Updated</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500 italic p-4 bg-white/50 border border-slate-100 rounded-xl text-center">
                                  ⏳ Caregiver has not logged vitals for this shift yet.
                                </div>
                              )}

                              <div className="space-y-3 bg-white/70 p-3 rounded-xl border border-emerald-100/40 text-left">
                                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Shift Progress Logs</span>
                                {logsArray.length > 0 ? (
                                  <div className="space-y-2 text-xs">
                                    {logsArray.map((log: any, lIdx: number) => (
                                      <div key={lIdx} className="flex gap-2.5 items-start font-sans">
                                        <span className="text-[9px] font-bold text-slate-400 shrink-0 mt-0.5 bg-slate-100 px-1.5 py-0.5 rounded">{log.time}</span>
                                        <p className="text-slate-650 leading-relaxed text-left">{log.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-400 italic text-center py-2">
                                    No activity logs recorded yet for this shift.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                        {/* Caregiver Performance Rating & Review widget */}
                        {booking.status === "Completed" && booking.assignedStaff && !booking.isReviewed && (
                          <div className="mt-4 border border-amber-100 bg-amber-50/20 p-5 rounded-2xl space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-amber-100/50">
                              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 font-display">
                                🌟 Rate Caregiver Performance
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">Shift Completed</span>
                            </div>

                            {submittingReviewBookingId === booking.id ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Rating Star Score</label>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => setReviewRating(star)}
                                        className={`h-9 w-9 rounded-xl border text-base font-bold flex items-center justify-center transition-colors cursor-pointer ${
                                          reviewRating >= star 
                                            ? "bg-amber-500 border-amber-500 text-white" 
                                            : "bg-white border-slate-200 text-slate-400 hover:border-amber-300"
                                        }`}
                                      >
                                        ⭐
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Write Feedback Comment</label>
                                  <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Tell us about the caregiver's punctuality, care quality, or bedside manners..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-xs text-slate-700"
                                  />
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setSubmittingReviewBookingId(null)}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const token = localStorage.getItem("ammaseva_user_token");
                                      if (!token) return;
                                      setIsReviewSubmitting(true);
                                      try {
                                        const res = await fetch("/api/reviews", {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${token}`
                                          },
                                          body: JSON.stringify({
                                            bookingId: booking.id,
                                            caregiverName: booking.assignedStaff,
                                            rating: reviewRating,
                                            comment: reviewComment
                                          })
                                        });
                                        if (res.ok) {
                                          fetchBookings();
                                          setSubmittingReviewBookingId(null);
                                          setReviewComment("");
                                          setReviewRating(5);
                                        }
                                      } catch (err) {
                                        console.error(err);
                                      } finally {
                                        setIsReviewSubmitting(false);
                                      }
                                    }}
                                    disabled={isReviewSubmitting}
                                    className="btn-primary inline-flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
                                  >
                                    {isReviewSubmitting ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span> : "Submit Care Review"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center bg-white border border-slate-100 rounded-xl p-3 shadow-inner">
                                <p className="text-xs text-slate-500 font-medium">Please share your experience with <strong className="text-slate-700">{booking.assignedStaff}</strong> to help us improve quality.</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubmittingReviewBookingId(booking.id);
                                    setReviewRating(5);
                                    setReviewComment("");
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shrink-0"
                                >
                                  Rate &amp; Review
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {booking.status === "Completed" && booking.isReviewed && booking.review && (
                          <div className="mt-4 border border-slate-100 bg-slate-50/50 p-5 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-display">
                                💬 Submitted Feedback
                              </span>
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-bold flex items-center gap-0.5">
                                ⭐ {booking.review.rating}.0
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 italic leading-relaxed">&ldquo;{booking.review.comment || "No written comments submitted."}&rdquo;</p>
                          </div>
                        )}
                            </>
                          )}
                      </div>

                      {/* Action buttons */}
                      {isExpanded && (
                        <div className="flex flex-col sm:flex-row lg:flex-col justify-end gap-2.5 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100/80 pt-4 lg:pt-0 lg:pl-6">
                          {booking.status !== "Cancelled" && (booking.paymentStatus === "Advance Paid" || booking.paymentStatus === "Unpaid") && Number(booking.balanceAmount) > 0 && (
                            <button
                              onClick={() => handlePayBalance(booking)}
                              className="px-4 py-2.5 rounded-xl bg-emerald-600 border border-emerald-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 cursor-pointer transition-all hover:translate-y-[-1px] text-center w-full sm:w-auto"
                            >
                              Pay Balance (₹{booking.balanceAmount})
                            </button>
                          )}
                           {booking.status !== "Cancelled" && booking.status !== "Completed" && (
                            <>
                              <button
                                onClick={() => {
                                  setEditBookingId(booking.id);
                                  setEditPatientName(booking.patientName || "");
                                  setEditPatientAge(booking.patientAge || "");
                                  setEditPatientNeeds(booking.patientNeeds || "");
                                  setEditAddress(booking.address || "");
                                  setEditGoogleMapLocation(booking.googleMapLocation || "");
                                  setIsEditModalOpen(true);
                                }}
                                className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer transition-all hover:translate-y-[-1px] text-center w-full sm:w-auto"
                              >
                                Edit Details
                              </button>
                              <button
                                onClick={() => {
                                  setRescheduleBookingId(booking.id);
                                  setRescheduleDate(booking.date);
                                  setRescheduleTime(booking.time);
                                }}
                                className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 cursor-pointer transition-all hover:translate-y-[-1px] text-center w-full sm:w-auto"
                              >
                                Reschedule Shift
                              </button>
                              <button
                                onClick={() => handleCancel(booking.id)}
                                className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider hover:bg-rose-500 hover:text-white cursor-pointer transition-all hover:translate-y-[-1px] text-center w-full sm:w-auto"
                              >
                                Cancel Booking
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setActiveInvoice(booking)}
                            className="px-4 py-2.5 rounded-xl bg-[#1e2a5a] border border-[#1e2a5a]/10 text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1e2a5a]/90 cursor-pointer transition-all hover:translate-y-[-1px] flex items-center justify-center gap-1.5 w-full sm:w-auto"
                          >
                            <Download className="h-3.5 w-3.5" /> Invoice PDF
                          </button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                  </div>
                );
              })()}
            </div>
          ) : (
            // NEW BOOKING VIEW
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/40 p-4 sm:p-10 text-left animate-fade-in relative overflow-hidden">
              {/* Subtle top brand accent line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-gold to-primary" />
              
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border border-gold/40 flex items-center justify-center text-primary shadow-inner">
                    <Calendar className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-primary font-display tracking-tight">
                        Schedule Verified Home Care
                      </h2>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Caregivers
                      </span>
                    </div>
                    <p className="text-xs text-slate-450 mt-0.5">
                      Fast, background-verified caretaker allocation with escrow payment protection.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
                    Step <strong className="text-primary font-bold">{bookingStep}</strong> of 3
                  </span>
                </div>
              </div>

              {/* Progress Stepper Navigation Bar */}
              <div className="relative mb-10 max-w-2xl mx-auto px-2">
                {/* Background line */}
                <div className="absolute top-1/2 -translate-y-1/2 left-8 right-8 h-1 bg-slate-100 rounded-full -z-0" />
                {/* Active progress line */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 left-8 h-1 bg-gradient-to-r from-primary via-gold to-gold rounded-full transition-all duration-500 -z-0" 
                  style={{ width: bookingStep === 1 ? "0%" : bookingStep === 2 ? "45%" : "88%" }} 
                />

                <div className="flex justify-between items-center relative z-10">
                  {[
                    { step: 1, label: "1. Service & Schedule", icon: "✨" },
                    { step: 2, label: "2. Patient Profile", icon: "👤" },
                    { step: 3, label: "3. Location & Pay", icon: "💳" }
                  ].map((s) => {
                    const isActive = bookingStep === s.step;
                    const isCompleted = bookingStep > s.step;

                    return (
                      <button
                        type="button"
                        key={s.step}
                        onClick={() => {
                          if (s.step === 1) setBookingStep(1);
                          else if (s.step === 2 && validateStep1()) setBookingStep(2);
                          else if (s.step === 3 && validateStep1() && validateStep2()) setBookingStep(3);
                        }}
                        className={`group flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 cursor-pointer shadow-xs ${
                          isActive
                            ? "bg-gradient-to-r from-[#0b183b] to-[#1e2a5a] text-gold border-2 border-gold/80 shadow-md shadow-gold/20 scale-105"
                            : isCompleted
                              ? "bg-emerald-50 text-emerald-800 border-2 border-emerald-400 hover:bg-emerald-100"
                              : "bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                          isActive ? "bg-gold text-primary font-black" : isCompleted ? "bg-emerald-500 text-white font-bold" : "bg-slate-100 text-slate-500"
                        }`}>
                          {isCompleted ? "✓" : s.step}
                        </span>
                        <span className="hidden sm:inline font-display tracking-tight">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-8">
                
                {/* STEP 1: SERVICE & SCHEDULING DETAILS */}
                {bookingStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Select Service */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Select Healthcare or MTP Service
                        </label>
                        <div className="relative">
                          <select
                            value={selectedServiceId}
                            onChange={(e) => setSelectedServiceId(e.target.value)}
                            className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none transition-all focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-semibold cursor-pointer"
                          >
                            <optgroup label="🌟 Standard Caregiver & Clinical Services">
                              {servicesList
                                .filter(s => !s.isMtp)
                                .map(s => (
                                  <option key={s.id} value={s.id}>{s.title} (₹{s.rate}/{s.unit})</option>
                                ))
                              }
                            </optgroup>
                            {servicesList.some(s => s.isMtp) && (
                              <optgroup label="🚗 MTP & Multi-Tasking Tasks (Zero Advance / Pay on Service)">
                                {servicesList
                                  .filter(s => s.isMtp)
                                  .map(s => (
                                    <option key={s.id} value={s.id}>✨ {s.title} — Pay on Service / Custom Quote</option>
                                  ))
                                }
                              </optgroup>
                            )}
                          </select>
                        </div>

                        {/* Service Description Card */}
                        {currentService?.desc && (
                          <div className="mt-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-slate-600 text-xs flex items-start gap-2.5">
                            <span className="text-gold text-base shrink-0">✦</span>
                            <span className="leading-relaxed font-medium">{currentService?.desc}</span>
                          </div>
                        )}
                      </div>

                      {/* MTP Notice Banner */}
                      {currentService?.isMtp && (
                        <div className="md:col-span-2 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50/40 p-5 text-amber-950 text-xs flex gap-3.5 items-start shadow-xs">
                          <div className="p-2 rounded-xl bg-amber-200/60 text-amber-800 shrink-0">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <span className="font-extrabold block text-sm text-amber-950 font-display">
                              🚗 Multi-Tasking Professional (MTP) Service Selected
                            </span>
                            <p className="text-amber-900 text-[11px] leading-relaxed font-medium">
                              Payment terms for this dynamic MTP service are on a <strong>Pay on Service / Custom Quote</strong> basis. You do <strong>NOT</strong> need to pay any advance online right now. Book the task, and our care coordinator will confirm assignment and rates.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Duration Selector */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          {currentService?.isMtp ? "Service Frequency / Shifts" : "Billing Option"}
                        </label>
                        <select
                          value={bookingDuration}
                          onChange={(e) => {
                            setBookingDuration(e.target.value);
                            setDurationCount(1);
                          }}
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none transition-all focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-semibold cursor-pointer"
                        >
                          <option value="Daily">{currentService?.isMtp ? "Task / Visit Shift" : "Daily"}</option>
                          <option value="Hourly">Hourly</option>
                          {!currentService?.isMtp && <option value="Weekly">Weekly</option>}
                          {!currentService?.isMtp && <option value="Monthly">Monthly</option>}
                        </select>
                      </div>

                      {/* Duration Count Multiplier */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex justify-between items-center">
                          <span>
                            {currentService?.isMtp 
                              ? (bookingDuration === "Hourly" ? "Number of Hours" : "Number of Tasks / Visits")
                              : (bookingDuration === "Hourly" ? "Number of Hours" :
                                 bookingDuration === "Daily" ? "Number of Days" :
                                 bookingDuration === "Weekly" ? "Number of Weeks" : "Number of Months")}
                          </span>
                          {!currentService?.isMtp && (
                            <span className="text-[11px] text-primary font-bold px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30">
                              ₹{
                                bookingDuration === "Hourly" ? getServiceRates().hourly :
                                bookingDuration === "Daily" ? getServiceRates().daily :
                                bookingDuration === "Weekly" ? getServiceRates().weekly :
                                getServiceRates().monthly
                              } / {
                                bookingDuration === "Hourly" ? "hr" :
                                bookingDuration === "Daily" ? "day" :
                                bookingDuration === "Weekly" ? "wk" : "mo"
                              }
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={durationCount}
                          onChange={(e) => setDurationCount(Math.max(1, Number(e.target.value)))}
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none transition-all focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-semibold"
                        />
                      </div>

                      {/* Date selection */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Preferred Start Date
                        </label>
                        <input
                          type="date"
                          required
                          min={new Date().toLocaleDateString("en-CA")}
                          max="2099-12-31"
                          value={bookingDate}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val) {
                              const parts = val.split("-");
                              if (parts[0] && parts[0].length > 4) {
                                parts[0] = parts[0].slice(0, 4);
                                val = parts.join("-");
                              }
                            }
                            setBookingDate(val);
                          }}
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none transition-all focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-semibold cursor-pointer"
                        />
                      </div>

                      {/* Time selection */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Shift Start Time
                        </label>
                        <input
                          type="time"
                          required
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none transition-all focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-semibold cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep1()) setBookingStep(2);
                        }}
                        className="btn-primary py-2.5 sm:py-3 px-5 sm:px-8 font-bold text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all whitespace-nowrap"
                      >
                        Next: Patient Profile <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: PATIENT PROFILE DETAILS */}
                {bookingStep === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Patient Name */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Patient Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(sanitizeName(e.target.value))}
                          placeholder="e.g. Ramesh Chandra / Smt. Lakshmi"
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none transition-all focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-semibold"
                        />
                      </div>

                      {/* Patient Age */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex justify-between items-center">
                          <span>Patient Age</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Max 2 Digits</span>
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          required
                          value={patientAge}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                            setPatientAge(val);
                          }}
                          placeholder="e.g. 72"
                          className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none transition-all focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-semibold"
                        />
                      </div>
                    </div>

                    {/* Patient Special Needs */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Medical Conditions &amp; Special Care Instructions
                      </label>
                      <textarea
                        rows={3}
                        value={patientNeeds}
                        onChange={(e) => setPatientNeeds(e.target.value)}
                        placeholder="Describe specific care needs (e.g. post-knee surgery, mobility assistance, diabetic diet, wheelchair support, dementia monitoring)..."
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none transition-all focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-medium leading-relaxed"
                      />

                      {/* Quick Suggester Chips */}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Tags:</span>
                        {[
                          "Post-Op Recovery",
                          "Mobility & Wheelchair",
                          "Dementia & Memory Care",
                          "Vitals & Medication Tracker",
                          "Bedridden Nursing Care",
                          "Elderly Companion"
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (patientNeeds.includes(tag)) return;
                              setPatientNeeds(prev => prev ? `${prev}, ${tag}` : tag);
                            }}
                            className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-gold/20 hover:text-primary text-slate-600 border border-slate-200/80 transition-all cursor-pointer"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setBookingStep(1)}
                        className="btn-outline py-2.5 sm:py-3 px-3 sm:px-6 font-bold text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider cursor-pointer whitespace-nowrap"
                      >
                        Back: Service
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep2()) setBookingStep(3);
                        }}
                        className="btn-primary py-2.5 sm:py-3 px-3.5 sm:px-7 font-bold text-[11px] sm:text-xs uppercase tracking-normal sm:tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all whitespace-nowrap"
                      >
                        Next: Location &amp; Pay <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: LOCATION & PAYMENT DETAILS */}
                {bookingStep === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Address */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Care Delivery Address
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={bookingAddress}
                        onChange={(e) => setBookingAddress(e.target.value)}
                        placeholder="Enter complete door no, building name, street, landmark, area & pincode (e.g. Flat 402, Royal Residency, Road No. 12, Banjara Hills, Hyderabad - 500034)"
                        className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none transition-all focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 shadow-sm font-medium leading-relaxed"
                      />
                    </div>

                    {/* Google Map Location */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Exact GPS Geolocation (For Caregiver Navigation)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          required
                          value={bookingGoogleMapLocation}
                          placeholder="Click Fetch to obtain exact pin coordinates..."
                          className="min-w-0 flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-700 outline-none truncate font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!navigator.geolocation) {
                              alert("Geolocation is not supported by your browser");
                              return;
                            }
                            setIsFetchingLocationBooking(true);
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                setBookingGoogleMapLocation(`https://www.google.com/maps?q=${lat},${lng}`);
                                setIsFetchingLocationBooking(false);
                              },
                              () => {
                                alert("Failed to fetch location. Please ensure location permissions are enabled.");
                                setIsFetchingLocationBooking(false);
                              }
                            );
                          }}
                          disabled={isFetchingLocationBooking}
                          className="px-2.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-gold via-amber-400 to-gold hover:opacity-90 text-slate-900 text-[11px] sm:text-xs font-bold rounded-xl flex items-center gap-1 sm:gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm transition-all whitespace-nowrap"
                        >
                          {isFetchingLocationBooking ? (
                            <>
                              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                              <span className="hidden sm:inline">Fetching </span>GPS...
                            </>
                          ) : (
                            <>
                              <span>📍</span>
                              <span className="hidden sm:inline">Fetch </span>GPS Pin
                            </>
                          )}
                        </button>
                      </div>
                      {bookingGoogleMapLocation && (
                        <div className="flex justify-between items-center text-xs mt-2 px-1">
                          <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                            ✓ Geolocation coordinates successfully verified!
                          </span>
                          <a
                            href={bookingGoogleMapLocation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-gold font-bold underline transition-colors"
                          >
                            Preview Google Map ↗
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Document Upload */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Doctor Prescription or Case File (PDF / Image) {currentService?.isMtp ? "(Optional for MTP Tasks)" : "(Required for Clinical Care)"}
                      </label>
                      <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-gold/5 hover:border-gold/50 transition-all">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          required={!currentService?.isMtp}
                          onChange={(e) => handleCaretakerFileChange(e, setPrescriptionFile)}
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-gold hover:file:bg-primary/90 cursor-pointer"
                        />
                        {prescriptionFile && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 w-fit">
                            ✓ File attached successfully
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Selection Banner */}
                    <div className="border-t border-slate-100 pt-6">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                        Payment &amp; Escrow Guarantee
                      </label>
                      {currentService?.isMtp ? (
                        <div className="p-5 border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50/50 text-amber-950 rounded-2xl flex items-center gap-4 shadow-sm">
                          <div className="p-3 rounded-2xl bg-amber-200/70 text-amber-900 shrink-0">
                            <Clock className="h-6 w-6" />
                          </div>
                          <div className="text-left">
                            <span className="block text-sm font-bold text-amber-950 font-display">
                              Pay on Service / Quote Basis (₹0 Advance Required Online)
                            </span>
                            <span className="text-xs text-amber-900 block mt-1 leading-relaxed font-medium">
                              Payment pricing for MTP companion tasks is settled on a direct visit basis. No online advance charge is required now.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-5 border-2 border-gold/40 bg-gradient-to-br from-[#091129] to-[#182858] text-white rounded-2xl flex items-center gap-4 shadow-lg shadow-slate-900/10">
                          <div className="p-3 rounded-2xl bg-gold/20 text-gold border border-gold/40 shrink-0">
                            <CreditCard className="h-6 w-6" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="block text-sm font-bold text-white font-display">
                                Razorpay Escrow Protection
                              </span>
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-gold text-primary">
                                Verified Secure
                              </span>
                            </div>
                            <span className="text-xs text-slate-300 block mt-1 leading-relaxed">
                              Pay only the 20% advance booking allocation fee online. Your remaining balance is payable only after your caregiver delivers the scheduled shifts!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Terms and Conditions */}
                    <div className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 bg-slate-50/60 space-y-3">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                        <span>Amma Seva — Patient Booking Terms &amp; Conditions</span>
                        <span className="text-[10px] text-slate-400 font-mono">v2.4</span>
                      </div>
                      <div className="max-h-24 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-white text-[11px] text-slate-650 leading-relaxed font-sans space-y-1.5 shadow-inner">
                        <p className="font-bold text-slate-800">Effective Date: 2026-2027 Care Policies</p>
                        <p>1. Service Scope: Amma Seva coordinates background-checked nurses and care companions.</p>
                        <p>2. Medical Care Directives: Nurses and caregivers provide support according to verified prescriptions.</p>
                        <p>3. Escrow Security: Advance payments are held in escrow until care shifts commence.</p>
                      </div>
                      
                      <label className="flex items-start gap-3 pt-1 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={agreeTermsBooking}
                          onChange={(e) => setAgreeTermsBooking(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-gold cursor-pointer accent-[#c9a24c]"
                        />
                        <span className="text-xs font-semibold text-slate-700 select-none">
                          I have read and agree to the Amma Seva Patient Booking Terms &amp; Conditions
                        </span>
                      </label>
                    </div>

                    {/* Cost Summary & Actions */}
                    <div className="border-t border-slate-200 pt-6 flex flex-col justify-between items-stretch gap-6 bg-slate-50/80 -mx-4 sm:-mx-10 -mb-4 sm:-mb-10 p-4 sm:p-8 rounded-b-3xl text-left border-t">
                      {currentService?.isMtp ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-5">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Task Category</span>
                              <span className="block text-sm font-extrabold text-primary font-display mt-1">MTP Companion Task</span>
                            </div>
                            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/70 shadow-xs">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">Advance Due Online</span>
                              <span className="block text-xl font-extrabold text-emerald-700 font-display mt-1">₹0 (Zero Advance)</span>
                            </div>
                            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/70 shadow-xs">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">Billing Terms</span>
                              <span className="block text-sm font-extrabold text-amber-800 font-display mt-1">Pay on Service / Quote</span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 bg-amber-100/50 border border-amber-300/80 p-4 rounded-2xl text-amber-950 text-xs leading-relaxed">
                            <span className="text-base shrink-0">✨</span>
                            <div>
                              <strong className="font-extrabold block text-amber-950 mb-0.5">Zero-Advance Booking Guarantee</strong>
                              Your MTP booking will be registered immediately. No payment is required right now. Our support team will confirm your professional match and coordinate the details directly.
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                              Task: {currentService?.title || "Service"} • Frequency: {durationCount} {bookingDuration?.toLowerCase() || 'day'}(s) • Advance required online: ₹0
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Step Progress visual indicator */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              <span className="text-emerald-700">1. Pay Advance (20%)</span>
                              <span className="text-amber-700">2. Pay Balance (80%) After Shifts</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden flex">
                              <div className="w-[20%] bg-emerald-500 h-full rounded-l-full" />
                              <div className="w-[80%] bg-amber-400 h-full rounded-r-full" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-5">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Estimated Cost</span>
                              <span className="block text-xl font-extrabold text-primary font-display mt-1">₹{calculateTotal().toLocaleString()}</span>
                            </div>
                            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/70 shadow-xs">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">Advance to Pay Now</span>
                              <span className="block text-xl font-extrabold text-emerald-700 font-display mt-1">₹{calculateAdvance().toLocaleString()}</span>
                            </div>
                            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/70 shadow-xs">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">Pending Balance (After Care)</span>
                              <span className="block text-xl font-extrabold text-amber-700 font-display mt-1">₹{(calculateTotal() - calculateAdvance()).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Escrow Guarantee Trust Banner */}
                          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-900 text-xs leading-relaxed">
                            <span className="text-base shrink-0">🛡️</span>
                            <div>
                              <strong className="font-extrabold block text-emerald-950 mb-0.5 font-display">Amma Seva Escrow Guarantee</strong>
                              Pay only the verified advance of <span className="font-extrabold text-emerald-800">₹{calculateAdvance().toLocaleString()}</span> now to secure your caregiver. Pay the remaining balance of <span className="font-extrabold text-emerald-800">₹{(calculateTotal() - calculateAdvance()).toLocaleString()}</span> only after the shift is safely completed!
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                              Calculation: ₹{
                                bookingDuration === "Hourly" ? getServiceRates().hourly :
                                bookingDuration === "Daily" ? getServiceRates().daily :
                                bookingDuration === "Weekly" ? getServiceRates().weekly :
                                getServiceRates().monthly
                              } per {
                                bookingDuration === "Hourly" ? "Hour" :
                                bookingDuration === "Daily" ? "Day" :
                                bookingDuration === "Weekly" ? "Week" : "Month"
                              } × {durationCount} units = ₹{calculateTotal().toLocaleString()} (Advance: ₹{calculateAdvance().toLocaleString()} | Balance: ₹{(calculateTotal() - calculateAdvance()).toLocaleString()})
                            </p>
                          </div>
                        </>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3.5 w-full pt-2">
                        <button
                          type="button"
                          onClick={() => setBookingStep(2)}
                          className="btn-outline py-2.5 sm:py-3.5 px-4 sm:px-6 font-bold uppercase tracking-normal sm:tracking-wider text-[11px] sm:text-xs cursor-pointer w-full sm:w-36 order-2 sm:order-1"
                        >
                          Back: Patient
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || isPaymentProcessing || !agreeTermsBooking}
                          className="btn-primary py-3 sm:py-4 px-4 sm:px-8 font-bold uppercase tracking-normal sm:tracking-wider text-[11px] sm:text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 w-full sm:w-auto flex-grow order-1 sm:order-2 shadow-xl shadow-primary/25 hover:scale-[1.01] transition-all"
                        >
                          {(isSubmitting || isPaymentProcessing) && (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          )}
                          {isPaymentProcessing 
                            ? "Verifying Razorpay Gateway..." 
                            : isSubmitting 
                              ? "Securing Shift Allocation..." 
                              : currentService?.isMtp
                                ? "Confirm MTP Booking (₹0 Advance Required)"
                                : `Pay Advance & Book Shift (₹${calculateAdvance().toLocaleString()})`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Booking SUCCESS Modal overlay */}
      {successBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200/80 shadow-2xl text-center space-y-6 animate-in zoom-in duration-300 relative overflow-hidden p-8">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-gold to-emerald-500" />
            
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Payment &amp; Booking Verified
              </span>
              <h3 className="text-2xl font-bold text-primary font-display tracking-tight">
                Booking Confirmed!
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your care shift has been registered. Our care desk coordinator is assigning your verified caregiver.
              </p>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/70 p-5 rounded-2xl text-left text-xs space-y-2.5 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Booking ID</span>
                <span className="font-extrabold text-primary font-mono">#{successBooking.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Care Service</span>
                <span className="font-bold text-slate-800">{successBooking.service}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Duration</span>
                <span className="font-semibold text-slate-700">{successBooking.duration}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Shift Start</span>
                <span className="font-semibold text-slate-700">{successBooking.date}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Total Order Amount</span>
                <span className="font-extrabold text-emerald-700 text-sm">₹{successBooking.amount}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessBooking(null);
                setActiveView("bookings");
              }}
              className="btn-primary w-full py-3.5 font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20 cursor-pointer"
            >
              View My Bookings &amp; Care Shifts
            </button>
          </div>
        </div>
      )}

      {/* Booking RESCHEDULE Modal Overlay */}
      {rescheduleBookingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-gold to-primary" />
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-primary">
                <RotateCcw className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary font-display tracking-tight">Reschedule Care Shift</h3>
                <p className="text-xs text-slate-400">Shift #{rescheduleBookingId}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  New Care Date
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toLocaleDateString("en-CA")}
                  max="2099-12-31"
                  value={rescheduleDate}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val) {
                      const parts = val.split("-");
                      if (parts[0] && parts[0].length > 4) {
                        parts[0] = parts[0].slice(0, 4);
                        val = parts.join("-");
                      }
                    }
                    setRescheduleDate(val);
                  }}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 cursor-pointer font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  New Start Time
                </label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-900 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 cursor-pointer font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRescheduleBookingId(null)}
                className="btn-outline flex-1 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="btn-primary flex-1 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-primary/20"
              >
                Confirm Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal Details View */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 animate-in zoom-in duration-200 relative max-h-[92vh] overflow-y-auto">
            
            {/* Invoice Print Sheet Header */}
            <div id="invoice-sheet" className="space-y-6">
              
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black font-display text-primary tracking-tight">AMMA SEVA</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gold/15 text-primary border border-gold/30">Official</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Professional Home Healthcare &amp; Caregiving</p>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-xs mt-1">
                    LUXDHANA GLOBAL PRIVATE LIMITED<br />
                    8-2-630/B/B/1, Mount Banjara complex, Road No. 12, Banjara Hills, Hyderabad - 500034, Telangana.
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="inline-block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-md mb-1">
                    Receipt Invoice
                  </span>
                  <span className="block text-xl font-bold text-primary font-display">#INV-{activeInvoice.id}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">Date: {new Date(activeInvoice.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Patient & Customer Billing Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border-b border-slate-200 pb-6">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Billed Client</span>
                  <span className="block font-bold text-slate-900 text-sm">{user?.name}</span>
                  <span className="block text-slate-500 mt-0.5">{user?.phone}</span>
                  <span className="block text-slate-500">{user?.email}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="block text-slate-400 font-bold mb-1 uppercase tracking-wider text-[10px]">Service Delivery Address</span>
                  <span className="block text-slate-700 italic leading-relaxed">{activeInvoice.address}</span>
                </div>
              </div>

              {/* Invoice Table Items */}
              <div>
                <span className="block text-slate-400 font-bold text-[10px] mb-3 uppercase tracking-wider">Service Breakdown</span>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 font-bold text-slate-800 bg-slate-50">
                        <th className="py-3 px-4">Service Description</th>
                        <th className="py-3 px-4">Duration Contract</th>
                        <th className="py-3 px-4">Schedule Date</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="text-slate-700">
                        <td className="py-3.5 px-4 font-bold text-primary">{activeInvoice.service}</td>
                        <td className="py-3.5 px-4 font-medium">{activeInvoice.duration}</td>
                        <td className="py-3.5 px-4 text-slate-600">{activeInvoice.date} at {activeInvoice.time}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">₹{activeInvoice.amount}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="text-slate-900 font-bold bg-slate-50/70 border-t border-slate-200">
                        <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-slate-500 text-[10px]">Total Order Amount</td>
                        <td className="py-3 px-4 text-right text-base text-primary font-extrabold">₹{activeInvoice.amount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status details info */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Payment Method</span>
                  <span className="font-bold text-slate-800">Online Escrow / Offline Settlement</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Shift Status</span>
                  <span className={`font-extrabold px-2.5 py-1 rounded-full text-xs ${
                    activeInvoice.paymentStatus === 'Paid' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {activeInvoice.paymentStatus}
                  </span>
                </div>
              </div>

            </div>

            {/* Print and Close controls */}
            <div className="flex gap-3 border-t border-slate-200 pt-5">
              <button
                onClick={() => setActiveInvoice(null)}
                className="btn-outline flex-1 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close View
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary flex-1 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Download className="h-4 w-4" /> Print / Save PDF
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Booking EDIT DETAILS Modal Overlay */}
      {isEditModalOpen && editBookingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in duration-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-gold to-primary" />
            
            <div>
              <h3 className="text-xl font-bold text-primary font-display tracking-tight">Edit Care Details</h3>
              <p className="text-xs text-slate-400 mt-0.5">Booking Shift #{editBookingId}</p>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto px-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={editPatientName}
                  onChange={(e) => setEditPatientName(sanitizeName(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex justify-between">
                  <span>Patient Age</span>
                  <span className="text-[10px] text-slate-400">Max 2 Digits</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  required
                  value={editPatientAge}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
                    setEditPatientAge(val);
                  }}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Patient Specific Needs</label>
                <textarea
                  value={editPatientNeeds}
                  onChange={(e) => setEditPatientNeeds(e.target.value)}
                  placeholder="Describe patient health status and daily care needs..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 min-h-[60px] font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Care Address</label>
                <textarea
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 min-h-[60px] font-medium leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Google Maps Location Link</label>
                <input
                  type="text"
                  value={editGoogleMapLocation}
                  onChange={(e) => setEditGoogleMapLocation(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 outline-none focus:bg-white focus:border-gold focus:ring-4 focus:ring-gold/15 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSavingDetails}
                className="btn-outline flex-1 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDetails}
                disabled={isSavingDetails}
                className="btn-primary flex-1 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20"
              >
                {isSavingDetails ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Details"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      <DocumentViewerModal
        isOpen={docViewerState.isOpen}
        onClose={() => setDocViewerState(s => ({ ...s, isOpen: false }))}
        docUrl={docViewerState.docUrl}
        docTitle={docViewerState.docTitle}
        applicantName={docViewerState.applicantName}
        category={docViewerState.category}
      />

    </SiteLayout>
  );
}
