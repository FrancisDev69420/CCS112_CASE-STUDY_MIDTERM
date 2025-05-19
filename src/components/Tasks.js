import React, { useState } from "react";
import TaskComments from "./TaskComments";

function Tasks({ tasks = [], onEditTask, onDeleteTask, projectId }) {
    const [expandedTaskId, setExpandedTaskId] = useState(null);

    const toggleComments = (taskId) => {
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
    };

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    };

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
                        <th>Estimated Hours</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.length > 0 ? (
                        tasks.map((task, i) => (
                            <React.Fragment key={i}>
                                <tr>
                                    <td>{task.title}</td>
                                    <td>{task.description}</td>
                                    <td>{task.status}</td>
                                    <td>{task.priority}</td>
                                    <td>{task.user ? task.user.name : 'Not assigned'}</td>
                                    <td>{formatDateForDisplay(task.start_date)}</td>
                                    <td>{formatDateForDisplay(task.deadline)}</td>
                                    <td >
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
                                            className="btn btn-danger btn-sm me-2"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => toggleComments(task.id)}
                                            className="btn btn-info btn-sm"
                                        >
                                            💬 {expandedTaskId === task.id ? 'Hide' : 'Comments'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedTaskId === task.id && (
                                    <tr>
                                        <td colSpan="9">
                                            <TaskComments taskId={task.id} projectId={projectId} />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="9" className="text-center">No tasks available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Tasks;
