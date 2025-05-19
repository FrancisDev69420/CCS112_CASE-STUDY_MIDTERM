import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/klick logo.png";



function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://127.0.0.1:8000/api/login", { email, password });

            const {token, role} = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("role", role);
            localStorage.setItem("user_id", response.data.user_id); 

             // Check if the user is a project manager
            if (role === "Project Manager") {
                navigate("/dashboard"); // Navigate to dashboard if project manager
            } else if (role === "Team Member") {
                navigate("/Member-Dashboard"); // Navigate to member dashboard if team member
            } else {
                alert("Invalid role"); 
            }
        } catch (error) {
            alert("Invalid credentials");
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center">
            <div className="card p-4 shadow-lg" style={{ width: "400px"}}>
                <img src={logo} alt="Logo" className="mb-3 d-block mx-auto" style={{width: "200px"}} />
                <h1 className="text-center fw-bold">Klick Inc.</h1>
                <h2 className="text-center">Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-control" onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Login</button>
                </form>

                <p className="text-center mt-3">Don't have an account?</p>
                <button className="btn btn-outline-secondary w-100" onClick={() => navigate("/register")}>Register</button>

            </div>

        </div>
    );
}

export default Login;
