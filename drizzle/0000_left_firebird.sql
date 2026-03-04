CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"log_type" text NOT NULL,
	"date_recorded" timestamp DEFAULT now() NOT NULL,
	"tags" jsonb,
	"metrics" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"file_type" text NOT NULL,
	"file_url" text,
	"renewal_date" timestamp,
	"renewal_cost" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"priority" text,
	"cost" numeric DEFAULT '0',
	"weight" numeric DEFAULT '0',
	"is_acquired" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "power_systems" (
	"id" text PRIMARY KEY NOT NULL,
	"rv_id" text NOT NULL,
	"battery_capacity_ah" numeric DEFAULT '0',
	"battery_voltage" numeric DEFAULT '12',
	"solar_capacity_watts" numeric DEFAULT '0',
	"inverter_wattage" numeric DEFAULT '0',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "power_systems_rv_id_unique" UNIQUE("rv_id")
);
--> statement-breakpoint
CREATE TABLE "rv_vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"year" integer,
	"make" text,
	"model" text,
	"length_feet" numeric,
	"dry_weight_lbs" numeric,
	"gvwr_lbs" numeric,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subscription_status" text DEFAULT 'inactive',
	"first_name" text,
	"last_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "water_systems" (
	"id" text PRIMARY KEY NOT NULL,
	"rv_id" text NOT NULL,
	"fresh_capacity_gal" numeric DEFAULT '0',
	"gray_capacity_gal" numeric DEFAULT '0',
	"black_capacity_gal" numeric DEFAULT '0',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "water_systems_rv_id_unique" UNIQUE("rv_id")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_items" ADD CONSTRAINT "equipment_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "power_systems" ADD CONSTRAINT "power_systems_rv_id_rv_vehicles_id_fk" FOREIGN KEY ("rv_id") REFERENCES "public"."rv_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rv_vehicles" ADD CONSTRAINT "rv_vehicles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_systems" ADD CONSTRAINT "water_systems_rv_id_rv_vehicles_id_fk" FOREIGN KEY ("rv_id") REFERENCES "public"."rv_vehicles"("id") ON DELETE no action ON UPDATE no action;