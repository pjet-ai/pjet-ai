import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

export interface FilterState {
  status?: string;
  maintenance_type?: string;
  date_from?: string;
  date_to?: string;
  processing_method?: string;
  aircraft_registration?: string;
  vendor?: string;
  min_amount?: string;
  max_amount?: string;
  discrepancy_level?: string;
  has_discrepancies?: string;
}

interface MaintenanceFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  onClose?: () => void;
}

const statusOptions = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'In Progress' },
  { value: 'cancelled', label: 'Cancelled' }
];

const maintenanceTypeOptions = [
  { value: 'Preventive', label: 'Preventive' },
  { value: 'Corrective', label: 'Corrective' },
  { value: 'Overhaul', label: 'Overhaul' },
  { value: 'Inspection', label: 'Inspection' },
  { value: 'Modification', label: 'Modification' },
  { value: 'Repair', label: 'Repair' },
  { value: 'Replacement', label: 'Replacement' }
];

const processingMethodOptions = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'automated', label: 'Automated Processing' },
  { value: 'hybrid', label: 'Hybrid Processing' }
];

const discrepancyLevelOptions = [
  { value: 'high', label: 'High Complexity (>200 issues)' },
  { value: 'medium', label: 'Medium Complexity (50-200 issues)' },
  { value: 'low', label: 'Low Complexity (<50 issues)' }
];

export const MaintenanceFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters,
  onClose
}: MaintenanceFiltersProps) => {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const handleFilterUpdate = (key: keyof FilterState, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value && value !== 'all') {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    onFilterChange(newFilters);
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <div className="space-y-4 p-4 min-w-[320px]">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Filter Records</h4>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{activeFiltersCount} active</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClearFilters();
                onClose?.();
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => handleFilterUpdate('status', value)}
        >
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Processing Method Filter */}
      <div className="space-y-2">
        <Label htmlFor="processing-filter">Processing Method</Label>
        <Select
          value={filters.processing_method || 'all'}
          onValueChange={(value) => handleFilterUpdate('processing_method', value)}
        >
          <SelectTrigger id="processing-filter">
            <SelectValue placeholder="All methods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            {processingMethodOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Discrepancy Level Filter */}
      <div className="space-y-2">
        <Label htmlFor="discrepancy-filter">Discrepancy Level</Label>
        <Select
          value={filters.discrepancy_level || 'all'}
          onValueChange={(value) => handleFilterUpdate('discrepancy_level', value)}
        >
          <SelectTrigger id="discrepancy-filter">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {discrepancyLevelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Has Discrepancies Filter */}
      <div className="space-y-2">
        <Label htmlFor="has-discrepancies-filter">Has Discrepancies</Label>
        <Select
          value={filters.has_discrepancies || 'all'}
          onValueChange={(value) => handleFilterUpdate('has_discrepancies', value)}
        >
          <SelectTrigger id="has-discrepancies-filter">
            <SelectValue placeholder="All records" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All records</SelectItem>
            <SelectItem value="yes">Has discrepancies</SelectItem>
            <SelectItem value="no">No discrepancies</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Range Filters */}
      <div className="space-y-2">
        <Label>Date Range</Label>
        <div className="grid grid-cols-2 gap-2">
          {/* From Date */}
          <div className="space-y-1">
            <Label htmlFor="date-from" className="text-xs text-muted-foreground">From</Label>
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  id="date-from"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date_from ? format(new Date(filters.date_from), 'MMM dd') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.date_from ? new Date(filters.date_from) : undefined}
                  onSelect={(date) => {
                    handleFilterUpdate('date_from', date ? date.toISOString().split('T')[0] : undefined);
                    setDateFromOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* To Date */}
          <div className="space-y-1">
            <Label htmlFor="date-to" className="text-xs text-muted-foreground">To</Label>
            <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  id="date-to"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date_to ? format(new Date(filters.date_to), 'MMM dd') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.date_to ? new Date(filters.date_to) : undefined}
                  onSelect={(date) => {
                    handleFilterUpdate('date_to', date ? date.toISOString().split('T')[0] : undefined);
                    setDateToOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Quick Date Filters */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Quick Filters</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const sevenDaysAgo = new Date(today);
              sevenDaysAgo.setDate(today.getDate() - 7);
              
              onFilterChange({
                ...filters,
                date_from: sevenDaysAgo.toISOString().split('T')[0],
                date_to: today.toISOString().split('T')[0]
              });
            }}
          >
            Last 7 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const thirtyDaysAgo = new Date(today);
              thirtyDaysAgo.setDate(today.getDate() - 30);
              
              onFilterChange({
                ...filters,
                date_from: thirtyDaysAgo.toISOString().split('T')[0],
                date_to: today.toISOString().split('T')[0]
              });
            }}
          >
            Last 30 days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              
              onFilterChange({
                ...filters,
                date_from: firstDayOfMonth.toISOString().split('T')[0],
                date_to: today.toISOString().split('T')[0]
              });
            }}
          >
            This month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date();
              const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

              onFilterChange({
                ...filters,
                date_from: firstDayOfYear.toISOString().split('T')[0],
                date_to: today.toISOString().split('T')[0]
              });
            }}
          >
            This year
          </Button>
        </div>
      </div>

      {/* Financial Filters */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Financial Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="min-amount" className="text-xs text-muted-foreground">Min Amount</Label>
            <input
              id="min-amount"
              type="number"
              placeholder="0"
              className="w-full px-2 py-1 text-sm border rounded"
              value={filters.min_amount || ''}
              onChange={(e) => handleFilterUpdate('min_amount', e.target.value || undefined)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max-amount" className="text-xs text-muted-foreground">Max Amount</Label>
            <input
              id="max-amount"
              type="number"
              placeholder="1000000"
              className="w-full px-2 py-1 text-sm border rounded"
              value={filters.max_amount || ''}
              onChange={(e) => handleFilterUpdate('max_amount', e.target.value || undefined)}
            />
          </div>
        </div>
      </div>

      {/* Quick Filters for Aviation Maintenance */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Aviation Quick Filters</Label>
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onFilterChange({
                ...filters,
                discrepancy_level: 'high',
                has_discrepancies: 'yes'
              });
            }}
            className="justify-start"
          >
            🔥 High Complexity Maintenance
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onFilterChange({
                ...filters,
                has_discrepancies: 'yes',
                processing_method: 'manual'
              });
            }}
            className="justify-start"
          >
            ⚠️ Manual Entry with Issues
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onFilterChange({
                ...filters,
                min_amount: '100000',
                has_discrepancies: 'yes'
              });
            }}
            className="justify-start"
          >
            💰 High Value with Discrepancies
          </Button>
        </div>
      </div>
    </div>
  );
};
