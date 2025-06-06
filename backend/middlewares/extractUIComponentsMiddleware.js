const { extractUIComponents } = require("../utils/extractUIComponents");

async function extractUIComponentsMiddleware(req, res, next) {
  try {
    const imgPath = req.edgeDetectedImgPath;
    const res = await extractUIComponents(imgPath);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = extractUIComponentsMiddleware;
