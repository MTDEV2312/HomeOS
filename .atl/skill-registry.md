# Skill Registry

**Project**: HomeOS (Erp_Personal)
**Generated**: 2026-05-05
**Source**: C:\Users\ASUS\.gemini\antigravity\skills\

## User Skills

> Skills from C:\Users\ASUS\.gemini\antigravity\skills\

| Skill | Trigger Context | Path |
|-------|-----------------|------|
| branch-pr | Creating a pull request, opening a PR, preparing changes for review | C:\Users\ASUS\.gemini\antigravity\skills\branch-pr\SKILL.md |
| issue-creation | Creating a GitHub issue, reporting a bug, requesting a feature | C:\Users\ASUS\.gemini\antigravity\skills\issue-creation\SKILL.md |
| judgment-day | "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | C:\Users\ASUS\.gemini\antigravity\skills\judgment-day\SKILL.md |
| react-doctor | After making React changes, reviewing code, finishing a feature, fixing bugs in a React project | C:\Users\ASUS\.gemini\antigravity\skills\react-doctor\SKILL.md |
| skill-creator | Creating a new skill, adding agent instructions, documenting patterns for AI | C:\Users\ASUS\.gemini\antigravity\skills\skill-creator\SKILL.md |

## SDD Phase Skills (auto-loaded by orchestrator)

| Skill | Phase | Path |
|-------|-------|------|
| sdd-explore | Exploration / investigation | C:\Users\ASUS\.gemini\antigravity\skills\sdd-explore\SKILL.md |
| sdd-propose | Proposal creation | C:\Users\ASUS\.gemini\antigravity\skills\sdd-propose\SKILL.md |
| sdd-spec | Specification writing | C:\Users\ASUS\.gemini\antigravity\skills\sdd-spec\SKILL.md |
| sdd-design | Technical design | C:\Users\ASUS\.gemini\antigravity\skills\sdd-design\SKILL.md |
| sdd-tasks | Task breakdown | C:\Users\ASUS\.gemini\antigravity\skills\sdd-tasks\SKILL.md |
| sdd-apply | Implementation | C:\Users\ASUS\.gemini\antigravity\skills\sdd-apply\SKILL.md |
| sdd-verify | Verification | C:\Users\ASUS\.gemini\antigravity\skills\sdd-verify\SKILL.md |
| sdd-archive | Archiving completed changes | C:\Users\ASUS\.gemini\antigravity\skills\sdd-archive\SKILL.md |

## Inline Skills (flat files, no SKILL.md)

| Skill | Description |
|-------|-------------|
| api-design-principles | API design principles |
| backend-patterns | Backend patterns |
| cloudinary | Cloudinary integration patterns |
| code-review | Code review guidelines |
| frontend-engineer | Frontend engineering best practices |
| mongoose-mongodb | Mongoose/MongoDB patterns |
| nodejs-backend-patterns | Node.js backend patterns |
| react-vite-best-practices | React + Vite best practices |
| responsive-design | Responsive design patterns |
| rest-api-design | REST API design |
| tailwind-css-patterns | Tailwind CSS patterns |
| tailwind-design-system | Tailwind design system |
| vercel-composition-patterns | Vercel composition patterns |
| vercel-react-best-practices | Vercel + React best practices |
| vercel-react-native-skills | React Native skills |
| web-design-guidelines | Web design guidelines |

## Project Convention Files

- AGENTS.md (Project-level instructions for InsForge integration)

## Compact Rules

```
REACT/TSX: use react-doctor after completing a feature or fixing bugs
PR WORKFLOW: use branch-pr when opening a pull request
CODE REVIEW: use judgment-day for adversarial review on demand
STACK: Next.js 15 + React 19 + TypeScript + Tailwind CSS + Supabase (via InsForge)
BACKEND: InsForge (Supabase-compatible) — client at src/lib/insforge.ts
AUTH: Auth context at src/lib/auth-context.tsx
INSFORGE: Use InsForge MCP tools for backend infrastructure (database, storage, functions). ALWAYS call fetch-docs before writing SDK code.
```
