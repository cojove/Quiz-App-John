// Helper Functions

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
    ques.book == section.book &&
    ques.ch == section.ch &&
    ques.vs >= section.startVerse &&
    ques.vs <= section.endVerse
  );
}

function shuffleSortByCount(material) {
  shuffle(material);
  material.sort((a, b) => a.count - b.count);
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
