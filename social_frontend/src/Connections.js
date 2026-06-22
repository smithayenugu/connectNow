import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaComments } from 'react-icons/fa';
import './App.css';

function Connections() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConnections = async () => {
    if (!userId) {
      setConnections([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [receivedRes, sentRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/received/${userId}`),
        axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/sent/${userId}`)
      ]);

      const acceptedReceived = receivedRes.data
        .filter(r => r.status === 'accepted' && r.fromUserId)
        .map(r => r.fromUserId);

      const acceptedSent = sentRes.data
        .filter(r => r.status === 'accepted' && r.toUserId)
        .map(r => r.toUserId);

      const connectionIds = [...new Set([...acceptedReceived, ...acceptedSent].filter(Boolean))];

      if (connectionIds.length === 0) {
        setConnections([]);
        return;
      }

      const users = await Promise.all(
        connectionIds.map(id =>
          axios
            .get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/user/${id}`)
            .then(res => res.data.user)
            .catch(() => null)
        )
      );

      const formatted = users
        .filter(Boolean)
        .map(u => ({
          userId: u.userId,
          name: u.name || 'Unknown',
          profilePicture: u.profilePicture || '',
        }));

      setConnections(formatted);
    } catch (e) {
      console.error('Error loading connections:', e);
      setError('Failed to load connections.');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleChat = (friend) => {
    navigate('/chat', {
      state: {
        friendId: friend.userId,
        friendName: friend.name,
        friendProfilePicture: friend.profilePicture,
      },
    });
  };

  if (!userId) return <div className="empty-state">Login to view connections</div>;
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="empty-state">{error}</div>;

  return (
    <div className="connections-page">
      <div className="connections-card">
        <div className="connections-header">
          <h2>Connections</h2>
          <div className="connections-count">{connections.length}</div>
        </div>

        {connections.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 10px' }}>
            No connections yet.
          </div>
        ) : (
          <div className="connections-list">
            {connections.map(conn => (
              <div key={conn.userId} className="connection-item" style={{ cursor: 'default' }}>
                <Link
                  to={`/profile/${conn.userId}`}
                  className="connection-info"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="connection-avatar" aria-hidden="true">
                    {conn.profilePicture ? (
                      <img
                        src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${conn.profilePicture}`}
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
                      style={{ display: conn.profilePicture ? 'none' : 'flex' }}
                    >
                      {conn.name ? conn.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </span>

                  <span className="connection-text">
                    <span className="connection-name">{conn.name}</span>
                    <span className="connection-user-id">ID: {conn.userId}</span>
                  </span>
                </Link>

                <div className="connection-actions">
                  <button
                    className="connection-chat-btn"
                    onClick={() => handleChat(conn)}
                    title="Chat"
                    aria-label={`Chat with ${conn.name}`}
                  >
                    <FaComments />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Connections;

