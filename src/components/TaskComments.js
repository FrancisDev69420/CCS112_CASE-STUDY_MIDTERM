import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../TaskComments.css'; 

function TaskComments({ taskId, projectId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch current user info
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/user', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setCurrentUser(response.data);
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };
        fetchCurrentUser();
    }, []);

    // Fetch comments for the task
    const fetchComments = useCallback(async () => {
        try {
            const response = await axios.get(
                `http://localhost:8000/api/projects/${projectId}/tasks/${taskId}/comments`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, [taskId, projectId]);

    // Load comments when component mounts or taskId changes
    useEffect(() => {
        if (taskId && projectId) {
            fetchComments();
        }
    }, [fetchComments, taskId, projectId]);

    // Handle adding a new comment
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() && !selectedFile) return;

        setLoading(true);
        try {
            const formData = new FormData();
            if (newComment.trim()) {
                formData.append('content', newComment);
            } else {
                formData.append('content', ''); // Send empty content if only file is attached
            }
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            await axios.post(
                `http://localhost:8000/api/projects/${projectId}/tasks/${taskId}/comments`,
                formData,
                { 
                    headers: { 
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );
            setNewComment('');
            setSelectedFile(null);
            fetchComments();
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        // Reset the file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleDownload = async (commentId, fileName) => {
        try {
            const response = await axios.get(
                `http://localhost:8000/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}/download`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    responseType: 'blob'
                }
            );

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    // Handle editing a comment
    const handleEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditContent('');
    };

    const handleUpdateComment = async (commentId) => {
        if (!editContent.trim()) return;

        setLoading(true);
        try {
            await axios.put(
                `http://localhost:8000/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
                { content: editContent },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setEditingCommentId(null);
            setEditContent('');
            fetchComments(); // Refresh comments after update
        } catch (error) {
            console.error('Error updating comment:', error);
        } finally {
            setLoading(false);
        }
    };    
    
    const handleDelete = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(
                `http://localhost:8000/api/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            fetchComments(); // Refresh comments after deletion
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            setLoading(false);
        }
    };

    const canEditComment = (comment) => {
        return currentUser && (
            comment.user_id === currentUser.id 
        );
    };

    return (
        <div className="task-comments">
            <h6 className="mb-3">💬 Comments</h6>
            <div className="comments-list mb-3">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="comment-item p-2 mb-2">
                            <div className="d-flex justify-content-between">
                                <small className="fw-bold">
                                    {comment.user?.name || 'Anonymous'} 
                                    <span className={`badge ms-2 ${
                                        comment.user?.role === 'Project Manager' ? 'bg-primary' : 
                                        comment.user?.role === 'Team Member' ? 'bg-info' : 'bg-secondary'
                                    }`}>
                                        {comment.user?.role || 'Unknown Role'}
                                    </span>
                                </small>
                                <small className="text-muted">
                                    {new Date(comment.created_at).toLocaleString()}
                                </small>
                            </div>
                            {editingCommentId === comment.id ? (
                                <div className="mt-2">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            disabled={loading}
                                        />
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => handleUpdateComment(comment.id)}
                                            disabled={loading || !editContent.trim()}
                                        >
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={handleCancelEdit}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="mb-1 mt-1">{comment.content}</p>
                                    {comment.file_name && (
                                        <div className="attachment-section mt-1">
                                            <small className="text-muted">
                                                📎 Attachment: 
                                                <button 
                                                    className="btn btn-link btn-sm p-0 ms-1"
                                                    onClick={() => handleDownload(comment.id, comment.file_name)}
                                                >
                                                    {comment.file_name}
                                                </button>
                                                ({(comment.file_size / 1024).toFixed(1)} KB)
                                            </small>
                                        </div>
                                    )}
                                    {canEditComment(comment) && (
                                        <div className="mt-1 d-flex gap-3">
                                            <button
                                                className="btn btn-link btn-sm text-primary p-0"
                                                onClick={() => handleEdit(comment)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-link btn-sm text-danger p-0"
                                                onClick={() => handleDelete(comment.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-muted">No comments yet</p>
                )}
            </div>
            <form onSubmit={handleSubmit} className="comment-form">
                <div className="input-group mb-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={loading || (!newComment.trim() && !selectedFile)}
                    >
                        {loading ? 'Posting...' : 'Post'}
                    </button>
                </div>
                <div className="file-upload">
                    <input
                        type="file"
                        className="form-control form-control-sm"
                        onChange={handleFileSelect}
                        disabled={loading}
                    />
                    {selectedFile && (
                        <div className="d-flex justify-content-between align-items-center mt-1">
                            <small className="text-muted">
                                Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </small>
                            <button
                                className="btn btn-danger btn-sm"
                                onClick={handleRemoveFile}
                                disabled={loading}
                                title="Remove file"
                            >
                                &times;
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}

export default TaskComments;