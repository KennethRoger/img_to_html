const { Jimp, intToRGBA } = require("jimp");
const path = require("path");
const fs = require("fs/promises");
const groupText = require("./groupText");

// Detect color of contour
function detectContourColor(image, contours) {
  for (let contour of contours) {
    const bbox = contour.bbox;
    let x0 = bbox.x0;
    let y0 = bbox.y0;
    const color = intToRGBA(image.getPixelColor(x0, y0));
    contour.bgColor = color;
  }
}

// Draws aquare based on contour info
function drawContour(image, x0, y0, x1, y1, color) {
  const width = x1 - x0;
  const height = y1 - y0;
  for (let y = y0; y < y0 + height; ++y) {
    for (let x = x0; x < x0 + width; ++x) {
      if (
        x === x0 ||
        y === y0 ||
        x === x0 + width - 1 ||
        y === y0 + height - 1
      ) {
        image.setPixelColor(color, x, y);
      }
    }
  }
  return image;
}

// Main function whose major goal is to mark squares based on all
// detected contours but unfortuatley does other things too
async function mapSquares(contours, imgLoc) {
  const img = await Jimp.read(imgLoc);

  // A sly function to do color mapping for detected contours (Seriously! it should be separate)
  detectContourColor(img, contours);
  await fs.writeFile(
    path.join(__dirname, "..", "data/contours.JSON"),
    JSON.stringify(contours)
  );

  const textContourJson = await fs.readFile(
    path.join(__dirname, "..", "data/text.JSON"),
    "utf-8"
  );
  const textContour = JSON.parse(textContourJson);
  // Another sly function to group related texts (fr! it should absolutely be separate)
  const textContourGrouped = groupText(textContour);
  await fs.writeFile(
    path.join(__dirname, "..", "data/textGrouped.JSON"),
    JSON.stringify(textContourGrouped)
  );
  img.greyscale();

  let textContourImg;
  for (const detail of textContourGrouped) {
    const bbox = detail.bbox;
    const x0 = bbox.x0;
    const y0 = bbox.y0;
    const x1 = bbox.x1;
    const y1 = bbox.y1;

    textContourImg = drawContour(img, x0, y0, x1, y1, 0xff0000ff);
  }

  let fullMappedImg;
  for (const contour of contours) {
    const bbox = contour.bbox;
    const x0 = bbox.x0;
    const y0 = bbox.y0;
    const x1 = bbox.x1;
    const y1 = bbox.y1;

    fullMappedImg = drawContour(textContourImg, x0, y0, x1, y1, 0x00ff85ff);
  }

  await fullMappedImg.write(
    path.join(__dirname, "..", "uploads/mapTest/img_contour.png")
  );
}

module.exports = mapSquares;
