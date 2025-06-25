import { tokenStorage, isTokenExpired } from '../utils/storage';
import { ApiError } from '../types/api';

const API_BASE_URL = 'https://b263-105-113-73-85.ngrok-free.app'; // Updated to production server

class ApiService {
  private baseURL: string;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = tokenStorage.getAccessToken();
    console.log('Getting auth headers, token exists:', !!token);
    
    if (!token) {
      throw new ApiError('No access token available');
    }

    // Check if token is expired and refresh if needed
    if (isTokenExpired(token)) {
      console.log('Token expired, refreshing...');
      await this.ensureValidToken();
      const newToken = tokenStorage.getAccessToken();
      if (!newToken) {
        throw new ApiError('Failed to refresh token');
      }
      return {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json',
      };
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async ensureValidToken(): Promise<void> {
    // If already refreshing, wait for the existing refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      console.log('Token refresh already in progress, waiting...');
      await this.refreshPromise;
      return;
    }

    // Start the refresh process
    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError('No refresh token available');
    }

    if (isTokenExpired(refreshToken)) {
      console.log('Refresh token also expired, clearing tokens');
      tokenStorage.clearTokens();
      throw new ApiError('Refresh token expired, please login again');
    }

    try {
      console.log('Performing token refresh...');
      const response = await this.request<{ access: string }>('/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      console.log('Token refresh successful, updating stored tokens...');
      tokenStorage.setTokens(response.access, refreshToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      tokenStorage.clearTokens();
      throw new ApiError('Token refresh failed, please login again');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('Making request to:', url, 'with options:', options);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      console.log('Response status:', response.status, 'statusText:', response.statusText);

      if (!response.ok) {
        let errorData: any = {};
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          errorData = await response.json();
          console.log('Error response data:', errorData);
        } catch (parseError) {
          console.log('Could not parse error response as JSON');
          // If we can't parse the error response, use the status text
          errorMessage = response.statusText || errorMessage;
        }

        // Extract meaningful error message from the response
        if (errorData) {
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'object') {
            // Handle field-specific validation errors
            const fieldErrors: string[] = [];
            Object.keys(errorData).forEach(field => {
              const fieldError = errorData[field];
              if (Array.isArray(fieldError)) {
                fieldErrors.push(`${field}: ${fieldError.join(', ')}`);
              } else if (typeof fieldError === 'string') {
                fieldErrors.push(`${field}: ${fieldError}`);
              }
            });
            if (fieldErrors.length > 0) {
              errorMessage = fieldErrors.join('; ');
            }
          }
        }

        throw new ApiError(errorMessage, errorData, response.status);
      }

      const responseData = await response.json();
      console.log('Successful response data:', responseData);
      return responseData;
    } catch (error) {
      console.error('API request failed:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error instanceof Error ? error.message : 'Network error occurred');
    }
  }

  private async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const maxRetries = 1;

    try {
      const headers = await this.getAuthHeaders();
      return await this.request<T>(endpoint, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });
    } catch (error) {
      console.error('Authenticated request failed:', error);

      // Check if it's a token-related error and we haven't exceeded retry limit
      if (error instanceof ApiError && retryCount < maxRetries) {
        const isTokenError = 
          error.status === 401 || 
          error.message.includes('token') ||
          error.message.includes('Given token not valid') ||
          error.message.includes('Token is invalid') ||
          error.message.includes('Authentication credentials were not provided');

        if (isTokenError) {
          console.log(`Token error detected (attempt ${retryCount + 1}/${maxRetries + 1}), attempting token refresh...`);
          
          try {
            // Force token refresh
            await this.ensureValidToken();
            
            // Retry the request with the new token
            console.log('Retrying request with refreshed token...');
            return await this.authenticatedRequest<T>(endpoint, options, retryCount + 1);
          } catch (refreshError) {
            console.error('Token refresh failed during retry:', refreshError);
            // Clear tokens and throw the original error
            tokenStorage.clearTokens();
            throw new ApiError('Session expired, please login again');
          }
        }
      }

      // If not a token error or we've exceeded retries, clear tokens if it's auth-related
      if (error instanceof ApiError && (
        error.message.includes('token') || 
        error.status === 401
      )) {
        console.log('Clearing tokens due to authentication failure');
        tokenStorage.clearTokens();
        throw new ApiError('Session expired, please login again');
      }

      throw error;
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    console.log('Login API call starting...');
    return this.request<any>('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  async teamMemberLogin(email: string, password: string) {
    console.log('Team member login API call starting...');
    return this.request<any>('/api/team-member-login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  async googleLogin(state: string) {
    console.log('Google OAuth login starting with state:', state);
    return this.request<{ auth_url: string }>('/api/auth/gmail/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
  }

  async handleGoogleCallback(state: string, code: string) {
    console.log('Handling Google OAuth callback...');
    return this.request<any>('/api/auth/gmail/callback/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, code }),
    });
  }

  async signup(email: string, password: string, firstName: string, lastName: string, agreedToTerms: boolean) {
    return this.request<any>('/api/auth/signup/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        agreed_to_terms: agreedToTerms,
      }),
    });
  }

  async verifyEmailOtp(email: string, otp: string) {
    return this.request<any>('/api/auth/verify-email-otp/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
  }

  async requestResetOtp(email: string) {
    return this.request<any>('/api/auth/request-reset-otp/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetOtp(email: string, otp: string, newPassword: string) {
    return this.request<any>('/api/auth/verify-reset-otp/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });
  }

  async refreshToken() {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError('No refresh token available');
    }

    try {
      console.log('Calling token refresh endpoint...');
      const response = await this.request<{ access: string }>('/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      console.log('Token refresh successful, updating stored tokens...');
      tokenStorage.setTokens(response.access, refreshToken);
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      tokenStorage.clearTokens();
      throw error;
    }
  }

  // Profile endpoints
  async getProfile() {
    return this.authenticatedRequest<any>('/api/profile/me/');
  }

  async updateProfile(profileData: FormData) {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      throw new ApiError('No access token available');
    }

    // Check if token is expired before making the request
    if (isTokenExpired(token)) {
      await this.ensureValidToken();
    }

    const currentToken = tokenStorage.getAccessToken();
    return this.request<any>('/api/profile/update_me/', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
      },
      body: profileData,
    });
  }

  // Gmail endpoints
  async connectGmail() {
    return this.authenticatedRequest<{ auth_url: string }>('/api/emails/connect-gmail/', {
      method: 'POST',
    });
  }

  async getEmailSummaries(page = 1) {
    return this.authenticatedRequest<any>(`/api/emails/emailsummaries/`);
  }

  async getEmailSummary(id: number) {
    return this.authenticatedRequest<any>(`/api/emails/emailsummaries/${id}/`);
  }

  async deleteEmailSummary(id: number) {
    return this.authenticatedRequest<void>(`/api/emails/emailsummaries/${id}/`, {
      method: 'DELETE',
    });
  }

  // Smart replies endpoints
  async getSmartReplies(page = 1) {
    return this.authenticatedRequest<any>(`/api/emails/smart-replies/`);
  }

  async generateSmartReply(emailSummaryId: number) {
    return this.authenticatedRequest<any>(`/api/emails/smart-replies/${emailSummaryId}/smart_reply/`, {
      method: 'POST',
    });
  }

  async saveSmartReply(emailSummaryId: number, replyText: string) {
    return this.authenticatedRequest<any>(`/api/emails/smart-replies/${emailSummaryId}/save_reply/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply_text: replyText }),
    });
  }

  // Meeting transcripts endpoints
  async getMeetingTranscripts(page = 1) {
    return this.authenticatedRequest<any>(`/api/meetings/meeting-transcripts/?page=${page}`);
  }

  async uploadMeetingTranscript(formData: FormData) {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      throw new ApiError('No access token available');
    }

    // Check if token is expired before making the request
    if (isTokenExpired(token)) {
      await this.ensureValidToken();
    }

    const currentToken = tokenStorage.getAccessToken();
    return this.request<any>('/api/meetings/meeting-transcripts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
      },
      body: formData,
    });
  }

  async transcribeAndSummarize(transcriptId: number) {
    return this.authenticatedRequest<any>(`/api/meetings/meeting-transcripts/${transcriptId}/transcribe-and-summarize/`, {
      method: 'POST',
    });
  }

  async deleteMeetingTranscript(id: number) {
    return this.authenticatedRequest<void>(`/api/meetings/meeting-transcripts/${id}/`, {
      method: 'DELETE',
    });
  }

  // Meeting summary history endpoints
  async getMeetingSummaries(page = 1) {
    return this.authenticatedRequest<any>(`/api/meetings/meeting-summary/?page=${page}`);
  }

  async getMeetingSummary(id: number) {
    return this.authenticatedRequest<any>(`/api/meetings/meeting-summary/${id}/`);
  }

  async deleteMeetingSummary(id: number) {
    return this.authenticatedRequest<void>(`/api/meetings/meeting-summary/${id}/`, {
      method: 'DELETE',
    });
  }

  // Project Management endpoints
  async getProjects() {
    return this.authenticatedRequest<any>('/api/projects/');
  }

  async createProject(projectData: { name: string; description: string }) {
    return this.authenticatedRequest<any>('/api/projects/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
  }

  async getProject(projectId: number) {
    return this.authenticatedRequest<any>(`/api/projects/${projectId}/`);
  }

  async updateProject(projectId: number, projectData: { name?: string; description?: string }) {
    return this.authenticatedRequest<any>(`/api/projects/${projectId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(projectId: number) {
    return this.authenticatedRequest<void>(`/api/projects/${projectId}/`, {
      method: 'DELETE',
    });
  }

  // Team member invitation endpoints
  async sendProjectInvite(inviteData: { project_id: number; email: string; role: string }) {
    return this.authenticatedRequest<any>('/api/projects/memberships/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inviteData),
    });
  }

  // Project activity endpoints
  async getProjectActivities(projectId: number) {
    return this.authenticatedRequest<any>(`/api/projects/dashboard/${projectId}/`);
  }

  async logProjectActivity(activityData: { membership: number; description: string }) {
    return this.authenticatedRequest<any>('/api/project-activities/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData),
    });
  }

  async deleteProjectActivity(activityId: number) {
    return this.authenticatedRequest<void>(`/api/project-activities/${activityId}/`, {
      method: 'DELETE',
    });
  }

  // Project members endpoints
  async getProjectMembers(projectId: number) {
    return this.authenticatedRequest<any>(`/api/projects/${projectId}/members/`);
  }
}

export const apiService = new ApiService(API_BASE_URL);