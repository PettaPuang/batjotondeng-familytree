# Base Project - Architecture & Patterns

## Tech Stack

- **Next.js**: 16.0.1 (App Router)
- **React**: 19.2.0
- **Prisma**: 6.18.0
- **Shadcn UI**: Latest
- **TypeScript**: 5.x
- **Database**: PostgreSQL

## Official Documentation

- Next.js 16: https://nextjs.org/docs
- Shadcn UI: https://ui.shadcn.com/docs
- Prisma: https://www.prisma.io/docs

---

## Project Structure

```
app/
├── (auth)/              # Auth routes
├── (dashboard)/         # Dashboard routes
│   └── [feature]/
│       ├── page.tsx     # Server Component (fetch data)
│       └── ...
├── api/                 # API routes
└── generated/prisma/    # Prisma generated client

components/
├── ui/                  # Shadcn components
└── [feature]/
    ├── [feature]-client.tsx     # Client Component (state + layout)
    ├── [feature]-list.tsx       # List component
    ├── [feature]-card.tsx       # Card component
    └── ...

lib/
├── services/            # READ operations (Prisma queries)
├── actions/             # WRITE operations ("use server")
├── validations/         # Zod schemas
└── utils/              # Helper functions

prisma/
├── schema.prisma       # Database schema
└── migrations/         # Migration history
```

---

## Architecture Patterns

### 1. Server vs Client Components

**Server Component (default):**

- Fetch data menggunakan Service
- No state, no interactivity
- File: `page.tsx`, components tanpa "use client"

**Client Component:**

- State management (useState, useEffect)
- Event handlers, forms, interactivity
- Harus ada directive: `"use client"`
- File: `*-client.tsx`

**Flow:**

```
page.tsx (server)
  → fetch data dari Service
  → pass props
    → *-client.tsx (state + layout)
      → *-list.tsx, *-card.tsx (dumb components)
```

**Contoh:**

```typescript
// app/(dashboard)/gas-stations/page.tsx - Server Component
export default async function GasStationsPage() {
  const data = await GasStationService.findAll();
  const transformed = data.map((gs) => ({
    ...gs,
    latitude: gs.latitude ? Number(gs.latitude) : null,
    longitude: gs.longitude ? Number(gs.longitude) : null,
  }));
  return <GasStationsClient gasStations={transformed} />;
}

// components/gas-stations/gas-stations-client.tsx - Client Component
("use client");
export function GasStationsClient({ gasStations }) {
  const [selectedId, setSelectedId] = useState(null);
  return (
    <div>
      <GasStationList gasStations={gasStations} selectedId={selectedId} />
      <GasStationMap gasStations={gasStations} selectedId={selectedId} />
    </div>
  );
}
```

---

### 2. Service vs Action

**SERVICE (`lib/services/`):**

- ❌ Tanpa `"use server"`
- ✅ READ operations (findAll, findById, search)
- ✅ Reusable business logic
- ✅ Dipanggil dari: Server Components, API Routes, Actions
- ✅ Export inferred types

**ACTION (`lib/actions/`):**

- ✅ Harus `"use server"`
- ✅ WRITE operations (create, update, delete)
- ✅ Form submissions, mutations
- ✅ Return structured response: `{ success, message, data? }`

**Contoh Service:**

```typescript
// lib/services/gas-station.service.ts
import { prisma } from "@/lib/prisma";

export class GasStationService {
  static async findAll() {
    return await prisma.gasStation.findMany({
      where: { status: "ACTIVE" },
      include: { owner: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}

// Export inferred types
export type GasStationWithOwner = Awaited<
  ReturnType<typeof GasStationService.findAll>
>[number];
```

**Contoh Action:**

```typescript
// lib/actions/gas-station.actions.ts
"use server";

import { createGasStationSchema } from "@/lib/validations/infrastructure.validation";
import type { z } from "zod";

export async function createGasStation(
  input: z.infer<typeof createGasStationSchema>
) {
  try {
    const validated = createGasStationSchema.parse(input);
    const gasStation = await GasStationService.create(validated, userId);
    return { success: true, message: "Gas station created", data: gasStation };
  } catch (error) {
    return { success: false, message: "Failed to create" };
  }
}
```

---

### 3. Type System

**Zero Redundancy - Leverage Prisma Generated Types**

❌ **JANGAN:**

```typescript
// Duplikasi type definition
type GasStation = {
  id: string;
  name: string;
  // ... semua field manual
};
```

✅ **GUNAKAN:**

```typescript
import { GasStation, Prisma } from "@prisma/client";

// 1. Direct Prisma type
type MyGasStation = GasStation;

// 2. Dengan relations (infer dari service)
export type GasStationWithOwner = Awaited<
  ReturnType<typeof GasStationService.findAll>
>[number];

// Note: latitude & longitude sekarang Float (bukan Decimal),
// jadi tidak perlu transformasi lagi untuk client components!

// 3. Prisma utility types
type WithOwner = Prisma.GasStationGetPayload<{
  include: { owner: true };
}>;
```

**Import pattern:**

```typescript
import {
  GasStationService,
  type GasStationWithOwner,
} from "@/lib/services/gas-station.service";
```

---

### 4. Validation dengan Zod

**File:** `lib/validations/*.validation.ts`

**Pattern:**

```typescript
import { z } from "zod";

export const createGasStationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(500),
  latitude: z.number().min(-90).max(90).optional(),
  // ...
});

// Infer type dari schema
export type CreateGasStationInput = z.infer<typeof createGasStationSchema>;
```

**Usage di Action:**

```typescript
const validated = createGasStationSchema.parse(input);
```

---

### 5. Component Patterns

**Modular & Reusable:**

```
components/gas-stations/
├── gas-stations-client.tsx    # Client Component (state + layout)
├── gas-station-list.tsx       # List + search
├── gas-station-card.tsx       # Single card (reusable)
└── gas-station-form.tsx       # Form (jika ada CRUD)
```

**Props pattern:**

```typescript
type GasStationCardProps = {
  gasStation: GasStationWithOwner;
  isSelected?: boolean;
  onClick?: () => void;
};
```

**Naming conventions:**

- Simple, consistent
- Function: `setSelectedId`, `filteredGasStations`
- Component: `GasStationCard`, `GasStationList`
- File: `gas-station-card.tsx`, `gas-station-list.tsx`

---

## Prisma Patterns

### Schema Conventions

- Model names: PascalCase (GasStation, User)
- Field names: camelCase (gasStationId, createdAt)
- Audit trail: createdAt, updatedAt, createdBy, updatedBy

### Relations

```prisma
model Tank {
  stations Station[]  // One-to-many
}

model Station {
  tank Tank @relation(fields: [tankId], references: [id])
}
```

### Create with relations

```typescript
await prisma.gasStation.create({
  data: {
    name: "Station A",
    owner: {
      connect: { id: ownerId }, // Connect existing
    },
    createdBy: {
      connect: { id: userId },
    },
  },
});
```

---

## Database Workflow

### Update Schema:

1. **Stop dev server** (Ctrl+C)
2. Edit `prisma/schema.prisma`
3. Run migration:
   - Development: `npm run schema:sync` (fast, no history)
   - Production: `npm run db:migrate` (create migration file)
4. **Start dev server**: `npm run dev`

**Scripts:**

```json
{
  "schema:sync": "prisma db push && prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:generate": "prisma generate"
}
```

---

## UI Components (Shadcn)

**Import dari:**

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
```

**Pattern:**

- Gunakan Shadcn components untuk consistency
- Extend dengan Tailwind classes jika perlu
- Responsive by default

---

## Critical Rules

1. **❌ NEVER** import Prisma/Service di Client Component
2. **✅ ALWAYS** fetch data di Server Component
3. **✅ ALWAYS** infer types dari Prisma/Service
4. **✅ ALWAYS** validate input dengan Zod
5. **✅ ALWAYS** separate concerns: page → client → components
6. **✅ ALWAYS** use "use server" for mutations
7. **✅ ALWAYS** transform Decimal to number before passing to client

---

## Questions to Ask Before Coding

1. Apakah ini butuh state/interactivity? → Client Component
2. Apakah ini READ atau WRITE? → Service atau Action
3. Apakah type sudah ada di Prisma? → Infer, jangan duplikat
4. Apakah component ini reusable? → Extract ke file terpisah
5. Apakah ada validation? → Gunakan Zod schema

---

## Example: Complete Feature Flow

**Gas Stations Feature:**

1. **Schema** (`prisma/schema.prisma`)
2. **Service** (`lib/services/gas-station.service.ts`) - READ
3. **Action** (`lib/actions/gas-station.actions.ts`) - WRITE
4. **Validation** (`lib/validations/infrastructure.validation.ts`)
5. **Page** (`app/(dashboard)/gas-stations/page.tsx`) - Server
6. **Client** (`components/gas-stations/gas-stations-client.tsx`) - State
7. **Components** (`gas-station-list.tsx`, `gas-station-card.tsx`) - UI

**Flow:**

```
User visits /gas-stations
  → page.tsx fetches data (server)
  → pass to gas-stations-client.tsx (client)
  → render gas-station-list.tsx
  → map gas-station-card.tsx
```

---

**Last updated:** 2025-11-04 (Batjotondeng mapping: 2026-06-01)

---

## Batjotondeng — Pemetaan folder (proyek ini)

Struktur mengikuti pola yang sama dengan Nozzl di atas. **Tidak ada** rute terpisah `/silsilah/pernikahan` atau `/silsilah/pohon`; nav silsilah dihapus — satu halaman `/silsilah` saja.

```
src/
├── app/
│   ├── silsilah/page.tsx         # Server: fetch tree + detail (?person=) + audit (?audit=1)
│   ├── silsilah/layout.tsx       # Header + sign-out (tanpa nav per halaman)
│   ├── login/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/   # NextAuth
│       └── silsilah/person/photo/view/  # Proxy foto privat (satu route domain silsilah)
├── components/silsilah/
│   ├── silsilah-page-client.tsx
│   ├── silsilah-explorer-client.tsx  # List kiri + pohon kanan
│   ├── person-form-sheet.tsx         # Satu form tambah / edit person
│   ├── person-detail-sheet.tsx
│   ├── genealogy-tree.tsx
│   └── ...
└── lib/
    ├── services/silsilah.service.ts    # READ
    ├── actions/
    │   ├── silsilah.actions.ts         # WRITE silsilah
    │   ├── auth.actions.ts
    │   └── login.actions.ts
    ├── silsilah/                       # Domain internal (bukan entry READ/WRITE)
    │   ├── types.ts                    # PersonWithRelations, TreePerson, PersonDetailLimited
    │   ├── tree.ts                     # Tipe + hydrate (client-safe)
    │   ├── tree.server.ts              # Fetch payload pohon (server-only)
    │   ├── format.ts, person-display.ts
    │   ├── person-mutations.ts         # Write helpers (dipanggil actions)
    │   ├── person-audit.ts             # Tipe + format (client-safe)
    │   ├── person-audit.server.ts      # Tulis log audit (server-only)
    │   ├── person-relation-context.ts
    │   ├── person-parent.ts
    │   ├── person-detail-payload.ts    # Transform + normalizePersonDates
    │   ├── genealogy-layout.ts
    │   ├── genealogy-tree-viewport.ts
    │   ├── sibling-order.ts
    │   ├── silsilah-url.ts
    │   └── prisma-error.ts
    ├── auth/
    │   ├── person-scope.ts             # Izin kelola + create relasi
    │   ├── verify-person.ts            # Verifikasi identitas login (dipindah dari lib/)
    │   ├── session-actor.ts, create-person-options.ts, ...
    │   └── login-rate-limit.ts
    ├── blob/person-photo.ts
    ├── toast-messages.ts               # Konstanta pesan toast (lib/toast.ts dihapus)
    ├── normalize-name.ts, is-next-redirect-error.ts, utils.ts
    └── prisma.ts
```

### Alur silsilah (satu halaman)

Layout dua kolom di `silsilah-explorer-client.tsx`:

1. **Daftar nama (kiri)** — klik baris → fokus node di pohon (URL `?person=`).
2. **Pohon genealogi (kanan)** — klik node → sheet detail (`?person=`); klik lagi node yang sama bisa menutup sheet.
3. **Form person** — satu sheet tambah / edit (`person-form-sheet.tsx`); pasangan baru dibuat lewat relasi **spouse** di form tambah person (bukan halaman pernikahan terpisah).

**Batasan create relasi** (form tambah): hanya **anak**, **saudara kandung**, atau **pasangan** — tidak bisa *create* orang tua baru; data orang tua yang sudah ada tetap bisa **diedit** jika dalam scope izin.

```
/silsilah?person={id}&audit=1
  → page.tsx memanggil SilsilahService (read)
  → props ke silsilah-page-client.tsx
    → silsilah-explorer-client.tsx (list + tree)
      → person-detail-sheet (props dari server, tanpa fetch client)
```

### Aturan khusus

- **Jangan** read lewat Action; detail sheet memakai `searchParams` + Service di page.
- **Action** hanya mutasi: `createPersonSheetAction`, `updatePersonSheetAction`, `deletePerson`, `uploadPersonPhoto`, dll. (tidak ada `createMarriageAction`.)
- Response action: `{ success, message, data? }` (kecuali `useActionState` sheet tetap `PersonSheetState`).
- Toast UI: import `{ toast }` dari `sonner` langsung (bukan re-export `lib/toast.ts`).
