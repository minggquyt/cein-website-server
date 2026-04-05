const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db.js");
const authMiddleware = require("../middleware/authenMiddleWare.js");
const { ObjectId } = require("mongodb");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const userId = new ObjectId(req.user.userId);

    const wishlistItems = await db.collection("wishlist").aggregate([
      {
        $match: { userId: userId }
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          createdAt: 1,
          product: {
            _id: "$product._id",
            name: "$product.name",
            price: "$product.price",
            images: "$product.images",
            slug: "$product.slug"
          }
        }
      }
    ]).toArray();

    res.json({
      success: true,
      data: wishlistItems
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const userId = new ObjectId(req.user.userId);
    const { productId } = req.body;

    // Kiểm tra sản phẩm đã tồn tại trong wishlist chưa
    const existingItem = await db.collection("wishlist").findOne({
      userId,
      productId: new ObjectId(productId)
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm này đã có trong danh sách yêu thích"
      });
    }

    // Insert mới vào collection wishlist
    await db.collection("wishlist").insertOne({
      userId,
      productId: new ObjectId(productId),
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: "Đã thêm vào danh sách yêu thích"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Xóa sản phẩm khỏi wishlist
router.delete("/:productId", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const userId = new ObjectId(req.user.userId);
    const productId = new ObjectId(req.params.productId);

    const result = await db.collection("wishlist").deleteOne({
      userId: userId,
      productId: productId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại trong wishlist"
      });
    }

    res.json({
      success: true,
      message: "Đã xóa khỏi danh sách yêu thích"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;