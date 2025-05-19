import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Kiểm tra URL nếu có token và role từ callback Google
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get("token");
        const role = queryParams.get("role");

        if (token && role) {
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify({ role }));
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            setUser({ role });
            // Xóa query params từ URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Trường hợp đã lưu token trước đó
            const savedToken = localStorage.getItem("token");
            if (savedToken) {
                axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
                setUser(JSON.parse(localStorage.getItem("user")));
            }
        }
    }, []);

    // Hàm logout
    const logout = async (navigate) => {
        try {
            // Gọi API đăng xuất phía server (nếu có)
            await axios.get("http://localhost:5000/api/auth/logout");
        } catch (error) {
            console.error("Error during server logout:", error);
        }
        // Xóa trạng thái phía client
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
        // Điều hướng về trang đăng nhập
        navigate("/login");
    };

    return (
        <AuthContext.Provider value={{ user, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
