import submissionService from '../services/submission.service.js';
import catchAsync from '../utils/catchAsync.js';

export const createSubmission = catchAsync(async (req, res) => {
  const submission = await submissionService.createSubmission(req.user._id, req.body);

  res.status(201).json({
    success: true,
    data: { submission },
  });
});

export const submitSubmission = catchAsync(async (req, res) => {
  const submission = await submissionService.submitSubmission(req.params.id, req.user._id);

  res.json({
    success: true,
    data: { submission },
  });
});

export const getSubmission = catchAsync(async (req, res) => {
  const submission = await submissionService.getSubmission(
    req.params.id,
    req.user._id,
    req.user.role
  );

  res.json({
    success: true,
    data: { submission },
  });
});

export const listMySubmissions = catchAsync(async (req, res) => {
  const result = await submissionService.listMySubmissions(req.user._id, req.query);

  res.json({
    success: true,
    data: result,
  });
});

export const listPendingApprovals = catchAsync(async (req, res) => {
  const result = await submissionService.listPendingApprovals(
    req.user._id,
    req.user.role,
    req.query
  );

  res.json({
    success: true,
    data: result,
  });
});

export const reviewSubmission = catchAsync(async (req, res) => {
  const { action, comment } = req.body;
  let submission;

  if (action === 'approved') {
    submission = await submissionService.approveSubmission(req.params.id, req.user._id, comment);
  } else {
    submission = await submissionService.rejectSubmission(req.params.id, req.user._id, comment);
  }

  res.json({
    success: true,
    data: { submission },
  });
});

export const bulkSubmit = catchAsync(async (req, res) => {
  const submissions = await submissionService.bulkSubmit(req.user._id, req.body.submissionIds);

  res.json({
    success: true,
    data: { submissions, count: submissions.length },
  });
});

export const deleteSubmission = catchAsync(async (req, res) => {
  await submissionService.deleteSubmission(req.params.id, req.user._id);

  res.json({
    success: true,
    message: 'Submission deleted successfully',
  });
});
