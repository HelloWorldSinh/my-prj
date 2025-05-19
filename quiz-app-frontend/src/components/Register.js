import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Register.css";
import logo from "../assets/logo.svg";

const Register = () => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        document.title = "Đăng ký | Ứng dụng Trắc nghiệm";
    }, []);

    const handleGoogleRegister = () => {
        setIsLoading(true);
        window.location.href = "http://localhost:5000/api/auth/google";
    };

    return (
        <div className="register-container">
            <div className="register-left">
                <div className="register-left-content">
                    <img src={logo} alt="Quiz App Logo" className="register-logo" />
                    <h1>Tham Gia Ngay Hôm Nay</h1>
                    <p>
                        Tạo tài khoản mới để trải nghiệm đầy đủ các tính năng của ứng 
                        dụng trắc nghiệm trực tuyến. Đăng ký miễn phí và bắt đầu ngay!
                    </p>
                </div>
            </div>
            <div className="register-right">
                <div className="register-form">
                    <h2>Đăng Ký Tài Khoản</h2>
                    <p>Đăng ký tài khoản mới để bắt đầu trải nghiệm</p>
                    
                    <div className="notice-box">
                        <div className="notice-icon">
                            <i className="fas fa-info-circle"></i>
                        </div>
                        <div className="notice-content">
                            <h4>Đăng ký dễ dàng</h4>
                            <p>Hiện tại, ứng dụng chỉ hỗ trợ đăng ký thông qua tài khoản Google. Vui lòng sử dụng tùy chọn bên dưới để tiếp tục:</p>
                        </div>
                    </div>
                      <div className="google-register-container">
                        <button onClick={handleGoogleRegister} className="btn btn-google" disabled={isLoading}>
                            {isLoading ? (
                                <div className="google-btn-content">
                                    <div className="google-btn-spinner"></div>
                                    <span>Đang xử lý...</span>
                                </div>
                            ) : (
                                <div className="google-btn-content">
                                    <div className="google-btn-icon-wrapper">
                                        <svg className="google-icon" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                                                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                                                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                                                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                                            </g>
                                        </svg>
                                        <div className="google-icon-circle"></div>
                                    </div>
                                    <span className="google-btn-text">Đăng Ký với Google</span>
                                    <div className="google-btn-shine"></div>
                                </div>
                            )}
                        </button>
                        <div className="register-animation-dots">
                            <div className="dot dot-1"></div>
                            <div className="dot dot-2"></div>
                            <div className="dot dot-3"></div>
                        </div>
                    </div>
                    
                    <div className="register-info">
                        <div className="info-item">
                            <i className="fas fa-check-circle"></i>
                            <span>Nhanh chóng và bảo mật</span>
                        </div>
                        <div className="info-item">
                            <i className="fas fa-check-circle"></i>
                            <span>Không cần tạo thêm mật khẩu mới</span>
                        </div>
                        <div className="info-item">
                            <i className="fas fa-check-circle"></i>
                            <span>Bảo vệ thông tin cá nhân của bạn</span>
                        </div>
                    </div>
                    
                    <div className="register-links">
                        <p>
                            Đã có tài khoản?{" "}
                            <Link to="/login">Đăng nhập ngay</Link>
                        </p>
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

export default Register;
