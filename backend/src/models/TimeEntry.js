import mongoose from 'mongoose';

const TIME_ENTRY_STATUS = ['running', 'paused', 'completed'];
const ENTRY_TYPES = ['timer', 'manual'];

const breakSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
  },
  { _id: false }
);

const timeEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    entryType: {
      type: String,
      enum: ENTRY_TYPES,
      required: true,
      default: 'timer',
    },
    status: {
      type: String,
      enum: TIME_ENTRY_STATUS,
      default: 'running',
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
      min: 0,
    },
    breaks: [breakSchema],
    totalBreakDuration: {
      type: Number, // in seconds
      default: 0,
      min: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 30,
      },
    ],
    isBillable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for efficient queries
timeEntrySchema.index({ user: 1, startTime: -1 });
timeEntrySchema.index({ user: 1, status: 1 });
timeEntrySchema.index({ user: 1, startTime: 1, endTime: 1 });
timeEntrySchema.index({ project: 1, startTime: -1 });

// Virtual: net working duration (total minus breaks)
timeEntrySchema.virtual('netDuration').get(function () {
  return Math.max(0, this.duration - this.totalBreakDuration);
});

/**
 * Calculate total break duration from break intervals.
 */
timeEntrySchema.methods.calculateBreakDuration = function () {
  this.totalBreakDuration = this.breaks.reduce((total, brk) => {
    if (brk.startedAt && brk.endedAt) {
      return total + Math.floor((brk.endedAt - brk.startedAt) / 1000);
    }
    return total;
  }, 0);
  return this.totalBreakDuration;
};

/**
 * Calculate total duration from start/end, accounting for incomplete state.
 */
timeEntrySchema.methods.calculateDuration = function () {
  if (this.startTime && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  } else if (this.startTime && this.status === 'running') {
    this.duration = Math.floor((Date.now() - this.startTime) / 1000);
  }
  return this.duration;
};

// Pre-save: auto-calculate durations for completed entries
timeEntrySchema.pre('save', function (next) {
  if (this.status === 'completed' && this.startTime && this.endTime) {
    this.calculateDuration();
    this.calculateBreakDuration();
  }
  next();
});

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);
export default TimeEntry;

export { TIME_ENTRY_STATUS, ENTRY_TYPES };
