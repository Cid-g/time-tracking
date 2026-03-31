import authService from '../services/auth.service.js';
import catchAsync from '../utils/catchAsync.js';
import config from '../config/index.js';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

export const register = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body, req);

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);

  res.status(201).json({
    success: true,
    data: { user, accessToken },
  });
});

export const login = catchAsync(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body, req);
  const isDesktop = req.body.deviceType === 'desktop';

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, cookieOptions);

  res.json({
    success: true,
    data: {
      user,
      accessToken,
      ...(isDesktop && { refreshToken }),
    },
  });
});

export const refreshToken = catchAsync(async (req, res) => {
  const oldRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE] || req.body.refreshToken;
  if (!oldRefreshToken) {
    return res.status(401).json({ success: false, message: 'No refresh token provided' });
  }

  const isDesktop = !req.cookies[REFRESH_TOKEN_COOKIE] && req.body.refreshToken;
  const result = await authService.refreshToken(oldRefreshToken, req);

  res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, cookieOptions);

  res.json({
    success: true,
    data: {
      accessToken: result.accessToken,
      ...(isDesktop && { refreshToken: result.refreshToken }),
    },
  });
});

export const logout = catchAsync(async (req, res) => {
  const token = req.cookies[REFRESH_TOKEN_COOKIE] || req.body.refreshToken;
  await authService.logout(token, req.user._id, req);

  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieOptions);

  res.json({ success: true, message: 'Logged out successfully' });
});

export const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user._id);

  res.json({
    success: true,
    data: { user },
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  await authService.forgotPassword(req.body.email, req);

  res.json({
    success: true,
    message: 'If that email is registered, a password reset link has been sent.',
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password, req);

  res.json({
    success: true,
    message: 'Password has been reset successfully. Please log in.',
  });
});
