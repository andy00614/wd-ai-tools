# Knowledge Page - Technical Implementation Plan

> **Version**: 1.0
> **Created**: 2025-11-09
> **Purpose**: Complete technical specification for the Knowledge Point Generation feature

---

## 📋 Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Database Design](#2-database-design)
3. [Module Structure](#3-module-structure)
4. [Type System & Validation](#4-type-system--validation)
5. [Server Actions (Backend)](#5-server-actions-backend)
6. [Frontend Components](#6-frontend-components)
7. [Streaming Implementation](#7-streaming-implementation)
8. [LLM Integration](#8-llm-integration)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. Feature Overview

### 1.1 User Flow

```
User enters page
  ↓
Sees history list (Table/Grid view) + Search/Filters
  ↓
Clicks [+ Create] button
  ↓
Dialog opens: Input knowledge point + Select model
  ↓
Streaming generation dialog:
  1️⃣ Generate outline (streaming display)
  2️⃣ Generate questions in parallel (progress for each outline)
  3️⃣ Show metadata (time, tokens) when complete
  ↓
Close dialog, list refreshes
```

### 1.2 Key Features

- ✅ Multi-model support: OpenAI GPT-4, Gemini 2.5 Flash, Claude 3.5
- ✅ Streaming generation with real-time progress
- ✅ Parallel question generation for each outline
- ✅ Dual display modes: Table (info-dense) / Grid (visual cards)
- ✅ Search & filter: by title, model, status
- ✅ Delete entire knowledge session
- ✅ View historical generation details
- ✅ Extensible prompt management system

### 1.3 Technical Constraints

- Must use **Vercel AI SDK `streamObject`** for streaming
- Must follow **modular architecture** (see `src/modules/auth/` pattern)
- Must use **Server Actions** over API routes
- Question type: **Multiple choice only** (but extensible)
- Simple interruption handling (Phase 1): closing dialog stops generation

---

## 2. Database Design

### 2.1 Schema Definitions

#### `knowledge_sessions` Table

```typescript
// src/modules/knowledge/schemas/knowledge.schema.ts

export const knowledgeSessions = sqliteTable("knowledge_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  // User Input
  title: text("title").notNull(),                    // Knowledge point entered by user
  model: text("model").notNull(),                    // "openai-4o" | "gemini-2.5-flash" | "claude-3.5-sonnet"

  // Status Tracking
  status: text("status").notNull(),                  // "pending" | "generating_outline" | "generating_questions" | "completed" | "failed" | "cancelled"
  errorMsg: text("error_msg"),

  // Metadata
  timeConsume: integer("time_consume"),              // Total time in milliseconds
  inputToken: integer("input_token"),
  outputToken: integer("output_token"),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),

  // Relations
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})
```

#### `outlines` Table

```typescript
export const outlines = sqliteTable("outlines", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => knowledgeSessions.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull(),      // 1, 2, 3...
  status: text("status").notNull(),                  // "pending" | "generating" | "completed" | "failed"

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})
```

#### `questions` Table

```typescript
export const questions = sqliteTable("questions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id")
    .notNull()
    .references(() => knowledgeSessions.id, { onDelete: "cascade" }),
  outlineId: text("outline_id")
    .notNull()
    .references(() => outlines.id, { onDelete: "cascade" }),

  // Question Content
  content: text("content").notNull(),
  type: text("type").notNull().default("multiple_choice"), // Extensible: "fill_blank", "true_false", etc.
  options: text("options").notNull(),                      // JSON string: ["A. Option 1", "B. Option 2", ...]
  answer: text("answer").notNull(),                        // "A" or "B" or "C" or "D"
  explanation: text("explanation"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
})
```

#### `prompts` Table

```typescript
export const prompts = sqliteTable("prompts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  name: text("name").notNull().unique(),
  content: text("content").notNull(),
  type: text("type").notNull(),                      // "outline_generation" | "question_generation" | "image_generation" | etc.
  isActive: integer("is_active", { mode: "boolean" })
    .notNull()
    .default(true),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
})
```

### 2.2 Type Inference

```typescript
// Infer types from Drizzle schemas
export type KnowledgeSession = typeof knowledgeSessions.$inferSelect
export type NewKnowledgeSession = typeof knowledgeSessions.$inferInsert

export type Outline = typeof outlines.$inferSelect
export type NewOutline = typeof outlines.$inferInsert

export type Question = typeof questions.$inferSelect
export type NewQuestion = typeof questions.$inferInsert

export type Prompt = typeof prompts.$inferSelect
export type NewPrompt = typeof prompts.$inferInsert
```

### 2.3 Initial Data - Default Prompts

```sql
-- Insert default prompts
INSERT INTO prompts (id, name, content, type, is_active) VALUES
(
  'prompt-outline-default',
  'Default Outline Generation',
  'You are an educational content expert. Generate a structured outline for the knowledge point: "{knowledge_point}". Return 3-5 main topics, each with a clear title. Format as JSON array: [{"title": "Topic 1"}, {"title": "Topic 2"}, ...]',
  'outline_generation',
  1
),
(
  'prompt-question-default',
  'Default Multiple Choice Question',
  'Generate 5 multiple-choice questions about: "{outline_title}". Each question should have 4 options (A, B, C, D) and include an explanation. Format as JSON: [{"content": "Question?", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "explanation": "..."}]',
  'question_generation',
  1
);
```

---

## 3. Module Structure

Follow the standard module pattern (reference: `src/modules/auth/`):

```
src/modules/knowledge/
├── schemas/
│   └── knowledge.schema.ts          # Drizzle table definitions
├── models/
│   └── knowledge.model.ts           # Zod validation schemas
├── actions/
│   ├── create-session.action.ts     # Create new session + generate outline
│   ├── generate-questions.action.ts # Generate questions for outlines
│   ├── delete-session.action.ts     # Delete session + cascade
│   └── get-sessions.action.ts       # Fetch sessions with filters
├── components/
│   ├── knowledge-list-table.tsx     # Table view component
│   ├── knowledge-list-grid.tsx      # Grid view component
│   ├── create-dialog.tsx            # Dialog for creating new session
│   ├── generation-dialog.tsx        # Streaming generation progress
│   ├── detail-dialog.tsx            # View historical session details
│   ├── session-filters.tsx          # Search + filters component
│   └── question-card.tsx            # Display individual question
├── utils/
│   └── knowledge-utils.ts           # Helper functions
├── knowledge.route.ts               # Route path constants
└── knowledge.page.tsx               # Main page component
```

---

## 4. Type System & Validation

### 4.1 Zod Schemas

```typescript
// src/modules/knowledge/models/knowledge.model.ts

import { z } from "zod"

// Session Creation
export const createSessionSchema = z.object({
  title: z.string().min(1, "Knowledge point is required").max(200),
  model: z.enum(["openai-4o", "gemini-2.5-flash", "claude-3.5-sonnet"]),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>

// Outline Structure (from LLM)
export const outlineItemSchema = z.object({
  title: z.string(),
  order: z.number().optional(), // Optional, we can assign order ourselves
})

export const outlinesResponseSchema = z.object({
  outlines: z.array(outlineItemSchema),
})

// Question Structure (from LLM)
export const questionItemSchema = z.object({
  content: z.string(),
  options: z.array(z.string()).length(4), // Must have 4 options
  answer: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().optional(),
})

export const questionsResponseSchema = z.object({
  questions: z.array(questionItemSchema),
})

// Filters
export const sessionFiltersSchema = z.object({
  search: z.string().optional(),
  model: z.enum(["openai-4o", "gemini-2.5-flash", "claude-3.5-sonnet"]).optional(),
  status: z.enum(["pending", "generating_outline", "generating_questions", "completed", "failed", "cancelled"]).optional(),
})

export type SessionFilters = z.infer<typeof sessionFiltersSchema>
```

---

## 5. Server Actions (Backend)

### 5.1 Create Session + Generate Outline

```typescript
// src/modules/knowledge/actions/create-session.action.ts
"use server"

import { streamObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import { anthropic } from "@ai-sdk/anthropic"
import { getDB } from "@/db"
import { knowledgeSessions, outlines, prompts } from "../schemas/knowledge.schema"
import { requireAuth } from "@/modules/auth/utils/auth-utils"
import { createSessionSchema, outlinesResponseSchema } from "../models/knowledge.model"

export async function createSessionAndGenerateOutline(input: CreateSessionInput) {
  const user = await requireAuth()
  const validated = createSessionSchema.parse(input)

  const db = await getDB()
  const startTime = Date.now()

  // 1. Create session
  const [session] = await db
    .insert(knowledgeSessions)
    .values({
      title: validated.title,
      model: validated.model,
      status: "generating_outline",
      userId: user.id,
    })
    .returning()

  try {
    // 2. Get prompt
    const [prompt] = await db
      .select()
      .from(prompts)
      .where(and(
        eq(prompts.type, "outline_generation"),
        eq(prompts.isActive, true)
      ))
      .limit(1)

    if (!prompt) {
      throw new Error("No active outline generation prompt found")
    }

    // 3. Select model
    const modelInstance = getModelInstance(validated.model)

    // 4. Stream outline generation
    const result = await streamObject({
      model: modelInstance,
      schema: outlinesResponseSchema,
      prompt: prompt.content.replace("{knowledge_point}", validated.title),
    })

    // 5. Collect streamed data
    let outlineData: any[] = []
    for await (const partialObject of result.partialObjectStream) {
      if (partialObject.outlines) {
        outlineData = partialObject.outlines
        // Emit progress event here (for real-time updates)
      }
    }

    // 6. Save outlines to database
    const finalOutlines = await Promise.all(
      outlineData.map((item, index) =>
        db
          .insert(outlines)
          .values({
            sessionId: session.id,
            title: item.title,
            orderIndex: index + 1,
            status: "pending",
          })
          .returning()
      )
    )

    // 7. Update session status
    const timeConsume = Date.now() - startTime
    await db
      .update(knowledgeSessions)
      .set({
        status: "generating_questions",
        timeConsume,
        inputToken: result.usage?.promptTokens,
        outputToken: result.usage?.completionTokens,
      })
      .where(eq(knowledgeSessions.id, session.id))

    return {
      success: true,
      sessionId: session.id,
      outlines: finalOutlines.flat(),
    }

  } catch (error) {
    await db
      .update(knowledgeSessions)
      .set({
        status: "failed",
        errorMsg: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(knowledgeSessions.id, session.id))

    throw error
  }
}

function getModelInstance(modelName: string) {
  switch (modelName) {
    case "openai-4o":
      return openai("gpt-4o")
    case "gemini-2.5-flash":
      return google("gemini-2.5-flash")
    case "claude-3.5-sonnet":
      return anthropic("claude-3-5-sonnet-20241022")
    default:
      throw new Error(`Unsupported model: ${modelName}`)
  }
}
```

### 5.2 Generate Questions (Parallel)

```typescript
// src/modules/knowledge/actions/generate-questions.action.ts
"use server"

import { streamObject } from "ai"
import { getDB } from "@/db"
import { questions, outlines, knowledgeSessions, prompts } from "../schemas/knowledge.schema"
import { questionsResponseSchema } from "../models/knowledge.model"
import { eq, and } from "drizzle-orm"

export async function generateQuestionsForSession(sessionId: string) {
  const db = await getDB()
  const startTime = Date.now()

  try {
    // 1. Get session and outlines
    const [session] = await db
      .select()
      .from(knowledgeSessions)
      .where(eq(knowledgeSessions.id, sessionId))

    const sessionOutlines = await db
      .select()
      .from(outlines)
      .where(eq(outlines.sessionId, sessionId))
      .orderBy(outlines.orderIndex)

    // 2. Get prompt
    const [prompt] = await db
      .select()
      .from(prompts)
      .where(and(
        eq(prompts.type, "question_generation"),
        eq(prompts.isActive, true)
      ))
      .limit(1)

    if (!prompt) throw new Error("No active question generation prompt found")

    const modelInstance = getModelInstance(session.model)

    // 3. Generate questions for all outlines IN PARALLEL
    const questionPromises = sessionOutlines.map(async (outline) => {
      await db
        .update(outlines)
        .set({ status: "generating" })
        .where(eq(outlines.id, outline.id))

      try {
        const result = await streamObject({
          model: modelInstance,
          schema: questionsResponseSchema,
          prompt: prompt.content.replace("{outline_title}", outline.title),
        })

        // Collect streamed questions
        let questionData: any[] = []
        for await (const partialObject of result.partialObjectStream) {
          if (partialObject.questions) {
            questionData = partialObject.questions
            // Emit progress event
          }
        }

        // Save questions
        await Promise.all(
          questionData.map((q) =>
            db.insert(questions).values({
              sessionId,
              outlineId: outline.id,
              content: q.content,
              type: "multiple_choice",
              options: JSON.stringify(q.options),
              answer: q.answer,
              explanation: q.explanation,
            })
          )
        )

        await db
          .update(outlines)
          .set({ status: "completed" })
          .where(eq(outlines.id, outline.id))

        return { success: true, outlineId: outline.id }

      } catch (error) {
        await db
          .update(outlines)
          .set({ status: "failed" })
          .where(eq(outlines.id, outline.id))

        throw error
      }
    })

    await Promise.all(questionPromises)

    // 4. Update session to completed
    const totalTime = Date.now() - startTime
    await db
      .update(knowledgeSessions)
      .set({
        status: "completed",
        timeConsume: totalTime,
      })
      .where(eq(knowledgeSessions.id, sessionId))

    return { success: true }

  } catch (error) {
    await db
      .update(knowledgeSessions)
      .set({
        status: "failed",
        errorMsg: error instanceof Error ? error.message : "Question generation failed",
      })
      .where(eq(knowledgeSessions.id, sessionId))

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
```

### 5.3 Get Sessions (with Filters)

```typescript
// src/modules/knowledge/actions/get-sessions.action.ts
"use server"

import { getDB } from "@/db"
import { knowledgeSessions, outlines, questions } from "../schemas/knowledge.schema"
import { requireAuth } from "@/modules/auth/utils/auth-utils"
import { eq, and, like, desc } from "drizzle-orm"
import type { SessionFilters } from "../models/knowledge.model"

export async function getSessions(filters?: SessionFilters) {
  const user = await requireAuth()
  const db = await getDB()

  let conditions = [eq(knowledgeSessions.userId, user.id)]

  if (filters?.search) {
    conditions.push(like(knowledgeSessions.title, `%${filters.search}%`))
  }

  if (filters?.model) {
    conditions.push(eq(knowledgeSessions.model, filters.model))
  }

  if (filters?.status) {
    conditions.push(eq(knowledgeSessions.status, filters.status))
  }

  const sessions = await db
    .select()
    .from(knowledgeSessions)
    .where(and(...conditions))
    .orderBy(desc(knowledgeSessions.createdAt))

  return { success: true, data: sessions }
}

export async function getSessionDetail(sessionId: string) {
  const user = await requireAuth()
  const db = await getDB()

  const [session] = await db
    .select()
    .from(knowledgeSessions)
    .where(and(
      eq(knowledgeSessions.id, sessionId),
      eq(knowledgeSessions.userId, user.id)
    ))

  if (!session) {
    return { success: false, error: "Session not found" }
  }

  const sessionOutlines = await db
    .select()
    .from(outlines)
    .where(eq(outlines.sessionId, sessionId))
    .orderBy(outlines.orderIndex)

  const sessionQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.sessionId, sessionId))

  return {
    success: true,
    data: {
      session,
      outlines: sessionOutlines,
      questions: sessionQuestions,
    },
  }
}
```

### 5.4 Delete Session

```typescript
// src/modules/knowledge/actions/delete-session.action.ts
"use server"

import { getDB } from "@/db"
import { knowledgeSessions } from "../schemas/knowledge.schema"
import { requireAuth } from "@/modules/auth/utils/auth-utils"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function deleteSession(sessionId: string) {
  const user = await requireAuth()
  const db = await getDB()

  // Cascade delete will handle outlines and questions
  await db
    .delete(knowledgeSessions)
    .where(and(
      eq(knowledgeSessions.id, sessionId),
      eq(knowledgeSessions.userId, user.id)
    ))

  revalidatePath("/dashboard/knowledge")

  return { success: true }
}
```

---

## 6. Frontend Components

### 6.1 Main Page

```typescript
// src/modules/knowledge/knowledge.page.tsx

import { getSessions } from "./actions/get-sessions.action"
import KnowledgeListTable from "./components/knowledge-list-table"
import KnowledgeListGrid from "./components/knowledge-list-grid"
import SessionFilters from "./components/session-filters"
import CreateDialog from "./components/create-dialog"
import { Suspense } from "react"

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: { view?: "table" | "grid"; search?: string; model?: string; status?: string }
}) {
  const { data: sessions } = await getSessions({
    search: searchParams.search,
    model: searchParams.model as any,
    status: searchParams.status as any,
  })

  const viewMode = searchParams.view || "table"

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Knowledge Point Generator</h1>
        <CreateDialog />
      </div>

      <SessionFilters currentView={viewMode} />

      <Suspense fallback={<div>Loading...</div>}>
        {viewMode === "table" ? (
          <KnowledgeListTable sessions={sessions} />
        ) : (
          <KnowledgeListGrid sessions={sessions} />
        )}
      </Suspense>
    </div>
  )
}
```

### 6.2 Create Dialog

```typescript
// src/modules/knowledge/components/create-dialog.tsx
"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createSessionSchema, type CreateSessionInput } from "../models/knowledge.model"
import { createSessionAndGenerateOutline } from "../actions/create-session.action"
import GenerationDialog from "./generation-dialog"
import toast from "react-hot-toast"

export default function CreateDialog() {
  const [open, setOpen] = useState(false)
  const [generationOpen, setGenerationOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateSessionInput>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      model: "openai-4o",
    },
  })

  const onSubmit = (data: CreateSessionInput) => {
    startTransition(async () => {
      try {
        const result = await createSessionAndGenerateOutline(data)

        if (result.success) {
          setSessionId(result.sessionId)
          setOpen(false)
          setGenerationOpen(true)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create session")
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>+ Create</Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Input
              placeholder="Enter knowledge point (e.g., React Hooks)"
              {...form.register("title")}
            />

            <Select
              value={form.watch("model")}
              onValueChange={(value) => form.setValue("model", value as any)}
            >
              <SelectTrigger>
                <span>{form.watch("model")}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai-4o">OpenAI GPT-4o</SelectItem>
                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Creating..." : "Generate"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {sessionId && (
        <GenerationDialog
          sessionId={sessionId}
          open={generationOpen}
          onOpenChange={setGenerationOpen}
        />
      )}
    </>
  )
}
```

### 6.3 Generation Dialog (Streaming Progress)

```typescript
// src/modules/knowledge/components/generation-dialog.tsx
"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { generateQuestionsForSession } from "../actions/generate-questions.action"
import { getSessionDetail } from "../actions/get-sessions.action"

interface Props {
  sessionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GenerationDialog({ sessionId, open, onOpenChange }: Props) {
  const [status, setStatus] = useState<"outline" | "questions" | "complete">("outline")
  const [outlines, setOutlines] = useState<any[]>([])
  const [progress, setProgress] = useState<Record<string, string>>({}) // outlineId -> status

  useEffect(() => {
    if (!open) return

    // Start question generation
    async function generate() {
      // Fetch outlines first
      const detail = await getSessionDetail(sessionId)
      if (detail.success && detail.data) {
        setOutlines(detail.data.outlines)
        setStatus("questions")

        // Generate questions
        await generateQuestionsForSession(sessionId)
        setStatus("complete")
      }
    }

    generate()
  }, [sessionId, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">
            {status === "outline" && "Generating Outline..."}
            {status === "questions" && "Generating Questions..."}
            {status === "complete" && "✅ Generation Complete!"}
          </h2>

          {status === "outline" && (
            <div className="animate-pulse">Loading outline...</div>
          )}

          {status === "questions" && (
            <div className="space-y-2">
              {outlines.map((outline) => (
                <div key={outline.id} className="border p-3 rounded">
                  <div className="font-medium">{outline.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {outline.status === "completed" ? "✅ Complete" : "⏳ Generating..."}
                  </div>
                </div>
              ))}
            </div>
          )}

          {status === "complete" && (
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 6.4 List Components (Table & Grid)

Implement table and grid views separately, both showing:
- Session title
- Model used
- Status badge
- Created time
- Token usage
- Actions (View, Delete)

---

## 7. Streaming Implementation

### 7.1 Current Approach (Phase 1 - Simplified)

**Limitations:**
- If user closes dialog/page, generation stops
- No background task persistence
- No resume capability

**Implementation:**
- Use `streamObject` in Server Action
- Collect full result before saving to database
- Update status progressively

### 7.2 Future Enhancement (Phase 2)

Use **Server-Sent Events (SSE)** or **Cloudflare Durable Objects** to:
- Persist generation tasks in background
- Allow reconnection via session ID
- Show "Resuming..." UI when returning to page

---

## 8. LLM Integration

### 8.1 Model Configuration

```typescript
// Environment variables needed
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
```

### 8.2 Prompt Templates

Store prompts in database with placeholders:

**Outline Generation Prompt:**
```
You are an educational content expert. Generate a structured outline for the knowledge point: "{knowledge_point}".

Requirements:
- Create 3-5 main topics
- Each topic should be clear and focused
- Topics should build on each other logically

Return as JSON: [{"title": "Topic 1"}, {"title": "Topic 2"}, ...]
```

**Question Generation Prompt:**
```
Generate 5 multiple-choice questions about: "{outline_title}".

Requirements:
- Each question has exactly 4 options (A, B, C, D)
- Include one correct answer
- Provide explanation for the correct answer
- Questions should test understanding, not just memorization

Return as JSON: [{"content": "...", "options": [...], "answer": "A", "explanation": "..."}]
```

---

## 9. Implementation Checklist

### Phase 1: Foundation
- [ ] Create database schemas (knowledge_sessions, outlines, questions, prompts)
- [ ] Run migration: `pnpm db:generate && pnpm db:migrate:local`
- [ ] Insert default prompts via SQL
- [ ] Create module structure (`src/modules/knowledge/`)
- [ ] Implement Zod validation schemas

### Phase 2: Backend
- [ ] Implement `create-session.action.ts` (outline generation)
- [ ] Implement `generate-questions.action.ts` (parallel question gen)
- [ ] Implement `get-sessions.action.ts` (with filters)
- [ ] Implement `delete-session.action.ts`
- [ ] Test Server Actions with `pnpm dev:cf`

### Phase 3: Frontend - Core
- [ ] Create page route: `src/app/dashboard/knowledge/page.tsx`
- [ ] Implement `CreateDialog` component
- [ ] Implement `GenerationDialog` (streaming progress)
- [ ] Implement `SessionFilters` (search + model + status)

### Phase 4: Frontend - Display
- [ ] Implement `KnowledgeListTable` component
- [ ] Implement `KnowledgeListGrid` component
- [ ] Implement `DetailDialog` (view historical data)
- [ ] Add view toggle (Table/Grid) in UI
- [ ] Add delete confirmation dialog

### Phase 5: Polish
- [ ] Add loading states and error boundaries
- [ ] Add toast notifications for success/error
- [ ] Test with all 3 models (OpenAI, Gemini, Claude)
- [ ] Add pagination if session list grows large
- [ ] Test mobile responsiveness

---

## Appendix: Key Decision Log

| Decision | Rationale |
|----------|-----------|
| Use `streamObject` not `streamText` | Need structured JSON output for outlines/questions |
| Separate `outlines` table | Enables progress tracking per outline, better data structure |
| Store questions as separate rows | Allows extensibility (different question types), easier querying |
| Use JSON string for `options` field | SQLite doesn't have array type, JSON is standard workaround |
| Simple interruption handling (Phase 1) | Cloudflare Workers has limitations, defer complex task queue to Phase 2 |
| Dual view (Table + Grid) | Table for admins (data-dense), Grid for visual appeal |
| Hard-coded 3 models initially | User can add more models by inserting directly to prompts table |

---

**End of Implementation Plan**
