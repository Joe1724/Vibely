import mongoose from "mongoose";

const reactionTypes = ["love", "haha", "wow"]; // ❤️ 😂 😮

const replySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
    replies: [replySchema],
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, trim: true, default: "" },
    image: { type: String },
    video: { type: String },
    // Back-compat simple likes
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Rich reactions
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: reactionTypes, required: true },
        _id: false,
      },
    ],
    comments: [commentSchema],
    hashtags: [{ type: String, index: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: { type: Number, default: 0 },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    editedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
