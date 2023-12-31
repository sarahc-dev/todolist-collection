import express from "express";
import cors from "cors";
import todosRouter from "./routes/todosRouter";
import testingRouter from "./routes/testingRouter";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/todos", todosRouter);

if (process.env.NODE_ENV === "test") {
    app.use("/api/test", testingRouter);
}

export default app;
