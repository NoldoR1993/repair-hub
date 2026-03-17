import sys
import textwrap
import paramiko

HOST = "195.3.221.229"
USER = "root"
PASSWORD = "QINyTvZoJoJj4YhV"

SCRIPT = textwrap.dedent(
    r"""
    set -e
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y postgresql
    systemctl enable postgresql
    systemctl start postgresql
    mkdir -p /opt/repair-hub
    find /opt/repair-hub -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    tar -xzf /root/repair-hub-deploy.tar.gz -C /opt/repair-hub
    cd /opt/repair-hub
    npm install
    runuser -u postgres -- psql -tc "SELECT 1 FROM pg_roles WHERE rolname='repair_hub'" | grep -q 1 || runuser -u postgres -- psql -c "CREATE ROLE repair_hub WITH LOGIN PASSWORD 'repair_hub_pass';"
    runuser -u postgres -- psql -tc "SELECT 1 FROM pg_database WHERE datname='repair_hub'" | grep -q 1 || runuser -u postgres -- psql -c "CREATE DATABASE repair_hub OWNER repair_hub;"
    PGPASSWORD=repair_hub_pass psql -h 127.0.0.1 -U repair_hub -d repair_hub -f /opt/repair-hub/backend/migrations/001_init.sql
    PGPASSWORD=repair_hub_pass psql -h 127.0.0.1 -U repair_hub -d repair_hub -f /opt/repair-hub/backend/migrations/002_seed.sql
    DATABASE_URL=postgres://repair_hub:repair_hub_pass@127.0.0.1:5432/repair_hub JWT_SECRET=change-me-123 CORS_ORIGIN=http://195.3.221.229:3000 npm --workspace backend run build
    VITE_API_URL=http://195.3.221.229:4000 npm run build:classic
    cat >/etc/systemd/system/repair-hub-backend.service <<'EOF'
    [Unit]
    Description=Repair Hub Backend
    After=network.target postgresql.service

    [Service]
    Type=simple
    WorkingDirectory=/opt/repair-hub/backend
    Environment=DATABASE_URL=postgres://repair_hub:repair_hub_pass@127.0.0.1:5432/repair_hub
    Environment=JWT_SECRET=change-me-123
    Environment=CORS_ORIGIN=http://195.3.221.229:3000
    ExecStart=/usr/bin/node /opt/repair-hub/backend/dist/server.js
    Restart=always
    RestartSec=5
    User=root

    [Install]
    WantedBy=multi-user.target
    EOF
    cat >/etc/systemd/system/repair-hub-frontend.service <<'EOF'
    [Unit]
    Description=Repair Hub Frontend
    After=network.target repair-hub-backend.service

    [Service]
    Type=simple
    WorkingDirectory=/opt/repair-hub
    Environment=VITE_API_URL=http://195.3.221.229:4000
    ExecStart=/usr/bin/npm run preview:classic
    Restart=always
    RestartSec=5
    User=root

    [Install]
    WantedBy=multi-user.target
    EOF
    systemctl daemon-reload
    systemctl enable repair-hub-backend.service repair-hub-frontend.service
    systemctl restart repair-hub-backend.service
    systemctl restart repair-hub-frontend.service
    sleep 5
    systemctl --no-pager --full status repair-hub-backend.service | head -40
    systemctl --no-pager --full status repair-hub-frontend.service | head -40
    curl -I http://127.0.0.1:3000/
    curl http://127.0.0.1:4000/health
    """
).strip()


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=20)
    stdin, stdout, stderr = client.exec_command(SCRIPT, get_pty=True)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    print(out)
    if err:
      print(err)
    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
