const express = require("express");
const router = express.Router();
const { getDB } = require("../../config/db.js");
const slugify = require("slugify");
const authMiddleware = require("../../middleware/authenMiddleWare.js");
const adminMiddleware = require("../../middleware/adminMiddleWare.js");

router.get("/statistics", authMiddleware, adminMiddleware, (req, res) => {
    const db = getDB();

    Promise.all([
        db.collection("products").find().sort({ createdAt: -1 }).toArray(), 
        db.collection("users").find({ role: 'customer' }).toArray(),
    ])
    .then(([products, customers]) => {
        const cartStats = {
            labels: products.slice(0, 4).map(p => p.name), 
            values: [45, 32, 28, 15]
        };

        const wishlistStats = {
            labels: products.slice(0, 3).map(p => p.name),
            values: [120, 95, 60]
        };

        const salesStats = [500, 800, 450, 1200, 900, 2000, 1800];

        const enrichedCustomers = customers.map(c => ({
            ...c,
            totalSpent: Math.floor(Math.random() * 2000) + 500,
            cartCount: Math.floor(Math.random() * 10),
            wishlistCount: Math.floor(Math.random() * 15)
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