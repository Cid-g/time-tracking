import crypto from 'crypto';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import ApiError from '../utils/ApiError.js';
import tokenService from './token.service.js';
import logger from '../utils/logger.js';

class AuthService {
  async register({ firstName, lastName, email, password }, req) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw ApiError.badRequest('Email is already registered');
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'member',
    });

    await AuditLog.create({
      user: user._id,
      action: 'REGISTER',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const accessToken = tokenService.generateAccessToken(user);
    const refreshTokenData = await tokenService.generateRefreshToken(user, req);

    return { user, accessToken, refreshToken: refreshTokenData.token };
  }

  async login({ email, password }, req) {
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      await AuditLog.create({
        action: 'LOGIN_FAILED',
        details: { email, reason: 'User not found' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated. Contact your administrator.');
    }

    // Check if account is locked
    if (user.isLocked) {
      await AuditLog.create({
        user: user._id,
        action: 'LOGIN_FAILED',
        details: { reason: 'Account locked' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw ApiError.unauthorized('Account is temporarily locked due to too many failed attempts. Try again later.');
    }

    // Validate password
    const isValid = await user.isValidPassword(password);
    if (!isValid) {
      await user.incrementLoginAttempts();

      // Check if this attempt caused a lock
      const updatedUser = await User.findById(user._id).select('+loginAttempts +lockUntil');
      if (updatedUser.isLocked) {
        await AuditLog.create({
          user: user._id,
          action: 'ACCOUNT_LOCKED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }

      await AuditLog.create({
        user: user._id,
        action: 'LOGIN_FAILED',
        details: { reason: 'Invalid password' },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      throw ApiError.unauthorized('Invalid email or password');
    }

    // Successful login - reset attempts
    await user.resetLoginAttempts();

    // Update last login info
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save({ validateModifiedOnly: true });

    await AuditLog.create({
      user: user._id,
      action: 'LOGIN_SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const accessToken = tokenService.generateAccessToken(user);
    const refreshTokenData = await tokenService.generateRefreshToken(user, req);

    return { user, accessToken, refreshToken: refreshTokenData.token };
  }

  async refreshToken(oldRefreshToken, req) {
    const result = await tokenService.rotateRefreshToken(oldRefreshToken, req);

    if (!result) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    await AuditLog.create({
      user: result.user._id,
      action: 'TOKEN_REFRESH',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  async logout(refreshToken, userId, req) {
    await tokenService.revokeRefreshToken(refreshToken);

    await AuditLog.create({
      user: userId,
      action: 'LOGOUT',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  async forgotPassword(email, req) {
    const user = await User.findOne({ email });

    // Always log the attempt
    await AuditLog.create({
      user: user?._id || null,
      action: 'PASSWORD_RESET_REQUEST',
      details: { email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Silently return if user not found (prevent email enumeration)
    if (!user) return;

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateModifiedOnly: true });

    // TODO: Send email with reset token in Phase 2
    // For now, log the token in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Password reset token for ${email}: ${resetToken}`);
    }
  }

  async resetPassword(token, newPassword, req) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Revoke all existing refresh tokens (force re-login everywhere)
    await tokenService.revokeAllUserTokens(user._id);

    await AuditLog.create({
      user: user._id,
      action: 'PASSWORD_RESET_SUCCESS',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}

const authService = new AuthService();
export default authService;
