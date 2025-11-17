import { redirect } from "next/navigation";
import { getSession } from "@/modules/auth/utils/auth-utils";
export default async function Page() {
    const session = await getSession();

    if (!session?.user) {
        redirect("/");
    }

    redirect("/dashboard/knowledge");
}
