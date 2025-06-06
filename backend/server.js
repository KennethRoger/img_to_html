const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { ocrMiddleware } = require("./middlewares/ocrMiddleware");
const app = express();

const { storage } = require("./utils/multerStorage");
const { maskTextMiddleware } = require("./middlewares/maskTextMiddleware");
const { edgeDetectMiddleware } = require("./middlewares/edgeDetectMiddleware");
const extractUIComponentsMiddleware = require("./middlewares/extractUIComponentsMiddleware");

const upload = multer({ storage: storage });

require("dotenv").config();
const port = process.env.PORT;

const corsOptions = {
  origin: process.env.CLIENT_URL,
};
app.use(cors(corsOptions));

// static test route
app.get("/", (req, res) => {
  res.status(200).json("Hello");
});

// Uploading route
app.post(
  "/upload",
  upload.single("image"),
  ocrMiddleware,
  maskTextMiddleware,
  edgeDetectMiddleware,
  extractUIComponentsMiddleware,
  (req, res) => {
    const data = req.file;
    // console.log("img", data);
    res
      .status(200)
      .json({ success: true, message: "Successfully recieved formData" });
  }
);

app.listen(port, () => {
  console.log("Server started running on port 3000");
});
