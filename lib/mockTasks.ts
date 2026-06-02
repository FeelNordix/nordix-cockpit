export type Task = {
  id: string;
  title: string;
  type: string;
  customerName: string;
  dueDate: string;
  status: "Open" | "Vandaag" | "Wacht op reactie";
};

export const mockTasks: Task[] = [
  {
    id: "task-001",
    title: "Offerte Noorwegen nalopen",
    type: "Offerte opvolgen",
    customerName: "Maaike de Vries",
    dueDate: "Vandaag",
    status: "Vandaag"
  },
  {
    id: "task-002",
    title: "Reisdocumenten IJsland versturen",
    type: "Reisdocumenten versturen",
    customerName: "Thomas Bakker",
    dueDate: "Morgen",
    status: "Open"
  },
  {
    id: "task-003",
    title: "Aanbetaling controleren",
    type: "Betaling checken",
    customerName: "Sanne Meijer",
    dueDate: "Vandaag",
    status: "Vandaag"
  },
  {
    id: "task-004",
    title: "Ervaring Lapland-reis opvolgen",
    type: "Na-reis opvolging",
    customerName: "Familie Jansen",
    dueDate: "Vrijdag",
    status: "Wacht op reactie"
  },
  {
    id: "task-005",
    title: "Tweede offerteversie mailen",
    type: "Offerte opvolgen",
    customerName: "Niels Smit",
    dueDate: "Volgende week",
    status: "Open"
  }
];
