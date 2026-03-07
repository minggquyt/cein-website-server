require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");
const sampleRoutes = require("./routes/sampleRoutes");

const app = express();

const port = process.env.PORT || 5000;

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
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// B1: Deploy server để FE gọi tới 
// B2: Tạo hàm fetch từ FE -> server -> database
// B3: Tạo logic login / phân quyền