import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String, trim: true }, // for groups
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Per-member nicknames within this conversation (key: userId string, value: nickname)
    nicknames: { type: Map, of: String, default: {} },
    // Invite link/code for joining groups
    inviteCode: { type: String, index: true },
    // Pinned message reference
    pinnedMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    // Per-member mute
    mutedMembers: { type: Map, of: Boolean, default: {} },
    // Typing map: userId -> Date
    typing: { type: Map, of: Date, default: {} },
    // For 1-1 request flow
    state: { type: String, enum: ['accepted', 'pending', 'rejected'], default: 'accepted' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pendingFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessageAt: { type: Date },
    isFlagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

conversationSchema.index({ members: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);


