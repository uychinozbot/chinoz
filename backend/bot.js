const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

// Botni yaratish
const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('Bot ishga tushdi...');

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

💰 Narx: ${house.currency === 'USD' ? '$' : ''}${house.price}${house.currency === 'UZS' ? " so'm" : ''}${house.address ? `\n📍 Manzil: ${house.address}` : ''}${house.location_type ? `\n🏢 Joylashuv: ${house.location_type === 'shahar-atrofi' ? 'Shaxar atrofi' : house.location_type}` : ''}${house.house_type ? `\n🏠 Turi: ${house.house_type === 'uy' ? 'Dom' : house.house_type}` : ''}${house.area ? `\n📐 Maydon: ${house.area} m²` : ''}${house.rooms ? `\n🏠 Xonalar: ${house.rooms}` : ''}${house.floor ? `\n🏢 Qavat ${house.floor} Umumiy Qavat ${house.total_floors}` : ''}${house.condition ? `\n🔧 Holati: ${house.condition}` : ''}${house.furniture ? `\n🪑 Uy jihozlar: ${house.furniture}` : ''}${house.utilities ? `\n⚡ Komunal: ${house.utilities}` : ''}${house.year_built ? `\n📅 Qurilgan yili: ${house.year_built}` : ''}${house.garage ? `\n🚗 Garaj: ${house.garage === 'bor' ? 'Bor' : 'Yo\'q'}` : ''}${house.description ? `\n📝 Tavsif: ${house.description}` : ''}${house.created_at ? `\n📅 Joylangan: ${new Date(house.created_at).toLocaleDateString('uz-UZ')} ${new Date(house.created_at).toLocaleTimeString('uz-UZ')}` : ''}${house.expiration_date ? `\n⏰ Tugash sanasi: ${new Date(house.expiration_date).toLocaleDateString('uz-UZ')}` : '\n⏰ Muddati: Cheksiz'}

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

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🏠 Uy Chinoz',
            web_app: { url: webAppUrl }
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, '📢 E\'lon qo\'shish uchun Uy Chinoz tugmasini Bosing!', keyboard);
});

// Xatolikni qayta ishlash
bot.on('polling_error', (error) => {
  console.error(`Polling xatosi: ${error.code} - ${error.message}`);
});
