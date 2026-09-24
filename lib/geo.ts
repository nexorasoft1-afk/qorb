import { sql } from "drizzle-orm";
import { businesses } from "@/app/db/schema";

export function pointFromCoordinates(
  latitude: number,
  longitude: number
) {
  return sql`
    extensions.ST_SetSRID(
      extensions.ST_MakePoint(
        ${longitude},
        ${latitude}
      ),
      4326
    )
  `;
}

export function distanceInMeters(
  latitude: number,
  longitude: number
) {
  return sql<number>`
    extensions.ST_Distance(
      ${businesses.location}::geography,
      extensions.ST_SetSRID(
        extensions.ST_MakePoint(
          ${longitude},
          ${latitude}
        ),
        4326
      )::geography
    )
  `;
}

export function withinRadius(
  latitude: number,
  longitude: number,
  radiusMeters: number
) {
  return sql`
    extensions.ST_DWithin(
      ${businesses.location}::geography,
      extensions.ST_SetSRID(
        extensions.ST_MakePoint(
          ${longitude},
          ${latitude}
        ),
        4326
      )::geography,
      ${radiusMeters}
    )
  `;
}