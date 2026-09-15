/*
 * GENERAL HELPERS
 */

function consoleLog(data) {
  console.log(JSON.parse(JSON.stringify(data)));
}

function shuffle(arr) {
  let i = arr.length,
    j,
    temp;
  while (--i > 0) {
    j = Math.floor(Math.random() * (i + 1));
    temp = arr[j];
    arr[j] = arr[i];
    arr[i] = temp;
  }
}

function shuffleSortByCount(material) {
  shuffle(material);
  material.sort((a, b) => a.count - b.count);
}

/*
 * EVENT LISTENER HELPER FUNCTIONS
 */

// Set all question type checkboxes to checked
function setAllQTypesChecked() {
  const checkboxEls = document.querySelectorAll('.qtype-row input[type="checkbox"]');
  for (checkbox of checkboxEls) {
    checkbox.checked = true;
  }
}

// Set all question type min/max to defaults
function setAllQTypesMinMaxReset() {
  document.getElementById("int-min").value = "7";
  document.getElementById("int-max").value = "14";
  document.getElementById("ma-min").value = "2";
  document.getElementById("ma-max").value = "4";
  document.getElementById("ref-min").value = "3";
  document.getElementById("ref-max").value = "5";
  document.getElementById("quote-min").value = "2";
  document.getElementById("quote-max").value = "3";
  document.getElementById("finish-min").value = "3";
  document.getElementById("finish-max").value = "5";
  document.getElementById("sit-min").value = "2";
  document.getElementById("sit-max").value = "4";
}

// Set all question type clubs to provided arguments
function setAllQTypesClubs(intClub, maClub, refClub, qtClub, ftvClub, sitClub) {
  document.getElementById("int-club").value = intClub;
  document.getElementById("ma-club").value = maClub;
  document.getElementById("ref-club").value = refClub;
  document.getElementById("quote-club").value = qtClub;
  document.getElementById("finish-club").value = ftvClub;
  document.getElementById("sit-club").value = sitClub;
}

/*
 * Create Quiz Helper Fnnctions
 */
function quesInMaterial(ques, material) {
  for (let section of material) {
    if (quesInSection(ques, section)) {
      return true;
    }
  }
  return false;
}

function quesInSection(ques, section) {
  return (
    ques.book == section.book && ques.ch == section.ch && ques.vs >= section.startVerse && ques.vs <= section.endVerse
  );
}

function minTwoRefQues(quesTypes) {
  for (let quesType of quesTypes) {
    if (quesType.type == "ref" && quesType.min >= 2) {
      return true;
    }
  }
  return false;
}

function quesIndexByID(questions, targetId) {
  for (let i = 0; i < questions.length; i++) {
    if (questions[i].id == targetId) {
      return i;
    }
  }
  return -1;
}

function quesTypeIndexByType(type, quesTypes) {
  for (let i = 0; i < quesTypes.length; i++) {
    if (quesTypes[i].type == type) {
      return i;
    }
  }
  return -1;
}

function matchTypeList(ques, section, targetType, countTest) {
  return quesInSection(ques, section) && targetType.includes(ques.typeDisplay) && countTest(ques.count);
}

function matchType(ques, section, targetType, countTest) {
  return quesInSection(ques, section) && ques.type == targetType && countTest(ques.count);
}
