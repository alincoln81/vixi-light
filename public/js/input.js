const socket = io();

// Register as a specific client type
socket.emit('register', 'input'); // or 'input' or 'output'

//Variables
let currentQuestion = null;
let currentAnswer = null;
let answer1;
let answer2;
let answer3;
let answer4;
let answerButtons = [];

document.addEventListener('DOMContentLoaded', () => {
    answer1 = document.getElementById('user-answer-button-1');
    answer1.addEventListener('click', () => {
        currentAnswer = 0;
        lockAnswer();
    });

    answer2 = document.getElementById('user-answer-button-2');
    answer2.addEventListener('click', () => {
        currentAnswer = 1;
        lockAnswer();
    });

    answer3 = document.getElementById('user-answer-button-3');
    answer3.addEventListener('click', () => {
        currentAnswer = 2;
        lockAnswer();
    });

    answer4 = document.getElementById('user-answer-button-4');
    answer4.addEventListener('click', () => {
        currentAnswer = 3;
        lockAnswer();
    });

    answerButtons = [answer1, answer2, answer3, answer4];
});

// --------------------------------------------------------------------------------------------------------------------------------

function lockAnswer() {
    console.log('INPUT: Locking in answer', currentAnswer);
    //disable all answer buttons
    for (let i = 0; i < answerButtons.length; i++) {
        answerButtons[i].disabled = true;
        
        if (i != currentAnswer) {
            answerButtons[i].classList.add('answer-button-disabled');
        } else {
            answerButtons[i].classList.add('answer-button-selected');
        }
    }
    socket.emit('answer', currentAnswer);
}

// Load the question
socket.on('question', (question) => {
    currentQuestion = question;
    console.log('INPUT: Received question:', currentQuestion);
    // Hide the waiting screen
    document.getElementById('waiting-screen').style.display = 'none';

    //Hide the answer-buttons
    for (let i = 0; i < 4; i++) {
        document.getElementById('user-answer-button-' + (i + 1)).style.display = 'none';
    }

    // update the question text
    document.getElementById('user-question-text').textContent = currentQuestion.question;
    document.getElementById('user-question-container').style.display = 'flex';

    // update the answers
    for (let i = 0; i < currentQuestion.answers.length; i++) {
        document.getElementById('user-answer-' + (i + 1)).style.display = 'block';
        let btn = document.getElementById('user-answer-button-' + (i + 1));
        btn.textContent = currentQuestion.answers[i];
        btn.style.display = 'block';
    }
});

socket.on('show-correct', () => {
    console.log('INPUT: Showing correct');
    // show the correct answer
    
    if (currentQuestion.type == "quiz") {
        let btn = document.getElementById('user-answer-button-' + (currentQuestion.correctAnswer + 1));
        //set the btn state to active
        btn.classList.add('correct-answer');
    } else {
        console.log('INPUT: This is a poll, there is no correct answer');
    }
    
});

socket.on('reset-progress-bar', () => {
    console.log('INPUT: Resetting progress bar');
    for (let i = 0; i < 4; i++) {
        let btn = document.getElementById('user-answer-button-' + (i + 1));
        btn.classList.remove('correct-answer');
        btn.classList.remove('answer-button-disabled');
        btn.classList.remove('answer-button-selected');
        btn.disabled = false;
        btn.style.backgroundColor = '#003594';
        btn.style.borderColor = '#003594';
    }
});

socket.on('stop-polling', () => {
    console.log('INPUT: Stopping polling');
    document.getElementById('user-question-container').style.display = 'none';
    document.getElementById('waiting-screen').style.display = 'flex';
    for (let i = 0; i < 4; i++) {
        document.getElementById('user-answer-button-' + (i + 1)).style.display = 'none';
    }
});

