"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, ChevronDown, LocateFixed, MapPin } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { setAmapSecurityConfig } from "@/lib/amap";
import { getCurrentLocation } from "@/lib/useLocation";
import { useSettingsStore } from "@/store/settings";
import { useNavigationStore } from "@/store/navigation";

export type RouteMode = "walking" | "transit" | "driving";

type StepLine = { text: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AMapNS = any;

export function MapScreen({ onBack }: { onBack: () => void }) {
  const mapSearchQuery = useNavigationStore((s) => s.mapSearchQuery);
  const clearMapQuery = useNavigationStore((s) => s.clearMapQuery);
  const amapKey = useSettingsStore((s) => s.amapKey);
  const amapSecurity = useSettingsStore((s) => s.amapSecurityCode);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<AMapNS>(null);
  const userLngLat = useRef<{ lng: number; lat: number } | null>(null);
  const userAddress = useRef<string>("");
  const useCurrentAsStart = useRef(false);

  const [ready, setReady] = useState(false);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("请输入目的地址");
  const [hint, setHint] = useState("");
  const [routeMode, setRouteMode] = useState<RouteMode>("transit");
  const [steps, setSteps] = useState<StepLine[]>([]);
  const [summary, setSummary] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const locateAndFill = useCallback(async (AMap: AMapNS, map: AMapNS) => {
    const loc = await getCurrentLocation(AMap);
    userLngLat.current = { lng: loc.lng, lat: loc.lat };
    userAddress.current = loc.address;
    useCurrentAsStart.current = true;
    setStartInput(loc.address);
    new AMap.Marker({ position: [loc.lng, loc.lat], map });
    map.setCenter([loc.lng, loc.lat]);
  }, []);

  useEffect(() => {
    if (mapSearchQuery) {
      setEndInput(mapSearchQuery);
      clearMapQuery();
    }
  }, [mapSearchQuery, clearMapQuery]);

  useEffect(() => {
    const key = amapKey || process.env.NEXT_PUBLIC_AMAP_KEY || "";
    const sec = amapSecurity || process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE || "";
    if (!key) {
      setHint("请在高德开放平台申请 Key，并在设置或环境变量中配置。");
      return;
    }
    setAmapSecurityConfig(sec);

    let cancelled = false;
    (async () => {
      try {
        const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
        const AMap = (await AMapLoader.load({
          key,
          version: "2.0",
          plugins: [
            "AMap.Geolocation",
            "AMap.Geocoder",
            "AMap.Walking",
            "AMap.Driving",
            "AMap.Transfer",
          ],
        })) as AMapNS;

        if (cancelled || !mapRef.current) return;
        const map = new AMap.Map(mapRef.current, { zoom: 13, viewMode: "2D" });
        mapInstance.current = map;
        setReady(true);
        await locateAndFill(AMap, map);
      } catch (e) {
        console.error(e);
        setHint(String((e as Error).message ?? "地图加载失败，请检查 Key 与安全密钥。"));
      }
    })();

    return () => {
      cancelled = true;
      mapInstance.current = null;
    };
  }, [amapKey, amapSecurity, locateAndFill]);

  const handleRelocate = useCallback(async () => {
    const key = amapKey || process.env.NEXT_PUBLIC_AMAP_KEY || "";
    const sec = amapSecurity || process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE || "";
    if (!key || !mapInstance.current) {
      setHint("地图未就绪，请稍后重试");
      return;
    }
    setAmapSecurityConfig(sec);
    try {
      const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
      const AMap = (await AMapLoader.load({
        key,
        version: "2.0",
        plugins: ["AMap.Geolocation", "AMap.Geocoder"],
      })) as AMapNS;
      await locateAndFill(AMap, mapInstance.current);
    } catch (e) {
      console.error(e);
      setHint(String((e as Error).message ?? "定位失败，请手动输入起点"));
    }
  }, [amapKey, amapSecurity, locateAndFill]);

  const runRoute = useCallback(async () => {
    const key = amapKey || process.env.NEXT_PUBLIC_AMAP_KEY || "";
    const sec = amapSecurity || process.env.NEXT_PUBLIC_AMAP_SECURITY_CODE || "";
    if (!key) {
      setHint("缺少高德 Key");
      return;
    }
    setAmapSecurityConfig(sec);
    setLoading(true);
    setSteps([]);
    setSummary("");
    setHint("");

    try {
      const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
      const AMap = (await AMapLoader.load({
        key,
        version: "2.0",
        plugins: ["AMap.Geocoder", "AMap.Walking", "AMap.Driving", "AMap.Transfer"],
      })) as AMapNS;

      const map = mapInstance.current as AMapNS;
      const geocoder = new AMap.Geocoder();

      const geocode = (addr: string) =>
        new Promise<{ lng: number; lat: number; city?: string }>((resolve, reject) => {
          geocoder.getLocation(addr, (status: string, result: AMapNS) => {
            if (status === "complete" && result?.geocodes?.length) {
              const loc = result.geocodes[0].location;
              const city = result.geocodes[0].addressComponent?.city;
              resolve({ lng: loc.lng, lat: loc.lat, city });
            } else reject(new Error(`无法解析地址: ${addr}`));
          });
        });

      let origin: AMapNS;
      if (userLngLat.current && useCurrentAsStart.current) {
        origin = new AMap.LngLat(userLngLat.current.lng, userLngLat.current.lat);
      } else {
        const s = await geocode(startInput || "北京市政府");
        origin = new AMap.LngLat(s.lng, s.lat);
      }

      const endAddr = endInput.includes("请输入") ? "北京站" : endInput;
      const end = await geocode(endAddr);
      const dest = new AMap.LngLat(end.lng, end.lat);
      const city = end.city || "北京";

      const lines: StepLine[] = [];
      let sum = "";

      if (routeMode === "walking") {
        await new Promise<void>((resolve, reject) => {
          AMap.plugin("AMap.Walking", () => {
            const walking = new AMap.Walking({ map, hideMarkers: false });
            walking.search(origin, dest, (status: string, result: AMapNS) => {
              if (status !== "complete" || !result?.routes?.length) {
                reject(new Error("步行路径无结果"));
                return;
              }
              const route = result.routes[0];
              sum = `步行约 ${Math.round(route.distance ?? 0)} 米`;
              for (const s of route.steps ?? []) {
                if (s.instruction) lines.push({ text: s.instruction });
              }
              resolve();
            });
          });
        });
      } else if (routeMode === "driving") {
        await new Promise<void>((resolve, reject) => {
          AMap.plugin("AMap.Driving", () => {
            const driving = new AMap.Driving({ map, hideMarkers: false });
            driving.search(origin, dest, (status: string, result: AMapNS) => {
              if (status !== "complete" || !result?.routes?.length) {
                reject(new Error("驾车路径无结果"));
                return;
              }
              const route = result.routes[0];
              sum = `驾车约 ${(route.distance / 1000).toFixed(1)} km`;
              for (const s of route.steps ?? []) {
                if (s.instruction) lines.push({ text: s.instruction });
              }
              resolve();
            });
          });
        });
      } else {
        await new Promise<void>((resolve, reject) => {
          AMap.plugin("AMap.Transfer", () => {
            const transfer = new AMap.Transfer({
              city,
              policy: AMap.TransferPolicy?.LEAST_TIME ?? 0,
              nightflag: false,
              map,
            });
            transfer.search(origin, dest, (status: string, result: AMapNS) => {
              if (status !== "complete" || !result?.plans?.length) {
                reject(new Error("公交路径无结果"));
                return;
              }
              const plan = result.plans[0];
              sum = plan.instruction || "公共交通方案";
              const segs = plan.segments ?? [];
              for (const seg of segs) {
                if (seg.instruction) lines.push({ text: seg.instruction });
                else if (seg.transit_mode === "WALK")
                  lines.push({ text: `步行 ${seg.distance ?? ""} 米` });
                else if (seg.transit?.lines?.[0]?.name)
                  lines.push({ text: `乘坐 ${seg.transit.lines[0].name}` });
              }
              resolve();
            });
          });
        });
      }

      setSummary(sum);
      setSteps(lines.filter((x) => x.text));
      setDrawerOpen(true);
    } catch (e) {
      console.error(e);
      setHint(String((e as Error).message ?? e));
    } finally {
      setLoading(false);
    }
  }, [startInput, endInput, routeMode, amapKey, amapSecurity]);

  const swap = () => {
    const prevStart = startInput;
    const prevEnd = endInput;
    const currentAddr = userAddress.current;
    setStartInput(prevEnd);
    setEndInput(prevStart);
    useCurrentAsStart.current = !!currentAddr && prevEnd === currentAddr;
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#dfe3ea]">
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 120 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80 || info.velocity.y > 500) onBack();
        }}
        className="relative z-20 shrink-0 px-3 pt-3"
      >
        <div className="mb-2 flex flex-col items-center gap-1">
          <ChevronDown className="h-5 w-5 text-slate-500" />
          <span className="text-xs text-slate-500">下滑返回首页</span>
        </div>
        <div className="rounded-[28px] border border-white/60 bg-white/45 p-3 shadow-lg backdrop-blur-xl">
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <label className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-sm">
                <span className="text-slate-400">🔍</span>
                <input
                  value={startInput}
                  onChange={(e) => {
                    useCurrentAsStart.current = false;
                    setStartInput(e.target.value);
                  }}
                  placeholder="请输入我的位置"
                  className="min-w-0 flex-1 bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
                />
              </label>
              <label className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-teal-500" />
                <input
                  value={endInput}
                  onChange={(e) => setEndInput(e.target.value)}
                  placeholder="请输入目的地址"
                  className="min-w-0 flex-1 bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={swap}
              className="rounded-2xl bg-white/80 px-2 py-2 shadow-inner"
              aria-label="交换起点终点"
            >
              <ArrowDownUp className="h-5 w-5 text-slate-600" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            {(["walking", "transit", "driving"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRouteMode(m)}
                className={cn(
                  "flex-1 rounded-full py-2 text-xs font-medium",
                  routeMode === m
                    ? "bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-md"
                    : "bg-white/70 text-slate-600"
                )}
              >
                {m === "walking" ? "步行" : m === "transit" ? "公交" : "驾车"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void runRoute()}
            disabled={loading}
            className="mt-3 w-full rounded-full bg-slate-800 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "规划中…" : "开始路径规划"}
          </button>
          {hint ? <p className="mt-2 text-center text-xs text-amber-700">{hint}</p> : null}
        </div>
      </motion.div>

      <div ref={mapRef} className="relative min-h-0 flex-1 rounded-t-[32px] bg-slate-200 shadow-inner">
        {!ready && (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">地图加载中…</div>
        )}
        <button
          type="button"
          onClick={() => void handleRelocate()}
          className="absolute bottom-24 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg"
          aria-label="定位"
        >
          <LocateFixed className="h-5 w-5 text-teal-600" />
        </button>
      </div>

      <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/20" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[55%] max-w-[450px] flex-col rounded-t-[28px] border border-white/50 bg-white/90 px-4 pb-6 pt-2 backdrop-blur-xl">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
            <Drawer.Title className="sr-only">路径详情</Drawer.Title>
            <p className="mb-2 text-center text-sm font-medium text-slate-800">{summary}</p>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white/80 p-3 text-sm text-slate-700">
              <ol className="list-decimal space-y-2 pl-4">
                {steps.map((s, i) => (
                  <li key={i}>{s.text}</li>
                ))}
              </ol>
              {!steps.length && <p className="text-slate-400">暂无步骤，请重试或更换出行方式。</p>}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
