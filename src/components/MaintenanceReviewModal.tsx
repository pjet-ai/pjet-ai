import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, DollarSign, MapPin, Wrench, FileText, User, Plane } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExtractedMaintenance {
  // Required fields
  invoice_date: string;
  vendor_name: string;
  total_amount: number;
  currency: string;
  
  // Basic financial fields
  subtotal?: number;
  tax_amount?: number;
  invoice_number?: string;
  
  // Work description fields
  work_description?: string;
  maintenance_type?: string;
  service_location?: string;
  notes?: string;
  
  // Aviation-specific fields
  work_order_number?: string;
  technician_name?: string;
  technician_license?: string;
  aircraft_registration?: string;
  aircraft_hours_total?: number;
  aircraft_cycles_total?: number;
  aircraft_hours_since_overhaul?: number;
  aircraft_cycles_since_overhaul?: number;
  
  // Labor and parts
  labor_hours?: number;
  labor_rate_per_hour?: number;
  labor_total?: number;
  parts_total?: number;
  parts_description?: string;
  shop_supplies_total?: number;
  
  // Regulatory compliance
  compliance_reference?: string;
  airworthiness_directive?: string;
  service_bulletin_reference?: string;
  inspection_type?: string;
  next_inspection_hours?: number;
  next_inspection_cycles?: number;
  next_inspection_due?: string;
  return_to_service_date?: string;
  mechanic_signature?: string;
  inspector_signature?: string;
  
  // Vendor information
  vendor_address?: string;
  vendor_phone?: string;
  vendor_faa_certificate?: string;
  payment_terms?: string;
  warranty_period?: string;
  warranty_description?: string;
}

interface MaintenanceDuplicate {
  id: string;
  date: string; // Real column name
  vendor: string; // Real column name
  total: number; // Real column name
}

interface MaintenanceReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData: ExtractedMaintenance | null;
  duplicates: MaintenanceDuplicate[];
  maintenanceId?: string;
  onMaintenanceUpdated: () => void;
  mode?: 'create' | 'edit' | 'view';
  existingRecord?: any; // For edit mode
}

const maintenanceTypes = [
  'Preventive',
  'Corrective',
  'Overhaul',
  'Inspection',
  'Modification',
  'Repair',
  'Replacement',
  'Other'
];

const complianceStandards = [
  'FAA Part 91',
  'FAA Part 135',
  'EASA CS-25',
  'TCCA CAR 571',
  'Manufacturer Service Bulletin',
  'Airworthiness Directive',
  'Other'
];

const paymentMethods = [
  'Credit Card',
  'Cash',
  'Bank Transfer',
  'Company Account',
  'Purchase Order',
  'Other'
];

const currencies = [
  'USD', 'EUR', 'GBP', 'CAD', 'AED', 'SAR', 'JPY', 'AUD'
];

export const MaintenanceReviewModal = ({ 
  open, 
  onOpenChange, 
  extractedData, 
  duplicates, 
  maintenanceId,
  onMaintenanceUpdated,
  mode = 'create',
  existingRecord
}: MaintenanceReviewModalProps) => {
  const [formData, setFormData] = useState<ExtractedMaintenance>({
    invoice_date: '',
    vendor_name: '',
    total_amount: 0,
    currency: 'USD'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (mode === 'edit' && existingRecord) {
      // Map existing record to form data format
      setFormData({
        invoice_date: existingRecord.date || '',
        vendor_name: existingRecord.vendor || '',
        total_amount: existingRecord.total || 0,
        currency: existingRecord.currency || 'USD',
        subtotal: existingRecord.subtotal,
        tax_amount: existingRecord.tax_total,
        invoice_number: existingRecord.invoice_number,
        work_description: existingRecord.work_description,
        maintenance_type: existingRecord.maintenance_type,
        service_location: existingRecord.location,
        work_order_number: existingRecord.work_order_number,
        technician_name: existingRecord.technician_name,
        technician_license: existingRecord.technician_license,
        aircraft_registration: existingRecord.aircraft_registration,
        labor_hours: existingRecord.labor_hours,
        compliance_reference: existingRecord.compliance_reference,
        notes: existingRecord.notes,
      });
    } else if (extractedData) {
      setFormData({ ...extractedData });
    }
  }, [extractedData, existingRecord, mode]);

  const handleSave = async () => {
    if (!maintenanceId) return;
    
    setIsLoading(true);
    try {
      // Map form data to database schema (using correct column names)
      const updateData = {
        date: formData.invoice_date,              // invoice_date -> date
        vendor: formData.vendor_name,             // vendor_name -> vendor
        total: formData.total_amount,             // total_amount -> total
        currency: formData.currency,
        subtotal: formData.subtotal,
        tax_total: formData.tax_amount,           // tax_amount -> tax_total
        invoice_number: formData.invoice_number,
        work_description: formData.work_description,
        maintenance_type: formData.maintenance_type,
        work_order_number: formData.work_order_number,
        technician_name: formData.technician_name,
        location: formData.service_location,      // service_location -> location
        notes: formData.notes,
        status: 'Completed',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('maintenance_records')
        .update(updateData)
        .eq('id', maintenanceId);

      if (error) throw error;

      toast({
        title: "Maintenance Record Updated",
        description: "Your maintenance record has been saved successfully."
      });
      
      onMaintenanceUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      toast({
        title: "Error Updating Record",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExtractedMaintenance, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {mode === 'edit' ? 'Edit Maintenance Record' : 
             mode === 'view' ? 'View Maintenance Record' : 
             'Review Maintenance Invoice'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Modify the maintenance record information.' :
             mode === 'view' ? 'View the maintenance record details.' :
             'Review and edit the extracted maintenance information before saving.'}
          </DialogDescription>
        </DialogHeader>

        {duplicates.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Potential Duplicates Found</span>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              Similar maintenance records were found. Please verify this is not a duplicate:
            </p>
            <div className="space-y-2">
              {duplicates.map((duplicate) => (
                <div key={duplicate.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2 text-sm">
                  <span>{duplicate.vendor}</span>
                  <span>${duplicate.total.toFixed(2)}</span>
                  <span>{duplicate.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Basic Invoice Information */}
          <div className="space-y-2">
            <Label htmlFor="invoice_date" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Invoice Date *
            </Label>
            <Input
              id="invoice_date"
              type="date"
              value={formData.invoice_date}
              onChange={(e) => handleInputChange('invoice_date', e.target.value)}
              required
              disabled={mode === 'view'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vendor_name">Vendor Name *</Label>
            <Input
              id="vendor_name"
              value={formData.vendor_name}
              onChange={(e) => handleInputChange('vendor_name', e.target.value)}
              placeholder="Service provider name"
              required
              disabled={mode === 'view'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_number">Invoice Number</Label>
            <Input
              id="invoice_number"
              value={formData.invoice_number || ''}
              onChange={(e) => handleInputChange('invoice_number', e.target.value)}
              placeholder="Invoice/Receipt number"
            />
          </div>

          {/* Financial Information */}
          <div className="space-y-2">
            <Label htmlFor="total_amount" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total Amount *
            </Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              value={formData.total_amount}
              onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              required
              disabled={mode === 'view'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)} disabled={mode === 'view'}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtotal">Subtotal</Label>
            <Input
              id="subtotal"
              type="number"
              step="0.01"
              value={formData.subtotal || ''}
              onChange={(e) => handleInputChange('subtotal', parseFloat(e.target.value) || undefined)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_amount">Tax Amount</Label>
            <Input
              id="tax_amount"
              type="number"
              step="0.01"
              value={formData.tax_amount || ''}
              onChange={(e) => handleInputChange('tax_amount', parseFloat(e.target.value) || undefined)}
              placeholder="0.00"
            />
          </div>

          {/* Maintenance Specific Information */}
          <div className="space-y-2">
            <Label htmlFor="maintenance_type">Maintenance Type</Label>
            <Select value={formData.maintenance_type || ''} onValueChange={(value) => handleInputChange('maintenance_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select maintenance type" />
              </SelectTrigger>
              <SelectContent>
                {maintenanceTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_order_number" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Work Order Number
            </Label>
            <Input
              id="work_order_number"
              value={formData.work_order_number || ''}
              onChange={(e) => handleInputChange('work_order_number', e.target.value)}
              placeholder="WO/Job number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="technician_name" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Technician Name
            </Label>
            <Input
              id="technician_name"
              value={formData.technician_name || ''}
              onChange={(e) => handleInputChange('technician_name', e.target.value)}
              placeholder="Technician who performed work"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_location" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Service Location
            </Label>
            <Input
              id="service_location"
              value={formData.service_location || ''}
              onChange={(e) => handleInputChange('service_location', e.target.value)}
              placeholder="Airport/Facility where service was performed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aircraft_registration" className="flex items-center gap-1">
              <Plane className="h-3 w-3" />
              Aircraft Registration
            </Label>
            <Input
              id="aircraft_registration"
              value={formData.aircraft_registration || ''}
              onChange={(e) => handleInputChange('aircraft_registration', e.target.value)}
              placeholder="Aircraft tail number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="labor_hours">Labor Hours</Label>
            <Input
              id="labor_hours"
              type="number"
              step="0.1"
              value={formData.labor_hours || ''}
              onChange={(e) => handleInputChange('labor_hours', parseFloat(e.target.value) || undefined)}
              placeholder="0.0"
            />
          </div>
        </div>

        {/* Full Width Fields */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="work_description">Work Description</Label>
            <Textarea
              id="work_description"
              value={formData.work_description || ''}
              onChange={(e) => handleInputChange('work_description', e.target.value)}
              placeholder="Description of maintenance work performed"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parts_used">Parts Used</Label>
            <Textarea
              id="parts_used"
              value={formData.parts_used || ''}
              onChange={(e) => handleInputChange('parts_used', e.target.value)}
              placeholder="List of parts used in maintenance"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="next_inspection_due">Next Inspection Due</Label>
              <Input
                id="next_inspection_due"
                type="date"
                value={formData.next_inspection_due || ''}
                onChange={(e) => handleInputChange('next_inspection_due', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compliance_reference">Compliance Reference</Label>
              <Input
                id="compliance_reference"
                value={formData.compliance_reference || ''}
                onChange={(e) => handleInputChange('compliance_reference', e.target.value)}
                placeholder="FAA/EASA reference or AD compliance"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes, observations, or special instructions"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {mode !== 'view' && (
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 
               mode === 'edit' ? 'Update Maintenance Record' : 'Save Maintenance Record'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
