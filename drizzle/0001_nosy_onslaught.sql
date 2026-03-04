CREATE TABLE "events_and_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'Upcoming',
	"scheduled_date" timestamp,
	"tags" jsonb,
	"metrics" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "activity_logs" CASCADE;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD COLUMN "purchase_deadline" timestamp;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "subscription_renewal_date" timestamp;--> statement-breakpoint
ALTER TABLE "events_and_logs" ADD CONSTRAINT "events_and_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;