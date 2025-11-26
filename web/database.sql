-- ============================================
-- CSDL CHO WEBSITE BÁN HÀNG SHOPEE
-- ============================================

-- Tạo database
CREATE DATABASE IF NOT EXISTS shopee_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopee_db;

-- ============================================
-- BẢNG DANH MỤC SẢN PHẨM
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(100),
    description TEXT,
    parent_id INT DEFAULT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG SẢN PHẨM
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    category_id INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    original_price DECIMAL(15, 2) NOT NULL,
    discount_percent INT DEFAULT 0,
    stock INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    image VARCHAR(255),
    images TEXT, -- JSON array of image URLs
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_flash_sale BOOLEAN DEFAULT FALSE,
    weight DECIMAL(10, 2),
    dimensions VARCHAR(100),
    brand VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_category (category_id),
    INDEX idx_slug (slug),
    INDEX idx_price (price),
    INDEX idx_discount (discount_percent),
    INDEX idx_featured (is_featured),
    INDEX idx_active (is_active),
    FULLTEXT idx_search (name, description, short_description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG BIẾN THỂ SẢN PHẨM (Màu sắc, Size, v.v.)
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_name VARCHAR(255) NOT NULL, -- VD: "Màu đỏ - Size L"
    price DECIMAL(15, 2),
    stock INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    image VARCHAR(255),
    attributes JSON, -- {"color": "Đỏ", "size": "L"}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG NGƯỜI DÙNG
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    role ENUM('customer', 'seller', 'admin') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG ĐỊA CHỈ GIAO HÀNG
-- ============================================
CREATE TABLE IF NOT EXISTS addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    street VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG GIỎ HÀNG
-- ============================================
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(255), -- Cho khách vãng lai
    product_id INT NOT NULL,
    variant_id INT DEFAULT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(15, 2) NOT NULL, -- Giá tại thời điểm thêm vào giỏ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_product (product_id),
    UNIQUE KEY unique_cart_item (user_id, product_id, variant_id),
    UNIQUE KEY unique_session_cart_item (session_id, product_id, variant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG ĐƠN HÀNG
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id INT,
    session_id VARCHAR(255), -- Cho khách vãng lai
    status ENUM('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    subtotal DECIMAL(15, 2) NOT NULL,
    shipping_fee DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    shipping_address JSON NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG CHI TIẾT ĐƠN HÀNG
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT DEFAULT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(255),
    price DECIMAL(15, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG ĐÁNH GIÁ SẢN PHẨM
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images TEXT, -- JSON array of image URLs
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_user (user_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG BANNER/QUẢNG CÁO
-- ============================================
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    image VARCHAR(255) NOT NULL,
    link VARCHAR(500),
    position VARCHAR(50) DEFAULT 'homepage', -- homepage, category, product
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATETIME,
    end_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_position (position),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BẢNG VOUCHER/KHUYẾN MÃI
-- ============================================
CREATE TABLE IF NOT EXISTS vouchers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed') NOT NULL,
    discount_value DECIMAL(15, 2) NOT NULL,
    min_order_amount DECIMAL(15, 2) DEFAULT 0,
    max_discount_amount DECIMAL(15, 2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- CHÈN DỮ LIỆU MẪU - DANH MỤC
-- ============================================
INSERT INTO categories (name, slug, icon, sort_order) VALUES
('Điện Thoại & Phụ Kiện', 'dien-thoai-phu-kien', 'fa-mobile-alt', 1),
('Máy Tính & Laptop', 'may-tinh-laptop', 'fa-laptop', 2),
('Thời Trang Nam', 'thoi-trang-nam', 'fa-tshirt', 3),
('Thời Trang Nữ', 'thoi-trang-nu', 'fa-tshirt', 4),
('Đồ Gia Dụng', 'do-gia-dung', 'fa-home', 5),
('Điện Tử & Phụ Kiện', 'dien-tu-phu-kien', 'fa-gamepad', 6),
('Thể Thao & Du Lịch', 'the-thao-du-lich', 'fa-dumbbell', 7),
('Sách & Văn Phòng Phẩm', 'sach-van-phong-pham', 'fa-book', 8),
('Mẹ & Bé', 'me-be', 'fa-baby', 9),
('Ô Tô & Xe Máy', 'oto-xe-may', 'fa-car', 10);

-- ============================================
-- CHÈN DỮ LIỆU MẪU - SẢN PHẨM
-- ============================================
INSERT INTO products (name, slug, category_id, price, original_price, discount_percent, stock, image, is_featured, is_flash_sale, rating, review_count, sold_count) VALUES
('iPhone 15 Pro Max 256GB - Chính hãng VN/A', 'iphone-15-pro-max-256gb', 1, 28990000, 32990000, 12, 50, 'img/ip15.png', TRUE, TRUE, 4.8, 1250, 3500),
('Laptop Dell XPS 13 - Intel Core i7', 'laptop-dell-xps-13', 2, 24990000, 29990000, 17, 30, 'img/Laptop Dell XPS 13 - Intel Core i7.png', TRUE, FALSE, 4.7, 890, 1200),
('Áo Thun Nam Cổ Tròn - Chất Liệu Cotton', 'ao-thun-nam-co-tron', 3, 199000, 299000, 33, 200, 'img/Áo Thun Nam Cổ Tròn - Chất Liệu Cotton.png', FALSE, TRUE, 4.5, 320, 1500),
('Váy Liền Thân Nữ - Phong Cách Hàn Quốc', 'vay-lien-than-nu', 4, 350000, 500000, 30, 150, 'img/Váy Liền Thân Nữ - Phong Cách Hàn Quốc.png', FALSE, FALSE, 4.6, 450, 2100),
('Tai Nghe Bluetooth AirPods Pro 2', 'tai-nghe-bluetooth-airpods-pro-2', 1, 5490000, 6990000, 21, 80, 'img/Tai Nghe Bluetooth AirPods Pro 2.png', TRUE, TRUE, 4.9, 2100, 5600),
('Đồng Hồ Thông Minh Apple Watch Series 9', 'dong-ho-thong-minh-apple-watch-series-9', 1, 8990000, 10990000, 18, 60, 'img/Đồng Hồ Thông Minh Apple Watch Series 9.ng.jpg', TRUE, FALSE, 4.7, 980, 2300),
('Giày Thể Thao Nike Air Max - Size 40-45', 'giay-the-thao-nike-air-max', 7, 2490000, 3490000, 29, 100, 'img/Giày Thể Thao Nike Air Max - Size 40-45.png', FALSE, TRUE, 4.6, 670, 1800),
('Túi Xách Nữ Da Thật - Phong Cách Thanh Lịch', 'tui-xach-nu-da-that', 4, 890000, 1290000, 31, 75, 'img/Túi Xách Nữ Da Thật - Phong Cách Thanh Lịch.png', FALSE, FALSE, 4.4, 280, 950),
('Máy Ảnh Canon EOS R6 Mark II', 'may-anh-canon-eos-r6-mark-ii', 6, 54900000, 64900000, 15, 15, 'img/Máy Ảnh Canon EOS R6 Mark II.png', TRUE, FALSE, 4.9, 120, 350),
('Nồi Cơm Điện Tử Tự Động - 1.8L', 'noi-com-dien-tu-tu-dong-18l', 5, 1290000, 1790000, 28, 120, 'img/Nồi Cơm Điện Tử Tự Động - 1.8L.png', FALSE, TRUE, 4.5, 560, 2100),
('Bàn Phím Cơ Gaming RGB - Switch Blue', 'ban-phim-co-gaming-rgb', 6, 1290000, 1990000, 35, 90, 'img/Bàn Phím Cơ Gaming RGB - Switch Blue.png', FALSE, TRUE, 4.7, 420, 1100),
('Chuột Gaming Không Dây - DPI 16000', 'chuot-gaming-khong-day', 6, 890000, 1290000, 31, 110, 'img/Chuột Gaming Không Dây - DPI 16000.png', FALSE, FALSE, 4.6, 380, 980);

-- ============================================
-- CHÈN DỮ LIỆU MẪU - BANNER
-- ============================================
INSERT INTO banners (title, image, link, position, sort_order, is_active) VALUES
('Banner Khuyến Mãi 1', 'banner/banner1.jpg', '#', 'homepage', 1, TRUE),
('Banner Khuyến Mãi 2', 'banner/banner2.jpg', '#', 'homepage', 2, TRUE),
('Banner Khuyến Mãi 3', 'banner/banner3.jpg', '#', 'homepage', 3, TRUE);

-- ============================================
-- CHÈN DỮ LIỆU MẪU - VOUCHER
-- ============================================
INSERT INTO vouchers (code, name, description, discount_type, discount_value, min_order_amount, usage_limit, start_date, end_date, is_active) VALUES
('WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên', 'Áp dụng cho đơn hàng đầu tiên, giảm tối đa 100.000đ', 'percentage', 10, 500000, 1000, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE),
('FREESHIP', 'Miễn phí vận chuyển', 'Miễn phí vận chuyển cho đơn hàng từ 500.000đ', 'fixed', 50000, 500000, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), TRUE),
('SALE50K', 'Giảm 50.000đ', 'Giảm 50.000đ cho đơn hàng từ 300.000đ', 'fixed', 50000, 300000, 5000, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), TRUE);

-- ============================================
-- TẠO VIEW ĐỂ XEM SẢN PHẨM KÈM DANH MỤC
-- ============================================
CREATE OR REPLACE VIEW v_products_with_category AS
SELECT 
    p.*,
    c.name as category_name,
    c.slug as category_slug
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = TRUE;

-- ============================================
-- TẠO STORED PROCEDURE ĐỂ LẤY SẢN PHẨM THEO DANH MỤC
-- ============================================
DELIMITER //
CREATE PROCEDURE GetProductsByCategory(IN category_slug VARCHAR(255))
BEGIN
    SELECT 
        p.*,
        c.name as category_name
    FROM products p
    INNER JOIN categories c ON p.category_id = c.id
    WHERE c.slug = category_slug AND p.is_active = TRUE
    ORDER BY p.created_at DESC;
END //
DELIMITER ;

-- ============================================
-- TẠO TRIGGER ĐỂ CẬP NHẬT RATING KHI CÓ ĐÁNH GIÁ MỚI
-- ============================================
DELIMITER //
CREATE TRIGGER update_product_rating AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE products 
    SET 
        rating = (
            SELECT AVG(rating) 
            FROM reviews 
            WHERE product_id = NEW.product_id AND is_active = TRUE
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE product_id = NEW.product_id AND is_active = TRUE
        )
    WHERE id = NEW.product_id;
END //
DELIMITER ;

-- ============================================
-- TẠO INDEX BỔ SUNG ĐỂ TỐI ƯU HIỆU SUẤT
-- ============================================
CREATE INDEX idx_products_category_active ON products(category_id, is_active);
CREATE INDEX idx_products_price_range ON products(price, original_price);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- ============================================
-- HOÀN TẤT
-- ============================================
-- CSDL đã được tạo thành công!
-- Để sử dụng, chạy lệnh: mysql -u root -p < database.sql
-- Hoặc import vào phpMyAdmin/MySQL Workbench


