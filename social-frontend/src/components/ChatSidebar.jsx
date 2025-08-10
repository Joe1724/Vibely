import React, { useEffect, useRef, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useLocation } from 'react-router-dom';

export default function ChatSidebar() {
  const { token, user } = useContext(AuthContext);
  const [convos, setConvos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [showRequests, setShowRequests] = useState(true);
  const [activeState, setActiveState] = useState('accepted');
  const location = useLocation();
  const bottomRef = useRef(null);

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
              className="w-7 h-7 rounded-full border border-white dark:border-gray-800 bg-gray-300"
            />
          ))}
        </div>
        <div className="font-medium truncate" title={title}>{title}</div>
        {current.isGroup && current.pinnedMessage && (
          <div className="ml-auto text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
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

  return (
    <>
      {/* Slide-in sidebar */}
      <aside
        className={`fixed right-4 top-[80px] bottom-4 hidden md:flex z-30 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)]'
        }`}
      >
        <div className="flex h-full w-[460px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/90 shadow-2xl backdrop-blur dark:border-gray-700 dark:bg-gray-800/90">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-200">Messages</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-90"
            >
              {isOpen ? 'Hide' : 'Show'}
            </button>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:opacity-90"
            >
              New Group
            </button>
            {activeId && (
              <div className="relative">
                <button onClick={() => setShowMenu((v) => !v)} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">Menu</button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-72 rounded border bg-white shadow dark:bg-gray-800 dark:border-gray-700 p-3 z-50">
                    {currentConvo()?.isGroup ? (
                      <>
                        <div className="mb-2 text-xs font-semibold text-gray-500">Group Settings</div>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs mb-1">Group name</label>
                            <form onSubmit={renameGroup} className="flex gap-2">
                              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1 rounded border px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700" />
                              <button disabled={!amAdmin() || !newName.trim()} className="px-2 py-1 text-xs rounded bg-blue-600 text-white disabled:opacity-50">Save</button>
                            </form>
                          </div>
                          <div>
                            <div className="text-xs mb-1">Members</div>
                            <div className="max-h-40 overflow-auto space-y-1 pr-1">
                              {(currentConvo()?.members || []).map((m) => {
                                const isAdmin = (currentConvo()?.admins || []).map(String).includes(String(m._id)) || String(currentConvo()?.createdBy) === String(m._id);
                                const isOwner = String(currentConvo()?.createdBy) === String(m._id);
                                return (
                                  <div key={m._id} className="flex items-center justify-between text-sm">
                                    <span className="truncate">{m.username}{isOwner ? ' (owner)' : isAdmin ? ' (admin)' : ''}</span>
                                    {amOwner() && String(m._id) !== String(user._id) && !isOwner && (
                                      isAdmin ? (
                                        <button disabled={roleBusy} onClick={() => toggleAdmin(m._id, false)} className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">Remove admin</button>
                                      ) : (
                                        <button disabled={roleBusy} onClick={() => toggleAdmin(m._id, true)} className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white">Make admin</button>
                                      )
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500">Direct conversation</div>
                    )}
                    <div className="mt-3 pt-2 border-t dark:border-gray-700">
                      <div className="mb-1 text-xs font-semibold text-gray-500">Your nickname</div>
                      <form onSubmit={setMyNickname} className="flex gap-2">
                        <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="flex-1 rounded border px-2 py-1 text-sm dark:bg-gray-900 dark:border-gray-700" placeholder="Optional" />
                        <button disabled={nicknameBusy} className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700">Save</button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

          <div className="flex h-full min-w-0 gap-3 p-3">
            <div className="w-5/12 min-w-[170px] flex flex-col">
              <div className="mb-1 text-xs font-medium text-gray-500">Conversations</div>
              <div className="flex-1 overflow-auto pr-1 space-y-1">
                {convos.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => setActiveId(c._id)}
                    className={`w-full text-left px-2 py-2 rounded flex items-center gap-2 ${activeId === c._id ? 'bg-blue-50 dark:bg-blue-900/40' : 'hover:bg-gray-100 dark:hover:bg-gray-700/60'}`}
                  >
                    <div className="flex -space-x-2">
                      {(c.members || []).slice(0, 2).map((m) => (
                        <div key={m._id} className="relative">
                          <img
                            src={m.avatar ? `http://localhost:5000${m.avatar}` : undefined}
                            alt=""
                            className="w-6 h-6 rounded-full border border-white dark:border-gray-800 bg-gray-300"
                          />
                          {/* Online dot if active in last 2 min */}
                          {m.lastActiveAt && Date.now() - new Date(m.lastActiveAt).getTime() < 120000 && (
                            <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800" />
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="truncate text-sm">
                      {c.isGroup ? c.name : c.members.map((m) => m.username).join(', ')}
                    </span>
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
                  <div className="max-h-40 mt-1 overflow-auto space-y-1 pr-1">
                    {requests.map((r) => (
                      <div key={r._id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span className="truncate text-sm">{r.members.map((m) => m.username).join(', ')}</span>
                        <div className="flex gap-1">
                          <button onClick={() => respond(r._id, 'accept')} className="px-2 py-0.5 text-xs text-white bg-blue-600 rounded">Accept</button>
                          <button onClick={() => respond(r._id, 'reject')} className="px-2 py-0.5 text-xs bg-gray-200 rounded dark:bg-gray-700">Reject</button>
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
                      className="w-full text-left px-2 py-1 rounded bg-gray-100 dark:bg-gray-700/60 text-xs"
                    >
                      {currentConvo().mutedMembers?.[user._id] ? 'Unmute conversation' : 'Mute conversation'}
                    </button>
                    <div className="space-y-1">
                      {amAdmin() && (
                        <button
                          onClick={async () => { const res = await axios.put(`http://localhost:5000/api/chat/conversations/${activeId}/invite/reset`, {}, { headers }); const code = res.data?.inviteCode; if (code) { prompt('Invite code (share this):', code); } else { alert('Failed to generate code'); } }}
                          className="w-full text-left px-2 py-1 rounded bg-gray-100 dark:bg-gray-700/60 text-xs"
                        >
                          Generate invite code
                        </button>
                      )}
                      <button
                        onClick={async () => { const code = prompt('Enter invite code to join a group'); if (code) { try { await axios.post('http://localhost:5000/api/chat/conversations/join', { code }, { headers }); await loadConvos(); } catch { alert('Invalid or failed to join'); } } }}
                        className="w-full text-left px-2 py-1 rounded bg-gray-100 dark:bg-gray-700/60 text-xs"
                      >
                        Join via invite code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              {activeId ? (
                <>
                  <ConversationHeader />
                  <div className="flex-1 overflow-auto space-y-2 pr-1 rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
                    {activeState !== 'accepted' && (
                      <div className="p-2 mb-2 text-sm text-yellow-800 bg-yellow-100 rounded">
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
                              className="w-6 h-6 rounded-full bg-gray-300"
                            />
                          )}
                          <div className={`${mine ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-r-lg rounded-tl-lg'} px-3 py-2 max-w-[80%] break-words`}> 
                            <div className="text-xs opacity-70 mb-0.5">{mine ? 'You' : m.sender.username}</div>
                            {m.replyTo && (
                              <div className={`mb-1 text-xs rounded px-2 py-1 ${mine ? 'bg-blue-500/40' : 'bg-gray-600/20'} opacity-80`}>
                                Replying to: {m.replyTo.isDeleted ? 'Message removed' : (m.replyTo.text || '')}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap break-words">{m.isDeleted ? 'Message removed' : m.text}</div>
                            <div className="mt-1 flex items-center gap-2 text-[11px] opacity-80">
                              <button onClick={() => setReplyTo(m)} className="underline">Reply</button>
                              <div className="relative group inline-block">
                                <button className="underline">React</button>
                                <div className="absolute z-20 hidden group-hover:flex gap-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded px-1 py-1 mt-1">
                                  {['👍','❤️','😂','😮','😢','😡'].map((r) => (
                                    <button key={r} onClick={async () => { await axios.put(`http://localhost:5000/api/chat/messages/${m._id}/react`, { type: r }, { headers }); loadMessages(activeId); }} className="px-1">{r}</button>
                                  ))}
                                </div>
                              </div>
                              {mine && !m.isDeleted && (
                                <>
                                  <button onClick={async () => { const newText = prompt('Edit message', m.text); if (newText !== null) { await axios.put(`http://localhost:5000/api/chat/messages/${m._id}/edit`, { text: newText }, { headers }); loadMessages(activeId); } }} className="underline">Edit</button>
                                  <button onClick={async () => { if (confirm('Delete this message?')) { await axios.delete(`http://localhost:5000/api/chat/messages/${m._id}`, { headers }); loadMessages(activeId); } }} className="underline">Delete</button>
                                </>
                              )}
                            </div>
                            {Array.isArray(m.reactions) && m.reactions.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                                {m.reactions.map((r, i) => (
                                  <span key={i} className={`px-1 rounded ${mine ? 'bg-blue-500/30' : 'bg-gray-500/20'}`}>{r.type} {r.user?.username ? `(${r.user.username})` : ''}</span>
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
                      <div className="text-xs mb-1 flex items-center gap-2">
                      <span>Replying to: {replyTo.isDeleted ? 'Message removed' : (replyTo.text || '')}</span>
                      <button onClick={() => setReplyTo(null)} className="underline">Cancel</button>
                    </div>
                  )}
                  <form onSubmit={send} className="flex gap-2 mt-2" onFocus={() => setTypingApi(true)} onBlur={() => setTypingApi(false)}>
                    <div className="flex items-center flex-1 px-3 py-2 bg-white border rounded-full dark:bg-gray-800 disabled:opacity-50 min-w-0">
                      <input
                        disabled={activeState !== 'accepted'}
                        className="flex-1 bg-transparent outline-none text-sm min-w-0"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type a message"
                      />
                    </div>
                    <button disabled={activeState !== 'accepted'} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-full disabled:opacity-50 shrink-0">Send</button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center flex-1 text-gray-500">Select a chat</div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Floating avatar opener when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-1/2 z-20 hidden -translate-y-1/2 transform md:inline-flex items-center justify-center h-12 w-12 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-lg bg-white/90 dark:bg-gray-800/90 overflow-hidden"
          title="Open chat"
        >
          {user?.avatar ? (
            <img src={`http://localhost:5000${user.avatar}`} alt="open chat" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl">💬</span>
          )}
        </button>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl dark:bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">Create Group</h4>
              <button onClick={() => setShowCreateGroup(false)} className="text-sm px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">Close</button>
            </div>
            <form onSubmit={createGroup} className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Group name</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full rounded border px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="e.g. Friends, Team Alpha"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Add members</label>
                <input
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  className="w-full rounded border px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
                  placeholder="Search users by username or email"
                />
                {memberResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-auto rounded border dark:border-gray-700">
                    {memberResults.map((u) => (
                      <button
                        type="button"
                        key={u._id}
                        onClick={() => addMember(u)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <span className="truncate">{u.username} <span className="text-xs text-gray-500">{u.email}</span></span>
                        <span className="text-xs text-blue-600">Add</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedMembers.length > 0 && (
                <div>
                  <div className="mb-1 text-sm">Selected</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((m) => (
                      <span key={m._id} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {m.username}
                        <button type="button" onClick={() => removeMember(m._id)} className="ml-1 rounded bg-blue-200 px-1 text-[10px] leading-4 dark:bg-blue-800">x</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
                <button disabled={creating || !groupName.trim() || selectedMembers.length === 0} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-60">
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


