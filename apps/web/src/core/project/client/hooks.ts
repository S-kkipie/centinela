"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useElysia } from "@/frontend/lib/eden";

/**
 * Client mutation hooks for the projects domain. The list is RSC-driven (see
 * `/projects/page.tsx` → `server.tsx` → `ProjectsTable`) so there is no
 * client list query left to invalidate — each mutation's `onSuccess` calls
 * `router.refresh()` instead, which re-runs the server component against the
 * current URL search params (page/sort/filters/search) and streams the next
 * page in.
 */
export const useProjects = () => {
    const client = useElysia().projects;
    const router = useRouter();

    const useCreate = () =>
        useMutation(
            client.post.mutationOptions({
                onSuccess: () => router.refresh(),
            }),
        );

    const useUpdate = (id: string) =>
        useMutation(
            client({ id }).put.mutationOptions({
                onSuccess: () => router.refresh(),
            }),
        );

    const useDelete = () =>
        useMutation({
            mutationFn: (id: string) =>
                client({ id }).delete.mutationOptions().mutationFn(undefined),
            onSuccess: () => router.refresh(),
        });

    return { useCreate, useUpdate, useDelete };
};
