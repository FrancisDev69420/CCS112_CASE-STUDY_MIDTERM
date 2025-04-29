import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://127.0.0.1:8000/api/register", { name, email, password, role });
            alert("Successfully registered");
            navigate("/");
            
        } catch (error) {
            // Check if error response exists and extract message
            if (error.response && error.response.data && error.response.data.message) {
                alert(`Registration failed: ${error.response.data.message}`);
            } else {
                // Default error message if response is not in the expected format
                alert("Registration failed. Please try again.");
            }
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4 shadow-lg" style={{ width: "400px" }}>
                <h2 className="text-center">Register</h2>
                <form onSubmit={handleRegister}>
                    <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-control" onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input type="password" className="form-control" onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                     <div className="mb-3">
                        <label className="form-label">Role</label>
                        <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)} required>
                            <option value="">Select a role</option>
                            <option value="Project Manager">Project Manager</option>
                            <option value="Team Member">Team Member</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-success w-100">Register</button>
                </form>
                <p className="text-center mt-3">Already have an account?</p>
                <button className="btn btn-outline-secondary w-100" onClick={() => navigate("/")}>Go to Login</button>
            </div>
        </div>
    );
}

export default Register;