'use client';

import { useState, useEffect, useRef, useMemo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FormLabel, FormError, FormHelper } from './FormField';
import {
  ChevronDownIcon,
  XMarkIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

// ============================================
// TYPES
// ============================================
export interface SelectOption<T = string> {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

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

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

// ============================================
// MULTI SELECT COMPONENT
// ============================================
interface MultiSelectProps<T = string> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: T[];
  onChange?: (value: T[]) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxItems?: number;
  showSelectAll?: boolean;
  containerClassName?: string;
  className?: string;
  id?: string;
  name?: string;
  renderOption?: (option: SelectOption<T>, isSelected: boolean) => React.ReactNode;
  renderBadge?: (option: SelectOption<T>) => React.ReactNode;
}

export function MultiSelect<T = string>({
  label,
  error,
  helperText,
  value = [],
  onChange,
  options,
  placeholder = 'Selecione...',
  searchable = true,
  searchPlaceholder = 'Buscar...',
  disabled = false,
  required = false,
  maxItems,
  showSelectAll = true,
  containerClassName,
  className,
  id,
  name,
  renderOption,
  renderBadge,
}: MultiSelectProps<T>) {
  const inputId = id || name;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  // Get selected options
  const selectedOptions = useMemo(() => {
    return options.filter((opt) => value.includes(opt.value));
  }, [options, value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (isOpen) setSearch('');
    }
  };

  const handleSelect = (optionValue: T) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : maxItems && value.length >= maxItems
      ? value
      : [...value, optionValue];
    onChange?.(newValue);
  };

  const handleRemove = (optionValue: T, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(value.filter((v) => v !== optionValue));
  };

  const handleSelectAll = () => {
    if (value.length === options.filter(o => !o.disabled).length) {
      onChange?.([]);
    } else {
      const selectableOptions = options
        .filter(o => !o.disabled)
        .map(o => o.value);
      const limitedOptions = maxItems
        ? selectableOptions.slice(0, maxItems)
        : selectableOptions;
      onChange?.(limitedOptions);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.([]);
  };

  const isAllSelected = value.length === options.filter(o => !o.disabled).length;
  const canSelectMore = !maxItems || value.length < maxItems;

  return (
    <div className={cn('w-full', containerClassName)} ref={containerRef}>
      {label && (
        <FormLabel htmlFor={inputId} required={required}>
          {label}
        </FormLabel>
      )}
      <div className="relative mt-1">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            'w-full min-h-[42px] px-4 py-2 pr-16 rounded-lg bg-dark-800 border text-left',
            'text-white transition-all duration-fast',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
            disabled && 'opacity-60 cursor-not-allowed',
            className
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-dark-400">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              <AnimatePresence mode="popLayout">
                {selectedOptions.slice(0, 3).map((option) => (
                  <motion.span
                    key={String(option.value)}
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-primary-500/20 text-primary-400 rounded-md"
                  >
                    {renderBadge ? renderBadge(option) : option.label}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(option.value, e)}
                      className="hover:text-white transition-colors"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {selectedOptions.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 text-sm bg-dark-700 text-dark-400 rounded-md">
                  +{selectedOptions.length - 3}
                </span>
              )}
            </div>
          )}
        </button>

        {/* Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedOptions.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-dark-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <ChevronDownIcon
            className={cn(
              'w-5 h-5 text-dark-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute z-50 mt-2 py-2 bg-dark-800 border border-dark-600 rounded-xl shadow-lg w-full max-h-72 overflow-hidden flex flex-col"
            >
              {/* Search Input */}
              {searchable && (
                <div className="px-3 pb-2 border-b border-dark-700">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* Select All */}
              {showSelectAll && !search && options.length > 1 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2',
                    'hover:bg-dark-700 border-b border-dark-700'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center',
                      isAllSelected
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-dark-500'
                    )}
                  >
                    {isAllSelected && <CheckIcon className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-dark-300">
                    {isAllSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                  </span>
                </button>
              )}

              {/* Options */}
              <div className="overflow-y-auto flex-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-dark-400 text-sm">
                    Nenhuma opção encontrada
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = value.includes(option.value);
                    const isDisabled = option.disabled || (!isSelected && !canSelectMore);

                    return (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() => !isDisabled && handleSelect(option.value)}
                        disabled={isDisabled}
                        className={cn(
                          'w-full px-4 py-2 text-left transition-colors flex items-center gap-3',
                          isSelected && 'bg-primary-500/10',
                          !isSelected && !isDisabled && 'hover:bg-dark-700',
                          isDisabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                            isSelected
                              ? 'bg-primary-500 border-primary-500'
                              : 'border-dark-500'
                          )}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <CheckIcon className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {renderOption ? (
                          renderOption(option, isSelected)
                        ) : (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {option.icon}
                              <span className="text-sm font-medium truncate">
                                {option.label}
                              </span>
                            </div>
                            {option.description && (
                              <p className="text-xs text-dark-400 truncate mt-0.5">
                                {option.description}
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Max items warning */}
              {maxItems && value.length >= maxItems && (
                <div className="px-4 py-2 text-xs text-amber-400 bg-amber-500/10 border-t border-dark-700">
                  Máximo de {maxItems} item(ns) selecionado(s)
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

// ============================================
// SEARCHABLE SELECT (SINGLE)
// ============================================
interface SearchableSelectProps<T = string> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: T | null;
  onChange?: (value: T | null) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  containerClassName?: string;
  className?: string;
  id?: string;
  name?: string;
  renderOption?: (option: SelectOption<T>, isSelected: boolean) => React.ReactNode;
}

export function SearchableSelect<T = string>({
  label,
  error,
  helperText,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  disabled = false,
  required = false,
  clearable = true,
  containerClassName,
  className,
  id,
  name,
  renderOption,
}: SearchableSelectProps<T>) {
  const inputId = id || name;
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  // Get selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (isOpen) setSearch('');
    }
  };

  const handleSelect = (optionValue: T) => {
    onChange?.(optionValue);
    setIsOpen(false);
    setSearch('');
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
        {/* Trigger Button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-2 pr-12 rounded-lg bg-dark-800 border text-left',
            'text-white transition-all duration-fast',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
            disabled && 'opacity-60 cursor-not-allowed',
            !selectedOption && 'text-dark-400',
            className
          )}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.icon}
              <span className="truncate">{selectedOption.label}</span>
            </div>
          ) : (
            placeholder
          )}
        </button>

        {/* Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-dark-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <ChevronDownIcon
            className={cn(
              'w-5 h-5 text-dark-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute z-50 mt-2 py-2 bg-dark-800 border border-dark-600 rounded-xl shadow-lg w-full max-h-72 overflow-hidden flex flex-col"
            >
              {/* Search Input */}
              <div className="px-3 pb-2 border-b border-dark-700">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-dark-900 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="overflow-y-auto flex-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-dark-400 text-sm">
                    Nenhuma opção encontrada
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = option.value === value;

                    return (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() => !option.disabled && handleSelect(option.value)}
                        disabled={option.disabled}
                        className={cn(
                          'w-full px-4 py-2 text-left transition-colors flex items-center gap-3',
                          isSelected && 'bg-primary-500/10',
                          !isSelected && !option.disabled && 'hover:bg-dark-700',
                          option.disabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {renderOption ? (
                          renderOption(option, isSelected)
                        ) : (
                          <>
                            {option.icon && (
                              <span className="flex-shrink-0">{option.icon}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">
                                {option.label}
                              </div>
                              {option.description && (
                                <p className="text-xs text-dark-400 truncate mt-0.5">
                                  {option.description}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <CheckIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                            )}
                          </>
                        )}
                      </button>
                    );
                  })
                )}
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

// ============================================
// COMBOBOX (Editable Select)
// ============================================
interface ComboboxProps<T = string> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: T | null;
  onChange?: (value: T | null) => void;
  onInputChange?: (inputValue: string) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowCustom?: boolean;
  containerClassName?: string;
  className?: string;
  id?: string;
  name?: string;
}

export function Combobox<T = string>({
  label,
  error,
  helperText,
  value,
  onChange,
  onInputChange,
  options,
  placeholder = 'Digite ou selecione...',
  disabled = false,
  required = false,
  allowCustom = false,
  containerClassName,
  className,
  id,
  name,
}: ComboboxProps<T>) {
  const inputId = id || name;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Get selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    const searchLower = inputValue.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchLower) ||
        option.description?.toLowerCase().includes(searchLower)
    );
  }, [options, inputValue]);

  // Update input value when selected option changes
  useEffect(() => {
    if (selectedOption) {
      setInputValue(selectedOption.label);
    }
  }, [selectedOption]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedOption) {
          setInputValue(selectedOption.label);
        } else if (!allowCustom) {
          setInputValue('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption, allowCustom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    onInputChange?.(newValue);

    // Clear selection if input doesn't match
    if (selectedOption && newValue !== selectedOption.label) {
      onChange?.(null);
    }
  };

  const handleSelect = (optionValue: T) => {
    onChange?.(optionValue);
    setIsOpen(false);
    const selected = options.find((opt) => opt.value === optionValue);
    if (selected) {
      setInputValue(selected.label);
    }
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange?.(null);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      handleSelect(filteredOptions[0].value);
    }
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
          ref={inputRef}
          type="text"
          id={inputId}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-2 pr-12 rounded-lg bg-dark-800 border',
            'text-white placeholder-dark-400 transition-all duration-fast',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error ? 'border-red-500 focus:ring-red-500' : 'border-dark-600',
            disabled && 'opacity-60 cursor-not-allowed',
            className
          )}
        />

        {/* Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-dark-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <ChevronDownIcon
            className={cn(
              'w-5 h-5 text-dark-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (filteredOptions.length > 0 || allowCustom) && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute z-50 mt-2 py-2 bg-dark-800 border border-dark-600 rounded-xl shadow-lg w-full max-h-60 overflow-auto"
            >
              {filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full px-4 py-2 text-left transition-colors flex items-center gap-3',
                      isSelected && 'bg-primary-500/10',
                      !isSelected && !option.disabled && 'hover:bg-dark-700',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {option.icon && (
                      <span className="flex-shrink-0">{option.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {option.label}
                      </div>
                      {option.description && (
                        <p className="text-xs text-dark-400 truncate mt-0.5">
                          {option.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
              {filteredOptions.length === 0 && allowCustom && inputValue && (
                <div className="px-4 py-2 text-sm text-dark-400">
                  Pressione Enter para usar "{inputValue}"
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
