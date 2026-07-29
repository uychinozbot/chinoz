// Telegram Web App integratsiyasi
const tg = window.Telegram.WebApp;

// Telegram Web Appni tayyorlash
function initTelegram() {
    // Theme colors
    tg.ready();
    tg.expand();
    
    // Back button
    if (tg.BackButton) {
        tg.BackButton.onClick(() => {
            window.history.back();
        });
    }
    
    // Main button
    if (tg.MainButton) {
        tg.MainButton.setText('Yuborish');
        tg.MainButton.onClick(() => {
            // Form submission
            const form = document.getElementById('add-house-form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        });
    }
    
    // Haptic feedback
    if (tg.HapticFeedback) {
        window.haptic = {
            impact: (style = 'medium') => tg.HapticFeedback.impactOccurred(style),
            notification: (type = 'success') => tg.HapticFeedback.notificationOccurred(type),
            selection: () => tg.HapticFeedback.selectionChanged()
        };
    }
    
    // User data
    const user = tg.initDataUnsafe?.user;
    if (user) {
        window.telegramUser = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            language_code: user.language_code
        };
    }
}

// URL parametrlarini olish
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        user_id: params.get('user_id'),
        username: params.get('username'),
        page: params.get('page')
    };
}

// Telegram WebAppni yopish
function closeTelegram() {
    tg.close();
}

// Telegram orqali xabar yuborish
function sendMessage(text) {
    tg.sendData(text);
}

// Telegram theme colors
function getThemeColors() {
    return {
        bg: tg.themeParams.bg_color || '#ffffff',
        text: tg.themeParams.text_color || '#000000',
        hint: tg.themeParams.hint_color || '#999999',
        link: tg.themeParams.link_color || '#0088cc',
        button: tg.themeParams.button_color || '#0088cc',
        buttonText: tg.themeParams.button_text_color || '#ffffff',
        secondaryBg: tg.themeParams.secondary_bg_color || '#f0f0f0'
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTelegram();
    
    // Apply theme colors
    const colors = getThemeColors();
    document.documentElement.style.setProperty('--tg-theme-bg-color', colors.bg);
    document.documentElement.style.setProperty('--tg-theme-text-color', colors.text);
    document.documentElement.style.setProperty('--tg-theme-hint-color', colors.hint);
    document.documentElement.style.setProperty('--tg-theme-link-color', colors.link);
    document.documentElement.style.setProperty('--tg-theme-button-color', colors.button);
    document.documentElement.style.setProperty('--tg-theme-button-text-color', colors.buttonText);
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', colors.secondaryBg);
});
