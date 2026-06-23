import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaPaperPlane, FaComments, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import './App.css';

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myRequest, setMyRequest] = useState(null);
  const [theirRequest, setTheirRequest] = useState(null);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [connections, setConnections] = useState([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [connectionsLoaded, setConnectionsLoaded] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [connectionsError, setConnectionsError] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingUsers, setPendingUsers] = useState({});
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [likedPosts, setLikedPosts] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [loggedInUserId, setLoggedInUserId] = useState(localStorage.getItem('userId'));
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedPostTitle, setEditedPostTitle] = useState('');
  const [editedPostContent, setEditedPostContent] = useState('');
  const [postPictureFile, setPostPictureFile] = useState(null);

  const loadConnectionInfo = async () => {
    if (!loggedInUserId || !userId || loggedInUserId === userId) return;
    try {
      const [sentRes, receivedRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/sent/${loggedInUserId}`),
        axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/received/${loggedInUserId}`)
      ]);
      const sentReq = sentRes.data.find(r => r.toUserId === userId) || null;
      const receivedReq = receivedRes.data.find(r => r.fromUserId === userId) || null;
      setMyRequest(sentReq);
      setTheirRequest(receivedReq);
    } catch (error) {
      console.error('Error loading connection info:', error);
    }
  };

  const loadConnectionCounts = async () => {
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
      const uniqueConnections = [...new Set([...acceptedReceived, ...acceptedSent].filter(Boolean))];
      setConnectionsCount(uniqueConnections.length);
    } catch (error) {
      setConnectionsCount(0);
    }
  };

  useEffect(() => {
    const checkLogin = () => {
      const id = localStorage.getItem('userId');
      setLoggedInUserId(id);
      if (!id) {
        navigate('/');
      }
    };
    window.addEventListener('storage', checkLogin);
    checkLogin();

    setLoading(true);
    setError('');
    axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/user/${userId}`)
      .then(res => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setError('User not found.');
        setLoading(false);
      });

    loadConnectionInfo();
    loadConnectionCounts();
    loadPendingRequests();

    return () => {
      window.removeEventListener('storage', checkLogin);
    };
  }, [userId, navigate, loggedInUserId]);

  const loadConnections = async () => {
    if (!userId) return;
    setConnectionsLoading(true);
    setConnectionsError('');
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
        setConnectionsLoaded(true);
        setConnectionsLoading(false);
        return;
      }

      const users = await Promise.all(
        connectionIds.map(id =>
          axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/user/${id}`)
            .then(res => res.data.user)
            .catch(() => null)
        )
      );

      const formattedConnections = users
        .filter(Boolean)
        .map(userRecord => ({
          userId: userRecord.userId,
          name: userRecord.name || 'Unknown',
          email: userRecord.email || '',
          profilePicture: userRecord.profilePicture || ''
        }));

      setConnections(formattedConnections);
      setConnectionsLoaded(true);
    } catch (error) {
      console.error('Error loading connections:', error);
      setConnections([]);
      setConnectionsError('Failed to load connections.');
    } finally {
      setConnectionsLoading(false);
    }
  };

  const toggleConnections = async () => {
    if (!showConnections) {
      await loadConnections();
      await loadConnectionCounts();
    }
    setShowConnections(prev => !prev);
  };

  const loadPendingRequests = async () => {
    if (!loggedInUserId || !userId || loggedInUserId !== userId) return;
    setPendingLoading(true);
    setPendingError('');
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/received/${userId}`);
      const pending = res.data.filter(r => r.status === 'pending');
      setPendingRequests(pending);

      const userIds = [...new Set(pending.map(r => r.fromUserId))];
      const users = await Promise.all(
        userIds.map(id =>
          axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/user/${id}`)
            .then(res => res.data.user)
            .catch(() => null)
        )
      );
      const userMap = {};
      users.filter(Boolean).forEach(userRecord => {
        userMap[userRecord.userId] = userRecord;
      });
      setPendingUsers(userMap);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setPendingRequests([]);
      setPendingError('Failed to load pending requests.');
    } finally {
      setPendingLoading(false);
    }
  };

  const handleAcceptPending = async (requestId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/${requestId}/accept`);
      await loadPendingRequests();
      await refreshConnectionCounts();
      if (showConnections) {
        await loadConnections();
      }
    } catch (error) {
      console.error('Error accepting pending request:', error);
      alert('Failed to accept request');
    }
  };

  const handleRejectPending = async (requestId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/${requestId}/reject`);
      await loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting pending request:', error);
      alert('Failed to reject request');
    }
  };

  useEffect(() => {
    // fetch posts for this user
    setPostsLoading(true);
    axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/user/${userId}`)
      .then(res => {
        const postData = res.data || [];
        setPosts(postData);
        const likedMap = {};
        postData.forEach(post => {
          if (post.likedBy && Array.isArray(post.likedBy)) {
            likedMap[post._id] = post.likedBy.includes(loggedInUserId);
          }
        });
        setLikedPosts(likedMap);
      })
      .catch(() => {
        setPosts([]);
        setLikedPosts({});
      })
      .finally(() => setPostsLoading(false));
  }, [userId, loggedInUserId]);

  useEffect(() => {
    const hasOpenComments = Object.values(expandedComments).some(Boolean);
    if (!hasOpenComments) return;

    const handleClickOutsideComments = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.comments-section') || target.closest('.comment-toggle-button')) return;

      setExpandedComments({});
      setEditingComment(null);
      setEditingCommentText('');
    };

    document.addEventListener('mousedown', handleClickOutsideComments);
    return () => document.removeEventListener('mousedown', handleClickOutsideComments);
  }, [expandedComments]);

  if (!loggedInUserId) return null;
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="empty-state">{error}</div>;
  if (!user) return <div className="empty-state">User not found.</div>;

  const refreshConnectionState = async () => {
    if (!loggedInUserId || !userId || loggedInUserId === userId) return;
    try {
      const [sentRes, receivedRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/sent/${loggedInUserId}`),
        axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/received/${loggedInUserId}`)
      ]);
      const sentReq = sentRes.data.find(r => r.toUserId === userId) || null;
      const receivedReq = receivedRes.data.find(r => r.fromUserId === userId) || null;
      setMyRequest(sentReq);
      setTheirRequest(receivedReq);
    } catch (error) {
      console.error('Error refreshing connection state:', error.response?.data || error.message);
    }
  };

  const refreshConnectionCounts = async () => {
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
      const uniqueConnections = [...new Set([...acceptedReceived, ...acceptedSent].filter(Boolean))];
      setConnectionsCount(uniqueConnections.length);
    } catch (error) {
      setConnectionsCount(0);
    }
  };

  const handleSendRequest = async () => {
    setMyRequest({ status: 'sending' });
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request`, {
        fromUserId: loggedInUserId,
        toUserId: userId
      });
      setMyRequest({ _id: response.data._id, status: 'pending' });
    } catch (err) {
      if (err.response && err.response.status === 409) {
        const msg = err.response.data && err.response.data.error;
        if (msg && msg.toLowerCase().includes('already following')) {
          setMyRequest(prev => ({ ...prev, status: 'accepted' }));
        } else if (msg && msg.toLowerCase().includes('pending from other user')) {
          await refreshConnectionState();
        } else {
          setMyRequest({ status: 'pending' });
        }
      } else {
        setMyRequest({ status: 'error' });
      }
    }
  };

  const handleMessage = () => {
    navigate('/chat', { state: { friendId: userId, friendName: user.name } });
  };

  const handleAcceptRequest = async () => {
    if (!theirRequest?._id) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/${theirRequest._id}/accept`);
      await refreshConnectionState();
      await refreshConnectionCounts();
    } catch (error) {
      console.error('Error accepting request:', error.response?.data || error.message);
      alert('Failed to accept request');
    }
  };

  const handleRejectRequest = async () => {
    if (!theirRequest?._id) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/${theirRequest._id}/reject`);
      await refreshConnectionState();
    } catch (error) {
      console.error('Error rejecting request:', error.response?.data || error.message);
      alert('Failed to reject request');
    }
  };

  const handleRemoveConnection = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/${userId}/remove`, {
        userId: loggedInUserId
      });
      await refreshConnectionState();
      await refreshConnectionCounts();
    } catch (error) {
      console.error('Error removing connection:', error.response?.data || error.message);
      alert('Failed to remove connection: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancelRequest = async () => {
    if (!myRequest?._id) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/connection-request/${myRequest._id}/cancel`, {
        userId: loggedInUserId
      });
      setMyRequest(null);
      await refreshConnectionCounts();
    } catch (error) {
      console.error('Error canceling request:', error.response?.data || error.message);
      alert('Failed to cancel request: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleLike = async (postId) => {
    const liked = likedPosts[postId];
    const url = liked
      ? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/unlike/${postId}`
      : `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/like/${postId}`;

    try {
      const response = await axios.post(url, { userId: loggedInUserId });
      const updatedPost = response.data;
      setPosts(prevPosts => prevPosts.map(post => post._id === postId ? updatedPost : post));
      setLikedPosts(prev => ({ ...prev, [postId]: !liked }));
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs(prev => ({ ...prev, [postId]: value }));
  };

  const handleAddComment = async (postId) => {
    const commentText = commentInputs[postId] || '';
    if (!commentText.trim()) return;

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/comment/${postId}`, {
        text: commentText.trim(),
        userId: loggedInUserId,
      });
      const updatedPost = response.data;
      setPosts(prevPosts => prevPosts.map(post => post._id === postId ? updatedPost : post));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setExpandedComments(prev => ({ ...prev, [postId]: true }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const startEditingComment = (postId, comment) => {
    setEditingComment({ postId, commentId: comment._id });
    setEditingCommentText(comment.text || '');
  };

  const cancelEditingComment = () => {
    setEditingComment(null);
    setEditingCommentText('');
  };

  const handleEditComment = async (postId, commentId) => {
    if (!editingCommentText.trim()) return;

    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/comment/${postId}/${commentId}`, {
        text: editingCommentText.trim(),
        userId: loggedInUserId,
      });
      const updatedPost = response.data;
      setPosts(prevPosts => prevPosts.map(post => post._id === postId ? updatedPost : post));
      cancelEditingComment();
    } catch (error) {
      console.error('Error editing comment:', error);
      alert('Could not edit comment. Please try again.');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/comment/${postId}/${commentId}`, {
        data: { userId: loggedInUserId },
      });
      const updatedPost = response.data;
      setPosts(prevPosts => prevPosts.map(post => post._id === postId ? updatedPost : post));
      if (editingComment?.commentId === commentId) {
        cancelEditingComment();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Could not delete comment. Please try again.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await axios.delete(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/${postId}`, {
        data: { userId: loggedInUserId }
      });
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      alert(res?.data?.success ? 'Post deleted successfully!' : 'Post deletion requested');
    } catch (error) {
      console.error('Error deleting post:', error.response?.data || error.message || error);
      alert('Failed to delete post: ' + (error.response?.data?.error || error.message));
    }
  };


  const handleUpdatePost = async (postId) => {
    try {
      // Update text fields
      const response = await axios.put(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/${postId}`, {
        title: editedPostTitle,
        content: editedPostContent
      });
      setPosts(prevPosts => prevPosts.map(post => post._id === postId ? response.data : post));
      
      // Upload new picture if selected
      if (postPictureFile) {
        const formData = new FormData();
        formData.append('postPicture', postPictureFile);
        await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/${postId}/picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        // Reload posts to get updated picture
        const updatedPosts = await axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/user/${userId}`);
        setPosts(updatedPosts.data);
      }
      
      setEditingPostId(null);
      alert('Post updated successfully!');
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  const startEditingPost = (post) => {
    setEditingPostId(post._id);
    setEditedPostTitle(post.title);
    setEditedPostContent(post.content);
    setPostPictureFile(null);
  };

  const handlePostPictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostPictureFile(file);
    }
  };

  const startEditingProfile = () => {
    setEditedName(user.name || '');
    setEditedEmail(user.email || '');
    setEditedPhone(user.phone || '');
    setProfilePictureFile(null);
    setIsEditingProfile(true);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Update text fields
      const response = await axios.put(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/user/${userId}`, {
        name: editedName,
        email: editedEmail,
        phone: editedPhone
      });
      setUser(response.data);
      
      // Upload profile picture if selected
      if (profilePictureFile) {
        const formData = new FormData();
        formData.append('profilePicture', profilePictureFile);
        await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/user/${userId}/profile-picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        // Reload user data to get updated profile picture
        const updatedUser = await axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/user/${userId}`);
        setUser(updatedUser.data.user);
      }
      
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-card-header">
          {user.profilePicture ? (
            <div className="profile-avatar profile-avatar-large">
              <img
                src={`${user.profilePicture}`}
                alt="Profile"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.classList.add('avatar-img-failed');
                }}
              />
              <span className="profile-avatar-fallback" style={{ display: 'none' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          ) : (
            <div className="profile-avatar profile-avatar-large" style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          {/* Right side: name on top, stats below, then edit button */}
          <div className="profile-card-info">
            {/* Name + username */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, textAlign: 'center', width: '100%' }}>{user.name}</h2>
              <span style={{ fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.2, textAlign: 'center', width: '100%' }}>userId : {userId}</span>
            </div>
            {/* Stats row: posts + connections below the name */}
            <div className="profile-card-stats">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{posts.length || 0}</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>Posts</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={toggleConnections}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>{connectionsCount}</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>Connections</span>
              </div>
            </div>
          </div>
        </div>
        {/* Edit Profile button */}
        {loggedInUserId === userId && (
          <div className="profile-action-row profile-edit-row">
            <button
              className="profile-edit-button"
              onClick={startEditingProfile}
            >
              Edit Profile
            </button>
          </div>
        )}
        {/* Add more fields as needed */}

        {/* Connections Sidebar */}
        {showConnections && (
          <>
            <div className="connections-overlay" onClick={() => setShowConnections(false)}></div>
            <div className="connections-sidebar open">
              <div className="connections-sidebar-header">
                <h3>Connections</h3>
                <button className="connections-sidebar-close" onClick={() => setShowConnections(false)}>&times;</button>
              </div>
              <div className="connections-sidebar-content">
                {connectionsLoading ? (
                  <div className="loading"><div className="spinner"></div></div>
                ) : connectionsError ? (
                  <div className="empty-state">{connectionsError}</div>
                ) : connections.length === 0 ? (
                  <div className="empty-state">No connections yet.</div>
                ) : (
                  connections.map(conn => (
                    <div key={conn.userId} className="connection-item">
                      <Link 
                        to={`/profile/${conn.userId}`} 
                        className="connection-info" 
                        style={{ textDecoration: 'none' }}
                        onClick={() => setShowConnections(false)}
                      >
                        <span className="connection-avatar" aria-hidden="true">
                          {conn.profilePicture ? (
                            <img
                              src={`${conn.profilePicture}`}
                              alt=""
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                                event.currentTarget.nextElementSibling.style.display = 'flex';
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
                          onClick={() => {
                            setShowConnections(false);
                            navigate('/chat', {
                              state: {
                                friendId: conn.userId,
                                friendName: conn.name,
                                friendProfilePicture: conn.profilePicture
                              }
                            });
                          }}
                          title="Chat"
                        >
                          <FaComments />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
        {/* {loggedInUserId === userId && (
          <div style={{ marginTop: '1rem', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', color: '#3f4f8b' }}>Pending Requests</h3>
            {pendingLoading ? (
              <div className="loading"><div className="spinner"></div></div>
            ) : pendingError ? (
              <div className="empty-state">{pendingError}</div>
            ) : pendingRequests.length === 0 ? (
              <div className="empty-state">No pending requests.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {pendingRequests.map(request => {
                  const sender = pendingUsers[request.fromUserId] || { name: request.fromUserId };
                  return (
                    <li key={request._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid #e2e6f0' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{sender.name}</div>
                        <div style={{ color: '#666', fontSize: '0.95rem' }}>{sender.email || request.fromUserId}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-primary" style={{ padding: '0.55rem 1rem', borderRadius: '6px' }} onClick={() => handleAcceptPending(request._id)}>Accept</button>
                        <button className="btn-error" style={{ padding: '0.55rem 1rem', borderRadius: '6px' }} onClick={() => handleRejectPending(request._id)}>Reject</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )} */}
        {loggedInUserId && userId && loggedInUserId !== userId && (
          <div className="profile-action-row">
            {(() => {
          const myAccepted = myRequest?.status === 'accepted';
          const theirAccepted = theirRequest?.status === 'accepted';
          const myPending = myRequest?.status === 'pending';
          const theirPending = theirRequest?.status === 'pending';
          const isMutual = myAccepted && theirAccepted;
          const isConnected = myAccepted || theirAccepted;
          const isSending = myRequest?.status === 'sending';
          const isError = myRequest?.status === 'error';

          if (isConnected) {
            return (
              <div className="profile-action-buttons">
                <button className="btn-primary" onClick={handleMessage} style={{ flex: 1, padding: '0.6rem 1.2rem', borderRadius: '4px', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Message</button>
                <button className="btn-error" onClick={handleRemoveConnection} style={{ flex: 1, padding: '0.6rem 1.2rem', borderRadius: '4px', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: '#dc3545' }}>Unfollow</button>
              </div>
            );
          }

          if (theirPending) {
            return (
              <div className="profile-action-buttons">
                <button className="btn-primary" onClick={handleAcceptRequest} style={{ padding: '0.6rem 1.2rem', borderRadius: '4px', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Accept Request</button>
                <button className="btn-error" onClick={handleRejectRequest} style={{ padding: '0.6rem 1.2rem', borderRadius: '4px', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: '#dc3545' }}>Reject Request</button>
              </div>
            );
          }

          if (myPending) {
            return (
              <div className="profile-action-buttons">
                <button className="btn-disabled" disabled style={{ flex: 1 }}>Requested</button>
                <button
                  className="btn-error"
                  onClick={handleCancelRequest}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '4px', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', background: '#dc3545' }}
                >
                  Cancel Request
                </button>
              </div>
            );
          }

          if (isSending) {
            return <button className="btn-disabled" disabled>Sending...</button>;
          }

          if (isError) {
            return <button className="btn-error" disabled>Error. Try again</button>;
          }

          return <button className="btn-primary" onClick={handleSendRequest}>Follow</button>;
        })()}
          </div>
        )}
      </div>
      {/* User's posts */}
      <div className="profile-posts">
        {postsLoading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : posts.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '0.5rem' }}>
            <p>No posts yet.</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <div key={post._id} className={`post ${expandedComments[post._id] ? 'post-comments-open' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedPost(post)} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)'; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{color:'#4e54c8', fontWeight:'bold', marginBottom:'6px', fontSize: '1.0rem'}}>
                      {post.userId ? (
                        <Link to={`/profile/${post.userId}`} style={{ color:'#4e54c8', textDecoration: 'none' }}>
                          {user.name || 'Unknown'}
                        </Link>
                      ) : (
                        <span>{user.name || 'Unknown'}</span>
                      )}
                    </p>
                  </div>

                  {loggedInUserId === post.userId && (
                    <div />
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  {loggedInUserId === post.userId && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-25px',
                        right: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 2
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="post-owner-icon-btn post-owner-icon-btn-edit"
                        onClick={e => { e.stopPropagation(); startEditingPost(post); }}
                        title="Edit"
                        aria-label="Edit post"
                        >
                          <FaEdit style={{ fontSize: '0.85em' }} />
                        </button>
                      <button
                        type="button"
                        className="post-owner-icon-btn post-owner-icon-btn-delete"
                        onClick={e => { e.stopPropagation(); handleDeletePost(post._id); }}
                        title="Delete"
                        aria-label="Delete post"
                      >
                          <FaTrash style={{ fontSize: '0.85em' }} />
                      </button>
                    </div>
                  )}

                  <h3 style={{ color: 'var(--text)' }}>{post.title}</h3>
                  <p>{post.content}</p>
                </div>


                <div style={{ height: '200px', margin: '10px 0', overflow: 'hidden', borderRadius: '10px' }}>

                  {post.file && (
                    <>
                      {post.file.includes('.mp4') ? (
                        <video width="100%" height="100%" controls style={{ objectFit: 'cover' }}>
                          <source src={`${post.file}`} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img
                          src={`${post.file}`}
                          alt="Post Media"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </>
                  )}
                </div>

                <div style={{ flex: 1 }}></div>

                <div className="post-actions" style={{ marginTop: '0.7rem' }}>
                  <div className="post-stats">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleLike(post._id); }}
                      className="post-action-button post-like-button"
                      data-active={likedPosts[post._id] ? 'true' : 'false'}
                      style={{ marginBottom: 0 }}
                    >
                      {likedPosts[post._id] ? <FaHeart /> : <FaRegHeart />} 
                      <span style={{ fontWeight: 800 }}>{post.likes || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); toggleComments(post._id); }}
                      className="post-action-button comment-toggle-button"
                      style={{ marginBottom: 0 }}
                    >
                      <FaComment />
                      <span style={{ fontWeight: 800 }}>{(post.comments && post.comments.length) || 0}</span>
                    </button>

                  </div>
                </div>
                {expandedComments[post._id] && (
                  <div className="comments-section" onClick={e => e.stopPropagation()}>
                    <h4>Comments</h4>
                    {post.comments && post.comments.length > 0 ? (
                      <ul className="comments-list">
                        {post.comments.map((comment, idx) => {
                          const isOwnComment = comment.userId === loggedInUserId;
                          const canDeleteComment = isOwnComment || post.userId === loggedInUserId;
                          const isEditingThisComment = editingComment?.postId === post._id && editingComment?.commentId === comment._id;
                          return (
                          <li key={comment._id || idx} className="comment-item">
                            {comment.userProfilePicture || comment.profilePicture ? (
                              <div style={{ position: 'relative', width: '28px', height: '28px', display: 'inline-flex', flexShrink: 0 }}>
                              <img
                                src={`${comment.userProfilePicture || comment.profilePicture}`}
                                alt={comment.username || 'User'}
                                className="comment-avatar"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextElementSibling) {
                                    e.target.nextElementSibling.style.display = 'inline-flex';
                                  }
                                }}
                              />
                              <span className="comment-avatar comment-avatar-fallback" style={{ display: 'none' }}>
                                {comment.username ? comment.username.charAt(0).toUpperCase() : 'U'}
                              </span>
                              </div>
                            ) : (
                              <span className="comment-avatar comment-avatar-fallback">
                                {comment.username ? comment.username.charAt(0).toUpperCase() : 'U'}
                              </span>
                            )}
                            {isEditingThisComment ? (
                              <div className="comment-edit-form">
                                <input
                                  type="text"
                                  className="comment-edit-input"
                                  value={editingCommentText}
                                  onChange={e => setEditingCommentText(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleEditComment(post._id, comment._id);
                                    }
                                    if (e.key === 'Escape') {
                                      cancelEditingComment();
                                    }
                                  }}
                                  autoFocus
                                />
                                <button type="button" className="comment-icon-button" onClick={() => handleEditComment(post._id, comment._id)} title="Save comment">
                                  <FaCheck />
                                </button>
                                <button type="button" className="comment-icon-button" onClick={cancelEditingComment} title="Cancel edit">
                                  <FaTimes />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="comment-text">{comment.text}</span>
                                {(isOwnComment || canDeleteComment) && (
                                  <div className="comment-actions">
                                    {isOwnComment && (
                                      <button type="button" className="comment-icon-button" onClick={() => startEditingComment(post._id, comment)} title="Edit comment">
                                        <FaEdit />
                                      </button>
                                    )}
                                    {canDeleteComment && (
                                      <button type="button" className="comment-icon-button comment-icon-button-danger" onClick={() => handleDeleteComment(post._id, comment._id)} title="Delete comment">
                                        <FaTrash />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p style={{ color: '#999', fontStyle: 'italic' }}>No comments yet</p>
                    )}
                    <div className="comment-form">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        className="comment-input"
                        value={commentInputs[post._id] || ''}
                        onChange={e => handleCommentChange(post._id, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddComment(post._id);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); handleAddComment(post._id); }}
                        className="comment-button"
                      >
                        <FaPaperPlane />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modal for enlarged post */}
      {selectedPost && (
        <div className="post-modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="post-modal" onClick={e => e.stopPropagation()}>
            <button className="post-modal-close" onClick={() => setSelectedPost(null)}>&times;</button>
            <h2>{selectedPost.title}</h2>
            <p>{selectedPost.content}</p>
            {selectedPost.file && (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                {selectedPost.file.includes('.mp4') ? (
                  <video width="90%" height="auto" controls>
                    <source src={`${selectedPost.file}`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={`${selectedPost.file}`}
                    alt="Post Media"
                    style={{ maxWidth: '90%', maxHeight: '60vh', borderRadius: '16px' }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Edit Post Modal */}
      {editingPostId && (
        <div className="edit-post-modal-overlay" onClick={() => setEditingPostId(null)}>
          <div className="edit-post-modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Post</h2>
            <input
              type="text"
              value={editedPostTitle}
              onChange={e => setEditedPostTitle(e.target.value)}
              placeholder="Post Title"
            />
            <textarea
              value={editedPostContent}
              onChange={e => setEditedPostContent(e.target.value)}
              placeholder="Post Content"
            />
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                Change Post Picture (optional)
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handlePostPictureChange}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '2px solid var(--border)' }}
              />
            </div>
            <div className="edit-post-modal-actions">
              <button className="btn-save" onClick={() => handleUpdatePost(editingPostId)}>Save</button>
              <button className="btn-cancel" onClick={() => setEditingPostId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="edit-post-modal-overlay" onClick={() => setIsEditingProfile(false)}>
          <div className="edit-post-modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Profile</h2>
            <input
              type="text"
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              placeholder="Name"
            />
            <input
              type="email"
              value={editedEmail}
              onChange={e => setEditedEmail(e.target.value)}
              placeholder="Email"
            />
            <input
              type="tel"
              value={editedPhone}
              onChange={e => setEditedPhone(e.target.value)}
              placeholder="Phone"
            />
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontWeight: '600', fontSize: '0.9rem' }}>
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '2px solid var(--border)' }}
              />
            </div>
            <div className="edit-post-modal-actions">
              <button className="btn-save" onClick={handleUpdateProfile}>Save</button>
              <button className="btn-cancel" onClick={() => setIsEditingProfile(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
