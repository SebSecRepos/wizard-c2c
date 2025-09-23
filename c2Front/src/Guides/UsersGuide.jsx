import React from 'react';
import './GuidesStyle.css';
import one from './Images/Admin/1.png'



export const UsersGuide = () => {
    return (
        <div className='guide-container'>
            <h1>Users guide</h1>

            <div className="guide-text-block">
                <h3>Create and modify users</h3>
                <p>You can create and modify users in c2c server using Admin panel. C2 Server has two roles, admin and hacker</p>
            </div>
            <div className="guide-text-block">
                <img src={one} alt="attacks" srcset="" />
                <p>Admin privileges allow:</p>
                <ul>
                    <li>Create and modify users</li>
                    <li>Create buckets and upload files</li>
                    <li>Add operation commands</li>
                </ul>
            </div>

        </div>
    );
};
