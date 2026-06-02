# Family Hub — Known Issues & Solutions

Common problems and how to fix them.

---

## Dashboard & Display

### Issue: Dashboard loads but cards are blank

**Symptom:** Home Assistant loads, but cards show no data.

**Cause:** Integrations not fully initialized or API keys incorrect.

**Fix:**
1. Wait 2-3 minutes (integrations need time to load)
2. Refresh browser: F5 or Cmd+R
3. Check if integrations connected:
   - Settings → Devices & Services
   - Look for warning icons (⚠️)
4. If API key error:
   - Regenerate API token in integration settings
   - Restart Home Assistant

---

### Issue: Time & Weather showing "Unknown"

**Symptom:** Clock shows "Unknown", weather is blank.

**Cause:** Met.no integration not configured or network issue.

**Fix:**
1. Check met.no integration:
   - Settings → Devices & Services → Met.no
   - Verify coordinates are correct (latitude/longitude)
2. Check Home Assistant logs:
   - Settings → System → Logs
   - Search for "met.no" errors
3. If coordinates wrong:
   - Re-add integration with correct location
4. Restart Home Assistant

---

### Issue: Calendar events not showing

**Symptom:** Calendar card is empty, no events visible.

**Cause:** Google Calendar not authorized or calendar not selected.

**Fix:**
1. Check Google Calendar integration:
   - Settings → Devices & Services → Google Calendar
   - If "Configure" button appears, click it to re-authorize
2. Verify calendars are synced:
   - Check Google Calendar account is accessible
3. Refresh Home Assistant: Settings → System → Restart

---

### Issue: Meal planner app not loading

**Symptom:** Webpage card shows blank or "Unable to load".

**Cause:** File not in correct location or path incorrect.

**Fix:**
1. Copy file to correct location:
   ```bash
   cp gujarati-learning-module.html ~/ha-config/www/
   ```
2. Verify file exists: `ls -la ~/ha-config/www/`
3. In Home Assistant, update Webpage card URL:
   - Change to: `/local/gujarati-learning-module.html`
   - Click Save
4. Refresh browser (F5)

---

## Chore System

### Issue: Chores not resetting at 6 AM

**Symptom:** Chore toggles stay "on" from previous day.

**Cause:** Automation not firing or time zone wrong.

**Fix:**
1. Check time zone:
   - Settings → System → General
   - Verify: America/Denver (or your timezone)
2. Check automation:
   - Settings → Automations & Scenes → Automations
   - Find "Krish Daily Chore Reset"
   - Click to edit, verify trigger time is 06:00
3. Test manually:
   - Click automation, click "Test This Automation"
   - Verify all chore toggles turn off
4. If still not working:
   - Delete automation, recreate with exact same name

---

### Issue: Points not adding when toggling chores

**Symptom:** Toggle chore "on", but points don't increase.

**Cause:** Automation not set up or counter doesn't exist.

**Fix:**
1. Create counter if missing:
   - Settings → Devices & Services → Helpers → Counters
   - Check "Krish Points" exists
   - If not, click "Create Helper" → Counter
   - Name: "Krish Points", Min: 0, Max: 100
2. Check automation:
   - Verify "Krish Morning Chores Points" automation exists
   - Edit it: Trigger should be toggle "on"
   - Action should increment counter
3. Test manually:
   - Go to Helpers → Counters
   - Click + button on "Krish Points" counter
   - Verify count increases
4. If counter works but automation doesn't:
   - Delete automation, recreate

---

## Learning Module

### Issue: Gujarati module not loading

**Symptom:** "File not found" or blank page in Webpage card.

**Cause:** HTML file not in correct Home Assistant folder.

**Fix:**
1. Place file in Home Assistant www directory:
   ```bash
   cp gujarati-learning-module.html ~/ha-config/www/
   ```
2. Verify it's there:
   ```bash
   ls -la ~/ha-config/www/gujarati-learning-module.html
   ```
3. Update Webpage card URL to:
   `/local/gujarati-learning-module.html`
4. Restart Home Assistant

---

### Issue: Trace mode shows no guide letter

**Symptom:** Canvas is blank or guide not visible.

**Cause:** Canvas not initialized or guide color not visible.

**Fix:**
1. Open browser DevTools (F12 → Console)
2. Check for JavaScript errors
3. Look for "Canvas not supported" message
4. If errors, check:
   - Browser supports HTML5 Canvas (modern browsers do)
   - Refresh page with Ctrl+Shift+R (hard refresh)
5. If guide still not visible:
   - Check guide color in code
   - Current: rgba(204, 229, 255, 0.3) (light blue)
   - Should be semi-transparent

---

### Issue: Progress not saving between sessions

**Symptom:** Close app, reopen, progress is gone.

**Cause:** LocalStorage disabled or not persisting.

**Fix:**
1. Check if browser allows LocalStorage:
   - Chrome: Settings → Privacy → Cookies
   - Firefox: Preferences → Privacy → Cookies & Site Data
   - Ensure "Allow" is selected
2. Try different browser:
   - Chrome, Firefox, Safari all work
   - If only one browser broken, try different one
3. Clear cache & try again:
   - DevTools → Application → LocalStorage
   - Clear and try again

---

## Docker & Containers

### Issue: Container won't start

**Symptom:** `docker run` fails or container exits immediately.

**Cause:** Port already in use, permission error, or image issue.

**Fix:**

**Port in use:**
```bash
# Check what's using port 8123
netstat -tulpn | grep 8123  # Linux
# or
sudo lsof -i :8123  # macOS

# Kill process using port, or use different port
docker run -p 8124:8123 ...  # Use 8124 instead
```

**Permission error:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Try running again (no sudo)
docker run ...
```

**Image pull failed:**
```bash
# Try pulling again
docker pull homeassistant/home-assistant:latest

# Or specify version
docker pull homeassistant/home-assistant:2024.3.0
```

---

### Issue: Container running but can't connect

**Symptom:** Docker shows running, but http://localhost:8123 times out.

**Cause:** Container not listening or firewall blocking.

**Fix:**
1. Check if container is really running:
   ```bash
   docker ps | grep homeassistant
   ```

2. Check logs:
   ```bash
   docker logs homeassistant
   ```
   - Should show "Home Assistant started"

3. Wait for startup:
   - First start takes 5-10 minutes
   - Wait and try again

4. Try with full hostname:
   ```
   http://127.0.0.1:8123
   http://localhost:8123
   http://<your-computer-name>:8123
   ```

5. Check firewall:
   - Windows: Settings → Firewall → Allow Docker
   - macOS: System Preferences → Security & Privacy
   - Linux: `sudo ufw allow 8123`

---

### Issue: Home Assistant database corrupted

**Symptom:** "Database is locked" errors, can't start.

**Cause:** Crash or unclean shutdown.

**Fix:**
```bash
# Stop container
docker stop homeassistant

# Check database
docker exec homeassistant sqlite3 /config/home-assistant_v2.db integrity_check

# If corrupted, remove and restore from backup
docker exec homeassistant rm /config/home-assistant_v2.db

# Restore from backup (if available)
tar -xzf ~/ha-backup.tar.gz -C ~/ha-config

# Restart
docker start homeassistant
```

---

## Integrations

### Issue: Google Calendar won't authorize

**Symptom:** OAuth fails or "Invalid redirect URI".

**Cause:** OAuth flow incorrect or token expired.

**Fix:**
1. Remove integration:
   - Settings → Devices & Services → Google Calendar
   - Click ... menu → Delete
2. Restart Home Assistant
3. Re-add integration:
   - Settings → Create Integration
   - Search "Google Calendar"
   - Complete OAuth flow
4. If still fails:
   - Check Home Assistant URL is `http://localhost:8123`
   - Google only allows localhost redirects

---

### Issue: Waze Travel Time shows "Unknown"

**Symptom:** Travel time sensor doesn't populate, always shows "Unknown".

**Cause:** Route invalid or Waze service issue.

**Fix:**
1. Verify addresses are exact:
   - Origin: "123 Main St, Thornton, CO"
   - Destination: "456 Oak Rd, Broomfield, CO"
2. Test in Google Maps:
   - Make sure route exists
   - Check estimated time
3. Check Waze integration:
   - Settings → Devices & Services → Waze Travel Time
   - Re-enter addresses
   - Save and wait 5 minutes
4. Check Home Assistant logs for errors

---

### Issue: Mealie integration not connecting

**Symptom:** "Cannot connect to Mealie" error.

**Cause:** Mealie not running, wrong URL, or bad token.

**Fix:**
1. Verify Mealie is running:
   ```bash
   docker ps | grep mealie
   ```

2. Check it's accessible:
   ```
   http://localhost:9925
   ```
   Should show Mealie login page

3. Generate new API token:
   - Log into Mealie
   - Go to Profile → API Tokens
   - Create new token (copy full text)

4. Update Home Assistant:
   - Settings → Devices & Services → Mealie
   - Click Configure
   - Paste new token
   - Save

---

## Network Issues

### Issue: Can't access from other devices on network

**Symptom:** Works on localhost, but http://192.168.x.x:8123 times out.

**Cause:** Home Assistant only listening on localhost, or firewall blocking.

**Fix:**
1. Check configuration:
   - Open `~/ha-config/configuration.yaml`
   - Look for `http:` section
   - Add: `server_port: 8123`
   - Restart Home Assistant

2. Allow firewall:
   - Windows Defender: Allow Docker through firewall
   - macOS: System Prefs → Security → Firewall options
   - Linux: `sudo ufw allow 8123`

3. Find your IP address:
   ```bash
   ipconfig getifaddr en0  # macOS
   hostname -I  # Linux
   ipconfig  # Windows
   ```

4. Try again:
   ```
   http://192.168.1.100:8123
   ```

---

## Performance

### Issue: Dashboard very slow to load

**Symptom:** Takes 10+ seconds to fully load.

**Cause:** Too many integrations, high latency to API, or underpowered hardware.

**Fix:**
1. **Check integrations:**
   - Remove unused integrations
   - Each integration adds startup time

2. **Check automations:**
   - Settings → Automations & Scenes
   - Disable old/unused automations

3. **Check logs:**
   - Settings → System → Logs
   - Look for slow services
   - Adjust polling intervals

4. **Monitor resources:**
   ```bash
   docker stats homeassistant
   ```
   - If CPU >80% or Memory >1GB constantly, something is wrong

5. **Upgrade hardware:**
   - More RAM (8GB minimum)
   - SSD instead of HDD
   - Better network (Ethernet not WiFi)

---

## Still Stuck?

### Debug Steps

1. **Check logs first:**
   - Settings → System → Logs
   - Search for error keywords

2. **Restart Home Assistant:**
   - Settings → System → Restart Home Assistant
   - Or: `docker restart homeassistant`

3. **Clear browser cache:**
   - Ctrl+Shift+Delete (Chrome/Firefox)
   - Cmd+Shift+Delete (macOS Safari)
   - Retry

4. **Check GitHub issues:**
   - Look for similar issue on Home Assistant GitHub
   - Often has solutions

5. **Ask for help:**
   - Home Assistant Discord: https://discord.gg/home-assistant
   - Home Assistant Forum: https://community.home-assistant.io

---

## Report an Issue

Found a bug in Family Hub?

1. Check this page (might be known)
2. Check GitHub Issues (https://github.com/thenarsais/Family-Hub/issues)
3. Open new issue:
   - Describe problem clearly
   - Include error messages
   - Describe steps to reproduce
   - Attach logs if applicable

---

Last updated: June 2026
