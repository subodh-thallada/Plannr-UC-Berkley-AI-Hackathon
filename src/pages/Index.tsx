import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { ProjectPanel } from "@/components/ProjectPanel";
import { ProjectProvider } from "@/lib/project-context";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <ProjectProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
        {/* Mobile Chat Toggle */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-screen">
          {/* Desktop: Resizable Panels */}
          <div className="hidden lg:flex w-full">
            <ResizablePanelGroup direction="horizontal" className="w-full h-screen">
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50} className="h-full">
                <ChatPanel />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={70} minSize={50} className="h-full">
                <ProjectPanel />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Mobile: Modal ChatPanel */}
          <div className={`${
            isChatOpen ? 'fixed inset-0 z-40' : 'hidden'
          } lg:hidden`}>
            <ChatPanel onClose={() => setIsChatOpen(false)} />
          </div>

          {/* Overlay for mobile */}
          {isChatOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsChatOpen(false)}
            />
          )}

          {/* Mobile: ProjectPanel always visible */}
          <div className="flex-1 lg:hidden">
            <ProjectPanel />
          </div>
        </div>
      </div>
    </ProjectProvider>
  );
};

export default Index;
