"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/frontend/auth/auth";
import { Button } from "@/frontend/components/ui/button";

export function SignOutButton() {
    const router = useRouter();
    return (
        <Button
            className="label-ops h-7 rounded-sm border-rule px-2.5 text-muted-foreground hover:text-foreground"
            variant="outline"
            size="sm"
            onClick={async () => {
                await authClient.signOut();
                router.push("/auth/sign-in");
            }}
        >
            Salir
        </Button>
    );
}
