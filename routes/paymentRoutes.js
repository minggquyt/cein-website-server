const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const moment = require("moment");

// router.post("/create_payment_url", (req, res) => {
//     const { amount, orderDescription, orderType } = req.body;
//     console.log(amount);
//     console.log(orderDescription);

//     let date = new Date();
//     let createDate = moment(date).format('YYYYMMDDHHmmss');

//     // let tmnCode = "2QX1S61S";
//     // let secretKey = "9GL967O2I8Z5O5M7H1V2V8X3Y4Z5A6B7";
    
//     // thay bằng cặp key khác
//     let tmnCode = "CPV38986";
//     let secretKey = "G8S8A2U6L7E1S5T4A3B2G1F0D9C8B7A6";
//     let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
//     let returnUrl = "http://localhost:3000/payment-success"; // Trang FE nhận kết quả

//     let orderId = moment(date).format('DDHHmmss'); // Mã đơn hàng tạm

//     let vnp_Params = {};
//     vnp_Params['vnp_Version'] = '2.1.0';
//     vnp_Params['vnp_Command'] = 'pay';
//     vnp_Params['vnp_TmnCode'] = tmnCode;
//     vnp_Params['vnp_Locale'] = 'vn';
//     vnp_Params['vnp_CurrCode'] = 'VND';
//     vnp_Params['vnp_TxnRef'] = orderId;
//     vnp_Params['vnp_OrderInfo'] = orderDescription || "Thanh toan don hang";
//     vnp_Params['vnp_OrderType'] = 'other';
//     vnp_Params['vnp_Amount'] = amount * 100; // VNPAY tính theo đơn vị đồng, không có số thập phân
//     vnp_Params['vnp_ReturnUrl'] = returnUrl;
//     // vnp_Params['vnp_IpAddr'] = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
//     vnp_Params['vnp_IpAddr'] = '127.0.0.1';
//     vnp_Params['vnp_CreateDate'] = createDate;

//     // Sắp xếp các tham số theo thứ tự alphabet (Bắt buộc)
//     vnp_Params = Object.keys(vnp_Params)
//         .sort()
//         .reduce((obj, key) => {
//             obj[key] = vnp_Params[key];
//             return obj;
//         }, {});

//     // 1. Tạo chuỗi dữ liệu để băm (KHÔNG ENCODE)
//     const querystring = require('qs');
//     let signData = querystring.stringify(vnp_Params, { encode: false });

//     // 2. Băm dữ liệu bằng HMAC-SHA512
//     const hmac = crypto.createHmac("sha512", secretKey);
//     const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

//     vnp_Params['vnp_SecureHash'] = signed;

//     // 3. Tạo URL cuối cùng (PHẢI ENCODE các giá trị tham số)
//     // Lưu ý: encode: true là mặc định của qs, giúp biến " " thành "%20", "#" thành "%23"...
//     let finalUrl = vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: true });

//     console.log("URL chuẩn để redirect:", finalUrl);
//     res.json({ success: true, url: finalUrl });
// });

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
