/* ==========================================
   AYUSH - ADMIN DASHBOARD LOGIC
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const bookingsList = document.getElementById('bookings-list');
    const emptyState = document.getElementById('empty-state');
    const totalBookingsEl = document.getElementById('total-bookings');
    const todayBookingsEl = document.getElementById('today-bookings');
    const pendingBookingsEl = document.getElementById('pending-bookings');

    // Sidebar Toggle for Mobile
    window.toggleSidebar = () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    };

    // Sidebar Toggle for Desktop
    window.toggleDesktopSidebar = () => {
        document.body.classList.toggle('sidebar-collapsed');
    };

    // Tab Switching Logic
    window.switchTab = (tab) => {
        // Close sidebar on mobile after switching
        if (window.innerWidth <= 992) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        }
        
        const slider = document.getElementById('tabs-slider');
        const title = document.getElementById('current-tab-title');
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => item.classList.remove('active'));

        // Tab index mapping
        const tabIndices = {
            'billing': 0,
            'tables': 1,
            'requests': 2,
            'settings': 3,
            'management': 4,
            'accounts': 5,
            'website-settings': 6
        };

        const index = tabIndices[tab];
        if (index !== undefined) {
            slider.style.transform = `translateX(-${(index * 100) / 7}%)`;
            
            // Update Active Nav Item
            const navIndex = index; // Matches sidebar order
            navItems[navIndex].classList.add('active');

            // Update Header Title
            const titles = {
                'billing': 'Billing & Bookings',
                'tables': 'Table Status',
                'requests': 'Customer Orders',
                'settings': 'Menu Settings',
                'management': 'Management',
                'accounts': 'Accounts',
                'website-settings': 'Website Settings'
            };
            title.innerText = titles[tab];

            // Trigger tab-specific loads
            if (tab === 'billing') loadBookings();
            else if (tab === 'tables') loadTableStatus();
            else if (tab === 'requests') loadCustomerRequests();
            else if (tab === 'settings') loadMenuManagement();
            else if (tab === 'management') {
                loadManagementData();
                switchManagementSubTab('total-sales');
            }
            else if (tab === 'accounts') {
                loadAccountsData();
                switchAccountsSubTab('online');
            }
            else if (tab === 'website-settings') loadWebsiteSettings();
        }
    };

    // Website Settings Logic
    window.loadWebsiteSettings = () => {
        const settings = JSON.parse(localStorage.getItem('ms_website_settings') || '{}');
        
        document.getElementById('set-website-name').value = settings.name || 'Ayush r';
        document.getElementById('set-website-logo').value = settings.logo || 'Ayush r';
        document.getElementById('set-theme-color').value = settings.themeColor || '#D4AF37';
        
        document.getElementById('set-portal-order').checked = settings.portals?.order !== false;
        document.getElementById('set-portal-kitchen').checked = settings.portals?.kitchen !== false;
        document.getElementById('set-portal-waiter').checked = settings.portals?.waiter !== false;
        
        // Sound Setting
        if (document.getElementById('set-sound-enabled')) {
            document.getElementById('set-sound-enabled').checked = settings.soundEnabled !== false;
        }
    };

    window.saveWebsiteSettings = () => {
        const name = document.getElementById('set-website-name').value.trim();
        const logo = document.getElementById('set-website-logo').value.trim();
        const themeColor = document.getElementById('set-theme-color').value;
        const newPass = document.getElementById('set-new-password').value;
        const confirmPass = document.getElementById('set-confirm-password').value;
        
        const orderPortal = document.getElementById('set-portal-order').checked;
        const kitchenPortal = document.getElementById('set-portal-kitchen').checked;
        const waiterPortal = document.getElementById('set-portal-waiter').checked;
        const soundEnabled = document.getElementById('set-sound-enabled')?.checked ?? true;

        // Password change logic
        if (newPass) {
            if (newPass !== confirmPass) {
                ayushNotify('Error', 'Passwords do not match!', 'error');
                return;
            }
            if (newPass.length < 4) {
                ayushNotify('Error', 'Password must be at least 4 characters!', 'error');
                return;
            }
            localStorage.setItem('ms_admin_password', newPass);
            document.getElementById('set-new-password').value = '';
            document.getElementById('set-confirm-password').value = '';
        }

        const settings = {
            name,
            logo,
            themeColor,
            portals: {
                order: orderPortal,
                kitchen: kitchenPortal,
                waiter: waiterPortal
            },
            soundEnabled,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem('ms_website_settings', JSON.stringify(settings));
        
        // Apply theme color immediately to admin panel too
        document.documentElement.style.setProperty('--text-gold', themeColor);
        
        ayushNotify('Success', 'Website settings updated successfully!', 'success');
        
        // Optionally reload to apply all changes
        setTimeout(() => location.reload(), 1500);
    };

    // Customer Requests Logic
    function loadCustomerRequests() {
        const list = document.getElementById('customer-requests-list');
        const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
        const badge = document.getElementById('request-count-badge');
        
        badge.innerText = `${requests.filter(r => r.status === 'New').length} New`;
        list.innerHTML = '';

        if (requests.length === 0) {
            list.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No active customer requests.</td></tr>';
            return;
        }

        requests.forEach((req, index) => {
            const isBill = req.type === 'Bill';
            const itemsText = isBill ? '<span style="color: #ffc107; font-weight: bold;">BILL REQUESTED</span>' : req.items.map(i => `${i.name} (x${i.qty})`).join(', ');
            const total = isBill ? '-' : `₹${req.items.reduce((sum, i) => sum + (i.price * i.qty), 0).toFixed(2)}`;
            const time = new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const row = document.createElement('tr');
            if (isBill) {
                row.style.background = 'rgba(255, 193, 7, 0.05)';
            }

            row.innerHTML = `
                <td>
                    <b style="color: var(--text-gold);">Table ${req.tableId}</b>
                    <div style="font-size: 0.75rem; color: #a0a0a0;">${req.customerName || 'Guest'}</div>
                </td>
                <td style="max-width: 300px; font-size: 0.85rem;">${itemsText}</td>
                <td>${total}</td>
                <td style="color: #d0d0d0;">${time}</td>
                <td>
                    ${isBill ? `
                        <button class="action-btn" style="border-color: #ffc107; color: #ffc107;" onclick="acceptBillRequest(${index})">Open Bill</button>
                        <button class="action-btn delete-btn" onclick="rejectCustomerOrder(${index})">Dismiss</button>
                    ` : `
                        <button class="action-btn" style="border-color: #28a745; color: #28a745;" onclick="acceptCustomerOrder(${index})">Accept & Add to Bill</button>
                        <button class="action-btn delete-btn" onclick="rejectCustomerOrder(${index})">Reject</button>
                    `}
                </td>
            `;
            list.appendChild(row);
        });
    }

    window.acceptBillRequest = (index) => {
        const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
        const req = requests[index];
        
        // Remove from requests
        requests.splice(index, 1);
        localStorage.setItem('ms_customer_requests', JSON.stringify(requests));
        
        // Open the bill for that table
        openTableBill(req.tableId);
        loadCustomerRequests();
    };

    window.acceptCustomerOrder = (index) => {
        const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
        const order = requests[index];
        const tableKey = `Table ${order.tableId}`;

        // 1. Save to Active Orders (Billing System)
        const activeOrders = JSON.parse(localStorage.getItem('ms_active_orders') || '{}');
        
        if (!activeOrders[tableKey]) {
            activeOrders[tableKey] = { items: [], customerName: order.customerName || 'Customer', customerPhone: '' };
        } else {
            // Update name if it was just 'Customer' before
            if (activeOrders[tableKey].customerName === 'Customer') {
                activeOrders[tableKey].customerName = order.customerName;
            }
        }
        
        // Merge items (if table already has an order)
        order.items.forEach(newItem => {
            const existing = activeOrders[tableKey].items.find(i => i.name === newItem.name);
            if (existing) {
                existing.qty += newItem.qty;
            } else {
                activeOrders[tableKey].items.push(newItem);
            }
        });

        localStorage.setItem('ms_active_orders', JSON.stringify(activeOrders));

        // 2. Update Table Status to Full
        updateTableStatus(parseInt(order.tableId), 'Full');

        // 3. Send to Kitchen Queue
        const kitchenQueue = JSON.parse(localStorage.getItem('ms_kitchen_queue') || '[]');
        kitchenQueue.push({
            id: order.id,
            tableId: order.tableId,
            customerName: order.customerName,
            items: order.items,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('ms_kitchen_queue', JSON.stringify(kitchenQueue));

        // 4. Remove from requests
        requests.splice(index, 1);
        localStorage.setItem('ms_customer_requests', JSON.stringify(requests));
        
        ayushNotify('Order Accepted', 'Sent to kitchen successfully!', 'success');
        loadCustomerRequests();
    };

    window.rejectCustomerOrder = (index) => {
        ayushConfirm('Reject Request', 'Are you sure you want to reject this request?', () => {
            const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
            requests.splice(index, 1);
            localStorage.setItem('ms_customer_requests', JSON.stringify(requests));
            loadCustomerRequests();
            ayushNotify('Request Rejected', 'The request has been dismissed.', 'info');
        });
    };

    // Table Status Logic
    function loadTableStatus() {
        const grid = document.getElementById('table-status-grid');
        const tables = JSON.parse(localStorage.getItem('ms_tables') || '[]');
        
        // Initialize if empty
        if (tables.length === 0) {
            for (let i = 1; i <= 10; i++) {
                tables.push({ id: i, status: 'Empty' });
            }
            localStorage.setItem('ms_tables', JSON.stringify(tables));
        }

        grid.innerHTML = '';
        tables.forEach(table => {
            const card = document.createElement('div');
            card.className = 'table-card depth-card';
            card.innerHTML = `
                <span class="table-number">Table ${table.id}</span>
                <span class="table-status status-${table.status.toLowerCase()}">${table.status}</span>
                <div class="table-actions">
                    <button class="action-btn" style="font-size: 0.7rem; border-color: #28a745; color: #28a745;" onclick="openTableBill(${table.id})">Generate Bill</button>
                    <div style="display: flex; gap: 4px; margin-top: 5px;">
                        <button class="action-btn" style="font-size: 0.6rem; flex: 1;" onclick="updateTableStatus(${table.id}, 'Empty')">Empty</button>
                        <button class="action-btn" style="font-size: 0.6rem; flex: 1;" onclick="updateTableStatus(${table.id}, 'Full')">Full</button>
                        <button class="action-btn" style="font-size: 0.6rem; flex: 1;" onclick="updateTableStatus(${table.id}, 'Maintenance')">Maint.</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    window.updateTableStatus = (id, newStatus) => {
        const tables = JSON.parse(localStorage.getItem('ms_tables') || '[]');
        const index = tables.findIndex(t => t.id === id);
        if (index !== -1) {
            tables[index].status = newStatus;
            localStorage.setItem('ms_tables', JSON.stringify(tables));
            loadTableStatus();
        }
    };

    window.addNewTable = () => {
        const tables = JSON.parse(localStorage.getItem('ms_tables') || '[]');
        const nextId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
        tables.push({ id: nextId, status: 'Empty' });
        localStorage.setItem('ms_tables', JSON.stringify(tables));
        loadTableStatus();
    };

    // Menu Management Logic
    function loadMenuManagement() {
        const menuList = document.getElementById('menu-items-list');
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        
        menuList.innerHTML = '';
        
        Object.keys(menuData).forEach(category => {
            menuData[category].forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><span style="text-transform: capitalize; color: #d0d0d0;">${category}</span></td>
                    <td style="color: white; font-weight: 500;">${item.name}</td>
                    <td style="color: var(--text-gold); font-weight: 600;">₹${item.price}</td>
                    <td>
                        <button class="action-btn" onclick="openEditFoodModal('${category}', ${index})">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteFoodItem('${category}', ${index})">Delete</button>
                    </td>
                `;
                menuList.appendChild(row);
            });
        });
    }

    window.openAddFoodModal = () => {
        document.getElementById('food-modal-title').innerText = 'Add New Food';
        document.getElementById('food-name').value = '';
        document.getElementById('food-price').value = '';
        document.getElementById('edit-food-index').value = '';
        document.getElementById('food-modal').style.display = 'flex';
    };

    window.openEditFoodModal = (category, index) => {
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        const item = menuData[category][index];
        
        document.getElementById('food-modal-title').innerText = 'Edit Food Item';
        document.getElementById('food-category').value = category;
        document.getElementById('food-name').value = item.name;
        document.getElementById('food-price').value = item.price;
        document.getElementById('edit-food-index').value = index;
        document.getElementById('edit-food-category').value = category;
        document.getElementById('food-modal').style.display = 'flex';
    };

    window.closeFoodModal = () => {
        document.getElementById('food-modal').style.display = 'none';
    };

    window.saveFoodItem = () => {
        const category = document.getElementById('food-category').value;
        const name = document.getElementById('food-name').value;
        const price = document.getElementById('food-price').value;
        const editIndex = document.getElementById('edit-food-index').value;
        const oldCategory = document.getElementById('edit-food-category').value;

        if (!name || !price) {
            ayushNotify('Missing Fields', 'Please fill all fields', 'warning');
            return;
        }

        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));

        if (editIndex !== '') {
            // Edit existing
            if (oldCategory !== category) {
                // Category changed, remove from old, add to new
                menuData[oldCategory].splice(parseInt(editIndex), 1);
                menuData[category].push({ name, price });
            } else {
                menuData[category][parseInt(editIndex)] = { name, price };
            }
        } else {
            // Add new
            menuData[category].push({ name, price });
        }

        localStorage.setItem('ms_menu_data', JSON.stringify(menuData));
        closeFoodModal();
        loadMenuManagement();
        
        // Update index.html dynamically if it's open (via storage event)
        window.dispatchEvent(new Event('storage'));
    };

    window.deleteFoodItem = (category, index) => {
        ayushConfirm('Delete Item', 'Are you sure you want to delete this food item?', () => {
            const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
            menuData[category].splice(index, 1);
            localStorage.setItem('ms_menu_data', JSON.stringify(menuData));
            loadMenuManagement();
            ayushNotify('Deleted', 'Food item has been removed from the menu.', 'success');
        });
    };

    function loadBookings() {
        const bookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
        
        if (bookings.length === 0) {
            bookingsList.innerHTML = '';
            emptyState.style.display = 'block';
            updateStats([]);
            return;
        }

        emptyState.style.display = 'none';
        bookingsList.innerHTML = '';

        bookings.forEach(booking => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600; color: white;">${booking.formattedDate}</div>
                    <div style="font-size: 0.8rem; color: #d0d0d0;">${booking.time}</div>
                </td>
                <td>
                    <div style="font-weight: 600; color: white;">${booking.name}</div>
                    <div style="font-size: 0.8rem; color: #d0d0d0;">${booking.phone}</div>
                </td>
                <td>${booking.guests} Diners</td>
                <td>
                    <div style="font-size: 0.85rem;">${booking.seating}</div>
                    ${booking.notes ? `<div style="font-size: 0.75rem; color: #D4AF37; margin-top: 4px;">Note: ${booking.notes}</div>` : ''}
                </td>
                <td>
                    <span class="status-badge status-${booking.status.toLowerCase()}">${booking.status}</span>
                </td>
                <td>
                    <button class="action-btn" style="border-color: #28a745; color: #28a745;" onclick="openBillModal('${booking.name}', '${booking.phone}')">Bill</button>
                    <button class="action-btn" onclick="updateStatus(${booking.id}, 'Confirmed')">Confirm</button>
                    <button class="action-btn delete-btn" onclick="deleteBooking(${booking.id})">Delete</button>
                </td>
            `;
            
            bookingsList.appendChild(row);
        });

        updateStats(bookings);
    }

    function updateStats(bookings) {
        const today = new Date().toISOString().split('T')[0];
        
        const total = bookings.length;
        const todayCount = bookings.filter(b => b.date === today).length;
        const pending = bookings.filter(b => b.status === 'Pending').length;

        totalBookingsEl.innerText = total;
        todayBookingsEl.innerText = todayCount;
        pendingBookingsEl.innerText = pending;
    }

    // Global functions for actions
    window.updateStatus = (id, newStatus) => {
        const bookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
        const index = bookings.findIndex(b => b.id === id);
        
        if (index !== -1) {
            bookings[index].status = newStatus;
            localStorage.setItem('ms_bookings', JSON.stringify(bookings));
            loadBookings();
        }
    };

    window.deleteBooking = (id) => {
        ayushConfirm('Delete Booking', 'Are you sure you want to delete this booking?', () => {
            const bookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
            const filteredBookings = bookings.filter(b => b.id !== id);
            localStorage.setItem('ms_bookings', JSON.stringify(filteredBookings));
            loadBookings();
            ayushNotify('Deleted', 'Booking has been removed.', 'success');
        });
    };

    // Initial Load
    loadBookings();

    // Listen for changes in other tabs (Real-time connection)
    window.addEventListener('storage', (e) => {
        if (e.key === 'ms_bookings') {
            loadBookings();
        }
    });

    // Refresh every 30 seconds as fallback
    setInterval(loadBookings, 30000);

    // Populate Datalist for Billing
    function populateMenuDatalist() {
        const datalist = document.getElementById('menu-items-datalist');
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        
        datalist.innerHTML = '';
        Object.keys(menuData).forEach(category => {
            menuData[category].forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                datalist.appendChild(option);
            });
        });
    }
    populateMenuDatalist();

    // Bill Management Logic
    const billModal = document.getElementById('bill-modal');
    const itemsList = document.getElementById('bill-items-list');

    window.openBillModal = (name = '', phone = '') => {
        populateMenuDatalist(); // Ensure fresh data
        document.getElementById('bill-cust-name').value = name;
        document.getElementById('bill-cust-phone').value = phone;
        
        // Auto-fill table number if it's a reservation
        const tableInput = document.getElementById('bill-table-no');
        tableInput.value = name === '' ? 'Counter/Takeaway' : '';
        
        // Reset Calculator
        document.getElementById('bill-payment-method').value = 'Offline';
        document.getElementById('bill-amt-received').value = '';
        document.getElementById('bill-amt-return').innerText = '₹0.00';
        document.getElementById('offline-calculator').style.display = 'block';

        itemsList.innerHTML = '';
        addBillItem(); // Add one initial row
        updateBillSummary();
        billModal.style.display = 'flex';
    };

    window.openTableBill = (tableId) => {
        populateMenuDatalist(); // Ensure fresh data
        document.getElementById('bill-cust-name').value = '';
        document.getElementById('bill-cust-phone').value = '';
        document.getElementById('bill-table-no').value = `Table ${tableId}`;
        
        // Reset Calculator
        document.getElementById('bill-payment-method').value = 'Offline';
        document.getElementById('bill-amt-received').value = '';
        document.getElementById('bill-amt-return').innerText = '₹0.00';
        document.getElementById('offline-calculator').style.display = 'block';

        itemsList.innerHTML = '';
        
        // Load items from active order if exists
        const activeOrders = JSON.parse(localStorage.getItem('ms_active_orders') || '{}');
        const tableKey = `Table ${tableId}`;
        
        if (activeOrders[tableKey]) {
            document.getElementById('bill-cust-name').value = activeOrders[tableKey].customerName || '';
            document.getElementById('bill-cust-phone').value = activeOrders[tableKey].customerPhone || '';
            
            activeOrders[tableKey].items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'item-row';
                row.innerHTML = `
                    <input type="text" class="bill-input item-name" list="menu-items-datalist" placeholder="Food Item" value="${item.name}">
                    <input type="number" class="bill-input item-qty" placeholder="Qty" value="${item.qty}">
                    <input type="number" class="bill-input item-price" placeholder="Price" value="${item.price}">
                `;
                attachAutoPriceLogic(row);
                itemsList.appendChild(row);
            });
        }
        
        if (itemsList.innerHTML === '') {
            addBillItem();
        }
        
        updateBillSummary();
        billModal.style.display = 'flex';
    };

    function attachAutoPriceLogic(row) {
        const nameInput = row.querySelector('.item-name');
        const priceInput = row.querySelector('.item-price');
        const qtyInput = row.querySelector('.item-qty');

        const updateAll = () => {
            updateBillSummary();
            calculateReturnAmount();
        };

        nameInput.addEventListener('input', (e) => {
            const selectedName = e.target.value;
            const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
            
            let foundPrice = '';
            Object.keys(menuData).some(category => {
                const item = menuData[category].find(i => i.name === selectedName);
                if (item) {
                    foundPrice = item.price;
                    return true;
                }
                return false;
            });
            
            if (foundPrice) {
                priceInput.value = foundPrice;
                updateAll();
            }
        });

        priceInput.addEventListener('input', updateAll);
        qtyInput.addEventListener('input', updateAll);
    }

    window.updateBillSummary = () => {
        const rows = document.querySelectorAll('.item-row');
        let subtotal = 0;

        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            subtotal += (qty * price);
        });

        const gst = subtotal * 0.05;
        const total = subtotal + gst;

        const subtotalEl = document.getElementById('bill-subtotal-val');
        const gstEl = document.getElementById('bill-gst-val');
        const totalEl = document.getElementById('bill-total-val');

        if (subtotalEl) subtotalEl.innerText = `₹${subtotal.toFixed(2)}`;
        if (gstEl) gstEl.innerText = `₹${gst.toFixed(2)}`;
        if (totalEl) totalEl.innerText = `₹${total.toFixed(2)}`;
    };

    window.closeBillModal = () => {
        billModal.style.display = 'none';
    };

    window.addBillItem = () => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <input type="text" class="bill-input item-name" list="menu-items-datalist" placeholder="Food Item">
            <input type="number" class="bill-input item-qty" placeholder="Qty" value="1">
            <input type="number" class="bill-input item-price" placeholder="Price">
        `;
        
        attachAutoPriceLogic(row);
        itemsList.appendChild(row);
    };

    window.saveCurrentOrder = () => {
        const name = document.getElementById('bill-cust-name').value;
        const phone = document.getElementById('bill-cust-phone').value;
        const table = document.getElementById('bill-table-no').value;
        
        const rows = document.querySelectorAll('.item-row');
        const orderItems = [];

        rows.forEach(row => {
            const itemName = row.querySelector('.item-name').value;
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            
            if (itemName && qty > 0) {
                orderItems.push({ name: itemName, qty, price });
            }
        });

        if (orderItems.length === 0) {
            ayushNotify('Empty Order', 'Please add at least one item to save.', 'warning');
            return;
        }

        // Save to active orders
        const activeOrders = JSON.parse(localStorage.getItem('ms_active_orders') || '{}');
        activeOrders[table] = {
            customerName: name,
            customerPhone: phone,
            items: orderItems,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('ms_active_orders', JSON.stringify(activeOrders));

        // Auto-update table status if it's a real table
        if (table && table.startsWith('Table ')) {
            const tableId = parseInt(table.replace('Table ', '').trim());
            if (!isNaN(tableId)) {
                updateTableStatus(tableId, 'Full');
            }
        }

        ayushNotify('Order Saved', `Order for ${table} saved successfully!`, 'success');
        closeBillModal();
    };

    window.generateAndPrintBill = () => {
        const name = document.getElementById('bill-cust-name').value;
        const phone = document.getElementById('bill-cust-phone').value;
        const table = document.getElementById('bill-table-no').value;
        const paymentMethod = document.getElementById('bill-payment-method').value;
        const amtReceived = parseFloat(document.getElementById('bill-amt-received').value) || 0;
        const amtReturn = (amtReceived - 0) > 0 ? (amtReceived - 0) : 0; // Will recalculate below
        
        const rows = document.querySelectorAll('.item-row');
        let itemsHtml = '';
        let subtotal = 0;
        const billItems = [];

        rows.forEach(row => {
            const itemName = row.querySelector('.item-name').value;
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            
            if (itemName && qty > 0 && price > 0) {
                const total = qty * price;
                subtotal += total;
                billItems.push({ name: itemName, qty, price, total });
                itemsHtml += `
                    <div class="receipt-line">
                        <span>${itemName} (x${qty})</span>
                        <span>₹${total.toFixed(2)}</span>
                    </div>
                `;
            }
        });

        if (billItems.length === 0) {
            ayushNotify('Empty Bill', 'Please add at least one item to the bill.', 'warning');
            return;
        }

        const gst = subtotal * 0.05; // 5% GST
        const grandTotal = subtotal + gst;
        const finalReturn = (amtReceived - grandTotal) > 0 ? (amtReceived - grandTotal) : 0;

        // Save bill to history
        const savedBills = JSON.parse(localStorage.getItem('ms_saved_bills') || '[]');
        const newBill = {
            id: Date.now(),
            customerName: name,
            customerPhone: phone,
            tableNumber: table,
            items: billItems,
            subtotal,
            gst,
            grandTotal,
            paymentMethod: paymentMethod,
            amountReceived: amtReceived,
            amountReturn: finalReturn,
            date: new Date().toISOString()
        };
        savedBills.unshift(newBill);
        localStorage.setItem('ms_saved_bills', JSON.stringify(savedBills));

        // Update bookings as well for the Accounts tab logic
        const bookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
        bookings.push({
            id: Date.now(),
            name: name || 'Walk-in Customer',
            phone: phone || 'N/A',
            guests: 1, // Default for walk-in
            seating: table || 'Counter',
            status: 'Completed',
            totalBill: grandTotal,
            paymentMethod: paymentMethod,
            formattedDate: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        });
        localStorage.setItem('ms_bookings', JSON.stringify(bookings));

        // Clear active order for this table as it is now paid/completed
        const activeOrders = JSON.parse(localStorage.getItem('ms_active_orders') || '{}');
        delete activeOrders[table];
        localStorage.setItem('ms_active_orders', JSON.stringify(activeOrders));

        // Auto-update table status to 'Maintenance' for 15 seconds
        if (table && table !== 'Counter/Takeaway') {
            const tableId = parseInt(table.replace('Table ', '').trim());
            if (!isNaN(tableId)) {
                updateTableStatus(tableId, 'Maintenance');
                
                // After 15 seconds, set back to Empty
                setTimeout(() => {
                    updateTableStatus(tableId, 'Empty');
                }, 15000);
            }
        }

        const receiptPreview = document.getElementById('receipt-preview');
        receiptPreview.innerHTML = `
            <div class="receipt-header">
                <h2>AYUSH</h2>
                <p>3 Nawab Siraj-Ud-Daulah Sarani, Kolkata</p>
                <p>Phone: +91 92309 96055</p>
                <div style="margin-top: 10px; text-align: left;">
                    <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>
                    <p><b>Customer:</b> ${name || 'N/A'}</p>
                    <p><b>Phone:</b> ${phone || 'N/A'}</p>
                    <p><b>Table:</b> ${table || 'N/A'}</p>
                    <p><b>Payment:</b> ${paymentMethod}</p>
                </div>
            </div>
            <div class="receipt-body">
                <div class="receipt-line" style="font-weight: bold; border-bottom: 1px solid black; margin-bottom: 5px;">
                    <span>Item</span>
                    <span>Price</span>
                </div>
                ${itemsHtml}
                <div style="border-top: 1px solid black; margin-top: 10px; padding-top: 5px;">
                    <div class="receipt-line">
                        <span>Subtotal</span>
                        <span>₹${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="receipt-line">
                        <span>GST (5%)</span>
                        <span>₹${gst.toFixed(2)}</span>
                    </div>
                    <div class="receipt-line" style="font-weight: bold; font-size: 1.1rem; margin-top: 5px;">
                        <span>TOTAL</span>
                        <span>₹${grandTotal.toFixed(2)}</span>
                    </div>
                    ${paymentMethod === 'Offline' ? `
                        <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 5px;">
                            <div class="receipt-line" style="font-size: 0.9rem;">
                                <span>Cash Received</span>
                                <span>₹${amtReceived.toFixed(2)}</span>
                            </div>
                            <div class="receipt-line" style="font-size: 0.9rem; font-weight: bold;">
                                <span>Change Return</span>
                                <span>₹${finalReturn.toFixed(2)}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="receipt-footer">
                <p><b>THANK YOU</b></p>
                <p>VISIT AGAIN</p>
            </div>
        `;

        // Trigger Print
        window.print();
        closeBillModal();
    };

    window.toggleChangeCalculator = () => {
        const method = document.getElementById('bill-payment-method').value;
        const calc = document.getElementById('offline-calculator');
        calc.style.display = method === 'Offline' ? 'block' : 'none';
        
        if (method === 'Online') {
            document.getElementById('bill-amt-received').value = '';
            document.getElementById('bill-amt-return').innerText = '₹0.00';
        }
    };

    window.calculateReturnAmount = () => {
        const received = parseFloat(document.getElementById('bill-amt-received').value) || 0;
        
        // Calculate current grand total
        const rows = document.querySelectorAll('.item-row');
        let subtotal = 0;
        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            subtotal += (qty * price);
        });
        
        const grandTotal = subtotal + (subtotal * 0.05);
        const returnAmt = (received - grandTotal) > 0 ? (received - grandTotal) : 0;
        
        document.getElementById('bill-amt-return').innerText = `₹${returnAmt.toFixed(2)}`;
    };

    // Management Logic
    const DEFAULT_STAFF = [
        { name: 'John Doe', salary: 2000, department: 'Kitchen' },
        { name: 'Jane Smith', salary: 1200, department: 'Service' },
        { name: 'Mike Ross', salary: 500, department: 'Utilities' },
        { name: 'Harvey Specter', salary: 300, department: 'Maintenance' }
    ];

    const DEFAULT_REQUIREMENTS = [
        { foodName: 'Chicken Tikka', details: 'Chicken breast (250g), Greek yogurt, Ginger-garlic paste, Garam Masala, Turmeric, Cumin, Kashmiri Mirch, Mustard oil.', cost: 160 },
        { foodName: 'Paneer Butter Masala', details: 'Fresh Paneer (200g), Unsalted Butter, Heavy Cream, Tomato Puree, Cashew paste, Dried Kasuri Methi, Ginger-Garlic paste, Honey, Red Chilli Powder.', cost: 130 },
        { foodName: 'Classic Mojito', details: 'White Rum (60ml), Fresh Mint leaves (10-12), Lime wedges, Simple Syrup, Club Soda, Crushed Ice.', cost: 85 },
        { foodName: 'Hakka Noodles', details: 'Egg/Veg Noodles, Cabbage, Carrots, Bell Peppers, Spring Onions, Soy Sauce, Vinegar, Chilli Oil, White Pepper, MSG (Optional).', cost: 110 },
        { foodName: 'Butter Chicken', details: 'Tandoori Chicken pieces, Rich Tomato gravy, Cashew paste, Butter, Cream, Sugar/Honey, Dried Fenugreek, Cardamom powder.', cost: 180 },
        { foodName: 'Veg Manchurian', details: 'Mixed Veggie balls (Cabbage, Carrot, Flour), Ginger, Garlic, Green Chillies, Soy Sauce, Cornflour slurry, Celery, Spring Onions.', cost: 120 },
        { foodName: 'Margarita Pizza', details: 'Pizza Dough, San Marzano Tomato sauce, Fresh Mozzarella cheese, Fresh Basil leaves, Extra Virgin Olive Oil, Sea Salt.', cost: 200 },
        { foodName: 'Crispy Corn', details: 'Sweet Corn, Cornflour, Rice flour, Black pepper, Chopped Garlic, Green chillies, Spring Onions, Lemon juice.', cost: 95 },
        { foodName: 'Whisky Sour', details: 'Bourbon Whisky (60ml), Fresh Lemon juice (30ml), Simple Syrup (15ml), Egg White (optional), Angostura Bitters.', cost: 150 },
        { foodName: 'Dal Makhani', details: 'Black Lentils (Urad dal), Kidney Beans (Rajma), Butter, Cream, Tomato puree, Garlic paste, Cumin, Kasuri methi, Slow cooked.', cost: 140 },
        { foodName: 'Fish & Chips', details: 'Basa/Cod fillet, Flour batter (with Beer), Tartar sauce, Potato wedges, Lemon wedges, Black pepper.', cost: 220 },
        { foodName: 'Chicken Biryani', details: 'Basmati Rice, Chicken pieces, Saffron, Fried Onions, Mint, Curd, Biryani Masala, Ghee, Kewra water.', cost: 250 },
        { foodName: 'Cosmopolitan', details: 'Vodka (45ml), Triple Sec (15ml), Cranberry juice, Fresh Lime juice, Orange peel for garnish.', cost: 140 },
        { foodName: 'Tandoori Roti', details: 'Whole Wheat Flour, Water, Salt, Butter (Optional). Cooked in Tandoor.', cost: 15 },
        { foodName: 'French Fries', details: 'Potatoes (Large), Salt, Vegetable Oil for deep frying, Peri-peri seasoning (optional).', cost: 80 }
    ];

    function calculateStaffExpense() {
        const staffData = JSON.parse(localStorage.getItem('ms_staff_data') || JSON.stringify(DEFAULT_STAFF));
        return staffData.reduce((sum, member) => sum + parseFloat(member.salary || 0), 0);
    }

    function calculateTotalSales() {
        // Calculate total from completed bookings
        const bookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
        return bookings.reduce((sum, b) => {
            // Check if there's a totalBill property, otherwise estimate from guest count
            const bill = b.totalBill || (b.guests * 500); // Rough estimate if no bill exists
            return sum + (b.status === 'Completed' ? bill : 0);
        }, 0);
    }

    window.loadManagementData = () => {
        const totalSales = calculateTotalSales();
        const staffExpense = calculateStaffExpense();
        const profit = totalSales - staffExpense;

        const salesEl = document.getElementById('mgmt-total-sales');
        const profitEl = document.getElementById('mgmt-profit');
        const expenseEl = document.getElementById('mgmt-staff-expense');

        if (salesEl) salesEl.innerText = `₹${totalSales.toFixed(2)}`;
        if (profitEl) profitEl.innerText = `₹${profit.toFixed(2)}`;
        if (expenseEl) expenseEl.innerText = `₹${staffExpense.toFixed(2)}`;
    };

    window.switchManagementSubTab = (subtab) => {
        const title = document.getElementById('mgmt-subtab-title');
        const body = document.getElementById('mgmt-subtab-body');
        const totalSales = calculateTotalSales();
        
        // Update active button
        document.querySelectorAll('.mgmt-tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${subtab}`);
        if (activeBtn) activeBtn.classList.add('active');
        
        if (subtab === 'total-sales') {
            title.innerText = 'Total Sales Overview';
            body.innerHTML = `
                <div style="color: #d0d0d0;">
                    <p>Total Revenue generated from all completed bookings.</p>
                    <div style="font-size: 2.5rem; color: #28a745; margin: 1.5rem 0; font-weight: 700;">₹${totalSales.toFixed(2)}</div>
                    <p style="font-size: 0.9rem; color: var(--text-gray);">This includes all reservations marked as "Completed" in the billing section.</p>
                </div>
            `;
        } else if (subtab === 'profit') {
            title.innerText = 'Profit Analysis';
            const expense = calculateStaffExpense();
            const profit = totalSales - expense;
            body.innerHTML = `
                <div style="color: #d0d0d0;">
                    <p>Net profit after deducting staff and maintenance expenses.</p>
                    <div style="display: flex; gap: 3rem; margin: 2rem 0; flex-wrap: wrap;">
                        <div>
                            <span style="font-size: 0.85rem; color: var(--text-gray); text-transform: uppercase; letter-spacing: 1px;">Revenue</span>
                            <div style="font-size: 1.5rem; margin-top: 5px;">₹${totalSales.toFixed(2)}</div>
                        </div>
                        <div>
                            <span style="font-size: 0.85rem; color: var(--text-gray); text-transform: uppercase; letter-spacing: 1px;">Expenses</span>
                            <div style="font-size: 1.5rem; color: #dc3545; margin-top: 5px;">-₹${expense.toFixed(2)}</div>
                        </div>
                        <div style="border-left: 1px solid rgba(255,255,255,0.1); padding-left: 3rem;">
                            <span style="font-size: 0.85rem; color: var(--text-gold); text-transform: uppercase; letter-spacing: 1px;">Net Profit</span>
                            <div style="font-size: 2.5rem; color: var(--text-gold); font-weight: 700; margin-top: 5px;">₹${profit.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (subtab === 'staff-expense') {
            title.innerText = 'Staff Management & Expenses';
            const staffData = JSON.parse(localStorage.getItem('ms_staff_data') || JSON.stringify(DEFAULT_STAFF));
            const totalExpense = calculateStaffExpense();
            
            body.innerHTML = `
                <div style="color: #d0d0d0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <p>Manage your team members and their monthly salaries.</p>
                        <button class="action-btn" style="border-color: #28a745; color: #28a745;" onclick="openStaffModal()">+ Add New Staff</button>
                    </div>
                    
                    <div class="bookings-table-wrapper" style="margin-top: 0.5rem; border: none; background: transparent;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.2);">
                                    <th style="text-align: left; padding: 1rem 0;">Staff Name</th>
                                    <th style="text-align: left; padding: 1rem 0;">Department</th>
                                    <th style="text-align: right; padding: 1rem 0;">Monthly Salary</th>
                                    <th style="text-align: right; padding: 1rem 0;">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="staff-items-list">
                                ${staffData.map((member, index) => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <td style="padding: 1rem 0; font-weight: 500; color: white;">${member.name}</td>
                                        <td style="padding: 1rem 0;"><span class="status-badge" style="background: rgba(212, 175, 55, 0.1); color: var(--text-gold);">${member.department}</span></td>
                                        <td style="text-align: right; padding: 1rem 0; color: #d0d0d0;">₹${parseFloat(member.salary).toFixed(2)}</td>
                                        <td style="text-align: right; padding: 1rem 0;">
                                            <button class="action-btn" onclick="openEditStaffModal(${index})">Edit</button>
                                            <button class="action-btn delete-btn" onclick="deleteStaffMember(${index})">Delete</button>
                                        </td>
                                    </tr>
                                `).join('')}
                                <tr style="font-weight: 700; color: var(--text-gold); font-size: 1.1rem; border-top: 2px solid rgba(212, 175, 55, 0.2);">
                                    <td colspan="2" style="padding: 1.5rem 0;">TOTAL MONTHLY EXPENSE</td>
                                    <td style="text-align: right; padding: 1.5rem 0;">₹${totalExpense.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else if (subtab === 'requirement') {
            title.innerText = 'Food & Making Requirements';
            const reqData = JSON.parse(localStorage.getItem('ms_requirements') || JSON.stringify(DEFAULT_REQUIREMENTS));
            
            body.innerHTML = `
                <div style="color: #d0d0d0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <p>Manage ingredients and making requirements for your menu items.</p>
                        <button class="action-btn" style="border-color: #28a745; color: #28a745;" onclick="openRequirementModal()">+ Add New Requirement</button>
                    </div>
                    
                    <div class="bookings-table-wrapper" style="margin-top: 0.5rem; border: none; background: transparent;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 2px solid rgba(212, 175, 55, 0.2);">
                                    <th style="text-align: left; padding: 1rem 0;">Food Name</th>
                                    <th style="text-align: left; padding: 1rem 0;">Ingredients & Details</th>
                                    <th style="text-align: right; padding: 1rem 0;">Est. Cost</th>
                                    <th style="text-align: right; padding: 1rem 0;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reqData.map((item, index) => `
                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <td style="padding: 1rem 0; font-weight: 500; color: white; vertical-align: top; width: 150px;">
                                            ${item.foodName}
                                            ${item.fromKitchen ? '<div style="font-size: 0.6rem; background: rgba(0, 123, 255, 0.2); color: #007bff; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 5px;">FROM KITCHEN</div>' : ''}
                                        </td>
                                        <td style="padding: 1rem 0; color: #b0b0b0; font-size: 0.85rem; line-height: 1.5;">${item.details}</td>
                                        <td style="text-align: right; padding: 1rem 0; color: var(--text-gold); vertical-align: top; width: 100px;">₹${parseFloat(item.cost || 0).toFixed(2)}</td>
                                        <td style="text-align: right; padding: 1rem 0; vertical-align: top; width: 150px;">
                                            <button class="action-btn" onclick="openEditRequirementModal(${index})">Edit</button>
                                            <button class="action-btn delete-btn" onclick="deleteRequirement(${index})">Delete</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else if (subtab === 'stock') {
            title.innerText = 'Menu Stock Management';
            const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
            
            body.innerHTML = `
                <div style="color: #d0d0d0;">
                    <p>Manage item availability. Out of stock items will be hidden from the customer order page.</p>
                    <div class="stock-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
                        ${Object.keys(menuData).map(cat => menuData[cat].map(item => `
                            <div class="depth-card" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                                <div>
                                    <div style="font-weight: 600; color: white;">${item.name}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-gray); text-transform: capitalize;">${cat}</div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 0.7rem; color: ${item.outOfStock ? '#dc3545' : '#28a745'}">${item.outOfStock ? 'OUT' : 'IN'}</span>
                                    <label class="toggle-switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
                                        <input type="checkbox" ${item.outOfStock ? '' : 'checked'} onchange="toggleStockStatus('${cat}', '${item.name}', this.checked)" style="opacity: 0; width: 0; height: 0;">
                                        <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: .4s; border-radius: 20px;"></span>
                                    </label>
                                </div>
                            </div>
                        `).join('')).join('')}
                    </div>
                </div>
            `;
        }
    };

    window.toggleStockStatus = (category, itemName, isAvailable) => {
        const menuData = JSON.parse(localStorage.getItem('ms_menu_data') || JSON.stringify(MENU_DATA));
        const item = menuData[category].find(i => i.name === itemName);
        if (item) {
            item.outOfStock = !isAvailable;
            localStorage.setItem('ms_menu_data', JSON.stringify(menuData));
            ayushNotify(isAvailable ? 'In Stock' : 'Out of Stock', `${itemName} updated.`, isAvailable ? 'success' : 'warning');
            // Refresh current tab
            switchManagementSubTab('stock');
        }
    };

    // Staff Management Functions
    window.openStaffModal = () => {
        document.getElementById('staff-modal-title').innerText = 'Add New Staff';
        document.getElementById('staff-name').value = '';
        document.getElementById('staff-dept').value = 'Service';
        document.getElementById('staff-salary').value = '';
        document.getElementById('edit-staff-index').value = '';
        document.getElementById('staff-modal').style.display = 'flex';
    };

    window.openEditStaffModal = (index) => {
        const staffData = JSON.parse(localStorage.getItem('ms_staff_data') || JSON.stringify(DEFAULT_STAFF));
        const member = staffData[index];
        
        document.getElementById('staff-modal-title').innerText = 'Edit Staff Member';
        document.getElementById('staff-name').value = member.name;
        document.getElementById('staff-dept').value = member.department;
        document.getElementById('staff-salary').value = member.salary;
        document.getElementById('edit-staff-index').value = index;
        document.getElementById('staff-modal').style.display = 'flex';
    };

    window.closeStaffModal = () => {
        document.getElementById('staff-modal').style.display = 'none';
    };

    window.saveStaffMember = () => {
        const name = document.getElementById('staff-name').value;
        const department = document.getElementById('staff-dept').value;
        const salary = document.getElementById('staff-salary').value;
        const editIndex = document.getElementById('edit-staff-index').value;

        if (!name || !salary) {
            ayushNotify('Missing Information', 'Please fill all required fields', 'warning');
            return;
        }

        const staffData = JSON.parse(localStorage.getItem('ms_staff_data') || JSON.stringify(DEFAULT_STAFF));

        if (editIndex !== '') {
            staffData[parseInt(editIndex)] = { name, department, salary };
        } else {
            staffData.push({ name, department, salary });
        }

        localStorage.setItem('ms_staff_data', JSON.stringify(staffData));
        closeStaffModal();
        loadManagementData();
        switchManagementSubTab('staff-expense');
    };

    window.deleteStaffMember = (index) => {
        ayushConfirm('Remove Staff', 'Are you sure you want to remove this staff member?', () => {
            const staffData = JSON.parse(localStorage.getItem('ms_staff_data') || JSON.stringify(DEFAULT_STAFF));
            staffData.splice(index, 1);
            localStorage.setItem('ms_staff_data', JSON.stringify(staffData));
            loadManagementData();
            switchManagementSubTab('staff-expense');
            ayushNotify('Removed', 'Staff member removed from records', 'success');
        });
    };

    // Requirement Management Functions
    window.openRequirementModal = () => {
        document.getElementById('requirement-modal-title').innerText = 'Add Food Requirement';
        document.getElementById('req-food-name').value = '';
        document.getElementById('req-details').value = '';
        document.getElementById('req-cost').value = '';
        document.getElementById('edit-req-index').value = '';
        document.getElementById('requirement-modal').style.display = 'flex';
    };

    window.openEditRequirementModal = (index) => {
        const reqData = JSON.parse(localStorage.getItem('ms_requirements') || JSON.stringify(DEFAULT_REQUIREMENTS));
        const item = reqData[index];
        
        document.getElementById('requirement-modal-title').innerText = 'Edit Food Requirement';
        document.getElementById('req-food-name').value = item.foodName;
        document.getElementById('req-details').value = item.details;
        document.getElementById('req-cost').value = item.cost;
        document.getElementById('edit-req-index').value = index;
        document.getElementById('requirement-modal').style.display = 'flex';
    };

    window.closeRequirementModal = () => {
        document.getElementById('requirement-modal').style.display = 'none';
    };

    window.saveRequirement = () => {
        const foodName = document.getElementById('req-food-name').value;
        const details = document.getElementById('req-details').value;
        const cost = document.getElementById('req-cost').value;
        const editIndex = document.getElementById('edit-req-index').value;

        if (!foodName || !details || !cost) {
            ayushNotify('Incomplete Data', 'Please fill all fields', 'warning');
            return;
        }

        const reqData = JSON.parse(localStorage.getItem('ms_requirements') || JSON.stringify(DEFAULT_REQUIREMENTS));

        if (editIndex !== '') {
            reqData[parseInt(editIndex)] = { foodName, details, cost };
        } else {
            reqData.push({ foodName, details, cost });
        }

        localStorage.setItem('ms_requirements', JSON.stringify(reqData));
        closeRequirementModal();
        switchManagementSubTab('requirement');
    };

    window.deleteRequirement = (index) => {
        ayushConfirm('Delete Requirement', 'Are you sure you want to delete this requirement?', () => {
            const reqData = JSON.parse(localStorage.getItem('ms_requirements') || JSON.stringify(DEFAULT_REQUIREMENTS));
            reqData.splice(index, 1);
            localStorage.setItem('ms_requirements', JSON.stringify(reqData));
            switchManagementSubTab('requirement');
            ayushNotify('Deleted', 'Requirement removed successfully', 'success');
        });
    };

    // AI Suggestion Logic
    window.suggestRequirementAI = () => {
        const foodName = document.getElementById('req-food-name').value.trim();
        if (!foodName) {
            ayushNotify('Food Name Required', 'Please enter a food name first', 'warning');
            return;
        }

        const btn = document.getElementById('ai-suggest-btn');
        const loader = document.getElementById('ai-loading');
        
        btn.disabled = true;
        loader.style.display = 'flex';

        // Knowledge Base for AI Suggestions
        const aiKnowledge = {
            'chicken tikka': { details: 'Chicken breast (250g), Greek yogurt, Lemon juice, Ginger-garlic paste, Garam Masala, Turmeric, Cumin, Kashmiri Mirch, Mustard oil.', cost: 160 },
            'paneer butter masala': { details: 'Fresh Paneer (200g), Unsalted Butter, Heavy Cream, Tomato Puree, Cashew paste, Dried Kasuri Methi, Ginger-Garlic paste, Honey, Red Chilli Powder.', cost: 130 },
            'classic mojito': { details: 'White Rum (60ml), Fresh Mint leaves (10-12), Lime wedges, Simple Syrup, Club Soda, Crushed Ice.', cost: 85 },
            'hakka noodles': { details: 'Egg/Veg Noodles, Cabbage, Carrots, Bell Peppers, Spring Onions, Soy Sauce, Vinegar, Chilli Oil, White Pepper, MSG (Optional).', cost: 110 },
            'butter chicken': { details: 'Tandoori Chicken pieces, Rich Tomato gravy, Cashew paste, Butter, Cream, Sugar/Honey, Dried Fenugreek, Cardamom powder.', cost: 180 },
            'manchurian': { details: 'Mixed Veggie balls (Cabbage, Carrot, Flour), Ginger, Garlic, Green Chillies, Soy Sauce, Cornflour slurry, Celery, Spring Onions.', cost: 120 },
            'margarita pizza': { details: 'Pizza Dough, San Marzano Tomato sauce, Fresh Mozzarella cheese, Fresh Basil leaves, Extra Virgin Olive Oil, Sea Salt.', cost: 200 },
            'crispy corn': { details: 'Sweet Corn, Cornflour, Rice flour, Black pepper, Chopped Garlic, Green chillies, Spring Onions, Lemon juice.', cost: 95 },
            'whisky sour': { details: 'Bourbon Whisky (60ml), Fresh Lemon juice (30ml), Simple Syrup (15ml), Egg White (optional), Angostura Bitters.', cost: 150 },
            'dal makhani': { details: 'Black Lentils (Urad dal), Kidney Beans (Rajma), Butter, Cream, Tomato puree, Garlic paste, Cumin, Kasuri methi, Slow cooked.', cost: 140 }
        };

        // Simulate AI "Thinking" time
        setTimeout(() => {
            const lowerName = foodName.toLowerCase();
            let suggestion = null;

            // Check if exact match or partial match exists
            for (const key in aiKnowledge) {
                if (lowerName.includes(key) || key.includes(lowerName)) {
                    suggestion = aiKnowledge[key];
                    break;
                }
            }

            // Generic fallback if not in database
            if (!suggestion) {
                suggestion = {
                    details: `Ingredients for ${foodName}:\n1. Primary Protein/Veggie\n2. Base Gravy/Oil\n3. Chef's Special Spice Mix\n4. Fresh Herbs for Garnish\n5. Seasoning (Salt, Pepper)\n\n[Generic AI Suggestion: Please refine based on your specific recipe]`,
                    cost: Math.floor(Math.random() * (250 - 100 + 1)) + 100 // Random cost between 100-250
                };
            }

            // Fill the form
            document.getElementById('req-details').value = suggestion.details;
            document.getElementById('req-cost').value = suggestion.cost;

            // Reset UI
            btn.disabled = false;
            loader.style.display = 'none';
        }, 1500);
    };

    // Logout Function
    window.adminLogout = () => {
        ayushConfirm('Logout', 'Are you sure you want to logout?', () => {
            sessionStorage.removeItem('ms_admin_logged_in');
            sessionStorage.removeItem('ms_admin_user');
            window.location.href = 'login.html';
        });
    };

    // Accounts Logic
    window.loadAccountsData = () => {
        const bookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
        const completed = bookings.filter(b => b.status === 'Completed');
        
        const onlineTotal = completed
            .filter(b => b.paymentMethod === 'Online')
            .reduce((sum, b) => sum + (b.totalBill || (b.guests * 500)), 0);
            
        const offlineTotal = completed
            .filter(b => b.paymentMethod !== 'Online') // Default to offline/cash
            .reduce((sum, b) => sum + (b.totalBill || (b.guests * 500)), 0);

        const onlineEl = document.getElementById('acc-online-total');
        const offlineEl = document.getElementById('acc-offline-total');

        if (onlineEl) onlineEl.innerText = `₹${onlineTotal.toFixed(2)}`;
        if (offlineEl) offlineEl.innerText = `₹${offlineTotal.toFixed(2)}`;
    };

    window.switchAccountsSubTab = (subtab) => {
        const title = document.getElementById('acc-subtab-title');
        const list = document.getElementById('acc-transactions-list');
        const bookings = JSON.parse(localStorage.getItem('ms_bookings') || '[]');
        
        // Update active button
        document.querySelectorAll('#accounts-tab .mgmt-tab-btn').forEach(btn => btn.classList.remove('active'));
        const btnId = subtab === 'online' ? 'btn-online-trans' : 'btn-offline-trans';
        const activeBtn = document.getElementById(btnId);
        if (activeBtn) activeBtn.classList.add('active');

        const filtered = bookings.filter(b => {
            if (b.status !== 'Completed') return false;
            if (subtab === 'online') return b.paymentMethod === 'Online';
            return b.paymentMethod !== 'Online';
        });

        title.innerText = subtab === 'online' ? 'Online Transaction History' : 'Offline (Cash) Transaction History';
        list.innerHTML = '';

        if (filtered.length === 0) {
            list.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-gray);">No ${subtab} transactions found.</td></tr>`;
            return;
        }

        filtered.forEach(b => {
            const row = document.createElement('tr');
            const amount = b.totalBill || (b.guests * 500);
            row.innerHTML = `
                <td style="padding: 1rem 0; color: #b0b0b0;">${b.formattedDate}</td>
                <td style="padding: 1rem 0; font-weight: 500; color: white;">${b.name}</td>
                <td style="text-align: right; padding: 1rem 0; color: var(--text-gold);">₹${amount.toFixed(2)}</td>
                <td style="text-align: center; padding: 1rem 0;">
                    <span class="status-badge status-confirmed" style="font-size: 0.7rem;">Paid</span>
                </td>
            `;
            list.appendChild(row);
        });
    };

    // Audio Context for Notification Sound
    let lastRequestCount = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]').length;
    const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    function playNotificationSound() {
        const settings = JSON.parse(localStorage.getItem('ms_website_settings') || '{}');
        if (settings.soundEnabled === false) return;

        notificationSound.play().catch(err => {
            console.log('Audio playback prevented. User must interact with the page first.');
        });
    }

    // Auto Refresh (Every 5 seconds)
    setInterval(() => {
        refreshDashboard();
    }, 5000);

    // Real-time Updates via Storage Event (Cross-tab sync)
    window.addEventListener('storage', (e) => {
        if (e.key === 'ms_customer_requests' || e.key === 'ms_active_orders' || e.key === 'ms_bookings') {
            refreshDashboard();
        }
    });

    function refreshDashboard() {
        const activeNav = document.querySelector('.nav-item.active');
        
        // Always refresh customer request badge and check for sound
        const requests = JSON.parse(localStorage.getItem('ms_customer_requests') || '[]');
        const currentCount = requests.length;
        
        if (currentCount > lastRequestCount) {
            playNotificationSound();
        }
        lastRequestCount = currentCount;

        const badge = document.getElementById('request-count-badge');
        if (badge) {
            badge.innerText = `${requests.filter(r => r.status === 'New').length} New`;
        }

        if (!activeNav) return;
        const tabTitle = activeNav.innerText.trim();

        // Refresh active tab data
        if (tabTitle === 'Billing & Bookings') {
            loadBookings();
        } else if (tabTitle === 'Table Status') {
            loadTableStatus();
        } else if (tabTitle === 'Customer Orders') {
            loadCustomerRequests();
        } else if (tabTitle === 'Menu Settings') {
            // Only load menu management if modal is not open to avoid disrupting edits
            const modal = document.getElementById('food-modal');
            if (modal && modal.style.display !== 'flex') {
                loadMenuManagement();
            }
        } else if (tabTitle === 'Management') {
            loadManagementData();
        } else if (tabTitle === 'Accounts') {
            loadAccountsData();
        }
    }
});
