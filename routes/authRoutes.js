const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getDB } = require("../config/db");


router.post("/register", async (req, res) => {

    const db = getDB();
    
    const { name, email, password, avatar_url } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
        name,
        email,
        password: hashedPassword,
        role: "customer",
        avatar_url: avatar_url
    };

    await db.collection("users").insertOne(user);

    res.json({ message: "User created" });

})

router.post("/login", async (req, res) => {

    console.log(req.body);

    const db = getDB();
    
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });

    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
        { userId: user._id, role: user.role },
        "SECRET_KEY",
        { expiresIn: "7d" }
    );



    res.json({ usertoken: token, username: user.name, useravatarurl: user.avatar_url });
})

module.exports = router;