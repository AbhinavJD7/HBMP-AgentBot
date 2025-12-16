#!/usr/bin/env node

/**
 * cPanel Node.js Selector Startup File
 * 
 * This file is used by cPanel's Node.js Selector to start the application.
 * It simply requires the main server file.
 */

// Load environment variables from .env file
require('dotenv').config();

// Set default environment variables if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3080';
process.env.HOST = process.env.HOST || '0.0.0.0';

// Start the server
require('./api/server/index.js');

