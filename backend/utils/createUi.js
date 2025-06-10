const { Jimp } = require("jimp");
const fs = require("fs/promises");
const path = require("node:path");

function formElement(contour) {
  const { x0, y0, x1, y1 } = contour.bbox;
  const width = x1 - x0;
  const height = y1 - y0;

  let element;
  let style;
  let text = "";
  if (contour.text) {
    element = "p";
    style = `font-size: ${height}px; color: rgba(${contour.textColor.r}, ${
      contour.textColor.g
    }, ${contour.textColor.b}, ${contour.textColor.a / 255})`;

    text = contour.text;
  } else {
    element = "div";
    style = `width: ${width}px; height: ${height}px; background-color: rgba(${
      contour.bgColor.r
    }, ${contour.bgColor.g}, ${contour.bgColor.b}, ${contour.bgColor.a / 255})`;
  }
  return `<${element} style="position: absolute; top: ${y0}px; left: ${x0}px; ${style}">${text}</${element}>\n`;
}

function createHTML(ui) {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
      <style>
        body {
          margin: 0;
          position: relative;
        }
      </style>
    </head>
    <body>
      ${ui}
    </body>
  </html>
  `;
}

async function createUi(imgPath) {
  const image = await Jimp.read(imgPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;

  const textContourJson = await fs.readFile(
    path.join(__dirname, "..", "data/text.JSON"),
    "utf-8"
  );
  const blockContourJson = await fs.readFile(
    path.join(__dirname, "..", "data/contours.JSON"),
    "utf-8"
  );

  const textContour = JSON.parse(textContourJson);
  const blockContour = JSON.parse(blockContourJson);

  const fullContourData = blockContour.concat(textContour);

  let ui = "";
  for (let contour of fullContourData) {
    ui += formElement(contour);
  }
  const html = createHTML(ui);

  return { html, ui, width, height };
}

module.exports = createUi;
