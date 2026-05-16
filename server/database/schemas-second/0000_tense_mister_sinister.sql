-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."activity_type" AS ENUM('quiz', 'escapeRoom', 'paint', 'yoga', 'dance', 'laserTag', 'comedy', 'cooking', 'karaoke', 'museum', 'miniGolf', 'bowling', 'arcade', 'boardGames', 'sport', 'other');--> statement-breakpoint
CREATE TYPE "public"."assignee_status" AS ENUM('pending', 'confirmed', 'declined', 'cancelled', 'waitlisted');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('en', 'fr');--> statement-breakpoint
CREATE TYPE "public"."quiz_activity_type" AS ENUM('workshops', 'board_games_arcade', 'escape_room', 'museum_art_gallery', 'food_crawl', 'coffee_tea', 'walks_hikes', 'fitness', 'sports', 'trivia_night', 'networking_coworking');--> statement-breakpoint
CREATE TYPE "public"."quiz_alcohol" AS ENUM('yes', 'no', 'away');--> statement-breakpoint
CREATE TYPE "public"."quiz_expectation" AS ENUM('friends', 'professional', 'partner', 'fun', 'not_sure');--> statement-breakpoint
CREATE TYPE "public"."quiz_kids" AS ENUM('yes', 'no', 'on_the_way', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."quiz_referral_source" AS ENUM('instagram', 'facebook', 'tiktok', 'reddit', 'discord', 'google', 'someone', 'other');--> statement-breakpoint
CREATE TYPE "public"."quiz_relationship_status" AS ENUM('single', 'in_relationship', 'married', 'prefer_not_to_say');--> statement-breakpoint
CREATE TYPE "public"."quiz_work_industry" AS ENUM('technology', 'finance_insurance', 'healthcare_life_sciences', 'education_research', 'government_nonprofit', 'manufacturing_industrial', 'construction_real_estate', 'retail_consumer', 'media_marketing_entertainment', 'transportation_logistics', 'energy_environment', 'professional_services', 'other');--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"language" "language" DEFAULT 'fr' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_quiz_at" timestamp,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"phone_number" text,
	"birth_date" date,
	"gender" "gender",
	"signup_reminder_count" integer DEFAULT 0 NOT NULL,
	"last_signup_reminder_sent_at" timestamp,
	"promo_emails_opt_out" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"warmth" smallint NOT NULL,
	"extroversion" smallint NOT NULL,
	"leadership" smallint NOT NULL,
	"directness" smallint NOT NULL,
	"activity_types" "quiz_activity_type"[] NOT NULL,
	"activity_suggestion" text,
	"alcohol" "quiz_alcohol" NOT NULL,
	"max_budget" smallint NOT NULL,
	"english_level" smallint NOT NULL,
	"french_level" smallint NOT NULL,
	"work_industry" "quiz_work_industry" NOT NULL,
	"expectations" "quiz_expectation"[] NOT NULL,
	"relationship_status" "quiz_relationship_status" NOT NULL,
	"kids" "quiz_kids" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"referral_source" "quiz_referral_source" DEFAULT 'other',
	CONSTRAINT "quiz_answers_userId_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"description" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"address" text NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"capacity" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"is_alcohol_served" boolean DEFAULT false NOT NULL,
	"allow_plus_one" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"language" "language" DEFAULT 'fr',
	"published_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_auto_assignable" boolean DEFAULT true NOT NULL,
	"auto_assign_min_age" integer,
	"auto_assign_max_age" integer
);
--> statement-breakpoint
CREATE TABLE "event_assignee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" "assignee_status" DEFAULT 'pending' NOT NULL,
	"responded_at" timestamp with time zone,
	"email_sent_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"plus_one_added_at" timestamp with time zone,
	"compatibility_score" integer DEFAULT 0 NOT NULL,
	"stripe_payment_intent_id" text,
	"sms_sent_at" timestamp with time zone,
	"feedback_email_sent_at" timestamp with time zone,
	"reminder_email_sent_at" timestamp with time zone,
	"reminder_sms_sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stripe_customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_customer_userId_unique" UNIQUE("user_id"),
	CONSTRAINT "stripe_customer_stripeCustomerId_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "event_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_assignee" ADD CONSTRAINT "event_assignee_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_assignee" ADD CONSTRAINT "event_assignee_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_customer" ADD CONSTRAINT "stripe_customer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_feedback" ADD CONSTRAINT "event_feedback_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_feedback" ADD CONSTRAINT "event_feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier" text_ops);--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "event_assignee_event_user_idx" ON "event_assignee" USING btree ("event_id" text_ops,"user_id" text_ops);--> statement-breakpoint
CREATE INDEX "event_assignee_status_idx" ON "event_assignee" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "stripe_customer_user_id_idx" ON "stripe_customer" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "event_feedback_event_idx" ON "event_feedback" USING btree ("event_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "event_feedback_event_user_idx" ON "event_feedback" USING btree ("event_id" text_ops,"user_id" text_ops);--> statement-breakpoint
CREATE INDEX "event_feedback_user_idx" ON "event_feedback" USING btree ("user_id" text_ops);
*/