import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/menu";

export default async function SettingsPage() {
  return <SettingsForm initial={await getSettings()} />;
}
