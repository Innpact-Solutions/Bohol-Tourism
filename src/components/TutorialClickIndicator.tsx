import React from 'react';

interface TutorialClickIndicatorProps {
  targetElement: string;
  show: boolean;
  delay?: number;
  color?: string; // Add color prop
}

export function TutorialClickIndicator({ targetElement, show, delay = 0, color = '#FB923C' }: TutorialClickIndicatorProps) {
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!show) {
      setIsVisible(false);
      setPosition(null);
      return;
    }

    // Wait for delay, then find element and show indicator
    const timer = setTimeout(() => {
      const element = document.querySelector(targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top + rect.height / 2,
          left: rect.left + rect.width / 2
        });
        setIsVisible(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [show, targetElement, delay]);

  if (!isVisible || !position) return null;

  return (
    <div
      className="fixed z-[10000] pointer-events-none"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Pulsing click circles - Bright Orange for visibility */}
      <div className="relative">
        {/* Outer expanding circle */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 animate-ping opacity-75" 
          style={{ borderColor: color }}
        />
        
        {/* Middle circle */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full animate-pulse" 
          style={{ backgroundColor: `${color}40` }}
        />
        
        {/* Inner solid circle */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg" 
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}