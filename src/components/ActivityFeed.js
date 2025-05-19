import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../ActivityFeed.css'; 


function ActivityFeed({ projectId, taskId }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            const token = localStorage.getItem('token');
            let url = 'http://127.0.0.1:8000/api/activities';
            
            if (projectId) {
                url = `http://127.0.0.1:8000/api/projects/${projectId}/activities`;
            } else if (taskId) {
                url = `http://127.0.0.1:8000/api/tasks/${taskId}/activities`;
            }

            try {
                const response = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setActivities(response.data.data);
            } catch (error) {
                console.error('Error fetching activities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
        
        // Set up polling for real-time updates
        const interval = setInterval(fetchActivities, 30000); // Poll every 30 seconds
        
        return () => clearInterval(interval);
    }, [projectId, taskId]);

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div className="activity-feed-loading">Loading activities...</div>;
    }

    return (
        <div className="activity-feed">
            {activities.length === 0 ? (
                <p className="no-activities">No activities to display</p>
            ) : 
            
            (
                <ul className="activity-list">
                    {activities.map(activity => (
                        <li key={activity.id} className={`activity-item ${activity.activity_type}`}>
                            <div className="activity-header">
                                <span className="activity-user">{activity.user?.name}</span>
                                <span className="activity-timestamp">{formatTimestamp(activity.created_at)}</span>
                            </div>
                            <div className="activity-description">{activity.description}</div>
                            {activity.new_values && (
                                <div className="activity-details">
                                    <small>
                                        {Object.entries(activity.new_values).map(([key, value]) => (
                                            <div key={key} className="activity-change">
                                                <span className="change-key">{key}:</span>
                                                <span className="change-value">{value}</span>
                                            </div>
                                        ))}
                                    </small>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ActivityFeed;
