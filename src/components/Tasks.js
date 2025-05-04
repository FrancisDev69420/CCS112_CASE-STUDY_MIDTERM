import React from "react";

function Tasks({ tasks = [], onEditTask, onDeleteTask }) {


    return (
        <div className="table-responsive">
            <table className="table table-bordered">
                <thead className="table-secondary">
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Assigned to</th>
                        <th>Start Date</th>
                        <th>Deadline</th>
                        <th style={{ width: '80px' }}>Estimated Hours</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.length > 0 ? (
                        tasks.map((task, i) => (
                            <tr key={i}>
                                <td>{task.title}</td>
                                <td>{task.description}</td>
                                <td>{task.status}</td>
                                <td>{task.priority}</td>
                                <td>{task.user ? task.user.name : 'Not assigned'}</td>
                                <td>{task.start_date ? new Date(task.start_date).toLocaleDateString() : 'N/A'}</td>
                                <td>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</td>
                                <td style={{ width: '80px' }}>
                                    {task.estimated_hours != null ? task.estimated_hours : 'N/A'}
                                </td>
                                <td>
                                    <button
                                        onClick={() => onEditTask(task)}
                                        className="btn btn-primary btn-sm me-2"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onDeleteTask(task.id)}
                                        className="btn btn-danger btn-sm"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="10" className="text-center">No tasks available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Tasks;
