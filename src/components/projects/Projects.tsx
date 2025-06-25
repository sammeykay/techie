import React, { useState, useEffect } from 'react';
import { FolderPlus, Users, Activity, Settings, Search, Filter, RefreshCw, Sparkles, Plus, Eye, Edit, Trash2, UserPlus, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { CreateProjectModal } from './CreateProjectModal';
import { InviteTeamMemberModal } from './InviteTeamMemberModal';
import { ProjectDashboard } from './ProjectDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  owner: number;
  member_count?: number;
  activity_count?: number;
  last_activity?: string;
}

export const Projects: React.FC = () => {
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [projectForInvite, setProjectForInvite] = useState<Project | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'dashboard'>('list');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await apiService.getProjects();
      // Ensure we always set an array
      let projectsArray: Project[] = [];
      
      if (Array.isArray(response)) {
        projectsArray = response;
      } else if (response && Array.isArray(response.results)) {
        projectsArray = response.results;
      } else if (response && typeof response === 'object') {
        // If response is an object but not an array, wrap it in an array
        projectsArray = [response as Project];
      }
      
      setProjects(projectsArray);
    } catch (error) {
      console.error('Failed to load projects:', error);
      showError('Load Failed', 'Failed to load projects');
      // Ensure projects is always an array even on error
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (projectData: { name: string; description: string }) => {
    try {
      const newProject = await apiService.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      setIsCreateModalOpen(false);
      showSuccess('Project Created', `${projectData.name} has been created successfully`);
    } catch (error) {
      console.error('Failed to create project:', error);
      showError('Creation Failed', error instanceof Error ? error.message : 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setActiveView('list');
      }
      showSuccess('Project Deleted', 'Project has been removed successfully');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete project');
    }
  };

  const handleInviteTeamMember = (project: Project) => {
    setProjectForInvite(project);
    setIsInviteModalOpen(true);
  };

  const handleSendInvite = async (inviteData: { email: string; role: string }) => {
    if (!projectForInvite) return;

    try {
      await apiService.sendProjectInvite({
        project_id: projectForInvite.id,
        email: inviteData.email,
        role: inviteData.role
      });
      setIsInviteModalOpen(false);
      setProjectForInvite(null);
      showSuccess('Invite Sent', `Invitation sent to ${inviteData.email}`);
    } catch (error) {
      console.error('Failed to send invite:', error);
      showError('Invite Failed', error instanceof Error ? error.message : 'Failed to send invitation');
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setActiveView('dashboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activeView === 'dashboard' && selectedProject) {
    return (
      <ProjectDashboard
        project={selectedProject}
        onBack={() => {
          setActiveView('list');
          setSelectedProject(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="text-center lg:text-left">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 px-4 py-2 rounded-full mb-4 shadow-lg">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-800">Project Management</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent mb-4 leading-tight">
          Projects
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto lg:mx-0 leading-relaxed">
          Create, manage, and collaborate on projects with your team members.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={20} />}
            variant="floating"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="ghost" className="inline-flex items-center space-x-2">
            <Filter size={16} />
            <span>Filter</span>
          </Button>
          <Button
            onClick={loadProjects}
            variant="outline"
            className="inline-flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="gradient"
            className="inline-flex items-center space-x-2 shadow-lg"
          >
            <Plus size={16} />
            <span>Create Project</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading your projects...</p>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderPlus className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No matching projects found' : 'No Projects Yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first project to start collaborating with your team.'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant="gradient"
                className="inline-flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Your First Project</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} hover variant="elevated" className="group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <FolderPlus className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1 group-hover:text-emerald-600 transition-colors duration-300">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Created {formatDate(project.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewProject(project)}
                      className="p-2 hover:bg-emerald-50 text-emerald-600"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProject(project.id)}
                      className="p-2 hover:bg-red-50 text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                  
                  {/* Project Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">
                          {project.member_count || 0} Members
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-800">
                          {project.activity_count || 0} Activities
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Last Activity */}
                  {project.last_activity && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-600">
                          Last activity: {formatDate(project.last_activity)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="gradient"
                      onClick={() => handleViewProject(project)}
                      className="flex-1 shadow-lg"
                    >
                      <Eye size={14} className="mr-1" />
                      View Dashboard
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInviteTeamMember(project)}
                      className="flex items-center space-x-1"
                    >
                      <UserPlus size={14} />
                      <span>Invite</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      <InviteTeamMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setProjectForInvite(null);
        }}
        onSubmit={handleSendInvite}
        project={projectForInvite}
      />
    </div>
  );
};