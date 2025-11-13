ALTER TABLE `prompts` ADD `is_default` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `prompts` ADD `variables` text;