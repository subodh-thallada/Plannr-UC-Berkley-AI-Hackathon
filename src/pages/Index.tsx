import { useState } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { ProjectPanel } from "@/components/ProjectPanel";
import { ProjectProvider } from "@/lib/project-context";

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
          {/* Left Panel - AI Chatbot */}
          <div className={`${
            isChatOpen ? 'fixed inset-0 z-40' : 'hidden'
          } lg:relative lg:flex lg:w-1/3 xl:w-1/4`}>
            <ChatPanel onClose={() => setIsChatOpen(false)} />
          </div>

          {/* Overlay for mobile */}
          {isChatOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsChatOpen(false)}
            />
          )}

          {/* Right Panel - Project Phases */}
          <div className="flex-1 lg:w-2/3 xl:w-3/4">
            <ProjectPanel />
          </div>
        </div>
      </div>
    </ProjectProvider>
  );
};

export default Index;
