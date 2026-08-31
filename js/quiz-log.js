// Quiz generation logging and error state.

const LOG_PREFIX = "[Quiz Generator]";

/** Standard error reason strings shared by creation and UI layers. */
const QuizErrorReason = {
  NO_MATCHING_QUESTIONS:
    "No questions match selected material and question types",
  STRICT_CAPACITY:
    "Selected range cannot fill a full quiz with current type limits",
  LENIENT_CAPACITY:
    "Not enough fillable questions in selected range for one quiz",
  FILL_QUIZ: "Not enough questions to fill quiz",
  CVR_REQUIRED: "Could not find required CVR reference question",
  CR_REQUIRED: "Could not find required CR reference question",
  TYPE_MINIMUM: "Could not meet minimum for question type",
  TYPE_ORDER: "Insufficient questions for type minimum",
  TYPE_PICK: "Could not find question for type",
};

let lastQuizError = null;

/** Clears the most recent quiz error. */
function resetQuizError() {
  lastQuizError = null;
}

/** Returns the most recent quiz error, or null. */
function getLastQuizError() {
  return lastQuizError;
}

/** Logs an informational message to the console. */
function logQuizInfo(message, context) {
  if (context !== undefined) {
    console.log(LOG_PREFIX, message, context);
  } else {
    console.log(LOG_PREFIX, message);
  }
}

/** Records and logs an error without interrupting control flow. */
function recordQuizError(reason, context = {}) {
  lastQuizError = { reason, context };
  console.error(LOG_PREFIX, reason, context);
}

/** Records an error and returns the sentinel value used by creation functions. */
function setQuizError(reason, context = {}) {
  recordQuizError(reason, context);
  return "Error";
}

/** Silent failure sentinel for recoverable lookup misses. */
function quizError() {
  return "Error";
}

/** Logs a failed quiz generation attempt to the console. */
function logQuizFailure(quizzesCompleted, errDetail) {
  console.error(LOG_PREFIX, "Quiz creation failed", {
    quizzesCompleted,
    errDetail,
  });
  if (errDetail?.reason) {
    console.error(
      LOG_PREFIX,
      `Reason: ${errDetail.reason}`,
      errDetail.context ?? {},
    );
  }
}
