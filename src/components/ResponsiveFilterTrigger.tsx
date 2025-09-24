import { useState, forwardRef } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MaintenanceFilters, FilterState } from '@/components/MaintenanceFilters';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ResponsiveFilterTriggerProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export const ResponsiveFilterTrigger = ({
  filters,
  onFilterChange,
  onClearFilters
}: ResponsiveFilterTriggerProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const isSmallScreen = useMediaQuery('(max-height: 800px)');
  const isVerySmallScreen = useMediaQuery('(max-height: 600px)');
  
  // Count active filters
  const activeFiltersCount = Object.keys(filters).length;

  // Dynamic positioning and sizing based on screen size
  const getPopoverConfig = () => {
    if (isVerySmallScreen) {
      return {
        side: 'top' as const,
        align: 'end' as const,
        maxHeight: '50vh',
        scrollHeight: '40vh'
      };
    } else if (isSmallScreen) {
      return {
        side: 'left' as const,
        align: 'start' as const,
        maxHeight: '65vh',
        scrollHeight: '50vh'
      };
    } else {
      return {
        side: 'left' as const,
        align: 'start' as const,
        maxHeight: '70vh',
        scrollHeight: '55vh'
      };
    }
  };

  const popoverConfig = getPopoverConfig();

  // Common filter content
  const FilterContent = () => (
    <MaintenanceFilters
      filters={filters}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
      onClose={() => {
        setPopoverOpen(false);
        setSheetOpen(false);
      }}
    />
  );

  // Common trigger button with forwardRef for Radix UI compatibility
  const TriggerButton = forwardRef<HTMLButtonElement>((props, ref) => (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      className="h-10 border-dashed"
      {...props}
    >
      <Filter className="mr-2 h-4 w-4" />
      Filter
      {activeFiltersCount > 0 && (
        <Badge
          variant="secondary"
          className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
        >
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  ));

  // Set displayName for debugging
  TriggerButton.displayName = 'TriggerButton';

  // Mobile/Tablet: Use Sheet (Drawer)
  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <TriggerButton />
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-full sm:w-[400px]"
          style={{ 
            height: '100vh',
            maxHeight: '100vh'
          }}
        >
          <SheetHeader className="pb-4 flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Records
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea 
            className="flex-1 pr-4"
            style={{ 
              height: 'calc(100vh - 8rem)',
              maxHeight: 'calc(100vh - 8rem)'
            }}
          >
            <FilterContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Use Enhanced Popover
  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <TriggerButton />
      </PopoverTrigger>
      <PopoverContent
        className={`w-96 p-0`}
        style={{ maxHeight: popoverConfig.maxHeight }}
        side={popoverConfig.side}
        align={popoverConfig.align}
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={24}
        sticky="always"
      >
        <ScrollArea style={{ maxHeight: popoverConfig.maxHeight }}>
          <div className="p-4">
            <FilterContent />
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
