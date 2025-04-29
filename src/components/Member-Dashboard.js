import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/klick logo.png";
import { Modal, Button, Form } from 'react-bootstrap';


function MemberDashboard() {
    const [message, setMessage] = useState("");
    const [projects, setProjects] = useState([]);
    const [expandedProjects, setExpandedProjects] = useState({});
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const navigate = useNavigate();

    const fetchDashboardData = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
        } else {
            axios
                .get("http://127.0.0.1:8000/api/Member-Dashboard", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((response) => {
                    setMessage(response.data.message);
                    const grouped = groupProjects(response.data.projects || []);
                    setProjects(grouped);
                })
                .catch(() => navigate("/"));
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        navigate("/");
    };

    const groupProjects = (projects) => {
        const grouped = {};

        projects.forEach((project) => {
            if (!grouped[project.title]) {
                grouped[project.title] = {
                    id: project.id,
                    title: project.title,
                    tasks: [],
                };
            }
            grouped[project.title].tasks.push(...(project.tasks || []));
        });

        return Object.values(grouped);
    };

    const toggleProject = (title) => {
        setExpandedProjects((prev) => ({
            ...prev,
            [title]: !prev[title],
        }));
    };

    const openStatusModal = (projectId, task) => {
        setCurrentProjectId(projectId);
        setCurrentTask(task);
        setNewStatus(task.status);
        setShowStatusModal(true);
    };

    const handleStatusUpdate = () => {
        const token = localStorage.getItem("token");
        
        if (!currentTask || !currentProjectId) return;

        axios
            .put(
                `http://127.0.0.1:8000/api/projects/${currentProjectId}/tasks/${currentTask.id}`, 
                { 
                    status: newStatus,
                    // Include existing task data to prevent overwriting
                    title: currentTask.title,
                    description: currentTask.description,
                    priority: currentTask.priority,
                    user_id: currentTask.user_id,
                    start_date: currentTask.start_date,
                    deadline: currentTask.deadline
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then(() => {
                // Update the local state
                const updatedProjects = [...projects];
                updatedProjects.forEach(project => {
                    if (project.id === currentProjectId) {
                        project.tasks = project.tasks.map(task => 
                            task.id === currentTask.id ? {...task, status: newStatus} : task
                        );
                    }
                });
                setProjects(updatedProjects);
                setShowStatusModal(false);
                
                // Alternatively, refetch all data if the local state update is complex
                // fetchDashboardData();
            })
            .catch(error => {
                console.error("Error updating task status:", error);
                alert("Failed to update task status");
            });
    };

    return (
        <div className="container mt-5">
            <img src={logo} alt="Logo" className="mb-3" style={{ width: "auto", height: "100px" }} />

            <h2 className="text-center">Member Dashboard</h2>
            <p className="text-muted text-center">{message}</p>

            <div className="d-flex justify-content-end mb-4">
                <button className="btn btn-danger" onClick={handleLogout}>
                    Logout
                </button>
            </div>

            <h4 className="mb-4">Projects and Tasks</h4>
            {projects.length === 0 ? (
                <p>No projects assigned to you yet.</p>
            ) : (
                projects.map((project) => (
                    <div key={project.id} className="card mb-3">
                        <div
                            className="card-header d-flex justify-content-between align-items-center"
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleProject(project.title)}
                        >
                            <strong>{project.title}</strong>
                            <span>{expandedProjects[project.title] ? "▲" : "▼"}</span>
                        </div>

                        {expandedProjects[project.title] && (
                            <div className="card-body">
                                {project.tasks.length === 0 ? (
                                    <p>No tasks assigned.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-striped">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Title</th>
                                                    <th>Status</th>
                                                    <th>Priority</th>
                                                    <th>Start Date</th>
                                                    <th>Deadline</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {project.tasks.map((task, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{task.title}</td>
                                                        <td>
                                                            <span 
                                                                className={`badge ${
                                                                    task.status === 'completed' ? 'bg-success' : 
                                                                    task.status === 'in progress' ? 'bg-warning' : 'bg-secondary'
                                                                }`}
                                                            >
                                                                {task.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span 
                                                                className={`badge ${
                                                                    task.priority === 'high' ? 'bg-danger' : 
                                                                    task.priority === 'medium' ? 'bg-warning' : 'bg-info'
                                                                }`}
                                                            >
                                                                {task.priority}
                                                            </span>
                                                        </td>
                                                        <td>{task.start_date ? task.start_date : "N/A"}</td>
                                                        <td>{task.deadline ? task.deadline : "N/A"}</td>
                                                        <td>
                                                            <Button 
                                                                variant="outline-success" 
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openStatusModal(project.id, task);
                                                                }}
                                                            >
                                                                Update Status
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}

            {/* Modal for updating task status */}
            <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Update Task Status</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentTask && (
                        <>
                            <p><strong>Task:</strong> {currentTask.title}</p>
                            <Form>
                                <Form.Group className="mb-3" controlId="formStatus">
                                    <Form.Label>Status</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </Form.Control>
                                </Form.Group>
                            </Form>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="success" onClick={handleStatusUpdate}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default MemberDashboard;