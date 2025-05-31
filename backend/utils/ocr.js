const { createWorker } = require("tesseract.js");

async function ocr(imgPath) {
  try {
    const worker = await createWorker("eng", 1, {
      logger: (m) => console.log(m),
    });

    const data = await worker.recognize(imgPath);
    return data;
  } catch (err) {
    throw err;
  }
}

module.exports = { ocr };
