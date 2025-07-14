// CreatePost.js
import React, { useState } from "react";
import { FaUpload, FaSpinner } from 'react-icons/fa';
import axios from "axios";

function CreatePost() {
	const [newPost, setNewPost] = useState({
		title: "",
		content: "",
		file: null,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleInputChange = (event) => {
		const { name, value } = event.target;
		setNewPost({ ...newPost, [name]: value });
	};

	const handleFileChange = (event) => {
		setNewPost({ ...newPost, file: event.target.files[0] });
	};

	const handlePostSubmit = () => {
		if (!newPost.title.trim() || !newPost.content.trim()) {
			alert("Please fill in both title and content");
			return;
		}

		setIsSubmitting(true);
		const formData = new FormData();
		formData.append("title", newPost.title);
		formData.append("content", newPost.content);
		if (newPost.file) {
			formData.append("file", newPost.file);
		}

		axios
			.post("http://localhost:5000/api/posts", formData)
			.then((response) => {
				setNewPost({ title: "", content: "", file: null });
				setIsSubmitting(false);
				alert("Post created successfully!");
			})
			.catch((error) => {
				console.error("Error creating post:", error);
				setIsSubmitting(false);
				alert("Error creating post. Please try again.");
			});
	};

	return (
		<div className="create-post">
			<h2>Create a New Post</h2>
			
			<div className="form-group">
				<label htmlFor="title">Title</label>
				<input
					type="text"
					id="title"
					name="title"
					placeholder="Enter your post title..."
					value={newPost.title}
					onChange={handleInputChange}
				/>
			</div>

			<div className="form-group">
				<label htmlFor="content">Content</label>
				<textarea
					id="content"
					name="content"
					placeholder="Share your thoughts..."
					value={newPost.content}
					onChange={handleInputChange}
				></textarea>
			</div>

			<div className="form-group">
				<label htmlFor="file">Media (Optional)</label>
				<div className="file-input-wrapper">
					<input
						type="file"
						id="file"
						name="file"
						className="file-input"
						onChange={handleFileChange}
						accept="image/*,video/*"
					/>
					<label htmlFor="file" className="file-input-label">
						<FaUpload /> Choose File
					</label>
					{newPost.file && (
						<div className="file-name">
							Selected: {newPost.file.name}
						</div>
					)}
				</div>
			</div>

			<button 
				onClick={handlePostSubmit} 
				disabled={isSubmitting}
				style={{ opacity: isSubmitting ? 0.7 : 1 }}
			>
				{isSubmitting ? (
					<>
						<FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Creating...
					</>
				) : (
					"Create Post"
				)}
			</button>
		</div>
	);
}

export default CreatePost;