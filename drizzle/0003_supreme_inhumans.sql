CREATE TYPE "public"."area_suggestion_status" AS ENUM('Pending', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TABLE "area_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"city_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"notes" text,
	"status" "area_suggestion_status" DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" integer
);
--> statement-breakpoint
ALTER TABLE "area_suggestions" ADD CONSTRAINT "area_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_suggestions" ADD CONSTRAINT "area_suggestions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_suggestions" ADD CONSTRAINT "area_suggestions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "area_suggestions_user_idx" ON "area_suggestions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "area_suggestions_city_idx" ON "area_suggestions" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "area_suggestions_status_idx" ON "area_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "area_suggestions_created_idx" ON "area_suggestions" USING btree ("created_at");