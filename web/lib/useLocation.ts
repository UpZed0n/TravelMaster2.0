"use client";

import { Capacitor } from "@capacitor/core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AMapNS = any;

export type LocationResult = {
  lng: number;
  lat: number;
  address: string;
};

async function reverseGeocode(AMap: AMapNS, lng: number, lat: number): Promise<string> {
  return new Promise((resolve) => {
    const geocoder = new AMap.Geocoder();
    geocoder.getAddress([lng, lat], (status: string, result: AMapNS) => {
      if (status === "complete") {
        const addr =
          result?.regeocode?.formattedAddress ||
          result?.regeocode?.addressComponent?.township ||
          result?.info ||
          `${lng.toFixed(4)}, ${lat.toFixed(4)}`;
        resolve(addr);
      } else {
        resolve(`${lng.toFixed(4)}, ${lat.toFixed(4)}`);
      }
    });
  });
}

async function locateByAmapWeb(AMap: AMapNS): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    const geo = new AMap.Geolocation({ enableHighAccuracy: true, timeout: 12000 });
    geo.getCurrentPosition(async (status: string, result: AMapNS) => {
      if (status !== "complete" || !result?.position) {
        reject(new Error("定位失败，请检查定位权限或网络后重试"));
        return;
      }
      const { lng, lat } = result.position;
      const address = result.formattedAddress || (await reverseGeocode(AMap, lng, lat));
      resolve({ lng, lat, address });
    });
  });
}

async function locateByNative(AMap: AMapNS): Promise<LocationResult> {
  const { Geolocation } = await import("@capacitor/geolocation");

  const current = await Geolocation.checkPermissions();
  if (current.location === "denied") {
    throw new Error("定位失败，请检查定位权限或网络后重试");
  }
  if (current.location === "prompt") {
    const requested = await Geolocation.requestPermissions();
    if (requested.location === "denied") {
      throw new Error("定位失败，请检查定位权限或网络后重试");
    }
  }

  const pos = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 15000,
  });
  const lng = pos.coords.longitude;
  const lat = pos.coords.latitude;
  const address = await reverseGeocode(AMap, lng, lat);
  return { lng, lat, address };
}

export async function getCurrentLocation(AMap: AMapNS): Promise<LocationResult> {
  if (Capacitor.isNativePlatform()) {
    return locateByNative(AMap);
  }
  return locateByAmapWeb(AMap);
}
