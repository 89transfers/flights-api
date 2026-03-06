import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Api } from '../presentation/api';
import { FlightService } from '../application/flight.service';
import type { FlightResponse } from '../domain/types';

// Mock the FlightService module
vi.mock('../application/flight.service', () => ({
  FlightService: {
    searchFlights: vi.fn(),
  },
}));

const mockSearchFlights = vi.mocked(FlightService.searchFlights);

function createRequest(url: string, method: string = 'GET'): Request {
  return new Request(url, { method });
}

const mockFlightResponse: FlightResponse = {
  flights: [
    {
      flight_id: 'test-id-1',
      origin_iata: 'BCN',
      destination_iata: 'LHR',
      origin_name: 'Barcelona',
      destination_name: 'London Heathrow',
      departure: '10:00',
      arrival: '12:30',
      departure_date: '2026-06-15',
      arrival_date: '2026-06-15',
      duration: 150,
      company: 'Vueling',
      company_logo: 'https://example.com/logo.png',
      flight: 'VY 1234',
    },
  ],
  totalDuration: 150,
  price: 89,
  type: 'One way',
  airlineLogo: 'https://example.com/logo.png',
  bookingToken: 'token-123',
};

describe('Api.handleRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Successful request ---
  it('should return 200 with flight data for valid GET /flights', async () => {
    mockSearchFlights.mockResolvedValue(mockFlightResponse);

    const request = createRequest('http://localhost/flights?origin=BCN&destination=LHR&date=2026-06-15');
    const response = await Api.handleRequest(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.flights).toHaveLength(1);
    expect(body.flights[0].origin_iata).toBe('BCN');
    expect(mockSearchFlights).toHaveBeenCalledWith('BCN', 'LHR', '2026-06-15');
  });

  // --- Missing parameters ---
  it('should return 400 when origin is missing', async () => {
    const request = createRequest('http://localhost/flights?destination=LHR&date=2026-06-15');
    const response = await Api.handleRequest(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Missing required parameters');
  });

  it('should return 400 when destination is missing', async () => {
    const request = createRequest('http://localhost/flights?origin=BCN&date=2026-06-15');
    const response = await Api.handleRequest(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Missing required parameters');
  });

  it('should return 400 when date is missing', async () => {
    const request = createRequest('http://localhost/flights?origin=BCN&destination=LHR');
    const response = await Api.handleRequest(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Missing required parameters');
  });

  // --- Invalid date format ---
  it('should return 400 for invalid date format', async () => {
    const request = createRequest('http://localhost/flights?origin=BCN&destination=LHR&date=15-06-2026');
    const response = await Api.handleRequest(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid date format');
  });

  // --- Invalid airport codes ---
  it('should return 400 for airport code with only 2 letters', async () => {
    const request = createRequest('http://localhost/flights?origin=BC&destination=LHR&date=2026-06-15');
    const response = await Api.handleRequest(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid airport code');
  });

  it('should accept and normalize lowercase airport codes', async () => {
    mockSearchFlights.mockResolvedValue(mockFlightResponse);

    const request = createRequest('http://localhost/flights?origin=bcn&destination=lhr&date=2026-06-15');
    const response = await Api.handleRequest(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockSearchFlights).toHaveBeenCalledWith('BCN', 'LHR', '2026-06-15');
  });

  // --- Route not found ---
  it('should return 404 for unknown path', async () => {
    const request = createRequest('http://localhost/nonexistent');
    const response = await Api.handleRequest(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  // --- Method not allowed ---
  it('should return 405 for POST /flights', async () => {
    const request = createRequest('http://localhost/flights?origin=BCN&destination=LHR&date=2026-06-15', 'POST');
    const response = await Api.handleRequest(request);
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.error).toBe('Method not allowed');
  });

  // --- CORS ---
  it('should return 200 with CORS headers for OPTIONS /flights', async () => {
    const request = createRequest('http://localhost/flights', 'OPTIONS');
    const response = await Api.handleRequest(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://89transfers.com');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
  });

  // --- Internal error ---
  it('should return 500 when FlightService throws an error', async () => {
    mockSearchFlights.mockRejectedValue(new Error('Scraper connection failed'));

    const request = createRequest('http://localhost/flights?origin=BCN&destination=LHR&date=2026-06-15');
    const response = await Api.handleRequest(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('Failed to search flights');
  });

  // --- CORS headers on error responses ---
  it('should include CORS headers on error responses', async () => {
    const request = createRequest('http://localhost/flights?origin=BC&destination=LHR&date=2026-06-15');
    const response = await Api.handleRequest(request);

    expect(response.status).toBe(400);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://89transfers.com');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});
