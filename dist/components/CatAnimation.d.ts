import React from 'react';
interface CatAnimationProps {
    isVisible: boolean;
    onAnimationComplete?: () => void;
    size?: 'small' | 'medium' | 'large';
}
declare const CatAnimation: React.FC<CatAnimationProps>;
export default CatAnimation;
