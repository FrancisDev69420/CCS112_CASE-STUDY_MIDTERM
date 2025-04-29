import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Projects from "./Projects";
import Tasks from "./Tasks";
import logo from "../assets/klick logo.png";
import { Modal, Button, Form } from 'react-bootstrap';

function Dashboard() {
    const [message, setMessage] = useState("");
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [newProject, setNewProject] = useState({ title: "", description: "", budget: "", start_date: "", deadline: ""  });
    const [editingProject, setEditingProject] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [taskModalShow, setTaskModalShow] = useState(false); // Toggle task modal visibility
    const [editTaskModalShow, setEditTaskModalShow] = useState(false);
    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        status: "pending",
        priority: "low",
        user_id: "",
        start_date: "",
        deadline: "",
        allocated_budget: "", // New field for allocated budget
        actual_spent: "" // New field for actual spent
    });
    const [editingTask, setEditingTask] = useState(null);
    const [users, setUsers] = useState([]);
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

    // Task modal form submit for adding a new task
   const handleAddTask = (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        const taskData = {
            ...newTask,
            start_date: newTask.start_date,
            deadline: newTask.deadline,
            allocated_budget: newTask.allocated_budget,  // Include allocated_budget
            actual_spent: newTask.actual_spent           // Include actual_spent
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
                    allocated_budget: "",  // Reset allocated_budget
                    actual_spent: ""       // Reset actual_spent
                });
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
            allocated_budget: task.allocated_budget ?? "",  // Populate allocated_budget
            actual_spent: task.actual_spent ?? ""           // Populate actual_spent
        });
        setEditTaskModalShow(true);
    };

    // Handle updating an existing task
    const handleUpdateTask = (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        const taskData = {
            ...newTask,
            start_date: newTask.start_date,
            deadline: newTask.deadline,
            allocated_budget: newTask.allocated_budget,  // Include allocated_budget
            actual_spent: newTask.actual_spent           // Include actual_spent
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
                allocated_budget: "",  // Reset allocated_budget
                actual_spent: ""       // Reset actual_spent
            });
            setEditingTask(null);
        })
        .catch((err) => {
            console.error("Error updating task:", err);
            alert( "Failed to update task: " + err.response.data.error);
        });
    };


    const handleDeleteTask = (taskId) => {
        const token = localStorage.getItem("token");

        if (window.confirm("Are you sure you want to delete this task?")) {
            axios
                .delete(`http://127.0.0.1:8000/api/projects/${selectedProject}/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(() => {
                    setTasks(tasks.filter((task) => task.id !== taskId));
                })
                .catch((error) => {
                    console.error("Error deleting task:", error);
                    alert("Failed to delete task");
                });
        }
    };

    return (
        <div className="container mt-5">
            <img src={logo} alt="Logo" className="mb-3" style={{ width: "auto", height: "100px" }} />
            
            <h2 className="text-center">Dashboard</h2>
            <p className="text-muted text-center">{message}</p>

            <div className="d-flex justify-content-end">
                <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
            </div>

            {/* Add Project Button */}
            <div className="d-flex justify-content-start mb-3">
                <Button 
                    variant="success" 
                    onClick={() => {
                        setEditingProject(null);  // Reset editing state
                        setNewProject({ title: "", description: "", budget: "", start_date: "", deadline: "" });  // Reset form fields
                        setShowModal(true);
                    }}
                >
                    Add Project
                </Button>
            </div>

            {/* Conditionally render Add Task button if a project is selected */}
            {selectedProject && (
            <div className="d-flex justify-content-start mb-3">
                <Button 
                    variant="primary" 
                    onClick={() => {
                        setEditingTask(null);  // Reset editing task state
                        setNewTask({
                            title: "",
                            description: "",
                            status: "pending",
                            priority: "low",
                            user_id: "",
                            start_date: "",
                            deadline: ""
                        });  // Reset task form fields
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
                                value={newProject.start_date}
                                onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formDeadline">
                            <Form.Label>Deadline</Form.Label>
                            <Form.Control
                                type="date"
                                value={newProject.deadline}
                                onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                            />
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
                        </Form.Group>
                        {/* Add Start Date */}
                        <Form.Group className="mb-3" controlId="formStartDate">
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={newTask.start_date}
                                onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                            />
                        </Form.Group>
                        {/* Add Deadline */}
                        <Form.Group className="mb-3" controlId="formDeadline">
                            <Form.Label>Deadline</Form.Label>
                            <Form.Control
                                type="date"
                                value={newTask.deadline}
                                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formAllocatedBudget">
                            <Form.Label>Allocated Budget</Form.Label>
                            <Form.Control
                                type="number"
                                value={newTask.allocated_budget}
                                onChange={(e) => setNewTask({ ...newTask, allocated_budget: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formActualSpent">
                            <Form.Label>Actual Spent</Form.Label>
                            <Form.Control
                                type="number"
                                value={newTask.actual_spent}
                                onChange={(e) => setNewTask({ ...newTask, actual_spent: e.target.value })}
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
                    {/* Edit Start Date */}
                    <Form.Group className="mb-3" controlId="formStartDate">
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={newTask.start_date}
                            onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                        />
                    </Form.Group>
                    {/* Edit Deadline */}
                    <Form.Group className="mb-3" controlId="formDeadline">
                        <Form.Label>Deadline</Form.Label>
                        <Form.Control
                            type="date"
                            value={newTask.deadline}
                            onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                        />
                    </Form.Group>
                    {/* Edit Allocated Budget */}
                    <Form.Group className="mb-3" controlId="formAllocatedBudget">
                        <Form.Label>Allocated Budget</Form.Label>
                        <Form.Control
                            type="number"
                            value={newTask.allocated_budget}
                            onChange={(e) => setNewTask({ ...newTask, allocated_budget: e.target.value })}
                        />
                    </Form.Group>
                    {/* Edit Actual Spent */}
                    <Form.Group className="mb-3" controlId="formActualSpent">
                        <Form.Label>Actual Spent</Form.Label>
                        <Form.Control
                            type="number"
                            value={newTask.actual_spent}
                            onChange={(e) => setNewTask({ ...newTask, actual_spent: e.target.value })}
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Update Task
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>


            {/* Projects List */}
            <Projects
                projects={projects}
                onProjectClick={(project) => {
                    setSelectedProjectId(project.id);        // Set the selected ID
                    handleProjectClick(project);             // Keep your existing logic
                }}
                onEditProject={handleEditProject}
                onDeleteProject={handleDeleteProject}
                selectedProjectId={selectedProjectId}
            />

            {/* Tasks List */}
            {selectedProject && (
                <div className="card mt-3 p-3 shadow-sm">
                    <h4>Tasks for {projects?.find(p => p.id === selectedProject)?.title || "Unknown Project"}</h4>
                    {console.log("Tasks:", tasks)} {/* Log tasks */}
                    <Tasks
                        tasks={tasks}
                        onDeleteTask={handleDeleteTask}
                        onEditTask={handleEditTask}
                    />
                </div>
            )}
        </div>
    );
}

export default Dashboard;