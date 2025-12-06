const axios = require('axios');
const logger = require('../utils/logger');

// In a real scenario, this URL would be the production server.
// For now, it points to the localhost mock server.
const BRAIN_API_URL = process.env.BRAIN_API_URL || 'http://localhost:3000/api/v1';

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
            logger.info(`🧠 Requesting instructions from Brain for task: ${taskType}`);
            
            const response = await axios.post(`${BRAIN_API_URL}/instructions`, {
                discordId,
                taskType,
                data
            });

            return response.data.steps;
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                if (error.response.status === 403) {
                    logger.error(`🧠 ACCESS DENIED: ${error.response.data.error}`);
                    throw new Error("FORBIDDEN_ACCESS: You are not authorized to use this application.");
                }
                logger.error(`🧠 Brain Error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                // The request was made but no response was received
                logger.error("🧠 Brain Unreachable: No response from server. Is the Brain Server running?");
            } else {
                // Something happened in setting up the request that triggered an Error
                logger.error(`🧠 Brain Request Failed: ${error.message}`);
            }
            throw error;
        }
    }
}

module.exports = new BrainService();
