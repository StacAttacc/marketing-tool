CREATE TABLE "budget_prediction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_period" text NOT NULL,
	"budget_id" uuid NOT NULL,
	"total_budget_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channel_prediction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_prediction_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	"allocated_budget_cents" integer NOT NULL,
	"predicted_revenue_cents" integer,
	"predicted_users_acquired" integer,
	CONSTRAINT "channel_prediction_budget_prediction_id_channel_id_unique" UNIQUE("budget_prediction_id","channel_id")
);
--> statement-breakpoint
ALTER TABLE "budget_prediction" ADD CONSTRAINT "budget_prediction_budget_id_budget_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budget"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_prediction" ADD CONSTRAINT "channel_prediction_budget_prediction_id_budget_prediction_id_fk" FOREIGN KEY ("budget_prediction_id") REFERENCES "public"."budget_prediction"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_prediction" ADD CONSTRAINT "channel_prediction_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE no action ON UPDATE no action;