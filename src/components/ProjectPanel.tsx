import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Settings, Info } from "lucide-react";
import { useProject } from "@/lib/project-context";

export const ProjectPanel = () => {
  const [viewFilter, setViewFilter] = useState<'home' | '1' | '2' | '3'>('home');
  const { phases, togglePhase, toggleTask } = useProject();

  const getStatusColor = (status: 'pending' | 'in-progress' | 'done') => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: 'pending' | 'in-progress' | 'done') => {
    switch (status) {
      case 'done':
        return 'Done';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const getPhaseProgress = (phase: any) => {
    const completedTasks = phase.tasks.filter((task: any) => task.completed).length;
    return { completed: completedTasks, total: phase.tasks.length };
  };

  const filteredPhases = viewFilter === 'home'
    ? phases
    : phases.filter(p => p.id === viewFilter);

  return (
    <div className="h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <div className="flex items-center gap-2 p-4 border-b border-blue-100 bg-white/70 backdrop-blur-sm">
        <Button
          variant={viewFilter === 'home' ? 'default' : 'outline'}
          onClick={() => setViewFilter('home')}
        >
          Home
        </Button>
        <Button
          variant={viewFilter === '1' ? 'default' : 'outline'}
          onClick={() => setViewFilter('1')}
        >
          Phase 1: Planning
        </Button>
        <Button
          variant={viewFilter === '2' ? 'default' : 'outline'}
          onClick={() => setViewFilter('2')}
        >
          Phase 2: Preparation
        </Button>
        <Button
          variant={viewFilter === '3' ? 'default' : 'outline'}
          onClick={() => setViewFilter('3')}
        >
          Phase 3: Execution
        </Button>
      </div>

      {/* Header */}
      <div className="p-6 bg-white/70 backdrop-blur-sm border-b border-blue-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Management</h1>
        <p className="text-gray-600">Manage your project phases and tasks with AI assistance</p>
      </div>

      {/* Project Phases */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {filteredPhases.map((phase) => {
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
                            <div className="flex items-center space-x-3 flex-1">
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => toggleTask(phase.id, task.id)}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <div className="flex-1">
                                <span
                                  className={`font-medium ${
                                    task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                                  }`}
                                >
                                  {task.name}
                                </span>
                                {task.details && (
                                  <div className="mt-1 flex items-center space-x-1">
                                    <Info className="w-3 h-3 text-blue-600" />
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                      {task.details}
                                    </span>
                                  </div>
                                )}
                              </div>
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
