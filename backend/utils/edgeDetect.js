const { Jimp, intToRGBA, rgbaToInt } = require("jimp");
const path = require("node:path");

function binaryMap(processedImg, threshold = 50) {
  const width = processedImg.bitmap.width;
  const height = processedImg.bitmap.height;
  processedImg.scan(0, 0, width, height, function (x, y, idx) {
    const gray = this.bitmap.data[idx];
    const value = gray > threshold ? 255 : 0;
    this.bitmap.data[idx] = value;
    this.bitmap.data[idx + 1] = value;
    this.bitmap.data[idx + 2] = value;
  });

  return processedImg;
}

// Sobel edge detection algorithm
function sobelEdgeDetection(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  // Vertical Sobel Kernal
  const kernalX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];

  // Horizontal Sobel Kernal
  const kernalY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];

  // Sobel operation
  for (let y = 1; y < height - 1; ++y) {
    for (let x = 1; x < width - 1; ++x) {
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ++ky) {
        for (let kx = -1; kx <= 1; ++kx) {
          let currPixelColor = intToRGBA(image.getPixelColor(x + kx, y + ky)).r;

          gy += currPixelColor * kernalY[ky + 1][kx + 1];
          gx += currPixelColor * kernalX[ky + 1][kx + 1];
        }
      }

      let determinedColor = Math.round(Math.sqrt(gx * gx + gy * gy));
      let normalizedColor = Math.min(255, determinedColor);

      // if (normalizedColor > threshold) {
      //   image.setPixelColor(
      //     rgbaToInt(normalizedColor, normalizedColor, normalizedColor, 255),
      //     x,
      //     y
      //   );
      // } else {
      //   image.setPixelColor(rgbaToInt(0, 0, 0, 255), x, y);
      // }
      image.setPixelColor(
        rgbaToInt(normalizedColor, normalizedColor, normalizedColor, 255),
        x,
        y
      );
    }
  }

  return image;
}

async function edgeDetect(preProcessedImg) {
  try {
    const image = await Jimp.read(preProcessedImg);

    const sobelImg = sobelEdgeDetection(image);
    const bMappedImg = binaryMap(sobelImg);

    const baseName = path.basename(preProcessedImg);
    const savePath = path.join(
      __dirname,
      "..",
      `uploads/edgeDetected/${baseName}`
    );

    await bMappedImg.write(savePath);
    console.log("Edge detection algorithm completed");
    return savePath;
  } catch (err) {
    throw err;
  }
}

module.exports = edgeDetect;
