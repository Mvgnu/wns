'use client';

import { forwardRef } from 'react';
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Define our custom props type
export interface MediaUploaderProps {
  files: any[];
  onupdatefiles: (files: any[]) => void;
  allowMultiple?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  labelIdle?: string;
}

// Create a wrapper component that handles the type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MediaUploader = forwardRef<any, MediaUploaderProps>((props, ref) => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <FilePond 
      {...(props as any)}
      ref={ref}
    />
  );
});

MediaUploader.displayName = 'MediaUploader';

export default MediaUploader; 