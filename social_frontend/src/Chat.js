import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import './Chat.css';

const AVATAR_FALLBACK_INITIAL = (name) => (name ? name.charAt(0).toUpperCase() : '?');

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const { friendId: navFriendId, friendName: navFriendName, replyPost: navReplyPost } = location.state || {};

  const [userId] = useState(localStorage.getItem('userId'));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Conversations list state
  const [conversations, setConversations] = useState([]);
  const [convosLoading, setConvosLoading] = useState(true);
  const [convosError, setConvosError] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState(navFriendId || null);
  const [selectedFriendName, setSelectedFriendName] = useState(navFriendName || null);
  const [selectedFriendProfilePicture, setSelectedFriendProfilePicture] = useState(null);
  const [replyPost, setReplyPost] = useState(navReplyPost || null);

  // Chat inbox search state
  const [conversationsSearch, setConversationsSearch] = useState('');
  const [showInboxSearch, setShowInboxSearch] = useState(false);
  const inboxSearchInputRef = useRef(null);

  // Edit state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const editInputRef = useRef(null);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionMenuMessageId, setActionMenuMessageId] = useState(null);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setConvosLoading(true);
    setConvosError('');
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat/conversations/${userId}`);
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setConvosError(err.response?.data?.error || 'Failed to load conversations');
    } finally {
      setConvosLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadConversations();
  }, [userId, loadConversations]);

  useEffect(() => {
    if (navFriendId) {
      setSelectedFriendId(navFriendId);
      setSelectedFriendName(navFriendName);
      // If navigated from places that pass friend profile picture in route state, use it.
      const navState = location.state || {};
      setSelectedFriendProfilePicture(navState.friendProfilePicture || null);
      setReplyPost(navState.replyPost || null);
    }
  }, [navFriendId, navFriendName, location.state]);

  const [cameFromNav, setCameFromNav] = useState(!!navFriendId);
  useEffect(() => {
    if (navFriendId) setCameFromNav(true);
  }, [navFriendId]);

  // Focus the edit input when entering edit mode
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMessageId]);

  const loadMessages = useCallback(async () => {
    if (!userId || !selectedFriendId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat?user1=${userId}&user2=${selectedFriendId}`);
      setMessages(res.data.messages || []);
    } catch {
      setError('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedFriendId]);

  // Mark messages as seen when opening a conversation
  const markAsSeen = useCallback(async () => {
    if (!userId || !selectedFriendId) return;
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat/seen`, {
        userId,
        partnerId: selectedFriendId
      });
      // Refresh conversations to update unread counts
      loadConversations();
    } catch (err) {
      console.error('Error marking messages as seen:', err);
    }
  }, [userId, selectedFriendId, loadConversations]);

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    if (!selectedFriendId) {
      setLoading(false);
      setMessages([]);
      setError('');
      return;
    }

    loadMessages().then(() => {
      markAsSeen();
    });
  }, [userId, selectedFriendId, navigate, loadMessages, markAsSeen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedFriendId) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat`, {
        from: userId,
        to: selectedFriendId,
        text: input,
        replyPost,
      });

      const [msgRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat?user1=${userId}&user2=${selectedFriendId}`),
        loadConversations(),
      ]);

      setMessages(msgRes.data.messages || []);
      setInput('');
      setReplyPost(null);
    } catch {
      setError('Failed to send message.');
    }
  };

  // Calculate total unread count across all conversations
  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv =>
    !conversationsSearch.trim() || 
    (conv.partnerName && conv.partnerName.toLowerCase().includes(conversationsSearch.toLowerCase()))
  );

  const handleSelectConversation = (partnerId, partnerName, partnerProfilePicture) => {
    setSelectedFriendId(partnerId);
    setSelectedFriendName(partnerName);
    setSelectedFriendProfilePicture(partnerProfilePicture || null);
    setCameFromNav(false);
    setEditingMessageId(null);
    setEditText('');
    setDeleteConfirmId(null);
    setActionMenuMessageId(null);
    setReplyPost(null);
  };

  const handleBackToInbox = () => {
    setSelectedFriendId(null);
    setSelectedFriendName(null);
    setSelectedFriendProfilePicture(null);
    setMessages([]);
    setCameFromNav(false);
    setEditingMessageId(null);
    setEditText('');
    setDeleteConfirmId(null);
    setActionMenuMessageId(null);
    setReplyPost(null);
  };

  // ---- Edit functionality ----
  const handleStartEdit = (msg) => {
    setEditingMessageId(msg._id);
    setEditText(msg.text);
    setDeleteConfirmId(null);
    setActionMenuMessageId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) return;
    try {
      await axios.put(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat/${messageId}`, {
        text: editText.trim(),
        userId
      });
      setEditingMessageId(null);
      setEditText('');
      await loadMessages();
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to edit message.');
    }
  };

  const handleEditKeyDown = (e, messageId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(messageId);
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // ---- Delete functionality ----
  const handleDeleteClick = (msg) => {
    setDeleteConfirmId(msg._id);
    setEditingMessageId(null);
    setActionMenuMessageId(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleConfirmDelete = async (messageId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/chat/${messageId}`, {
        data: { userId }
      });
      setDeleteConfirmId(null);
      await loadMessages();
      await loadConversations();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete message.');
    }
  };

  useEffect(() => {
    if (!actionMenuMessageId) return;

    const handleClickOutsideMenu = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.chat-message-menu-wrap')) return;
      setActionMenuMessageId(null);
    };

    document.addEventListener('mousedown', handleClickOutsideMenu);
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
  }, [actionMenuMessageId]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!userId) return null;

  if (!selectedFriendId) {
    return (
      <div className="chat-page">
        <div className="chat-header">
          <span className="chat-friend-name" style={{ margin: '0 auto' }}>
            Messages{totalUnread > 0 && (
              <span className="chat-inbox-unread-badge">{totalUnread}</span>
            )}
          </span>
          <button
            className="chat-inbox-search-toggle"
            onClick={() => {
              setShowInboxSearch(!showInboxSearch);
              setTimeout(() => {
                if (inboxSearchInputRef.current) inboxSearchInputRef.current.focus();
              }, 100);
            }}
            title="Search conversations"
          >
            &#128269;
          </button>
        </div>

        {showInboxSearch && (
          <div className="chat-inbox-search">
            <input
              ref={inboxSearchInputRef}
              type="text"
              className="chat-inbox-search-input"
              placeholder="Search conversations..."
              value={conversationsSearch}
              onChange={(e) => setConversationsSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowInboxSearch(false);
                  setConversationsSearch('');
                }
              }}
            />
          </div>
        )}
        <div className="conversations-list">
          {convosLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : convosError ? (
            <div className="empty-state" style={{ color: '#555' }}>
              <p>{convosError}</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="empty-state" style={{ color: '#555' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
                {conversationsSearch.trim() ? 'No conversations match your search' : 'No conversations yet'}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#888' }}>
                {conversationsSearch.trim() ? 'Try a different name' : "Go to someone's profile and send them a message!"}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
                <div
                  key={conv.partnerId}
                  className={`conversation-item ${(conv.unreadCount || 0) > 0 ? 'conversation-unread' : ''}`}
                  onClick={() => handleSelectConversation(conv.partnerId, conv.partnerName, conv.partnerProfilePicture)}
                >

                <div className="conversation-avatar">
                  {conv.partnerProfilePicture ? (
                    <img
                      src={`${conv.partnerProfilePicture}`}
                      alt="Partner"
                      style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        if (parent) {
                          let fallback = parent.querySelector('.conv-avatar-fallback');
                          if (!fallback) {
                            fallback = document.createElement('span');
                            fallback.className = 'conv-avatar-fallback';
                            fallback.style.cssText = 'width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#4e54c8,#8f94fb);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:1.3rem;';
                            fallback.textContent = AVATAR_FALLBACK_INITIAL(conv.partnerName);
                            parent.appendChild(fallback);
                          }
                          fallback.style.display = 'inline-flex';
                        }
                      }}
                    />
                  ) : (
                    <span>{AVATAR_FALLBACK_INITIAL(conv.partnerName)}</span>
                  )}
                  {(conv.unreadCount || 0) > 0 && (
                    <span className="conversation-unread-badge">{conv.unreadCount}</span>
                  )}
                </div>

                <div className="conversation-details">
                  <div className="conversation-top">
                    <span className="conversation-name">{conv.partnerName || 'Unknown'}</span>
                    <span className="conversation-time">{formatTime(conv.lastTimestamp)}</span>
                  </div>
                  <div className="conversation-last-msg">{conv.lastMessage}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  const renderSenderAvatar = (msg) => {
    if (msg.senderProfilePicture) {
      return (
        <div style={{ position: 'relative', width: '34px', height: '34px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={`${msg.senderProfilePicture}`}
            alt="Sender"
            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.parentElement) {
                const parent = e.target.parentElement;
                let fallback = parent.querySelector('.chat-msg-avatar-fallback');
                if (!fallback) {
                  fallback = document.createElement('span');
                  fallback.className = 'chat-msg-avatar-fallback';
                  fallback.textContent = msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'F';
                  parent.appendChild(fallback);
                }
                fallback.style.display = 'flex';
              }
            }}
          />
        </div>
      );
    }

    return <span className="chat-avatar-initial">{msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'F'}</span>;
  };

  const renderPostReply = (post) => {
    if (!post || !post.postId) return null;

    return (
      <div className="chat-post-reply-card">
        <div className="chat-post-reply-label">Replying to post</div>
        <div className="chat-post-reply-title">{post.title || 'Untitled post'}</div>
        {post.content && <div className="chat-post-reply-content">{post.content}</div>}
      </div>
    );
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="chat-back" onClick={cameFromNav ? () => navigate(-1) : handleBackToInbox}>
            &larr;
          </button>

          <div className="chat-header-profile">
            {/* Profile picture of the conversation partner */}
            {selectedFriendProfilePicture ? (
              <div style={{ position: 'relative', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  className="chat-header-avatar-img"
                  src={`${selectedFriendProfilePicture}`}
                  alt="Partner"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      let fallback = parent.querySelector('.chat-header-fallback');
                      if (!fallback) {
                        fallback = document.createElement('span');
                        fallback.className = 'chat-header-fallback chat-header-avatar-img';
                        fallback.textContent = selectedFriendName ? selectedFriendName.charAt(0).toUpperCase() : '?';
                        parent.appendChild(fallback);
                      }
                      fallback.style.display = 'flex';
                    }
                  }}
                />
              </div>
            ) : selectedFriendName ? (
              <span className="chat-header-avatar-img" style={{ width: 28, height: 28 }}>
                {selectedFriendName.charAt(0).toUpperCase()}
              </span>
            ) : null}

            <span className="chat-friend-name">{selectedFriendName || 'Friend'}</span>
          </div>
        </div>

        <Link
          to={`/profile/${selectedFriendId}`}
          className="chat-view-profile-btn chat-view-profile-btn-secondary"
        >
          View Profile
        </Link>
      </div>

      <div className="chat-body">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="empty-state" style={{ color: '#999' }}>
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state" style={{ color: '#555' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No messages yet</p>
            <p style={{ fontSize: '0.9rem', color: '#888' }}>Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.from === userId;
            const isEditing = editingMessageId === msg._id;
            const isDeleteConfirm = deleteConfirmId === msg._id;
            const isDeleted = msg.isDeleted;

            return (
              <div key={msg._id || idx} className={`chat-message-row ${isMine ? 'mine' : 'theirs'}`}>
                <div
                  className={`chat-message-stack ${isMine ? 'mine' : 'theirs'}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: isEditing || isDeleteConfirm ? 'flex-start' : 'center',
                    gap: '10px',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isMine && (
                    <div className="chat-avatar-badge">{renderSenderAvatar(msg)}</div>
                  )}

                  <div
                    className={`chat-message-bubble ${isMine ? 'mine' : 'theirs'} ${isDeleted ? 'chat-message-deleted' : ''}`}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}
                  >
                    {isMine && !isDeleted && !isEditing && !isDeleteConfirm && (
                      <div className="chat-message-menu-wrap">
                        <button
                          type="button"
                          className="chat-message-menu-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuMessageId(prev => prev === msg._id ? null : msg._id);
                          }}
                          title="Message options"
                          aria-label="Message options"
                        >
                          &#8942;
                        </button>
                        {actionMenuMessageId === msg._id && (
                          <div className="chat-message-menu">
                            <button type="button" onClick={() => handleStartEdit(msg)}>Edit</button>
                            <button type="button" className="chat-message-menu-danger" onClick={() => handleDeleteClick(msg)}>Delete</button>
                          </div>
                        )}
                      </div>
                    )}
                    {isEditing ? (
                      <div className="chat-edit-container">
                        <input
                          ref={editInputRef}
                          type="text"
                          className="chat-edit-input"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => handleEditKeyDown(e, msg._id)}
                        />
                        <div className="chat-edit-actions">
                          <button className="chat-edit-save-btn" onClick={() => handleSaveEdit(msg._id)}>Save</button>
                          <button className="chat-edit-cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : isDeleteConfirm ? (
                      <div className="chat-delete-confirm">
                        <span className="chat-delete-confirm-text">Delete this message?</span>
                        <div className="chat-delete-confirm-actions">
                          <button className="chat-delete-yes-btn" onClick={() => handleConfirmDelete(msg._id)}>Delete</button>
                          <button className="chat-delete-no-btn" onClick={handleCancelDelete}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {!isDeleted && renderPostReply(msg.replyPost)}
                        <span className={isDeleted ? 'chat-message-deleted-text' : ''}>
                          {isDeleted ? 'This message was deleted' : msg.text}
                        </span>
                        <span className="chat-message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.edited && !isDeleted && <span className="chat-edited-indicator"> (edited)</span>}
                        </span>
                      </>
                    )}
                  </div>

                  {isMine && !isEditing && !isDeleteConfirm && (
                    <div className="chat-avatar-badge">{renderSenderAvatar(msg)}</div>
                  )}
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSend}>
        {replyPost && (
          <div className="chat-active-reply-card">
            <div>
              <div className="chat-post-reply-label">Replying to post</div>
              <div className="chat-post-reply-title">{replyPost.title || 'Untitled post'}</div>
            </div>
            <button type="button" className="chat-active-reply-close" onClick={() => setReplyPost(null)} title="Remove post reply">
              &times;
            </button>
          </div>
        )}
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={replyPost ? 'Reply to this post...' : 'Type a message...'}
          autoFocus
        />
        <button type="submit" className="chat-send-btn">
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
