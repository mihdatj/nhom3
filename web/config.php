<?php
/**
 * File cấu hình kết nối database
 * Thay đổi thông tin kết nối phù hợp với môi trường của bạn
 */

// Thông tin kết nối database
define('DB_HOST', 'localhost');
define('DB_NAME', 'shopee_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

/**
 * Kết nối đến database
 * @return PDO|null
 */
function getDBConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            die("Không thể kết nối đến database. Vui lòng kiểm tra lại cấu hình.");
        }
    }
    
    return $pdo;
}

/**
 * Lấy tất cả sản phẩm
 * @param int $limit
 * @param int $offset
 * @return array
 */
function getAllProducts($limit = 100, $offset = 0) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("SELECT * FROM v_products_with_category ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

/**
 * Lấy sản phẩm theo ID
 * @param int $id
 * @return array|false
 */
function getProductById($id) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("SELECT * FROM v_products_with_category WHERE id = :id");
    $stmt->execute(['id' => $id]);
    return $stmt->fetch();
}

/**
 * Lấy sản phẩm theo danh mục
 * @param string $categorySlug
 * @param int $limit
 * @param int $offset
 * @return array
 */
function getProductsByCategory($categorySlug, $limit = 100, $offset = 0) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        SELECT * FROM v_products_with_category 
        WHERE category_slug = :slug 
        ORDER BY created_at DESC 
        LIMIT :limit OFFSET :offset
    ");
    $stmt->bindValue(':slug', $categorySlug);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

/**
 * Tìm kiếm sản phẩm
 * @param string $keyword
 * @param int $limit
 * @param int $offset
 * @return array
 */
function searchProducts($keyword, $limit = 100, $offset = 0) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        SELECT * FROM v_products_with_category 
        WHERE name LIKE :keyword 
           OR description LIKE :keyword 
           OR short_description LIKE :keyword
        ORDER BY created_at DESC 
        LIMIT :limit OFFSET :offset
    ");
    $searchTerm = "%{$keyword}%";
    $stmt->bindValue(':keyword', $searchTerm);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

/**
 * Lấy tất cả danh mục
 * @return array
 */
function getAllCategories() {
    $pdo = getDBConnection();
    $stmt = $pdo->query("SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC");
    return $stmt->fetchAll();
}

/**
 * Lấy banner theo vị trí
 * @param string $position
 * @return array
 */
function getBannersByPosition($position = 'homepage') {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        SELECT * FROM banners 
        WHERE position = :position 
          AND is_active = 1 
          AND (start_date IS NULL OR start_date <= NOW())
          AND (end_date IS NULL OR end_date >= NOW())
        ORDER BY sort_order ASC
    ");
    $stmt->execute(['position' => $position]);
    return $stmt->fetchAll();
}

/**
 * Lấy sản phẩm nổi bật
 * @param int $limit
 * @return array
 */
function getFeaturedProducts($limit = 12) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        SELECT * FROM v_products_with_category 
        WHERE is_featured = 1 
        ORDER BY created_at DESC 
        LIMIT :limit
    ");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

/**
 * Lấy sản phẩm flash sale
 * @param int $limit
 * @return array
 */
function getFlashSaleProducts($limit = 6) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare("
        SELECT * FROM v_products_with_category 
        WHERE is_flash_sale = 1 
        ORDER BY discount_percent DESC 
        LIMIT :limit
    ");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
}

/**
 * Thêm sản phẩm vào giỏ hàng
 * @param int $userId
 * @param string $sessionId
 * @param int $productId
 * @param int $variantId
 * @param int $quantity
 * @return bool
 */
function addToCart($userId, $sessionId, $productId, $variantId = null, $quantity = 1) {
    $pdo = getDBConnection();
    
    // Lấy giá sản phẩm
    $product = getProductById($productId);
    if (!$product) {
        return false;
    }
    
    $price = $product['price'];
    if ($variantId) {
        $stmt = $pdo->prepare("SELECT price FROM product_variants WHERE id = :id");
        $stmt->execute(['id' => $variantId]);
        $variant = $stmt->fetch();
        if ($variant) {
            $price = $variant['price'] ?: $price;
        }
    }
    
    // Kiểm tra xem đã có trong giỏ chưa
    if ($userId) {
        $stmt = $pdo->prepare("
            SELECT id, quantity FROM cart 
            WHERE user_id = :user_id AND product_id = :product_id AND variant_id " . ($variantId ? "= :variant_id" : "IS NULL")
        );
        $params = ['user_id' => $userId, 'product_id' => $productId];
        if ($variantId) $params['variant_id'] = $variantId;
        $stmt->execute($params);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Cập nhật số lượng
            $stmt = $pdo->prepare("UPDATE cart SET quantity = quantity + :quantity WHERE id = :id");
            return $stmt->execute(['quantity' => $quantity, 'id' => $existing['id']]);
        } else {
            // Thêm mới
            $stmt = $pdo->prepare("
                INSERT INTO cart (user_id, product_id, variant_id, quantity, price) 
                VALUES (:user_id, :product_id, :variant_id, :quantity, :price)
            ");
            return $stmt->execute([
                'user_id' => $userId,
                'product_id' => $productId,
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'price' => $price
            ]);
        }
    } else {
        // Giỏ hàng cho khách vãng lai (dùng session_id)
        $stmt = $pdo->prepare("
            SELECT id, quantity FROM cart 
            WHERE session_id = :session_id AND product_id = :product_id AND variant_id " . ($variantId ? "= :variant_id" : "IS NULL")
        );
        $params = ['session_id' => $sessionId, 'product_id' => $productId];
        if ($variantId) $params['variant_id'] = $variantId;
        $stmt->execute($params);
        $existing = $stmt->fetch();
        
        if ($existing) {
            $stmt = $pdo->prepare("UPDATE cart SET quantity = quantity + :quantity WHERE id = :id");
            return $stmt->execute(['quantity' => $quantity, 'id' => $existing['id']]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO cart (session_id, product_id, variant_id, quantity, price) 
                VALUES (:session_id, :product_id, :variant_id, :quantity, :price)
            ");
            return $stmt->execute([
                'session_id' => $sessionId,
                'product_id' => $productId,
                'variant_id' => $variantId,
                'quantity' => $quantity,
                'price' => $price
            ]);
        }
    }
}

/**
 * Lấy giỏ hàng
 * @param int $userId
 * @param string $sessionId
 * @return array
 */
function getCart($userId = null, $sessionId = null) {
    $pdo = getDBConnection();
    
    if ($userId) {
        $stmt = $pdo->prepare("
            SELECT c.*, p.name, p.image, p.slug, pv.variant_name
            FROM cart c
            INNER JOIN products p ON c.product_id = p.id
            LEFT JOIN product_variants pv ON c.variant_id = pv.id
            WHERE c.user_id = :user_id
            ORDER BY c.created_at DESC
        ");
        $stmt->execute(['user_id' => $userId]);
    } else {
        $stmt = $pdo->prepare("
            SELECT c.*, p.name, p.image, p.slug, pv.variant_name
            FROM cart c
            INNER JOIN products p ON c.product_id = p.id
            LEFT JOIN product_variants pv ON c.variant_id = pv.id
            WHERE c.session_id = :session_id
            ORDER BY c.created_at DESC
        ");
        $stmt->execute(['session_id' => $sessionId]);
    }
    
    return $stmt->fetchAll();
}

// Khởi tạo session nếu chưa có
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Tạo session ID cho giỏ hàng nếu chưa có
if (!isset($_SESSION['cart_session_id'])) {
    $_SESSION['cart_session_id'] = session_id();
}


