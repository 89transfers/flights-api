import { FlightService } from '../application/flight.service';

interface ErrorResponse {
  error: string;
  status: number;
  details?: any;
}

export class Api {
  private static corsHeaders = {
    'Access-Control-Allow-Origin': 'https://89transfers.com',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };

  private static jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data, null, 2), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...this.corsHeaders,
      },
    });
  }

  private static errorResponse(error: Error | string, status: number = 500, details?: any): Response {
    console.error('API Error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      details
    });

    const errorResponse: ErrorResponse = {
      error: error instanceof Error ? error.message : error,
      status,
      details
    };
    return this.jsonResponse(errorResponse, status);
  }

  public static async handleRequest(request: Request): Promise<Response> {
    console.log('Handling request:', request.url);
    
    try {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: this.corsHeaders,
        });
      }

      // Only accept GET requests
      if (request.method !== 'GET') {
        return this.errorResponse('Method not allowed', 405);
      }

      const url = new URL(request.url);
      console.log('Request path:', url.pathname);
      console.log('Request params:', Object.fromEntries(url.searchParams));

      // Flight search endpoint
      if (url.pathname === '/flights') {
        let originCode = url.searchParams.get('origin');
        let destinationCode = url.searchParams.get('destination');
        const date = url.searchParams.get('date');

        // Validate parameters
        if (!originCode || !destinationCode || !date) {
          return this.errorResponse(
            'Missing required parameters: origin, destination, and date are required',
            400,
            { params: { originCode, destinationCode, date } }
          );
        }

        // Normalize airport codes to uppercase
        originCode = originCode.toUpperCase();
        destinationCode = destinationCode.toUpperCase();

        // Validate airport codes
        if (!/^[A-Z]{3}$/.test(originCode) || !/^[A-Z]{3}$/.test(destinationCode)) {
          return this.errorResponse(
            'Invalid airport code format. Must be 3 uppercase letters',
            400,
            { params: { originCode, destinationCode } }
          );
        }

        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return this.errorResponse(
            'Invalid date format. Must be YYYY-MM-DD',
            400,
            { params: { date } }
          );
        }

        try {
          console.log('Searching flights...');
          const flights = await FlightService.searchFlights(
            originCode,
            destinationCode,
            date
          );
          console.log('Search completed successfully');
          return this.jsonResponse(flights);
        } catch (error) {
          console.error('Flight search error:', error);
          return this.errorResponse(
            `Failed to search flights from ${originCode} to ${destinationCode}`,
            500,
            { originalError: error instanceof Error ? error.message : error }
          );
        }
      }

      return this.errorResponse('Not found', 404);
    } catch (error) {
      console.error('Unhandled API error:', error);
      return this.errorResponse(error as Error);
    }
  }
}