const edgeDetect = require("../utils/edgeDetect");

async function edgeDetectMiddleware(req, res, next) {
  try {
    const imgPath = req.preProcessedImgPath;
    console.log("Sobel edge detection is working");
    const edgeDetectedImgPath = await edgeDetect(imgPath);
    req.edgeDetectedImgPath = edgeDetectedImgPath;
    console.log("Successfully detected edges from the image");
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { edgeDetectMiddleware };
