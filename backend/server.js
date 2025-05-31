const express = require("express");
const cors = require("cors");
const app = express();
const multer = require("multer");

const upload = multer({ dest: "./uploads" });

require("dotenv").config();

const port = process.env.PORT;

const corsOptions = {
  origin: process.env.CLIENT_URL,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.status(200).json("Hello");
});

app.post("/upload", upload.single("image"), (req, res) => {
  const data = req.file;
  console.log(data);
  res
    .status(200)
    .json({ success: true, message: "Successfully recieved formData" });
});

app.listen(port, () => {
  console.log("Server started running on port 3000");
});
