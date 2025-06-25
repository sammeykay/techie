import React, { useState } from 'react';
import { Activity, User } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ProjectMember {
  id: number;
  user_name: string;
  user_email: string;
  role: string;
}

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (activityData: { description: string; membership?: number }) => Promise<void>;
  members: ProjectMember[];
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  members
}) => {
  const [formData, setFormData] = useState({
    description: '',
    membership: members[0]?.id || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Activity description is required';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters';
    }

    if (members.length > 0 && !formData.membership) {
      newErrors.membership = 'Please select a team member';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        description: formData.description.trim(),
        membership: formData.membership ? Number(formData.membership) : undefined
      });
      // Reset form on success
      setFormData({ description: '', membership: members[0]?.id || '' });
      setErrors({});
    } catch (error) {
      console.error('Failed to log activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ description: '', membership: members[0]?.id || '' });
      setErrors({});
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Log Project Activity"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">
            Record your project progress and keep your team updated.
          </p>
        </div>

        <div className="space-y-4">
          {members.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="membership" className="block text-sm font-semibold text-gray-700">
                Team Member
              </label>
              <select
                id="membership"
                name="membership"
                value={formData.membership}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-purple-500 transition-all duration-200 bg-white ${
                  errors.membership ? 'border-red-300 focus:border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select team member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user_name} ({member.user_email}) - {member.role.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {errors.membership && (
                <p className="text-sm text-red-600 flex items-center space-x-1">
                  <span>⚠</span>
                  <span>{errors.membership}</span>
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
              Activity Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what you worked on, completed, or accomplished..."
              rows={4}
              required
              disabled={isSubmitting}
              className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-purple-500 transition-all duration-200 bg-white resize-none ${
                errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.description && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <span>⚠</span>
                <span>{errors.description}</span>
              </p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
          <h4 className="font-semibold text-purple-800 mb-2">Activity Examples:</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Completed user interface mockups for login page</li>
            <li>• Fixed critical bug in payment processing system</li>
            <li>• Conducted user research interviews with 5 participants</li>
            <li>• Reviewed and approved marketing campaign materials</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1 shadow-lg"
          >
            Log Activity
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};