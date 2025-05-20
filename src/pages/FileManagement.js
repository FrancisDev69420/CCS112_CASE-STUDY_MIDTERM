import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Modal, Form } from 'react-bootstrap';
import '../FileManagement.css';

const FileManagement = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [files, setFiles] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [file, setFile] = useState(null);
    const [accessLevel, setAccessLevel] = useState('restricted');
    const [selectedFile, setSelectedFile] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [assignedUserIds, setAssignedUserIds] = useState([]); // Updated to handle multiple user IDs
    const [users, setUsers] = useState([]);
    const [fileMembers, setFileMembers] = useState([]); // State to store members of a file
    const [uploadAssignedUserIds, setUploadAssignedUserIds] = useState([]); // State to store assigned users during upload

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/files`, { headers })
            .then(response => {
                console.log('File data:', response.data); // Add this for debugging
                setFiles(response.data);
            })
            .catch(error => console.error('Error fetching files:', error));
    }, [projectId]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch project members
        axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/members`, { headers })
            .then(response => {
                const teamMembers = response.data.filter(user => user.role === 'Team Member');
                setUsers(teamMembers);
            })
            .catch(error => console.error('Error fetching members:', error));
    }, [projectId]);

    const handleFileChange = (e) => setFile(e.target.files[0]);
    const handleAccessChange = (e) => setAccessLevel(e.target.value);

    const validateUploadForm = () => {
        if (!file) {
            alert('Please select a file to upload.');
            return false;
        }
        return true;
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (!validateUploadForm()) return;

        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const formData = new FormData();
        formData.append('file', file);
        formData.append('access_level', accessLevel);
        if (accessLevel === 'restricted') {
            formData.append('assigned_user_ids', JSON.stringify(uploadAssignedUserIds));
        }

        axios.post(`http://127.0.0.1:8000/api/projects/${projectId}/files`, formData, { headers })
            .then(response => {
                setFiles([...files, response.data]);
                setShowUploadModal(false);
                setFile(null);
                setAccessLevel('restricted');
                setUploadAssignedUserIds([]); // Clear assigned users after upload
                fetchFileMembers(response.data.id); // Fetch members after upload
            })
            .catch(error => alert('Error uploading file'));
    };    const handleDelete = (fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) {
            return;
        }

        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.delete(`http://127.0.0.1:8000/api/projects/${projectId}/files/${fileId}`, { headers })
            .then(() => {
                setFiles(files.filter(file => file.id !== fileId));
                alert('File deleted successfully');
            })
            .catch(error => {
                const message = error.response?.data?.message || 'Error deleting file';
                alert(message);
            });
    };    const handleDownload = (fileId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/files/${fileId}/download`, { headers, responseType: 'blob' })
            .then(response => {                
                
                const contentType = response.headers['content-type'];
                
                // Get the name of the file from our files array using the fileId
                const currentFile = files.find(f => f.id === fileId);
                const fileName = currentFile ? currentFile.name : 'downloaded_file';
                
                // Create a blob with the correct MIME type from the response
                const blob = new Blob([response.data], { type: contentType });
                const url = window.URL.createObjectURL(blob);
                
                // Create a link and trigger download
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                
                // Clean up
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            })
            .catch(error => alert('Error downloading file'));
    };

    const handleEditAccess = (file) => {
        setSelectedFile(file);
        setAccessLevel(file.access_level);
        setAssignedUserIds(file.assigned_user_ids || []);
        fetchFileMembers(file.id); // Fetch members when opening the modal
        setShowEditModal(true);
    };    const handleSaveAccess = () => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/files/${selectedFile.id}`, {
            access_level: accessLevel,
            assigned_user_ids: accessLevel === 'restricted' ? assignedUserIds : [], // Send multiple user IDs
        }, { headers })
            .then(response => {
                setFiles(files.map(file => file.id === response.data.id ? response.data : file));
                setShowEditModal(false);
                setSelectedFile(null);
                alert('File access settings updated successfully');
            })
            .catch(error => {
                const message = error.response?.data?.message || 'Error updating access level';
                alert(message);
            });
    };


    const fetchFileMembers = (fileId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/files/${fileId}/members`, { headers })
            .then(response => {
                console.log('Fetched file members:', response.data); // Debugging log
                setFileMembers(response.data);
            })
            .catch(error => console.error('Error fetching file members:', error));
    };

    const addFileMember = (fileId, userId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.post(`http://127.0.0.1:8000/api/projects/${projectId}/files/${fileId}/members`, { user_ids: [userId] }, { headers })
            .then(() => fetchFileMembers(fileId))
            .catch(error => console.error('Error adding file member:', error));
    };

    const removeFileMember = (fileId, userId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.delete(`http://127.0.0.1:8000/api/projects/${projectId}/files/${fileId}/members`, {
            headers,
            data: { user_ids: [userId] },
        })
            .then(() => fetchFileMembers(fileId))
            .catch(error => console.error('Error removing file member:', error));
    };

    return (
        <div className="file-management">
            <h1>File Management</h1>
            <div className="header">
                <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
                <Button variant="primary" onClick={() => setShowUploadModal(true)}>Upload File</Button>
            </div>

            <div className="file-list">
                <div className="file-list-header">
                    <div className="file-cell">File Name</div>
                    <div className="file-cell">Access Level</div>
                    <div className="file-cell">Uploaded By</div>
                    <div className="file-cell">Actions</div>
                </div>
                <div className="file-items">
                    {files.map(file => {
                        const currentUserId = parseInt(localStorage.getItem('user_id'));
                        // Check if user is uploader or file is accessible
                        if (file.access_level === 'restricted' && 
                            file.uploader_id !== currentUserId && 
                            !file.users?.some(user => user.id === currentUserId)) {
                            return null;
                        }
                        
                        return (
                            <div key={file.id} className="file-item">
                                <div className="file-cell">{file.name}</div>
                                <div className="file-cell">
                                    <span className={`access-level ${file.access_level}`}>
                                        {file.access_level}
                                    </span>
                                </div>
                                <div className="file-cell">{file.uploader?.name || 'Unknown'}</div>
                                <div className="file-cell actions">
                                    <Button variant="info" onClick={() => handleDownload(file.id)}>Download</Button>
                                    {/* Only show edit and delete buttons if current user is the uploader */}
                                    {file.uploader_id === parseInt(localStorage.getItem('user_id')) && (
                                        <>
                                            <Button variant="warning" onClick={() => handleEditAccess(file)}>Edit Access</Button>
                                            <Button variant="danger" onClick={() => handleDelete(file.id)}>Delete</Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Upload File</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpload}>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>File</Form.Label>
                            <Form.Control type="file" onChange={handleFileChange} required />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Access Level</Form.Label>
                            <Form.Select value={accessLevel} onChange={handleAccessChange}>
                                <option value="restricted">Restricted</option>
                                <option value="everyone">Everyone</option>
                            </Form.Select>
                        </Form.Group>
                        
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">Upload</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Access Level</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Access Level</Form.Label>
                        <Form.Select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)}>
                            <option value="restricted">Restricted</option>
                            <option value="everyone">Everyone</option>
                        </Form.Select>
                    </Form.Group>
                    {accessLevel === 'restricted' && (
                        <>
                            <Form.Group>
                                <Form.Label>Share member</Form.Label>
                                <Form.Select onChange={(e) => addFileMember(selectedFile.id, e.target.value)}>
                                    <option value="">Select a user</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <div>
                                <h5>People with access</h5>
                                <ul className="list-group">
                                    {fileMembers.map(member => (
                                        <li key={member.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            {member.name}
                                            <Button variant="danger" size="sm" onClick={() => removeFileMember(selectedFile.id, member.id)}>
                                                Remove
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSaveAccess}>Save</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FileManagement;
