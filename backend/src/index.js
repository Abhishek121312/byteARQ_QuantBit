const express = require('express');
 const http = require('http');
 const { Server } = require('socket.io');
 require('dotenv').config();
 const connectDB = require('./config/db');
 const redisClient = require('./config/redis');
 const cookieParser = require('cookie-parser');
 const cors = require('cors');
 const multer = require('multer'); // Import multer for the error handler
 
 // --- MODIFIED: Import New Routers ---
 const authRoutes = require('./routes/authRoutes');
 const adminRoutes = require('./routes/adminRoutes');
 const issueRoutes = require('./routes/issueRoutes');
 const userRoutes = require('./routes/userRoutes');
 const publicRoutes = require('./routes/publicRoutes'); // --- 1. ADD THIS LINE ---
 
 const app = express();
 const server = http.createServer(app);
 
 // --- WebSocket (Socket.io) Setup ---
 const io = new Server(server, {
     cors: {
         origin: process.env.CORS_ORIGIN || "http://localhost:5173",
         methods: ["GET", "POST"],
         credentials: true
     }
 });
 
 // Middleware
 app.use(cors({
     origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
     credentials: true
 }));
 app.use(express.json());
 app.use(cookieParser());
 
 // Make 'io' accessible to controllers
 app.use((req, res, next) => {
     req.io = io;
     next();
 });
 
 // --- MODIFIED: API Routes Registration ---
 app.use('/api/auth', authRoutes);
 app.use('/api/admin', adminRoutes);
 app.use('/api/issues', issueRoutes);
 app.use('/api/users', userRoutes);
 app.use('/api/public', publicRoutes); // --- 2. ADD THIS LINE ---
 
 // --- MODIFIED: Real-time Communication Logic ---
 io.on('connection', (socket) => {
     console.log(`🔌 User Connected via WebSocket: ${socket.id}`);
 
     // User joins a room based on their USER ID (for private notifications)
     socket.on('join_user_room', (userId) => {
         socket.join(userId);
         console.log(`User ${socket.id} joined private room: ${userId}`);
     });
 
     // User (Officer/Admin) joins a room for their WARD
     socket.on('join_ward_room', (wardId) => {
         socket.join(wardId);
         console.log(`User ${socket.id} joined ward room: ${wardId}`);
     });

     // User (Admin) joins a global admin room
     socket.on('join_admin_room', () => {
         socket.join('admin_room');
         console.log(`User ${socket.id} joined admin room`);
     });
 
     socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected.`);
     });
 });
 
 // --- Global Error Handling ---
 app.use((err, req, res, next) => {
     console.error("Global Error Handler:", err.stack);
     // Handle Multer-specific errors
     if (err instanceof multer.MulterError) {
         if (err.code === 'LIMIT_FILE_SIZE') {
             return res.status(400).json({ message: 'File is too large. Max size is 2MB.' });
         }
     } else if (err.message === 'Error: Images Only!') {
         return res.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
     }
     
     // Default server error
     res.status(500).json({ message: 'Something broke on the server!' });
 });
 
 // --- Server Startup ---
 const startServer = async () => {
     try {
         // Connect to DB and Redis in parallel
         await Promise.all([connectDB(), redisClient.connect()]);
         console.log('✅ MongoDB & Redis Connected...');
 
         const PORT = process.env.PORT || 3000;
         server.listen(PORT, () => {
             console.log(`🚀 Server is live and listening at http://localhost:${PORT}`);
         });
     } catch (err) {
         console.error('❌ Critical Error: Failed to connect to databases', err);
         process.exit(1);
     }
 };
 
 startServer();