# Node service: step-by-step setup (Docker only)

You will build a tiny Node web service that runs inside Docker. You do **not** need to install Node on your machine. Only Docker is needed.

When you finish, this will work:

```
curl http://localhost:5002/health
{"status":"healthy"}
```

Based on the [Docker Node.js guide](https://docs.docker.com/guides/nodejs/). The guide uses TypeScript and a database. This version uses plain JavaScript and no database, to keep it small.

## Words you will see

| Word | Plain meaning |
|---|---|
| **Image** | A packaged copy of your app plus everything it needs to run. |
| **Container** | A running image. Think of it as a tiny computer that only runs your app. |
| **Dockerfile** | A recipe that tells Docker how to build the image. |
| **Compose** | A tool that starts one or more containers from a single settings file (`docker-compose.yml`). |
| **Port** | A numbered door into the container. `5002:8080` means "my computer's door 5002 leads to the container's door 8080". |

## Before you start

1. Open a terminal.
2. Go to the `microservices` folder:
   ```bash
   cd /Users/l.obonye/Code/engineering-lead/microservices
   ```
3. Check Docker is running:
   ```bash
   docker --version
   ```
   You should see a version number. If you see "command not found", open Docker Desktop first.

**Stay in the `microservices` folder for every step, unless a step says otherwise.** If you get lost, run `pwd`. It must end in `/microservices`.

---

## Step 1: Create the folders

```bash
mkdir -p node/src
```

This makes a `node` folder with a `src` folder inside it.

Check it worked:

```bash
ls node
```

You should see: `src`

---

## Step 2: Create `package.json`

`package.json` is the list of things your Node app needs. Create the file `node/package.json` and paste this in:

```json
{
  "name": "node-service",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  }
}
```

- `start` runs the app normally. This is used in production.
- `dev` runs the app and restarts it when you save a file. This is used in development.

---

## Step 3: Install Express

Express is a small library that makes web services easy. You install it **through Docker**, because Node is not on your machine:

```bash
docker run --rm -v "$PWD/node":/app -w /app node:22-alpine npm install express
```

What the command does, in order:
- `docker run --rm` starts a temporary container and deletes it when finished.
- `-v "$PWD/node":/app` shares your `node` folder with the container, so it can write files into it.
- `-w /app` tells it to work inside that shared folder.
- `node:22-alpine` is the image that has Node 22 inside.
- `npm install express` is the actual install.

Check it worked:

```bash
ls node
```

You should now see: `node_modules  package-lock.json  package.json  src`

`package-lock.json` pins the exact versions. **Keep it.** The Dockerfile needs it.

If you see `docker: command not found` or "Cannot connect to the Docker daemon", Docker Desktop is not running. Start it and try again.

---

## Step 4: Write the app

Create the file `node/src/index.js` and paste this in:

```js
const express = require('express');

const app = express();
const port = 8080;

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`node service listening on ${port}`);
});
```

This says: when someone asks for `/health`, reply with `{"status":"healthy"}`. It listens on port 8080 **inside** the container.

---

## Step 5: Tell Docker what to ignore

Create the file `node/.dockerignore` and paste this in:

```
node_modules
.env
.git
Dockerfile
```

This stops your local `node_modules` folder from being copied into the image. The image installs its own copy.

---

## Step 6: Write the Dockerfile

Create the file `node/Dockerfile` (no file ending) and paste this in:

```dockerfile
# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# Stage "deps": installs only what production needs.
FROM base AS deps
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci --omit=dev

# Stage "development": installs everything and restarts on changes.
FROM base AS development
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci
COPY src/ src/
USER node
EXPOSE 8080
CMD ["npm", "run", "dev"]

# Stage "final": the small image used in production.
FROM base AS final
ENV NODE_ENV=production
COPY --from=deps /app/node_modules node_modules
COPY package.json ./
COPY src/ src/
USER node
EXPOSE 8080
CMD ["node", "src/index.js"]
```

You do not need to understand every line. The important ideas:

- There are **two usable stages**: `development` and `final`. You choose one later.
- `USER node` makes the app run as a normal user, not as an administrator. This is safer.
- Dependencies are installed before your code is copied. Docker then reuses that work when only your code changes, which makes rebuilds fast.

---

## Step 7: Add the node service to Compose

Open `docker-compose.yml` in the `microservices` folder. It currently looks like this:

```yaml
services:
  dotnet:
    build:
      context: ./dotnet
      target: final
    ports:
      - "5001:8080"

  # node:   add after following docs/node-setup.md
  # go:     add after following docs/go-setup.md
```

Replace the line `# node: ...` with the block below. **Spaces matter in YAML.** The word `node:` must line up exactly under `dotnet:` (2 spaces from the left). Use spaces, never the Tab key.

```yaml
  node:
    build:
      context: ./node
      target: final
    ports:
      - "5002:8080"
```

The finished file should look like this:

```yaml
services:
  dotnet:
    build:
      context: ./dotnet
      target: final
    ports:
      - "5001:8080"

  node:
    build:
      context: ./node
      target: final
    ports:
      - "5002:8080"

  # go:     add after following docs/go-setup.md
```

---

## Step 8: Run in production mode

```bash
docker compose up --build node
```

The first run downloads images, so it can take a minute or two. When you see `node service listening on 8080`, it is running.

Leave that terminal open. **Open a second terminal** and run:

```bash
curl http://localhost:5002/health
```

Expected answer:

```
{"status":"healthy"}
```

To stop it, go back to the first terminal and press `Ctrl+C`. Then clean up:

```bash
docker compose down
```

---

## Step 9: Run in development mode

Development mode restarts the app each time you save a file in `node/src`. It is optional now, but you will want it once we write real code.

1. Open `docker-compose.dev.yml` in the `microservices` folder. It currently contains a `dotnet` section.
2. Add this block under `services:`, at the same indentation as `dotnet:`:

   ```yaml
     node:
       build:
         target: development
       environment:
         - NODE_ENV=development
       develop:
         watch:
           - action: sync
             path: ./node/src
             target: /app/src
           - action: rebuild
             path: ./node/package.json
   ```

   The file should now have both `dotnet:` and `node:` under `services:`.

3. Start it with `watch`. This builds the image, starts the container and keeps watching your files:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml watch node
   ```

4. Open a **second terminal** and check it:

   ```bash
   curl http://localhost:5002/health
   ```

5. Try the live reload. Edit `node/src/index.js`, change `'healthy'` to `'ok'`, and save. After a few seconds, run the `curl` again. It should now say `ok`.

   Live reload only works with `watch`. Plain `up --build` does not copy your changes into the container.

6. Stop with `Ctrl+C`, then:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml down
   ```

---

## If something goes wrong

| What you see | What it means | What to do |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop is not running. | Start Docker Desktop and wait for it to say it is running. |
| `port is already allocated` or `address already in use` | Something else is using port 5002. | Run `docker compose down`, or change `5002` in the compose file to another number such as `5012`. |
| `npm ci` fails with "package-lock.json not found" | Step 3 did not finish. | Run Step 3 again and check `ls node`. |
| `yaml: ... mapping values are not allowed` | The compose file has wrong spacing. | Compare with the finished file in Step 7. Use spaces, not Tab. |
| `curl` says "connection refused" | The container has not finished starting. | Wait 5 seconds and try again. Check the first terminal for errors. |

Useful checks:

```bash
docker compose ps          # which containers are running
docker compose logs node   # what the node container printed
```

## Done

You now have a Node service in Docker, in production and development modes. Tell me when you have finished, and we will add it to the architecture.
