import uuid
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

from .vnpay_config import (
    VNPAY_IPN_URL,
    VNPAY_RETURN_URL,
    VNPAY_TMN_CODE,
)
from .vnpay_utils import (
    build_payment_url,
    verify_vnpay_response,
    query_transaction,
    refund_transaction,
)

app = Flask(__name__)
CORS(app)


@app.route("/api/vnpay/create_payment", methods=["POST"])
def create_payment():
    """
    Create a payment URL that redirects the shopper to VNPAY.
    Expected JSON payload:
    {
        "orderId": "ORD123",
        "amount": 150000,
        "orderDescription": "Thanh toan don hang",
        "bankCode": "VNPAYQR" // optional
    }
    """
    if not VNPAY_TMN_CODE or VNPAY_TMN_CODE == "":
        return (
            jsonify(
                {
                    "error": "VNPAY configuration is missing. "
                    "Update server/vnpay_config.py before creating payments."
                }
            ),
            500,
        )

    data = request.get_json(force=True) or {}
    order_id = data.get("orderId") or f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}"
    amount = int(data.get("amount", 0))
    order_desc = data.get("orderDescription") or f"Thanh toan don hang {order_id}"
    bank_code = data.get("bankCode")

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    payment_url = build_payment_url(
        order_id=order_id,
        amount_vnd=amount,
        order_desc=order_desc,
        ip_address=client_ip,
        bank_code=bank_code,
    )

    # Debug logging
    print(f"[VNPAY] Creating payment for order: {order_id}")
    print(f"[VNPAY] Amount: {amount} VND")
    print(f"[VNPAY] Return URL: {VNPAY_RETURN_URL}")
    print(f"[VNPAY] Payment URL: {payment_url[:200]}...")

    return jsonify({"payment_url": payment_url})


@app.route("/vnpay_return")
def vnpay_return():
    """Handle VNPAY return URL - redirect user back after payment"""
    is_valid, data = verify_vnpay_response(dict(request.args))
    response_code = data.get("vnp_ResponseCode", "99")
    order_id = data.get("vnp_TxnRef")
    amount = data.get("vnp_Amount", "0")
    transaction_no = data.get("vnp_TransactionNo", "")
    
    # Convert amount from VNPAY format (multiplied by 100) to VND
    try:
        amount_vnd = int(amount) / 100 if amount else 0
    except:
        amount_vnd = 0
    
    # Determine status
    if response_code == "00" and is_valid:
        status = "success"
        message = "Thanh toán thành công!"
        title = "Thành Công"
    else:
        status = "error"
        message = "Thanh toán thất bại hoặc đã bị hủy."
        title = "Thất Bại"
    
    # Build transaction info HTML
    transaction_info = f'<div class="info-row"><span class="info-label">Mã giao dịch:</span><span class="info-value">{transaction_no}</span></div>' if transaction_no else ''
    amount_info = f'<div class="info-row"><span class="info-label">Số tiền:</span><span class="info-value">{amount_vnd:,.0f} VND</span></div>' if amount_vnd > 0 else ''
    icon_char = '✓' if status == 'success' else '✗'
    redirect_script = 'setTimeout(function() { window.location.href = "index.html"; }, 5000);' if status == 'success' else ''
    
    # HTML template for payment result
    html_template = f"""
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title} - Thanh Toán VNPAY</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 500px;
                width: 100%;
                padding: 40px;
                text-align: center;
            }
            .icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
            }
            .success .icon {
                background: #d4edda;
                color: #28a745;
            }
            .error .icon {
                background: #f8d7da;
                color: #dc3545;
            }
            h1 {
                color: #333;
                margin-bottom: 10px;
                font-size: 28px;
            }
            .message {
                color: #666;
                margin-bottom: 30px;
                font-size: 16px;
            }
            .info-box {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                margin: 20px 0;
                text-align: left;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
                border-bottom: none;
            }
            .info-label {
                color: #666;
                font-weight: 500;
            }
            .info-value {
                color: #333;
                font-weight: 600;
            }
            .btn {
                display: inline-block;
                padding: 12px 30px;
                margin-top: 20px;
                background: #667eea;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                transition: all 0.3s;
            }
            .btn:hover {
                background: #764ba2;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
        </style>
    </head>
    <body>
        <div class="container {status}">
            <div class="icon">
                {icon_char}
            </div>
            <h1>{title}</h1>
            <p class="message">{message}</p>
            
            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Mã đơn hàng:</span>
                    <span class="info-value">{order_id or 'N/A'}</span>
                </div>
                {transaction_info}
                {amount_info}
                <div class="info-row">
                    <span class="info-label">Mã phản hồi:</span>
                    <span class="info-value">{response_code}</span>
                </div>
            </div>
            
            <a href="javascript:window.close()" class="btn" style="background: #6c757d;">Đóng</a>
        </div>
        
        <script>
            // Auto redirect to home after 5 seconds if success
            {redirect_script}
        </script>
    </body>
    </html>
    """
    
    return html_template


@app.route("/vnpay_ipn")
def vnpay_ipn():
    is_valid, data = verify_vnpay_response(dict(request.args))
    if not is_valid:
        return jsonify({"RspCode": "97", "Message": "Invalid signature"})

    response_code = data.get("vnp_ResponseCode", "99")
    if response_code == "00":
        # TODO: update order status in database.
        return jsonify({"RspCode": "00", "Message": "Confirm Success"})

    return jsonify({"RspCode": response_code, "Message": "Order not completed"})


@app.route("/api/vnpay/query", methods=["POST"])
def query_payment():
    """
    Query transaction status using VNPAY querydr API.
    Expected JSON payload:
    {
        "orderId": "ORD123",
        "transactionDate": "20210801153333"  // yyyyMMddHHmmss format
    }
    """
    if not VNPAY_TMN_CODE or VNPAY_TMN_CODE == "":
        return (
            jsonify(
                {
                    "error": "VNPAY configuration is missing. "
                    "Update server/vnpay_config.py before querying transactions."
                }
            ),
            500,
        )

    data = request.get_json(force=True) or {}
    order_id = data.get("orderId")
    transaction_date = data.get("transactionDate")
    order_info = data.get("orderInfo", "kiem tra gd")

    if not order_id:
        return jsonify({"error": "orderId is required"}), 400

    if not transaction_date:
        return jsonify({"error": "transactionDate is required (format: yyyyMMddHHmmss)"}), 400

    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    result = query_transaction(
        txn_ref=order_id,
        transaction_date=transaction_date,
        ip_address=client_ip,
        order_info=order_info,
    )

    return jsonify(result)


@app.route("/api/vnpay/refund", methods=["POST"])
def refund_payment():
    """
    Refund a transaction using VNPAY refund API.
    Expected JSON payload:
    {
        "orderId": "ORD123",
        "amount": 150000,  // Amount in VND
        "transactionDate": "20210801153333",  // Original transaction date
        "transactionType": "02",  // "02" for full refund, "03" for partial
        "transactionNo": "0",  // Optional: Original VNPAY transaction number
        "orderInfo": "Hoan tien giao dich"  // Optional
    }
    """
    if not VNPAY_TMN_CODE or VNPAY_TMN_CODE == "":
        return (
            jsonify(
                {
                    "error": "VNPAY configuration is missing. "
                    "Update server/vnpay_config.py before processing refunds."
                }
            ),
            500,
        )

    data = request.get_json(force=True) or {}
    order_id = data.get("orderId")
    amount = data.get("amount")
    transaction_date = data.get("transactionDate")
    transaction_type = data.get("transactionType", "02")  # Default: full refund
    transaction_no = data.get("transactionNo", "0")
    order_info = data.get("orderInfo", "Hoan tien giao dich")

    if not order_id:
        return jsonify({"error": "orderId is required"}), 400

    if not amount or amount <= 0:
        return jsonify({"error": "amount must be greater than 0"}), 400

    if not transaction_date:
        return jsonify({"error": "transactionDate is required (format: yyyyMMddHHmmss)"}), 400

    if transaction_type not in ["02", "03"]:
        return jsonify({"error": "transactionType must be '02' (full) or '03' (partial)"}), 400

    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    result = refund_transaction(
        txn_ref=order_id,
        amount=amount,
        transaction_date=transaction_date,
        ip_address=client_ip,
        transaction_type=transaction_type,
        order_info=order_info,
        transaction_no=transaction_no,
    )

    return jsonify(result)


@app.route("/")
def health_check():
    return jsonify({
        "status": "VNPAY server is running",
        "return_url": VNPAY_RETURN_URL,
        "ipn_url": VNPAY_IPN_URL,
        "tmn_code": VNPAY_TMN_CODE
    }), 200


@app.route("/test_payment", methods=["GET", "POST"])
def test_payment():
    """Test endpoint to create a payment URL"""
    if request.method == "GET":
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Test VNPAY Payment</title>
            <meta charset="UTF-8">
        </head>
        <body>
            <h1>Test VNPAY Payment</h1>
            <form method="POST">
                <p>Order ID: <input type="text" name="order_id" value="TEST123" required></p>
                <p>Amount (VND): <input type="number" name="amount" value="10000" required></p>
                <p>Bank Code: <input type="text" name="bank_code" value="NCB" placeholder="Optional"></p>
                <p><button type="submit">Tạo Payment URL</button></p>
            </form>
        </body>
        </html>
        """
    
    # POST request
    order_id = request.form.get("order_id", f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}")
    amount = int(request.form.get("amount", 10000))
    bank_code = request.form.get("bank_code") or None
    
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    
    payment_url = build_payment_url(
        order_id=order_id,
        amount_vnd=amount,
        order_desc=f"Test payment {order_id}",
        ip_address=client_ip,
        bank_code=bank_code,
    )
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Payment URL Created</title>
        <meta charset="UTF-8">
    </head>
    <body>
        <h1>Payment URL Created</h1>
        <p><strong>Order ID:</strong> {order_id}</p>
        <p><strong>Amount:</strong> {amount:,} VND</p>
        <p><strong>Return URL:</strong> {VNPAY_RETURN_URL}</p>
        <p><a href="{payment_url}" target="_blank" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Đi đến VNPAY</a></p>
        <p><small>Payment URL: <br><textarea rows="5" cols="80" readonly>{payment_url}</textarea></small></p>
    </body>
    </html>
    """


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)



