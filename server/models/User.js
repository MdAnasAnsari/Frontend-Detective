import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['detective', 'architect', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    uid: { type: String, required: true, unique: true, trim: true },
    branch: { type: String, default: 'Frontend Engineering', trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    contact: { type: String, default: 'N/A', trim: true },
    // select:false keeps the hash out of every query unless explicitly asked for.
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, default: 'detective' },
    avatar: { type: String, default: '🕵️‍♂️' },
    badge: { type: String, default: 'Field Detective' },
    totalXp: { type: Number, default: 0, min: 0 },
    gamesPlayed: { type: Number, default: 0, min: 0 },
    victories: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Hash on create and on any password change. Runs for .save() only, which is
// why password updates must never go through findOneAndUpdate.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// The React client reads `id`, never `_id`. Map it here so no frontend code
// has to change, and strip the hash defensively in case it was selected.
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.password;
    return ret;
  },
});

export const USER_ROLES = ROLES;
export default mongoose.models.User || mongoose.model('User', userSchema);
