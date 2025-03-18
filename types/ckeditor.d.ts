declare module '@ckeditor/ckeditor5-react' {
  import { ReactElement } from 'react';
  
  export class CKEditor {
    constructor(props: any);
    render(): ReactElement;
  }
  
  export const CKEditor5: {
    Context: any;
  };
}

declare module '@ckeditor/ckeditor5-build-classic' {
  const ClassicEditor: any;
  export default ClassicEditor;
} 