// Renders generated quizzes for print and on-screen display.

function displayPrintBtn() {
  let btn = document.createElement("button");
  btn.innerHTML = "PRINT QUIZ(ZES)";
  btn.addEventListener("click", () => window.print());

  let feedbackEl = document.getElementById("feedback");
  feedbackEl.replaceChildren(btn);
}

function outputQuizzes(quizzes, quizSettings) {
  if (quizSettings.includeAB) {
    outputDistrictQuizzes(quizzes);
  } else {
    outputChurchQuizzes(quizzes);
  }
}

function outputDistrictQuizzes(quizzes) {
  let htmlStr = "";
  let pageNum = 1;

  // Create HTML for each quiz
  for (let quiz of quizzes) {
    // FIRST PAGE - Page div, header, grid div start
    htmlStr += `
        <div class="page" data-pagenum="${pageNum}">
            <h2 class="header-row">${quiz.title}</h2>
            <div class="grid-container">
    `;

    // FIRST PAGE - Questions 1-16 (Index 0-15)
    let classStr = `grid-cell question-div-${pageNum}`;
    htmlStr += createQuesDivs(classStr, 0, 16, 1, 9, quiz.questions);

    // FIRST PAGE: close grid-container & page, add page-break
    htmlStr += `
            </div>
        </div>
        <div class="page-break"></div>
    `;
    pageNum++;

    // SECOND PAGE: - Page div, header, grid div start
    htmlStr += `
        <div class="page" data-pagenum="${pageNum}">
            <h2 class="header-row">${quiz.title}</h2>
            <div class="grid-container">
    `;

    // SECOND PAGE - Questions 17-20 (Index 16-19)
    classStr = `grid-cell question-div-${pageNum}`;
    htmlStr += createQuesDivs(classStr, 16, 20, 17, 19, quiz.questions);

    // SECOND PAGE: Grid Divider
    htmlStr += '<div class="grid-divider"></div>';

    // SECOND PAGE: A&B questions
    let quesNums = [
      "16a",
      "18b",
      "16b",
      "19a",
      "17a",
      "19b",
      "17b",
      "20a",
      "18a",
      "20b",
    ];
    for (let i = 0; i < quiz.alphaQuestions.length; i++) {
      htmlStr += createQuesDiv(classStr, quesNums[i], quiz.alphaQuestions[i]);
    }

    // SECOND PAGE: close grid-container & page, add page-break
    htmlStr += `
            </div>
        </div>
        <div class="page-break"></div>
    `;
    pageNum++;
  }

  // Add htmlStr (all pages for all quizzes) to the page
  document.getElementById("quiz-output").innerHTML = htmlStr;

  // Check for Dynamic Cell Resizing
  fitTextToGridItem();
}

function outputChurchQuizzes(quizzes) {
  let htmlStr = "";
  let pageNum = 1;

  // Create HTML for each quiz
  for (let quiz of quizzes) {
    // FIRST PAGE - Page div, header, grid div start
    htmlStr += `
        <div class="page" data-pagenum="${pageNum}">
            <h2 class="header-row">${quiz.title}</h2>
            <div class="grid-container">
    `;

    // FIRST PAGE - Questions 1-16 (Index 0-20)
    let classStr = `grid-cell church-cell question-div-${pageNum}`;
    htmlStr += createQuesDivs(classStr, 0, 20, 1, 11, quiz.questions);

    // FIRST PAGE: close grid-container & page, add page-break
    htmlStr += `
            </div>
        </div>
        <div class="page-break"></div>
    `;
    pageNum++;
  }

  // Add htmlStr (all pages for all quizzes) to the page
  document.getElementById("quiz-output").innerHTML = htmlStr;

  // Check for Dynamic Cell Resizing
}

function createQuesDivs(
  classStr,
  start,
  stop,
  col1Start,
  col2Start,
  questions,
) {
  let tempStr = "";
  for (let i = start; i < stop; i++) {
    let quesDiv;
    if (i % 2 === 0) {
      quesDiv = createQuesDiv(classStr, col1Start, questions[i]);
      col1Start++;
    } else {
      quesDiv = createQuesDiv(classStr, col2Start, questions[i]);
      col2Start++;
    }
    tempStr += quesDiv;
  }
  return tempStr;
}

function createQuesDiv(classStr, quesNum, question) {
  return `
        <div class="${classStr}">
            <div>${quesNum}</div>
            <div>${question.typeDisplay}</div>
            <div>Q:</div>
            <div class="ques-text">${question.question}</div>
            <div>A:</div>
            <div>
            ${question.answer}
            </div>
            <div>${question.ref} <em>(${question.club})</em></div>
        </div>
    `;
}

/** Shrinks question text until each page fits its print layout. */
function fitTextToGridItem() {
  const pageEls = document.querySelectorAll(".page");

  for (const pageEl of pageEls) {
    // Decrease font size dynamically if text overflows either dimension
    while (
      pageEl.scrollHeight > pageEl.clientHeight ||
      pageEl.scrollWidth > pageEl.clientWidth
    ) {
      const pageNum = pageEl.dataset.pagenum;
      document
        .querySelectorAll(`.question-div-${pageNum} > div`)
        .forEach((element) => {
          let fontSize = parseInt(window.getComputedStyle(element).fontSize);
          fontSize -= 0.25;
          element.style.fontSize = fontSize + "px";
        });
    }
  }
}
