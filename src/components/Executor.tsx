import React from 'react';
import { Task } from './types';

interface ExecutorProps {
  currentTask: Task | null;
  startedExecutionAt: number | null;
  utilization: number;
  currentDay: number;
}

const Executor: React.FC<ExecutorProps> = ({ currentTask, startedExecutionAt, utilization, currentDay }) => {
  return (
    <div className="simulation-block executor-block">
      <h2>Executor</h2>
      <div className="block-content">
        <p>Utilization: {(utilization * 100).toFixed(2)}%</p>
        {currentTask ? (
          <div className="current-task">
            <h3>Currently Executing:</h3>
            <div className="task-info">
              <p className="task-id">Task #{currentTask.id}</p>
              <p className="task-created">Age: {currentDay - currentTask.createdAt} days</p>
              <p className="task-started">Started: Day {startedExecutionAt}</p>
            </div>
            <p className="execution-info">Execution time: {currentTask.workDays} day</p>
          </div>
        ) : (
          <p className="empty-message">No task currently executing</p>
        )}
      </div>
    </div>
  );
};

export default Executor;
