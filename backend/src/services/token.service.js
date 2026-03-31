import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/index.js';
import RefreshToken from '../models/RefreshToken.js';
import logger from '../utils/logger.js';

class TokenService {
  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user._id,
        email: user.email,
        role: user.role,
      },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiry }
    );
  }

  async generateRefreshToken(user, req, family = null) {
    const tokenFamily = family || crypto.randomUUID();
    const token = crypto.randomBytes(40).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshToken.create({
      token: this.hashToken(token),
      user: user._id,
      family: tokenFamily,
      expiresAt,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip,
    });

    return { token, family: tokenFamily };
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async rotateRefreshToken(oldPlainToken, req) {
    const hashedToken = this.hashToken(oldPlainToken);
    const existingToken = await RefreshToken.findOne({ token: hashedToken }).populate('user');

    if (!existingToken) {
      return null;
    }

    // Reuse detection: if token is already revoked, revoke entire family
    if (existingToken.isRevoked) {
      logger.warn(`Refresh token reuse detected for family ${existingToken.family}`);
      await RefreshToken.updateMany(
        { family: existingToken.family },
        { $set: { isRevoked: true } }
      );
      return null;
    }

    // Check expiry
    if (existingToken.expiresAt < new Date()) {
      return null;
    }

    // Check user is still active
    if (!existingToken.user || !existingToken.user.isActive) {
      return null;
    }

    // Revoke old token
    existingToken.isRevoked = true;

    // Generate new token in same family
    const newTokenData = await this.generateRefreshToken(
      existingToken.user,
      req,
      existingToken.family
    );

    existingToken.replacedByToken = this.hashToken(newTokenData.token);
    await existingToken.save();

    const accessToken = this.generateAccessToken(existingToken.user);

    return {
      accessToken,
      refreshToken: newTokenData.token,
      user: existingToken.user,
    };
  }

  async revokeRefreshToken(plainToken) {
    if (!plainToken) return;
    const hashedToken = this.hashToken(plainToken);
    await RefreshToken.updateOne(
      { token: hashedToken },
      { $set: { isRevoked: true } }
    );
  }

  async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { $set: { isRevoked: true } }
    );
  }
}

const tokenService = new TokenService();
export default tokenService;
