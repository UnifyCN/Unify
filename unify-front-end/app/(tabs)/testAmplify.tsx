import type { Schema } from '../../amplify/data/resource'
import { generateClient } from 'aws-amplify/data'

const client = generateClient<Schema>()

export default function TodoList() {
//   const createTodo = async () => {
//     await client.models.Todo.create({
//       content: window.prompt("Todo content?"),
//     })
//   }

  return;
}