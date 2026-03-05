CREATE TABLE "daily_solar_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"rv_id" text NOT NULL,
	"date" text NOT NULL,
	"weather_condition" text NOT NULL,
	"sun_hours" numeric DEFAULT '0',
	"generated_wh" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "electrical_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"rv_id" text NOT NULL,
	"name" text NOT NULL,
	"group_type" text NOT NULL,
	"category" text NOT NULL,
	"watts" numeric DEFAULT '0',
	"hours_per_day" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"amount" numeric DEFAULT '0',
	"is_fixed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_data" (
	"id" text PRIMARY KEY NOT NULL,
	"rv_id" text NOT NULL,
	"purchase_price" numeric DEFAULT '0',
	"sales_tax_rate" numeric DEFAULT '0',
	"down_payment" numeric DEFAULT '0',
	"trade_in_value" numeric DEFAULT '0',
	"loan_term_years" integer DEFAULT 5,
	"interest_rate" numeric DEFAULT '0',
	"credit_score" text,
	"registration_fees" numeric DEFAULT '0',
	"insurance" numeric DEFAULT '0',
	"extended_warranty" numeric DEFAULT '0',
	"accessories" numeric DEFAULT '0',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "financial_data_rv_id_unique" UNIQUE("rv_id")
);
--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source" text NOT NULL,
	"amount" numeric DEFAULT '0',
	"is_fixed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solar_equipment" (
	"id" text PRIMARY KEY NOT NULL,
	"rv_id" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"equipment_type" text NOT NULL,
	"specs" text,
	"quantity" integer DEFAULT 1,
	"price" numeric DEFAULT '0',
	"wattage" numeric DEFAULT '0',
	"weight" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"demo_mode" boolean DEFAULT true,
	"maintenance_mode" boolean DEFAULT false,
	"default_sub_days" integer DEFAULT 30,
	"feature_flags" jsonb DEFAULT '{"solar_capture":true,"document_manager":true,"water_calculator":true,"budget_calculator":true,"purchase_calculator":true}'::jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tank_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"type" text NOT NULL,
	"tank" text NOT NULL,
	"volume" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "water_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"gallons_per_use" numeric DEFAULT '0',
	"times_per_day" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "dashboard_hero_image" text;--> statement-breakpoint
ALTER TABLE "daily_solar_logs" ADD CONSTRAINT "daily_solar_logs_rv_id_rv_vehicles_id_fk" FOREIGN KEY ("rv_id") REFERENCES "public"."rv_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electrical_devices" ADD CONSTRAINT "electrical_devices_rv_id_rv_vehicles_id_fk" FOREIGN KEY ("rv_id") REFERENCES "public"."rv_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_data" ADD CONSTRAINT "financial_data_rv_id_rv_vehicles_id_fk" FOREIGN KEY ("rv_id") REFERENCES "public"."rv_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solar_equipment" ADD CONSTRAINT "solar_equipment_rv_id_rv_vehicles_id_fk" FOREIGN KEY ("rv_id") REFERENCES "public"."rv_vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tank_logs" ADD CONSTRAINT "tank_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_activities" ADD CONSTRAINT "water_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;