# Getting Started with Family Hub

A complete guide to setting up your own Family Hub from scratch.

---

## Prerequisites

### Knowledge
- Basic command line (terminal/PowerShell)
- Basic Docker understanding (containers, images)
- Home Assistant basics (optional, we'll walk you through)

### Hardware (Minimum)
- **Computer** (Windows, Mac, or Linux)
- **Touchscreen monitor** (eventual - start with laptop)
- **Network connection** (WiFi or Ethernet)

### Software
- Docker Desktop (free)
- Home Assistant (free, open-source)
- Text editor like VS Code (free)

---

## Phase 1: Local Setup (Week 1)

### Step 1: Install Docker Desktop

1. Download [Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Install and launch
3. Verify: Open terminal/PowerShell and run:
   ```bash
   docker --version
   ```

### Step 2: Clone This Repository

```bash
git clone https://github.com/thenarsais/Family-Hub
cd Family-Hub
```

### Step 3: Start Home Assistant

Follow [`software-setup.md`](./software-setup.md) for detailed Docker & Home Assistant setup.

Quick start:
```bash
docker pull homeassistant/home-assistant:latest
docker run -d --name homeassistant -p 8123:8123 homeassistant/home-assistant:latest
```

Then open: http://localhost:8123

### Step 4: Install Mealie (Meal Planner)

```bash
docker pull mealie/mealie:latest
docker run -d --name mealie -p 9925:9925 mealie/mealie:latest
```

Then open: http://localhost:9925

### Step 5: Configure Home Assistant

1. Create account in Home Assistant
2. Install HACS (Home Assistant Community Store)
3. Add integrations:
   - Google Calendar
   - Weather (Met.no)
   - Time & Date
   - Mealie (native integration)

See [`integrations/`](./integrations/) for detailed setup guides.

---

## Phase 2: Build Your Dashboard (Week 2-3)

### Add Custom Cards & Components

1. **Clock Weather Card** — Shows time, weather, 5-day forecast
2. **Family Announcement Banner** — Dynamic messages
3. **Chore Cards** — Task management with points
4. **Meal Planner** — Custom app for meal planning
5. **Calendar** — Synced family events
6. **Transit Tracker** — School schedules & drive times

See [`features.md`](./features.md) for complete list of what to build.

### Customize for Your Family

1. **Update family names** — Replace "Krish" with your child's name
2. **Add family members** — Create helper counters for points
3. **Set timezone** — Update to your location
4. **Configure automations** — Adjust times & triggers

See [`customize.md`](./customize.md) for detailed guides.

---

## Phase 3: Hardware Setup (Week 4+)

Once everything works on your laptop, move to touchscreen:

1. **Get a mini PC** — Any small PC or Raspberry Pi will work
2. **Get a touchscreen monitor** — 10-15" recommended
3. **Install OS** — Windows, Linux, or Raspberry Pi OS
4. **Install Docker** — Same as local setup
5. **Transfer your config** — Copy Home Assistant and Mealie data

See [`hardware-setup.md`](./hardware-setup.md) for detailed options.

---

## Phase 4: Add Learning Modules (Optional, Week 5+)

### Gujarati Learning Module

Pre-built and ready to customize:

1. Copy [`gujarati-learning-module.html`](../modules/gujarati/) to your Home Assistant
2. Create a Webpage card pointing to it
3. Customize with your own language/content

Or use it as a template for building your own language module.

### Customizing for Your Language

1. Replace Gujarati letters with your alphabet
2. Update the curriculum JSON
3. Change point values and rewards to match your system

See [`modules/README.md`](../modules/README.md) for detailed instructions.

---

## Troubleshooting

### Home Assistant won't start
- Check Docker is running: `docker ps`
- Check logs: `docker logs homeassistant`
- See [`known-issues.md`](./known-issues.md)

### Integrations not working
- Verify API keys and tokens are correct
- Check Home Assistant logs
- See integration-specific guides in [`integrations/`](./integrations/)

### Dashboard looks broken
- Clear browser cache
- Check for console errors (F12 → Console)
- Verify custom cards are installed

---

## Next Steps

Once you have the basics running:

1. **Read [`features.md`](./features.md)** — See what's available
2. **Read [`roadmap.md`](./roadmap.md)** — Understand the full vision
3. **Check [`session-log.md`](./session-log.md)** — See how we built it
4. **Start customizing** — Make it your family's own

---

## Need Help?

- **Integration help?** → Check [`integrations/`](./integrations/)
- **Error messages?** → See [`known-issues.md`](./known-issues.md)
- **Want to customize?** → Read [`customize.md`](./customize.md)
- **Have questions?** → Open an issue on GitHub

---

**Estimated time to get running:** 4-6 hours for basic setup, 2-3 weeks for full customization
