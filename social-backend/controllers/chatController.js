import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import crypto from 'crypto';

// List my conversations (accepted only by default)
export const listConversations = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const includePending = req.query.includePending === 'true';
    const filter = { members: me };
    if (!includePending) filter.state = 'accepted';
    const convos = await Conversation.find(filter)
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('members', 'username avatar')
      .populate('pinnedMessage', 'text sender isDeleted')
      .lean();
    res.json(convos);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// List pending conversation requests for me
export const listRequests = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const requests = await Conversation.find({ state: 'pending', pendingFor: me })
      .populate('members', 'username avatar')
      .lean();
    res.json(requests);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Start or get a 1-1 conversation
export const startDirect = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const other = req.body.userId;
    if (!other) return res.status(400).json({ message: 'userId required' });

    // Check for existing
    let convo = await Conversation.findOne({ isGroup: false, members: { $all: [me, other] }, state: { $ne: 'rejected' } });
    if (convo) return res.json(convo);

    // Determine if request needed (if both follow each other -> accepted)
    // We avoid circular imports; store minimal logic here: if req.body.accepted === true, skip request flow
    const accepted = !!req.body.accepted;

    convo = await Conversation.create({
      isGroup: false,
      members: [me, other],
      admins: [],
      state: accepted ? 'accepted' : 'pending',
      requestedBy: accepted ? undefined : me,
      pendingFor: accepted ? undefined : other,
    });
    res.status(201).json(convo);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const respondRequest = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // conversation id
    const { action } = req.body; // 'accept' | 'reject'
    const convo = await Conversation.findById(id);
    if (!convo || String(convo.pendingFor) !== String(me) || convo.state !== 'pending') {
      return res.status(400).json({ message: 'Invalid request' });
    }
    if (action === 'accept') convo.state = 'accepted';
    else if (action === 'reject') convo.state = 'rejected';
    else return res.status(400).json({ message: 'action must be accept or reject' });
    await convo.save();
    res.json(convo);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create group conversation
export const createGroup = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { name, memberIds } = req.body; // includes creator or not
    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: 'name and memberIds required' });
    }
    const uniqueMembers = Array.from(new Set([me, ...memberIds]));
    const convo = await Conversation.create({ isGroup: true, name, members: uniqueMembers, admins: [me], createdBy: me, state: 'accepted' });
    res.status(201).json(convo);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // conversation id
    const { text } = req.body;
    const convo = await Conversation.findById(id);
    if (!convo || !convo.members.map(String).includes(String(me))) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (convo.state !== 'accepted') {
      return res.status(403).json({ message: 'Conversation pending or rejected' });
    }
    const msg = await Message.create({ conversation: id, sender: me, text, attachments: [] });
    convo.lastMessageAt = new Date();
    await convo.save();
    res.status(201).json(msg);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// List messages
export const listMessages = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // conversation id
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const convo = await Conversation.findById(id);
    if (!convo || !convo.members.map(String).includes(String(me))) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    const messages = await Message.find({ conversation: id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('replyTo', 'text sender isDeleted')
      .populate({ path: 'reactions.user', select: 'username avatar' })
      .lean();
    res.json(messages.reverse());
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate/reset invite code (admins/owner)
export const resetInvite = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // conversation id
    const convo = await Conversation.findById(id);
    if (!convo || !convo.isGroup) return res.status(404).json({ message: 'Group not found' });
    const isAdmin = convo.admins.map(String).includes(String(me)) || String(convo.createdBy) === String(me);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can reset invite' });
    const code = crypto.randomBytes(8).toString('hex');
    convo.inviteCode = code;
    await convo.save();
    res.json({ inviteCode: code });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Join via invite code
export const joinByInvite = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'code required' });
    const convo = await Conversation.findOne({ inviteCode: code, isGroup: true });
    if (!convo) return res.status(404).json({ message: 'Invalid invite' });
    if (!convo.members.map(String).includes(String(me))) {
      convo.members.push(me);
      await convo.save();
    }
    res.json(convo);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Leave group
export const leaveConversation = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params;
    const convo = await Conversation.findById(id);
    if (!convo || !convo.isGroup) return res.status(404).json({ message: 'Group not found' });
    if (!convo.members.map(String).includes(String(me))) return res.status(400).json({ message: 'Not a member' });
    // Prevent owner leave if others present without transfer
    const others = convo.members.filter((m) => String(m) !== String(me));
    if (String(convo.createdBy) === String(me) && others.length > 0) {
      return res.status(400).json({ message: 'Transfer ownership before leaving' });
    }
    convo.members = convo.members.filter((m) => String(m) !== String(me));
    convo.admins = convo.admins.filter((a) => String(a) !== String(me));
    if (convo.members.length === 0) {
      await Conversation.deleteOne({ _id: convo._id });
      return res.json({ ok: true, deleted: true });
    }
    await convo.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Transfer ownership
export const transferOwnership = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params;
    const { newOwnerId } = req.body;
    const convo = await Conversation.findById(id);
    if (!convo || !convo.isGroup) return res.status(404).json({ message: 'Group not found' });
    if (String(convo.createdBy) !== String(me)) return res.status(403).json({ message: 'Only owner can transfer' });
    if (!convo.members.map(String).includes(String(newOwnerId))) return res.status(400).json({ message: 'New owner must be a member' });
    convo.createdBy = newOwnerId;
    const set = new Set(convo.admins.map(String));
    set.add(String(newOwnerId));
    convo.admins = Array.from(set);
    await convo.save();
    res.json(convo);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Pin/unpin a message
export const pinMessage = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // convo id
    const { messageId } = req.body; // if null -> unpin
    const convo = await Conversation.findById(id);
    if (!convo || !convo.isGroup) return res.status(404).json({ message: 'Group not found' });
    const isAdmin = convo.admins.map(String).includes(String(me)) || String(convo.createdBy) === String(me);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can pin' });
    if (messageId) {
      const msg = await Message.findOne({ _id: messageId, conversation: id });
      if (!msg) return res.status(404).json({ message: 'Message not found' });
      convo.pinnedMessage = msg._id;
    } else {
      convo.pinnedMessage = undefined;
    }
    await convo.save();
    res.json(convo);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// React to a message (toggle)
export const reactMessage = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // message id
    const { type } = req.body; // reaction type
    const msg = await Message.findById(id).populate('conversation', 'members');
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (!msg.conversation.members.map(String).includes(String(me))) return res.status(403).json({ message: 'Not allowed' });
    const existing = (msg.reactions || []).find((r) => String(r.user) === String(me) && r.type === type);
    if (existing) {
      msg.reactions = msg.reactions.filter((r) => !(String(r.user) === String(me) && r.type === type));
    } else {
      msg.reactions.push({ user: me, type });
    }
    await msg.save();
    res.json(msg);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Edit own message
export const editMessage = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // message id
    const { text } = req.body;
    const msg = await Message.findById(id).populate('conversation', 'members');
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (String(msg.sender) !== String(me)) return res.status(403).json({ message: 'Only sender can edit' });
    msg.text = text;
    msg.editedAt = new Date();
    await msg.save();
    res.json(msg);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Soft delete message (sender or admin)
export const deleteMessage = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // message id
    const msg = await Message.findById(id).populate('conversation', 'members createdBy admins');
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    const isAdmin = msg.conversation.admins.map(String).includes(String(me)) || String(msg.conversation.createdBy) === String(me);
    if (String(msg.sender) !== String(me) && !isAdmin) return res.status(403).json({ message: 'Not allowed' });
    msg.isDeleted = true;
    msg.text = '';
    await msg.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Reply create helper
export const replyMessage = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // conversation id
    const { text, replyTo } = req.body;
    const convo = await Conversation.findById(id);
    if (!convo || !convo.members.map(String).includes(String(me))) return res.status(403).json({ message: 'Not allowed' });
    if (convo.state !== 'accepted') return res.status(403).json({ message: 'Conversation pending or rejected' });
    const msg = await Message.create({ conversation: id, sender: me, text, replyTo: replyTo || undefined, attachments: [] });
    convo.lastMessageAt = new Date();
    await convo.save();
    res.status(201).json(msg);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Mute/unmute conversation per member
export const muteConversation = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params;
    const { mute } = req.body;
    const convo = await Conversation.findById(id);
    if (!convo || !convo.members.map(String).includes(String(me))) return res.status(403).json({ message: 'Not allowed' });
    if (mute) convo.mutedMembers.set(String(me), true);
    else convo.mutedMembers.delete(String(me));
    await convo.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Typing indicator
export const setTyping = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params;
    const { typing } = req.body; // boolean
    const convo = await Conversation.findById(id);
    if (!convo || !convo.members.map(String).includes(String(me))) return res.status(403).json({ message: 'Not allowed' });
    if (typing) convo.typing.set(String(me), new Date());
    else convo.typing.delete(String(me));
    await convo.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Seen receipts for last message
export const markSeen = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // conversation id
    const last = await Message.findOne({ conversation: id }).sort({ createdAt: -1 });
    if (!last) return res.json({ ok: true });
    if (!last.seenBy.map(String).includes(String(me))) {
      last.seenBy.push(me);
      await last.save();
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update conversation name (group only)
export const renameConversation = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // conversation id
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'name required' });
    const convo = await Conversation.findById(id);
    if (!convo || !convo.isGroup) return res.status(404).json({ message: 'Group not found' });
    const isAdmin = convo.admins.map(String).includes(String(me)) || String(convo.createdBy) === String(me);
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can rename group' });
    convo.name = name.trim();
    await convo.save();
    res.json(convo);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign or revoke admin role (owner only)
export const setAdmin = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // conversation id
    const { userId, makeAdmin } = req.body;
    const convo = await Conversation.findById(id);
    if (!convo || !convo.isGroup) return res.status(404).json({ message: 'Group not found' });
    const isOwner = String(convo.createdBy) === String(me);
    if (!isOwner) return res.status(403).json({ message: 'Only owner can change roles' });
    if (!convo.members.map(String).includes(String(userId))) return res.status(400).json({ message: 'User not in group' });
    const set = new Set(convo.admins.map(String));
    if (makeAdmin) set.add(String(userId));
    else set.delete(String(userId));
    convo.admins = Array.from(set);
    await convo.save();
    res.json(convo);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Set nickname for self or another member (admin can set others; anyone can set own)
export const setNickname = async (req, res) => {
  try {
    const me = req.user._id || req.user.id;
    const { id } = req.params; // conversation id
    const { userId, nickname } = req.body; // userId optional; default me
    const convo = await Conversation.findById(id);
    if (!convo) return res.status(404).json({ message: 'Conversation not found' });
    if (!convo.members.map(String).includes(String(me))) return res.status(403).json({ message: 'Not allowed' });
    const targetId = userId || me;
    const isAdmin = convo.admins.map(String).includes(String(me)) || String(convo.createdBy) === String(me);
    if (String(targetId) !== String(me) && !isAdmin) return res.status(403).json({ message: 'Only admins can set others\' nicknames' });
    const nn = (nickname || '').trim();
    if (nn) convo.nicknames.set(String(targetId), nn);
    else convo.nicknames.delete(String(targetId));
    await convo.save();
    res.json(convo);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  listConversations,
  listRequests,
  startDirect,
  respondRequest,
  createGroup,
  sendMessage,
  listMessages,
  resetInvite,
  joinByInvite,
  leaveConversation,
  transferOwnership,
  pinMessage,
  reactMessage,
  editMessage,
  deleteMessage,
  replyMessage,
  muteConversation,
  setTyping,
  markSeen,
};


