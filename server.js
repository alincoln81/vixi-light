const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static('public')); // Serve your static files (input/output/producer UIs)

// Add a health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// import the db.js file
const questions = [
    {
        question: 'What were the Rams original team colors?',
        answers: ['Blue and White', 'Black and Red', 'Blue and Yellow'],
        answerImages: ['blue.png', 'black.png', 'gold.png'],
        values: [20, 50, 30],
        correctAnswer: 1,
        type: 'quiz'
    },
    {
        question: 'How many total Super Bowls have the Rams played in all-time?',
        answers: ['3 Super Bowls', '4 Super Bowls', '5 Super Bowls'],
        answerImages: ['3.png', '4.png', '5.png'],
        values: [25, 20, 55],
        correctAnswer: 2,
        type: 'quiz'
    },
    {   
        question: 'What is your favorite Rams uniform combo?',
        answers: ['Home (Royal + Sol)', 'Away (White + Royal)', 'Alternate (Bone)', 'Alternate (Royal)'],
        answerImages: ['home.png', 'away.png', 'bone.png', 'royal.png'],
        values: [35, 15, 40, 10],
        correctAnswer: null,
        type: 'poll'
    }
];
let currentQuestion = 0;
let gameActive = false;
let connectedOutputs = 0;
let connectedInputs = 0;
let connectedProducers = 0;
// --------------------------------------------------------------------------------------------------------------------------------

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Identify client type
    socket.on('register', (type) => {
        socket.clientType = type;
        console.log(`Client ${socket.id} registered as ${type}`);

        if (type == 'input') {
            connectedInputs++;
        } else if (type == 'output') {
            connectedOutputs++;
        } else if (type == 'producer') {
            connectedProducers++;
        }

        io.emit('update-connections', type, connectedInputs, connectedOutputs, connectedProducers);

        if (gameActive && type == 'input') {
            socket.emit('question', questions[currentQuestion]);
        }
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
        io.emit('question', questions[currentQuestion]);
        gameActive = true;
    });

    socket.on('stop-polling', () => {
        console.log('SERVER: Stopping polling');
        currentQuestion = 0;
        io.emit('reset-progress-bar');
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
    socket.on('show-correct', () => {
        console.log('SERVER: Showing correct');
        io.emit('show-correct');
    });
    socket.on('next-question', () => {
        currentQuestion++;
        if (currentQuestion >= questions.length) {   
            currentQuestion = 0;
        }
        console.log('SERVER: Resetting progress bar and loading next question', questions[currentQuestion]);
        io.emit('reset-progress-bar');
        io.emit('question', questions[currentQuestion]);
    });

    socket.on('answer', (answer) => {
        console.log('SERVER: Answer received', answer);
        io.emit('answer', answer);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
