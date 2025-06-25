import React, { useState } from 'react';
import { UserPlus, Mail } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Project {
  id: number;
  name: string;
  description: string;
}

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inviteData: { email: string; role: string }) => Promise<void>;
  project: Project | null;
}

export const InviteTeamMemberModal: React.FC<InviteTeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  project
}) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'project_manager'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roles = [
    { value: 'project_manager', label: 'Project Manager', description: 'Can manage project activities and view dashboard' },
    { value: 'team_member', label: 'Team Member', description: 'Can log activities and view project updates' },
    { value: 'viewer', label: 'Viewer', description: 'Can only view project activities' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
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
        email: formData.email.trim(),
        role: formData.role
      });
      // Reset form on success
      setFormData({ email: '', role: 'project_manager' });
      setErrors({});
    } catch (error) {
      console.error('Failed to send invite:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ email: '', role: 'project_manager' });
      setErrors({});
      onClose();
    }
  };

  const selectedRole = roles.find(role => role.value === formData.role);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Team Member"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          {project && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Invite to: {project.name}
              </h3>
              <p className="text-gray-600 text-sm">
                Send an invitation to collaborate on this project
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            placeholder="Enter team member's email"
            icon={<Mail size={20} />}
            required
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              className={`block w-full px-4 py-3 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 bg-white ${
                errors.role ? 'border-red-300 focus:border-red-500' : 'border-gray-200'
              }`}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <span>⚠</span>
                <span>{errors.role}</span>
              </p>
            )}
            {selectedRole && (
              <p className="text-sm text-gray-600 mt-2">
                {selectedRole.description}
              </p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
          <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• An invitation email will be sent to the provided address</li>
            <li>• If they don't have an account, one will be created automatically</li>
            <li>• They'll receive login credentials and project access</li>
            <li>• You'll be notified when they join the project</li>
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
            Send Invitation
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