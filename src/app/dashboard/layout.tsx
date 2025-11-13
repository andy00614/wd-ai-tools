import { Sidebar } from "@/components/ui/sidebar";
import { getSession } from "@/modules/auth/utils/auth-utils";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    return (
        <div className="flex h-screen w-screen flex-row">
            <Sidebar
                userName={session?.user?.name ?? "User"}
                userEmail={session?.user?.email ?? ""}
                organizationName="AI Workspace"
            />
            <main className="flex h-screen grow flex-col overflow-auto ml-[3.05rem]">
                {children}
            </main>
        </div>
    );
}
