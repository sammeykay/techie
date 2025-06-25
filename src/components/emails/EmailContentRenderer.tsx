import React, { useState } from 'react';
import { ExternalLink, Code, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmailContentRendererProps {
  content: string;
  subject?: string;
}

export const EmailContentRenderer: React.FC<EmailContentRendererProps> = ({ 
  content, 
  subject 
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  
  // Simple check to determine if content is HTML
  const isHtmlContent = (text: string): boolean => {
    const htmlTags = /<\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/i;
    const commonHtmlEntities = /&[a-zA-Z0-9#]+;/;
    return htmlTags.test(text) || commonHtmlEntities.test(text);
  };

  const isHtml = isHtmlContent(content);

  // Clean and sanitize HTML content for safe rendering
  const sanitizeHtml = (html: string): string => {
    // Remove script tags and event handlers for security
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  };

  const renderHtmlContent = () => {
    const sanitizedHtml = sanitizeHtml(content);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">HTML Email</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={viewMode === 'preview' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('preview')}
              className="flex items-center space-x-1"
            >
              <Eye size={14} />
              <span>Preview</span>
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'source' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('source')}
              className="flex items-center space-x-1"
            >
              <Code size={14} />
              <span>Source</span>
            </Button>
          </div>
        </div>

        {viewMode === 'preview' ? (
          <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-xs text-gray-600 font-medium">
                  Email Preview - {subject || 'No Subject'}
                </span>
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.6',
                  color: '#374151'
                }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                HTML Source Code
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(content)}
                className="text-gray-400 hover:text-white"
              >
                Copy
              </Button>
            </div>
            <pre className="text-sm text-gray-300 overflow-x-auto max-h-80 overflow-y-auto">
              <code>{content}</code>
            </pre>
          </div>
        )}
      </div>
    );
  };

  const renderTextContent = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Plain Text Email</span>
        </div>
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
            {content.length > 1000 ? `${content.substring(0, 1000)}...` : content}
          </pre>
          {content.length > 1000 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newWindow = window.open('', '_blank');
                  if (newWindow) {
                    newWindow.document.write(`
                      <html>
                        <head>
                          <title>${subject || 'Email Content'}</title>
                          <style>
                            body { 
                              font-family: system-ui, -apple-system, sans-serif; 
                              line-height: 1.6; 
                              max-width: 800px; 
                              margin: 0 auto; 
                              padding: 20px;
                              color: #374151;
                            }
                            pre { 
                              white-space: pre-wrap; 
                              word-wrap: break-word; 
                            }
                          </style>
                        </head>
                        <body>
                          <h1>${subject || 'Email Content'}</h1>
                          <pre>${content}</pre>
                        </body>
                      </html>
                    `);
                    newWindow.document.close();
                  }
                }}
                className="flex items-center space-x-1"
              >
                <ExternalLink size={14} />
                <span>View Full Content</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {isHtml ? renderHtmlContent() : renderTextContent()}
    </div>
  );
};