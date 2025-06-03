const { Jimp, intToRGBA } = require("jimp");
const fs = require("node:fs/promises");
const path = require("node:path");

function maskRegion(x0, y0, width, height, image) {
  x0 = Math.max(0, x0 - 5);
  y0 = Math.max(0, y0 - 5);
  // const fillColor = image.getPixelColor(x0, y0);
  width = width + 10;
  height = height + 10;
  const fillColor = 0x00ffffff;
  for (let x = x0; x < x0 + width; ++x) {
    for (let y = y0; y < y0 + height; ++y) {
      if (
        x === x0 ||
        y === y0 ||
        x === x0 + width - 1 ||
        y === y0 + height - 1
      ) {
        image.setPixelColor(fillColor, x, y);
      }
      // image.setPixelColor(fillColor, x, y);
    }
  }
}

async function maskText(file) {
  try {
    const image = await Jimp.read(file);
    const bboxJsonArr = await fs.readFile(
      path.join(__dirname, "..", "data/text.JSON"),
      "utf-8"
    );
    let bboDataArr = JSON.parse(bboxJsonArr);

    for (let bboxData of bboDataArr) {
      if (bboxData.confidence > 50) {
        let x0 = bboxData.bbox.x0;
        let y0 = bboxData.bbox.y0;
        let width = bboxData.bbox.x1 - x0;
        let height = bboxData.bbox.y1 - y0;
        maskRegion(x0, y0, width, height, image);
      }
    }

    // const res = await fs.writeFile(
    //   path.join(__dirname, "..", "data/imageData.txt"),
    //   JSON.stringify(data)
    // );
    const baseName = path.basename(file);
    await image.write(path.join(__dirname, "..", `uploads/test/${baseName}`));
    // await fs.unlink(file);
    // console.log("Written image details to file");
    console.log("Written image successfully");
  } catch (err) {
    throw err;
  }
}

module.exports = { maskText };
