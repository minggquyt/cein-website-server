const express = require("express");
const router = express.Router();
const { getDB } = require("../config/db.js");
const { ObjectId } = require("mongodb");
const slugify = require("slugify");
const authenMiddleWare = require("../middleware/authenMiddleWare.js");
const adminMiddleWare = require("../middleware/adminMiddleWare.js");

router.get("/", async (req, res) => {
  try {
    const db = getDB();

    const pipeline = [
      {
        $lookup: {
          from: "categories",   
          localField: "categoryId", // Field ở collection products (ObjectId)
          foreignField: "_id",      // Field ở collection categories
          as: "categoryDetails"    // Tên field mới chứa mảng kết quả
        }
      },
      { 
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true 
        }
      },
      // 3. Sắp xếp mặc định theo sản phẩm mới nhất
      { $sort: { createdAt: -1 } }
    ];

    // Thực thi truy vấn
    const allProducts = await db.collection("products").aggregate(pipeline).toArray();

    // Trả về dữ liệu
    res.json({
      success: true,
      count: allProducts.length,
      data: allProducts 
    });

  } catch (err) {
    console.error("Lỗi API Products:", err);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi hệ thống khi truy vấn sản phẩm" 
    });
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