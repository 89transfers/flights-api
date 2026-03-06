import { Api } from './presentation/api';

const ALLOWED_ORIGINS = [
  'https://89transfers.com',
  'https://www.89transfers.com',
];

function getCorsOrigin(request: Request): string {
  const origin = request.headers.get('Origin') || '';
  if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.v3-team-2025.pages.dev')) {
    return origin;
  }
  return ALLOWED_ORIGINS[0];
}

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    try {
      return await Api.handleRequest(request);
    } catch (error) {
      console.error('Worker Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        status: 500
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': getCorsOrigin(request),
          'Vary': 'Origin'
        }
      });
    }
  }
};