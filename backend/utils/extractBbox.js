const { Jimp, intToRGBA } = require("jimp");
const fs = require("fs/promises");
const path = require("path");

// Function passed each pixel to floodfill algorithm based on a threshold
// and visited and returns all the detected contours
function findContours(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const visited = Array(height)
    .fill()
    .map(() => Array(width).fill(false));
  const contours = [];

  const edgeThreshold = 50;

  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const pixelVal = intToRGBA(image.getPixelColor(x, y)).r;

      if (pixelVal > edgeThreshold && !visited[y][x]) {
        const contour = floodFillContour(image, x, y, visited, edgeThreshold);

        const bbox = contour.bbox;
        if (bbox.x1 - bbox.x0 > 1 && bbox.y1 - bbox.y0 > 1) {
          contours.push(contour);
        }
      }
    }
  }

  return contours;
}

// floodFill algorithm which recursively checks a pixel and its surrounding 8 pixels
// and returns the topLeft and bottomRight pixel points
function floodFillContour(image, startX, startY, visited, threshold) {
  const stack = [{ x: startX, y: startY }];
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  const contour = {};

  while (stack.length > 0) {
    const { x, y } = stack.pop();

    if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x]) {
      continue;
    }

    const pixelVal = intToRGBA(image.getPixelColor(x, y)).r;
    if (pixelVal < threshold) {
      continue;
    }

    visited[y][x] = true;
    if (!Object.keys(contour).length) {
      contour.bbox = { x0: x, y0: x, x1: x, y1: y };
    }

    const points = contour.bbox;

    if (x < points.x0) points.x0 = x;
    if (y < points.y0) points.y0 = y;
    if (x > points.x1) points.x1 = x;
    if (y > points.y1) points.y1 = y;

    for (let dy = -1; dy <= 1; ++dy) {
      for (let dx = -1; dx <= 1; ++dx) {
        if (dx !== 0 || dy !== 0) {
          stack.push({ x: x + dx, y: y + dy });
        }
      }
    }
  }

  return contour;
}

// Main function to extract bbox from the edges
async function extractBbox(edgeImgPath) {
  console.log("Started extracting UI components");
  const edgeImg = await Jimp.read(edgeImgPath);

  const contours = findContours(edgeImg);

  const jsonConturs = JSON.stringify(contours);
  await fs.writeFile(
    path.join(__dirname, "..", "data/contours.JSON"),
    jsonConturs
  );
  return contours;
}

module.exports = { extractBbox };
