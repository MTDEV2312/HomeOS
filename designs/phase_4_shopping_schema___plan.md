# HomeOS: Phase 4 - Shopping List Schema

## Overview
Phase 4 enables household collaboration on groceries and supplies. The system supports multiple lists, item categorization, and real-time inventory tracking.

### Table: `shopping_lists`
- `id`: uuid (PK)
- `household_id`: uuid (FK -> households.id)
- `name`: string (e.g., "Weekly Groceries", "Hardware Store")
- `description`: text
- `is_archived`: boolean (default: false)
- `created_at`: timestamp

### Table: `shopping_list_items`
- `id`: uuid (PK)
- `list_id`: uuid (FK -> shopping_lists.id)
- `added_by`: uuid (FK -> users.id)
- `item_name`: string (required)
- `quantity`: string (e.g., "2", "1 gallon")
- `category`: string (e.g., "Dairy", "Produce", "Cleaning")
- `is_purchased`: boolean (default: false)
- `purchased_at`: timestamp
- `purchased_by`: uuid (FK -> users.id, nullable)
- `price`: decimal (optional)

## UI Plan
1. **Shopping Dashboard:** Overview of all active lists with progress bars (e.g., 5/12 items).
2. **Detailed List View:** Categorized view of items with quick-toggle "Purchased" states and "Add Item" functionality.
3. **Collaboration:** Real-time updates via InsForge Realtime to prevent duplicate purchases.
