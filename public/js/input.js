const socket = io({
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

socket.on('connect_timeout', (timeout) => {
    console.error('Connection timeout:', timeout);
});

socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('Reconnection attempt:', attemptNumber);
});

socket.on('reconnect', (attemptNumber) => {
    console.log('Reconnected after', attemptNumber, 'attempts');
});

socket.on('reconnect_error', (error) => {
    console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
    console.error('Failed to reconnect');
});

socket.emit('register', 'input');

let currentQuestion = null;
let currentAnswer = null;
let votingLocked = false;
let pollStageActive = false;
let statusShowingA = true;
let answer1;
let answer2;
let answer3;
let answer4;
let answerButtons = [];

function hasAnswerImage(question, index) {
    return Boolean(question.answerImages && question.answerImages[index]);
}

function getAnswerLabel(button) {
    return button.querySelector('.input-answer-label');
}

document.addEventListener('DOMContentLoaded', () => {
    answer1 = document.getElementById('user-answer-button-1');
    answer1.addEventListener('click', () => {
        if (votingLocked) {
            return;
        }
        currentAnswer = 0;
        lockAnswer();
    });

    answer2 = document.getElementById('user-answer-button-2');
    answer2.addEventListener('click', () => {
        if (votingLocked) {
            return;
        }
        currentAnswer = 1;
        lockAnswer();
    });

    answer3 = document.getElementById('user-answer-button-3');
    answer3.addEventListener('click', () => {
        if (votingLocked) {
            return;
        }
        currentAnswer = 2;
        lockAnswer();
    });

    answer4 = document.getElementById('user-answer-button-4');
    answer4.addEventListener('click', () => {
        if (votingLocked) {
            return;
        }
        currentAnswer = 3;
        lockAnswer();
    });

    answerButtons = [answer1, answer2, answer3, answer4];
});

function setVoteStatus(message, stateClass) {
    const statusA = document.getElementById('input-vote-status-a');
    const statusB = document.getElementById('input-vote-status-b');
    const outgoing = statusShowingA ? statusA : statusB;
    const incoming = statusShowingA ? statusB : statusA;

    incoming.textContent = message;
    incoming.className = 'input-vote-status input-vote-status-layer status-visible';
    if (stateClass) {
        incoming.classList.add(stateClass);
    }
    incoming.removeAttribute('aria-hidden');

    outgoing.classList.remove('status-visible');
    outgoing.setAttribute('aria-hidden', 'true');

    statusShowingA = !statusShowingA;
}

function resetVoteStatus() {
    const statusA = document.getElementById('input-vote-status-a');
    const statusB = document.getElementById('input-vote-status-b');

    statusA.textContent = 'Tap your pick below';
    statusA.className = 'input-vote-status input-vote-status-layer status-visible status-open';
    statusA.removeAttribute('aria-hidden');

    statusB.textContent = '';
    statusB.className = 'input-vote-status input-vote-status-layer';
    statusB.setAttribute('aria-hidden', 'true');

    statusShowingA = true;
}

function clearAnswerStates() {
    for (let i = 0; i < answerButtons.length; i++) {
        const btn = answerButtons[i];
        const wrapper = document.getElementById('user-answer-' + (i + 1));
        btn.classList.remove(
            'correct-answer',
            'answer-button-disabled',
            'answer-button-selected',
            'answer-button-locked',
            'answer-button-winner',
            'answer-button-loser'
        );
        btn.disabled = false;
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        if (wrapper) {
            wrapper.classList.remove('answer-row-winner', 'answer-row-loser', 'answer-row-hidden');
        }
    }
    currentAnswer = null;
}

function lockAnswer() {
    console.log('INPUT: Locking in answer', currentAnswer);

    for (let i = 0; i < answerButtons.length; i++) {
        answerButtons[i].disabled = true;

        if (i !== currentAnswer) {
            answerButtons[i].classList.add('answer-button-disabled');
        } else {
            answerButtons[i].classList.add('answer-button-selected');
        }
    }

    setVoteStatus('Vote locked in!', 'status-voted');
    socket.emit('answer', currentAnswer);
}

function lockVotingFromServer() {
    votingLocked = true;

    for (let i = 0; i < answerButtons.length; i++) {
        const btn = answerButtons[i];
        if (!btn.classList.contains('answer-button-selected')) {
            btn.disabled = true;
            btn.classList.add('answer-button-locked');
        }
    }

    setVoteStatus('Voting closed', 'status-locked');
}

function revealWinnerOnInput(winnerIndex) {
    votingLocked = true;

    for (let i = 0; i < currentQuestion.answers.length; i++) {
        const btn = answerButtons[i];
        const wrapper = document.getElementById('user-answer-' + (i + 1));
        btn.disabled = true;

        if (i === winnerIndex) {
            btn.classList.add('answer-button-winner');
            if (wrapper) {
                wrapper.classList.add('answer-row-winner');
            }
        } else {
            btn.classList.add('answer-button-loser');
            if (wrapper) {
                wrapper.classList.add('answer-row-loser');
            }
        }
    }

    const winnerText = currentQuestion.answers[winnerIndex] || 'Winner';
    setVoteStatus(winnerText + ' wins!', 'status-winner');
}

function updateInputAnswerImages(question) {
    for (let i = 0; i < 2; i++) {
        const img = document.getElementById('input-answer-image-' + (i + 1));
        const btn = answerButtons[i];
        if (!img || !btn) {
            continue;
        }

        if (hasAnswerImage(question, i)) {
            img.style.backgroundImage = 'url(assets/' + question.answerImages[i] + ')';
            img.classList.add('input-answer-image--visible');
            btn.classList.add('uk-button-answer--with-image');
        } else {
            img.style.backgroundImage = '';
            img.classList.remove('input-answer-image--visible');
            btn.classList.remove('uk-button-answer--with-image');
        }
    }
}

function populateQuestion(question) {
    currentQuestion = question;
    clearAnswerStates();
    votingLocked = false;

    for (let i = 0; i < 4; i++) {
        document.getElementById('user-answer-' + (i + 1)).style.display = 'none';
    }

    document.getElementById('user-question-text').textContent = currentQuestion.question;

    for (let i = 0; i < currentQuestion.answers.length; i++) {
        document.getElementById('user-answer-' + (i + 1)).style.display = 'block';
        const btn = answerButtons[i];
        const label = getAnswerLabel(btn);
        if (label) {
            label.textContent = currentQuestion.answers[i];
        } else {
            btn.textContent = currentQuestion.answers[i];
        }
        btn.style.display = 'flex';
    }

    updateInputAnswerImages(currentQuestion);
    resetVoteStatus();
}

function playInputEnter() {
    const stage = document.getElementById('input-poll-stage');
    stage.classList.remove('input-poll-exit');
    stage.classList.add('input-poll-enter');
    window.setTimeout(() => stage.classList.remove('input-poll-enter'), 700);
}

function playInputExit() {
    const stage = document.getElementById('input-poll-stage');
    stage.classList.remove('input-poll-enter');
    stage.classList.add('input-poll-exit');
}

socket.on('question', (question) => {
    console.log('INPUT: Received question:', question);

    document.getElementById('waiting-screen').style.display = 'none';
    document.getElementById('input-poll-stage').style.display = 'block';

    populateQuestion(question);

    if (pollStageActive) {
        playInputEnter();
    }
    pollStageActive = true;
});

socket.on('question-exit', () => {
    console.log('INPUT: Question exit transition');
    playInputExit();
});

socket.on('lock-voting', () => {
    console.log('INPUT: Voting locked');
    lockVotingFromServer();
});

socket.on('unlock-voting', () => {
    console.log('INPUT: Voting unlocked');
    votingLocked = false;
});

socket.on('reveal-winner', (payload) => {
    console.log('INPUT: Revealing winner', payload);
    if (!currentQuestion) {
        return;
    }
    const winnerIndex = payload && typeof payload.winnerIndex === 'number'
        ? payload.winnerIndex
        : 0;
    revealWinnerOnInput(winnerIndex);
});

socket.on('show-correct', () => {
    if (currentQuestion && currentQuestion.correctAnswer != null) {
        revealWinnerOnInput(currentQuestion.correctAnswer);
    }
});

socket.on('reset-progress-bar', () => {
    console.log('INPUT: Resetting progress bar');
    clearAnswerStates();
    votingLocked = false;
    if (currentQuestion) {
        resetVoteStatus();
    }
});

socket.on('stop-polling', () => {
    console.log('INPUT: Stopping polling');
    pollStageActive = false;
    votingLocked = false;
    clearAnswerStates();
    document.getElementById('input-poll-stage').style.display = 'none';
    document.getElementById('input-poll-stage').classList.remove('input-poll-exit', 'input-poll-enter');
    document.getElementById('waiting-screen').style.display = 'flex';
    for (let i = 0; i < 4; i++) {
        const btn = answerButtons[i];
        if (btn) {
            btn.style.display = 'none';
        }
    }
});
