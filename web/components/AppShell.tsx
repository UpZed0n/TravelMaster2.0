"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MobileContainer } from "@/components/MobileContainer";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { MapScreen } from "@/components/screens/MapScreen";
import { StrategyScreen } from "@/components/screens/StrategyScreen";
import { DiaryScreen } from "@/components/screens/DiaryScreen";
import { useNavigationStore } from "@/store/navigation";

const spring = { type: "spring" as const, stiffness: 320, damping: 34 };

export function AppShell() {
  const layer = useNavigationStore((s) => s.layer);
  const setLayer = useNavigationStore((s) => s.setLayer);
  const homeEnterFromTop = useNavigationStore((s) => s.homeEnterFromTop);
  const clearHomeEnterFlag = useNavigationStore((s) => s.clearHomeEnterFlag);

  return (
    <MobileContainer>
      <AnimatePresence mode="wait">
        {layer === "home" && (
          <motion.div
            key="home"
            initial={homeEnterFromTop ? { y: "-100%" } : { y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={spring}
            className="absolute inset-0 flex flex-col"
            onAnimationComplete={() => {
              if (homeEnterFromTop) clearHomeEnterFlag();
            }}
          >
            <HomeScreen
              onOpenMap={() => setLayer("map")}
              onOpenStrategies={() => setLayer("strategies")}
              onOpenDiary={() => setLayer("diary")}
            />
          </motion.div>
        )}

        {layer === "map" && (
          <motion.div
            key="map"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring}
            className="absolute inset-0 z-10 flex flex-col"
          >
            <MapScreen onBack={() => setLayer("home")} />
          </motion.div>
        )}

        {layer === "strategies" && (
          <motion.div
            key="strategies"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring}
            className="absolute inset-0 z-10 flex flex-col"
          >
            <StrategyScreen onBack={() => setLayer("home")} />
          </motion.div>
        )}

        {layer === "diary" && (
          <motion.div
            key="diary"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={spring}
            className="absolute inset-0 z-10 flex flex-col"
          >
            <DiaryScreen onBack={() => setLayer("home")} />
          </motion.div>
        )}
      </AnimatePresence>
    </MobileContainer>
  );
}
