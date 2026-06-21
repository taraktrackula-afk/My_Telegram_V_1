import { Router } from "express";
import { tasks, makeId } from "../mock/data";
import { ListTasksQueryParams, CreateTaskBody, UpdateTaskBody } from "@workspace/api-zod";

const router = Router();

router.get("/tasks", (req, res) => {
  const parsed = ListTasksQueryParams.safeParse(req.query);
  const { status } = parsed.success ? parsed.data : { status: undefined };

  let result = tasks;
  if (status) {
    result = result.filter((t) => t.status === status);
  }
  res.json(result);
});

router.post("/tasks", (req, res) => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { title, description, priority, dueDate, tags } = parsed.data;
  const now = new Date().toISOString();
  const task = {
    id: makeId(),
    title,
    description,
    status: "pending" as const,
    priority,
    dueDate,
    createdAt: now,
    updatedAt: now,
    tags: tags ?? [],
  };
  tasks.push(task);
  res.status(201).json(task);
});

router.patch("/tasks/:taskId", (req, res) => {
  const task = tasks.find((t) => t.id === req.params["taskId"]);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const updates = parsed.data;
  Object.assign(task, updates, { updatedAt: new Date().toISOString() });
  res.json(task);
});

router.delete("/tasks/:taskId", (req, res) => {
  const idx = tasks.findIndex((t) => t.id === req.params["taskId"]);
  if (idx === -1) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  tasks.splice(idx, 1);
  res.status(204).send();
});

export default router;
