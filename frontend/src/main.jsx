import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TimeTrackingProvider } from './context/TimeTrackingContext';
import { ProjectProvider } from './context/ProjectContext';
import { TimesheetProvider } from './context/TimesheetContext';
import { TeamProvider } from './context/TeamContext';
import { AdminProvider } from './context/AdminContext';
import { ReportsProvider } from './context/ReportsContext';
import { ClientProvider } from './context/ClientContext';
import { MemberActivityProvider } from './context/MemberActivityContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TimeTrackingProvider>
          <ProjectProvider>
            <TimesheetProvider>
              <TeamProvider>
                <AdminProvider>
                  <ReportsProvider>
                    <ClientProvider>
                      <MemberActivityProvider>
                        <App />
                      </MemberActivityProvider>
                    </ClientProvider>
                  </ReportsProvider>
                </AdminProvider>
              </TeamProvider>
            </TimesheetProvider>
          </ProjectProvider>
        </TimeTrackingProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
