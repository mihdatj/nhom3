# VNPAY Sandbox Integration (Python/Flask)

This lightweight Flask service builds VNPAY payment URLs and verifies the callbacks described in the [official VNPAY PAY documentation](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html).

## Prerequisites

1. Install Python 3.10+.
2. Create a virtual environment:

```bash
python -m venv .venv
source .venv/Scripts/activate  # Windows: .venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r server/requirements.txt
```

4. Update `server/vnpay_config.py` (or export environment variables) with:
   - `VNPAY_TMN_CODE`
   - `VNPAY_HASH_SECRET`
   - `VNPAY_RETURN_URL`
   - `VNPAY_IPN_URL`

The default endpoints point to `http://localhost:5000`.

## Run the server

```bash
python -m server.app
```

The API exposes:

| Method | Path                          | Description                                      |
| ------ | ----------------------------- | ------------------------------------------------ |
| POST   | `/api/vnpay/create_payment`   | Build a VNPAY payment URL and return it as JSON. |
| GET    | `/vnpay_return`               | Handle ReturnUrl response from VNPAY.            |
| GET    | `/vnpay_ipn`                  | Handle IPN (server-to-server) notifications.     |
| POST   | `/api/vnpay/query`            | Query transaction status (querydr API).          |
| POST   | `/api/vnpay/refund`           | Refund a transaction (refund API).               |

> **Note:** The front-end calls `http://localhost:5000/api/vnpay/create_payment` when the user submits the checkout form. Ensure the Flask server is running while testing the checkout page. After the customer completes payment on VNPAY, the gateway will redirect back to `VNPAY_RETURN_URL` and optionally call `VNPAY_IPN_URL` so you can update order status.

## API Usage Examples

### 1. Create Payment
```bash
curl -X POST http://localhost:5000/api/vnpay/create_payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD123456",
    "amount": 150000,
    "orderDescription": "Thanh toan don hang",
    "bankCode": "NCB"
  }'
```

### 2. Query Transaction Status
```bash
curl -X POST http://localhost:5000/api/vnpay/query \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD123456",
    "transactionDate": "20210801153333"
  }'
```

### 3. Refund Transaction
```bash
curl -X POST http://localhost:5000/api/vnpay/refund \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD123456",
    "amount": 150000,
    "transactionDate": "20210801153333",
    "transactionType": "02",
    "transactionNo": "0"
  }'
```

**Transaction Types:**
- `"02"`: Full refund (hoàn tiền toàn phần)
- `"03"`: Partial refund (hoàn tiền một phần)

**Response Codes:**
- `00`: Success
- `02`: Invalid TmnCode
- `03`: Invalid data format
- `91`: Transaction not found
- `94`: Duplicate request
- `97`: Invalid checksum
- `99`: Other errors

For more details, see [VNPAY API Documentation](https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr&refund.html).



