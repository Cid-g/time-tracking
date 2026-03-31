import mongoose from 'mongoose';

const screenshotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    timeEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeEntry',
      required: [true, 'Time entry is required'],
      index: true,
    },
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    mimeType: {
      type: String,
      default: 'image/jpeg',
      enum: ['image/jpeg', 'image/png'],
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
    capturedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Query by user (admin/team views)
screenshotSchema.index({ user: 1, capturedAt: -1 });

// Query by time entry (screenshot gallery per entry)
screenshotSchema.index({ timeEntry: 1, capturedAt: 1 });

// 90-day auto-deletion matching ActivityLog retention
screenshotSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

screenshotSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    delete ret.filePath; // Never expose server file paths to clients
    return ret;
  },
});

const Screenshot = mongoose.model('Screenshot', screenshotSchema);
export default Screenshot;
