require('dotenv').config();

module.exports = {
  // Telegram Bot Token - BotFather dan oling
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
  
  // Web App URL - Railway production URL
  WEB_APP_URL: process.env.WEB_APP_URL || 'https://uychinoz.up.railway.app',
  
  // Server port
  PORT: process.env.PORT || 3000,
  
  // Channel username
  CHANNEL_USERNAME: '@uychinozbot',
  
  // Database
  DB_PATH: './database/houses.db'
};
