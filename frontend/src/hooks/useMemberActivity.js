import { useContext } from 'react';
import { MemberActivityContext } from '../context/MemberActivityContext';

const useMemberActivity = () => {
  const context = useContext(MemberActivityContext);
  if (!context) {
    throw new Error('useMemberActivity must be used within a MemberActivityProvider');
  }
  return context;
};

export default useMemberActivity;
