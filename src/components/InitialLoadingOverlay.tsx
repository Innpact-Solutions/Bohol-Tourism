// Simple and modern loading overlay displayed during initial data preload

import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import bmcLogo from 'figma:asset/b3dbf4bb1f6cbe2bf4e744f225812a8a2d5559b9.png';

// Data layers that load in sequence
const loadingLayers = [
  'Initialising spatial database connection…',
  'Loading barangay boundary layers…',
  'Loading infrastructure & building data…',
  'Fetching sanitation coverage data…',
  'Loading flood & groundwater hazard layers…',
  'Preparing sewer suitability grid…',
  'Compiling CWIS assessment data…',
];

export function InitialLoadingOverlay() {
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);

  // Cycle through layers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLayerIndex((prev) => (prev + 1) % loadingLayers.length);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9] z-[9999] flex items-center justify-center overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(#2563EB 1px, transparent 1px),
              linear-gradient(90deg, #2563EB 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Floating gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-200/20 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-200/15 blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Animated particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Scanning lines */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"
        style={{ top: '30%' }}
        animate={{
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent"
        style={{ top: '70%' }}
        animate={{
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay: 1,
          ease: "easeInOut"
        }}
      />

      {/* Main content - Centered */}
      <div className="relative z-10 text-center px-6 flex flex-col items-center justify-center">
        {/* BMC Logo - Large and centered */}
        <div className="mb-1 flex justify-center">
          <motion.img 
            src={bmcLogo} 
            alt="BMC Logo" 
            className="w-96 h-96 object-contain"
            animate={{
              opacity: [0.95, 1, 0.95],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Title - Expanded and centered below logo */}
        <h1
          className="text-[#0F172A] mb-12 max-w-4xl"
          style={{ 
            fontSize: '36px', 
            fontWeight: '600', 
            lineHeight: '48px', 
            letterSpacing: '-0.02em'
          }}
        >
          Climate Hazard, Infrastructure Exposure<br />
          & Mobility Resilience Dashboard
        </h1>

        {/* Tech/AI loading animation - Orbital system */}
        <div className="relative h-16 mb-6 flex items-center justify-center">
          <div className="relative w-16 h-16">
            {/* Center core with pulse */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full bg-[#2563EB]"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Inner ring */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-8 h-8 -ml-4 -mt-4 rounded-full border border-blue-300/40"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="absolute top-0 left-1/2 w-1 h-1 -ml-0.5 rounded-full bg-[#2563EB]" />
            </motion.div>

            {/* Middle ring */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-12 h-12 -ml-6 -mt-6 rounded-full border border-blue-300/30"
              animate={{
                rotate: -360,
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="absolute top-0 left-1/2 w-1 h-1 -ml-0.5 rounded-full bg-[#3B82F6]" />
              <div className="absolute bottom-0 left-1/2 w-1 h-1 -ml-0.5 rounded-full bg-[#3B82F6]/60" />
            </motion.div>

            {/* Outer ring */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-16 h-16 -ml-8 -mt-8 rounded-full border border-blue-300/20"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="absolute top-0 left-1/2 w-1 h-1 -ml-0.5 rounded-full bg-[#60A5FA]" />
              <div className="absolute bottom-0 left-1/2 w-0.5 h-0.5 -ml-px rounded-full bg-[#60A5FA]/50" />
              <div className="absolute left-0 top-1/2 w-0.5 h-0.5 -mt-px rounded-full bg-[#60A5FA]/50" />
            </motion.div>

            {/* Scanning effect */}
            <motion.div
              className="absolute left-1/2 top-1/2 w-12 h-0.5 -ml-6 -mt-px"
              style={{
                background: 'linear-gradient(90deg, transparent, #2563EB 50%, transparent)',
              }}
              animate={{
                rotate: 360,
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          </div>
        </div>

        {/* Loading text with status */}
        <div className="h-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentLayerIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-[#64748B] font-medium"
              style={{ fontSize: '15px' }}
            >
              {loadingLayers[currentLayerIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        <div className="mt-8 flex items-center gap-1.5">
          {loadingLayers.map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              animate={{
                backgroundColor: i === currentLayerIndex ? '#2563EB' : '#CBD5E1',
                scale: i === currentLayerIndex ? 1.3 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}