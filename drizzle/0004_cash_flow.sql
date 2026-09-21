CREATE TABLE "cf_calculators" (
	"id" text PRIMARY KEY NOT NULL,
	"scenario_id" text NOT NULL,
	"line_item_id" text,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "cf_cells" (
	"id" text PRIMARY KEY NOT NULL,
	"scenario_id" text NOT NULL,
	"line_item_id" text NOT NULL,
	"month" integer NOT NULL,
	"planned" numeric DEFAULT '0' NOT NULL,
	"actual" numeric,
	"paid" boolean DEFAULT false NOT NULL,
	"note" text
);--> statement-breakpoint
CREATE TABLE "cf_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"scenario_id" text NOT NULL,
	"section_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'Other' NOT NULL,
	"due_day" integer,
	"recurrence" text DEFAULT 'monthly' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "cf_scenarios" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"year" integer NOT NULL,
	"opening_cash" numeric DEFAULT '0' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"cloned_from_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "cf_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"scenario_id" text NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);--> statement-breakpoint
ALTER TABLE "system_settings" ALTER COLUMN "feature_flags" SET DEFAULT '{"solar_capture":true,"document_manager":true,"water_calculator":true,"budget_calculator":true,"purchase_calculator":true,"cash_flow":true}'::jsonb;--> statement-breakpoint
ALTER TABLE "cf_calculators" ADD CONSTRAINT "cf_calculators_scenario_id_cf_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."cf_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cf_calculators" ADD CONSTRAINT "cf_calculators_line_item_id_cf_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."cf_line_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cf_cells" ADD CONSTRAINT "cf_cells_scenario_id_cf_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."cf_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cf_cells" ADD CONSTRAINT "cf_cells_line_item_id_cf_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."cf_line_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cf_line_items" ADD CONSTRAINT "cf_line_items_scenario_id_cf_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."cf_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cf_line_items" ADD CONSTRAINT "cf_line_items_section_id_cf_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."cf_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cf_scenarios" ADD CONSTRAINT "cf_scenarios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cf_sections" ADD CONSTRAINT "cf_sections_scenario_id_cf_scenarios_id_fk" FOREIGN KEY ("scenario_id") REFERENCES "public"."cf_scenarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cf_calculators_scenario_idx" ON "cf_calculators" USING btree ("scenario_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cf_cells_line_month_idx" ON "cf_cells" USING btree ("line_item_id","month");--> statement-breakpoint
CREATE INDEX "cf_cells_scenario_idx" ON "cf_cells" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "cf_line_items_scenario_idx" ON "cf_line_items" USING btree ("scenario_id");--> statement-breakpoint
CREATE INDEX "cf_scenarios_user_idx" ON "cf_scenarios" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cf_sections_scenario_idx" ON "cf_sections" USING btree ("scenario_id");
