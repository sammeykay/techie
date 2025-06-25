import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'modern' | 'floating';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  variant = 'modern',
  className = '',
  ...props
}) => {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  if (variant === 'floating') {
    return (
      <div className="relative">
        <input
          id={inputId}
          className={`peer block w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-200 rounded-xl placeholder-transparent focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 ${
            icon ? 'pl-12' : ''
          } ${error ? 'border-red-300 focus:border-red-500' : ''} ${className}`}
          placeholder={label || ''}
          {...props}
        />
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <div className="text-gray-400 peer-focus:text-blue-500 transition-colors duration-200">{icon}</div>
          </div>
        )}
        {label && (
          <label
            htmlFor={inputId}
            className={`absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-gray-600 transition-all duration-200 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 ${
              icon ? 'peer-placeholder-shown:left-12 peer-focus:left-4' : ''
            }`}
          >
            {label}
          </label>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <div className="text-gray-400">{icon}</div>
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-blue-500 transition-all duration-200 bg-white ${
            icon ? 'pl-12' : ''
          } ${error ? 'border-red-300 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};