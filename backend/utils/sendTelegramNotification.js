const axios = require('axios');

/**
 * Sends a message to a specified Telegram chat using a bot.
 * @param {string} message The message content to send. Supports Markdown.
 */
const sendTelegramNotification = async (message) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram Bot Token or Chat ID is not configured in the .env file.');
    // Don't throw an error, just log it, as notifications are non-critical.
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    await axios.post(url, { chat_id: chatId, text: message, parse_mode: 'Markdown' });
    console.log('Telegram notification sent successfully.');
  } catch (error) {
    console.error('Error sending Telegram notification:', error.response ? error.response.data : error.message);
  }
};

module.exports = sendTelegramNotification;

