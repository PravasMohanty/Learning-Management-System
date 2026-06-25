const fs = require("fs");
const generatePdf = require("./pdfGenerator");
const QRCode = require("qrcode");

(async () => {
    try {

        const qrCode = await QRCode.toDataURL(
            "https://youtu.be/dQw4w9WgXcQ?si=BrFWX9f-2XA0QIt5"
        );

        const pdfBuffer = await generatePdf({
            studentName: "Pravas Mohanty",
            courseName: "Machine Learning Fundamentals",
            issueDate: "23 June 2026",
            certificateId: "RS-CERT-0001",
            qrCode, // use generated QR
        });

        fs.writeFileSync(
            "sample-certificate.pdf",
            pdfBuffer
        );

        console.log("PDF generated successfully!");

    } catch (error) {
        console.error(error);
    }
})();