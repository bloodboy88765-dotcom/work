/* ==========================================
   MS BAR AND LOUNGE - CUSTOMER ORDERING LOGIC
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const tableSelect = document.getElementById('order-table-no');
    const menuGrid = document.getElementById('order-menu-grid');
    const categoryTabs = document.getElementById('category-tabs');
    const cartBar = document.getElementById('cart-bar');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    const orderSearch = document.getElementById('order-search');

    let cart = {}; // { itemName: { price: float, qty: int } }

    // 1. Populate Tables
    function loadTables() {
        const tables = JSON.parse(localStorage.getItem('ms_tables') || '[]');
        if (tables.length === 0) {
            // Default 10 tables if none exist
            for (let i = 1; i <= 10; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = `Table ${i}`;
                opt.style.background = "#1a1a1a";
                tableSelect.appendChild(opt);
            }
        } else {
            tables.forEach(table => {
                const opt = document.createElement('option');
                opt.value = table.id;
                opt.textContent = `Table ${table.id}`;
                opt.style.background = "#1a1a1a";
                // Disable table if in maintenance
                if (table.status === 'Maintenance') {
                    opt.disabled = true;
                    opt.textContent += ' (Maintenance)';
                }
                tableSelect.appendChild(opt);
            });
        }
    }

    // Auto-fill Name when Table is Selected
    tableSelect.addEventListener('change', (e) => {
        const tableId = e.target.value;
        const activeOrders = JSON.parse(localStorage.getItem('ms_active_orders') || '{}');
        const tableKey = `Table ${tableId}`;
        const nameInput = document.getElementById('cust-name');

        if (activeOrders[tableKey] && activeOrders[tableKey].customerName) {
            nameInput.value = activeOrders[tableKey].customerName;
            nameInput.style.borderColor = 'rgba(40, 167, 69, 0.5)'; // Green border to show auto-filled
        } else {
            nameInput.value = '';
            nameInput.style.borderColor = 'rgba(212, 175, 55, 0.3)'; // Reset border
        }
    });

    // 2. Render Menu
    function renderMenu(filter = 'all', searchQuery = '') {
        menuGrid.innerHTML = '';
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        const query = searchQuery.toLowerCase().trim();
        
        let hasResults = false;

        Object.keys(menuData).forEach(cat => {
            if (filter !== 'all' && filter !== cat) return;

            menuData[cat].forEach(item => {
                // Apply Search Filter
                if (query !== '' && !item.name.toLowerCase().includes(query)) return;
                if (item.outOfStock) return; // Skip out of stock items

                hasResults = true;
                const card = document.createElement('div');
                card.className = 'order-item-card depth-card';
                
                const currentQty = cart[item.name] ? cart[item.name].qty : 0;

                card.innerHTML = `
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <p>₹${item.price}</p>
                    </div>
                    <div class="add-controls">
                        ${currentQty > 0 ? `
                            <button class="qty-btn" onclick="updateCart('${item.name.replace(/'/g, "\\'")}', ${item.price}, -1)">-</button>
                            <span class="qty-val" style="color: white;">${currentQty}</span>
                            <button class="qty-btn" onclick="updateCart('${item.name.replace(/'/g, "\\'")}', ${item.price}, 1)">+</button>
                        ` : `
                            <button class="place-order-btn" style="padding: 0.6rem 1.4rem; font-size: 0.85rem;" onclick="updateCart('${item.name.replace(/'/g, "\\'")}', ${item.price}, 1)">ADD</button>
                        `}
                    </div>
                `;
                menuGrid.appendChild(card);
            });
        });

        if (!hasResults) {
            menuGrid.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #b0b0b0; grid-column: 1/-1;">
                    <p style="font-size: 1.1rem;">No items found matching "${searchQuery}"</p>
                    <button class="action-btn" style="margin-top: 1rem; border-color: var(--text-gold); color: var(--text-gold);" onclick="clearSearch()">Clear Search</button>
                </div>
            `;
        }
    }

    window.clearSearch = () => {
        orderSearch.value = '';
        const activeCat = document.querySelector('.category-tab.active').getAttribute('data-cat');
        renderMenu(activeCat, '');
    };

    // 3. Category Tabs
    function loadCategories() {
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        Object.keys(menuData).forEach(cat => {
            const tab = document.createElement('div');
            tab.className = 'category-tab';
            tab.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            tab.setAttribute('data-cat', cat);
            tab.onclick = () => {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderMenu(cat, orderSearch.value);
            };
            categoryTabs.appendChild(tab);
        });
    }

    // Search Input Event
    if (orderSearch) {
        orderSearch.addEventListener('input', (e) => {
            const activeFilter = document.querySelector('.category-tab.active').getAttribute('data-cat');
            renderMenu(activeFilter, e.target.value);
        });
    }

    // 4. Cart Management
    window.updateCart = (name, price, change) => {
        if (!cart[name]) {
            cart[name] = { price: parseFloat(price), qty: 0 };
        }
        
        cart[name].qty += change;
        
        if (cart[name].qty <= 0) {
            delete cart[name];
        }

        updateUI();
    };

    function updateUI() {
        let totalItems = 0;
        let subtotal = 0;

        Object.keys(cart).forEach(name => {
            totalItems += cart[name].qty;
            subtotal += cart[name].qty * cart[name].price;
        });

        if (totalItems > 0) {
            const gst = subtotal * 0.05;
            const total = subtotal + gst;

            cartBar.style.display = 'block';
            cartCountEl.textContent = `${totalItems} Item${totalItems > 1 ? 's' : ''}`;
            
            // New elements
            const subtotalEl = document.getElementById('cart-subtotal');
            const gstEl = document.getElementById('cart-gst');
            if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
            if (gstEl) gstEl.textContent = `₹${gst.toFixed(2)}`;
            
            cartTotalEl.textContent = `Total: ₹${total.toFixed(2)}`;
        } else {
            cartBar.style.display = 'none';
        }

        const activeCat = document.querySelector('.category-tab.active').getAttribute('data-cat');
        renderMenu(activeCat, orderSearch.value);
    }

    // 5. Place Order
    window.placeOrder = () => {
        const tableId = tableSelect.value;
        const custName = document.getElementById('cust-name').value.trim();

        if (!custName) {
            ayushNotify('Name Required', 'Please enter your name before placing an order!', 'warning');
            document.getElementById('cust-name').focus();
            return;
        }

        if (!tableId) {
            ayushNotify('Table Required', 'Please select your table number before placing order!', 'warning');
            tableSelect.focus();
            return;
        }

        const orderItems = Object.keys(cart).map(name => ({
            name: name,
            qty: cart[name].qty,
            price: cart[name].price
        }));

        const newRequest = {
            id: Date.now(),
            customerName: custName,
            tableId: tableId,
            items: orderItems,
            status: 'New',
            type: 'Order',
            createdAt: new Date().toISOString()
        };

        const existingRequests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
        existingRequests.push(newRequest);
        localStorage.setItem('ms_customer_requests', JSON.stringify(existingRequests));

        ayushNotify('Order Placed', 'Your order has been sent to the kitchen!', 'success');
        
        // Reset Cart
        cart = {};
        updateUI();
    };

    // 6. Request Bill
    window.requestBill = () => {
        const tableId = tableSelect.value;
        const custName = document.getElementById('cust-name').value.trim();

        if (!custName) {
            ayushNotify('Name Required', 'Please enter your name to request a bill!', 'warning');
            document.getElementById('cust-name').focus();
            return;
        }

        if (!tableId) {
            ayushNotify('Table Required', 'Please select your table number to request your bill!', 'warning');
            tableSelect.focus();
            return;
        }

        ayushConfirm('Request Bill', `Are you sure you want to request the bill for Table ${tableId}?`, () => {
            const newRequest = {
                id: Date.now(),
                customerName: custName,
                tableId: tableId,
                status: 'New',
                type: 'Bill',
                createdAt: new Date().toISOString()
            };

            const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
            requests.push(newRequest);
            localStorage.setItem('ms_customer_requests', JSON.stringify(requests));
            ayushNotify('Request Sent', 'The waiter will bring your bill shortly.', 'info');
        });
    };

    // Initial Load
    loadTables();
    loadCategories();
    renderMenu('all');

    // 7. Auto Refresh (Every 5 seconds)
    setInterval(() => {
        refreshOrderPortal();
    }, 5000);

    // Real-time Updates via Storage Event (Cross-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === 'ms_menu_data' || e.key === 'ms_tables') {
            refreshOrderPortal();
        }
    });

    function refreshOrderPortal() {
        const activeTab = document.querySelector('.category-tab.active');
        const filter = activeTab ? activeTab.getAttribute('data-cat') : 'all';
        const searchQuery = orderSearch.value;
        
        // Refresh menu and tables to get latest data from admin
        renderMenu(filter, searchQuery);
        
        // We don't want to reset the table select if user already picked one
        const currentTable = tableSelect.value;
        tableSelect.innerHTML = '<option value="" disabled>Choose Table Number...</option>';
        loadTables();
        tableSelect.value = currentTable;
    }
});
