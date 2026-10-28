# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
ARG TARGETARCH
WORKDIR /source

# Restore in its own layer so NuGet packages are cached between builds.
COPY src/Sample.Api/Sample.Api.csproj src/Sample.Api/
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet restore src/Sample.Api/Sample.Api.csproj -a ${TARGETARCH/amd64/x64}

COPY src/ src/
RUN --mount=type=cache,id=nuget,target=/root/.nuget/packages \
    dotnet publish src/Sample.Api/Sample.Api.csproj -a ${TARGETARCH/amd64/x64} --use-current-runtime --self-contained false --no-restore -o /app

# Development stage, used by `docker compose watch`.
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS development
WORKDIR /source
COPY src/ src/
EXPOSE 8080
CMD ["dotnet", "run", "--project", "src/Sample.Api", "--no-launch-profile"]

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
WORKDIR /app
COPY --from=build /app .

# Run as a non-root user.
ARG UID=10001
RUN adduser --disabled-password --gecos "" --home "/nonexistent" --shell "/sbin/nologin" --no-create-home --uid "${UID}" appuser
USER appuser

EXPOSE 8080
ENTRYPOINT ["dotnet", "Sample.Api.dll"]
