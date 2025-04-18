// @bun
// src/handlers/copy.ts
import fs from "fs/promises";
import path from "path";

// src/handlers/common.ts
var storePath = process.env.VERCEL_STORE_PATH ?? ".store";
function defineHandler(handler) {
  return handler;
}

// src/handlers/copy.ts
var copy_default = defineHandler({
  name: "put",
  test(url, request) {
    return request.method === "PUT" && url.searchParams.has("fromUrl");
  },
  async handle(url, request) {
    const fromPath = url.searchParams.get("fromUrl");
    const metaFile = Bun.file(path.join(storePath, fromPath + "._vercel_mock_meta_"));
    const file = Bun.file(path.join(storePath, fromPath));
    if (await metaFile.exists() && await file.exists()) {
      const meta = await metaFile.json();
      meta.url = new URL(url.pathname, url.origin).toString();
      meta.downloadUrl = new URL(url.pathname + "?download=1", url.origin).toString();
      meta.pathname = url.pathname;
      meta.uploadedAt = new Date;
      await fs.mkdir(path.dirname(path.join(storePath, url.pathname)), { recursive: true });
      await Bun.write(path.join(storePath, url.pathname + "._vercel_mock_meta_"), JSON.stringify(meta, undefined, 2));
      await fs.cp(path.join(storePath, fromPath), path.join(storePath, url.pathname));
      return Response.json(meta);
    } else {
      return new Response(null, { status: 404 });
    }
  }
});

// src/handlers/get.ts
import path2 from "path";
var get_default = defineHandler({
  name: "get",
  test(url, request) {
    return request.method === "GET" && !url.searchParams.has("url");
  },
  async handle(url, request) {
    const isDownload = url.searchParams.get("download") === "1";
    const metaFile = Bun.file(path2.join(storePath, url.pathname + "._vercel_mock_meta_"));
    const file = Bun.file(path2.join(storePath, url.pathname));
    if (await metaFile.exists() && await file.exists()) {
      const data = await metaFile.json();
      const headers = new Headers({
        "Content-Type": data.contentType,
        "Content-Length": String(data.size),
        "Cache-Control": data.cacheControl,
        "Last-Modified": String(new Date(data.uploadedAt))
      });
      if (isDownload) {
        headers.set("Content-Disposition", data.contentDisposition);
      }
      return new Response(file, { headers });
    } else {
      return new Response(null, { status: 404 });
    }
  }
});

// src/handlers/del.ts
import path3 from "path";
import { unlink } from "fs/promises";
var del_default = defineHandler({
  name: "del",
  test(requestUrl, request) {
    return request.method === "POST" && requestUrl.pathname === "/delete";
  },
  async handle(requestUrl, request) {
    const body = await request.json();
    const urlsArray = body.urls;
    if (urlsArray.length) {
      for (let url of urlsArray) {
        const pathnameFromOrigin = url.replace(requestUrl.origin, "");
        const fileUrl = path3.join(storePath, pathnameFromOrigin);
        const metaFileUrl = fileUrl + "._vercel_mock_meta_";
        const file = Bun.file(fileUrl);
        const metaFile = Bun.file(metaFileUrl);
        if (await file.exists()) {
          await unlink(fileUrl);
        }
        if (await metaFile.exists()) {
          await unlink(metaFileUrl);
        }
      }
    }
    return Response.json(null, { status: 200 });
  }
});

// src/handlers/head.ts
import path4 from "path";
var head_default = defineHandler({
  name: "head",
  test(url, request) {
    return request.method === "GET" && url.pathname === "/" && url.searchParams.has("url");
  },
  async handle(url, request) {
    const headPathname = url.searchParams.get("url");
    const file = Bun.file(path4.join(storePath, headPathname + "._vercel_mock_meta_"));
    if (await file.exists()) {
      const data = await file.json();
      return Response.json(data);
    } else {
      return new Response(null, { status: 404 });
    }
  }
});

// src/handlers/put.ts
import path5 from "path";
var put_default = defineHandler({
  name: "put",
  test(url, request) {
    return request.method === "PUT" && !url.searchParams.has("fromUrl");
  },
  async handle(url, request) {
    const contentDisposition = request.headers.get("Content-Disposition") || "attachment";
    const blob = await request.blob();
    const contentType = blob.type || request.headers.get("X-Content-Type");
    const cacheControlRaw = request.headers.get("x-cache-control-max-age");
    let cacheControl;
    if (cacheControlRaw) {
      cacheControl = `max-age=${cacheControlRaw}`;
    } else {
      cacheControl = "max-age=31536000";
    }
    const data = {
      url,
      downloadUrl: new URL("?download=1", url).toString(),
      pathname: url.pathname,
      size: blob.size,
      contentType,
      cacheControl,
      uploadedAt: new Date,
      contentDisposition
    };
    await Bun.write(path5.join(storePath, url.pathname), blob, { createPath: true });
    await Bun.write(path5.join(storePath, url.pathname + "._vercel_mock_meta_"), JSON.stringify(data, undefined, 2), { createPath: true });
    return Response.json({
      url,
      downloadUrl: url,
      pathname: url.pathname,
      contentType,
      contentDisposition
    });
  }
});

// src/server.ts
var handlers = [head_default, get_default, copy_default, put_default, del_default];
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
      return new Response(String(e?.message ?? e), { status: 500 });
    }
  }
});
