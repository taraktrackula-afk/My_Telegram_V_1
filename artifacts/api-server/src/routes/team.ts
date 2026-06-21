import { Router } from "express";
import { teamMembers, makeId } from "../mock/data";
import {
  CreateTeamMemberBody,
  UpdateTeamMemberBody,
  AddAppraisalBody,
  AddRecognitionBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/team/members", (_req, res) => {
  res.json(teamMembers);
});

router.post("/team/members", (req, res) => {
  const parsed = CreateTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { fullName, department, position, joiningDate, supervisor, notes } = parsed.data;
  const employeeNum = teamMembers.length + 1;
  const now = new Date().toISOString();
  const member = {
    id: makeId(),
    employeeId: `EMP${String(employeeNum).padStart(3, "0")}`,
    fullName,
    department,
    position,
    joiningDate,
    supervisor,
    status: "active" as const,
    notes,
    appraisals: [],
    recognitions: [],
    createdAt: now,
    updatedAt: now,
  };
  teamMembers.push(member);
  res.status(201).json(member);
});

router.get("/team/members/:memberId", (req, res) => {
  const member = teamMembers.find((m) => m.id === req.params["memberId"]);
  if (!member) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }
  res.json(member);
});

router.patch("/team/members/:memberId", (req, res) => {
  const member = teamMembers.find((m) => m.id === req.params["memberId"]);
  if (!member) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }

  const parsed = UpdateTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  Object.assign(member, parsed.data, { updatedAt: new Date().toISOString() });
  res.json(member);
});

router.post("/team/members/:memberId/appraisals", (req, res) => {
  const member = teamMembers.find((m) => m.id === req.params["memberId"]);
  if (!member) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }

  const parsed = AddAppraisalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const appraisal = { id: makeId(), ...parsed.data };
  member.appraisals.push(appraisal);
  member.updatedAt = new Date().toISOString();
  res.status(201).json(member);
});

router.post("/team/members/:memberId/recognitions", (req, res) => {
  const member = teamMembers.find((m) => m.id === req.params["memberId"]);
  if (!member) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }

  const parsed = AddRecognitionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const recognition = { id: makeId(), ...parsed.data };
  member.recognitions.push(recognition);
  member.updatedAt = new Date().toISOString();
  res.status(201).json(member);
});

export default router;
