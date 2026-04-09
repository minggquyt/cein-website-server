const express = require("express");
const router = express.Router();
const { getDB } = require("../../config/db.js");
const slugify = require("slugify");
const authMiddleware = require("../../middleware/authenMiddleWare.js");
const adminMiddleware = require("../../middleware/adminMiddleWare.js");
const { ObjectId } = require("mongodb");

router.get("/statistics", authMiddleware, adminMiddleware, (req, res) => {
  const db = getDB();

  Promise.all([
    db.collection("products").find().sort({ createdAt: -1 }).toArray(),
    db.collection("users").find({ role: 'customer' }).toArray(),
  ])
    .then(([products, customers]) => {
      // Chart query
      const cartStats = {
        labels: products.slice(0, 4).map(p => p.name),
        values: [45, 32, 28, 15]
      };

      const wishlistStats = {
        labels: products.slice(0, 3).map(p => p.name),
        values: [120, 95, 60]
      };

      const salesStats = [500, 800, 450, 1200, 900, 2000, 1800];

      // user querry
      const enrichedCustomers = customers.map(c => ({
        ...c,
        // DỮ LIỆU GIẢ LẬP
        totalSpent: Math.floor(Math.random() * 2000) + 500,
        cartCount: Math.floor(Math.random() * 10),
        wishlistCount: Math.floor(Math.random() * 15),
        totalOrders: Math.floor(Math.random() * 50) + 1 
      }));

      res.json({
        success: true,
        data: {
          charts: {
            cart: cartStats,
            wishlist: wishlistStats,
            sales: salesStats
          },
          products: products,
          customers: enrichedCustomers
        }
      });
    })
    .catch(err => {
      console.error("Lỗi lấy dữ liệu dashboard:", err);
      res.status(500).json({
        success: false,
        message: "Không thể tải dữ liệu thống kê"
      });
    });
});

router.patch("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = getDB();
        const userId = req.params.id;
        const { name, email, phone } = req.body;

        const updateData = {
            name,
            email,
            phone,
            updatedAt: new Date()
        };

        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
               success: false, 
               message: "Không tìm thấy người dùng" 
              });
        }

        res.json({ 
          success: true, 
          message: "Cập nhật thành công" 
        });
    } catch (err) {
        res.status(500).json({ 
          success: false, 
          message: err.message 
        });
    }
});

router.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = getDB();
        const userIdString = req.params.id;

        // 1. Kiểm tra định dạng ID hợp lệ
        if (!ObjectId.isValid(userIdString)) {
            return res.status(400).json({ 
                success: false, 
                message: "ID người dùng không đúng định dạng" 
            });
        }

        const userId = new ObjectId(userIdString);

        // 2. Kiểm tra thông tin User trước khi xóa
        const userToDelete = await db.collection("users").findOne({ _id: userId });

        if (!userToDelete) {
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy người dùng này trong hệ thống" 
            });
        }

        // 3. Bảo vệ Admin: Không cho phép xóa tài khoản có role là admin
        if (userToDelete.role === 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Quyền hạn từ chối: Không thể xóa tài khoản Quản trị viên (Admin)" 
            });
        }
        
        // Xóa giỏ hàng của user
        const deleteCart = db.collection("carts").deleteMany({ userId: userId });
        
        // Xóa wishlist của user
        const deleteWishlist = db.collection("wishlists").deleteMany({ userId: userId });
        
        // Xóa chính user đó
        const deleteUser = db.collection("users").deleteOne({ _id: userId });

        // Chạy song song các tiến trình xóa để tối ưu tốc độ
        await Promise.all([deleteCart, deleteWishlist, deleteUser]);

        // 5. Trả về thông báo thành công
        res.json({ 
            success: true, 
            message: `Hệ thống đã xóa sạch dữ liệu của người dùng: ${userToDelete.name}` 
        });

    } catch (err) {
        console.error("Lỗi khi thực hiện xóa User:", err);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi hệ thống nghiêm trọng khi xử lý yêu cầu xóa" 
        });
    }
});

// TEST API
router.post("/generate-slug", async (req, res) => {
  try {
    const db = getDB();

    const products = await db.collection("products").find().toArray();

    for (let p of products) {
      const newSlug = `${slugify(p.name)}-${p._id.toString()}`;

      await db.collection("products").updateOne(
        { _id: p._id },
        {
          $set: { slug: newSlug }
        }
      );
    }

    res.json({
      success: true,
      message: "Generate slug thành công"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


module.exports = router;
