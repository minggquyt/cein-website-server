const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db.js");

console.log("Products routes load thành công !");

router.get("/", async (req, res) => {
  console.log("Người dùng fetch đến router")
  try {
    const db = getDB();

    const {
      page = 1,
      limit = 12,
      category,
      sort,
      colors,
      materials,
      sizes
    } = req.query;

    let filter = {};

    // ===== CATEGORY =====
    if (category) {
      const categoryDoc = await db.collection("categories").findOne({
        slug: category
      });

      if (categoryDoc) {
        filter.categoryId = categoryDoc._id;
      } else {
        return res.json({ data: [], message: "Category not found" });
      }
    }

    // ===== FILTER =====
    if (colors) {
      filter["colors.name"] = { $in: colors.split(",") };
    }

    if (materials) {
      filter.material = { $in: materials.split(",") };
    }

    if (sizes) {
      filter.sizes = { $in: sizes.split(",") };
    }

    // ===== SORT =====
    let sortOption = {};

    switch (sort) {
      case "best_selling":
        sortOption = { sold: -1 };
        break;
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // ===== PAGINATION =====
    const skip = (page - 1) * limit;

    const products = await db
      .collection("products")
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await db
      .collection("products")
      .countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;