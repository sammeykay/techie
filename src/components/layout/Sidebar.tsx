import React from 'react';
import { 
  Home, 
  Mail, 
  Mic, 
  User, 
  LogOut,
  Bot,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileOpen: boolean;
  onMobileToggle: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  isMobileOpen, 
  onMobileToggle 
}) => {
  const { logout, profile } = useAuth();

  const navigation = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Home, 
      description: 'Overview & insights',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'emails', 
      label: 'Email Summaries', 
      icon: Mail, 
      description: 'AI-powered summaries',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'meetings', 
      label: 'Meeting Transcripts', 
      icon: Mic, 
      description: 'Transcribe & analyze',
      gradient: 'from-emerald-500 to-teal-500'
    },
    { 
      id: 'projects', 
      label: 'Projects', 
      icon: FolderOpen, 
      description: 'Team collaboration',
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User, 
      description: 'Account settings',
      gradient: 'from-indigo-500 to-purple-500'
    },
  ];

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    onMobileToggle(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => onMobileToggle(!isMobileOpen)}
          className="p-3 rounded-2xl bg-white/95 backdrop-blur-xl shadow-xl border border-white/20 text-gray-700 hover:text-gray-900 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-300"
          onClick={() => onMobileToggle(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 sm:w-72 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-all duration-300 ease-out border-r border-gray-100/50
        lg:translate-x-0 lg:static lg:inset-0 lg:w-72 lg:flex-shrink-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-6 lg:p-8 border-b border-gray-100/50">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Admin Copilot
                </h1>
                <p className="text-sm text-gray-500 font-medium">AI-Powered Assistant</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 lg:p-6 space-y-3 overflow-y-auto">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`group w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 text-blue-700 shadow-xl border-2 border-blue-100/50 scale-[1.02]'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 hover:text-gray-900 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-110` 
                          : 'bg-gray-100 group-hover:bg-gray-200 group-hover:scale-105'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm leading-tight">{item.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className={`transition-all duration-300 ${
                      isActive ? 'rotate-90 text-blue-600' : 'group-hover:translate-x-1 group-hover:text-blue-500'
                    }`} />
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User Profile Section */}
          <div className="p-4 lg:p-6 border-t border-gray-100/50 bg-gradient-to-r from-gray-50/50 to-blue-50/30">
            {profile && (
              <div className="flex items-center space-x-4 mb-4 p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-white/50">
                <div className="relative flex-shrink-0">
                  <img
                    src={profile.display_picture || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face&auto=format`}
                    alt="Profile"
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {profile.user.first_name} {profile.user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate font-medium">
                    {profile.user.email}
                  </p>
                </div>
              </div>
            )}
            
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 rounded-2xl transition-all duration-300 group hover:shadow-lg"
            >
              <div className="p-2 rounded-xl bg-gray-100 group-hover:bg-red-100 transition-all duration-300 group-hover:scale-105">
                <LogOut size={18} />
              </div>
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};