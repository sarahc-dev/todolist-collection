import Todo from "./todoModel";

describe("Todo model", () => {
    it("has a title", () => {
        const todo = new Todo({
            title: "Get milk"
        })
        expect(todo.title).toEqual("Get milk")
    })
})