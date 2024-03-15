import express from "express";
import { chat, detect } from "../controllers/chat.controller";

const llmRouter = express.Router();

llmRouter.route("/").post(chat);
llmRouter.route("/").get(detect);

export default llmRouter;
