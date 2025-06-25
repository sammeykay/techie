import React, { useState, useEffect } from 'react';
import { Mail, Mic, TrendingUp, Clock, CheckCircle, ArrowUpRight, Zap, Users, Calendar, Sparkles, Plus, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalEmails: 0,
    totalMeetings: 0,
    totalSmartReplies: 0,
    gmailConnected: false
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setIsLoadingStats(true);
    
    try {
      // Load all data in parallel
      const [emailsResponse, meetingsResponse, smartRepliesResponse] = await Promise.all([
        apiService.getEmailSummaries(1).catch(() => ({ results: [], count: 0 })),
        apiService.getMeetingTranscripts(1).catch(() => ({ results: [], count: 0 })),
        apiService.getSmartReplies(1).catch(() => ({ results: [], count: 0 }))
      ]);

      console.log('Dashboard API responses:', {
        emails: emailsResponse,
        meetings: meetingsResponse,
        smartReplies: smartRepliesResponse
      });

      // Calculate counts from actual data
      const emailCount = emailsResponse.results ? emailsResponse.results.length : 0;
      const meetingCount = meetingsResponse.results ? meetingsResponse.results.length : 0;
      const smartReplyCount = smartRepliesResponse.results ? smartRepliesResponse.results.length : 0;

      // Update stats with real data
      setStats({
        totalEmails: emailCount,
        totalMeetings: meetingCount,
        totalSmartReplies: smartReplyCount,
        gmailConnected: !!profile?.connected_gmail
      });

      // Combine recent activities from all sources
      const recentEmails = (emailsResponse.results || []).slice(0, 5).map((email: any) => ({
        id: `email-${email.id}`,
        type: 'email',
        title: email.subject || 'Email Summary',
        subtitle: `From: ${email.sender || 'Unknown Sender'}`,
        description: email.summary_text ? 
          (email.summary_text.length > 100 ? `${email.summary_text.substring(0, 100)}...` : email.summary_text) :
          'AI summary generated',
        time: email.created_at,
        icon: Mail,
        color: 'blue'
      }));

      const recentMeetings = (meetingsResponse.results || []).slice(0, 5).map((meeting: any) => ({
        id: `meeting-${meeting.id}`,
        type: 'meeting',
        title: 'Meeting Transcript',
        subtitle: `Source: ${meeting.source || 'Upload'}`,
        description: `${meeting.file_type === 'audio' ? 'Audio file' : 'Text document'} uploaded`,
        time: meeting.uploaded_at,
        icon: Mic,
        color: 'purple'
      }));

      const recentReplies = (smartRepliesResponse.results || []).slice(0, 5).map((reply: any) => ({
        id: `reply-${reply.id}`,
        type: 'reply',
        title: 'Smart Reply Generated',
        subtitle: `Email ID: ${reply.email_summary}`,
        description: reply.reply_text ? 
          (reply.reply_text.length > 100 ? `${reply.reply_text.substring(0, 100)}...` : reply.reply_text) :
          'AI-powered response created',
        time: reply.created_at || new Date().toISOString(),
        icon: Bot,
        color: 'emerald'
      }));

      // Combine and sort all activities by time
      const combined = [...recentEmails, ...recentMeetings, ...recentReplies]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 8); // Show top 8 most recent activities

      setRecentActivity(combined);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingStats(false);
    }
  };

  const statCards = [
    {
      title: 'Email Summaries',
      value: stats.totalEmails,
      icon: Mail,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      change: stats.totalEmails > 0 ? `${stats.totalEmails} total` : 'No data',
      changeType: stats.totalEmails > 0 ? 'positive' : 'neutral'
    },
    {
      title: 'Meeting Transcripts',
      value: stats.totalMeetings,
      icon: Mic,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      change: stats.totalMeetings > 0 ? `${stats.totalMeetings} total` : 'No data',
      changeType: stats.totalMeetings > 0 ? 'positive' : 'neutral'
    },
    {
      title: 'Smart Replies',
      value: stats.totalSmartReplies,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      change: stats.totalSmartReplies > 0 ? `${stats.totalSmartReplies} total` : 'No data',
      changeType: stats.totalSmartReplies > 0 ? 'positive' : 'neutral'
    },
    {
      title: 'Gmail Status',
      value: stats.gmailConnected ? 'Connected' : 'Disconnected',
      icon: CheckCircle,
      gradient: stats.gmailConnected ? 'from-green-500 to-emerald-500' : 'from-gray-400 to-gray-500',
      bgGradient: stats.gmailConnected ? 'from-green-50 to-emerald-50' : 'from-gray-50 to-gray-100',
      change: stats.gmailConnected ? 'Active' : 'Inactive',
      changeType: stats.gmailConnected ? 'positive' : 'neutral'
    }
  ];

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

  const handleConnectGmail = async () => {
    try {
      const response = await apiService.connectGmail();
      if (response.auth_url) {
        window.open(response.auth_url, '_blank', 'width=500,height=600');
      }
    } catch (error) {
      console.error('Failed to connect Gmail:', error);
    }
  };

  const getActivityColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-100 group-hover:bg-blue-200',
        text: 'text-blue-600',
        hover: 'group-hover:text-blue-600'
      },
      purple: {
        bg: 'bg-purple-100 group-hover:bg-purple-200',
        text: 'text-purple-600',
        hover: 'group-hover:text-purple-600'
      },
      emerald: {
        bg: 'bg-emerald-100 group-hover:bg-emerald-200',
        text: 'text-emerald-600',
        hover: 'group-hover:text-emerald-600'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header Section */}
      <div className="text-center lg:text-left">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 px-4 py-2 rounded-full mb-6 shadow-lg">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">AI-Powered Dashboard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 leading-tight">
          Welcome back, {profile?.user.first_name}!
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto lg:mx-0 leading-relaxed">
          Here's your productivity overview and recent AI-powered insights.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} hover variant="elevated" className={`bg-gradient-to-br ${stat.bgGradient} border-0 overflow-hidden relative group`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-r ${stat.gradient} shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    stat.changeType === 'positive' ? 'bg-green-100 text-green-800' :
                    stat.changeType === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">{stat.title}</p>
                  <p className="text-2xl xl:text-3xl font-bold text-gray-900">
                    {isLoadingStats ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <Card variant="elevated" className="h-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                    <p className="text-sm text-gray-500">Your latest AI interactions</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <span>View All</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 rounded-2xl">
                      <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Start by connecting Gmail or uploading meetings
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    const colorClasses = getActivityColorClasses(activity.color);
                    return (
                      <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 group cursor-pointer">
                        <div className={`p-3 rounded-2xl ${colorClasses.bg} transition-colors duration-200 flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${colorClasses.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-gray-900 truncate ${colorClasses.hover} transition-colors duration-200`}>
                            {activity.title}
                          </h3>
                          <p className="text-sm text-gray-600 truncate mb-1">{activity.subtitle}</p>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                            {activity.description}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500 font-medium flex-shrink-0">
                          {formatTimeAgo(activity.time)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          {/* Gmail Connect Card - Only show if Gmail is NOT connected */}
          {!profile?.connected_gmail && (
            <Card hover variant="elevated" className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-0 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/30 to-transparent rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
              <CardContent className="p-6 relative">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Connect Gmail</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    Start receiving AI-powered email summaries and smart replies
                  </p>
                  <Button 
                    variant="gradient" 
                    size="sm" 
                    className="w-full shadow-lg"
                    onClick={handleConnectGmail}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gmail Connected Status Card - Only show if Gmail IS connected */}
          {profile?.connected_gmail && (
            <Card variant="elevated" className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-0 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/30 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
              <CardContent className="p-6 relative">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Gmail Connected</h3>
                  <p className="text-gray-600 text-sm mb-2 leading-relaxed">
                    Successfully connected to {profile.connected_gmail}
                  </p>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meeting Upload Card */}
          <Card hover variant="elevated" className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/30 to-transparent rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
            <CardContent className="p-6 relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Upload Meeting</h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  Transcribe and get AI insights from your recordings
                </p>
                <Button variant="gradient" size="sm" className="w-full shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pro Tip Card */}
          <Card variant="glass" className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-semibold text-emerald-800">Pro Tip</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {profile?.connected_gmail 
                  ? `You have ${stats.totalEmails} email summaries and ${stats.totalSmartReplies} smart replies. Check the Email Summaries section for more insights.`
                  : "Connect multiple email accounts to get comprehensive AI insights across all your communications."
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};