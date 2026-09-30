/**
 * Comprehensive Validation Library for Amma Seva
 * Enforces strict, real-world Indian formats for names, phone numbers, emails, addresses, Aadhaar, PAN, and pincodes.
 */

// 1. Phone number formatting & validation (Strict Indian 10-digit mobile starting with 6, 7, 8, or 9)
export function sanitizeIndianPhone(input: string): string {
  if (!input) return "";

  // Strip non-digits
  let digits = input.replace(/\D/g, "");

  // Handle pasted international prefixes (+91 or leading 0) when total digits exceed 10
  if (digits.length >= 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) {
    digits = digits.slice(1);
  }

  // STRICT INDIAN RULE: First digit of a 10-digit mobile number MUST start with 6, 7, 8, or 9.
  // Discard leading invalid digits (0, 1, 2, 3, 4, 5)
  if (digits.length > 0 && !/^[6-9]/.test(digits)) {
    const validStartIdx = digits.search(/[6-9]/);
    if (validStartIdx !== -1) {
      digits = digits.slice(validStartIdx);
    } else {
      return "";
    }
  }

  // Return strictly at most 10 digits
  return digits.slice(0, 10);
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, "");
  if (clean.length !== 10) return false;
  // Must start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(clean)) return false;
  // Reject all identical digits (e.g., 9999999999, 8888888888, 7777777777, 6666666666, 0000000000)
  if (/^(\d)\1{9}$/.test(clean)) return false;
  // Reject obvious sequence/fake dummy numbers
  if (clean === "1234567890" || clean === "0123456789" || clean === "1122334455") return false;
  return true;
}

export function validatePhone(phone: string, label = "Mobile number"): string | null {
  if (!phone || !phone.trim()) return `Please enter ${label.toLowerCase()}.`;
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 0) return `Please enter ${label.toLowerCase()}.`;
  if (!/^[6-9]/.test(clean)) {
    return `${label} must start with 6, 7, 8, or 9.`;
  }
  if (clean.length !== 10) {
    return `${label} must be exactly 10 digits (currently ${clean.length} digits).`;
  }
  if (!isValidPhone(clean)) {
    return `Please enter a valid 10-digit Indian ${label.toLowerCase()} starting with 6, 7, 8, or 9.`;
  }
  return null;
}

// 2. Full Name / Text formatting & validation (Strictly letters, spaces, and basic name punctuation)
export function sanitizeName(input: string): string {
  if (!input) return "";
  // Strip all numbers and special symbols (0-9, @#$%^&*!~`+=<>?/|\"{}[]), allowing only letters, spaces, dots, hyphens, and apostrophes
  return input.replace(/[^a-zA-Z\s.'-]/g, "");
}

export function isValidName(name: string): boolean {
  if (!name) return false;
  const clean = name.trim();
  if (clean.length < 3 || clean.length > 60) return false;
  // Reject if contains any numeric digits
  if (/\d/.test(clean)) return false;
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
  const clean = name.trim();
  if (/\d/.test(clean)) {
    return `${label} must contain text only (numbers are not allowed).`;
  }
  if (!/^[a-zA-Z\s.'-]+$/.test(clean)) {
    return `${label} must only contain letters and spaces (special characters are not allowed).`;
  }
  if (!isValidName(name)) {
    return `Please enter a valid ${label.toLowerCase()} (letters only, at least 3 characters).`;
  }
  return null;
}

// 3. Email validation & sanitization
export const COMMON_EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.cmo": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmail.in": "gmail.com",
  "gmail.co.in": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmaild.com": "gmail.com",
  "gemail.com": "gmail.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yaho.com": "yahoo.com",
  "ymail.co": "ymail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.co": "outlook.com",
  "iclod.com": "icloud.com",
  "icld.com": "icloud.com",
  "icloud.co": "icloud.com",
  "rediff.co": "rediffmail.com",
  "rediff.com": "rediffmail.com",
  "redif.com": "rediffmail.com",
};

const INVALID_EMAIL_TLDS = new Set([
  "con", "comm", "cmo", "cm", "coo", "ocm", "vom", "xom", "cpm", "col", "coom", "gmai", "gma", "gmil", "c0m"
]);

export function sanitizeEmail(email: string): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

const POPULAR_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "yahoo.co.in",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "rediffmail.com",
  "proton.me",
  "zoho.com"
];

export function detectDomainTypo(domain: string): string | null {
  if (!domain) return null;
  const clean = domain.trim().toLowerCase();
  if (COMMON_EMAIL_DOMAIN_TYPOS[clean]) {
    return COMMON_EMAIL_DOMAIN_TYPOS[clean];
  }
  for (const pop of POPULAR_DOMAINS) {
    if (clean === pop) return null;
    const dist = levenshteinDistance(clean, pop);
    if (dist <= 2) {
      return pop;
    }
  }
  return null;
}

export function validateEmail(email: string, required = false, label = "Email address"): string | null {
  if (!email || !String(email).trim()) {
    return required ? `Please enter ${label.toLowerCase()}.` : null;
  }
  const clean = String(email).trim().toLowerCase();
  if (clean.length < 5 || clean.length > 254) {
    return `${label} must be between 5 and 254 characters.`;
  }

  const atIndex = clean.indexOf("@");
  if (atIndex === -1 || atIndex !== clean.lastIndexOf("@")) {
    return `Please enter a valid ${label.toLowerCase()} containing a single '@'.`;
  }

  const local = clean.slice(0, atIndex);
  const domain = clean.slice(atIndex + 1);

  if (!local || local.length > 64) {
    return `The username part of your ${label.toLowerCase()} is invalid.`;
  }
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return `${label} username cannot start, end, or contain consecutive dots.`;
  }
  if (!/^[a-z0-9._%+-]+$/.test(local)) {
    return `${label} username contains invalid characters.`;
  }

  if (!domain || domain.length > 255) {
    return `${label} domain is invalid.`;
  }
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..") || domain.startsWith("-") || domain.endsWith("-")) {
    return `${label} domain format is invalid.`;
  }

  const domainParts = domain.split(".");
  if (domainParts.length < 2) {
    return `Please enter a valid ${label.toLowerCase()} ending with a domain (e.g. name@gmail.com).`;
  }

  const tld = domainParts[domainParts.length - 1];
  if (!/^[a-z]{2,24}$/.test(tld)) {
    return `Email domain extension '.${tld}' is invalid.`;
  }
  if (INVALID_EMAIL_TLDS.has(tld)) {
    return `Invalid domain extension '.${tld}'. Did you mean '.com'?`;
  }

  const typoSuggestion = detectDomainTypo(domain);
  if (typoSuggestion) {
    return `Invalid domain '${domain}'. Did you mean '${local}@${typoSuggestion}'?`;
  }

  // Provider specific rules
  const mainDomain = domainParts.slice(0, -1).join(".");
  if (mainDomain === "gmail" && tld !== "com") {
    return `Gmail addresses must end with '@gmail.com' (not '.${tld}').`;
  }
  if (mainDomain === "icloud" && tld !== "com") {
    return `iCloud addresses must end with '@icloud.com' (not '.${tld}').`;
  }

  // Reject placeholder fake emails
  if (
    clean.endsWith("@test.com") ||
    clean.endsWith("@example.com") ||
    clean.startsWith("test@") ||
    clean.startsWith("temp@") ||
    clean.startsWith("fake@") ||
    clean === "abc@xyz.com" ||
    clean === "admin@admin.com" ||
    clean === "user@user.com"
  ) {
    return "Please enter a real, active email address.";
  }

  return null;
}

export function isValidEmail(email: string): boolean {
  return validateEmail(email, true) === null;
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
