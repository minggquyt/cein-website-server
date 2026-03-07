require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");
const sampleRoutes = require("./routes/sampleRoutes");

const app = express();

app.use(cors());
app.use(express.json());


// connect database
connectDB();


// routes
app.use("/api/samples", sampleRoutes);

app.get("/", (req,res)=>{
  res.send("Server running");
});

// start server
app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});

// B1: Deploy server để FE gọi tới 
// B2: Tạo hàm fetch từ FE -> server -> database
// B3: Tạo logic login / phân quyền