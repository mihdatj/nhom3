from __future__ import annotations

import datetime
import hashlib
import hmac
import urllib.parse
import uuid
from typing import Dict, Tuple

import requests

from .vnpay_config import (
    VNPAY_HASH_SECRET,
    VNPAY_PAYMENT_URL,
    VNPAY_TMN_CODE,
    VNPAY_RETURN_URL,
    VNPAY_DEFAULT_LOCALE,
    VNPAY_DEFAULT_CURRENCY,
    VNPAY_API_URL,
)


def _sorted_query(params: Dict[str, str]) -> str:
    """
    Convert params dict to a query string sorted by key.
    Values are URL encoded following VNPAY's requirements.
    """
    sorted_items = sorted((k, str(v)) for k, v in params.items() if v is not None)
    query_parts = []
    for k, v in sorted_items:
        query_parts.append(f"{urllib.parse.quote_plus(k)}={urllib.parse.quote_plus(str(v))}")
    return "&".join(query_parts)


def _generate_secure_hash(params: Dict[str, str]) -> str:
    """
    Generate SHA512 HMAC signature using VNPAY secret key.
    Follows VNPAY's official implementation: hash the query string (URL encoded).
    """
    # Create query string exactly like VNPAY sample code
    sorted_items = sorted((k, str(v)) for k, v in params.items() if v is not None)
    query_string = ''
    seq = 0
    for key, val in sorted_items:
        if seq == 1:
            query_string = query_string + "&" + key + '=' + urllib.parse.quote_plus(str(val))
        else:
            seq = 1
            query_string = key + '=' + urllib.parse.quote_plus(str(val))
    
    # Hash the query string
    signature = hmac.new(
        VNPAY_HASH_SECRET.encode("utf-8"),
        query_string.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()
    return signature


def build_payment_url(
    order_id: str,
    amount_vnd: int,
    order_desc: str,
    ip_address: str,
    bank_code: str | None = None,
    locale: str | None = None,
) -> str:
    """
    Build a redirect URL that sends the shopper to VNPAY.

    :param order_id: unique order reference (vnp_TxnRef)
    :param amount_vnd: amount in VND (not multiplied by 100)
    :param order_desc: order description
    :param ip_address: shopper IP address
    :param bank_code: optional bank / payment method code
    :param locale: optional locale (vn / en)
    """
    create_date = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": VNPAY_TMN_CODE,
        "vnp_Amount": str(int(amount_vnd) * 100),
        "vnp_CurrCode": VNPAY_DEFAULT_CURRENCY,
        "vnp_TxnRef": str(order_id),
        "vnp_OrderInfo": order_desc,
        "vnp_OrderType": "other",
        "vnp_Locale": locale or VNPAY_DEFAULT_LOCALE,
        "vnp_ReturnUrl": VNPAY_RETURN_URL,
        "vnp_IpAddr": ip_address or "127.0.0.1",
        "vnp_CreateDate": create_date,
    }

    if bank_code:
        params["vnp_BankCode"] = bank_code

    # Build query string and hash (exactly like VNPAY sample code)
    # Sort params by key
    input_data = sorted(params.items())
    query_string = ''
    seq = 0
    for key, val in input_data:
        if seq == 1:
            query_string = query_string + "&" + key + '=' + urllib.parse.quote_plus(str(val))
        else:
            seq = 1
            query_string = key + '=' + urllib.parse.quote_plus(str(val))
    
    # Generate hash from query string (lowercase, not uppercase)
    hash_value = hmac.new(
        VNPAY_HASH_SECRET.encode("utf-8"),
        query_string.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()
    
    # Append hash to query string
    final_url = f"{VNPAY_PAYMENT_URL}?{query_string}&vnp_SecureHash={hash_value}"
    
    # Debug logging
    print(f"[VNPAY DEBUG] Query string for hash: {query_string}")
    print(f"[VNPAY DEBUG] Hash value: {hash_value}")
    print(f"[VNPAY DEBUG] Final URL: {final_url[:200]}...")
    
    return final_url


def verify_vnpay_response(params: Dict[str, str]) -> Tuple[bool, Dict[str, str]]:
    """
    Verify the authenticity of VNPAY response (ReturnURL or IPN).
    Returns a tuple (is_valid, data_without_hash)
    """
    params = params.copy()
    received_hash = params.pop("vnp_SecureHash", None)
    params.pop("vnp_SecureHashType", None)

    if not received_hash:
        return False, params

    # Build hash data exactly like VNPAY sample code (only vnp_* params)
    sorted_items = sorted((k, str(v)) for k, v in params.items() if v is not None and str(k).startswith('vnp_'))
    has_data = ''
    seq = 0
    for key, val in sorted_items:
        if seq == 1:
            has_data = has_data + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
        else:
            seq = 1
            has_data = str(key) + '=' + urllib.parse.quote_plus(str(val))
    
    calculated_hash = hmac.new(
        VNPAY_HASH_SECRET.encode("utf-8"),
        has_data.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()
    
    return received_hash.upper() == calculated_hash.upper(), params


def _generate_querydr_hash(
    request_id: str,
    version: str,
    command: str,
    tmn_code: str,
    txn_ref: str,
    transaction_date: str,
    create_date: str,
    ip_addr: str,
    order_info: str,
) -> str:
    """
    Generate secure hash for querydr API.
    Format: vnp_RequestId|vnp_Version|vnp_Command|vnp_TmnCode|vnp_TxnRef|vnp_TransactionDate|vnp_CreateDate|vnp_IpAddr|vnp_OrderInfo
    """
    hash_data = "|".join([
        request_id,
        version,
        command,
        tmn_code,
        txn_ref,
        transaction_date,
        create_date,
        ip_addr,
        order_info,
    ])
    return hmac.new(
        VNPAY_HASH_SECRET.encode("utf-8"),
        hash_data.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()


def _generate_refund_hash(
    request_id: str,
    version: str,
    command: str,
    tmn_code: str,
    transaction_type: str,
    txn_ref: str,
    amount: str,
    transaction_no: str,
    transaction_date: str,
    create_by: str,
    create_date: str,
    ip_addr: str,
    order_info: str,
) -> str:
    """
    Generate secure hash for refund API.
    Format: vnp_RequestId|vnp_Version|vnp_Command|vnp_TmnCode|vnp_TransactionType|vnp_TxnRef|vnp_Amount|vnp_TransactionNo|vnp_TransactionDate|vnp_CreateBy|vnp_CreateDate|vnp_IpAddr|vnp_OrderInfo
    """
    hash_data = "|".join([
        request_id,
        version,
        command,
        tmn_code,
        transaction_type,
        txn_ref,
        amount,
        transaction_no,
        transaction_date,
        create_by,
        create_date,
        ip_addr,
        order_info,
    ])
    return hmac.new(
        VNPAY_HASH_SECRET.encode("utf-8"),
        hash_data.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest()


def query_transaction(
    txn_ref: str,
    transaction_date: str,
    ip_address: str,
    order_info: str = "kiem tra gd",
) -> Dict:
    """
    Query transaction status using VNPAY querydr API.
    
    :param txn_ref: Transaction reference (order ID)
    :param transaction_date: Transaction date in format yyyyMMddHHmmss (GMT+7)
    :param ip_address: Server IP address
    :param order_info: Order description (default: "kiem tra gd")
    :return: Response dictionary from VNPAY
    """
    request_id = str(uuid.uuid4()).replace("-", "")[:32]
    version = "2.1.0"
    command = "querydr"
    create_date = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    
    secure_hash = _generate_querydr_hash(
        request_id=request_id,
        version=version,
        command=command,
        tmn_code=VNPAY_TMN_CODE,
        txn_ref=txn_ref,
        transaction_date=transaction_date,
        create_date=create_date,
        ip_addr=ip_address,
        order_info=order_info,
    )
    
    data = {
        "vnp_RequestId": request_id,
        "vnp_Version": version,
        "vnp_Command": command,
        "vnp_TmnCode": VNPAY_TMN_CODE,
        "vnp_TxnRef": txn_ref,
        "vnp_OrderInfo": order_info,
        "vnp_TransactionDate": transaction_date,
        "vnp_CreateDate": create_date,
        "vnp_IpAddr": ip_address,
        "vnp_SecureHash": secure_hash,
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(
            VNPAY_API_URL,
            headers=headers,
            json=data,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e), "status_code": getattr(e.response, "status_code", None)}


def refund_transaction(
    txn_ref: str,
    amount: int,
    transaction_date: str,
    ip_address: str,
    transaction_type: str = "02",  # 02: full refund, 03: partial refund
    order_info: str = "Hoan tien giao dich",
    transaction_no: str = "0",
    create_by: str = "merchant",
) -> Dict:
    """
    Refund a transaction using VNPAY refund API.
    
    :param txn_ref: Transaction reference (order ID)
    :param amount: Refund amount in VND (will be multiplied by 100)
    :param transaction_date: Original transaction date in format yyyyMMddHHmmss (GMT+7)
    :param ip_address: Server IP address
    :param transaction_type: "02" for full refund, "03" for partial refund
    :param order_info: Refund description
    :param transaction_no: Original transaction number from VNPAY (optional, default "0")
    :param create_by: User who creates the refund request
    :return: Response dictionary from VNPAY
    """
    request_id = str(uuid.uuid4()).replace("-", "")[:32]
    version = "2.1.0"
    command = "refund"
    create_date = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    amount_str = str(int(amount) * 100)  # VNPAY requires amount * 100
    
    secure_hash = _generate_refund_hash(
        request_id=request_id,
        version=version,
        command=command,
        tmn_code=VNPAY_TMN_CODE,
        transaction_type=transaction_type,
        txn_ref=txn_ref,
        amount=amount_str,
        transaction_no=transaction_no,
        transaction_date=transaction_date,
        create_by=create_by,
        create_date=create_date,
        ip_addr=ip_address,
        order_info=order_info,
    )
    
    data = {
        "vnp_RequestId": request_id,
        "vnp_Version": version,
        "vnp_Command": command,
        "vnp_TmnCode": VNPAY_TMN_CODE,
        "vnp_TransactionType": transaction_type,
        "vnp_TxnRef": txn_ref,
        "vnp_Amount": amount_str,
        "vnp_OrderInfo": order_info,
        "vnp_TransactionDate": transaction_date,
        "vnp_CreateDate": create_date,
        "vnp_IpAddr": ip_address,
        "vnp_TransactionNo": transaction_no,
        "vnp_CreateBy": create_by,
        "vnp_SecureHash": secure_hash,
    }
    
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(
            VNPAY_API_URL,
            headers=headers,
            json=data,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e), "status_code": getattr(e.response, "status_code", None)}



