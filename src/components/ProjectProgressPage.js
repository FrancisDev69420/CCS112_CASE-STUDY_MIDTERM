import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, ProgressBar, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import logo from "../assets/klick logo.png";

function ProjectProgressPage() {
    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    const fetchProjectDetails = useCallback(async (projectId) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/tasks`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            return response.data || [];
        } catch (error) {
            console.error(`Error fetching tasks for project ${projectId}:`, error);
            return [];
        }
    }, []);

    const fetchProjectExpenditures = useCallback(async (projectId) => {
        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/expenditures`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            return response.data || [];
        } catch (error) {
            console.error(`Error fetching expenditures for project ${projectId}:`, error);
            return [];
        }
    }, []);

    const fetchProjects = useCallback(async () => {
        try {
            const response = await axios.get("http://127.0.0.1:8000/api/dashboard", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            
            // Get all projects
            const projectsData = response.data.projects || [];
            
            // Fetch tasks and expenditures for each project
            const projectsWithDetails = await Promise.all(projectsData.map(async (project) => {
                const [tasks, expenditures] = await Promise.all([
                    fetchProjectDetails(project.id),
                    fetchProjectExpenditures(project.id)
                ]);
                return { 
                    ...project, 
                    tasks,
                    expenditures 
                };
            }));
            
            setProjects(projectsWithDetails);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    }, [fetchProjectDetails, fetchProjectExpenditures]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        // Initial fetch
        fetchProjects();

        // Set up periodic refresh every 30 seconds
        const intervalId = setInterval(fetchProjects, 30000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, [navigate, fetchProjects]);

    const calculateTaskProgress = (project) => {
        if (!project.tasks || project.tasks.length === 0) return 0;
        const completedTasks = project.tasks.filter(task => task.status === 'completed').length;
        return Math.round((completedTasks / project.tasks.length) * 100);
    };

    const calculateTimeProgress = (project) => {
        if (!project.start_date || !project.deadline) return 0;
        const start = new Date(project.start_date);
        const end = new Date(project.deadline);
        const now = new Date();
        
        if (now < start) return 0;
        if (now > end) return 100;
        
        const total = end - start;
        const current = now - start;
        return Math.round((current / total) * 100);
    };    
    
    const calculateBudgetProgress = (project) => {
        if (!project.budget || project.budget === 0) return 0;
        const spent = project.expenditures?.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) || 0;
        return Math.round((spent / project.budget) * 100);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        return new Date(dateString).toLocaleDateString();
    };

    const getBudgetColor = (percentage) => {
        if (percentage >= 90) return 'danger';
        if (percentage >= 70) return 'warning';
        return 'success';
    };    
    
    return (
        <Container fluid className="py-5 px-4">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div className="d-flex align-items-center">
                    <img src={logo} alt="Logo" style={{ height: '50px' }} className="me-3" />
                    <h2 className="mb-0">Project Progress Overview</h2>
                </div>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                    Back to Dashboard
                </Button>
            </div>

            <Row className="g-4">
                {projects.map(project => (
                    <Col md={6} lg={4} key={project.id}>
                        <Card className="h-100 shadow-sm">
                            <Card.Header as="h5" className="py-3">{project.title}</Card.Header>
                            <Card.Body className="px-4">
                                <div className="mb-4">
                                    <div className="d-flex justify-content-between mb-1">
                                        <small>Tasks Completed:</small>
                                        <small>{calculateTaskProgress(project)}%</small>
                                    </div>
                                    <ProgressBar 
                                        now={calculateTaskProgress(project)} 
                                        variant="primary"
                                        className="mb-2"
                                    />
                                </div>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <small>Timeline Progress:</small>
                                        <small>{calculateTimeProgress(project)}%</small>
                                    </div>
                                    <ProgressBar 
                                        now={calculateTimeProgress(project)} 
                                        variant="info"
                                        className="mb-2"
                                    />
                                </div>

                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <small>Budget Used:</small>
                                        <small>{calculateBudgetProgress(project)}%</small>
                                    </div>
                                    <ProgressBar 
                                        now={calculateBudgetProgress(project)} 
                                        variant={getBudgetColor(calculateBudgetProgress(project))}
                                        className="mb-2"
                                    />
                                </div>                                <div className="mt-4 pt-2 border-top">
                                    <small className="text-muted d-block mb-1">Start: {formatDate(project.start_date)}</small>
                                    <small className="text-muted d-block">Deadline: {formatDate(project.deadline)}</small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default ProjectProgressPage;
