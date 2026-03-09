ALTER TABLE "expenses" ADD COLUMN "is_fuel_event" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "is_propane_event" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "gallons" numeric;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "odometer_reading" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "is_hitched" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "state_location" text;