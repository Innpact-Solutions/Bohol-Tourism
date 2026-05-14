import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useState } from 'react';

const mockAlerts = [
  {
    id: 1,
    severity: 'red',
    title: 'Extreme Heat Warning',
    time: '2 hours ago',
    description: 'Heat wave conditions expected. Temperature may reach 45°C.',
    area: 'City-wide',
  },
  {
    id: 2,
    severity: 'orange',
    title: 'High Air Pollution',
    time: '4 hours ago',
    description: 'AQI levels in Very Poor category. Limit outdoor activities.',
    area: 'Central Business District',
  },
  {
    id: 3,
    severity: 'yellow',
    title: 'Thunderstorm Watch',
    time: '6 hours ago',
    description: 'Isolated thunderstorms possible in the evening.',
    area: 'Northern wards',
  },
  {
    id: 4,
    severity: 'green',
    title: 'Air Quality Improvement',
    time: '8 hours ago',
    description: 'Air quality has improved to Satisfactory levels.',
    area: 'City-wide',
  },
];

const severityConfig = {
  red: {
    bg: 'bg-[#FEE2E2]',
    border: 'border-[#EF5350]',
    text: 'text-[#991B1B]',
    icon: AlertTriangle,
    label: 'Extreme',
  },
  orange: {
    bg: 'bg-[#FED7AA]',
    border: 'border-[#FFA726]',
    text: 'text-[#9A3412]',
    icon: AlertCircle,
    label: 'High',
  },
  yellow: {
    bg: 'bg-[#FEF3C7]',
    border: 'border-[#FFEE58]',
    text: 'text-[#854D0E]',
    icon: AlertCircle,
    label: 'Moderate',
  },
  green: {
    bg: 'bg-[#D1FAE5]',
    border: 'border-[#66BB6A]',
    text: 'text-[#065F46]',
    icon: Info,
    label: 'Info',
  },
};

export function AlertsPanel() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed top-[72px] right-6 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-[#E5E7EB] flex flex-col z-50">
      <div className="h-12 border-b border-[#E5E7EB] flex items-center justify-between px-4 flex-shrink-0">
        <h3 className="text-[#0F172A]">Active Alerts</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F8FAFC] transition-colors"
        >
          <X className="w-4 h-4 text-[#6B7280]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mockAlerts.map((alert) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig];
          const Icon = config.icon;

          return (
            <div
              key={alert.id}
              className={`border-l-4 ${config.border} ${config.bg} rounded-r-lg p-3`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.text} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className={`text-sm ${config.text}`}>{alert.title}</div>
                    <div className="text-xs text-[#6B7280] whitespace-nowrap">
                      {alert.time}
                    </div>
                  </div>
                  <div className="text-sm text-[#1F2937] mb-2">
                    {alert.description}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#6B7280]">Area: {alert.area}</div>
                    <button className="text-xs text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                      Zoom to AOI
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#E5E7EB] p-3 flex items-center justify-between flex-shrink-0">
        <div className="text-xs text-[#6B7280]">Auto-refresh: 5 min</div>
        <button className="text-xs text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
          View All Alerts
        </button>
      </div>
    </div>
  );
}
