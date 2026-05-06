# HomeOS: Phase 7 - Maintenance & Assets Schema

## Overview
Phase 7 focuses on the long-term health of the home. This module tracks home assets (appliances, HVAC, vehicles) and schedules both proactive and reactive maintenance tasks.

### Table: `assets`
- `id`: uuid (PK)
- `household_id`: uuid (FK -> households.id)
- `name`: string (e.g., "Dishwasher", "AC Unit")
- `category`: enum ('APPLIANCE', 'HVAC', 'PLUMBING', 'ELECTRICAL', 'VEHICLE', 'STRUCTURE')
- `model_number`: string
- `serial_number`: string
- `purchase_date`: date
- `warranty_expiry`: date
- `location`: string (e.g., "Kitchen", "Attic")
- `manual_url`: string (link to Phase 8 Storage)

### Table: `maintenance_logs`
- `id`: uuid (PK)
- `asset_id`: uuid (FK -> assets.id)
- `task_name`: string (e.g., "Filter Replacement")
- `performed_by`: string
- `service_date`: date
- `cost`: decimal(12,2)
- `notes`: text
- `next_service_date`: date

### Table: `maintenance_schedule`
- `id`: uuid (PK)
- `asset_id`: uuid (FK -> assets.id)
- `task_description`: string
- `frequency_months`: integer
- `last_performed`: date
- `next_due`: date

## UI Plan
1. **Maintenance Dashboard:** A summary of upcoming service tasks and a "Health Score" for home systems.
2. **Asset Inventory:** A gallery or list of major household assets with quick access to manuals and warranty info.
3. **Log Maintenance Modal:** A form to record service history, costs, and set next service reminders.
4. **Integration:** Link critical maintenance failures to the Phase 3 Task Management system.