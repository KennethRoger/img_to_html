const { createWorker } = require("tesseract.js");
const fs = require("node:fs/promises");
const path = require("node:path");

async function ocr(imgPath) {
  try {
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(
      imgPath,
      {
        // preserve_interword_spaces: "1",
        // tessedit_char_whitelist:
        //   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@.-_:/$%!?",
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
    await fs.writeFile(path.join(__dirname, "..", "data/text.js"), jsonData);
    await fs.unlink(imgPath);
    console.log("successfully written to file data/text.js");
    return data;
  } catch (err) {
    throw err;
  }
}

module.exports = { ocr };
