"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MediaUploader from '@/components/ui/MediaUploader';
import { registerPlugin } from 'react-filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Register FilePond plugins
registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

interface ImageUploaderProps {
  value: string[];
  onChange: (value: string[]) => void;
  maxFiles?: number;
  folder?: string;
  disabled?: boolean;
}

type MediaFile = {
  source: string;
  file: File;
};

export default function ImageUploader({
  value = [],
  onChange,
  maxFiles = 5,
  disabled = false,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [files, setFiles] = useState<MediaFile[]>([]);

  // Handle file uploads
  useEffect(() => {
    const uploadFiles = async () => {
      if (files.length === 0) return;
      
      setIsUploading(true);
      
      try {
        const uploadedUrls = await Promise.all(
          files.map(async (fileItem) => {
            const formData = new FormData();
            formData.append('file', fileItem.file);
            
            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error('Upload failed');
            }
            
            const data = await response.json();
            return data.url;
          })
        );
        
        // Add new URLs to the existing value
        onChange([...value, ...uploadedUrls]);
      } catch (error) {
        console.error('Error uploading files:', error);
      } finally {
        setIsUploading(false);
        setFiles([]);
      }
    };
    
    if (files.length > 0) {
      uploadFiles();
    }
  }, [files, onChange, value]);

  const handleUrlAdd = () => {
    if (!urlInput) return;
    
    try {
      // Basic URL validation
      new URL(urlInput);
      onChange([...value, urlInput]);
      setUrlInput("");
    } catch (error) {
      console.error("Invalid URL:", error);
    }
  };

  const handleRemove = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      {/* File upload with MediaUploader */}
      <div className={`${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <MediaUploader
          files={files}
          onupdatefiles={setFiles}
          allowMultiple={true}
          maxFiles={maxFiles}
          acceptedFileTypes={['image/*']}
          labelIdle={`
            <div class="flex flex-col items-center p-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 text-gray-400">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span class="text-sm text-gray-500 dark:text-gray-400">Drag & drop images or click to browse</span>
            </div>
          `}
        />
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Oder gebe eine Bild URL ein"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleUrlAdd}
          disabled={disabled || !urlInput}
          size="sm"
        >
          Add
        </Button>
      </div>

      {/* Upload indicator */}
      {isUploading && (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Uploading files...</span>
        </div>
      )}

      {/* Preview */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          {value.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-md overflow-hidden">
              {url.includes('video') ? (
                <video
                  src={url}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <Image 
                  src={url} 
                  alt={`Uploaded file ${index + 1}`} 
                  fill
                  className="object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 