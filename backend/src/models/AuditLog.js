import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Auth events
        'REGISTER',
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'TOKEN_REFRESH',
        'PASSWORD_RESET_REQUEST',
        'PASSWORD_RESET_SUCCESS',
        'ACCOUNT_LOCKED',
        'ROLE_CHANGED',
        // Time management events
        'TIME_ENTRY_CREATED',
        'TIME_ENTRY_UPDATED',
        'TIME_ENTRY_DELETED',
        'SUBMISSION_CREATED',
        'SUBMISSION_SUBMITTED',
        'SUBMISSION_APPROVED',
        'SUBMISSION_REJECTED',
        'SUBMISSION_DELEGATED',
        // Admin-specific events
        'ADMIN_TIME_ENTRY_EDITED',
        'ADMIN_BULK_ACTION',
        'ADMIN_DELEGATION',
      ],
    },
    target: {
      type: {
        type: String,
        enum: ['TimeEntry', 'Submission', 'User', 'Project'],
        default: null,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
    changes: {
      before: { type: mongoose.Schema.Types.Mixed, default: null },
      after: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

auditLogSchema.index({ user: 1, action: 1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90-day retention
auditLogSchema.index({ 'target.type': 1, 'target.id': 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
