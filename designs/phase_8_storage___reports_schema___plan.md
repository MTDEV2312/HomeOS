# HomeOS: Phase 8 - Document Storage & Reports Schema

## Overview
Phase 8 completes the HomeOS ecosystem by providing a central repository for critical household documents (manuals, warranties, insurance, leases) and high-level reporting across all modules.

### Table: `documents`
- `id`: uuid (PK)
- `household_id`: uuid (FK -> households.id)
- `uploaded_by`: uuid (FK -> users.id)
- `name`: string (e.g., "Home Insurance Policy")
- `category`: enum ('WARRANTY', 'MANUAL', 'FINANCIAL', 'LEGAL', 'MEDICAL', 'OTHER')
- `file_url`: string (InsForge Storage link)
- `file_type`: string (e.g., "pdf", "jpg", "png")
- `file_size`: integer (bytes)
- `linked_asset_id`: uuid (FK -> assets.id, nullable)
- `expiry_date`: date (nullable, e.g., for insurance/contracts)
- `created_at`: timestamp

### Reporting Strategy (Aggregation)
Reports will aggregate data from existing modules:
- **Finance Report:** Monthly spending trends from `expenses`.
- **Maintenance Report:** Total cost of ownership and service frequency from `maintenance_logs`.
- **Inventory Report:** Waste tracking and restock frequency from `inventory_items`.

## UI Plan
1. **Document Vault:** A searchable gallery/list of household documents with category filters and expiration alerts.
2. **Reports Dashboard:** Interactive charts showing household "Health" across finance, maintenance, and tasks.
3. **Upload Modal:** A simple interface for dragging and dropping new files, tagging categories, and linking to assets.
