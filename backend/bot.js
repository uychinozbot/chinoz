const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

// Botni yaratish
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('Bot ishga tushdi...');

// Bot commands sozlash
bot.setMyCommands([
  { command: 'start', description: '🚀 Boshlash' },
  { command: 'add', description: '➕ E\'lon qo\'shish' },
  { command: 'help', description: '❓ Yordam' }
]).then(() => {
  console.log('Bot commands sozlandi');
}).catch(err => {
  console.error('Commands sozlashda xatolik:', err);
});

// Queue tizimi - xabarlar aralashib ketmasligi uchun
let postQueue = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || postQueue.length === 0) return;

  isProcessing = true;
  const { house, resolve } = postQueue.shift();

  try {
    await postToChannelInternal(house);
    resolve(true);
  } catch (error) {
    console.error('Queue processing error:', error);
    resolve(false);
  } finally {
    isProcessing = false;
    // Keyingi e'lonni qayta ishlash
    processQueue();
  }
}

// Kanalga e'lon yuborish funksiyasi (queue bilan)
async function postToChannel(house) {
  return new Promise((resolve) => {
    postQueue.push({ house, resolve });
    processQueue();
  });
}

// Kanalga e'lon yuborish funksiyasi (asosiy)
async function postToChannelInternal(house) {
  try {
    const titleCaption = `📢 *${house.title}*`;
    
    const detailsCaption = `📢 *${house.title}*

💰 Narx: ${house.currency === 'USD' ? '$' : ''}${house.price}${house.currency === 'UZS' ? " so'm" : ''}${house.city ? `\n📍 Shahar: ${house.city}` : ''}${house.location_type ? `\n🏢 Joylashuv: ${house.location_type === 'shahar-atrofi' ? 'Shaxar atrofi' : house.location_type}` : ''}${house.house_type ? `\n🏠 Turi: ${house.house_type === 'uy' ? 'Dom' : house.house_type}` : ''}${house.area ? `\n📐 Maydon: ${house.area} m²` : ''}${house.rooms ? `\n🏠 Xonalar: ${house.rooms}` : ''}${house.floor ? `\n🏢 Qavat ${house.floor} Umumiy Qavat ${house.total_floors}` : ''}${house.condition ? `\n🔧 Holati: ${house.condition}` : ''}${house.furniture ? `\n🪑 Uy jihozlar: ${house.furniture}` : ''}${house.utilities ? `\n⚡ Komunal: ${house.utilities}` : ''}${house.year_built ? `\n📅 Qurilgan yili: ${house.year_built}` : ''}${house.garage ? `\n🚗 Garaj: ${house.garage === 'bor' ? 'Bor' : 'Yo\'q'}` : ''}${house.description ? `\n📝 Tavsif: ${house.description}` : ''}${house.created_at ? `\n📅 Joylangan: ${new Date(house.created_at).toLocaleDateString('uz-UZ')} ${new Date(house.created_at).toLocaleTimeString('uz-UZ')}` : ''}${house.expiration_date ? `\n⏰ Tugash sanasi: ${new Date(house.expiration_date).toLocaleDateString('uz-UZ')}` : '\n⏰ Muddati: Cheksiz'}

📞 Telefon: [${house.phone}](tel:${house.phone})
👤 E'lon qo'shgan: @${house.telegram_username || house.username || 'Foydalanuvchi'}`;

    const images = house.images ? (typeof house.images === 'string' ? JSON.parse(house.images) : house.images) : [];

    if (images.length > 0) {
      // Send all images with title first (no clickable links)
      const allImages = images.map(url => ({
        type: 'photo',
        media: url,
        caption: url === images[0] ? titleCaption : undefined,
        parse_mode: url === images[0] ? 'Markdown' : undefined
      }));
      await bot.sendMediaGroup(config.CHANNEL_USERNAME, allImages);

      // Then send first image with details and clickable phone
      await bot.sendPhoto(config.CHANNEL_USERNAME, images[0], {
        caption: detailsCaption,
        parse_mode: 'Markdown'
      });
    } else if (house.image_url) {
      // Send single image if only one
      await bot.sendPhoto(config.CHANNEL_USERNAME, house.image_url, {
        caption: `${titleCaption}\n\n${detailsCaption}`,
        parse_mode: 'Markdown'
      });
    } else {
      // Send text only if no images
      await bot.sendMessage(config.CHANNEL_USERNAME, `${titleCaption}\n\n${detailsCaption}`, {
        parse_mode: 'Markdown'
      });
    }

    console.log('E\'lon kanalga yuborildi');
    return true;
  } catch (error) {
    console.error('Kanalga yuborish xatosi:', error);
    return false;
  }
}

module.exports = { bot, postToChannel };

// /start komandasi
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || 'Foydalanuvchi';
  
  const webAppUrl = `${config.WEB_APP_URL}?user_id=${userId}&username=${username}&page=add`;
  
  const welcomeMessage = `
📢 *E'lon berish Xush Kelibsiz!*

📌 *Xususiyatlar:*
• E'lon qo'shish va kanalga avtomatik yuborish
• Barcha e'lonlar kanalda ko'rinadi
  `;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 E\'lon Qo\'shish',
            web_app: { url: webAppUrl }
          }
        ],
        [
          {
            text: '📢 Kanalga Kirish',
            url: `https://t.me/${config.CHANNEL_USERNAME.replace('@', '')}`
          }
        ],
        [
          {
            text: '❓ Yordam',
            callback_data: 'help'
          }
        ]
      ]
    },
    parse_mode: 'Markdown'
  };
  
  bot.sendMessage(chatId, welcomeMessage, keyboard);
});

// /add komandasi - yangi e'lon qo'shish
bot.onText(/\/add/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || 'Foydalanuvchi';
  
  const webAppUrl = `${config.WEB_APP_URL}?user_id=${userId}&username=${username}&page=add`;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '➕ E\'lon Qo\'shish',
            web_app: { url: webAppUrl }
          }
        ]
      ]
    }
  };
  
  bot.sendMessage(chatId, '➕ Yangi e\'lon qo\'shish uchun tugmani bosing:', keyboard);
});

// /help komandasi - yordam
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpMessage = `
📢 *E'lon berish Bot - Yordam*

🚀 *Komandalar:*
/start - Botni boshlash
/add - Yangi e'lon qo'shish
/help - Yordam

📌 *Qanday ishlaydi:*
• E'lon qo'shish va kanalga avtomatik yuborish
• Barcha e'lonlar @uychinoz kanalida ko'rinadi
• Rasm, narx, va boshqa ma'lumotlarni kiritish

❓ *Savollar bo'lsa:*
Admin bilan bog'laning
  `;
  
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 Boshlash',
            callback_data: 'start'
          }
        ],
        [
          {
            text: '➕ E\'lon Qo\'shish',
            callback_data: 'add'
          }
        ]
      ]
    },
    parse_mode: 'Markdown'
  };
  
  bot.sendMessage(chatId, helpMessage, keyboard);
});

// Callback query handlers
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const username = query.from.username || 'Foydalanuvchi';
  const data = query.data;

  if (data === 'start') {
    const webAppUrl = `${config.WEB_APP_URL}?user_id=${userId}&username=${username}&page=add`;
    
    const welcomeMessage = `
📢 *E'lon berish Xush Kelibsiz!*

📌 *Xususiyatlar:*
• E'lon qo'shish va kanalga avtomatik yuborish
• Barcha e'lonlar kanalda ko'rinadi
    `;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 E\'lon Qo\'shish',
              web_app: { url: webAppUrl }
            }
          ],
          [
            {
              text: '📢 Kanalga Kirish',
              url: `https://t.me/${config.CHANNEL_USERNAME.replace('@', '')}`
            }
          ],
          [
            {
              text: '❓ Yordam',
              callback_data: 'help'
            }
          ]
        ]
      },
      parse_mode: 'Markdown'
    };
    
    bot.editMessageText(welcomeMessage, {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: keyboard.reply_markup,
      parse_mode: 'Markdown'
    });
  } else if (data === 'add') {
    const webAppUrl = `${config.WEB_APP_URL}?user_id=${userId}&username=${username}&page=add`;
    
    const welcomeMessage = `
📢 *E'lon berish Xush Kelibsiz!*

📌 *Xususiyatlar:*
• E'lon qo'shish va kanalga avtomatik yuborish
• Barcha e'lonlar kanalda ko'rinadi
    `;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '➕ E\'lon Qo\'shish',
              web_app: { url: webAppUrl }
            }
          ],
          [
            {
              text: '📢 Kanalga Kirish',
              url: `https://t.me/${config.CHANNEL_USERNAME.replace('@', '')}`
            }
          ]
        ]
      },
      parse_mode: 'Markdown'
    };
    
    bot.editMessageText(welcomeMessage, {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: keyboard.reply_markup,
      parse_mode: 'Markdown'
    });
  } else if (data === 'add') {
    const webAppUrl = `${config.WEB_APP_URL}?user_id=${userId}&username=${username}&page=add`;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '➕ E\'lon Qo\'shish',
              web_app: { url: webAppUrl }
            }
          ]
        ]
      }
    };
    
    bot.editMessageText('➕ Yangi e\'lon qo\'shish uchun tugmani bosing:', {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: keyboard.reply_markup
    });
  } else if (data === 'help') {
    const helpMessage = `
📢 *E'lon berish Bot - Yordam*

🚀 *Komandalar:*
/start - Botni boshlash
/add - Yangi e'lon qo'shish
/help - Yordam

📌 *Qanday ishlaydi:*
• E'lon qo'shish va kanalga avtomatik yuborish
• Barcha e'lonlar @uychinoz kanalida ko'rinadi
• Rasm, narx, va boshqa ma'lumotlarni kiritish

❓ *Savollar bo'lsa:*
Admin bilan bog'laning
    `;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Boshlash',
              callback_data: 'start'
            }
          ],
          [
            {
              text: '➕ E\'lon Qo\'shish',
              callback_data: 'add'
            }
          ]
        ]
      },
      parse_mode: 'Markdown'
    };
    
    bot.editMessageText(helpMessage, {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: keyboard.reply_markup,
      parse_mode: 'Markdown'
    });
  }
  
  bot.answerCallbackQuery(query.id);
});

// Xatolikni qayta ishlash
bot.on('polling_error', (error) => {
  console.error(`Polling xatosi: ${error.code} - ${error.message}`);
});
