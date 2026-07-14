const logger = require('../utils/logger');

// Store active online users
const onlineUsers = new Map(); // socket.id -> userId

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Register user session
    socket.on('register', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        onlineUsers.set(socket.id, userId.toString());
        
        // Broadcast unique online users list
        const uniqueUsers = Array.from(new Set(onlineUsers.values()));
        io.emit('online-users', uniqueUsers);
        logger.info(`User registered with socket: UserID ${userId}, SocketID ${socket.id}`);
      }
    });

    // Join task comments room
    socket.on('join-task', (taskId) => {
      if (taskId) {
        socket.join(taskId.toString());
        logger.info(`Socket ${socket.id} joined task room: ${taskId}`);
      }
    });

    // Leave task comments room
    socket.on('leave-task', (taskId) => {
      if (taskId) {
        socket.leave(taskId.toString());
        logger.info(`Socket ${socket.id} left task room: ${taskId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
      onlineUsers.delete(socket.id);
      
      const uniqueUsers = Array.from(new Set(onlineUsers.values()));
      io.emit('online-users', uniqueUsers);
    });
  });
};

module.exports = socketHandler;
