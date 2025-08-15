import mongoose from 'mongoose';

const OtpCodeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    purpose: { type: String, required: true, enum: ['register', 'reset_password'] },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date },
    sendCount: { type: Number, default: 1 },
    // store pending user data for registration
    pending: {
      username: String,
      firstName: String,
      middleName: String,
      surname: String,
      passwordHash: String,
    },
  },
  { timestamps: true }
);

// TTL index for automatic cleanup
OtpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OtpCode', OtpCodeSchema);
