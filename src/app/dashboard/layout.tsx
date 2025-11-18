import { Sidebar } from "@/components/ui/sidebar";
import { getSession } from "@/modules/auth/utils/auth-utils";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();
    const userAvatarUrl =
        (session?.user as { image?: string | null } | undefined)?.image ?? null;

    return (
        <div className="flex min-h-screen flex-row">
            <Sidebar
                userName={session?.user?.name ?? "User"}
                userEmail={session?.user?.email ?? ""}
                userAvatarUrl={userAvatarUrl}
                organizationName="AI Workspace"
            />
            <main className="flex min-h-screen grow flex-col overflow-auto md:ml-[3.05rem]">
                {children}
            </main>
        </div>
    );
}
