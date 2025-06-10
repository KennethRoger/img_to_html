const createUi = require("../utils/createUi");

async function createUiMiddleware(req, res, next) {
  const filePath = req.fileLoc;
  const { html, ui, width, height } = await createUi(filePath);
  req.ui = ui;
  req.html = html;
  req.width = width;
  req.height = height;
  next();
}

module.exports = createUiMiddleware;
