import { createSlice } from '@reduxjs/toolkit';
import {SimulationState, SourceState, Task} from '../components/types';

// Task generation rate is now stored in state

// Helper function to generate Poisson distributed random number
const generatePoissonRandom = (lambda: number): number => {
  // Knuth's algorithm for Poisson distribution
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= Math.random();
  } while (p > L);

  return k - 1;
};

// Helper function to generate tasks based on Poisson distribution
const generateTasks = (state: SimulationState, source: SourceState): Task[] => {
  const newTasks: Task[] = [];

  // Generate task count based on Poisson distribution
  // Lambda = taskGenerationRate / 5 (tasks per day)
  const lambda = source.taskGenerationRate / 5;

  // Generate a Poisson distributed random number
  const taskCount = generatePoissonRandom(lambda);

  for (let i = 0; i < taskCount; i++) {
    const newTask: Task = {
      id: state.nextTaskId + i,
      createdAt: state.day,
      workDays: source.workDays,
    };
    newTasks.push(newTask);
  }

  return newTasks;
};


const initialState: SimulationState = {
  day: 0,
  nextTaskId: 1,
  sources: [
      {
        tasksGenerated: 0,
        taskGenerationRate: 2, // Default: 4 tasks per 5 days
        workDays: 1
      },
      {
        tasksGenerated: 0,
        taskGenerationRate: 1, // Default: 4 tasks per 5 days
        workDays: 2
      }
  ],
  buffer: {
    historySum: 0,
    max: 0,
    tasks: []
  },
  executors: [
    {
      currentTask: null,
      startedExecutionAt: null,
      daysUtilized: 0
    }
  ],
  done: {
    total: 0,
    daysSum: 0,
    tasks: []
  },
};

export const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    setTaskGenerationRate: (state, action: {payload: {source: number, rate: number}}) => {
      state.sources[action.payload.source].taskGenerationRate = action.payload.rate;
    },
    setWorkDays: (state, action: {payload: {source: number, workDays: number}}) => {
      state.sources[action.payload.source].workDays = action.payload.workDays;
    },
    addSource: (state) => {
      state.sources.push({
        tasksGenerated: 0,
        taskGenerationRate: 1,
        workDays: 1
      });
    },
    removeSource: (state, action: {payload: number}) => {
      // Don't remove the last source
      if (state.sources.length > 1) {
        state.sources.splice(action.payload, 1);
      }
    },
    addExecutor: (state) => {
      state.executors.push({
        currentTask: null,
        startedExecutionAt: null,
        daysUtilized: 0
      });
    },
    removeExecutor: (state, action: {payload: number}) => {
      // Don't remove the last executor
      if (state.executors.length > 1) {
        state.executors.splice(action.payload, 1);
      }
    },
    resetSimulation: (state) => {
      // Keep the current taskGenerationRate and sources
      const currentSources = state.sources.map(source => ({
        taskGenerationRate: source.taskGenerationRate,
        workDays: source.workDays,
        tasksGenerated: 0
      }));

      // Keep the current number of executors
      const executorCount = state.executors.length;

      // Reset to initial state
      Object.assign(state, initialState);

      // Restore the sources
      state.sources = currentSources;

      // Restore the executors (with reset utilization)
      state.executors = Array(executorCount).fill(0).map(() => ({
        currentTask: null,
        startedExecutionAt: null,
        daysUtilized: 0
      }));
    },
    processDay: (state, action: {payload: number | null}) => {

      for (let i = 0; i < (action.payload ? action.payload : 0); i++) {

        // Increment day
        state.day += 1;


        for (const s of state.sources) {
          // Generate new tasks
          const newTasks = generateTasks(state, s);
          for (let i = 0; i < newTasks.length; i++) {
            state.nextTaskId += 1;
            s.tasksGenerated += 1;
          }

          if (newTasks.length > 0) {
            state.buffer.tasks.push(...newTasks);
          }
        }




        // Process all executors
        for (let executorIndex = 0; executorIndex < state.executors.length; executorIndex++) {
          const executor = state.executors[executorIndex];

          // Process current task if the executor has one
          if (executor.currentTask) {
            executor.daysUtilized += 1;
            // Check if the task has been in execution for the required number of work days
            const taskStartDay = executor.startedExecutionAt || state.day;
            const daysInExecution = state.day - taskStartDay;

            if (daysInExecution >= executor.currentTask.workDays) {
              // Task is complete, move to done
              const completedTask = {
                ...executor.currentTask,
                executedAt: state.day,
              };
              state.done.tasks.push(completedTask);
              state.done.total++;
              state.done.daysSum += completedTask.executedAt - completedTask.createdAt;
              if (state.done.tasks.length > 10) {
                state.done.tasks = state.done.tasks.slice(-20);
              }
              executor.currentTask = null;
              executor.startedExecutionAt = null;
            }
          }
        }

        // Assign tasks to free executors
        for (let executorIndex = 0; executorIndex < state.executors.length; executorIndex++) {
          const executor = state.executors[executorIndex];

          // If executor is free and there are tasks in buffer, take the next one
          if (!executor.currentTask && state.buffer.tasks.length > 0) {
            const nextTask = state.buffer.tasks.shift()!;
            executor.currentTask = nextTask;
            executor.startedExecutionAt = state.day;
            // Remove the task from the buffer
          }
        }


        // snapshot buffer size
        state.buffer.historySum += state.buffer.tasks.length;
        state.buffer.max = Math.max(state.buffer.max, state.buffer.tasks.length);
      }
    },
  },
});

export const {
  processDay,
  setTaskGenerationRate,
  setWorkDays,
  addSource,
  removeSource,
  addExecutor,
  removeExecutor,
  resetSimulation,
} = simulationSlice.actions;

export default simulationSlice.reducer;
