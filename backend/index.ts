import cors from "cors";
import "dotenv/config";
import express, { Express, Request, Response } from "express";
import chatRouter from "./src/routes/chat.route";
import os from "os"; // Importing os module directly

const app: Express = express();
const port = parseInt(process.env.PORT || "8000");

const env = process.env["NODE_ENV"];
const isDevelopment = !env || env === "development";
const devCors = `./certificate.crt`;

app.use(express.json());

const prodCorsOrigin = process.env.PROD_CORS_ORIGIN || 'http://localhost:3000';

if (isDevelopment) {
  console.warn("Running in development mode - allowing CORS for all origins");
  app.use(cors());
} else {
  console.log(`Running in production mode - allowing CORS for domain: ${prodCorsOrigin}`);
  const corsOptions = {
    origin: prodCorsOrigin, // Set the correct origin value here
  };
  app.use(cors(corsOptions));
}

app.use(express.text());

app.get("/", (req: Request, res: Response) => {
  res.send("LlamaIndex Express Server");
});

app.use("/api/chat", chatRouter);
app.use("/api/detect", chatRouter);
app.listen(port, '119.111.241.192', () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = networkInterfaces.enp2s0 || networkInterfaces.eth0 || networkInterfaces.wlan0; // Adjust this to match your network interface

  let ipAddress;
  if (addresses && addresses.length > 0) {
    ipAddress = addresses[0].address;
  } else {
    ipAddress = "Unknown";
  }

  console.log(`⚡️[server]: Server is running at http://${ipAddress}:${port}`);
});

