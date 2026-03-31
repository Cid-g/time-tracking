import { useContext } from 'react';
import { TeamContext } from '../context/TeamContext';

const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export default useTeam;
