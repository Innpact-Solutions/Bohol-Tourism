import React from 'react';
import { LayoutGrid, Shield, Truck, Recycle, DollarSign, Users } from 'lucide-react';

export type CWISModule = 
  | 'module1_suitability'
  | 'module2_containment'
  | 'module3_collection'
  | 'module4_treatment'
  | 'module5_financial'
  | 'module6_enabling'
  | null;

interface ModuleNavigationTabsProps {
  activeModule: CWISModule;
  onModuleChange: (module: CWISModule) => void;
}

interface ModuleTab {
  id: CWISModule;
  moduleNumber: string;
  label: string;
  description: string;
  color: string;
  icon: React.ElementType;
}

const moduleTabs: ModuleTab[] = [
  {
    id: 'module1_suitability',
    moduleNumber: 'Module 1',
    label: 'System Suitability',
    description: 'Assess sanitation system suitability for different areas',
    color: '#3B82F6', // Blue
    icon: LayoutGrid
  },
  {
    id: 'module2_containment',
    moduleNumber: 'Module 2',
    label: 'Toilet Access',
    description: 'Evaluate containment infrastructure and risk factors',
    color: '#8B5CF6', // Purple
    icon: Shield
  },
  {
    id: 'module3_collection',
    moduleNumber: 'Module 3',
    label: 'Collection & Transport',
    description: 'Analyze collection and transport systems',
    color: '#06B6D4', // Cyan
    icon: Truck
  },
  {
    id: 'module4_treatment',
    moduleNumber: 'Module 4',
    label: 'Treatment, Disposal & Re-use',
    description: 'Plan treatment facilities, disposal methods and re-use opportunities',
    color: '#10B981', // Green
    icon: Recycle
  },
  {
    id: 'module5_financial',
    moduleNumber: 'Module 5',
    label: 'Financial Sustainability',
    description: 'Assess financial viability and sustainability',
    color: '#F59E0B', // Amber
    icon: DollarSign
  },
  {
    id: 'module6_enabling',
    moduleNumber: 'Module 6',
    label: 'Enabling Environment',
    description: 'Review institutional and policy frameworks',
    color: '#EF4444', // Red
    icon: Users
  }
];

export function ModuleNavigationTabs({ activeModule, onModuleChange }: ModuleNavigationTabsProps) {
  return (
    <div className="h-14 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] border-b border-white/10 flex items-center">
      {moduleTabs.map((module) => {
        const isActive = activeModule === module.id;
        const Icon = module.icon;
        
        return (
          <button
            key={module.id}
            onClick={() => onModuleChange(isActive ? null : module.id)}
            className="flex-1 h-full relative transition-all duration-300 group"
            title={module.description}
            style={{
              borderRight: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            {/* Background gradient on hover/active */}
            <div 
              className={`absolute inset-0 transition-all duration-300 ${
                isActive 
                  ? 'opacity-100' 
                  : 'opacity-0 group-hover:opacity-100'
              }`}
              style={{
                background: isActive 
                  ? `linear-gradient(135deg, ${module.color}40, ${module.color}20)`
                  : `linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))`
              }}
            />
            
            {/* Content */}
            <div className="relative h-full flex items-center justify-center px-3 gap-3">
              {/* Icon on the left */}
              <Icon 
                className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-[#64748B] group-hover:text-white'
                }`}
                style={{
                  color: isActive ? module.color : undefined,
                  filter: isActive ? `drop-shadow(0 0 8px ${module.color}80)` : undefined
                }}
              />
              
              {/* Text content */}
              <div className="flex flex-col items-start justify-center gap-0.5">
                {/* Module Number */}
                <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-[#64748B] group-hover:text-white'
                }`}>
                  {module.moduleNumber}
                </span>
                
                {/* Module Label */}
                <div className={`text-[11px] font-medium leading-tight transition-all duration-300 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-[#94A3B8] group-hover:text-white'
                }`}>
                  {module.label}
                </div>
              </div>
            </div>
            
            {/* Active Bottom Border */}
            {isActive && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5 shadow-lg"
                style={{
                  backgroundColor: module.color,
                  boxShadow: `0 0 12px ${module.color}`
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}