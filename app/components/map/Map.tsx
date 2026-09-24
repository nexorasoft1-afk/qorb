"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Map as MapLibre,
  Marker,
  NavigationControl,
  Popup,
  setWorkerUrl,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import LocationButton from "@/app/components/map/LocationButton";
import {
  createMapMarkerElement,
  createUserLocationElement,
} from "@/app/components/map/MapMarker";

export interface MapBusiness {
  id: number;
  name: string;
  latitude: string | number | null;
  longitude: string | number | null;
  category_name?: string | null;
  city_name?: string | null;
  rating?: string | number | null;
  distance_meters?: string | number | null;
  is_verified?: boolean;
}

interface MapProps {
  businesses?: MapBusiness[];
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
  onBusinessClick?: (
    business: MapBusiness
  ) => void;
}

const MAP_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";

export default function Map({
  businesses = [],
  initialCenter = [
    34.3299,
    27.9158,
  ],
  initialZoom = 8,
  className = "",
  onBusinessClick,
}: MapProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const mapRef =
    useRef<MapLibre | null>(null);

  const markersRef =
    useRef<Marker[]>([]);

  const userMarkerRef =
    useRef<Marker | null>(null);

  const [locationLoading, setLocationLoading] =
    useState(false);

  useEffect(() => {
    setWorkerUrl(
      "/maplibre/maplibre-gl-worker.mjs"
    );

    if (
      !containerRef.current ||
      mapRef.current
    ) {
      return;
    }

   const map = new MapLibre({
  container: containerRef.current,
  style: MAP_STYLE,
  center: initialCenter,
  zoom: initialZoom,
});

    map.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      "top-left"
    );

    mapRef.current = map;

    return () => {
      markersRef.current.forEach(
        (marker) => marker.remove()
      );

      markersRef.current = [];

      userMarkerRef.current?.remove();
      userMarkerRef.current = null;

      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    markersRef.current.forEach(
      (marker) => marker.remove()
    );

    markersRef.current = [];

    const validBusinesses =
      businesses.filter(
        (business) =>
          business.latitude !== null &&
          business.longitude !== null
      );

    if (!validBusinesses.length) {
      return;
    }

    const bounds =
      validBusinesses.reduce(
        (acc, business) => {
          const lng = Number(
            business.longitude
          );

          const lat = Number(
            business.latitude
          );

          if (
            Number.isFinite(lng) &&
            Number.isFinite(lat)
          ) {
            acc.minLng = Math.min(
              acc.minLng,
              lng
            );
            acc.maxLng = Math.max(
              acc.maxLng,
              lng
            );
            acc.minLat = Math.min(
              acc.minLat,
              lat
            );
            acc.maxLat = Math.max(
              acc.maxLat,
              lat
            );
          }

          return acc;
        },
        {
          minLng: Infinity,
          maxLng: -Infinity,
          minLat: Infinity,
          maxLat: -Infinity,
        }
      );

    validBusinesses.forEach(
      (business) => {
        const lng = Number(
          business.longitude
        );

        const lat = Number(
          business.latitude
        );

        if (
          !Number.isFinite(lng) ||
          !Number.isFinite(lat)
        ) {
          return;
        }

        const markerElement =
          createMapMarkerElement(
            Boolean(
              business.is_verified
            )
          );

        const marker = new Marker({
          element: markerElement,
          anchor: "bottom",
        })
          .setLngLat([lng, lat])
          .addTo(map);

        markerElement.addEventListener(
          "click",
          () => {
            const rating =
              Number(
                business.rating ?? 0
              );

            const distance =
              Number(
                business.distance_meters ??
                  0
              );

            const popupHtml = `
              <div dir="rtl" style="min-width:180px;padding:4px">
                <div style="font-weight:800;font-size:15px;color:#0f172a">
                  ${escapeHtml(
                    business.name
                  )}
                </div>

                ${
                  business.category_name
                    ? `
                      <div style="margin-top:5px;color:#64748b;font-size:12px">
                        ${escapeHtml(
                          business.category_name
                        )}
                      </div>
                    `
                    : ""
                }

                <div style="display:flex;gap:10px;margin-top:8px;font-size:12px">
                  <span style="color:#b45309">
                    ⭐ ${rating.toFixed(1)}
                  </span>

                  ${
                    distance > 0
                      ? `
                        <span style="color:#64748b">
                          ${formatDistance(
                            distance
                          )}
                        </span>
                      `
                      : ""
                  }
                </div>
              </div>
            `;

            new Popup({
              closeButton: true,
              closeOnClick: true,
              offset: 28,
            })
              .setLngLat([
                lng,
                lat,
              ])
              .setHTML(popupHtml)
              .addTo(map);

            onBusinessClick?.(
              business
            );
          }
        );

        markersRef.current.push(
          marker
        );
      }
    );

    if (
      Number.isFinite(bounds.minLng) &&
      Number.isFinite(bounds.maxLng) &&
      Number.isFinite(bounds.minLat) &&
      Number.isFinite(bounds.maxLat)
    ) {
      if (
        bounds.minLng === bounds.maxLng &&
        bounds.minLat === bounds.maxLat
      ) {
        map.flyTo({
          center: [
            bounds.minLng,
            bounds.minLat,
          ],
          zoom: 15,
          duration: 700,
        });
      } else {
        map.fitBounds(
          [
            [
              bounds.minLng,
              bounds.minLat,
            ],
            [
              bounds.maxLng,
              bounds.maxLat,
            ],
          ],
          {
            padding: 70,
            duration: 700,
            maxZoom: 15,
          }
        );
      }
    }
  }, [businesses, onBusinessClick]);

  function locateUser() {
    if (!navigator.geolocation) {
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        const map = mapRef.current;

        if (!map) {
          setLocationLoading(false);
          return;
        }

        userMarkerRef.current?.remove();

        const markerElement =
          createUserLocationElement();

        userMarkerRef.current =
          new Marker({
            element: markerElement,
            anchor: "center",
          })
            .setLngLat([lng, lat])
            .addTo(map);

        map.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 800,
        });

        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 ${className}`}
    >
      <div
        ref={containerRef}
        className="h-full min-h-[500px] w-full"
      />

      <LocationButton
        loading={locationLoading}
        onClick={locateUser}
      />
    </div>
  );
}

function formatDistance(
  meters: number
) {
  if (meters < 1000) {
    return `${Math.round(
      meters
    )} م`;
  }

  return `${(
    meters / 1000
  ).toFixed(1)} كم`;
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );
}