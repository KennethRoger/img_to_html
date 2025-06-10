const createUi = require("../utils/createUi");

async function createUiMiddleware(req, res, next) {
  const filePath = req.fileLoc;
  console.log("Creating UI from detected data's");
  const { html, ui, width, height } = await createUi(filePath);
  console.log("UI created");
  req.ui = ui;
  req.html = html;
  req.width = width;
  req.height = height;
  next();
}

module.exports = createUiMiddleware;
