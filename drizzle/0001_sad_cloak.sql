CREATE TYPE "public"."ownership_request_status" AS ENUM('Pending', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."ownership_request_type" AS ENUM('Create', 'Claim');--> statement-breakpoint
CREATE TABLE "business_ownership_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_id" integer,
	"request_type" "ownership_request_type" NOT NULL,
	"name" varchar(200),
	"description" text,
	"category_id" integer,
	"sub_category_id" integer,
	"governorate_id" integer,
	"city_id" integer,
	"area_id" integer,
	"address" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"phone" varchar(30),
	"whatsapp" varchar(30),
	"website" text,
	"price_range" varchar(20),
	"notes" text,
	"status" "ownership_request_status" DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" integer
);
--> statement-breakpoint
ALTER TABLE "business_hours" DROP CONSTRAINT "business_hours_day_check";--> statement-breakpoint
ALTER TABLE "business_services" DROP CONSTRAINT "business_services_price_check";--> statement-breakpoint
ALTER TABLE "business_services" DROP CONSTRAINT "business_services_duration_check";--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_latitude_check";--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_longitude_check";--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_discount_value_check";--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_dates_check";--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_rating_check";--> statement-breakpoint
ALTER TABLE "business_ownership_requests" ADD CONSTRAINT "business_ownership_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_ownership_requests" ADD CONSTRAINT "business_ownership_requests_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_ownership_requests" ADD CONSTRAINT "business_ownership_requests_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_ownership_requests" ADD CONSTRAINT "business_ownership_requests_sub_category_id_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_ownership_requests" ADD CONSTRAINT "business_ownership_requests_governorate_id_governorates_id_fk" FOREIGN KEY ("governorate_id") REFERENCES "public"."governorates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_ownership_requests" ADD CONSTRAINT "business_ownership_requests_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_ownership_requests" ADD CONSTRAINT "business_ownership_requests_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_ownership_requests" ADD CONSTRAINT "business_ownership_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ownership_requests_user_idx" ON "business_ownership_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ownership_requests_business_idx" ON "business_ownership_requests" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "ownership_requests_status_idx" ON "business_ownership_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ownership_requests_type_idx" ON "business_ownership_requests" USING btree ("request_type");--> statement-breakpoint
CREATE INDEX "ownership_requests_created_idx" ON "business_ownership_requests" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_day_check" CHECK (
        "business_hours"."day_of_week"
        BETWEEN 0 AND 6
      );--> statement-breakpoint
ALTER TABLE "business_services" ADD CONSTRAINT "business_services_price_check" CHECK (
        "business_services"."price" IS NULL
        OR "business_services"."price" >= 0
      );--> statement-breakpoint
ALTER TABLE "business_services" ADD CONSTRAINT "business_services_duration_check" CHECK (
        "business_services"."duration_minutes" IS NULL
        OR "business_services"."duration_minutes" > 0
      );--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_latitude_check" CHECK (
        "businesses"."latitude" IS NULL
        OR (
          "businesses"."latitude" >= -90
          AND "businesses"."latitude" <= 90
        )
      );--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_longitude_check" CHECK (
        "businesses"."longitude" IS NULL
        OR (
          "businesses"."longitude" >= -180
          AND "businesses"."longitude" <= 180
        )
      );--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_discount_value_check" CHECK (
        "offers"."discount_value" >= 0
      );--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_dates_check" CHECK (
        "offers"."end_date" > "offers"."start_date"
      );--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK (
        "reviews"."rating" BETWEEN 1 AND 5
      );