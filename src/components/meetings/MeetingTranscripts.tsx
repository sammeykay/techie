import React, { useState, useEffect, useRef } from 'react';
import { Upload, Mic, FileText, Download, Trash2, Play, FileAudio, File, AlertCircle, CheckCircle, X, RefreshCw, Search, Filter, Sparkles, AlertTriangle, Info, ExternalLink, FileImage, Archive, Video } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useToast } from '../ui/Toast';
import { apiService } from '../../services/api';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileTypeInfo {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  label: string;
  description: string;
}

export const MeetingTranscripts: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [showServerIssues, setShowServerIssues] = useState(false);
  const [serverHasIssues, setServerHasIssues] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcripts' | 'summaries'>('transcripts');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced file type mapping with detailed information
  const getFileTypeInfo = (fileName: string): FileTypeInfo => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const fileTypeMap: Record<string, FileTypeInfo> = {
      // Audio files
      'mp3': {
        icon: FileAudio,
        color: 'purple-600',
        bgColor: 'purple-100',
        label: 'MP3 Audio',
        description: 'MPEG Audio Layer 3'
      },
      'wav': {
        icon: FileAudio,
        color: 'purple-600',
        bgColor: 'purple-100',
        label: 'WAV Audio',
        description: 'Waveform Audio File'
      },
      'm4a': {
        icon: FileAudio,
        color: 'purple-600',
        bgColor: 'purple-100',
        label: 'M4A Audio',
        description: 'MPEG-4 Audio'
      },
      'aac': {
        icon: FileAudio,
        color: 'purple-600',
        bgColor: 'purple-100',
        label: 'AAC Audio',
        description: 'Advanced Audio Coding'
      },
      'flac': {
        icon: FileAudio,
        color: 'purple-600',
        bgColor: 'purple-100',
        label: 'FLAC Audio',
        description: 'Free Lossless Audio Codec'
      },
      
      // Document files
      'pdf': {
        icon: FileText,
        color: 'red-600',
        bgColor: 'red-100',
        label: 'PDF Document',
        description: 'Portable Document Format'
      },
      'doc': {
        icon: FileText,
        color: 'blue-600',
        bgColor: 'blue-100',
        label: 'Word Document',
        description: 'Microsoft Word 97-2003'
      },
      'docx': {
        icon: FileText,
        color: 'blue-600',
        bgColor: 'blue-100',
        label: 'Word Document',
        description: 'Microsoft Word'
      },
      'txt': {
        icon: FileText,
        color: 'gray-600',
        bgColor: 'gray-100',
        label: 'Text File',
        description: 'Plain Text Document'
      },
      'rtf': {
        icon: FileText,
        color: 'orange-600',
        bgColor: 'orange-100',
        label: 'RTF Document',
        description: 'Rich Text Format'
      },
      
      // Video files (if supported in future)
      'mp4': {
        icon: Video,
        color: 'indigo-600',
        bgColor: 'indigo-100',
        label: 'MP4 Video',
        description: 'MPEG-4 Video'
      },
      'mov': {
        icon: Video,
        color: 'indigo-600',
        bgColor: 'indigo-100',
        label: 'MOV Video',
        description: 'QuickTime Movie'
      }
    };

    return fileTypeMap[extension] || {
      icon: File,
      color: 'gray-600',
      bgColor: 'gray-100',
      label: 'Unknown File',
      description: 'Unsupported file type'
    };
  };

  // Supported file formats with their details
  const supportedFormats = {
    audio: {
      extensions: ['.mp3', '.wav', '.m4a', '.aac', '.flac'],
      mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/flac'],
      icon: FileAudio,
      color: 'purple',
      description: 'Audio files for transcription'
    },
    document: {
      extensions: ['.txt', '.doc', '.docx', '.pdf', '.rtf'],
      mimeTypes: [
        'text/plain', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf',
        'application/rtf',
        'text/rtf'
      ],
      icon: FileText,
      color: 'blue',
      description: 'Text documents and transcripts'
    }
  };

  // Dynamic file size limits based on server status
  const getMaxFileSize = () => {
    if (serverHasIssues) {
      return 2 * 1024 * 1024; // 2MB when server has issues
    }
    return 100 * 1024 * 1024; // 100MB when server is working properly
  };

  const getMaxAudioSize = () => {
    if (serverHasIssues) {
      return 1 * 1024 * 1024; // 1MB when server has issues
    }
    return 50 * 1024 * 1024; // 50MB for audio when server is working
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadTranscripts(), loadSummaries()]);
  };

  const loadTranscripts = async () => {
    try {
      setServerError(null);
      setShowServerIssues(false);
      const response = await apiService.getMeetingTranscripts(1);
      setTranscripts(response.results || []);
      // If we successfully load transcripts, server seems to be working
      setServerHasIssues(false);
    } catch (error) {
      console.error('Failed to load transcripts:', error);
      if (error instanceof Error) {
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
          setServerError('Server connection issues detected');
          setShowServerIssues(true);
          setServerHasIssues(true);
        } else {
          setServerError(`Failed to load transcripts: ${error.message}`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummaries = async () => {
    try {
      const response = await apiService.getMeetingSummaries(1);
      setSummaries(response.results || []);
    } catch (error) {
      console.error('Failed to load summaries:', error);
    }
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxFileSize = getMaxFileSize();
    const maxAudioSize = getMaxAudioSize();
    
    // Check file extension first
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allExtensions = [...supportedFormats.audio.extensions, ...supportedFormats.document.extensions];
    
    if (!allExtensions.includes(extension)) {
      return { 
        valid: false, 
        error: `Unsupported file format "${extension}". Supported formats: ${allExtensions.join(', ')}` 
      };
    }

    // Check file size based on type
    const isAudio = supportedFormats.audio.extensions.includes(extension);
    const sizeLimit = isAudio ? maxAudioSize : maxFileSize;
    const sizeLimitMB = (sizeLimit / 1024 / 1024).toFixed(0);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);

    if (file.size > sizeLimit) {
      const fileType = isAudio ? 'Audio' : 'File';
      const serverStatus = serverHasIssues ? ' (reduced due to server issues)' : '';
      return { 
        valid: false, 
        error: `${fileType} size exceeds ${sizeLimitMB}MB limit${serverStatus} (current: ${fileSizeMB}MB)${serverHasIssues ? '. Try a smaller file or wait for server issues to be resolved.' : ''}` 
      };
    }

    // Additional validation for specific file types
    if (extension === '.docx' || extension === '.doc') {
      // Word documents should be reasonable size for text content
      const maxDocSize = Math.min(sizeLimit, 25 * 1024 * 1024); // Max 25MB for Word docs
      if (file.size > maxDocSize) {
        return {
          valid: false,
          error: `Word document is too large (${fileSizeMB}MB). Maximum recommended size for documents is ${(maxDocSize / 1024 / 1024).toFixed(0)}MB.`
        };
      }
    }

    return { valid: true };
  };

  const getFileType = (file: File): 'audio' | 'document' => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (supportedFormats.audio.extensions.includes(extension)) {
      return 'audio';
    }
    return 'document';
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Clear any previous server errors
    setServerError(null);
    setShowServerIssues(false);

    // Validate all files first
    fileArray.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      showError('Upload Validation Failed', `${errors.length} file(s) failed validation`);
    }

    // Upload valid files
    for (const file of validFiles) {
      const progressItem: FileUploadProgress = {
        file,
        progress: 0,
        status: 'uploading'
      };

      setUploadProgress(prev => [...prev, progressItem]);

      try {
        const formData = new FormData();
        formData.append('uploaded_file', file);
        formData.append('source', 'upload');
        formData.append('file_type', getFileType(file));

        // Simulate progress updates (since we can't track real progress with current API)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => 
            prev.map(item => 
              item.file === file && item.progress < 90
                ? { ...item, progress: item.progress + 10 }
                : item
            )
          );
        }, 200);

        const response = await apiService.uploadMeetingTranscript(formData);
        
        clearInterval(progressInterval);
        
        // Update progress to complete
        setUploadProgress(prev => 
          prev.map(item => 
            item.file === file
              ? { ...item, progress: 100, status: 'success' }
              : item
          )
        );

        // Add to transcripts list
        setTranscripts(prev => [response, ...prev]);

        // If upload succeeds, server is working properly
        setServerHasIssues(false);

        // Show success toast
        showSuccess('File Uploaded', `${file.name} has been uploaded successfully`);

        // Remove from progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => prev.filter(item => item.file !== file));
        }, 3000);

      } catch (error) {
        clearInterval(progressInterval);
        console.error('Failed to upload file:', error);
        
        let errorMessage = 'Upload failed';
        if (error instanceof Error) {
          if (error.message.includes('413') || error.message.includes('Request Entity Too Large')) {
            errorMessage = 'File too large for server (413 error). Server may have upload size restrictions.';
            setShowServerIssues(true);
            setServerHasIssues(true);
          } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Server connection error (CORS/Network issue)';
            setShowServerIssues(true);
            setServerHasIssues(true);
          } else {
            errorMessage = error.message;
          }
        }
        
        setUploadProgress(prev => 
          prev.map(item => 
            item.file === file
              ? { 
                  ...item, 
                  status: 'error', 
                  error: errorMessage
                }
              : item
          )
        );

        // Show error toast
        showError('Upload Failed', `Failed to upload ${file.name}: ${errorMessage}`);

        // Remove from progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => prev.filter(item => item.file !== file));
        }, 8000);
      }
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleTranscribeAndSummarize = async (transcript: any) => {
    setProcessingId(transcript.id);
    try {
      const response = await apiService.transcribeAndSummarize(transcript.id);
      setSummary(response);
      setSelectedTranscript(transcript);
      showSuccess('Processing Complete', 'AI has generated summary and insights for your meeting');
      // Reload summaries to include the new one
      await loadSummaries();
    } catch (error) {
      console.error('Failed to process transcript:', error);
      showError('Processing Failed', error instanceof Error ? error.message : 'Failed to process transcript');
      if (error instanceof Error && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
        setShowServerIssues(true);
        setServerHasIssues(true);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteTranscript = async (transcriptId: number) => {
    if (!confirm('Are you sure you want to delete this transcript?')) {
      return;
    }

    try {
      await apiService.deleteMeetingTranscript(transcriptId);
      setTranscripts(transcripts.filter(t => t.id !== transcriptId));
      if (selectedTranscript?.id === transcriptId) {
        setSelectedTranscript(null);
        setSummary(null);
      }
      showSuccess('Transcript Deleted', 'Meeting transcript has been removed successfully');
    } catch (error) {
      console.error('Failed to delete transcript:', error);
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete transcript');
    }
  };

  const handleDeleteSummary = async (summaryId: number) => {
    if (!confirm('Are you sure you want to delete this summary?')) {
      return;
    }

    try {
      await apiService.deleteMeetingSummary(summaryId);
      setSummaries(summaries.filter(s => s.id !== summaryId));
      showSuccess('Summary Deleted', 'Meeting summary has been removed successfully');
    } catch (error) {
      console.error('Failed to delete summary:', error);
      showError('Delete Failed', error instanceof Error ? error.message : 'Failed to delete summary');
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'zoom':
        return <Mic className="w-4 h-4" />;
      case 'meet':
        return <Mic className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1] || 'Unknown File';
      // Truncate long file names
      return fileName.length > 30 ? `${fileName.substring(0, 27)}...` : fileName;
    } catch {
      return 'Unknown File';
    }
  };

  const filteredTranscripts = transcripts.filter(transcript => {
    const searchLower = searchTerm.toLowerCase();
    const fileName = getFileNameFromUrl(transcript.uploaded_file);
    return (
      transcript.source?.toLowerCase().includes(searchLower) ||
      transcript.file_type?.toLowerCase().includes(searchLower) ||
      fileName.toLowerCase().includes(searchLower) ||
      formatDate(transcript.uploaded_at).toLowerCase().includes(searchLower)
    );
  });

  const filteredSummaries = summaries.filter(summary => {
    const searchLower = searchTerm.toLowerCase();
    return (
      summary.key_points?.toLowerCase().includes(searchLower) ||
      summary.action_items?.toLowerCase().includes(searchLower) ||
      summary.follow_ups?.toLowerCase().includes(searchLower) ||
      formatDate(summary.generated_at).toLowerCase().includes(searchLower)
    );
  });

  const getCurrentFileSizeLimits = () => {
    const maxFile = getMaxFileSize();
    const maxAudio = getMaxAudioSize();
    return {
      general: `${(maxFile / 1024 / 1024).toFixed(0)}MB`,
      audio: `${(maxAudio / 1024 / 1024).toFixed(0)}MB`,
      status: serverHasIssues ? 'reduced due to server issues' : 'normal operation'
    };
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="text-center lg:text-left">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 px-4 py-2 rounded-full mb-4 shadow-lg">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">AI Meeting Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent mb-4 leading-tight">
          Meeting Transcripts
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto lg:mx-0 leading-relaxed">
          Upload and transcribe your meeting recordings with AI-powered summaries and insights.
        </p>
      </div>

      {/* Server Issues Alert */}
      {showServerIssues && (
        <Card variant="elevated" className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Server Configuration Issues Detected</h3>
                <div className="text-orange-700 space-y-2">
                  <p>We've detected the following server-side issues that are affecting file uploads:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>CORS Policy:</strong> Cross-origin requests are being blocked</li>
                    <li><strong>File Size Limit:</strong> Server returns 413 "Request Entity Too Large" errors</li>
                    <li><strong>Network Issues:</strong> Connection failures to the API server</li>
                  </ul>
                  <div className="mt-4 p-4 bg-orange-100 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">Current Status:</h4>
                    <p className="text-sm">
                      File size limits have been automatically reduced to ensure uploads work. 
                      Normal limits will be restored when server issues are resolved.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                      <li>Current limit: {getCurrentFileSizeLimits().general} for documents, {getCurrentFileSizeLimits().audio} for audio</li>
                      <li>Normal limit: 100MB for documents, 50MB for audio</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button
                    onClick={() => setShowServerIssues(false)}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 border-orange-300 hover:bg-orange-100"
                  >
                    Dismiss
                  </Button>
                  <Button
                    onClick={loadTranscripts}
                    variant="outline"
                    size="sm"
                    className="text-orange-600 border-orange-300 hover:bg-orange-100"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Test Server Connection
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="p-8">
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
              dragActive 
                ? 'border-purple-400 bg-purple-50 scale-[1.02]' 
                : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/30'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Meeting Files
              </h2>
              <p className="text-gray-600 mb-6">
                Drag and drop files here, or click to browse
              </p>
              
              {/* File Size Info */}
              <div className={`border rounded-xl p-4 mb-6 ${
                serverHasIssues 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className={`flex items-center space-x-2 mb-2 ${
                  serverHasIssues ? 'text-yellow-800' : 'text-blue-800'
                }`}>
                  <Info className="w-5 h-5" />
                  <span className="font-semibold">
                    {serverHasIssues ? 'Reduced File Size Limits' : 'File Size Limits'}
                  </span>
                </div>
                <div className={`text-sm ${serverHasIssues ? 'text-yellow-700' : 'text-blue-700'}`}>
                  <p>
                    <strong>Documents:</strong> Up to {getCurrentFileSizeLimits().general} per file<br />
                    <strong>Audio files:</strong> Up to {getCurrentFileSizeLimits().audio} per file
                  </p>
                  {serverHasIssues && (
                    <p className="mt-2 text-xs">
                      Limits are temporarily reduced due to server issues. Normal limits (100MB/50MB) will be restored automatically.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Supported Formats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {Object.entries(supportedFormats).map(([type, format]) => {
                  const Icon = format.icon;
                  return (
                    <div key={type} className={`p-4 rounded-xl bg-${format.color}-50 border border-${format.color}-100`}>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 bg-${format.color}-100 rounded-lg`}>
                          <Icon className={`w-5 h-5 text-${format.color}-600`} />
                        </div>
                        <div className="text-left">
                          <p className={`font-semibold text-${format.color}-800 text-sm`}>
                            {format.extensions.join(', ').toUpperCase()}
                          </p>
                          <p className={`text-xs text-${format.color}-600`}>
                            {format.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".mp3,.wav,.m4a,.aac,.flac,.txt,.doc,.docx,.pdf,.rtf"
                  onChange={handleFileInputChange}
                  multiple
                />
                <label htmlFor="file-upload">
                  <Button
                    as="span"
                    size="lg"
                    variant="gradient"
                    className="cursor-pointer inline-flex items-center space-x-2 shadow-xl"
                  >
                    <Upload size={20} />
                    <span>Choose Files</span>
                  </Button>
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                <strong>Supported formats:</strong> MP3, WAV, M4A, AAC, FLAC, TXT, DOC, DOCX, PDF, RTF<br />
                <strong>Current limits:</strong> {getCurrentFileSizeLimits().general} documents, {getCurrentFileSizeLimits().audio} audio
                {serverHasIssues && (
                  <span className="text-yellow-600 block mt-1">
                    ⚠️ Reduced limits due to server issues
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-gray-900">Upload Progress</h3>
              {uploadProgress.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        item.status === 'success' ? 'bg-green-100' :
                        item.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {item.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : item.status === 'error' ? (
                          <X className="w-4 h-4 text-red-600" />
                        ) : (
                          <LoadingSpinner size="sm" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(item.file.size)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        item.status === 'success' ? 'text-green-600' :
                        item.status === 'error' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {item.status === 'success' ? 'Complete' :
                         item.status === 'error' ? 'Failed' : `${item.progress}%`}
                      </p>
                    </div>
                  </div>
                  {item.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  )}
                  {item.status === 'error' && item.error && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">{item.error}</p>
                      {item.error.includes('413') && (
                        <p className="text-xs text-red-500 mt-1">
                          Try compressing your file or using a smaller file size. Server has upload restrictions.
                        </p>
                      )}
                      {item.error.includes('CORS') && (
                        <p className="text-xs text-red-500 mt-1">
                          This is a server configuration issue. Please contact the administrator.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('transcripts')}
          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            activeTab === 'transcripts'
              ? 'bg-white text-purple-600 shadow-lg'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Transcripts ({filteredTranscripts.length})
        </button>
        <button
          onClick={() => setActiveTab('summaries')}
          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
            activeTab === 'summaries'
              ? 'bg-white text-purple-600 shadow-lg'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Summary History ({filteredSummaries.length})
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder={`Search ${activeTab}...`}
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
            onClick={loadData}
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
            <p className="text-gray-600 font-medium">Loading your meeting data...</p>
          </div>
        </div>
      ) : activeTab === 'transcripts' ? (
        filteredTranscripts.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No matching transcripts found' : 'No Meeting Transcripts Yet'}
              </h2>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Upload your first meeting file to get started with AI-powered transcription and summarization.'
                }
              </p>
              {serverError && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="text-red-600 text-sm">{serverError}</p>
                  <Button
                    onClick={() => setShowServerIssues(true)}
                    variant="outline"
                    size="sm"
                    className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    View Server Issues
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Transcripts List */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Transcripts ({filteredTranscripts.length})
              </h2>
              {filteredTranscripts.map((transcript) => {
                const fileName = getFileNameFromUrl(transcript.uploaded_file);
                const fileTypeInfo = getFileTypeInfo(fileName);
                const Icon = fileTypeInfo.icon;
                
                return (
                  <Card key={transcript.id} hover variant="elevated" className="group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`p-3 rounded-xl bg-${fileTypeInfo.bgColor} group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                              <Icon className={`w-5 h-5 text-${fileTypeInfo.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`text-sm font-bold text-${fileTypeInfo.color} bg-${fileTypeInfo.bgColor} px-2 py-1 rounded-lg`}>
                                  {fileTypeInfo.label}
                                </span>
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  {getSourceIcon(transcript.source)}
                                  <span className="capitalize">{transcript.source}</span>
                                </div>
                              </div>
                              <p className="text-sm font-medium text-gray-900 truncate mb-1" title={fileName}>
                                {fileName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {fileTypeInfo.description} • Uploaded {formatDate(transcript.uploaded_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="gradient"
                            onClick={() => handleTranscribeAndSummarize(transcript)}
                            isLoading={processingId === transcript.id}
                            disabled={processingId !== null}
                            className="shadow-lg"
                          >
                            {processingId === transcript.id ? 'Processing...' : 'Process'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTranscript(transcript.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600">
                        <a
                          href={transcript.uploaded_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-medium group/link"
                        >
                          <span>View original file</span>
                          <ExternalLink size={14} className="group-hover/link:translate-x-0.5 transition-transform duration-200" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Summary Panel */}
            <div className="xl:sticky xl:top-4">
              <Card variant="elevated" className="h-fit">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">AI Meeting Summary</h2>
                      <p className="text-sm text-gray-500">Intelligent insights and analysis</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedTranscript ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium mb-2">No transcript selected</p>
                      <p className="text-sm text-gray-400">
                        Select a transcript and click "Process" to generate an AI summary.
                      </p>
                    </div>
                  ) : processingId === selectedTranscript.id ? (
                    <div className="text-center py-12">
                      <div className="relative mb-6">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <LoadingSpinner size="lg" className="absolute -top-2 -right-2" />
                      </div>
                      <p className="text-gray-900 font-semibold text-lg mb-2">Processing transcript...</p>
                      <p className="text-gray-600">
                        AI is analyzing the content and generating insights
                      </p>
                    </div>
                  ) : summary ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Key Points</span>
                        </h3>
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-100">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {summary.key_points}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span>Action Items</span>
                        </h3>
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {summary.action_items}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span>Follow-ups</span>
                        </h3>
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {summary.follow_ups}
                          </p>
                        </div>
                      </div>

                      {summary.pdf_url && (
                        <div className="flex justify-center pt-4">
                          <Button
                            as="a"
                            href={summary.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outline"
                            className="inline-flex items-center space-x-2 shadow-lg"
                          >
                            <Download size={16} />
                            <span>Download PDF Report</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-gray-900 font-medium mb-2">Processing failed</p>
                      <p className="text-gray-600 text-sm mb-4">
                        Unable to generate summary. This may be due to server issues.
                      </p>
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleTranscribeAndSummarize(selectedTranscript)}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center space-x-2"
                        >
                          <RefreshCw size={14} />
                          <span>Retry</span>
                        </Button>
                        <Button
                          onClick={() => setShowServerIssues(true)}
                          variant="ghost"
                          size="sm"
                          className="inline-flex items-center space-x-2 text-orange-600"
                        >
                          <AlertTriangle size={14} />
                          <span>Check Server Issues</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )
      ) : (
        // Summary History Tab
        filteredSummaries.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No matching summaries found' : 'No Meeting Summaries Yet'}
              </h2>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Process some transcripts to see AI-generated summaries here.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSummaries.map((summary) => (
              <Card key={summary.id} hover variant="elevated" className="group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                          Meeting Summary #{summary.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Generated {formatDate(summary.generated_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSummary(summary.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Key Points</span>
                      </h4>
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-100">
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                          {summary.key_points}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Action Items</span>
                      </h4>
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-100">
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                          {summary.action_items}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Follow-ups</span>
                      </h4>
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100">
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                          {summary.follow_ups}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};