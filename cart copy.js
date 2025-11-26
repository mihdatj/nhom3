// ====== CART HELPER ======
function readCartFromStorage() {
    try {
        const raw = localStorage.getItem('cart');
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Lỗi đọc cart trong cart.js:', e);
        return [];
    }
}

function saveCartToStorage(cart) {
    try {
        localStorage.setItem('cart', JSON.stringify(cart || []));
    } catch (e) {
        console.error('Lỗi lưu cart trong cart.js:', e);
    }
}

// Cập nhật số lượng trên icon giỏ hàng
function updateCartCountHeader() {
    const el = document.querySelector('.cart-count');
    if (!el) return;
    const cart = readCartFromStorage();
    const totalQuantity = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    el.textContent = String(totalQuantity);
}

// Format tiền
function formatCurrency(value) {
    const number = Number(value) || 0;
    return number.toLocaleString('vi-VN') + '₫';
}

// Render danh sách item trong giỏ
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    if (!cartItemsContainer) return;

    const cart = readCartFromStorage();

    if (!cart.length) {
        cartItemsContainer.innerHTML = `
            <p class="empty-cart">Giỏ hàng của bạn đang trống.</p>
        `;
        updateCartSummary();
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => {
        const id = Number(item.id);
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const lineTotal = qty * price;

        const imgSrc = item.image && item.image.trim() !== ''
            ? item.image
            : 'https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image';

        const variantText = item.variant ? `<div class="cart-item-variant">${item.variant}</div>` : '';

        return `
            <div class="cart-item" data-id="${id}">
                <div class="cart-item-select">
                    <input type="checkbox" class="cart-item-checkbox" checked>
                </div>
                <div class="cart-item-image">
                    <img src="${imgSrc}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name || 'Sản phẩm'}</div>
                    ${variantText}
                </div>
                <div class="cart-item-price">
                    ${formatCurrency(price)}
                </div>
                <div class="cart-item-quantity">
                    <button class="qty-btn minus" data-id="${id}">-</button>
                    <input type="text" class="qty-input" value="${qty}" data-id="${id}">
                    <button class="qty-btn plus" data-id="${id}">+</button>
                </div>
                <div class="cart-item-total">
                    ${formatCurrency(lineTotal)}
                </div>
                <div class="cart-item-remove">
                    <button class="remove-btn" data-id="${id}">Xóa</button>
                </div>
            </div>
        `;
    }).join('');

    attachCartEventHandlers();
    updateCartSummary();
}

// Gắn event cho checkbox, nút +/-, nút Xóa
function attachCartEventHandlers() {
    // Checkbox thay đổi → cập nhật tổng
    document.querySelectorAll('.cart-item-checkbox').forEach(cb => {
        cb.addEventListener('change', updateCartSummary);
    });

    // Nút tăng/giảm
    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => changeItemQuantity(btn.dataset.id, +1));
    });
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => changeItemQuantity(btn.dataset.id, -1));
    });

    // Sửa trực tiếp ô input
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', () => {
            const id = input.dataset.id;
            let value = parseInt(input.value) || 1;
            if (value < 1) value = 1;
            input.value = value;
            setItemQuantity(id, value);
        });
    });

    // Xóa
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeCartItem(btn.dataset.id));
    });

    // Chọn tất cả (nếu có checkbox tổng)
    const selectAll = document.getElementById('selectAll');
    const selectAllFooter = document.getElementById('selectAllFooter');

    function toggleAll(checked) {
        document.querySelectorAll('.cart-item-checkbox').forEach(cb => {
            cb.checked = checked;
        });
        updateCartSummary();
    }

    if (selectAll) {
        selectAll.addEventListener('change', () => toggleAll(selectAll.checked));
    }
    if (selectAllFooter) {
        selectAllFooter.addEventListener('change', () => toggleAll(selectAllFooter.checked));
    }
}

// Đổi số lượng (+/-)
function changeItemQuantity(id, delta) {
    id = Number(id);
    let cart = readCartFromStorage();
    const item = cart.find(i => Number(i.id) === id);
    if (!item) return;

    const currentQty = Number(item.quantity) || 1;
    let newQty = currentQty + delta;
    if (newQty < 1) newQty = 1;
    item.quantity = newQty;

    saveCartToStorage(cart);
    renderCartItems();
    updateCartCountHeader();
}

// Set số lượng trực tiếp từ input
function setItemQuantity(id, qty) {
    id = Number(id);
    let cart = readCartFromStorage();
    const item = cart.find(i => Number(i.id) === id);
    if (!item) return;

    item.quantity = qty;
    saveCartToStorage(cart);
    renderCartItems();
    updateCartCountHeader();
}

// Xóa item khỏi giỏ
function removeCartItem(id) {
    id = Number(id);
    let cart = readCartFromStorage();
    cart = cart.filter(i => Number(i.id) !== id);
    saveCartToStorage(cart);
    renderCartItems();
    updateCartCountHeader();
}

// Cập nhật tổng tiền + tổng sp đã chọn
function updateCartSummary() {
    const cart = readCartFromStorage();

    const checkboxes = Array.from(document.querySelectorAll('.cart-item-checkbox'));
    const cartItems = Array.from(document.querySelectorAll('.cart-item'));

    let totalPrice = 0;
    let totalItems = 0;

    checkboxes.forEach((cb, index) => {
        if (!cb.checked) return;
        const row = cartItems[index];
        if (!row) return;

        const id = Number(row.dataset.id);
        const item = cart.find(i => Number(i.id) === id);
        if (!item) return;

        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;

        totalItems += qty;
        totalPrice += qty * price;
    });

    const selectedCountEl = document.getElementById('selectedCount');
    const cartTotalPriceEl = document.getElementById('cartTotalPrice');
    const totalItemsEl = document.getElementById('totalItems');

    if (selectedCountEl) selectedCountEl.textContent = String(totalItems);
    if (cartTotalPriceEl) cartTotalPriceEl.textContent = formatCurrency(totalPrice);
    if (totalItemsEl) totalItemsEl.textContent = String(totalItems);
}

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
    renderCartItems();
    updateCartCountHeader();

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            alert('Chức năng thanh toán đang được cập nhật.');
        });
    }
});
