import { Router } from "express";
import { reminders, makeId } from "../mock/data";
import { CreateReminderBody, UpdateReminderBody } from "@workspace/api-zod";

const router = Router();

router.get("/reminders", (_req, res) => {
  res.json(reminders);
});

router.post("/reminders", (req, res) => {
  const parsed = CreateReminderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { title, description, scheduledAt, isRecurring, recurrence } = parsed.data;
  const reminder = {
    id: makeId(),
    title,
    description,
    scheduledAt,
    isRecurring: isRecurring ?? false,
    recurrence,
    status: "pending" as const,
    createdAt: new Date().toISOString(),
  };
  reminders.push(reminder);
  res.status(201).json(reminder);
});

router.patch("/reminders/:reminderId", (req, res) => {
  const reminder = reminders.find((r) => r.id === req.params["reminderId"]);
  if (!reminder) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }

  const parsed = UpdateReminderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  Object.assign(reminder, parsed.data);
  res.json(reminder);
});

router.delete("/reminders/:reminderId", (req, res) => {
  const idx = reminders.findIndex((r) => r.id === req.params["reminderId"]);
  if (idx === -1) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  reminders.splice(idx, 1);
  res.status(204).send();
});

export default router;
