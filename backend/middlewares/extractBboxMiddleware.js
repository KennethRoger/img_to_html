const { extractBbox } = require("../utils/extractBbox");
const mapSquares = require("../utils/mapSquares");

async function extractBboxMiddleware(req, res, next) {
  try {
    const imgPath = req.edgeDetectedImgPath;
    const originalImgPath = req.fileLoc;
    console.log("Started extracting bounding boxes from the detected edges");
    const res = await extractBbox(imgPath);
    console.log("Successfully extracted image bounding boxes");
    // maps all the detected contours in an image grayscale
    console.log("Optional mapping of contours in the image...");
    await mapSquares(res, originalImgPath);
    console.log("Completed mapping");
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = extractBboxMiddleware;
