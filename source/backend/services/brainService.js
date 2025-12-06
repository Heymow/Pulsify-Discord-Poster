const axios = require('axios');
const logger = require('../utils/logger');
const settingsService = require('./settingsService');

// In a real scenario, this URL would be the production server.
// For now, it points to the localhost mock server.
const BRAIN_API_URL = process.env.BRAIN_API_URL || 'https://brain.pulsify.music/api/v1';

class BrainService {
    /**
     * Get instructions from the remote brain.
     * @param {string} discordId - The Discord User ID of the user.
     * @param {string} taskType - The type of task (e.g., 'post_message').
     * @param {object} data - Data required for the task (message, options, etc.).
     * @returns {Promise<Array>} - The list of steps to execute.
     */
    async getInstructions(discordId, taskType, data) {
        try {

            
            const response = await axios.post(
                `${BRAIN_API_URL}/instructions`, 
                {
                    discordId,
                    taskType,
                    data
                },
                {
                    headers: {
                        'x-api-key': settingsService.getBrainApiKey(),
                        'Content-Type': 'application/json'
                    }
                }
            );



            // Expecting { steps: [...], logId: "..." }
            return {
                steps: response.data.steps || [],
                logId: response.data.logId
            };
        } catch (error) {
            if (error.response) {
                // ... error handling ...
                if (error.response.status === 403) {
                    logger.error(`🧠 ACCESS DENIED: ${error.response.data.error}`);
                    throw new Error("FORBIDDEN_ACCESS: You are not authorized to use this application.");
                } else if (error.response.status === 401) {
                    logger.error(`🧠 AUTH FAILED: Invalid API Key.`);
                    throw new Error("AUTH_FAILED: Invalid Brain API Key.");
                }
                logger.error(`🧠 Brain Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                logger.error("🧠 Brain Unreachable: No response from server. Is the Brain Server running?");
            } else {
                logger.error(`🧠 Brain Request Failed: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Update the status of a log entry on the Brain.
     * @param {string} logId 
     * @param {string} status - 'success' or 'failed'
     * @param {string} [errorMessage] 
     */
    async updateLog(logId, status, errorMessage = null) {
        if (!logId) return;
        try {
            await axios.put(
                `${BRAIN_API_URL}/logs/${logId}`,
                {
                    status,
                    error: errorMessage
                },
                {
                    headers: {
                        'x-api-key': settingsService.getBrainApiKey(),
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (err) {
            // We don't want to break the app if logging fails, just log locally
            logger.warn(`Failed to update remote log ${logId}: ${err.message}`);
        }
    }
}

module.exports = new BrainService();
