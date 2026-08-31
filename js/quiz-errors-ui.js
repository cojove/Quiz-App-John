// User-facing error messages for quiz generation failures.

/** Builds actionable suggestions for fill-capacity errors. */
function buildFillCapacitySuggestion(ctx, { strictModeTips = false } = {}) {
  let suggestion = "Try adding verses/chapters to your range";
  const extras = [];
  if (ctx.includeAB) extras.push("turn off Include A & B Questions");
  if (strictModeTips && ctx.strictMode) {
    extras.push("raise type Max values");
    extras.push("turn off Strict Mode");
  }
  if (extras.length) suggestion += ", or " + extras.join(", or ");
  return suggestion + ".";
}

const FILL_CAPACITY_ERRORS = {
  [QuizErrorReason.STRICT_CAPACITY]: { strictModeTips: true },
  [QuizErrorReason.LENIENT_CAPACITY]: { strictModeTips: false },
};

/** Builds the detailed fill-capacity message shown below the error heading. */
function buildFillCapacityMessage(ctx, { strictModeTips = false } = {}) {
  const summary = `Your selected chapter/verse range combined with Quiz Settings can fill up to ${ctx.maxFillable} questions but this quiz needs ${ctx.required}.`;
  return `${summary} ${buildFillCapacitySuggestion(ctx, { strictModeTips })}`;
}

/** Renders quiz creation errors in the feedback panel. */
function displayError(quizzes, errDetail) {
  logQuizFailure(quizzes.length, errDetail);

  const feedbackEl = document.getElementById("feedback");
  let message = `Error Creating Quizzes (${quizzes.length} quizzes made)`;

  if (errDetail?.reason) {
    const ctx = errDetail.context ?? {};
    const fillError = FILL_CAPACITY_ERRORS[errDetail.reason];
    if (fillError) {
      message += `<br>${buildFillCapacityMessage(ctx, fillError)}`;
    }
  }

  feedbackEl.innerHTML = message;
}
