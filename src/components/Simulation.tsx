import { useState, useEffect, useCallback } from 'react';
import SourceComponent from './Source';
import BufferComponent from './Buffer';
import ExecutorComponent from './Executor';
import DoneComponent from './Done';
import './Simulation.css';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  processDay, 
  setTaskGenerationRate, 
  setWorkDays, 
  resetSimulation, 
  addSource, 
  removeSource, 
  addExecutor, 
  removeExecutor
} from '../store/simulationSlice';

const Simulation = () => {
  const state = useAppSelector(state => state.simulation);
  const dispatch = useAppDispatch();

  const [isRunning, setIsRunning] = useState(false);
  // Initialize sliderValue to 1000 (max)
  const [sliderValue, setSliderValue] = useState(1000); // linear slider value (1-1000)

  // Calculate initial logarithmic speed: 10^(sliderValue/1000 * 3)
  const [speed, setSpeed] = useState(Math.round(Math.pow(10, (1000 / 1000) * 3))); // milliseconds between days
  const [steps, setSteps] = useState(1); // milliseconds between days

  // Process a day in the simulation
  const handleProcessDay = useCallback(() => {
    dispatch(processDay(steps));
  }, [dispatch, steps]);

  // Run simulation automatically
  useEffect(() => {
    let interval: number | null = null;

    if (isRunning) {
      interval = setInterval(handleProcessDay, speed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, speed, handleProcessDay]);

  // UI controls
  const toggleRunning = () => setIsRunning(!isRunning);
  const stepForward = () => !isRunning && handleProcessDay();
  const handleReset = () => {
    // Stop the simulation if it's running
    if (isRunning) {
      setIsRunning(false);
    }
    // Reset the simulation while keeping parameters
    dispatch(resetSimulation());
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
    dispatch(setTaskGenerationRate({ source: sourceIndex, rate }));
  };

  // Handle work days slider change
  const changeWorkDays = (sourceIndex: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const workDays = Number(e.target.value);
    dispatch(setWorkDays({ source: sourceIndex, workDays }));
  };

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
            <button onClick={() => dispatch(addSource())}>Add Source</button>
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
                  onClick={() => dispatch(removeSource(index))}
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
            <button onClick={() => dispatch(addExecutor())}>Add Executor</button>
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
                  onClick={() => dispatch(removeExecutor(index))}
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
