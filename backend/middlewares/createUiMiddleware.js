const createUi = require("../utils/createUi");

async function createUiMiddleware(req, res, next) {
  // const filePath = req.fileLoc;
  // console.log("Creating UI from detected data's");
  const { html, width, height } = await createUi();
  console.log("UI created");
  // req.ui = ui;
  req.data = { html, width, height };
  next();
}

module.exports = createUiMiddleware;
