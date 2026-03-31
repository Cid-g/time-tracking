import memberService from '../services/member.service.js';
import catchAsync from '../utils/catchAsync.js';

// =============================================
// Module 6: Productivity Pulse
// =============================================

export const getProductivityScore = catchAsync(async (req, res) => {
  const result = await memberService.getProductivityScore(req.user._id, req.query.period);
  res.json({ success: true, data: result });
});

export const getPeerComparison = catchAsync(async (req, res) => {
  const result = await memberService.getPeerComparison(req.user._id, req.user.role, req.query.period);
  res.json({ success: true, data: result });
});

export const getActivityHeatmap = catchAsync(async (req, res) => {
  const result = await memberService.getActivityHeatmap(req.user._id, req.query.period);
  res.json({ success: true, data: result });
});

export const getTopApps = catchAsync(async (req, res) => {
  const result = await memberService.getTopApps(req.user._id, req.query.period, req.query.limit);
  res.json({ success: true, data: result });
});

// =============================================
// Module 7: Break Analytics
// =============================================

export const getBreakAnalytics = catchAsync(async (req, res) => {
  const result = await memberService.getBreakAnalytics(req.user._id, req.query.period);
  res.json({ success: true, data: result });
});

export const getBreakRecommendations = catchAsync(async (req, res) => {
  const result = await memberService.getBreakRecommendations(req.user._id, req.query.period);
  res.json({ success: true, data: result });
});

export const getBreakSettings = catchAsync(async (req, res) => {
  const result = await memberService.getBreakSettings(req.user._id);
  res.json({ success: true, data: result });
});

export const updateBreakSettings = catchAsync(async (req, res) => {
  const result = await memberService.updateBreakSettings(req.user._id, req.body);
  res.json({ success: true, data: result });
});
