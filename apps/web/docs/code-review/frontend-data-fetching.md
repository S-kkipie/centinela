# Frontend — data fetching (Eden proxy, one factory hook per domain)

## 1. One factory hook per domain `MAJOR`

A domain's client hooks live in `core/<domain>/client/hooks.ts` as a **single
exported factory** `useXxx = () => ({ useList, useGetById, useCreate, useUpdate,
useDelete })`. Bind the domain proxy, `queryClient`, and the list key **once** at
the top; every returned sub-hook closes over them.

```ts
export const useProjects = () => {
    const client = useElysia().projects; // bind the domain once
    const queryClient = useQueryClient();
    const LIST_KEY = client.get.queryKey();

    const useList = () => useQuery(client.get.queryOptions());

    const useCreate = () =>
        useMutation(
            client.post.mutationOptions({
                onSuccess: () =>
                    queryClient.invalidateQueries({ queryKey: LIST_KEY }),
            }),
        );
    // ...
    return { useList, useGetById, useCreate, useUpdate, useDelete };
};
```

Consumers call the sub-hooks: `const { useList, useCreate } = useProjects(); const list = useList();`.

**Check:** flag a set of loose top-level `useCreateXxx`/`useUpdateXxx` exports — a
CRUD domain uses the one-factory shape (canonical: myworkin `core/cv-builder/client/hooks.ts`).
A purely read-only domain may instead export a couple of plain `useQuery` hooks.

## 2. Options factories, not hand-rolled keys `MAJOR`

`useQuery(client.get.queryOptions())`, `useMutation(client.post.mutationOptions({ onSuccess }))`,
`client.get.queryKey()` for invalidation. Pass `onSuccess`/`onError` **into**
`mutationOptions({...})`. Never hand-build `queryFn`/`queryKey`/`mutationFn` when
the proxy expresses it.

## 3. Dynamic-path operations `MAJOR`

- **id known at call-site** → the hook takes the id:
  `useUpdate = (id: string) => useMutation(client({ id }).put.mutationOptions({ onSuccess }))`.
- **id per-invocation** (one hook instance drives any of N rows) → id as a
  mutation variable:
  `useDelete = () => useMutation({ mutationFn: (id: string) => client({ id }).delete.mutationOptions().mutationFn(undefined), onSuccess })`.

## 4. Read the envelope `MAJOR`

Consumers read `data.response`, never `data` directly:
`const items = listQuery.data?.response ?? [];`.

## 5. Raw `apiClient` only outside hooks/components `MAJOR`

`apiClient` (raw treaty) is allowed only in provider wiring. It is forbidden in a
`.tsx` component or a `useQuery`/`useMutation` hook — those go through `useElysia()`.
