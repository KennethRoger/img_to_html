// const { rgbaToInt } = require("jimp");

// // To group separated words
// // NOTE: Only works if words are arranged based on close together
// function groupText(textContours) {
//   if (textContours.length < 1) return textContours;
//   const groupedTexts = [];
//   let nextPointer = 1;

//   for (let i = 0; i < textContours.length; ++i) {
//     let combinedText = textContours[i];

//     while (textContours[nextPointer]) {
//       let prevText = textContours[nextPointer - 1];
//       let prevBox = prevText.bbox;
//       let { r: pr, g: pg, b: pb, a: pa } = prevText.textColor;

//       let nextText = textContours[nextPointer];
//       let nextBox = nextText.bbox;
//       let { r: nr, g: ng, b: nb, a: na } = nextText.textColor;

//       // Compute dynamic thresholds
//       const prevHeight = prevBox.y1 - prevBox.y0;
//       const nextHeight = nextBox.y1 - nextBox.y0;
//       const avgHeight = (prevHeight + nextHeight) / 2;
//       const xGap = nextBox.x0 - prevBox.x1;
//       const yDiff = Math.abs(prevHeight - nextHeight);

//       if (
//         xGap <= avgHeight * 0.5 &&
//         yDiff <= avgHeight * 0.25 &&
//         rgbaToInt(pr, pg, pb, pa) === rgbaToInt(nr, ng, nb, na)
//       ) {
//         combinedText.text += ` ${nextText.text}`;
//         combinedText.bbox.x1 = Math.max(combinedText.bbox.x1, nextBox.x1);
//         combinedText.bbox.y1 = Math.max(combinedText.bbox.y1, nextBox.y1);
//         nextPointer += 1;
//       } else {
//         groupedTexts.push(combinedText);
//         i = nextPointer - 1;
//         nextPointer += 1;
//         break;
//       }
//     }

//     if (!textContours[nextPointer]) {
//       groupedTexts.push(combinedText);
//       break;
//     }
//   }

//   return groupedTexts;
// }

const { rgbaToInt } = require("jimp");

function groupText(textContours) {
  if (textContours.length < 1) return textContours;
  
  // First, sort by reading order (top to bottom, left to right)
  const sortedTexts = [...textContours].sort((a, b) => {
    const yDiff = a.bbox.y0 - b.bbox.y0;
    if (Math.abs(yDiff) > 10) { // If significant vertical difference
      return yDiff;
    }
    return a.bbox.x0 - b.bbox.x0; // Same line, sort by horizontal position
  });
  
  const groupedTexts = [];
  const used = new Set();
  
  for (let i = 0; i < sortedTexts.length; i++) {
    if (used.has(i)) continue;
    
    const currentGroup = [i];
    const baseText = sortedTexts[i];
    const baseBox = baseText.bbox;
    const baseHeight = baseBox.y1 - baseBox.y0;
    
    // Look for texts that should be grouped with current text
    for (let j = i + 1; j < sortedTexts.length; j++) {
      if (used.has(j)) continue;
      
      const candidateText = sortedTexts[j];
      const candidateBox = candidateText.bbox;
      
      // Check if this candidate can be grouped with any text in current group
      let canGroup = false;
      
      for (const groupIndex of currentGroup) {
        const groupText = sortedTexts[groupIndex];
        if (shouldGroup(groupText, candidateText)) {
          canGroup = true;
          break;
        }
      }
      
      if (canGroup) {
        currentGroup.push(j);
      }
    }
    
    // Mark all texts in this group as used
    currentGroup.forEach(index => used.add(index));
    
    // Create the combined text object
    if (currentGroup.length === 1) {
      groupedTexts.push(sortedTexts[currentGroup[0]]);
    } else {
      const combinedText = createCombinedText(currentGroup.map(idx => sortedTexts[idx]));
      groupedTexts.push(combinedText);
    }
  }
  
  return groupedTexts;
}

function shouldGroup(text1, text2) {
  const box1 = text1.bbox;
  const box2 = text2.bbox;
  
  // Check if they have the same color
  const color1 = rgbaToInt(text1.textColor.r, text1.textColor.g, text1.textColor.b, text1.textColor.a);
  const color2 = rgbaToInt(text2.textColor.r, text2.textColor.g, text2.textColor.b, text2.textColor.a);
  
  if (color1 !== color2) return false;
  
  const height1 = box1.y1 - box1.y0;
  const height2 = box2.y1 - box2.y0;
  const avgHeight = (height1 + height2) / 2;
  
  // Check vertical alignment (are they on roughly the same line?)
  const verticalOverlap = Math.min(box1.y1, box2.y1) - Math.max(box1.y0, box2.y0);
  const minHeight = Math.min(height1, height2);
  
  // Must have significant vertical overlap to be on same line
  if (verticalOverlap < minHeight * 0.5) return false;
  
  // Check horizontal proximity
  const horizontalGap = Math.min(
    Math.abs(box2.x0 - box1.x1), // gap between text1 end and text2 start
    Math.abs(box1.x0 - box2.x1)  // gap between text2 end and text1 start
  );
  
  // Allow grouping if gap is reasonable (less than average character width)
  const maxGap = avgHeight * 0.8; // Adjust this multiplier as needed
  
  return horizontalGap <= maxGap;
}

function createCombinedText(textGroup) {
  // Sort the group by horizontal position to get correct word order
  const sortedGroup = textGroup.sort((a, b) => a.bbox.x0 - b.bbox.x0);
  
  // Combine text with spaces
  const combinedTextContent = sortedGroup.map(t => t.text).join(' ');
  
  // Calculate bounding box that encompasses all texts
  const minX = Math.min(...sortedGroup.map(t => t.bbox.x0));
  const minY = Math.min(...sortedGroup.map(t => t.bbox.y0));
  const maxX = Math.max(...sortedGroup.map(t => t.bbox.x1));
  const maxY = Math.max(...sortedGroup.map(t => t.bbox.y1));
  
  // Use the highest confidence and most common color
  const bestText = sortedGroup.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  );
  
  return {
    text: combinedTextContent,
    bbox: {
      x0: minX,
      y0: minY,
      x1: maxX,
      y1: maxY
    },
    confidence: Math.max(...sortedGroup.map(t => t.confidence)),
    textColor: bestText.textColor
  };
}

// Alternative simpler approach if you prefer line-by-line grouping
function groupTextByLines(textContours) {
  if (textContours.length < 1) return textContours;
  
  // Group by lines first
  const lines = [];
  const used = new Set();
  
  for (let i = 0; i < textContours.length; i++) {
    if (used.has(i)) continue;
    
    const currentLine = [textContours[i]];
    const baseBox = textContours[i].bbox;
    const baseHeight = baseBox.y1 - baseBox.y0;
    
    // Find all texts on the same line
    for (let j = i + 1; j < textContours.length; j++) {
      if (used.has(j)) continue;
      
      const candidateBox = textContours[j].bbox;
      const candidateHeight = candidateBox.y1 - candidateBox.y0;
      
      // Check if they're on the same line (vertical overlap)
      const verticalOverlap = Math.min(baseBox.y1, candidateBox.y1) - Math.max(baseBox.y0, candidateBox.y0);
      const minHeight = Math.min(baseHeight, candidateHeight);
      
      if (verticalOverlap > minHeight * 0.5) {
        currentLine.push(textContours[j]);
        used.add(j);
      }
    }
    
    used.add(i);
    lines.push(currentLine);
  }
  
  // Now group texts within each line
  const groupedTexts = [];
  
  for (const line of lines) {
    // Sort line by horizontal position
    line.sort((a, b) => a.bbox.x0 - b.bbox.x0);
    
    const lineGroups = [];
    const lineUsed = new Set();
    
    for (let i = 0; i < line.length; i++) {
      if (lineUsed.has(i)) continue;
      
      const currentGroup = [line[i]];
      lineUsed.add(i);
      
      // Look for adjacent texts with same color and close proximity
      for (let j = i + 1; j < line.length; j++) {
        if (lineUsed.has(j)) continue;
        
        const lastInGroup = currentGroup[currentGroup.length - 1];
        const candidate = line[j];
        
        if (shouldGroup(lastInGroup, candidate)) {
          currentGroup.push(candidate);
          lineUsed.add(j);
        } else {
          break; // Stop looking if we find a gap
        }
      }
      
      // Create combined text for this group
      if (currentGroup.length === 1) {
        lineGroups.push(currentGroup[0]);
      } else {
        lineGroups.push(createCombinedText(currentGroup));
      }
    }
    
    groupedTexts.push(...lineGroups);
  }
  
  return groupedTexts;
}

module.exports = groupText;
