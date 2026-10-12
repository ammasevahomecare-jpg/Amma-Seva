/**
 * Amma Seva Staff ID Card Generator & High-Resolution PNG Downloader
 * Renders the official ID Card template with composite photo, employee ID,
 * name, and designation at exact 682x1024 resolution and triggers client-side download.
 */

export interface IdCardData {
  employeeId?: string;
  name: string;
  designation?: string;
  specialty?: string;
  staffCategory?: string;
  profilePhoto?: string;
}

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
        // Text styling matching brand palette
        ctx.fillStyle = "#091438";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

        // 1. Employee ID
        const empIdText = (data.employeeId || "PENDING").trim();
        ctx.font = "900 23px 'Courier New', Courier, monospace";
        ctx.fillText(empIdText, 312, 656);

        // 2. Full Name
        const nameText = (data.name || "Amma Seva Staff").trim();
        let nameFontSize = 23;
        ctx.font = `900 ${nameFontSize}px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        while (ctx.measureText(nameText).width > 320 && nameFontSize > 14) {
          nameFontSize -= 1;
          ctx.font = `900 ${nameFontSize}px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        }
        ctx.fillText(nameText, 312, 727);

        // 3. Designation
        const rawDesig = data.designation || data.specialty || "Amma Seva Staff";
        const designationText = String(rawDesig).trim();
        let desigFontSize = 19;
        ctx.font = `800 ${desigFontSize}px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        while (ctx.measureText(designationText).width > 320 && desigFontSize > 12) {
          desigFontSize -= 1;
          ctx.font = `800 ${desigFontSize}px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
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
          ctx.font = "bold 15px sans-serif";
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
