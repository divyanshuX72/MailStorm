# AI Command Layer Integration

Add a completely separate AI Command module on top of the existing Email Campaign Management System. **Zero changes** to any existing file's logic — only minimal additive wiring (1 new import + 1 new route line in the route index, 1 new nav item in the sidebar, 1 new route in App.tsx).

## User Review Required

> [!IMPORTANT]
> **OpenRouter API Key Required** — You will need to add `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` to your `.env` file. The model defaults to a free model (`openrouter/auto`) but you can swap it for any OpenRouter-supported model.

> [!IMPORTANT]
> **No Database Changes** — This plan requires **zero** schema changes. The AI layer only reads existing data for validation and calls existing service functions for execution.

> [!WARNING]
> **Existing Code Impact** — Only **3 existing files** receive minimal additive changes (adding imports/routes). No existing logic, UI, or behavior is modified.

## Open Questions

1. **Default free model**: OpenRouter's free models change frequently. I'll default to `openrouter/auto` which auto-selects the best available free model. Would you prefer a specific model like `mistralai/mistral-7b-instruct:free` or `meta-llama/llama-3-8b-instruct:free`?

2. **Subject line for AI-created campaigns**: When the AI creates a new campaign via `send_email` action, the subject will be pulled from the matched template's `subject` field. Is that acceptable, or should the user be able to specify a custom subject in the command?

---

## Proposed Changes

### Backend: AI Module (All New Files)

All AI-related code lives in a completely isolated `backend/src/ai/` directory.

---

#### [NEW] [openrouter.service.ts](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/backend/src/ai/openrouter.service.ts)

HTTP client that calls the OpenRouter API. Sends the system prompt + user command, receives structured JSON back. Handles:
- API key from `env` config
- System prompt construction
- Response parsing with retry on invalid JSON (1 retry)
- Timeout and error handling

#### [NEW] [prompt.service.ts](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/backend/src/ai/prompt.service.ts)

Builds the system prompt sent to the LLM. Contains:
- Static instruction block (JSON-only output, supported actions, required fields)
- Example input/output pairs for `send_email` and `run_campaign` actions
- Dynamically injects the list of existing groups, templates, and SMTP names from the database so the LLM can match more accurately

#### [NEW] [command.parser.ts](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/backend/src/ai/command.parser.ts)

Parses and normalizes the raw JSON from OpenRouter:
- Type definitions for `AICommand` (union of `SendEmailCommand` and `RunCampaignCommand`)
- JSON extraction (strips markdown code fences if present)
- Field validation (required fields present, valid action type)

#### [NEW] [validation.service.ts](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/backend/src/ai/validation.service.ts)

Validates AI-parsed command against real database records:
- **`send_email`**: Fuzzy-matches group name, template name, and SMTP name against the user's actual data using case-insensitive `contains` queries. Returns resolved IDs or specific error messages ("Group 'Clients' not found", etc.)
- **`run_campaign`**: Fuzzy-matches campaign name. Verifies the campaign exists, belongs to the user, and is in a startable status (DRAFT/SCHEDULED)

#### [NEW] [execution.service.ts](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/backend/src/ai/execution.service.ts)

Executes validated commands by calling **existing** backend services:
- **`send_email`** → calls `campaignService.create()` with the resolved IDs, then `campaignService.start()` to begin sending
- **`run_campaign`** → calls `campaignService.start()` on the matched existing campaign

No new email sending logic. No direct database writes. Only calls existing service methods.

#### [NEW] [ai.controller.ts](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/backend/src/ai/ai.controller.ts)

Express request handler for `POST /api/ai-command`:
- Receives `{ command: string }`
- Orchestrates the full pipeline: parse → validate → execute
- Returns structured response with `status`, `parsedCommand`, `validationResult`, `executionResult`, and `error` fields
- Handles all error cases gracefully

#### [NEW] [ai.routes.ts](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/backend/src/ai/ai.routes.ts)

Express router:
- `POST /` — the main AI command endpoint
- Protected by `authenticate` middleware (same as all other routes)
- Protected by rate limiter to prevent abuse

---

### Backend: Wiring (Minimal Existing File Changes)

---

#### [MODIFY] [env.ts](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/backend/src/config/env.ts)

Add 2 optional env vars to the Zod schema:
```diff
+ // AI / OpenRouter
+ OPENROUTER_API_KEY: z.string().optional().default(''),
+ OPENROUTER_MODEL: z.string().optional().default('openrouter/auto'),
```

#### [MODIFY] [index.ts](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/backend/src/routes/index.ts)

Add 1 import and 1 route line:
```diff
+ import aiRoutes from '../ai/ai.routes';
  // Register route modules
  ...
+ router.use('/ai-command', aiRoutes);
```

---

### Frontend: AI Command Page (All New Files)

---

#### [NEW] [AiCommandPage.tsx](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/frontend/src/pages/ai/AiCommandPage.tsx)

Complete AI Command page with:
- Large text input area for natural language commands
- Example command chips (click to autofill)
- "Execute" button with loading states
- Status panel showing the pipeline stages:
  - 🤔 Thinking... → Understanding Command... → Validating... → Executing Campaign... → ✅ Completed Successfully (or ❌ error)
- Parsed command display (shows extracted action, group, template, SMTP)
- Validation status badges
- Execution result with campaign link
- Full error display
- Premium design using existing design system (hsl vars, gradients, Radix components, Framer Motion animations)

#### [NEW] [ai.service.ts](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/frontend/src/services/ai.service.ts)

Frontend API service:
```ts
export const aiApi = {
  executeCommand: (command: string) => api.post('/ai-command', { command }),
};
```

---

### Frontend: Wiring (Minimal Existing File Changes)

---

#### [MODIFY] [Sidebar.tsx](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/frontend/src/components/layout/Sidebar.tsx)

Add 1 nav item to the `navItems` array:
```diff
  { label: 'Reports', icon: BarChart3, path: '/reports' },
+ { label: 'AI Command', icon: Bot, path: '/ai-command' },
  { label: 'Settings', icon: Settings, path: '/settings' },
```
(Import `Bot` from `lucide-react`)

#### [MODIFY] [App.tsx](file:///d:/GIT%20HUB%20CLONE/Atreal-cso/frontend/src/App.tsx)

Add 1 import and 1 route:
```diff
+ import AiCommandPage from '@/pages/ai/AiCommandPage';
  ...
  <Route path="/reports" element={<ReportsPage />} />
+ <Route path="/ai-command" element={<AiCommandPage />} />
  <Route path="/profile" element={<ProfilePage />} />
```

---

## Architecture Summary

```
┌──────────────┐     ┌──────────────┐
│  Manual UI   │     │ AI Command   │
│  (unchanged) │     │ (new page)   │
└──────┬───────┘     └──────┬───────┘
       │                    │
       ▼                    ▼
┌──────────────────────────────────┐
│     Existing Backend APIs        │
│  /campaigns, /contacts, /smtp    │
└──────┬───────────────────────────┘
       │         ▲
       │         │
       │   ┌─────┴──────────────┐
       │   │  AI Module (new)   │
       │   │  /api/ai-command   │
       │   │                    │
       │   │  OpenRouter ──► LLM│
       │   │  Parse ──► Validate│
       │   │  Execute ──►       │
       │   └────────────┬───────┘
       │                │
       ▼                ▼
┌──────────────────────────────────┐
│  Existing Services               │
│  campaignService.create()        │
│  campaignService.start()         │
│  contactRepository.findByGroup() │
│  smtpRepository.findByUserId()   │
│  templateRepository.findAll()    │
└──────────────────────────────────┘
```

## File Summary

| Category | File | Change Type |
|----------|------|-------------|
| Backend AI | `src/ai/openrouter.service.ts` | **NEW** |
| Backend AI | `src/ai/prompt.service.ts` | **NEW** |
| Backend AI | `src/ai/command.parser.ts` | **NEW** |
| Backend AI | `src/ai/validation.service.ts` | **NEW** |
| Backend AI | `src/ai/execution.service.ts` | **NEW** |
| Backend AI | `src/ai/ai.controller.ts` | **NEW** |
| Backend AI | `src/ai/ai.routes.ts` | **NEW** |
| Backend Config | `src/config/env.ts` | **MODIFY** (add 2 optional env vars) |
| Backend Routes | `src/routes/index.ts` | **MODIFY** (add 1 import + 1 route line) |
| Frontend Page | `src/pages/ai/AiCommandPage.tsx` | **NEW** |
| Frontend Service | `src/services/ai.service.ts` | **NEW** |
| Frontend Nav | `src/components/layout/Sidebar.tsx` | **MODIFY** (add 1 nav item + 1 icon import) |
| Frontend Routes | `src/App.tsx` | **MODIFY** (add 1 import + 1 route) |

**Total: 9 new files, 4 minimal modifications to existing files.**

---

## Verification Plan

### Automated Tests
- Backend compiles: `cd backend && npx tsc --noEmit`
- Frontend compiles: `cd frontend && npx tsc --noEmit`

### Manual Verification
1. Verify all existing pages still work unchanged (Dashboard, SMTP, Contacts, Templates, Campaigns, Reports, Settings)
2. Navigate to `/ai-command` and verify the new page loads
3. Test Mode 1: Type "Send [template] to [group] using [smtp]" → verify it creates and starts a campaign
4. Test Mode 2: Type "Run [existing campaign name]" → verify it starts the existing campaign
5. Test error handling: Type a command with a non-existent group/template/SMTP name → verify clear error messages
6. Test invalid input: Type gibberish → verify "Unable to understand command" error
