import { Router, type IRouter } from "express";
import healthRouter from "./health";
import veilcourtRouter from "./veilcourt";

const router: IRouter = Router();

router.use(healthRouter);
router.use(veilcourtRouter);

export default router;
