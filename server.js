require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");
const productsRoutes = require("./routes/productsRoutes");
const authenRoutes = require("./routes/authRoutes");
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const adminRoutes = require("./routes/adminRoutes/adminRoutes")
const userRoutes = require("./routes/userRoutes");

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/products",productsRoutes);
app.use("/api/authen",authenRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/wishlist",wishlistRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/user",userRoutes);

app.get("/", (req,res)=>{
  res.send("Server running");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
