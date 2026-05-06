const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const moment = require("moment");

router.post("/create_payment_url", (req, res) => {
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    
    // THỬ THAY CẶP KEY NÀY
    let tmnCode = "CPV38986"; 
    let secretKey = "G8S8A2U6L7E1S5T4A3B2G1F0D9C8B7A6"; 
    
    let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    let returnUrl = "http://localhost:3000/payment-success";
    let orderId = moment(date).format('DDHHmmss');

    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': 'Thanh toan don hang test', // Không dấu, không ký tự đặc biệt
        'vnp_OrderType': 'topup', // Thử đổi thành topup
        'vnp_Amount': 5000000, // 50,000 VND
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': '127.0.0.1',
        'vnp_CreateDate': createDate
    };

    // Sắp xếp
    vnp_Params = Object.keys(vnp_Params)
        .sort()
        .reduce((obj, key) => {
            obj[key] = vnp_Params[key];
            return obj;
        }, {});

    const querystring = require('qs');
    // Băm với encode: false
    let signData = querystring.stringify(vnp_Params, { encode: false });
    const crypto = require("crypto");
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
    
    vnp_Params['vnp_SecureHash'] = signed;
    
    // Tạo URL cuối với encode: true
    let finalUrl = vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: true });

    res.json({ success: true, url: finalUrl });
});

module.exports = router;
