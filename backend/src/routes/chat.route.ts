import express from "express";
import { chat, detect, uploadFile, generate } from "../controllers/chat.controller";

const llmRouter = express.Router();

llmRouter.route("/api/chat").post(chat);
llmRouter.route("/api/updateGenerate").get(generate);
llmRouter.route("/api/detect").get(detect);
llmRouter.route("/api/file/upload").post(uploadFile);
export default llmRouter;
