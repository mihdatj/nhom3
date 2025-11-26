# Hướng Dẫn Chạy VNPAY Integration với Query và Refund API

## Yêu Cầu Hệ Thống

1. **Python 3.10+** (khuyến nghị Python 3.11)
2. **pip** (package manager của Python)

## Cài Đặt

### Bước 1: Tạo Virtual Environment (Môi trường ảo)

Mở terminal/PowerShell tại thư mục `d:\web` và chạy:

**Windows:**
```powershell
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Bước 2: Cài Đặt Dependencies

```bash
pip install -r server/requirements.txt
```

Các package sẽ được cài đặt:
- Flask==3.0.0
- Flask-Cors==4.0.0
- requests==2.31.0

### Bước 3: Cấu Hình VNPAY

Mở file `server/vnpay_config.py` và kiểm tra các thông tin sau:

```python
VNPAY_TMN_CODE = "KWKOYLZX"  # Website ID trong hệ thống VNPAY
VNPAY_HASH_SECRET = "ZFTPBF29HIEZQPENGWLBQ9RZLZ81529P"  # Secret key
```

**Lưu ý:** 
- Các giá trị trên đã được cấu hình sẵn từ ảnh bạn cung cấp
- Nếu bạn có thông tin khác, hãy cập nhật trong file này
- Hoặc có thể set qua biến môi trường (environment variables)

### Bước 4: Chạy Server

Từ thư mục `d:\web`, chạy lệnh:

```powershell
python -m server.app
```

Hoặc nếu đang ở trong thư mục `server`:

```powershell
python app.py
```

Server sẽ chạy tại: **http://localhost:5000**

Bạn sẽ thấy thông báo:
```
 * Running on http://0.0.0.0:5000
 * Debug mode: on
```

## Các API Endpoints

### 1. Tạo Payment URL
**POST** `/api/vnpay/create_payment`

**Request Body:**
```json
{
    "orderId": "ORD123456",
    "amount": 150000,
    "orderDescription": "Thanh toan don hang",
    "bankCode": "NCB"
}
```

**Response:**
```json
{
    "payment_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
}
```

### 2. Query Transaction (Truy vấn giao dịch)
**POST** `/api/vnpay/query`

**Request Body:**
```json
{
    "orderId": "ORD123456",
    "transactionDate": "20210801153333",
    "orderInfo": "kiem tra gd"
}
```

**Lưu ý:** `transactionDate` phải là ngày tạo giao dịch ban đầu, định dạng `yyyyMMddHHmmss` (GMT+7)

**Response:**
```json
{
    "vnp_ResponseCode": "00",
    "vnp_Message": "Success",
    "vnp_TxnRef": "ORD123456",
    "vnp_TransactionStatus": "00",
    ...
}
```

### 3. Refund Transaction (Hoàn tiền)
**POST** `/api/vnpay/refund`

**Request Body:**
```json
{
    "orderId": "ORD123456",
    "amount": 150000,
    "transactionDate": "20210801153333",
    "transactionType": "02",
    "transactionNo": "0",
    "orderInfo": "Hoan tien giao dich"
}
```

**Transaction Types:**
- `"02"`: Hoàn tiền toàn phần (Full refund)
- `"03"`: Hoàn tiền một phần (Partial refund)

**Response:**
```json
{
    "vnp_ResponseCode": "00",
    "vnp_Message": "Success",
    "vnp_TransactionNo": "12345678",
    ...
}
```

### 4. Return URL Callback
**GET** `/vnpay_return`

VNPAY sẽ redirect về URL này sau khi thanh toán.

### 5. IPN Callback
**GET** `/vnpay_ipn`

VNPAY sẽ gọi URL này để thông báo kết quả thanh toán (server-to-server).

## Mã Lỗi (Response Codes)

### Query Transaction (querydr)
- `00`: Yêu cầu thành công
- `02`: Mã định danh kết nối không hợp lệ
- `03`: Dữ liệu gửi sang không đúng định dạng
- `91`: Không tìm thấy giao dịch yêu cầu
- `94`: Yêu cầu trùng lặp
- `97`: Checksum không hợp lệ
- `99`: Các lỗi khác

### Refund
- `00`: Yêu cầu thành công
- `02`: Mã định danh kết nối không hợp lệ
- `03`: Dữ liệu gửi sang không đúng định dạng
- `91`: Không tìm thấy giao dịch yêu cầu hoàn trả
- `94`: Giao dịch đã được gửi yêu cầu hoàn tiền trước đó
- `95`: Giao dịch không thành công, VNPAY từ chối xử lý
- `97`: Checksum không hợp lệ
- `99`: Các lỗi khác

### Transaction Status
- `00`: Giao dịch thanh toán thành công
- `01`: Giao dịch chưa hoàn tất
- `02`: Giao dịch bị lỗi
- `04`: Giao dịch đảo (Khách hàng đã bị trừ tiền nhưng GD chưa thành công)
- `05`: VNPAY đang xử lý giao dịch này (GD hoàn tiền)
- `06`: VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng
- `07`: Giao dịch bị nghi ngờ gian lận
- `09`: GD Hoàn trả bị từ chối

## Test API với cURL

### Test Create Payment
```bash
curl -X POST http://localhost:5000/api/vnpay/create_payment ^
  -H "Content-Type: application/json" ^
  -d "{\"orderId\":\"ORD123\",\"amount\":150000,\"orderDescription\":\"Test\"}"
```

### Test Query
```bash
curl -X POST http://localhost:5000/api/vnpay/query ^
  -H "Content-Type: application/json" ^
  -d "{\"orderId\":\"ORD123\",\"transactionDate\":\"20210801153333\"}"
```

### Test Refund
```bash
curl -X POST http://localhost:5000/api/vnpay/refund ^
  -H "Content-Type: application/json" ^
  -d "{\"orderId\":\"ORD123\",\"amount\":150000,\"transactionDate\":\"20210801153333\",\"transactionType\":\"02\"}"
```

## Tích Hợp với Frontend

Frontend (checkout.js) đã được cấu hình để gọi API tại:
- `http://localhost:5000/api/vnpay/create_payment`

Đảm bảo server Flask đang chạy trước khi test checkout page.

## Troubleshooting

### Lỗi: "ModuleNotFoundError: No module named 'server'"
**Giải pháp:** Chạy từ thư mục `d:\web` với lệnh `python -m server.app`

### Lỗi: "VNPAY configuration is missing"
**Giải pháp:** Kiểm tra file `server/vnpay_config.py` đã có đầy đủ thông tin chưa

### Lỗi: "Connection refused"
**Giải pháp:** Đảm bảo server đang chạy tại port 5000, không có ứng dụng khác đang dùng port này

### Lỗi: "Invalid checksum" (97)
**Giải pháp:** 
- Kiểm tra `VNPAY_HASH_SECRET` đúng chưa
- Đảm bảo các tham số gửi đi đúng định dạng
- Kiểm tra thời gian server (GMT+7)

## Tài Liệu Tham Khảo

- [VNPAY Payment API](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)
- [VNPAY Query & Refund API](https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr&refund.html)

## Cấu Trúc Thư Mục

```
d:\web\
├── server\
│   ├── __init__.py
│   ├── app.py              # Flask application với các endpoints
│   ├── vnpay_config.py     # Cấu hình VNPAY
│   ├── vnpay_utils.py      # Utility functions (build URL, query, refund)
│   ├── requirements.txt     # Python dependencies
│   └── README.md           # Tài liệu tiếng Anh
├── checkout.html            # Frontend checkout page
├── checkout.js              # Frontend checkout logic
└── ...
```

## Lưu Ý Quan Trọng

1. **Sandbox Environment:** Code này sử dụng VNPAY Sandbox, chỉ dùng cho testing
2. **Production:** Khi deploy production, cần:
   - Thay đổi `VNPAY_PAYMENT_URL` sang production URL
   - Thay đổi `VNPAY_API_URL` sang production API URL
   - Sử dụng credentials thật từ VNPAY
3. **Security:** Không commit file `vnpay_config.py` với credentials thật lên Git
4. **HTTPS:** Production cần sử dụng HTTPS cho Return URL và IPN URL

