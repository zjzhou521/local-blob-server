import type { Handler } from './handlers/common.js';
import copy from './handlers/copy.js';
import get from './handlers/get.js';
import del from './handlers/del.js';
import head from './handlers/head.js';
import put from './handlers/put.js';

const handlers: Handler[] = [head, get, copy, put, del];

Bun.serve({
  fetch: async (request) => {
    try {
      const url = new URL(request.url);
      for (let handler of handlers) {
        if (handler.test(url, request)) {
          return handler.handle(url, request);
        }
      }

      return Response.json(null, { status: 404 });
    } catch (e) {
      console.error(e);
      return new Response(String((e as any)?.message ?? e), { status: 500 });
    }
  },
});
