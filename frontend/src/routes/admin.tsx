import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { 
  Trash2, RefreshCw, Mail, Phone, MapPin, ClipboardList, 
  Users, Calendar, DollarSign, ShieldAlert, LogOut, CheckCircle2, 
  XCircle, Edit3, Save, Check, LayoutDashboard, CalendarDays,
  UserCheck, MessageSquare, Sliders, Bell, Search, Plus, Send, TrendingDown,
  ArrowUpRight, Star, BookOpen, HelpCircle, Menu, X, Image
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
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "caregivers" | "enquiries" | "services" | "users" | "notifications" | "payments" | "blogs" | "faqs" | "gallery">("overview");
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
    setIsLoading(true);

    const token = localStorage.getItem("ammaseva_admin_token");

    let url = "";
    let method = "POST";
    let bodyData: any = {};

    if (modalType === "booking") {
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
        status: bookingStatus,
        assignedStaff: bookingAssignedStaff || null,
        paymentStatus: bookingPaymentStatus,
        paymentMethod: bookingPaymentMethod,
        transactionId: bookingTransactionId,
        paymentDate: bookingPaymentDate
      };
    } else if (modalType === "caregiver") {
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
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col lg:flex-row">
      
      {/* LEFT SIDEBAR Layout */}
      <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-slate-200/60 flex flex-col shrink-0">
        
        {/* Brand Header */}
        <div className="px-6 py-4 lg:py-6 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
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
          <button
            type="button"
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          >
            {isMobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Sidebar Nav Items and bottom components - collapses on mobile */}
        <div className={`flex-col flex-1 lg:flex ${isMobileNavOpen ? "flex" : "hidden lg:flex"}`}>
          <nav className="p-4 space-y-1.5 flex-1">
            {[
              { id: "overview", label: "Dashboard", icon: LayoutDashboard },
              { id: "bookings", label: "Manage Bookings", icon: CalendarDays },
              { id: "caregivers", label: "Employees & Staff", icon: UserCheck },
              { id: "users", label: "Patients", icon: Users },
              { id: "services", label: "Services", icon: Sliders },
              { id: "payments", label: "Payment Status", icon: DollarSign },
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-100 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
        </div>
      </aside>

      {/* RIGHT MAIN PANEL Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-20 bg-white border-b border-slate-200/60 px-6 sm:px-8 flex items-center justify-between gap-4 shrink-0">
          
          {/* Search box */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
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
              
              {/* Row 1: Revenue Line Card & Metric widgets */}
              <div className="grid gap-6 lg:grid-cols-3">
                
                {/* Revenue Sales Card */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm col-span-1 lg:col-span-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="block text-3xl font-bold font-display text-slate-900">₹{totalRevenue.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 mt-1 block">Total Platform Revenue</span>
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-display">
                        <ArrowUpRight className="h-3.5 w-3.5" /> Active
                      </span>
                    </div>
                  </div>
                  
                  {/* SVG line chart representation of dynamic monthly revenues */}
                  <div className="h-28 mt-6">
                    <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path
                        d={`M 0 90 L ${monthlyRevenueChart.map((d, i) => `${i * 60} ${90 - d.height * 0.8}`).join(" L ")}`}
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={`M 0 100 L 0 90 L ${monthlyRevenueChart.map((d, i) => `${i * 60} ${90 - d.height * 0.8}`).join(" L ")} L 300 100 Z`}
                        fill="url(#chartGradient)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Grid of 4 horizontal cards */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm col-span-1 lg:col-span-2 grid grid-cols-2 gap-y-8 gap-x-6">
                  <HorizontalMetric icon={CalendarDays} iconColor="text-indigo-500 bg-indigo-50" label="Bookings" value={bookings.length.toString()} />
                  <HorizontalMetric icon={UserCheck} iconColor="text-amber-500 bg-amber-50" label="Active Shifts" value={activeShiftsCount.toString()} />
                  <HorizontalMetric icon={Users} iconColor="text-rose-500 bg-rose-50" label="Patients" value={users.length.toString()} />
                  <HorizontalMetric icon={Star} iconColor="text-yellow-500 bg-yellow-50" label="Care Rating" value={`⭐ ${avgPlatformRating.toFixed(1)}`} />
                </div>
              </div>

              {/* Row 2: Sales comparison double bar chart & progress circles */}
              <div className="grid gap-6 lg:grid-cols-3">
                
                {/* Popular Services utilization card */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm col-span-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Service Distribution</h3>
                    
                    <div className="space-y-3.5">
                      {serviceDistribution.map((item) => (
                        <div key={item.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700 truncate max-w-[70%]">{item.name}</span>
                            <span className="text-slate-400">{item.percentage}% ({item.count})</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                      {serviceDistribution.length === 0 && (
                        <p className="text-xs text-slate-400 italic">No bookings recorded yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Staff utilization rate */}
                  <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="block text-2xl font-bold font-display text-slate-900">{caregiverUtilizationRate}%</span>
                      <span className="text-xs text-slate-400">Staff Utilization</span>
                    </div>
                    {/* SVG circular progress */}
                    <div className="relative w-14 h-14 shrink-0">
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
                          strokeDasharray={`${caregiverUtilizationRate}, 100`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Sales & Views Chart */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm col-span-1 lg:col-span-2 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Financial Revenue Trends</h3>
                    <button 
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      Generate Report PDF
                    </button>
                  </div>

                  {/* SVG Bar Chart mapped from actual database records */}
                  <div className="h-44 flex items-end justify-between gap-6 px-2">
                    {monthlyRevenueChart.map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex items-end justify-center h-32">
                          <div className="bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-t-lg w-7 shadow-sm flex flex-col justify-end items-center text-[8px] text-white font-bold" style={{ height: `${item.height}%` }}>
                            {item.value > 0 && <span className="mb-1 truncate px-0.5">₹{item.value > 999 ? `${(item.value/1000).toFixed(0)}k` : item.value}</span>}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bookings View panel */}
          {activeTab === "bookings" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-primary font-display">Manage Bookings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Total: {filteredBookings.length} booking records</p>
                </div>
                <button
                  onClick={() => openAddModal("booking")}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add New Booking
                </button>
              </div>

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
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-primary font-display text-base">{b.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{b.phone}</div>
                            <div className="text-xs text-slate-400 italic mt-0.5 truncate max-w-xs">{b.address}</div>
                            
                            {b.patientName && (
                              <div className="text-xs text-indigo-700 mt-1 font-semibold">
                                👤 Patient: {b.patientName} ({b.patientAge} years)
                              </div>
                            )}
                            {b.patientNeeds && (
                              <div className="text-[10px] text-slate-600 mt-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 max-w-xs whitespace-normal">
                                Needs: {b.patientNeeds}
                              </div>
                            )}
                            {b.googleMapLocation && (
                              <a href={b.googleMapLocation} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline block mt-1">
                                🗺 Open Map Location
                              </a>
                            )}
                            {b.prescription && (
                              <a href={b.prescription} target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-600 font-bold hover:underline block mt-0.5">
                                📄 Doctor Prescription / Case File
                              </a>
                            )}
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
                            <div className="text-xs font-semibold text-indigo-600">
                              {b.assignedStaff || "🚫 Unassigned"}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                              b.status === "Confirmed" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                              b.status === "Cancelled" ? "bg-rose-50 text-rose-800 border border-rose-100" :
                              "bg-amber-50 text-amber-800 border border-amber-100"
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <div className="text-xs font-bold text-slate-800">₹{b.amount}</div>
                              <span className={`text-[9px] font-bold ${
                                b.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"
                              }`}>
                                {b.paymentStatus}
                              </span>
                              {b.paymentStatus === "Paid" && b.paymentMethod && (
                                <div className="text-[10px] text-slate-400 mt-1 font-medium">
                                  <span>{b.paymentMethod}</span>
                                  {b.transactionId && <span className="block text-[9px] font-mono text-slate-400 font-normal">{b.transactionId}</span>}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => openEditModal("booking", b)}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-gold/15 text-gold border border-slate-200 hover:border-gold/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteBooking(b.id)}
                                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white border border-slate-200 text-rose-500 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
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

          {/* Employees & Staff panel */}
          {activeTab === "caregivers" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-primary font-display">Employees &amp; Staff</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Total: {filteredCaregivers.length} employees</p>
                </div>
                <button
                  onClick={() => openAddModal("caregiver")}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add New Staff
                </button>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/55 text-xs text-slate-400 uppercase font-bold tracking-wider">
                        <th className="py-4 px-6">Staff details</th>
                        <th className="py-4 px-6">Specialty &amp; Locations</th>
                        <th className="py-4 px-6">Verification Documents</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Verification &amp; Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCaregivers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {c.profilePhoto ? (
                                <img src={c.profilePhoto} className="h-10 w-10 rounded-full object-cover border border-slate-200" alt="profile" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-primary font-bold">
                                  {c.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-primary font-display text-base">{c.name}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{c.phone}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{c.email}</div>
                                {Number(c.rating) > 0 ? (
                                  <button
                                    onClick={() => setSelectedCaregiverForReviews(c)}
                                    className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 mt-1 flex items-center gap-0.5 w-fit cursor-pointer"
                                  >
                                    ⭐ {c.rating} ({c.reviews?.length || 0} reviews)
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 block mt-1">No ratings yet</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-medium text-slate-800">{c.specialty}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{c.experience} years experience</div>
                            {(c.city || c.state) && (
                              <div className="text-xs text-slate-700 mt-1 flex items-center gap-1 font-medium">
                                🏠 {c.city ? c.city : ""}{c.state ? `, ${c.state}` : ""}
                              </div>
                            )}
                            {c.googleMapLocation && (
                              <a 
                                href={c.googleMapLocation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-indigo-600 hover:underline font-bold block mt-1"
                              >
                                🗺 Open Map Location
                              </a>
                            )}
                            {c.workingLocations && <div className="text-[10px] text-indigo-600 mt-1 font-semibold">📍 Pref: {c.workingLocations}</div>}
                            {c.availableTimings && <div className="text-[10px] text-slate-500 mt-0.5 font-medium">🕒 {c.availableTimings}</div>}
                          </td>
                          <td className="py-4 px-6 text-xs">
                            <div className="space-y-1">
                              {c.aadhaar ? (
                                <a href={c.aadhaar} target="_blank" rel="noopener noreferrer" className="text-gold font-semibold hover:underline block">
                                  📄 Aadhaar Card
                                </a>
                              ) : <span className="text-slate-300 block">❌ Aadhaar</span>}
                              
                              {c.pan ? (
                                <a href={c.pan} target="_blank" rel="noopener noreferrer" className="text-gold font-semibold hover:underline block">
                                  📄 PAN Card
                                </a>
                              ) : <span className="text-slate-300 block">❌ PAN</span>}
                              
                              {c.certificates ? (
                                <a href={c.certificates} target="_blank" rel="noopener noreferrer" className="text-gold font-semibold hover:underline block">
                                  📄 Edu Certificate
                                </a>
                              ) : <span className="text-slate-300 block">❌ Edu Cert</span>}

                              {c.experienceCertificate ? (
                                <a href={c.experienceCertificate} target="_blank" rel="noopener noreferrer" className="text-gold font-semibold hover:underline block">
                                  📄 Exp Certificate
                                </a>
                              ) : <span className="text-slate-300 block">❌ Exp Cert</span>}

                              {c.policeVerification ? (
                                <a href={c.policeVerification} target="_blank" rel="noopener noreferrer" className="text-gold font-semibold hover:underline block">
                                  📄 Police Verification
                                </a>
                              ) : <span className="text-slate-300 block">❌ Police Cert</span>}

                              {c.additionalCertificates ? (
                                <a href={c.additionalCertificates} target="_blank" rel="noopener noreferrer" className="text-gold font-semibold hover:underline block">
                                  📄 Addit. Certs
                                </a>
                              ) : null}
                            </div>
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
                                  onClick={() => handleUpdateCaregiverStatus(c.id, "Verified")}
                                  className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-500 border border-slate-200 text-emerald-600 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Approve / Verify"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              {c.status !== "Rejected" && (
                                <button
                                  onClick={() => handleUpdateCaregiverStatus(c.id, "Rejected")}
                                  className="px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-500 border border-slate-200 text-rose-600 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditModal("caregiver", c)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-gold/15 text-gold border border-slate-200 hover:border-gold/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCaregiver(c.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white border border-slate-200 text-rose-500 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Delete"
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

          {/* Customer Base panel */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-primary font-display">Patients</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Total: {filteredUsers.length} registered patients</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/55 text-xs text-slate-400 uppercase font-bold tracking-wider">
                        <th className="py-4 px-6">Patient Name</th>
                        <th className="py-4 px-6">Email Address</th>
                        <th className="py-4 px-6">Phone Number</th>
                        <th className="py-4 px-6">Registration Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4 px-6 font-semibold text-primary font-display text-base">
                            {u.name}
                          </td>
                          <td className="py-4 px-6 text-slate-600">
                            {u.email}
                          </td>
                          <td className="py-4 px-6 text-slate-600">
                            {u.phone}
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-500 hover:text-white border border-slate-200 text-rose-500 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ml-auto"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove Account
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Service Catalog & Pricing panel */}
          {/* Payments & Transaction tracking panel */}
          {activeTab === "payments" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-6 shadow-sm gap-4">
                <div>
                  <h3 className="text-lg font-bold text-primary font-display">Payment Status & Invoices</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Track and record payments for all customer bookings.</p>
                </div>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit self-start sm:self-auto">
                  {["all", "Paid", "Unpaid"].map((filter) => {
                    const count = bookings.filter(b => filter === "all" ? true : b.paymentStatus === filter).length;
                    return (
                      <button
                        key={filter}
                        onClick={() => setSearchQuery(filter === "all" ? "" : filter)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white hover:shadow-sm text-slate-600 hover:text-slate-900 transition-all cursor-pointer capitalize"
                      >
                        {filter} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payments Stats Summary Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Booked Value</span>
                  <span className="text-2xl font-bold font-display text-slate-950 mt-1 block">
                    ₹{bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Paid (Collected)</span>
                  <span className="text-2xl font-bold font-display text-emerald-600 mt-1 block">
                    ₹{bookings.filter(b => b.paymentStatus === "Paid").reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Outstanding (Unpaid)</span>
                  <span className="text-2xl font-bold font-display text-amber-600 mt-1 block">
                    ₹{bookings.filter(b => b.paymentStatus !== "Paid").reduce((sum, b) => sum + (Number(b.amount) || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payments Table */}
              <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4 px-6">Customer Details</th>
                        <th className="py-4 px-6">Service Details</th>
                        <th className="py-4 px-6">Billable Amount</th>
                        <th className="py-4 px-6">Payment Status</th>
                        <th className="py-4 px-6">Transaction Details</th>
                        <th className="py-4 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings
                        .filter(b => {
                          if (!searchQuery) return true;
                          const q = searchQuery.toLowerCase();
                          if (q === "paid" || q === "unpaid") {
                            return b.paymentStatus.toLowerCase() === q;
                          }
                          return (
                            b.name.toLowerCase().includes(q) ||
                            b.phone.includes(q) ||
                            b.service.toLowerCase().includes(q)
                          );
                        })
                        .map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-semibold text-primary font-display">{b.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{b.phone}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-medium text-slate-800">{b.service}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{b.date} • {b.time}</div>
                            </td>
                            <td className="py-4 px-6 font-bold text-slate-800">
                              ₹{Number(b.amount).toLocaleString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                b.paymentStatus === "Paid" 
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                  : "bg-amber-50 text-amber-800 border border-amber-100"
                              }`}>
                                {b.paymentStatus}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {b.paymentStatus === "Paid" ? (
                                <div className="space-y-0.5">
                                  <div className="text-xs font-semibold text-slate-700">Method: <span className="font-bold text-slate-900">{b.paymentMethod || "N/A"}</span></div>
                                  {b.transactionId && <div className="text-[10px] font-mono text-slate-500">Ref: {b.transactionId}</div>}
                                  {b.paymentDate && <div className="text-[10px] text-slate-400">Date: {b.paymentDate}</div>}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">No transaction recorded</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => openEditModal("booking", b)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-gold/15 text-gold hover:text-gold text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors inline-block"
                              >
                                <Edit3 className="h-3.5 w-3.5" /> Record Payment
                              </button>
                            </td>
                          </tr>
                        ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
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

          {activeTab === "services" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-primary font-display">Active Services</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Total: {filteredServices.length} service offerings</p>
                </div>
                <button
                  onClick={() => openAddModal("service")}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add New Service
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {filteredServices.map((service) => (
                  <div key={service.id} className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex gap-4">
                        {service.image && (
                          <img 
                            src={service.image} 
                            className="h-20 w-20 rounded-xl object-cover border border-slate-200 shrink-0" 
                            alt={service.title} 
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-4">
                            <h4 className="text-lg font-semibold text-primary font-display truncate">{service.title}</h4>
                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 shrink-0">{service.price}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-3">{service.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal("service", service)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-gold/15 text-gold hover:text-gold text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit details
                      </button>
                      <button 
                        onClick={() => handleDeleteService(service.id)}
                        className="px-3 py-1.5 rounded-xl border border-destructive/20 hover:bg-rose-500 hover:text-white text-rose-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
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
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm md:col-span-1 h-fit">
                  <h3 className="text-lg font-bold text-primary font-display mb-4">Send Alert Notification</h3>
                  
                  <form onSubmit={handleModalSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Recipient Target</label>
                      <input 
                        type="text"
                        required
                        value={notifRecipient}
                        onChange={(e) => setNotifRecipient(e.target.value)}
                        placeholder="e.g. All Users, email@test.com"
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Delivery Method</label>
                      <select
                        value={notifType}
                        onChange={(e) => setNotifType(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                      >
                        <option value="Email">Email Message</option>
                        <option value="SMS">SMS / WhatsApp Alert</option>
                        <option value="Broadcast">Broadcast Dashboard Alert</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Alert Message</label>
                      <textarea
                        required
                        rows={4}
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        placeholder="Type alert notification details here..."
                        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 bg-background outline-none focus:ring-2 focus:ring-gold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      onClick={() => setModalType("notification")}
                      className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="h-4 w-4" /> Send Dispatch
                    </button>
                  </form>
                </div>

                {/* Notifications Dispatch Logs */}
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm md:col-span-2">
                  <h3 className="text-lg font-bold text-primary font-display mb-4">Dispatched Alerts Log</h3>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {filteredNotifications.map((notif) => (
                      <div key={notif.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-center gap-2 text-xs font-bold text-slate-400 mb-2">
                          <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">{notif.type}</span>
                          <span>{new Date(notif.sentAt).toLocaleString()}</span>
                        </div>
                        <div className="text-sm font-semibold text-primary mb-1">To: {notif.recipient}</div>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">{notif.message}</p>
                      </div>
                    ))}
                    {filteredNotifications.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-10 font-semibold">No notification logs recorded.</p>
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

          {/* Blogs Management Panel */}
          {activeTab === "blogs" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="text-left">
                  <h3 className="text-lg font-bold text-primary font-display">Health Articles &amp; Blogs</h3>
                  <p className="text-xs text-slate-400 mt-1">Publish and manage clinical advice pages for the Amma Seva Blog.</p>
                </div>
                <button
                  onClick={() => {
                    openAddModal("blog");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-[#1a2d5e] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Blog Post
                </button>
              </div>

              <div className="grid gap-4">
                {blogs.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.category.toLowerCase().includes(searchQuery.toLowerCase())).map((b) => (
                  <div
                    key={b.id}
                    className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
                  >
                    {b.image && (
                      <div className="h-20 w-32 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                        <img src={b.image} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                    <div className="flex-1 text-left space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded">
                          {b.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          📅 {b.date} | ✍️ {b.author}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-primary leading-snug">{b.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{b.description}</p>
                    </div>

                    <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => openEditModal("blog", b)}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(b.id)}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {blogs.length === 0 && (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-white p-6">
                    <p className="text-slate-400 text-sm font-semibold">No health articles loaded. Click "Add Blog Post" to publish the first guide!</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "faqs" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-primary font-display">Manage FAQs</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Total: {faqs.length} FAQ questions</p>
                </div>
                <button
                  onClick={() => openAddModal("faq")}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
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
                      className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row gap-5 items-start sm:items-center text-left"
                    >
                      <div className="flex-1 text-left space-y-1.5">
                        <h4 className="text-base font-bold text-primary leading-snug">{f.question}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{f.answer}</p>
                      </div>

                      <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => openEditModal("faq", f)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFaq(f.id)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                {faqs.length === 0 && (
                  <div className="text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-white p-6">
                    <p className="text-slate-400 text-sm font-semibold">No FAQ items loaded. Click "Add FAQ Item" to publish the first guide!</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "gallery" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-6 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-primary font-display">Manage Photo Gallery</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Total: {gallery.length} photos</p>
                </div>
                <button
                  onClick={() => openAddModal("gallery")}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Gallery Image
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {gallery
                  .filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((g) => (
                    <div
                      key={g.id}
                      className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                        <img src={g.imageUrl} className="w-full h-full object-cover" alt={g.title} />
                      </div>
                      <div className="p-4 text-left space-y-1">
                        <h4 className="text-sm font-bold text-primary truncate">{g.title}</h4>
                        <p className="text-[10px] text-slate-400">Added: {new Date(g.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="px-4 pb-4 flex justify-end">
                        <button
                          onClick={() => handleDeleteGallery(g.id)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}

                {gallery.length === 0 && (
                  <div className="col-span-full text-center py-16 border border-dashed border-slate-200 rounded-3xl bg-white p-6">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`bg-white rounded-3xl border border-slate-200 shadow-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 ${modalType === 'service' ? 'max-w-3xl' : 'max-w-xl'}`}>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-primary font-display uppercase tracking-wide">
                {modalMode === "add" ? "Create New" : "Edit Details"} {modalType}
              </h3>
              <button 
                onClick={() => setModalType(null)} 
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
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
                        type="text" required value={bookingPhone} onChange={e => setBookingPhone(e.target.value)}
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
                        type="text" required value={caregiverPhone} onChange={e => setCaregiverPhone(e.target.value)}
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
                className="btn-primary w-full py-2.5 mt-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isLoading ? "Saving changes..." : "Save Record"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Collapsible Caregiver Reviews Modal */}
      {selectedCaregiverForReviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-primary font-display flex items-center gap-2">
                  Reviews for {selectedCaregiverForReviews.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Overall rating: ⭐ {selectedCaregiverForReviews.rating || "N/A"} / 5.0</p>
              </div>
              <button
                onClick={() => setSelectedCaregiverForReviews(null)}
                className="h-8 w-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {!selectedCaregiverForReviews.reviews || selectedCaregiverForReviews.reviews.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No feedback reviews submitted for this caregiver yet.</p>
              ) : (
                selectedCaregiverForReviews.reviews.map((r: any) => (
                  <div key={r.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100 font-bold">
                        ⭐ {r.rating}.0
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 italic">&ldquo;{r.comment || "No written feedback."}&rdquo;</p>
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
