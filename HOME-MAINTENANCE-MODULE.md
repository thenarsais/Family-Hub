# Home Maintenance Module - Feature Specification

**Status**: Planned (Phase 2/3)  
**Priority**: Medium  
**Complexity**: Medium  
**Estimated Effort**: 3-4 weeks

---

## Overview

The Home Maintenance Module is a dedicated system for tracking, scheduling, and managing household maintenance tasks separate from the daily chore system. It focuses on recurring appliance/system maintenance, automatic run-hour tracking via smart device integration, and predictive maintenance alerts.

### Key Difference from Chore System
- **Chores**: Daily/regular family tasks that rotate and earn points
- **Maintenance**: System/appliance upkeep based on run-time, calendar intervals, or manufacturer recommendations

---

## Core Features

### 1. HVAC Filter Management
#### Auto-Tracking
- **Data Source**: SmartThings HVAC system integration
- **Tracks**: 
  - Filter run hours (compressor runtime)
  - Filter age (days since installation)
  - Air quality metrics (if sensor available)
- **Alerts**:
  - "Filter at 80% life" (3-month reminder for typical filters)
  - "Filter due for replacement" (100% of estimated life)
  - "Filter overdue" (days past expiration)

#### Logging
- Auto-log filter changes with timestamp
- Store filter type, brand, MERV rating
- Log run hours at time of change
- Track cost per filter
- Calculate average lifespan

#### User Actions
- Manual "Mark Filter Changed" button
- Log notes about filter condition
- Set custom replacement intervals
- View filter history (last 10 filters)
- Schedule next change date

---

### 2. Water Filter Management
Similar to HVAC but for:
- Refrigerator water filters
- Whole-house water filters
- Pitcher filters (Brita, etc.)
- Well water filters

**Tracking**: Days since installation, gallons used (if connected)

---

### 3. General Appliance Maintenance
Customizable maintenance items with:
- **Name**: Dryer vent cleaning, Dishwasher descale, etc.
- **Frequency**: Every X days/months
- **Last Completed**: Date & time logged
- **Next Due**: Auto-calculated
- **Notes**: Condition, observations
- **Cost**: Track expenses

### Maintenance Types
- Dryer vent cleaning (monthly)
- Dishwasher descaling (quarterly)
- Washing machine cleaning (quarterly)
- Refrigerator coil cleaning (quarterly)
- Oven/microwave deep clean (semi-annual)
- Furnace inspection (annual)
- AC service (annual)
- Water heater flush (annual)
- Septic inspection (annual - if applicable)

---

### 4. Smart Device Integration

#### Connected to SmartThings:
- HVAC system (filter hours)
- Water heater (if smart-enabled)
- Washer/dryer (cycle counts)
- Dishwasher (cycle counts)

#### Auto-Logging Capabilities:
- Automatically log appliance run-time metrics
- Create maintenance alerts based on usage patterns
- Predict maintenance needs before failure

---

### 5. Maintenance Alerts & Notifications

#### Alert Levels
1. **Informational** (30 days before due)
   - "Note: Filter due in 30 days"
   
2. **Warning** (7 days before due)
   - "Alert: Filter due in 7 days"
   
3. **Critical** (due date or overdue)
   - "Urgent: Filter is overdue"
   - Email notification to family admin

#### Notification Channels
- Dashboard notification banner
- Email (daily digest option)
- Optional: SMS for critical items

---

### 6. Maintenance History & Logging

#### What Gets Logged
- Date completed
- Time spent (optional)
- Cost (parts, labor)
- Notes/observations
- Photos (optional)
- Next due date
- Performed by (family member)

#### History View
- Timeline of all maintenance per item
- Cost tracking (total spent on filters, etc.)
- Average lifespan metrics
- Seasonal patterns

#### Export Capabilities
- PDF maintenance report (for home records)
- CSV for spreadsheet analysis
- Print-friendly view

---

### 7. Dashboard Integration

#### Maintenance Widget
Shows on main dashboard:
- "3 items due this month"
- "Next: HVAC filter (5 days)"
- "Overdue: 0 items"
- Quick link to maintenance section

#### Maintenance Section Page
- Calendar view of upcoming maintenance
- Timeline of recent completions
- Cost summary (this month/year/all-time)
- Filter efficiency metrics

---

## Database Schema

```sql
-- Maintenance Items
CREATE TABLE maintenance_items (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50), -- 'hvac', 'water', 'appliance', 'other'
  description TEXT,
  frequency_days INT,
  estimated_cost DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Maintenance Logs
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY,
  maintenance_item_id UUID NOT NULL,
  completed_at TIMESTAMP,
  completed_by UUID,
  run_hours_at_completion INT,
  cost DECIMAL,
  notes TEXT,
  photos JSON, -- array of photo URLs
  created_at TIMESTAMP,
  FOREIGN KEY (maintenance_item_id) REFERENCES maintenance_items(id),
  FOREIGN KEY (completed_by) REFERENCES users(id)
);

-- Maintenance Alerts
CREATE TABLE maintenance_alerts (
  id UUID PRIMARY KEY,
  maintenance_item_id UUID NOT NULL,
  alert_level VARCHAR(20), -- 'info', 'warning', 'critical'
  message TEXT,
  next_due_date DATE,
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP,
  FOREIGN KEY (maintenance_item_id) REFERENCES maintenance_items(id)
);

-- HVAC Filter Tracking (SmartThings Integration)
CREATE TABLE hvac_filters (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id VARCHAR(255), -- SmartThings device ID
  filter_type VARCHAR(100), -- MERV rating, brand
  installed_at TIMESTAMP,
  estimated_life_hours INT, -- typical: 500-1000 hours
  alert_at_percent INT DEFAULT 80,
  current_run_hours INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## API Endpoints

### Maintenance Items
```
GET    /api/maintenance/items              - List all maintenance items
POST   /api/maintenance/items              - Create new item
GET    /api/maintenance/items/:id          - Get item details
PUT    /api/maintenance/items/:id          - Update item
DELETE /api/maintenance/items/:id          - Delete item
```

### Maintenance Logs
```
GET    /api/maintenance/items/:id/logs     - Get item's maintenance history
POST   /api/maintenance/items/:id/log      - Log maintenance completion
GET    /api/maintenance/logs/:logId        - Get specific log entry
PUT    /api/maintenance/logs/:logId        - Update log entry
```

### HVAC Filter Tracking
```
GET    /api/maintenance/hvac/filter        - Get current filter status
POST   /api/maintenance/hvac/filter/change - Log filter change
GET    /api/maintenance/hvac/filter/alerts - Get HVAC alerts
PUT    /api/maintenance/hvac/filter/sync   - Sync with SmartThings
```

### Alerts & Dashboard
```
GET    /api/maintenance/alerts             - Get all active alerts
GET    /api/maintenance/dashboard          - Get maintenance summary
PUT    /api/maintenance/alerts/:id/ack     - Acknowledge alert
```

---

## Frontend Components

### Pages
- `/maintenance` - Main maintenance dashboard
- `/maintenance/items` - List of all items
- `/maintenance/items/new` - Create new item
- `/maintenance/items/:id` - Item details & history
- `/maintenance/hvac` - Dedicated HVAC filter view
- `/maintenance/calendar` - Calendar view of due dates

### Components
- `MaintenanceDashboard.tsx` - Overview & stats
- `MaintenanceList.tsx` - Items list with due dates
- `MaintenanceForm.tsx` - Create/edit form
- `MaintenanceCard.tsx` - Item card with status
- `MaintenanceHistory.tsx` - Timeline of completions
- `HVACFilterWidget.tsx` - Filter status widget
- `MaintenanceAlert.tsx` - Alert notification
- `MaintenanceCalendar.tsx` - Calendar view

---

## Integration Points

### SmartThings
- Connect HVAC system for run-hour tracking
- Set up device monitoring for filter status (if available)
- Receive appliance usage data

### Email Service
- Daily maintenance digest
- Overdue reminders
- Weekly summary

### Dashboard
- Maintenance widget
- Quick-access to due items
- Alert badges

### Points System (Optional Phase 3)
- Award points when family members complete maintenance
- Track "Home Hero" contributions

---

## User Stories

### User Story 1: HVAC Filter Awareness
> As a homeowner, I want to automatically track my HVAC filter's run hours so I never forget to change it and can avoid poor air quality.

**Acceptance Criteria**:
- Filter status widget shows current run hours
- Alert triggers at 80% of estimated life
- Can manually mark filter changed
- History shows last 10 filter changes

### User Story 2: Maintenance Planning
> As a homeowner, I want to see all upcoming maintenance in one place so I can plan my schedule and budget.

**Acceptance Criteria**:
- Calendar view shows all due dates
- Sortable by date, cost, category
- Can export upcoming maintenance list
- Receives email reminder 7 days before due

### User Story 3: Maintenance Record
> As a homeowner, I want to log every maintenance action with costs and notes so I have a complete home history for resale or warranty purposes.

**Acceptance Criteria**:
- Can log date, cost, notes, photos
- View complete history for each item
- Generate PDF report of all maintenance
- Track total spent on each category

---

## Implementation Phases

### Phase 2.1 (Weeks 1-2)
- [ ] Database schema creation
- [ ] API endpoints for basic CRUD
- [ ] Frontend: Item list and form
- [ ] Manual maintenance logging

### Phase 2.2 (Weeks 2-3)
- [ ] HVAC filter auto-tracking via SmartThings
- [ ] Alert system implementation
- [ ] Dashboard widget
- [ ] Email notifications

### Phase 2.3 (Week 3-4)
- [ ] Maintenance history & analytics
- [ ] Calendar view
- [ ] PDF export
- [ ] Photo upload support

### Phase 3 (Future)
- [ ] Points integration
- [ ] Mobile app (Flutter)
- [ ] Predictive maintenance ML
- [ ] Cost analysis & budgeting

---

## Success Metrics

- Users log 80%+ of maintenance within 7 days of completion
- Alert system reduces missed maintenance by 50%+
- Dashboard adoption: 90%+ of users view maintenance widget weekly
- HVAC filter replacement compliance: 95%+
- User satisfaction: 4.5+/5 stars

---

## Dependencies

- SmartThings API integration (already exists)
- Email service (SendGrid - already exists)
- File upload capability (for photos)
- PDF generation library
- Charts/analytics library (for history view)

---

## Open Questions

1. Should maintenance completion earn family points?
2. Should we support photo uploads for before/after?
3. Should we integrate with appliance manufacturer APIs for recommendations?
4. Should we support barcode scanning for filter specifications?
5. Should we add predictive ML for optimal replacement timing?

---

## Notes

This module provides real value for homeowners who want to maintain their homes proactively. The HVAC filter tracking alone could save money and improve air quality. The separation from chores keeps the family activity system clean while providing serious home utility.

Consider this a high-value Phase 2 addition that doesn't require points/gamification but adds practical home management value.
