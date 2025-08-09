import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

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
    const convo = await Conversation.create({ isGroup: true, name, members: uniqueMembers, admins: [me], state: 'accepted' });
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
      .lean();
    res.json(messages.reverse());
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
};


