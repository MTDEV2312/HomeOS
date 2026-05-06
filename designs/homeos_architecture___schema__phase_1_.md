# HomeOS: InsForge Technical Architecture (Phase 1)

## Backend Strategy: InsForge Free Tier Optimization
HomeOS is designed to operate efficiently within the 50 Forge Credit monthly limit. 

### Key Efficiency Measures:
- **Ephemeral Environments:** Use `insforge env stop` immediately after development sessions to prevent credit drain from the 30-minute idle timeout.
- **Resource Management:** Utilizing Alpine-based multi-stage builds to stay within the 5GB storage and 10GB bandwidth caps.
- **State Management:** Prioritizing client-side state for non-critical UI interactions to minimize unnecessary backend calls.

## Phase 1: Foundation Schema
### Authentication & Users
- **Provider:** InsForge Auth (Email/Password)
- **Table:** `users`
  - `id`: uuid (PK)
  - `email`: string (unique)
  - `full_name`: string
  - `avatar_url`: string
  - `created_at`: timestamp
  - `updated_at`: timestamp

## Project Structure (Next.js)
- `/app`: Next.js App Router (Dashboard, Auth, Profile)
- `/components`: Shared UI (Sidebar, TopBar, Cards)
- `/lib`: InsForge SDK initialization and helper functions
- `/styles`: Design system tokens and global CSS
