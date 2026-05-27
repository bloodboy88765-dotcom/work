/* ==========================================
   AYUSH - GLOBAL SETTINGS LOADER
   ========================================== */

(function() {
    function applySettings() {
        const settings = JSON.parse(localStorage.getItem('ms_website_settings') || '{}');
        
        // 1. Apply Theme Color
        if (settings.themeColor) {
            document.documentElement.style.setProperty('--text-gold', settings.themeColor);
            document.documentElement.style.setProperty('--color-gold', settings.themeColor);
            // Also update any glow colors if needed, but primary is enough for now
        }

        // 2. Apply Website Name & Logo
        const websiteName = settings.name || 'Ayush r';
        const websiteLogo = settings.logo || 'Ayush r';

        document.title = `${document.title.split('|')[0]} | ${websiteName}`;
        const logoSpans = document.querySelectorAll('.admin-logo span, .logo span, .navbar-brand span');
        logoSpans.forEach(span => {
            const currentText = span.innerText.trim();
            if (currentText === 'Ayush' || currentText === 'Ayush Restaurant') {
                span.innerText = websiteLogo;
            }
        });

        // 3. Portal Visibility Check
        const currentPath = window.location.pathname;
        if (settings.portals) {
            if (currentPath.includes('order.html') && settings.portals.order === false) {
                showMaintenance('Order Portal');
            } else if (currentPath.includes('kitchen.html') && settings.portals.kitchen === false) {
                showMaintenance('Kitchen Portal');
            } else if (currentPath.includes('waiter.html') && settings.portals.waiter === false) {
                showMaintenance('Waiter Portal');
            }
        }
    }

    function showMaintenance(portalName) {
        document.body.innerHTML = `
            <div style="height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #0a0a0a; color: white; font-family: sans-serif; text-align: center; padding: 2rem;">
                <h1 style="color: #D4AF37; font-size: 3rem; margin-bottom: 1rem;">Portal Offline</h1>
                <p style="font-size: 1.2rem; color: #a0a0a0; max-width: 600px;">
                    The <strong>${portalName}</strong> is currently disabled by the administrator. 
                    Please contact management for assistance.
                </p>
                <a href="home.html" style="margin-top: 2rem; color: #D4AF37; text-decoration: none; border: 1px solid #D4AF37; padding: 0.8rem 2rem; border-radius: 4px;">Return to Home</a>
            </div>
        `;
    }

    // Run immediately
    applySettings();

    // Also run on DOMContentLoaded to ensure elements are present
    document.addEventListener('DOMContentLoaded', applySettings);
})();
