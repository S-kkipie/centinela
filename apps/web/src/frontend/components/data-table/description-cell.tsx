"use client";
import { Eye } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/frontend/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/frontend/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/frontend/components/ui/tooltip";

export default function DescriptionCell({
    description,
}: {
    description: ReactNode;
}) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Convert ReactNode to string for length check
    const getTextLength = (node: ReactNode): number => {
        if (typeof node === "string") return node.length;
        if (typeof node === "number") return String(node).length;
        if (node === null || node === undefined) return 0;

        // For complex ReactNodes, assume they need truncation
        return 25;
    };

    const shouldTruncate = getTextLength(description) > 20;

    return shouldTruncate ? (
        <div className="flex items-center gap-2 max-w-50">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="truncate cursor-help flex-1">
                            {description}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="p-3">
                        <div className="text-sm whitespace-normal">
                            {description}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Eye className="h-3 w-3" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                            Descripción completa
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {description}
                        </p>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    ) : (
        description
    );
}
