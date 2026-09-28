/**
 * Comprehensive Validation Library for Amma Seva
 * Enforces strict, real-world Indian formats for names, phone numbers, emails, addresses, Aadhaar, PAN, and pincodes.
 */

// 1. Phone number validation (Strict Indian 10-digit mobile)
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, "");
  if (clean.length !== 10) return false;
  // Must start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(clean)) return false;
  // Reject all identical digits (e.g., 9999999999, 8888888888, 7777777777, 6666666666)
  if (/^(\d)\1{9}$/.test(clean)) return false;
  // Reject simple sequences
  if (clean === "1234567890" || clean === "9876543210" || clean === "0123456789" || clean === "1122334455") return false;
  return true;
}

export function validatePhone(phone: string, label = "Mobile number"): string | null {
  if (!phone || !phone.trim()) return `Please enter ${label.toLowerCase()}.`;
  const clean = phone.replace(/\D/g, "");
  if (clean.length !== 10) return `${label} must be exactly 10 digits.`;
  if (!isValidPhone(clean)) {
    return `Please enter a valid 10-digit Indian ${label.toLowerCase()} starting with 6, 7, 8, or 9 (avoid fake/repetitive numbers).`;
  }
  return null;
}

// 2. Full Name validation
export function isValidName(name: string): boolean {
  if (!name) return false;
  const clean = name.trim();
  if (clean.length < 3 || clean.length > 60) return false;
  // Must contain only alphabetic letters, spaces, dots, apostrophes, hyphens
  if (!/^[a-zA-Z\s.'-]{3,60}$/.test(clean)) return false;
  // Must contain at least three letters
  const letterCount = (clean.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < 3) return false;
  // Reject repeated single letter (e.g., 'aaaa', 'xxxx')
  if (/^([a-zA-Z])\1+$/.test(clean.replace(/\s+/g, ""))) return false;
  return true;
}

export function validateName(name: string, label = "Full name"): string | null {
  if (!name || !name.trim()) return `Please enter ${label.toLowerCase()}.`;
  if (!isValidName(name)) {
    return `Please enter a valid ${label.toLowerCase()} (letters only, at least 3 characters).`;
  }
  return null;
}

// 3. Email validation
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const clean = email.trim();
  // Standard RFC 5322 compatible regex
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(clean)) return false;
  // Reject common fake domains or placeholder patterns
  if (clean.endsWith("@test.com") || clean.endsWith("@example.com") || clean.startsWith("test@") || clean.startsWith("temp@")) return false;
  return true;
}

export function validateEmail(email: string, required = false, label = "Email address"): string | null {
  if (!email || !email.trim()) {
    return required ? `Please enter ${label.toLowerCase()}.` : null;
  }
  if (!isValidEmail(email)) {
    return `Please enter a valid ${label.toLowerCase()} (e.g. name@gmail.com).`;
  }
  return null;
}

// 4. Address validation
export function isValidAddress(address: string): boolean {
  if (!address) return false;
  const clean = address.trim();
  if (clean.length < 8 || clean.length > 250) return false;
  // Reject junk one-word address like "hyderabad", "india", "home", "test"
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) return false;
  return true;
}

export function validateAddress(address: string, label = "Complete address"): string | null {
  if (!address || !address.trim()) return `Please enter ${label.toLowerCase()}.`;
  if (!isValidAddress(address)) {
    return `Please provide a complete ${label.toLowerCase()} with house/flat number, street, and locality (at least 8 characters).`;
  }
  return null;
}

// 5. Aadhaar Number validation
export function isValidAadhaar(aadhaar: string): boolean {
  if (!aadhaar) return false;
  const clean = aadhaar.replace(/\D/g, "");
  if (clean.length !== 12) return false;
  if (/^(\d)\1{11}$/.test(clean)) return false;
  if (clean === "123456789012" || clean === "012345678901" || clean === "112233445566") return false;
  return true;
}

export function validateAadhaar(aadhaar: string, required = false): string | null {
  if (!aadhaar || !aadhaar.trim()) {
    return required ? "Please enter your 12-digit Aadhaar number." : null;
  }
  const clean = aadhaar.replace(/\D/g, "");
  if (!isValidAadhaar(clean)) {
    return "Please enter a valid 12-digit Aadhaar number (avoid repetitive or sequence numbers).";
  }
  return null;
}

// 6. PAN Card validation
export function isValidPAN(pan: string): boolean {
  if (!pan) return false;
  const clean = pan.trim().toUpperCase();
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean);
}

export function validatePAN(pan: string, required = false): string | null {
  if (!pan || !pan.trim()) {
    return required ? "Please enter your PAN Card number." : null;
  }
  if (!isValidPAN(pan)) {
    return "Please enter a valid 10-character PAN number (e.g. ABCDE1234F).";
  }
  return null;
}

// 7. Pincode validation (Indian 6-digit postal code)
export function isValidPincode(pincode: string): boolean {
  if (!pincode) return false;
  const clean = pincode.replace(/\D/g, "");
  return /^[1-9]\d{5}$/.test(clean);
}

export function validatePincode(pincode: string, required = false): string | null {
  if (!pincode || !pincode.trim()) {
    return required ? "Please enter postal pincode." : null;
  }
  const clean = pincode.replace(/\D/g, "");
  if (!isValidPincode(clean)) {
    return "Please enter a valid 6-digit postal pincode.";
  }
  return null;
}
