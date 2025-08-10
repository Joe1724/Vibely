import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: '' },
    surname: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    isVerified: { type: Boolean, default: true },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    cover: { type: String, default: '' },
    lastActiveAt: { type: Date },
    followers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
    following: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
    bookmarks: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
