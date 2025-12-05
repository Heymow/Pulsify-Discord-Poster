const request = require('supertest');
const express = require('express');
const discordRoutes = require('../routes/discord');
const queueService = require('../services/queue');
const discordService = require('../services/discord');

// Mock dependencies
jest.mock('../services/queue');
jest.mock('../services/discord');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/discord', discordRoutes);

describe('Discord Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /discord/post', () => {
    it('should add job to queue and return success', async () => {
      queueService.addJob.mockReturnValue('job-123');

      const attachments = [{
        originalName: 'file1.png',
        path: 'uploads/file1.png',
        size: 1024,
        mimetype: 'image/png'
      }];

      const res = await request(app)
        .post('/discord/post')
        .send({
          message: 'Test Message',
          postType: 'Suno link',
          attachments
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.jobId).toBe('job-123');
      
      expect(queueService.addJob).toHaveBeenCalledWith({
        type: 'discord_post',
        message: 'Test Message',
        postType: 'Suno link',
        attachments
      });
    });

    it('should use default postType if not provided', async () => {
      queueService.addJob.mockReturnValue('job-123');

      const res = await request(app)
        .post('/discord/post')
        .send({
          message: 'Test Message'
        });

      expect(res.statusCode).toBe(200);
      expect(queueService.addJob).toHaveBeenCalledWith(expect.objectContaining({
        postType: 'Suno link'
      }));
    });

    it('should validate request body (missing message)', async () => {
      const res = await request(app)
        .post('/discord/post')
        .send({
          postType: 'Suno link'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('POST /discord/login', () => {
    it('should trigger login and return success', async () => {
      discordService.login.mockResolvedValue(true);

      const res = await request(app)
        .post('/discord/login');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(discordService.login).toHaveBeenCalled();
    });

    it('should handle login failure', async () => {
      discordService.login.mockRejectedValue(new Error('Login failed'));

      const res = await request(app)
        .post('/discord/login');

      expect(res.statusCode).toBe(500);
      // Error handler might not be attached in this minimal app, 
      // so express default error handler might return HTML or just 500.
      // But we can check if it failed.
    });
  });

  describe('GET /discord/session', () => {
    it('should return session status', async () => {
      discordService.checkSession.mockResolvedValue(true);

      const res = await request(app)
        .get('/discord/session');

      expect(res.statusCode).toBe(200);
      expect(res.body.connected).toBe(true);
    });
  });

  describe('DELETE /discord/session', () => {
    it('should logout and return success', async () => {
      discordService.logout.mockResolvedValue(true);

      const res = await request(app)
        .delete('/discord/session');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(discordService.logout).toHaveBeenCalled();
    });
  });

  describe('POST /discord/concurrency', () => {
    it('should update concurrency', async () => {
      const res = await request(app)
        .post('/discord/concurrency')
        .send({ concurrency: 4 });

      expect(res.statusCode).toBe(200);
      expect(discordService.setConcurrency).toHaveBeenCalledWith(4);
    });

    it('should validate concurrency range', async () => {
      const res = await request(app)
        .post('/discord/concurrency')
        .send({ concurrency: 10 });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Concurrency must be between');
    });
  });
});
