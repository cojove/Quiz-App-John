// WCD Quiz Generator by Colin Veldkamp
// August 2026

// Global Variables
let allQuestions;

/*
 * INITIALIZE ON DOMCONTENTLOADED
 * Load data from JohnData.json; generate GUI with loaded data
 * Supporting functions in create-gui.js
 */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  // Load data from JohnData.json
  const response = await fetch("./JohnData.json");
  const johnData = await response.json();

  // Save questions globally for access from Event Listeners
  allQuestions = johnData.questions;

  // Create Chapter Selection and Question Type divs based on data from json file
  createChSelectionDiv(johnData.materialInfo);
  createQTypeSelectionDiv(johnData.quesTypeInfo);
}

/*
 * QUESTION TYPE BUTTON PRESETS
 * Supporting Functions in helpers.js (Event Listener Helpers)
 */

// Senior A Btn Event Listener: Set Question Types to Senior A Settings
document.getElementById("sr-a-btn").addEventListener("click", (e) => {
  setAllQTypesChecked();
  setAllQTypesMinMaxReset();
  setAllQTypesClubs("Text", "Text", "Text", "Text", "Text", "Text");
});

// Rookie A Btn Event Listener: Set Question Types to Rookie A Settings
document.getElementById("rk-a-btn").addEventListener("click", (e) => {
  setAllQTypesChecked();
  setAllQTypesMinMaxReset();
  setAllQTypesClubs("Text", "Text", "300", "150", "150", "300");
});

// B Division Btn Event Listener: Set Question Types to B Division Settings
document.getElementById("b-div-btn").addEventListener("click", (e) => {
  setAllQTypesChecked();
  setAllQTypesMinMaxReset();
  setAllQTypesClubs("Text", "Text", "150", "150", "150", "150");
});

/*
 * CREATE QUIZZES BUTTON
 * getQuizSettings() in user-input.js
 * createQuizzes() in create-quizzes.js
 * outputQuizzes() in output-quizzes.js
*/

document.getElementById("create-qz-btn").addEventListener("click", (e) => {
  // Get and validate user selections.
  let settings = getQuizSettings();
  if (settings == "Error") return false;
  
  // Send Quiz Settings and All Questions for Quiz Creation
  let response = createQuizzes(allQuestions, settings);
  if (response.err == "Error") {
    alert(`Error Creating Quizzes (${response.quizzes.length} quizzes made)`);
  } else {
    outputQuizzes(response.quizzes, settings);
  }
});



