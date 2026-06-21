import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accountsRouter from "./accounts";
import chatsRouter from "./chats";
import memoryRouter from "./memory";
import tasksRouter from "./tasks";
import remindersRouter from "./reminders";
import teamRouter from "./team";
import aiRouter from "./ai";
import documentsRouter from "./documents";
import dashboardRouter from "./dashboard";
import settingsRouter from "./settings";
import telegramRouter from "./telegram";
import personalRouter from "./personal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountsRouter);
router.use(chatsRouter);
router.use(memoryRouter);
router.use(tasksRouter);
router.use(remindersRouter);
router.use(teamRouter);
router.use(aiRouter);
router.use(documentsRouter);
router.use(dashboardRouter);
router.use(settingsRouter);
router.use(telegramRouter);
router.use(personalRouter);

export default router;
