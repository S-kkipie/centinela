"use client";

import { toast } from "sonner";
import type { Project } from "@/core/project/domain/types";
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

interface UpdateProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The project being edited. The caller conditionally renders this modal
     *  per row action, so `project` is always set while it's mounted. */
    project: Project;
}

/** Modal for editing a project. Empty description → `null` (clears the column). */
export function UpdateProjectModal({
    open,
    onOpenChange,
    project,
}: UpdateProjectModalProps) {
    const { useUpdate } = useProjects();
    const updateProject = useUpdate(project.id);

    function handleSubmit(values: ProjectFormValues) {
        updateProject.mutate(
            {
                name: values.name,
                description: values.description.trim() || null,
                status: values.status,
            },
            {
                onSuccess: () => {
                    toast.success("Project updated");
                    onOpenChange(false);
                },
                onError: () => toast.error("Update failed"),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit project</DialogTitle>
                    <DialogDescription>
                        Update your project details.
                    </DialogDescription>
                </DialogHeader>
                <ProjectForm
                    defaultValues={{
                        name: project.name,
                        description: project.description ?? "",
                        status: project.status,
                    }}
                    onSubmit={handleSubmit}
                    disabled={updateProject.isPending}
                />
            </DialogContent>
        </Dialog>
    );
}
