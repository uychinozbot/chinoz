// API base URL
const API_BASE = '/api/houses';

// URL parametrlari
const urlParams = getUrlParams();
const userId = urlParams.user_id || window.telegramUser?.id;
const username = urlParams.username || window.telegramUser?.username;

// DOM elementlari
const addHouseForm = document.getElementById('add-house-form');
const imageInput = document.getElementById('house-image');
const imagePreview = document.getElementById('image-preview');
const fileInputLabel = document.getElementById('file-input-label');
const submitBtn = document.getElementById('submit-btn');
const loadingMessage = document.getElementById('loading-message');
let uploadedImages = [];

// Initialize Telegram WebApp
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

// Image preview
if (imageInput) {
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 8) {
            alert('Maksimal 8 ta rasm yuklash mumkin');
            imageInput.value = '';
            return;
        }
        
        uploadedImages = [];
        imagePreview.innerHTML = '';
        
        if (files.length > 0) {
            imagePreview.style.display = 'flex';
            fileInputLabel.style.display = 'none';
            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedImages.push({
                        file: file,
                        preview: e.target.result,
                        url: null
                    });
                    
                    const imgContainer = document.createElement('div');
                    imgContainer.style.cssText = 'position: relative;';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '100px';
                    img.style.maxHeight = '100px';
                    img.style.borderRadius = '8px';
                    img.style.objectFit = 'cover';
                    img.style.border = '2px solid #ccc';
                    
                    // Delete button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '×';
                    deleteBtn.style.cssText = 'position: absolute; top: -8px; right: -8px; background: #ff4444; color: white; border: none; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center;';
                    deleteBtn.onclick = () => {
                        uploadedImages.splice(index, 1);
                        imgContainer.remove();
                        if (uploadedImages.length === 0) {
                            imagePreview.style.display = 'none';
                            fileInputLabel.style.display = 'block';
                        }
                    };
                    
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(deleteBtn);
                    imagePreview.appendChild(imgContainer);
                };
                reader.readAsDataURL(file);
            });
        } else {
            imagePreview.style.display = 'none';
            fileInputLabel.style.display = 'block';
            uploadedImages = [];
        }
    });
}

if (addHouseForm) {
    addHouseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Custom validation
        const requiredFields = addHouseForm.querySelectorAll('[data-required]');
        const missingFields = [];
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                missingFields.push(field.dataset.required);
            }
        });
        
        // Image validation - kamida bitta rasm shart
        if (uploadedImages.length === 0) {
            missingFields.push('Rasm yuklanishi shart (kamida bitta rasm)');
        }
        
        // Phone number validation
        const phone = document.getElementById('house-phone').value;
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^\+998\d{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
            missingFields.push('Telefon raqam noto\'g\'ri kiritildi. Format: +998 90 123 45 67');
        }
        
        // Price validation
        const price = document.getElementById('house-price').value;
        if (price && parseFloat(price) <= 0) {
            missingFields.push('Narx musbat son bo\'lishi kerak');
        }
        
        // Area validation
        const area = document.getElementById('house-area').value;
        if (area && parseFloat(area) <= 0) {
            missingFields.push('Maydon musbat son bo\'lishi kerak');
        }
        
        // Rooms validation
        const rooms = document.getElementById('house-rooms').value;
        if (rooms && parseInt(rooms) <= 0) {
            missingFields.push('Xonalar soni musbat son bo\'lishi kerak');
        }
        
        // Floor validation
        const floor = document.getElementById('house-floor').value;
        if (floor && parseInt(floor) <= 0) {
            missingFields.push('Qavat musbat son bo\'lishi kerak');
        }
        
        // Total floors validation
        const totalFloors = document.getElementById('house-total-floors').value;
        if (totalFloors && parseInt(totalFloors) <= 0) {
            missingFields.push('Umumiy qavatlar musbat son bo\'lishi kerak');
        }
        
        // Year validation
        const year = document.getElementById('house-year').value;
        if (year) {
            const currentYear = new Date().getFullYear();
            if (parseInt(year) < 1900 || parseInt(year) > currentYear + 1) {
                missingFields.push('Qurilgan yili noto\'g\'ri kiritildi. 1900 dan ' + (currentYear + 1) + ' gacha bo\'lishi kerak');
            }
        }
        
        if (missingFields.length > 0) {
            alert('❌ Quyidagi maydonlarni to\'ldiring:\n\n' + missingFields.map(f => '• ' + f).join('\n'));
            return;
        }
        
        if (!userId) {
            alert('❌ Foydalanuvchi ID topilmadi. Iltimos, Telegram orqali kirganingizni tekshiring.');
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Qo\'shilmoqda...';
        loadingMessage.style.display = 'block';
        
        // Upload images if selected
        const imageUrls = [];
        if (uploadedImages.length > 0) {
            // Upload all images in order
            for (let i = 0; i < uploadedImages.length; i++) {
                const formData = new FormData();
                formData.append('image', uploadedImages[i].file);
                
                try {
                    const uploadResponse = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const uploadData = await uploadResponse.json();
                    if (uploadData.success) {
                        imageUrls.push(uploadData.imageUrl);
                    } else {
                        alert('❌ Rasm yuklashda xatolik: ' + uploadData.error + '\n\nIltimos, rasm hajmi 5MB dan oshmasligiga ishonch hosil qiling.');
                        return;
                    }
                } catch (error) {
                    console.error('Rasm yuklash xatosi:', error);
                    alert('❌ Rasm yuklashda xatolik yuz berdi. Internet ulanishini tekshiring va qayta urinib ko\'ring.');
                    return;
                }
            }
        }
        
        // Calculate expiration date
        const expirationValue = document.getElementById('house-expiration').value;
        let expirationDateStr = null;
        
        if (expirationValue) {
            const expirationMonths = parseInt(expirationValue);
            const expirationDate = new Date();
            expirationDate.setMonth(expirationDate.getMonth() + expirationMonths);
            expirationDateStr = expirationDate.toISOString().split('T')[0];
        }
        
        // Get telegram username from window.telegramUser or URL params
        const telegramUsername = window.telegramUser?.username || username;
        
        const houseData = {
            title: document.getElementById('house-title').value,
            description: document.getElementById('house-description').value,
            price: document.getElementById('house-price').value,
            currency: document.getElementById('house-currency').value,
            address: document.getElementById('house-city').value,
            location_type: document.getElementById('house-location-type').value,
            house_type: document.getElementById('house-type').value,
            area: document.getElementById('house-area').value,
            floor: document.getElementById('house-floor').value,
            total_floors: document.getElementById('house-total-floors').value,
            condition: document.getElementById('house-condition').value,
            furniture: document.getElementById('house-furniture').value,
            utilities: document.getElementById('house-utilities').value,
            year_built: document.getElementById('house-year').value,
            garage: document.getElementById('house-garage').value,
            rooms: document.getElementById('house-rooms').value,
            phone: document.getElementById('house-phone').value,
            image_url: imageUrls.length > 0 ? imageUrls[0] : null,
            images: imageUrls.length > 0 ? imageUrls : null,
            expiration_date: expirationDateStr,
            user_id: userId,
            username: username,
            telegram_username: telegramUsername
        };
        
        try {
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(houseData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (window.haptic) window.haptic.notification('success');
                alert('✅ E\'lon muvaffaqiyatli qo\'shildi va kanalga yuborildi!\n\nE\'loningiz @uychinoz kanalida ko\'rinadi.');
                addHouseForm.reset();
                imagePreview.style.display = 'none';
                fileInputLabel.style.display = 'block';
                uploadedImages = [];
            } else {
                if (window.haptic) window.haptic.notification('error');
                alert('❌ Xatolik: ' + data.error + '\n\nIltimos, barcha majburiy maydonlarni to\'ldirganingizni tekshiring.');
            }
        } catch (error) {
            console.error('Xatolik:', error);
            if (window.haptic) window.haptic.notification('error');
            alert('❌ Server bilan bog\'lanishda xatolik yuz berdi.\n\nInternet ulanishini tekshiring va qayta urinib ko\'ring.');
        } finally {
            // Reset loading state
            submitBtn.disabled = false;
            submitBtn.textContent = 'E\'lon qo\'shish';
            loadingMessage.style.display = 'none';
        }
    });
}
