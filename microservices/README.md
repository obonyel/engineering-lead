# Microservices

Parent folder for the backend proof-of-concept (POC) services. Each language runs in its own Docker container, so no SDKs are needed on the host. Only Docker is required.

| Folder | Status | Host port |
|---|---|---|
| `dotnet/` | scaffolded (placeholder `/health` endpoint) | 5001 |
| `node/` | to create: [docs/node-setup.md](docs/node-setup.md) | 5002 |
| `go/` | to create: [docs/go-setup.md](docs/go-setup.md) | 5003 |

## Run the .NET service

Run all commands from this folder (`microservices/`). The container listens on 8080 and is published on host port 5001.

### Production mode

Builds the `final` stage: a published, Release build on the small ASP.NET runtime image, running as a non-root user.

```bash
docker compose up --build dotnet        # foreground; Ctrl+C to stop
docker compose up --build -d dotnet     # or detached
curl http://localhost:5001/health       # {"status":"healthy"}
docker compose down                     # stop and remove
```

### Development mode

Builds the `development` stage: the full SDK image running `dotnet run` with `ASPNETCORE_ENVIRONMENT=Development`. Compose Watch rebuilds the container when files under `dotnet/src` change.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml watch
curl http://localhost:5001/health
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

To run it without watching, use `up --build` in place of `watch`.

Notes:
- Both modes use port 5001, so run only one at a time.
- After changing the Dockerfile itself, add `--build` (production) or restart `watch` (development).

Architecture is not decided yet. Add services to `docker-compose.yml` as they are agreed.
