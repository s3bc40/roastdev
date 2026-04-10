import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    sessionCode: { type: String, required: true },
    socketId: { type: String, required: true },
    answerId: { type: String, required: true },
  },
  { timestamps: true }
);

voteSchema.index({ sessionCode: 1, socketId: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);
