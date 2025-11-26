// Get category from URL parameter
function getCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('cat') || '';
    // Decode and handle multiple decoding if needed
    try {
        return decodeURIComponent(category);
    } catch (e) {
        // If already decoded or error, return as is
        return category;
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Create product card
function createProductCard(product) {
    return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/200x200/CCCCCC/666666?text=No+Image'">
            <div class="product-name">${product.name}</div>
            <div class="product-price">${formatCurrency(product.price)}</div>
            <div class="product-original-price">${formatCurrency(product.originalPrice)}</div>
            <div class="product-discount">-${product.discount}%</div>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                Thêm Vào Giỏ
            </button>
        </div>
    `;
}

// Filter products by category
let filteredProducts = [];
let currentFilter = 'all';
let currentSort = 'default';
let currentPage = 1;
const productsPerPage = 12;
let minPriceFilter = null;
let maxPriceFilter = null;
let ratingFilter = [];
let promotionFilters = [];

function resetAllFilters() {
    // Reset filter variables
    minPriceFilter = null;
    maxPriceFilter = null;
    ratingFilter = [];
    promotionFilters = [];
    currentFilter = 'all';
    currentPage = 1;
    currentSort = 'default';
    
    // Reset filter inputs - check if elements exist
    const minInput = document.getElementById('minPrice');
    const maxInput = document.getElementById('maxPrice');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';
    
    // Reset checkboxes - check if elements exist
    try {
        document.querySelectorAll('.rating-filter input[type="checkbox"]').forEach(cb => {
            if (cb) cb.checked = false;
        });
        document.querySelectorAll('.promotion-filter input[type="checkbox"]').forEach(cb => {
            if (cb) cb.checked = false;
        });
    } catch (e) {
        console.warn('Could not reset checkboxes:', e);
    }
    
    // Reset filter buttons
    try {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn) allBtn.classList.add('active');
    } catch (e) {
        console.warn('Could not reset filter buttons:', e);
    }
    
    // Reset sort
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.value = 'default';
    }
}

function filterProductsByCategory() {
    const category = getCategoryFromURL();
    if (!category) {
        window.location.href = 'index.html';
        return;
    }

    // Reset all filters when changing category
    resetAllFilters();

    // Update page title and breadcrumb - check if elements exist
    const categoryNameEl = document.getElementById('categoryName');
    const categoryTitleEl = document.getElementById('categoryTitle');
    
    if (categoryNameEl) categoryNameEl.textContent = category;
    if (categoryTitleEl) categoryTitleEl.textContent = category;
    document.title = `${category} - Nhóm 3`;

    // Filter products - try multiple matching strategies
    filteredProducts = [];
    
    if (products && products.length > 0) {
        filteredProducts = products.filter(p => {
            if (!p.category) return false;
            // Exact match
            if (p.category === category) return true;
            // Try with normalized spaces around &
            const normalizedCategory = category.replace(/\s*&\s*/g, ' & ').trim();
            const normalizedProductCategory = p.category.replace(/\s*&\s*/g, ' & ').trim();
            if (normalizedProductCategory === normalizedCategory) return true;
            // Try case-insensitive match
            if (p.category.toLowerCase().trim() === category.toLowerCase().trim()) return true;
            return false;
        });
    }
    
    // Debug log
    console.log('Category from URL:', category);
    console.log('Total products:', products ? products.length : 0);
    console.log('Filtered products count:', filteredProducts.length);
    if (products) {
        console.log('All product categories:', [...new Set(products.map(p => p.category))]);
    }
    
    applyFilters();
}

function applyFilters() {
    let displayProducts = [...filteredProducts];

    // Apply main filter
    if (currentFilter === 'discount') {
        displayProducts = displayProducts.filter(p => p.discount > 0);
    } else if (currentFilter === 'new') {
        // For demo, we'll consider products with ID > 6 as new
        displayProducts = displayProducts.filter(p => p.id > 6);
    }

    // Apply price filter
    if (minPriceFilter !== null) {
        displayProducts = displayProducts.filter(p => p.price >= minPriceFilter);
    }
    if (maxPriceFilter !== null) {
        displayProducts = displayProducts.filter(p => p.price <= maxPriceFilter);
    }

    // Apply rating filter (if products had rating property)
    // For now, we'll skip this as products don't have rating yet

    // Apply promotion filters
    if (promotionFilters.includes('discount')) {
        displayProducts = displayProducts.filter(p => p.discount > 0);
    }

    // Apply sort
    switch (currentSort) {
        case 'price-asc':
            displayProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            displayProducts.sort((a, b) => b.price - a.price);
            break;
        case 'discount-desc':
            displayProducts.sort((a, b) => b.discount - a.discount);
            break;
        case 'name-asc':
            displayProducts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
            break;
        case 'name-desc':
            displayProducts.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
            break;
        default:
            // Keep original order
            break;
    }

    // Update product count
    document.getElementById('productCount').textContent = `${displayProducts.length} sản phẩm`;

    // Pagination
    const totalPages = Math.ceil(displayProducts.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = displayProducts.slice(startIndex, endIndex);

    // Display products
    const container = document.getElementById('categoryProducts');
    if (paginatedProducts.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Không tìm thấy sản phẩm nào.</p>';
    } else {
        container.innerHTML = paginatedProducts.map(product => createProductCard(product)).join('');
    }

    // Update pagination
    updatePagination(totalPages);
}

function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    
    // Previous button
    html += `<button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="changePage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
    </button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span>...</span>`;
        }
    }

    // Next button
    html += `<button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="changePage(${currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
    </button>`;

    pagination.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(getFilteredProductsCount() / productsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function getFilteredProductsCount() {
    let displayProducts = [...filteredProducts];

    // Apply main filter
    if (currentFilter === 'discount') {
        displayProducts = displayProducts.filter(p => p.discount > 0);
    } else if (currentFilter === 'new') {
        displayProducts = displayProducts.filter(p => p.id > 6);
    }

    // Apply price filter
    if (minPriceFilter !== null) {
        displayProducts = displayProducts.filter(p => p.price >= minPriceFilter);
    }
    if (maxPriceFilter !== null) {
        displayProducts = displayProducts.filter(p => p.price <= maxPriceFilter);
    }

    // Apply promotion filters
    if (promotionFilters.includes('discount')) {
        displayProducts = displayProducts.filter(p => p.discount > 0);
    }

    return displayProducts.length;
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    filterProductsByCategory();

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            currentPage = 1;
            applyFilters();
        });
    });

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            currentPage = 1;
            applyFilters();
        });
    }

    // Cart functionality (reuse from script.js)
    const cartIcon = document.querySelector('.cart-icon');
    const cartModal = document.getElementById('cartModal');
    const closeModal = document.querySelector('.close');

    if (cartIcon && cartModal) {
        cartIcon.addEventListener('click', () => {
            cartModal.style.display = 'block';
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (cartModal) {
                cartModal.style.display = 'none';
            }
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });

    // Update cart UI
    updateCartUI();
});

// Price filter functions
function setPriceRange(min, max) {
    const minInput = document.getElementById('minPrice');
    const maxInput = document.getElementById('maxPrice');
    
    if (minInput && maxInput) {
        minInput.value = min !== null && min !== undefined ? min : '';
        maxInput.value = max !== null && max !== undefined ? max : '';
        applyPriceFilter();
    }
}

function applyPriceFilter() {
    const minInput = document.getElementById('minPrice');
    const maxInput = document.getElementById('maxPrice');
    
    if (!minInput || !maxInput) return;
    
    const minValue = minInput.value.trim();
    const maxValue = maxInput.value.trim();
    
    minPriceFilter = minValue ? parseInt(minValue) : null;
    maxPriceFilter = maxValue ? parseInt(maxValue) : null;
    
    // Validate
    if (minPriceFilter !== null && isNaN(minPriceFilter)) {
        alert('Giá tối thiểu không hợp lệ');
        minInput.focus();
        return;
    }
    
    if (maxPriceFilter !== null && isNaN(maxPriceFilter)) {
        alert('Giá tối đa không hợp lệ');
        maxInput.focus();
        return;
    }
    
    if (minPriceFilter !== null && minPriceFilter < 0) {
        alert('Giá không thể âm');
        minInput.focus();
        return;
    }
    
    if (maxPriceFilter !== null && maxPriceFilter < 0) {
        alert('Giá không thể âm');
        maxInput.focus();
        return;
    }
    
    if (minPriceFilter !== null && maxPriceFilter !== null && minPriceFilter > maxPriceFilter) {
        alert('Giá tối thiểu không thể lớn hơn giá tối đa');
        return;
    }
    
    currentPage = 1;
    applyFilters();
}

// Rating filter function
function applyRatingFilter() {
    const checkboxes = document.querySelectorAll('.rating-filter input[type="checkbox"]:checked');
    ratingFilter = Array.from(checkboxes).map(cb => parseInt(cb.value));
    currentPage = 1;
    applyFilters();
}

// Promotion filter function
function applyPromotionFilter() {
    const checkboxes = document.querySelectorAll('.promotion-filter input[type="checkbox"]:checked');
    promotionFilters = Array.from(checkboxes).map(cb => cb.value);
    currentPage = 1;
    applyFilters();
}

// Update cart UI (reuse from script.js)
function updateCartUI() {
    // Always read from localStorage to get latest data
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
            console.error('Error reading cart:', error);
            currentCart = [];
        }
    }
    
    // Update global cart variable if it exists
    if (typeof cart !== 'undefined') {
        cart = currentCart;
    }
    
    const cartCountEl = document.querySelector('.cart-count');
    if (cartCountEl) {
        // Count unique products by ID, not total quantity
        const cartCount = currentCart.length;
        cartCountEl.textContent = cartCount;
    }
    
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        if (currentCart.length === 0) {
            cartItems.innerHTML = '<p>Giỏ hàng trống</p>';
        } else {
            cartItems.innerHTML = currentCart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${formatCurrency(item.price)}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart(${item.id})" style="background: red; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Xóa</button>
                </div>
            `).join('');
        }
    }
    
    const cartTotalEl = document.getElementById('cartTotal');
    if (cartTotalEl) {
        const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalEl.textContent = formatCurrency(total);
    }
}

