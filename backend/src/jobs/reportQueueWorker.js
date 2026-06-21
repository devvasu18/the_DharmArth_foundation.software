const DoctorReport = require('../models/DoctorReport');

let isProcessing = false;
let isPaused = false;
let pauseTimeout = null;

// Helper to compile the report message with replacement variables
const compileMessage = (report) => {
    const domain = process.env.FRONTEND_URL || 'https://thedharmarth.com';
    const reportUrl = report.reportUrl ? `${domain}/report/view/${report.secureToken}` : '';
    
    let template = '';
    if (report.customMessage) {
        template = report.customMessage;
    } else {
        if (report.templateLanguage === 'hi') {
            if (reportUrl) {
                template = "प्रिय मरीज {PATIENT_NAME},\n\nआपकी मेडिकल रिपोर्ट तैयार है।\n\nरिपोर्ट देखने के लिए:\n{REPORT_URL}\n\n{REMARKS}\n\nधन्यवाद।";
            } else {
                template = "प्रिय मरीज {PATIENT_NAME},\n\nनया संदेश:\n{REMARKS}\n\nधन्यवाद।";
            }
        } else {
            if (reportUrl) {
                template = "Dear Patient {PATIENT_NAME},\n\nYour medical report is ready.\n\nView Report:\n{REPORT_URL}\n\n{REMARKS}\n\nThank You.";
            } else {
                template = "Dear Patient {PATIENT_NAME},\n\nNew Message:\n{REMARKS}\n\nThank You.";
            }
        }
    }
    
    // Replace variable tokens
    let message = template
        .replace(/{PATIENT_NAME}/g, report.patientName || '')
        .replace(/{REPORT_URL}/g, reportUrl)
        .replace(/{REMARKS}/g, report.remarks || '');
        
    return message.trim();
};

// Send report message via WhatsApp service HTTP request directly to capture status codes
const sendWhatsAppWithRateLimitCheck = async (number, message) => {
    const baseUrl = (process.env.WHATSAPP_SERVICE_URL || 'http://44.203.78.96:10000')
        .replace('http://http://', 'http://')
        .replace('/:10000', ':10000');
        
    const cleanNumber = String(number).replace(/\D/g, '');
    
    try {
        const response = await fetch(`${baseUrl}/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.WHATSAPP_SERVICE_API_KEY,
                'bypass-tunnel-reminder': 'true',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ number: cleanNumber, message, priority: 1 })
        });
        
        if (response.status === 429) {
            return { success: false, rateLimit: true, status: 429 };
        }
        
        if (!response.ok) {
            const text = await response.text().catch(() => 'Error');
            return { success: false, rateLimit: false, error: `HTTP ${response.status}: ${text}` };
        }
        
        const data = await response.json();
        const ok = !!data.success || !!data.messageId;
        return { success: ok, rateLimit: false };
    } catch (err) {
        return { success: false, rateLimit: false, error: err.message };
    }
};

// Main sequential worker loop
const processNextReport = async () => {
    if (isPaused) {
        console.log('[REPORT WORKER] Worker is currently paused for cooldown.');
        return;
    }
    
    if (isProcessing) return;
    isProcessing = true;

    try {
        // Find next report scheduled to be sent
        const report = await DoctorReport.findOne({
            whatsappStatus: 'pending',
            retryCount: { $lt: 3 },
            scheduledAt: { $lte: new Date() }
        }).sort({ scheduledAt: 1 });

        if (!report) {
            // No reports to process
            isProcessing = false;
            return;
        }

        console.log(`[REPORT WORKER] Processing report for ${report.patientName} (${report.patientMobile})`);
        
        report.whatsappStatus = 'processing';
        await report.save();

        const messageText = compileMessage(report);
        const result = await sendWhatsAppWithRateLimitCheck(report.patientMobile, messageText);

        if (result.success) {
            // Sent successfully
            report.whatsappStatus = 'sent';
            report.status = 'sent';
            report.sentAt = new Date();
            report.deliveredAt = new Date(); // Mock delivery status
            report.readAt = new Date(); // Mock read status
            await report.save();
            
            console.log(`[REPORT WORKER] Report successfully sent to ${report.patientMobile}`);
            
            isProcessing = false;
            // Add a random delay between 30 and 50 seconds to behave like a human
            const delayMs = Math.floor(Math.random() * (50 - 30 + 1) + 30) * 1000;
            console.log(`[REPORT WORKER] Waiting for ${delayMs / 1000}s before next send...`);
            setTimeout(processNextReport, delayMs);
        } else if (result.rateLimit) {
            // API rate limit encountered! Pause the worker.
            report.whatsappStatus = 'pending'; // Reset
            await report.save();
            
            console.log('[REPORT WORKER] ⚠️ WhatsApp Rate-Limit encountered! Pausing queue for 5 minutes...');
            isPaused = true;
            isProcessing = false;
            
            if (pauseTimeout) clearTimeout(pauseTimeout);
            pauseTimeout = setTimeout(() => {
                console.log('[REPORT WORKER] Cooldown finished. Resuming report queue worker...');
                isPaused = false;
                processNextReport();
            }, 5 * 60 * 1000); // 5 minutes cooldown
        } else {
            // General failure: schedule retry with backoff (1m, 5m, 15m)
            report.retryCount += 1;
            report.failureReason = result.error || 'Failed to send';

            if (report.retryCount >= 3) {
                report.whatsappStatus = 'failed';
                report.status = 'failed';
                console.error(`[REPORT WORKER] ❌ Report sending failed completely for ${report.patientMobile} after 3 attempts.`);
            } else {
                const backoffMinutes = [1, 5, 15][report.retryCount - 1] || 15;
                report.whatsappStatus = 'pending';
                report.scheduledAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
                console.log(`[REPORT WORKER] Scheduled retry #${report.retryCount} for ${report.patientMobile} in ${backoffMinutes}m`);
            }
            
            await report.save();
            isProcessing = false;
            
            // Process the next available report after a brief delay
            setTimeout(processNextReport, 5000);
        }
    } catch (error) {
        console.error('[REPORT WORKER ERROR]', error);
        isProcessing = false;
        setTimeout(processNextReport, 10000);
    }
};

const triggerWorker = () => {
    processNextReport();
};

module.exports = { triggerWorker };
