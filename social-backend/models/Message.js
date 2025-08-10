import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true },
    attachments: [{ type: String }], // URLs to uploaded files in /uploads
    // Reactions: array of { user, type }
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, trim: true },
      },
    ],
    // Reply: parent message id
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    // Seen receipts
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Soft delete / edit metadata
    isDeleted: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);


