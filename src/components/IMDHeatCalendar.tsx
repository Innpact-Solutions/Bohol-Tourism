/**
 * IMD Heat Calendar Component
 * Displays monthly calendar with daily heat intensity data
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flame, Moon } from 'lucide-react';
import { fetchIMDHeatCalendar, type IMDHeatCalendarDay } from '../utils/imdHeatCalendarApi';

interface IMDHeatCalendarProps {
  year: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Temperature bin colors (tmax_bin: 1-5, low to high intensity)
const TEMP_BIN_COLORS = {
  1: '#FEF3C7', // Light yellow
  2: '#FDE68A', // Yellow
  3: '#FCD34D', // Amber
  4: '#FBBF24', // Dark amber
  5: '#F59E0B', // Orange
  null: '#F3F4F6' // Gray for no data
};

const TEMP_BIN_LABELS = {
  1: 'Very Low',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Very High'
};

export function IMDHeatCalendar({ year }: IMDHeatCalendarProps) {
  const [selectedMonth, setSelectedMonth] = useState(5); // Default to May (1-indexed)
  const [calendarData, setCalendarData] = useState<IMDHeatCalendarDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<IMDHeatCalendarDay | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipOnLeft, setTooltipOnLeft] = useState(false);

  console.log('🗓️ [IMD-CALENDAR-COMPONENT] Rendered with year:', year, 'month:', selectedMonth);

  // Fetch calendar data when year or month changes
  useEffect(() => {
    console.log('🗓️ [IMD-CALENDAR-COMPONENT] useEffect triggered - year:', year, 'month:', selectedMonth);
    
    const loadCalendarData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🗓️ [IMD-CALENDAR-COMPONENT] Calling fetchIMDHeatCalendar...');
        const data = await fetchIMDHeatCalendar(year, selectedMonth);
        console.log('🗓️ [IMD-CALENDAR-COMPONENT] Data received directly (array):', data);
        console.log('🗓️ [IMD-CALENDAR-COMPONENT] First data item:', data?.[0]);
        console.log('🗓️ [IMD-CALENDAR-COMPONENT] Data length:', data?.length);
        setCalendarData(data || []);
      } catch (err) {
        console.error('❌ [IMD-CALENDAR-COMPONENT] Failed to load calendar data:', err);
        setError('Failed to load calendar data');
        setCalendarData([]);
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, [year, selectedMonth]);

  // Reset to May when year changes
  useEffect(() => {
    setSelectedMonth(5);
  }, [year]);

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const firstDay = new Date(year, selectedMonth - 1, 1);
    const lastDay = new Date(year, selectedMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Create a map of date -> data
    const dataMap = new Map<string, IMDHeatCalendarDay>();
    calendarData.forEach(day => {
      dataMap.set(day.date, day);
    });

    // Build grid
    const grid: (IMDHeatCalendarDay | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = dataMap.get(dateStr);
      
      if (dayData) {
        grid.push(dayData);
      } else {
        // Create placeholder for missing data
        grid.push({
          date: dateStr,
          tmax_c: null,
          tmin_c: null,
          tmax_bin: null,
          hw_flag: 0,
          wn_flag: 0
        });
      }
    }

    return grid;
  };

  const calendarGrid = generateCalendarGrid();

  const handlePrevMonth = () => {
    setSelectedMonth(prev => prev === 1 ? 12 : prev - 1);
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => prev === 12 ? 1 : prev + 1);
  };

  const handleDayHover = (day: IMDHeatCalendarDay | null, event: React.MouseEvent) => {
    if (day && day.date) {
      setHoveredDay(day);
      
      // Store cursor position directly
      const screenWidth = window.innerWidth;
      const tooltipWidth = 200; // maxWidth of tooltip
      const padding = 20; // safety padding from screen edge
      
      // Check if tooltip would overflow on the right side
      const wouldOverflowRight = event.clientX + tooltipWidth + padding > screenWidth;
      
      setTooltipPosition({ x: event.clientX, y: event.clientY });
      setTooltipOnLeft(wouldOverflowRight);
    } else {
      setHoveredDay(null);
    }
  };

  const handleDayLeave = () => {
    setHoveredDay(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-[#0F172A]">
          Daily Heat Intensity Calendar – IMD
        </h3>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-[#F8FAFC] rounded-lg px-3 py-2 border border-[#E5E7EB]">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-white rounded transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4 text-[#64748B]" />
        </button>
        
        <span className="text-[11px] font-semibold text-[#0F172A] min-w-[100px] text-center">
          {MONTHS[selectedMonth - 1]} {year}
        </span>
        
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-white rounded transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4 text-[#64748B]" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="w-4 h-4 border-2 border-[#EF4444] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[9px] text-[#64748B]">Loading calendar...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-[10px] text-[#EF4444] text-center py-4">
            {error}
          </div>
        )}

        {!error && (
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-[9px] font-semibold text-[#64748B] py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dayNumber = new Date(day.date).getDate();
                const bgColor = TEMP_BIN_COLORS[day.tmax_bin as keyof typeof TEMP_BIN_COLORS] || TEMP_BIN_COLORS.null;
                const hasHeatwave = day.hw_flag === 1;
                const hasWarmNight = day.wn_flag === 1;

                return (
                  <div
                    key={day.date}
                    className="aspect-square border border-[#E5E7EB] rounded flex flex-col items-center justify-center p-1 cursor-pointer hover:ring-2 hover:ring-[#EF4444] hover:ring-offset-1 transition-all relative"
                    style={{ backgroundColor: bgColor }}
                    onMouseEnter={(e) => handleDayHover(day, e)}
                    onMouseMove={(e) => handleDayHover(day, e)}
                    onMouseLeave={handleDayLeave}
                  >
                    <div className="text-[10px] font-semibold text-[#0F172A]">
                      {dayNumber}
                    </div>
                    <div className="flex gap-0.5 mt-0.5">
                      {hasHeatwave && <Flame className="w-2.5 h-2.5 text-[#EF4444]" />}
                      {hasWarmNight && <Moon className="w-2.5 h-2.5 text-[#3B82F6]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-[#EF4444]" />
            <span className="text-[9px] text-[#64748B]">Heatwave Day</span>
          </div>
          <div className="flex items-center gap-1">
            <Moon className="w-3 h-3 text-[#3B82F6]" />
            <span className="text-[9px] text-[#64748B]">Warm Night</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-[9999] bg-[#1E293B] text-white rounded-lg shadow-lg p-3 pointer-events-none"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            maxWidth: '200px',
            transform: tooltipOnLeft 
              ? 'translate(calc(-100% - 10px), 10px)' 
              : 'translate(10px, 10px)'
          }}
        >
          <div className="text-[10px] font-semibold mb-2 border-b border-white/20 pb-1.5">
            {new Date(hoveredDay.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </div>
          <div className="space-y-1 text-[9px]">
            <div className="flex justify-between gap-3">
              <span className="text-white/70">Max Temp:</span>
              <span className="font-semibold">
                {hoveredDay.tmax_c !== null ? `${hoveredDay.tmax_c}°C` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/70">Min Temp:</span>
              <span className="font-semibold">
                {hoveredDay.tmin_c !== null ? `${hoveredDay.tmin_c}°C` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/70">Heatwave:</span>
              <span className="font-semibold">
                {hoveredDay.hw_flag === 1 ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/70">Warm Night:</span>
              <span className="font-semibold">
                {hoveredDay.wn_flag === 1 ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}