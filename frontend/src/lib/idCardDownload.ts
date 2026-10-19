/**
 * Amma Seva Staff ID Card Generator & High-Resolution PNG Downloader
 * Renders the official ID Card template with composite photo, employee ID,
 * name, and clean unified designation (MTP, Nurse, Caregiver, Employee)
 * using a single, unified premium sans-serif typography stack.
 */

export interface IdCardData {
  employeeId?: string;
  name: string;
  designation?: string;
  specialty?: string;
  staffCategory?: string;
  category?: string;
  role?: string;
  type?: string;
  isMtp?: boolean | number;
  profilePhoto?: string;
}

/**
 * Resolves the official, clean staff designation for ID Cards.
 * Maps any registered staff member strictly to one of:
 * - "MTP" (Multi Tasking Professional)
 * - "Nurse" (Registered Clinical Nurse)
 * - "Caregiver" (Caregiver & Bedside Attendant)
 * - "Employee" (Office & Operations Staff)
 *
 * Avoids verbose/long titles (e.g. "Senior Operations Coordinator & Dispatch").
 */
export function getCleanIdCardDesignation(staff?: IdCardData | null): "MTP" | "Nurse" | "Caregiver" | "Employee" {
  if (!staff) return "Employee";

  const empId = String(staff.employeeId || "").toUpperCase().replace(/\s+/g, "");
  const cat = String(staff.staffCategory || staff.category || "").toUpperCase().trim();
  const rawDesig = String(staff.designation || "").trim().toLowerCase();
  const rawSpecialty = String(staff.specialty || "").trim().toLowerCase();
  const rawRole = String(staff.role || "").trim().toLowerCase();
  const rawType = String(staff.type || "").trim().toLowerCase();

  // 1. MTP (Multi Tasking Professional)
  if (
    empId.includes("MTP") ||
    cat === "MTP" ||
    Boolean(staff.isMtp) ||
    rawType === "mtp" ||
    rawRole.includes("mtp") ||
    rawDesig.includes("mtp") ||
    rawDesig.includes("transport") ||
    rawSpecialty.includes("transport")
  ) {
    return "MTP";
  }

  // 2. Nurse (Clinical Homecare Nurse / GNM / ANM / ICU Nurse)
  if (
    empId.includes("NUR") ||
    cat === "NUR" ||
    cat === "NURSE" ||
    rawType === "nurse" ||
    rawRole.includes("nurse") ||
    rawDesig.includes("nurse") ||
    rawSpecialty.includes("nurse") ||
    rawSpecialty.includes("nursing")
  ) {
    return "Nurse";
  }

  // 3. Caregiver (Bedside Attendant, Elder Care, Patient Care Specialist)
  if (
    empId.includes("CGV") ||
    empId.includes("CAR") ||
    cat === "CGV" ||
    cat === "CARE" ||
    cat === "CAREGIVER" ||
    rawType === "caregiver" ||
    rawRole.includes("caregiver") ||
    rawRole.includes("caretaker") ||
    rawDesig.includes("caregiver") ||
    rawDesig.includes("attendant") ||
    rawDesig.includes("specialist") ||
    rawSpecialty.includes("care") ||
    rawSpecialty.includes("attendant") ||
    rawSpecialty.includes("elderly")
  ) {
    return "Caregiver";
  }

  // 4. Employee (Office Employee / Operations Lead / Internal Staff)
  if (
    empId.includes("EMP") ||
    cat === "EMP" ||
    cat === "EMPLOYEE" ||
    rawType === "employee" ||
    rawRole.includes("employee") ||
    rawRole.includes("admin") ||
    rawDesig.includes("operation") ||
    rawDesig.includes("coordinator") ||
    rawDesig.includes("executive") ||
    rawDesig.includes("manager") ||
    rawDesig.includes("officer")
  ) {
    return "Employee";
  }

  // Fallbacks
  if (rawDesig.includes("nurse") || rawSpecialty.includes("nurse")) return "Nurse";
  if (rawDesig.includes("mtp")) return "MTP";
  if (rawDesig.includes("caregiver") || rawSpecialty.includes("care")) return "Caregiver";

  return "Employee";
}

/** Single unified font stack across the entire ID card */
const UNIFIED_CARD_FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export async function generateIdCardBlob(data: IdCardData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 682;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return reject(new Error("Canvas 2D context not available"));
    }

    const templateImg = new Image();
    templateImg.crossOrigin = "anonymous";

    templateImg.onload = () => {
      // 1. Draw base ID card artwork template
      ctx.drawImage(templateImg, 0, 0, 682, 1024);

      // Coordinates corresponding to 682x1024 canvas
      const photoX = 202;
      const photoY = 289;
      const photoW = 277;
      const photoH = 305;
      const photoRadius = 16;

      const finishDrawing = () => {
        // Text styling matching brand palette: unified deep navy, exact baseline
        ctx.fillStyle = "#091438";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

        // 1. Employee ID - Using unified sans-serif font
        const empIdText = (data.employeeId || "PENDING").trim();
        let empIdFontSize = 23;
        ctx.font = `800 ${empIdFontSize}px ${UNIFIED_CARD_FONT}`;
        while (ctx.measureText(empIdText).width > 320 && empIdFontSize > 14) {
          empIdFontSize -= 1;
          ctx.font = `800 ${empIdFontSize}px ${UNIFIED_CARD_FONT}`;
        }
        ctx.fillText(empIdText, 312, 656);

        // 2. Full Name - Using unified sans-serif font
        const nameText = (data.name || "Amma Seva Staff").trim();
        let nameFontSize = 23;
        ctx.font = `800 ${nameFontSize}px ${UNIFIED_CARD_FONT}`;
        while (ctx.measureText(nameText).width > 320 && nameFontSize > 14) {
          nameFontSize -= 1;
          ctx.font = `800 ${nameFontSize}px ${UNIFIED_CARD_FONT}`;
        }
        ctx.fillText(nameText, 312, 727);

        // 3. Designation - Clean single role (MTP, Nurse, Caregiver, Employee) using unified font
        const designationText = getCleanIdCardDesignation(data);
        let desigFontSize = 23;
        ctx.font = `800 ${desigFontSize}px ${UNIFIED_CARD_FONT}`;
        while (ctx.measureText(designationText).width > 320 && desigFontSize > 14) {
          desigFontSize -= 1;
          ctx.font = `800 ${desigFontSize}px ${UNIFIED_CARD_FONT}`;
        }
        ctx.fillText(designationText, 312, 799);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas toBlob returned null"));
          },
          "image/png",
          1.0
        );
      };

      const drawPhotoFrame = (img?: HTMLImageElement) => {
        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(photoX, photoY, photoW, photoH, photoRadius);
        } else {
          ctx.rect(photoX, photoY, photoW, photoH);
        }
        ctx.closePath();
        ctx.clip();

        if (img) {
          // Object-fit: cover logic
          const imgAspect = img.naturalWidth / img.naturalHeight;
          const frameAspect = photoW / photoH;
          let sx = 0;
          let sy = 0;
          let sw = img.naturalWidth;
          let sh = img.naturalHeight;

          if (imgAspect > frameAspect) {
            sw = img.naturalHeight * frameAspect;
            sx = (img.naturalWidth - sw) / 2;
          } else {
            sh = img.naturalWidth / frameAspect;
            sy = (img.naturalHeight - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
        } else {
          // Placeholder avatar
          ctx.fillStyle = "#f1f5f9";
          ctx.fillRect(photoX, photoY, photoW, photoH);
          ctx.fillStyle = "#94a3b8";
          ctx.font = `bold 15px ${UNIFIED_CARD_FONT}`;
          ctx.textAlign = "center";
          ctx.fillText("PHOTO HERE", photoX + photoW / 2, photoY + photoH / 2);
          ctx.textAlign = "left";
        }
        ctx.restore();

        // Draw Gold Border Frame
        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(photoX, photoY, photoW, photoH, photoRadius);
        } else {
          ctx.rect(photoX, photoY, photoW, photoH);
        }
        ctx.closePath();
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        finishDrawing();
      };

      if (data.profilePhoto) {
        const photoImg = new Image();
        photoImg.crossOrigin = "anonymous";
        photoImg.onload = () => drawPhotoFrame(photoImg);
        photoImg.onerror = () => {
          console.warn("Failed to load staff photo for canvas, rendering placeholder instead.");
          drawPhotoFrame();
        };
        photoImg.src = data.profilePhoto;
      } else {
        drawPhotoFrame();
      }
    };

    templateImg.onerror = () => {
      reject(new Error("Failed to load /assets/id-card-template.png from public assets"));
    };

    templateImg.src = "/assets/id-card-template.png";
  });
}

export async function downloadIdCardImage(data: IdCardData): Promise<void> {
  const blob = await generateIdCardBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const cleanId = (data.employeeId || data.name || "Staff").replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url;
  a.download = `AmmaSeva-ID-Card-${cleanId}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
