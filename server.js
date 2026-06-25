const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from the public directory
app.use(express.static('public'));

// Add specific routes for each page
app.get('/producer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'producer.html'));
});

app.get('/input', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'input.html'));
});

app.get('/output', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'output.html'));
});

// Add a health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// import the db.js file
const questions = [
    {
        question: 'Which concession snack is your favorite?',
        answers: ['Team Hot Dog', 'Team Hamburger'],
        answerImages: ['donte-jackson.png', 'elijah-molden.png'],
        values: [70, 50],
        correctAnswer: null,
        type: 'poll'
    },
    {
        question: 'Which beverage is your favorite?',
        answers: ['Team Soda', 'Team Water'],
        answerImages: ['josh-harris.png', 'kyle-kennard.png'],
        values: [33, 67],
        correctAnswer: null,
        type: 'poll'
    },
    {   
        question: 'Which home uniform is your favorite?',
        answers: ['Team Blue & gold', 'Team Blue & white'],
        answerImages: ['justin-herbert.png', 'tre-harris.png'],
        values: [37, 63],
        correctAnswer: null,
        type: 'poll'
    }
];

let currentQuestion = 0;
let gameActive = false;
let votingLocked = false;
let voteCounts = [0, 0];
let connectedOutputs = 0;
let connectedInputs = 0;
let connectedProducers = 0;

const QUESTION_TRANSITION_MS = 700;

function getWinnerIndex() {
    if (voteCounts[0] > voteCounts[1]) {
        return 0;
    }
    if (voteCounts[1] > voteCounts[0]) {
        return 1;
    }
    return 0;
}

function resetRoundState() {
    voteCounts = [0, 0];
    votingLocked = false;
}
// --------------------------------------------------------------------------------------------------------------------------------

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Identify client type
    socket.on('register', (type) => {
        socket.clientType = type;
        console.log(`Client ${socket.id} registered as ${type}`);

        console.log('SERVER: Game active:', gameActive);

        if (type == 'input') {
            connectedInputs++;

            // send the question to the input
            if (gameActive) {
                socket.emit('question', questions[currentQuestion]);
            }

        } else if (type == 'output') {
            connectedOutputs++;

            // send the question to the input
            if (gameActive) {
                socket.emit('question', questions[currentQuestion]);
            }

        } else if (type == 'producer') {
            connectedProducers++;
        }

        io.emit('update-connections', type, connectedInputs, connectedOutputs, connectedProducers);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id, 'Type:', socket.clientType);

        if (socket.clientType == 'input') {
            connectedInputs--;
        } else if (socket.clientType == 'output') {
            connectedOutputs--;
        } else if (socket.clientType == 'producer') {
            connectedProducers--;
        }
        io.emit('update-connections', 'producer', connectedInputs, connectedOutputs, connectedProducers);
    });

    // --------------------------------------------------------------------------------------------------------------------------------
    socket.on('start-polling', () => {
        console.log('SERVER: Starting polling', questions[currentQuestion]);
        resetRoundState();
        io.emit('question', questions[currentQuestion]);
        gameActive = true;
    });

    socket.on('stop-polling', () => {
        console.log('SERVER: Stopping polling');
        currentQuestion = 0;
        resetRoundState();
        io.emit('reset-progress-bar');
        io.emit('unlock-voting');
        io.emit('stop-polling');
        gameActive = false;
    });

    socket.on('update-progress-bar', () => {
        console.log('SERVER: Updating progress bar');
        io.emit('update-progress-bar');
    });
    socket.on('reset-progress-bar', () => {
        console.log('SERVER: Resetting progress bar');
        io.emit('reset-progress-bar');
    });
    socket.on('reveal-winner', () => {
        console.log('SERVER: Revealing winner');
        votingLocked = true;
        const winnerIndex = getWinnerIndex();
        io.emit('lock-voting');
        io.emit('reveal-winner', { winnerIndex, votes: [...voteCounts] });
    });

    socket.on('show-correct', () => {
        console.log('SERVER: show-correct deprecated, forwarding to reveal-winner');
        votingLocked = true;
        const winnerIndex = getWinnerIndex();
        io.emit('lock-voting');
        io.emit('reveal-winner', { winnerIndex, votes: [...voteCounts] });
    });

    socket.on('next-question', () => {
        console.log('SERVER: Transitioning to next question');
        io.emit('question-exit');

        setTimeout(() => {
            currentQuestion++;
            if (currentQuestion >= questions.length) {
                currentQuestion = 0;
            }
            resetRoundState();
            console.log('SERVER: Loading next question', questions[currentQuestion]);
            io.emit('reset-progress-bar');
            io.emit('unlock-voting');
            io.emit('question', questions[currentQuestion]);
        }, QUESTION_TRANSITION_MS);
    });

    socket.on('answer', (answer) => {
        if (votingLocked || !gameActive) {
            return;
        }
        if (answer !== 0 && answer !== 1) {
            return;
        }
        console.log('SERVER: Answer received', answer);
        voteCounts[answer]++;
        io.emit('answer', answer);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
