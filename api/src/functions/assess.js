'use strict';

const { app } = require('@azure/functions');
const { parseAllowedOrigins, pickCorsOrigin } = require('../lib/tts-helpers');
const { jsonResponse, runAssess } = require('../lib/assess-run');

app.http('assess', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'assess',
  handler: async (request, context) => {
    let body = null;
    if(request.method === 'POST'){
      try{
        body = await request.json();
      }catch{
        const cors = pickCorsOrigin(request.headers.get('origin'), parseAllowedOrigins(process.env.ALLOWED_ORIGINS));
        return jsonResponse(400, { error: 'Request body must be JSON.', code: 'BAD_REQUEST' }, cors.origin);
      }
    }

    return runAssess({
      method: request.method,
      origin: request.headers.get('origin'),
      body,
      env: process.env,
      log: (message) => context.log(message)
    });
  }
});
