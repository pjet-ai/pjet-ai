import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { UploadInvoiceModal } from '@/components/UploadInvoiceModal';
import { AuditReportModal } from '@/components/AuditReportModal';
import { MaintenanceFilters } from '@/components/MaintenanceFilters';
import { ResponsiveFilterTrigger } from '@/components/ResponsiveFilterTrigger';
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
  getInvoices,
  getMaintenanceStats,
  deleteInvoice,
  uploadInvoiceFile,
  createInvoiceRecord,
  updateInvoiceProcessingStatus,
  formatCurrency,
  formatDate,
  getStatusColor,
  getPriorityColor
} from '@/utils/maintenanceN8nUtils';
import type {
  InvoiceSummary,
  MaintenanceStats,
  MaintenanceFilters as FiltersType,
  ApiResponse,
  PaginatedResponse
} from '@/types/maintenance';
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
  Loader2,
  Plane,
  Building,
  User,
  FileCode
} from 'lucide-react';

export default function Maintenance() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({
    total_invoices: 0,
    total_amount: 0,
    this_month_amount: 0,
    pending_invoices: 0,
    processing_invoices: 0,
    completed_invoices: 0,
    total_discrepancies: 0,
    total_parts_used: 0,
    total_labor_hours: 0
  });

  // Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [auditReportModalOpen, setAuditReportModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSummary | null>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<InvoiceSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Loading states for action buttons
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({});
  const [exportLoading, setExportLoading] = useState(false);

  // Filter state with URL persistence
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceSummary[]>([]);

  // Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Get filters from URL (memoized to prevent unnecessary re-renders)
  const currentFilters = useMemo((): FiltersType => {
    return {
      search: debouncedSearchTerm,
      status: searchParams.get('status') || undefined,
      vendor: searchParams.get('vendor') || undefined,
      aircraft_registration: searchParams.get('aircraft_registration') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      processing_method: searchParams.get('processing_method') || undefined,
      min_amount: searchParams.get('min_amount') ? parseFloat(searchParams.get('min_amount')!) : undefined,
      max_amount: searchParams.get('max_amount') ? parseFloat(searchParams.get('max_amount')!) : undefined,
      discrepancy_level: searchParams.get('discrepancy_level') || undefined,
      has_discrepancies: searchParams.get('has_discrepancies') || undefined,
    };
  }, [searchParams, debouncedSearchTerm]);

  // Load maintenance invoices and stats
  const loadMaintenanceData = useCallback(async () => {
    console.log('🚀 DEBUG: Starting loadMaintenanceData...');
    console.log('👤 User:', user?.id, 'Email:', user?.email);
    console.log('🔍 User exists:', !!user);
    console.log('📅 Current date:', new Date().toISOString());
    console.log('🎯 DEBUG: currentFilters:', currentFilters);
    console.log('📄 DEBUG: currentPage:', currentPage, 'itemsPerPage:', itemsPerPage);

    // Restaurar autenticación - la conexión a Supabase ya funciona
    if (!user) {
      console.log('❌ DEBUG: No user authenticated - data loading skipped');
      return;
    }

    try {
      setLoading(true);
      console.log('✅ User authenticated, proceeding to load data...');

      // Fetch invoices with filters and pagination
      console.log('🔄 DEBUG: Calling getInvoices...');
      const invoicesResponse = await getInvoices(currentFilters, {
        page: currentPage,
        limit: itemsPerPage
      });

      console.log('📊 DEBUG: getInvoices response:', invoicesResponse);

      if (invoicesResponse.success && invoicesResponse.data) {
        console.log('✅ Invoices loaded successfully:', invoicesResponse.data.data?.length || 0, 'invoices');
        console.log('📋 DEBUG: Invoice data:', invoicesResponse.data.data);
        setInvoices(invoicesResponse.data.data || []);
        setTotalItems(invoicesResponse.data.pagination?.total || 0);
      } else {
        console.log('❌ Failed to load invoices:', invoicesResponse.error);
      }

      // Fetch stats
      console.log('📊 DEBUG: Fetching maintenance stats...');
      const statsResponse = await getMaintenanceStats();
      console.log('📈 DEBUG: Stats response:', statsResponse);

      if (statsResponse.success && statsResponse.data) {
        console.log('✅ DEBUG: Stats loaded successfully:', statsResponse.data);
        console.log('💰 DEBUG: Total amount:', statsResponse.data.total_amount);
        console.log('📅 DEBUG: This month amount:', statsResponse.data.this_month_amount);
        console.log('📋 DEBUG: Total invoices:', statsResponse.data.total_invoices);
        console.log('⚠️  DEBUG: Total discrepancies:', statsResponse.data.total_discrepancies);

        setStats(statsResponse.data);
      } else {
        console.log('❌ DEBUG: Failed to load stats:', statsResponse.error);
      }

    } catch (error) {
      console.error('❌ DEBUG: Error loading maintenance data:', error);
      toast({
        title: "Error Loading Data",
        description: `Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      console.log('🔄 DEBUG: Load maintenance data completed');
      setLoading(false);
    }
  }, [user, searchParams, debouncedSearchTerm, currentPage, itemsPerPage, toast]);

  // Enhanced filtering logic with intelligent search for aviation maintenance data
  useEffect(() => {
    let filtered = [...(invoices || [])];

    // Apply intelligent search filtering if search term exists
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();

      filtered = filtered.filter(invoice => {
        // Comprehensive search across all relevant aviation maintenance fields
        return (
          // Invoice identification
          invoice.invoice_number?.toLowerCase().includes(searchLower) ||
          invoice.work_order_number?.toLowerCase().includes(searchLower) ||
          invoice.po_number?.toLowerCase().includes(searchLower) ||

          // Aircraft and vendor information
          invoice.aircraft_registration?.toLowerCase().includes(searchLower) ||
          invoice.vendor_name?.toLowerCase().includes(searchLower) ||
          invoice.technician_name?.toLowerCase().includes(searchLower) ||
          invoice.inspector_name?.toLowerCase().includes(searchLower) ||
          invoice.service_location?.toLowerCase().includes(searchLower) ||

          // Financial data
          invoice.reported_total?.toString().includes(searchLower) ||
          invoice.currency_code?.toLowerCase().includes(searchLower) ||

          // Status and processing
          invoice.status?.toLowerCase().includes(searchLower) ||
          invoice.processing_method?.toLowerCase().includes(searchLower) ||

          // Maintenance metrics
          invoice.total_discrepancies?.toString().includes(searchLower) ||
          invoice.total_parts_used?.toString().includes(searchLower) ||
          invoice.total_actual_hours?.toString().includes(searchLower) ||

          // Search in numeric fields as strings
          (invoice.file_page_count?.toString().includes(searchLower)) ||
          (invoice.processing_days?.toString().includes(searchLower))
        );
      });
    }

    // Apply additional client-side filtering based on current filters
    // This supplements the server-side filtering for more granular control

    setFilteredInvoices(filtered);
  }, [invoices, debouncedSearchTerm, searchParams]);

  // Debug logging for stats changes
  useEffect(() => {
    console.log('📊 Stats state updated:', stats);
    console.log('💰 Total amount:', stats.total_amount);
    console.log('📋 Total invoices:', stats.total_invoices);
    console.log('🔄 This month:', stats.this_month_amount);
  }, [stats]);

  // Load data on component mount and when filters change
  useEffect(() => {
    console.log('🔄 DEBUG: useEffect triggered, calling loadMaintenanceData');
    loadMaintenanceData();
  }, [user, currentPage, itemsPerPage, debouncedSearchTerm]); // Eliminar searchParams para evitar el bucle

  // Update URL when search term changes (debounced)
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';

    if (currentSearch !== debouncedSearchTerm) {
      const newParams = new URLSearchParams(searchParams);
      if (debouncedSearchTerm) {
        newParams.set('search', debouncedSearchTerm);
      } else {
        newParams.delete('search');
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [debouncedSearchTerm, searchParams, setSearchParams]);

  // Filter handlers
  const handleFilterChange = (newFilters: FiltersType) => {
    const newParams = new URLSearchParams(searchParams);

    // Update or remove filter params
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'number') {
          newParams.set(key, value.toString());
        } else {
          newParams.set(key, value);
        }
      } else {
        newParams.delete(key);
      }
    });

    // Reset to first page when filters change
    setCurrentPage(1);
    setSearchParams(newParams, { replace: true });
  };

  const handleClearFilters = () => {
    const newParams = new URLSearchParams();
    // Keep search term if it exists
    if (debouncedSearchTerm) {
      newParams.set('search', debouncedSearchTerm);
    }
    setCurrentPage(1);
    setSearchParams(newParams, { replace: true });
  };

  // Export CSV functionality
  const handleExport = useCallback(async () => {
    if (!filteredInvoices.length) {
      toast({
        title: "No Data to Export",
        description: "There are no maintenance invoices to export.",
        variant: "destructive"
      });
      return;
    }

    setExportLoading(true);

    try {
      // Map database fields to comprehensive business-friendly column names
      const exportData = filteredInvoices.map(invoice => ({
        'Invoice Number': invoice.invoice_number,
        'Work Order Number': invoice.work_order_number,
        'PO Number': invoice.po_number || '',
        'Invoice Date': invoice.invoice_date,
        'Due Date': invoice.due_date || '',
        'Vendor Name': invoice.vendor_name,
        'Technician Name': invoice.technician_name || '',
        'Inspector Name': invoice.inspector_name || '',
        'Aircraft Registration': invoice.aircraft_registration || '',
        'Service Location': invoice.service_location || '',
        'Reported Total': formatCurrency(invoice.reported_total),
        'Currency': invoice.currency_code || 'USD',
        'Exchange Rate': invoice.exchange_rate?.toString() || '1.0',
        'Status': invoice.status,
        'Processing Method': invoice.processing_method,
        'Total Discrepancies': invoice.total_discrepancies.toString(),
        'Total Parts Used': invoice.total_parts_used.toString(),
        'Total Labor Hours': invoice.total_actual_hours?.toFixed(2) || '0.00',
        'Processing Days': invoice.processing_days?.toFixed(1) || '',
        'File Page Count': invoice.file_page_count?.toString() || '',
        'File Size (MB)': invoice.file_size_bytes ? (invoice.file_size_bytes / 1024 / 1024).toFixed(2) : '',
        'Extracted At': invoice.extracted_at || '',
        'Processed At': invoice.processed_at || '',
        'Has Cost Discrepancy': invoice.has_total_discrepancy ? 'Yes' : 'No',
        'Labor Cost Total': formatCurrency(invoice.labor_cost_total || 0),
        'Parts Cost Total': formatCurrency(invoice.parts_cost_total || 0),
        'Services Cost Total': formatCurrency(invoice.services_cost_total || 0),
        'Freight Cost Total': formatCurrency(invoice.freight_cost_total || 0)
      }));

      // Generate CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => headers.map(header =>
          `"${(row as Record<string, unknown>)[header]?.toString().replace(/"/g, '""') || ''}"`
        ).join(','))
      ].join('\n');

      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `maintenance_invoices_${timestamp}.csv`;

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
        description: `${filteredInvoices.length} maintenance invoices exported to ${filename}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export maintenance invoices. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  }, [filteredInvoices, toast]);

  // Handle upload invoice
  const handleUploadInvoice = async (data: {
    file: File;
  }) => {
    if (!user) return;

    try {
      setUploading(true);

      // Upload file directly to Supabase Storage
      // n8n will handle all processing and database updates via trigger
      const fileName = `${user.id}/maintenance/${Date.now()}_${data.file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, data.file, {
          contentType: data.file.type,
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload file');
      }

      toast({
        title: "Upload Successful",
        description: "Your invoice has been uploaded and is being processed by n8n.",
      });

      setUploadModalOpen(false);

      // Refresh data after a short delay to allow n8n processing
      setTimeout(() => {
        loadMaintenanceData();
      }, 2000);

    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Action handlers
  const handleDownloadClick = async (invoice: InvoiceSummary) => {
    if (!user) return;

    setActionLoading(prev => ({ ...prev, [`download-${invoice.id}`]: true }));

    try {
      // Construir la ruta del archivo en Supabase Storage
      // Como no tenemos el nombre exacto del archivo, buscaremos en la carpeta del usuario
      const folderPath = `${user.id}/maintenance/`;

      // Listar archivos en la carpeta de maintenance del usuario
      const { data: files, error: listError } = await supabase.storage
        .from('receipts')
        .list(folderPath);

      if (listError) {
        throw listError;
      }

      if (!files || files.length === 0) {
        throw new Error('No PDF file found for this invoice');
      }

      // Buscar un archivo que coincida con el invoice_number o el más reciente
      let targetFile = files.find(file =>
        file.name.includes(invoice.invoice_number) ||
        file.name.toLowerCase().includes('invoice') ||
        file.name.toLowerCase().includes('factura')
      );

      // Si no hay coincidencia específica, usar el archivo más reciente
      if (!targetFile) {
        targetFile = files.reduce((latest, file) => {
          return file.created_at > latest.created_at ? file : latest;
        }, files[0]);
      }

      // Obtener la URL pública del archivo
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(folderPath + targetFile.name);

      // Descargar el archivo
      const response = await fetch(urlData.publicUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = targetFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Download Complete",
        description: `Downloaded ${targetFile.name}`,
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`download-${invoice.id}`]: false }));
    }
  };

  const handleEditClick = async (invoice: InvoiceSummary) => {
    setActionLoading(prev => ({ ...prev, [`edit-${invoice.id}`]: true }));

    try {
      setSelectedInvoice(invoice);
      // For now, just show a toast - in a real implementation, this would open an edit modal
      toast({
        title: "Edit Invoice",
        description: `Editing invoice ${invoice.invoice_number}`,
      });
    } catch (error) {
      console.error('Error editing invoice:', error);
      toast({
        title: "Error",
        description: "Failed to edit invoice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [`edit-${invoice.id}`]: false }));
    }
  };

  const handleDeleteClick = (invoice: InvoiceSummary) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;

    setIsDeleting(true);
    try {
      const response = await deleteInvoice(invoiceToDelete.id);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete invoice');
      }

      toast({
        title: "Invoice Deleted",
        description: `Invoice ${invoiceToDelete.invoice_number} has been successfully deleted.`
      });

      loadMaintenanceData();
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error Deleting Invoice",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  // Calculate pagination info
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Maintenance Management</h1>
            <p className="text-muted-foreground">
              Professional aviation maintenance invoice processing with n8n integration.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setUploadModalOpen(true)}
              disabled={uploading}
              className="bg-aviation-blue hover:bg-aviation-blue/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Processing...' : 'Upload Invoice'}
            </Button>
            <Button
              onClick={() => setAuditReportModalOpen(true)}
              variant="outline"
              className="border-aviation-blue text-aviation-blue hover:bg-aviation-blue hover:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Audit Report
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Grid with Aviation Metrics - Optimized for Data Science */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Investment"
            value={formatCurrency(stats.total_amount)}
            icon={DollarSign}
            description={`${stats.total_invoices} invoice${stats.total_invoices !== 1 ? 's' : ''}`}
            trend={stats.total_amount > 0 ? { value: "$924K+ Portfolio", isPositive: true } : undefined}
          />
          <StatCard
            title="Discrepancy Density"
            value={`${stats.total_invoices > 0 ? (stats.total_discrepancies / stats.total_invoices).toFixed(0) : 0} avg`}
            icon={AlertTriangle}
            description={`${stats.total_discrepancies} total issues`}
            trend={stats.total_discrepancies > 250 ? { value: "High Complexity", isPositive: false } : { value: "Manageable", isPositive: true }}
          />
          <StatCard
            title="Financial Impact"
            value={formatCurrency(stats.this_month_amount)}
            icon={Calendar}
            description={stats.this_month_amount > 0 ? "Current month" : "Historical data"}
            trend={stats.this_month_amount > 0 ? { value: "Active Period", isPositive: true } : undefined}
          />
          <StatCard
            title="Operational Load"
            value={stats.total_labor_hours?.toFixed(1) || "0"}
            icon={User}
            description={`${stats.total_parts_used} parts tracked`}
            trend={stats.total_labor_hours > 0 ? { value: "Labor Intensive", isPositive: true } : undefined}
          />
          <StatCard
            title="Processing Queue"
            value={`${stats.processing_invoices + stats.pending_invoices}`}
            icon={Clock}
            description={`${stats.completed_invoices} completed`}
            trend={stats.processing_invoices > 0 ? { value: "Active Processing", isPositive: false } : { value: "Optimized", isPositive: true }}
          />
          <StatCard
            title="Efficiency Score"
            value={`${stats.total_invoices > 0 ? ((stats.completed_invoices / stats.total_invoices) * 100).toFixed(1) : 0}%`}
            icon={CheckCircle}
            description={`${stats.total_discrepancies} issues resolved`}
            trend={stats.completed_invoices >= stats.total_invoices ? { value: "Excellent", isPositive: true } : { value: "Improving", isPositive: false }}
          />
        </div>

        {/* Info Card for Historical Data */}
        {stats.total_amount > 0 && stats.this_month_amount === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Historical Data Available</h3>
                  <p className="text-sm text-blue-700">
                    You have ${formatCurrency(stats.total_amount)} in total maintenance records from previous periods, but no invoices for this month yet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-aviation-blue" />
                <span>Maintenance Invoices</span>
              </CardTitle>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice, aircraft, vendor, amount, status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <div className="text-xs text-muted-foreground hidden lg:block">
                  💡 Search across invoices, aircraft, vendors, amounts, and maintenance data
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
                  disabled={exportLoading || !filteredInvoices.length}
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
                <p className="text-muted-foreground">Loading maintenance invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                {invoices.length === 0 ? (
                  <>
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Maintenance Invoices</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first maintenance invoice using the button in the top right corner
                    </p>
                  </>
                ) : (
                  <>
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                    <p className="text-muted-foreground">
                      No maintenance invoices match your search criteria
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Work Order</TableHead>
                        <TableHead>Aircraft</TableHead>
                        <TableHead>Maintenance Scope</TableHead>
                        <TableHead>Financial Overview</TableHead>
                        <TableHead>Discrepancy Analysis</TableHead>
                        <TableHead className="text-right">Operations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-aviation-blue" />
                                <div>
                                  <div className="font-bold text-lg">{invoice.invoice_number}</div>
                                  <div className="text-xs text-muted-foreground">
                                    ID: {invoice.id?.toString().slice(-8)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Badge className={getStatusColor(invoice.status)}>
                                  {invoice.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {invoice.processing_method}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <FileCode className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{invoice.work_order_number}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                PO: {invoice.po_number || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                📅 {invoice.invoice_date ? formatDate(invoice.invoice_date) : 'N/A'}
                              </div>
                              {invoice.due_date && (
                                <div className="text-xs text-orange-600">
                                  ⏰ Due: {formatDate(invoice.due_date)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {invoice.aircraft_registration ? (
                                <div className="flex items-center space-x-2">
                                  <Plane className="h-4 w-4 text-aviation-blue" />
                                  <span className="font-bold text-aviation-blue">{invoice.aircraft_registration}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">No aircraft</span>
                              )}
                              <div className="text-xs">
                                <div className="font-medium">{invoice.vendor_name}</div>
                                {invoice.technician_name && (
                                  <div className="text-muted-foreground">
                                    🔧 {invoice.technician_name}
                                  </div>
                                )}
                                {invoice.inspector_name && (
                                  <div className="text-muted-foreground">
                                    ✅ {invoice.inspector_name}
                                  </div>
                                )}
                              </div>
                              {invoice.service_location && (
                                <div className="text-xs text-muted-foreground">
                                  📍 {invoice.service_location}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Wrench className="h-4 w-4 text-orange-600" />
                                <span className="font-semibold">Scope Analysis</span>
                              </div>
                              <div className="text-xs space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span>⏱️ Processing:</span>
                                  <span className={invoice.processing_days !== undefined && invoice.processing_days > 5 ? "text-red-600 font-medium" : "text-green-600"}>
                                    {invoice.processing_days !== undefined ? `${invoice.processing_days.toFixed(1)} days` : 'Pending'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span>📄 Pages:</span>
                                  <span>{invoice.file_page_count || 0}</span>
                                </div>
                                {invoice.file_size_bytes && (
                                  <div className="flex items-center space-x-2">
                                    <span>💾 Size:</span>
                                    <span>{(invoice.file_size_bytes / 1024 / 1024).toFixed(1)}MB</span>
                                  </div>
                                )}
                              </div>
                              {invoice.total_actual_hours > 0 && (
                                <div className="text-xs text-blue-600">
                                  ⚙️ Labor: {invoice.total_actual_hours.toFixed(1)}h
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="text-xl font-bold text-green-700">{formatCurrency(invoice.reported_total)}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                {invoice.labor_cost_total !== undefined && invoice.labor_cost_total > 0 && (
                                  <div className="text-blue-600">
                                    💼 Labor: {formatCurrency(invoice.labor_cost_total)}
                                  </div>
                                )}
                                {invoice.parts_cost_total !== undefined && invoice.parts_cost_total > 0 && (
                                  <div className="text-purple-600">
                                    🔧 Parts: {formatCurrency(invoice.parts_cost_total)}
                                  </div>
                                )}
                                {invoice.services_cost_total !== undefined && invoice.services_cost_total > 0 && (
                                  <div className="text-orange-600">
                                    🛠️ Services: {formatCurrency(invoice.services_cost_total)}
                                  </div>
                                )}
                                {invoice.freight_cost_total !== undefined && invoice.freight_cost_total > 0 && (
                                  <div className="text-cyan-600">
                                    🚚 Freight: {formatCurrency(invoice.freight_cost_total)}
                                  </div>
                                )}
                              </div>
                              {invoice.has_total_discrepancy && (
                                <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">
                                  ⚠️ Cost Discrepancy Detected
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {invoice.currency_code || 'USD'} @ {(invoice.exchange_rate || 1).toFixed(4)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className={`h-4 w-4 ${invoice.total_discrepancies > 100 ? 'text-red-600' : invoice.total_discrepancies > 50 ? 'text-orange-600' : 'text-yellow-600'}`} />
                                <span className="font-semibold">Discrepancy Analysis</span>
                              </div>
                              <div className="space-y-1">
                                <div className={`text-lg font-bold ${invoice.total_discrepancies > 100 ? 'text-red-700' : invoice.total_discrepancies > 50 ? 'text-orange-700' : 'text-yellow-700'}`}>
                                  {invoice.total_discrepancies} issues
                                </div>
                                {invoice.total_discrepancies > 0 && (
                                  <div className="grid grid-cols-2 gap-1 text-xs">
                                    {invoice.total_parts_used > 0 && (
                                      <div className="text-purple-600">
                                        🔧 {invoice.total_parts_used} parts
                                      </div>
                                    )}
                                    {invoice.total_actual_hours > 0 && (
                                      <div className="text-blue-600">
                                        ⏱️ {invoice.total_actual_hours.toFixed(1)}h labor
                                      </div>
                                    )}
                                  </div>
                                )}
                                {invoice.total_discrepancies > 200 && (
                                  <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
                                    🚨 High Complexity - Review Required
                                  </div>
                                )}
                                {invoice.total_discrepancies > 0 && invoice.total_discrepancies <= 200 && (
                                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                    ⚠️ Standard Complexity - Monitor
                                  </div>
                                )}
                              </div>
                              {invoice.calculated_total_cost && (
                                <div className="text-xs text-muted-foreground">
                                  Calculated: {formatCurrency(invoice.calculated_total_cost)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadClick(invoice)}
                                title="Download PDF"
                                disabled={actionLoading[`download-${invoice.id}`]}
                                className="h-8 w-8 p-0"
                              >
                                {actionLoading[`download-${invoice.id}`] ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(invoice)}
                                title="Delete Invoice"
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                disabled={isDeleting && invoiceToDelete?.id === invoice.id}
                              >
                                {isDeleting && invoiceToDelete?.id === invoice.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {startItem} to {endItem} of {totalItems} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Upload Invoice Modal */}
        <UploadInvoiceModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUploadInvoice}
          uploading={uploading}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Maintenance Invoice
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Are you sure you want to delete this maintenance invoice? This action cannot be undone.</p>
                {invoiceToDelete && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <div><strong>Invoice:</strong> {invoiceToDelete.invoice_number}</div>
                    <div><strong>Vendor:</strong> {invoiceToDelete.vendor_name}</div>
                    <div><strong>Date:</strong> {invoiceToDelete.invoice_date}</div>
                    <div><strong>Amount:</strong> {formatCurrency(invoiceToDelete.reported_total)}</div>
                    {invoiceToDelete.aircraft_registration && (
                      <div><strong>Aircraft:</strong> {invoiceToDelete.aircraft_registration}</div>
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
                {isDeleting ? 'Deleting...' : 'Delete Invoice'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Audit Report Modal - Placeholder for new implementation */}
        <AuditReportModal
          isOpen={auditReportModalOpen}
          onClose={() => setAuditReportModalOpen(false)}
        />
      </div>
    </Layout>
  );
}