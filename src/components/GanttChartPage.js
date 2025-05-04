import React, { useEffect, useState } from "react";
import { useParams, useNavigate} from "react-router-dom";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import logo from "../assets/klick logo.png";


function GanttChartPage() {
    const { id } = useParams();
    const navigate = useNavigate(); 
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/projects/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        Accept: 'application/json',
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch project data');
                }
                
                const data = await response.json();
                setProjectData(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchProjectData();
    }, [id]);
    
    if (loading) return <div className="text-center mt-5">Loading Gantt Chart...</div>;
    if (error) return <div className="alert alert-danger mt-3">Error: {error}</div>;
    if (!projectData) return <div className="alert alert-warning mt-3">No project found.</div>;
    
    // Prepare tasks for the Gantt chart
    const tasks = [
        // Project as the main bar
        {
            start: new Date(projectData.start_date || Date.now()),
            end: new Date(projectData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // Default 1 week ahead
            name: projectData.title,
            id: "project-" + projectData.id,
            type: "project",
            progress: 0,
            isDisabled: true,
            styles: { progressColor: '#ffbb54', progressSelectedColor: '#ffbb54' }
        }
    ];
    
    // Add tasks as sub-items
    if (projectData.tasks && projectData.tasks.length > 0) {
        projectData.tasks.forEach(task => {
            if (task.start_date && task.deadline) {
                tasks.push({
                    start: new Date(task.start_date),
                    end: new Date(task.deadline),
                    name: task.title,
                    id: task.id.toString(),
                    type: "task",
                    progress: task.status === "completed" ? 100 : (task.status === "in progress" ? 50 : 0),
                    project: "project-" + projectData.id,
                    // Color based on priority
                    styles: { 
                        progressColor: task.priority === "high" ? '#ff0000' : 
                                       task.priority === "medium" ? '#ff9900' : '#00ff00', 
                        progressSelectedColor: '#ff9900'
                    }
                });
            }
        });
    }
    
    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center ">
                <img src={logo} alt="Logo" className="mb-3" style={{ width: "auto", height: "100px" }} />
                
                {/* Back Button */}
                <button 
                    className="btn btn-secondary mb-3"
                    onClick={() => navigate(-1)} // This will navigate back to the previous page
                >
                    Back
                </button>
            </div>

            <h2 className="mb-4">Gantt Chart for: {projectData.title}</h2>

            <div className="card shadow mb-4">
                <div className="card-body">
                    <div style={{ height: '500px' }}>
                        {tasks.length > 1 ? (
                            <Gantt
                                tasks={tasks}
                                viewMode={ViewMode.Day}
                                locale="en-US"
                                listCellWidth=""
                                columnWidth={60}
                            />
                        ) : (
                            <div className="alert alert-info">
                                No tasks with valid start and end dates found for this project.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GanttChartPage;