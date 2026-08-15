"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/frontend/auth/auth";
import { Button } from "@/frontend/components/ui/button";

export function SignOutButton() {
    const router = useRouter();
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={async () => {
                await authClient.signOut();
                router.push("/auth/sign-in");
            }}
        >
            Sign out
        </Button>
    );
}
