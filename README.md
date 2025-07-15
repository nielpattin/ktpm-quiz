### Script for result page that has no extra row
- It can get multiple_answer_question and single_answer_question
```javascript
(function scrapeQuestionsAndAnswers(startQuestionId = 106) {
  const questions = [];
  const questionElements = document.querySelectorAll(
    '[data-testid="part-Submission_GradedMultipleChoiceQuestion"], [data-testid="part-Submission_GradedCheckboxQuestion"]'
  );
  let currentQuestionId = startQuestionId;

  questionElements.forEach((questionElement, index) => {
    // Generate custom question ID (e.g., q-106, q-107, etc.)
    const questionId = `q-${currentQuestionId++}`;

    // Extract question text
    const questionTextElement = questionElement.querySelector('.rc-CML p span span');
    const questionText = questionTextElement ? questionTextElement.textContent.trim() : '';

    // Determine question type
    const isCheckboxQuestion = questionElement.getAttribute('data-testid') === 'part-Submission_GradedCheckboxQuestion';
    const questionType = isCheckboxQuestion ? 'multiple_answer_question' : 'single_answer_question';

    // Initialize question object
    const questionObj = {
      question_id: questionId,
      question_text: questionText,
      question_type: questionType,
      answers: []
    };

    // Extract answers
    const answerElements = questionElement.querySelectorAll('.rc-Option');
    let userSelectedIndices = [];

    // First pass: Identify selected answers
    answerElements.forEach((answerElement, answerIndex) => {
      if (answerElement.querySelector('label.cui-isChecked')) {
        userSelectedIndices.push(answerIndex);
      }
    });

    // Check correctness based on question type
    let isCorrectFeedback = false;
    if (!isCheckboxQuestion) {
      // For single-answer questions, check for feedback div (icon-correct/icon-incorrect)
      const feedbackDiv = questionElement.querySelector('.css-nb56am, .css-1avg83a');
      isCorrectFeedback = feedbackDiv && feedbackDiv.querySelector('[data-testid="icon-correct"]') !== null;
    }

    // Second pass: Build answer objects
    answerElements.forEach((answerElement, answerIndex) => {
      // Extract answer text
      const answerTextElement = answerElement.querySelector('.rc-CML p span span');
      const answerText = answerTextElement ? answerTextElement.textContent.trim() : '';

      // Extract answer ID from input value
      const inputElement = answerElement.querySelector(
        isCheckboxQuestion ? 'input[type="checkbox"]' : 'input[type="radio"]'
      );
      const answerId = inputElement ? inputElement.getAttribute('value') : `answer_${answerIndex}`;

      // Determine correctness
      let isCorrect = false;
      const isChecked = answerElement.querySelector('label.cui-isChecked') !== null;

      if (isCheckboxQuestion) {
        // For checkbox questions, use prompt-CORRECT/prompt-INCORRECT in sibling div
        if (isChecked) {
          const siblingDiv = answerElement.nextElementSibling;
          isCorrect = siblingDiv && siblingDiv.querySelector('[data-testid="prompt-CORRECT"]') !== null;
        }
      } else {
        // For radio questions, use prompt-CORRECT in sibling div or feedback div
        if (isChecked) {
          const siblingDiv = answerElement.nextElementSibling;
          isCorrect =
            (siblingDiv && siblingDiv.querySelector('[data-testid="prompt-CORRECT"]') !== null) ||
            isCorrectFeedback;
        }
      }

      // Create answer object
      const answerObj = {
        answer_id: `${index}-${answerIndex}`,
        answer_text: answerText,
        is_correct: isCorrect
      };

      questionObj.answers.push(answerObj);
    });

    questions.push(questionObj);
  });

  console.log(JSON.stringify(questions, null, 2));
})(106);
```

### Script for quiz that have extra row

```javascript
function scrapeQuestionsAndAnswers(startQuestionId = 6) {
  const questions = [];
  const questionElements = document.querySelectorAll('[data-testid="part-Submission_GradedMultipleChoiceQuestion"]');
  let currentQuestionId = startQuestionId;

  questionElements.forEach((questionElement, index) => {
    // Generate custom question ID (e.g., q-6, q-7, etc.)
    const questionId = `q-${currentQuestionId++}`;

    // Extract question text
    const questionTextElement = questionElement.querySelector('.rc-CML p span span');
    const questionText = questionTextElement ? questionTextElement.textContent.trim() : '';

    // Initialize question object
    const questionObj = {
      question_id: questionId,
      question_text: questionText,
      question_type: 'single_answer_question',
      answers: []
    };

    // Extract answers
    const answerElements = questionElement.querySelectorAll('.rc-Option');
    let userSelectedIndex = -1;

    // First pass: Identify the user-selected answer
    answerElements.forEach((answerElement, answerIndex) => {
      if (answerElement.querySelector('label.cui-isChecked')) {
        userSelectedIndex = answerIndex;
      }
    });

    // Check correctness from the feedback div
    const feedbackDiv = questionElement.querySelector('.css-nb56am, .css-1avg83a');
    const isCorrect = feedbackDiv && feedbackDiv.querySelector('[data-testid="icon-correct"]') !== null;

    // Second pass: Build answer objects
    answerElements.forEach((answerElement, answerIndex) => {
      // Extract answer text
      const answerTextElement = answerElement.querySelector('.rc-CML p span span');
      const answerText = answerTextElement ? answerTextElement.textContent.trim() : '';

      // Extract answer ID from input value
      const inputElement = answerElement.querySelector('input[type="radio"]');
      const answerId = inputElement ? inputElement.getAttribute('value') : `answer_${answerIndex}`;

      // Determine if this is the correct answer
      const answerIsCorrect = answerIndex === userSelectedIndex ? isCorrect : false;

      // Create answer object
      const answerObj = {
        answer_id: `${index}-${answerIndex}`,
        answer_text: answerText,
        is_correct: answerIsCorrect
      };

      questionObj.answers.push(answerObj);
    });

    questions.push(questionObj);
  });

  return questions;
}

// Execute the function with a starting question ID of 6 and log the result
console.log(JSON.stringify(scrapeQuestionsAndAnswers(41), null, 2));
```