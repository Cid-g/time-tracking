import { useContext } from 'react';
import { TimeTrackingContext } from '../context/TimeTrackingContext';

const useTimeTracking = () => {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error('useTimeTracking must be used within TimeTrackingProvider');
  }
  return context;
};

export default useTimeTracking;
