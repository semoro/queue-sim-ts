import React, {ChangeEvent} from 'react';

interface SourceProps {
  tasksGenerated: number;
  day: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: number;
  workDays: number;
  sourceIndex: number;
  onWorkDaysChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

const Source: React.FC<SourceProps> = ({ 
  tasksGenerated, 
  day, 
  value, 
  workDays, 
  sourceIndex, 
  onChange: onChangeO,
  onWorkDaysChange 
}) => {
  return (
    <div className="simulation-block source-block">
      <h2>Source {sourceIndex + 1}</h2>
      <div className="block-content">
          <div>
              <label>
                  Task Generation Rate (per 5 days):
                  <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={value}
                      onChange={onChangeO}
                  />
                  {value.toFixed(1)}
              </label>
          </div>
          {onWorkDaysChange && (
            <div>
                <label>
                    Work Days Required:
                    <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={workDays}
                        onChange={onWorkDaysChange}
                    />
                    {workDays}
                </label>
            </div>
          )}
        <p>Tasks generated: {tasksGenerated}</p>
        <p>Current day: {day}</p>
        <p>Generation rate: {(tasksGenerated / day * 5).toFixed(2)} per 5 days</p>
        <p>Work days required: {workDays}</p>
      </div>
    </div>
  );
};

export default Source;
