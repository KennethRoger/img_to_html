const fs = require("node:fs/promises");
const { maskText } = require("../utils/maskText");

async function maskTextMiddleware(req, res, next) {
  try {
    const fileLoc = req.fileLoc;
    console.log("Started to mask detected text from the image");
    const preProcessedImgPath = await maskText(fileLoc);
    req.preProcessedImgPath = preProcessedImgPath;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { maskTextMiddleware };
