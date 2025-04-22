import React from "react";

function Tasks({ tasks = [], onEditTask, onDeleteTask }) {
    return (
        <div className="table-responsive">
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Assigned to</th>
                        <th>Actions</th> {/* New column for actions */}
                    </tr>
                </thead>
                <tbody>
                    {tasks.length > 0 ? (
                        tasks.map((task, i) => (
                            <tr key={i}>
                                <td>{task.title}</td> {/* Display the task title */}
                                <td>{task.description}</td> {/* Display the task description */}
                                <td>{task.status}</td> {/* Display the status */}
                                <td>{task.priority}</td> {/* Display the priority */}
                                <td>{task.user ? task.user.name : 'Not assigned'}</td> {/* Display the assigned user */}
                                <td>
                                    <button onClick={() => onEditTask(task)} className="btn btn-primary btn-sm me-2">
                                        Edit
                                    </button>
                                    <button onClick={() => onDeleteTask(task.id)} className="btn btn-danger btn-sm ml-2">
                                        Delete
                                    </button>
                                </td> {/* Action buttons */}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center">No tasks available</td> {/* Adjusted colSpan for the new Actions column */}
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Tasks;
