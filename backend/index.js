import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

// routers
import { errorHandler } from "./middlewares/error.middleware.js";
import uploadsRouter from "./routes/uploads.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.get("/", (req, res) => {
  return res.send("API is working....");
});

app.use("/api/v1/uploads", uploadsRouter);

app.use(errorHandler);

const startServer = async () => {
  app.listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}...`);
  });
};

startServer();
