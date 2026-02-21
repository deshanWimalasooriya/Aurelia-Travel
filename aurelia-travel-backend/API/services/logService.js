const platformModel = require('../models/platformModel');

/**
 * Centralized Logger Function
 * @param {number} adminId - ID of the user performing the action
 * @param {string} action - Short code (e.g. 'UPDATE_SETTINGS', 'BAN_USER')
 * @param {string} module - Feature area (e.g. 'Finance', 'Users')
 * @param {string} target - What was affected (e.g. 'User: John', 'Global Config')
 * @param {string} details - Human readable description
 * @param {string} status - 'success' | 'error' | 'warning'
 */
exports.logAction = async (adminId, action, module, target, details, status = 'success') => {
    try {
        await platformModel.createLog({
            admin_id: adminId,
            action_type: action,
            module: module,
            target: target,
            details: details,
            status: status,
            created_at: new Date()
        });
    } catch (err) {
        // Log to console if DB logging fails, but don't crash the request
        console.error("⚠️ Activity Log Failed:", err.message);
    }
};