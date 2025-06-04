const { Jimp, intToRGBA } = require("jimp");
const fs = require("node:fs/promises");
const path = require("node:path");

// Function to mask a region with a color
function maskRegion(x0, y0, width, height, image) {
  x0 = Math.max(0, x0 - 5);
  y0 = Math.max(0, y0 - 5);
  const fillColor = image.getPixelColor(x0, y0);
  width = width + 10;
  height = height + 10;
  // const fillColor = 0xff00ffff;
  for (let x = x0; x < x0 + width; ++x) {
    for (let y = y0; y < y0 + height; ++y) {
      // if (
      //   x === x0 ||
      //   y === y0 ||
      //   x === x0 + width - 1 ||
      //   y === y0 + height - 1
      // ) {
      //   image.setPixelColor(fillColor, x, y);
      // }
      image.setPixelColor(fillColor, x, y);
    }
  }
}

// Function to mask text in an image
async function maskText(file) {
  try {
    const image = await Jimp.read(file);
    const bboxJsonArr = await fs.readFile(
      path.join(__dirname, "..", "data/text.JSON"),
      "utf-8"
    );
    let bboDataArr = JSON.parse(bboxJsonArr);

    for (let bboxData of bboDataArr) {
      let x0 = bboxData.bbox.x0;
      let y0 = bboxData.bbox.y0;
      let width = bboxData.bbox.x1 - x0;
      let height = bboxData.bbox.y1 - y0;
      bboxData.textColor = intToRGBA(
        image.getPixelColor(
          Math.floor((x0 + width) / 2),
          Math.floor((y0 + height) / 2)
        )
      );
      maskRegion(x0, y0, width, height, image);
    }

    // Additional image processing for edge detection
    image.greyscale();
    image.gaussian(1);
    // image.contrast(0.3);
    image.normalize();
    // apply histogram equilization for test purpose later

    const jsonData = JSON.stringify(bboDataArr);
    await fs.writeFile(path.join(__dirname, "..", "data/text.JSON"), jsonData);

    const baseName = path.basename(file);
    const preProcessedImgPath = path.join(
      __dirname,
      "..",
      `uploads/preprocessed/${baseName}`
    );
    await image.write(preProcessedImgPath);
    return preProcessedImgPath;
    // await fs.unlink(file);
    // console.log("Written image details to file");
    console.log("Written image successfully");
  } catch (err) {
    throw err;
  }
}

module.exports = { maskText };
