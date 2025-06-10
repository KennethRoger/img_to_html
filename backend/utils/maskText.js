const { Jimp, intToRGBA } = require("jimp");
const fs = require("node:fs/promises");
const path = require("node:path");

async function histogramEqualization(image) {
  const pixels = [];
  const histogram = new Array(256).fill(0);

  // Build histogram
  image.scan(
    0,
    0,
    image.bitmap.width,
    image.bitmap.height,
    function (x, y, idx) {
      const gray = this.bitmap.data[idx];
      histogram[gray]++;
      pixels.push({ x, y, value: gray });
    }
  );

  // Calculate cumulative distribution
  const cdf = new Array(256);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }

  // Normalize CDF
  const totalPixels = image.bitmap.width * image.bitmap.height;
  const normalizedCdf = cdf.map((val) => Math.round((val / totalPixels) * 255));

  // Apply equalization
  image.scan(
    0,
    0,
    image.bitmap.width,
    image.bitmap.height,
    function (x, y, idx) {
      const oldValue = this.bitmap.data[idx];
      const newValue = normalizedCdf[oldValue];
      this.bitmap.data[idx] = newValue;
      this.bitmap.data[idx + 1] = newValue;
      this.bitmap.data[idx + 2] = newValue;
    }
  );

  return image;
}

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
      image.setPixelColor(fillColor, x, y);
    }
  }
}

// Function to mask text in an image
async function maskText(file) {
  try {
    let image = await Jimp.read(file);
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
    console.log("Completed masking text and from the image");

    // Additional image processing for edge detection
    image.greyscale();
    image.gaussian(2);
    image.contrast(0.1);
    image.normalize();
    // apply histogram equilization
    image = await histogramEqualization(image);

    const jsonData = JSON.stringify(bboDataArr);
    await fs.writeFile(path.join(__dirname, "..", "data/text.JSON"), jsonData);

    const baseName = path.basename(file);
    const preProcessedImgPath = path.join(
      __dirname,
      "..",
      `uploads/preprocessed/${baseName}`
    );

    await image.write(preProcessedImgPath);
    console.log("Completed image preprocessing. Moving on to edge detection...");
    return preProcessedImgPath;
  } catch (err) {
    throw err;
  }
}

module.exports = { maskText };
