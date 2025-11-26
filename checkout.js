// Checkout page functionality
let checkoutItems = [];
let subtotal = 0;
let shippingFee = 0;
let discount = 0;

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Load checkout items from localStorage
function loadCheckoutItems() {
    try {
        const savedItems = localStorage.getItem('checkoutItems');
        if (savedItems) {
            checkoutItems = JSON.parse(savedItems);
            console.log('Loaded checkout items:', checkoutItems);
        } else {
            // If no checkout items, try to get from cart
            if (typeof getCart === 'function') {
                const cartData = getCart();
                checkoutItems = cartData;
                console.log('No checkout items found, using all cart items:', checkoutItems);
            } else {
                console.warn('No checkout items and getCart function not available');
                checkoutItems = [];
            }
        }
        
        if (checkoutItems.length === 0) {
            alert('Giỏ hàng trống! Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.');
            window.location.href = 'cart.html';
            return;
        }
        
        renderCheckoutItems();
        calculateTotals();
    } catch (error) {
        console.error('Error loading checkout items:', error);
        alert('Lỗi khi tải thông tin đơn hàng. Vui lòng thử lại.');
        window.location.href = 'cart.html';
    }
}

// Render checkout items
function renderCheckoutItems() {
    const container = document.getElementById('checkoutItems');
    if (!container) return;
    
    if (checkoutItems.length === 0) {
        container.innerHTML = '<p>Không có sản phẩm nào</p>';
        return;
    }
    
    let html = '';
    checkoutItems.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        html += `
            <div class="checkout-item">
                <img src="${item.image || 'https://via.placeholder.com/80x80'}" 
                     alt="${item.name}" 
                     class="checkout-item-image"
                     onerror="this.src='https://via.placeholder.com/80x80/CCCCCC/666666?text=No+Image'">
                <div class="checkout-item-info">
                    <div class="checkout-item-name">${item.name || 'Sản phẩm không tên'}</div>
                    <div class="checkout-item-variant">Phân Loại Hàng: ${item.variant || 'Mặc định'}</div>
                    <div class="checkout-item-quantity">Số lượng: ${item.quantity || 1}</div>
                </div>
                <div class="checkout-item-price">${formatCurrency(itemTotal)}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Calculate totals
function calculateTotals() {
    // Calculate subtotal
    subtotal = checkoutItems.reduce((sum, item) => {
        return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);
    
    // Calculate shipping fee (free if subtotal >= 299000)
    if (subtotal >= 299000) {
        shippingFee = 0;
    } else {
        shippingFee = 30000; // Default shipping fee
    }
    
    // Calculate discount (if any)
    discount = 0; // Can be calculated based on vouchers, etc.
    
    // Update UI
    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('shippingFee').textContent = shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee);
    document.getElementById('discount').textContent = discount === 0 ? '0 ₫' : formatCurrency(-discount);
    
    const total = subtotal + shippingFee - discount;
    document.getElementById('totalAmount').textContent = formatCurrency(total);
    
    console.log('Totals calculated:', {
        subtotal,
        shippingFee,
        discount,
        total
    });
}

// Validate phone number
function validatePhone(input) {
    const phone = input.value.replace(/\D/g, ''); // Remove non-digits
    const phoneError = document.getElementById('phoneError');
    
    // Update input value to only contain digits
    input.value = phone;
    
    // Validate length
    if (phone.length > 0 && phone.length !== 10) {
        phoneError.style.display = 'block';
        input.setCustomValidity('Số điện thoại phải có đúng 10 chữ số');
    } else {
        phoneError.style.display = 'none';
        input.setCustomValidity('');
    }
}

// Bank data from link.txt with VNPay codes - All 47 banks
const banks = [
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/AMEX.svg', name: 'American Express', code: 'AMEX' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/JCB.svg', name: 'JCB', code: 'JCB' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/MASTERCARD.svg', name: 'Mastercard', code: 'MASTERCARD' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/UPI.svg', name: 'UnionPay', code: 'UPI' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/VISA.svg', name: 'VISA', code: 'VISA' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/abbank.svg', name: 'ABBANK', code: 'ABBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/acb.svg', name: 'ACB', code: 'ACB' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/agribank.svg', name: 'Agribank', code: 'AGRIBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/bacabank.svg', name: 'BAC A BANK', code: 'BACABANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/baovietbank.svg', name: 'BaoViet Bank', code: 'BAOVIETBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/bidv.svg', name: 'BIDV', code: 'BIDV' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/dongabank.svg', name: 'DongA Bank', code: 'DONGABANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/eximbank.svg', name: 'Eximbank', code: 'EXIMBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/gpbank.svg', name: 'GPBank', code: 'GPBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/hdbank.svg', name: 'HDBank', code: 'HDBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/hsbc.svg', name: 'HSBC', code: 'HSBC' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/ivb.svg', name: 'IVB', code: 'IVB' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/kienlongbank.svg', name: 'KienlongBank', code: 'KIENLONGBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/lienvietbank.svg', name: 'LienVietBank', code: 'LIENVIETBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/mafc.svg', name: 'Mirae Asset', code: 'MAFC' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/mbbank.svg', name: 'MB Bank', code: 'MB' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/msbank.svg', name: 'MSB', code: 'MSBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/namabank.svg', name: 'Nam A Bank', code: 'NAMABANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/ncb.svg', name: 'NCB', code: 'NCB' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/ocb.svg', name: 'OCB', code: 'OCB' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/pgbank.svg', name: 'PGBank', code: 'PGBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/pvcombank.svg', name: 'PVcomBank', code: 'PVCOMBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/sacombank.svg', name: 'Sacombank', code: 'SACOMBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/saigonbank.svg', name: 'SaigonBank', code: 'SAIGONBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/scb.svg', name: 'SCB', code: 'SCB' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/seabank.svg', name: 'SeABank', code: 'SEABANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/shb.svg', name: 'SHB', code: 'SHB' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/shinhanbank.svg', name: 'Shinhan Bank', code: 'SHINHANBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/techcombank.svg', name: 'Techcombank', code: 'TECHCOMBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/tpbank.svg', name: 'TPBank', code: 'TPBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/vib.svg', name: 'VIB', code: 'VIB' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/vidbank.svg', name: 'VIDBank', code: 'VIDBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/vietabank.svg', name: 'Viet A Bank', code: 'VIETABANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/vietbank.svg', name: 'VietBank', code: 'VIETBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/vietcapitalbank.svg', name: 'Viet Capital Bank', code: 'VIETCAPITALBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/vietcombank.svg', name: 'Vietcombank', code: 'VIETCOMBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/vietcredit.svg', name: 'VietCredit', code: 'VIETCREDIT' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/vietinbank.svg', name: 'VietinBank', code: 'VIETINBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/vpbank.svg', name: 'VPBank', code: 'VPBANK' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/vrb.svg', name: 'VRB', code: 'VRB' },
    { url: 'https://sandbox.vnpayment.vn/paymentv2/images/img/logos/bank/big/wooribank.svg', name: 'Woori Bank', code: 'WOORIBANK' }
];

let selectedBank = null;

function toggleBankSelection(paymentValue) {
    const bankSelection = document.getElementById('bankSelection');
    const bankCodeInput = document.getElementById('bankCode');
    if (!bankSelection || !bankCodeInput) {
        console.error('Bank selection elements not found');
        return;
    }

    if (paymentValue === 'bank') {
        bankSelection.style.display = 'block';
        // Always load grid when showing bank selection
        const grid = document.getElementById('bankGrid');
        if (grid) {
            // Check if grid is empty or only has comment
            const hasContent = grid.children.length > 0;
            if (!hasContent) {
                console.log('Loading bank grid...');
                loadBankGrid();
            } else {
                console.log('Bank grid already loaded');
            }
        } else {
            console.error('Bank grid element not found');
        }
    } else {
        bankSelection.style.display = 'none';
        bankCodeInput.value = '';
        selectedBank = null;
        // Clear search
        const searchInput = document.getElementById('bankSearchInput');
        if (searchInput) searchInput.value = '';
        filterBanks();
    }
}

function loadBankGrid() {
    const grid = document.getElementById('bankGrid');
    if (!grid) {
        console.error('Bank grid element not found');
        return;
    }
    
    console.log('Loading bank grid with', banks.length, 'banks');
    
    try {
        if (banks.length === 0) {
            console.error('No banks data available');
            grid.innerHTML = '<p>Không có dữ liệu ngân hàng</p>';
            return;
        }
        
        let html = '';
        banks.forEach((bank, index) => {
            // Escape special characters for safe HTML
            const safeName = bank.name.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            html += `
                <div class="bank-item" data-bank-code="${bank.code}" data-bank-name="${safeName}" data-bank-url="${bank.url}">
                    <img src="${bank.url}" alt="${safeName}" onerror="this.src='https://via.placeholder.com/120x50/CCCCCC/666666?text=${encodeURIComponent(bank.name)}'">
                    <div class="bank-item-name">${bank.name}</div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
        console.log('Bank grid HTML set, items:', grid.children.length);
        
        // Add click event listeners to all bank items
        const bankItems = grid.querySelectorAll('.bank-item');
        console.log('Found', bankItems.length, 'bank items to attach listeners');
        bankItems.forEach(item => {
            item.addEventListener('click', function() {
                try {
                    const code = this.dataset.bankCode;
                    const name = this.dataset.bankName;
                    const url = this.dataset.bankUrl;
                    if (code && name && url) {
                        selectBank(code, name, url);
                    } else {
                        console.error('Missing bank data:', { code, name, url });
                    }
                } catch (error) {
                    console.error('Error selecting bank:', error);
                }
            });
        });
    } catch (error) {
        console.error('Error loading bank grid:', error);
        grid.innerHTML = '<p style="color: red;">Lỗi khi tải danh sách ngân hàng</p>';
    }
}

function selectBank(code, name, url) {
    try {
        if (!code || !name || !url) {
            console.error('Invalid bank data:', { code, name, url });
            return;
        }
        
        selectedBank = { code, name, url };
        const bankCodeInput = document.getElementById('bankCode');
        if (bankCodeInput) {
            bankCodeInput.value = code;
        }
        
        // Update selected state in grid
        const bankItems = document.querySelectorAll('.bank-item');
        bankItems.forEach(item => {
            if (item.dataset.bankCode === code) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
        
        console.log('Bank selected:', selectedBank);
    } catch (error) {
        console.error('Error selecting bank:', error);
    }
}

function filterBanks() {
    const searchInput = document.getElementById('bankSearchInput');
    if (!searchInput) return;
    
    const searchTerm = (searchInput.value || '').toLowerCase().trim();
    const bankItems = document.querySelectorAll('.bank-item');
    
    if (bankItems.length === 0) return;
    
    bankItems.forEach(item => {
        const bankName = (item.dataset.bankName || '').toLowerCase();
        if (bankName.includes(searchTerm)) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

async function startVnpayPayment(orderData) {
    try {
        const response = await fetch('http://localhost:5000/api/vnpay/create_payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: orderData.orderId,
                amount: orderData.totals.total,
                orderDescription: `Thanh toan don hang ${orderData.orderId}`,
                bankCode: orderData.bankCode || null
            })
        });

        if (!response.ok) {
            throw new Error('Cannot create VNPAY payment');
        }

        const data = await response.json();
        if (data.payment_url) {
            localStorage.setItem('pendingOrder', JSON.stringify(orderData));
            window.location.href = data.payment_url;
            return true;
        }

        alert('Không nhận được URL thanh toán từ VNPAY.');
        return false;
    } catch (error) {
        console.error('VNPAY payment error:', error);
        alert('Không thể kết nối VNPAY. Hệ thống sẽ đặt hàng thủ công.');
        return false;
    }
}

// Place order
async function placeOrder() {
    // Validate phone number first
    const phoneInput = document.getElementById('phone');
    const phone = phoneInput.value.replace(/\D/g, ''); // Remove non-digits
    
    if (phone.length !== 10) {
        phoneInput.focus();
        phoneInput.setCustomValidity('Số điện thoại phải có đúng 10 chữ số');
        phoneInput.reportValidity();
        document.getElementById('phoneError').style.display = 'block';
        return;
    }
    
    // Validate form
    const form = document.getElementById('deliveryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const orderId = 'ORD' + Date.now();
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const bankCodeInput = document.getElementById('bankCode');
    let selectedBankCode = '';
    if (paymentMethod === 'bank') {
        selectedBankCode = bankCodeInput ? bankCodeInput.value : '';
        if (!selectedBankCode) {
            alert('Vui lòng chọn ngân hàng để tiếp tục.');
            // Scroll to bank selection
            const bankSelection = document.getElementById('bankSelection');
            if (bankSelection) {
                bankSelection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
    }

    const orderData = {
        items: checkoutItems,
        customer: {
            fullName: document.getElementById('fullName').value,
            phone: phone, // Use cleaned phone number
            province: document.getElementById('province').value,
            district: document.getElementById('district').value,
            ward: document.getElementById('ward').value,
            address: document.getElementById('address').value,
            notes: document.getElementById('notes').value
        },
        payment: paymentMethod,
        bankCode: selectedBankCode,
        totals: {
            subtotal: subtotal,
            shippingFee: shippingFee,
            discount: discount,
            total: subtotal + shippingFee - discount
        },
        orderDate: new Date().toISOString(),
        orderId: orderId,
        status: 'pending'
    };
    
    console.log('Placing order:', orderData);

    const paymentStarted = await startVnpayPayment(orderData);
    if (paymentStarted) {
        return;
    }
    
    // Save order to localStorage (for demo purposes)
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Remove checkout items from cart
    if (typeof getCart === 'function' && typeof saveCartToStorage === 'function') {
        const cartData = getCart();
        const itemIds = checkoutItems.map(item => parseInt(item.id));
        const remainingItems = cartData.filter(item => !itemIds.includes(parseInt(item.id)));
        saveCartToStorage(remainingItems);
    }
    
    // Clear checkout items
    localStorage.removeItem('checkoutItems');
    
    // Show success message
    alert('Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại Nhóm 3.\n\nMã đơn hàng: ' + orderId);
    // Redirect to home page
    window.location.href = 'index.html';
}

// Update cart count
function updateCartCount() {
    const cartCountEl = document.querySelector('.cart-count');
    if (cartCountEl) {
        let currentCart = [];
        if (typeof readCartFromStorage === 'function') {
            currentCart = readCartFromStorage();
        } else {
            try {
                const raw = localStorage.getItem('cart');
                currentCart = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(currentCart)) {
                    currentCart = [];
                }
            } catch (error) {
                console.error('Error reading cart for count:', error);
                currentCart = [];
            }
        }
        const cartCount = currentCart.length;
        cartCountEl.textContent = cartCount;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Checkout page loaded');
    loadCheckoutItems();
    updateCartCount();
    
    // Update shipping fee when province changes
    document.getElementById('province').addEventListener('change', function() {
        calculateTotals();
    });
    
    // Add phone input validation on keypress (only allow numbers)
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('keypress', function(e) {
            // Only allow numbers
            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        // Validate on blur
        phoneInput.addEventListener('blur', function() {
            validatePhone(this);
        });
    }

    // Payment method change handler
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    paymentRadios.forEach(function(radio) {
        radio.addEventListener('change', function() {
            toggleBankSelection(this.value);
        });
    });
    
    // Check initial state and load grid if needed
    const initiallyChecked = document.querySelector('input[name="payment"]:checked');
    if (initiallyChecked) {
        console.log('Initial payment method:', initiallyChecked.value);
        toggleBankSelection(initiallyChecked.value);
    } else {
        // If bank is selected by default, load grid
        setTimeout(function() {
            const bankSelection = document.getElementById('bankSelection');
            if (bankSelection && bankSelection.style.display !== 'none') {
                console.log('Bank selection visible, loading grid...');
                loadBankGrid();
            }
        }, 100);
    }
});

