import { describe, it, expect } from 'vitest';
import { cleanText, parseDuration, extractLogoUrl, formatTime, parseAmPmTime } from '../infrastructure/scraper.utils';

describe('cleanText', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(cleanText('  hello  ')).toBe('hello');
  });

  it('should collapse multiple spaces into one', () => {
    expect(cleanText('hello   world')).toBe('hello world');
  });

  it('should remove duplicate words caused by whitespace splitting', () => {
    expect(cleanText('hello hello world')).toBe('hello world');
  });

  it('should handle tabs and newlines as whitespace', () => {
    expect(cleanText('hello\t\nworld')).toBe('hello world');
  });

  it('should return empty string for empty input', () => {
    expect(cleanText('')).toBe('');
  });

  it('should return single word unchanged', () => {
    expect(cleanText('hello')).toBe('hello');
  });
});

describe('parseDuration', () => {
  it('should parse "2 hr 30 min" to 150 minutes', () => {
    expect(parseDuration('2 hr 30 min')).toBe(150);
  });

  it('should parse "1 hr" to 60 minutes', () => {
    expect(parseDuration('1 hr')).toBe(60);
  });

  it('should parse "45 min" to 45 minutes', () => {
    expect(parseDuration('45 min')).toBe(45);
  });

  it('should parse "0 min" to 0 minutes', () => {
    expect(parseDuration('0 min')).toBe(0);
  });

  it('should handle "hrs" variant', () => {
    expect(parseDuration('3 hrs 15 min')).toBe(195);
  });

  it('should return 0 for invalid format without recognized units', () => {
    expect(parseDuration('abc xyz')).toBe(0);
  });
});

describe('extractLogoUrl', () => {
  it('should extract URL from CSS style string', () => {
    const style = 'background-image: url(https://example.com/logo.png); background-size: cover;';
    expect(extractLogoUrl(style)).toBe('https://example.com/logo.png');
  });

  it('should extract URL and remove surrounding quotes', () => {
    const style = "background-image: url('https://example.com/logo.png');";
    expect(extractLogoUrl(style)).toBe('https://example.com/logo.png');
  });

  it('should extract URL and remove double quotes', () => {
    const style = 'background-image: url("https://example.com/logo.png");';
    expect(extractLogoUrl(style)).toBe('https://example.com/logo.png');
  });

  it('should return empty string when no url() is present', () => {
    const style = 'background-color: red;';
    expect(extractLogoUrl(style)).toBe('');
  });
});

describe('formatTime', () => {
  it('should format a Date to HH:MM in 24-hour format', () => {
    const date = new Date(2023, 0, 1, 14, 30);
    expect(formatTime(date)).toBe('14:30');
  });

  it('should format midnight correctly', () => {
    const date = new Date(2023, 0, 1, 0, 0);
    expect(formatTime(date)).toBe('00:00');
  });

  it('should format morning time with leading zero', () => {
    const date = new Date(2023, 0, 1, 9, 5);
    // toLocaleTimeString with hour12:false and 2-digit gives "09:05"
    expect(formatTime(date)).toBe('09:05');
  });

  it('should format 23:59 correctly', () => {
    const date = new Date(2023, 0, 1, 23, 59);
    expect(formatTime(date)).toBe('23:59');
  });
});

describe('parseAmPmTime', () => {
  it('should convert 12:20 AM to 00:20', () => {
    expect(parseAmPmTime('12:20 AM')).toBe('00:20');
  });

  it('should convert 12:00 PM to 12:00', () => {
    expect(parseAmPmTime('12:00 PM')).toBe('12:00');
  });

  it('should convert 1:30 PM to 13:30', () => {
    expect(parseAmPmTime('1:30 PM')).toBe('13:30');
  });

  it('should convert 11:59 PM to 23:59', () => {
    expect(parseAmPmTime('11:59 PM')).toBe('23:59');
  });

  it('should convert 12:00 AM (midnight) to 00:00', () => {
    expect(parseAmPmTime('12:00 AM')).toBe('00:00');
  });

  it('should convert 6:05 AM to 06:05', () => {
    expect(parseAmPmTime('6:05 AM')).toBe('06:05');
  });

  it('should handle lowercase am/pm', () => {
    expect(parseAmPmTime('3:45 pm')).toBe('15:45');
  });

  it('should return original string if no AM/PM pattern matches', () => {
    expect(parseAmPmTime('14:30')).toBe('14:30');
  });

  it('should handle extra surrounding text gracefully by extracting the time', () => {
    expect(parseAmPmTime('around 2:15 PM today')).toBe('14:15');
  });
});
