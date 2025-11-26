// Product detail page functionality
let currentProduct = null;
let selectedQuantity = 1;

// Load product details from URL parameter
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (productId) {
        loadProductDetail(productId);
    } else {
        // Redirect to home if no product ID
        window.location.href = '/';
    }
    
    // Update cart count
    updateCartCount();
});

// Load product detail
function loadProductDetail(productId) {
    // Normalize productId to number for comparison
    const normalizedId = parseInt(productId);
    currentProduct = products.find(p => parseInt(p.id) === normalizedId);
    
    if (!currentProduct) {
        console.error('Product not found with ID:', productId);
        alert('Sản phẩm không tồn tại!');
        window.location.href = '/';
        return;
    }
    
    console.log('✅ Product loaded:', currentProduct.name, 'ID:', currentProduct.id);
    
    // Update page title
    document.title = `${currentProduct.name} - Nhóm 3`;
    
    // Update breadcrumb
    document.getElementById('breadcrumbCategory').textContent = currentProduct.category;
    document.getElementById('breadcrumbProduct').textContent = currentProduct.name;
    
    // Update product image - fix path if needed
    let productImage = currentProduct.image || '';
    if (productImage && productImage.startsWith('img/')) {
        productImage = '/static/images/img/' + productImage.substring(4);
    } else if (productImage && !productImage.startsWith('/static/') && !productImage.startsWith('http')) {
        productImage = '/static/images/' + productImage;
    }
    document.getElementById('productMainImage').src = productImage;
    document.getElementById('productMainImage').alt = currentProduct.name;
    
    // Update product name
    document.getElementById('productName').textContent = currentProduct.name;
    
    // Update price
    document.getElementById('productPrice').textContent = formatCurrency(currentProduct.price);
    document.getElementById('productOriginalPrice').textContent = formatCurrency(currentProduct.originalPrice);
    document.getElementById('productDiscount').textContent = `-${currentProduct.discount}%`;
    
    // Update description
    if (currentProduct.description) {
        document.getElementById('productDescription').innerHTML = formatDescription(currentProduct.description);
    } else {
        document.getElementById('productDescription').innerHTML = '<p>Thông tin chi tiết sản phẩm đang được cập nhật...</p>';
    }
    
    // Load variants (if any)
    loadProductVariants();
}

// Format description text
function formatDescription(description) {
    if (!description) return '';
    
    let html = '';
    const lines = description.split('\n');
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Check if line is a heading
        if (line.includes('Công dụng:') || line.includes('Công Dụng:')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += '<h3>Công dụng</h3>';
        } else if (line.includes('Cách sử dụng:') || line.includes('Hướng dẫn sử dụng:')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += '<h3>Cách sử dụng</h3>';
        } else if (line.includes('Mô tả:') || line.includes('Mô tả :')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            // Skip the "Mô tả:" label itself
            continue;
        } else if (line.startsWith('-') || line.startsWith('•')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            const content = line.substring(1).trim();
            html += `<li>${content}</li>`;
        } else {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += `<p>${line}</p>`;
        }
    }
    
    if (inList) {
        html += '</ul>';
    }
    
    return html;
}

// Load product variants
function loadProductVariants() {
    const variantsContainer = document.getElementById('productVariants');
    if (!variantsContainer) return;
    
    // Default variants based on product
    const defaultVariants = [
        'Size 0.8-1kg',
        'Size 1.0-1.2kg',
        'Size 1.2-1.4kg',
        'Size 1.4-1.6kg',
        'Size 1.6-1.8kg',
        'Size 1.8-2kg'
    ];
    
    // For now, use default variants
    variantsContainer.innerHTML = defaultVariants.map((variant, index) => 
        `<div class="variant-option ${index === 1 ? 'selected' : ''}" onclick="selectVariant(this)">${variant}</div>`
    ).join('');
}

// Select region
let selectedRegion = 'Hà Nội';

function selectRegion(element, region) {
    // Remove selected class from all region options
    const regionOptions = document.getElementById('regionOptions');
    if (regionOptions) {
        const options = regionOptions.querySelectorAll('.variant-option');
        options.forEach(opt => opt.classList.remove('selected'));
    }
    
    // Add selected class to clicked option
    element.classList.add('selected');
    selectedRegion = region;
}

// Select variant
function selectVariant(element) {
    // Remove selected class from all variants in the same group
    const variants = element.parentElement.querySelectorAll('.variant-option');
    variants.forEach(v => v.classList.remove('selected'));
    
    // Add selected class to clicked variant
    element.classList.add('selected');
}

// Quantity functions
function increaseQuantity() {
    const quantityInput = document.getElementById('productQuantity');
    let quantity = parseInt(quantityInput.value) || 1;
    quantity++;
    quantityInput.value = quantity;
    selectedQuantity = quantity;
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('productQuantity');
    let quantity = parseInt(quantityInput.value) || 1;
    if (quantity > 1) {
        quantity--;
        quantityInput.value = quantity;
        selectedQuantity = quantity;
    }
}

// Update quantity when input changes
document.addEventListener('DOMContentLoaded', function() {
    const quantityInput = document.getElementById('productQuantity');
    if (quantityInput) {
        // Update on change
        quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value) || 1;
            if (value < 1) {
                value = 1;
                this.value = 1;
            }
            selectedQuantity = value;
            console.log('Quantity changed to:', selectedQuantity);
        });
        
        // Update on input (real-time)
        quantityInput.addEventListener('input', function() {
            let value = parseInt(this.value) || 1;
            if (value < 1) {
                value = 1;
            }
            selectedQuantity = value;
        });
    }
});

// Add to cart from detail page
function addToCartFromDetail() {
    if (!currentProduct) {
        alert("Không tìm thấy sản phẩm!");
        return;
    }

    const quantityInput = document.getElementById("productQuantity");
    const quantityToAdd = parseInt(quantityInput.value) || 1;

    // Đọc giỏ hàng hiện tại
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const productId = Number(currentProduct.id);

    // Kiểm tra xem SP đã tồn tại chưa
    let existingIndex = cart.findIndex(item => Number(item.id) === productId);

    if (existingIndex !== -1) {
        // 👉 Nếu có → tăng số lượng
        cart[existingIndex].quantity += quantityToAdd;
    } else {
        // 👉 Thêm mới đúng format mà cart.js yêu cầu
        // Fix image path if needed
        let imageUrl = currentProduct.image || '';
        if (imageUrl && imageUrl.startsWith('img/')) {
            imageUrl = '/static/images/img/' + imageUrl.substring(4);
        } else if (imageUrl && !imageUrl.startsWith('/static/') && !imageUrl.startsWith('http')) {
            imageUrl = '/static/images/' + imageUrl;
        }
        
        const newItem = {
            id: productId,
            name: currentProduct.name,
            price: currentProduct.price,
            image: imageUrl,
            quantity: quantityToAdd,
            variant: "Mặc định",
            stock: 99 // hoặc số thật nếu bạn có
        };
        
        console.log('🛒 Adding new item to cart:', newItem);
        console.log('   Product ID:', productId, 'Type:', typeof productId);
        console.log('   Product Name:', currentProduct.name);
        console.log('   Product Price:', currentProduct.price);
        console.log('   Image URL:', imageUrl);
        
        cart.push(newItem);
    }

    // Lưu lại
    console.log('💾 Saving cart to localStorage:', cart);
    localStorage.setItem("cart", JSON.stringify(cart));
    
    // Verify save
    const verifyCart = JSON.parse(localStorage.getItem("cart") || "[]");
    console.log('✅ Verified cart in localStorage:', verifyCart);
    const addedItem = verifyCart.find(item => Number(item.id) === Number(productId));
    if (addedItem) {
        console.log('✅ Verified added item:', addedItem);
    } else {
        console.error('❌ ERROR: Added item not found in localStorage!');
    }

    // Show notification
    if (typeof showNotification === "function") {
        showNotification(`Đã thêm ${quantityToAdd} ${currentProduct.name} vào giỏ hàng!`);
    }

    // Update cart count
    if (typeof updateCartCount === "function") {
        updateCartCount();
    }

    if (typeof updateCartUI === "function") {
        updateCartUI();
    }
}

// Buy now
function buyNow() {
    addToCartFromDetail();
    setTimeout(() => {
        window.location.href = '/cart';
    }, 500);
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
        // Count unique products by ID, not total quantity
        const cartCount = currentCart.length;
        cartCountEl.textContent = cartCount;
        console.log('Cart count updated to:', cartCount, '(unique products)');
    }
}

function saveCartToStorage(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}
