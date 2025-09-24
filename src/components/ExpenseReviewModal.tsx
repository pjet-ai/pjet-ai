import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, DollarSign, MapPin, FileText, Tag, AlertCircle } from 'lucide-react';

interface ExtractedExpense {
  vendor_name: string;
  transaction_date: string;
  total_amount: number;
  currency: string;
  subtotal?: number;
  tax_amount?: number;
  description?: string;
  location?: string;
  invoice_number?: string;
  receipt_number?: string;
  expense_type?: string;
  notes?: string;
  tax_details?: Array<{
    tax_type: string;
    tax_rate?: number;
    tax_amount: number;
    description?: string;
  }>;
}

interface ExpenseClassification {
  category: string;
  expense_type?: string;
  confidence: number;
  reasoning: string;
}

interface ExpenseReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData?: ExtractedExpense;
  classification?: ExpenseClassification;
  expenseId?: string;
  onExpenseUpdated?: () => void;
}

export const ExpenseReviewModal: React.FC<ExpenseReviewModalProps> = ({
  open,
  onOpenChange,
  extractedData,
  classification,
  expenseId,
  onExpenseUpdated
}) => {
  const [formData, setFormData] = useState<ExtractedExpense>({
    vendor_name: '',
    transaction_date: '',
    total_amount: 0,
    currency: 'USD',
    subtotal: 0,
    tax_amount: 0,
    description: '',
    location: '',
    invoice_number: '',
    receipt_number: '',
    expense_type: '',
    notes: ''
  });
  
  const [categories, setCategories] = useState<Array<{id: string, name: string, description?: string}>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
      } else {
        setCategories(data || []);
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  // Populate form when extracted data changes
  useEffect(() => {
    if (extractedData) {
      setFormData(extractedData);
    }
    if (classification) {
      setSelectedCategory(classification.category);
    }
  }, [extractedData, classification]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Get category ID
      const category = categories.find(cat => cat.name === selectedCategory);
      
      const expenseRecord = {
        user_id: user.id,
        vendor_name: formData.vendor_name,
        transaction_date: formData.transaction_date,
        total_amount: formData.total_amount,
        currency: formData.currency,
        subtotal: formData.subtotal,
        category_id: category?.id,
        expense_type: formData.expense_type,
        description: formData.description,
        location: formData.location,
        invoice_number: formData.invoice_number,
        receipt_number: formData.receipt_number,
        notes: formData.notes,
        status: 'APPROVED',
        extracted_by_ocr: true,
        manual_review_required: false,
        confidence_score: classification?.confidence || 1.0,
        updated_at: new Date().toISOString()
      };

      if (expenseId) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update(expenseRecord)
          .eq('id', expenseId);

        if (error) throw error;
      } else {
        // Create new expense
        const { error } = await supabase
          .from('expenses')
          .insert(expenseRecord);

        if (error) throw error;
      }

      // Save tax details if available
      if (formData.tax_details && formData.tax_details.length > 0) {
        const taxDetails = formData.tax_details.map(tax => ({
          expense_id: expenseId,
          tax_type: tax.tax_type,
          tax_rate: tax.tax_rate,
          tax_amount: tax.tax_amount,
          description: tax.description
        }));

        const { error: taxError } = await supabase
          .from('expense_tax_details')
          .upsert(taxDetails);

        if (taxError) {
          console.error('Error saving tax details:', taxError);
        }
      }

      toast({
        title: "Expense saved successfully",
        description: "The expense has been processed and saved.",
      });

      onExpenseUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "Error saving expense",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Review Extracted Expense
          </DialogTitle>
          <DialogDescription>
            Please review and confirm the extracted expense information before saving.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Classification Info */}
          {classification && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4" />
                  AI Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <p className="font-medium">{classification.category}</p>
                  </div>
                  {classification.expense_type && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <p className="font-medium">{classification.expense_type}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Confidence</Label>
                    <Badge className={getConfidenceColor(classification.confidence)}>
                      {(classification.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Reasoning</Label>
                  <p className="text-sm text-muted-foreground">{classification.reasoning}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_name">Vendor Name</Label>
                <Input
                  id="vendor_name"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Transaction Date</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_amount">Total Amount</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({...formData, total_amount: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
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
                  onChange={(e) => setFormData({...formData, subtotal: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_amount">Tax Amount</Label>
                <Input
                  id="tax_amount"
                  type="number"
                  step="0.01"
                  value={formData.tax_amount || ''}
                  onChange={(e) => setFormData({...formData, tax_amount: parseFloat(e.target.value) || 0})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location and Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                Location & Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense_type">Expense Type</Label>
                <Input
                  id="expense_type"
                  value={formData.expense_type || ''}
                  onChange={(e) => setFormData({...formData, expense_type: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number</Label>
                <Input
                  id="invoice_number"
                  value={formData.invoice_number || ''}
                  onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_number">Receipt Number</Label>
                <Input
                  id="receipt_number"
                  value={formData.receipt_number || ''}
                  onChange={(e) => setFormData({...formData, receipt_number: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Description and Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                Description & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={2}
                  placeholder="Additional context (e.g., hotel stay duration, special circumstances)"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax Details */}
          {formData.tax_details && formData.tax_details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  Tax Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {formData.tax_details.map((tax, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{tax.tax_type}</p>
                        {tax.description && (
                          <p className="text-sm text-muted-foreground">{tax.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {tax.tax_rate && (
                          <p className="text-sm text-muted-foreground">{tax.tax_rate}%</p>
                        )}
                        <p className="font-medium">${tax.tax_amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low Confidence Warning */}
          {classification && classification.confidence < 0.8 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">Low Confidence Classification</p>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  This expense was classified with low confidence. Please review the category and details carefully.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Expense'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};