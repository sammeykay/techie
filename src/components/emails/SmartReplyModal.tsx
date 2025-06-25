import React, { useState, useEffect } from 'react';
import { Bot, Send, Edit3, Check, X, Loader, Sparkles, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { apiService } from '../../services/api';

interface SmartReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: any;
}

export const SmartReplyModal: React.FC<SmartReplyModalProps> = ({
  isOpen,
  onClose,
  email
}) => {
  const { showSuccess, showError } = useToast();
  const [smartReply, setSmartReply] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReply, setEditedReply] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && email) {
      generateReply();
    }
  }, [isOpen, email]);

  useEffect(() => {
    if (!isOpen) {
      setSmartReply('');
      setIsEditing(false);
      setEditedReply('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const generateReply = async () => {
    if (!email) return;

    setIsGenerating(true);
    setError('');
    setSuccess(false);

    try {
      const response = await apiService.generateSmartReply(email.id);
      
      let replyText = '';
      if (response.reply_text) {
        replyText = response.reply_text;
      } else if (response.reply) {
        replyText = response.reply;
      } else if (response.smart_reply) {
        replyText = response.smart_reply;
      } else if (response.text) {
        replyText = response.text;
      } else if (typeof response === 'string') {
        replyText = response;
      } else if (response.data && response.data.reply_text) {
        replyText = response.data.reply_text;
      }

      if (replyText) {
        setSmartReply(replyText);
        setEditedReply(replyText);
        showSuccess('Reply Generated', 'AI has created a smart reply for your email');
      } else {
        setError('No reply text received from server');
        showError('Generation Failed', 'No reply text received from server');
      }
    } catch (error) {
      console.error('Failed to generate smart reply:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate smart reply';
      setError(errorMessage);
      showError('Reply Generation Failed', errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedReply(smartReply);
  };

  const handleSaveEdit = () => {
    setSmartReply(editedReply);
    setIsEditing(false);
    showSuccess('Reply Updated', 'Your changes have been saved');
  };

  const handleCancelEdit = () => {
    setEditedReply(smartReply);
    setIsEditing(false);
  };

  const handleSend = async () => {
    if (!email || !smartReply) return;

    setIsSending(true);
    setError('');

    try {
      await apiService.saveSmartReply(email.id, smartReply);
      setSuccess(true);
      showSuccess('Reply Sent', 'Your smart reply has been saved successfully');
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to send reply:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reply';
      setError(errorMessage);
      showError('Send Failed', errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = () => {
    generateReply();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Reply Assistant"
      size="xl"
    >
      <div className="space-y-6">
        {/* Email Context */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-2">Replying to:</h3>
              <p className="font-medium text-gray-800 mb-1">{email?.subject || 'No Subject'}</p>
              <p className="text-sm text-gray-600">From: {email?.sender || 'Unknown Sender'}</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-green-800 font-semibold">Reply sent successfully!</p>
                <p className="text-sm text-green-600">This modal will close automatically.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <X className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-red-800 font-medium mb-2">{error}</p>
                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="text-center py-12">
            <div className="inline-flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <LoadingSpinner size="lg" className="absolute -top-2 -right-2" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold text-lg">Generating smart reply...</p>
                <p className="text-gray-600">AI is analyzing the email content and crafting a response</p>
              </div>
            </div>
          </div>
        )}

        {/* Reply Content */}
        {smartReply && !isGenerating && !success && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Generated Reply</h3>
              </div>
              <Button
                onClick={handleRegenerate}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw size={14} />
                <span>Regenerate</span>
              </Button>
            </div>

            <div className="border-2 border-gray-100 rounded-2xl overflow-hidden">
              {isEditing ? (
                <div className="p-6 bg-gray-50">
                  <textarea
                    value={editedReply}
                    onChange={(e) => setEditedReply(e.target.value)}
                    className="w-full h-48 p-4 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium"
                    placeholder="Edit your reply..."
                  />
                  <div className="flex space-x-3 mt-4">
                    <Button
                      onClick={handleSaveEdit}
                      variant="primary"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Check size={14} />
                      <span>Save Changes</span>
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 mb-6 border border-gray-100">
                    <div className="text-gray-900 whitespace-pre-wrap leading-relaxed text-base font-medium">
                      {smartReply}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleSend}
                      isLoading={isSending}
                      variant="gradient"
                      size="lg"
                      className="flex items-center justify-center space-x-2 flex-1 shadow-lg"
                    >
                      <Send size={16} />
                      <span>Send Reply</span>
                    </Button>
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                      size="lg"
                      className="flex items-center justify-center space-x-2"
                    >
                      <Edit3 size={16} />
                      <span>Edit Reply</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};