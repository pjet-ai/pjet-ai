import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Receipt, 
  Eye,
  Download,
  Plus,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ExpenseReviewModal } from '@/components/ExpenseReviewModal';

interface Expense {
  id: string;
  user_id: string;
  
  // Basic expense information
  expense_type: string;
  vendor_name: string;
  total_amount: number;
  currency: string;
  description?: string;
  
  // Classification
  category_id?: string;
  category_name?: string;
  expense_type?: string;
  
  // Receipt/Invoice details
  receipt_number?: string;
  invoice_number?: string;
  payment_method?: string;
  
  // Tax information
  tax_amount?: number;
  tax_rate?: number;
  subtotal_amount?: number;
  
  // Location information
  expense_location?: string;
  expense_city?: string;
  expense_state?: string;
  expense_country?: string;
  
  // Aviation-specific fields
  aircraft_registration?: string;
  flight_reference?: string;
  trip_purpose?: string;
  business_justification?: string;
  
  // Approval workflow
  status: string;
  submitted_date?: string;
  approved_by?: string;
  approved_date?: string;
  rejection_reason?: string;
  
  // Reimbursement tracking
  reimbursement_amount?: number;
  reimbursement_date?: string;
  reimbursement_method?: string;
  
  // OCR and audit fields
  document_hash?: string;
  extracted_by_ocr?: boolean;
  ocr_confidence_score?: number;
  manual_review_required?: boolean;
  
  // Audit trail
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  expense_tax_details?: Array<{
    id: string;
    tax_type: string;
    tax_rate?: number;
    tax_amount: number;
    description?: string;
  }>;
  expense_attachments?: Array<{
    id: string;
    url: string;
    mime_type: string;
    original_name: string;
    size: number;
  }>;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentExtraction, setCurrentExtraction] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch expenses from database using new schema
  const fetchExpenses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories (
            name,
            description
          ),
          expense_tax_details (*),
          expense_attachments (*)
        `)
        .eq('user_id', user.id)
        .order('expense_type', { ascending: false });

      if (error) throw error;
      
      // Map data to include category_name for compatibility
      const mappedData = (data || []).map(expense => ({
        ...expense,
        category_name: expense.expense_categories?.name || 'Uncategorized'
      }));
      
      setExpenses(mappedData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error loading expenses",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.total_amount, 0);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.transaction_date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + expense.total_amount, 0);
  
  const receiptCount = expenses.length;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    
    try {
      const file = files[0];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Create FormData for the orchestrator
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadSource', 'expenses');

      const response = await supabase.functions.invoke('document-orchestrator', {
        body: formData,
      });

      if (response.error) throw response.error;

      const result = response.data;
      
      if (result.success) {
        setCurrentExtraction(result);
        setReviewModalOpen(true);
        
        toast({
          title: result.fromCache ? "📋 Cached Expense Found" : "✅ Expense Receipt Processed",
          description: result.fromCache ? 
            `Document already processed as expense` :
            `Extracted: ${result.summary?.vendor || 'vendor'} - $${result.summary?.totalAmount?.toLocaleString() || '0'} | ${result.summary?.category || 'category'}`,
        });
        
        // Refresh expenses list
        await fetchExpenses();
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast({
        title: "Error processing receipt",
        description: "Please try again or check the file format.",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    // Create a mock file input event
    const mockEvent = {
      target: { files }
    } as React.ChangeEvent<HTMLInputElement>;
    
    await handleFileUpload(mockEvent);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Advanced filtering logic
  const filteredExpenses = expenses.filter(expense => {
    // Text search across multiple fields
    const matchesSearch = !searchTerm || (
      expense.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.expense_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.aircraft_registration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.trip_purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Status filter
    const matchesStatus = !statusFilter || expense.status === statusFilter;
    
    // Category filter
    const matchesCategory = !categoryFilter || expense.category_name === categoryFilter;
    
    // Date range filter
    const expenseDate = new Date(expense.expense_type || Date.now());
    const matchesDateFrom = !dateFromFilter || expenseDate >= new Date(dateFromFilter);
    const matchesDateTo = !dateToFilter || expenseDate <= new Date(dateToFilter);
    
    return matchesSearch && matchesStatus && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  // Export CSV functionality
  const handleExportCSV = () => {
    if (!filteredExpenses.length) {
      toast({
        title: "No Data to Export",
        description: "There are no expense records to export.",
        variant: "destructive"
      });
      return;
    }

    // Map database fields to business-friendly column names
    const exportData = filteredExpenses.map(expense => ({
      'Date': expense.expense_type || '',
      'Vendor': expense.vendor_name,
      'Category': expense.category_name || 'Uncategorized',
      'Type': expense.expense_type || '',
      'Amount': `$${expense.total_amount.toFixed(2)}`,
      'Tax': `$${(expense.tax_amount || 0).toFixed(2)}`,
      'Subtotal': `$${(expense.subtotal_amount || 0).toFixed(2)}`,
      'Payment Method': expense.payment_method || '',
      'Location': expense.expense_location || '',
      'City': expense.expense_city || '',
      'State': expense.expense_state || '',
      'Receipt Number': expense.receipt_number || '',
      'Invoice Number': expense.invoice_number || '',
      'Aircraft Registration': expense.aircraft_registration || '',
      'Trip Purpose': expense.trip_purpose || '',
      'Business Justification': expense.business_justification || '',
      'Status': expense.status,
      'Description': expense.description || '',
      'Created At': new Date(expense.created_at).toLocaleDateString()
    }));

    // Generate CSV
    const csv = Papa.unparse(exportData, {
      header: true,
      delimiter: ','
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `expense_records_${timestamp}.csv`;

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
      description: `Exported ${filteredExpenses.length} expense records to ${filename}`,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground">
            Upload receipts and let AI extract expense data automatically
          </p>
        </div>

        {/* Receipt Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Receipt
            </CardTitle>
            <CardDescription>
              Upload receipt images and let AI extract expense information automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !uploadingFile && fileInputRef.current?.click()}
            >
              {uploadingFile ? (
                <Loader2 className="mx-auto h-12 w-12 text-blue-500 mb-4 animate-spin" />
              ) : (
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {uploadingFile ? 'Processing Receipt...' : 'Upload Receipt'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {uploadingFile 
                  ? 'AI is extracting expense data from your receipt'
                  : 'Drag and drop your receipt images here, or click to browse'
                }
              </p>
              {!uploadingFile && (
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploadingFile}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                All time total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlyExpenses.toLocaleString()}</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Current month expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{receiptCount}</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total receipts processed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>
              View and manage your expense records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search expenses..."
                  className="max-w-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportCSV}
                disabled={!filteredExpenses.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading expenses...</span>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No expenses found matching your search.' : 'No expenses found. Upload a receipt to get started!'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{expense.vendor_name}</h3>
                          {expense.expense_categories?.name && (
                            <Badge variant="secondary">{expense.expense_categories.name}</Badge>
                          )}
                          {expense.expense_type && (
                            <Badge variant="outline">{expense.expense_type}</Badge>
                          )}
                          <Badge className={getStatusColor(expense.status)}>
                            {expense.status}
                          </Badge>
                          {expense.extracted_by_ocr && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              AI
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p><span className="font-medium">Date:</span> {new Date(expense.transaction_date).toLocaleDateString()}</p>
                          {expense.location && <p><span className="font-medium">Location:</span> {expense.location}</p>}
                          {expense.invoice_number && <p><span className="font-medium">Invoice:</span> {expense.invoice_number}</p>}
                          {expense.description && <p><span className="font-medium">Description:</span> {expense.description}</p>}
                          {expense.confidence_score && (
                            <p><span className="font-medium">Confidence:</span> {(expense.confidence_score * 100).toFixed(0)}%</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-semibold mb-2">
                          ${expense.total_amount.toFixed(2)} {expense.currency}
                        </div>
                        {expense.expense_tax_details && expense.expense_tax_details.length > 0 && (
                          <div className="text-xs text-gray-500 mb-2">
                            Tax: ${expense.expense_tax_details.reduce((sum, tax) => sum + tax.tax_amount, 0).toFixed(2)}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ExpenseReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        extractedData={currentExtraction?.extractedData}
        duplicates={currentExtraction?.duplicates || []}
        expenseId={currentExtraction?.expense?.id}
        onExpenseUpdated={fetchExpenses}
      />
    </Layout>
  );
};

export default Expenses;