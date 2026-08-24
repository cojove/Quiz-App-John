// Functions that help create the GUI

// Use JS to generate the HTML for the Chapter Selection Section
function createChSelectionDiv(materialInfo) {
  let htmlStr = "";
  for (const group of materialInfo.groupInfo) {
    htmlStr += `<div><h2>${group.groupTitle}</h2>`;
    for (let i = group.startIndex; i <= group.endIndex; i++) {
      htmlStr += getChapterRowHtml(
        `ch-section-${i}`,
        materialInfo.chSections[i],
      );
    }
    htmlStr += "</div>";
  }

  // Add htmlStr to Chapter Grid Element
  document.getElementById("chapter-grid").innerHTML = htmlStr;

  // Set first Chapter to Checked
  document.querySelector('input[data-id="ch-section-0"]').checked = true;
}

// Returns HTML for a chapter selection row
function getChapterRowHtml(id, section) {
  return `
    <p class="chapter-row">
      <label>
        <input
          type="checkbox"
          data-id="${id}"
          data-book="${section.book}"
          data-ch="${section.ch}"
          data-start="${section.startVerse}"
          data-end="${section.endVerse}"
          name="material"
        />
        <span class="ch-span">${section.ch}: </span></label> <input id="${id}-start" type="number" value="${section.startVerse}" /> -
        <input id="${id}-end" type="number" value="${section.endVerse}" /> <span class="wt-span">Wt:</span>
        <input id="${id}-wt" type="number" value="1" />
    </p>
  `;
}

// Use JS to generate the HTML for the Question Type Selection Section
function createQTypeSelectionDiv(quesTypeInfo) {
  let htmlStr = "";
  for (const quesType of quesTypeInfo) {
    htmlStr += getQtypeRowHtml(quesType);
  }
  document.getElementById("qtype-div").innerHTML = htmlStr;
}

// Returns HTML for a question type selection row
function getQtypeRowHtml(quesType) {
  const id = quesType.typeCode;
  return `
  <p class="qtype-row" >
      <label>
        <input type="checkbox" name="qtypes" id="${id}" checked />
        ${quesType.type}
      </label>
      <span>Min: <input type="number" id="${id}-min" value="${quesType.min}" /></span>
      <span>Max: <input type="number" id="${id}-max" value="${quesType.max}" /></span>
      <span>
        Club:
        <select id="${id}-club">
          <option value="Text">Text</option>
          <option value="500">500</option>
          <option value="300">300</option>
          <option value="150">150</option>
          <option value="100">100</option>
          <option value="50">50</option>
        </select>
      </span>
    </p>
  `;
}
