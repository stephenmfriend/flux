# Production Deployment Guide

This guide shows how to deploy Flux server in production using systemd (Linux native) or Docker (cross-platform).

## Option 1: Systemd Service (Recommended for Linux)

Systemd is the standard Linux init system. It manages services, handles crashes, and integrates with system logging.

### Benefits

- ✅ **Auto-restart** - Restarts on crashes
- ✅ **Auto-start** - Starts on boot
- ✅ **Logging** - Integrated with journalctl
- ✅ **Resource limits** - CPU/memory constraints
- ✅ **Native** - No containers, direct OS integration

### Setup Steps

#### 1. Create systemd service file

```bash
sudo nano /etc/systemd/system/flux-server.service
```

```ini
[Unit]
Description=Flux Task Management Server
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/flux/packages/server
Environment="PORT=3001"
Environment="SUPABASE_URL=https://your-project.supabase.co"
Environment="SUPABASE_KEY=your-anon-key-here"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/bun run start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security hardening (optional)
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/path/to/flux/.flux

# Resource limits (optional)
LimitNOFILE=65536
MemoryMax=1G
CPUQuota=200%

[Install]
WantedBy=multi-user.target
```

**Important**: Replace:
- `your-username` - Your Linux username
- `/path/to/flux` - Absolute path to your Flux installation
- `SUPABASE_URL` and `SUPABASE_KEY` - Your actual credentials

#### 2. Reload systemd and enable service

```bash
# Reload systemd to recognize new service
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable flux-server

# Start the service now
sudo systemctl start flux-server
```

#### 3. Verify service is running

```bash
# Check service status
sudo systemctl status flux-server

# View logs (last 50 lines, follow new logs)
sudo journalctl -u flux-server -n 50 -f

# Test the API
curl http://localhost:3001/api/projects
```

### Managing the Service

```bash
# Start
sudo systemctl start flux-server

# Stop
sudo systemctl stop flux-server

# Restart (e.g., after code changes)
sudo systemctl restart flux-server

# View logs
sudo journalctl -u flux-server -f

# View logs since yesterday
sudo journalctl -u flux-server --since yesterday

# Disable auto-start on boot
sudo systemctl disable flux-server
```

### Security Best Practices

Instead of hardcoding credentials in the service file, use an environment file:

```bash
sudo nano /etc/flux-server.env
```

```bash
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
NODE_ENV=production
```

```bash
sudo chmod 600 /etc/flux-server.env
sudo chown root:root /etc/flux-server.env
```

Update service file:

```ini
[Service]
EnvironmentFile=/etc/flux-server.env
# Remove individual Environment= lines
```

---

## Option 2: Docker (Cross-Platform)

Docker packages the application with all dependencies in an isolated container.

### Benefits

- ✅ **Portable** - Works on Linux, macOS, Windows
- ✅ **Isolated** - Can't mess up your system
- ✅ **Reproducible** - Same environment everywhere
- ✅ **Easy deployment** - Simple commands
- ✅ **Cloud-ready** - Deploy to AWS, Azure, GCP, DigitalOcean

### Setup Steps

#### 1. Create Dockerfile

Create `packages/server/Dockerfile`:

```dockerfile
FROM oven/bun:1.3-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Build
RUN cd packages/shared && bun run build
RUN cd packages/server && bun run build

# Expose port
EXPOSE 3001

# Set working directory to server
WORKDIR /app/packages/server

# Start server
CMD ["bun", "run", "start"]
```

#### 2. Create docker-compose.yml

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  flux-server:
    build:
      context: .
      dockerfile: packages/server/Dockerfile
    container_name: flux-server
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### 3. Create .env file

Create `.env` in project root (same directory as docker-compose.yml):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

**Important**: Add `.env` to `.gitignore` to avoid committing secrets!

#### 4. Build and run

```bash
# Build the Docker image
docker-compose build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f flux-server

# Test the API
curl http://localhost:3001/api/projects
```

### Managing Docker Deployment

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart (e.g., after code changes)
docker-compose restart

# Rebuild after code changes
docker-compose build
docker-compose up -d

# View logs
docker-compose logs -f flux-server

# View logs (last 100 lines)
docker-compose logs --tail=100 flux-server

# Stop and remove containers + volumes
docker-compose down -v

# Shell into running container (debugging)
docker-compose exec flux-server sh
```

### Deploy to Cloud

**DigitalOcean App Platform:**

```yaml
# .do/app.yaml
name: flux-server
services:
  - name: flux-server
    dockerfile_path: packages/server/Dockerfile
    github:
      repo: your-username/flux
      branch: main
    envs:
      - key: SUPABASE_URL
        value: ${SUPABASE_URL}
      - key: SUPABASE_KEY
        value: ${SUPABASE_KEY}
      - key: PORT
        value: "3001"
    http_port: 3001
    instance_count: 1
    instance_size_slug: basic-xxs
```

**AWS ECS / Azure Container Apps / Google Cloud Run:**

All support Docker deployments. Set environment variables in their respective consoles.

---

## Comparison: Systemd vs Docker

| Feature | Systemd | Docker |
|---------|---------|--------|
| **Platform** | Linux only | Linux, macOS, Windows |
| **Resource Usage** | Minimal (~10MB RAM) | ~50MB overhead |
| **Startup Time** | ~1 second | ~3-5 seconds |
| **Isolation** | Process-level | Full container |
| **Updates** | `git pull && systemctl restart` | `docker-compose build && up -d` |
| **Logs** | journalctl | docker logs |
| **Best For** | Local servers, VPS | Cloud deployment, multi-env |

## Monitoring

### Health Checks

Flux server exposes a health endpoint:

```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

### Uptime Monitoring

**Systemd:**

```bash
# Check if service is running
systemctl is-active flux-server

# Check uptime
systemctl show flux-server --property=ActiveEnterTimestamp
```

**Docker:**

```bash
# Check if container is running
docker-compose ps

# Check container health
docker inspect flux-server | jq '.[0].State.Health'
```

### External Monitoring

Set up external monitoring with:
- **UptimeRobot** - Free monitoring, sends alerts on downtime
- **Pingdom** - Professional monitoring with detailed analytics
- **Datadog / New Relic** - Full observability platform

Point them at: `http://your-server-ip:3001/health`

## Backups

Your data is stored in Supabase, which provides:

1. **Automatic Backups** - Daily backups retained for 7 days (free tier)
2. **Point-in-Time Recovery** - Pro plan only
3. **Manual Backups** - Use `bun scripts/export-from-supabase.ts` (create this script)

To export data periodically:

```bash
# Add to crontab: daily backup at 2 AM
0 2 * * * cd /path/to/flux && bun scripts/export-data.ts > /backups/flux-$(date +\%Y\%m\%d).json
```

## Reverse Proxy (Production)

For production, run behind nginx or Caddy for HTTPS:

**Nginx:**

```nginx
server {
    listen 80;
    server_name flux.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Caddy (simpler):**

```
flux.yourdomain.com {
    reverse_proxy localhost:3001
}
```

Caddy automatically handles HTTPS with Let's Encrypt!

## Troubleshooting

**Service won't start (systemd):**

```bash
sudo journalctl -u flux-server -n 50
```

**Container won't start (Docker):**

```bash
docker-compose logs flux-server
```

**Port already in use:**

```bash
# Find process using port 3001
sudo lsof -i :3001
sudo kill -9 <PID>
```

**Permission denied:**

Ensure service file has correct user and WorkingDirectory permissions.

**Environment variables not loading:**

- Systemd: Check `Environment=` or `EnvironmentFile=`
- Docker: Check `.env` file exists and `docker-compose.yml` references it
