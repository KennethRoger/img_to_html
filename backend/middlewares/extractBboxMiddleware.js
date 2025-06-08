const { extractBbox } = require("../utils/extractBbox");
const mapSquares = require("../utils/mapSquares");

async function extractBboxMiddleware(req, res, next) {
  try {
    const imgPath = req.edgeDetectedImgPath;
    const originalImgPath = req.fileLoc;
    const res = await extractBbox(imgPath);

    // maps all the detected contours in an image grayscale
    await mapSquares(res, originalImgPath);
    console.log("Completed mapping");
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = extractBboxMiddleware;
