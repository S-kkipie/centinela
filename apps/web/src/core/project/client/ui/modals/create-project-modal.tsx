"use client";

import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/frontend/components/ui/dialog";
import { useProjects } from "../../hooks";
import type { ProjectFormValues } from "../../validation";
import { ProjectForm } from "../forms/project-form";

interface CreateProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/** Modal for creating a project. Empty description → `undefined` (create schema). */
export function CreateProjectModal({
    open,
    onOpenChange,
}: CreateProjectModalProps) {
    const { useCreate } = useProjects();
    const createProject = useCreate();

    function handleSubmit(values: ProjectFormValues) {
        createProject.mutate(
            {
                name: values.name,
                description: values.description.trim() || undefined,
                status: values.status,
            },
            {
                onSuccess: () => {
                    toast.success("Project created");
                    onOpenChange(false);
                },
                onError: () => toast.error("Create failed"),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New project</DialogTitle>
                    <DialogDescription>
                        Add a new project to your workspace.
                    </DialogDescription>
                </DialogHeader>
                <ProjectForm
                    onSubmit={handleSubmit}
                    disabled={createProject.isPending}
                />
            </DialogContent>
        </Dialog>
    );
}
