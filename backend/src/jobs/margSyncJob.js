const cron = require('node-cron');
const margService = require('../services/marg.service');

/**
 * MARG ERP Sync Job
 * Runs every 10 minutes
 */
const initMargSyncJob = () => {
    console.log('[JOBS] Initializing MARG ERP Sync Job (Every 10 mins)');
    
    cron.schedule('*/10 * * * *', async () => {
        console.log('[JOBS] Running scheduled MARG Sync...');
        try {
            await margService.sync();
        } catch (error) {
            console.error('[JOBS] MARG Sync Job Failed:', error.message);
        }
    });
};

module.exports = { initMargSyncJob };
