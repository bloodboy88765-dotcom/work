/* ==========================================
   AYUSH - KITCHEN PORTAL LOGIC
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const queueEl = document.getElementById('kitchen-queue');
    const stockGrid = document.getElementById('stock-grid');
    const activeCountEl = document.getElementById('active-count');
    const reqGrid = document.getElementById('kitchen-req-grid');

    // 1. Load Kitchen Queue
    function loadKitchenQueue() {
        const queue = JSON.parse(localStorage.getItem('ms_kitchen_queue') || '[]');
        activeCountEl.innerText = queue.length;
        queueEl.innerHTML = '';

        if (queue.length === 0) {
            queueEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--color-gray);">No orders in queue. Relax, Chef!</div>';
            return;
        }

        queue.forEach((order, index) => {
            const card = document.createElement('div');
            card.className = 'order-card depth-card';
            
            const time = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            card.innerHTML = `
                <div class="order-header">
                    <span class="table-badge">${order.tableId}</span>
                    <span style="font-size: 0.8rem; color: var(--color-gray);">${time}</span>
                </div>
                <div style="font-weight: 600; color: white;">${order.customerName}</div>
                <ul class="item-list">
                    ${order.items.map(item => `
                        <li class="item-row">
                            <span><span class="item-qty">${item.qty}</span> ${item.name}</span>
                        </li>
                    `).join('')}
                </ul>
                <button class="action-btn" style="margin-top: 1rem; width: 100%; border-color: #28a745; color: #28a745;" onclick="callWaiter(${index})">
                    Food Ready - Call Waiter
                </button>
            `;
            queueEl.appendChild(card);
        });
    }

    // 2. Load Stock Management
    function loadStockManagement() {
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        stockGrid.innerHTML = '';

        Object.keys(menuData).forEach(category => {
            menuData[category].forEach(item => {
                const stockItem = document.createElement('div');
                stockItem.className = 'stock-item';
                const isChecked = item.outOfStock ? '' : 'checked';
                
                stockItem.innerHTML = `
                    <div style="font-size: 0.9rem; font-weight: 500;">${item.name}</div>
                    <label class="toggle-switch">
                        <input type="checkbox" ${isChecked} onchange="toggleStock('${category}', '${item.name}', this.checked)">
                        <span class="slider"></span>
                    </label>
                `;
                stockGrid.appendChild(stockItem);
            });
        });
    }

    // 3. Load Kitchen Requirements
    function loadKitchenRequirements() {
        const reqData = JSON.parse(localStorage.getItem('ms_requirements') || '[]');
        reqGrid.innerHTML = '';

        if (reqData.length === 0) {
            reqGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--color-gray);">No active requirements.</div>';
            return;
        }

        reqData.forEach((req, index) => {
            const card = document.createElement('div');
            card.className = 'requirement-card depth-card';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3>${req.foodName}</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="action-btn" style="padding: 0.2rem 0.5rem; border-color: var(--color-gold); color: var(--color-gold); font-size: 0.7rem;" onclick="openEditKitchenReqModal(${index})">Edit</button>
                        <button class="action-btn" style="padding: 0.2rem 0.5rem; border-color: #dc3545; color: #dc3545; font-size: 0.7rem;" onclick="deleteKitchenRequirement(${index})">Remove</button>
                    </div>
                </div>
                <p style="margin: 1rem 0;">${req.details}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-gold);">₹${parseFloat(req.cost || 0).toFixed(2)}</span>
                    ${req.fromKitchen ? '<span style="font-size: 0.6rem; background: rgba(0, 123, 255, 0.2); color: #007bff; padding: 2px 6px; border-radius: 4px;">KITCHEN REQUEST</span>' : ''}
                </div>
            `;
            reqGrid.appendChild(card);
        });
    }

    // Global Functions
    window.toggleStock = (category, itemName, isAvailable) => {
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        const item = menuData[category].find(i => i.name === itemName);
        if (item) {
            item.outOfStock = !isAvailable;
            localStorage.setItem('ms_menu_data', JSON.stringify(menuData));
            ayushNotify(isAvailable ? 'Back in Stock' : 'Out of Stock', `${itemName} updated.`, isAvailable ? 'success' : 'warning');
        }
    };

    window.callWaiter = (index) => {
        const queue = JSON.parse(localStorage.getItem('ms_kitchen_queue') || '[]');
        const order = queue[index];
        
        // Add to Waiter Calls
        const waiterCalls = JSON.parse(localStorage.getItem('ms_waiter_calls') || '[]');
        waiterCalls.push({
            id: Date.now(),
            tableId: order.tableId,
            customerName: order.customerName,
            items: order.items,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('ms_waiter_calls', JSON.stringify(waiterCalls));

        // Remove from Kitchen Queue
        queue.splice(index, 1);
        localStorage.setItem('ms_kitchen_queue', JSON.stringify(queue));

        ayushNotify('Waiter Called', `Ready for Table ${order.tableId}`, 'success');
        loadKitchenQueue();
    };

    window.openKitchenReqModal = () => {
        document.getElementById('kreq-modal-title').innerText = 'New Requirement';
        document.getElementById('edit-kreq-index').value = '';
        document.getElementById('kreq-name').value = '';
        document.getElementById('kreq-details').value = '';
        document.getElementById('kreq-cost').value = '';
        document.getElementById('kitchen-req-modal').style.display = 'flex';
    };

    window.openEditKitchenReqModal = (index) => {
        const reqData = JSON.parse(localStorage.getItem('ms_requirements') || '[]');
        const req = reqData[index];
        
        document.getElementById('kreq-modal-title').innerText = 'Edit Requirement';
        document.getElementById('edit-kreq-index').value = index;
        document.getElementById('kreq-name').value = req.foodName;
        document.getElementById('kreq-details').value = req.details;
        document.getElementById('kreq-cost').value = req.cost || '';
        document.getElementById('kitchen-req-modal').style.display = 'flex';
    };

    window.closeKitchenReqModal = () => {
        document.getElementById('kitchen-req-modal').style.display = 'none';
    };

    window.saveKitchenRequirement = () => {
        const name = document.getElementById('kreq-name').value.trim();
        const details = document.getElementById('kreq-details').value.trim();
        const cost = document.getElementById('kreq-cost').value || 0;
        const editIndex = document.getElementById('edit-kreq-index').value;

        if (!name || !details) {
            ayushNotify('Incomplete', 'Please provide name and details.', 'warning');
            return;
        }

        const reqData = JSON.parse(localStorage.getItem('ms_requirements') || '[]');
        
        const requirement = {
            foodName: name,
            details: details,
            cost: parseFloat(cost),
            fromKitchen: true,
            updatedAt: new Date().toISOString()
        };

        if (editIndex !== '') {
            reqData[editIndex] = requirement;
            ayushNotify('Updated', 'Requirement updated successfully.', 'success');
        } else {
            reqData.push(requirement);
            ayushNotify('Request Sent', 'Management has been notified.', 'success');
        }

        localStorage.setItem('ms_requirements', JSON.stringify(reqData));
        closeKitchenReqModal();
        loadKitchenRequirements();
    };

    window.suggestKitchenReqAI = async () => {
        const name = document.getElementById('kreq-name').value.trim();
        if (!name) {
            ayushNotify('Missing Name', 'Please enter a food name first.', 'warning');
            return;
        }

        const btn = document.getElementById('kreq-ai-btn');
        const loading = document.getElementById('kreq-ai-loading');
        
        btn.disabled = true;
        btn.style.opacity = '0.5';
        loading.style.display = 'flex';

        try {
            // Simulated AI Response (In a real app, this would call an LLM API)
            await new Promise(r => setTimeout(r, 1500));
            
            const suggestions = {
                'Paneer Tikka': 'Paneer (2kg), Yogurt (500g), Ginger-Garlic Paste, Kashmiri Red Chili Powder, Kasuri Methi, Lemon, Skewers.',
                'Chicken Biryani': 'Basmati Rice (5kg), Chicken (5kg), Onions (2kg), Tomatoes, Mint, Coriander, Biryani Masala, Saffron, Ghee.',
                'Dosa': 'Rice (2kg), Urad Dal (1kg), Fenugreek Seeds, Salt, Oil, Potato for Masala, Mustard Seeds, Curry Leaves.',
                'Burger': 'Burger Buns (20pcs), Patties, Lettuce, Cheese Slices, Tomatoes, Onions, Mayonnaise, Ketchup.',
                'Pizza': 'Pizza Dough/Flour, Mozzarella Cheese (2kg), Pizza Sauce, Pepperoni, Bell Peppers, Mushrooms, Olives, Oregano.'
            };

            const result = suggestions[name] || `Standard ingredients for ${name}: Main protein/veg, base spices, garnish, and oil/butter.`;
            document.getElementById('kreq-details').value = result;
            ayushNotify('AI Suggestion', 'Ingredients analyzed and listed!', 'success');
        } catch (error) {
            ayushNotify('AI Error', 'Failed to get suggestions.', 'error');
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
            loading.style.display = 'none';
        }
    };

    window.deleteKitchenRequirement = (index) => {
        if (confirm('Are you sure you want to remove this requirement?')) {
            const reqData = JSON.parse(localStorage.getItem('ms_requirements') || '[]');
            reqData.splice(index, 1);
            localStorage.setItem('ms_requirements', JSON.stringify(reqData));
            loadKitchenRequirements();
        }
    };

    // Listen for new orders
    window.addEventListener('storage', (e) => {
        if (e.key === 'ms_kitchen_queue') {
            const oldVal = JSON.parse(e.oldValue || '[]');
            const newVal = JSON.parse(e.newValue || '[]');
            if (newVal.length > oldVal.length) {
                // Check if ayushPlaySound exists, otherwise fallback
                if (typeof ayushPlaySound === 'function') {
                    ayushPlaySound('notification');
                }
                ayushNotify('New Order!', 'New ticket received in kitchen.', 'info');
            }
            loadKitchenQueue();
        }
        if (e.key === 'ms_menu_data') {
            loadStockManagement();
        }
        if (e.key === 'ms_requirements') {
            loadKitchenRequirements();
        }
    });

    // Initial Load
    loadKitchenQueue();
    loadStockManagement();
    loadKitchenRequirements();
});
