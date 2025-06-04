import Jimp from 'jimp';

// After your Sobel edge detection, use this to find shapes
async function detectUIShapes(edgeImage) {
  const width = edgeImage.bitmap.width;
  const height = edgeImage.bitmap.height;
  
  // 1. Find contours from edge image
  const contours = await findContours(edgeImage);
  
  // 2. Classify and extract coordinates for each contour
  const detectedShapes = [];
  
  for (const contour of contours) {
    const shape = classifyAndExtractCoordinates(contour);
    if (shape) {
      detectedShapes.push(shape);
    }
  }
  
  return detectedShapes;
}

// Find contours using a simple flood-fill approach
async function findContours(edgeImage) {
  const width = edgeImage.bitmap.width;
  const height = edgeImage.bitmap.height;
  const visited = Array(height).fill().map(() => Array(width).fill(false));
  const contours = [];
  
  // Threshold for edge pixels (adjust based on your edge detection output)
  const edgeThreshold = 100;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelValue = Jimp.intToRGBA(edgeImage.getPixelColor(x, y)).r;
      
      if (pixelValue > edgeThreshold && !visited[y][x]) {
        const contour = [];
        floodFillContour(edgeImage, x, y, visited, contour, edgeThreshold);
        
        // Only keep contours with reasonable size (filter noise)
        if (contour.length > 10) {
          contours.push(contour);
        }
      }
    }
  }
  
  return contours;
}

function floodFillContour(image, startX, startY, visited, contour, threshold) {
  const stack = [{x: startX, y: startY}];
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  while (stack.length > 0) {
    const {x, y} = stack.pop();
    
    if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x]) {
      continue;
    }
    
    const pixelValue = Jimp.intToRGBA(image.getPixelColor(x, y)).r;
    if (pixelValue <= threshold) {
      continue;
    }
    
    visited[y][x] = true;
    contour.push({x, y});
    
    // Add 8-connected neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx !== 0 || dy !== 0) {
          stack.push({x: x + dx, y: y + dy});
        }
      }
    }
  }
}

// Classify shapes and extract coordinates
function classifyAndExtractCoordinates(contour) {
  if (contour.length < 4) return null;
  
  // Get bounding box
  const minX = Math.min(...contour.map(p => p.x));
  const maxX = Math.max(...contour.map(p => p.x));
  const minY = Math.min(...contour.map(p => p.y));
  const maxY = Math.max(...contour.map(p => p.y));
  
  const width = maxX - minX;
  const height = maxY - minY;
  const area = width * height;
  const contourArea = contour.length;
  
  // Calculate aspect ratio and density
  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  const density = contourArea / area;
  
  // Classify based on shape characteristics
  if (isLine(contour, width, height, aspectRatio)) {
    return {
      type: 'line',
      coordinates: getLineCoordinates(contour),
      boundingBox: {topLeft: {x: minX, y: minY}, bottomRight: {x: maxX, y: maxY}}
    };
  } else if (isQuadrilateral(contour, density, aspectRatio)) {
    return {
      type: 'quadrilateral',
      coordinates: getQuadrilateralCorners(contour, minX, maxX, minY, maxY),
      boundingBox: {topLeft: {x: minX, y: minY}, bottomRight: {x: maxX, y: maxY}}
    };
  } else {
    // Other shapes (images, icons, etc.)
    return {
      type: 'other',
      coordinates: null,
      boundingBox: {topLeft: {x: minX, y: minY}, bottomRight: {x: maxX, y: maxY}},
      area: area
    };
  }
}

function isLine(contour, width, height, aspectRatio) {
  // A line has high aspect ratio and small thickness
  return aspectRatio > 5 && (width < 5 || height < 5);
}

function isQuadrilateral(contour, density, aspectRatio) {
  // Quadrilaterals have moderate density and reasonable aspect ratio
  return density > 0.1 && density < 0.8 && aspectRatio < 10;
}

function getLineCoordinates(contour) {
  // Find the two endpoints of the line
  const sortedByX = [...contour].sort((a, b) => a.x - b.x);
  const sortedByY = [...contour].sort((a, b) => a.y - b.y);
  
  // Determine if it's more horizontal or vertical
  const xRange = sortedByX[sortedByX.length - 1].x - sortedByX[0].x;
  const yRange = sortedByY[sortedByY.length - 1].y - sortedByY[0].y;
  
  if (xRange > yRange) {
    // Horizontal line
    return {
      start: sortedByX[0],
      end: sortedByX[sortedByX.length - 1]
    };
  } else {
    // Vertical line
    return {
      start: sortedByY[0],
      end: sortedByY[sortedByY.length - 1]
    };
  }
}

function getQuadrilateralCorners(contour, minX, maxX, minY, maxY) {
  // For UI elements, we can approximate corners based on bounding box
  // and find the actual contour points closest to these corners
  
  const corners = {
    topLeft: {x: minX, y: minY},
    topRight: {x: maxX, y: minY},
    bottomLeft: {x: minX, y: maxY},
    bottomRight: {x: maxX, y: maxY}
  };
  
  // Find actual contour points closest to each corner
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

// Main function to process your edge-detected image
async function extractUIComponents(edgeImagePath) {
  console.log('Loading edge-detected image...');
  const edgeImage = await Jimp.read(edgeImagePath);
  
  console.log('Detecting UI shapes...');
  const shapes = await detectUIShapes(edgeImage);
  
  // Filter and categorize results
  const results = {
    quadrilaterals: shapes.filter(s => s.type === 'quadrilateral'),
    lines: shapes.filter(s => s.type === 'line'),
    others: shapes.filter(s => s.type === 'other')
  };
  
  console.log(`Found ${results.quadrilaterals.length} quadrilaterals`);
  console.log(`Found ${results.lines.length} lines`);
  console.log(`Found ${results.others.length} other shapes`);
  
  // Log some examples
  if (results.quadrilaterals.length > 0) {
    console.log('Sample quadrilateral:', results.quadrilaterals[0]);
  }
  if (results.lines.length > 0) {
    console.log('Sample line:', results.lines[0]);
  }
  
  return results;
}

// Enhanced version with Douglas-Peucker algorithm for better corner detection
function douglasPeucker(points, epsilon) {
  if (points.length <= 2) return points;
  
  // Find the point with maximum distance from line between first and last
  let maxDistance = 0;
  let maxIndex = 0;
  const start = points[0];
  const end = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [start, end];
  }
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const A = lineEnd.y - lineStart.y;
  const B = lineStart.x - lineEnd.x;
  const C = lineEnd.x * lineStart.y - lineStart.x * lineEnd.y;
  
  return Math.abs(A * point.x + B * point.y + C) / Math.sqrt(A * A + B * B);
}

// Test the complete pipeline
await extractUIComponents('./edges.png');