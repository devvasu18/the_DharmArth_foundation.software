const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Counter = require('../models/Counter');
const Donation = require('../models/Donation');
const { decrypt } = require('../utils/security');

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
        return `TDF/REC/${financialYear}/${sequence}`;
    }

    /**
     * Helper to convert number to words (Indian Format)
     */
    numberToWords(num) {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const inWords = (n) => {
            if ((n = n.toString()).length > 9) return 'overflow';
            let n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n_arr) return '';
            let str = '';
            str += n_arr[1] != 0 ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
            str += n_arr[2] != 0 ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
            str += n_arr[3] != 0 ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
            str += n_arr[4] != 0 ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
            str += n_arr[5] != 0 ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) + 'Only' : 'Only';
            return str.trim();
        };
        return inWords(num);
    }

    /**
     * Create the PDF Receipt (Normal)
     */
    async createCertificate(donation) {
        return new Promise(async (resolve, reject) => {
            try {
                const receiptNo = await this.generateReceiptNumber();
                const fileName = `Receipt_${receiptNo.replace(/\//g, '_')}.pdf`;
                const filePath = path.join(__dirname, '../../public/receipts', fileName);

                // Ensure directory exists
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                const doc = new PDFDocument({ margin: 40, size: 'A4' });
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const themeColor = '#00bfa5';
                const secondaryColor = '#444444';

                // --- HEADER ---
                doc.fillColor(themeColor).fontSize(24).font('Helvetica-Bold').text('The DharmArth Foundation', { align: 'center' });
                doc.fillColor(secondaryColor).fontSize(10).font('Helvetica').text('Serving Humanity with Compassion', { align: 'center' });
                doc.moveDown(1.5);

                // Title Bar
                doc.rect(40, doc.y, 515, 25).fill(themeColor);
                doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('DONATION RECEIPT', 40, doc.y + 7, { align: 'center', width: 515 });
                doc.moveDown(2);

                // Date & Receipt No
                const startY = doc.y;
                doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('Date: ', 40, startY, { continued: true });
                doc.font('Helvetica').text(new Date(donation.createdAt).toLocaleDateString('en-IN'));

                doc.font('Helvetica-Bold').text('Receipt No: ', 380, startY, { continued: true });
                doc.font('Helvetica').text(receiptNo);
                doc.moveDown(1.5);

                // Helper for sections
                const drawSectionHeader = (title) => {
                    doc.rect(40, doc.y, 515, 18).fill('#f5f5f5');
                    doc.fillColor(themeColor).fontSize(11).font('Helvetica-Bold').text(title, 45, doc.y - 14);
                    doc.moveDown(0.5);
                };

                // --- 1. NGO DETAILS ---
                drawSectionHeader('1. NGO DETAILS');
                doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('Name: ', 50, doc.y, { continued: true });
                doc.font('Helvetica').text('The DharmArth Foundation');
                doc.font('Helvetica-Bold').text('Address: ', 50, doc.y, { continued: true });
                doc.font('Helvetica').text('123, Spiritual Plaza, Sector 10, New Delhi - 110001');
                doc.font('Helvetica-Bold').text('PAN: ', 50, doc.y, { continued: true });
                doc.font('Helvetica').text('ABCDE1234F');
                doc.moveDown(1.2);

                // --- 2. DONOR DETAILS ---
                drawSectionHeader('2. DONOR DETAILS');
                doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('Name: ', 50, doc.y, { continued: true });
                doc.font('Helvetica').text(donation.donorName);
                doc.font('Helvetica-Bold').text('Mobile: ', 50, doc.y, { continued: true });
                doc.font('Helvetica').text(donation.donorMobile);
                doc.moveDown(1.2);

                // --- 3. DONATION DETAILS ---
                drawSectionHeader('3. DONATION DETAILS');
                doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('Amount Received: ', 50, doc.y, { continued: true });
                doc.font('Helvetica-Bold').fillColor(themeColor).text(`INR ${donation.amount.toLocaleString('en-IN')}/-`);
                doc.fillColor('#000000').font('Helvetica-Bold').text('(In words): ', 50, doc.y, { continued: true });
                doc.font('Helvetica-Oblique').text(this.numberToWords(donation.amount));
                doc.font('Helvetica-Bold').text('Mode of Payment: ', 50, doc.y, { continued: true });
                doc.font('Helvetica').text('Online / Razorpay');
                doc.font('Helvetica-Bold').text('Transaction ID: ', 50, doc.y, { continued: true });
                doc.font('Helvetica').text(donation.transactionId || 'N/A');
                doc.moveDown(1.2);

                // --- DECLARATION ---
                doc.rect(40, doc.y, 515, 45).stroke('#eeeeee');
                doc.fontSize(9).fillColor('#666666').font('Helvetica-Oblique').text(
                    'This is a computer-generated receipt for the donation received by The DharmArth Foundation. Thank you for your contribution towards serving humanity.',
                    45, doc.y + 7, { width: 505, align: 'justify' }
                );
                doc.moveDown(3);

                // --- SIGNATORY ---
                const footerY = doc.y;
                doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('Authorized Signatory', 380, footerY);
                doc.font('Helvetica').text('The DharmArth Foundation', 380, doc.y);
                doc.moveDown(0.5);
                doc.fontSize(8).fillColor(themeColor).text('(Digital Receipt)', 380, doc.y, { align: 'left' });

                // Footer Border
                doc.rect(40, 780, 515, 2).fill(themeColor);
                doc.fillColor(secondaryColor).fontSize(8).text('Thank you for your support. Together we make a difference.', 40, 785, { align: 'center', width: 515 });

                doc.end();

                stream.on('finish', async () => {
                    donation.receiptNumber = receiptNo;
                    donation.receiptUrl = `/public/receipts/${fileName}`;
                    donation.certificateUrl = donation.receiptUrl; // Sync for backward compatibility
                    await donation.save();
                    resolve(donation.receiptUrl);
                });

            } catch (error) {
                console.error("PDF Gen Error:", error);
                reject(error);
            }
        });
    }
}

module.exports = new CertificateService();
