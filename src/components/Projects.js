import React from "react";

function Projects({ projects, onProjectClick, onEditProject, onDeleteProject }) {
    
    return (
        <table className="table table-bordered">
            <thead className="table-dark">
                <tr>
                    <th>#</th>
                    <th>Project Name</th>
                    <th>Description</th>
                    <th>Budget</th>
                    <th>Start Date</th> {/* Added Start Date Column */}
                    <th>Deadline</th> {/* Added Deadline Column */}
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {projects.length > 0 ? (
                    projects.map((project, index) => (
                        <tr key={project.id} onClick={() => onProjectClick(project)} style={{ cursor: "pointer" }}>
                            <td>{index + 1}</td>
                            <td>{project.title}</td>
                            <td>{project.description}</td>
                            <td>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(project.budget)}</td>
                            <td>{project.start_date ? new Date(project.start_date).toLocaleDateString() : "N/A"}</td>
                            <td>{project.deadline ? new Date(project.deadline).toLocaleDateString() : "N/A"}</td>
                            <td>
                                <button onClick={() => onEditProject(project)} className="btn btn-warning me-2">
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDeleteProject(project.id)}
                                    className="btn btn-danger"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="7" className="text-center">No projects available</td> {/* Adjusted colspan to 7 */}
                    </tr>
                )}
            </tbody>
        </table>
    );
}

export default Projects;
