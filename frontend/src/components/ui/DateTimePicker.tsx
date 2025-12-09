'use client';

import { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FormLabel, FormError, FormHelper } from './FormField';
import {
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  getHours,
  getMinutes,
  startOfWeek,
  endOfWeek,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================
// CONSTANTS
// ============================================
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
});

// ============================================
// DROPDOWN VARIANTS
// ============================================
const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

// ============================================
// DATE PICKER COMPONENT
// ============================================
interface DatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: Date | string | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  required?: boolean;
  containerClassName?: string;
  className?: string;
  id?: string;
  name?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      error,
      helperText,
      value,
      onChange,
      placeholder = 'Selecione uma data',
      minDate,
      maxDate,
      disabled = false,
      required = false,
      containerClassName,
      className,
      id,
      name,
    },
    ref
  ) => {
    const inputId = id || name;
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(
      value ? (typeof value === 'string' ? parseISO(value) : value) : new Date()
    );

    const selectedDate = value
      ? typeof value === 'string'
        ? parseISO(value)
        : value
      : null;

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Generate calendar days
    const calendarDays = useCallback(() => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const calendarStart = startOfWeek(monthStart, { locale: ptBR });
      const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth]);

    const handleDateSelect = (date: Date) => {
      onChange?.(date);
      setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(null);
    };

    const isDateDisabled = (date: Date) => {
      if (minDate && isBefore(date, minDate)) return true;
      if (maxDate && isAfter(date, maxDate)) return true;
      return false;
    };

    return (
      <div className={cn('w-full', containerClassName)} ref={containerRef}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <div className="relative mt-1">
          <input
            ref={ref}
            type="hidden"
            id={inputId}
            name={name}
            value={selectedDate ? selectedDate.toISOString() : ''}
          />
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2 pl-10 pr-10 rounded-lg bg-dark-800 border text-left',
              'text-white placeholder-dark-400 transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              disabled && 'opacity-60 cursor-not-allowed',
              !selectedDate && 'text-dark-400',
              className
            )}
          >
            {selectedDate
              ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : placeholder}
          </button>
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          {selectedDate && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}

          <AnimatePresence>
            {isOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute z-50 mt-2 p-4 bg-dark-800 border border-dark-600 rounded-xl shadow-lg w-full min-w-[300px]"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <span className="font-medium capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Days of week */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs text-dark-400 font-medium py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays().map((day, index) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDayToday = isToday(day);
                    const isDisabled = isDateDisabled(day);

                    return (
                      <motion.button
                        key={index}
                        type="button"
                        whileHover={!isDisabled ? { scale: 1.1 } : undefined}
                        whileTap={!isDisabled ? { scale: 0.95 } : undefined}
                        onClick={() => !isDisabled && handleDateSelect(day)}
                        disabled={isDisabled}
                        className={cn(
                          'p-2 text-sm rounded-lg transition-colors',
                          isSelected && 'bg-primary-500 text-white font-medium',
                          !isSelected && isDayToday && 'bg-primary-500/20 text-primary-400',
                          !isSelected && !isDayToday && isCurrentMonth && 'hover:bg-dark-700',
                          !isCurrentMonth && 'text-dark-500',
                          isDisabled && 'opacity-30 cursor-not-allowed'
                        )}
                      >
                        {format(day, 'd')}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-dark-700">
                  <button
                    type="button"
                    onClick={() => handleDateSelect(new Date())}
                    className="flex-1 py-1.5 text-sm text-primary-400 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange?.(null)}
                    className="flex-1 py-1.5 text-sm text-dark-400 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          {error ? (
            <FormError message={error} className="mt-1.5" />
          ) : helperText ? (
            <FormHelper className="mt-1.5">{helperText}</FormHelper>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

// ============================================
// TIME PICKER COMPONENT
// ============================================
interface TimePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string | null;
  onChange?: (time: string | null) => void;
  placeholder?: string;
  minTime?: string;
  maxTime?: string;
  disabled?: boolean;
  required?: boolean;
  containerClassName?: string;
  className?: string;
  id?: string;
  name?: string;
  interval?: number; // in minutes
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      label,
      error,
      helperText,
      value,
      onChange,
      placeholder = 'Selecione um horário',
      minTime,
      maxTime,
      disabled = false,
      required = false,
      containerClassName,
      className,
      id,
      name,
      interval = 30,
    },
    ref
  ) => {
    const inputId = id || name;
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Generate time options based on interval
    const timeOptions = Array.from({ length: Math.floor(1440 / interval) }, (_, i) => {
      const totalMinutes = i * interval;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isTimeDisabled = (time: string) => {
      if (minTime && time < minTime) return true;
      if (maxTime && time > maxTime) return true;
      return false;
    };

    const handleTimeSelect = (time: string) => {
      onChange?.(time);
      setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(null);
    };

    return (
      <div className={cn('w-full', containerClassName)} ref={containerRef}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <div className="relative mt-1">
          <input
            ref={ref}
            type="hidden"
            id={inputId}
            name={name}
            value={value || ''}
          />
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2 pl-10 pr-10 rounded-lg bg-dark-800 border text-left',
              'text-white placeholder-dark-400 transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              disabled && 'opacity-60 cursor-not-allowed',
              !value && 'text-dark-400',
              className
            )}
          >
            {value || placeholder}
          </button>
          <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}

          <AnimatePresence>
            {isOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute z-50 mt-2 py-2 bg-dark-800 border border-dark-600 rounded-xl shadow-lg w-full max-h-60 overflow-auto"
              >
                {timeOptions.map((time) => {
                  const isSelected = value === time;
                  const isDisabled = isTimeDisabled(time);

                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => !isDisabled && handleTimeSelect(time)}
                      disabled={isDisabled}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm transition-colors',
                        isSelected && 'bg-primary-500 text-white',
                        !isSelected && 'hover:bg-dark-700',
                        isDisabled && 'opacity-30 cursor-not-allowed'
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          {error ? (
            <FormError message={error} className="mt-1.5" />
          ) : helperText ? (
            <FormHelper className="mt-1.5">{helperText}</FormHelper>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

TimePicker.displayName = 'TimePicker';

// ============================================
// DATE TIME PICKER COMPONENT
// ============================================
interface DateTimePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: Date | string | null;
  onChange?: (dateTime: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  minTime?: string;
  maxTime?: string;
  disabled?: boolean;
  required?: boolean;
  containerClassName?: string;
  className?: string;
  id?: string;
  name?: string;
  timeInterval?: number;
}

export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  (
    {
      label,
      error,
      helperText,
      value,
      onChange,
      placeholder = 'Selecione data e hora',
      minDate,
      maxDate,
      minTime,
      maxTime,
      disabled = false,
      required = false,
      containerClassName,
      className,
      id,
      name,
      timeInterval = 30,
    },
    ref
  ) => {
    const inputId = id || name;
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'date' | 'time'>('date');
    const [currentMonth, setCurrentMonth] = useState<Date>(
      value ? (typeof value === 'string' ? parseISO(value) : value) : new Date()
    );
    const [tempDate, setTempDate] = useState<Date | null>(
      value ? (typeof value === 'string' ? parseISO(value) : value) : null
    );

    const selectedDateTime = value
      ? typeof value === 'string'
        ? parseISO(value)
        : value
      : null;

    // Generate time options based on interval
    const timeOptions = Array.from({ length: Math.floor(1440 / timeInterval) }, (_, i) => {
      const totalMinutes = i * timeInterval;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    });

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setView('date');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Generate calendar days
    const calendarDays = useCallback(() => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const calendarStart = startOfWeek(monthStart, { locale: ptBR });
      const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth]);

    const handleDateSelect = (date: Date) => {
      // Preserve time if there was a previous selection
      if (tempDate) {
        const newDate = setHours(setMinutes(date, getMinutes(tempDate)), getHours(tempDate));
        setTempDate(newDate);
      } else {
        // Set default time to current time rounded to interval
        const now = new Date();
        const roundedMinutes = Math.ceil(getMinutes(now) / timeInterval) * timeInterval;
        const newDate = setHours(setMinutes(date, roundedMinutes % 60), getHours(now) + Math.floor(roundedMinutes / 60));
        setTempDate(newDate);
      }
      setView('time');
    };

    const handleTimeSelect = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const dateToUse = tempDate || new Date();
      const newDateTime = setHours(setMinutes(dateToUse, minutes), hours);
      setTempDate(newDateTime);
      onChange?.(newDateTime);
      setIsOpen(false);
      setView('date');
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(null);
      setTempDate(null);
    };

    const isDateDisabled = (date: Date) => {
      if (minDate && isBefore(date, minDate)) return true;
      if (maxDate && isAfter(date, maxDate)) return true;
      return false;
    };

    const isTimeDisabled = (time: string) => {
      if (minTime && time < minTime) return true;
      if (maxTime && time > maxTime) return true;
      return false;
    };

    return (
      <div className={cn('w-full', containerClassName)} ref={containerRef}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <div className="relative mt-1">
          <input
            ref={ref}
            type="hidden"
            id={inputId}
            name={name}
            value={selectedDateTime ? selectedDateTime.toISOString() : ''}
          />
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2 pl-10 pr-10 rounded-lg bg-dark-800 border text-left',
              'text-white placeholder-dark-400 transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              disabled && 'opacity-60 cursor-not-allowed',
              !selectedDateTime && 'text-dark-400',
              className
            )}
          >
            {selectedDateTime
              ? format(selectedDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : placeholder}
          </button>
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          {selectedDateTime && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}

          <AnimatePresence>
            {isOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute z-50 mt-2 p-4 bg-dark-800 border border-dark-600 rounded-xl shadow-lg w-full min-w-[300px]"
              >
                {/* View Toggle */}
                <div className="flex mb-4 p-1 bg-dark-900 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setView('date')}
                    className={cn(
                      'flex-1 py-1.5 text-sm rounded-md transition-colors flex items-center justify-center gap-1',
                      view === 'date' && 'bg-primary-500 text-white',
                      view !== 'date' && 'text-dark-400 hover:text-white'
                    )}
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('time')}
                    className={cn(
                      'flex-1 py-1.5 text-sm rounded-md transition-colors flex items-center justify-center gap-1',
                      view === 'time' && 'bg-primary-500 text-white',
                      view !== 'time' && 'text-dark-400 hover:text-white'
                    )}
                  >
                    <ClockIcon className="w-4 h-4" />
                    Hora
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {view === 'date' ? (
                    <motion.div
                      key="date"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                          className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
                        >
                          <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        <span className="font-medium capitalize">
                          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                          className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
                        >
                          <ChevronRightIcon className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Days of week */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <div
                            key={day}
                            className="text-center text-xs text-dark-400 font-medium py-1"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar days */}
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays().map((day, index) => {
                          const isSelected = tempDate && isSameDay(day, tempDate);
                          const isCurrentMonth = isSameMonth(day, currentMonth);
                          const isDayToday = isToday(day);
                          const isDisabled = isDateDisabled(day);

                          return (
                            <motion.button
                              key={index}
                              type="button"
                              whileHover={!isDisabled ? { scale: 1.1 } : undefined}
                              whileTap={!isDisabled ? { scale: 0.95 } : undefined}
                              onClick={() => !isDisabled && handleDateSelect(day)}
                              disabled={isDisabled}
                              className={cn(
                                'p-2 text-sm rounded-lg transition-colors',
                                isSelected && 'bg-primary-500 text-white font-medium',
                                !isSelected && isDayToday && 'bg-primary-500/20 text-primary-400',
                                !isSelected && !isDayToday && isCurrentMonth && 'hover:bg-dark-700',
                                !isCurrentMonth && 'text-dark-500',
                                isDisabled && 'opacity-30 cursor-not-allowed'
                              )}
                            >
                              {format(day, 'd')}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="time"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.15 }}
                      className="max-h-60 overflow-auto"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        {timeOptions.map((time) => {
                          const isSelected = tempDate &&
                            `${getHours(tempDate).toString().padStart(2, '0')}:${getMinutes(tempDate).toString().padStart(2, '0')}` === time;
                          const isDisabled = isTimeDisabled(time);

                          return (
                            <motion.button
                              key={time}
                              type="button"
                              whileHover={!isDisabled ? { scale: 1.05 } : undefined}
                              whileTap={!isDisabled ? { scale: 0.95 } : undefined}
                              onClick={() => !isDisabled && handleTimeSelect(time)}
                              disabled={isDisabled}
                              className={cn(
                                'py-2 text-sm rounded-lg transition-colors',
                                isSelected && 'bg-primary-500 text-white',
                                !isSelected && 'hover:bg-dark-700',
                                isDisabled && 'opacity-30 cursor-not-allowed'
                              )}
                            >
                              {time}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Selected info */}
                {tempDate && (
                  <div className="mt-4 pt-4 border-t border-dark-700 text-center text-sm text-dark-400">
                    Selecionado: {format(tempDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          {error ? (
            <FormError message={error} className="mt-1.5" />
          ) : helperText ? (
            <FormHelper className="mt-1.5">{helperText}</FormHelper>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

// ============================================
// DATE RANGE PICKER COMPONENT
// ============================================
interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  required?: boolean;
  containerClassName?: string;
  className?: string;
  id?: string;
  name?: string;
}

export const DateRangePicker = forwardRef<HTMLInputElement, DateRangePickerProps>(
  (
    {
      label,
      error,
      helperText,
      value = { start: null, end: null },
      onChange,
      placeholder = 'Selecione um período',
      minDate,
      maxDate,
      disabled = false,
      required = false,
      containerClassName,
      className,
      id,
      name,
    },
    ref
  ) => {
    const inputId = id || name;
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState<Date>(value.start || new Date());
    const [selecting, setSelecting] = useState<'start' | 'end'>('start');

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Generate calendar days
    const calendarDays = useCallback(() => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const calendarStart = startOfWeek(monthStart, { locale: ptBR });
      const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });

      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth]);

    const handleDateSelect = (date: Date) => {
      if (selecting === 'start') {
        onChange?.({ start: date, end: null });
        setSelecting('end');
      } else {
        if (value.start && isBefore(date, value.start)) {
          // If end date is before start, swap them
          onChange?.({ start: date, end: value.start });
        } else {
          onChange?.({ start: value.start, end: date });
        }
        setSelecting('start');
        setIsOpen(false);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.({ start: null, end: null });
      setSelecting('start');
    };

    const isDateDisabled = (date: Date) => {
      if (minDate && isBefore(date, minDate)) return true;
      if (maxDate && isAfter(date, maxDate)) return true;
      return false;
    };

    const isInRange = (date: Date) => {
      if (!value.start || !value.end) return false;
      return isAfter(date, value.start) && isBefore(date, value.end);
    };

    const displayValue = () => {
      if (value.start && value.end) {
        return `${format(value.start, 'dd/MM/yyyy')} - ${format(value.end, 'dd/MM/yyyy')}`;
      }
      if (value.start) {
        return `${format(value.start, 'dd/MM/yyyy')} - ...`;
      }
      return placeholder;
    };

    return (
      <div className={cn('w-full', containerClassName)} ref={containerRef}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <div className="relative mt-1">
          <input
            ref={ref}
            type="hidden"
            id={inputId}
            name={name}
            value={
              value.start && value.end
                ? `${value.start.toISOString()},${value.end.toISOString()}`
                : ''
            }
          />
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2 pl-10 pr-10 rounded-lg bg-dark-800 border text-left',
              'text-white placeholder-dark-400 transition-all duration-fast',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
              disabled && 'opacity-60 cursor-not-allowed',
              !value.start && 'text-dark-400',
              className
            )}
          >
            {displayValue()}
          </button>
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          {(value.start || value.end) && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}

          <AnimatePresence>
            {isOpen && (
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute z-50 mt-2 p-4 bg-dark-800 border border-dark-600 rounded-xl shadow-lg w-full min-w-[300px]"
              >
                {/* Selection indicator */}
                <div className="mb-4 text-center text-sm text-dark-400">
                  {selecting === 'start'
                    ? 'Selecione a data inicial'
                    : 'Selecione a data final'}
                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <span className="font-medium capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Days of week */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs text-dark-400 font-medium py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays().map((day, index) => {
                    const isStart = value.start && isSameDay(day, value.start);
                    const isEnd = value.end && isSameDay(day, value.end);
                    const inRange = isInRange(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDayToday = isToday(day);
                    const isDisabled = isDateDisabled(day);

                    return (
                      <motion.button
                        key={index}
                        type="button"
                        whileHover={!isDisabled ? { scale: 1.1 } : undefined}
                        whileTap={!isDisabled ? { scale: 0.95 } : undefined}
                        onClick={() => !isDisabled && handleDateSelect(day)}
                        disabled={isDisabled}
                        className={cn(
                          'p-2 text-sm rounded-lg transition-colors',
                          (isStart || isEnd) && 'bg-primary-500 text-white font-medium',
                          inRange && 'bg-primary-500/30',
                          !isStart && !isEnd && !inRange && isDayToday && 'bg-primary-500/20 text-primary-400',
                          !isStart && !isEnd && !inRange && !isDayToday && isCurrentMonth && 'hover:bg-dark-700',
                          !isCurrentMonth && 'text-dark-500',
                          isDisabled && 'opacity-30 cursor-not-allowed'
                        )}
                      >
                        {format(day, 'd')}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-dark-700">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      onChange?.({ start: today, end: today });
                      setIsOpen(false);
                    }}
                    className="flex-1 py-1.5 text-sm text-primary-400 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex-1 py-1.5 text-sm text-dark-400 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          {error ? (
            <FormError message={error} className="mt-1.5" />
          ) : helperText ? (
            <FormHelper className="mt-1.5">{helperText}</FormHelper>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

DateRangePicker.displayName = 'DateRangePicker';
