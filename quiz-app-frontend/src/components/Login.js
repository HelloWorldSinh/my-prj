import React from "react";

const Login = () => {
    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:5000/api/auth/google";
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            <h2>Tài Khoản Người Dùng</h2>
            <p>Đăng nhập hoặc tạo tài khoản để bắt đầu trải nghiệm</p>
            <button
                onClick={handleGoogleLogin}
                style={{
                    background: "white",
                    border: "1px solid #d3d3d3",
                    padding: "10px",
                    cursor: "pointer",
                }}
            >
                <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    style={{ width: "20px", marginRight: "10px" }}
                />{" "}
                Đăng Nhập
            </button>
        </div>
    );
};

export default Login;
