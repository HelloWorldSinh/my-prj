// Dòng này LUÔN LUÔN là dòng đầu tiên
require("dotenv").config();

// Require tất cả các module cần thiết ở đây
const express = require("express");
const passport = require("passport");
const cors = require("cors");
const session = require("express-session");
const http = require('http');
const { Server } = require("socket.io");
const connectDB = require("./config/db");

// Require tất cả các file route ở đây, ngay sau các module
const authRoutes = require("./routes/auth");
const examRoutes = require("./routes/exams");
const submissionRoutes = require("./routes/submissions");

// Khởi tạo app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PATCH"]
    }
});

// Kết nối DB
connectDB();

// Sử dụng các middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(session({
    secret: process.env.SESSION_SECRET || "default_session_secret",
    resave: false,
    saveUninitialized: false,
}));

require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

// Sử dụng các routes
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/submissions", submissionRoutes); 

// Cấu hình Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('join_exam_room', (examId) => {
        socket.join(examId);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Khởi động server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));