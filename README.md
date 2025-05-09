# Vercel blob server

> Mocking a vercel blob server **_ONLY FOR LOCAL DEVELOPMENT_**.

The code is **NOT TESTED**, contributions are welcome.

Supported API:

- `get`
- `head`
- `put`
- `copy`
- `del`

## Run with docker compose

1. Create docker image locally.

```shell
$ pnpm i
$ pnpm run build
$ pnpm run build:docker
```

2. Add container config to your docker compose

- volume: `/var/vercel-blob-store` stores all uploaded file and meta info, and it gets mapped at `./dev/vercel-blob-store` as host locally
- port: `3000`: container http server port

```yaml
vercel-blob-server:
  ports:
    - '9966:3000'
  image: vercel-blob-server
  volumes:
    - ./dev/vercel-blob-store:/var/vercel-blob-store
```

3. Edit your .env.local

```dotenv
# This env cheats @vercel/blob's internal pre checks
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_somefakeid_nonce
# This port should be same to your mapped port
VERCEL_BLOB_API_URL=http://localhost:9966
```

4. Just use `@vercel/blob` as before

5. Deploy the docker container: `docker compose up`

6. The file url returned by blob will be at `http://localhost:9966/poster_1.png`

7. blob version requirement: 0.24.1 (does not support 1.0.0 - `http://localhost:9966/?pathname=poster_1.png`)

   ```shell
   pnpm add @vercel/blob@0.24.1
   ```

   
