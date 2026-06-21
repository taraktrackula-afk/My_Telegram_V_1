import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { data: settings } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleToggle = (key: "ragEnabled" | "notificationsEnabled" | "autoSaveToSheets" | "autoSaveToDrive", value: boolean) => {
    if (!settings) return;
    updateSettings.mutate({
      data: { [key]: value }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        toast({ title: "Configuration Updated" });
      }
    });
  };

  if (!settings) return null;

  return (
    <div className="flex flex-col h-full gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          System Configuration
        </h1>
      </div>
      
      <Card className="p-6 bg-card/50 border-border/50 grid gap-8">
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Core Features</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Retrieval Augmented Generation (RAG)</Label>
              <p className="text-sm text-muted-foreground">Allow AI to access indexed documents and memories.</p>
            </div>
            <Switch checked={settings.ragEnabled} onCheckedChange={(v) => handleToggle('ragEnabled', v)} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">System Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive alerts for task deadlines and reminders.</p>
            </div>
            <Switch checked={settings.notificationsEnabled} onCheckedChange={(v) => handleToggle('notificationsEnabled', v)} />
          </div>
        </div>

        <div className="grid gap-4">
          <h3 className="text-lg font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">Integrations</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-Sync to Google Sheets</Label>
              <p className="text-sm text-muted-foreground">Automatically backup tasks and records to Sheets.</p>
            </div>
            <Switch checked={settings.autoSaveToSheets} onCheckedChange={(v) => handleToggle('autoSaveToSheets', v)} />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Auto-Sync to Google Drive</Label>
              <p className="text-sm text-muted-foreground">Store generated documents and reports in Drive.</p>
            </div>
            <Switch checked={settings.autoSaveToDrive} onCheckedChange={(v) => handleToggle('autoSaveToDrive', v)} />
          </div>
        </div>
      </Card>
    </div>
  );
}
