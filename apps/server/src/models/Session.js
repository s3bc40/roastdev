import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    questionId: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    usedQuestionIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Session', sessionSchema);
