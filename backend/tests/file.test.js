const { expect } = require('chai');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { 
  uploadFile, 
  downloadFile, 
  deleteFile, 
  validateFileType,
  generateFileName
} = require('../src/utils/fileUtils');

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);

describe('File Handling', () => {
  const testDir = path.join(__dirname, 'test-files');
  const testFile = path.join(testDir, 'test.txt');
  const testImage = path.join(testDir, 'test.jpg');
  const testLargeFile = path.join(testDir, 'large.bin');

  before(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });

    // Create test files
    await writeFile(testFile, 'Test content');
    await writeFile(testImage, Buffer.alloc(1024)); // 1KB image
    await writeFile(testLargeFile, Buffer.alloc(10 * 1024 * 1024)); // 10MB file
  });

  after(async () => {
    // Clean up test files
    try {
      await unlink(testFile);
      await unlink(testImage);
      await unlink(testLargeFile);
      await rmdir(testDir);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('File Upload', () => {
    it('should upload valid files', async () => {
      const result = await uploadFile(testFile, {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024
      });
      expect(result).to.have.property('filename');
      expect(result).to.have.property('path');
    });

    it('should reject files that are too large', async () => {
      try {
        await uploadFile(testLargeFile, {
          originalname: 'large.bin',
          mimetype: 'application/octet-stream',
          size: 10 * 1024 * 1024
        });
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('File size exceeds limit');
      }
    });

    it('should reject invalid file types', async () => {
      try {
        await uploadFile(testFile, {
          originalname: 'test.exe',
          mimetype: 'application/x-msdownload',
          size: 1024
        });
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid file type');
      }
    });
  });

  describe('File Download', () => {
    it('should download existing files', async () => {
      const result = await downloadFile(testFile);
      expect(result).to.have.property('stream');
      expect(result).to.have.property('filename');
      expect(result).to.have.property('mimetype');
    });

    it('should handle non-existent files', async () => {
      try {
        await downloadFile(path.join(testDir, 'nonexistent.txt'));
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('File not found');
      }
    });
  });

  describe('File Deletion', () => {
    it('should delete existing files', async () => {
      const tempFile = path.join(testDir, 'temp.txt');
      await writeFile(tempFile, 'Temp content');
      await deleteFile(tempFile);
      expect(fs.existsSync(tempFile)).to.be.false;
    });

    it('should handle non-existent files', async () => {
      try {
        await deleteFile(path.join(testDir, 'nonexistent.txt'));
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('File not found');
      }
    });
  });

  describe('File Validation', () => {
    it('should validate allowed file types', () => {
      expect(validateFileType('test.jpg', 'image/jpeg')).to.be.true;
      expect(validateFileType('test.png', 'image/png')).to.be.true;
      expect(validateFileType('test.pdf', 'application/pdf')).to.be.true;
    });

    it('should reject disallowed file types', () => {
      expect(validateFileType('test.exe', 'application/x-msdownload')).to.be.false;
      expect(validateFileType('test.bat', 'application/bat')).to.be.false;
    });
  });

  describe('File Name Generation', () => {
    it('should generate unique file names', () => {
      const filename1 = generateFileName('test.jpg');
      const filename2 = generateFileName('test.jpg');
      expect(filename1).to.not.equal(filename2);
      expect(filename1).to.match(/^[a-f0-9]{32}\.jpg$/);
    });

    it('should preserve file extensions', () => {
      const filename = generateFileName('test.jpg');
      expect(filename).to.match(/\.jpg$/);
    });
  });
}); 