import { useContext } from 'react';
import { ClientContext } from '../context/ClientContext';

const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

export default useClient;
