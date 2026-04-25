const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Counter = require('../models/Counter');
const Donation = require('../models/Donation');

/**
 * Service to handle 80G Certificate Generation
 */
class CertificateService {
    
    /**
     * Generate a unique receipt number based on financial year
     * Format: TDF/80G/2026-27/0001
     */
    async generateReceiptNumber() {
        const date = new Date();
        const currentYear = date.getFullYear();
        const nextYear = (currentYear + 1).toString().slice(-2);
        const financialYear = `${currentYear}-${nextYear}`;
        
        const counter = await Counter.findOneAndUpdate(
            { name: `receipt_${financialYear}` },
            { $inc: { seq: 1 } },
            { upsert: true, new: true }
        );
        
        const sequence = counter.seq.toString().padStart(4, '0');
        return `TDF/80G/${financialYear}/${sequence}`;
    }

    /**
     * Create the PDF Certificate
     */
    async createCertificate(donation) {
        return new Promise(async (resolve, reject) => {
            try {
                const receiptNo = await this.generateReceiptNumber();
                const fileName = `80G_${receiptNo.replace(/\//g, '_')}.pdf`;
                const filePath = path.join(__dirname, '../../public/certificates', fileName);
                
                const doc = new PDFDocument({ margin: 50 });
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // --- HEADER ---
                doc.fontSize(20).text('The Dharmarth Foundation', { align: 'center' });
                doc.fontSize(10).text('Registered under Section 80G of Income Tax Act', { align: 'center' });
                doc.moveDown();
                
                doc.fontSize(12).text(`Receipt No: ${receiptNo}`, { continued: true });
                doc.text(`Date: ${new Date(donation.createdAt).toLocaleDateString()}`, { align: 'right' });
                doc.moveDown();

                doc.rect(50, doc.y, 500, 2).fill('#00bfa5');
                doc.moveDown();

                // --- DONOR INFO ---
                doc.fontSize(14).text('DONATION RECEIPT', { align: 'center', underline: true });
                doc.moveDown();

                doc.fontSize(12).text(`Received with thanks from:`, { continued: true });
                doc.font('Helvetica-Bold').text(` ${donation.donorName}`);
                doc.font('Helvetica').text(`Email: ${donation.donorEmail || 'N/A'}`);
                doc.text(`Mobile: ${donation.donorMobile}`);
                doc.moveDown();

                doc.text(`PAN Number: `, { continued: true });
                doc.font('Helvetica-Bold').text(donation.panNumber || 'N/A');
                doc.font('Helvetica').text(`Aadhaar Number: ${donation.aadhaarNumber || 'N/A'}`);
                doc.moveDown();

                // --- AMOUNT ---
                doc.rect(50, doc.y, 500, 40).stroke();
                doc.y += 12;
                doc.fontSize(14).text(`Amount Received: INR ${donation.amount.toLocaleString()}/-`, { align: 'center' });
                doc.moveDown();

                // --- LEGAL TEXT ---
                doc.fontSize(10).font('Helvetica-Oblique').text(
                    'This is a computer-generated receipt and does not require a physical signature. Your donation is eligible for deduction under Section 80G of the Income Tax Act, 1961.',
                    { align: 'center' }
                );
                doc.moveDown();

                doc.fontSize(9).font('Helvetica').text(
                    'Foundation Details:\nRegistration No: EXAMPLE12345678\nValidity: Permanent\nAddress: [Foundation Office Address, City, State, India]',
                    { align: 'left' }
                );

                // --- FOOTER ---
                doc.end();

                stream.on('finish', async () => {
                    // Update donation record
                    donation.receiptNumber = receiptNo;
                    donation.certificateUrl = `/public/certificates/${fileName}`;
                    await donation.save();
                    resolve(donation.certificateUrl);
                });

            } catch (error) {
                console.error("PDF Gen Error:", error);
                reject(error);
            }
        });
    }
}

module.exports = new CertificateService();
