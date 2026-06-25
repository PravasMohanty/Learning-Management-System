const PDFDocument = require("pdfkit");
const path = require("path");

/**
 * Generate a premium certificate PDF using PDFKit.
 * Refined course badge padding and integrated external signature image asset.
 *
 * @param {Object} data
 * @param {string} data.studentName
 * @param {string} data.courseName
 * @param {string} data.issueDate
 * @param {string} data.certificateId
 * @param {string} data.qrCode        - QR code as a base64 data URL
 * @returns {Promise<Buffer>}         - PDF file buffer
 */
async function generatePdf(data) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = doc.page.width;   // ~841.89
      const H = doc.page.height;  // ~595.28

      // ── Palette ───────────────────────────────────────────────────────────
      const NAVY = "#0D1B3E";   // background
      const GOLD = "#C9A84C";   // primary accent
      const GOLD_LIGHT = "#E8C97A";   // lighter accent
      const WHITE = "#FFFFFF";
      const MUTED = "#A89F8C";   // secondary text

      // ── Full dark background ───────────────────────────────────────────────
      doc.rect(0, 0, W, H).fill(NAVY);

      // ── Subtle geometric corner ornaments ─────────────────────────────────
      function drawCornerOrnament(cx, cy, rotate) {
        doc.save();
        doc.translate(cx, cy);
        doc.rotate(rotate);
        doc
          .moveTo(0, 0).lineTo(40, 0)
          .moveTo(0, 0).lineTo(0, 40)
          .lineWidth(1.5)
          .strokeColor(GOLD)
          .stroke();
        doc.circle(0, 0, 2.5).fill(GOLD);
        doc.restore();
      }

      const inset = 30;
      drawCornerOrnament(inset, inset, 0);
      drawCornerOrnament(W - inset, inset, 90);
      drawCornerOrnament(W - inset, H - inset, 180);
      drawCornerOrnament(inset, H - inset, 270);

      // ── Outer border ──────────────────────────────────────────────────────
      doc
        .rect(inset + 12, inset + 12, W - (inset + 12) * 2, H - (inset + 12) * 2)
        .lineWidth(1)
        .strokeColor(GOLD)
        .stroke();

      // ── Thin inner line ───────────────────────────────────────────────────
      doc
        .rect(inset + 18, inset + 18, W - (inset + 18) * 2, H - (inset + 18) * 2)
        .lineWidth(0.25)
        .strokeColor(GOLD_LIGHT)
        .stroke();

      // ── Decorative horizontal rule helper ─────────────────────────────────
      function hRule(y, ruleW) {
        const x0 = (W - ruleW) / 2;
        doc.save()
          .translate(x0, y)
          .rotate(45)
          .rect(-3, -3, 6, 6)
          .fill(GOLD);
        doc.restore();
        doc.save()
          .translate(x0 + ruleW, y)
          .rotate(45)
          .rect(-3, -3, 6, 6)
          .fill(GOLD);
        doc.restore();
        doc
          .moveTo(x0 + 12, y)
          .lineTo(x0 + ruleW - 12, y)
          .lineWidth(0.75)
          .strokeColor(GOLD)
          .stroke();
      }

      // ── Layout Core ───────────────────────────────────────────────────────

      // 1. Organization Header
      let currentY = 75;
      const LMS_APP_NAME = process.env.LMS_APP_NAME || "RESEARCH SWARM";
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(GOLD_LIGHT)
        .text(LMS_APP_NAME.toUpperCase(), 0, currentY, {
          align: "center",
          width: W,
          characterSpacing: 5,
        });

      currentY += 25;
      hRule(currentY, 200);

      // 2. Main Title Line
      currentY += 35;
      doc
        .font("Helvetica-Bold")
        .fontSize(32)
        .fillColor(WHITE)
        .text("CERTIFICATE OF COMPLETION", 0, currentY, {
          align: "center",
          width: W,
          characterSpacing: 1.5,
        });

      // 3. Sub-Heading Text
      currentY += 55;
      doc
        .font("Helvetica-Oblique")
        .fontSize(12)
        .fillColor(MUTED)
        .text("This is to certify that", 0, currentY, {
          align: "center",
          width: W,
        });

      // 4. Recipient Name
      currentY += 30;
      const studentName = data.studentName || "Student Name";
      doc
        .font("Helvetica-Bold")
        .fontSize(36)
        .fillColor(GOLD_LIGHT)
        .text(studentName, 0, currentY, {
          align: "center",
          width: W,
        });

      // Underline Accent
      const nameWidth = doc.widthOfString(studentName, { fontSize: 36, font: "Helvetica-Bold" });
      const underlineX = (W - Math.min(nameWidth, W - 200)) / 2;
      currentY += 52;
      doc
        .moveTo(underlineX, currentY)
        .lineTo(underlineX + Math.min(nameWidth, W - 200), currentY)
        .lineWidth(1)
        .strokeColor(GOLD)
        .stroke();

      // 5. Fulfillment Declaration
      currentY += 20;
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor(MUTED)
        .text("has successfully met all requirements and completed the specialized course", 0, currentY, {
          align: "center",
          width: W,
        });

      // 6. Course Title Badge (Enhanced Left/Right Padding)
      currentY += 30;
      const courseName = data.courseName || "Course Name";

      const computedTextWidth = doc.widthOfString(courseName, { fontSize: 15, font: "Helvetica-Bold" });
      //  FIXED: Increased horizontal padding to 100 for wider margins around the text
      const badgeWidth = Math.min(computedTextWidth + 100, W - 160);
      const badgeX = (W - badgeWidth) / 2;
      const badgeHeight = 42;

      doc
        .roundedRect(badgeX, currentY, badgeWidth, badgeHeight, 5)
        .fill(GOLD);

      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(NAVY)
        .text(courseName, badgeX, currentY + (badgeHeight - 15) / 2, {
          width: badgeWidth,
          align: "center",
        });

      // 7. Middle Balance Rule
      currentY += badgeHeight + 35;
      hRule(currentY, 450);

      // 8. Issue Date Line
      currentY += 20;
      const issuedDate =
        data.issueDate ||
        new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(MUTED)
        .text(`Date of Issuance: ${issuedDate}`, 0, currentY, {
          align: "center",
          width: W,
        });

      // ── Footer Systems ────────────────────────────────────────────────────

      const footerBaseY = H - inset - 65;
      const sigLineLength = 160;
      const sigX = inset + 50;

      //  FIXED: Dynamic Image Rendering atop the signature line
      try {
        // Looks for signature.png relative to this service file's folder location
        const sigImagePath = path.resolve(__dirname, "signature.png");

        const sigImgWidth = 100;
        const sigImgHeight = 45;
        // Calculate X position to align perfectly over the middle of the signature line
        const sigImgX = sigX + (sigLineLength - sigImgWidth) / 2;
        const sigImgY = footerBaseY - sigImgHeight - 5; // Placed 5 points clear of the rule

        doc.image(sigImagePath, sigImgX, sigImgY, {
          width: sigImgWidth,
          height: sigImgHeight
        });
      } catch (imgErr) {
        // Graceful fallback logging so the entire PDF generation pipeline won't crash if asset is missing
        console.warn("[PDF Generator] 'signature.png' resolution skipped:", imgErr.message);
      }

      // Render Structural Signature Underline Line
      doc
        .moveTo(sigX, footerBaseY)
        .lineTo(sigX + sigLineLength, footerBaseY)
        .lineWidth(0.75)
        .strokeColor(GOLD)
        .stroke();

      doc.circle(sigX, footerBaseY, 1.5).fill(GOLD);
      doc.circle(sigX + sigLineLength, footerBaseY, 1.5).fill(GOLD);

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(MUTED)
        .text("Authorized Signature", sigX, footerBaseY + 8, {
          width: sigLineLength,
          align: "center",
        });

      // Right-Side Validation QR Code
      if (data.qrCode) {
        try {
          const qrImageData = data.qrCode.replace(/^data:image\/\w+;base64,/, "");
          const qrBuffer = Buffer.from(qrImageData, "base64");
          const qrSize = 65;
          const qrX = W - inset - 50 - qrSize;
          const qrY = footerBaseY - 45;

          doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8).fill(WHITE);
          doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

          doc
            .font("Helvetica")
            .fontSize(7.5)
            .fillColor(MUTED)
            .text("Verify Authenticity", qrX - 10, qrY + qrSize + 8, {
              width: qrSize + 20,
              align: "center",
            });
        } catch (qrErr) {
          console.warn("[PDF Generator] QR code subsystem exception:", qrErr.message);
        }
      }

      // Root Identifier Metadata Footer
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(MUTED)
        .text(`Verification ID: ${data.certificateId || "N/A"}`, 0, H - inset - 22, {
          align: "center",
          width: W,
          characterSpacing: 0.5,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generatePdf;