const { expect } = require('chai');
const { 
  validateEmail, 
  validatePassword, 
  sanitizeInput, 
  formatDate, 
  generateSlug,
  calculatePagination
} = require('../src/utils/helpers');

describe('Utility Functions', () => {
  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).to.be.true;
      expect(validateEmail('user.name@domain.co.uk')).to.be.true;
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('test@')).to.be.false;
      expect(validateEmail('@example.com')).to.be.false;
      expect(validateEmail('test@example')).to.be.false;
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('Password123!')).to.be.true;
      expect(validatePassword('Str0ngP@ss')).to.be.true;
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('password')).to.be.false;
      expect(validatePassword('12345678')).to.be.false;
      expect(validatePassword('Password')).to.be.false;
    });
  });

  describe('Input Sanitization', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).to.equal('alert("xss")');
      expect(sanitizeInput('<div>Hello</div>')).to.equal('Hello');
    });

    it('should escape special characters', () => {
      expect(sanitizeInput('&<>"\'')).to.equal('&amp;&lt;&gt;&quot;&#39;');
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      expect(formatDate(date)).to.equal('2024-01-01 12:00:00');
    });

    it('should handle different date formats', () => {
      const date = new Date('2024-12-31T23:59:59Z');
      expect(formatDate(date, 'YYYY-MM-DD')).to.equal('2024-12-31');
    });
  });

  describe('Slug Generation', () => {
    it('should generate valid slugs', () => {
      expect(generateSlug('Hello World')).to.equal('hello-world');
      expect(generateSlug('Test & Test')).to.equal('test-test');
      expect(generateSlug('Special!@#$%^&*()')).to.equal('special');
    });

    it('should handle empty strings', () => {
      expect(generateSlug('')).to.equal('');
    });
  });

  describe('Pagination Calculation', () => {
    it('should calculate correct pagination values', () => {
      const result = calculatePagination(100, 10, 1);
      expect(result).to.deep.equal({
        total: 100,
        page: 1,
        pages: 10,
        limit: 10,
        skip: 0
      });
    });

    it('should handle edge cases', () => {
      const result = calculatePagination(0, 10, 1);
      expect(result).to.deep.equal({
        total: 0,
        page: 1,
        pages: 0,
        limit: 10,
        skip: 0
      });
    });
  });
}); 