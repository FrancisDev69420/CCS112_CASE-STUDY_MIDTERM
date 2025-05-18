import React from 'react';
import ActivityFeed from './ActivityFeed';
import '../ActivityFeed.css';
import { Button } from 'react-bootstrap';
import logo from "../assets/klick logo.png";

function ActivityFeedPage() {    return (
        <div className="activity-feed-layout">
           
            <div className="activity-feed-page">
                <div className="activity-feed-container">
                    
                    <h2>Activity Feed</h2>

                    <div>

                        <img src={logo} alt="Logo" className="mb-3" style={{ width: "auto", height: "100px" }} />

                        <Button variant='secondary' className='back-button' onClick={() => window.history.back()}>
                            Back
                        </Button>

                    </div>
                    
                    
                    <div className="activity-feed-wrapper">
                        <ActivityFeed />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivityFeedPage;