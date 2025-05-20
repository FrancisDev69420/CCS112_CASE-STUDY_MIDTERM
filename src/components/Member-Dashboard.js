import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/klick logo.png";
import { Modal, Button, Form } from 'react-bootstrap';
import TaskComments from "./TaskComments";
import Notifications from "./Notifications"; 
import "../MemberDashboard.css";

function MemberDashboard() {
    const [message, setMessage] = useState("");
    const [projects, setProjects] = useState([]);
    const [expandedProjects, setExpandedProjects] = useState({});
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [newStatus, setNewStatus] = useState("");
    const [newActualHours, setNewActualHours] = useState(0);
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const [expandedComments, setExpandedComments] = useState({});
    const navigate = useNavigate();

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };

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
        setNewActualHours(task.actual_hours || 0);
        setShowStatusModal(true);
    };

    const handleStatusUpdate = () => {
        const token = localStorage.getItem("token");
        
        if (!currentTask || !currentProjectId) return;

        // Prevent saving if actual hours exceed estimated hours
        if (newActualHours > currentTask.estimated_hours) {
            alert("Actual hours cannot exceed estimated hours.");
            return;
        }

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
                    deadline: currentTask.deadline,
                    actual_hours: newActualHours
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then(() => {
                // Update the local state
                const updatedProjects = [...projects];
                updatedProjects.forEach(project => {
                    if (project.id === currentProjectId) {
                        project.tasks = project.tasks.map(task => 
                            task.id === currentTask.id ? {
                                ...task, 
                                status: newStatus,
                                actual_hours: newActualHours
                            } : task
                        );
                    }
                });
                setProjects(updatedProjects);
                setShowStatusModal(false);
            })
            .catch(error => {
                console.error("Error updating task:", error);
                alert("Failed to update task: " + error.response.data.error);
            });
    };

    const calculateProgress = (actualHours, estimatedHours) => {
        if (estimatedHours === 0) return 0; // Avoid division by zero
        return (actualHours / estimatedHours) * 100; // Returns the progress in percentage
    };

    const toggleComments = (taskId) => {
        setExpandedComments(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-between align-items-center">
                <img src={logo} alt="Logo" className="mb-3" style={{ width: "auto", height: "100px" }} />
                <div className="d-flex align-items-center gap-3">
                    <Notifications />
                    <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                </div>
            </div>            

            <h2 className="text-center">Member Dashboard</h2>
            <p className="text-muted text-center">{message}</p>
            <div className="d-flex mb-2 justify-content-between align-items-center">
                <h4 className="mb-4">Projects and Tasks</h4>
                <Button
                    variant="info"
                    onClick={() => navigate('/activities')}
                >
                    View Activity Feed
                </Button>
            </div>

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
                                <div className="d-flex justify-content-end mt-3">
                                    <button
                                        className="btn btn-info me-2"
                                        onClick={() => navigate(`/projects/${project.id}/risks-issues`)}
                                    >
                                        Manage Risk and Issues
                                    </button>
                                    <button
                                        className="btn btn-info"
                                        onClick={() => navigate(`/projects/${project.id}/files`)}
                                    >
                                        Manage Files
                                    </button>
                                </div>

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
                                                    <th>Estimated Hours</th>
                                                    <th>Actual Hours</th>
                                                    <th>Progress</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {project.tasks.map((task, index) => (
                                                    <React.Fragment key={index}>
                                                        <tr>
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
                                                            <td>{formatDateForDisplay(task.start_date)}</td>
                                                            <td>{formatDateForDisplay(task.deadline)}</td>
                                                            <td>{task.estimated_hours != null ? task.estimated_hours : "N/A"}</td>
                                                            <td>{task.actual_hours != null ? task.actual_hours : "N/A"}</td>
                                                            <td>
                                                                <div className="progress">
                                                                    <div 
                                                                        className="progress-bar" 
                                                                        role="progressbar" 
                                                                        style={{ width: `${calculateProgress(task.actual_hours, task.estimated_hours)}%` }}
                                                                        aria-valuenow={calculateProgress(task.actual_hours, task.estimated_hours)}
                                                                        aria-valuemin="0" 
                                                                        aria-valuemax="100"
                                                                    >
                                                                        {calculateProgress(task.actual_hours, task.estimated_hours).toFixed(2)}%
                                                                    </div>
                                                                </div>
                                                            </td>                                                            <td className="action-column">
                                                                <div className="d-flex align-items-center">
                                                                    <button
                                                                        className="btn btn-success btn-sm me-2"
                                                                        onClick={() => openStatusModal(project.id, task)}
                                                                    >
                                                                        Update Status
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-info btn-sm"
                                                                        onClick={() => toggleComments(task.id)}
                                                                    >
                                                                        💬 {expandedComments[task.id] ? 'Hide' : 'Comments'}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {expandedComments[task.id] && (
                                                            <tr>
                                                                <td colSpan="10">
                                                                    <TaskComments taskId={task.id} projectId={project.id} />
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
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

            {/* Modal for updating task status */}            <Modal 
                show={showStatusModal} 
                onHide={() => setShowStatusModal(false)} 
                centered
                aria-labelledby="status-modal"
                className="custom-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="status-modal">Update Task Status</Modal.Title>
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
                                <Form.Group className="mb-3" controlId="formActualHours">
                                    <Form.Label>Actual Hours</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newActualHours}
                                        onChange={(e) => setNewActualHours(parseFloat(e.target.value) || "")}
                                        isInvalid={newActualHours > currentTask.estimated_hours}
                                    />
                                    {newActualHours > currentTask.estimated_hours && (
                                        <Form.Text className="text-danger">
                                            Warning: Actual hours exceed the estimated hours!
                                        </Form.Text>
                                    )}
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