import mongoose from 'mongoose';

const PROJECT_STATUSES = ['active', 'completed', 'archived', 'on_hold'];
const BILLING_TYPES = ['hourly', 'fixed', 'non_billable'];

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    managers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'active',
    },
    color: {
      type: String,
      match: [/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color'],
      default: '#06b6d4',
    },
    billingType: {
      type: String,
      enum: BILLING_TYPES,
      default: 'hourly',
    },
    hourlyRate: {
      type: Number,
      min: 0,
      default: null,
    },
    budgetHours: {
      type: Number,
      min: 0,
      default: null,
    },
    budgetAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
projectSchema.index({ name: 1 }, { unique: true });
projectSchema.index({ status: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ managers: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ client: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;

export { PROJECT_STATUSES, BILLING_TYPES };
