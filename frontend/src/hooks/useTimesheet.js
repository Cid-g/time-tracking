import { useContext } from 'react';
import { TimesheetContext } from '../context/TimesheetContext';

const useTimesheet = () => {
  const context = useContext(TimesheetContext);
  if (!context) {
    throw new Error('useTimesheet must be used within a TimesheetProvider');
  }
  return context;
};

export default useTimesheet;
