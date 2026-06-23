'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Copy, Check } from 'lucide-react';
import { useConfig } from '@/context/ConfigContext';

const EXAMPLE_CONFIG = `NEXT_PUBLIC_VALIDIC_TOKEN=your_token
NEXT_PUBLIC_VALIDIC_ORG_ID=your_org_id
NEXT_PUBLIC_VALIDIC_API_URL=https://api.v2.validic.com
NEXT_PUBLIC_VALIDIC_DATAGEN_URL=https://datagen.prod.validic.com
NEXT_PUBLIC_VALIDIC_AI_URL=https://ai.prod.validic.com/v1

Users
user-id-1
user-id-2
user-id-3`;

interface ConfigUploadModalProps {
  onClose?: () => void;
}

export default function ConfigUploadModal({ onClose }: ConfigUploadModalProps) {
  const { setConfigFromFile } = useConfig();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle clicking outside the modal
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  }, [onClose]);

  const handleCopyExample = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EXAMPLE_CONFIG);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = EXAMPLE_CONFIG;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = setConfigFromFile(content);

      if (result.formatError) {
        setError(`File format error:\n${result.formatError}\n\nPlease ensure your file follows the exact format shown below.`);
      } else if (result.config) {
        setSuccess(true);
      } else {
        setError('Invalid config file. Please ensure it contains all required variables:\n• NEXT_PUBLIC_VALIDIC_TOKEN\n• NEXT_PUBLIC_VALIDIC_ORG_ID\n• NEXT_PUBLIC_VALIDIC_API_URL\n• NEXT_PUBLIC_VALIDIC_DATAGEN_URL\n• NEXT_PUBLIC_VALIDIC_AI_URL');
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, [setConfigFromFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  if (success) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="glass-panel p-8 max-w-md w-full mx-4 text-center" ref={modalRef}>
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Configuration Loaded
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Your API configuration has been loaded successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="glass-panel p-8 max-w-lg w-full mx-4" ref={modalRef}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Configuration Required
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Upload your environment configuration file to set up the API credentials.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />

          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-blue-400' : 'text-gray-500'}`} />

          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Any text file with key=value format
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400 whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* Expected format */}
        <div className="mt-6 p-4 rounded-lg relative" style={{ background: 'var(--bg-input)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Expected file format:
            </p>
            <button
              onClick={handleCopyExample}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-gray-700/50"
              style={{ color: copied ? '#22c55e' : 'var(--text-muted)' }}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-xs overflow-x-auto" style={{ color: 'var(--text-muted)' }}>
            {EXAMPLE_CONFIG}
          </pre>
        </div>
      </div>
    </div>
  );
}
