import React from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom

function Projects({ projects, onProjectClick, onEditProject, onDeleteProject, selectedProjectId, onViewExpenditures }) {
    const navigate = useNavigate(); // Initialize navigate function from React Router

    const handleViewGanttChart = (projectId) => {
        // Navigate to the Gantt chart page for the specific project
        navigate(`/project/${projectId}/gantt`);
    };

    return (
        <>

            {/* Projects list */}
            <table className="table table-bordered">
                <thead className="table-dark">
                    <tr>
                        <th>#</th>
                        <th>Project Name</th>
                        <th>Description</th>
                        <th>Budget</th>
                        <th>Remaining Budget</th>
                        <th>Start Date</th> 
                        <th>Deadline</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.length > 0 ? (
                        projects.map((project, index) => (
                            <tr key={project.id} onClick={() => onProjectClick(project)} style={{ cursor: "pointer" }}
                                className={project.id === selectedProjectId ? "table-success" : "table-light"}
                            >
                                <td>{index + 1}</td>
                                <td>{project.title}</td>
                                <td>{project.description}</td>
                                <td>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(project.budget)}</td>
                                <td>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(project.remaining_budget)}</td>
                                <td>{project.start_date ? new Date(project.start_date).toLocaleDateString() : "N/A"}</td>
                                <td>{project.deadline ? new Date(project.deadline).toLocaleDateString() : "N/A"}</td>
                                <td>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditProject(project);
                                        }}
                                        className="btn btn-warning btn-sm me-2"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteProject(project.id);
                                        }}
                                        className="btn btn-danger btn-sm me-2"
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewGanttChart(project.id); // Call the function on button click
                                        }}
                                        className="btn btn-info btn-sm me-2"
                                    >
                                        Gantt
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewExpenditures(project);
                                        }}
                                        className="btn btn-success btn-sm"
                                    >
                                        Expenses
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="text-center">No projects available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </>
    );
}

export default Projects;
