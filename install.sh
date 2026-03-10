#!/usr/bin/env bash
# ──────────────────────────────────────────────
# SaifControl Installer — Ubuntu / Debian / Kali Linux
# ──────────────────────────────────────────────
set -euo pipefail

REPO_URL="https://github.com/SAIFontop/saifcontrol.git"
INSTALL_DIR="/opt/saifcontrol"
DATA_DIR="$HOME/.saifcontrol"
NODE_MAJOR=20

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ─── Root check ───
[[ $EUID -eq 0 ]] || err "يرجى تشغيل السكربت كـ root:  sudo bash install.sh"

# ─── Detect distro ───
DISTRO="unknown"
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  case "${ID,,}" in
    kali)   DISTRO="kali" ;;
    ubuntu) DISTRO="ubuntu" ;;
    debian) DISTRO="debian" ;;
    *)
      if [[ "${ID_LIKE,,}" == *"debian"* ]]; then
        DISTRO="debian"
      fi
      ;;
  esac
fi

[[ "$DISTRO" != "unknown" ]] || err "توزيعة غير مدعومة. يدعم السكربت: Ubuntu, Debian, Kali Linux"

# ─── Detect service user ───
# Kali runs as root by default — create a dedicated service user if needed
if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  SERVICE_USER="$SUDO_USER"
elif [[ "$DISTRO" == "kali" && "$(whoami)" == "root" ]]; then
  SERVICE_USER="saifcontrol"
  if ! id "$SERVICE_USER" &>/dev/null; then
    info "Creating service user: $SERVICE_USER (Kali runs as root by default)"
    useradd --system --shell /usr/sbin/nologin --home-dir "$DATA_DIR" --create-home "$SERVICE_USER"
    ok "User $SERVICE_USER created"
  fi
else
  SERVICE_USER="$(whoami)"
fi

# ─── Detect systemd ───
HAS_SYSTEMD=0
if pidof systemd &>/dev/null || [[ -d /run/systemd/system ]]; then
  HAS_SYSTEMD=1
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     SaifControl — تثبيت لوحة التحكم  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""
info "Distro: $DISTRO | Service user: $SERVICE_USER | systemd: $( (( HAS_SYSTEMD )) && echo yes || echo no )"
echo ""

# ─── 1. Install Node.js ───
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | grep -oP '\d+' | head -1)
  if (( NODE_VER >= NODE_MAJOR )); then
    ok "Node.js $(node -v) already installed"
  else
    warn "Node.js version too old ($(node -v)), upgrading..."
    INSTALL_NODE=1
  fi
else
  INSTALL_NODE=1
fi

if [[ "${INSTALL_NODE:-}" == "1" ]]; then
  info "Installing Node.js ${NODE_MAJOR}.x..."
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  mkdir -p /etc/apt/keyrings
  curl -fsSL "https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key" \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update -qq
  apt-get install -y -qq nodejs
  ok "Node.js $(node -v) installed"
fi

# ─── 2. Install build dependencies ───
info "Installing build dependencies..."
apt-get install -y -qq git build-essential python3

# ─── 3. Clone or update repository ───
if [[ -d "$INSTALL_DIR/.git" ]]; then
  info "Updating existing installation..."
  cd "$INSTALL_DIR"
  git pull --ff-only
else
  info "Cloning SaifControl..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

chown -R "$SERVICE_USER":"$SERVICE_USER" "$INSTALL_DIR"

# ─── 4. Install dependencies ───
info "Installing npm dependencies..."
cd "$INSTALL_DIR"
su - "$SERVICE_USER" -c "cd '$INSTALL_DIR' && npm install"

# ─── 5. Build ───
info "Building project..."
su - "$SERVICE_USER" -c "cd '$INSTALL_DIR' && npm run build"
ok "Build complete"

# ─── 6. Create data directory ───
DATA_DIR_RESOLVED="$DATA_DIR"
# If service user is a system user (Kali), use their home
if [[ "$SERVICE_USER" == "saifcontrol" ]]; then
  DATA_DIR_RESOLVED="/home/saifcontrol/.saifcontrol"
fi
mkdir -p "$DATA_DIR_RESOLVED"
chown -R "$SERVICE_USER":"$SERVICE_USER" "$DATA_DIR_RESOLVED"
chmod 700 "$DATA_DIR_RESOLVED"

# ─── 7. Systemd / fallback ───
if (( HAS_SYSTEMD )); then
  info "Creating systemd service: saifcontrol-api..."
  cat > /etc/systemd/system/saifcontrol-api.service << EOF
[Unit]
Description=SaifControl API Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}/apps/api
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=SAIFCONTROL_DATA_DIR=${DATA_DIR_RESOLVED}
Environment=SAIFCONTROL_API_PORT=4800

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=${DATA_DIR_RESOLVED}
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

  info "Creating systemd service: saifcontrol-web..."
  cat > /etc/systemd/system/saifcontrol-web.service << EOF
[Unit]
Description=SaifControl Web UI
After=saifcontrol-api.service
Wants=saifcontrol-api.service

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}/apps/web
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable saifcontrol-api saifcontrol-web
  systemctl start saifcontrol-api
  systemctl start saifcontrol-web
  ok "Systemd services enabled and started"

else
  # No systemd (e.g. Kali on WSL / Docker) — create launcher scripts
  warn "systemd not detected — creating manual launcher scripts"

  cat > /usr/local/bin/saifcontrol-start << SCRIPT
#!/usr/bin/env bash
echo "Starting SaifControl API..."
cd ${INSTALL_DIR}/apps/api
NODE_ENV=production SAIFCONTROL_DATA_DIR=${DATA_DIR_RESOLVED} SAIFCONTROL_API_PORT=4800 \
  nohup node dist/index.js > /var/log/saifcontrol-api.log 2>&1 &
echo \$! > /tmp/saifcontrol-api.pid

echo "Starting SaifControl Web..."
cd ${INSTALL_DIR}/apps/web
NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 \
  nohup node .next/standalone/server.js > /var/log/saifcontrol-web.log 2>&1 &
echo \$! > /tmp/saifcontrol-web.pid

echo "SaifControl started. Logs: /var/log/saifcontrol-{api,web}.log"
SCRIPT

  cat > /usr/local/bin/saifcontrol-stop << SCRIPT
#!/usr/bin/env bash
for svc in api web; do
  PID_FILE="/tmp/saifcontrol-\${svc}.pid"
  if [[ -f "\$PID_FILE" ]]; then
    kill "\$(cat "\$PID_FILE")" 2>/dev/null && echo "Stopped saifcontrol-\${svc}" || true
    rm -f "\$PID_FILE"
  fi
done
SCRIPT

  chmod +x /usr/local/bin/saifcontrol-start /usr/local/bin/saifcontrol-stop
  ok "Created /usr/local/bin/saifcontrol-start and saifcontrol-stop"

  info "Starting SaifControl..."
  /usr/local/bin/saifcontrol-start
fi

# ─── Firewall ───
if command -v ufw &>/dev/null && ufw status | grep -q "active"; then
  info "Configuring UFW firewall..."
  ufw allow 3000/tcp comment "SaifControl Web"
  ufw allow 4800/tcp comment "SaifControl API"
  ok "UFW rules added"
elif command -v iptables &>/dev/null; then
  info "Configuring iptables firewall..."
  iptables -C INPUT -p tcp --dport 3000 -j ACCEPT 2>/dev/null || \
    iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
  iptables -C INPUT -p tcp --dport 4800 -j ACCEPT 2>/dev/null || \
    iptables -A INPUT -p tcp --dport 4800 -j ACCEPT
  # Persist if iptables-persistent is installed
  if command -v netfilter-persistent &>/dev/null; then
    netfilter-persistent save 2>/dev/null || true
  fi
  ok "iptables rules added (ports 3000, 4800)"
else
  warn "No firewall detected — make sure ports 3000 and 4800 are accessible"
fi

echo ""
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  SaifControl installed successfully!${NC}"
echo -e "${GREEN}══════════════════════════════════════${NC}"
echo ""
echo -e "  Distro:  ${CYAN}${DISTRO}${NC}"
echo -e "  User:    ${CYAN}${SERVICE_USER}${NC}"
echo -e "  Web UI:  ${CYAN}http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):3000${NC}"
echo -e "  API:     ${CYAN}http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'localhost'):4800${NC}"
echo ""
echo -e "  ${YELLOW}افتح المتصفح لإكمال معالج الإعداد.${NC}"
echo ""
if (( HAS_SYSTEMD )); then
  echo -e "  Manage services:"
  echo -e "    systemctl status saifcontrol-api"
  echo -e "    systemctl status saifcontrol-web"
  echo -e "    journalctl -u saifcontrol-api -f"
else
  echo -e "  Manage services (no systemd):"
  echo -e "    saifcontrol-start    # start API + Web"
  echo -e "    saifcontrol-stop     # stop both"
  echo -e "    tail -f /var/log/saifcontrol-api.log"
fi
echo ""
