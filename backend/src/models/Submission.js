import mongoose from 'mongoose';

const SUBMISSION_STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected'];
const APPROVAL_ACTIONS = ['submitted', 'approved', 'rejected', 'delegated'];

const approvalChainSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: APPROVAL_ACTIONS,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const projectBreakdownSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    duration: { type: Number, default: 0 },
    entryCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    entries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TimeEntry',
      },
    ],
    period: {
      startDate: {
        type: Date,
        required: [true, 'Period start date is required'],
      },
      endDate: {
        type: Date,
        required: [true, 'Period end date is required'],
      },
    },
    status: {
      type: String,
      enum: SUBMISSION_STATUSES,
      default: 'draft',
    },
    totalDuration: {
      type: Number, // seconds
      default: 0,
      min: 0,
    },
    totalBillable: {
      type: Number, // seconds
      default: 0,
      min: 0,
    },
    entryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    projectBreakdown: [projectBreakdownSchema],
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    approvalChain: [approvalChainSchema],
    version: {
      type: Number,
      default: 1,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
submissionSchema.index({ user: 1, status: 1 });
submissionSchema.index({ user: 1, 'period.startDate': -1 });
submissionSchema.index({ status: 1, submittedAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;

export { SUBMISSION_STATUSES, APPROVAL_ACTIONS };
