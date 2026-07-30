const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const QRCode = require('qrcode');
const Counter = require('../models/Counter');
const Donation = require('../models/Donation');
const User = require('../models/User');

/**
 * Service to handle high-fidelity receipt generation (English & Hindi support)
 */
class CertificateService {
    constructor() {
        this.fontsInitialized = false;
    }

    /**
     * Download fonts from Google Fonts raw repository if not cached locally
     */
    async ensureFontsDownloaded() {
        if (this.fontsInitialized) return;

        const fontDir = path.join(__dirname, '../assets/fonts');
        if (!fs.existsSync(fontDir)) {
            fs.mkdirSync(fontDir, { recursive: true });
        }

        const fonts = {
            'Poppins-Regular.ttf': 'https://github.com/google/fonts/raw/main/ofl/poppins/static/Poppins-Regular.ttf',
            'Poppins-Bold.ttf': 'https://github.com/google/fonts/raw/main/ofl/poppins/static/Poppins-Bold.ttf',
            'Poppins-Italic.ttf': 'https://github.com/google/fonts/raw/main/ofl/poppins/static/Poppins-Italic.ttf',
            'AlexBrush-Regular.ttf': 'https://github.com/google/fonts/raw/main/ofl/alexbrush/AlexBrush-Regular.ttf'
        };

        for (const [name, url] of Object.entries(fonts)) {
            const dest = path.join(fontDir, name);
            if (!fs.existsSync(dest)) {
                console.log(`[FONTS] Downloading font ${name}...`);
                try {
                    const response = await axios({
                        url,
                        method: 'GET',
                        responseType: 'stream',
                        timeout: 15000
                    });
                    await new Promise((resolve, reject) => {
                        const writer = fs.createWriteStream(dest);
                        response.data.pipe(writer);
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });
                    console.log(`[FONTS] Downloaded font ${name} successfully.`);
                } catch (err) {
                    console.error(`[FONTS] Failed to download ${name}:`, err.message);
                }
            }
        }
        this.fontsInitialized = true;
    }

    /**
     * Generate daily-sequential receipt number: D-YYYYMMDDXXXX
     */
    async generateReceiptNumber(donationDate) {
        const date = new Date(donationDate || new Date());
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        const counter = await Counter.findOneAndUpdate(
            { name: `receipt_${dateStr}` },
            { $inc: { seq: 1 } },
            { upsert: true, new: true }
        );

        const sequence = counter.seq.toString().padStart(4, '0');
        return `D-${dateStr}${sequence}`;
    }

    /**
     * Helper to convert number to words (Indian Format, English)
     */
    numberToWordsEnglish(num) {
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
            str += n_arr[5] != 0 ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) + 'Rupees Only' : 'Rupees Only';
            return str.trim();
        };
        return inWords(num);
    }

    /**
     * Helper to convert number to words (Indian Format, Hindi)
     */
    numberToWordsHindi(num) {
        const hindiNumbers = [
            '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
            'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
            'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अठाईस', 'उनतीस', 'तीस',
            'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
            'इकतालीस', 'बयालीस', 'तैंतालीस', 'चौँतालीस', 'पैँतालीस', 'छियालीस', 'सैँतालीस', 'अड़तालीस', 'उनचास', 'पचास',
            'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अठ्ठावन', 'उनसठ', 'साठ',
            'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
            'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी', 'अस्सी',
            'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सतासी', 'अठासी', 'नवासी', 'नब्बे',
            'इक्यानबे', 'बयानबे', 'तिरानबे', 'चौरानबे', 'पचानबे', 'छियानबे', 'सत्तानबे', 'अट्ठानबे', 'निन्यानबे'
        ];

        if (num === 0) return 'शून्य';

        const convert = (n) => {
            let words = '';
            if (n >= 10000000) {
                words += convert(Math.floor(n / 10000000)) + ' करोड़ ';
                n %= 10000000;
            }
            if (n >= 100000) {
                words += hindiNumbers[Math.floor(n / 100000)] + ' लाख ';
                n %= 100000;
            }
            if (n >= 1000) {
                words += hindiNumbers[Math.floor(n / 1000)] + ' हज़ार ';
                n %= 1000;
            }
            if (n >= 100) {
                words += hindiNumbers[Math.floor(n / 100)] + ' सौ ';
                n %= 100;
            }
            if (n > 0) {
                words += hindiNumbers[n];
            }
            return words.trim();
        };

        return convert(num) + ' रुपये मात्र';
    }

    /**
     * Create Redesigned PDF Receipt (Normal & 80G compliant)
     */
    async createCertificate(donation) {
        return new Promise(async (resolve, reject) => {
            try {
                // Ensure custom fonts are loaded
                await this.ensureFontsDownloaded();

                // Fetch recipient's language preference
                const donorUser = await User.findOne({ mobile: donation.donorMobile });
                const language = (donorUser && donorUser.language === 'hi') ? 'hi' : 'en';

                const receiptNo = donation.receiptNumber || (await this.generateReceiptNumber(donation.createdAt));
                const fileName = `Receipt_${receiptNo.replace(/\//g, '_')}.pdf`;
                const filePath = path.join(__dirname, '../../public/receipts', fileName);

                // Ensure directory exists
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                // Page setup
                const doc = new PDFDocument({ margin: 0, size: 'A4' });
                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Fonts Registration
                const fontDir = path.join(__dirname, '../assets/fonts');
                const hasPoppins = fs.existsSync(path.join(fontDir, 'Poppins-Regular.ttf'));

                if (hasPoppins) {
                    doc.registerFont('Poppins', path.join(fontDir, 'Poppins-Regular.ttf'));
                    doc.registerFont('Poppins-Bold', path.join(fontDir, 'Poppins-Bold.ttf'));
                    doc.registerFont('Poppins-Italic', path.join(fontDir, 'Poppins-Italic.ttf'));
                    doc.registerFont('AlexBrush', path.join(fontDir, 'AlexBrush-Regular.ttf'));
                } else {
                    // Fallback to Helvetica
                    doc.registerFont('Poppins', 'Helvetica');
                    doc.registerFont('Poppins-Bold', 'Helvetica-Bold');
                    doc.registerFont('Poppins-Italic', 'Helvetica-Oblique');
                    doc.registerFont('AlexBrush', 'Times-Roman');
                }

                // Color Palette
                const primaryColor = '#08542c';
                const secondaryColor = '#475569';
                const borderGrey = '#e2e8f0';
                const textDark = '#1e293b';

                // Dictionary Translations
                const trans = {
                    en: {
                        title: 'THE DHARMARTH MEDICAL FOUNDATION',
                        tagline: 'Serving Humanity • Saving Lives • Building a Healthier India',
                        accreditations: '✔ Registered NGO    ✔ 80G Certified    ✔ 12A Registered',
                        regNo: 'Reg. No.',
                        panNo: 'PAN No.',
                        gNo: '80G No.',
                        darpanId: 'DARPAN ID',
                        donationReceipt: 'DONATION RECEIPT',
                        thankYou: 'Thank you for your generous support.',
                        receiptNo: 'Receipt No.',
                        dateTime: 'Date & Time',
                        donorDetails: 'DONOR DETAILS',
                        donationDetails: 'DONATION DETAILS',
                        donorName: 'Donor Name',
                        mobileNumber: 'Mobile Number',
                        email: 'Email',
                        address: 'Address',
                        panCard: 'PAN Card',
                        aadhaarCard: 'Aadhaar Card',
                        donationAmount: 'Donation Amount',
                        amountInWords: 'Amount in Words',
                        paymentMode: 'Payment Mode',
                        transactionId: 'Transaction ID',
                        utrNo: 'UTR / Reference No.',
                        purpose: 'Purpose / For',
                        generalDonation: 'General Donation',
                        taxBenefitHeader: 'TAX BENEFIT UNDER SECTION 80G',
                        taxBenefitSubtext: 'Eligible for deduction under Section 80G of the Income Tax Act, 1961.',
                        taxBenefitCert: '80G Certificate No.: AANAT8534F2025101',
                        taxBenefitPan: 'PAN No.: AANAT8534C',
                        verifyHeader: 'VERIFY THIS RECEIPT',
                        verifyText: 'Scan the QR code to verify this receipt online.',
                        verifyUrl: 'tdmf.org.in/verify',
                        receiptId: 'Receipt ID:',
                        authorizedSignatory: 'AUTHORIZED SIGNATORY',
                        president: 'President',
                        digitalReceipt: '(Digital Receipt)',
                        footerTagline: 'Thank you for supporting healthcare, education and social welfare. Your contribution makes a difference.',
                        disclaimer: 'This is a computer-generated receipt and does not require a physical signature.',
                        badges: 'Transparent & Trusted   •   Every Donation Creates Impact   •   Together We Can   •   Save Paper Save Nature'
                    },
                    hi: {
                        title: 'द धर्मार्थ मेडिकल फाउंडेशन',
                        tagline: 'मानवता की सेवा • जीवन बचाना • एक स्वस्थ भारत का निर्माण',
                        accreditations: '✔ पंजीकृत एनजीओ    ✔ 80G प्रमाणित    ✔ 12A पंजीकृत',
                        regNo: 'पंजीकरण संख्या',
                        panNo: 'पैन संख्या',
                        gNo: '80G संख्या',
                        darpanId: 'दर्पण आईडी',
                        donationReceipt: 'दान रसीद',
                        thankYou: 'आपके उदार समर्थन के लिए धन्यवाद।',
                        receiptNo: 'रसीद संख्या',
                        dateTime: 'दिनांक और समय',
                        donorDetails: 'दाता का विवरण',
                        donationDetails: 'दान का विवरण',
                        donorName: 'दाता का नाम',
                        mobileNumber: 'मोबाइल नंबर',
                        email: 'ईमेल',
                        address: 'पता',
                        panCard: 'पैन कार्ड',
                        aadhaarCard: 'आधार कार्ड',
                        donationAmount: 'दान राशि',
                        amountInWords: 'शब्दों में राशि',
                        paymentMode: 'भुगतान का प्रकार',
                        transactionId: 'लेनदेन आईडी',
                        utrNo: 'यूटीआर / संदर्भ संख्या',
                        purpose: 'उद्देश्य / के लिए',
                        generalDonation: 'सामान्य दान',
                        taxBenefitHeader: 'धारा 80G के तहत कर लाभ',
                        taxBenefitSubtext: 'आयकर अधिनियम, 1961 की धारा 80G के तहत कटौती के लिए पात्र।',
                        taxBenefitCert: '80G प्रमाण पत्र संख्या: AANAT8534F2025101',
                        taxBenefitPan: 'पैन संख्या: AANAT8534C',
                        verifyHeader: 'इस रसीद को सत्यापित करें',
                        verifyText: 'इस रसीद को ऑनलाइन सत्यापित करने के लिए क्यूआर कोड स्कैन करें।',
                        verifyUrl: 'tdmf.org.in/verify',
                        receiptId: 'रसीद आईडी:',
                        authorizedSignatory: 'अधिकृत हस्ताक्षरकर्ता',
                        president: 'अध्यक्ष',
                        digitalReceipt: '(डिजिटल रसीद)',
                        footerTagline: 'स्वास्थ्य सेवा, शिक्षा और सामाजिक कल्याण का समर्थन करने के लिए धन्यवाद। आपका योगदान बदलाव लाता है।',
                        disclaimer: 'यह एक कंप्यूटर जनित रसीद है और इसमें भौतिक हस्ताक्षर की आवश्यकता नहीं है।',
                        badges: 'पारदर्शी और विश्वसनीय   •   हर दान प्रभाव पैदा करता है   •   साथ मिलकर हम   •   कागज बचाएं प्रकृति बचाएं'
                    }
                };

                const lang = trans[language];

                // 1. Draw elegant double outer borders
                doc.rect(15, 15, 565, 812).lineWidth(1.5).strokeColor(primaryColor).stroke();
                doc.rect(18, 18, 559, 806).lineWidth(0.5).strokeColor('#c2dfd1').stroke();

                // 2. EMBED LOGO IMAGE (Top Left)
                let logoPath = path.join(__dirname, '../../public/LOGO.png');
                if (!fs.existsSync(logoPath)) {
                    logoPath = path.join(__dirname, '../../public/LOGO.jpg');
                }
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 28, 28, { width: 62, height: 62 });
                }

                // 3. HEADER TEXT SECTION
                doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(16.5).text(lang.title, 98, 30);
                doc.fillColor(textDark).font('Poppins-Regular').fontSize(7.5).text(lang.tagline, 98, 52);
                doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(7.5).text(lang.accreditations, 98, 66);

                // 4. HEADER CONTACT COLUMN (Top Right)
                const contactX = 405;
                doc.fillColor(textDark).font('Poppins-Regular').fontSize(7);
                doc.text(`Tel      :  8306305569`, contactX, 30);
                doc.text(`Email  :  thedharmarth@gmail.com`, contactX, 42);
                doc.text(`Web   :  thedharmarth.com`, contactX, 54);
                doc.text(`Add    :  Sujangarh, Churu, Rajasthan`, contactX, 66);

                // Divider line below header
                doc.moveTo(25, 96).lineTo(570, 96).lineWidth(0.5).strokeColor(borderGrey).stroke();

                // 5. REGISTRATION INFORMATION GRID
                const regY = 101;
                const regColWidth = 136;
                doc.rect(25, regY, 545, 22).fill('#f8fafc');

                // Vertical divider borders in the grid
                for (let i = 1; i < 4; i++) {
                    doc.moveTo(25 + i * regColWidth, regY).lineTo(25 + i * regColWidth, regY + 22).lineWidth(0.5).strokeColor(borderGrey).stroke();
                }

                doc.fillColor(secondaryColor).font('Poppins-Regular').fontSize(6.5);
                doc.text(lang.regNo, 25, regY + 3, { align: 'center', width: regColWidth });
                doc.text(lang.panNo, 25 + regColWidth, regY + 3, { align: 'center', width: regColWidth });
                doc.text(lang.gNo, 25 + 2 * regColWidth, regY + 3, { align: 'center', width: regColWidth });
                doc.text(lang.darpanId, 25 + 3 * regColWidth, regY + 3, { align: 'center', width: regColWidth });

                doc.fillColor(textDark).font('Poppins-Bold').fontSize(7);
                doc.text('COOP/2024/CHURU/201345', 25, regY + 12, { align: 'center', width: regColWidth });
                doc.text('AANAT8534C', 25 + regColWidth, regY + 12, { align: 'center', width: regColWidth });
                doc.text('AANAT8534F2025101', 25 + 2 * regColWidth, regY + 12, { align: 'center', width: regColWidth });
                doc.text('RJ/2024/0456789', 25 + 3 * regColWidth, regY + 12, { align: 'center', width: regColWidth });

                // Border enclosing registration info
                doc.rect(25, regY, 545, 22).lineWidth(0.5).strokeColor(borderGrey).stroke();

                // 6. DONATION RECEIPT BANNER
                const bannerY = 136;
                doc.roundedRect(125, bannerY, 345, 26, 4).fill(primaryColor);

                // Decorative gold/white accent ring around banner
                doc.roundedRect(128, bannerY + 3, 339, 20, 3).lineWidth(0.5).strokeColor('#ffffff').stroke();

                doc.fillColor('#ffffff').font('Poppins-Bold').fontSize(11.5).text(lang.donationReceipt, 125, bannerY + 7, { align: 'center', width: 345 });

                // Center Banner Subtitle
                doc.fillColor(secondaryColor).font('Poppins-Italic').fontSize(8.5).text(lang.thankYou, 25, bannerY + 34, { align: 'center', width: 545 });

                // 7. RECEIPT METADATA (Receipt ID, Date)
                const metaY = 186;
                doc.fillColor(secondaryColor).font('Poppins-Regular').fontSize(8.5).text(lang.receiptNo, 385, metaY, { continued: true });
                doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(9.5).text(`  ${receiptNo}`);

                doc.fillColor(secondaryColor).font('Poppins-Regular').fontSize(8).text(lang.dateTime, 385, metaY + 14, { continued: true });

                const formattedDate = new Date(donation.createdAt).toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                });
                doc.fillColor(textDark).font('Poppins-Bold').fontSize(8).text(`  ${formattedDate}`);

                // 8. TWO-COLUMN CARDS LAYOUT (Donor Details & Donation Details)
                const cardsY = 222;
                const cardHeight = 185;
                const cardWidth = 264;

                // Helper to draw clean panels
                const drawPanel = (x, y, width, height, title) => {
                    doc.rect(x, y, width, 18).fill('#f8fafc');
                    doc.fillColor(primaryColor).font('Poppins-Bold').fontSize(8).text(title, x + 8, y + 5);
                    doc.rect(x, y, width, height).lineWidth(0.5).strokeColor(borderGrey).stroke();
                };

                // Draw Panel 1: Donor Details
                const donorX = 25;
                drawPanel(donorX, cardsY, cardWidth, cardHeight, lang.donorDetails);

                // Render Donor rows
                let donorRowY = cardsY + 28;
                const drawRow = (x, y, label, value) => {
                    doc.fillColor(secondaryColor).font('Poppins-Regular').fontSize(7.5).text(label, x + 8, y);
                    doc.fillColor(textDark).font('Poppins-Bold').fontSize(7.5).text(`:  ${value || '—'}`, x + 72, y, { width: 180 });
                };

                drawRow(donorX, donorRowY, lang.donorName, donation.donorName);
                drawRow(donorX, donorRowY + 16, lang.mobileNumber, donation.donorMobile);
                drawRow(donorX, donorRowY + 32, lang.email, donation.donorEmail);

                const fullAddress = [donation.address, donation.city, donation.state].filter(Boolean).join(', ');
                drawRow(donorX, donorRowY + 48, lang.address, fullAddress);

                // Conditionally include PAN Card & Aadhaar Card if provided
                let optY = donorRowY + 95;
                if (donation.panNumber) {
                    drawRow(donorX, optY, lang.panCard, donation.panNumber);
                    optY += 16;
                }
                if (donation.aadhaarNumber) {
                    drawRow(donorX, optY, lang.aadhaarCard, donation.aadhaarNumber);
                }

                // Draw Panel 2: Donation Details
                const donationX = 306;
                drawPanel(donationX, cardsY, cardWidth, cardHeight, lang.donationDetails);

                // Large Amount display box inside donation card
                const amtBoxX = donationX + 75;
                doc.roundedRect(amtBoxX, cardsY + 25, 178, 32, 4).fillAndStroke('#f0fdf4', '#dcfce7');

                const formattedAmount = new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0
                }).format(donation.amount);

                doc.fillColor('#16a34a').font('Poppins-Bold').fontSize(14).text(formattedAmount, amtBoxX, cardsY + 33, { align: 'center', width: 178 });
                doc.fillColor(secondaryColor).font('Poppins-Regular').fontSize(7.5).text(lang.donationAmount, donationX + 8, cardsY + 35);

                // Donation rows
                let donationRowY = cardsY + 68;

                const wordAmt = language === 'hi' ? this.numberToWordsHindi(donation.amount) : this.numberToWordsEnglish(donation.amount);
                drawRow(donationX, donationRowY, lang.amountInWords, wordAmt);

                const displayMethod = donation.paymentMethod === 'wallet' ? 'Wallet' : 'UPI / Online';
                drawRow(donationX, donationRowY + 32, lang.paymentMode, displayMethod);
                drawRow(donationX, donationRowY + 48, lang.transactionId, donation.transactionId);
                drawRow(donationX, donationRowY + 64, lang.utrNo, donation.transactionId);
                drawRow(donationX, donationRowY + 80, lang.purpose, lang.generalDonation);

                // 9. CONDITIONAL 80G TAX BENEFIT BOX
                let yOffset = donation.is80G ? 0 : -52;

                if (donation.is80G) {
                    const taxY = cardsY + cardHeight + 10;
                    doc.roundedRect(25, taxY, 545, 42, 3).fillAndStroke('#f0fdf4', '#dcfce7');

                    // 80G Stamp Badge
                    doc.circle(46, taxY + 21, 14).fill('#15803d');
                    doc.fillColor('#ffffff').font('Poppins-Bold').fontSize(6).text('80G', 34, taxY + 14, { align: 'center', width: 24 });
                    doc.font('Poppins-Bold').fontSize(4.5).text('BENEFIT', 34, taxY + 21, { align: 'center', width: 24 });

                    // Section 80G guidelines
                    doc.fillColor('#15803d').font('Poppins-Bold').fontSize(8).text(lang.taxBenefitHeader, 72, taxY + 8);
                    doc.fillColor(secondaryColor).font('Poppins-Regular').fontSize(7).text(lang.taxBenefitSubtext, 72, taxY + 22);

                    // Organization numbers info box on the right
                    const infoBoxX = 398;
                    doc.roundedRect(infoBoxX, taxY + 5, 166, 32, 2).fillAndStroke('#ffffff', '#cbd5e1');
                    doc.fillColor('#15803d').font('Poppins-Bold').fontSize(6.5).text(lang.taxBenefitCert, infoBoxX + 6, taxY + 10);
                    doc.fillColor(secondaryColor).font('Poppins-Regular').fontSize(6.5).text(lang.taxBenefitPan, infoBoxX + 6, taxY + 22);
                }

                // 10. VERIFICATION QR CODE & SIGNATURE / SEAL SECTION
                const bottomGridY = cardsY + cardHeight + 62 + yOffset;

                // QR Code generation
                const verifyUrlString = `https://tdmf.org.in/verify?id=${receiptNo}`;
                const qrBuffer = await QRCode.toBuffer(verifyUrlString, {
                    width: 140,
                    margin: 1
                });

                doc.image(qrBuffer, 28, bottomGridY, { width: 68, height: 68 });

                // QR text labels
                const qrLabelX = 104;
                doc.fillColor(textDark).font('Poppins-Bold').fontSize(7.5).text(lang.verifyHeader, qrLabelX, bottomGridY + 4);
                doc.fillColor(secondaryColor).font('Poppins-Regular').fontSize(6.8).text(lang.verifyText, qrLabelX, bottomGridY + 16, { width: 175 });
                doc.fillColor('#16a34a').font('Poppins-Regular').fontSize(6.8).text(lang.verifyUrl, qrLabelX, bottomGridY + 36);

                // Receipt ID Badge next to QR
                doc.roundedRect(qrLabelX, bottomGridY + 47, 172, 14, 2).fill(primaryColor);
                doc.fillColor('#ffffff').font('Poppins-Bold').fontSize(7).text(`${lang.receiptId} ${receiptNo}`, qrLabelX, bottomGridY + 51, { align: 'center', width: 172 });

                // Authorised Signatory details
                const signX = 306;
                doc.fillColor(secondaryColor).font('Poppins-Bold').fontSize(7.5).text(lang.authorizedSignatory, signX + 8, bottomGridY + 4);

                // Handwritten Cursive Signature using AlexBrush
                doc.fillColor('#002fbe').font('AlexBrush').fontSize(26).text('Mahesh Sharma', signX + 22, bottomGridY + 16);

                doc.fillColor(textDark).font('Poppins-Bold').fontSize(7.5).text('Mahesh Sharma', signX + 8, bottomGridY + 45);
                doc.fillColor(secondaryColor).font('Poppins-Regular').fontSize(7).text(`${lang.president}, द धर्मार्थ मेडिकल फाउंडेशन`, signX + 8, bottomGridY + 56);

                // Vector Stamp Seal
                const sealX = 508;
                const sealY = bottomGridY + 30;
                doc.circle(sealX, sealY, 24).lineWidth(1).strokeColor('#002fbe').stroke();
                doc.circle(sealX, sealY, 21).lineWidth(0.5).strokeColor('#002fbe').stroke();

                doc.fillColor('#002fbe').font('Poppins-Bold').fontSize(4.5);
                doc.text('THE DHARMARTH', sealX - 20, sealY - 14, { align: 'center', width: 40 });
                doc.text('★ TDMF ★', sealX - 20, sealY - 3, { align: 'center', width: 40 });
                doc.text('MEDICAL FOUNDATION', sealX - 20, sealY + 6, { align: 'center', width: 40 });

                // 11. FOOTER SECTION
                const footerY = bottomGridY + 84;
                doc.moveTo(25, footerY).lineTo(570, footerY).lineWidth(0.5).strokeColor(borderGrey).stroke();

                // Thank you tagline
                doc.fillColor('#16a34a').font('Poppins-Regular').fontSize(7.5).text(lang.footerTagline, 25, footerY + 10, { align: 'center', width: 545 });

                // Bottom Badges Fill Bar
                const barY = footerY + 28;
                doc.rect(25, barY, 545, 16).fill(primaryColor);
                doc.fillColor('#ffffff').font('Poppins-Bold').fontSize(6.5).text(lang.badges, 25, barY + 4, { align: 'center', width: 545 });

                // Small Disclaimer
                doc.fillColor(secondaryColor).font('Poppins-Regular').fontSize(6).text(lang.disclaimer, 25, barY + 22, { align: 'center', width: 545 });

                doc.end();

                stream.on('finish', async () => {
                    donation.receiptNumber = receiptNo;
                    donation.receiptUrl = `/public/receipts/${fileName}`;
                    donation.certificateUrl = donation.receiptUrl; // Legacy Sync
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
