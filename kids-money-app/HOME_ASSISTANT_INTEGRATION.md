# Home Assistant Integration Guide

This guide explains how to integrate the Kids Money App with Home Assistant and display it on your Family Hub.

## Overview

The Kids Money App can be integrated with Home Assistant in two ways:

1. **Embedded Panel** - Display the app as a custom panel in Home Assistant
2. **Data Sensors** - Expose portfolio data as Home Assistant sensors

## Option 1: Embedded Panel Integration

### Step 1: Build the App

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

### Step 2: Add Custom Frontend Card

Place the built app in your Home Assistant config:

```bash
# From Kids Money App root directory
cp -r build /path/to/homeassistant/config/www/kids-money-app
```

On Windows:
```powershell
Copy-Item -Recurse build "C:\your\homeassistant\config\www\kids-money-app"
```

### Step 3: Create Custom Panel

Edit `configuration.yaml`:

```yaml
frontend:
  extra_module_url:
    - /local/kids-money-app/index.js

# Add custom panel (requires custom_cards)
```

Alternatively, use the UI:
1. Settings → Dashboards → Create new dashboard
2. Add custom card manually via code editor
3. Use this template:

```yaml
type: custom:iframe-card
url: /local/kids-money-app/index.html
height: "800"
```

### Step 4: Access the App

Navigate to Home Assistant and select the Kids Money dashboard.

## Option 2: Expose as REST API

### Step 1: Create API Endpoints

Modify `src/App.jsx` to add API server support:

```javascript
// Add this to your app setup
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// API Endpoints
app.get('/api/portfolio', (req, res) => {
  // Return current portfolio state
  res.json({
    portfolioValue: getPortfolioValue(),
    cash: portfolio.cash,
    gain: portfolio.gain,
    gainPercent: portfolio.gainPercent,
    holdings: portfolio.holdings,
  });
});

app.get('/api/stocks', (req, res) => {
  res.json(stocks);
});
```

### Step 2: Configure Home Assistant Rest Sensors

Edit `configuration.yaml`:

```yaml
rest:
  - resource: http://localhost:3000/api/portfolio
    scan_interval: 30
    sensor:
      - name: "Kids Portfolio Value"
        unique_id: kids_portfolio_value
        value_template: "{{ value_json.portfolioValue | float }}"
        unit_of_measurement: "$"
        
      - name: "Kids Portfolio Cash"
        unique_id: kids_portfolio_cash
        value_template: "{{ value_json.cash | float }}"
        unit_of_measurement: "$"
        
      - name: "Kids Portfolio Gain"
        unique_id: kids_portfolio_gain
        value_template: "{{ value_json.gain | float }}"
        unit_of_measurement: "$"
        
      - name: "Kids Portfolio Gain %"
        unique_id: kids_portfolio_gain_pct
        value_template: "{{ value_json.gainPercent | float }}"
        unit_of_measurement: "%"

  - resource: http://localhost:3000/api/stocks
    scan_interval: 60
    sensor:
      - name: "Stock Prices"
        unique_id: stock_prices
        value_template: "{{ value_json | tojson }}"
```

### Step 3: Create Dashboard Cards

Use the sensors in a dashboard:

```yaml
type: vertical-stack
cards:
  - type: entities
    title: Kids Money Portfolio
    entities:
      - sensor.kids_portfolio_value
      - sensor.kids_portfolio_cash
      - sensor.kids_portfolio_gain
      - sensor.kids_portfolio_gain_pct
      
  - type: gauge
    entity: sensor.kids_portfolio_value
    title: Total Portfolio Value
    min: 0
    max: 20000
    
  - type: custom:simple-pie-chart
    entities:
      - sensor.kids_portfolio_value
      - sensor.kids_portfolio_cash
    title: Portfolio Breakdown
```

## Option 3: Family Hub Specific Integration

### Lovelace Dashboard Configuration

Create a dedicated dashboard for the Family Hub display:

```yaml
title: Kids Money
icon: mdi:piggy-bank
views:
  - title: Portfolio
    icon: mdi:chart-line
    cards:
      - type: custom:gauge-card
        entity: sensor.kids_portfolio_value
        title: Portfolio Value
        severity:
          green: 10000
          yellow: 12000
          red: 8000
          
      - type: custom:mini-graph-card
        entity: sensor.kids_portfolio_value
        title: Portfolio Growth
        hours_to_show: 24
        show:
          name: true
          icon: true
          
      - type: custom:button-card
        entity: binary_sensor.kids_portfolio_up
        name: Portfolio Status
        state:
          - value: 'on'
            color: green
            icon: mdi:trending-up
          - value: 'off'
            color: red
            icon: mdi:trending-down

  - title: Holdings
    icon: mdi:shopping-bag
    cards:
      - type: custom:simple-pie-chart
        data_generator: |
          return entities['sensor.stock_prices'].attributes.holdings.map(h => ({
            label: h.stock_id,
            value: h.value
          }));
```

### Template Sensors

Create template sensors for calculated values:

```yaml
template:
  - binary_sensor:
      - name: "Kids Portfolio Up"
        unique_id: kids_portfolio_up
        state: "{{ state_attr('sensor.kids_portfolio_gain_pct', 'friendly_name') | float(0) > 0 }}"
        
      - name: "Kids Portfolio Break Even"
        unique_id: kids_portfolio_break_even
        state: "{{ states('sensor.kids_portfolio_value') | float(0) == 10000 }}"
        
  - sensor:
      - name: "Kids Daily Return"
        unique_id: kids_daily_return
        unit_of_measurement: "%"
        value_template: "{{ (states('sensor.kids_portfolio_gain_pct') | float(0)) | round(2) }}"
```

## Option 4: Automation Examples

Create automations to notify on milestone achievements:

```yaml
automation:
  - alias: "Kids Portfolio Milestone - $12,000"
    trigger:
      numeric_state:
        entity_id: sensor.kids_portfolio_value
        above: 12000
    action:
      service: notify.notify
      data:
        message: "🎉 Your portfolio reached $12,000!"
        title: "Money Goal Achieved!"

  - alias: "Kids Portfolio Lost Value"
    trigger:
      numeric_state:
        entity_id: sensor.kids_portfolio_gain_pct
        below: -10
    action:
      service: notify.notify
      data:
        message: "⚠️ Portfolio down more than 10%. Time to review your stocks?"
        title: "Portfolio Alert"

  - alias: "Kids Daily Portfolio Check"
    trigger:
      time: "18:00:00"
    action:
      service: persistent_notification.create
      data:
        title: "Daily Portfolio Summary"
        message: |
          Portfolio Value: {{ states('sensor.kids_portfolio_value') }}
          Today's Gain: {{ states('sensor.kids_portfolio_gain_pct') }}%
```

## Troubleshooting

### App Not Loading
- Ensure the build folder is in the correct location
- Check Home Assistant logs: `Settings → Developer Tools → Logs`
- Verify CORS headers if using REST API

### Sensor Data Not Updating
- Check Home Assistant REST integration logs
- Verify the Kids Money App server is running
- Confirm API endpoints are accessible

### Portfolio Data Not Syncing
- Clear browser cache
- Restart Home Assistant
- Check localStorage in browser dev tools

## Advanced: Custom Component

For full integration, create a custom Home Assistant component:

```python
# custom_components/kids_money/manifest.json
{
  "domain": "kids_money",
  "name": "Kids Money App",
  "codeowners": ["@yourgithub"],
  "config_flow": true,
  "documentation": "https://your-docs.com",
  "requirements": ["aiohttp"],
  "version": "1.0.0"
}
```

## Security Considerations

- **Authentication**: Add password protection to the Kids Money App
- **CORS**: Configure CORS properly if exposed via REST API
- **Firewall**: Only expose API internally (local network)
- **Data**: Portfolio data is stored locally in browser localStorage
- **HTTPS**: Use HTTPS when accessing over network

## Performance Tips

1. **Caching**: REST sensor data with 30-60 second intervals
2. **Updates**: Price updates every 30 seconds in app
3. **Compression**: Use gzip compression for build files
4. **Database**: Consider storing historical data in InfluxDB

## Future Enhancements

- [ ] Home Assistant add-on package
- [ ] Official custom component
- [ ] Mobile app with push notifications
- [ ] Voice control integration (Alexa, Google)
- [ ] Automated buy/sell recommendations
- [ ] Multi-user family accounts
- [ ] Cloud sync option

## Support

For integration issues:
1. Check Home Assistant logs
2. Verify app is running: `curl http://localhost:3000`
3. Test API endpoints: `curl http://localhost:3000/api/portfolio`
4. Check browser console for errors (F12)

---

**Happy integrating!** 🚀
