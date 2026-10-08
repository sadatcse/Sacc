import mongoose from 'mongoose';

export const POSITION_TYPES = ['advisor', 'executive'];

// One role held by an Executive in a given committee year. Lower `order` shows first.
const CommitteePositionSchema = new mongoose.Schema(
  {
    executive: { type: mongoose.Schema.Types.ObjectId, ref: 'Executive', required: true, index: true },
    year: { type: Number, required: [true, 'Year is required'], min: 1990, max: 2100, index: true },
    type: { type: String, enum: POSITION_TYPES, default: 'executive' },
    role: { type: String, required: [true, 'Role is required'], trim: true, maxlength: 120 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CommitteePositionSchema.index({ executive: 1, year: 1, role: 1 }, { unique: true });

export default mongoose.models.CommitteePosition || mongoose.model('CommitteePosition', CommitteePositionSchema);
