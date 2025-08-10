import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: '' },
    surname: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    cover: { type: String, default: '' },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
