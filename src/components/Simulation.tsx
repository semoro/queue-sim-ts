import {useState, useEffect, useCallback} from 'react';
import SourceComponent from './Source';
import BufferComponent from './Buffer';
import ExecutorComponent from './Executor';
import DoneComponent from './Done';
import './Simulation.css';
import {SimulationState, SourceState, Task} from "./types.ts";



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


const Simulation = () => {
  const [isRunning, setIsRunning] = useState(false);
  // Initialize sliderValue to 1000 (max)
  const [sliderValue, setSliderValue] = useState(1000); // linear slider value (1-1000)

  const [state, setSimState] = useState<SimulationState>({
    day: 0,
    nextTaskId: 1,
    sources: [],
    buffer: {
      historySum: 0,
      max: 0,
      tasks: []
    },
    executors: [],
    done: {
      total: 0,
      daysSum: 0,
      tasks: []
    },
  });

  // Calculate initial logarithmic speed: 10^(sliderValue/1000 * 3)
  const [speed, setSpeed] = useState(Math.round(Math.pow(10, (1000 / 1000) * 3))); // milliseconds between days
  const [steps, setSteps] = useState(1); // milliseconds between days

  // Process a day in the simulation
  const processDay = useCallback((days: number) => {
    setSimState((prevState) => {
      const newState = { ...prevState }

      for (let i = 0; i < days; i++) {

        // Increment day
        newState.day += 1;


        for (const s of newState.sources) {
          // Generate new tasks
          const newTasks = generateTasks(newState, s);
          for (let i = 0; i < newTasks.length; i++) {
            newState.nextTaskId += 1;
            s.tasksGenerated += 1;
          }

          if (newTasks.length > 0) {
            newState.buffer.tasks.push(...newTasks);
          }
        }


        // Process all executors
        for (let executorIndex = 0; executorIndex < newState.executors.length; executorIndex++) {
          const executor = newState.executors[executorIndex];

          // Process current task if the executor has one
          if (executor.currentTask) {
            executor.daysUtilized += 1;
            // Check if the task has been in execution for the required number of work days
            const taskStartDay = executor.startedExecutionAt || newState.day;
            const daysInExecution = newState.day - taskStartDay;

            if (daysInExecution >= executor.currentTask.workDays) {
              // Task is complete, move to done
              const completedTask = {
                ...executor.currentTask,
                executedAt: newState.day,
              };
              newState.done.tasks.push(completedTask);
              newState.done.total++;
              newState.done.daysSum += completedTask.executedAt - completedTask.createdAt;
              if (newState.done.tasks.length > 10) {
                newState.done.tasks = newState.done.tasks.slice(-20);
              }
              executor.currentTask = null;
              executor.startedExecutionAt = null;
            }
          }
        }

        // Assign tasks to free executors
        for (let executorIndex = 0; executorIndex < newState.executors.length; executorIndex++) {
          const executor = newState.executors[executorIndex];

          // If executor is free and there are tasks in buffer, take the next one
          if (!executor.currentTask && newState.buffer.tasks.length > 0) {
            const nextTask = newState.buffer.tasks.shift()!;
            executor.currentTask = nextTask;
            executor.startedExecutionAt = newState.day;
            // Remove the task from the buffer
          }
        }


        // snapshot buffer size
        newState.buffer.historySum += newState.buffer.tasks.length;
        newState.buffer.max = Math.max(newState.buffer.max, newState.buffer.tasks.length);
      }
      return newState
    });
  }, [setSimState])

  // Run simulation automatically
  useEffect(() => {
    let interval: number | null = null;

    if (isRunning) {
      interval = setInterval(processDay, speed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, speed, processDay]);

  // UI controls
  const toggleRunning = () => setIsRunning(!isRunning);
  const stepForward = () => !isRunning && processDay(steps);
  const handleReset = () => {
    // Stop the simulation if it's running
    if (isRunning) {
      setIsRunning(false);
    }
    // Reset the simulation while keeping parameters
    setSimState({
      day: 0,
      nextTaskId: 1,
      sources: [],
      buffer: {
        historySum: 0,
        max: 0,
        tasks: []
      },
      executors: [],
      done: {
        total: 0,
        daysSum: 0,
        tasks: []
      },
    })
  };
  const changeSpeed = (e: React.ChangeEvent<HTMLInputElement>) => {
    const linearValue = Number(e.target.value);
    setSliderValue(linearValue);

    // Calculate logarithmic speed: 10^(sliderValue/1000 * 3)
    // This maps sliderValue 1-1000 to speed 1-1000 on a logarithmic scale
    const logSpeed = Math.round(Math.pow(10, (linearValue / 1000) * 3));
    setSpeed(logSpeed);
  };

  // Handle task generation rate slider change
  const changeTaskGenerationRate = (sourceIndex: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = Number(e.target.value);
    setSimState(prevState => {
      const newState = { ...prevState }
      newState.sources[sourceIndex].taskGenerationRate = rate;
      return newState;
    })
  };

  // Handle work days slider change
  const changeWorkDays = (sourceIndex: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const workDays = Number(e.target.value);
    setSimState(prevState => {
      const newState = { ...prevState }
      newState.sources[sourceIndex].workDays = workDays;
      return newState;
    })
  };

  const addSource = () => {
    setSimState(prevState => {
      const newState = { ...prevState }
      newState.sources.push({
        tasksGenerated: 0,
        taskGenerationRate: 1,
        workDays: 1
      });
      return newState;
    })
  }

  const removeSource = (index: number) => {
    setSimState(prevState => {
      const newState = { ...prevState }
      newState.sources.splice(index, 1);
      return newState;
    })
  }

  const addExecutor = () => {
    setSimState(prevState => {
      const newState = {...prevState}
      newState.executors.push({
        currentTask: null,
        startedExecutionAt: null,
        daysUtilized: 0
      });
      return newState;
    });
  }

  const removeExecutor = (index: number) => {
    setSimState(prevState => {
      const newState = {...prevState}
      newState.executors.splice(index, 1);
      return newState;
    })
  }

  return (
    <div className="simulation">
      <div className="simulation-controls">
        <div className="control-panel">
          <div className="controls-row">
            <div className="control-buttons">
              <button 
                className="control-button play-pause" 
                onClick={toggleRunning} 
                title={isRunning ? "Pause Simulation" : "Start Simulation"}
              >
                {isRunning ? "⏸" : "▶"}
              </button>
              <button 
                className="control-button step" 
                onClick={stepForward} 
                disabled={isRunning}
                title="Step Forward"
              >
                ⏯
              </button>
              <button 
                className="control-button reset" 
                onClick={handleReset}
                title="Reset Simulation"
              >
                ⟳
              </button>
            </div>

            <div className="control-sliders">
              <div className="slider-container">
                <label htmlFor="speed-slider">Delay:</label>
                <input
                  id="speed-slider"
                  className="slider"
                  type="range"
                  min="1"
                  max="1000"
                  step="-1"
                  value={sliderValue}
                  onChange={changeSpeed}
                />
                <span className="slider-value">{speed}ms</span>
              </div>

              <div className="slider-container">
                <label htmlFor="steps-slider">Days per step:</label>
                <input
                  id="steps-slider"
                  className="slider"
                  type="range"
                  min="1"
                  max="1000"
                  step="1"
                  value={steps}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSteps(Number(e.target.value));
                  }}
                />
                <span className="slider-value">{steps}</span>
              </div>
            </div>

            <div className="day-counter">Day: {state.day}</div>
          </div>
        </div>
      </div>

      <div className="simulation-grid">
        <div className="sources-container">
          <div className="sources-controls">
            <button onClick={() => addSource()}>Add Source</button>
          </div>
          {state.sources.map((source, index) => (
            <div key={index} className="source-wrapper">
              <SourceComponent 
                tasksGenerated={source.tasksGenerated}
                value={source.taskGenerationRate}
                onChange={changeTaskGenerationRate(index)}
                day={state.day}
                workDays={source.workDays}
                sourceIndex={index}
                onWorkDaysChange={changeWorkDays(index)}
              />
              {state.sources.length > 1 && (
                <button 
                  className="remove-source-button"
                  onClick={() => removeSource(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <BufferComponent 
          tasks={state.buffer.tasks}
          max={state.buffer.max}
          avg={state.buffer.historySum / state.day}
          currentDay={state.day}
        />
        <div className="executors-container">
          <div className="executors-controls">
            <button onClick={() => addExecutor()}>Add Executor</button>
          </div>
          {state.executors.map((executor, index) => (
            <div key={index} className="executor-wrapper">
              <ExecutorComponent 
                currentTask={executor.currentTask}
                startedExecutionAt={executor.startedExecutionAt}
                utilization={executor.daysUtilized / state.day}
                currentDay={state.day}
              />
              {state.executors.length > 1 && (
                <button 
                  className="remove-executor-button"
                  onClick={() => removeExecutor(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <DoneComponent 
          tasks={state.done.tasks}
          total={state.done.total}
          avgLatency={state.done.daysSum / state.done.total}
        />
      </div>
    </div>
  );
};

export default Simulation;
