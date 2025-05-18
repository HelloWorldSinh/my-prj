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
                                    Đăng Ký với Google
                                </>
                            )}
                        </button>
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
