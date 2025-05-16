import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            setUser(JSON.parse(localStorage.getItem("user")));
        }
    }, []);

    const login = async (username, password) => {
        const res = await axios.post("http://localhost:5000/api/auth/login", {
            username,
            password,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify({ role: res.data.role }));
        axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
        setUser({ role: res.data.role });
    };

    // Hàm logout
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
        // Thêm bước đăng xuất khỏi Google
        window.location.href = "https://accounts.google.com/Logout";
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
