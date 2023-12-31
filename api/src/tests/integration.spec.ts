import request from "supertest";
import app from "../index";
import databaseConnection from "../dbConnection";
import Todo from "../models/todoModel";
import { Connection } from "mongoose";

let db: Connection;
beforeAll(() => {
    db = databaseConnection();
});

afterEach(async () => {
    await Todo.deleteMany({});
});

afterAll(async () => {
    await Todo.collection.drop();
    await db.close();
});

describe("Todolist API", () => {
    it("GET /todos returns an array of all todos", async () => {
        await new Todo({ title: "Feed cat" }).save();
        const response = await request(app).get("/api/todos").expect("Content-Type", /json/).expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty("_id");
        expect(response.body[0].title).toBe("Feed cat");
        expect(response.body[0].completed).toBe(false);
    });

    it("GET /todos returns an empty array when there are no todos", async () => {
        const response = await request(app).get("/api/todos").expect("Content-Type", /json/).expect(200);

        expect(response.body).toHaveLength(0);
    });

    it("GET /todos returns a 500 status error if cannot get todos", async () => {
        const findSpy = jest.spyOn(Todo, "find");
        findSpy.mockImplementation(() => {
            throw new Error("Simulated error");
        });

        const response = await request(app).get("/api/todos").expect("Content-Type", /json/).expect(500);

        expect(response.body).toEqual({ error: "Internal server error" });

        findSpy.mockRestore();
    });

    it("POST /todos adds a new todo", async () => {
        const newTodo = { title: "Make a cake" };
        const response = await request(app).post("/api/todos").send(newTodo).expect(201);

        expect(response.body).toHaveProperty("_id");
        expect(response.body.title).toBe("Make a cake");
        expect(response.body.completed).toBe(false);
    });

    it("POST /todos returns a 400 status error if no todo", async () => {
        const newTodo = { title: "" };

        const response = await request(app).post("/api/todos").send(newTodo).expect(400);

        expect(response.body).toEqual({ error: "Invalid todo" });
    });

    it("POST /todos returns a 500 status error if cannot add todo", async () => {
        console.log(Todo.prototype);
        const saveSpy = jest.spyOn(Todo.prototype, "save");
        saveSpy.mockImplementation(() => {
            throw new Error("Simulated error");
        });

        const response = await request(app).post("/api/todos").send({ title: "do something" });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: "Internal server error" });
        saveSpy.mockRestore();
    });

    it("PATCH /todos/id updates completed status to true", async () => {
        const todo = await new Todo({ title: "Walk cat" }).save();

        const response = await request(app).patch(`/api/todos/${todo._id}`).send({ completed: true }).expect(200);

        expect(response.body._id.toString()).toEqual(todo._id.toString());
        expect(response.body.title).toBe("Walk cat");
        expect(response.body.completed).toBe(true);
    });

    it("PATCH /todos/id updates contents of todo", async () => {
        const todo = await new Todo({ title: "Walk cat" }).save();

        const response = await request(app).patch(`/api/todos/${todo._id}`).send({ title: "Walk dog" }).expect(200);

        expect(response.body._id.toString()).toEqual(todo._id.toString());
        expect(response.body.title).toBe("Walk dog");
        expect(response.body.completed).toBe(false);
    });

    it("PATCH /todos/id returns 404 status if no id", async () => {
        await request(app).patch("/api/todos/").send({ title: "Walk dog" }).expect(404);
    });

    it("PATCH /todos/id returns 400 status if no value to update", async () => {
        const todo = await new Todo({ title: "Walk cat" }).save();

        const response = await request(app).patch(`/api/todos/${todo._id}`).send().expect(400);
        expect(response.body).toEqual({ error: "Invalid request" });
    });

    it("PATCH /todos/id returns 500 status error if it cannot update todo", async () => {
        const response = await request(app).patch("/api/todos/123").send({ title: "Walk dog" }).expect(500);
        expect(response.body).toEqual({ error: "Internal server error" });
    });

    it("PATCH /todos/id returns 400 status if invalid id", async () => {
        const response = await request(app).patch("/api/todos/64fb1a0f41995f2690f6cf8a").send({ completed: true }).expect(400);
        expect(response.body).toEqual({ error: "Invalid Id" });
    });

    it("DELETE /todos/id deletes todo", async () => {
        await new Todo({ title: "Feed dog" }).save();
        const todoToDelete = await new Todo({ title: "Walk cat" }).save();

        await request(app).delete(`/api/todos/${todoToDelete._id}`).expect(200);

        const todos = await Todo.find({});
        expect(todos).toHaveLength(1);
        expect(todos).not.toContain(expect.objectContaining({ _id: todoToDelete._id }));
    });

    it("DELETE /todos/id returns 400 status if invalid id", async () => {
        const response = await request(app).delete("/api/todos/64fb1a0f41995f2690f6cf8a").expect(400);
        expect(response.body).toEqual({ error: "Invalid Id" });
    });

    it("DELETE /todos/id returns 500 status if bad request", async () => {
        const response = await request(app).delete("/api/todos/123").expect(500);
        expect(response.body).toEqual({ error: "Internal server error" });
    });

    it("returns 404 error if incorrect path", async () => {
        await request(app).get("/").expect(404);
    });
});

describe("Test route", () => {
    it("POST /test/deleteAll deletes all todos", async () => {
        await new Todo({ title: "Feed dog" }).save();

        await request(app).post("/api/test/deleteAll").expect(200);

        const todos = await Todo.find({});
        expect(todos).toHaveLength(0);
    });

    it("POST /test/deleteAll returns a 500 status error if cannot delete todos", async () => {
        const deleteSpy = jest.spyOn(Todo, "deleteMany");
        deleteSpy.mockImplementation(() => {
            throw new Error("Simulated error");
        });

        const response = await request(app).post("/api/test/deleteAll").expect("Content-Type", /json/).expect(500);

        expect(response.body).toEqual({ error: "Internal server error" });

        deleteSpy.mockRestore();
    });
});
