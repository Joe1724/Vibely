import React, { useEffect, useRef, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useLocation } from 'react-router-dom';

export default function ChatSidebar({ isOpen, setIsOpen }) {
  const { token, user } = useContext(AuthContext);
  const [convos, setConvos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showRequests, setShowRequests] = useState(true);
  const [activeState, setActiveState] = useState('accepted');
  const location = useLocation();
  const bottomRef = useRef(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null); // New state for message menu
  const [sidebarWidth, setSidebarWidth] = useState(460); // State for resizable sidebar width

  // Create Group modal state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]); // array of user objects
  const [creating, setCreating] = useState(false);

  // Conversation settings menu state
  const [showMenu, setShowMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [nickname, setNickname] = useState('');
  const [roleBusy, setRoleBusy] = useState(false);
  const [nicknameBusy, setNicknameBusy] = useState(false);

  if (!token) return null;

  const headers = { Authorization: `Bearer ${token}` };

  const loadConvos = async () => {
    try {
      const [c, r] = await Promise.all([
        axios.get('http://localhost:5000/api/chat/conversations?includePending=true', { headers }),
        axios.get('http://localhost:5000/api/chat/requests', { headers }),
      ]);
      setConvos(c.data);
      setRequests(r.data);
      if (activeId) {
        const current = c.data.find((x) => x._id === activeId);
        if (current) setActiveState(current.state || 'accepted');
      }
    } catch {}
  };

  const loadMessages = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/conversations/${id}/messages`, { headers });
      setMessages(res.data);
    } catch {}
  };

  useEffect(() => {
    loadConvos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heartbeat every 30s
  useEffect(() => {
    let t;
    const beat = async () => {
      try { await axios.put('http://localhost:5000/api/users/me/heartbeat', {}, { headers }); } catch {}
      t = setTimeout(beat, 30000);
    };
    if (token) beat();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (activeId) {
      const current = convos.find((x) => x._id === activeId);
      setActiveState(current?.state || 'accepted');
      loadMessages(activeId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Open a conversation via query param ?c=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cid = params.get('c');
    if (cid && cid !== activeId) {
      setActiveId(cid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keep newName and nickname in sync with active conversation
  useEffect(() => {
    const current = convos.find((x) => x._id === activeId);
    if (current) {
      setNewName(current.name || '');
      const myNick = current.nicknames?.[user._id] || '';
      setNickname(myNick);
    } else {
      setNewName('');
      setNickname('');
    }
  }, [activeId, convos, user._id]);

  // Search users for group members
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const q = memberQuery.trim();
        if (!q) {
          setMemberResults([]);
          return;
        }
        const res = await axios.get(
          `http://localhost:5000/api/users/search?query=${encodeURIComponent(q)}`,
          { headers }
        );
        if (!cancel) {
          const results = (res.data || []).filter((u) => u._id !== user._id);
          setMemberResults(results);
        }
      } catch {
        if (!cancel) setMemberResults([]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [memberQuery]);

  const addMember = (u) => {
    if (selectedMembers.find((m) => m._id === u._id)) return;
    setSelectedMembers((arr) => [...arr, u]);
  };

  const removeMember = (id) => {
    setSelectedMembers((arr) => arr.filter((m) => m._id !== id));
  };

  const createGroup = async (e) => {
    e?.preventDefault?.();
    if (!groupName.trim()) return;
    if (selectedMembers.length === 0) return;
    setCreating(true);
    try {
      const memberIds = selectedMembers.map((m) => m._id);
      const res = await axios.post(
        'http://localhost:5000/api/chat/conversations/group',
        { name: groupName.trim(), memberIds },
        { headers }
      );
      const convo = res.data;
      setShowCreateGroup(false);
      setGroupName('');
      setMemberQuery('');
      setMemberResults([]);
      setSelectedMembers([]);
      await loadConvos();
      setActiveId(convo._id);
    } catch (err) {
      // optionally surface error
      // eslint-disable-next-line no-alert
      alert(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const currentConvo = () => convos.find((c) => c._id === activeId);
  const amOwner = () => {
    const c = currentConvo();
    return c && String(c.createdBy) === String(user._id);
  };
  const amAdmin = () => {
    const c = currentConvo();
    if (!c) return false;
    return amOwner() || (Array.isArray(c.admins) && c.admins.map(String).includes(String(user._id)));
  };

  const renameGroup = async (e) => {
    e?.preventDefault?.();
    const c = currentConvo();
    if (!c || !c.isGroup || !newName.trim()) return;
    try {
      await axios.put(`http://localhost:5000/api/chat/conversations/${c._id}/rename`, { name: newName.trim() }, { headers });
      await loadConvos();
      setRenaming(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rename');
    }
  };

  const setMyNickname = async (e) => {
    e?.preventDefault?.();
    const c = currentConvo();
    if (!c) return;
    setNicknameBusy(true);
    try {
      await axios.put(`http://localhost:5000/api/chat/conversations/${c._id}/nickname`, { nickname }, { headers });
      await loadConvos();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set nickname');
    } finally {
      setNicknameBusy(false);
    }
  };

  const toggleAdmin = async (memberId, makeAdmin) => {
    const c = currentConvo();
    if (!c) return;
    setRoleBusy(true);
    try {
      await axios.put(`http://localhost:5000/api/chat/conversations/${c._id}/role`, { userId: memberId, makeAdmin }, { headers });
      await loadConvos();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change role');
    } finally {
      setRoleBusy(false);
    }
  };

  const ConversationHeader = () => {
    const current = convos.find((c) => c._id === activeId);
    if (!current) return null;
    const title = current.isGroup
      ? current.name
      : current.members
          .filter((m) => m._id !== user._id)
          .map((m) => m.username)
          .join(', ');
    const avatars = current.members.slice(0, 3);
    return (
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex -space-x-2">
          {avatars.map((m) => (
            <img
              key={m._id}
              src={m.avatar ? `http://localhost:5000${m.avatar}` : undefined}
              alt=""
              className="bg-gray-300 border border-white rounded-full w-7 h-7 dark:border-gray-800"
            />
          ))}
        </div>
        <div className="font-medium truncate" title={title}>{title}</div>
        {current.isGroup && current.pinnedMessage && (
          <div className="flex items-center gap-2 ml-auto text-xs text-gray-600 dark:text-gray-300">
            <span className="truncate max-w-[280px]" title={current.pinnedMessage.text || 'Pinned message'}>📌 {current.pinnedMessage.isDeleted ? 'Message removed' : (current.pinnedMessage.text || '')}</span>
            {amAdmin() && (
              <button
                onClick={async () => { await axios.put(`http://localhost:5000/api/chat/conversations/${current._id}/pin`, { messageId: null }, { headers }); loadConvos(); }}
                className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700"
              >Unpin</button>
            )}
          </div>
        )}
      </div>
    );
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (replyTo) {
      await axios.post(`http://localhost:5000/api/chat/conversations/${activeId}/messages/reply`, { text, replyTo: replyTo._id }, { headers });
    } else {
      await axios.post(`http://localhost:5000/api/chat/conversations/${activeId}/messages`, { text }, { headers });
    }
    setText('');
    setReplyTo(null);
    loadMessages(activeId);
    loadConvos();
  };

  const respond = async (id, action) => {
    await axios.put(`http://localhost:5000/api/chat/conversations/${id}/respond`, { action }, { headers });
    if (activeId === id && action === 'reject') {
      setActiveId(null);
      setMessages([]);
    }
    loadConvos();
  };

  const setTypingApi = async (isTyping) => {
    if (!activeId) return;
    try {
      await axios.put(`http://localhost:5000/api/chat/conversations/${activeId}/typing`, { typing: isTyping }, { headers });
    } catch {}
  };

  const startResizing = React.useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
  }, []);

  const resize = React.useCallback((mouseMoveEvent) => {
    const newWidth = window.innerWidth - mouseMoveEvent.clientX;
    // Set minimum and maximum width for the sidebar
    const minWidth = 300; // Example minimum width
    const maxWidth = 800; // Example maximum width
    setSidebarWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
  }, []);

  const stopResizing = React.useCallback(() => {
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResizing);
  }, []);

  return (
    <>
      {/* Slide-in sidebar */}
      <aside
        className={`fixed right-6 bottom-0 z-50 w-full max-w-sm bg-white dark:bg-gray-800 rounded-t-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-4rem)]'
        }`}
      >
        <div className="flex flex-col h-[60vh] max-h-[60vh]">
          <div
            className="flex items-center justify-between px-6 py-4 cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-t-xl"
            onClick={() => setIsOpen(!isOpen)}
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Messages</h3>
            <button
              className="p-2 text-gray-700 transition-colors rounded-full dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              title={isOpen ? "Collapse" : "Expand"}
            >
              {isOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
              )}
            </button>
          </div>

          <div className="flex flex-1 min-h-0 gap-3 p-3">
            <div className="w-5/12 min-w-[170px] flex flex-col">
              <div className="mb-1 text-xs font-medium text-gray-500">Conversations</div>
              <div className="flex-1 pr-1 space-y-1 overflow-auto">
                {convos.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => setActiveId(c._id)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${activeId === c._id ? 'bg-blue-100 dark:bg-blue-800/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700/60'}`}
                  >
                    <div className="flex -space-x-1">
                      {(c.members || []).filter(m => m._id !== user._id).slice(0, 2).map((m) => (
                        <div key={m._id} className="relative">
                          <img
                            src={m.avatar ? `http://localhost:5000${m.avatar}` : undefined}
                            alt=""
                            className="object-cover w-8 h-8 bg-gray-300 border-2 border-white rounded-full dark:border-gray-800"
                          />
                          {/* Online dot if active in last 2 min */}
                          {m.lastActiveAt && Date.now() - new Date(m.lastActiveAt).getTime() < 120000 && (
                            <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Removed username span as per user feedback */}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowRequests((v) => !v)}
                  className="flex items-center justify-between w-full px-2 py-1 text-xs font-medium text-gray-600 rounded hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/60"
                >
                  <span>Requests</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-200 dark:bg-gray-700">{requests.length}</span>
                </button>
                {showRequests && (
                  <div className="pr-1 mt-1 space-y-1 overflow-auto max-h-40">
                    {requests.map((r) => (
                      <div key={r._id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className="text-sm truncate">{r.members.map((m) => m.username).join(', ')}</span>
                        <div className="flex gap-2">
                          <button onClick={() => respond(r._id, 'accept')} className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Accept</button>
                          <button onClick={() => respond(r._id, 'reject')} className="px-3 py-1 text-xs font-medium bg-gray-200 rounded-lg dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Mute + Invite controls */}
                {activeId && currentConvo()?.isGroup && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={async () => { await axios.put(`http://localhost:5000/api/chat/conversations/${activeId}/mute`, { mute: !(currentConvo().mutedMembers?.[user._id]) }, { headers }); await loadConvos(); }}
                      className="w-full px-2 py-1 text-xs text-left bg-gray-100 rounded dark:bg-gray-700/60"
                    >
                      {currentConvo().mutedMembers?.[user._id] ? 'Unmute conversation' : 'Mute conversation'}
                    </button>
                    <div className="space-y-1">
                      {amAdmin() && (
                        <button
                          onClick={async () => { const res = await axios.put(`http://localhost:5000/api/chat/conversations/${activeId}/invite/reset`, {}, { headers }); const code = res.data?.inviteCode; if (code) { prompt('Invite code (share this):', code); } else { alert('Failed to generate code'); } }}
                          className="w-full px-2 py-1 text-xs text-left bg-gray-100 rounded dark:bg-gray-700/60"
                        >
                          Generate invite code
                        </button>
                      )}
                      <button
                        onClick={async () => { const code = prompt('Enter invite code to join a group'); if (code) { try { await axios.post('http://localhost:5000/api/chat/conversations/join', { code }, { headers }); await loadConvos(); } catch { alert('Invalid or failed to join'); } } }}
                        className="w-full px-2 py-1 text-xs text-left bg-gray-100 rounded dark:bg-gray-700/60"
                      >
                        Join via invite code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              {activeId ? (
                <>
                  <ConversationHeader />
                  <div className="flex-1 py-2 pr-2 space-y-3 overflow-y-auto">
                    {activeState !== 'accepted' && (
                      <div className="p-3 mb-3 text-sm text-yellow-800 bg-yellow-100 rounded-lg dark:bg-yellow-900/30 dark:text-yellow-300">
                        Conversation is pending. You can chat after it is accepted.
                      </div>
                    )}
                    {messages.map((m) => {
                      const mine = m.sender._id === user._id;
                      return (
                        <div key={m._id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                          {!mine && (
                            <img
                              src={m.sender.avatar ? `http://localhost:5000${m.sender.avatar}` : undefined}
                              alt=""
                              className="object-cover w-8 h-8 bg-gray-300 rounded-full"
                            />
                          )}
                          <div className={`${mine ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-xl'} px-4 py-3 max-w-[80%] break-words shadow-sm`}>
                            <div className="mb-1 text-xs font-semibold opacity-80">{mine ? 'You' : m.sender.username}</div>
                            {m.replyTo && (
                              <div className={`mb-2 text-xs rounded-lg px-3 py-2 ${mine ? 'bg-blue-500/40' : 'bg-gray-600/20'} opacity-90 border border-dashed ${mine ? 'border-blue-400' : 'border-gray-500'}`}>
                                Replying to: {m.replyTo.isDeleted ? 'Message removed' : (m.replyTo.text || '')}
                              </div>
                            )}
                            <div className="text-sm break-words whitespace-pre-wrap">{m.isDeleted ? 'Message removed' : m.text}</div>
                            <div className="flex items-center gap-2 mt-2 text-xs opacity-80">
                              {/* Message options menu */}
                              <div className="relative">
                                <button onClick={() => setOpenMessageMenuId(openMessageMenuId === m._id ? null : m._id)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                  </svg>
                                </button>
                                {openMessageMenuId === m._id && (
                                  <div className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700" style={{ [mine ? 'right' : 'left']: '0px', top: '100%', minWidth: '120px' }}>
                                    <div className="flex flex-col p-2 space-y-1">
                                      <button onClick={() => { setReplyTo(m); setOpenMessageMenuId(null); }} className="px-3 py-1 text-left text-gray-700 rounded hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">Reply</button>
                                      <div className="relative group">
                                        <button className="w-full px-3 py-1 text-left text-gray-700 rounded hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">React</button>
                                        <div className="absolute z-30 hidden gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg shadow-md group-hover:flex dark:bg-gray-800 dark:border-gray-700" style={{ [mine ? 'right' : 'left']: '100%', top: '0px' }}>
                                          {['👍','❤️','😂','😮','😢','😡'].map((r) => (
                                            <button key={r} onClick={async () => { await axios.put(`http://localhost:5000/api/chat/messages/${m._id}/react`, { type: r }, { headers }); loadMessages(activeId); setOpenMessageMenuId(null); }} className="px-1 text-lg transition-transform hover:scale-110">{r}</button>
                                          ))}
                                        </div>
                                      </div>
                                      {mine && !m.isDeleted && (
                                        <>
                                          <button onClick={async () => { const newText = prompt('Edit message', m.text); if (newText !== null) { await axios.put(`http://localhost:5000/api/chat/messages/${m._id}/edit`, { text: newText }, { headers }); loadMessages(activeId); setOpenMessageMenuId(null); } }} className="px-3 py-1 text-left text-gray-700 rounded hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">Edit</button>
                                          <button onClick={async () => { if (confirm('Delete this message?')) { await axios.delete(`http://localhost:5000/api/chat/messages/${m._id}`, { headers }); loadMessages(activeId); setOpenMessageMenuId(null); } }} className="px-3 py-1 text-left text-red-600 rounded hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900">Delete</button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {Array.isArray(m.reactions) && m.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2 text-xs">
                                {m.reactions.map((r, i) => (
                                  <span key={i} className={`px-2 py-1 rounded-full ${mine ? 'bg-blue-500/30 text-blue-100' : 'bg-gray-500/20 text-gray-700 dark:text-gray-300'}`}>{r.type} {r.user?.username ? `(${r.user.username})` : ''}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                  {replyTo && (
                      <div className="flex items-center gap-2 p-2 mb-2 text-sm bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700">
                      <span className="text-gray-700 dark:text-gray-300">Replying to: {replyTo.isDeleted ? 'Message removed' : (replyTo.text || '')}</span>
                      <button onClick={() => setReplyTo(null)} className="text-sm text-red-500 hover:text-red-600">Cancel</button>
                    </div>
                  )}
                  <form onSubmit={send} className="flex items-center gap-3 mt-3" onFocus={() => setTypingApi(true)} onBlur={() => setTypingApi(false)}>
                    <div className="flex items-center flex-1 min-w-0 px-5 py-3 bg-white border border-gray-300 rounded-full shadow-sm dark:bg-gray-800 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                      <input
                        disabled={activeState !== 'accepted'}
                        className="flex-1 min-w-0 text-base text-gray-900 placeholder-gray-500 bg-transparent outline-none dark:text-gray-100 dark:placeholder-gray-400"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message"
                      />
                    </div>
                    <button disabled={activeState !== 'accepted'} className="px-6 py-3 text-base font-medium text-white transition-colors bg-blue-600 rounded-full shadow-md disabled:opacity-50 shrink-0 hover:bg-blue-700">Send</button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center flex-1 text-lg text-gray-500">Select a chat to start messaging</div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Floating chat opener when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-40 items-center justify-center hidden w-16 h-16 text-white transition-colors duration-300 bg-blue-600 rounded-full shadow-lg right-6 bottom-6 md:flex hover:bg-blue-700"
          title="Open chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H15.75M2.25 12c0-1.152.108-2.263.32-3.347m.094-1.077C4.016 6.021 6.4 5.25 9 5.25h1.063c.862 0 1.677.44 2.187 1.143 1.233 1.68 3.186 2.695 5.337 2.695h1.086c1.363 0 2.651.81 3.345 2.097M2.25 12c0 1.152.108 2.263.32 3.347m-.094 1.077C4.016 17.979 6.4 18.75 9 18.75h1.063c.862 0 1.677-.44 2.187-1.143 1.233-1.68 3.186-2.695 5.337-2.695h1.086c1.363 0 2.651.81 3.345 2.097M12 7.5a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm-3 0A.75.75 0 0 1 9.75 6.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75A.75.75 0 0 1 9 8.25v-.75Z" />
          </svg>
        </button>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md p-6 bg-white shadow-xl rounded-xl dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">Create Group</h4>
              <button onClick={() => setShowCreateGroup(false)} className="p-2 text-gray-700 transition-colors rounded-full dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700" title="Close"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Group name</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Friends, Team Alpha"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Add members</label>
                <input
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search users by username or email"
                />
                {memberResults.length > 0 && (
                  <div className="mt-2 overflow-auto border border-gray-200 rounded-lg max-h-40 dark:border-gray-700">
                    {memberResults.map((u) => (
                      <button
                        type="button"
                        key={u._id}
                        onClick={() => addMember(u)}
                        className="flex items-center justify-between w-full px-4 py-2 text-left text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <span className="truncate">{u.username} <span className="text-sm text-gray-500 dark:text-gray-400">{u.email}</span></span>
                        <span className="text-sm text-blue-600">Add</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedMembers.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Selected Members</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((m) => (
                      <span key={m._id} className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/40 dark:text-blue-300">
                        {m.username}
                        <button type="button" onClick={() => removeMember(m._id)} className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                <button disabled={creating || !groupName.trim() || selectedMembers.length === 0} className="px-4 py-2 font-medium text-white bg-blue-600 rounded-lg disabled:opacity-60 hover:bg-blue-700">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}


