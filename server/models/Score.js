import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    username: { type: String, required: true },
    avatar: { type: String, default: '🕵️‍♂️' },
    xp: { type: Number, required: true, min: 0 },
    // Required so the leaderboard difficulty filter can never hit undefined.
    difficulty: { type: String, required: true },
    caseId: { type: String, default: null },
    caseTitle: { type: String, default: 'Field Assignment' },
    timeLeft: { type: Number, required: true, min: 0 },
    roomCode: { type: String, default: null, uppercase: true, trim: true },
    date: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Supports the default leaderboard sort (xp desc, then timeLeft desc).
scoreSchema.index({ xp: -1, timeLeft: -1 });

scoreSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    ret.userId = ret.userId ? String(ret.userId) : null;
    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Score || mongoose.model('Score', scoreSchema);
