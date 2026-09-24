ALTER TABLE "businesses" DROP CONSTRAINT "businesses_latitude_check";--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_longitude_check";--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_sub_category_id_sub_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_governorate_id_governorates_id_fk";
--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_city_id_cities_id_fk";
--> statement-breakpoint
ALTER TABLE "businesses" DROP CONSTRAINT "businesses_area_id_areas_id_fk";
--> statement-breakpoint
DROP INDEX "businesses_slug_unique";--> statement-breakpoint
DROP INDEX "businesses_spatial_idx";--> statement-breakpoint
ALTER TABLE "businesses" ALTER COLUMN "website" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_sub_category_id_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_governorate_id_governorates_id_fk" FOREIGN KEY ("governorate_id") REFERENCES "public"."governorates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "businesses_slug_idx" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "businesses_location_idx" ON "businesses" USING gist ("location");--> statement-breakpoint
ALTER TABLE "businesses" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_slug_unique" UNIQUE("slug");