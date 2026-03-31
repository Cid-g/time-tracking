import mongoose from 'mongoose';

const activeWindowSchema = new mongoose.Schema(
  {
    appName: { type: String, required: true, trim: true },
    windowTitle: { type: String, trim: true, default: '' },
    duration: { type: Number, required: true, min: 0 },     // seconds
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
  },
  { _id: false }
);

const activityLogSchema = new mongoose.Schema(
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
    intervalStart: {
      type: Date,
      required: [true, 'Interval start is required'],
    },
    intervalEnd: {
      type: Date,
      required: [true, 'Interval end is required'],
    },
    intervalDuration: {
      type: Number,
      required: true,
      min: 0,
    },
    mouseActivity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    keyboardActivity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    overallActivity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    activeWindows: [activeWindowSchema],
    idleTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    screenshot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Screenshot',
      default: null,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, intervalStart: -1 });
activityLogSchema.index({ timeEntry: 1, intervalStart: 1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90-day retention

activityLogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
