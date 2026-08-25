import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { 
  Trash2, RefreshCw, Mail, Phone, MapPin, ClipboardList, 
  Users, Calendar, DollarSign, ShieldAlert, LogOut, CheckCircle2, 
  XCircle, Edit3, Save, Check, LayoutDashboard, CalendarDays,
  UserCheck, MessageSquare, Sliders, Bell, Search, Plus, Send, TrendingDown,
  ArrowUpRight, Star, BookOpen, HelpCircle, Menu, X, Image, Coins
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
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "caregivers" | "enquiries" | "services" | "users" | "notifications" | "payments" | "blogs" | "faqs" | "gallery" | "salaries">("overview");
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

  // Form states - Service
  const [serviceTitle, setServiceTitle] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [servicePriceVal, setServicePriceVal] = useState("1200");
  const [servicePriceUnit, setServicePriceUnit] = useState("day");
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
      const [bookingsRes, caregiversRes, enquiriesRes, usersRes, servicesRes, notificationsRes, blogsRes, faqsRes, galleryRes] = await Promise.all([
        fetchWithAuth("/api/bookings"),
        fetchWithAuth("/api/caregivers"),
        fetchWithAuth("/api/enquiries"),
        fetchWithAuth("/api/admin/users"),
        fetchWithAuth("/api/services"),
        fetchWithAuth("/api/notifications"),
        fetch("/api/blogs").then(res => res.json()),
        fetch("/api/faqs").then(res => res.json()),
        fetch("/api/gallery").then(res => res.json())
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
  const handleUpdateCaregiverStatus = (id: number, status: "Verified" | "Rejected") => {
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
    } else if (type === "service") {
      setServiceTitle("");
      setServiceShort("");
      setServiceDescription("");
      setServiceBenefits("");
      setServiceDuration("");
      setServicePrice("₹1,200/day");
      setServicePriceVal("1200");
      setServicePriceUnit("day");
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
    } else if (type === "service") {
      setServiceTitle(record.title);
      setServiceShort(record.short || "");
      setServiceDescription(record.description || "");
      setServiceBenefits(Array.isArray(record.benefits) ? record.benefits.join("\n") : "");
      setServiceDuration(record.duration || "");
      setServicePrice(record.price);
      
      const matchPrice = record.price ? record.price.replace(/,/g, '').match(/\d+/) : null;
      setServicePriceVal(matchPrice ? matchPrice[0] : "1200");
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
        additionalCertificates: caregiverAdditionalCertificates
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
        images: serviceImages.split("\n").map(img => img.trim()).filter(Boolean)
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
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/10 text-[#c9a24c] border-l-4 border-[#c9a24c] rounded-r-xl rounded-l-none pl-3"
                      : "text-slate-300 hover:bg-white/5 hover:text-white rounded-xl"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[#c9a24c]" : "text-slate-400"}`} />
                  {item.label}
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
                    onClick={() => setActiveTab("caregivers")}
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
                        <div key={b.id} className="bg-white border border-slate-200/70 hover:border-[#c9a24c]/45 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center premium-card">
                          
                          {/* Patient profile details */}
                          <div className="flex items-start gap-4 min-w-[260px] max-w-sm">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#1e2a5a]/10 to-[#1e2a5a]/5 border border-[#1e2a5a]/10 flex items-center justify-center font-black text-lg text-[#1e2a5a] shrink-0">
                              {b.name.charAt(0)}
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-extrabold text-[#1e2a5a] text-base leading-tight">{b.name}</h4>
                              <div className="text-[11px] text-slate-400 font-extrabold">{b.phone}</div>
                              <div className="text-[10px] text-slate-500 font-semibold italic truncate max-w-[200px]" title={b.address}>{b.address}</div>
                              
                              {b.patientName && (
                                <div className="inline-block text-[9px] text-[#1e2a5a] bg-[#1e2a5a]/5 border border-[#1e2a5a]/10 px-2 py-0.5 rounded font-extrabold mt-1">
                                  👤 Patient: {b.patientName} ({b.patientAge} years)
                                </div>
                              )}
                              {b.patientNeeds && (
                                <div className="text-[9px] text-slate-650 bg-slate-50/50 border border-slate-100 rounded-lg p-2 mt-1 leading-relaxed max-w-[200px]">
                                  <span className="font-bold text-slate-700">Needs:</span> {b.patientNeeds}
                                </div>
                              )}
                              
                              <div className="flex gap-2.5 mt-2">
                                {b.googleMapLocation && (
                                  <a href={b.googleMapLocation} target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#c9a24c] font-black hover:underline flex items-center gap-0.5">
                                    🗺️ Map Location
                                  </a>
                                )}
                                {b.prescription && (
                                  <a href={b.prescription} target="_blank" rel="noopener noreferrer" className="text-[9px] text-teal-600 font-black hover:underline flex items-center gap-0.5">
                                    📄 Case File
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Service Details */}
                          <div className="space-y-1 min-w-[150px]">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Service Category</span>
                            <div className="font-bold text-slate-800 text-sm leading-snug">{b.service}</div>
                            <span className="inline-block text-[9px] text-[#c9a24c] bg-[#c9a24c]/10 border border-[#c9a24c]/20 font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1">{b.duration}</span>
                          </div>

                          {/* Date & Time */}
                          <div className="space-y-1 min-w-[130px]">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Shift Date &amp; Time</span>
                            <div className="font-bold text-slate-700 text-xs flex items-center gap-1">📅 {b.date}</div>
                            <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">⏰ {b.time}</div>
                          </div>

                          {/* Assigned Nurse/Staff */}
                          <div className="space-y-1.5 min-w-[150px]">
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Assigned Nurse/Staff</span>
                            {b.assignedStaff ? (
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-[#1e2a5a]/10 border border-[#1e2a5a]/10 flex items-center justify-center font-bold text-xs text-[#1e2a5a]">
                                  {b.assignedStaff.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-[#1e2a5a]">{b.assignedStaff}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-455 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                                🚫 Unassigned
                              </span>
                            )}
                          </div>

                          {/* Status and Payouts */}
                          <div className="flex flex-row lg:flex-col items-start gap-4 min-w-[130px]">
                            <div className="space-y-1">
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
                            <div className="space-y-1">
                              <div className="text-xs font-extrabold text-slate-900">₹{b.amount}</div>
                              <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                b.paymentStatus === "Paid" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" 
                                  : "bg-amber-50 text-amber-700 border-amber-200/60"
                              }`}>
                                {b.paymentStatus}
                              </span>
                            </div>
                          </div>

                          {/* Action Controls */}
                          <div className="flex gap-2 self-stretch lg:self-auto justify-end border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0 shrink-0">
                            <button
                              onClick={() => openEditModal("booking", b)}
                              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-[#c9a24c]/15 text-[#c9a24c] border border-slate-200 hover:border-[#c9a24c]/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 hover:border-rose-500 text-rose-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
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
                                <div className="font-bold text-[#1e2a5a] font-display text-base leading-tight">{c.name}</div>
                                <div className="text-xs text-slate-400 mt-1 font-semibold">{c.phone}</div>
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
                                <a href={c.aadhaar} target="_blank" rel="noopener noreferrer" className="text-[#c9a24c] font-bold hover:underline block text-[10px]">
                                  📄 Aadhaar Card Verified
                                </a>
                              ) : <span className="text-slate-300 block text-[10px]">❌ Aadhaar Card</span>}
                              
                              {c.pan ? (
                                <a href={c.pan} target="_blank" rel="noopener noreferrer" className="text-[#c9a24c] font-bold hover:underline block text-[10px]">
                                  📄 PAN Card Verified
                                </a>
                              ) : <span className="text-slate-300 block text-[10px]">❌ PAN Card</span>}
                              
                              {c.certificates ? (
                                <a href={c.certificates} target="_blank" rel="noopener noreferrer" className="text-[#c9a24c] font-bold hover:underline block text-[10px]">
                                  📄 Edu Certificate Verified
                                </a>
                              ) : <span className="text-slate-300 block text-[10px]">❌ Edu Certificate</span>}

                              {c.experienceCertificate ? (
                                <a href={c.experienceCertificate} target="_blank" rel="noopener noreferrer" className="text-[#c9a24c] font-bold hover:underline block text-[10px]">
                                  📄 Experience Certificate
                                </a>
                              ) : <span className="text-slate-300 block text-[10px]">❌ Experience Cert</span>}

                              {c.policeVerification ? (
                                <a href={c.policeVerification} target="_blank" rel="noopener noreferrer" className="text-[#c9a24c] font-bold hover:underline block text-[10px]">
                                  📄 Police Verification Cert
                                </a>
                              ) : <span className="text-slate-300 block text-[10px]">❌ Police verification</span>}

                              {c.additionalCertificates ? (
                                <a href={c.additionalCertificates} target="_blank" rel="noopener noreferrer" className="text-[#c9a24c] font-bold hover:underline block text-[10px]">
                                  📄 Additional Docs
                                </a>
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
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-250 text-left border border-slate-100">
                      
                      {/* Modal Header */}
                      <div className="bg-[#1e2a5a] text-slate-100 p-6 flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center font-black text-2xl text-white">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xl tracking-tight">{u.name}</h4>
                            <p className="text-xs text-slate-300 mt-1 font-semibold">{u.email} • {u.phone}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedUserForDetails(null)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer transition-all"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Bookings</span>
                            <span className="text-xl font-black text-[#1e2a5a] mt-1 block">{userBookings.length}</span>
                          </div>
                          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Shifts</span>
                            <span className="text-xl font-black text-emerald-600 mt-1 block">
                              {userBookings.filter(b => b.status === "Completed").length}
                            </span>
                          </div>
                          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Paid Value</span>
                            <span className="text-xl font-black text-[#c9a24c] mt-1 block">₹{totalSpent.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Booking Logs History list */}
                        <div className="space-y-3">
                          <h5 className="text-xs font-bold text-[#1e2a5a] uppercase tracking-wider">Historical Booking Logs</h5>
                          
                          <div className="space-y-3">
                            {userBookings.map((b) => (
                              <div key={b.id} className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-extrabold text-slate-800 text-sm">{b.service}</div>
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
                                  <div className="text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                                    <span className="font-bold text-slate-700">Patient Needs:</span> {b.patientNeeds}
                                  </div>
                                )}

                                <div className="flex gap-3 text-[10px]">
                                  {b.googleMapLocation && (
                                    <a href={b.googleMapLocation} target="_blank" rel="noopener noreferrer" className="text-[#c9a24c] font-bold hover:underline">
                                      🗺️ Map Location
                                    </a>
                                  )}
                                  {b.prescription && (
                                    <a href={b.prescription} target="_blank" rel="noopener noreferrer" className="text-teal-600 font-bold hover:underline">
                                      📄 Case File / Prescription
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}

                            {userBookings.length === 0 && (
                              <p className="text-center text-xs text-slate-400 italic py-4 bg-white border border-slate-100 rounded-xl">No historical shift logs found for this patient.</p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Modal Footer */}
                      <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
                        <button
                          onClick={() => setSelectedUserForDetails(null)}
                          className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-bold transition-all cursor-pointer"
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
                                onClick={() => openEditModal("booking", b)}
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
                <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md shadow-slate-100/40 premium-card gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display">Staff Salaries & Payout Settlements</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Track payroll, salary status, and payout logs for all registered care staff.</p>
                  </div>
                </div>

                {/* Local Filter Bar */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm premium-card grid gap-4 grid-cols-1 sm:grid-cols-4 items-center">
                  <div className="relative col-span-1 sm:col-span-2">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by Caregiver name or specialty..."
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

                {/* Salary Stats Cards */}
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
                  
                  <div className="grid gap-4 grid-cols-1">
                    {caregivers
                      .filter((cg) => {
                        const q = salarySearch.toLowerCase();
                        return !salarySearch || cg.name.toLowerCase().includes(q) || cg.specialty.toLowerCase().includes(q);
                      })
                      .map((cg) => {
                      const cgBookings = filteredCompletedBookings.filter(b => b.assignedStaff === cg.name);
                      const earned = cgBookings.reduce((sum, b) => sum + getPayoutValue(b), 0);
                      const paid = cgBookings.filter(b => b.caretakerPayoutStatus === "Paid").reduce((sum, b) => sum + getPayoutValue(b), 0);
                      const unpaid = earned - paid;
                      const isExpanded = expandedCaregiverId === cg.id;

                      return (
                        <div key={cg.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden premium-card">
                          <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#1e2a5a]/10 to-[#1e2a5a]/5 flex items-center justify-center font-bold text-lg text-[#1e2a5a] border border-[#1e2a5a]/10 shrink-0">
                                {cg.name.charAt(0)}
                              </div>
                              <div>
                                <h5 className="font-bold text-[#1e2a5a] font-display text-base leading-tight">{cg.name}</h5>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{cg.phone} • {cg.specialty}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4 sm:gap-8 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Earned</span>
                                <div className="font-extrabold text-slate-900 mt-0.5">₹{earned.toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Paid</span>
                                <div className="font-extrabold text-emerald-600 mt-0.5">₹{paid.toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outstanding</span>
                                <div className="font-extrabold text-amber-600 mt-0.5">₹{unpaid.toLocaleString()}</div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setExpandedCaregiverId(isExpanded ? null : cg.id)}
                                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                              >
                                {isExpanded ? "Hide Shifts" : `View Shifts (${cgBookings.length})`}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-3">
                              <h6 className="text-[10px] font-extrabold text-[#1e2a5a] uppercase tracking-widest">Shift Payout Log & Settlements</h6>
                              {cgBookings.length > 0 ? (
                                <div className="divide-y divide-slate-100 bg-white border border-slate-200/50 rounded-xl overflow-hidden shadow-sm">
                                  {cgBookings.map((b) => (
                                    <div key={b.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                                      <div>
                                        <div className="font-bold text-slate-800">{b.service}</div>
                                        <div className="text-slate-450 text-[10px] font-medium mt-0.5">{b.date} • Customer: {b.name}</div>
                                      </div>
                                      <div className="flex items-center gap-6">
                                        <div className="text-right">
                                          <div className="font-bold text-slate-900">₹{getPayoutValue(b)}</div>
                                          <div className="text-[9px] text-slate-450 font-semibold mt-0.5">Caretaker Share</div>
                                        </div>
                                        <div>
                                          {b.caretakerPayoutStatus === "Paid" ? (
                                            <div className="text-right space-y-0.5">
                                              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200/50 font-bold px-2 py-0.5 rounded-md">
                                                ✓ Paid
                                              </span>
                                              {b.caretakerPayoutMethod && (
                                                <div className="text-[8px] text-slate-400 font-semibold">
                                                  {b.caretakerPayoutMethod} {b.caretakerPayoutRef ? `(${b.caretakerPayoutRef})` : ''}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 text-[9px] text-amber-700 bg-amber-50 border border-amber-200/50 font-bold px-2 py-0.5 rounded-md">
                                              ● Unpaid
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => openEditModal("booking", b)}
                                          className="px-3 py-1.5 rounded-lg border border-[#c9a24c]/40 hover:bg-[#c9a24c]/10 text-[#c9a24c] text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer"
                                        >
                                          {b.caretakerPayoutStatus === "Paid" ? "Edit Details" : "Record Payment"}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-450 italic">No completed shifts recorded for this caregiver.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {caregivers.length === 0 && (
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 font-semibold">
                        No caregivers registered to compile salary payroll.
                      </div>
                    )}
                  </div>
                </div>
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
        </main>
      </div>

      {/* DYNAMIC FORMS EDITING MODALS */}
      {modalType && modalType !== "notification" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 ${modalType === 'service' ? 'max-w-3xl' : 'max-w-xl'} premium-card`}>
            <div className="px-6 py-4.5 border-b border-slate-150 flex justify-between items-center bg-slate-50/40">
              <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display uppercase tracking-wider">
                {modalMode === "add" ? "Create New" : "Edit Details"} {modalType}
              </h3>
              <button 
                onClick={() => setModalType(null)} 
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-sm">
              
              {/* Form elements for Booking */}
              {modalType === "booking" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Customer Name</label>
                      <input 
                        type="text" required value={bookingName} onChange={e => setBookingName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
                      <input 
                        type="tel" required value={bookingPhone} onChange={e => setBookingPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                        placeholder="10-digit number"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Select Service</label>
                    <select 
                      value={bookingService} onChange={e => setBookingService(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.title}>{s.title} ({s.price})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Date</label>
                      <input 
                        type="date" required value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Time</label>
                      <input 
                        type="text" required placeholder="e.g. 09:00" value={bookingTime} onChange={e => setBookingTime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Duration</label>
                      <select 
                        value={bookingDuration} onChange={e => setBookingDuration(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      >
                        <option value="Hourly">Hourly visit</option>
                        <option value="Daily">Daily shift</option>
                        <option value="Weekly">Weekly log</option>
                        <option value="Monthly">Monthly companion</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Booking Amount (₹)</label>
                      <input 
                        type="number" required value={bookingAmount} onChange={e => setBookingAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Caretaker Payout Amount (₹)</label>
                      <input 
                        type="number" required value={bookingCaretakerPayout} onChange={e => setBookingCaretakerPayout(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Caretaker Payout Status</label>
                      <select 
                        value={bookingCaretakerPayoutStatus} onChange={e => setBookingCaretakerPayoutStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      >
                        <option value="Unpaid">Unpaid / Settle Pending</option>
                        <option value="Paid">Paid / Settle Cleared</option>
                      </select>
                    </div>
                  </div>

                  {bookingCaretakerPayoutStatus === "Paid" && (
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[#c9a24c]/5 border border-[#c9a24c]/20">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#c9a24c] mb-1">Payout Method (e.g. UPI, Bank)</label>
                        <input 
                          type="text" placeholder="GPay / PhonePe / Bank Trans" value={bookingCaretakerPayoutMethod} onChange={e => setBookingCaretakerPayoutMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-[#c9a24c]/30 rounded-lg outline-none bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#c9a24c] mb-1">Payout Transaction Ref #</label>
                        <input 
                          type="text" placeholder="TXN12948194..." value={bookingCaretakerPayoutRef} onChange={e => setBookingCaretakerPayoutRef(e.target.value)}
                          className="w-full px-3 py-2 border border-[#c9a24c]/30 rounded-lg outline-none bg-white text-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Caretaker Location Address</label>
                    <textarea 
                      required rows={3} value={bookingAddress} onChange={e => setBookingAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                      <select 
                        value={bookingStatus} onChange={e => setBookingStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Assign Staff</label>
                      <select 
                        value={bookingAssignedStaff} onChange={e => setBookingAssignedStaff(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      >
                        <option value="">-- None --</option>
                        {caregivers
                          .filter(c => c.status === "Verified")
                          .map(c => (
                            <option key={c.id} value={c.name}>{c.name} ({c.specialty})</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Payment Status</label>
                      <select 
                        value={bookingPaymentStatus} onChange={e => setBookingPaymentStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                  </div>

                  {bookingPaymentStatus === "Paid" && (
                    <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">Payment Method</label>
                        <select 
                          value={bookingPaymentMethod} onChange={e => setBookingPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-emerald-200 rounded-lg outline-none bg-white text-emerald-950"
                        >
                          <option value="UPI">UPI / GPay</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Card">Credit/Debit Card</option>
                          <option value="Razorpay">Razorpay</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">Transaction ID / Ref</label>
                        <input 
                          type="text" value={bookingTransactionId} onChange={e => setBookingTransactionId(e.target.value)}
                          placeholder="e.g. TXN98765"
                          className="w-full px-3 py-2 border border-emerald-200 rounded-lg outline-none bg-white text-emerald-950 animate-in fade-in slide-in-from-top-1 duration-150"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">Payment Date</label>
                        <input 
                          type="date" value={bookingPaymentDate} onChange={e => setBookingPaymentDate(e.target.value)}
                          className="w-full px-3 py-2 border border-emerald-200 rounded-lg outline-none bg-white text-emerald-950"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Form elements for Caregiver */}
              {modalType === "caregiver" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Staff Name</label>
                      <input 
                        type="text" required value={caregiverName} onChange={e => setCaregiverName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
                      <input 
                        type="tel" required value={caregiverPhone} onChange={e => setCaregiverPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                        placeholder="10-digit number"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                      <input 
                        type="email" required value={caregiverEmail} onChange={e => setCaregiverEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Experience (Years)</label>
                      <input 
                        type="number" required value={caregiverExperience} onChange={e => setCaregiverExperience(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Specialty Option</label>
                      <select 
                        value={caregiverSpecialty} onChange={e => setCaregiverSpecialty(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      >
                        <option value="Elderly Care">Elderly Care</option>
                        <option value="Mother & Baby Care">Mother & Baby Care</option>
                        <option value="Home Nursing Services">Home Nursing</option>
                        <option value="ICU/Home Recovery Support">ICU Support</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Verification Status</label>
                      <select 
                        value={caregiverStatus} onChange={e => setCaregiverStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Verified">Verified</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Experience Details / Skills Summary</label>
                    <textarea 
                      value={caregiverExperienceDetails} onChange={e => setCaregiverExperienceDetails(e.target.value)}
                      rows={2}
                      placeholder="List previous nursing / caregiver postings..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                    />
                  </div>

                  {/* Address Section */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Address Details</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">State</label>
                        <select 
                          value={caregiverState} onChange={e => setCaregiverState(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white text-sm"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">City</label>
                        <input 
                          type="text" value={caregiverCity} onChange={e => setCaregiverCity(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex justify-between items-center">
                        <span>Google Map Location URL</span>
                        {caregiverGoogleMapLocation && (
                          <a 
                            href={caregiverGoogleMapLocation} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-indigo-600 hover:underline font-semibold animate-pulse"
                          >
                            Open on Map
                          </a>
                        )}
                      </label>
                      <input 
                        type="text" value={caregiverGoogleMapLocation} onChange={e => setCaregiverGoogleMapLocation(e.target.value)}
                        placeholder="Google Maps URL"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Preferred Locations</label>
                      <input 
                        type="text" value={caregiverWorkingLocations} onChange={e => setCaregiverWorkingLocations(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Available Timings</label>
                      <input 
                        type="text" value={caregiverAvailableTimings} onChange={e => setCaregiverAvailableTimings(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Documents Display */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Verification Files
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block font-bold text-slate-500 mb-1">Profile Photo</span>
                        {caregiverProfilePhoto ? (
                          <div className="space-y-1">
                            <img src={caregiverProfilePhoto} className="h-16 w-16 rounded-lg object-cover border border-slate-200" alt="profile" />
                            <a href={caregiverProfilePhoto} download={`Photo_${caregiverName}`} className="text-gold font-semibold hover:underline block text-[10px]">Download</a>
                          </div>
                        ) : <span className="text-slate-400 italic">No photo uploaded</span>}
                      </div>
                      
                      <div>
                        <span className="block font-bold text-slate-500 mb-1">Aadhaar Card</span>
                        {caregiverAadhaar ? (
                          <div className="space-y-1">
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">Base64 Data Available</div>
                            <a href={caregiverAadhaar} download={`Aadhaar_${caregiverName}`} className="text-gold font-semibold hover:underline block text-[10px]">Download File</a>
                          </div>
                        ) : <span className="text-slate-400 italic">No Aadhaar uploaded</span>}
                      </div>

                      <div>
                        <span className="block font-bold text-slate-500 mb-1">PAN Card</span>
                        {caregiverPan ? (
                          <div className="space-y-1">
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">Base64 Data Available</div>
                            <a href={caregiverPan} download={`PAN_${caregiverName}`} className="text-gold font-semibold hover:underline block text-[10px]">Download File</a>
                          </div>
                        ) : <span className="text-slate-400 italic">No PAN uploaded</span>}
                      </div>

                      <div>
                        <span className="block font-bold text-slate-500 mb-1">Educational Qualification Certs</span>
                        {caregiverCertificates ? (
                          <div className="space-y-1">
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">Base64 Data Available</div>
                            <a href={caregiverCertificates} download={`EduCertificates_${caregiverName}`} className="text-gold font-semibold hover:underline block text-[10px]">Download File</a>
                          </div>
                        ) : <span className="text-slate-400 italic">No certificates uploaded</span>}
                      </div>

                      <div>
                        <span className="block font-bold text-slate-500 mb-1">Experience Certificate(s)</span>
                        {caregiverExperienceCertificate ? (
                          <div className="space-y-1">
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">Base64 Data Available</div>
                            <a href={caregiverExperienceCertificate} download={`ExpCertificates_${caregiverName}`} className="text-gold font-semibold hover:underline block text-[10px]">Download File</a>
                          </div>
                        ) : <span className="text-slate-400 italic">No experience certs</span>}
                      </div>

                      <div>
                        <span className="block font-bold text-slate-500 mb-1">Police Verification</span>
                        {caregiverPoliceVerification ? (
                          <div className="space-y-1">
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">Base64 Data Available</div>
                            <a href={caregiverPoliceVerification} download={`PoliceVerification_${caregiverName}`} className="text-gold font-semibold hover:underline block text-[10px]">Download File</a>
                          </div>
                        ) : <span className="text-slate-400 italic">No police verification</span>}
                      </div>

                      <div>
                        <span className="block font-bold text-slate-500 mb-1">Additional Certificates</span>
                        {caregiverAdditionalCertificates ? (
                          <div className="space-y-1">
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">Base64 Data Available</div>
                            <a href={caregiverAdditionalCertificates} download={`AddCertificates_${caregiverName}`} className="text-gold font-semibold hover:underline block text-[10px]">Download File</a>
                          </div>
                        ) : <span className="text-slate-400 italic">No additional certs</span>}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Form elements for Service */}
              {modalType === "service" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Service Title</label>
                      <input 
                        type="text" required value={serviceTitle} onChange={e => setServiceTitle(e.target.value)}
                        placeholder="e.g. Newborn Care shift"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Category Badge Tag Name</label>
                      <input 
                        type="text" required value={serviceCategory} onChange={e => setServiceCategory(e.target.value)}
                        placeholder="e.g. Intensive, Specialized, Assistance"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pricing (₹)</label>
                          <input 
                            type="number" required value={servicePriceVal} onChange={e => setServicePriceVal(e.target.value)}
                            placeholder="e.g. 1200"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                          />
                        </div>
                        <div className="w-[85px] shrink-0">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Per Unit</label>
                          <select 
                            value={servicePriceUnit} onChange={e => setServicePriceUnit(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 cursor-pointer text-xs"
                          >
                            <option value="hour">hour</option>
                            <option value="day">day</option>
                            <option value="week">week</option>
                            <option value="month">month</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Short Description (Summary)</label>
                    <input 
                      type="text" required value={serviceShort} onChange={e => setServiceShort(e.target.value)}
                      placeholder="e.g. Compassionate postnatal care for mothers and newborns."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Duration Options</label>
                      <input 
                        type="text" required value={serviceDuration} onChange={e => setServiceDuration(e.target.value)}
                        placeholder="e.g. Hourly, Daily, or Live-in"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Service Image (Upload file OR Enter URL)</label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {serviceImage && (
                            <img 
                              src={serviceImage} 
                              className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0" 
                              alt="Service Preview" 
                            />
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={e => handleFileChange(e, setServiceImage)}
                            className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                          />
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[10px] font-semibold text-slate-400">
                            URL
                          </div>
                          <input 
                            type="text" 
                            placeholder="Or paste image URL (e.g. https://example.com/image.jpg)"
                            value={serviceImage.startsWith("data:") ? "" : serviceImage}
                            onChange={e => setServiceImage(e.target.value)}
                            className="w-full pl-10 pr-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Service description (Full details)</label>
                      <textarea 
                        required rows={5} value={serviceDescription} onChange={e => setServiceDescription(e.target.value)}
                        placeholder="Describe what tasks are covered in this caregiver shift..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Key Benefits / Tasks Included</label>
                        <span className="text-[10px] text-slate-400 font-medium">Enter one benefit per line</span>
                      </div>
                      <textarea 
                        rows={5} value={serviceBenefits} onChange={e => setServiceBenefits(e.target.value)}
                        placeholder="e.g.&#10;Personal hygiene & grooming&#10;Medication reminders&#10;Meal preparation"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">About Service (Detailed narrative)</label>
                      <textarea 
                        rows={5} value={serviceAbout} onChange={e => setServiceAbout(e.target.value)}
                        placeholder="Detailed narrative about the service for the details page..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Service Highlights (Features)</label>
                          <span className="text-[10px] text-slate-400 font-medium">One per line</span>
                        </div>
                        <textarea 
                          rows={2} value={serviceHighlights} onChange={e => setServiceHighlights(e.target.value)}
                          placeholder="e.g.&#10;Verified Professionals&#10;24/7 Helpline Support"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Additional Images (URLs)</label>
                          <span className="text-[10px] text-slate-400 font-medium">One URL per line</span>
                        </div>
                        <textarea 
                          rows={2} value={serviceImages} onChange={e => setServiceImages(e.target.value)}
                          placeholder="e.g.&#10;https://example.com/gallery1.jpg&#10;https://example.com/gallery2.jpg"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-slate-50/50 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {modalType === "blog" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Blog Title</label>
                      <input 
                        type="text" required value={blogTitle} onChange={e => setBlogTitle(e.target.value)}
                        placeholder="e.g. Caring for a bedridden parent: a family guide"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                      <input 
                        type="text" required value={blogCategory} onChange={e => setBlogCategory(e.target.value)}
                        placeholder="e.g. Elderly Care, Maternal, Clinical"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Author Name</label>
                      <input 
                        type="text" required value={blogAuthor} onChange={e => setBlogAuthor(e.target.value)}
                        placeholder="e.g. Dr. Lakshmi Prasad"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Publication Date</label>
                      <input 
                        type="date" required value={blogDate} onChange={e => setBlogDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Blog Banner Image (Upload file OR Enter URL)</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {blogImage && (
                          <img 
                            src={blogImage} 
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0" 
                            alt="Blog Preview" 
                          />
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                            onChange={e => handleFileChange(e, setBlogImage)}
                            className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                          />
                        </div>
                        <input 
                          type="text" 
                          placeholder="Or paste image URL"
                          value={blogImage.startsWith("data:") ? "" : blogImage}
                          onChange={e => setBlogImage(e.target.value)}
                          className="w-full pl-3 pr-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800"
                        />
                      </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Short Description (Excerpt)</label>
                    <input 
                      type="text" required value={blogDescription} onChange={e => setBlogDescription(e.target.value)}
                      placeholder="Enter a brief one-line summary for the blog cards listing..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Blog Post Content (Markdown / Text)</label>
                    <textarea 
                      required rows={8} value={blogContent} onChange={e => setBlogContent(e.target.value)}
                      placeholder="Write your detailed care article guidelines here..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800 text-xs font-mono"
                    />
                  </div>
                </>
              )}

              {modalType === "faq" && (
                <>
                  <div className="text-left">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Question</label>
                    <input 
                      type="text" required value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)}
                      placeholder="e.g. Are your caregivers and nurses verified?"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Answer</label>
                    <textarea 
                      required rows={5} value={faqAnswer} onChange={e => setFaqAnswer(e.target.value)}
                      placeholder="Write the detailed answer here..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800 text-sm leading-relaxed"
                    />
                  </div>
                </>
              )}

              {modalType === "gallery" && (
                <>
                  <div className="text-left">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Image Title / Description</label>
                    <input 
                      type="text" required value={galleryTitle} onChange={e => setGalleryTitle(e.target.value)}
                      placeholder="e.g. Caregiver assist walk shift"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800"
                    />
                  </div>
                  <div className="text-left">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Image Upload (Select file OR Enter URL)</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {galleryImageUrl && (
                          <img 
                            src={galleryImageUrl} 
                            className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0" 
                            alt="Gallery Preview" 
                          />
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={e => handleFileChange(e, setGalleryImageUrl)}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Or paste image URL"
                        value={galleryImageUrl.startsWith("data:") ? "" : galleryImageUrl}
                        onChange={e => setGalleryImageUrl(e.target.value)}
                        className="w-full pl-3 pr-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-gold bg-slate-50/50 text-slate-800"
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3 mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md text-xs font-bold transition-all"
              >
                {isLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></span> : <CheckCircle2 className="h-4 w-4" />}
                {isLoading ? "Saving changes..." : "Save Record"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Collapsible Caregiver Reviews Modal */}
      {selectedCaregiverForReviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[80vh] premium-card">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="text-left">
                <h3 className="text-lg font-extrabold text-[#1e2a5a] font-display flex items-center gap-2">
                  Reviews for {selectedCaregiverForReviews.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Overall rating: ⭐ {selectedCaregiverForReviews.rating || "N/A"} / 5.0</p>
              </div>
              <button
                onClick={() => setSelectedCaregiverForReviews(null)}
                className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {!selectedCaregiverForReviews.reviews || selectedCaregiverForReviews.reviews.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8 font-semibold">No feedback reviews submitted for this caregiver yet.</p>
              ) : (
                selectedCaregiverForReviews.reviews.map((r: any) => (
                  <div key={r.id} className="p-4 bg-slate-50/30 border border-slate-100 rounded-2xl space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200/60 font-black">
                        ⭐ {r.rating}.0
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 italic font-medium">&ldquo;{r.comment || "No written feedback."}&rdquo;</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
