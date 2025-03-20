import React from 'react';
import { Task } from './types';

interface DoneProps {
  tasks: Task[];
  total: number;
  avgLatency: number;
}

const Done: React.FC<DoneProps> = ({ tasks, total, avgLatency }) => {
  return (
    <div className="simulation-block done-block">
      <h2>Done</h2>
      <div className="block-content">
        <p>Completed tasks: {total}</p>
        <p>Avg latency: {avgLatency.toFixed(2)} days</p>
        <div className="task-list">
          {tasks.length === 0 ? (
            <p className="empty-message">No completed tasks</p>
          ) : (
            <ul>
              {tasks.map((task) => (
                <li key={task.id} className="task-item">
                  <div className="task-info">
                    <span className="task-id">Task #{task.id}</span>
                    <span className="task-created">Created: Day {task.createdAt}</span>
                    <span className="task-executed">Executed: After {task.executedAt! - task.createdAt}d</span>
                    <span className="task-value">Complexity: {task.workDays}d</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Done;
