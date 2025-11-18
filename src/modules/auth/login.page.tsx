import { LoginForm } from "./components/login-form";

export default function LoginPage() {
    return (
        <section className="bg-background min-h-screen">
            <div className="flex min-h-screen items-center justify-center p-4">
                <LoginForm />
            </div>
        </section>
    );
}
