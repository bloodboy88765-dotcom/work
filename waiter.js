/* ==========================================
   AYUSH - WAITER PORTAL LOGIC
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const callsEl = document.getElementById('waiter-calls');
    const readyCountEl = document.getElementById('ready-count');

    // 1. Load Waiter Calls
    function loadWaiterCalls() {
        const calls = JSON.parse(localStorage.getItem('ms_waiter_calls') || '[]');
        readyCountEl.innerText = calls.length;
        callsEl.innerHTML = '';

        if (calls.length === 0) {
            callsEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--color-gray);">No orders ready yet. Keep an eye out!</div>';
            return;
        }

        calls.forEach((call, index) => {
            const card = document.createElement('div');
            card.className = 'ready-card depth-card';
            
            const time = new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            card.innerHTML = `
                <div class="table-badge-lg">TABLE ${call.tableId}</div>
                <div style="text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--color-gray);">Customer</div>
                    <div style="font-weight: 700; color: white; font-size: 1.1rem;">${call.customerName}</div>
                </div>
                <div class="items-summary">
                    <div style="font-weight: 600; color: var(--color-gold); margin-bottom: 5px;">Items to Deliver:</div>
                    ${call.items.map(item => `• ${item.name} (x${item.qty})`).join('<br>')}
                </div>
                <button class="action-btn" style="margin-top: 1rem; width: 100%; border-color: #28a745; background: #28a745; color: white;" onclick="markDelivered(${index})">
                    Mark as Delivered
                </button>
            `;
            callsEl.appendChild(card);
        });
    }

    // Global Functions
    window.markDelivered = (index) => {
        const calls = JSON.parse(localStorage.getItem('ms_waiter_calls') || '[]');
        const call = calls[index];
        
        calls.splice(index, 1);
        localStorage.setItem('ms_waiter_calls', JSON.stringify(calls));

        ayushNotify('Delivered', `Table ${call.tableId} served!`, 'success');
        loadWaiterCalls();
    };

    // Listen for kitchen calls
    window.addEventListener('storage', (e) => {
        if (e.key === 'ms_waiter_calls') {
            const oldVal = JSON.parse(e.oldValue || '[]');
            const newVal = JSON.parse(e.newValue || '[]');
            if (newVal.length > oldVal.length) {
                ayushPlaySound('alert');
                ayushNotify('Food Ready!', 'A new order is ready for pick-up.', 'success');
            }
            loadWaiterCalls();
        }
    });

    // Initial Load
    loadWaiterCalls();
});
