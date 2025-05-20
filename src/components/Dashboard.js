import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Projects from "./Projects";
import Tasks from "./Tasks";
import ExpenditureManagement from "./ExpenditureManagement";
import logo from "../assets/klick logo.png";
import { Modal, Button, Form } from 'react-bootstrap';
import Notifications from "./Notifications"; 
import '../Dashboard.css'; 

function Dashboard() {
    // Date formatting utilities
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const [message, setMessage] = useState("");
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [newProject, setNewProject] = useState({ title: "", description: "", budget: "", start_date: "", deadline: ""  });
    const [editingProject, setEditingProject] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [taskModalShow, setTaskModalShow] = useState(false); // Toggle task modal visibility
    const [editTaskModalShow, setEditTaskModalShow] = useState(false);    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        status: "pending",
        priority: "low",
        user_id: "",
        start_date: "",
        deadline: "",
        estimated_hours: "" // New field for estimated hours
    });
    const [editingTask, setEditingTask] = useState(null);
    const [users, setUsers] = useState([]);    const [showExpenditureModal, setShowExpenditureModal] = useState(false);
    const [selectedProjectForExpenditure, setSelectedProjectForExpenditure] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/"); // Redirect to login if no token
        } else {
            axios
                .get("http://127.0.0.1:8000/api/dashboard", { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => {
                    setMessage(response.data.message);
                    setProjects(response.data.projects || []);
                })
                .catch(() => navigate("/"));
        }
    }, [navigate]);

    // Fetch users for task assignment
    useEffect(() => {
        axios
            .get("http://127.0.0.1:8000/api/users", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
            .then((response) => {
                setUsers(response.data);
            })
            .catch((error) => {
                console.error("Error fetching users:", error);
            });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        navigate("/"); // Logout and redirect
    };

    // Function to fetch tasks for a selected project
    const handleProjectClick = (project) => {
        console.log("Selected Project:", project); // Log the selected project
        if (selectedProject === project.id) {
            setTasks([]); // Clear tasks if the same project is clicked again
            setSelectedProject(null);
            setSelectedProjectId(null);
        } else {
            axios
                .get(`http://127.0.0.1:8000/api/projects/${project.id}/tasks`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                })
                .then((response) => {
                    console.log("Full Response:", response); // Log the full response to inspect the structure
                    setSelectedProject(project.id);
                    setTasks(response.data || []); // Assign the data directly as tasks
                })
                .catch(() => setTasks([]));
        }
    };

    // Function to handle adding a project with modal form
    const handleAddProject = (e) => {
        e.preventDefault();

        // Validate project dates
        const validation = validateProjectDates(newProject);
        if (!validation.isValid) {
            alert(`Date validation failed:\n${validation.errors.join('\n')}`);
            return; // Prevent form submission
        }

        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id");

        axios
            .post("http://127.0.0.1:8000/api/projects", 
                { 
                    title: newProject.title, 
                    description: newProject.description,  
                    budget: parseFloat(newProject.budget),
                    user_id: userId,
                    start_date: newProject.start_date,  
                    deadline: newProject.deadline, 
                }, 
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((response) => {
                setProjects([...projects, response.data]);
                setShowModal(false);
                setNewProject({ title: "", description: "", budget: "", start_date: "", deadline: "" });
            })
            .catch((error) => {
                console.error("Error adding project:", error);
                alert("Failed to add project");
            });
    };

    const handleEditProject = (project) => {
        setEditingProject(project);
        setNewProject({
            title: project.title,
            description: project.description,
            budget: project.budget,
            start_date: project.start_date || "",  
            deadline: project.deadline || ""       
        });
        setShowModal(true);
    };

    // Function to handle updating a project
    const handleUpdateProject = (e) => {
        e.preventDefault();

        // Validate project dates
        const validation = validateProjectDates(newProject);
        if (!validation.isValid) {
            alert(`Date validation failed:\n${validation.errors.join('\n')}`);
            return; // Prevent form submission
        }

        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id");

        axios
            .put(
                `http://127.0.0.1:8000/api/projects/${editingProject.id}`,
                {
                    title: newProject.title,
                    description: newProject.description,
                    budget: parseFloat(newProject.budget),
                    user_id: userId,
                    start_date: newProject.start_date,  
                    deadline: newProject.deadline,     
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((response) => {
                setProjects(projects.map((p) => (p.id === editingProject.id ? response.data : p)));
                setShowModal(false);
                setNewProject({ title: "", description: "", budget: "", start_date: "", deadline: "" });  // Clear all fields
                setEditingProject(null);  // Reset editing state
            })
            .catch((error) => {
                console.error("Error updating project:", error);
                alert("Failed to update project");
            });
    };
    
    const handleDeleteProject = (id) => {
        const token = localStorage.getItem("token");

        if (window.confirm("Are you sure you want to delete this project?")) {
            axios
                .delete(`http://127.0.0.1:8000/api/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(() => {
                    setProjects(projects.filter(project => project.id !== id));
                })
                .catch((error) => {
                    console.error("Error deleting project:", error);
                    alert("Failed to delete project");
                });
        }
    };

    // Function to refresh projects data
    const refreshProjects = () => {
        const token = localStorage.getItem("token");
        
        axios
            .get("http://127.0.0.1:8000/api/dashboard", { 
                headers: { Authorization: `Bearer ${token}` } 
            })
            .then((response) => {
                setProjects(response.data.projects || []);
            })
            .catch((error) => {
                console.error("Error refreshing projects:", error);
            });
    };

    // Date validation functions
    const validateTaskDates = (task, projectStartDate, projectDeadline) => {
        const errors = [];
        
        // Convert string dates to Date objects for comparison
        const taskStartDate = task.start_date ? new Date(task.start_date) : null;
        const taskDeadline = task.deadline ? new Date(task.deadline) : null;
        const projStartDate = projectStartDate ? new Date(projectStartDate) : null;
        const projDeadline = projectDeadline ? new Date(projectDeadline) : null;
        
        // Set time to midnight to compare dates only
        if (taskStartDate) taskStartDate.setHours(0, 0, 0, 0);
        if (taskDeadline) taskDeadline.setHours(0, 0, 0, 0);
        if (projStartDate) projStartDate.setHours(0, 0, 0, 0);
        if (projDeadline) projDeadline.setHours(0, 0, 0, 0);
        
        // If project has a start date, task start date should not be earlier
        if (taskStartDate && projStartDate && taskStartDate < projStartDate) {
            errors.push("Task start date cannot be earlier than project start date");
        }
        
        // If project has a deadline, task deadline should not be later
        if (taskDeadline && projDeadline && taskDeadline > projDeadline) {
            errors.push("Task deadline cannot be later than project deadline");
        }
        
        // Task deadline should not be earlier than task start date
        if (taskStartDate && taskDeadline && taskDeadline < taskStartDate) {
            errors.push("Task deadline cannot be earlier than task start date");
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    };

    const validateProjectDates = (project) => {
        const errors = [];

        const startDate = project.start_date ? new Date(project.start_date) : null;
        const deadline = project.deadline ? new Date(project.deadline) : null;

        // Ensure start date is not after the deadline
        if (startDate && deadline && startDate > deadline) {
            errors.push("Start date cannot be later than the deadline.");
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    };

    // Helper functions for real-time form validation
    const getProjectDateInfo = () => {
        const currentProject = projects.find(p => p.id === selectedProject);
        return {
            startDate: currentProject?.start_date || null,
            deadline: currentProject?.deadline || null,
            title: currentProject?.title || "selected project"
        };
    };


    const isTaskStartDateValid = () => {
        if (!newTask.start_date) return true; // Empty dates are valid
        
        const projectInfo = getProjectDateInfo();
        if (!projectInfo.startDate) return true; // No project start constraint
        
        return new Date(newTask.start_date) >= new Date(projectInfo.startDate);
    };

    const isTaskDeadlineValid = () => {
        if (!newTask.deadline) return true; // Empty dates are valid
        
        // Check task deadline vs project deadline
        const projectInfo = getProjectDateInfo();
        if (projectInfo.deadline && new Date(newTask.deadline) > new Date(projectInfo.deadline)) {
            return false;
        }
        
        // Check task deadline vs task start date
        if (newTask.start_date && new Date(newTask.deadline) < new Date(newTask.start_date)) {
            return false;
        }
        
        return true;
    };

    // Task modal form submit for adding a new task
    const handleAddTask = (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        
        // Get current project dates
        const currentProject = projects.find(p => p.id === selectedProject);
        const projectStartDate = currentProject?.start_date;
        const projectDeadline = currentProject?.deadline;
        
        // Validate task dates against project dates
        const validation = validateTaskDates(newTask, projectStartDate, projectDeadline);
        
        if (!validation.isValid) {
            // Display validation errors
            alert(`Date validation failed:\n${validation.errors.join('\n')}`);
            return; // Prevent form submission
        }

        const taskData = {
            ...newTask,
            start_date: newTask.start_date,
            deadline: newTask.deadline,
            estimated_hours: newTask.estimated_hours, 
            allocated_budget: newTask.allocated_budget,
            actual_spent: newTask.actual_spent
        };

        axios
            .post(`http://127.0.0.1:8000/api/projects/${selectedProject}/tasks`, taskData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((response) => {
                setTasks([...tasks, response.data]);
                setTaskModalShow(false);
                setNewTask({
                    title: "",
                    description: "",
                    status: "pending",
                    priority: "low",
                    user_id: "",
                    start_date: "",
                    deadline: "",
                    estimated_hours: "", // Reset estimated hours
                    allocated_budget: "",
                    actual_spent: ""
                });
                
                // Refresh projects to update the remaining budget
                refreshProjects();
            })
            .catch((error) => {
                console.error("Error adding task:", error);
                alert("Failed to add task");
            });
    };

    // Handle editing an existing task
    const handleEditTask = (task) => {
        setEditingTask(task);
        setNewTask({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            user_id: task.user_id,
            start_date: task.start_date,
            deadline: task.deadline,            
            estimated_hours: task.estimated_hours ?? ""// Populate estimated_hours
        });
        setEditTaskModalShow(true);
    };

    // Handle updating an existing task
    const handleUpdateTask = (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        
        // Get current project dates
        const currentProject = projects.find(p => p.id === selectedProject);
        const projectStartDate = currentProject?.start_date;
        const projectDeadline = currentProject?.deadline;
        
        // Validate task dates against project dates
        const validation = validateTaskDates(newTask, projectStartDate, projectDeadline);
        
        if (!validation.isValid) {
            // Display validation errors
            alert(`Date validation failed:\n${validation.errors.join('\n')}`);
            return; // Prevent form submission
        }

        const taskData = {
            ...newTask,
            start_date: newTask.start_date,
            deadline: newTask.deadline,
            estimated_hours: newTask.estimated_hours,
            allocated_budget: newTask.allocated_budget,
            actual_spent: newTask.actual_spent
        };

        axios.put(`http://127.0.0.1:8000/api/projects/${selectedProject}/tasks/${editingTask.id}`, taskData, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
            setTasks(tasks.map((t) => (t.id === editingTask.id ? res.data : t)));
            setEditTaskModalShow(false);
            setNewTask({
                title: "",
                description: "",
                status: "pending",
                priority: "low",
                user_id: "",
                start_date: "",
                deadline: "",
                estimated_hours: "", // Reset estimated hours
                allocated_budget: "",
                actual_spent: ""
            });
            setEditingTask(null);
            
            // Refresh projects to update the remaining budget
            refreshProjects();
        })
        .catch((err) => {
            console.error("Error updating task:", err);
            alert("Failed to update task: " + err.response?.data?.error || "Unknown error");
        });
    };

    const handleDeleteTask = (taskId) => {
        const token = localStorage.getItem("token");

        if (window.confirm("Are you sure you want to delete this task?")) {
            axios
                .delete(`http://127.0.0.1:8000/api/projects/${selectedProject}/tasks/${taskId}`, { 
                    headers: { Authorization: `Bearer ${token}` } 
                })
                .then(() => {
                    setTasks(tasks.filter((task) => task.id !== taskId));
                    
                    // Refresh projects to update the remaining budget
                    refreshProjects();
                })
                .catch((error) => {
                    console.error("Error deleting task:", error);
                    alert("Failed to delete task");
                });
        }
    };

    const handleViewExpenditures = (project) => {
        setSelectedProjectForExpenditure(project);
        setShowExpenditureModal(true);
    };    return (
        <div className="container mt-5">
            <div className="dashboard-header">
                <div className="logo-container">
                    <img src={logo} alt="Logo" className="mb-3" />
                </div>
                <div className="header-actions">
                    <Notifications />
                    <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                </div>
            </div>
            
            <h2 className="text-center">Dashboard</h2>
            <p className="text-muted text-center">{message}</p>            
            
            {/* Project Buttons */}            
            <div className="action-buttons">                
            
                <Button 
                    variant="success" 
                    onClick={() => {
                        setEditingProject(null);
                        setNewProject({ title: "", description: "", budget: "", start_date: "", deadline: "" });
                        setShowModal(true);
                    }}
                >
                    Add Project
                </Button>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Button
                        variant="info"
                        onClick={() => navigate('/activities')}
                    >
                        View Activity Feed
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/project-progress')}
                    >
                        Project Progress
                    </Button>
                </div>
            </div>
           
            {selectedProject && (
            <div className="action-buttons justify-content-start">
                <Button 
                    variant="primary" 
                    onClick={() => {
                        setEditingTask(null);
                        setNewTask({
                            title: "",
                            description: "",
                            status: "pending",
                            priority: "low",
                            user_id: "",
                            start_date: "",
                            deadline: "",
                            estimated_hours: "",
                            allocated_budget: "",
                            actual_spent: ""
                        });
                        setTaskModalShow(true);
                    }}
                >
                    Add Task
                </Button>
            </div>
        )}

            {/* Modal for Adding/Editing Project */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingProject ? "Edit Project" : "Add New Project"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={editingProject ? handleUpdateProject : handleAddProject}>
                        <Form.Group className="mb-3" controlId="formTitle">
                            <Form.Label>Project Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={newProject.title}
                                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formDescription">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={newProject.description}
                                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formBudget">
                            <Form.Label>Budget</Form.Label>
                            <Form.Control
                                type="number"
                                value={newProject.budget}
                                onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formStartDate">
                            <Form.Label>Start Date</Form.Label>                            
                            <Form.Control
                                type="date"
                                value={formatDateForInput(newProject.start_date)}
                                onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                                isInvalid={newProject.start_date && newProject.deadline && new Date(newProject.start_date) > new Date(newProject.deadline)}
                                placeholder="MM/DD/YYYY"
                            />
                            {newProject.start_date && newProject.deadline && new Date(newProject.start_date) > new Date(newProject.deadline) && (
                                <Form.Text className="text-danger">
                                    Start date cannot be later than the deadline.
                                </Form.Text>
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formDeadline">
                            <Form.Label>Deadline</Form.Label>                            
                            <Form.Control
                                type="date"
                                value={formatDateForInput(newProject.deadline)}
                                onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                                isInvalid={newProject.start_date && newProject.deadline && new Date(newProject.start_date) > new Date(newProject.deadline)}
                                placeholder="MM/DD/YYYY"
                            />
                            {newProject.start_date && newProject.deadline && new Date(newProject.start_date) > new Date(newProject.deadline) && (
                                <Form.Text className="text-danger">
                                    Deadline cannot be earlier than the start date.
                                </Form.Text>
                            )}
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            {editingProject ? "Update Project" : "Save Project"}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Modal for Adding Task */}
            <Modal show={taskModalShow} onHide={() => setTaskModalShow(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Task</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleAddTask}>
                        <Form.Group className="mb-3" controlId="formTitle">
                            <Form.Label>Task Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formDescription">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formPriority">
                            <Form.Label>Priority</Form.Label>
                            <Form.Control
                                as="select"
                                value={newTask.priority}
                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formUser">
                            <Form.Label>Assign To</Form.Label>
                            <Form.Control
                                as="select"
                                value={newTask.user_id}
                                onChange={(e) => setNewTask({ ...newTask, user_id: e.target.value })}
                            >
                                <option value="">Select User</option>
                                {users
                                    .filter(user => user.role === "Team Member") // Filter users by role
                                    .map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                            </Form.Control>
                        </Form.Group>                        {/* Add Start Date with validation */}
                        <Form.Group className="mb-3" controlId="formStartDate">
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={formatDateForInput(newTask.start_date)}
                                onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                                isInvalid={newTask.start_date && !isTaskStartDateValid()}
                                placeholder="MM/DD/YYYY"
                            />
                            {newTask.start_date && !isTaskStartDateValid() && (
                                <Form.Text className="text-danger">
                                    Start date must be on or after project start date ({getProjectDateInfo().startDate})
                                </Form.Text>
                            )}                            <Form.Text className="text-muted">
                                Project {getProjectDateInfo().title} starts on: {getProjectDateInfo().startDate ? formatDateForDisplay(getProjectDateInfo().startDate) : "No start date set"}
                            </Form.Text>
                        </Form.Group>                        {/* Add Deadline with validation */}
                        <Form.Group className="mb-3" controlId="formDeadline">
                            <Form.Label>Deadline</Form.Label>
                            <Form.Control
                                type="date"
                                value={formatDateForInput(newTask.deadline)}
                                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                                isInvalid={newTask.deadline && !isTaskDeadlineValid()}
                                placeholder="MM/DD/YYYY"
                            />
                            {newTask.deadline && !isTaskDeadlineValid() && (
                                <Form.Text className="text-danger">
                                    Deadline must be between task start date and project deadline
                                </Form.Text>
                            )}                            <Form.Text className="text-muted">
                                Project {getProjectDateInfo().title} ends on: {getProjectDateInfo().deadline ? formatDateForDisplay(getProjectDateInfo().deadline) : "No deadline set"}
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formEstimatedHours">
                            <Form.Label>Estimated Hours</Form.Label>
                            <Form.Control
                                type="number"
                                value={newTask.estimated_hours}
                                onChange={(e) => setNewTask({ ...newTask, estimated_hours: e.target.value })}
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Save Task
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Modal for Editing Task */}
            <Modal show={editTaskModalShow} onHide={() => setEditTaskModalShow(false)} centered>
            <Modal.Header closeButton>
                <Modal.Title>Edit Task</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleUpdateTask}>
                    <Form.Group className="mb-3" controlId="formTitle">
                        <Form.Label>Task Title</Form.Label>
                        <Form.Control
                            type="text"
                            value={newTask.title}
                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formDescription">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formStatus">
                        <Form.Label>Status</Form.Label>
                        <Form.Control
                            as="select"
                            value={newTask.status}
                            onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                        >
                            <option value="pending">Pending</option>
                            <option value="in progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </Form.Control>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formPriority">
                        <Form.Label>Priority</Form.Label>
                        <Form.Control
                            as="select"
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </Form.Control>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formUser">
                        <Form.Label>Assign To</Form.Label>
                        <Form.Control
                            as="select"
                            value={newTask.user_id}
                            onChange={(e) => setNewTask({ ...newTask, user_id: e.target.value })}
                        >
                            <option value="">Select User</option>
                            {users
                                .filter(user => user.role === "Team Member") // Filter users by role
                                .map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                        </Form.Control>
                    </Form.Group>
                    {/* Edit Start Date with validation */}
                    <Form.Group className="mb-3" controlId="formStartDate">
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={newTask.start_date}
                            onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                            isInvalid={newTask.start_date && !isTaskStartDateValid()}
                        />
                        {newTask.start_date && !isTaskStartDateValid() && (
                            <Form.Text className="text-danger">
                                Start date must be on or after project start date ({getProjectDateInfo().startDate})
                            </Form.Text>
                        )}
                        <Form.Text className="text-muted">
                            {getProjectDateInfo().title} starts on: {getProjectDateInfo().startDate || "No start date set"}
                        </Form.Text>
                    </Form.Group>
                    {/* Edit Deadline with validation */}
                    <Form.Group className="mb-3" controlId="formDeadline">
                        <Form.Label>Deadline</Form.Label>
                        <Form.Control
                            type="date"
                            value={newTask.deadline}
                            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                            isInvalid={newTask.deadline && !isTaskDeadlineValid()}
                        />
                        {newTask.deadline && !isTaskDeadlineValid() && (
                            <Form.Text className="text-danger">
                                Deadline must be between task start date and project deadline
                            </Form.Text>
                        )}
                        <Form.Text className="text-muted">
                            {getProjectDateInfo().title} ends on: {getProjectDateInfo().deadline || "No deadline set"}
                        </Form.Text>
                    </Form.Group>
                    {/* Edit Estimated Hours */}
                    <Form.Group className="mb-3" controlId="formEstimatedHours">
                        <Form.Label>Estimated Hours</Form.Label>
                        <Form.Control
                            type="number"
                            value={newTask.estimated_hours}
                            onChange={(e) => setNewTask({ ...newTask, estimated_hours: e.target.value })}
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Update Task
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>

            <div className="row">
                <div className="col-md-12">
                    {/* Projects List */}
                    <Projects
                        projects={projects}
                        onProjectClick={(project) => {
                            setSelectedProjectId(project.id);
                            handleProjectClick(project);
                        }}
                        onEditProject={handleEditProject}
                        onDeleteProject={handleDeleteProject}
                        selectedProjectId={selectedProjectId}
                        onViewExpenditures={handleViewExpenditures}
                    />

                    {/* Tasks List */}
                    {selectedProject && (
                        <div className="card mt-3 p-3 shadow-sm">
                            <div className="d-flex mb-2 justify-content-between align-items-center">
                                <h2>Tasks</h2>
                                {selectedProjectId && (
                                    <div>
                                        <button
                                            className="btn btn-info"
                                            onClick={() => navigate(`/projects/${selectedProjectId}/risks-issues`)}
                                        >
                                            Manage Risks & Issues
                                        </button>
                                        <button
                                            className="btn btn-info"
                                            style={{ marginLeft: '10px' }}
                                            onClick={() => navigate(`/projects/${selectedProjectId}/files`)}
                                        >
                                            Manage Files
                                        </button>
                                    </div>
                                )}
                            </div>
                            <Tasks
                                tasks={tasks}
                                onEditTask={handleEditTask}
                                onDeleteTask={handleDeleteTask}
                                projectId={selectedProjectId}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Expenditure Modal */}
            <Modal 
                show={showExpenditureModal} 
                onHide={() => setShowExpenditureModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        Expenditures - {selectedProjectForExpenditure?.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="expenditure-modal-body">
                    {selectedProjectForExpenditure && (
                        <ExpenditureManagement
                            project={selectedProjectForExpenditure}
                            onUpdate={refreshProjects}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default Dashboard;