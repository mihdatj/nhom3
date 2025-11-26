# HƯỚNG DẪN SỬ DỤNG CƠ SỞ DỮ LIỆU

## 📋 Mô tả
File `database.sql` chứa cấu trúc CSDL hoàn chỉnh cho website bán hàng Shopee, bao gồm:
- Bảng danh mục sản phẩm
- Bảng sản phẩm
- Bảng biến thể sản phẩm
- Bảng người dùng
- Bảng địa chỉ giao hàng
- Bảng giỏ hàng
- Bảng đơn hàng và chi tiết đơn hàng
- Bảng đánh giá sản phẩm
- Bảng banner/quảng cáo
- Bảng voucher/khuyến mãi

## 🚀 Cách sử dụng

### Cách 1: Sử dụng MySQL Command Line
```bash
mysql -u root -p < database.sql
```

### Cách 2: Sử dụng phpMyAdmin
1. Đăng nhập vào phpMyAdmin
2. Chọn "Import"
3. Chọn file `database.sql`
4. Click "Go" để import

### Cách 3: Sử dụng MySQL Workbench
1. Mở MySQL Workbench
2. Kết nối đến MySQL server
3. File → Open SQL Script → Chọn `database.sql`
4. Execute để chạy script

## 📊 Cấu trúc Database

### Các bảng chính:
1. **categories** - Danh mục sản phẩm
2. **products** - Sản phẩm
3. **product_variants** - Biến thể sản phẩm (màu, size, v.v.)
4. **users** - Người dùng
5. **addresses** - Địa chỉ giao hàng
6. **cart** - Giỏ hàng
7. **orders** - Đơn hàng
8. **order_items** - Chi tiết đơn hàng
9. **reviews** - Đánh giá sản phẩm
10. **banners** - Banner quảng cáo
11. **vouchers** - Mã giảm giá

## 🔧 Kết nối từ PHP

### Ví dụ file `config.php`:
```php
<?php
$host = 'localhost';
$dbname = 'shopee_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    die("Kết nối thất bại: " . $e->getMessage());
}
?>
```

### Ví dụ lấy sản phẩm:
```php
<?php
require_once 'config.php';

$stmt = $pdo->query("SELECT * FROM v_products_with_category LIMIT 12");
$products = $stmt->fetchAll();

foreach ($products as $product) {
    echo $product['name'] . " - " . number_format($product['price']) . " ₫<br>";
}
?>
```

## 📝 Dữ liệu mẫu

Database đã bao gồm:
- ✅ 10 danh mục sản phẩm
- ✅ 12 sản phẩm mẫu (tương ứng với dữ liệu trong script.js)
- ✅ 3 banner mẫu
- ✅ 3 voucher mẫu

## 🔍 Views và Stored Procedures

### View: `v_products_with_category`
Xem sản phẩm kèm thông tin danh mục:
```sql
SELECT * FROM v_products_with_category;
```

### Stored Procedure: `GetProductsByCategory`
Lấy sản phẩm theo danh mục:
```sql
CALL GetProductsByCategory('dien-thoai-phu-kien');
```

## ⚙️ Trigger tự động

- **update_product_rating**: Tự động cập nhật rating và số lượng đánh giá khi có review mới

## 🔐 Lưu ý bảo mật

1. Đổi mật khẩu root sau khi cài đặt
2. Tạo user riêng cho ứng dụng với quyền hạn phù hợp
3. Sử dụng prepared statements để tránh SQL injection
4. Backup database thường xuyên

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
- MySQL/MariaDB đã được cài đặt
- Quyền truy cập database
- Charset UTF-8 đã được hỗ trợ


