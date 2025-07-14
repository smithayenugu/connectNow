import React, { useState, useEffect } from "react";
import { FaHeart, FaComment, FaPaperPlane } from 'react-icons/fa';
import axios from "axios";

function Post() {
	const [commentInput, setCommentInput] = useState("");
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [expandedComments, setExpandedComments] = useState({});
	const [selectedPost, setSelectedPost] = useState(null);

	useEffect(() => {
		axios
			.get("http://localhost:5000/api/posts")
			.then((response) => {
				setPosts(response.data);
				setLoading(false);
			})
			.catch((error) => {
				console.error("Error fetching posts:", error);
				setLoading(false);
			});
	}, []);

	const handleLike = (postId) => {
		axios
			.post(`http://localhost:5000/api/posts/like/${postId}`)
			.then((response) => {
				const updatedPosts = posts.map((post) =>
					post._id === postId ? response.data : post
				);
				setPosts(updatedPosts);
			})
			.catch((error) => console.error("Error liking post:", error));
	};

	const handleAddComment = (postId, commentText) => {
		if (!commentText.trim()) return;
		
		axios
			.post(`http://localhost:5000/api/posts/comment/${postId}`, {
				text: commentText,
			})
			.then((response) => {
				const updatedPosts = posts.map((post) =>
					post._id === postId ? response.data : post
				);
				setPosts(updatedPosts);
				setCommentInput("");
			})
			.catch((error) => console.error("Error adding comment:", error));
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
			<h2>Recent Posts</h2>
			<div className="posts-grid">
				{posts.map((post) => (
					<div key={post._id} className="post" onClick={() => setSelectedPost(post)} style={{ cursor: 'pointer' }}>
						<h3>{post.title}</h3>
						<p>{post.content}</p>
						{post.file && (
							<div>
								{post.file.includes(".mp4") ? (
									<video width="280" height="150" controls>
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
									/>
								)}
							</div>
						)}
						
						<div className="post-actions">
							<div className="post-stats">
								<button 
									onClick={() => handleLike(post._id)}
									className="like-toggle-button"
								>
									<FaHeart /> {post.likes}
								</button>
								<button 
									onClick={() => toggleComments(post._id)}
									className="comment-toggle-button"
								>
									<FaComment /> {post.comments.length}
								</button>
							</div>
						</div>

						{expandedComments[post._id] && (
							<div className="comments-section">
								<h4>Comments</h4>
								{post.comments.length > 0 ? (
									<ul className="comments-list">
										{post.comments.map((comment, index) => (
											<li key={index} className="comment-item">
												{comment.text}
											</li>
										))}
									</ul>
								) : (
									<p style={{ color: '#999', fontStyle: 'italic' }}>No comments yet</p>
								)}

								<div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
									<input
										type="text"
										placeholder="Add a comment..."
										className="comment-input"
										value={commentInput}
										onChange={(e) => setCommentInput(e.target.value)}
										onKeyPress={(e) => {
										if (e.key === 'Enter') {
											handleAddComment(post._id, commentInput);
										}
									}}
									/>
									<button
										onClick={() => handleAddComment(post._id, commentInput)}
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
		</div>
	);
}

export default Post; 