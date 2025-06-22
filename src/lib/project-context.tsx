import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Task {
  id: string;
  name: string;
  completed: boolean;
  status: 'pending' | 'in-progress' | 'done';
  details?: string; // Add details field to store timeline/location info
  source?: 'chatbot' | 'manual'; // Track the source of the details
}

interface Phase {
  id: string;
  name: string;
  icon: string;
  tasks: Task[];
  isOpen: boolean;
}

interface ProjectContextType {
  phases: Phase[];
  updateTask: (phaseId: string, taskId: string, updates: Partial<Task>) => void;
  togglePhase: (phaseId: string) => void;
  toggleTask: (phaseId: string, taskId: string) => void;
  addTaskDetails: (phaseId: string, taskId: string, details: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [phases, setPhases] = useState<Phase[]>([
    {
      id: '1',
      name: 'Phase 1: Planning',
      icon: '📂',
      isOpen: true,
      tasks: [
        { id: '1-1', name: 'Timeline', completed: false, status: 'pending' },
        { id: '1-2', name: 'Theme', completed: false, status: 'pending' },
        { id: '1-3', name: 'Location', completed: false, status: 'pending' },
        { id: '1-4', name: 'Size', completed: false, status: 'pending' },
      ]
    },
    {
      id: '2',
      name: 'Phase 2: Preparation',
      icon: '📂',
      isOpen: false,
      tasks: [
        { id: '2-1', name: 'Make website', completed: false, status: 'pending' },
        { id: '2-2', name: 'Make marketing posts and images', completed: false, status: 'pending' },
        { id: '2-3', name: 'Make sponsorship package', completed: false, status: 'pending' },
        { id: '2-4', name: 'Make Devpost', completed: false, status: 'pending' },
      ]
    },
    {
      id: '3',
      name: 'Phase 3: Execution',
      icon: '📂',
      isOpen: false,
      tasks: [
        { id: '3-1', name: 'Make Discord channels', completed: false, status: 'pending' },
        { id: '3-2', name: 'Automatically send sponsors the emails', completed: false, status: 'pending' },
        { id: '3-3', name: 'Email people to mentor + volunteer', completed: false, status: 'pending' },
      ]
    }
  ]);

  const updateTask = (phaseId: string, taskId: string, updates: Partial<Task>) => {
    setPhases(prev => prev.map(phase =>
      phase.id === phaseId
        ? {
            ...phase,
            tasks: phase.tasks.map(task =>
              task.id === taskId
                ? { ...task, ...updates }
                : task
            )
          }
        : phase
    ));
  };

  const togglePhase = (phaseId: string) => {
    setPhases(prev => prev.map(phase =>
      phase.id === phaseId
        ? { ...phase, isOpen: !phase.isOpen }
        : phase
    ));
  };

  const toggleTask = (phaseId: string, taskId: string) => {
    setPhases(prev => prev.map(phase =>
      phase.id === phaseId
        ? {
            ...phase,
            tasks: phase.tasks.map(task =>
              task.id === taskId
                ? {
                    ...task,
                    completed: !task.completed,
                    status: !task.completed ? 'done' : 'pending'
                  }
                : task
            )
          }
        : phase
    ));
  };

  const addTaskDetails = (phaseId: string, taskId: string, details: string) => {
    updateTask(phaseId, taskId, { 
      details, 
      completed: true, 
      status: 'done',
      source: 'chatbot'
    });
  };

  const value: ProjectContextType = {
    phases,
    updateTask,
    togglePhase,
    toggleTask,
    addTaskDetails,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}; 