import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left bg-white border border-gray-200 rounded-xl transition-all cursor-pointer focus:outline-none hover:border-gray-300 ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
        } ${isOpen ? 'ring-2 ring-amber-700/20 border-amber-600/40' : ''}`}
      >
        <span className="truncate font-medium text-gray-800">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200 ml-1.5 ${
            isOpen ? 'rotate-180 text-gray-700' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Options Menu */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-popup py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary-dark)',
                      }
                    : {}
                }
              >
                <div className="min-w-0 pr-2">
                  <div className="truncate">{option.label}</div>
                  {option.description && (
                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <Check
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: 'var(--color-primary-accent)' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
