import dynamic from "next/dynamic";

const AppShell = dynamic(
  () => import("@/components/AppShell").then((mod) => mod.AppShell),
  { ssr: false, loading: () => null }
);

export default function Home() {
  return <AppShell />;
}
