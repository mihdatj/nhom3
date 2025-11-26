# Hướng Dẫn Sửa Lỗi "Không tìm thấy website" (Error Code 72)

## Nguyên Nhân

Lỗi code 72 "Không tìm thấy website" từ VNPAY thường xảy ra do:

1. **Hash/Signature không đúng**: Cách tạo hash không khớp với yêu cầu của VNPAY
2. **Return URL không hợp lệ**: URL không được VNPAY chấp nhận
3. **Cấu hình TMN Code hoặc Secret Key sai**

## Đã Sửa

✅ **Đã cập nhật hàm tạo hash** trong `vnpay_utils.py` để khớp với code mẫu chính thức của VNPAY:
- Hash được tạo từ query string (đã URL encode)
- Format đúng theo tài liệu VNPAY

## Kiểm Tra và Sửa

### 1. Kiểm Tra Cấu Hình

Mở file `server/vnpay_config.py` và đảm bảo:

```python
VNPAY_TMN_CODE = "KWKOYLZX"  # Đúng với thông tin của bạn
VNPAY_HASH_SECRET = "ZFTPBF29HIEZQPENGWLBQ9RZLZ81529P"  # Đúng với thông tin của bạn
VNPAY_RETURN_URL = "http://localhost:5000/vnpay_return"
```

### 2. Vấn Đề Với Return URL

**Lưu ý quan trọng**: 
- Trong môi trường **sandbox**, `localhost` có thể không được chấp nhận
- VNPAY cần có thể truy cập Return URL từ server của họ

**Giải pháp**:

#### Option 1: Sử dụng ngrok (Khuyến nghị cho testing)

1. Cài đặt ngrok: https://ngrok.com/
2. Chạy ngrok:
```bash
ngrok http 5000
```
3. Copy URL từ ngrok (ví dụ: `https://abc123.ngrok.io`)
4. Cập nhật `vnpay_config.py`:
```python
VNPAY_RETURN_URL = "https://abc123.ngrok.io/vnpay_return"
VNPAY_IPN_URL = "https://abc123.ngrok.io/vnpay_ipn"
```

#### Option 2: Sử dụng URL công khai

Nếu bạn có server công khai, cập nhật:
```python
VNPAY_RETURN_URL = "https://yourdomain.com/vnpay_return"
VNPAY_IPN_URL = "https://yourdomain.com/vnpay_ipn"
```

#### Option 3: Đăng ký Return URL trong VNPAY Dashboard

1. Đăng nhập vào VNPAY Sandbox Dashboard
2. Vào phần cấu hình website
3. Thêm Return URL: `http://localhost:5000/vnpay_return` (nếu được phép)

### 3. Kiểm Tra Log

Sau khi sửa, chạy server và kiểm tra log:

```bash
python -m server.app
```

Khi có request, bạn sẽ thấy log:
```
[VNPAY] Creating payment for order: ORD123456
[VNPAY] Amount: 150000 VND
[VNPAY] Return URL: http://localhost:5000/vnpay_return
[VNPAY] Payment URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...
```

### 4. Test Payment URL

Copy Payment URL từ log và mở trong browser để kiểm tra:
- URL có đầy đủ tham số không?
- `vnp_SecureHash` có được tạo không?

### 5. Kiểm Tra Hash

Nếu vẫn lỗi, có thể so sánh hash với code mẫu VNPAY:

```python
# Test hash generation
import hashlib
import hmac
import urllib.parse

params = {
    "vnp_Version": "2.1.0",
    "vnp_Command": "pay",
    "vnp_TmnCode": "KWKOYLZX",
    "vnp_Amount": "15000000",
    "vnp_CurrCode": "VND",
    "vnp_TxnRef": "ORD123",
    "vnp_OrderInfo": "Thanh toan don hang",
    "vnp_OrderType": "other",
    "vnp_Locale": "vn",
    "vnp_ReturnUrl": "http://localhost:5000/vnpay_return",
    "vnp_IpAddr": "127.0.0.1",
    "vnp_CreateDate": "20210801153333",
}

# Build query string
sorted_items = sorted((k, str(v)) for k, v in params.items())
query_string = ''
seq = 0
for key, val in sorted_items:
    if seq == 1:
        query_string = query_string + "&" + key + '=' + urllib.parse.quote_plus(str(val))
    else:
        seq = 1
        query_string = key + '=' + urllib.parse.quote_plus(str(val))

# Hash
secret = "ZFTPBF29HIEZQPENGWLBQ9RZLZ81529P"
hash_value = hmac.new(secret.encode(), query_string.encode(), hashlib.sha512).hexdigest()
print(f"Query String: {query_string}")
print(f"Hash: {hash_value}")
```

## Các Lỗi Khác Có Thể Gặp

### Error Code 02: Invalid TmnCode
- Kiểm tra `VNPAY_TMN_CODE` đúng chưa
- Đảm bảo không có khoảng trắng thừa

### Error Code 97: Invalid Checksum
- Kiểm tra `VNPAY_HASH_SECRET` đúng chưa
- Đảm bảo hash được tạo đúng format

### Error Code 99: Other Errors
- Kiểm tra tất cả tham số có đầy đủ không
- Kiểm tra format ngày tháng (yyyyMMddHHmmss)

## Liên Hệ Hỗ Trợ

Nếu vẫn gặp lỗi sau khi thử các bước trên:
- Email: hotrovnpay@vnpay.vn
- Kiểm tra tài liệu: https://sandbox.vnpayment.vn/apis/docs/

