import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String, trim: true }, // for groups
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // For 1-1 request flow
    state: { type: String, enum: ['accepted', 'pending', 'rejected'], default: 'accepted' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pendingFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

conversationSchema.index({ members: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);


