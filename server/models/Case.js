import mongoose from 'mongoose';

/**
 * A DOM anomaly the player has to spot and fix. `id` is a plain string rather
 * than an ObjectId because the game loop in src/store.ts matches on it.
 */
const anomalySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'Layout' },
    points: { type: Number, default: 100, min: 0 },
    errorClass: { type: String, default: '' },
    fixedClass: { type: String, default: '' },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const noteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    author: { type: String, required: true },
    role: { type: String, default: 'detective' },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    difficulty: { type: String, required: true, trim: true },
    layoutType: { type: String, default: 'SaaS' },
    roleTitle: { type: String, default: '' },
    timeLimit: { type: Number, default: 45, min: 5 },
    attemptsLimit: { type: Number, default: 10, min: 1 },
    author: { type: String, default: 'Unknown' },
    isOfficial: { type: Boolean, default: false },
    errors: { type: [anomalySchema], default: [] },
    notes: { type: [noteSchema], default: [] },
  },
  {
    timestamps: true,
    // `errors` collides with a Mongoose-reserved name. Verified safe here:
    // validation still reports on ValidationError.errors, doc.errors holds the
    // anomalies, and toJSON emits them. Renaming would break the game loop in
    // src/store.ts, which matches anomalies on case.errors[].id.
    suppressReservedKeysWarning: true,
  }
);

caseSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export default mongoose.models.Case || mongoose.model('Case', caseSchema);
