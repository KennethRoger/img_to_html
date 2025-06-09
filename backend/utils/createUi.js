const { Jimp } = require("jimp");
const fs = require("fs/promises");
const path = require("path");

async function createUi(path) {
  const image = await Jimp.read(path);

  const textContourJson = await fs.readFile(
    path.join(__dirname, "..", "data/textGrouped.JSON")
  );
  const blockContourJson = await fs.readFile(
    path.join(__dirname, "..", "data/contours.JSON")
  );

  const textContour = JSON.parse(textContourJson);
  const blockContour = JSON.parse(blockContourJson);

  const fullContourData = textContour.concat(blockContour);
  

  const width = image.bitmap.width;
  const height = image.bitmap.height;

  console.log(width, height);
}

module.exports = createUi;
