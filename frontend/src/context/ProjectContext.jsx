import { createContext, useState, useEffect, useCallback } from 'react';
import { listProjectsApi } from '../api/project.api';
import useAuth from '../hooks/useAuth';

export const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await listProjectsApi({ status: 'active', limit: 50 });
      setProjects(data.data.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    } else {
      setProjects([]);
    }
  }, [isAuthenticated, fetchProjects]);

  const value = {
    projects,
    loading,
    fetchProjects,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
