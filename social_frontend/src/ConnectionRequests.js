import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './App.css';

function ConnectionRequests() {
  const userId = localStorage.getItem('userId');
  const [requests, setRequests] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/received/${userId}`)
      .then(async res => {
        const pending = res.data.filter(r => r.status === 'pending');
        setRequests(pending);
        // Fetch user details for all senders
        const ids = pending.map(r => r.fromUserId);
        if (ids.length > 0) {
          const userDetails = await Promise.all(ids.map(id => axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/user/${id}`).then(u => u.data.user).catch(() => null)));
          const map = {};
          userDetails.forEach(u => { if (u) map[u.userId] = u; });
          setUserMap(map);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load requests');
        setLoading(false);
      });
  }, [userId]);

  const handleAction = (id, action) => {
    axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/${id}/${action}`)
      .then(res => {
        setRequests(prev => prev.filter(r => r._id !== id));
      })
      .catch(() => {
        alert('Failed to update request');
      });
  };

  if (!userId) return <div className="empty-state">Login to view requests</div>;
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="empty-state">{error}</div>;

  return (
    <div className="connections-page">
      <div className="connections-card">
        <div className="connections-header">
          <h2>Connection Requests</h2>
          <div className="connections-count">{requests.length}</div>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 10px' }}>
            No pending requests.
          </div>
        ) : (
          <div className="connections-list">
            {requests.map(r => {
              const sender = userMap[r.fromUserId];
              return (
                <div key={r._id} className="connection-item" style={{ cursor: 'default' }}>
                  <Link
                    to={`/profile/${r.fromUserId}`}
                    className="connection-info"
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="connection-avatar" aria-hidden="true">
                      {sender && sender.profilePicture ? (
                        <img
                          src={`${sender.profilePicture}`}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                            if (event.currentTarget.nextElementSibling) {
                              event.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <span
                        className="connection-avatar-fallback"
                        style={{ display: sender && sender.profilePicture ? 'none' : 'flex' }}
                      >
                        {sender && sender.name ? sender.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </span>

                    <span className="connection-text">
                      <span className="connection-name">
                        {sender ? sender.name : r.fromUserId}
                      </span>
                      <span className="connection-user-id">ID: {r.fromUserId}</span>
                    </span>
                  </Link>

                  <div className="connection-actions" style={{ gap: '8px' }}>
                    <button
                      className="btn-primary"
                      style={{ padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.85rem', background: '#28a745', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => handleAction(r._id, 'accept')}
                    >
                      Accept
                    </button>
                    <button
                      className="btn-error"
                      style={{ padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.85rem', background: '#dc3545', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => handleAction(r._id, 'reject')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ConnectionRequests;