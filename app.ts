import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/userRouter";
import documentRouter from "./routes/documentRouter";
import noticationRouter from "./routes/notificationRouter";
import masterHealthRouter from "./routes/masterHealthRouter";
import chatBotRouter from "./routes/chatBotRouter"
import blogRouter from "./routes/blogsRouter"
import "./controllers/cronJob";

dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());

app.use("/v1/user", userRouter);
app.use("/v1/docs", documentRouter);
app.use("/v1/notification", noticationRouter);
app.use("/v1/master-health", masterHealthRouter);
app.use("/v1/chatBot", chatBotRouter)
app.use("/v1/blogs", blogRouter)


export default app;

// artillery run performance.yml
