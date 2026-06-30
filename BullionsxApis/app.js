const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });
const error = require('./middleware/error');
const router = require('./router/router');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);
app.use('/', router);
app.use(error);

const { startPriceFeed } = require('./services/priceFeed');

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe_market', (market_symbol) => {
    socket.join(market_symbol);
  });

  socket.on('unsubscribe_market', (market_symbol) => {
    socket.leave(market_symbol);
  });

  socket.on('subscribe_user', (user_id) => {
    socket.join(`user_${user_id}`);
  });

  socket.on('unsubscribe_user', (user_id) => {
    socket.leave(`user_${user_id}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Your application is running on PORT ${PORT}`);
  startPriceFeed(io, parseInt(process.env.PRICE_FEED_INTERVAL_MS || '5000'));
});
