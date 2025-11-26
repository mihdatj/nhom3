// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Get cart from localStorage or use global cart
function getCart() {
    try {
        // Always read directly from localStorage
        const raw = localStorage.getItem('cart');
        console.log('🔍 getCart() - Raw localStorage:', raw);
        
        if (!raw || raw === 'null' || raw === 'undefined') {
            console.log('📭 getCart() - No cart in localStorage, returning empty array');
            return [];
        }
        
        const parsed = JSON.parse(raw);
        console.log('✅ getCart() - Parsed cart:', parsed);
        
        if (!Array.isArray(parsed)) {
            console.warn('⚠️ getCart() - Cart is not an array, returning empty array');
            return [];
        }
        
        console.log(`✅ getCart() - Returning ${parsed.length} items`);
        return parsed;
    } catch (error) {
        console.error('❌ getCart() - Error reading cart:', error);
        return [];
    }
}

// Save cart to localStorage
function saveCart(cartData) {
    localStorage.setItem('cart', JSON.stringify(cartData));
    if (typeof cart !== 'undefined') {
        cart = cartData;
    }
}

// Update cart count in header
function updateCartCount() {
    const cartData = getCart();
    // Count unique products by ID, not total quantity
    const count = cartData.length;
    const cartCountEl = document.querySelector('.cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}

// Create cart item HTML
function createCartItemHTML(item, index) {
    // Ensure all required properties exist
    if (!item.price) item.price = 0;
    if (!item.quantity || item.quantity < 1) {
        item.quantity = 1;
    }
    if (!item.stock) item.stock = 10;
    if (!item.variant) item.variant = 'Mặc định';
    if (!item.image) item.image = 'https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image';
    if (!item.name) item.name = 'Sản phẩm không tên';
    
    // Ensure quantity is a number - use the actual quantity from item
    // Don't modify the original item, use a local variable
    const actualQuantity = parseInt(item.quantity) || 1;
    
    console.log(`🎨 Creating cart item HTML for: ${item.name}`);
    console.log(`   Item quantity from object: ${item.quantity} (type: ${typeof item.quantity})`);
    console.log(`   Parsed quantity for display: ${actualQuantity}`);
    console.log(`   Item index: ${index}`);
    console.log(`   Full item object:`, JSON.stringify(item));
    
    // Use actualQuantity for calculations and display
    const total = item.price * actualQuantity;
    const stockStatus = item.stock > 0 ? 'in-stock' : 'out-of-stock';
    const stockText = item.stock > 0 ? `Còn ${item.stock} sản phẩm` : 'Hết hàng';
    
    return `
        <div class="cart-item" data-index="${index}">
            <div class="cart-item-left">
                <div class="cart-item-checkbox">
                    <input type="checkbox" class="item-checkbox" data-index="${index}" onchange="updateCartSummary()" checked>
                </div>
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-variant">Phân Loại Hàng: ${item.variant || 'Mặc định'}</div>
                    <div class="cart-item-price">${formatCurrency(item.price)}</div>
                </div>
            </div>
            <div class="cart-item-price">${formatCurrency(item.price)}</div>
            <div class="cart-item-quantity">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)" ${actualQuantity <= 1 ? 'disabled' : ''}>-</button>
                    <input type="number" class="quantity-input" value="${actualQuantity}" min="1" max="${item.stock || 999}" onchange="setQuantity(${index}, this.value)">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)" ${actualQuantity >= (item.stock || 999) ? 'disabled' : ''}>+</button>
                </div>
                <div class="stock-info ${stockStatus}">${stockText}</div>
            </div>
            <div class="cart-item-total">${formatCurrency(total)}</div>
            <div class="cart-item-actions">
                <button class="delete-btn-item" onclick="removeItem(${index})">Xóa</button>
                <button class="find-similar" onclick="findSimilar(${index})">
                    Tìm sản phẩm tương tự
                    <i class="fas fa-chevron-down"></i>
                </button>
            </div>
        </div>
    `;
}

// Group cart items by shop (for demo, we'll use a single shop)
function groupCartItems(cartData) {
    // For simplicity, group all items under one shop
    // Keep reference to original index
    return [{
        shopName: 'Nhóm 3',
        items: cartData.map((item, index) => ({ ...item, _originalIndex: index }))
    }];
}

// Render cart items
function renderCartItems() {
    console.log('🔄 === RENDERING CART ITEMS ===');
    
    const container = document.getElementById('cartItemsContainer');
    if (!container) {
        console.error('❌ Cart container not found!');
        return;
    }
    
    // ALWAYS read fresh from localStorage using getCart()
    const cartData = getCart();
    
    console.log('📦 Cart data from getCart():', cartData);
    console.log('📦 Cart length:', cartData ? cartData.length : 0);
    console.log('📦 Is array?', Array.isArray(cartData));
    
    // Check if cart is empty
    if (!cartData || !Array.isArray(cartData) || cartData.length === 0) {
        console.log('📭 Cart is empty, showing empty cart message');
        container.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <div class="empty-cart-text">Giỏ hàng của bạn đang trống</div>
                <a href="index.html" class="empty-cart-btn">Tiếp tục mua sắm</a>
            </div>
        `;
        updateCartSummary();
        return;
    }
    
    console.log('Cart data before grouping:', cartData);
    console.log('Number of items to render:', cartData.length);
    
    // Log each item details with full information
    console.log('📋 DETAILED CART ITEMS:');
    cartData.forEach((item, idx) => {
        console.log(`   Item ${idx}:`);
        console.log(`      ID: ${item.id} (${typeof item.id})`);
        console.log(`      Name: ${item.name}`);
        console.log(`      Quantity: ${item.quantity} (${typeof item.quantity})`);
        console.log(`      Price: ${item.price}`);
        console.log(`      Full object:`, item);
    });
    
    const groupedItems = groupCartItems(cartData);
    console.log('Grouped items:', groupedItems);
    console.log('Number of groups:', groupedItems.length);
    
    let html = '';
    
    groupedItems.forEach((group, groupIndex) => {
        console.log(`Rendering group ${groupIndex} (${group.shopName}) with ${group.items.length} items`);
        html += `
            <div class="cart-item-group">
                <div class="shop-header">
                    <div class="shop-checkbox">
                        <input type="checkbox" class="shop-checkbox-input" data-group="${groupIndex}" onchange="toggleShopItems(${groupIndex})" checked>
                        <i class="fas fa-store shop-icon"></i>
                        <span class="shop-name">${group.shopName}</span>
                    </div>
                </div>
        `;
        
        if (group.items.length === 0) {
            console.warn(`Group ${groupIndex} has no items!`);
        }
        
        group.items.forEach((item, itemIndex) => {
            // Use the original index stored in the item, or fallback to itemIndex
            const indexToUse = item._originalIndex !== undefined ? item._originalIndex : itemIndex;
            console.log(`Rendering item ${itemIndex}: ${item.name}, quantity: ${item.quantity}, price: ${item.price}, index: ${indexToUse}`);
            html += createCartItemHTML(item, indexToUse);
        });
        
        html += `</div>`;
    });
    
    console.log('Generated HTML length:', html.length);
    console.log('Setting container innerHTML...');
    container.innerHTML = html;
    console.log('Container innerHTML set. Calling updateCartSummary...');
    updateCartSummary();
    console.log('Cart items rendered successfully!');
    
    // Verify rendered items
    const renderedItems = container.querySelectorAll('.cart-item');
    console.log(`Actually rendered ${renderedItems.length} items in DOM`);
}

// Update quantity
function updateQuantity(index, change) {
    const cartData = getCart();
    if (cartData[index]) {
        cartData[index].quantity += change;
        if (cartData[index].quantity < 1) {
            cartData[index].quantity = 1;
        }
        if (cartData[index].stock && cartData[index].quantity > cartData[index].stock) {
            cartData[index].quantity = cartData[index].stock;
        }
        saveCart(cartData);
        renderCartItems();
        updateCartCount();
    }
}

// Set quantity
function setQuantity(index, value) {
    const cartData = getCart();
    if (cartData[index]) {
        const newQuantity = parseInt(value) || 1;
        const maxQuantity = cartData[index].stock || 999;
        cartData[index].quantity = Math.min(Math.max(1, newQuantity), maxQuantity);
        saveCart(cartData);
        renderCartItems();
        updateCartCount();
    }
}

// Remove item
function removeItem(index) {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
        const cartData = getCart();
        cartData.splice(index, 1);
        saveCart(cartData);
        renderCartItems();
        updateCartCount();
    }
}

// Toggle select all
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const selectAllFooter = document.getElementById('selectAllFooter');
    const checked = selectAll ? selectAll.checked : (selectAllFooter ? selectAllFooter.checked : false);
    
    if (selectAll) selectAll.checked = checked;
    if (selectAllFooter) selectAllFooter.checked = checked;
    
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.checked = checked;
    });
    
    updateCartSummary();
}

// Toggle shop items
function toggleShopItems(groupIndex) {
    const shopCheckbox = document.querySelector(`.shop-checkbox-input[data-group="${groupIndex}"]`);
    if (!shopCheckbox) return;
    
    const group = document.querySelectorAll(`.cart-item-group:nth-child(${groupIndex + 1}) .item-checkbox`);
    group.forEach(checkbox => {
        checkbox.checked = shopCheckbox.checked;
    });
    
    updateSelectAllState();
    updateCartSummary();
}

// Update select all state
function updateSelectAllState() {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    const checked = Array.from(checkboxes).filter(cb => cb.checked);
    const allChecked = checkboxes.length > 0 && checked.length === checkboxes.length;
    
    const selectAll = document.getElementById('selectAll');
    const selectAllFooter = document.getElementById('selectAllFooter');
    if (selectAll) selectAll.checked = allChecked;
    if (selectAllFooter) selectAllFooter.checked = allChecked;
}

// Update cart summary
function updateCartSummary() {
    const cartData = getCart();
    console.log('Updating cart summary with cart data:', cartData);
    
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));
    
    let total = 0;
    let selectedCount = 0;
    
    selectedIndices.forEach(index => {
        if (cartData[index]) {
            const item = cartData[index];
            console.log(`Item ${index}: quantity=${item.quantity}, price=${item.price}`);
            total += item.price * item.quantity;
            selectedCount += item.quantity;
        }
    });
    
    console.log('Total count:', selectedCount, 'Total price:', total);
    
    const selectedCountEl = document.getElementById('selectedCount');
    const cartTotalPriceEl = document.getElementById('cartTotalPrice');
    const totalItemsEl = document.getElementById('totalItems');
    
    if (selectedCountEl) selectedCountEl.textContent = selectedCount;
    if (cartTotalPriceEl) cartTotalPriceEl.textContent = formatCurrency(total);
    if (totalItemsEl) {
        const totalItems = cartData.reduce((sum, item) => sum + (item.quantity || 0), 0);
        totalItemsEl.textContent = totalItems;
        console.log('Total items in cart:', totalItems);
    }
    
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = selectedCount === 0;
    }
    
    updateSelectAllState();
}

// Delete selected items
function deleteSelected() {
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('Vui lòng chọn sản phẩm cần xóa');
        return;
    }
    
    if (confirm(`Bạn có chắc muốn xóa ${checkboxes.length} sản phẩm đã chọn?`)) {
        const cartData = getCart();
        const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index'))).sort((a, b) => b - a);
        
        selectedIndices.forEach(index => {
            cartData.splice(index, 1);
        });
        
        saveCart(cartData);
        renderCartItems();
        updateCartCount();
    }
}

// Find similar products
function findSimilar(index) {
    const cartData = getCart();
    const item = cartData[index];
    if (item) {
        // Navigate to category page with search
        window.location.href = `category.html?cat=${encodeURIComponent(item.category || '')}`;
    }
}

// Checkout
function checkout() {
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('Vui lòng chọn sản phẩm để mua');
        return;
    }
    
    // Get selected items
    const cartData = getCart();
    const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));
    const selectedItems = selectedIndices.map(index => cartData[index]).filter(item => item);
    
    // Save selected items to localStorage for checkout page
    localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    
    // Navigate to checkout page
    window.location.href = 'checkout.html';
}

// Function to refresh cart display
function refreshCart() {
    console.log('Refreshing cart display...');
    const cartData = getCart();
    console.log('Refreshed cart data:', cartData);
    console.log('Refreshed cart length:', cartData ? cartData.length : 0);
    renderCartItems();
    updateCartCount();
}

// Initialize - Render cart immediately
function initializeCart() {
    console.log('🛒 Initializing cart page...');
    console.log('🕐 Current time:', new Date().toISOString());
    
    // Load cart from localStorage immediately - try multiple times
    let cartData = [];
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts && (!cartData || cartData.length === 0)) {
        attempts++;
        console.log(`🔍 Attempt ${attempts} to load cart...`);
        
        const directCheck = localStorage.getItem('cart');
        console.log(`🔍 Direct localStorage check (attempt ${attempts}):`, directCheck ? `Found (${directCheck.length} chars)` : 'Not found');
        
        if (directCheck) {
            try {
                const parsed = JSON.parse(directCheck);
                console.log(`✅ Parsed cart (attempt ${attempts}):`, parsed);
                console.log(`📊 Parsed length (attempt ${attempts}):`, parsed ? parsed.length : 0);
                
                if (Array.isArray(parsed) && parsed.length > 0) {
                    cartData = parsed;
                    console.log(`✅ Successfully loaded cart on attempt ${attempts} with ${cartData.length} items`);
                    break;
                } else if (Array.isArray(parsed)) {
                    console.warn(`⚠️ Cart is empty array on attempt ${attempts}`);
                } else {
                    console.warn(`⚠️ Cart is not an array on attempt ${attempts}:`, typeof parsed);
                }
            } catch (e) {
                console.error(`❌ Error parsing cart (attempt ${attempts}):`, e);
                console.error('Raw cart string (first 200 chars):', directCheck.substring(0, 200));
            }
        } else {
            console.warn(`⚠️ No cart found in localStorage (attempt ${attempts})`);
        }
        
        // Wait a bit before retry
        if (attempts < maxAttempts) {
            console.log(`⏳ Waiting 100ms before retry...`);
            // Note: In real code, we'd use setTimeout, but for immediate check, we'll try getCart()
            const getCartData = getCart();
            if (getCartData && getCartData.length > 0) {
                console.log('✅ Using getCart() result:', getCartData);
                cartData = getCartData;
                break;
            }
        }
    }
    
    console.log('📦 Final cart data to render:', cartData);
    console.log('📊 Final cart length:', cartData ? cartData.length : 0);
    
    if (cartData && cartData.length > 0) {
        console.log('📋 Cart items:', cartData.map(item => `${item.name || 'Unknown'} x${item.quantity || 0}`).join(', '));
    }
    
    // Always call renderCartItems to read latest data from localStorage
    // renderCartItems() will handle empty cart case
    console.log('🚀 Rendering cart items (will read latest from localStorage)...');
    renderCartItems();
    updateCartCount();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Cart page DOMContentLoaded');
    console.log('⏰ Current time:', new Date().toISOString());
    
    // Always read fresh data from localStorage first
    const freshCart = getCart();
    console.log('📦 Fresh cart data on page load:', freshCart);
    console.log('📦 Fresh cart items with quantities:', freshCart.map(item => `${item.name}: quantity=${item.quantity}`));
    
    // Render cart immediately
    initializeCart();
    
    // Force refresh after a short delay to catch any late updates
    setTimeout(() => {
        console.log('🔄 Force refreshing cart after 200ms...');
        refreshCart();
    }, 200);
    
    // Refresh cart when page becomes visible (user navigates back to cart)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            console.log('👁️ Page became visible, refreshing cart...');
            refreshCart();
        }
    });
    
    // Refresh cart when window gains focus
    window.addEventListener('focus', function() {
        console.log('🎯 Window gained focus, refreshing cart...');
        refreshCart();
    });
    
    // Wait a bit for script.js to load products array, then enhance cart items
    setTimeout(function() {
        console.log('⏰ Timeout completed, enhancing cart items...');
        
        // Reload cart to ensure we have latest data
        let cartData = [];
        const rawCart = localStorage.getItem('cart');
        if (rawCart) {
            try {
                cartData = JSON.parse(rawCart);
                console.log('📦 Cart data after timeout:', cartData);
                console.log('📊 Cart data length after timeout:', cartData ? cartData.length : 0);
            } catch (e) {
                console.error('❌ Error parsing cart after timeout:', e);
            }
        }
        
        if (!cartData || cartData.length === 0) {
            console.warn('⚠️ Cart is empty after timeout!');
            // Re-render to show empty message
            initializeCart();
            return;
        }
        
        // Ensure all items have required properties
        let hasChanges = false;
        if (cartData && cartData.length > 0) {
            cartData.forEach((item, index) => {
                console.log(`Processing item ${index}:`, item);
                
                if (!item.stock) {
                    item.stock = Math.floor(Math.random() * 10) + 1;
                    hasChanges = true;
                }
                if (!item.variant) {
                    item.variant = 'Mặc định';
                    hasChanges = true;
                }
                if (!item.image || item.image === '') {
                    // Try to find image from products array
                    if (typeof products !== 'undefined' && products.length > 0) {
                        const product = products.find(p => p.id === item.id);
                        if (product && product.image) {
                            item.image = product.image;
                            hasChanges = true;
                            console.log(`Found image for item ${index}:`, product.image);
                        }
                    }
                    // If still no image, use placeholder
                    if (!item.image || item.image === '') {
                        item.image = 'https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image';
                        hasChanges = true;
                    }
                }
                // Ensure other required fields
                if (!item.name) item.name = 'Sản phẩm không tên';
                if (!item.price) item.price = 0;
                if (!item.quantity || item.quantity < 1) {
                    item.quantity = 1;
                    hasChanges = true;
                }
                // Ensure quantity is a number
                item.quantity = parseInt(item.quantity) || 1;
            });
            
            if (hasChanges) {
                console.log('Saving updated cart data');
                saveCart(cartData);
            }
        }
        
        console.log('Rendering cart items with data:', cartData);
        renderCartItems();
        updateCartCount();
        
        // Sync checkboxes
        const selectAll = document.getElementById('selectAll');
        const selectAllFooter = document.getElementById('selectAllFooter');
        if (selectAll && selectAllFooter) {
            selectAll.addEventListener('change', function() {
                selectAllFooter.checked = this.checked;
            });
            selectAllFooter.addEventListener('change', function() {
                selectAll.checked = this.checked;
            });
        }
        
        // Set up periodic refresh (every 2 seconds) to catch any updates
        setInterval(function() {
            const currentCart = getCart();
            const currentCount = currentCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
            const displayedCount = parseInt(document.getElementById('totalItems')?.textContent || '0');
            
            if (currentCount !== displayedCount) {
                console.log('Cart count mismatch detected! Refreshing...');
                console.log('Current count:', currentCount, 'Displayed count:', displayedCount);
                refreshCart();
            }
        }, 2000);
    }, 100); // Wait 100ms for scripts to load
});

