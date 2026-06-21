import { Router } from "express";
import { accounts } from "../mock/data";

const router = Router();

router.get("/accounts", (req, res) => {
  res.json(accounts);
});

router.get("/accounts/:accountId", (req, res) => {
  const account = accounts.find((a) => a.id === req.params["accountId"]);
  if (!account) {
    res.status(404).json({ error: "Account not found" });
    return;
  }
  res.json(account);
});

export default router;
