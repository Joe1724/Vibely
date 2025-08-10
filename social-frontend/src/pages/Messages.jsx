import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Messages() {
  const { token } = useContext(AuthContext);
  const [convos, setConvos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const loadConvos = async () => {
    const [c, r] = await Promise.all([
      axios.get('http://localhost:5000/api/chat/conversations', { headers }),
      axios.get('http://localhost:5000/api/chat/requests', { headers }),
    ]);
    setConvos(c.data);
    setRequests(r.data);
  };

  const loadMessages = async (id) => {
    const res = await axios.get(`http://localhost:5000/api/chat/conversations/${id}/messages`, { headers });
    setMessages(res.data);
  };

  useEffect(() => {
    loadConvos();
  }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await axios.post(`http://localhost:5000/api/chat/conversations/${activeId}/messages`, { text }, { headers });
    setText('');
    loadMessages(activeId);
  };

  const respond = async (id, action) => {
    await axios.put(`http://localhost:5000/api/chat/conversations/${id}/respond`, { action }, { headers });
    loadConvos();
  };

  return (
    <div className="grid max-w-5xl grid-cols-1 gap-4 p-4 mx-auto md:grid-cols-3">
      <div className="p-3 bg-white rounded shadow dark:bg-gray-800">
        <h3 className="mb-2 font-semibold">Conversations</h3>
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {convos.map((c) => (
            <button
              key={c._id}
              onClick={() => setActiveId(c._id)}
              className={`w-full text-left px-3 py-2 rounded ${activeId === c._id ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              {c.isGroup ? c.name : c.members.map((m) => m.username).join(', ')}
            </button>
          ))}
        </div>

        <h3 className="mt-4 mb-2 font-semibold">Requests</h3>
        <div className="space-y-2 max-h-[30vh] overflow-auto">
          {requests.map((r) => (
            <div key={r._id} className="flex items-center justify-between gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <span>{r.members.map((m) => m.username).join(', ')}</span>
              <div className="flex gap-2">
                <button onClick={() => respond(r._id, 'accept')} className="px-2 py-1 text-sm text-white bg-blue-600 rounded">Accept</button>
                <button onClick={() => respond(r._id, 'reject')} className="px-2 py-1 text-sm bg-gray-200 rounded dark:bg-gray-700">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-white rounded shadow dark:bg-gray-800 md:col-span-2">
        {activeId ? (
          <div className="flex flex-col h-[70vh]">
            <div className="flex-1 p-2 overflow-auto space-y-2">
              {messages.map((m) => (
                <div key={m._id} className="p-2 bg-gray-100 rounded dark:bg-gray-700">
                  <div className="text-xs text-gray-500">{m.sender.username}</div>
                  <div>{m.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="flex gap-2 mt-2">
              <input className="flex-1 p-2 border rounded" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" />
              <button className="px-3 py-1 text-white bg-blue-600 rounded">Send</button>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[70vh] text-gray-500">Select a conversation</div>
        )}
      </div>
    </div>
  );
}


