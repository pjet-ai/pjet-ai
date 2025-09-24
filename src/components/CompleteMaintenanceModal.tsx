import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Wrench, 
  FileText, 
  User, 
  Plane,
  Package,
  Clock,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FinancialBreakdown {
  category: string;
  amount: number;
  description?: string;
  hours_worked?: number;
  rate_per_hour?: number;
}

interface PartItem {
  part_number: string;
  part_description: string;
  manufacturer?: string;
  quantity: number;
  unit_price?: number;
  total_price?: number;
  part_category?: string;
}

interface CompleteExtractedData {
  // Main record data
  invoice_date: string;
  vendor_name: string;
  total_amount: number;
  currency: string;
  invoice_number?: string;
  work_description?: string;
  maintenance_category?: string;
  aircraft_registration?: string;
  work_order_number?: string;
  technician_name?: string;
  service_location?: string;
  labor_hours?: number;
  compliance_reference?: string;
  notes?: string;
  
  // Detailed breakdowns
  financial_breakdown?: FinancialBreakdown[];
  parts_list?: PartItem[];
}

interface CompleteMaintenanceModalProps {
  open: boolean;
  onClose: () => void;
  extractedData: CompleteExtractedData | null;
  onSave: (data: any) => void;
  mode: 'create' | 'edit' | 'view';
  existingRecord?: any;
}

const maintenanceCategories = [
  'Scheduled Inspection',
  'Unscheduled Discrepancy',
  'Component Failure',
  'Corrosion',
  'Preventive Maintenance',
  'Emergency Repair'
];

export const CompleteMaintenanceModal = ({
  open,
  onClose,
  extractedData,
  onSave,
  mode,
  existingRecord
}: CompleteMaintenanceModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Main form data
  const [formData, setFormData] = useState({
    date: '',
    vendor: '',
    total: '',
    currency: 'USD',
    invoice_number: '',
    work_description: '',
    maintenance_category: '',
    aircraft_registration: '',
    work_order_number: '',
    technician_name: '',
    location: '',
    labor_hours: '',
    compliance_reference: '',
    notes: '',
    status: 'Completed'
  });

  // Financial breakdown state
  const [financialBreakdown, setFinancialBreakdown] = useState<FinancialBreakdown[]>([]);
  const [partsList, setPartsList] = useState<PartItem[]>([]);

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && existingRecord) {
        // Pre-populate for edit mode
        setFormData({
          date: existingRecord.date || '',
          vendor: existingRecord.vendor || '',
          total: existingRecord.total?.toString() || '',
          currency: existingRecord.currency || 'USD',
          invoice_number: existingRecord.invoice_number || '',
          work_description: existingRecord.work_description || '',
          maintenance_category: existingRecord.maintenance_category || '',
          aircraft_registration: existingRecord.aircraft_registration || '',
          work_order_number: existingRecord.work_order_number || '',
          technician_name: existingRecord.technician_name || '',
          location: existingRecord.location || '',
          labor_hours: existingRecord.labor_hours?.toString() || '',
          compliance_reference: existingRecord.compliance_reference || '',
          notes: existingRecord.notes || '',
          status: existingRecord.status || 'Completed'
        });
      } else if (extractedData) {
        // Pre-populate from extracted data
        setFormData({
          date: extractedData.invoice_date || '',
          vendor: extractedData.vendor_name || '',
          total: extractedData.total_amount?.toString() || '',
          currency: extractedData.currency || 'USD',
          invoice_number: extractedData.invoice_number || '',
          work_description: extractedData.work_description || '',
          maintenance_category: extractedData.maintenance_category || '',
          aircraft_registration: extractedData.aircraft_registration || '',
          work_order_number: extractedData.work_order_number || '',
          technician_name: extractedData.technician_name || '',
          location: extractedData.service_location || '',
          labor_hours: extractedData.labor_hours?.toString() || '',
          compliance_reference: extractedData.compliance_reference || '',
          notes: extractedData.notes || '',
          status: 'Completed'
        });

        // Set financial breakdown
        if (extractedData.financial_breakdown) {
          setFinancialBreakdown(extractedData.financial_breakdown);
        }

        // Set parts list
        if (extractedData.parts_list) {
          setPartsList(extractedData.parts_list);
        }
      }
    }
  }, [open, extractedData, existingRecord, mode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.date || !formData.vendor || !formData.total) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields (Date, Vendor, Total).",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const maintenanceData = {
        date: formData.date,
        vendor: formData.vendor,
        total: parseFloat(formData.total),
        currency: formData.currency,
        invoice_number: formData.invoice_number || null,
        work_description: formData.work_description || null,
        maintenance_category: formData.maintenance_category || null,
        aircraft_registration: formData.aircraft_registration || null,
        work_order_number: formData.work_order_number || null,
        technician_name: formData.technician_name || null,
        location: formData.location || null,
        labor_hours: formData.labor_hours ? parseFloat(formData.labor_hours) : null,
        compliance_reference: formData.compliance_reference || null,
        notes: formData.notes || null,
        status: formData.status
      };

      await onSave({
        maintenance: maintenanceData,
        financialBreakdown,
        partsList
      });

      toast({
        title: "Success",
        description: `Maintenance record ${mode === 'edit' ? 'updated' : 'created'} successfully.`
      });

      onClose();
    } catch (error) {
      console.error('Error saving maintenance record:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save maintenance record. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const modalTitle = mode === 'edit' ? 'Edit Maintenance Record' : 
                    mode === 'view' ? 'View Maintenance Record' : 
                    'Review Extracted Maintenance Data';

  const isViewMode = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-aviation-blue" />
            {modalTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Review and confirm the extracted maintenance information' : 
             mode === 'edit' ? 'Update the maintenance record information' :
             'Maintenance record details'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="parts">Parts</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Invoice Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="vendor">Vendor *</Label>
                      <Input
                        id="vendor"
                        value={formData.vendor}
                        onChange={(e) => handleInputChange('vendor', e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="total">Total Amount *</Label>
                        <Input
                          id="total"
                          type="number"
                          step="0.01"
                          value={formData.total}
                          onChange={(e) => handleInputChange('total', e.target.value)}
                          disabled={isViewMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="currency">Currency</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => handleInputChange('currency', value)}
                          disabled={isViewMode}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="AED">AED</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="invoice_number">Invoice Number</Label>
                      <Input
                        id="invoice_number"
                        value={formData.invoice_number}
                        onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Work Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Work Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="maintenance_category">Maintenance Category</Label>
                      <Select
                        value={formData.maintenance_category}
                        onValueChange={(value) => handleInputChange('maintenance_category', value)}
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {maintenanceCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="work_description">Work Description</Label>
                      <Textarea
                        id="work_description"
                        value={formData.work_description}
                        onChange={(e) => handleInputChange('work_description', e.target.value)}
                        disabled={isViewMode}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Service Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="work_order_number">Work Order Number</Label>
                      <Input
                        id="work_order_number"
                        value={formData.work_order_number}
                        onChange={(e) => handleInputChange('work_order_number', e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {financialBreakdown.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Rate/Hour</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialBreakdown.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Badge variant={item.category === 'Labor' ? 'default' : 'secondary'}>
                                {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(item.amount, formData.currency)}
                            </TableCell>
                            <TableCell>{item.description || '-'}</TableCell>
                            <TableCell>{item.hours_worked || '-'}</TableCell>
                            <TableCell>
                              {item.rate_per_hour ? formatCurrency(item.rate_per_hour, formData.currency) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No financial breakdown data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Parts Used ({partsList.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {partsList.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part Number</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Manufacturer</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partsList.map((part, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">
                              {part.part_number}
                            </TableCell>
                            <TableCell>{part.part_description}</TableCell>
                            <TableCell>{part.manufacturer || '-'}</TableCell>
                            <TableCell>{part.quantity}</TableCell>
                            <TableCell>
                              {part.unit_price ? formatCurrency(part.unit_price, formData.currency) : '-'}
                            </TableCell>
                            <TableCell>
                              {part.total_price ? formatCurrency(part.total_price, formData.currency) : '-'}
                            </TableCell>
                            <TableCell>
                              {part.part_category && (
                                <Badge variant="outline">{part.part_category}</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No parts data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      Aircraft Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="aircraft_registration">Aircraft Registration</Label>
                      <Input
                        id="aircraft_registration"
                        value={formData.aircraft_registration}
                        onChange={(e) => handleInputChange('aircraft_registration', e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Technician Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="technician_name">Technician Name</Label>
                      <Input
                        id="technician_name"
                        value={formData.technician_name}
                        onChange={(e) => handleInputChange('technician_name', e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="labor_hours">Labor Hours</Label>
                      <Input
                        id="labor_hours"
                        type="number"
                        step="0.1"
                        value={formData.labor_hours}
                        onChange={(e) => handleInputChange('labor_hours', e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Compliance & Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="compliance_reference">Compliance Reference</Label>
                      <Input
                        id="compliance_reference"
                        value={formData.compliance_reference}
                        onChange={(e) => handleInputChange('compliance_reference', e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        disabled={isViewMode}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-aviation-blue hover:bg-aviation-blue/90"
            >
              {loading ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Save')} Record
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
