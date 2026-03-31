import { useContext } from 'react';
import { ReportsContext } from '../context/ReportsContext';

const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};

export default useReports;
