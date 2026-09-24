'use strict';

const { app } = require('@azure/functions');
const { parseAllowedOrigins, pickCorsOrigin } = require('../lib/tts-helpers');
const { jsonResponse, runTts } = require('../lib/tts-run');

app.http('tts', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'tts',
  handler: async (request, context) => {
    let body = null;
    if(request.method === 'POST'){
      try{
        body = await request.json();
      }catch{
        const cors = pickCorsOrigin(request.headers.get('origin'), parseAllowedOrigins(process.env.ALLOWED_ORIGINS));
        return jsonResponse(400, { error: 'Request body must be JSON.' }, cors.origin);
      }
    }

    return runTts({
      method: request.method,
      origin: request.headers.get('origin'),
      body,
      authorization: request.headers.get('authorization'),
      env: process.env,
      log: (message) => context.log(message)
    });
  }
});
