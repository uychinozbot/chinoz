const express = require('express');
const router = express.Router();
const House = require('../models/House');
const { postToChannel } = require('../bot');

// Yangi uy qo'shish va kanalga yuborish
router.post('/', async (req, res) => {
  try {
    const { 
      title, description, price, currency, address, location_type, house_type, area,
      floor, total_floors, condition, furniture, utilities, year_built, garage,
      rooms, phone, image_url, images, additional_info, expiration_date, user_id, username, telegram_username 
    } = req.body;
    
    if (!title || !price || !currency || !phone || !user_id || (!image_url && !images)) {
      return res.status(400).json({ success: false, error: 'Majburiy maydonlarni to\'ldiring: Sarlavha, narx, valyuta, telefon raqam, rasm (kamida bitta)' });
    }
    
    let expDate = expiration_date;
    // expiration_date null bo'lishi mumkin (cheksiz uchun)
    
    const houseData = {
      title,
      description,
      price: parseInt(price),
      currency: currency || 'UZS',
      address,
      location_type: location_type || null,
      house_type: house_type || null,
      area: area ? parseFloat(area) : null,
      floor: floor ? parseInt(floor) : null,
      total_floors: total_floors ? parseInt(total_floors) : null,
      condition: condition || null,
      furniture: furniture || null,
      utilities: utilities || null,
      year_built: year_built ? parseInt(year_built) : null,
      garage: garage || null,
      rooms: rooms ? parseInt(rooms) : null,
      phone,
      image_url: image_url || null,
      images: images || null,
      additional_info: additional_info || null,
      expiration_date: expDate,
      user_id: parseInt(user_id),
      username: username || null,
      telegram_username: telegram_username || username || null
    };
    
    const newHouse = await House.create(houseData);
    await postToChannel(newHouse);
    
    res.json({ success: true, data: newHouse });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
