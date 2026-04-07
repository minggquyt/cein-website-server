const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db.js");
const { ObjectId } = require("mongodb");
const slugify = require("slugify");
const authenMiddleWare = require("../middleware/authenMiddleWare.js");
const adminMiddleWare = require("../middleware/adminMiddleWare.js");

// Get All products
router.get("/", async (req, res) => {
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

// Get specific product
router.get("/:slug", async (req, res) => {
  try {
    const db = getDB();
    const { slug } = req.params;

    const product = await db.collection("products").findOne({
      slug: slug
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại"
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.post("/", authenMiddleWare, adminMiddleWare, (req, res) => {
  const db = getDB();
  const body = req.body;

  console.log(body);

  // Generate ID to generate slug with business
  const productId = new ObjectId();

  const generatedSlug = `${slugify(body.name)}-${productId.toString()}`;

  const newProduct = {
    _id: productId,
    name: body.name,
    slug: generatedSlug,
    description: body.description,
    price: Number(body.price),
    categoryId: new ObjectId(body.categoryId),
    material: body.material || '',
    images: body.images || [], // Mảng object {url, public_id, isThumbnail}
    colors: body.colors || [], // Mảng object {name, hex}
    sizes: body.sizes || [],   // Mảng chuỗi ['L', 'XL']
    variants: body.variants || [],
    rating: Number(body.rating) || 0,
    reviewCount: 0,
    createdAt: new Date(),
    tags: body.tags || { isNew: true, isSale: false }
  };

  db.collection("products").insertOne(newProduct)
    .then(result => {
      res.status(201).json({ success: true, data: { ...newProduct, _id: result.insertedId } });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ success: false, message: "Lỗi thêm sản phẩm" });
    });
});

router.put("/:id", authenMiddleWare, adminMiddleWare, (req, res) => {
  const db = getDB();
  const productId = req.params.id;
  const body = req.body;

  const newSlug = `${slugify(body.name, { lower: true, locale: 'vi' })}-${productId}`;

    const updateData = {
      name: body.name,
      slug: newSlug,
      description: body.description,
      price: Number(body.price),
      categoryId: new ObjectId(body.categoryId),
      material: body.material,
      images: body.images,
      colors: body.colors,
      sizes: body.sizes,
      variants: body.variants,
      tags: body.tags,
      updatedAt: new Date() 
    };

  db.collection("products").updateOne(
      { _id: new ObjectId(productId) },
      { $set: updateData }
  )
  .then(result => {
      if (result.matchedCount === 0) throw new Error("Không tìm thấy sản phẩm");
      res.json({
        success: true,
        message: "Cập nhật thành công" 
      });
  })
  .catch(err => {
      res.status(500).json({ 
        success: false, 
        message: err.message 
      });
  });
});

router.delete("/:id", authenMiddleWare, adminMiddleWare, (req, res) => {
  const db = getDB();
  db.collection("products").deleteOne({ _id: new ObjectId(req.params.id) })
    .then(result => {
      if (result.deletedCount === 0) throw new Error("Xóa thất bại");
      res.json({
        success: true,
        message: "Xóa thành công"
      });
    })
    .catch(err => res.status(500).json({
      success: false,
      message: err.message
    }));
});

module.exports = router;