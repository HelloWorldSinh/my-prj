import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Login.css";
import logo from "../assets/logo.svg";

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.title = "Đăng nhập | Ứng dụng Trắc nghiệm";
    }, []);

    const handleGoogleLogin = () => {
        setIsLoading(true);
        window.location.href = "http://localhost:5000/api/auth/google";
    };

    return (
        <div className="login-container">
            <div className="login-left">
                <div className="login-left-content">
                    <img src={logo} alt="Quiz App Logo" className="login-logo" />
                    <h1>Nền Tảng Trắc Nghiệm Trực Tuyến</h1>
                    <p>
                        Chào mừng bạn đến với ứng dụng trắc nghiệm trực tuyến! 
                        Đăng nhập để tham gia các bài kiểm tra, tạo đề thi hoặc 
                        theo dõi kết quả học tập.
                    </p>
                </div>
            </div>
            <div className="login-right">
                <div className="login-form">
                    <h2>Đăng Nhập</h2>
                    <p>Đăng nhập bằng tài khoản Google để truy cập ứng dụng</p>
                    
                    <div className="google-login-container">
                        <button onClick={handleGoogleLogin} className="btn btn-google" disabled={isLoading}>
                            {isLoading ? (
                                <span>
                                    <i className="fas fa-spinner fa-spin" style={{ marginRight: "10px" }}></i>
                                    Đang xử lý...
                                </span>
                            ) : (
                                <>
                                    <img
                                        src="https://www.google.com/favicon.ico"
                                        alt="Google"
                                    />
                                    Đăng Nhập với Google
                                </>
                            )}
                        </button>
                    </div>
                    
                    <div className="login-links">
                        <p>
                            <Link to="/">
                                <i className="fas fa-home" style={{ marginRight: "5px" }}></i>
                                Trở về trang chủ
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
