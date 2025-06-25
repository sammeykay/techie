import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  variant?: 'default' | 'elevated' | 'bordered' | 'glass';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  variant = 'default'
}) => {
  const variants = {
    default: 'bg-white border border-gray-100 shadow-sm',
    elevated: 'bg-white shadow-xl border-0',
    bordered: 'bg-white border-2 border-gray-200 shadow-none',
    glass: 'bg-white/90 backdrop-blur-xl border border-white/30 shadow-xl'
  };

  return (
    <div className={`rounded-2xl transition-all duration-300 ${variants[variant]} ${
      hover ? 'hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] cursor-pointer' : ''
    } ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/50 ${className}`}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-4 sm:px-6 py-4 sm:py-5 ${className}`}>
      {children}
    </div>
  );
};