import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { MaintenanceReviewModal } from '@/components/MaintenanceReviewModal';
import { FilterState } from '@/components/MaintenanceFilters';
import { ResponsiveFilterTrigger } from '@/components/ResponsiveFilterTrigger';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { supabase } from '@/integrations/supabase/client';
import { 
  Calendar, 
  Clock, 
  Wrench, 
  AlertTriangle, 
  CheckCircle,
  Upload,
  FileText,
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Loader2
} from 'lucide-react';

interface MaintenanceRecord {
  // Basic identification
  id: string;
  date: string; // Real column name
  vendor: string; // Real column name
  total: number; // Real column name
  currency: string;
  status: string;
  created_at: string;
  
  // Basic maintenance info
  maintenance_type: string | null;
  work_description: string | null;
  location: string | null; // Real column name
  
  // NEW AVIATION FIELDS (from migration)
  work_order_number?: string | null;
  technician_name?: string | null;
  technician_license?: string | null;
  aircraft_registration?: string | null;
  aircraft_hours_total?: number | null;
  aircraft_cycles_total?: number | null;
  aircraft_hours_since_overhaul?: number | null;
  aircraft_cycles_since_overhaul?: number | null;
  
  // Labor and parts
  labor_hours?: number | null;
  labor_rate_per_hour?: number | null;
  labor_total?: number | null;
  parts_total?: number | null;
  shop_supplies_total?: number | null;
  
  // Regulatory compliance
  compliance_reference?: string | null;
  airworthiness_directive?: string | null;
  service_bulletin_reference?: string | null;
  inspection_type?: string | null;
  next_inspection_hours?: number | null;
  next_inspection_cycles?: number | null;
  return_to_service_date?: string | null;
  mechanic_signature?: string | null;
  inspector_signature?: string | null;
  
  // Vendor information
  vendor_address?: string | null;
  vendor_phone?: string | null;
  vendor_faa_certificate?: string | null;
  payment_terms?: string | null;
  payment_method?: string | null;
  warranty_period_days?: number | null;
  warranty_description?: string | null;
  
  // Audit fields
  document_hash?: string | null;
  extracted_by_ocr?: boolean | null;
  manual_review_required?: boolean | null;
  approved_by?: string | null;
  approval_date?: string | null;
}

interface MaintenanceStats {
  totalRecords: number;
  totalCost: number;
  thisMonthCost: number;
  pendingRecords: number;
}

export default function Maintenance() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({
    totalRecords: 0,
    totalCost: 0,
    thisMonthCost: 0,
    pendingRecords: 0
  });
  
  // Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentRecord, setCurrentRecord] = useState<MaintenanceRecord | null>(null);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Loading states for action buttons
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [exportLoading, setExportLoading] = useState(false);
  
  // Filter state with URL persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  
  // Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Get filters from URL (memoized to prevent unnecessary re-renders)
  const currentFilters = useMemo((): FilterState => {
    return {
      status: searchParams.get('status') || undefined,
      maintenance_type: searchParams.get('maintenance_type') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
    };
  }, [searchParams]);

  // Load maintenance records
  const loadMaintenanceRecords = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch maintenance records
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (maintenanceError) throw maintenanceError;

      setRecords(maintenanceData || []);
      
      // Calculate stats
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const totalCost = maintenanceData?.reduce((sum, record) => sum + record.total, 0) || 0;
      const thisMonthCost = maintenanceData?.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      }).reduce((sum, record) => sum + record.total, 0) || 0;
      
      const pendingRecords = maintenanceData?.filter(record => record.status === 'Pending').length || 0;

      setStats({
        totalRecords: maintenanceData?.length || 0,
        totalCost,
        thisMonthCost,
        pendingRecords
      });

    } catch (error) {
      console.error('Error loading maintenance records:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load maintenance records. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Advanced filtering logic
  useEffect(() => {
    let filtered = [...records];
    
    // Text search (debounced)
    if (debouncedSearchTerm) {
      filtered = filtered.filter(record =>
        record.vendor.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        record.work_description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        record.work_order_number?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        record.technician_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        record.aircraft_registration?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        record.invoice_number?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (currentFilters.status) {
      filtered = filtered.filter(record => record.status === currentFilters.status);
    }
    
    // Maintenance type filter
    if (currentFilters.maintenance_type) {
      filtered = filtered.filter(record => record.maintenance_type === currentFilters.maintenance_type);
    }
    
    // Date range filter
    if (currentFilters.date_from) {
      filtered = filtered.filter(record => record.date >= currentFilters.date_from!);
    }
    
    if (currentFilters.date_to) {
      filtered = filtered.filter(record => record.date <= currentFilters.date_to!);
    }
    
    setFilteredRecords(filtered);
  }, [records, debouncedSearchTerm, currentFilters]);

  // Load data on component mount
  useEffect(() => {
    loadMaintenanceRecords();
  }, [loadMaintenanceRecords]);
  
  // Update URL when search term changes (debounced)
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    
    // Only update if the search term actually changed
    if (currentSearch !== debouncedSearchTerm) {
      const newParams = new URLSearchParams(searchParams);
      if (debouncedSearchTerm) {
        newParams.set('search', debouncedSearchTerm);
      } else {
        newParams.delete('search');
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [debouncedSearchTerm]); // Removed searchParams and setSearchParams from deps

  // Filter handlers
  const handleFilterChange = (newFilters: FilterState) => {
    const newParams = new URLSearchParams(searchParams);
    
    // Update or remove filter params
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams, { replace: true });
  };

  const handleClearFilters = () => {
    const newParams = new URLSearchParams();
    // Keep search term if it exists
    if (debouncedSearchTerm) {
      newParams.set('search', debouncedSearchTerm);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Export CSV functionality
  const handleExport = useCallback(async () => {
    if (!filteredRecords.length) {
      toast({
        title: "No Data to Export",
        description: "There are no maintenance records to export.",
        variant: "destructive"
      });
      return;
    }

    setExportLoading(true);
    
    try {
      // Map database fields to business-friendly column names
      const exportData = filteredRecords.map(record => ({
        'Date': record.date,
        'Vendor': record.vendor,
        'Aircraft Registration': record.aircraft_registration,
        'Maintenance Type': record.maintenance_type,
        'Status': record.status,
        'Work Order': record.work_order_number,
        'Technician': record.technician_name,
        'Total Amount': `$${record.total.toFixed(2)}`,
        'Tax Amount': `$${record.tax_total.toFixed(2)}`,
        'Subtotal': `$${record.subtotal.toFixed(2)}`,
        'Location': record.location,
        'Description': record.description,
        'Invoice Number': record.invoice_number,
        'Created At': new Date(record.created_at).toLocaleDateString()
      }));

      // Generate CSV
      const csv = Papa.unparse(exportData, {
        header: true,
        delimiter: ','
      });

      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `maintenance_records_${timestamp}.csv`;

      // Create and trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `${filteredRecords.length} maintenance records exported to ${filename}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export maintenance records. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  }, [filteredRecords, toast]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;



    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (20MB limit)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 20MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Call the extract-maintenance-text edge function (using same pattern as Expenses)
      const response = await supabase.functions.invoke('extract-maintenance-text', {
        body: formData,
      });

      if (response.error) throw response.error;

      const result = response.data;

      if (result.success) {
        setExtractedData(result.extractedData);
        setDuplicates(result.duplicates || []);
        setSelectedRecord(result.maintenance.id);
        setModalMode('create');
        setCurrentRecord(null);
        setReviewModalOpen(true);
        
        toast({
          title: "Invoice Processed Successfully",
          description: "Please review the extracted information before saving."
        });
      } else {
        throw new Error(result.error || 'Failed to process invoice');
      }

    } catch (error) {
      console.error('Error processing maintenance invoice:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process maintenance invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Handle record updated
  const handleRecordUpdated = () => {
    loadMaintenanceRecords();
  };

  // Action handlers
  const handleViewClick = async (record: MaintenanceRecord) => {
    setActionLoading(prev => ({ ...prev, [`view-${record.id}`]: true }));
    
    try {
      setCurrentRecord(record);
      setSelectedRecord(record.id);
      setModalMode('view');
      setExtractedData(null);
      setDuplicates([]);
      setReviewModalOpen(true);
    } finally {
      setActionLoading(prev => ({ ...prev, [`view-${record.id}`]: false }));
    }
  };

  const handleEditClick = async (record: MaintenanceRecord) => {
    setActionLoading(prev => ({ ...prev, [`edit-${record.id}`]: true }));
    
    try {
      setCurrentRecord(record);
      setSelectedRecord(record.id);
      setModalMode('edit');
      setExtractedData(null);
      setDuplicates([]);
      setReviewModalOpen(true);
    } finally {
      setActionLoading(prev => ({ ...prev, [`edit-${record.id}`]: false }));
    }
  };

  const handleDeleteClick = (record: MaintenanceRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete || !user) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) throw error;

      toast({
        title: "Maintenance Record Deleted",
        description: "The maintenance record has been successfully deleted."
      });

      loadMaintenanceRecords();
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      toast({
        title: "Error Deleting Record",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
          <h1 className="text-3xl font-bold text-foreground">Maintenance Management</h1>
          <p className="text-muted-foreground">
              Upload maintenance invoices and track service history for your aircraft fleet.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="file"
              id="maintenance-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              onClick={() => document.getElementById('maintenance-upload')?.click()}
              disabled={uploading}
              className="bg-aviation-blue hover:bg-aviation-blue/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Processing...' : 'Upload Invoice'}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Records"
            value={stats.totalRecords.toString()}
            icon={FileText}
          />
          <StatCard
            title="Total Cost"
            value={formatCurrency(stats.totalCost)}
            icon={DollarSign}
          />
          <StatCard
            title="This Month"
            value={formatCurrency(stats.thisMonthCost)}
            icon={Calendar}
          />
          <StatCard
            title="Pending"
            value={stats.pendingRecords.toString()}
            icon={Clock}
          />
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-aviation-blue" />
                <span>Maintenance Records</span>
            </CardTitle>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <ResponsiveFilterTrigger
                  filters={currentFilters}
                  onFilterChange={handleFilterChange}
                  onClearFilters={handleClearFilters}
                />
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              disabled={exportLoading || !filteredRecords.length}
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {exportLoading ? 'Exporting...' : 'Export'}
            </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
              {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-blue mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading maintenance records...</p>
                </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                {records.length === 0 ? (
                  <>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Maintenance Records</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first maintenance invoice to get started
                    </p>
                    <Button
                      onClick={() => document.getElementById('maintenance-upload')?.click()}
                      disabled={uploading}
                      className="bg-aviation-blue hover:bg-aviation-blue/90"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Invoice
                    </Button>
                  </>
                ) : (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                    <p className="text-muted-foreground">
                      No maintenance records match your search criteria
                    </p>
                  </>
                )}
                </div>
              ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden space-y-4">
                  {filteredRecords.map((record) => (
                    <Card key={record.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                          <div className="font-semibold">{record.vendor}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(record.date)}
                          </div>
                          {record.maintenance_type && (
                            <Badge variant="outline" className="text-xs">
                              {record.maintenance_type}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(record.total, record.currency)}
                          </div>
                          <Badge 
                            variant={record.status === 'Completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {(record.work_order_number || record.technician_name || record.service_location) && (
                        <div className="space-y-1 text-sm text-muted-foreground border-t pt-3">
                          {record.work_order_number && (
                            <div>WO: {record.work_order_number}</div>
                          )}
                          {record.technician_name && (
                            <div>Tech: {record.technician_name}</div>
                          )}
                          {record.location && (
                            <div>Location: {record.location}</div>
                          )}
                      </div>
                      )}
                      
                      <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                    </div>
                    
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Work Order</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.vendor}</div>
                            {record.location && (
                              <div className="text-sm text-muted-foreground">
                                {record.location}
                  </div>
              )}
            </div>
                        </TableCell>
                        <TableCell>
                          {record.maintenance_type ? (
                            <Badge variant="outline">{record.maintenance_type}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.work_order_number || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.technician_name || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(record.total, record.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={record.status === 'Completed' ? 'default' : 'secondary'}
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewClick(record)}
                              title="View Record"
                              disabled={actionLoading[`view-${record.id}`]}
                            >
                              {actionLoading[`view-${record.id}`] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditClick(record)}
                              title="Edit Record"
                              disabled={actionLoading[`edit-${record.id}`]}
                            >
                              {actionLoading[`edit-${record.id}`] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Edit className="h-4 w-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteClick(record)}
                              title="Delete Record"
                              className="hover:bg-destructive/10 hover:text-destructive"
                              disabled={isDeleting && recordToDelete?.id === record.id}
                            >
                              {isDeleting && recordToDelete?.id === record.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Review Modal */}
        <MaintenanceReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          extractedData={extractedData}
          duplicates={duplicates}
          maintenanceId={selectedRecord}
          onMaintenanceUpdated={handleRecordUpdated}
          mode={modalMode}
          existingRecord={currentRecord}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Maintenance Record
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Are you sure you want to delete this maintenance record? This action cannot be undone.</p>
                {recordToDelete && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <div><strong>Vendor:</strong> {recordToDelete.vendor}</div>
                    <div><strong>Date:</strong> {recordToDelete.date}</div>
                    <div><strong>Amount:</strong> {formatCurrency(recordToDelete.total, recordToDelete.currency)}</div>
                    {recordToDelete.work_order_number && (
                      <div><strong>Work Order:</strong> {recordToDelete.work_order_number}</div>
                    )}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}