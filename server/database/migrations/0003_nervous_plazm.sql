CREATE TABLE "campaign" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel_budget_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date
);
--> statement-breakpoint
ALTER TABLE "spend" RENAME COLUMN "channel_budget_id" TO "campaign_id";--> statement-breakpoint
ALTER TABLE "result" RENAME COLUMN "channel_budget_id" TO "campaign_id";--> statement-breakpoint
ALTER TABLE "spend" DROP CONSTRAINT "spend_channel_budget_id_channel_budget_id_fk";
--> statement-breakpoint
ALTER TABLE "result" DROP CONSTRAINT "result_channel_budget_id_channel_budget_id_fk";
--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_channel_budget_id_channel_budget_id_fk" FOREIGN KEY ("channel_budget_id") REFERENCES "public"."channel_budget"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spend" ADD CONSTRAINT "spend_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result" ADD CONSTRAINT "result_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE no action ON UPDATE no action;