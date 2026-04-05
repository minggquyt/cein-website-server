const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db.js");
const authMiddleware = require("../middleware/authenMiddleWare.js");
const { ObjectId } = require("mongodb");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const userId =  new ObjectId(req.user.userId); 

    const cartItems = await db.collection("cart").aggregate([
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
          quantity: 1,
          size: 1,
          color: 1,
          addedAt: 1,
          product: {
            _id: "$product._id",
            name: "$product.name",
            price: "$product.price",
            image: "$product.images"
          }
        }
      }
    ]).toArray();

    res.json({
      success: true,
      data: cartItems
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

    const { productId, quantity, size, color } = req.body;

    // check item đã tồn tại chưa ( check theo variant )
    const existingItem = await db.collection("cart").findOne({
      userId,
      productId: new ObjectId(productId),
      size,
      color
    });

    if (existingItem) {
      // update quantity
      await db.collection("cart").updateOne(
        { _id: existingItem._id },
        {
          $inc: { quantity: quantity }
        }
      );
    } else {
      // insert mới
      await db.collection("cart").insertOne({
        userId,
        productId: new ObjectId(productId),
        quantity,
        size,
        color,
        addedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: "Đã thêm sản phẩm vào giỏ hàng thành công"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const db = getDB();
    const { quantity } = req.body;
    const userId = new ObjectId(req.user.userId);

    const {id: variantId} = req.params;

   const [productIdHash, size, color] = variantId.split("_");

   const productId = new ObjectId(productIdHash);

    await db.collection("cart").updateOne(
        { 
        userId: userId,
        productId: productId,
        size: size,
        color: color
       },
      {
        $set: { quantity }
      }
    );

    res.json({
      success: true,
      message: "Cart updated"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.delete("/:productId", authMiddleware, async (req, res) => {
  try {
    const db = getDB();

    const userId = new ObjectId(req.user.userId);
    const productId = new ObjectId(req.params.productId);

    const result = await db.collection("cart").deleteOne({
      userId: userId,
      productId: productId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart"
      });
    }

    res.json({
      success: true,
      message: "Product removed from cart"
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

module.exports = router;

