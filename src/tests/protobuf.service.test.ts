import { describe, it, expect } from 'vitest';
import { ProtobufService } from '../infrastructure/protobuf.service';

describe('ProtobufService.encodeFlightSearch', () => {
  it('should return a base64url-encoded string', async () => {
    const result = await ProtobufService.encodeFlightSearch('BCN', 'LHR', '2026-06-15');

    // Base64url uses only A-Z, a-z, 0-9, -, _ (no +, /, or = padding)
    expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('should contain the origin airport code in the encoded data', async () => {
    const result = await ProtobufService.encodeFlightSearch('BCN', 'LHR', '2026-06-15');

    // Decode the base64url back to binary and check it contains "BCN"
    const base64 = result.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    expect(decoded).toContain('BCN');
  });

  it('should contain the destination airport code in the encoded data', async () => {
    const result = await ProtobufService.encodeFlightSearch('BCN', 'LHR', '2026-06-15');

    const base64 = result.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    expect(decoded).toContain('LHR');
  });

  it('should contain the date in the encoded data', async () => {
    const result = await ProtobufService.encodeFlightSearch('BCN', 'LHR', '2026-06-15');

    const base64 = result.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    expect(decoded).toContain('2026-06-15');
  });

  it('should produce different encodings for different inputs', async () => {
    const result1 = await ProtobufService.encodeFlightSearch('BCN', 'LHR', '2026-06-15');
    const result2 = await ProtobufService.encodeFlightSearch('MAD', 'JFK', '2026-07-20');

    expect(result1).not.toBe(result2);
  });
});
