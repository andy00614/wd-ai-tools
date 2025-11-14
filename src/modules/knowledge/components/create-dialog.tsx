"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    createSessionSchema,
    type CreateSessionFormInput,
    type CreateSessionInput,
} from "../models/knowledge.model";
import GenerationDialog from "./generation-dialog";

export default function CreateDialog() {
    const [open, setOpen] = useState(false);
    const [generationOpen, setGenerationOpen] = useState(false);
    const [sessionInput, setSessionInput] = useState<CreateSessionInput | null>(
        null,
    );

    const form = useForm<CreateSessionFormInput>({
        resolver: zodResolver(createSessionSchema),
        defaultValues: {
            title: "",
            model: "openai/gpt-4o",
        },
    });

    function onSubmit(values: CreateSessionFormInput) {
        // Parse to ensure defaults are applied
        const parsed = createSessionSchema.parse(values);
        setSessionInput(parsed);
        setOpen(false);
        setGenerationOpen(true);
        form.reset();
    }

    // Cleanup when GenerationDialog closes
    function handleGenerationDialogChange(open: boolean) {
        setGenerationOpen(open);
        if (!open) {
            setSessionInput(null);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>+ Create</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Knowledge Session</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Knowledge Point</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., React Hooks, TypeScript Generics"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>AI Model</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a model" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="openai/gpt-4o">
                                                OpenAI GPT-4o
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full">
                            Generate Knowledge Session
                        </Button>
                    </form>
                </Form>
            </DialogContent>
            {sessionInput && (
                <GenerationDialog
                    open={generationOpen}
                    onOpenChange={handleGenerationDialogChange}
                    sessionInput={sessionInput}
                />
            )}
        </Dialog>
    );
}
