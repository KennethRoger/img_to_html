const { rgbaToInt } = require("jimp");

// To group separated words
// NOTE: Only works if words are arranged based on close together
function groupText(textContours) {
  if (textContours.length < 1) return textContours;
  const groupedTexts = [];
  let nextPointer = 1;

  for (let i = 0; i < textContours.length; ++i) {
    let combinedText = textContours[i];

    while (textContours[nextPointer]) {
      let prevText = textContours[nextPointer - 1];
      let prevBox = prevText.bbox;
      let { r: pr, g: pg, b: pb, a: pa } = prevText.textColor;

      let nextText = textContours[nextPointer];
      let nextBox = nextText.bbox;
      let { r: nr, g: ng, b: nb, a: na } = nextText.textColor;

      // Compute dynamic thresholds
      const prevHeight = prevBox.y1 - prevBox.y0;
      const nextHeight = nextBox.y1 - nextBox.y0;
      const avgHeight = (prevHeight + nextHeight) / 2;
      const xGap = nextBox.x0 - prevBox.x1;
      const yDiff = Math.abs(prevHeight - nextHeight);

      if (
        xGap <= avgHeight * 0.5 &&
        yDiff <= avgHeight * 0.25 &&
        rgbaToInt(pr, pg, pb, pa) === rgbaToInt(nr, ng, nb, na)
      ) {
        combinedText.text += ` ${nextText.text}`;
        combinedText.bbox.x1 = Math.max(combinedText.bbox.x1, nextBox.x1);
        combinedText.bbox.y1 = Math.max(combinedText.bbox.y1, nextBox.y1);
        nextPointer += 1;
      } else {
        groupedTexts.push(combinedText);
        i = nextPointer - 1;
        nextPointer += 1;
        break;
      }
    }

    if (!textContours[nextPointer]) {
      groupedTexts.push(combinedText);
      break;
    }
  }

  return groupedTexts;
}

module.exports = groupText;
