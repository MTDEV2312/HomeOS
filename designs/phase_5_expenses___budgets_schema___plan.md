# HomeOS: Phase 5 - Expenses & Budgets Schema

## Overview
Phase 5 introduces financial transparency and coordination. This system allows household members to track shared spending, manage monthly budgets, and visualize their financial health.

### Table: `expense_categories`
- `id`: uuid (PK)
- `household_id`: uuid (FK -> households.id)
- `name`: string (e.g., "Utilities", "Groceries", "Rent")
- `icon`: string (icon identifier)
- `color`: string (hex code for charts)

### Table: `expenses`
- `id`: uuid (PK)
- `household_id`: uuid (FK -> households.id)
- `payer_id`: uuid (FK -> users.id)
- `category_id`: uuid (FK -> expense_categories.id)
- `amount`: decimal(12,2)
- `description`: string
- `date`: date
- `receipt_url`: string (link to Phase 8 Storage)
- `created_at`: timestamp

### Table: `budgets`
- `id`: uuid (PK)
- `household_id`: uuid (FK -> households.id)
- `category_id`: uuid (FK -> expense_categories.id, nullable for total budget)
- `amount`: decimal(12,2)
- `period`: enum ('MONTHLY', 'WEEKLY')
- `start_date`: date

## UI Plan
1. **Expenses Dashboard:** Overview of spending vs. budget with progress bars and recent transactions.
2. **Add Expense Modal:** Form for logging new purchases, selecting payers, and attaching receipts.
3. **Budget Management:** Dedicated view for setting and adjusting category-specific limits.
4. **Analytics:** Simple charts (Pie/Bar) showing spending distribution across categories.