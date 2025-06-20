const { createWorker } = require("tesseract.js");
const fs = require("node:fs/promises");
const path = require("node:path");
const { Jimp } = require("jimp");

async function ocr(imgPath) {
  try {
    const worker = await createWorker("eng", 1);
    const image = await Jimp.read(imgPath);

    image.greyscale();
    // Sharpening kernal
    image.convolute([
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ]);
    // image.contrast(0.5);
    // image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    //   const red = this.bitmap.data[idx];
    //   const value = red > 150 ? 255 : 0;
    //   this.bitmap.data[idx] = value;
    //   this.bitmap.data[idx + 1] = value;
    //   this.bitmap.data[idx + 2] = value;
    // });

    const baseName = path.basename(imgPath);
    const newPath = path.join(
      __dirname,
      "..",
      `uploads/ocrProcessed/${baseName}`
    );
    await image.write(newPath);
    const { data } = await worker.recognize(
      newPath,
      {
        // preserve_interword_spaces: "1",
        // tessedit_char_whitelist:
        //   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.-_:/$%!?",
        tessedit_pageseg_mode: 3,

      },
      { blocks: true }
    );
    await worker.terminate();

    const jsonData = JSON.stringify(
      data.blocks
        .map((block) =>
          block.paragraphs.map((paragraph) =>
            paragraph.lines.map((line) =>
              line.words
                .filter((word) => word.confidence > 50)
                .map((word) => ({
                  text: word.text,
                  bbox: word.bbox,
                  confidence: word.confidence,
                }))
            )
          )
        )
        .flat(Infinity)
    );
    // const jsonData = JSON.stringify(data)
    await fs.writeFile(path.join(__dirname, "..", "data/text.JSON"), jsonData);
    // await fs.unlink(newPath);
    console.log("successfully written detected texts to file data/text.js");
    return data;
  } catch (err) {
    throw err;
  }
}

module.exports = { ocr };
