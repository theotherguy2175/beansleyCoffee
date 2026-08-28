ALTER TABLE `orders` ADD `barista_id` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `users` ADD `is_barista` integer DEFAULT false NOT NULL;--> statement-breakpoint
-- Backfill: every existing admin/staff account starts as an active barista,
-- matching how notifications already worked pre-migration (one shared inbox
-- for all of them). New admin/staff accounts default the same way in code
-- (see users.routes.ts); customers can never be baristas.
UPDATE `users` SET `is_barista` = 1 WHERE `role` IN ('admin', 'staff');