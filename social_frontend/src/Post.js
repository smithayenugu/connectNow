import React, { useState, useEffect, useRef } from "react";
// import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaComment, FaPaperPlane, FaComments, FaEdit, FaTrash, FaCheck, FaTimes, FaShare, FaBookmark, FaRegBookmark, FaUserFriends } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from "axios";

function Post({ isSidebarOpen }) {
	const [commentInputs, setCommentInputs] = useState({});
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [expandedComments, setExpandedComments] = useState({});
	const [editingComment, setEditingComment] = useState(null);
	const [editingCommentText, setEditingCommentText] = useState("");
	const [selectedPost, setSelectedPost] = useState(null);
	const [connStatusMap, setConnStatusMap] = useState({}); // { userId: status }

  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [likedPosts, setLikedPosts] = useState({}); // { postId: true/false }
  const [savedPosts, setSavedPosts] = useState({}); // { postId: true/false }
  const searchContainerRef = useRef(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareConnections, setShareConnections] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");

  // Clear search results when input is cleared
  useEffect(() => {
	if (searchInput.trim() === "") {
	  setSearchResults([]);
	  setSearchError("");
	}
  }, [searchInput]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchResults([]);
        setSearchError("");
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

	const userId = localStorage.getItem('userId');
	const handleSearch = async (e) => {
		e.preventDefault();
		if (!searchInput.trim()) return;
		setSearchLoading(true);
		setSearchError("");
		setSearchResults([]);
		try {
			const res = await axios.get(`http://localhost:5000/search-users?username=${encodeURIComponent(searchInput)}`);
			setSearchResults(res.data.users || []);
		} catch (err) {
			setSearchError("No users found or error searching.");
		} finally {
			setSearchLoading(false);
		}
	};

  useEffect(() => {
	axios
	  .get(`http://localhost:5000/api/posts/others/${userId}`)
	  .then((response) => {
		// Backend returns userProfilePicture for other users + others' posts.
		setPosts(response.data);
		setLoading(false);
		// For each unique user, check connection request status in both directions
		const uniqueUserIds = [...new Set(response.data.map(p => p.userId))];
		uniqueUserIds.forEach(otherUserId => {
		  if (otherUserId && otherUserId !== userId) {
			Promise.all([
			  axios.get(`http://localhost:5000/api/connection-request/sent/${userId}`),
			  axios.get(`http://localhost:5000/api/connection-request/received/${userId}`)
			]).then(([sentRes, receivedRes]) => {
			  const sentReq = sentRes.data.find(r => r.toUserId === otherUserId);
			  const receivedReq = receivedRes.data.find(r => r.fromUserId === otherUserId);
			  if ((sentReq && sentReq.status === 'accepted') || (receivedReq && receivedReq.status === 'accepted')) {
				setConnStatusMap(prev => ({ ...prev, [otherUserId]: 'accepted' }));
			  } else if (sentReq && sentReq.status === 'pending') {
				// I sent a request - can cancel
				setConnStatusMap(prev => ({ ...prev, [otherUserId]: 'pending_sent', [`${otherUserId}_requestId`]: sentReq._id }));
			  } else if (receivedReq && receivedReq.status === 'pending') {
				// They sent me a request - can accept/reject
				setConnStatusMap(prev => ({ ...prev, [otherUserId]: 'pending_received', [`${otherUserId}_requestId`]: receivedReq._id }));
			  } else {
				setConnStatusMap(prev => ({ ...prev, [otherUserId]: '' }));
			  }
			}).catch(() => {});
		  }
		});
		// Set likedPosts state for each post
		const likedMap = {};
		response.data.forEach(post => {
		  if (post.likedBy && Array.isArray(post.likedBy)) {
			likedMap[post._id] = post.likedBy.includes(userId);
		  }
		});
		setLikedPosts(likedMap);
		// Set savedPosts state for each post
		const savedMap = {};
		response.data.forEach(post => {
		  if (post.savedBy && Array.isArray(post.savedBy)) {
			savedMap[post._id] = post.savedBy.includes(userId);
		  }
		});
		setSavedPosts(savedMap);
	  })
	  .catch((error) => {
		console.error("Error fetching posts:", error);
		setLoading(false);
	  });
  }, [userId]);

  const handleSendRequest = async (toUserId) => {
	setConnStatusMap(prev => ({ ...prev, [toUserId]: 'sending' }));
	try {
		const response = await axios.post('http://localhost:5000/api/connection-request', {
			fromUserId: userId,
			toUserId
		});
		setConnStatusMap(prev => ({ ...prev, [toUserId]: 'pending_sent', [`${toUserId}_requestId`]: response.data._id }));
	} catch (err) {
		if (err.response && err.response.status === 409) {
			const msg = err.response.data && err.response.data.error;
			if (msg && msg.toLowerCase().includes('already friends')) {
				setConnStatusMap(prev => ({ ...prev, [toUserId]: 'accepted' }));
			} else {
				setConnStatusMap(prev => ({ ...prev, [toUserId]: 'pending_sent' }));
			}
		} else {
			setConnStatusMap(prev => ({ ...prev, [toUserId]: 'error' }));
		}
	}
};

const handleCancelRequest = async (toUserId) => {
  try {
    // First fetch the sent request to get its ID
    const sentRes = await axios.get(`http://localhost:5000/api/connection-request/sent/${userId}`);
    const sentReq = sentRes.data.find(r => r.toUserId === toUserId && r.status === 'pending');
    if (!sentReq) {
      setConnStatusMap(prev => ({ ...prev, [toUserId]: '' }));
      return;
    }
    await axios.post(`http://localhost:5000/api/connection-request/${sentReq._id}/cancel`, {
      userId
    });
    setConnStatusMap(prev => ({ ...prev, [toUserId]: '' }));
  } catch (error) {
    console.error('Error canceling request:', error.response?.data || error.message);
    alert('Failed to cancel request');
  }
};

  const handleLike = (postId) => {
  const liked = likedPosts[postId];
  const url = liked
	? `http://localhost:5000/api/posts/unlike/${postId}`
	: `http://localhost:5000/api/posts/like/${postId}`;
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

const handleSave = (postId) => {
  const saved = savedPosts[postId];
  const url = saved
	? `http://localhost:5000/api/posts/unsave/${postId}`
	: `http://localhost:5000/api/posts/save/${postId}`;
  axios
	.post(url, { userId })
	.then((response) => {
	  setSavedPosts(prev => ({ ...prev, [postId]: !saved }));
	  // Update the posts list to reflect the change
	  setPosts(prevPosts => prevPosts.map(post =>
		post._id === postId ? { ...post, savedBy: response.data.savedBy } : post
	  ));
	})
	.catch((error) => console.error("Error updating save status:", error));
};

const openShareModal = async (post) => {
  setSelectedPost(post);
  setShowShareModal(true);
  setShareLoading(true);
  setShareError("");
  try {
    const [receivedRes, sentRes] = await Promise.all([
      axios.get(`http://localhost:5000/api/connection-request/received/${userId}`),
      axios.get(`http://localhost:5000/api/connection-request/sent/${userId}`)
    ]);
    const acceptedReceived = receivedRes.data.filter(r => r.status === 'accepted' && r.fromUserId).map(r => r.fromUserId);
    const acceptedSent = sentRes.data.filter(r => r.status === 'accepted' && r.toUserId).map(r => r.toUserId);
    const connectionIds = [...new Set([...acceptedReceived, ...acceptedSent].filter(Boolean))];
    if (connectionIds.length === 0) {
      setShareConnections([]);
    } else {
      const users = await Promise.all(
        connectionIds.map(id =>
          axios.get(`http://localhost:5000/user/${id}`).then(res => res.data.user).catch(() => null)
        )
      );
      setShareConnections(users.filter(Boolean).map(u => ({ userId: u.userId, name: u.name || 'Unknown', profilePicture: u.profilePicture || '' })));
    }
  } catch (err) {
    setShareError("Failed to load connections.");
  } finally {
    setShareLoading(false);
  }
};

const shareToConnection = async (friend, post) => {
  try {
    await axios.post('http://localhost:5000/api/chat', {
      from: userId,
      to: friend.userId,
      text: `Check out this post: ${post.title}`,
      replyPost: {
        postId: post._id,
        title: post.title,
        content: post.content,
        file: post.file,
        authorName: post.username || 'Friend'
      }
    });
    alert(`Post shared with ${friend.name}!`);
    setShowShareModal(false);
  } catch (err) {
    alert('Failed to share post. Please try again.');
  }
};

	const handleAddComment = (postId) => {
		const commentText = commentInputs[postId] || "";
		if (!commentText.trim()) return;

		axios
			.post(`http://localhost:5000/api/posts/comment/${postId}`, {
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

	const startEditingComment = (postId, comment) => {
		setEditingComment({ postId, commentId: comment._id });
		setEditingCommentText(comment.text || "");
	};

	const cancelEditingComment = () => {
		setEditingComment(null);
		setEditingCommentText("");
	};

	const handleEditComment = (postId, commentId) => {
		if (!editingCommentText.trim()) return;

		axios
			.put(`http://localhost:5000/api/posts/comment/${postId}/${commentId}`, {
				text: editingCommentText.trim(),
				userId,
			})
			.then((response) => {
				const updatedPosts = posts.map((post) =>
					String(post._id) === String(postId)
						? { ...response.data, username: post.username }
						: post
				);
				setPosts(updatedPosts);
				cancelEditingComment();
			})
			.catch((error) => {
				console.error("Error editing comment:", error);
				alert("Could not edit comment. Please try again.");
			});
	};

	const handleDeleteComment = (postId, commentId) => {
		if (!window.confirm("Delete this comment?")) return;

		axios
			.delete(`http://localhost:5000/api/posts/comment/${postId}/${commentId}`, {
				data: { userId },
			})
			.then((response) => {
				const updatedPosts = posts.map((post) =>
					String(post._id) === String(postId)
						? { ...response.data, username: post.username }
						: post
				);
				setPosts(updatedPosts);
				if (editingComment?.commentId === commentId) {
					cancelEditingComment();
				}
			})
			.catch((error) => {
				console.error("Error deleting comment:", error);
				alert("Could not delete comment. Please try again.");
			});
	};

	useEffect(() => {
		const hasOpenComments = Object.values(expandedComments).some(Boolean);
		if (!hasOpenComments) return;

		const handleClickOutsideComments = (event) => {
			const target = event.target;
			if (!(target instanceof Element)) return;
			if (target.closest('.comments-section') || target.closest('.comment-toggle-button')) return;

			setExpandedComments({});
			setEditingComment(null);
			setEditingCommentText("");
		};

		document.addEventListener('mousedown', handleClickOutsideComments);
		return () => document.removeEventListener('mousedown', handleClickOutsideComments);
	}, [expandedComments]);

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

	if (posts.length === 0) {
		return (
			<div className="empty-state">
				<h3>No posts yet</h3>
				<p>Be the first to share something amazing!</p>
			</div>
		);
	}

  return (
	<div className="home posts-page">
		<div className="posts-toolbar">
			<h1 className="connect-heading" style={{ display: 'flex', alignItems: 'center', gap: '5px'}}>
				<FaUserFriends style={{ color: '#4e54c8', fontSize: '1.1em' }} />
				Connect<span>Now</span>
			</h1>
			<div className={`user-search-wrapper ${isSidebarOpen ? 'user-search-wrapper--sidebar-open' : ''}`} ref={searchContainerRef}>

				<form
					className="user-search-bar"
					onSubmit={handleSearch}
					autoComplete="off"
					style={{ marginBottom: 0 }}
				>
					<input
						type="text"
						placeholder="Search users..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="user-search-input"
						aria-label="Search users"
					/>
				</form>

				{/* Search results dropdown */}
				{searchLoading && <div className="user-search-loading">Searching...</div>}
				{searchError && <div className="user-search-error">{searchError}</div>}
				{searchResults.length > 0 && (
					<div className="user-search-dropdown">
						{searchResults.map((user) => (
							<Link
								key={user._id || user.userId}
								to={`/profile/${user.userId}`}
								className="user-search-dropdown-item"
								onClick={() => { setSearchResults([]); setSearchInput(''); }}
							>
								<span className="user-search-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
								<span className="user-search-name">{user.name}</span>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
		<h3 className="posts-heading">Posts</h3>

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
							src={`http://localhost:5000/uploads/${post.userProfilePicture}`}
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
											src={`http://localhost:5000/uploads/${post.userProfilePicture}`}
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
						<h3 style={{ color: 'var(--text)' }}>{post.title}</h3>
						<p>{post.content}</p>
						
						<div style={{ minHeight: '200px', margin: '6px 0' }}>
							{post.file && (
								<>
									{post.file.includes(".mp4") ? (
										<video width="280" height="200" controls style={{ maxHeight: '200px', borderRadius: '10px' }}>
											<source
												src={`http://localhost:5000/uploads/${post.file}`}
												type="video/mp4"
											/>
											Your browser does not support the video tag.
										</video>
									) : (
										<img
											src={`http://localhost:5000/uploads/${post.file}`}
											alt="Post Media"
											style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '10px', objectFit: 'cover' }}
										/>
									)}
								</>
							)}
						</div>

						{post.userId && post.userId !== userId && (
						  <div style={{ margin: '0.25rem 0', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							{connStatusMap[post.userId] === 'accepted' ? (
							  <>
								<span className="btn-primary" style={{ background: '#28a745', cursor: 'default', padding: '0.4rem 0.6rem', borderRadius: '4px', color: '#fff', fontWeight: 'bold', fontSize: '0.85rem', textAlign: 'center' }}>You are Friends</span>
								<Link
								  to="/chat"
								  state={{
								    friendId: post.userId,
								    friendName: post.username || 'Friend',
								    replyPost: {
								      postId: post._id,
								      title: post.title,
								      content: post.content,
								      file: post.file,
								      authorName: post.username || 'Friend'
								    }
								  }}
								  onClick={e => e.stopPropagation()}
								>
								  <FaComments title="Chat" style={{ color: '#007bff', fontSize: '1.4em', cursor: 'pointer' }} />
								</Link>
							  </>
							) : connStatusMap[post.userId] === 'pending_sent' ? (
							  <button className="btn-disabled" disabled style={{ padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.85rem', flex: 1 }}>Request Sent</button>
							) : connStatusMap[post.userId] === 'pending_received' ? (
							  <button className="btn-disabled" disabled style={{ padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.85rem', flex: 1 }}>Pending Approval</button>
							) : connStatusMap[post.userId] === 'sending' ? (
							  <button className="btn-disabled" disabled style={{ padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.85rem', flex: 1 }}>Sending...</button>
							) : connStatusMap[post.userId] === 'error' ? (
							  <button className="btn-error" disabled style={{ padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.85rem', flex: 1 }}>Error. Try again</button>
							) : (
							  <button className="btn-primary" onClick={e => { e.stopPropagation(); handleSendRequest(post.userId); }} style={{ padding: '0.4rem 1rem', borderRadius: '4px', fontSize: '0.85rem', flex: 1 }}>Send Connection Request</button>
							)}
						  </div>
						)}

					<div className="post-actions">
						<div className="post-stats">
						<button 
						  onClick={e => { e.stopPropagation(); handleLike(post._id); }}
						  className="post-action-button post-like-button"
						  data-active={likedPosts[post._id] ? 'true' : 'false'}
						  style={{ marginBottom : '0',fontWeight: 800}}
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
					<button
						onClick={e => { e.stopPropagation(); openShareModal(post); }}
						className="post-action-button post-share-button"
						style={{ marginBottom : '0' }}
						title="Share post"
					>
						<FaShare />
					</button>
					<button
						onClick={e => { e.stopPropagation(); handleSave(post._id); }}
						className="post-action-button post-save-button"
						data-active={savedPosts[post._id] ? 'true' : 'false'}
						style={{ marginBottom : '0', marginLeft: 'auto' }}
						title={savedPosts[post._id] ? 'Unsave post' : 'Save post'}
					>
						{savedPosts[post._id] ? <FaBookmark /> : <FaRegBookmark />}
					</button>
								</div>

						{expandedComments[post._id] && (
							<div className="comments-section" onClick={e => e.stopPropagation()}>
								<h4>Comments</h4>
								{comments.length > 0 ? (
									<ul className="comments-list">
										{comments.map((comment, index) => {
											const isOwnComment = comment.userId === userId;
											const canDeleteComment = isOwnComment || post.userId === userId;
											const isEditingThisComment = editingComment?.postId === post._id && editingComment?.commentId === comment._id;
											return (
											<li key={comment._id || index} className="comment-item">
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
			{/* Modal for enlarged post */}
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
											src={`http://localhost:5000/uploads/${selectedPost.file}`}
											type="video/mp4"
										/>
										Your browser does not support the video tag.
									</video>
								) : (
									<img
										src={`http://localhost:5000/uploads/${selectedPost.file}`}
										alt="Post Media"
										style={{ maxWidth: '90%', maxHeight: '60vh', borderRadius: '16px' }}
									/>
								)}
							</div>
						)}
						{/* Optionally show comments, likes, etc. here */}
					</div>
				</div>
			)}

			{/* Share modal */}
			{showShareModal && selectedPost && (
				<div className="post-modal-overlay" onClick={() => setShowShareModal(false)}>
					<div className="post-modal" onClick={e => e.stopPropagation()}>
						<button className="post-modal-close" onClick={() => setShowShareModal(false)}>&times;</button>
						<h2>Share Post</h2>
						<div style={{ marginBottom: '12px' }}>
							<button
								type="button"
								className="btn-primary"
								onClick={async () => {
									const url = window.location.origin + '/post/' + selectedPost._id;
									try {
										if (navigator.share) {
											await navigator.share({ title: selectedPost.title, text: selectedPost.content, url });
										} else {
											await navigator.clipboard.writeText(url);
											alert('Link copied to clipboard!');
										}
									} catch (err) {
										console.error('Error sharing externally:', err);
									}
								}}
							>
								Share Externally
							</button>
						</div>
						<h3 style={{ margin: '8px 0' }}>Share to Connection</h3>
						{shareLoading ? (
							<div className="loading"><div className="spinner"></div></div>
						) : shareError ? (
							<div className="empty-state" style={{ color: '#555' }}><p>{shareError}</p></div>
						) : shareConnections.length === 0 ? (
							<div className="empty-state" style={{ color: '#555' }}><p>No connections to share with.</p></div>
						) : (
							<div className="connections-list">
								{shareConnections.map(conn => (
									<div key={conn.userId} className="connection-item" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }} onClick={() => shareToConnection(conn, selectedPost)}>
										<span className="connection-avatar" aria-hidden="true">
											{conn.profilePicture ? (
												<img src={`http://localhost:5000/uploads/${conn.profilePicture}`} alt="" style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                            if (event.currentTarget.nextElementSibling) {
                              event.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                         />
											) : null}
											<span className="connection-avatar-fallback" style={{ display: conn.profilePicture ? 'none' : 'flex' }}>
												{conn.name ? conn.name.charAt(0).toUpperCase() : 'U'}
											</span>
										</span>
										<span className="connection-text">
											<span className="connection-name">{conn.name}</span>
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default Post;
