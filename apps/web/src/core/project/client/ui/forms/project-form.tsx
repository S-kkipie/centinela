"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { Button } from "@/frontend/components/ui/button";
import { Field, FieldError } from "@/frontend/components/ui/field";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { useAppForm } from "@/frontend/hooks/use-tanstack-form";
import type { ProjectStatus } from "../../../domain/types";
import { type ProjectFormValues, projectFormSchema } from "../../validation";

const projectDefaultValues: ProjectFormValues = {
    name: "",
    description: "",
    status: "active",
};

function _projectForm() {
    // biome-ignore lint/correctness/useHookAtTopLevel: only used for its return type
    return useAppForm({
        defaultValues: projectDefaultValues,
        validators: { onChange: projectFormSchema },
        onSubmit: async () => {},
    });
}

export type ProjectFormApiType = ReturnType<typeof _projectForm>;

function getFieldErrors(field: AnyFieldApi) {
    return field.state.meta.errors.map((error) => ({
        message: String(error?.message ?? error),
    }));
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
];

interface ProjectFormUIProps {
    form: ProjectFormApiType;
    disabled?: boolean;
}

function ProjectFormUI({ form, disabled }: ProjectFormUIProps) {
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
            }}
            className="space-y-4"
        >
            <form.Field name="name">
                {(field) => {
                    const hasError = !field.state.meta.isValid;
                    return (
                        <Field data-invalid={hasError}>
                            <Label htmlFor={field.name}>Name</Label>
                            <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                placeholder="Project name"
                                aria-invalid={hasError}
                            />
                            {hasError && (
                                <FieldError errors={getFieldErrors(field)} />
                            )}
                        </Field>
                    );
                }}
            </form.Field>

            <form.Field name="description">
                {(field) => {
                    const hasError = !field.state.meta.isValid;
                    return (
                        <Field data-invalid={hasError}>
                            <Label htmlFor={field.name}>Description</Label>
                            <Textarea
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                    field.handleChange(e.target.value)
                                }
                                rows={3}
                                placeholder="Optional description"
                                aria-invalid={hasError}
                            />
                            {hasError && (
                                <FieldError errors={getFieldErrors(field)} />
                            )}
                        </Field>
                    );
                }}
            </form.Field>

            <form.Field name="status">
                {(field) => (
                    <Field>
                        <Label htmlFor={field.name}>Status</Label>
                        <select
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) =>
                                field.handleChange(
                                    e.target.value as ProjectStatus,
                                )
                            }
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            {STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                )}
            </form.Field>

            <form.Subscribe selector={(state) => state.canSubmit}>
                {(canSubmit) => (
                    <Button
                        type="submit"
                        disabled={disabled || !canSubmit}
                        className="w-full"
                    >
                        {disabled ? "Saving…" : "Save"}
                    </Button>
                )}
            </form.Subscribe>
        </form>
    );
}

interface ProjectFormProps {
    /** Seed values for edit; omit for a blank create form. */
    defaultValues?: ProjectFormValues;
    /** Receives the validated form values on submit. */
    onSubmit: (values: ProjectFormValues) => void | Promise<void>;
    disabled?: boolean;
}

/**
 * Create/edit form for a project. Validates client-side via
 * {@link projectFormSchema} and hands the validated {@link ProjectFormValues}
 * to `onSubmit`. Callers (the create/update modals) map the empty-description
 * case to `undefined`/`null` for their respective mutation.
 */
export function ProjectForm({
    defaultValues,
    onSubmit,
    disabled,
}: ProjectFormProps) {
    const form = useAppForm({
        defaultValues: defaultValues ?? projectDefaultValues,
        validators: { onChange: projectFormSchema },
        onSubmit: async ({ value }) => {
            await onSubmit(value);
        },
    });

    return <ProjectFormUI form={form} disabled={disabled} />;
}
