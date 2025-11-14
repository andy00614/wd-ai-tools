import { LoginForm } from "./components/login-form";

export default function LoginPage() {
    return (
        <section className="bg-background h-screen">
            <div className="flex h-full items-center justify-center">
                <LoginForm />
            </div>
        </section>
    );
}
