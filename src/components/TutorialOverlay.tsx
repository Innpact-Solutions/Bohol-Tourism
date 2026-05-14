import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  targetElement?: string;
  position: 'left' | 'right' | 'center' | 'top' | 'bottom';
  action?: 'expandHeatLayer' | 'show3D' | 'openQueryTool' | 'openComparisonTool' | 'showRightPanel';
  beforeAction?: () => void;
  afterAction?: () => void;
  delaySpotlight?: number; // Delay in ms before showing spotlight (for expansion animations)
}

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSetSector?: (sector: string) => void;
  onSetLayer?: (layerId: string) => void;
  onOpenDrawer?: () => void;
  onCloseDrawer?: () => void;
  onToggle3D?: (enabled: boolean) => void;
  onToggleQueryTool?: () => void;
  onToggleComparison?: () => void;
  onZoomTo?: (coords: [number, number], zoom: number) => void;
  onToggleRoadSafety?: (expanded: boolean) => void;
  onSetRoadSafetyLayer?: (layerId: string) => void;
  onResetToDefault?: () => void;
  onToggleInfraSection?: (expanded: boolean) => void;
  onToggleInfraLayer?: (layerId: string) => void;
  onToggleRoadSafetySection?: (expanded: boolean) => void;
  onOpenBuildingPopup?: (coords: [number, number]) => void;
}

export function TutorialOverlay({
  isOpen,
  onClose,
  onSetSector,
  onSetLayer,
  onOpenDrawer,
  onCloseDrawer,
  onToggle3D,
  onToggleQueryTool,
  onToggleComparison,
  onZoomTo,
  onToggleRoadSafety,
  onSetRoadSafetyLayer,
  onResetToDefault,
  onToggleInfraSection,
  onToggleInfraLayer,
  onToggleRoadSafetySection,
  onOpenBuildingPopup
}: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [borderRadius, setBorderRadius] = useState<string>('8px');

  const steps: TutorialStep[] = [
    {
      title: "Welcome",
      description: "Let's take a quick tour of the key features. We'll show you live demonstrations of the tools.",
      position: 'center',
      beforeAction: () => {
        // Open drawer and expand ONLY hazard section at the start
        if (onOpenDrawer) onOpenDrawer();
        setTimeout(() => {
          if (onSetSector) onSetSector('heat');
          
          // Expand ONLY hazard layers section
          setTimeout(() => {
            const hazardButton = document.querySelector('[data-tutorial="hazard-layers-section"] button') as HTMLElement;
            if (hazardButton) {
              const section = hazardButton.closest('[data-tutorial="hazard-layers-section"]');
              const isExpanded = section?.querySelector('[data-tutorial="hazard-layers-content"]');
              if (!isExpanded) {
                hazardButton.click();
              }
            }
          }, 300);
        }, 200);
      }
    },
    {
      title: "Hazard Sector Selection",
      description: "Switch between climate hazards: Heat Stress, Air Pollution, Flood, and Multi-Hazard.",
      targetElement: '[data-tutorial="left-rail"]',
      position: 'right',
      beforeAction: () => {
        // Make sure drawer is closed for this step
        if (onCloseDrawer) onCloseDrawer();
      }
    },
    {
      title: "Scenario Planning",
      description: "Compare different IPCC climate scenarios: Baseline 2025, SSP5-2030, SSP5-2040, SSP5-2050.",
      targetElement: '[data-tutorial="scenario-planning-section"]',
      position: 'right',
      delaySpotlight: 400,
      beforeAction: () => {
        // Open drawer and expand scenario planning section
        if (onOpenDrawer) onOpenDrawer();
        setTimeout(() => {
          if (onSetSector) onSetSector('heat');
          
          // Expand scenario planning
          setTimeout(() => {
            const scenarioButton = document.querySelector('[data-tutorial="scenario-planning-section"] button') as HTMLElement;
            if (scenarioButton) {
              const section = scenarioButton.closest('[data-tutorial="scenario-planning-section"]');
              const isExpanded = section?.querySelector('[data-tutorial="scenario-planning-content"]');
              if (!isExpanded) {
                scenarioButton.click();
              }
            }
          }, 200);
          
          // Ensure hazard section is open
          setTimeout(() => {
            const hazardButton = document.querySelector('[data-tutorial="hazard-layers-section"] button') as HTMLElement;
            if (hazardButton) {
              const section = hazardButton.closest('[data-tutorial="hazard-layers-section"]');
              const isExpanded = section?.querySelector('[data-tutorial="hazard-layers-content"]');
              if (!isExpanded) {
                hazardButton.click();
              }
            }
          }, 250);
        }, 150);
      }
    },
    {
      title: "Base Layers",
      description: "Control map backgrounds and contextual layers like satellite imagery, administrative boundaries, and wards.",
      targetElement: '[data-tutorial="base-layers-section"]',
      position: 'right',
      delaySpotlight: 400,
      beforeAction: () => {
        // Close scenario planning, expand base layers
        const scenarioButton = document.querySelector('[data-tutorial="scenario-planning-section"] button') as HTMLElement;
        if (scenarioButton) {
          const section = scenarioButton.closest('[data-tutorial="scenario-planning-section"]');
          const isExpanded = section?.querySelector('[data-tutorial="scenario-planning-content"]');
          if (isExpanded) {
            scenarioButton.click();
          }
        }
        
        // Expand base layers
        setTimeout(() => {
          const baseLayersButton = document.querySelector('[data-tutorial="base-layers-section"] button') as HTMLElement;
          if (baseLayersButton) {
            const section = baseLayersButton.closest('[data-tutorial="base-layers-section"]');
            const isExpanded = section?.querySelector('[data-tutorial="base-layers-content"]');
            if (!isExpanded) {
              baseLayersButton.click();
            }
          }
        }, 200);
      }
    },
    {
      title: "Hazard Sub-Parameters",
      description: "Each sector provides specialized layers like LST, Air Temperature, Humidity, etc.",
      targetElement: '[data-tutorial="hazard-layers-section"]',
      position: 'right',
      delaySpotlight: 400,
      beforeAction: () => {
        // Close base layers
        const baseLayersButton = document.querySelector('[data-tutorial="base-layers-section"] button') as HTMLElement;
        if (baseLayersButton) {
          const section = baseLayersButton.closest('[data-tutorial="base-layers-section"]');
          const isExpanded = section?.querySelector('[data-tutorial="base-layers-content"]');
          if (isExpanded) {
            baseLayersButton.click();
          }
        }
        
        // Hazard section stays open - ensure it's open
        setTimeout(() => {
          const hazardButton = document.querySelector('[data-tutorial="hazard-layers-section"] button') as HTMLElement;
          if (hazardButton) {
            const section = hazardButton.closest('[data-tutorial="hazard-layers-section"]');
            const isExpanded = section?.querySelector('[data-tutorial="hazard-layers-content"]');
            if (!isExpanded) {
              hazardButton.click();
            }
          }
        }, 200);
      }
    },
    {
      title: "Infrastructure & Public Services",
      description: "Analyze exposure of educational, healthcare, public amenities, and transport networks.",
      targetElement: '[data-tutorial="infrastructure-section"]',
      position: 'right',
      delaySpotlight: 400,
      beforeAction: () => {
        // Expand infrastructure section
        if (onToggleInfraSection) onToggleInfraSection(true);
      },
      afterAction: () => {
        // Demonstrate toggling a layer
        setTimeout(() => {
          if (onToggleInfraLayer) onToggleInfraLayer('educational');
        }, 1000);
        setTimeout(() => {
          if (onToggleInfraLayer) onToggleInfraLayer('educational');
        }, 2500);
      }
    },
    {
      title: "Road Safety Assessment (iRAP)",
      description: "Evaluate road safety for vehicles, motorcyclists, bicyclists, and pedestrians.",
      targetElement: '[data-tutorial="road-safety-section"]',
      position: 'right',
      delaySpotlight: 400,
      beforeAction: () => {
        // Close infrastructure section
        if (onToggleInfraSection) onToggleInfraSection(false);
        
        // Expand road safety section
        setTimeout(() => {
          if (onToggleRoadSafetySection) onToggleRoadSafetySection(true);
        }, 200);
      }
    },
    {
      title: "Live Map Visualization",
      description: "Pan and zoom to explore climate risk data across Bhubaneswar.",
      targetElement: '[data-tutorial="map-canvas"]',
      position: 'bottom',
      beforeAction: () => {
        // Reset everything to default state
        if (onResetToDefault) {
          onResetToDefault();
        }
      }
    },
    {
      title: "Analytics Dashboard",
      description: "View real-time KPIs, charts, and detailed statistics for your selected layer.",
      targetElement: '[data-tutorial="right-panel"]',
      position: 'left'
    },
    {
      title: "3D Building View",
      description: "Watch as we zoom to the city center and enable 3D buildings to see urban density and building-level climate scores assessed.",
      targetElement: '[data-tutorial="map-canvas"]',
      position: 'center',
      delaySpotlight: 100, // Minimal delay - spotlight appears immediately with tooltip
      beforeAction: () => {
        // First disable 3D if it's already on
        if (onToggle3D) onToggle3D(false);
        
        // Wait a bit, then zoom to city center at high zoom level
        setTimeout(() => {
          if (onZoomTo) {
            onZoomTo([85.8245, 20.2961], 17.5); // Higher zoom for better 3D effect
          }
        }, 100);
        
        // Wait for zoom animation to complete, then enable 3D
        setTimeout(() => {
          if (onToggle3D) onToggle3D(true);
        }, 1200);
        
        // Double-check 3D is enabled after another delay
        setTimeout(() => {
          if (onToggle3D) onToggle3D(true);
        }, 1800);
        
        // Triple-check to ensure buildings are loaded
        setTimeout(() => {
          if (onToggle3D) onToggle3D(true);
        }, 2400);
        
        // Open a building popup at a visible building location
        setTimeout(() => {
          if (onOpenBuildingPopup) {
            // Trigger popup for a building near the center
            onOpenBuildingPopup([85.8245, 20.2961]);
          }
        }, 3000);
      }
    },
    {
      title: "Query Tool - Spatial Analysis",
      description: "Opening the Query Tool to analyze specific locations and infrastructure exposure.",
      targetElement: '[data-tutorial="right-panel"]',
      position: 'left',
      beforeAction: () => {
        // Reset map to home view and disable 3D first
        if (onToggle3D) onToggle3D(false);
        if (onZoomTo) {
          onZoomTo([85.8245, 20.2961], 12.5);
        }
        // Then open query tool
        setTimeout(() => {
          if (onToggleQueryTool) onToggleQueryTool();
        }, 1000);
      }
    },
    {
      title: "Comparison Mode",
      description: "Use this button to analyze different scenarios side-by-side with split-screen comparison.",
      targetElement: '[data-tutorial="compare-button"]',
      position: 'bottom',
      beforeAction: () => {
        // Close query tool
        if (onToggleQueryTool) onToggleQueryTool();
      }
    },
    {
      title: "Historical Trends Analysis",
      description: "View historical climate trends from 2015-2025 to understand how hazards have evolved over time.",
      targetElement: '[data-tutorial="historic-trends-button"]',
      position: 'bottom',
      beforeAction: () => {
        // Ensure we're in a clean state for showing this button
        // Historical trends button is already visible since we closed query tool
      }
    },
    {
      title: "Ready to Explore!",
      description: "You're all set. Start analyzing climate risks and infrastructure exposure across Bhubaneswar.",
      position: 'center'
    }
  ];

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    
    // Update spotlight
    if (step.targetElement) {
      setTimeout(() => {
        const element = document.querySelector(step.targetElement!);
        if (element) {
          const rect = element.getBoundingClientRect();
          setSpotlightRect(rect);
          
          // Get the computed border radius from the element
          const computedStyle = window.getComputedStyle(element);
          const elementBorderRadius = computedStyle.borderRadius || '8px';
          setBorderRadius(elementBorderRadius);
        } else {
          console.warn(`Tutorial: Target element not found: ${step.targetElement}`);
        }
      }, step.delaySpotlight || 100);
    } else {
      setSpotlightRect(null);
      setBorderRadius('8px');
    }

    // Execute before action
    if (step.beforeAction) {
      step.beforeAction();
    }

    // Execute after action with delay
    if (step.afterAction) {
      setTimeout(() => {
        step.afterAction!();
      }, 300);
    }
  }, [currentStep, isOpen]);

  // Cleanup effect when tutorial closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final cleanup when tutorial ends
      if (onToggle3D) onToggle3D(false);
      if (onToggleQueryTool && currentStep === 6) onToggleQueryTool();
      
      // Collapse all sections back to default
      collapseAllSections();
      
      // Close tutorial first
      onClose();
      
      // Then reset map to home view after tutorial closes
      setTimeout(() => {
        if (onZoomTo) {
          onZoomTo([85.8245, 20.2961], 11.5);
        }
      }, 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const collapseAllSections = () => {
    // Collapse scenario planning if expanded
    const scenarioButton = document.querySelector('[data-tutorial="scenario-planning-section"] button') as HTMLElement;
    if (scenarioButton) {
      const section = scenarioButton.closest('[data-tutorial="scenario-planning-section"]');
      const isExpanded = section?.querySelector('.bg-gradient-to-br');
      if (isExpanded) {
        scenarioButton.click();
      }
    }
    
    // Collapse base layers if expanded
    setTimeout(() => {
      const baseLayersButton = document.querySelector('[data-tutorial="base-layers-section"] button') as HTMLElement;
      if (baseLayersButton) {
        const section = baseLayersButton.closest('[data-tutorial="base-layers-section"]');
        const isExpanded = section?.querySelector('.space-y-1');
        if (isExpanded) {
          baseLayersButton.click();
        }
      }
    }, 100);
    
    // DO NOT collapse hazard layers - it should remain expanded by default
    // Hazard section stays open as default state
    
    // Collapse infrastructure
    setTimeout(() => {
      if (onToggleInfraSection) onToggleInfraSection(false);
    }, 200);
    
    // Collapse road safety
    setTimeout(() => {
      if (onToggleRoadSafetySection) onToggleRoadSafetySection(false);
    }, 300);
  };

  const handleSkip = () => {
    // Cleanup before closing
    if (onToggle3D) onToggle3D(false);
    if (onToggleQueryTool && currentStep === 6) onToggleQueryTool();
    
    // Collapse all sections back to default
    collapseAllSections();
    
    // Reset to default state
    if (onResetToDefault) onResetToDefault();
    
    // Close tutorial first
    onClose();
    
    // Then reset map to home view after tutorial closes
    setTimeout(() => {
      if (onZoomTo) {
        onZoomTo([85.8245, 20.2961], 11.5);
      }
    }, 300);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay with spotlight cutout */}
      <div 
        className="absolute inset-0 bg-black/70 transition-all duration-500 pointer-events-auto"
        style={{
          clipPath: spotlightRect 
            ? `polygon(
                0% 0%, 
                0% 100%, 
                ${spotlightRect.left - 4}px 100%, 
                ${spotlightRect.left - 4}px ${spotlightRect.top - 4}px, 
                ${spotlightRect.right + 4}px ${spotlightRect.top - 4}px, 
                ${spotlightRect.right + 4}px ${spotlightRect.bottom + 4}px, 
                ${spotlightRect.left - 4}px ${spotlightRect.bottom + 4}px, 
                ${spotlightRect.left - 4}px 100%, 
                100% 100%, 
                100% 0%
              )`
            : undefined
        }}
      />

      {/* Modern spotlight ring with clean glow */}
      {spotlightRect && (
        <>
          {/* Outer glow */}
          <div
            className="absolute pointer-events-none transition-all duration-500"
            style={{
              top: spotlightRect.top - 12,
              left: spotlightRect.left - 12,
              width: spotlightRect.width + 24,
              height: spotlightRect.height + 24,
              borderRadius: borderRadius,
              boxShadow: '0 0 0 1px rgba(37, 99, 235, 0.1), 0 0 60px 8px rgba(37, 99, 235, 0.25)',
            }}
          />
          {/* Inner precise border */}
          <div
            className="absolute pointer-events-none transition-all duration-500"
            style={{
              top: spotlightRect.top - 4,
              left: spotlightRect.left - 4,
              width: spotlightRect.width + 8,
              height: spotlightRect.height + 8,
              border: '2px solid rgba(37, 99, 235, 0.8)',
              borderRadius: borderRadius,
              boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
            }}
          />
        </>
      )}

      {/* Compact tutorial card */}
      <div
        className={`absolute pointer-events-auto transition-all duration-500 ${getCardPosition(step.position, spotlightRect)}`}
        style={getCardStyle(step.position, spotlightRect)}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] max-w-sm w-full mx-4">
          {/* Compact Header */}
          <div className="px-4 pt-4 pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-1 rounded-full">
                    {currentStep + 1}/{steps.length}
                  </span>
                  {/* Progress dots */}
                  <div className="flex items-center gap-1">
                    {steps.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 rounded-full transition-all duration-300 ${
                          idx === currentStep 
                            ? 'w-4 bg-[#2563EB]' 
                            : idx < currentStep
                            ? 'w-1 bg-[#3B82F6]'
                            : 'w-1 bg-[#CBD5E1]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#1E293B]">
                  {step.title}
                </h3>
              </div>
              <button
                onClick={handleSkip}
                className="p-1.5 hover:bg-[#F1F5F9] rounded-lg transition-colors flex-shrink-0 ml-2"
                aria-label="Close tutorial"
              >
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            <p className="text-[#475569] leading-relaxed text-sm">
              {step.description}
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[#64748B] hover:text-[#475569] hover:bg-[#F8FAFC] rounded-lg transition-all text-xs font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              )}
              <button
                onClick={handleSkip}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[#64748B] hover:text-[#475569] hover:bg-[#F8FAFC] rounded-lg transition-all text-xs font-medium"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip
              </button>
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white rounded-lg transition-all text-xs font-bold shadow-lg shadow-blue-500/25"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCardPosition(position: string, spotlightRect: DOMRect | null): string {
  if (!spotlightRect) {
    return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  }

  switch (position) {
    case 'left':
    case 'right':
    case 'top':
    case 'bottom':
      return '';
    case 'center':
    default:
      return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
  }
}

function getCardStyle(position: string, spotlightRect: DOMRect | null): React.CSSProperties {
  if (!spotlightRect) {
    return {};
  }

  const padding = 24;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = 384; // max-w-sm
  const cardHeight = 250; // Approximate height

  switch (position) {
    case 'left':
      return {
        top: Math.max(80, Math.min(spotlightRect.top + spotlightRect.height / 2, viewportHeight - 300)),
        right: Math.max(padding, viewportWidth - spotlightRect.left + padding),
        transform: 'translateY(-50%)'
      };
    case 'right':
      return {
        top: Math.max(80, Math.min(spotlightRect.top + spotlightRect.height / 2, viewportHeight - 300)),
        left: Math.min(viewportWidth - cardWidth - padding, spotlightRect.right + padding),
        transform: 'translateY(-50%)'
      };
    case 'top':
      return {
        bottom: Math.max(padding, viewportHeight - spotlightRect.top + padding),
        left: Math.max(padding, Math.min(spotlightRect.left + spotlightRect.width / 2 - cardWidth / 2, viewportWidth - cardWidth - padding)),
      };
    case 'bottom':
      return {
        top: Math.max(padding, Math.min(spotlightRect.bottom + padding, viewportHeight - cardHeight - padding)),
        left: Math.max(padding, Math.min(spotlightRect.left + spotlightRect.width / 2 - cardWidth / 2, viewportWidth - cardWidth - padding)),
      };
    case 'center':
    default:
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
  }
}