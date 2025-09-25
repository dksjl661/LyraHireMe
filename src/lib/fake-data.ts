import { faker } from "@faker-js/faker";

export interface FakeRecord {
  id: string;
  name: string;
  email: string;
  status: string;
  priority: string;
  progress: number;
  assignee: string;
  dueDate: string;
  category: string;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
}

const statusOptions = [
  "Not Started",
  "In Progress",
  "Review",
  "Done",
  "Blocked",
];
const priorityOptions = ["Low", "Medium", "High", "Urgent"];
const categoryOptions = ["Bug", "Feature", "Task", "Epic", "Story"];

export function generateFakeRecord(id?: string): FakeRecord {
  return {
    id: id ?? faker.string.uuid(),
    name: faker.lorem.words(3),
    email: faker.internet.email(),
    status: faker.helpers.arrayElement(statusOptions),
    priority: faker.helpers.arrayElement(priorityOptions),
    progress: faker.number.int({ min: 0, max: 100 }),
    assignee: faker.person.fullName(),
    dueDate: faker.date.future().toISOString().split("T")[0] ?? "",
    category: faker.helpers.arrayElement(categoryOptions),
    description: faker.lorem.sentence(),
    isCompleted: faker.datatype.boolean(),
    createdAt: faker.date.past(),
  };
}

export function generateFakeData(count: number): FakeRecord[] {
  return Array.from({ length: count }, () => generateFakeRecord());
}

export const FIELD_DEFINITIONS = [
  { id: "name", name: "Name", type: "text" as const },
  { id: "email", name: "Email", type: "email" as const },
  {
    id: "status",
    name: "Status",
    type: "singleSelect" as const,
    options: statusOptions,
  },
  {
    id: "priority",
    name: "Priority",
    type: "singleSelect" as const,
    options: priorityOptions,
  },
  { id: "progress", name: "Progress", type: "number" as const },
  { id: "assignee", name: "Assignee", type: "text" as const },
  { id: "dueDate", name: "Due Date", type: "date" as const },
  {
    id: "category",
    name: "Category",
    type: "singleSelect" as const,
    options: categoryOptions,
  },
  { id: "description", name: "Description", type: "longText" as const },
  { id: "isCompleted", name: "Completed", type: "checkbox" as const },
] as const;
