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
  const [isOpen, setIsOpen] = useState(true);
  const [showRequests, setShowRequests] = useState(true);
  const [activeState, setActiveState] = useState('accepted');
  const location = useLocation();
  const bottomRef = useRef(null);

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
      </div>
    );
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await axios.post(`http://localhost:5000/api/chat/conversations/${activeId}/messages`, { text }, { headers });
    setText('');
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

  return (
    <aside className={`fixed right-0 md:right-4 top-[80px] bottom-4 w-full md:w-[460px] hidden md:flex z-30`}> 
      <div className="flex flex-col h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-200">Messages</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:opacity-90"
            >
              {isOpen ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="flex h-full gap-3 min-w-0 p-3">
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
                        <img
                          key={m._id}
                          src={m.avatar ? `http://localhost:5000${m.avatar}` : undefined}
                          alt=""
                          className="w-6 h-6 rounded-full border border-white dark:border-gray-800 bg-gray-300"
                        />
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
                            <div className="whitespace-pre-wrap break-words">{m.text}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                  <form onSubmit={send} className="flex gap-2 mt-2">
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
        )}
      </div>
    </aside>
  );
}


