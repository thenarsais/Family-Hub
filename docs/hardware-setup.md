# Family Hub — Hardware Setup Guide

Options for different budgets and needs. Start local (laptop), then graduate to dedicated hardware.

---

## Option 1: Laptop / Desktop (Current Setup) ✅

**Good for:** Testing, development, or as permanent hub if used seasonally.

### Hardware
- Any Windows/Mac/Linux computer
- Docker Desktop installed
- Ethernet or WiFi connection

### Pros
- Already have it
- Easy to develop and test
- Can move around
- Good for learning

### Cons
- Takes up desk space
- Can't stay on 24/7 (power bill)
- Not ideal for touchscreen display
- Restarts interrupt automations

### Cost
$0 (reuse existing)

### Setup Time
~1 hour

---

## Option 2: Mini PC + Touchscreen (Recommended) ⭐

**Good for:** Wall-mounted permanent hub, low power consumption, always on.

### Hardware

**Mini PC Options:**
- **Beelink SER4** — AMD Ryzen, 16GB RAM, 500GB SSD ($200-250)
- **Intel NUC** — 11th Gen i5, 16GB RAM, 500GB SSD ($400-500)
- **Raspberry Pi 4 (8GB)** — Limited but works, 8GB RAM ($75)
- **ASUS Chromebox** — Fanless, silent, 8GB RAM ($200)

**Touchscreen Monitor:**
- **10.1" Portable** — ASUS/Lenovo USB-C powered ($150-200)
- **13.3" Portable** — Full HD, 1920x1080, USB-C powered ($200-300)
- **15.6" Wall-mounted** — Best for kitchen, VESA mount ($300-400)

**Peripherals:**
- USB keyboard + trackpad (wireless recommended)
- Power strip with smart plug (optional, for remote shutdown)
- HDMI cable + power adapter

### Total Cost
$350-700 (mini PC $200-500 + touchscreen $150-400)

### Pros
- Dedicated hardware (not your laptop)
- 24/7 operation possible
- Low power consumption (10-30W)
- Multiple mounting options
- Silent operation
- Can add more storage/RAM

### Cons
- Upfront cost
- Need to maintain separate device
- Setup requires more configuration

### Setup Time
~3-4 hours (OS install, Docker, Home Assistant setup)

---

## Option 3: Raspberry Pi 4 (Budget Option)

**Good for:** Learning, low power, extremely affordable.

### Hardware
- Raspberry Pi 4 (8GB model) — $75
- 128GB micro SD card (UHS-II) — $25
- Raspberry Pi Official Power Supply — $15
- Touchscreen 7-10" — $80-150
- Case with cooling — $15

**Total:** ~$200

### Pros
- Very affordable
- Ultra-low power (3-5W)
- Huge community support
- Runs Home Assistant OS natively
- Tiny footprint

### Cons
- Limited CPU (slower)
- Limited RAM (8GB max)
- SD card slower than SSD
- Node.js backend performance limited
- Can overheat under load

### Recommendations
- Use Raspberry Pi OS Lite (minimal)
- Add active cooling/heatsink
- Don't use on WiFi (Ethernet strongly recommended)
- Limit simultaneous users/integrations

### Setup Time
~2-3 hours

---

## Option 4: All-in-One Tablet / iPad

**Good for:** Temporary setup, traveling family, portable hub.

### Hardware
- iPad 10" or Android tablet
- Home Assistant app (iOS/Android)
- Bluetooth keyboard (optional)
- Stand or wall mount

### Pros
- Already own one?
- Battery backup (can survive power cuts)
- Portable
- Good touch interface
- Works on cellular if WiFi down

### Cons
- Not standalone Home Assistant
- Requires phone-like power management
- Screen always on drains battery
- Expensive if buying new

### Cost
$0 (if you have spare) to $300 (new iPad)

### Limitations
- Can't run Docker/backend
- Mainly for dashboard viewing
- Learning module works but slower

---

## Recommended Setup for Your Family

**Start Here:** Option 2 (Mini PC + Touchscreen)

**Why?**
- Great balance of cost ($350-700) and capability
- Can run full stack (Home Assistant + Mealie + Node.js backend)
- 24/7 operation without concern
- Fanless/silent for kitchen mount
- Scales for Phase 8B (AI models, backend services)
- Good resale value if you change mind

**Specific Recommendation:**
- **Mini PC:** Beelink SER4 ($220) — AMD Ryzen, plenty of power, fanless
- **Touchscreen:** 13.3" portable ($220) — USB-C powered, sharp display
- **Mounting:** VESA arm mount ($40) for kitchen wall

**Total investment:** ~$480 (CPU: excellent, Cost: reasonable)

---

## Migration Path: Laptop → Mini PC

### Step 1: Backup Home Assistant (Your System)
```bash
# SSH into Home Assistant
ssh root@homeassistant.local

# Backup configuration
tar -czf ~/ha-backup.tar.gz /config

# Download backup to laptop
```

### Step 2: Install OS on Mini PC
1. Download Ubuntu Server 22.04 LTS (or Raspberry Pi OS)
2. Create bootable USB drive
3. Boot mini PC, follow OS installation
4. Update system: `sudo apt update && apt upgrade`

### Step 3: Install Docker on Mini PC
See [`software-setup.md`](./software-setup.md) for Docker installation.

### Step 4: Restore Home Assistant
```bash
# Pull Home Assistant Docker image
docker pull homeassistant/home-assistant:latest

# Run container on mini PC (same config as before)
docker run -d --name homeassistant -p 8123:8123 -v /path/to/config:/config homeassistant/home-assistant:latest

# Restore from backup
tar -xzf ~/ha-backup.tar.gz -C /config
```

### Step 5: Verify All Works
- Open http://mini-pc-ip:8123
- Log in with same credentials
- Check all integrations connected
- Verify automations still firing

---

## Recommended Mini PCs by Use Case

| Use Case | Model | Price | Why |
|----------|-------|-------|-----|
| **Budget** | Raspberry Pi 4 8GB | $75 | Cheapest option, works fine for basic hub |
| **Best Value** | Beelink SER4 | $220 | Good power, fanless, quiet |
| **Premium** | Intel NUC 11i5 | $400+ | Most powerful, best for backend services |
| **Silent** | ASUS Chromebox | $200 | Fanless, optimized for web apps |

---

## Mounting Options

### Option A: VESA Wall Mount
- Screw touchscreen to arm
- Mount arm to kitchen wall at eye level
- Clean look, space-saving
- Cost: $30-60

### Option B: Desk Stand
- Touchscreen on adjustable stand
- Mini PC underneath or on shelf
- Easy to move/reconfigure
- Cost: $20-40

### Option C: Kiosk Style
- Wall-mounted frame
- Mini PC hidden behind
- Touchscreen is only visible element
- Cost: $50-100 (or 3D print custom)

---

## Network Setup

### Best: Wired Ethernet
- Plug mini PC directly into router
- More reliable automations
- Lower latency
- No WiFi dropouts

### Good: 5GHz WiFi
- 5GHz is faster/less congested than 2.4GHz
- Position mini PC close to router
- Avoid microwave, baby monitors

### Avoid: 2.4GHz WiFi
- Slow
- Congested in most homes
- Can cause intermittent issues

---

## Power Management

### Always-On Setup
- Plugin to dedicated outlet
- Use smart plug to monitor power (optional)
- No sleep/hibernation
- Automations never interrupted

### Smart Shutdown (Advanced)
- Add smart plug to mini PC
- Create automation to shut down at midnight
- Power back on at 5 AM
- Saves ~$10/month in electricity

### Battery Backup (UPS)
- Uninterruptible Power Supply
- Keeps hub running during power outages
- Automations continue
- Graceful shutdown if power out >30 min

### Cost: UPS
- Small (500VA): $50-80
- Medium (1500VA): $100-150

---

## Expansion Options

All of these work with mini PC setup:

- **Hard drives** — USB external for Home Assistant backups
- **Smart plugs** — TP-Link Kasa for laundry monitoring
- **Cameras** — Wyze, Reolink (RTSP) for video feeds
- **Microphone** — USB mic for voice wake word
- **Speaker** — USB speaker for announcements & TTS

---

## Performance Targets

| Task | Target | Beelink SER4 | Raspberry Pi 4 |
|------|--------|--------------|----------------|
| Home Assistant load | <2 sec | ✅ | ✅ |
| Dashboard render | <1 sec | ✅ | ✅ |
| Meal planner drag | <300ms | ✅ | ✅ |
| Learning module | <500ms | ✅ | ⚠️ (slower) |
| Node.js backend | <200ms | ✅ | ⚠️ (limited) |
| TensorFlow.js trace | <500ms | ✅ | ⚠️ (limited) |

---

## Next Steps

1. **Decide on hardware** — Use guide above to choose
2. **Order parts** — See recommended list
3. **Install OS** — Follow [`software-setup.md`](./software-setup.md)
4. **Migrate from laptop** — Use steps above
5. **Mount on wall** — Choose mounting option
6. **Test everything** — Verify all integrations work

---

Questions? See [`known-issues.md`](./known-issues.md) or [`getting-started.md`](./getting-started.md).
