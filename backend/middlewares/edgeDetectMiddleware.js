const edgeDetect = require("../utils/edgeDetect");

async function edgeDetectMiddleware(req, res, next) {
  try {
    const imgPath = req.preProcessedImgPath;
    const edgeDetectedImgPath = await edgeDetect(imgPath);
    req.edgeDetectedImgPath = edgeDetectedImgPath;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { edgeDetectMiddleware };
