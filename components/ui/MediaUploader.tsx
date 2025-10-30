'use client';

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { FilePond } from 'react-filepond';
import type { FilePond as FilePondInstance } from 'filepond';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

export type MediaUploaderProps = ComponentPropsWithoutRef<typeof FilePond>;

const MediaUploader = forwardRef<FilePondInstance, MediaUploaderProps>((props, ref) => (
  <FilePond {...props} ref={ref} />
));

MediaUploader.displayName = 'MediaUploader';

export default MediaUploader;