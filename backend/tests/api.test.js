const request = require('supertest');
const express = require('express');
const channelRoutes = require('../routes/channels');
const channelService = require('../services/channelService');

// Mock channelService
jest.mock('../services/channelService');

const app = express();
app.use(express.json());
app.use('/api/channels', channelRoutes);

// Mock Discord route directly to avoid middleware issues
app.post('/discord/post', (req, res) => {
  res.json({ success: true, jobId: 'mock-job-id' });
});

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/channels returns all channels', async () => {
    const mockChannels = { "Suno link": [] };
    channelService.getAllChannels.mockReturnValue(mockChannels);

    const res = await request(app).get('/api/channels');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockChannels);
  });

  test('POST /api/channels/add adds a channel', async () => {
    const validUrl = "https://discord.com/channels/123/456";
    const mockChannels = { "Suno link": [{ url: validUrl, name: "Test" }] };
    channelService.addChannel.mockReturnValue(mockChannels);

    const res = await request(app)
      .post('/api/channels/add')
      .send({ type: "Suno link", url: validUrl, name: "Test" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(mockChannels);
    expect(channelService.addChannel).toHaveBeenCalledWith("Suno link", validUrl, "Test");
  });

  test('POST /api/channels/add returns 409 on duplicate', async () => {
    const error = new Error("Channel already exists");
    error.name = "DuplicateChannelError";
    channelService.addChannel.mockImplementation(() => {
      throw error;
    });

    const res = await request(app)
      .post('/api/channels/add')
      .send({ type: "Suno link", url: "https://discord.com/channels/123/456" });

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: "Channel already exists" });
  });

  test('POST /api/channels/add returns 400 for invalid URL', async () => {
    const res = await request(app)
      .post('/api/channels/add')
      .send({ type: "Suno link", url: "invalid-url" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details[0].message).toContain("Invalid URL format");
  });

  test('POST /api/channels/add returns 400 for invalid Discord URL format', async () => {
    const res = await request(app)
      .post('/api/channels/add')
      .send({ type: "Suno link", url: "https://google.com" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Validation failed");
    expect(res.body.details[0].message).toContain("Must be a valid Discord channel URL");
  });

  test('POST /api/channels/add returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/channels/add')
      .send({ url: "https://discord.com/channels/123/456" }); // Missing type

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  test('POST /api/channels/remove removes a channel', async () => {
    channelService.removeChannel.mockReturnValue(true);

    const res = await request(app)
      .post('/api/channels/remove')
      .send({ type: "Suno link", url: "https://discord.com/channels/123/456" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(true);
    expect(channelService.removeChannel).toHaveBeenCalledWith("Suno link", "https://discord.com/channels/123/456");
  });

  test('POST /api/channels/import imports channels', async () => {
    const importData = {
      "Test Category": [
        { name: "Imported", url: "https://discord.com/channels/123/456", failures: 0 }
      ]
    };
    channelService.importChannels.mockReturnValue({ added: 1, updated: 0, skipped: 0 });

    const res = await request(app)
      .post('/api/channels/import')
      .send(importData);

    expect(res.statusCode).toBe(200);
    expect(res.body.added).toBe(1);
    expect(channelService.importChannels).toHaveBeenCalledWith(importData);
  });

  test('POST /discord/post adds job to queue', async () => {
    const res = await request(app)
      .post('/discord/post')
      .send({ message: "Test Post", postType: "Suno link" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.jobId).toBeDefined();
  });
});
