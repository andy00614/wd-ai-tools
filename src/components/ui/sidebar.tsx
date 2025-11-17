"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import {
    BookOpen,
    ChevronsUpDown,
    Gamepad2,
    LogOut,
    Settings,
    UserCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/modules/auth/actions/auth.action";
import authRoutes from "@/modules/auth/auth.route";

const sidebarVariants = {
    open: {
        width: "15rem",
    },
    closed: {
        width: "3.05rem",
    },
};

const contentVariants = {
    open: { display: "block", opacity: 1 },
    closed: { display: "block", opacity: 1 },
};

const variants = {
    open: {
        x: 0,
        opacity: 1,
        transition: {
            x: { stiffness: 1000, velocity: -100 },
        },
    },
    closed: {
        x: -20,
        opacity: 0,
        transition: {
            x: { stiffness: 100 },
        },
    },
};

const transitionProps = {
    type: "tween" as const,
    ease: "easeOut" as const,
    duration: 0.2,
};

const staggerVariants = {
    open: {
        transition: { staggerChildren: 0.03, delayChildren: 0.02 },
    },
};

interface SidebarProps {
    userName?: string;
    userEmail?: string;
    userAvatarUrl?: string | null;
    organizationName?: string;
}

export function Sidebar({
    userName = "User",
    userEmail = "user@example.com",
    userAvatarUrl = null,
    organizationName = "AI Workspace",
}: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // Extract initials from user name
    const userInitials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    // Extract initials from organization name
    const orgInitials = organizationName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const handleSignOut = async () => {
        if (isSigningOut) return;

        setIsSigningOut(true);
        try {
            const result = await signOut();
            if (result.success) {
                router.push(authRoutes.login);
                router.refresh();
            } else {
                console.error("Sign out failed:", result.message);
            }
        } catch (error) {
            console.error("Sign out error:", error);
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <motion.div
            className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r")}
            initial={isCollapsed ? "closed" : "open"}
            animate={isCollapsed ? "closed" : "open"}
            variants={sidebarVariants}
            transition={transitionProps}
            onMouseEnter={() => setIsCollapsed(false)}
            onMouseLeave={() => setIsCollapsed(true)}
        >
            <motion.div
                className="relative z-40 flex text-muted-foreground h-full shrink-0 flex-col bg-background transition-all"
                variants={contentVariants}
            >
                <motion.ul
                    variants={staggerVariants}
                    className="flex h-full flex-col"
                >
                    <div className="flex grow flex-col items-center">
                        {/* Organization Header */}
                        <div className="flex h-[54px] w-full shrink-0 border-b p-2">
                            <div className="mt-[1.5px] flex w-full">
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger
                                        className="w-full"
                                        asChild
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex w-fit items-center gap-2 px-2"
                                        >
                                            <Avatar className="rounded size-4">
                                                <AvatarFallback>
                                                    {orgInitials}
                                                </AvatarFallback>
                                            </Avatar>
                                            <motion.li
                                                variants={variants}
                                                className="flex w-fit items-center gap-2"
                                            >
                                                {!isCollapsed && (
                                                    <>
                                                        <p className="text-sm font-medium">
                                                            {organizationName}
                                                        </p>
                                                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                                                    </>
                                                )}
                                            </motion.li>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem
                                            asChild
                                            className="flex items-center gap-2"
                                        >
                                            <Link href="/settings">
                                                <Settings className="h-4 w-4" />{" "}
                                                Settings
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex h-full w-full flex-col">
                            <div className="flex grow flex-col gap-4">
                                <ScrollArea className="h-16 grow p-2">
                                    <div
                                        className={cn(
                                            "flex w-full flex-col gap-1",
                                        )}
                                    >
                                        <Link
                                            href="/dashboard/knowledge"
                                            className={cn(
                                                "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                                                pathname?.includes(
                                                    "/dashboard/knowledge",
                                                ) && "bg-muted text-primary",
                                            )}
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            <motion.li variants={variants}>
                                                {!isCollapsed && (
                                                    <p className="ml-2 text-sm font-medium">
                                                        Knowledge
                                                    </p>
                                                )}
                                            </motion.li>
                                        </Link>

                                        <Link
                                            href="/dashboard/questions-game"
                                            className={cn(
                                                "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary",
                                                pathname?.includes(
                                                    "/dashboard/questions-game",
                                                ) && "bg-muted text-primary",
                                            )}
                                        >
                                            <Gamepad2 className="h-4 w-4" />
                                            <motion.li variants={variants}>
                                                {!isCollapsed && (
                                                    <p className="ml-2 text-sm font-medium">
                                                        Questions Game
                                                    </p>
                                                )}
                                            </motion.li>
                                        </Link>
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* User Section */}
                            <div className="flex flex-col p-2">
                                <Link
                                    href="/settings"
                                    className="mt-auto flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary"
                                >
                                    <Settings className="h-4 w-4 shrink-0" />
                                    <motion.li variants={variants}>
                                        {!isCollapsed && (
                                            <p className="ml-2 text-sm font-medium">
                                                Settings
                                            </p>
                                        )}
                                    </motion.li>
                                </Link>
                                <div>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger className="w-full">
                                            <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-muted hover:text-primary">
                                                <Avatar className="size-4">
                                                    {userAvatarUrl ? (
                                                        <AvatarImage
                                                            src={userAvatarUrl}
                                                            alt={userName}
                                                        />
                                                    ) : null}
                                                    <AvatarFallback>
                                                        {userInitials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <motion.li
                                                    variants={variants}
                                                    className="flex w-full items-center gap-2"
                                                >
                                                    {!isCollapsed && (
                                                        <>
                                                            <p className="text-sm font-medium">
                                                                {userName}
                                                            </p>
                                                            <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                                                        </>
                                                    )}
                                                </motion.li>
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent sideOffset={5}>
                                            <div className="flex flex-row items-center gap-2 p-2">
                                                <Avatar className="size-6">
                                                    {userAvatarUrl ? (
                                                        <AvatarImage
                                                            src={userAvatarUrl}
                                                            alt={userName}
                                                        />
                                                    ) : null}
                                                    <AvatarFallback>
                                                        {userInitials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col text-left">
                                                    <span className="text-sm font-medium">
                                                        {userName}
                                                    </span>
                                                    <span className="line-clamp-1 text-xs text-muted-foreground">
                                                        {userEmail}
                                                    </span>
                                                </div>
                                            </div>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                asChild
                                                className="flex items-center gap-2"
                                            >
                                                <Link href="/profile">
                                                    <UserCircle className="h-4 w-4" />{" "}
                                                    Profile
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="flex items-center gap-2"
                                                onSelect={(event) => {
                                                    event.preventDefault();
                                                    handleSignOut();
                                                }}
                                                disabled={isSigningOut}
                                            >
                                                <LogOut className="h-4 w-4" />
                                                {isSigningOut
                                                    ? "Signing out..."
                                                    : "Sign out"}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.ul>
            </motion.div>
        </motion.div>
    );
}
