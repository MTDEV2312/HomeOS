# HomeOS: Phase 6 - Inventory Management Schema

## Overview
Phase 6 adds a layer of asset management and supply tracking. This system allows households to monitor their pantry, medicine cabinet, and general supplies, including quantity alerts and expiration dates.

### Table: `inventory_categories`
- `id`: uuid (PK)
- `household_id`: uuid (FK -> households.id)
- `name`: string (e.g., "Pantry", "First Aid", "Cleaning Supplies")
- `icon`: string (icon identifier)

### Table: `inventory_items`
- `id`: uuid (PK)
- `household_id`: uuid (FK -> households.id)
- `category_id`: uuid (FK -> inventory_categories.id)
- `name`: string (required)
- `brand`: string (optional)
- `current_quantity`: decimal(10,2)
- `unit`: string (e.g., "units", "oz", "kg", "bottles")
- `minimum_threshold`: decimal(10,2) (triggers low stock alert)
- `expiration_date`: date (nullable)
- `location`: string (e.g., "Kitchen Pantry", "Garage Shelf")
- `last_restocked_at`: timestamp
- `created_at`: timestamp

## UI Plan
1. **Inventory Dashboard:** Categorized overview of household supplies with "Low Stock" and "Expiring Soon" priority alerts.
2. **Item Management Modal:** Form for adding/editing items, setting thresholds, and updating quantities.
3. **Restock Integration:** Quick actions to add low-stock items directly to the Phase 4 Shopping Lists.
