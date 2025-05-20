import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';
import '../RiskAndIssueManagement.css'; // Update the path to reflect the new location of the CSS file

const RiskAndIssueManagement = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [risks, setRisks] = useState([]);
    const [issues, setIssues] = useState([]);
    const [showRiskModal, setShowRiskModal] = useState(false);
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [showEditRiskModal, setShowEditRiskModal] = useState(false);
    const [showEditIssueModal, setShowEditIssueModal] = useState(false);
    const [showViewRiskModal, setShowViewRiskModal] = useState(false);
    const [showViewIssueModal, setShowViewIssueModal] = useState(false);
    const [riskForm, setRiskForm] = useState({
        title: '', description: '', probability: 'Low', impact: 'Low', mitigation_plan: '', status: 'Identified'
    });
    const [issueForm, setIssueForm] = useState({
        title: '', description: '', severity: 'Minor', assigned_user_id: '', status: 'Open', resolution_notes: ''
    });
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || ''); // Initialize userRole state

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/risks`, { headers })
            .then(response => setRisks(response.data))
            .catch(error => console.error('Error fetching risks:', error));

        axios.get(`http://127.0.0.1:8000/api/projects/${projectId}/issues`, { headers })
            .then(response => setIssues(response.data))
            .catch(error => console.error('Error fetching issues:', error));

        axios.get(`http://127.0.0.1:8000/api/users`, { headers })
            .then(response => setUsers(response.data))
            .catch(error => setUsers([]));

        // Fetch user role
        axios.get(`http://127.0.0.1:8000/api/user`, { headers }) // Corrected endpoint
            .then(response => setUserRole(response.data.role))
            .catch(error => console.error('Error fetching user role:', error));
    }, [projectId]);

    useEffect(() => {
        if (showMessage) {
            const timer = setTimeout(() => {
                setShowMessage(false);
                setMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showMessage]);

    const handleRiskChange = e => setRiskForm({ ...riskForm, [e.target.name]: e.target.value });
    const handleIssueChange = e => setIssueForm({ ...issueForm, [e.target.name]: e.target.value });

    const handleAddRisk = () => setShowRiskModal(true);
    const handleAddIssue = () => setShowIssueModal(true);
    const handleCloseRisk = () => setShowRiskModal(false);
    const handleCloseIssue = () => setShowIssueModal(false);
    const handleCloseEditRisk = () => {
        setShowEditRiskModal(false);
        setSelectedRisk(null);
    };
    const handleCloseEditIssue = () => {
        setShowEditIssueModal(false);
        setSelectedIssue(null);
    };

    const submitRisk = e => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.post(`http://127.0.0.1:8000/api/projects/${projectId}/risks`, riskForm, { headers })
            .then(res => {
                setRisks([...risks, res.data]);
                setShowRiskModal(false);
                setRiskForm({ title: '', description: '', probability: 'Low', impact: 'Low', mitigation_plan: '', status: 'Identified' });
                setMessage('Risk added successfully!');
                setShowMessage(true);
            })
            .catch(err => alert('Error adding risk'));
    };
    const submitIssue = e => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.post(`http://127.0.0.1:8000/api/projects/${projectId}/issues`, issueForm, { headers })
            .then(res => {
                setIssues([...issues, res.data]);
                setShowIssueModal(false);
                setIssueForm({ title: '', description: '', severity: 'Minor', assigned_user_id: '', status: 'Open', resolution_notes: '' });
                setMessage('Issue added successfully!');
                setShowMessage(true);
            })
            .catch(err => alert('Error adding issue'));
    };

    const handleEditRisk = (risk) => {
        setSelectedRisk(risk);
        setShowEditRiskModal(true);
    };

    const handleViewRisk = (risk) => {
        setSelectedRisk(risk);
        setShowViewRiskModal(true);
    };

    const handleEditIssue = (issue) => {
        setSelectedIssue(issue);
        setShowEditIssueModal(true);
    };

    const handleViewIssue = (issue) => {
        setSelectedIssue(issue);
        setShowViewIssueModal(true);
    };

    const submitEditRisk = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Only send the required fields
        const riskData = {
            title: selectedRisk.title,
            description: selectedRisk.description,
            probability: selectedRisk.probability,
            impact: selectedRisk.impact,
            mitigation_plan: selectedRisk.mitigation_plan || '',
            status: selectedRisk.status
        };

        axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/risks/${selectedRisk.id}`, riskData, { headers })
            .then(res => {
                setRisks(risks.map(risk => risk.id === res.data.id ? res.data : risk));
                setShowEditRiskModal(false);
                setSelectedRisk(null);
                setMessage('Risk updated successfully!');
                setShowMessage(true);
            })
            .catch(err => {
                console.error('Error updating risk:', err.response?.data || err);
                alert(err.response?.data?.message || 'Error updating risk');
            });
    };

    const submitEditIssue = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Only send the required fields
        const issueData = {
            title: selectedIssue.title,
            description: selectedIssue.description,
            severity: selectedIssue.severity,
            assigned_user_id: selectedIssue.assigned_user_id,
            status: selectedIssue.status,
            resolution_notes: selectedIssue.resolution_notes || ''
        };

        axios.put(`http://127.0.0.1:8000/api/projects/${projectId}/issues/${selectedIssue.id}`, issueData, { headers })
            .then(res => {
                setIssues(issues.map(issue => issue.id === res.data.id ? res.data : issue));
                setShowEditIssueModal(false);
                setSelectedIssue(null);
                setMessage('Issue updated successfully!');
                setShowMessage(true);
            })
            .catch(err => {
                console.error('Error updating issue:', err.response?.data || err);
                alert(err.response?.data?.message || 'Error updating issue');
            });
    };

    const deleteRisk = (riskId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.delete(`http://127.0.0.1:8000/api/projects/${projectId}/risks/${riskId}`, { headers })
            .then(() => {
                setRisks(risks.filter(risk => risk.id !== riskId));
                setMessage('Risk deleted successfully!');
                setShowMessage(true);
            })
            .catch(err => alert('Error deleting risk'));
    };

    const deleteIssue = (issueId) => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        axios.delete(`http://127.0.0.1:8000/api/projects/${projectId}/issues/${issueId}`, { headers })
            .then(() => {
                setIssues(issues.filter(issue => issue.id !== issueId));
                setMessage('Issue deleted successfully!');
                setShowMessage(true);
            })
            .catch(err => alert('Error deleting issue'));
    };

    return (
        <div className="risk-issue-management">
            
            <Button variant="secondary" className="back-button" onClick={() => navigate(-1)}>Back</Button>
            <div className="header1">
                <h1>Risk and Issue Management</h1>
            </div>

            <div className="box">
                <section className="risks-section">
                    <div className="section-header">
                        <h2>Risks</h2>
                        <Button variant="primary" onClick={handleAddRisk}>Add Risk</Button>
                    </div>
                    <ul className="list">
                        {risks.map(risk => (
                            <li key={risk.id} className="list-item">
                                <div className="item-content">
                                    <span className="item-title">{risk.title}</span>
                                    <span className={`item-status ${risk.status.toLowerCase().replace(/\s+/g, '-')}`}>{risk.status}</span>
                                </div>                                <div className="item-actions">
                                    <Button variant="info" className="action-button" onClick={() => handleViewRisk(risk)}>View</Button>
                                    <Button variant="warning" className="action-button" onClick={() => handleEditRisk(risk)}>Edit</Button>
                                    {userRole === 'Project Manager' && (
                                        <Button variant="danger" className="action-button" onClick={() => deleteRisk(risk.id)}>Delete</Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="box">
                <section className="issues-section">
                    <div className="section-header">
                        <h2>Issues</h2>
                        <Button variant="primary" onClick={handleAddIssue}>Add Issue</Button>
                    </div>
                    <ul className="list">
                        {issues.map(issue => (
                            <li key={issue.id} className="list-item">
                                <div className="item-content">
                                    <span className="item-title">{issue.title}</span>
                                    <span className={`item-status ${issue.status.toLowerCase().replace(/\s+/g, '-')}`}>{issue.status}</span>
                                    <span className="item-assigned"><b>Assigned to: </b>{users.find(user => user.id === issue.assigned_user_id)?.name || 'Unassigned'}</span>
                                </div>                                <div className="item-actions">
                                    <Button variant="info" className="action-button" onClick={() => handleViewIssue(issue)}>View</Button>
                                    <Button variant="warning" className="action-button" onClick={() => handleEditIssue(issue)}>Edit</Button>
                                    {userRole === 'Project Manager' && (
                                        <Button variant="danger" className="action-button" onClick={() => deleteIssue(issue.id)}>Delete</Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            {/* Risk Modal */}
            <Modal show={showRiskModal} onHide={handleCloseRisk}>
                <Modal.Header closeButton><Modal.Title>Add Risk</Modal.Title></Modal.Header>
                <Form onSubmit={submitRisk}>
                    <Modal.Body>
                        <Form.Group className="mb-2">
                            <Form.Label>Title</Form.Label>
                            <Form.Control name="title" value={riskForm.title} onChange={handleRiskChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" name="description" value={riskForm.description} onChange={handleRiskChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Probability</Form.Label>
                            <Form.Select name="probability" value={riskForm.probability} onChange={handleRiskChange}>
                                <option>Low</option><option>Medium</option><option>High</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Impact</Form.Label>
                            <Form.Select name="impact" value={riskForm.impact} onChange={handleRiskChange}>
                                <option>Low</option><option>Medium</option><option>High</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Mitigation Plan</Form.Label>
                            <Form.Control as="textarea" name="mitigation_plan" value={riskForm.mitigation_plan} onChange={handleRiskChange} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Status</Form.Label>
                            <Form.Select name="status" value={riskForm.status} onChange={handleRiskChange}>
                                <option>Identified</option><option>Resolved</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseRisk}>Cancel</Button>
                        <Button type="submit" variant="primary">Add</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            {/* Issue Modal */}
            <Modal show={showIssueModal} onHide={handleCloseIssue}>
                <Modal.Header closeButton><Modal.Title>Add Issue</Modal.Title></Modal.Header>
                <Form onSubmit={submitIssue}>
                    <Modal.Body>
                        <Form.Group className="mb-2">
                            <Form.Label>Title</Form.Label>
                            <Form.Control name="title" value={issueForm.title} onChange={handleIssueChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" name="description" value={issueForm.description} onChange={handleIssueChange} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Severity</Form.Label>
                            <Form.Select name="severity" value={issueForm.severity} onChange={handleIssueChange}>
                                <option>Minor</option><option>Major</option><option>Critical</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Assigned User</Form.Label>
                            <Form.Select name="assigned_user_id" value={issueForm.assigned_user_id} onChange={handleIssueChange} required>
                                <option value="">Select User</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Status</Form.Label>
                            <Form.Select name="status" value={issueForm.status} onChange={handleIssueChange}>
                                <option>Open</option><option>In Progress</option><option>Resolved</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Resolution Notes</Form.Label>
                            <Form.Control as="textarea" name="resolution_notes" value={issueForm.resolution_notes} onChange={handleIssueChange} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseIssue}>Cancel</Button>
                        <Button type="submit" variant="primary">Add</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Risk Modal */}
            <Modal show={showEditRiskModal} onHide={handleCloseEditRisk}>
                <Modal.Header closeButton>
                    <Modal.Title className="modal-title">Edit Risk</Modal.Title>
                </Modal.Header>
                <Form onSubmit={submitEditRisk}>
                    <Modal.Body>
                        <Form.Group className="mb-2">
                            <Form.Label>Title</Form.Label>
                            <Form.Control name="title" value={selectedRisk?.title || ''} onChange={(e) => setSelectedRisk({ ...selectedRisk, title: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" name="description" value={selectedRisk?.description || ''} onChange={(e) => setSelectedRisk({ ...selectedRisk, description: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Probability</Form.Label>
                            <Form.Select name="probability" value={selectedRisk?.probability || 'Low'} onChange={(e) => setSelectedRisk({ ...selectedRisk, probability: e.target.value })}>
                                <option>Low</option><option>Medium</option><option>High</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Impact</Form.Label>
                            <Form.Select name="impact" value={selectedRisk?.impact || 'Low'} onChange={(e) => setSelectedRisk({ ...selectedRisk, impact: e.target.value })}>
                                <option>Low</option><option>Medium</option><option>High</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Mitigation Plan</Form.Label>
                            <Form.Control as="textarea" name="mitigation_plan" value={selectedRisk?.mitigation_plan || ''} onChange={(e) => setSelectedRisk({ ...selectedRisk, mitigation_plan: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Status</Form.Label>
                            <Form.Select name="status" value={selectedRisk?.status || 'Identified'} onChange={(e) => setSelectedRisk({ ...selectedRisk, status: e.target.value })}>
                                <option>Identified</option><option>Resolved</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseEditRisk}>Cancel</Button>
                        <Button type="submit" variant="primary">Save</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* View Risk Modal */}
            <Modal show={showViewRiskModal} onHide={() => setShowViewRiskModal(false)}>
                <Modal.Header closeButton><Modal.Title>View Risk</Modal.Title></Modal.Header>
                <Modal.Body>
                    <p><strong>Title:</strong> {selectedRisk?.title}</p>
                    <p><strong>Description:</strong> {selectedRisk?.description}</p>
                    <p><strong>Probability:</strong> {selectedRisk?.probability}</p>
                    <p><strong>Impact:</strong> {selectedRisk?.impact}</p>
                    <p><strong>Mitigation Plan:</strong> {selectedRisk?.mitigation_plan}</p>
                    <p><strong>Status:</strong> {selectedRisk?.status}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowViewRiskModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Issue Modal */}
            <Modal show={showEditIssueModal} onHide={handleCloseEditIssue}>
                <Modal.Header closeButton>
                    <Modal.Title className="modal-title">Edit Issue</Modal.Title>
                </Modal.Header>
                <Form onSubmit={submitEditIssue}>
                    <Modal.Body>
                        <Form.Group className="mb-2">
                            <Form.Label>Title</Form.Label>
                            <Form.Control name="title" value={selectedIssue?.title || ''} onChange={(e) => setSelectedIssue({ ...selectedIssue, title: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" name="description" value={selectedIssue?.description || ''} onChange={(e) => setSelectedIssue({ ...selectedIssue, description: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Severity</Form.Label>
                            <Form.Select name="severity" value={selectedIssue?.severity || 'Minor'} onChange={(e) => setSelectedIssue({ ...selectedIssue, severity: e.target.value })}>
                                <option>Minor</option><option>Major</option><option>Critical</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Assigned User</Form.Label>
                            <Form.Select name="assigned_user_id" value={selectedIssue?.assigned_user_id || ''} onChange={(e) => setSelectedIssue({ ...selectedIssue, assigned_user_id: e.target.value })} required>
                                <option value="">Select User</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Status</Form.Label>
                            <Form.Select name="status" value={selectedIssue?.status || 'Open'} onChange={(e) => setSelectedIssue({ ...selectedIssue, status: e.target.value })}>
                                <option>Open</option><option>In Progress</option><option>Resolved</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Resolution Notes</Form.Label>
                            <Form.Control as="textarea" name="resolution_notes" value={selectedIssue?.resolution_notes || ''} onChange={(e) => setSelectedIssue({ ...selectedIssue, resolution_notes: e.target.value })} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseEditIssue}>Cancel</Button>
                        <Button type="submit" variant="primary">Save</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* View Issue Modal */}
            <Modal show={showViewIssueModal} onHide={() => setShowViewIssueModal(false)}>
                <Modal.Header closeButton><Modal.Title>View Issue</Modal.Title></Modal.Header>
                <Modal.Body>
                    <p><strong>Title:</strong> {selectedIssue?.title}</p>
                    <p><strong>Description:</strong> {selectedIssue?.description}</p>
                    <p><strong>Severity:</strong> {selectedIssue?.severity}</p>
                    <p><strong>Assigned User:</strong> {selectedIssue?.assigned_user_id}</p>
                    <p><strong>Status:</strong> {selectedIssue?.status}</p>
                    <p><strong>Resolution Notes:</strong> {selectedIssue?.resolution_notes}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowViewIssueModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>

            {showMessage && (                <div className="success-toast-message">
                    {message}
                </div>
            )}
        </div>
    );
};

export default RiskAndIssueManagement;
