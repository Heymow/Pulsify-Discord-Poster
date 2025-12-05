const request = require("supertest");
const app = require("../server");
const path = require("path");
const fs = require("fs");

describe("File Upload API", () => {
  const testFilePath = path.join(__dirname, "test-file.txt");
  const largeFilePath = path.join(__dirname, "large-file.txt");

  beforeAll(() => {
    // Create a dummy test file
    fs.writeFileSync(testFilePath, "This is a test file content.");
    // Create a dummy large file (>10MB)
    const buffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    fs.writeFileSync(largeFilePath, buffer);
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    if (fs.existsSync(largeFilePath)) fs.unlinkSync(largeFilePath);
  });

  it("should upload a valid file successfully", async () => {
    const res = await request(app)
      .post("/api/upload")
      .attach("files", testFilePath);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.files).toHaveLength(1);
    expect(res.body.files[0].originalName).toBe("test-file.txt");
    
    // Verify file exists in uploads
    const uploadedPath = res.body.files[0].path;
    expect(fs.existsSync(uploadedPath)).toBe(true);
    
    // Cleanup uploaded file
    fs.unlinkSync(uploadedPath);
  });

  it("should reject files larger than 10MB", async () => {
    const res = await request(app)
      .post("/api/upload")
      .attach("files", largeFilePath);

    // Multer error handling might return 500 or specific error depending on config
    // But typically it throws an error that express catches.
    // Let's check if it fails.
    expect(res.statusCode).not.toEqual(200);
  });

  it("should reject more than 10 files", async () => {
    const req = request(app).post("/api/upload");
    for (let i = 0; i < 11; i++) {
      req.attach("files", testFilePath);
    }
    const res = await req;
    expect(res.statusCode).not.toEqual(200);
  });
});
