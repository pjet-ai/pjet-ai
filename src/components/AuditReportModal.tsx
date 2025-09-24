import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Download, FileText, X, Filter, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getAviationAuditData, exportMaintenanceData, formatCurrency, formatDate, getStatusColor, getPriorityColor } from '@/utils/maintenanceN8nUtils';
import type { AviationAudit, MaintenanceFilters } from '@/types/maintenance';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditFilters extends MaintenanceFilters {
  include_completed?: boolean;
  include_pending?: boolean;
  aircraft_registration?: string;
  vendor?: string;
}

export function AuditReportModal({ isOpen, onClose }: AuditReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState<AviationAudit[]>([]);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch audit data when filters change
  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAviationAuditData(filters);
      if (result.success) {
        setAuditData(result.data);
      }
    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (isOpen) {
      fetchAuditData();
    }
  }, [isOpen, fetchAuditData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportMaintenanceData(filters, true);
      if (result.success) {
        // Create and download CSV file
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aviation-audit-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting audit data:', error);
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const updateFilter = (key: keyof AuditFilters, value: string | Date | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Calculate summary statistics
  const totalRecords = auditData.length;
  const totalAmount = auditData.reduce((sum, record) => sum + (record.cost_amount || 0), 0);
  const uniqueAircraft = new Set(auditData.map(r => r.aircraft_registration).filter(Boolean)).size;
  const uniqueVendors = new Set(auditData.map(r => r.vendor_name)).size;
  const completedRecords = auditData.filter(r => r.status === 'COMPLETED').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Aviation Audit Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{totalRecords}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{uniqueAircraft}</div>
                <div className="text-sm text-gray-600">Aircraft</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{uniqueVendors}</div>
                <div className="text-sm text-gray-600">Vendors</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{completedRecords}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Aircraft Registration</Label>
                    <Input
                      placeholder="e.g., N12345"
                      value={filters.aircraft_registration || ''}
                      onChange={(e) => updateFilter('aircraft_registration', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Input
                      placeholder="Vendor name"
                      value={filters.vendor || ''}
                      onChange={(e) => updateFilter('vendor', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select onValueChange={(value) => updateFilter('status', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="REVIEWED">Reviewed</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.date_from ? format(new Date(filters.date_from), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.date_from ? new Date(filters.date_from) : undefined}
                          onSelect={(date) => updateFilter('date_from', date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.date_to ? format(new Date(filters.date_to), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.date_to ? new Date(filters.date_to) : undefined}
                          onSelect={(date) => updateFilter('date_to', date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select onValueChange={(value) => updateFilter('priority', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="NORMAL">Normal</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Audit Data Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Audit Records</CardTitle>
                <Button onClick={handleExport} disabled={exporting || auditData.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading audit data...</div>
              ) : auditData.length === 0 ? (
                <div className="text-center py-8">No audit records found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Invoice #</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Vendor</th>
                        <th className="text-left p-2">Aircraft</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-left p-2">ATA Chapter</th>
                        <th className="text-left p-2">Priority</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditData.map((record, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{record.invoice_number}</td>
                          <td className="p-2">{formatDate(record.invoice_date)}</td>
                          <td className="p-2">{record.vendor_name}</td>
                          <td className="p-2">{record.aircraft_registration || '-'}</td>
                          <td className="p-2 max-w-xs truncate" title={record.discrepancy_description}>
                            {record.discrepancy_description || '-'}
                          </td>
                          <td className="p-2">{record.ata_code || '-'}</td>
                          <td className="p-2">
                            {record.priority && (
                              <Badge className={getPriorityColor(record.priority)}>
                                {record.priority}
                              </Badge>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {record.cost_amount ? formatCurrency(record.cost_amount) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}