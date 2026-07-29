const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const config = require('./config');
const houseRoutes = require('./routes/houses');
require('./bot');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat rasm fayllari ruxsat etiladi'));
    }
  }
});

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/houses', houseRoutes);

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Rasm yuklanmadi' });
  }
  const imageUrl = `${config.WEB_APP_URL}/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(config.PORT, () => {
  console.log(`Server ${config.PORT} portida ishlamoqda`);
  console.log(`Web App URL: ${config.WEB_APP_URL}`);
});
