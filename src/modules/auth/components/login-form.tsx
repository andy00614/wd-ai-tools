"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    type SignInSchema,
    signInSchema,
} from "@/modules/auth/models/auth.model";
import { authClient } from "@/modules/auth/utils/auth-client";
import dashboardRoutes from "@/modules/dashboard/dashboard.route";
import { signIn } from "../actions/auth.action";
import authRoutes from "../auth.route";

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<SignInSchema>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const signInWithGoogle = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: dashboardRoutes.knowledge,
        });
    };

    async function onSubmit(values: SignInSchema) {
        setIsLoading(true);
        const { success, message } = await signIn(values);

        if (success) {
            toast.success(message.toString());
            router.push(dashboardRoutes.knowledge);
        } else {
            toast.error(message.toString());
        }
        setIsLoading(false);
    }

    return (
        <div className="border-muted bg-background flex w-full max-w-sm flex-col items-center gap-y-6 md:gap-y-8 rounded-md border px-4 md:px-6 py-8 md:py-12 shadow-md">
            <div className="flex flex-col items-center gap-y-2 text-center">
                <h1 className="text-2xl md:text-3xl font-semibold">WD AI Tools</h1>
                <p className="text-muted-foreground text-xs md:text-sm">
                    Welcome back! Please sign in to continue
                </p>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex w-full flex-col gap-4"
                >
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        required
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        required
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="mt-2 w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                    Loading...
                                </>
                            ) : (
                                "Login"
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={signInWithGoogle}
                        >
                            <FcGoogle className="mr-2 size-5" />
                            Sign in with Google
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="text-muted-foreground flex justify-center gap-1 text-sm">
                <p>Don&apos;t have an account?</p>
                <Link
                    href={authRoutes.signup}
                    className="text-primary font-medium hover:underline"
                >
                    Sign up
                </Link>
            </div>
        </div>
    );
}
