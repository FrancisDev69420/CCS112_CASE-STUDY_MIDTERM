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
                            <td> {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(project.budget)}</td>
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
                        <td colSpan="2" className="text-center">No projects available</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}

export default Projects;
