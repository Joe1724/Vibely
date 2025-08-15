import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: '' },
    surname: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
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
    notificationSettings: {
      email: {
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        follows: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
      },
      push: {
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        follows: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
      },
    },
    profileViews: {
      type: Number,
      default: 0
    },
    profileThemeColor: {
      type: String,
      default: '#3B82F6' // Default to blue-500
    },
    profileAccentColor: {
      type: String,
      default: '#10B981' // Default to emerald-500
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
