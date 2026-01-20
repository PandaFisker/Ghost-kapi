import { default as React, HTMLProps } from 'react';

type ButtonIconType = 'heart' | 'download';
interface UnsplashButtonProps extends HTMLProps<HTMLAnchorElement> {
    icon?: ButtonIconType;
    label?: string;
}
declare const UnsplashButton: React.FC<UnsplashButtonProps>;
export default UnsplashButton;
//# sourceMappingURL=UnsplashButton.d.ts.map