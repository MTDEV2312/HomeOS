# HomeOS: Phase 3 - Task Management Schema

## Overview
Phase 3 introduces the core productivity engine of HomeOS. The task system is designed for high-frequency interaction and real-time updates.

### Table: `tasks`
- `id`: uuid (PK)
- `household_id`: uuid (FK -> households.id)
- `creator_id`: uuid (FK -> users.id)
- `assigned_to`: uuid (FK -> users.id, nullable)
- `title`: string (required)
- `description`: text
- `due_date`: timestamp
- `priority`: enum ('LOW', 'MEDIUM', 'HIGH', 'URGENT')
- `status`: enum ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
- `is_recurring`: boolean (default: false)
- `recurrence_rule`: string (RRULE format)
- `created_at`: timestamp
- `updated_at`: timestamp

### Table: `task_comments`
- `id`: uuid (PK)
- `task_id`: uuid (FK -> tasks.id)
- `user_id`: uuid (FK -> users.id)
- `content`: text
- `created_at`: timestamp

## UI Plan
1. **Tasks Dashboard:** A central view for "Today," "Upcoming," and "Completed" filters.
2. **Task Creation/Edit View:** A modal or slide-over for managing task details, priorities, and assignments.
3. **Real-time Updates:** Tasks will leverage InsForge Realtime to sync status changes across all household members.
