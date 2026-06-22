import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaBookmark, FaComment, FaHeart, FaRegHeart, FaPaperPlane } from 'react-icons/fa';
import './App.css';

function SavedPosts() {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [expandedComments, setExpandedComments] = useState({});
	const [selectedPost, setSelectedPost] = useState(null);
	const [likedPosts, setLikedPosts] = useState({});
	const [commentInputs, setCommentInputs] = useState({});

	const userId = localStorage.getItem('userId');

	useEffect(() => {
		if (!userId) {
			setLoading(false);
			setError('Please login to view saved posts');
			return;
		}

		axios
			.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/saved/${userId}`)
			.then((response) => {
				setPosts(response.data);
				setLoading(false);
				// Set likedPosts state
				const likedMap = {};
				response.data.forEach(post => {
					if (post.likedBy && Array.isArray(post.likedBy)) {
						likedMap[post._id] = post.likedBy.includes(userId);
					}
				});
				setLikedPosts(likedMap);
			})
			.catch((error) => {
				console.error("Error fetching saved posts:", error);
				setError('Failed to load saved posts');
				setLoading(false);
			});
	}, [userId]);

	const handleLike = (postId) => {
		const liked = likedPosts[postId];
		const url = liked
			? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/unlike/${postId}`
			: `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/like/${postId}`;
		axios
			.post(url, { userId })
			.then((response) => {
				const updatedPosts = posts.map((post) =>
					post._id === postId ? response.data : post
				);
				setPosts(updatedPosts);
				setLikedPosts(prev => ({ ...prev, [postId]: !liked }));
			})
			.catch((error) => console.error("Error updating like status:", error));
	};

	const handleAddComment = (postId) => {
		const commentText = commentInputs[postId] || "";
		if (!commentText.trim()) return;

		axios
			.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/posts/comment/${postId}`, {
				text: commentText,
				userId,
			})
			.then((response) => {
				const updatedPosts = posts.map((post) =>
					String(post._id) === String(postId)
						? { ...response.data, username: post.username }
						: post
				);
				setPosts(updatedPosts);
				setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
			})
			.catch((error) => {
				console.error("Error adding comment:", error);
				alert("Could not add comment. Please try again.");
			});
	};

	const toggleComments = (postId) => {
		setExpandedComments(prev => ({
			...prev,
			[postId]: !prev[postId]
		}));
	};

	if (loading) {
		return (
			<div className="loading">
				<div className="spinner"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="empty-state">
				<h3>Error</h3>
				<p>{error}</p>
			</div>
		);
	}

	if (posts.length === 0) {
		return (
			<div className="empty-state">
				<h3>No saved posts</h3>
				<p>Save posts to view them here later!</p>
			</div>
		);
	}

	return (
		<div className="home posts-page">
			<h3 className="posts-heading">Saved Posts</h3>
			<div className="posts-grid">
				{posts.map((post) => {
					const comments = post.comments || [];
					return (
						<div key={post._id} className={`post ${expandedComments[post._id] ? 'post-comments-open' : ''}`} onClick={() => setSelectedPost(post)} style={{ cursor: 'pointer' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
								{post.userId ? (
									<Link
										to={`/profile/${post.userId}`}
										onClick={e => e.stopPropagation()}
										style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', cursor: 'pointer' }}
									>
										{post.userProfilePicture ? (
                      <div style={{ position: 'relative', width: '34px', height: '34px', flexShrink: 0 }}>
											<img
												src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${post.userProfilePicture}`}
												alt="User"
												className="post-avatar"
												onError={(e) => {
													e.target.style.display = 'none';
													if (e.target.nextElementSibling) {
														e.target.nextElementSibling.style.display = 'flex';
													}
												}}
											/>
                      <span className="post-avatar-fallback" style={{ display: 'none' }}>
                        {(post.username && post.username.length > 0)
                          ? post.username.charAt(0).toUpperCase()
                          : 'U'}
                      </span>
                      </div>
										) : (
											<span className="post-avatar-fallback">
												{(post.username && post.username.length > 0)
													? post.username.charAt(0).toUpperCase()
													: 'U'}
											</span>
										)}
										<span style={{ color:'#4e54c8', fontWeight:'bold' }}>{post.username || 'Unknown'}</span>
									</Link>
								) : (
									<span style={{ display: 'flex', alignItems: 'center', gap: '12px', color:'#4e54c8', fontWeight:'bold' }}>
										{post.userProfilePicture ? (
                      <div style={{ position: 'relative', width: '34px', height: '34px', flexShrink: 0 }}>
											<img
												src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${post.userProfilePicture}`}
												alt="User"
												className="post-avatar"
												onError={(e) => {
													e.target.style.display = 'none';
													if (e.target.nextElementSibling) {
														e.target.nextElementSibling.style.display = 'flex';
													}
												}}
											/>
                      <span className="post-avatar-fallback" style={{ display: 'none' }}>
                        {(post.username && post.username.length > 0)
                          ? post.username.charAt(0).toUpperCase()
                          : 'U'}
                      </span>
                      </div>
										) : (
											<span className="post-avatar-fallback">
												{(post.username && post.username.length > 0)
													? post.username.charAt(0).toUpperCase()
													: 'U'}
											</span>
										)}
										{post.username || 'Unknown'}
									</span>
								)}
							</div>
							<h3>{post.title}</h3>
							<p>{post.content}</p>
							
							<div style={{ minHeight: '130px', margin: '6px 0' }}>
								{post.file && (
									<>
										{post.file.includes(".mp4") ? (
											<video width="280" height="130" controls style={{ maxHeight: '130px', borderRadius: '10px' }}>
												<source
													src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${post.file}`}
													type="video/mp4"
												/>
												Your browser does not support the video tag.
											</video>
										) : (
											<img
												src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${post.file}`}
												alt="Post Media"
												style={{ maxHeight: '130px', maxWidth: '100%', borderRadius: '10px', objectFit: 'cover' }}
											/>
										)}
									</>
								)}
							</div>

							<div className="post-actions">
								<div className="post-stats">
									<button 
										onClick={e => { e.stopPropagation(); handleLike(post._id); }}
										className="like-toggle-button"
										style={{ color: likedPosts[post._id] ? 'red' : '#666', marginBottom : '0' }}
									>
										{likedPosts[post._id] ? <FaHeart /> : <FaRegHeart />} {post.likes}
									</button>
									<button 
										onClick={e => { e.stopPropagation(); toggleComments(post._id); }}
										className="post-action-button comment-toggle-button"
										style={{ marginBottom : '0' }}
									>
										<FaComment /> {comments.length}
									</button>
								</div>
							</div>

							{expandedComments[post._id] && (
								<div className="comments-section" onClick={e => e.stopPropagation()}>
									<h4>Comments</h4>
									{comments.length > 0 ? (
										<ul className="comments-list">
											{comments.map((comment, index) => {
												const isOwnComment = comment.userId === userId;
												const canDeleteComment = isOwnComment || post.userId === userId;
												return (
													<li key={comment._id || index} className="comment-item">
														{comment.userProfilePicture || comment.profilePicture ? (
                              <div style={{ position: 'relative', width: '28px', height: '28px', display: 'inline-flex', flexShrink: 0 }}>
															<img
																src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${comment.userProfilePicture || comment.profilePicture}`}
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
											value={commentInputs[post._id] || ""}
											onChange={e => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
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
					);
				})}
			</div>

			{selectedPost && (
				<div className="post-modal-overlay" onClick={() => setSelectedPost(null)}>
					<div className="post-modal" onClick={e => e.stopPropagation()}>
						<button className="post-modal-close" onClick={() => setSelectedPost(null)}>&times;</button>
						<h2>{selectedPost.title}</h2>
						<p>{selectedPost.content}</p>
						{selectedPost.file && (
							<div style={{ textAlign: 'center', margin: '20px 0' }}>
								{selectedPost.file.includes(".mp4") ? (
									<video width="90%" height="auto" controls>
										<source
											src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${selectedPost.file}`}
											type="video/mp4"
										/>
										Your browser does not support the video tag.
									</video>
								) : (
									<img
										src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${selectedPost.file}`}
										alt="Post Media"
										style={{ maxWidth: '90%', maxHeight: '60vh', borderRadius: '16px' }}
									/>
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default SavedPosts;