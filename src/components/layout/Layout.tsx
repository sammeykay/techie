import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Dashboard } from '../dashboard/Dashboard';
import { EmailSummaries } from '../emails/EmailSummaries';
import { MeetingTranscripts } from '../meetings/MeetingTranscripts';
import { Projects } from '../projects/Projects';
import { Profile } from '../profile/Profile';

export const Layout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'emails':
        return <EmailSummaries />;
      case 'meetings':
        return <MeetingTranscripts />;
      case 'projects':
        return <Projects />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isMobileOpen={isSidebarOpen}
          onMobileToggle={setIsSidebarOpen}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header Spacer */}
          <div className="h-16 lg:hidden flex-shrink-0"></div>
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="h-full">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                <div className="w-full">
                  {renderContent()}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};