// API Types based on OpenAPI specification
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface UserProfile {
  user: User;
  connected_gmail: string | null;
  display_picture: string;
  profile_image: string | null;
  gmail_profile_picture_url: string | null;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User;
}

export interface EmailSummary {
  id: number;
  message_id: string;
  summary_text: string;
  body: string;
  subject: string | null;
  sender: string | null;
  thread_id: string | null;
  created_at: string;
  user: number;
}

export interface SmartReply {
  id: number;
  email_summary: number;
  reply_text: string;
}

export interface MeetingTranscript {
  id: number;
  uploaded_file: string;
  source: 'zoom' | 'meet' | 'upload';
  file_type: 'audio' | 'text';
  uploaded_at: string;
}

export interface MeetingSummary {
  id: number;
  key_points: string;
  action_items: string;
  follow_ups: string;
  generated_at: string;
  transcript: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export class ApiError extends Error {
  public details?: any;
  public status?: number;

  constructor(message: string, details?: any, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.details = details;
    this.status = status;
  }
}