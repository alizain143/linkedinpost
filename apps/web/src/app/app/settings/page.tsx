import { Suspense } from "react";
import { Settings } from "@/components/sections/app/settings";

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <Settings />
    </Suspense>
  );
}
