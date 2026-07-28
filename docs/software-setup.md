# Family Hub — Software Setup Guide

Complete step-by-step instructions for setting up Docker, Home Assistant, and integrations.

---

## Prerequisites

- Windows 10/11, macOS, or Linux
- 4GB RAM minimum (8GB recommended)
- 20GB free disk space minimum
- Administrator access
- Internet connection

---

## Part 1: Install Docker Desktop

### Windows

1. **Download Docker Desktop**
   - Visit: https://www.docker.com/products/docker-desktop
   - Click "Download for Windows"
   - Choose "Docker Desktop Installer.exe"

2. **Install Docker**
   - Double-click installer
   - Check "Use WSL 2 instead of Hyper-V" (better performance)
   - Follow prompts, restart computer when asked

3. **Verify Installation**
   ```bash
   docker --version
   docker run hello-world
   ```

4. **Enable WSL 2** (if not auto-enabled)
   - Open PowerShell as Admin
   - Run: `wsl --install`
   - Restart computer

### macOS

1. **Download Docker Desktop**
   - Visit: https://www.docker.com/products/docker-desktop
   - Choose "Docker.dmg for Apple Silicon" (M1/M2) or "Intel Chip"

2. **Install**
   - Double-click Docker.dmg
   - Drag Docker.app to Applications folder
   - Launch Docker from Applications

3. **Verify**
   ```bash
   docker --version
   ```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Docker
sudo apt install docker.io docker-compose

# Add your user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
```

---

## Part 2: Install Home Assistant via Docker

### Option A: Using Docker Desktop GUI (Easiest)

1. Open Docker Desktop
2. Search for image: `homeassistant/home-assistant`
3. Click "Run"
4. Set up container:
   - Name: `homeassistant`
   - Ports: `8123:8123`
   - Volume mount: Create folder `C:\ha-config` → mount to `/config`

### Option B: Using Terminal (Recommended)

**Windows PowerShell or macOS/Linux Terminal:**

```bash
# Create config directory
mkdir -p ~/ha-config

# Download image
docker pull homeassistant/home-assistant:latest

# Run Home Assistant container
docker run -d \
  --name homeassistant \
  -p 8123:8123 \
  -v ~/ha-config:/config \
  -e TZ=America/Denver \
  homeassistant/home-assistant:latest

# Check if running
docker ps
docker logs homeassistant
```

### Verify Home Assistant is Running

1. Open browser: http://localhost:8123
2. You should see Home Assistant login
3. Create account (email: thenarsais@gmail.com)
4. Set up location & time zone

**Note:** First startup takes 5-10 minutes.

---

## Part 3: Install Required Integrations

### HACS (Home Assistant Community Store)

HACS allows installing custom cards and integrations.

**Install via Terminal:**

1. Open Home Assistant at http://localhost:8123
2. Go to Settings → Developer Tools → Terminal
3. Paste:
   ```bash
   wget -O - https://get.hacs.xyz | bash -
   ```
4. Restart Home Assistant (Settings → System → Restart)
5. Go to Settings → Devices & Services → Create Automation
6. Search for "HACS"
7. Complete OAuth flow

### Core Integrations (Built-in)

These come with Home Assistant:

1. **Google Calendar**
   - Settings → Devices & Services → Create Integration
   - Search "Google Calendar"
   - Click "Create Integration"
   - Complete OAuth (opens Google login)
   - Select calendars to sync

2. **Weather (Met.no)**
   - Settings → Devices & Services → Create Integration
   - Search "Met.no"
   - Enter latitude/longitude (auto-detected or manual)
   - Can add multiple locations

3. **Time & Date**
   - Settings → Devices & Services → Create Integration
   - Search "Time & Date"
   - Select your time zone

4. **Waze Travel Time** (for school transit)
   - Settings → Devices & Services → Create Integration
   - Search "Waze Travel Time"
   - Enter origin & destination addresses
   - Creates sensor with travel time

### Community Integrations (via HACS)

1. **Atomic Calendar Revive** (birthday reminders)
   - Open HACS (Settings → Devices & Services → HACS)
   - Click Integrations (left menu)
   - Click "Explore & Download Repositories"
   - Search "Atomic Calendar Revive"
   - Click Download
   - Restart Home Assistant
   - Add integration (Settings → Devices & Services)

2. **Mealie** (meal planning)
   - Already built-in, just add:
   - Settings → Devices & Services → Create Integration
   - Search "Mealie"
   - Enter Mealie URL: http://localhost:9925
   - Enter API token (from Mealie settings)

3. **ReCollect** (trash schedule)
   - Open HACS → Integrations
   - Search "ReCollect"
   - Download & restart
   - Settings → Devices & Services → Add "ReCollect"
   - Enter Place ID (from ReCollect app)
   - Follow OAuth flow

---

## Part 4: Install Mealie (Meal Planning)

```bash
# Pull Mealie image
docker pull mealie/mealie:latest

# Run Mealie container
docker run -d \
  --name mealie \
  -p 9925:9925 \
  -e PUID=1000 \
  -e PGID=1000 \
  mealie/mealie:latest
```

**Access Mealie:**
1. Open browser: http://localhost:9925
2. Create account (thenarsais@gmail.com)
3. Create household "Narsai Family"
4. Start adding recipes!

---

## Part 5: Configure Home Assistant Dashboard

### Create Custom Dashboard

1. Open Home Assistant at http://localhost:8123
2. Go to Dashboards (left menu)
3. Click "+ Create Dashboard"
4. Name it "Family Hub"
5. Click "+ Create Card" to add:

**Essential Cards:**
- Clock Weather Card (from HACS)
- Calendar Card (synced with Google)
- Shopping List (built-in)
- Meal Planner (custom HTML via Webpage card)
- Chore cards (template cards)
- Announcement banner (markdown card)

### Add Helpers (Variables)

Home Assistant Helpers store data for your automations.

**Create Krish Points Counter:**
1. Settings → Devices & Services → Helpers
2. Click "Create Helper" → "Counter"
3. Name: "Krish Points"
4. Min: 0, Max: 100, Step: 1
5. Icon: mdi:star
6. Save

**Create Monthly Points:**
1. Same process
2. Name: "Krish Monthly Points"
3. Max: 400

### Create Automations

**Reset Daily Chores at 6 AM:**

1. Settings → Automations & Scenes → Automations
2. Click "+ Create Automation"
3. Name: "Krish Daily Chore Reset"
4. Trigger:
   - Type: Time
   - At: 06:00:00
5. Action:
   - Turn off all Krish chore toggles
6. Save

**Add Points on Chore Toggle:**

1. Create Automation
2. Name: "Krish Morning Chores Points"
3. Trigger:
   - Entity: input_boolean.krish_make_bed
   - To: "on"
4. Action:
   - Call Service: counter.increment
   - Entity: counter.krish_points
   - Step: 5
5. Add second action to decrement on "off"

---

## Part 6: Backup Your Configuration

Regular backups prevent losing automations & settings.

```bash
# Backup Home Assistant configuration
tar -czf ~/ha-backup.tar.gz ~/ha-config

# Backup Mealie data
docker exec mealie tar -czf /tmp/mealie-backup.tar.gz /app/data
docker cp mealie:/tmp/mealie-backup.tar.gz ~/mealie-backup.tar.gz

# Backup Mealie database
docker exec mealie mysqldump -u root --password=*** mealie > ~/mealie-db.sql
```

**Recommendation:** Set up weekly automated backups using bash script.

---

## Part 7: Install Optional Custom Cards

Via HACS:

1. **Clock Weather Card**
   - For beautiful time + weather display
   - HACS → Search "Clock Weather"
   - Download & restart

2. **Layout Card**
   - For organizing dashboard
   - HACS → Search "Layout Card"
   - Download & restart

3. **Button Card**
   - For custom button styling
   - HACS → Search "Button Card"
   - Download & restart

---

## Part 8: Add the Learning Module

1. **Copy Gujarati module to Home Assistant:**
   ```bash
   cp gujarati-learning-module.html ~/ha-config/www/
   ```

2. **Add Webpage Card to Dashboard:**
   - Dashboard → Click "Edit Dashboard" (top right)
   - Click "+ Create Card"
   - Choose "Webpage"
   - URL: `/local/gujarati-learning-module.html`
   - Height: 1200px
   - Save

---

## Troubleshooting

### Home Assistant won't start

```bash
# Check logs
docker logs homeassistant

# If stuck, restart
docker restart homeassistant

# If still broken, reset
docker rm homeassistant
docker volume rm homeassistant
# Then re-run container from Part 2
```

### Integrations not connecting

1. Check Home Assistant logs: Settings → System → Logs
2. Verify API keys/tokens are correct
3. Check internet connection
4. Restart integration: Settings → Devices & Services → (select integration) → Reload

### Mealie not accessible

```bash
# Check if running
docker ps | grep mealie

# View logs
docker logs mealie

# Restart
docker restart mealie
```

---

## Performance Tips

1. **Don't overload integrations**
   - Add only what you need
   - Too many sensors = slow dashboard

2. **Archive old automations**
   - Disable unused automations
   - They still trigger in background

3. **Update regularly**
   - Check for Home Assistant updates monthly
   - HACS updates weekly

4. **Monitor disk space**
   ```bash
   docker exec homeassistant df -h /config
   ```

---

## Next Steps

1. ✅ Docker installed
2. ✅ Home Assistant running
3. ✅ Integrations connected
4. ✅ Dashboard created
5. 📋 Build automations & chores (see project-document.md for examples)
6. 📋 Add learning module
7. 📋 Test everything works

---

For detailed hardware setup: See [`hardware-setup.md`](./hardware-setup.md)  
For troubleshooting: See [`known-issues.md`](./known-issues.md)  
For full getting started: See [`getting-started.md`](./getting-started.md)
