// Variables
var currentQuestion = 0;
var progressButton;
var resetButton;
var showCorrectButton;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    progressButton = document.getElementById('progress-button');
    progressButton.addEventListener('click', () => {
        updateProgressBar();
    });
    resetButton = document.getElementById('reset-button');
    resetButton.addEventListener('click', () => {
        resetProgressBar();
    });
    showCorrectButton = document.getElementById('show-correct-button');
    showCorrectButton.addEventListener('click', () => {
        showCorrect();
    });
    console.log('Application initialized');
    loadQuestion();
});


//Create an object that contains a question
//4 answers, and a random number between 1 and 100 for each answer (where the total of all ansers  is 100)
//and indicates the correct answer
// if the question is of type poll or quiz, it should also contain the correct answer
const questions = [
    {
        question: 'What were the Rams original team colors?',
        answers: ['Blue and White', 'Black and Red', 'Blue and Yellow'],
        values: [20, 50, 30],
        correctAnswer: 1,
        type: 'quiz'
    },
    {
        question: 'How many total Super Bowls have the Rams played in all-time?',
        answers: ['3', '4', '5'],
        values: [25, 20, 55],
        correctAnswer: 2,
        type: 'quiz'
    },
    {   
        question: 'What is your favorite Rams uniform combo?',
        answers: ['Home (Royal + Sol)', 'Away (White + Royal)', 'Alternate (Bone)', 'Alternate (Royal)'],
        values: [35, 15, 40, 10],
        correctAnswer: null,
        type: 'poll'
    }
];

function loadQuestion() {
    
    const q = currentQuestion;
    const questionText = document.getElementById('question-text');
    questionText.textContent = questions[q].question;

    const answers = [
        document.getElementById('answer-1'),
        document.getElementById('answer-2'),
        document.getElementById('answer-3'),
        document.getElementById('answer-4')
    ];

    for (let i = 0; i < answers.length; i++) {
        answers[i].style.display = 'none';
    }

    for (let i = 0; i < questions[q].answers.length; i++) {
        const answerText = document.getElementById('answer-text-' + (i + 1));
        answerText.textContent = questions[q].answers[i];
        answers[i].style.display = 'block';
    }
}

// Progress Bar
function updateProgressBar() {

    console.log(currentQuestion, questions[currentQuestion]);

    const q = questions[currentQuestion];
    for (let i = 0; i < q.values.length; i++) {
        const bar = document.getElementById('js-progressbar-' + (i + 1));
        const overlay = document.getElementById('progress-overlay-' + (i + 1));
        bar.value = 0; // reset bar
        overlay.textContent = ''; // reset overlay

        let val = 0;
        const target = q.values[i];
        const interval = setInterval(() => {
            if (val >= target) {
                clearInterval(interval);
            } else {
                val++;
                bar.value = val;
                overlay.textContent = val + '%';
            }
        }, 50);
    }
}

function showCorrect() {
    console.log("Showing correct answer:" + questions[currentQuestion].correctAnswer);
    
    // update the progress bar color to the correct answer
    if (questions[currentQuestion].correctAnswer != null) {
        const bar = document.getElementById('js-progressbar-' + (questions[currentQuestion].correctAnswer + 1));
        bar.classList.add('correct-progress');
    } else {
        console.log("This is a Poll, there is no correct answer for this question");

        // compare the values of the current question and add the correct-progress class to the highest value
        const maxValue = Math.max(...questions[currentQuestion].values);
        const maxIndex = questions[currentQuestion].values.indexOf(maxValue);
        const bar = document.getElementById('js-progressbar-' + (maxIndex + 1));
        bar.classList.add('correct-progress');
    }

    
}

function resetProgressBar() {

    console.log("Resetting progress bar");

    const q = questions[currentQuestion];
    for (let i = 0; i < q.values.length; i++) {
        const bar = document.getElementById('js-progressbar-' + (i + 1));
        const overlay = document.getElementById('progress-overlay-' + (i + 1));
        bar.classList.remove('correct-progress');
        bar.value = 0; // reset bar
        overlay.textContent = ''; // reset overlay
    }
    currentQuestion++;
    if (currentQuestion >= questions.length) {
        currentQuestion = 0;
    }
    loadQuestion();
}
