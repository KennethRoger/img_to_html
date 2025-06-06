const { Jimp, intToRGBA } = require("jimp");
const fs = require("fs/promises");
const path = require("path");

async function detectUiShapes(image) {
  const contours = findContours(image);

  const detectedShapes = [];

  const jsonConturs = JSON.stringify(contours);
  await fs.writeFile(
    path.join(__dirname, "..", "data/Contours.txt"),
    jsonConturs
  );

  for (const contour of contours) {
    const shape = classifyAndExtractCoordinates(contour);
    if (shape) {
      detectedShapes.push(shape);
    }
  }

  return detectedShapes;
}

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
      // if (pixelVal < 50) console.log(pixelVal);
      if (pixelVal > edgeThreshold && !visited[y][x]) {
        const contour = [];
        floodFillContour(image, x, y, visited, contour, edgeThreshold);

        if (contour.length > 10) {
          contours.push(contour);
          console.log("Pushed contour array");
        }
      }
    }
  }

  return contours;
}

function floodFillContour(image, startX, startY, visited, contour, threshold) {
  const stack = [{ x: startX, y: startY }];
  const width = image.bitmap.width;
  const height = image.bitmap.height;

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
    contour.push({ x, y });

    for (let dy = -1; dy <= 1; ++dy) {
      for (let dx = -1; dx <= 1; ++dx) {
        if (dx !== 0 || dy !== 0) {
          stack.push({ x: x + dx, y: y + dy });
        }
      }
    }
  }
}

function classifyAndExtractCoordinates(contour) {
  if (contour.length < 4) return null;

  const minX = Math.min(...contour.map((p) => p.x));
  const maxX = Math.max(...contour.map((p) => p.x));
  const minY = Math.min(...contour.map((p) => p.y));
  const maxY = Math.max(...contour.map((p) => p.y));

  const width = maxX - minX;
  const height = maxY - minY;
  const area = width * height;
  const contourArea = contour.length;

  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  const density = contourArea / area;

  if (isLine(contour, width, height, aspectRatio)) {
    return {
      type: "line",
      coordinates: getLineCoordinates(contour),
      boundingBox: {
        topLeft: { x: minX, y: minY },
        bottomRight: { x: maxX, y: maxY },
      },
    };
  } else if (isQuadrilateral(contour, density, aspectRatio)) {
    return {
      type: "quadrilateral",
      coordinates: getQuadrilateralCorners(contour, minX, maxX, minY, maxY),
      boundingBox: {
        topLeft: { x: minX, y: minY },
        bottomRight: { x: maxX, y: maxY },
      },
    };
  } else {
    return {
      type: "other",
      coordinates: null,
      boundingBox: {
        topLeft: { x: minX, y: minY },
        bottomRight: { x: maxX, y: maxY },
      },
      area,
    };
  }
}

function isLine(contour, width, height, aspectRatio) {
  return aspectRatio > 5 && (width < 5 || height < 5);
}

function isQuadrilateral(density, aspectRatio) {
  return density > 0.1 && density < 0.8 && aspectRatio < 10;
}

function getLineCoordinates(contour) {
  const sortedByX = [...contour].sort((a, b) => a.x - b.x);
  const sortedByY = [...contour].sort((a, b) => a.y - b.y);

  const xRange = sortedByX[sortedByX.length - 1].x - sortedByX[0].x;
  const yRange = sortedByY[sortedByY.length - 1].y - sortedByY[0].y;

  if (xRange > yRange) {
    return {
      start: sortedByX[0],
      end: sortedByX[sortedByX.length - 1],
    };
  } else {
    return {
      start: sortedByY[0],
      end: sortedByY[sortedByY.length - 1],
    };
  }
}

function getQuadrilateralCorners(contour, minX, maxX, minY, maxY) {
  const corners = {
    topLeft: { x: minX, y: minY },
    topRight: { x: maxX, y: minY },
    bottomLeft: { x: minX, y: maxY },
    bottomRight: { x: maxX, y: maxY },
  };

  const actualCorners = {};

  for (const [cornerName, corner] of Object.entries(corners)) {
    let closestPoint = contour[0];
    let minDistance = Infinity;

    for (const point of contour) {
      const distance = Math.sqrt(
        Math.pow(point.x - corner.x, 2) + Math.pow(point.y - corner.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    actualCorners[cornerName] = closestPoint;
  }
  return actualCorners;
}

async function extractUIComponents(edgeImgPath) {
  console.log("Started extracting UI components");
  const edgeImg = await Jimp.read(edgeImgPath);

  const shapes = await detectUiShapes(edgeImg);
  console.log(shapes);
  const results = {
    quadrilaterals: shapes.filter((s) => s.type === "quadrilateral"),
    lines: shapes.filter((s) => s.type === "line"),
    others: shapes.filter((s) => s.type === "other"),
  };

  const jsonRes = JSON.stringify(results);
  await fs.writeFile(
    path.join(__dirname, "..", "data/uiComponents.JSON"),
    jsonRes
  );
  console.log("Results successfully written to uiComponents.JSON file");
  return results;
}

module.exports = { extractUIComponents };
