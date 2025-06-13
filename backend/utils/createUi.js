const { Jimp } = require("jimp");
const fs = require("fs/promises");
const path = require("node:path");

async function createUi(imgPath = "") {
  // const image = await Jimp.read(imgPath); // 1460, 1092
  const width = 1460;
  const height = 1092;

  const textContourJson = await fs.readFile(
    path.join(__dirname, "..", "data/textGrouped.JSON"),
    "utf-8"
  );
  const blockContourJson = await fs.readFile(
    path.join(__dirname, "..", "data/contours.JSON"),
    "utf-8"
  );

  const textContour = JSON.parse(textContourJson);
  const blockContour = JSON.parse(blockContourJson);

  const fullContourData = blockContour.concat(textContour);

  fullContourData.sort((a, b) => {
    let areaA = (a.bbox.y1 - a.bbox.y0) * (a.bbox.x1 - a.bbox.x0);
    let areaB = (b.bbox.y1 - b.bbox.y0) * (b.bbox.x1 - b.bbox.x0);
    return areaB - areaA;
  });

  const herirarchyTree = buildHeirarchy(fullContourData);
  herirarchyTree.forEach(sortChildrenByDirection);
  herirarchyTree.forEach(determineAlignment);
  const html = generateCode(herirarchyTree[0]);
  console.log(html);
  const processedTreeJson = JSON.stringify(herirarchyTree);

  await fs.writeFile(
    path.join(__dirname, "..", "data/parentChildTree.JSON"),
    processedTreeJson
  );
  console.log("Written generated Tree");

  return { html, width, height };
}

function buildHeirarchy(contourData) {
  const nodes = contourData.map((data) => contourHeirarchyNode(data));
  const roots = [];

  for (let i = 0; i < nodes.length; ++i) {
    let parent = null;
    let minArea = Infinity;

    for (let j = 0; j < nodes.length; ++j) {
      if (i === j) continue;
      if (contains(nodes[j], nodes[i])) {
        const area =
          (nodes[j].bbox.x1 - nodes[j].bbox.x0) *
          (nodes[j].bbox.y1 - nodes[j].bbox.y0);
        if (area < minArea) {
          minArea = area;
          parent = nodes[j];
        }
      }
    }

    if (parent) {
      parent.children.push(nodes[i]);
    } else {
      roots.push(nodes[i]);
    }
  }
  return roots;
}

// Needs upgrading
function contourHeirarchyNode(contour) {
  return {
    element: contour.text ? "p" : "div",
    text: contour.text || "",
    bbox: contour.bbox,
    color: contour.textColor || "",
    bgColor: contour.bgColor || "",
    children: [],
  };
}

function contains(parent, child) {
  return (
    parent.bbox.x0 <= child.bbox.x0 &&
    parent.bbox.y0 <= child.bbox.y0 &&
    parent.bbox.x1 >= child.bbox.x1 &&
    parent.bbox.y1 >= child.bbox.y1
  );
}

// function sortChildrenByDirection(contourTreeNode) {
//   if (!contourTreeNode.children || contourTreeNode.children.length === 0)
//     return;

//   const children = contourTreeNode.children;
//   const visited = Array(children.length).fill(false);
//   let reOrderedChildren = [];
//   let turn = 0;
//   while (turn < children.length) {
//     let smallestY = { index: null, y: Infinity, x: Infinity };
//     let smallestX = { index: null, x: Infinity, y: Infinity };
//     for (let i = 0; i < children.length; ++i) {
//       if (!visited[i]) {
//         if (children[i].bbox.y0 < smallestY.y) {
//           if (children[i].bbox.x0 < smallestY.x) {
//             smallestY.index = i;
//             smallestY.y = children[i].bbox.y0;
//             smallestY.x = children[i].bbox.x0;
//           }
//         }
//         console.log(smallestY.index);
//         if (children[i].bbox.x0 < smallestX.x) {
//           if (children[i].bbox.y0 < smallestX.y) {
//             smallestX.index = i;
//             smallestX.x = children[i].bbox.x0;
//             smallestX.y = children[i].bbox.y0;
//           }
//         }
//         console.log(smallestX.index);
//       }
//     }
//     console.log("\n");

//     // console.log(smallestX, smallestY);

//     if (smallestX.index !== null) {
//       let priorityIndex = null;
//       if (smallestX.index !== smallestY.index) {
//         if (
//           children[smallestY.index].bbox.y1 < children[smallestX.index].bbox.y0
//         ) {
//           priorityIndex = smallestY.index;
//         } else if (
//           children[smallestY.index].bbox.y1 > children[smallestX.index].bbox.y0
//         ) {
//           priorityIndex = smallestX.index;
//         } else {
//           priorityIndex = smallestY.index;
//         }
//       } else {
//         priorityIndex = smallestX.index;
//       }

//       // console.log(children[priorityIndex]);
//       // console.log("\n\n");

//       if (priorityIndex === smallestX.index) {
//         children[priorityIndex].layoutDirection = "column";
//       } else {
//         children[priorityIndex].layoutDirection = "row";
//       }
//       reOrderedChildren.push(children[priorityIndex]);
//       visited[priorityIndex] = true;
//     }
//     ++turn;
//   }
//   contourTreeNode.children = reOrderedChildren;
//   contourTreeNode.children.forEach(sortChildrenByDirection);
// }

function sortChildrenByDirection(contourTreeNode) {
  if (!contourTreeNode.children || contourTreeNode.children.length === 0) {
    return;
  }

  // Sort children based on your criteria
  contourTreeNode.children.sort((a, b) => {
    const aBox = a.bbox;
    const bBox = b.bbox;

    // Find the component with lowest y0 (topmost)
    const lowestY0 = Math.min(aBox.y0, bBox.y0);
    const isATopmost = aBox.y0 === lowestY0;
    const isBTopmost = bBox.y0 === lowestY0;

    // Find the component with lowest x0 (leftmost)
    const lowestX0 = Math.min(aBox.x0, bBox.x0);
    const isALeftmost = aBox.x0 === lowestX0;
    const isBLeftmost = bBox.x0 === lowestX0;

    // Case 1: If both have same y0 and x0, they're the same position (shouldn't happen, but handle it)
    if (aBox.y0 === bBox.y0 && aBox.x0 === bBox.x0) {
      return 0;
    }

    // Case 2: If one is both topmost AND leftmost, it wins
    if (isATopmost && isALeftmost && !(isBTopmost && isBLeftmost)) {
      return -1;
    }
    if (isBTopmost && isBLeftmost && !(isATopmost && isALeftmost)) {
      return 1;
    }

    // Case 3: Neither is both topmost and leftmost, so we have conflict
    // A is topmost, B is leftmost (or vice versa)
    if (isATopmost && isBLeftmost) {
      // A comes first if A's y1 < B's y0 (A is completely above B)
      if (aBox.y1 < bBox.y0) {
        return -1;
      }
      // B comes first if B's x1 < A's x0 (B is completely to the left of A)
      else if (bBox.x1 < aBox.x0) {
        return 1;
      }
      // If they overlap, choose the one with lowest y0 (topmost)
      else {
        return aBox.y0 - bBox.y0;
      }
    }

    if (isBTopmost && isALeftmost) {
      // B comes first if B's y1 < A's y0 (B is completely above A)
      if (bBox.y1 < aBox.y0) {
        return 1;
      }
      // A comes first if A's x1 < B's x0 (A is completely to the left of B)
      else if (aBox.x1 < bBox.x0) {
        return -1;
      }
      // If they overlap, choose the one with lowest y0 (topmost)
      else {
        return aBox.y0 - bBox.y0;
      }
    }

    // Case 4: Both are topmost (same y0) - choose leftmost
    if (aBox.y0 === bBox.y0) {
      return aBox.x0 - bBox.x0;
    }

    // Case 5: Both are leftmost (same x0) - choose topmost
    if (aBox.x0 === bBox.x0) {
      return aBox.y0 - bBox.y0;
    }

    // Case 6: General case - neither shares same x0 or y0
    // Use reading order: top-to-bottom, left-to-right
    const yDiff = aBox.y0 - bBox.y0;
    if (Math.abs(yDiff) > 10) {
      // If significant vertical difference
      return yDiff;
    } else {
      // If roughly on same horizontal line
      return aBox.x0 - bBox.x0;
    }
  });

  // Determine layout direction for the parent
  // if (contourTreeNode.children.length > 1) {
  //   contourTreeNode.layoutDirection = determineLayoutDirection(contourTreeNode.children);
  // }

  // Recursively sort children of each child
  contourTreeNode.children.forEach(sortChildrenByDirection);
}

function determineAlignment(node) {
  let children = node.children;

  let primaryNode = children[0];
  if (primaryNode) primaryNode.layoutDirection = "column";
  for (let i = 1; i < children.length; ++i) {
    if (children[i].bbox.x0 >= primaryNode.bbox.x1) {
      children[i].layoutDirection = "row";
    } else {
      children[i].layoutDirection = "column";
    }
    primaryNode = children[i];
  }

  node.children.forEach(determineAlignment);
}

function generateCode(node, prevTop = 0, prevLeft = 0) {
  if (node.children.length < 1) return "";
  const children = node.children;
  let columns = ``;
  let maxPrevHeight = children[0].bbox.y1;

  let row = `${wrapper(
    children[0],
    generateCode(children[0], children[0].bbox.y1, children[0].bbox.x1),
    "element"
  )}`;
  for (let i = 1; i < children.length; ++i) {
    if (children[i].layoutDirection === "row") {
      maxPrevHeight = Math.max(maxPrevHeight, children[i].bbox.y1);
      row += wrapper(
        children[i],
        generateCode(children[i], children[i].bbox.y1, children[i].bbox.x1),
        "element",
        children[i - 1],
        prevTop
      );
    } else {
      let rowEnd = wrapper(row, null, "flex", null, null);
      columns += rowEnd;
      row = `${wrapper(
        children[i],
        generateCode(children[i], children[i].bbox.y1, children[i].bbox.x1),
        "element",
        prevLeft,
        maxPrevHeight
      )}`;
    }
  }
  // console.log(columns);
  return wrapper(columns, null, "cover", null, null);
}

function wrapper(parent, child, type, prevX, topY) {
  if (type == "cover") {
    return `<div>${parent}</div>\n`;
  } else if (type === "flex") {
    return `<div style="display: flex">${parent}</div>\n`;
  } else if (type === "element") {
    return `<${parent.element} style="width=${
      parent.bbox.x1 - parent.bbox.x0
    }"; height="${parent.bbox.y1 - parent.bbox.y0}; background-color: ${
      parent.bgColor
        ? `rgba(
            ${parent.bgColor.r},
            ${parent.bgColor.g},
            ${parent.bgColor.b},
            ${parent.bgColor.a}
          )`
        : `rgba(0, 0, 0, 0)`
    }; color: ${
      parent.color
        ? `rgba(${parent.color.r}, ${parent.color.g}, ${parent.color.b}, ${parent.color.a})`
        : `rgba(0, 0, 0, 0)`
    }; margin-left: ${parent.bbox.x0 - prevX}px; margin-top:${
      parent.bbox.y0 - topY
    }">\n\t${child?.text || child}</${parent.element}>\n`;
  }
}
module.exports = createUi;
