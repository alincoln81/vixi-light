const socket = io();

socket.emit('register', 'output');

let currentQuestion = null;
let submittedAnswers = [0, 0];
let pollContentActive = false;
let winnerRevealed = false;

let tugEasingCache = null;

function getTugEasing() {
    if (!tugEasingCache) {
        tugEasingCache = getComputedStyle(document.documentElement)
            .getPropertyValue('--h2h-tug-transition')
            .trim() || '0.55s cubic-bezier(0.25, 1, 0.5, 1)';
    }
    return tugEasingCache;
}

function hasAnswerImage(question, index) {
    return Boolean(question.answerImages && question.answerImages[index]);
}

function hasAnswerText(question, index) {
    return Boolean(question.answers[index] && question.answers[index].trim());
}

function getLayoutMode(question) {
    const hasImages = hasAnswerImage(question, 0) && hasAnswerImage(question, 1);
    const hasText = hasAnswerText(question, 0) && hasAnswerText(question, 1);

    if (hasImages && hasText) {
        return 'layout-image-text';
    }
    if (hasImages) {
        return 'layout-image-only';
    }
    return 'layout-text-only';
}

function applyLayoutMode(question) {
    const headToHead = document.getElementById('head-to-head');
    headToHead.classList.remove('layout-image-only', 'layout-image-text', 'layout-text-only');
    headToHead.classList.add(getLayoutMode(question));
}

function updateVsBadgeVisibility(leftPercent, vsBadge, animate) {
    if (!vsBadge) {
        return;
    }

    const isLandslide = leftPercent <= 0 || leftPercent >= 100;
    vsBadge.classList.toggle('vs-badge-hidden', isLandslide);

    if (animate) {
        vsBadge.style.transition = 'left ' + getTugEasing() + ', opacity 0.4s ease';
    } else {
        vsBadge.style.transition = 'opacity 0.4s ease';
    }
}

function updateTugOfWarBar(leftPercent, animate) {
    if (winnerRevealed) {
        return;
    }

    leftPercent = Math.max(0, Math.min(100, Math.round(leftPercent)));
    const rightPercent = 100 - leftPercent;

    const leftSegment = document.getElementById('tug-left');
    const rightSegment = document.getElementById('tug-right');
    const leftLabel = document.getElementById('tug-percent-left');
    const rightLabel = document.getElementById('tug-percent-right');
    const divider = document.getElementById('tug-divider');
    const vsBadge = document.querySelector('.h2h-vs-badge');
    const bar = document.getElementById('tug-of-war-bar');

    const tugEasing = getTugEasing();
    const transition = animate ? 'width ' + tugEasing : 'none';

    leftSegment.style.transition = transition;
    rightSegment.style.transition = transition;
    divider.style.transition = animate ? 'left ' + tugEasing : 'none';
    if (vsBadge) {
        vsBadge.style.left = leftPercent + '%';
        updateVsBadgeVisibility(leftPercent, vsBadge, animate);
    }

    leftSegment.style.width = leftPercent + '%';
    rightSegment.style.width = rightPercent + '%';
    divider.style.left = leftPercent + '%';
    leftLabel.textContent = leftPercent + '%';
    rightLabel.textContent = rightPercent + '%';
    bar.setAttribute('aria-valuenow', String(leftPercent));
}

function updateVoteTotal() {
    const total = submittedAnswers[0] + submittedAnswers[1];
    document.getElementById('vote-total-count').textContent = total;
}

function pulseVoteFeedback() {
    if (winnerRevealed) {
        return;
    }

    const bar = document.getElementById('tug-of-war-bar');
    bar.classList.remove('tug-vote-pulse');
    void bar.offsetWidth;
    bar.classList.add('tug-vote-pulse');

    const countEl = document.getElementById('vote-total-count');
    countEl.classList.remove('vote-count-bump');
    void countEl.offsetWidth;
    countEl.classList.add('vote-count-bump');
}

function getPollTransitionElements() {
    return [
        document.getElementById('question-container'),
        document.getElementById('head-to-head')
    ].filter(Boolean);
}

function clearPollTransitionClasses() {
    getPollTransitionElements().forEach((el) => {
        el.classList.remove('poll-exit', 'poll-enter');
    });
}

function playPollEnter() {
    clearPollTransitionClasses();
    getPollTransitionElements().forEach((el) => {
        el.classList.add('poll-enter');
    });
    window.setTimeout(clearPollTransitionClasses, 700);
}

function playPollExit() {
    clearPollTransitionClasses();
    getPollTransitionElements().forEach((el) => {
        el.classList.add('poll-exit');
    });
}

function clearWinnerReveal() {
    winnerRevealed = false;
    const headToHead = document.getElementById('head-to-head');
    const vsBadge = document.querySelector('.h2h-vs-badge');
    headToHead.classList.remove('winner-revealed', 'winner-is-0', 'winner-is-1');

    if (vsBadge) {
        vsBadge.classList.remove('vs-badge-hidden');
    }

    if (currentQuestion) {
        for (let i = 0; i < 2; i++) {
            const h3 = document.getElementById('answer-text-' + (i + 1));
            if (h3) {
                h3.textContent = currentQuestion.answers[i] || '';
                h3.style.fontSize = '';
            }
        }
    }
}

function getWinnerIndexFromVotes() {
    if (submittedAnswers[0] > submittedAnswers[1]) {
        return 0;
    }
    if (submittedAnswers[1] > submittedAnswers[0]) {
        return 1;
    }
    return 0;
}

function revealWinnerOnOutput(winnerIndex) {
    winnerRevealed = true;
    const headToHead = document.getElementById('head-to-head');
    const vsBadge = document.querySelector('.h2h-vs-badge');

    headToHead.classList.remove('winner-is-0', 'winner-is-1');

    if (vsBadge) {
        vsBadge.classList.add('vs-badge-hidden');
    }

    void headToHead.offsetHeight;
    headToHead.classList.add('winner-revealed', 'winner-is-' + winnerIndex);

    const winnerText = document.getElementById('answer-text-' + (winnerIndex + 1));
    if (winnerText && currentQuestion) {
        winnerText.textContent = currentQuestion.answers[winnerIndex] + ' Wins!';
    }

    fitWinnerAnswerText(winnerIndex);
}

function fitWinnerAnswerText(winnerIndex) {
    const h3 = document.getElementById('answer-text-' + (winnerIndex + 1));
    const headToHead = document.getElementById('head-to-head');
    if (!h3 || !headToHead) {
        return;
    }

    const maxSize = headToHeadIsTextOnly() ? 96 : 80;
    const minSize = 36;
    const maxWidth = headToHead.clientWidth;
    h3.style.fontSize = maxSize + 'px';

    function shrinkToFit() {
        let size = maxSize;
        while (size > minSize && h3.scrollWidth > maxWidth) {
            size -= 2;
            h3.style.fontSize = size + 'px';
        }
    }

    window.requestAnimationFrame(shrinkToFit);
    window.setTimeout(shrinkToFit, 320);
}

function headToHeadIsTextOnly() {
    const headToHead = document.getElementById('head-to-head');
    return headToHead && headToHead.classList.contains('layout-text-only');
}

function replayEntranceAnimations() {
    const selectors = [
        '.question-frame',
        '.head-to-head-option--left',
        '.head-to-head-option--right',
        '.h2h-vs-badge',
        '.tug-of-war-wrapper'
    ];

    selectors.forEach((selector) => {
        const el = document.querySelector(selector);
        if (!el) {
            return;
        }
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = '';
    });
}

function resetTugOfWarBar() {
    const bar = document.getElementById('tug-of-war-bar');
    bar.classList.remove('correct-left', 'correct-right', 'tug-vote-pulse');
    updateTugOfWarBar(50, false);
    updateVoteTotal();
}

function getLeftPercentFromVotes() {
    const total = submittedAnswers[0] + submittedAnswers[1];
    if (total === 0) {
        return 50;
    }
    return Math.round((submittedAnswers[0] / total) * 100);
}

function populateQuestion(question) {
    currentQuestion = question;
    submittedAnswers = [0, 0];
    clearWinnerReveal();

    document.getElementById('question-text').textContent = currentQuestion.question;

    const headToHead = document.getElementById('head-to-head');
    headToHead.style.display = 'block';
    applyLayoutMode(currentQuestion);

    for (let i = 0; i < 2; i++) {
        const txt = document.getElementById('answer-text-' + (i + 1));
        txt.textContent = currentQuestion.answers[i] || '';

        const img = document.getElementById('answer-image-' + (i + 1));
        if (hasAnswerImage(currentQuestion, i)) {
            img.style.backgroundImage = 'url(../assets/' + currentQuestion.answerImages[i] + ')';
        } else {
            img.style.backgroundImage = '';
        }
    }

    resetTugOfWarBar();
    replayEntranceAnimations();
}

socket.on('question', (question) => {
    console.log('OUTPUT: Received question:', question);

    document.getElementById('output-waiting-screen').style.display = 'none';
    document.getElementById('output-container').style.display = 'flex';

    populateQuestion(question);

    if (pollContentActive) {
        playPollEnter();
    }
    pollContentActive = true;
});

socket.on('question-exit', () => {
    console.log('OUTPUT: Question exit transition');
    playPollExit();
});

socket.on('update-progress-bar', () => {
    console.log('OUTPUT: Updating progress bar');

    if (!currentQuestion) {
        return;
    }

    updateTugOfWarBar(currentQuestion.values[0], true);
});

socket.on('reset-progress-bar', () => {
    console.log('OUTPUT: Resetting progress bar');
    submittedAnswers = [0, 0];
    clearWinnerReveal();
    resetTugOfWarBar();
});

socket.on('reveal-winner', (payload) => {
    console.log('OUTPUT: Revealing winner', payload);
    const winnerIndex = payload && typeof payload.winnerIndex === 'number'
        ? payload.winnerIndex
        : getWinnerIndexFromVotes();
    revealWinnerOnOutput(winnerIndex);
});

socket.on('show-correct', () => {
    revealWinnerOnOutput(getWinnerIndexFromVotes());
});

socket.on('stop-polling', () => {
    console.log('OUTPUT: Stopping polling');
    pollContentActive = false;
    clearWinnerReveal();
    clearPollTransitionClasses();
    document.getElementById('output-container').style.display = 'none';
    document.getElementById('head-to-head').style.display = 'none';
    document.getElementById('output-waiting-screen').style.display = 'flex';
});

socket.on('answer', (answer) => {
    console.log('OUTPUT: Answer received', answer);

    if (winnerRevealed) {
        return;
    }

    if (answer === 0 || answer === 1) {
        submittedAnswers[answer]++;
    }

    updateVoteTotal();
    updateTugOfWarBar(getLeftPercentFromVotes(), true);
    pulseVoteFeedback();
});
