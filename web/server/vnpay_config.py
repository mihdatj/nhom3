import os

# Configuration values for VNPAY sandbox integration.
# Replace the placeholder values with your actual credentials before running.

VNPAY_TMN_CODE = os.getenv("VNPAY_TMN_CODE", "KWKOYLZX")
VNPAY_HASH_SECRET = os.getenv("VNPAY_HASH_SECRET", "ZFTPBF29HIEZQPENGWLBQ9RZLZ81529P")
VNPAY_PAYMENT_URL = os.getenv(
    "VNPAY_PAYMENT_URL",
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
)
VNPAY_RETURN_URL = os.getenv(
    "VNPAY_RETURN_URL",
    "http://localhost:5000/vnpay_return"
)
VNPAY_IPN_URL = os.getenv(
    "VNPAY_IPN_URL",
    "http://localhost:5000/vnpay_ipn"
)

VNPAY_DEFAULT_LOCALE = os.getenv("VNPAY_DEFAULT_LOCALE", "vn")
VNPAY_DEFAULT_CURRENCY = os.getenv("VNPAY_DEFAULT_CURRENCY", "VND")

# API URL for querydr and refund
VNPAY_API_URL = os.getenv(
    "VNPAY_API_URL",
    "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction"
)



