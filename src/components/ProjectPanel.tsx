import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Settings, Info, Edit2, Save, X, Bot, User, Trash2, Phone, Check, Image as LucideImage } from "lucide-react";
import { useProject } from "@/lib/project-context";
import { callVenue, getCurrentCallStatus, endCall, CallStatus, callRestaurant } from "@/lib/vapi-service";
import { saveTaskUpdate, clearPhase1TaskUpdates } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { generateMarketingImages } from "@/lib/gemini";
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export const ProjectPanel = () => {
  const [viewType, setViewType] = useState<string>('timeline');
  const [viewFilter, setViewFilter] = useState<'home' | '1' | '2' | '3' | 'logistics' | 'marketing' | 'website' | 'outreach'>('home');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingColors, setEditingColors] = useState<{ primary: string; secondary: string }>({ primary: '#3B82F6', secondary: '#10B981' });
  const [callStatus, setCallStatus] = useState<CallStatus>({ id: '', status: 'idle' });
  const { phases, togglePhase, toggleTask, updateTask } = useProject();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [generatingWebsite, setGeneratingWebsite] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [marketingImages, setMarketingImages] = useState<{ url: string }[]>([]);

  // Task to category mapping
  const taskCategoryMap: Record<string, 'logistics' | 'marketing' | 'website' | 'outreach'> = {
    // Phase 1
    '1-1': 'logistics', // Timeline
    '1-2': 'logistics', // Theme
    '1-3': 'logistics', // Location
    '1-4': 'logistics', // Size
    '1-5': 'marketing', // Branding
    // Phase 2
    '2-1': 'website',   // Make website
    '2-2': 'marketing', // Make marketing posts and images
    '2-3': 'marketing', // Get sponsors
    '2-4': 'logistics', // Book Venue
    '2-5': 'logistics', // Plan Meals
    // Phase 3
    '3-1': 'website',   // Make Discord channels
    '3-2': 'outreach',  // Automatically send sponsors the emails
    '3-3': 'outreach',  // Email people to mentor + volunteer
  };

  // Group tasks by category
  const categoryTasks: Record<string, any[]> = {
    logistics: [],
    marketing: [],
    website: [],
    outreach: [],
  };
  phases.forEach(phase => {
    phase.tasks.forEach(task => {
      const cat = taskCategoryMap[task.id];
      if (cat) categoryTasks[cat].push({ ...task, phase });
    });
  });

  // Add default subtasks for 'Get sponsors' task
  phases.forEach(phase => {
    phase.tasks.forEach(task => {
      if (task.name === 'Make sponsorship package') {
        task.name = 'Get sponsors';
        if (!task.subtasks) {
          task.subtasks = [
            { id: 'sub-1', name: 'get contacts', completed: false, status: 'pending' },
            { id: 'sub-2', name: 'send emails', completed: false, status: 'pending' },
            { id: 'sub-3', name: 'confirmed/finalized', completed: false, status: 'pending' },
          ];
        }
      }
    });
  });

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

  const getTaskPlaceholder = (taskName: string) => {
    const lowerName = taskName.toLowerCase();
    if (lowerName.includes('timeline')) return "Enter timeline (e.g., March 15-17, 2024)";
    if (lowerName.includes('location')) return "Enter location (e.g., San Francisco Convention Center)";
    if (lowerName.includes('theme')) return "Enter theme (e.g., AI and Sustainability)";
    if (lowerName.includes('size')) return "Enter size (e.g., 500 participants)";
    if (lowerName.includes('branding')) return "Select primary and secondary colors";
    return "Enter details...";
  };

  const handleEditTask = (taskId: string, currentDetails: string, currentColors?: { primary: string; secondary: string }) => {
    setEditingTask(taskId);
    setEditValue(currentDetails || "");
    if (currentColors) {
      setEditingColors(currentColors);
    }
  };

  const handleSaveEdit = (phaseId: string, taskId: string) => {
    const task = phases.flatMap(p => p.tasks).find(t => t.id === taskId);
    if (editValue.trim() === "") {
      updateTask(phaseId, taskId, { 
        details: undefined,
        source: undefined,
        colors: undefined
      });
      saveTaskUpdate({
        phaseId,
        taskId,
        taskName: task?.name || "",
        details: undefined,
        colors: undefined,
        source: undefined,
        status: undefined,
        completed: undefined,
      });
    } else {
      updateTask(phaseId, taskId, { 
        details: editValue,
        source: 'manual',
        colors: editingColors
      });
      saveTaskUpdate({
        phaseId,
        taskId,
        taskName: task?.name || "",
        details: editValue,
        colors: editingColors,
        source: 'manual',
        status: undefined,
        completed: undefined,
      });
    }
    setEditingTask(null);
    setEditValue("");
  };

  const handleSaveColors = (phaseId: string, taskId: string) => {
    const task = phases.flatMap(p => p.tasks).find(t => t.id === taskId);
    updateTask(phaseId, taskId, { 
      colors: editingColors,
      source: 'manual',
      completed: true,
      status: 'done'
    });
    saveTaskUpdate({
      phaseId,
      taskId,
      taskName: task?.name || "",
      colors: editingColors,
      source: 'manual',
      status: 'done',
      completed: true,
    });
    setEditingTask(null);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditValue("");
  };

  const handleClearDetails = (phaseId: string, taskId: string) => {
    const task = phases.flatMap(p => p.tasks).find(t => t.id === taskId);
    updateTask(phaseId, taskId, { 
      details: undefined,
      source: undefined,
      colors: undefined
    });
    saveTaskUpdate({
      phaseId,
      taskId,
      taskName: task?.name || "",
      details: undefined,
      colors: undefined,
      source: undefined,
      status: undefined,
      completed: undefined,
    });
  };

  const handleCallVenue = async () => {
    try {
      const result = await callVenue();
      setCallStatus(result);
      if (result.status === 'connected') {
        updateTask('2', '2-4', { 
          status: 'in-progress',
          details: 'Call in progress to +17165134580'
        });
        saveTaskUpdate({
          phaseId: '2',
          taskId: '2-4',
          taskName: 'Book Venue',
          details: 'Call in progress to +17165134580',
          status: 'in-progress',
        });
      } else if (result.status === 'error') {
        console.error('Call failed:', result.error);
        updateTask('2', '2-4', { 
          status: 'pending',
          details: `Call failed: ${result.error}`
        });
        saveTaskUpdate({
          phaseId: '2',
          taskId: '2-4',
          taskName: 'Book Venue',
          details: `Call failed: ${result.error}`,
          status: 'pending',
        });
      }
    } catch (error) {
      console.error('Error calling venue:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start call';
      setCallStatus({ id: '', status: 'error', error: errorMessage });
      updateTask('2', '2-4', { 
        status: 'pending',
        details: `Call error: ${errorMessage}`
      });
      saveTaskUpdate({
        phaseId: '2',
        taskId: '2-4',
        taskName: 'Book Venue',
        details: `Call error: ${errorMessage}`,
        status: 'pending',
      });
    }
  };

  const handleEndCall = async () => {
    await endCall();
    setCallStatus({ id: '', status: 'idle' });
    updateTask('2', '2-4', { 
      status: 'done',
      completed: true,
      details: 'Venue booking call completed'
    });
    saveTaskUpdate({
      phaseId: '2',
      taskId: '2-4',
      taskName: 'Book Venue',
      details: 'Venue booking call completed',
      status: 'done',
      completed: true,
    });
  };

  const handleCallRestaurant = async () => {
    try {
      const result = await callRestaurant();
      setCallStatus(result);
      if (result.status === 'connected') {
        updateTask('2', '2-5', { 
          status: 'in-progress',
          details: 'Call in progress to restaurant at +17165134580'
        });
        saveTaskUpdate({
          phaseId: '2',
          taskId: '2-5',
          taskName: 'Plan Meals',
          details: 'Call in progress to restaurant at +17165134580',
          status: 'in-progress',
        });
      } else if (result.status === 'error') {
        console.error('Restaurant call failed:', result.error);
        updateTask('2', '2-5', { 
          status: 'pending',
          details: `Restaurant call failed: ${result.error}`
        });
        saveTaskUpdate({
          phaseId: '2',
          taskId: '2-5',
          taskName: 'Plan Meals',
          details: `Restaurant call failed: ${result.error}`,
          status: 'pending',
        });
      }
    } catch (error) {
      console.error('Error calling restaurant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start restaurant call';
      setCallStatus({ id: '', status: 'error', error: errorMessage });
      updateTask('2', '2-5', { 
        status: 'pending',
        details: `Restaurant call error: ${errorMessage}`
      });
      saveTaskUpdate({
        phaseId: '2',
        taskId: '2-5',
        taskName: 'Plan Meals',
        details: `Restaurant call error: ${errorMessage}`,
        status: 'pending',
      });
    }
  };

  const handleEndRestaurantCall = async () => {
    await endCall();
    setCallStatus({ id: '', status: 'idle' });
    updateTask('2', '2-5', { 
      status: 'done',
      completed: true,
      details: 'Restaurant meal planning call completed'
    });
    saveTaskUpdate({
      phaseId: '2',
      taskId: '2-5',
      taskName: 'Plan Meals',
      details: 'Restaurant meal planning call completed',
      status: 'done',
      completed: true,
    });
  };

  const handleClearPhase1 = async () => {
    await clearPhase1TaskUpdates();
    // Reset all Phase 1 tasks in UI
    const phase1 = phases.find(p => p.id === '1');
    if (phase1) {
      phase1.tasks.forEach(task => {
        updateTask('1', task.id, {
          completed: false,
          status: 'pending',
          details: undefined,
          colors: undefined,
          source: undefined,
        });
      });
    }
    toast({ title: "Phase 1 data cleared from database and UI." });
  };

  const filteredPhases = viewFilter === 'home'
    ? phases
    : phases.filter(p => p.id === viewFilter);

  // UI for view type toggle
  const viewTypeToggle = (
    <div className="flex justify-center w-full mb-4 mt-4">
      <div className="flex gap-1 px-2 py-1 rounded-full bg-white/70 backdrop-blur-xl shadow-lg border border-blue-100">
        <Button
          variant={viewType === 'timeline' ? 'default' : 'outline'}
          onClick={() => { setViewType('timeline'); setViewFilter('home'); }}
          className={`rounded-full px-5 py-1.5 font-semibold text-base transition-all duration-200 ${viewType === 'timeline' ? 'bg-gradient-to-r from-blue-500 to-green-400 text-white shadow-md scale-105' : 'hover:bg-blue-100'}`}
        >
          Timeline View
        </Button>
        <Button
          variant={viewType === 'category' ? 'default' : 'outline'}
          onClick={() => { setViewType('category'); setViewFilter('logistics'); }}
          className={`rounded-full px-5 py-1.5 font-semibold text-base transition-all duration-200 ${viewType === 'category' ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-md scale-105' : 'hover:bg-blue-100'}`}
        >
          Category View
        </Button>
      </div>
    </div>
  );

  // UI for category nav (no Home button)
  const categoryNav = (
    <div className="flex justify-center w-full mb-4">
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/70 backdrop-blur-xl shadow-lg border border-blue-100">
        <Button
          variant={viewFilter === 'logistics' ? 'default' : 'outline'}
          onClick={() => setViewFilter('logistics')}
          className={`rounded-full px-5 py-1.5 font-semibold text-base transition-all duration-200 ${viewFilter === 'logistics' ? 'bg-gradient-to-r from-blue-500 to-green-400 text-white shadow-md scale-105' : 'hover:bg-blue-100'}`}
        >
          Logistics
        </Button>
        <Button
          variant={viewFilter === 'marketing' ? 'default' : 'outline'}
          onClick={() => setViewFilter('marketing')}
          className={`rounded-full px-5 py-1.5 font-semibold text-base transition-all duration-200 ${viewFilter === 'marketing' ? 'bg-gradient-to-r from-blue-500 to-green-400 text-white shadow-md scale-105' : 'hover:bg-blue-100'}`}
        >
          Marketing
        </Button>
        <Button
          variant={viewFilter === 'website' ? 'default' : 'outline'}
          onClick={() => setViewFilter('website')}
          className={`rounded-full px-5 py-1.5 font-semibold text-base transition-all duration-200 ${viewFilter === 'website' ? 'bg-gradient-to-r from-blue-500 to-green-400 text-white shadow-md scale-105' : 'hover:bg-blue-100'}`}
        >
          Website
        </Button>
        <Button
          variant={viewFilter === 'outreach' ? 'default' : 'outline'}
          onClick={() => setViewFilter('outreach')}
          className={`rounded-full px-5 py-1.5 font-semibold text-base transition-all duration-200 ${viewFilter === 'outreach' ? 'bg-gradient-to-r from-blue-500 to-green-400 text-white shadow-md scale-105' : 'hover:bg-blue-100'}`}
        >
          Outreach
        </Button>
      </div>
    </div>
  );

  // Sponsorship package document generation
  const handleGenerateSponsorshipDoc = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'Sponsorship Request Package',
              heading: HeadingLevel.TITLE,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: 'Gen AI Hackathon 2024',
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: 'Event Details:',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph('Location: Madison Square Garden'),
            new Paragraph('Date: October 17-18, 2024'),
            new Paragraph('Expected Attendance: 400 people'),
            new Paragraph('Theme: Generative AI'),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            new Paragraph({
              text: 'About the Event:',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph('Join us for an exciting two-day hackathon focused on Generative AI, bringing together 400 talented participants, industry leaders, and innovators at the iconic Madison Square Garden. This event will foster creativity, collaboration, and cutting-edge solutions in the field of AI.'),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            new Paragraph({
              text: 'Sponsorship Opportunities:',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph('We invite you to support our hackathon as a sponsor. Your contribution will help us provide an exceptional experience for all attendees and promote advancements in AI technology.'),
            new Paragraph('Sponsorship benefits include:'),
            new Paragraph('- Brand visibility at the event and online'),
            new Paragraph('- Opportunities to connect with top talent'),
            new Paragraph('- Speaking and judging opportunities'),
            new Paragraph('- Custom engagement options'),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            new Paragraph({
              text: 'Contact Us:',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph('For more information or to discuss sponsorship packages, please contact us at hackathon@genai2024.com.'),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'GenAI_Hackathon_Sponsorship_Package.docx');
  };

  // Hackathon agenda document generation
  const handleGenerateAgendaDoc = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: 'Gen AI Hackathon 2024 - Event Agenda',
              heading: HeadingLevel.TITLE,
              spacing: { after: 400 },
            }),
            new Paragraph({
              text: 'Location: Madison Square Garden',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph('Date: October 17-18, 2024'),
            new Paragraph('Expected Attendance: 400 people'),
            new Paragraph('Theme: Generative AI'),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            new Paragraph({
              text: 'Day 1 - October 17, 2024',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph('08:00 AM - Registration & Breakfast'),
            new Paragraph('09:00 AM - Opening Ceremony & Welcome'),
            new Paragraph('09:30 AM - Keynote: The Future of Generative AI'),
            new Paragraph('10:00 AM - Team Formation & Hacking Begins'),
            new Paragraph('12:30 PM - Lunch Break'),
            new Paragraph('01:30 PM - Workshop: Building with Gen AI APIs'),
            new Paragraph('03:00 PM - Sponsor Booths & Networking'),
            new Paragraph('06:00 PM - Dinner'),
            new Paragraph('07:00 PM - Evening Check-in & Social'),
            new Paragraph('11:00 PM - Venue Closes for Day 1'),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            new Paragraph({
              text: 'Day 2 - October 18, 2024',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph('08:00 AM - Venue Opens & Breakfast'),
            new Paragraph('09:00 AM - Hacking Continues'),
            new Paragraph('12:00 PM - Lunch Break'),
            new Paragraph('01:00 PM - Project Submission Deadline'),
            new Paragraph('01:30 PM - Demos & Judging'),
            new Paragraph('04:00 PM - Awards Ceremony'),
            new Paragraph('04:30 PM - Closing Remarks'),
            new Paragraph('05:00 PM - Event Ends'),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            new Paragraph({
              text: 'Contact Us:',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph('For questions or more information, contact hackathon@genai2024.com.'),
          ],
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'GenAI_Hackathon_Agenda.docx');
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header always at the top */}
      <div className="px-8 pt-2 pb-4 bg-white/80 backdrop-blur-2xl border-b border-blue-100 shadow-md rounded-b-3xl flex flex-col items-start">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight drop-shadow-sm">Project Management</h1>
        <p className="text-base text-gray-600 font-medium">Manage your project phases and tasks with AI assistance</p>
      </div>
      {viewTypeToggle}
      {viewType === 'timeline' ? (
        // Timeline/phase view (as before)
        <>
          {/* Top Navigation Bar */}
          <div className="flex justify-center w-full mb-4">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/70 backdrop-blur-xl shadow-lg border border-blue-100">
              <Button
                variant={viewFilter === 'home' ? 'default' : 'outline'}
                onClick={() => setViewFilter('home')}
                className={`rounded-full px-5 py-1.5 font-semibold text-base transition-all duration-200 ${viewFilter === 'home' ? 'bg-gradient-to-r from-blue-500 to-green-400 text-white shadow-md scale-105' : 'hover:bg-blue-100'}`}
              >
                Home
              </Button>
              <Button
                variant={viewFilter === '1' ? 'default' : 'outline'}
                onClick={() => setViewFilter('1')}
                className={`rounded-full px-5 py-1.5 font-semibold text-base transition-all duration-200 ${viewFilter === '1' ? 'bg-gradient-to-r from-blue-500 to-green-400 text-white shadow-md scale-105' : 'hover:bg-blue-100'}`}
              >
                Phase 1: Overview
              </Button>
              <Button
                variant={viewFilter === '2' ? 'default' : 'outline'}
                onClick={() => setViewFilter('2')}
                className={`rounded-full px-5 py-1.5 font-semibold text-base transition-all duration-200 ${viewFilter === '2' ? 'bg-gradient-to-r from-blue-500 to-green-400 text-white shadow-md scale-105' : 'hover:bg-blue-100'}`}
              >
                Phase 2: Preparation
              </Button>
              <Button
                variant={viewFilter === '3' ? 'default' : 'outline'}
                onClick={() => setViewFilter('3')}
                className={`rounded-full px-5 py-1.5 font-semibold text-base transition-all duration-200 ${viewFilter === '3' ? 'bg-gradient-to-r from-blue-500 to-green-400 text-white shadow-md scale-105' : 'hover:bg-blue-100'}`}
              >
                Phase 3: Execution
              </Button>
            </div>
          </div>
          {/* Project Phases */}
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              {filteredPhases.map((phase) => {
                const progress = getPhaseProgress(phase);
                return (
                  <Card key={phase.id} className="bg-white/70 backdrop-blur-2xl border border-blue-100 shadow-2xl rounded-3xl transition-transform duration-200 hover:scale-[1.01]">
                    <Collapsible open={phase.isOpen} onOpenChange={() => togglePhase(phase.id)}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-6 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-green-50/70 transition-colors rounded-t-3xl">
                          <div className="flex items-center space-x-4">
                            {phase.isOpen ? (
                              <ChevronDown className="w-6 h-6 text-blue-600" />
                            ) : (
                              <ChevronRight className="w-6 h-6 text-blue-600" />
                            )}
                            <span className="text-2xl drop-shadow font-bold">{phase.icon}</span>
                            <div className="text-left">
                              <h3 className="font-bold text-gray-900 text-lg tracking-tight">{phase.name}</h3>
                              <p className="text-sm text-gray-500 font-medium">
                                {progress.completed}/{progress.total} tasks completed
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 via-green-400 to-green-300 h-3 rounded-full transition-all duration-500 animate-pulse"
                                style={{
                                  width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`
                                }}
                              />
                            </div>
                            <span className="text-base text-gray-500 font-semibold">
                              {progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}%
                            </span>
                            {/* Clear button for Phase 1 only */}
                            {phase.id === '1' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleClearPhase1(); }}
                                className="ml-2 bg-red-100 text-red-700 border-red-200 hover:bg-red-200 hover:text-red-900 rounded-full shadow"
                              >
                                Clear Data
                              </Button>
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-6 pb-6 border-t border-blue-100">
                          <div className="space-y-4 mt-6">
                            {phase.tasks.map((task) => (
                              <div
                                key={task.id}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 shadow-md group ${
                                  task.completed
                                    ? 'bg-gradient-to-r from-green-50/80 to-green-100/80 border-green-200'
                                    : 'bg-white/90 border-gray-200 hover:border-blue-300 hover:shadow-lg'
                                }`}
                              >
                                <div className="flex items-center space-x-4 flex-1">
                                  <Checkbox
                                    checked={task.completed}
                                    onCheckedChange={() => toggleTask(phase.id, task.id)}
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 scale-125 shadow-sm"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between w-full">
                                      {task.name === 'Get sponsors' ? (
                                        <div className="flex items-center gap-4 w-full">
                                          <span className="font-semibold text-lg transition-all duration-200" style={{ minWidth: 0 }}>{task.name}</span>
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-base text-gray-900">Run Automation</span>
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              className="rounded-full h-8 w-8 flex items-center justify-center bg-gradient-to-r from-blue-500 to-green-400 text-white border-none shadow hover:scale-105"
                                              onClick={() => { /* Placeholder for automation logic */ }}
                                              aria-label="Run automation"
                                            >
                                              <ChevronRight className="w-5 h-5" />
                                            </Button>
                                          </div>
                                          <div className="flex flex-col ml-2 mt-0 relative">
                                            {(task.subtasks || []).map((subtask, idx, arr) => (
                                              <div key={subtask.id} className="flex items-center relative min-h-[40px]">
                                                {idx < arr.length - 1 && (
                                                  <div className="absolute left-4 top-6 w-0.5 h-8 bg-gray-300 z-0" />
                                                )}
                                                <button
                                                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-200 ${
                                                    subtask.completed
                                                      ? 'bg-gradient-to-br from-green-400 to-blue-400 border-blue-400 text-white'
                                                      : 'bg-white border-gray-300 text-gray-400'
                                                  }`}
                                                  style={{ marginRight: '0.5rem' }}
                                                  onClick={() => {
                                                    updateTask(task.phase.id, task.id, {
                                                      subtasks: task.subtasks?.map(st => st.id === subtask.id ? { ...st, completed: !st.completed, status: !st.completed ? 'done' : 'pending' } : st)
                                                    });
                                                    const allDone = task.subtasks?.every(st => st.id === subtask.id ? !st.completed : st.completed);
                                                    if (allDone) {
                                                      updateTask(task.phase.id, task.id, { completed: true, status: 'done' });
                                                    } else {
                                                      updateTask(task.phase.id, task.id, { completed: false, status: 'pending' });
                                                    }
                                                  }}
                                                  aria-label={`Toggle ${subtask.name}`}
                                                >
                                                  {subtask.completed ? <Check className="w-5 h-5" /> : <span className="w-3 h-3 rounded-full border-2 border-gray-300" />}
                                                </button>
                                                <span className={`ml-2 text-base ${subtask.completed ? 'text-green-700 font-semibold' : 'text-gray-900'}`}>{subtask.name}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                    <span
                                      className={`font-semibold text-lg transition-all duration-200 ${
                                        task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                                      }`}
                                    >
                                      {task.name}
                                    </span>
                                      )}
                                    </div>
                                    {editingTask === task.id ? (
                                      <div className="mt-2 flex items-center space-x-3 animate-fade-in">
                                        <Info className="w-4 h-4 text-blue-600" />
                                        {task.name === 'Branding' ? (
                                          <div className="flex items-center space-x-3 flex-1">
                                            <div className="flex items-center space-x-2">
                                              <label className="text-xs text-gray-600">Primary:</label>
                                              <input
                                                type="color"
                                                value={editingColors.primary}
                                                onChange={(e) => setEditingColors(prev => ({ ...prev, primary: e.target.value }))}
                                                className="w-8 h-8 border border-gray-300 rounded-full cursor-pointer shadow"
                                              />
                                              <span className="text-xs font-mono">{editingColors.primary}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <label className="text-xs text-gray-600">Secondary:</label>
                                              <input
                                                type="color"
                                                value={editingColors.secondary}
                                                onChange={(e) => setEditingColors(prev => ({ ...prev, secondary: e.target.value }))}
                                                className="w-8 h-8 border border-gray-300 rounded-full cursor-pointer shadow"
                                              />
                                              <span className="text-xs font-mono">{editingColors.secondary}</span>
                                            </div>
                                            <Button
                                              size="sm"
                                              onClick={() => handleSaveColors(phase.id, task.id)}
                                              className="h-8 px-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full shadow hover:scale-105"
                                            >
                                              <Save className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={handleCancelEdit}
                                              className="h-8 px-3 rounded-full shadow"
                                            >
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center space-x-3 flex-1">
                                            <Input
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="text-sm border-blue-200 focus:border-blue-400 rounded-full px-4 py-2 shadow"
                                              placeholder={getTaskPlaceholder(task.name)}
                                              onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                  handleSaveEdit(phase.id, task.id);
                                                } else if (e.key === 'Escape') {
                                                  handleCancelEdit();
                                                }
                                              }}
                                              autoFocus
                                            />
                                            <Button
                                              size="sm"
                                              onClick={() => handleSaveEdit(phase.id, task.id)}
                                              className="h-8 px-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full shadow hover:scale-105"
                                            >
                                              <Save className="w-4 h-4" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={handleCancelEdit}
                                              className="h-8 px-3 rounded-full shadow"
                                            >
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    ) : task.name === 'Branding' && task.colors ? (
                                      <div className="mt-2 flex items-center space-x-2">
                                        <Info className="w-4 h-4 text-blue-600" />
                                        <div className="flex items-center space-x-2">
                                          <div className="flex items-center space-x-2">
                                            <div 
                                              className="w-5 h-5 rounded-full border border-gray-300 shadow" 
                                              style={{ backgroundColor: task.colors.primary }}
                                            />
                                            <span className="text-xs text-gray-600 font-mono">{task.colors.primary}</span>
                                          </div>
                                          <span className="text-xs text-gray-400">+</span>
                                          <div className="flex items-center space-x-2">
                                            <div 
                                              className="w-5 h-5 rounded-full border border-gray-300 shadow" 
                                              style={{ backgroundColor: task.colors.secondary }}
                                            />
                                            <span className="text-xs text-gray-600 font-mono">{task.colors.secondary}</span>
                                          </div>
                                          {task.source && (
                                            <span className="text-xs text-gray-400 ml-2" title={task.source === 'chatbot' ? 'Added by AI' : 'Manually edited'}>
                                              {task.source === 'chatbot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            </span>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditTask(task.id, task.details || "", task.colors)}
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleClearDetails(phase.id, task.id)}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full"
                                            title="Clear colors"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : task.name === 'Branding' && !task.colors ? (
                                      <div className="mt-2 flex items-center space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditTask(task.id, "", { primary: '#3B82F6', secondary: '#10B981' })}
                                          className="h-8 px-3 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full shadow"
                                        >
                                          <Edit2 className="w-4 h-4 mr-1" />
                                          Add colors
                                        </Button>
                                      </div>
                                    ) : task.details ? (
                                      <div className="mt-2 flex items-center space-x-2">
                                        <Info className="w-4 h-4 text-blue-600" />
                                        <div className="flex items-center space-x-2">
                                        <span className="text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-semibold shadow-sm">
                                          {task.details}
                                        </span>
                                          {task.source && (
                                            <span className="text-xs text-gray-400 ml-2" title={task.source === 'chatbot' ? 'Added by AI' : 'Manually edited'}>
                                              {task.source === 'chatbot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                            </span>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditTask(task.id, task.details || "", task.colors)}
                                            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleClearDetails(phase.id, task.id)}
                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full"
                                            title="Clear details"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mt-2 flex items-center space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditTask(task.id, "", task.colors)}
                                          className="h-8 px-3 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full shadow"
                                        >
                                          <Edit2 className="w-4 h-4 mr-1" />
                                          Add details
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                  {(viewType === 'timeline') && task.name === 'Make website' ? (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs bg-gradient-to-r from-green-400 to-blue-400 text-white border-none shadow rounded-full hover:scale-105"
                                        onClick={async () => {
                                          if (!task.completed && !generatingWebsite) {
                                            setGeneratingWebsite(true);
                                            await new Promise(res => setTimeout(res, 3000));
                                            toggleTask(phase.id, task.id);
                                            setGeneratingWebsite(false);
                                            navigate('/hackathon');
                                          } else if (!generatingWebsite) {
                                            navigate('/hackathon');
                                          }
                                        }}
                                        disabled={generatingWebsite}
                                      >
                                        {generatingWebsite ? (
                                          <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                            Generating...
                                          </span>
                                        ) : (
                                          'Make Website'
                                        )}
                                      </Button>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs rounded-full px-3 py-1 font-bold shadow-sm border-2 ${getStatusColor(task.status)}`}
                                  >
                                    {getStatusLabel(task.status)}
                                  </Badge>
                                    </>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className={`text-xs rounded-full px-3 py-1 font-bold shadow-sm border-2 ${getStatusColor(task.status)}`}
                                    >
                                      {getStatusLabel(task.status)}
                                    </Badge>
                                  )}
                                  {/* Call Venue Button for Book Venue task */}
                                  {task.name === 'Book Venue' && (
                                    <div className="flex items-center space-x-1">
                                      {callStatus.status === 'idle' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleCallVenue}
                                          className="h-8 px-3 text-xs bg-gradient-to-r from-green-400 to-blue-400 text-white border-none shadow rounded-full hover:scale-105"
                                          title="Call venue at +17165134580"
                                        >
                                          <Phone className="w-4 h-4 mr-1" />
                                          Call Venue
                                        </Button>
                                      )}
                                      {callStatus.status === 'calling' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled
                                          className="h-8 px-3 text-xs bg-blue-100 text-blue-700 border-blue-200 rounded-full shadow animate-pulse"
                                        >
                                          <Phone className="w-4 h-4 mr-1 animate-pulse" />
                                          Calling...
                                        </Button>
                                      )}
                                      {callStatus.status === 'connected' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleEndCall}
                                          className="h-8 px-3 text-xs bg-gradient-to-r from-red-400 to-pink-400 text-white border-none shadow rounded-full hover:scale-105"
                                          title="End call"
                                        >
                                          <Phone className="w-4 h-4 mr-1" />
                                          End Call
                                        </Button>
                                      )}
                                      {callStatus.status === 'error' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleCallVenue}
                                          className="h-8 px-3 text-xs bg-gradient-to-r from-orange-400 to-yellow-400 text-white border-none shadow rounded-full hover:scale-105"
                                          title={`Retry call: ${callStatus.error}`}
                                        >
                                          <Phone className="w-4 h-4 mr-1" />
                                          Retry
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                  {/* Call Restaurant Button for Plan Meals task */}
                                  {task.name === 'Plan Meals' && (
                                    <div className="flex items-center space-x-1">
                                      {callStatus.status === 'idle' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleCallRestaurant}
                                          className="h-8 px-3 text-xs bg-gradient-to-r from-green-400 to-blue-400 text-white border-none shadow rounded-full hover:scale-105"
                                          title="Call restaurant at +17165134580"
                                        >
                                          <Phone className="w-4 h-4 mr-1" />
                                          Call Restaurant
                                        </Button>
                                      )}
                                      {callStatus.status === 'calling' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          disabled
                                          className="h-8 px-3 text-xs bg-blue-100 text-blue-700 border-blue-200 rounded-full shadow animate-pulse"
                                        >
                                          <Phone className="w-4 h-4 mr-1 animate-pulse" />
                                          Calling...
                                        </Button>
                                      )}
                                      {callStatus.status === 'connected' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleEndRestaurantCall}
                                          className="h-8 px-3 text-xs bg-gradient-to-r from-red-400 to-pink-400 text-white border-none shadow rounded-full hover:scale-105"
                                          title="End call"
                                        >
                                          <Phone className="w-4 h-4 mr-1" />
                                          End Call
                                        </Button>
                                      )}
                                      {callStatus.status === 'error' && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleCallRestaurant}
                                          className="h-8 px-3 text-xs bg-gradient-to-r from-orange-400 to-yellow-400 text-white border-none shadow rounded-full hover:scale-105"
                                          title={`Retry call: ${callStatus.error}`}
                                        >
                                          <Phone className="w-4 h-4 mr-1" />
                                          Retry
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                  {/* Marketing image generation button for Make marketing posts */}
                                  {task.name === 'Make marketing posts' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 text-xs bg-gradient-to-r from-blue-400 to-black text-white border-none shadow rounded-full hover:scale-105"
                                      onClick={async () => {
                                        setGeneratingImages(true);
                                        setMarketingImages([]);
                                        try {
                                          const images = await generateMarketingImages({
                                            prompt: 'A blue and black themed poster for a Gen AI hackathon at Madison Square Garden, October 17-18, 2024, for 400 people max. Include all these details on the poster.',
                                            n: 1
                                          });
                                          setMarketingImages(images);
                                        } catch (e) {
                                          setMarketingImages([]);
                                        }
                                        setGeneratingImages(false);
                                      }}
                                      disabled={generatingImages}
                                    >
                                      {generatingImages ? (
                                        <span className="flex items-center gap-2">
                                          <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                            Generating...
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1"><LucideImage className="w-4 h-4 mr-1" /> Generate Images</span>
                                      )}
                                    </Button>
                                  )}
                                  {/* Display generated marketing images below the task */}
                                  {task.name === 'Make marketing posts' && marketingImages.length > 0 && (
                                    <div className="flex flex-wrap gap-4 mt-4">
                                      {marketingImages.slice(0, 1).map((img, idx) => (
                                        <div key={idx} className="flex flex-col items-center">
                                          <img src={img.url} alt="Marketing Poster" className="w-48 h-64 object-cover rounded-lg shadow-lg border border-blue-200" />
                                          <a href={img.url} download={`marketing-poster-${idx + 1}.png`} className="mt-2 text-xs text-blue-600 underline">Download</a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {task.name === 'Make package' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 text-xs bg-gradient-to-r from-blue-500 to-green-500 text-white border-none shadow rounded-full hover:scale-105"
                                      onClick={handleGenerateSponsorshipDoc}
                                    >
                                      Generate Sponsorship Doc
                                    </Button>
                                  )}
                                  {task.name === 'Agenda maker' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 text-xs bg-gradient-to-r from-blue-500 to-green-500 text-white border-none shadow rounded-full hover:scale-105"
                                      onClick={handleGenerateAgendaDoc}
                                    >
                                      Download Agenda
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 shadow"
                                  >
                                    <Settings className="w-4 h-4" />
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
        </>
      ) : (
        // Category view
        <>
          {categoryNav}
          <ScrollArea className="flex-1">
            <div className="p-8 space-y-8">
              {['logistics', 'marketing', 'website', 'outreach'].map(category => (
                viewFilter === category && (
                  <Card key={category} className="bg-white/70 backdrop-blur-2xl border border-blue-100 shadow-2xl rounded-3xl">
                    <div className="p-6">
                      <div className="flex items-center mb-6 gap-3">
                        {/* Add icons for each category */}
                        <span className="text-3xl">
                          {category === 'logistics' && '🚚'}
                          {category === 'marketing' && '📢'}
                          {category === 'website' && '💻'}
                          {category === 'outreach' && '🤝'}
                        </span>
                        <h2 className="text-2xl font-extrabold capitalize tracking-tight drop-shadow-sm">{category}</h2>
                      </div>
                      <div className="space-y-4">
                        {categoryTasks[category].map(task => (
                          <div key={task.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 shadow-md group ${task.completed ? 'bg-gradient-to-r from-green-50/80 to-green-100/80 border-green-200' : 'bg-white/90 border-gray-200 hover:border-blue-300 hover:shadow-lg'}`}>
                            <div className="flex items-center space-x-4 flex-1">
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => toggleTask(task.phase.id, task.id)}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 scale-125 shadow-sm"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between w-full">
                                  {task.name === 'Get sponsors' ? (
                                    <div className="flex items-center gap-4 w-full">
                                      <span className="font-semibold text-lg transition-all duration-200" style={{ minWidth: 0 }}>{task.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-base text-gray-900">Run Automation</span>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="rounded-full h-8 w-8 flex items-center justify-center bg-gradient-to-r from-blue-500 to-green-400 text-white border-none shadow hover:scale-105"
                                          onClick={() => { /* Placeholder for automation logic */ }}
                                          aria-label="Run automation"
                                        >
                                          <ChevronRight className="w-5 h-5" />
                                        </Button>
                                      </div>
                                      <div className="flex flex-col ml-2 mt-0 relative">
                                        {(task.subtasks || []).map((subtask, idx, arr) => (
                                          <div key={subtask.id} className="flex items-center relative min-h-[40px]">
                                            {idx < arr.length - 1 && (
                                              <div className="absolute left-4 top-6 w-0.5 h-8 bg-gray-300 z-0" />
                                            )}
                                            <button
                                              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-200 ${
                                                subtask.completed
                                                  ? 'bg-gradient-to-br from-green-400 to-blue-400 border-blue-400 text-white'
                                                  : 'bg-white border-gray-300 text-gray-400'
                                              }`}
                                              style={{ marginRight: '0.5rem' }}
                                              onClick={() => {
                                                updateTask(task.phase.id, task.id, {
                                                  subtasks: task.subtasks?.map(st => st.id === subtask.id ? { ...st, completed: !st.completed, status: !st.completed ? 'done' : 'pending' } : st)
                                                });
                                                const allDone = task.subtasks?.every(st => st.id === subtask.id ? !st.completed : st.completed);
                                                if (allDone) {
                                                  updateTask(task.phase.id, task.id, { completed: true, status: 'done' });
                                                } else {
                                                  updateTask(task.phase.id, task.id, { completed: false, status: 'pending' });
                                                }
                                              }}
                                              aria-label={`Toggle ${subtask.name}`}
                                            >
                                              {subtask.completed ? <Check className="w-5 h-5" /> : <span className="w-3 h-3 rounded-full border-2 border-gray-300" />}
                                            </button>
                                            <span className={`ml-2 text-base ${subtask.completed ? 'text-green-700 font-semibold' : 'text-gray-900'}`}>{subtask.name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <span
                                      className={`font-semibold text-lg transition-all duration-200 ${
                                        task.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                                      }`}
                                    >
                                      {task.name}
                                    </span>
                                  )}
                                </div>
                                {editingTask === task.id ? (
                                  <div className="mt-2 flex items-center space-x-3 animate-fade-in">
                                    <Info className="w-4 h-4 text-blue-600" />
                                    {task.name === 'Branding' ? (
                                      <div className="flex items-center space-x-3 flex-1">
                                        <div className="flex items-center space-x-2">
                                          <label className="text-xs text-gray-600">Primary:</label>
                                          <input
                                            type="color"
                                            value={editingColors.primary}
                                            onChange={(e) => setEditingColors(prev => ({ ...prev, primary: e.target.value }))}
                                            className="w-8 h-8 border border-gray-300 rounded-full cursor-pointer shadow"
                                          />
                                          <span className="text-xs font-mono">{editingColors.primary}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <label className="text-xs text-gray-600">Secondary:</label>
                                          <input
                                            type="color"
                                            value={editingColors.secondary}
                                            onChange={(e) => setEditingColors(prev => ({ ...prev, secondary: e.target.value }))}
                                            className="w-8 h-8 border border-gray-300 rounded-full cursor-pointer shadow"
                                          />
                                          <span className="text-xs font-mono">{editingColors.secondary}</span>
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => handleSaveColors(task.phase.id, task.id)}
                                          className="h-8 px-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full shadow hover:scale-105"
                                        >
                                          <Save className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCancelEdit}
                                          className="h-8 px-3 rounded-full shadow"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-3 flex-1">
                                        <Input
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="text-sm border-blue-200 focus:border-blue-400 rounded-full px-4 py-2 shadow"
                                          placeholder={getTaskPlaceholder(task.name)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              handleSaveEdit(task.phase.id, task.id);
                                            } else if (e.key === 'Escape') {
                                              handleCancelEdit();
                                            }
                                          }}
                                          autoFocus
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() => handleSaveEdit(task.phase.id, task.id)}
                                          className="h-8 px-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full shadow hover:scale-105"
                                        >
                                          <Save className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={handleCancelEdit}
                                          className="h-8 px-3 rounded-full shadow"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : task.name === 'Branding' && task.colors ? (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <Info className="w-4 h-4 text-blue-600" />
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center space-x-2">
                                        <div 
                                          className="w-5 h-5 rounded-full border border-gray-300 shadow" 
                                          style={{ backgroundColor: task.colors.primary }}
                                        />
                                        <span className="text-xs text-gray-600 font-mono">{task.colors.primary}</span>
                                      </div>
                                      <span className="text-xs text-gray-400">+</span>
                                      <div className="flex items-center space-x-2">
                                        <div 
                                          className="w-5 h-5 rounded-full border border-gray-300 shadow" 
                                          style={{ backgroundColor: task.colors.secondary }}
                                        />
                                        <span className="text-xs text-gray-600 font-mono">{task.colors.secondary}</span>
                                      </div>
                                      {task.source && (
                                        <span className="text-xs text-gray-400 ml-2" title={task.source === 'chatbot' ? 'Added by AI' : 'Manually edited'}>
                                          {task.source === 'chatbot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                        </span>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditTask(task.id, task.details || "", task.colors)}
                                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleClearDetails(task.phase.id, task.id)}
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full"
                                        title="Clear colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : task.name === 'Branding' && !task.colors ? (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditTask(task.id, "", { primary: '#3B82F6', secondary: '#10B981' })}
                                      className="h-8 px-3 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full shadow"
                                    >
                                      <Edit2 className="w-4 h-4 mr-1" />
                                      Add colors
                                    </Button>
                                  </div>
                                ) : task.details ? (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <Info className="w-4 h-4 text-blue-600" />
                                    <div className="flex items-center space-x-2">
                                    <span className="text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-semibold shadow-sm">
                                      {task.details}
                                    </span>
                                      {task.source && (
                                        <span className="text-xs text-gray-400 ml-2" title={task.source === 'chatbot' ? 'Added by AI' : 'Manually edited'}>
                                          {task.source === 'chatbot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                        </span>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditTask(task.id, task.details || "", task.colors)}
                                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleClearDetails(task.phase.id, task.id)}
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full"
                                        title="Clear details"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditTask(task.id, "", task.colors)}
                                      className="h-8 px-3 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full shadow"
                                    >
                                      <Edit2 className="w-4 h-4 mr-1" />
                                      Add details
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {(viewType === 'timeline') && task.name === 'Make website' ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs bg-gradient-to-r from-green-400 to-blue-400 text-white border-none shadow rounded-full hover:scale-105"
                                    onClick={async () => {
                                      if (!task.completed && !generatingWebsite) {
                                        setGeneratingWebsite(true);
                                        await new Promise(res => setTimeout(res, 3000));
                                        toggleTask(task.phase.id, task.id);
                                        setGeneratingWebsite(false);
                                        navigate('/hackathon');
                                      } else if (!generatingWebsite) {
                                        navigate('/hackathon');
                                      }
                                    }}
                                    disabled={generatingWebsite}
                                  >
                                    {generatingWebsite ? (
                                      <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                          Generating...
                                      </span>
                                    ) : (
                                      'Make Website'
                                    )}
                                  </Button>
                              <Badge
                                variant="outline"
                                className={`text-xs rounded-full px-3 py-1 font-bold shadow-sm border-2 ${getStatusColor(task.status)}`}
                              >
                                {getStatusLabel(task.status)}
                              </Badge>
                                </>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={`text-xs rounded-full px-3 py-1 font-bold shadow-sm border-2 ${getStatusColor(task.status)}`}
                                >
                                  {getStatusLabel(task.status)}
                                </Badge>
                              )}
                              {/* Call Venue Button for Book Venue task */}
                              {task.name === 'Book Venue' && (
                                <div className="flex items-center space-x-1">
                                  {callStatus.status === 'idle' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCallVenue}
                                      className="h-8 px-3 text-xs bg-gradient-to-r from-green-400 to-blue-400 text-white border-none shadow rounded-full hover:scale-105"
                                      title="Call venue at +17165134580"
                                    >
                                      <Phone className="w-4 h-4 mr-1" />
                                      Call Venue
                                    </Button>
                                  )}
                                  {callStatus.status === 'calling' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      className="h-8 px-3 text-xs bg-blue-100 text-blue-700 border-blue-200 rounded-full shadow animate-pulse"
                                    >
                                      <Phone className="w-4 h-4 mr-1 animate-pulse" />
                                      Calling...
                                    </Button>
                                  )}
                                  {callStatus.status === 'connected' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleEndCall}
                                      className="h-8 px-3 text-xs bg-gradient-to-r from-red-400 to-pink-400 text-white border-none shadow rounded-full hover:scale-105"
                                      title="End call"
                                    >
                                      <Phone className="w-4 h-4 mr-1" />
                                      End Call
                                    </Button>
                                  )}
                                  {callStatus.status === 'error' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCallVenue}
                                      className="h-8 px-3 text-xs bg-gradient-to-r from-orange-400 to-yellow-400 text-white border-none shadow rounded-full hover:scale-105"
                                      title={`Retry call: ${callStatus.error}`}
                                    >
                                      <Phone className="w-4 h-4 mr-1" />
                                      Retry
                                    </Button>
                                  )}
                                </div>
                              )}
                              {/* Call Restaurant Button for Plan Meals task */}
                              {task.name === 'Plan Meals' && (
                                <div className="flex items-center space-x-1">
                                  {callStatus.status === 'idle' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCallRestaurant}
                                      className="h-8 px-3 text-xs bg-gradient-to-r from-green-400 to-blue-400 text-white border-none shadow rounded-full hover:scale-105"
                                      title="Call restaurant at +17165134580"
                                    >
                                      <Phone className="w-4 h-4 mr-1" />
                                      Call Restaurant
                                    </Button>
                                  )}
                                  {callStatus.status === 'calling' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      className="h-8 px-3 text-xs bg-blue-100 text-blue-700 border-blue-200 rounded-full shadow animate-pulse"
                                    >
                                      <Phone className="w-4 h-4 mr-1 animate-pulse" />
                                      Calling...
                                    </Button>
                                  )}
                                  {callStatus.status === 'connected' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleEndRestaurantCall}
                                      className="h-8 px-3 text-xs bg-gradient-to-r from-red-400 to-pink-400 text-white border-none shadow rounded-full hover:scale-105"
                                      title="End call"
                                    >
                                      <Phone className="w-4 h-4 mr-1" />
                                      End Call
                                    </Button>
                                  )}
                                  {callStatus.status === 'error' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCallRestaurant}
                                      className="h-8 px-3 text-xs bg-gradient-to-r from-orange-400 to-yellow-400 text-white border-none shadow rounded-full hover:scale-105"
                                      title={`Retry call: ${callStatus.error}`}
                                    >
                                      <Phone className="w-4 h-4 mr-1" />
                                      Retry
                                    </Button>
                                  )}
                                </div>
                              )}
                              {/* Marketing image generation button for Make marketing posts */}
                              {task.name === 'Make marketing posts' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs bg-gradient-to-r from-blue-400 to-black text-white border-none shadow rounded-full hover:scale-105"
                                  onClick={async () => {
                                    setGeneratingImages(true);
                                    setMarketingImages([]);
                                    try {
                                      const images = await generateMarketingImages({
                                        prompt: 'A blue and black themed poster for a Gen AI hackathon at Madison Square Garden, October 17-18, 2024, for 400 people max. Include all these details on the poster.',
                                        n: 1
                                      });
                                      setMarketingImages(images);
                                    } catch (e) {
                                      setMarketingImages([]);
                                    }
                                    setGeneratingImages(false);
                                  }}
                                  disabled={generatingImages}
                                >
                                  {generatingImages ? (
                                    <span className="flex items-center gap-2">
                                      <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                                          Generating...
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1"><LucideImage className="w-4 h-4 mr-1" /> Generate Images</span>
                                  )}
                                </Button>
                              )}
                              {/* Display generated marketing images below the task */}
                              {task.name === 'Make marketing posts' && marketingImages.length > 0 && (
                                <div className="flex flex-wrap gap-4 mt-4">
                                  {marketingImages.slice(0, 1).map((img, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                      <img src={img.url} alt="Marketing Poster" className="w-48 h-64 object-cover rounded-lg shadow-lg border border-blue-200" />
                                      <a href={img.url} download={`marketing-poster-${idx + 1}.png`} className="mt-2 text-xs text-blue-600 underline">Download</a>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {task.name === 'Make package' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs bg-gradient-to-r from-blue-500 to-green-500 text-white border-none shadow rounded-full hover:scale-105"
                                  onClick={handleGenerateSponsorshipDoc}
                                >
                                  Generate Sponsorship Doc
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 shadow"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                )
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
};
