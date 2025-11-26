import smtplib
#Set up email
email='lonnhanhadoi@gmail.com'
password='ihlj awlt lspd wmwz'
#email_sent='abc@gmail.com'
#Doc tep gmail
fi=open(r'./gmail.txt',encoding='utf8')
email_sent=[]
r=fi.read().split()
email_sent.append(r)

#Xl
session=smtplib.SMTP('smtp.gmail.com',587)
session.starttls() #enable security
session.login(email,password)
#Noi dung
mail_content='''Subject: hellow
day la thu tu dong minh test python
hahah
hihihi '''
for _ in range(len(email_sent)):
    session.sendmail(email,email_sent[_],mail_content)
print('mail sent')
