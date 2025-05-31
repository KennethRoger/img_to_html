const multer = require("multer");
const path = require("node:path");

// Storage specification with the destiantion to 
// store and its new filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "..", "uploads");
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    +"_" + uniqueSuffix + ext;
    cb(null, `${baseName}_${uniqueSuffix}.${ext}`);
  },
});

module.exports = { storage };
