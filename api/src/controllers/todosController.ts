import { Request, Response } from "express";
import Todo from "../models/todoModel";

const todosController = {
    getAllTodos: async (req: Request, res: Response) => {
        try {
            const todos = await Todo.find({});
            res.status(200).json(todos);
        } catch (error) {
            // console.error("Error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    addTodo: async (req: Request, res: Response) => {
        try {
            const newTodo = await new Todo(req.body).save();
            res.status(201).json(newTodo);
        } catch (error) {
            // console.error("Error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    editTodo: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const newValue = req.body;

            if ((!newValue.title && !newValue.completed) || newValue.title === "") {
                res.status(400).json({ error: "Invalid request" });
                return;
            }

            const editedTodo = await Todo.findByIdAndUpdate(id, newValue, { new: true });

            res.status(200).json(editedTodo);
        } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    },
};

export default todosController;