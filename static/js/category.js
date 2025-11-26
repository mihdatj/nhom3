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
    // Đảm bảo tất cả các trường cần thiết
    const productId = product.id || 0;
    const productName = product.name || 'Sản phẩm không tên';
    const productPrice = product.price || 0;
    const productOriginalPrice = product.originalPrice || productPrice;
    const productDiscount = product.discount || 0;
    const productImage = product.image || 'https://via.placeholder.com/200x200/CCCCCC/666666?text=No+Image';
    
    return `
        <div class="product-card" data-product-id="${productId}">
            <a href="/product-detail?id=${productId}" style="text-decoration: none; color: inherit;">
                <img src="${productImage}" alt="${productName}" class="product-image" onerror="this.src='https://via.placeholder.com/200x200/CCCCCC/666666?text=No+Image'">
                <div class="product-name">${productName}</div>
            </a>
            <div class="product-price">${formatCurrency(productPrice)}</div>
            ${productOriginalPrice > productPrice ? `<div class="product-original-price">${formatCurrency(productOriginalPrice)}</div>` : ''}
            ${productDiscount > 0 ? `<div class="product-discount">-${productDiscount}%</div>` : ''}
            <button class="add-to-cart-btn" onclick="addToCart(${productId}); return false;">
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
        window.location.href = '/';
        return;
    }
    
    console.log('🔍 Filtering products for category:', category);

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
    
    if (!products || products.length === 0) {
        console.error('❌ Products array is not defined or empty!');
        console.error('   Products:', products);
        applyFilters();
        return;
    }
    
    // Normalize category name for comparison
    const normalizedCategory = category.trim();
    console.log('🔍 Starting filter with category:', normalizedCategory);
    console.log('   Total products available:', products.length);
    
    // Get all unique categories from products
    const allCategories = [...new Set(products.map(p => p.category).filter(c => c))];
    console.log('📋 All categories in products:', allCategories);
    console.log('   Looking for category:', normalizedCategory);
    console.log('   Category exists:', allCategories.includes(normalizedCategory));
    
    filteredProducts = products.filter(p => {
        if (!p.category) {
            console.warn('⚠️ Product without category:', p.name || p.id);
            return false;
        }
        
        const productCategory = p.category.trim();
        
        // Exact match
        if (productCategory === normalizedCategory) {
            return true;
        }
        
        // Try with normalized spaces around &
        const normalizedCategoryWithSpaces = normalizedCategory.replace(/\s*&\s*/g, ' & ').trim();
        const normalizedProductCategory = productCategory.replace(/\s*&\s*/g, ' & ').trim();
        if (normalizedProductCategory === normalizedCategoryWithSpaces) {
            return true;
        }
        
        // Try case-insensitive match
        if (productCategory.toLowerCase() === normalizedCategory.toLowerCase()) {
            return true;
        }
        
        return false;
    });
    
    // Debug log
    console.log('✅ Filtering complete:');
    console.log('   Category from URL:', category);
    console.log('   Normalized category:', normalizedCategory);
    console.log('   Filtered products count:', filteredProducts.length);
    
    if (filteredProducts.length === 0) {
        console.warn('⚠️ No products found for category:', category);
        console.warn('   Available categories:', allCategories);
        console.warn('   Try checking category name spelling and spaces');
        
        // Show first few products for debugging
        if (products.length > 0) {
            console.log('   Sample products:', products.slice(0, 3).map(p => ({
                name: p.name,
                category: p.category
            })));
        }
    } else {
        console.log('✅ Found products:', filteredProducts.map(p => p.name));
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
    const productCountEl = document.getElementById('productCount');
    if (productCountEl) {
        productCountEl.textContent = `${displayProducts.length} sản phẩm`;
    }

    // Pagination
    const totalPages = Math.ceil(displayProducts.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = displayProducts.slice(startIndex, endIndex);

    // Display products
    const container = document.getElementById('categoryProducts');
    if (!container) {
        console.error('❌ Container #categoryProducts not found!');
        return;
    }
    
    if (paginatedProducts.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Không tìm thấy sản phẩm nào.</p>';
    } else {
        console.log(`📦 Rendering ${paginatedProducts.length} products`);
        container.innerHTML = paginatedProducts.map(product => {
            // Fix image path if needed
            let imageUrl = product.image || '';
            if (imageUrl && imageUrl.startsWith('img/')) {
                imageUrl = '/static/images/img/' + imageUrl.substring(4);
            } else if (imageUrl && !imageUrl.startsWith('/static/') && !imageUrl.startsWith('http')) {
                imageUrl = '/static/images/' + imageUrl;
            }
            
            return createProductCard({
                ...product,
                image: imageUrl
            });
        }).join('');
    }

    // Update pagination
    updatePagination(totalPages);
}

function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
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
    console.log('📂 Category page loaded');
    
    let retryCount = 0;
    const maxRetries = 20; // Try up to 20 times (2 seconds total)
    
    // Function to check and filter products
    function checkAndFilter() {
        retryCount++;
        console.log(`🔍 Checking products array... (attempt ${retryCount}/${maxRetries})`);
        console.log('   Products defined:', typeof products !== 'undefined');
        console.log('   Products length:', typeof products !== 'undefined' ? products.length : 0);
        
        if (typeof products === 'undefined' || !products || products.length === 0) {
            if (retryCount < maxRetries) {
                console.log(`⏳ Products not ready, retrying in 100ms...`);
                setTimeout(checkAndFilter, 100);
                return false;
            } else {
                console.error('❌ Products array is not loaded after', maxRetries, 'attempts!');
                const container = document.getElementById('categoryProducts');
                if (container) {
                    container.innerHTML = '<p style="text-align: center; padding: 40px; color: #e74c3c;">Lỗi: Không thể tải danh sách sản phẩm. Vui lòng tải lại trang.</p>';
                }
                return false;
            }
        }
        
        // Products are ready!
        console.log('✅ Products loaded successfully:', products.length, 'products');
        
        // Log all categories in products
        const allCategories = [...new Set(products.map(p => p.category).filter(c => c))];
        console.log('📋 All categories in products:', allCategories);
        
        // Get category from URL
        const category = getCategoryFromURL();
        console.log('🎯 Category from URL:', category);
        console.log('   Category exists in products:', allCategories.includes(category));
        
        filterProductsByCategory();
        return true;
    }
    
    // Start checking immediately
    checkAndFilter();

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
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    } else {
        // Fallback update cart count
        const cartCountEl = document.querySelector('.cart-count');
        if (cartCountEl) {
            try {
                const raw = localStorage.getItem('cart');
                const cart = raw ? JSON.parse(raw) : [];
                cartCountEl.textContent = cart.length || 0;
            } catch (e) {
                console.error('Error updating cart count:', e);
            }
        }
    }
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

