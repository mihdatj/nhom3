import hashlib
import hmac
import json
import urllib
import urllib.parse
import urllib.request
import random
import requests
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.utils.http import urlquote

from vnpay_python.forms import PaymentForm
from vnpay_python.vnpay import vnpay




def index(request):
    return render(request, "index.html", {"title": "Nhóm 3 - Trang Chủ"})


def cart(request):
    return render(request, "cart.html", {"title": "Giỏ Hàng"})


def checkout(request):
    return render(request, "checkout.html", {"title": "Thanh Toán"})


def category(request):
    return render(request, "category.html", {"title": "Danh Mục Sản Phẩm"})


def product_detail(request):
    product_id = request.GET.get('id', '')
    return render(request, "product-detail.html", {"title": "Chi Tiết Sản Phẩm", "product_id": product_id})


def hmacsha512(key, data):
    byteKey = key.encode('utf-8')
    byteData = data.encode('utf-8')
    return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()


def payment(request):

    if request.method == 'POST':
        # Process input data and build url payment
        form = PaymentForm(request.POST)
        if form.is_valid():
            order_type = form.cleaned_data['order_type']
            order_id = form.cleaned_data['order_id']
            amount = form.cleaned_data['amount']
            order_desc = form.cleaned_data['order_desc']
            bank_code = form.cleaned_data['bank_code']
            language = form.cleaned_data['language']
            ipaddr = get_client_ip(request)
            
            # Lưu thông tin khách hàng vào session để gửi email sau khi thanh toán thành công
            customer_email = request.POST.get('email', '')
            customer_name = request.POST.get('full_name', '')
            customer_phone = request.POST.get('phone', '')
            
            print(f"[PAYMENT] Lưu thông tin vào session:")
            print(f"[PAYMENT] Email: {customer_email}")
            print(f"[PAYMENT] Tên: {customer_name}")
            print(f"[PAYMENT] Phone: {customer_phone}")
            print(f"[PAYMENT] Order ID: {order_id}")
            print(f"[PAYMENT] Amount: {amount}")
            
            if customer_email:
                request.session['customer_email'] = customer_email
                request.session['customer_name'] = customer_name
                request.session['customer_phone'] = customer_phone
                request.session['order_id'] = order_id
                request.session['order_amount'] = amount
                request.session['order_desc'] = order_desc
                request.session.save()  # Đảm bảo lưu session
                print(f"[PAYMENT] ✅ Đã lưu thông tin vào session")
            else:
                print(f"[PAYMENT] ⚠️ Không có email trong form!")
            # Build URL Payment
            vnp = vnpay()
            vnp.requestData['vnp_Version'] = '2.1.0'
            vnp.requestData['vnp_Command'] = 'pay'
            vnp.requestData['vnp_TmnCode'] = settings.VNPAY_TMN_CODE
            vnp.requestData['vnp_Amount'] = amount * 100
            vnp.requestData['vnp_CurrCode'] = 'VND'
            vnp.requestData['vnp_TxnRef'] = order_id
            vnp.requestData['vnp_OrderInfo'] = order_desc
            vnp.requestData['vnp_OrderType'] = order_type
            # Check language, default: vn
            if language and language != '':
                vnp.requestData['vnp_Locale'] = language
            else:
                vnp.requestData['vnp_Locale'] = 'vn'
                # Check bank_code, if bank_code is empty, customer will be selected bank on VNPAY
            if bank_code and bank_code != "":
                vnp.requestData['vnp_BankCode'] = bank_code

            vnp.requestData['vnp_CreateDate'] = datetime.now().strftime('%Y%m%d%H%M%S')  # 20150410063022
            vnp.requestData['vnp_IpAddr'] = ipaddr
            vnp.requestData['vnp_ReturnUrl'] = settings.VNPAY_RETURN_URL
            vnpay_payment_url = vnp.get_payment_url(settings.VNPAY_PAYMENT_URL, settings.VNPAY_HASH_SECRET_KEY)
            print(vnpay_payment_url)
            return redirect(vnpay_payment_url)
        else:
            print("Form input not validate")
    else:
        return render(request, "payment.html", {"title": "Thanh toán"})


def payment_ipn(request):
    inputData = request.GET
    if inputData:
        vnp = vnpay()
        vnp.responseData = inputData.dict()
        order_id = inputData['vnp_TxnRef']
        amount = inputData['vnp_Amount']
        order_desc = inputData['vnp_OrderInfo']
        vnp_TransactionNo = inputData['vnp_TransactionNo']
        vnp_ResponseCode = inputData['vnp_ResponseCode']
        vnp_TmnCode = inputData['vnp_TmnCode']
        vnp_PayDate = inputData['vnp_PayDate']
        vnp_BankCode = inputData['vnp_BankCode']
        vnp_CardType = inputData['vnp_CardType']
        if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
            # Check & Update Order Status in your Database
            # Your code here
            firstTimeUpdate = True
            totalamount = True
            if totalamount:
                if firstTimeUpdate:
                    if vnp_ResponseCode == '00':
                        print('Payment Success. Your code implement here')
                    else:
                        print('Payment Error. Your code implement here')

                    # Return VNPAY: Merchant update success
                    result = JsonResponse({'RspCode': '00', 'Message': 'Confirm Success'})
                else:
                    # Already Update
                    result = JsonResponse({'RspCode': '02', 'Message': 'Order Already Update'})
            else:
                # invalid amount
                result = JsonResponse({'RspCode': '04', 'Message': 'invalid amount'})
        else:
            # Invalid Signature
            result = JsonResponse({'RspCode': '97', 'Message': 'Invalid Signature'})
    else:
        result = JsonResponse({'RspCode': '99', 'Message': 'Invalid request'})

    return result


def payment_return(request):
    inputData = request.GET
    if inputData:
        vnp = vnpay()
        vnp.responseData = inputData.dict()
        order_id = inputData['vnp_TxnRef']
        amount = int(inputData['vnp_Amount']) / 100
        order_desc = inputData['vnp_OrderInfo']
        vnp_TransactionNo = inputData['vnp_TransactionNo']
        vnp_ResponseCode = inputData['vnp_ResponseCode']
        vnp_TmnCode = inputData['vnp_TmnCode']
        vnp_PayDate = inputData['vnp_PayDate']
        vnp_BankCode = inputData['vnp_BankCode']
        vnp_CardType = inputData['vnp_CardType']
        if vnp.validate_response(settings.VNPAY_HASH_SECRET_KEY):
            if vnp_ResponseCode == "00":
                # Thanh toán thành công - gửi email thông báo
                customer_email = request.session.get('customer_email', '')
                customer_name = request.session.get('customer_name', 'Khách hàng')
                customer_phone = request.session.get('customer_phone', '')
                session_order_id = request.session.get('order_id', order_id)
                session_order_amount = request.session.get('order_amount', amount)
                session_order_desc = request.session.get('order_desc', order_desc)
                
                # Gửi email nếu có email khách hàng
                print(f"[PAYMENT_RETURN] Kiểm tra email trong session: {customer_email}")
                print(f"[PAYMENT_RETURN] Session keys: {list(request.session.keys())}")
                
                if customer_email:
                    print(f"[PAYMENT_RETURN] Có email, bắt đầu gửi email...")
                    email_sent = send_payment_success_email(
                        customer_email=customer_email,
                        customer_name=customer_name,
                        order_id=session_order_id,
                        amount=session_order_amount,
                        order_desc=session_order_desc,
                        transaction_no=vnp_TransactionNo
                    )
                    if email_sent:
                        print(f"[PAYMENT_RETURN] ✅ Email đã được gửi thành công")
                    else:
                        print(f"[PAYMENT_RETURN] ❌ Gửi email thất bại")
                    
                    # Xóa thông tin khỏi session sau khi gửi email
                    if 'customer_email' in request.session:
                        del request.session['customer_email']
                    if 'customer_name' in request.session:
                        del request.session['customer_name']
                    if 'customer_phone' in request.session:
                        del request.session['customer_phone']
                    if 'order_id' in request.session:
                        del request.session['order_id']
                    if 'order_amount' in request.session:
                        del request.session['order_amount']
                    if 'order_desc' in request.session:
                        del request.session['order_desc']
                else:
                    print(f"[PAYMENT_RETURN] ⚠️ Không có email trong session để gửi!")
                
                # Thanh toán thành công - redirect về trang chủ với thông báo
                index_url = reverse('index')
                return HttpResponseRedirect(f"{index_url}?payment_success=1")
            else:
                return render(request, "payment_return.html", {"title": "Kết quả thanh toán",
                                                               "result": "Lỗi", "order_id": order_id,
                                                               "amount": amount,
                                                               "order_desc": order_desc,
                                                               "vnp_TransactionNo": vnp_TransactionNo,
                                                               "vnp_ResponseCode": vnp_ResponseCode})
        else:
            return render(request, "payment_return.html",
                          {"title": "Kết quả thanh toán", "result": "Lỗi", "order_id": order_id, "amount": amount,
                           "order_desc": order_desc, "vnp_TransactionNo": vnp_TransactionNo,
                           "vnp_ResponseCode": vnp_ResponseCode, "msg": "Sai checksum"})
    else:
        return render(request, "payment_return.html", {"title": "Kết quả thanh toán", "result": ""})


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def send_payment_success_email(customer_email, customer_name, order_id, amount, order_desc, transaction_no):
    """
    Gửi email thông báo thanh toán thành công cho khách hàng
    """
    try:
        print(f"[EMAIL] Bắt đầu gửi email đến: {customer_email}")
        print(f"[EMAIL] Thông tin: Tên={customer_name}, OrderID={order_id}, Amount={amount}")
        
        # Chuẩn bị nội dung email
        subject = f"Xác nhận thanh toán thành công - Đơn hàng #{order_id}"
        
        # Format số tiền
        formatted_amount = "{:,.0f}".format(amount).replace(",", ".") + " ₫"
        
        # Nội dung email HTML
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }}
                .content {{
                    background: #f9f9f9;
                    padding: 30px;
                    border: 1px solid #ddd;
                    border-top: none;
                    border-radius: 0 0 8px 8px;
                }}
                .success-icon {{
                    font-size: 48px;
                    color: #4caf50;
                    margin-bottom: 20px;
                }}
                .info-box {{
                    background: white;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #4caf50;
                }}
                .info-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }}
                .info-row:last-child {{
                    border-bottom: none;
                }}
                .info-label {{
                    font-weight: bold;
                    color: #666;
                }}
                .info-value {{
                    color: #333;
                }}
                .footer {{
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Thanh toán thành công!</h1>
            </div>
            <div class="content">
                <div style="text-align: center;">
                    <div class="success-icon">✓</div>
                    <h2 style="color: #4caf50; margin-top: 0;">Cảm ơn bạn đã mua hàng!</h2>
                </div>
                
                <p>Xin chào <strong>{customer_name}</strong>,</p>
                <p>Đơn hàng của bạn đã được thanh toán thành công. Chúng tôi sẽ xử lý và giao hàng cho bạn trong thời gian sớm nhất.</p>
                
                <div class="info-box">
                    <h3 style="margin-top: 0; color: #4caf50;">Thông tin đơn hàng</h3>
                    <div class="info-row">
                        <span class="info-label">Mã đơn hàng:</span>
                        <span class="info-value"><strong>#{order_id}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Mã giao dịch:</span>
                        <span class="info-value">{transaction_no}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Tổng tiền:</span>
                        <span class="info-value" style="color: #4caf50; font-size: 18px; font-weight: bold;">{formatted_amount}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Mô tả:</span>
                        <span class="info-value">{order_desc}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Thời gian:</span>
                        <span class="info-value">{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}</span>
                    </div>
                </div>
                
                <p>Chúng tôi sẽ gửi email cập nhật khi đơn hàng được xử lý và vận chuyển.</p>
                <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua hotline: <strong>123456</strong></p>
                
                <div class="footer">
                    <p>Trân trọng,<br><strong>Nhóm 3 - Mang Sức Khoẻ Và Cuộc Sống An Lành Đến Mọi Nơi</strong></p>
                    <p>Email: {settings.EMAIL_HOST_USER}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Tạo email message
        msg = MIMEMultipart('alternative')
        msg['From'] = settings.EMAIL_HOST_USER
        msg['To'] = customer_email
        msg['Subject'] = subject
        
        # Thêm nội dung HTML
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        
        print(f"[EMAIL] Đang kết nối SMTP: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        
        # Gửi email qua SMTP - giống như trong thu/app.py
        server = smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT)
        print(f"[EMAIL] Đang đăng nhập với user: {settings.EMAIL_HOST_USER}")
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        print(f"[EMAIL] Đang gửi email đến: {customer_email}")
        server.sendmail(settings.EMAIL_HOST_USER, customer_email, msg.as_string())
        server.quit()
        
        print(f"[EMAIL] ✅ Gửi email thành công đến: {customer_email}")
        return True
    except Exception as e:
        print(f"[EMAIL] ❌ Lỗi gửi email: {str(e)}")
        import traceback
        print(f"[EMAIL] Chi tiết lỗi: {traceback.format_exc()}")
        return False

n = random.randint(10**11, 10**12 - 1)
n_str = str(n)
while len(n_str) < 12:
    n_str = '0' + n_str


def query(request):
    if request.method == 'GET':
        return render(request, "query.html", {"title": "Kiểm tra kết quả giao dịch"})

    url = settings.VNPAY_API_URL
    secret_key = settings.VNPAY_HASH_SECRET_KEY
    vnp_TmnCode = settings.VNPAY_TMN_CODE
    vnp_Version = '2.1.0'

    vnp_RequestId = n_str
    vnp_Command = 'querydr'
    vnp_TxnRef = request.POST['order_id']
    vnp_OrderInfo = 'kiem tra gd'
    vnp_TransactionDate = request.POST['trans_date']
    vnp_CreateDate = datetime.now().strftime('%Y%m%d%H%M%S')
    vnp_IpAddr = get_client_ip(request)

    hash_data = "|".join([
        vnp_RequestId, vnp_Version, vnp_Command, vnp_TmnCode,
        vnp_TxnRef, vnp_TransactionDate, vnp_CreateDate,
        vnp_IpAddr, vnp_OrderInfo
    ])

    secure_hash = hmac.new(secret_key.encode(), hash_data.encode(), hashlib.sha512).hexdigest()

    data = {
        "vnp_RequestId": vnp_RequestId,
        "vnp_TmnCode": vnp_TmnCode,
        "vnp_Command": vnp_Command,
        "vnp_TxnRef": vnp_TxnRef,
        "vnp_OrderInfo": vnp_OrderInfo,
        "vnp_TransactionDate": vnp_TransactionDate,
        "vnp_CreateDate": vnp_CreateDate,
        "vnp_IpAddr": vnp_IpAddr,
        "vnp_Version": vnp_Version,
        "vnp_SecureHash": secure_hash
    }

    headers = {"Content-Type": "application/json"}

    response = requests.post(url, headers=headers, data=json.dumps(data))

    if response.status_code == 200:
        response_json = json.loads(response.text)
    else:
        response_json = {"error": f"Request failed with status code: {response.status_code}"}

    return render(request, "query.html", {"title": "Kiểm tra kết quả giao dịch", "response_json": response_json})

def refund(request):
    if request.method == 'GET':
        return render(request, "refund.html", {"title": "Hoàn tiền giao dịch"})

    url = settings.VNPAY_API_URL
    secret_key = settings.VNPAY_HASH_SECRET_KEY
    vnp_TmnCode = settings.VNPAY_TMN_CODE
    vnp_RequestId = n_str
    vnp_Version = '2.1.0'
    vnp_Command = 'refund'
    vnp_TransactionType = request.POST['TransactionType']
    vnp_TxnRef = request.POST['order_id']
    vnp_Amount = request.POST['amount']
    vnp_OrderInfo = request.POST['order_desc']
    vnp_TransactionNo = '0'
    vnp_TransactionDate = request.POST['trans_date']
    vnp_CreateDate = datetime.now().strftime('%Y%m%d%H%M%S')
    vnp_CreateBy = 'user01'
    vnp_IpAddr = get_client_ip(request)

    hash_data = "|".join([
        vnp_RequestId, vnp_Version, vnp_Command, vnp_TmnCode, vnp_TransactionType, vnp_TxnRef,
        vnp_Amount, vnp_TransactionNo, vnp_TransactionDate, vnp_CreateBy, vnp_CreateDate,
        vnp_IpAddr, vnp_OrderInfo
    ])

    secure_hash = hmac.new(secret_key.encode(), hash_data.encode(), hashlib.sha512).hexdigest()

    data = {
        "vnp_RequestId": vnp_RequestId,
        "vnp_TmnCode": vnp_TmnCode,
        "vnp_Command": vnp_Command,
        "vnp_TxnRef": vnp_TxnRef,
        "vnp_Amount": vnp_Amount,
        "vnp_OrderInfo": vnp_OrderInfo,
        "vnp_TransactionDate": vnp_TransactionDate,
        "vnp_CreateDate": vnp_CreateDate,
        "vnp_IpAddr": vnp_IpAddr,
        "vnp_TransactionType": vnp_TransactionType,
        "vnp_TransactionNo": vnp_TransactionNo,
        "vnp_CreateBy": vnp_CreateBy,
        "vnp_Version": vnp_Version,
        "vnp_SecureHash": secure_hash
    }

    headers = {"Content-Type": "application/json"}

    response = requests.post(url, headers=headers, data=json.dumps(data))

    if response.status_code == 200:
        response_json = json.loads(response.text)
    else:
        response_json = {"error": f"Request failed with status code: {response.status_code}"}

    return render(request, "refund.html", {"title": "Kết quả hoàn tiền giao dịch", "response_json": response_json})