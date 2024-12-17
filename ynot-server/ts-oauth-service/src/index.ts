import express, { Request, Response } from 'express';
import { NodeOAuthClient, Session, NodeSavedState } from '@atproto/oauth-client-node';
import cookieParser from 'cookie-parser';
import { JoseKey } from '@atproto/jwk-jose';

const client = new NodeOAuthClient({
  clientMetadata: {
    client_id: "http://localhost",
    application_type: "web",
    client_name: "Y",
    client_uri: "https://ynot.lol/",
    dpop_bound_access_tokens: true,
    grant_types: ["authorization_code", "refresh_token"],
    redirect_uris: ["http://localhost:8000/callback"],
    response_types: ["code"],
    scope: "atproto:generic",
    token_endpoint_auth_method: "private_key_jwt",
    token_endpoint_auth_signing_alg: "ES256",
    jwks_uri: "http://localhost:8000/oauth/jwks",
  },

  keyset: await Promise.all([
    JoseKey.fromImportable(process.env.PRIVATE_KEY as string),
  ]),

  stateStore: {
    async set(key: string, internalState: NodeSavedState): Promise<void> {},
    async get(key: string): Promise<NodeSavedState | undefined> { return undefined; }, // Replace with actual retrieval logic
    async del(key: string): Promise<void> {},
  },
  sessionStore: {
    async set(sub: string, session: Session): Promise<void> {},
    async get(sub: string): Promise<Session | undefined> { return undefined; }, // Replace with actual retrieval logic
    async del(sub: string): Promise<void> {},
  },

  requestLock,
});

const parseJsonBody = async(req: any): Promise<Record<string, any>> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
  });
};

const server = createServer(async (req, res) => {
  // CORS and OPTIONS handling
  // res.setHeader("Access-Control-Allow-Origin", "*");
  // res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  // res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (url.pathname === '/oauth/login' && method === 'POST') {
    try {
      const { handle } = await parseJsonBody(req);

      if (!handle) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing handle' }));
        return;
      }

      const authUrl = await oauthClient.authorize(handle, {
        scope: 'atproto:generic',
      });
    }
  }

});
