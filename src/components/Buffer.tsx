import React from 'react';
import { Task } from './types';

interface BufferProps {
  tasks: Task[];
  currentDay: number
  avg: number;
  max: number;
}

const Buffer: React.FC<BufferProps> = ({ tasks, avg, max, currentDay }) => {
  return (
    <div className="simulation-block buffer-block">
      <h2>Buffer</h2>
      <div className="block-content">
          <p>Avg size: {avg}</p>
          <p>Max size: {max}</p>
        <p>Tasks in buffer: {tasks.length}</p>
        <div className="task-list">
          {tasks.length === 0 ? (
            <p className="empty-message">No tasks in buffer</p>
          ) : (
            <ul>
              {tasks.slice(-20).map((task) => (
                <li key={task.id} className="task-item">
                  <div className="task-info">
                    <span className="task-id">Task #{task.id}</span>
                    <span className="task-created">Age: {currentDay - task.createdAt}d</span>
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

export default Buffer;