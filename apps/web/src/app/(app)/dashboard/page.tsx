import { Dashboard } from "@/core/finding/client/ui/dashboard";
import { requireAuth } from "@/server/auth/require-auth";

export default async function DashboardPage() {
    await requireAuth();
    return <Dashboard />;
}
