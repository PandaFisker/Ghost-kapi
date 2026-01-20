import { default as React } from 'react';
import { DefaultHeaderTypes, Photo } from './UnsplashTypes';

interface UnsplashModalProps {
    onClose: () => void;
    onImageInsert: (image: Photo) => void;
    unsplashProviderConfig: DefaultHeaderTypes | null;
}
export declare const UnsplashSearchModal: React.FC<UnsplashModalProps>;
export {};
//# sourceMappingURL=UnsplashSearchModal.d.ts.map