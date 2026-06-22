import React, { useEffect, useState } from 'react';
import axios from 'axios';

function MyPost({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError('');
    axios.get(`http://localhost:5000/api/posts/user/${userId}`)
      .then(res => {
        setPosts(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not fetch your posts.');
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="empty-state">{error}</div>;
  if (!posts.length) return <div className="empty-state">No posts yet.</div>;

  return (
    <div className="home posts-page">
      <h2>My Posts</h2>
      <div className="posts-grid">
        {posts.map(post => (
          <div className="post" key={post._id}>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            {post.file && (
              post.file.includes('.mp4') ? (
                <video width="100%" controls style={{ maxWidth: '100%', borderRadius: '10px', marginTop: '10px' }}>
                  <source src={`http://localhost:5000/uploads/${post.file}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={`http://localhost:5000/uploads/${post.file}`}
                  alt={post.title}
                  style={{ maxWidth: '100%', borderRadius: '10px', marginTop: '10px' }}
                />
              )
            )}
            <div style={{ marginTop: '10px', fontWeight: 'bold', color: '#e74c3c' }}>
              Likes: {post.likes || 0}
            </div>
            <div style={{ marginTop: '10px' }}>
              <h4>Comments:</h4>
              {post.comments && post.comments.length > 0 ? (
                <ul className="comments-list">
                  {post.comments.map((comment, idx) => (
                    <li key={idx} className="comment-item">
                      {comment.userProfilePicture || comment.profilePicture ? (
                        <div style={{ position: 'relative', width: '28px', height: '28px', display: 'inline-flex', flexShrink: 0 }}>
                        <img
                          src={`http://localhost:5000/uploads/${comment.userProfilePicture || comment.profilePicture}`}
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
                      <span className="comment-text">{comment.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No comments yet</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyPost;
