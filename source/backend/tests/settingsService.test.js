const settingsService = require('../services/settingsService');
const fs = require('fs');

jest.mock('fs');
jest.mock('../utils/logger'); // Mock logger to avoid console noise

describe('SettingsService', () => {
    const mockSettings = {
        brainApiKey: 'test-api-key'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getBrainApiKey', () => {
        test('should return API key from file if it exists', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockSettings));
            
            // Re-load settings by instantiating or forcing a load if possible
            // Since the service is a singleton initialized on require, 
            // we might need to mock the constructor behavior or just test the method if it re-reads?
            // Wait, settingsService loads in constructor. 
            // To test "loadSettings", we rely on the fact that `getBrainApiKey` uses `this.settings`.
            // BUT `require` caches dependencies.
            // We should reload the module to test construction?
            // Or just test `saveSettings` and `getBrainApiKey` if we can assume initial load worked?
            
            // Actually, the singleton is created at module level.
            // Let's modify the test to reload module or just inspect the method logic if exposed.
            // `loadSettings` is called in constructor.
            
            // To properly test, I should probably use `jest.isolateModules` or just assume
            // we can test `setBrainApiKey` -> `getBrainApiKey` flow easily.
            // But to test the "load from file priority", I need to control the initial load.
            
            jest.isolateModules(() => {
                const fs = require('fs');
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockReturnValue(JSON.stringify({ brainApiKey: 'loaded-key' }));
                const service = require('../services/settingsService');
                expect(service.getBrainApiKey()).toBe('loaded-key');
            });
        });

        test('should return environment variable if file missing', () => {
            process.env.BRAIN_API_KEY = 'env-key';
            jest.isolateModules(() => {
                const fs = require('fs');
                fs.existsSync.mockReturnValue(false);
                const service = require('../services/settingsService');
                expect(service.getBrainApiKey()).toBe('env-key');
            });
            delete process.env.BRAIN_API_KEY;
        });

        test('should prefer settings file over environment variable', () => {
             process.env.BRAIN_API_KEY = 'env-key';
             jest.isolateModules(() => {
                const fs = require('fs');
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockReturnValue(JSON.stringify({ brainApiKey: 'file-key' }));
                const service = require('../services/settingsService');
                expect(service.getBrainApiKey()).toBe('file-key');
            });
            delete process.env.BRAIN_API_KEY;
        });
    });

    describe('setBrainApiKey', () => {
        test('should save new key to file', () => {
            // We can use the already loaded service from top level if we want, or isolate again.
            // Let's use isolate to respect mocking
             jest.isolateModules(() => {
                const fs = require('fs');
                // Mock load
                fs.existsSync.mockReturnValue(true);
                fs.readFileSync.mockReturnValue('{}');
                
                const service = require('../services/settingsService');
                
                service.setBrainApiKey('new-key');
                
                expect(fs.writeFileSync).toHaveBeenCalled();
                const args = fs.writeFileSync.mock.calls[0];
                expect(args[1]).toContain('new-key');
                expect(service.getBrainApiKey()).toBe('new-key');
            });
        });
    });
});
