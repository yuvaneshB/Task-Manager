require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const app = require('./app');
const socketHandler = require('./sockets/socketHandler');
const initCronJobs = require('./cron/scheduler');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/enterprise_task_manager');
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

const startServer = async () => {
  // Establish Database connection
  await connectDB();

  // Create HTTP Server
  const server = http.createServer(app);

  // Initialize Socket.io
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Attach io instance to express app context
  app.set('io', io);

  // Initialize Sockets Handling
  socketHandler(io);

  // Initialize automatic email & alert schedulers
  initCronJobs();

  // Listen
  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
  });
};

startServer().catch(err => {
  logger.error(`Failed to launch server: ${err.message}`);
});
