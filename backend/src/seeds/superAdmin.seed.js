import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import config from '../config/index.js';
import User from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import logger from '../utils/logger.js';

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB for seeding');

    const existingAdmin = await User.findOne({ role: ROLES.SUPERADMIN });
    if (existingAdmin) {
      logger.info(`Super admin already exists: ${existingAdmin.email}. Skipping seed.`);
      process.exit(0);
    }

    const admin = await User.create({
      firstName: config.seed.adminFirstName,
      lastName: config.seed.adminLastName,
      email: config.seed.adminEmail,
      password: config.seed.adminPassword,
      role: ROLES.SUPERADMIN,
      isActive: true,
      isEmailVerified: true,
    });

    logger.info(`Super admin created: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedSuperAdmin();
