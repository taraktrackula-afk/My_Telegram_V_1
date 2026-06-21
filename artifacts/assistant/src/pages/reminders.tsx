import { useListReminders, useCreateReminder, useDeleteReminder, getListRemindersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function Reminders() {
  const { data: reminders = [] } = useListReminders();
  
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          Scheduled Protocols
        </h1>
      </div>
      
      <div className="grid gap-4">
        {reminders.map(reminder => (
          <Card key={reminder.id} className="p-4 bg-card/50">
            <h3 className="font-semibold">{reminder.title}</h3>
            <p className="text-sm text-muted-foreground">{new Date(reminder.scheduledAt).toLocaleString()}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
