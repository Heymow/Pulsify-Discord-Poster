const errorHandler = require('../middleware/errorHandler');

describe('Middleware Tests', () => {
  
  describe('Auth Middleware', () => {
    let req, res, next, auth;

    beforeEach(() => {
      jest.resetModules();
      process.env.AUTH_USERNAME = 'admin';
      process.env.AUTH_PASSWORD = 'password';
      
      req = {
        method: 'GET',
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        set: jest.fn(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    afterEach(() => {
      delete process.env.ENABLE_AUTH;
      delete process.env.AUTH_USERNAME;
      delete process.env.AUTH_PASSWORD;
    });

    it('should call next if auth is disabled', () => {
      process.env.ENABLE_AUTH = 'false';
      auth = require('../middleware/auth');
      auth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should call next if method is OPTIONS', () => {
      process.env.ENABLE_AUTH = 'true';
      auth = require('../middleware/auth');
      req.method = 'OPTIONS';
      auth(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if no credentials provided', () => {
      process.env.ENABLE_AUTH = 'true';
      auth = require('../middleware/auth');
      auth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith("Access denied");
    });

    it('should return 401 if wrong credentials provided', () => {
      process.env.ENABLE_AUTH = 'true';
      auth = require('../middleware/auth');
      req.headers.authorization = 'Basic ' + Buffer.from('admin:wrong').toString('base64');
      auth(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should call next if correct credentials provided', () => {
      process.env.ENABLE_AUTH = 'true';
      auth = require('../middleware/auth');
      req.headers.authorization = 'Basic ' + Buffer.from('admin:password').toString('base64');
      auth(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error Handler Middleware', () => {
    it('should return 500 and error message', () => {
      const err = new Error('Test Error');
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Mock console.error to avoid noise
      jest.spyOn(console, 'error').mockImplementation(() => {});

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Test Error'
      });
    });
  });
});
