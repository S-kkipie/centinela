"use client";

import { toast } from "sonner";
import type { Project } from "@/core/project/domain/types";
import { Button } from "@/frontend/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/frontend/components/ui/dialog";
import { useProjects } from "../../hooks";

interface DeleteProjectModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The project to delete. The caller conditionally renders this modal per
     *  row action, so `project` is always set while it's mounted. */
    project: Project;
    /** Called after a successful delete (e.g. to clear the row's selection). */
    onSuccess?: () => void;
}

/** Confirmation modal for deleting a project. */
export function DeleteProjectModal({
    open,
    onOpenChange,
    project,
    onSuccess,
}: DeleteProjectModalProps) {
    const { useDelete } = useProjects();
    const deleteProject = useDelete();

    function handleDelete() {
        deleteProject.mutate(project.id, {
            onSuccess: () => {
                toast.success("Project deleted");
                onOpenChange(false);
                onSuccess?.();
            },
            onError: () => toast.error("Delete failed"),
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete project</DialogTitle>
                    <DialogDescription>
                        {`This will permanently delete "${project.name}". This action cannot be undone.`}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={deleteProject.isPending}
                        onClick={handleDelete}
                    >
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
