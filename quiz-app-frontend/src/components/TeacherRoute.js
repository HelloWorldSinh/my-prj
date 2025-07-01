import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Cần cài đặt: npm install jwt-decode

const TeacherRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        // Nếu không có token, chuyển hướng về trang đăng nhập
        return <Navigate to="/login" />;
    }

    try {
        const decodedToken = jwtDecode(token);
        // Kiểm tra xem token có vai trò là 'teacher' không
        if (decodedToken.role === 'teacher') {
            // Nếu đúng, hiển thị trang con (MonitoringPage)
            return children;
        } else {
            // Nếu không phải teacher, chuyển hướng về trang dashboard của họ
            return <Navigate to="/dashboard" />;
        }
    } catch (error) {
        // Nếu token không hợp lệ, chuyển hướng về trang đăng nhập
        console.error("Invalid token:", error);
        return <Navigate to="/login" />;
    }
};

export default TeacherRoute;