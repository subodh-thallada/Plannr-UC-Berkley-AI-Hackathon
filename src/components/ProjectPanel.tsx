
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Settings } from "lucide-react";

interface Task {
  id: string;
  name: string;
  completed: boolean;
  status: 'pending' | 'in-progress' | 'done';
}

interface Phase {
  id: string;
  name: string;
  icon: string;
  tasks: Task[];
  isOpen: boolean;
}

export const ProjectPanel = () => {
  const [phases, setPhases] = useState<Phase[]>([
    {
      id: '1',
      name: 'Phase 1: Planning',
      icon: '📂',
      isOpen: true,
      tasks: [
        { id: '1-1', name: 'Set Timeline', completed: true, status: 'done' },
        { id: '1-2', name: 'Theme', completed: false, status: 'pending' },
        { id: '1-3', name: 'Location', completed: false, status: 'in-progress' },
        { id: '1-4', name: 'Size of event', completed: false, status: 'pending' },
      ]
    },
    {
      id: '2',
      name: 'Phase 2: Preparation',
      icon: '📂',
      isOpen: false,
      tasks: [
        { id: '2-1', name: 'Make Website for event', completed: false, status: 'pending' },
        { id: '2-2', name: 'Marketing posts for website', completed: false, status: 'pending' },
        { id: '2-3', name: 'Sponsorship Package', completed: false, status: 'pending' },
      ]
    },
    {
      id: '3',
      name: 'Phase 3: Execution',
      icon: '📂',
      isOpen: false,
      tasks: [
        { id: '3-1', name: 'Enable check-in system', completed: false, status: 'pending' },
        { id: '3-2', name: 'Create Discord channels', completed: false, status: 'pending' },
        { id: '3-3', name: 'Start Devpost submission form', completed: false, status: 'pending' },
      ]
    }
  ]);

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

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'done':
        return 'Done';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return 'Pending';
    }
  };

  const getPhaseProgress = (phase: Phase) => {
    const completedTasks = phase.tasks.filter(task => task.completed).length;
    return { completed: completedTasks, total: phase.tasks.length };
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 bg-white/70 backdrop-blur-sm border-b border-blue-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Management</h1>
        <p className="text-gray-600">Manage your project phases and tasks with AI assistance</p>
      </div>

      {/* Project Phases */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {phases.map((phase) => {
            const progress = getPhaseProgress(phase);
            return (
              <Card key={phase.id} className="bg-white/60 backdrop-blur-sm border border-blue-100 shadow-sm">
                <Collapsible open={phase.isOpen} onOpenChange={() => togglePhase(phase.id)}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-4 hover:bg-blue-50/50 transition-colors rounded-t-lg">
                      <div className="flex items-center space-x-3">
                        {phase.isOpen ? (
                          <ChevronDown className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-blue-600" />
                        )}
                        <span className="text-lg">{phase.icon}</span>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                          <p className="text-sm text-gray-500">
                            {progress.completed}/{progress.total} tasks completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 border-t border-blue-100">
                      <div className="space-y-3 mt-4">
                        {phase.tasks.map((task) => (
                          <div 
                            key={task.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                              task.completed 
                                ? 'bg-green-50/50 border-green-200' 
                                : 'bg-white/80 border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => toggleTask(phase.id, task.id)}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <span 
                                className={`font-medium ${
                                  task.completed 
                                    ? 'text-gray-500 line-through' 
                                    : 'text-gray-900'
                                }`}
                              >
                                {task.name}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getStatusColor(task.status)}`}
                              >
                                {getStatusLabel(task.status)}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <Settings className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
