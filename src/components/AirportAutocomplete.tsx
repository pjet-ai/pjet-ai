import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Plane, 
  Search,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface Airport {
  id: number;
  iata_code?: string;
  icao_code?: string;
  airport_name: string;
  city: string;
  country: string;
  country_code: string;
}

interface AirportAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  required?: boolean;
  className?: string;
}

const AirportAutocomplete: React.FC<AirportAutocompleteProps> = ({
  label,
  placeholder,
  value,
  onChange,
  description,
  required = false,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const debouncedValue = useDebounce(value, 300);

  // Fetch airport suggestions
  const fetchSuggestions = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Clean the search term for better matching
      const cleanSearchTerm = searchTerm.toLowerCase().trim();
      
      // Create multiple search patterns for better matching
      const searchPatterns = [
        `city.ilike.%${cleanSearchTerm}%`,
        `country.ilike.%${cleanSearchTerm}%`,
        `iata_code.ilike.%${cleanSearchTerm}%`,
        `icao_code.ilike.%${cleanSearchTerm}%`,
        `airport_name.ilike.%${cleanSearchTerm}%`,
        `country_code.ilike.%${cleanSearchTerm}%`
      ];

      // Special handling for country codes and short terms
      if (cleanSearchTerm.length <= 3) {
        // For short terms, prioritize country codes and IATA codes
        searchPatterns.unshift(`country_code.ilike.%${cleanSearchTerm}%`);
        searchPatterns.unshift(`iata_code.ilike.%${cleanSearchTerm}%`);
      }

      const { data, error } = await supabase
        .from('airports')
        .select('id, iata_code, icao_code, airport_name, city, country, country_code')
        .or(searchPatterns.join(','))
        .order('country')
        .order('city')
        .limit(15);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error fetching airport suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (debouncedValue && debouncedValue.length >= 2) {
      // Only search if the value doesn't look like a complete selection
      // (complete selections have parentheses and are longer)
      const isCompleteSelection = debouncedValue.includes('(') && debouncedValue.includes(')');
      
      if (!isCompleteSelection) {
        fetchSuggestions(debouncedValue);
        setIsOpen(true);
      } else {
        // If it's a complete selection, close the dropdown
        setIsOpen(false);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [debouncedValue]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (airport: Airport) => {
    const displayValue = `${airport.airport_name} (${airport.city}, ${airport.country})`;
    onChange(displayValue);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear input
  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="airport-input" className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            id="airport-input"
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            className="pl-10 pr-10"
            autoComplete="off"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && (suggestions.length > 0 || loading) && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {loading ? (
              <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Searching airports...
              </div>
            ) : (
              suggestions.map((airport, index) => (
                <div
                  key={airport.id}
                  onClick={() => handleSuggestionSelect(airport)}
                  className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Plane className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {airport.airport_name}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {airport.city}, {airport.country}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {airport.iata_code && (
                        <Badge variant="secondary" className="text-xs">
                          {airport.iata_code}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}

    </div>
  );
};

export default AirportAutocomplete;
