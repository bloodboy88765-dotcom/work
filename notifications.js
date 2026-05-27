/* ==========================================
   AYUSH - CUSTOM NOTIFICATION SYSTEM
   ========================================== */

const AyushNotifications = {
    init() {
        if (!document.querySelector('.notification-container')) {
            const container = document.createElement('div');
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        if (!document.querySelector('.custom-modal-overlay')) {
            const modal = document.createElement('div');
            modal.className = 'custom-modal-overlay';
            modal.id = 'ayush-custom-modal';
            modal.innerHTML = `
                <div class="custom-modal">
                    <div id="ayush-modal-icon" class="modal-icon-lg"></div>
                    <h3 id="ayush-modal-title" class="modal-title-lg"></h3>
                    <p id="ayush-modal-text" class="modal-text-lg"></p>
                    <div class="modal-btns">
                        <button id="ayush-modal-cancel" class="modal-btn btn-cancel">Cancel</button>
                        <button id="ayush-modal-confirm" class="modal-btn btn-confirm">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    },

    show(title, message, type = 'info', duration = 4000) {
        this.init();
        const container = document.querySelector('.notification-container');
        const toast = document.createElement('div');
        toast.className = `notification ${type}`;
        
        const icons = {
            success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            warning: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
        };

        toast.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);
        
        // Force reflow
        toast.offsetHeight;
        toast.classList.add('show');

        const removeToast = () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        };

        toast.onclick = removeToast;
        if (duration > 0) setTimeout(removeToast, duration);
    },

    confirm(title, message, onConfirm, showCancel = true) {
        this.init();
        const overlay = document.getElementById('ayush-custom-modal');
        const titleEl = document.getElementById('ayush-modal-title');
        const textEl = document.getElementById('ayush-modal-text');
        const confirmBtn = document.getElementById('ayush-modal-confirm');
        const cancelBtn = document.getElementById('ayush-modal-cancel');
        const iconEl = document.getElementById('ayush-modal-icon');

        titleEl.innerText = title;
        textEl.innerText = message;
        cancelBtn.style.display = showCancel ? 'block' : 'none';
        
        iconEl.innerHTML = '<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';

        overlay.classList.add('show');

        const close = () => overlay.classList.remove('show');

        confirmBtn.onclick = () => {
            close();
            if (onConfirm) onConfirm();
        };

        cancelBtn.onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
    }
};

// Global shorthand
window.ayushNotify = (title, msg, type) => AyushNotifications.show(title, msg, type);
window.ayushConfirm = (title, msg, callback, showCancel) => AyushNotifications.confirm(title, msg, callback, showCancel);
window.ayushPlaySound = (type = 'notification') => {
    const sounds = {
        notification: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
        success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
        alert: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3'
    };
    const audio = new Audio(sounds[type] || sounds.notification);
    audio.play().catch(e => console.log("Sound play blocked by browser. Interaction required."));
};
