import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

// Components
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import MemberDashboard from "./components/Member-Dashboard";

function App() {
    return (
        <Router>
            <Suspense fallback={<div className="text-center mt-5">Loading...</div>}>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/Member-Dashboard" element={<MemberDashboard />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
