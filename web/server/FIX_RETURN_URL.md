# Hướng Dẫn Sửa Lỗi "Không tìm thấy website" (Code 72) - Return URL

## Nguyên Nhân Chính

Lỗi code 72 "Không tìm thấy website" thường xảy ra vì:
1. **Return URL không accessible từ VNPAY**: VNPAY không thể truy cập `localhost:5000`
2. **Return URL chưa được đăng ký** trong hệ thống VNPAY

## Giải Pháp: Sử Dụng Ngrok

### Bước 1: Cài Đặt Ngrok

1. Tải ngrok từ: https://ngrok.com/download
2. Giải nén và đặt vào thư mục dễ truy cập (ví dụ: `C:\ngrok\`)

### Bước 2: Chạy Ngrok

Mở terminal/PowerShell mới và chạy:

```bash
ngrok http 5000
```

Bạn sẽ thấy output như:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:5000
```

**Copy URL `https://abc123.ngrok.io`** (URL của bạn sẽ khác)

### Bước 3: Cập Nhật Config

Mở file `server/vnpay_config.py` và cập nhật:

```python
VNPAY_RETURN_URL = os.getenv(
    "VNPAY_RETURN_URL",
    "https://abc123.ngrok.io/vnpay_return"  # Thay abc123.ngrok.io bằng URL của bạn
)
VNPAY_IPN_URL = os.getenv(
    "VNPAY_IPN_URL",
    "https://abc123.ngrok.io/vnpay_ipn"  # Thay abc123.ngrok.io bằng URL của bạn
)
```

### Bước 4: Restart Server

1. Dừng server Flask (Ctrl+C)
2. Chạy lại:
```bash
python -m server.app
```

### Bước 5: Test

1. Mở browser và vào: `http://localhost:5000/test_payment`
2. Điền thông tin và click "Tạo Payment URL"
3. Click "Đi đến VNPAY" để test

## Lưu Ý Quan Trọng

⚠️ **Ngrok URL thay đổi mỗi lần chạy** (trừ khi dùng tài khoản ngrok có tên miền cố định)

**Giải pháp:**
- Mua tài khoản ngrok Pro để có URL cố định
- Hoặc đăng ký Return URL trong VNPAY Dashboard (nếu được phép)

## Test Endpoint

Sau khi cấu hình xong, bạn có thể test bằng cách:

1. **Test qua browser**: `http://localhost:5000/test_payment`
2. **Test qua API**:
```bash
curl -X POST http://localhost:5000/api/vnpay/create_payment \
  -H "Content-Type: application/json" \
  -d '{"orderId":"TEST123","amount":10000,"bankCode":"NCB"}'
```

## Kiểm Tra Log

Khi tạo payment URL, kiểm tra log trong console để xem:
- Query string được tạo
- Hash value
- Final URL

Nếu vẫn lỗi, hãy so sánh hash với code mẫu VNPAY.

## Alternative: Sử Dụng Server Công Khai

Nếu bạn có server công khai (VPS, Cloud), cập nhật:

```python
VNPAY_RETURN_URL = "https://yourdomain.com/vnpay_return"
VNPAY_IPN_URL = "https://yourdomain.com/vnpay_ipn"
```

Đảm bảo:
- Server có HTTPS (SSL certificate)
- Port 443 (HTTPS) hoặc 80 (HTTP) đã mở
- Firewall cho phép kết nối từ VNPAY

