from flask import Flask, request, render_template
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)

# ===========================
# ⚙️ CẤU HÌNH EMAIL
# ===========================
RECEIVE_EMAIL = "lonnhanhadoi@gmail.com"      # email bạn muốn nhận
APP_PASSWORD = "ihlj awlt lspd wmwz"         # app password gmail

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/send-email", methods=["POST"])
def send_email():
    fullname = request.form.get("fullname")
    email = request.form.get("email", "Không cung cấp")
    phone = request.form.get("phone")
    company = request.form.get("company", "Không cung cấp")
    subject = request.form.get("subject", "Không có tiêu đề")
    message = request.form.get("message")

    # ===========================
    # 📩 Chuẩn bị nội dung email
    # ===========================
    body = f"""
    📩 THÔNG TIN FORM LIÊN HỆ

    👤 Họ và tên: {fullname}
    📧 Email: {email}
    📞 Số điện thoại: {phone}
    🏢 Đơn vị: {company}
    📝 Tiêu đề: {subject}

    --------------------------
    📨 Nội dung:
    {message}
    """

    msg = MIMEMultipart()
    msg["From"] = RECEIVE_EMAIL
    msg["To"] = RECEIVE_EMAIL
    msg["Subject"] = f"Form liên hệ từ {fullname}"

    msg.attach(MIMEText(body, "plain", "utf-8"))

    # ===========================
    # 📤 Gửi email qua SMTP Gmail
    # ===========================
    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(RECEIVE_EMAIL, APP_PASSWORD)
        server.sendmail(RECEIVE_EMAIL, RECEIVE_EMAIL, msg.as_string())
        server.quit()
        return "Gửi thành công!"
    except Exception as e:
        return f"Lỗi gửi mail: {str(e)}"


if __name__ == "__main__":
    app.run(debug=True)
