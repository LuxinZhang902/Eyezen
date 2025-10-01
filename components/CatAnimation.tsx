import React, { useState, useEffect } from 'react';

interface CatAnimationProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const CatAnimation: React.FC<CatAnimationProps> = ({ 
  isVisible, 
  onAnimationComplete, 
  size = 'medium' 
}) => {
  const [animationPhase, setAnimationPhase] = useState<'walking' | 'sitting' | 'blinking'>('walking');
  const [position, setPosition] = useState(0);

  const sizeClasses = {
    small: 'w-8 h-8 text-2xl',
    medium: 'w-12 h-12 text-3xl',
    large: 'w-16 h-16 text-4xl'
  };

  useEffect(() => {
    if (!isVisible) return;

    const animationSequence = async () => {
      // Phase 1: Cat walks in from left
      setAnimationPhase('walking');
      
      const walkInterval = setInterval(() => {
        setPosition(prev => {
          if (prev >= 50) {
            clearInterval(walkInterval);
            // Phase 2: Cat sits and blinks
            setTimeout(() => {
              setAnimationPhase('sitting');
              setTimeout(() => {
                setAnimationPhase('blinking');
                setTimeout(() => {
                  // Phase 3: Cat walks out to right
                  setAnimationPhase('walking');
                  const walkOutInterval = setInterval(() => {
                    setPosition(prev => {
                      if (prev >= 100) {
                        clearInterval(walkOutInterval);
                        setPosition(0);
                        onAnimationComplete?.();
                        return 100;
                      }
                      return prev + 2;
                    });
                  }, 50);
                }, 1000);
              }, 500);
            }, 500);
            return 50;
          }
          return prev + 2;
        });
      }, 50);
    };

    animationSequence();
  }, [isVisible, onAnimationComplete]);

  if (!isVisible) return null;

  const getCatEmoji = () => {
    switch (animationPhase) {
      case 'walking':
        return '🐱';
      case 'sitting':
        return '🐱';
      case 'blinking':
        return '😸';
      default:
        return '🐱';
    }
  };

  const getAnimationClass = () => {
    switch (animationPhase) {
      case 'walking':
        return 'animate-bounce';
      case 'sitting':
        return 'animate-pulse';
      case 'blinking':
        return 'animate-ping';
      default:
        return '';
    }
  };

  return (
    <div className="relative w-full h-16 overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
      {/* Background elements */}
      <div className="absolute bottom-2 left-4 text-xs opacity-30">🌱</div>
      <div className="absolute bottom-2 right-8 text-xs opacity-30">🌸</div>
      <div className="absolute top-2 left-1/3 text-xs opacity-20">☁️</div>
      
      {/* Cat */}
      <div 
        className={`absolute bottom-2 transition-all duration-100 ${sizeClasses[size]} ${getAnimationClass()}`}
        style={{ left: `${position}%` }}
      >
        <span className="block transform hover:scale-110 transition-transform">
          {getCatEmoji()}
        </span>
      </div>
      
      {/* Paw prints trail */}
      {position > 10 && (
        <div className="absolute bottom-1 opacity-20 text-xs" style={{ left: `${position - 10}%` }}>
          🐾
        </div>
      )}
      {position > 20 && (
        <div className="absolute bottom-1 opacity-15 text-xs" style={{ left: `${position - 20}%` }}>
          🐾
        </div>
      )}
    </div>
  );
};

export default CatAnimation;