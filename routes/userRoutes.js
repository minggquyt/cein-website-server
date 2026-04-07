const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db'); 
const authMiddleware = require('../middleware/authenMiddleWare');

router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const db = getDB();

        const userId = new ObjectId(req.user.userId);

        const user = await db.collection("users").findOne(
            { _id: userId },
            { projection: { password: 0 } } 
        );

        if (!user) 
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });

        res.json({
            success: true, 
            data: user 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
});

router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const db = getDB();
        const userId = new ObjectId(req.user.userId);
        const { name, gender, avatar_url } = req.body;

        const updateData = {
            name,
            gender, 
            updatedAt: new Date()
        };

        // Chỉ cập nhật avatar nếu có link mới
        if (avatar_url) updateData.avatar_url = avatar_url;

        await db.collection("users").updateOne(
            { _id: userId },
            { $set: updateData }
        );

        res.json({ 
            success: true, 
            message: "Cập nhật thông tin thành công",
            data: updateData 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;