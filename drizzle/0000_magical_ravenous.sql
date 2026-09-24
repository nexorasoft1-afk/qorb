CREATE TYPE "public"."business_event_type" AS ENUM('View', 'PhoneClick', 'WhatsAppClick', 'DirectionsClick', 'WebsiteClick');--> statement-breakpoint
CREATE TYPE "public"."business_status" AS ENUM('Pending', 'Approved', 'Rejected', 'Suspended');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('Percentage', 'Fixed');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('Pending', 'Reviewed', 'Resolved', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('Pending', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('Pending', 'Approved', 'Rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('User', 'BusinessOwner', 'Admin');--> statement-breakpoint
CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"user_id" integer,
	"event_type" "business_event_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"day_of_week" smallint NOT NULL,
	"open_time" varchar(5),
	"close_time" varchar(5),
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_hours_day_check" CHECK ("business_hours"."day_of_week" BETWEEN 0 AND 6)
);
--> statement-breakpoint
CREATE TABLE "business_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"duration_minutes" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_services_price_check" CHECK ("business_services"."price" IS NULL OR "business_services"."price" >= 0),
	CONSTRAINT "business_services_duration_check" CHECK ("business_services"."duration_minutes" IS NULL OR "business_services"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "business_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"suggested_by_user_id" integer,
	"name" varchar(200) NOT NULL,
	"category_id" integer,
	"city_id" integer,
	"area_id" integer,
	"address" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"phone" varchar(30),
	"notes" text,
	"status" "suggestion_status" DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" integer
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer,
	"name" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"description" text,
	"category_id" integer NOT NULL,
	"sub_category_id" integer,
	"governorate_id" integer NOT NULL,
	"city_id" integer NOT NULL,
	"area_id" integer,
	"address" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"location" geometry(point),
	"phone" varchar(30),
	"whatsapp" varchar(30),
	"website" text,
	"price_range" varchar(20),
	"status" "business_status" DEFAULT 'Pending' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_latitude_check" CHECK ("businesses"."latitude" IS NULL OR ("businesses"."latitude" >= -90 AND "businesses"."latitude" <= 90)),
	CONSTRAINT "businesses_longitude_check" CHECK ("businesses"."longitude" IS NULL OR ("businesses"."longitude" >= -180 AND "businesses"."longitude" <= 180))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"icon" varchar(100),
	"image" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"governorate_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governorates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_discount_value_check" CHECK ("offers"."discount_value" >= 0),
	CONSTRAINT "offers_dates_check" CHECK ("offers"."end_date" > "offers"."start_date")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"business_id" integer NOT NULL,
	"type" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"status" "report_status" DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text,
	"status" "review_status" DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_check" CHECK ("reviews"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "sub_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"password_hash" text,
	"role" "user_role" DEFAULT 'User' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_events" ADD CONSTRAINT "business_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_events" ADD CONSTRAINT "business_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_images" ADD CONSTRAINT "business_images_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_services" ADD CONSTRAINT "business_services_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_suggestions" ADD CONSTRAINT "business_suggestions_suggested_by_user_id_users_id_fk" FOREIGN KEY ("suggested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_suggestions" ADD CONSTRAINT "business_suggestions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_suggestions" ADD CONSTRAINT "business_suggestions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_suggestions" ADD CONSTRAINT "business_suggestions_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_suggestions" ADD CONSTRAINT "business_suggestions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_sub_category_id_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_governorate_id_governorates_id_fk" FOREIGN KEY ("governorate_id") REFERENCES "public"."governorates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_governorate_id_governorates_id_fk" FOREIGN KEY ("governorate_id") REFERENCES "public"."governorates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "areas_city_name_unique" ON "areas" USING btree ("city_id","name");--> statement-breakpoint
CREATE INDEX "areas_city_idx" ON "areas" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "business_events_business_idx" ON "business_events" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_events_user_idx" ON "business_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "business_events_type_idx" ON "business_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "business_events_created_idx" ON "business_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "business_hours_business_day_unique" ON "business_hours" USING btree ("business_id","day_of_week");--> statement-breakpoint
CREATE INDEX "business_hours_business_idx" ON "business_hours" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_images_business_idx" ON "business_images" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_images_sort_idx" ON "business_images" USING btree ("business_id","sort_order");--> statement-breakpoint
CREATE INDEX "business_services_business_idx" ON "business_services" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "business_suggestions_status_idx" ON "business_suggestions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "business_suggestions_city_idx" ON "business_suggestions" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "business_suggestions_user_idx" ON "business_suggestions" USING btree ("suggested_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "businesses_slug_unique" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "businesses_owner_idx" ON "businesses" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "businesses_category_idx" ON "businesses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "businesses_subcategory_idx" ON "businesses" USING btree ("sub_category_id");--> statement-breakpoint
CREATE INDEX "businesses_governorate_idx" ON "businesses" USING btree ("governorate_id");--> statement-breakpoint
CREATE INDEX "businesses_city_idx" ON "businesses" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "businesses_area_idx" ON "businesses" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "businesses_status_idx" ON "businesses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "businesses_spatial_idx" ON "businesses" USING gist ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_sort_idx" ON "categories" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_governorate_name_unique" ON "cities" USING btree ("governorate_id","name");--> statement-breakpoint
CREATE INDEX "cities_governorate_idx" ON "cities" USING btree ("governorate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_business_unique" ON "favorites" USING btree ("user_id","business_id");--> statement-breakpoint
CREATE INDEX "favorites_user_idx" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "favorites_business_idx" ON "favorites" USING btree ("business_id");--> statement-breakpoint
CREATE UNIQUE INDEX "governorates_name_unique" ON "governorates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "offers_business_idx" ON "offers" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "offers_dates_idx" ON "offers" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "reports_business_idx" ON "reports" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "reports_user_idx" ON "reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_business_idx" ON "reviews" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "sub_categories_category_slug_unique" ON "sub_categories" USING btree ("category_id","slug");--> statement-breakpoint
CREATE INDEX "sub_categories_category_idx" ON "sub_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");