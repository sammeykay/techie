import React, { useState, useEffect } from 'react';
import { Mail, Trash2, Bot, Plus, RefreshCw, Search, Filter, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { SmartReplyModal } from './SmartReplyModal';
import { EmailContentRenderer } from './EmailContentRenderer';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

export const EmailSummaries: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [selectedEmailForReply, setSelectedEmailForReply] = useState<any>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEmails, setExpandedEmails] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadEmails();
  }, []);

  // Listen for Gmail connection changes and refresh data
  useEffect(() => {
    const handleGmailConnectionChange = () => {
      if (profile?.connected_gmail) {
        loadEmails();
        refreshProfile();
      }
    };

    // Listen for window focus events (when user returns from Gmail auth)
    const handleWindowFocus = () => {
      if (!profile?.connected_gmail) {
        // Check if Gmail was connected while user was away
        setTimeout(() => {
          refreshProfile().then(() => {
            if (profile?.connected_gmail) {
              loadEmails();
            }
          });
        }, 1000);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [profile?.connected_gmail, refreshProfile]);

  const loadEmails = async () => {
    try {
      const response = await apiService.getEmailSummaries(1);
      console.log('Email summaries response:', response); // Debug log
      
      if (response.results) {
        console.log('Email summaries from results:', response.results); // Debug log
        setEmails(response.results);
      } else if (Array.isArray(response)) {
        console.log('Email summaries as array:', response); // Debug log
        setEmails(response);
      } else {
        console.log('No email summaries found in response'); // Debug log
        setEmails([]);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    try {
      const response = await apiService.connectGmail();
      if (response.auth_url) {
        // Open Gmail auth in a popup window
        const popup = window.open(
          response.auth_url, 
          'gmail-auth', 
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Poll for popup closure
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Wait a moment then refresh profile and emails
            setTimeout(async () => {
              await refreshProfile();
              await loadEmails();
              setIsLoading(false);
              // Show success toast only when Gmail is actually connected
              if (profile?.connected_gmail) {
                showSuccess('Gmail Connected', 'Successfully connected to your Gmail account');
              }
            }, 2000);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to connect Gmail:', error);
      showError('Gmail Connection Failed', error instanceof Error ? error.message : 'Failed to connect Gmail');
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleDeleteEmail = async (emailId: number) => {
    try {
      await apiService.deleteEmailSummary(emailId);
      setEmails(emails.filter(email => email.id !== emailId));
      showSuccess('Email Deleted', 'Email summary has been removed successfully');
    } catch (error) {
      console.error('Failed to delete email:', error);
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete email');
    }
  };

  const handleGenerateReply = (email: any) => {
    setSelectedEmailForReply(email);
    setIsReplyModalOpen(true);
  };

  const handleCloseReplyModal = () => {
    setIsReplyModalOpen(false);
    setSelectedEmailForReply(null);
  };

  const toggleEmailExpansion = (emailId: number) => {
    setExpandedEmails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
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

  const filteredEmails = emails.filter(email =>
    email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.summary_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const shouldShowConnectPrompt = !profile?.connected_gmail && emails.length === 0 && !isLoading;

  // Helper function to get summary text with fallback
  const getSummaryText = (email: any) => {
    console.log('Email object:', email); // Debug log
    
    // Try different possible field names for summary
    if (email.summary_text) {
      return email.summary_text;
    } else if (email.summary) {
      return email.summary;
    } else if (email.ai_summary) {
      return email.ai_summary;
    } else if (email.body && email.body.length > 0) {
      // If no summary, show truncated body as fallback
      return email.body.length > 200 ? `${email.body.substring(0, 200)}...` : email.body;
    } else {
      return 'No summary available - this email may need to be processed by AI to generate a summary.';
    }
  };

  if (shouldShowConnectPrompt) {
    return (
      <div className="space-y-8 w-full">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 px-4 py-2 rounded-full mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">AI Email Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 leading-tight">
            Email Summaries
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Connect your Gmail account to start receiving AI-powered email summaries and smart replies.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card variant="elevated" className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-0 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
            <CardContent className="p-8 sm:p-12 text-center relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Connect Your Gmail Account
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                Authorize Admin Copilot to access your Gmail and automatically generate 
                intelligent summaries of your important emails with AI-powered insights.
              </p>
              <Button
                onClick={handleConnectGmail}
                isLoading={isConnectingGmail}
                variant="gradient"
                size="lg"
                className="inline-flex items-center space-x-2 shadow-2xl hover:shadow-3xl"
              >
                <Plus size={20} />
                <span>Connect Gmail Account</span>
              </Button>
              {isConnectingGmail && (
                <p className="text-sm text-gray-500 mt-4">
                  Opening Gmail authorization window...
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="text-center lg:text-left">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 px-4 py-2 rounded-full mb-4 shadow-lg">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">AI Email Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4 leading-tight">
          Email Summaries
        </h1>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed">
            {profile?.connected_gmail 
              ? (
                <span className="flex items-center gap-2">
                  <span>AI-powered summaries from</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    {profile.connected_gmail}
                  </span>
                </span>
              )
              : 'AI-powered email summaries and smart replies'
            }
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search emails..."
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
          {!profile?.connected_gmail && (
            <Button
              onClick={handleConnectGmail}
              isLoading={isConnectingGmail}
              variant="secondary"
              className="inline-flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Connect Gmail</span>
            </Button>
          )}
          <Button
            onClick={loadEmails}
            variant="outline"
            className="inline-flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading your email summaries...</p>
            <p className="text-sm text-gray-500 mt-2">
              {profile?.connected_gmail ? 'Fetching latest emails...' : 'Checking Gmail connection...'}
            </p>
          </div>
        </div>
      ) : filteredEmails.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No matching emails found' : 'No Email Summaries Yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : profile?.connected_gmail
                  ? 'Email summaries will appear here as they are generated from your connected Gmail account.'
                  : 'Email summaries will appear here as they are generated from your Gmail account.'
              }
            </p>
            {!profile?.connected_gmail && !searchTerm && (
              <Button
                onClick={handleConnectGmail}
                isLoading={isConnectingGmail}
                variant="gradient"
                className="inline-flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Connect Gmail</span>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredEmails.map((email) => (
            <Card key={email.id} hover variant="elevated" className="group">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                          {email.subject || 'No Subject'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">
                          From: <span className="font-medium text-gray-800">{email.sender || 'Unknown Sender'}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(email.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="gradient"
                      onClick={() => handleGenerateReply(email)}
                      className="flex items-center space-x-1 shadow-lg hover:shadow-xl"
                    >
                      <Bot size={14} />
                      <span>Smart Reply</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteEmail(email.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-2xl p-6 border border-blue-100/50">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>AI Summary</span>
                    </h4>
                    <div className="text-gray-800 leading-relaxed text-base font-medium">
                      {getSummaryText(email)}
                    </div>
                  </div>
                  {email.body && (
                    <details 
                      className="group/details"
                      onToggle={(e) => {
                        if ((e.target as HTMLDetailsElement).open) {
                          toggleEmailExpansion(email.id);
                        } else {
                          setExpandedEmails(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(email.id);
                            return newSet;
                          });
                        }
                      }}
                    >
                      <summary className="flex items-center cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 mb-3">
                        <span>View original email content</span>
                      </summary>
                      <div className="mt-3">
                        <EmailContentRenderer 
                          content={email.body} 
                          subject={email.subject}
                        />
                      </div>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Smart Reply Modal */}
      <SmartReplyModal
        isOpen={isReplyModalOpen}
        onClose={handleCloseReplyModal}
        email={selectedEmailForReply}
      />
    </div>
  );
};