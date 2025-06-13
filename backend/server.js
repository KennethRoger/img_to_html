const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { ocrMiddleware } = require("./middlewares/ocrMiddleware");
const app = express();

const { storage } = require("./utils/multerStorage");
const { maskTextMiddleware } = require("./middlewares/maskTextMiddleware");
const { edgeDetectMiddleware } = require("./middlewares/edgeDetectMiddleware");
const extractBboxMiddleware = require("./middlewares/extractBboxMiddleware");
const createUiMiddleware = require("./middlewares/createUiMiddleware");

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

// Forom uploading image to html creation route
app.post(
  "/upload",
  // upload.single("image"),
  // ocrMiddleware,
  // maskTextMiddleware,
  // edgeDetectMiddleware,
  // extractBboxMiddleware,
  createUiMiddleware,
  (req, res) => {
    try {
      // const html = req.html;
      // const ui = req.ui;
      // const width = req.width;
      // const height = req.height;
      const data = req.data;
      res.status(200).json({
        success: true,
        data: data,
        message: "Successfully created HTML",
      });
      console.log("Done");
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Some internal conflict has occured!",
        error: err,
      });
    }
  }
);

app.listen(port, () => {
  console.log("Server started running on port 3000");
});
