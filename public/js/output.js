const socket = io();

// Register as a specific client type
socket.emit('register', 'output'); // or 'input' or 'output'
// --------------------------------------------------------------------------------------------------------------------------------

//Variables 
let currentQuestion = null;
let submittedAnswers = [];

// --------------------------------------------------------------------------------------------------------------------------------

socket.on('question', (question) => {
    currentQuestion = question;
    console.log('OUTPUT: Received question:', currentQuestion);

    //Hide the answers
    for (let i = 0; i < 4; i++) {
        document.getElementById('answer-' + (i + 1)).style.display = 'none';
    }

    // Hide the waiting screen
    document.getElementById('output-waiting-screen').style.display = 'none';

    // update the question text
    document.getElementById('question-text').textContent = currentQuestion.question;
    document.getElementById('output-container').style.display = 'block';

    // update the answers
    for (let i = 0; i < currentQuestion.answers.length; i++) {
        document.getElementById('answer-' + (i + 1)).style.display = 'block';
        let txt = document.getElementById('answer-text-' + (i + 1));
        txt.textContent = currentQuestion.answers[i];
        txt.style.display = 'block';
        
        let img = document.getElementById('answer-image-' + (i + 1));

        if (currentQuestion.answerImages[i]) {
            img.style.display = 'block';
            img.style.backgroundImage = 'url(../assets/' + currentQuestion.answerImages[i] + ')';

            //get all the answer text containers and remove the uk-flex-middle class
            let answerTextContainers = document.querySelectorAll('.answer-text-container');
            answerTextContainers.forEach(container => {
                container.classList.add('uk-flex-middle');
                container.classList.remove('uk-flex-bottom');
                container.style.marginLeft = '20px';
            });

        }
        else {
            img.style.display = 'none';

            //get all the answer text containers and remove the uk-flex-middle class
            let answerTextContainers = document.querySelectorAll('.answer-text-container');
            answerTextContainers.forEach(container => {
                container.classList.remove('uk-flex-middle');
                container.classList.add('uk-flex-bottom');
                container.style.marginLeft = '0px';
            });
        }

        submittedAnswers[i] = 0;
    }
});

socket.on('update-progress-bar', () => {
    console.log('OUTPUT: Updating progress bar');

    for (let i = 0; i < currentQuestion.values.length; i++) {
        const bar = document.getElementById('js-progressbar-' + (i + 1));
        const overlay = document.getElementById('progress-overlay-' + (i + 1));
        bar.value = 0; // reset bar
        overlay.textContent = ''; // reset overlay

        let val = 0;
        const target = currentQuestion.values[i];
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
});

socket.on('reset-progress-bar', () => {
    console.log('OUTPUT: Resetting progress bar');
    for (let i = 0; i < 4; i++) {
        document.getElementById('progress-overlay-' + (i + 1)).textContent = '0%';
        let bar = document.getElementById('js-progressbar-' + (i + 1));
        bar.value = 0;
        bar.classList.remove('correct-progress');
        bar.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    }
});

socket.on('show-correct', () => {
    console.log('OUTPUT: Showing correct');
     // update the progress bar color to the correct answer
     if (currentQuestion.correctAnswer != null) {
        const bar = document.getElementById('js-progressbar-' + (currentQuestion.correctAnswer + 1));
        bar.classList.add('correct-progress');
        bar.style.backgroundColor = 'rgba(255, 209, 0, 0.25)';
    } else {
        console.log("This is a Poll, there is no correct answer for this question");
    }
});

socket.on('stop-polling', () => {
    console.log('OUTPUT: Stopping polling');
    document.getElementById('output-container').style.display = 'none';
    document.getElementById('output-waiting-screen').style.display = 'flex';
});

socket.on('answer', (answer) => {
    console.log('OUTPUT: Answer received', answer);
    console.log('OUTPUT: Updating progress bar');
    
    //Total number of submitted answers
    submittedAnswers[answer]++;
    let submittedAnswersTotal = 0;

    for (let i = 0; i < submittedAnswers.length; i++) {
        submittedAnswersTotal += submittedAnswers[i];
    }

    let answerProgressTotal = 0;

    //Update the progress bar
    for (let i = 0; i < currentQuestion.values.length; i++) {
        const bar = document.getElementById('js-progressbar-' + (i + 1));
        const overlay = document.getElementById('progress-overlay-' + (i + 1));
        
        let answerProgress = Math.round((submittedAnswers[i] / submittedAnswersTotal) * 100);
        answerProgressTotal += answerProgress;

        if (answerProgressTotal > 100) {
            answerProgress--;
        }

        console.log(i, 'Bar', bar);
        console.log(i, 'Answer Progress', answerProgress);

        if (answerProgress != NaN) {
            console.log('Updating bar');
            bar.value = answerProgress;
            overlay.textContent = answerProgress + '%';
        }
    }
});

