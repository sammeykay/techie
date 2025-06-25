import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Users, Calendar, Plus, RefreshCw, Clock, User, CheckCircle, AlertCircle, Trash2, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { LogActivityModal } from './LogActivityModal';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  owner: number;
}

interface ProjectActivity {
  id: number;
  membership: number;
  description: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface ProjectMember {
  id: number;
  user_name: string;
  user_email: string;
  role: string;
  joined_at: string;
  is_active: boolean;
}

interface ProjectDashboardProps {
  project: Project;
  onBack: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ project, onBack }) => {
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState('');
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [project.id]);

  const loadProjectData = async () => {
    setIsLoading(true);
    try {
      const [activitiesResponse, membersResponse] = await Promise.all([
        apiService.getProjectActivities(project.id),
        apiService.getProjectMembers(project.id).catch(() => ({ results: [] }))
      ]);
      
      setActivities(activitiesResponse.results || activitiesResponse || []);
      setMembers(membersResponse.results || membersResponse || []);
    } catch (error) {
      console.error('Failed to load project data:', error);
      showError('Load Failed', 'Failed to load project dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogActivity = async (activityData: { description: string; membership?: number }) => {
    try {
      const newActivityRecord = await apiService.logProjectActivity({
        membership: activityData.membership || members[0]?.id || 1, // Default to first membership or 1
        description: activityData.description
      });
      
      setActivities(prev => [newActivityRecord, ...prev]);
      setIsLogModalOpen(false);
      showSuccess('Activity Logged', 'Your activity has been recorded successfully');
    } catch (error) {
      console.error('Failed to log activity:', error);
      showError('Log Failed', error instanceof Error ? error.message : 'Failed to log activity');
    }
  };

  const handleQuickAddActivity = async () => {
    if (!newActivity.trim()) return;

    setIsAddingActivity(true);
    try {
      await handleLogActivity({ description: newActivity.trim() });
      setNewActivity('');
    } catch (error) {
      console.error('Failed to add activity:', error);
    } finally {
      setIsAddingActivity(false);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      await apiService.deleteProjectActivity(activityId);
      setActivities(prev => prev.filter(a => a.id !== activityId));
      showSuccess('Activity Deleted', 'Activity has been removed successfully');
    } catch (error) {
      console.error('Failed to delete activity:', error);
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete activity');
    }
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const isProjectOwner = profile?.user.id === project.owner;

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <ArrowLeft size={16} />
          <span>Back to Projects</span>
        </Button>
      </div>

      <div className="text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent mb-4 leading-tight">
          {project.name}
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto lg:mx-0 leading-relaxed mb-6">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 rounded-full">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">
              Created {formatDate(project.created_at)}
            </span>
          </div>
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 rounded-full">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">
              {members.length} Team Members
            </span>
          </div>
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full">
            <Activity className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-800">
              {activities.length} Activities
            </span>
          </div>
        </div>
      </div>

      {/* Quick Add Activity */}
      <Card variant="elevated" className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="What did you work on today?"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuickAddActivity();
                  }
                }}
                disabled={isAddingActivity}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleQuickAddActivity}
                isLoading={isAddingActivity}
                disabled={!newActivity.trim() || isAddingActivity}
                variant="gradient"
                size="sm"
                className="shadow-lg"
              >
                Log Activity
              </Button>
              <Button
                onClick={() => setIsLogModalOpen(true)}
                variant="outline"
                size="sm"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Edit3 size={14} className="mr-1" />
                Detailed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Activities Feed */}
        <div className="xl:col-span-2">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                    <p className="text-sm text-gray-500">Latest project updates and progress</p>
                  </div>
                </div>
                <Button
                  onClick={loadProjectData}
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw size={16} />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium mb-2">No activities yet</p>
                  <p className="text-sm text-gray-400">
                    Start logging your project activities to track progress
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 group">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium leading-relaxed">
                          {activity.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <User className="w-4 h-4" />
                            <span>{activity.user_name || activity.user_email || 'Unknown User'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeAgo(activity.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      {(isProjectOwner || activity.user_email === profile?.user.email) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Members Sidebar */}
        <div>
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Team Members</h2>
                  <p className="text-sm text-gray-500">{members.length} active members</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">No team members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                      <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {member.user_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.user_email}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            member.role === 'project_manager' 
                              ? 'bg-purple-100 text-purple-800'
                              : member.role === 'team_member'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.role.replace('_', ' ')}
                          </span>
                          {member.is_active && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Activity Modal */}
      <LogActivityModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSubmit={handleLogActivity}
        members={members}
      />
    </div>
  );
};