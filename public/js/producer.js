// Variables
const socket = io();

var startButton;
var stopButton;
var progressButton;
var showCorrectButton;
var nextButton;
var buttons = [];

// Register as a specific client type
socket.emit('register', 'producer'); // or 'input' or 'output'

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    startButton = document.getElementById('start-button');
    stopButton = document.getElementById('stop-button');
    startButton.addEventListener('click', () => {
        startPolling();
    });
    stopButton.addEventListener('click', () => {
        stopPolling();
    });
    progressButton = document.getElementById('progress-button');
    progressButton.addEventListener('click', () => {
        updateProgressBar();
    });
    showCorrectButton = document.getElementById('show-correct-button');
    showCorrectButton.addEventListener('click', () => {
        showCorrect();
    });
    nextButton = document.getElementById('next-button');
    nextButton.addEventListener('click', () => {
        nextQuestion();
    });

    buttons.push(progressButton);
    buttons.push(showCorrectButton);
    buttons.push(nextButton);

    console.log('Application initialized');
});

// --------------------------------------------------------------------------------------------------------------------------------

function startPolling() {
    //nextQuestion();
    socket.emit('start-polling');
    startButton.style.display = 'none';
    stopButton.style.display = 'block';

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].style.display = 'block';
    }
}

function stopPolling() {
    socket.emit('stop-polling');
    stopButton.style.display = 'none';
    startButton.style.display = 'block';
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].style.backgroundColor = 'var(--gray-500)';
        buttons[i].style.display = 'none';
    }
}


function updateProgressBar() {
    socket.emit('update-progress-bar');
}

function resetProgressBar() {
    socket.emit('reset-progress-bar');
}

function showCorrect() {
    socket.emit('show-correct');
}

function nextQuestion() {
    socket.emit('next-question');
}

// --------------------------------------------------------------------------------------------------------------------------------

socket.on('question', (question) => {
    console.log('PRODUCER: Received question:', question);
    // handle the question
});

socket.on('update-connections', (type, connectedInputs, connectedOutputs, connectedProducers) => {
    console.log('PRODUCER: Update connections:', type, 'Inputs:', connectedInputs, 'Outputs:', connectedOutputs, 'Producers:', connectedProducers);

    if (type === 'producer') {
        let producerStatus = document.getElementById('producer-status');
        let producerStatusText = document.getElementById('producer-status-text');

        if (connectedProducers > 0) {
            producerStatusText.textContent = 'Producer Connected';
            producerStatus.classList.add('connected');
            document.getElementById('producer-status-icon').style.display = 'inline-block';
        } else {
            producerStatusText.textContent = 'Producer Disconnected';
            producerStatus.classList.remove('connected');
            document.getElementById('producer-status-icon').style.display = 'none';
        }
    } else if (type === 'input') {
        let inputsStatus = document.getElementById('inputs-status');
        let inputsStatusText = document.getElementById('inputs-status-text');

        if (connectedInputs > 0) {
            inputsStatusText.textContent = 'Connected Inputs: ' + connectedInputs;
            inputsStatus.classList.add('connected');
        } else {
            inputsStatusText.textContent = 'Connected Inputs: 0';
            inputsStatus.classList.remove('connected');
        }
    } else if (type === 'output') {
        let outputStatus = document.getElementById('output-status');
        let outputStatusText = document.getElementById('output-status-text');

        if (connectedOutputs > 0) {
            outputStatusText.textContent = 'Output Connected';  
            outputStatus.classList.add('connected');
            document.getElementById('output-status-icon').style.display = 'inline-block';
        } else {
            outputStatusText.textContent = 'Output Disconnected';
            outputStatus.classList.remove('connected');
            document.getElementById('output-status-icon').style.display = 'none';
        }
    }
});

