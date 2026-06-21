const cron = require('node-cron');
const DoctorReport = require('../models/DoctorReport');
const { cloudinaryReports } = require('../config/cloudinaryReports');
const fs = require('fs');
const path = require('path');

// Helper to write audit logs to file
const logCleanupAudit = (message) => {
    try {
        const logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const logFile = path.join(logDir, 'report_cleanup.log');
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${message}\n`;
        fs.appendFileSync(logFile, logLine, 'utf8');
        console.log(`[CLEANUP JOB] ${message}`);
    } catch (error) {
        console.error('Failed to write cleanup log:', error);
    }
};

/**
 * Report Cleanup Job
 * Runs daily at midnight ('0 0 * * *')
 */
const initReportCleanupJob = () => {
    logCleanupAudit('Initializing Doctor Report Auto Cleanup Job (Runs daily at midnight)');

    cron.schedule('0 0 * * *', async () => {
        logCleanupAudit('Scheduled Doctor Report Auto-Cleanup started.');
        try {
            const now = new Date();
            // Find reports older than 90 days
            const expiredReports = await DoctorReport.find({ expiresAt: { $lte: now } });

            if (expiredReports.length === 0) {
                logCleanupAudit('No expired reports found for cleanup.');
                return;
            }

            logCleanupAudit(`Found ${expiredReports.length} expired reports to clean up.`);

            let dbDeletedCount = 0;
            let cloudinaryDeletedCount = 0;
            let cloudinaryFailedCount = 0;

            for (const report of expiredReports) {
                // 1. Delete from Cloudinary if there is a file stored
                if (report.cloudinaryPublicId) {
                    try {
                        const result = await cloudinaryReports.uploader.destroy(report.cloudinaryPublicId, {
                            resource_type: 'raw'
                        });
                        if (result.result === 'ok' || result.result === 'not found') {
                            cloudinaryDeletedCount++;
                        } else {
                            cloudinaryFailedCount++;
                            logCleanupAudit(`Cloudinary deletion returned status for public_id ${report.cloudinaryPublicId}: ${result.result}`);
                        }
                    } catch (cloudinaryError) {
                        cloudinaryFailedCount++;
                        logCleanupAudit(`Failed to delete file from Cloudinary for report ID ${report._id}: ${cloudinaryError.message}`);
                    }
                }

                // 2. Delete from MongoDB
                await DoctorReport.findByIdAndDelete(report._id);
                dbDeletedCount++;
            }

            logCleanupAudit(`Cleanup audit summary: Expired reports found = ${expiredReports.length}, MongoDB records deleted = ${dbDeletedCount}, Cloudinary files destroyed = ${cloudinaryDeletedCount}, Cloudinary destroy failures = ${cloudinaryFailedCount}`);
        } catch (error) {
            logCleanupAudit(`CRITICAL: Doctor Report Auto-Cleanup Job Failed: ${error.message}`);
        }
    });
};

module.exports = { initReportCleanupJob };
