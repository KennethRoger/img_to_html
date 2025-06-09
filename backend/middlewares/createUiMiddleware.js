const createUi = require("../utils/createUi");

async function createUiMiddleware(req, res, next) {
  const filePath = req.fileLoc;
  await createUi(filePath);
  next()
}

module.exports = createUiMiddleware;
