const { ocr } = require("../utils/ocr");

async function ocrMiddleware(req, res, next) {
  try {
    const fileLoc = req.fileLoc;
    console.log("Started OCR text detection");
    const data = await ocr(fileLoc);
    next();
  } catch (err) {
    throw err;
  }
}

module.exports = { ocrMiddleware };
