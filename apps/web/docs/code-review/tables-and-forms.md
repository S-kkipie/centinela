# Tables & forms (reusable toolkit)

The starter ships myworkin's reusable **data-table** toolkit and **TanStack Form**
binding. New CRUD screens compose these — don't hand-roll `useReactTable` +
client filtering, or raw `useState` forms.

## 1. Tables compose the data-table toolkit `MAJOR`

Server-driven tables use `useDataTable` (`@/frontend/hooks/use-data-table`) —
manual mode (`manualPagination/Sorting/Filtering`), state synced to the URL via
nuqs (`page`/`perPage`/`sort` + one key per filterable column), 300ms-debounced
filter writes. It requires `TData extends { id }` and a `pageCount`. Compose with
`@/frontend/components/data-table/*` (`DataTable`, `DataTableToolbar`,
`DataTableSortList`, `DataTableActionBar`/`DataTableActionBarSelection`/
`DataTableActionBarAction`, faceted/date/range/slider filters, pagination,
skeleton, `DescriptionCell`).

Canonical wiring (see `core/project`):

```
core/<domain>/
  domain/search-params.ts          nuqs parsers + createSearchParamsCache (keys MUST match what useDataTable writes)
  client/ui/table/
    columns.tsx                     default-exports getXTableColumns({ setRowAction }): ColumnDef[] — plain <div> headers
                                     (sorting is via DataTableSortList, not header clicks), meta{label,variant,icon,options}
                                     on filterable columns, an actions column dispatching setRowAction
    action-bar.tsx                  default-exports XTableActionBar({ table }) — bulk/export actions shown while rows are selected
    data-table.tsx                  "use client" — default-exports XTable({ promises }); reads the page with
                                     `React.use(promises)`, wires useDataTable + the modals (no client fetch)
    server.tsx                      RSC (the SSR source) — default-exports XTableServer({ options }); hands the client an
                                     UNAWAITED Promise.all([resolveResult(search*Service(...))])
app/(app)/<domain>/page.tsx        RSC — parses searchParamsCache, renders <Suspense fallback={<DataTableSkeleton .../>}><XTableServer options/></Suspense>
```

Data source is **RSC, streamed**: `page.tsx` parses the URL into the request-scoped
`createSearchParamsCache`, runs it through the domain `search*Schema`, and renders
`server.tsx` under a `<Suspense>` boundary. `server.tsx` does **not** `await` the
service — it hands the client `Promise.all([resolveResult(search*Service(...))])`
straight through as `promises`. The client `data-table.tsx` unwraps that with
`const [{ items, pageCount }] = React.use(promises)`, which suspends the boundary
until the query resolves (and re-throws an `AppErrorException` on the error branch,
caught by the `page`-sibling `error.tsx`) instead of blocking the RSC response.
`data-table.tsx` wires `useDataTable` (`shallow:false`) so any page/sort/filter
change re-runs `server.tsx`. Column-level text/select filters (`meta.variant`) live
in the `DataTableToolbar`, not a page-level search box; sorting is exposed via
`DataTableSortList` in the toolbar rather than clickable column headers. Bulk
actions (e.g. CSV export via `@/frontend/lib/export`'s `exportTableToCSV`) live in
`action-bar.tsx`, passed to `<DataTable actionBar={...}>`. Row actions (`update`/
`delete`) are conditionally-rendered modals — `{rowAction?.variant === "update" &&
rowAction.row && <UpdateXModal open onOpenChange={() => setRowAction(null)}
x={rowAction.row.original} />}` — so the modal always receives a non-null record
and remounts for free on every new row action; mutations `router.refresh()` the
RSC (no client list query to invalidate).

**Server contract:** the list endpoint / service takes `{ page, perPage, sort, <filters> }`
and returns `{ items, total, page, perPage, pageCount }`. Ownership is scoped by
`userId` in the repository WHERE (rows AND count). Sort column ids are zod-enum
whitelisted before reaching the query. Text-search filters go through a normal
filterable column (e.g. `name`), not a separate `q` param.

**Check:** a new table uses `useDataTable` + `pageCount` + a `search-params.ts`
whose keys match the table's URL writes; `server.tsx` passes an unawaited
`Promise.all` and the client reads it with `React.use`; no hand-rolled
`useReactTable` with client-side filtering.

## 2. Forms use TanStack Form + the Field primitive `MAJOR`

Forms use `useAppForm` (`@/frontend/hooks/use-tanstack-form`) with a zod schema
as the validator, and render fields with the shadcn `Field` primitive
(`@/frontend/components/ui/field`).

```tsx
const form = useAppForm({
    defaultValues,
    validators: { onChange: someZodSchema }, // domain schema — single source of truth
    onSubmit: ({ value }) => onSubmit(value),
});
// ...
<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
    <form.Field name="name">
        {(field) => {
            const hasError = !field.state.meta.isValid;
            return (
                <Field data-invalid={hasError}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={hasError}
                    />
                    {hasError && <FieldError errors={getFieldErrors(field)} />}
                </Field>
            );
        }}
    </form.Field>
    <form.Subscribe selector={(s) => s.canSubmit}>
        {(canSubmit) => <Button type="submit" disabled={!canSubmit}>Save</Button>}
    </form.Subscribe>
</form>
```

The zod domain schema is the validation source of truth (reuse
`create*Schema`/`update*Schema` from `domain/schemas.ts`); errors read from
`field.state.meta.errors` via a small `getFieldErrors` mapper into
`FieldError errors={...}`.

**File layout** (per `core/project/client`, following myworkin `cv-analysis`):

```
core/<domain>/client/
  validation.ts                 form zod schema + `…FormValues` (z.infer)
  ui/forms/<domain>-form.tsx     form definition + form API: default values,
                                 `_…Form()` (for the ReturnType api type),
                                 `getFieldErrors`, the `…FormUI`, and the exported
                                 `…Form` component (useAppForm + fields)
  ui/modals/                     dialogs live here; { open, onOpenChange } + a non-null record prop (update/delete
                                 are conditionally rendered by the table, so the record is never null while mounted)
    create-<domain>-modal.tsx    <Dialog> + <…Form> + useCreate
    update-<domain>-modal.tsx    <Dialog> + <…Form defaultValues> + useUpdate
    delete-<domain>-modal.tsx    <Dialog> confirm + useDelete + onSuccess?
  ui/table/data-table.tsx        table + toolbar + the three modals (controlled by rowAction)
```

The form emits raw `…FormValues`; each modal maps the empty-description case to
`undefined` (create) / `null` (edit) for its mutation. The screen never inlines a
`<Dialog>` — it renders the modals.

**Check:** a new form uses `useAppForm` + a zod validator (in `validation.ts`) +
`Field`/`FieldError`, not a raw `useState`-controlled form; validation reuses the
domain schema; dialogs live in `ui/modals/`, form definition in `ui/forms/`.

**Dialog/modal forms must remount per record.** `useAppForm`'s `defaultValues`
only seed state once, on mount — they do NOT re-sync if the record being
edited changes while the form instance stays mounted. The table conditionally
renders the update/delete modal itself (`rowAction?.variant === "update" &&
rowAction.row && <UpdateXModal ... x={rowAction.row.original} />`), so the
modal (and the `…Form` inside it) unmounts when `rowAction` is cleared and
remounts fresh — reseeding `defaultValues` — the next time a row action opens
it. Don't reintroduce an `open`-boolean-with-nullable-record modal that stays
mounted across records; that reintroduces the stale-`defaultValues` bug and
needs an explicit `key` to work around it.
