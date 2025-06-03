const fs = require("node:fs/promises");
const { maskText } = require("../utils/maskText");

async function maskTextMiddleware(req, res, next) {
  try {
    const fileLoc = req.fileLoc;
    await maskText(fileLoc);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { maskTextMiddleware };
