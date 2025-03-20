export interface Task {
  id: number;
  createdAt: number; // day when the task was created
  startedExecutionAt?: number; // day when the task started execution
  executedAt?: number; // day when the task was executed
  workDays: number
}

export interface SourceState {
  taskGenerationRate: number;
  tasksGenerated: number;
  workDays: number;
}

export interface ExecutorState {
  currentTask: Task | null;
  startedExecutionAt: number | null;
  daysUtilized: number;
}

export interface SimulationState {
  day: number;
  nextTaskId: number;
  sources: SourceState[];
  buffer: {
    historySum: number;
    max: number;
    tasks: Task[]
  };
  executors: ExecutorState[];
  done: {
    total: number;
    daysSum: number;
    tasks: Task[]
  };
}
