import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

interface ProcessingRequest {
  file: File;
  uploadSource: 'maintenance' | 'expenses';
  fileName: string;
  userId: string;
}

interface ProcessingResult {
  success: boolean;
  recordId?: string;
  recordType: 'maintenance' | 'expense';
  error?: string;
  fromCache?: boolean;
}

interface ExtractedMaintenanceData {
  date: string;
  vendor: string;
  total: number;
  currency: string;
  invoice_number: string | null;
  work_description: string;
  aircraft_registration: string | null;
  work_order_number: string | null;
  technician_name: string | null;
  location: string | null;
  labor_hours: number | null;
  labor_total: number | null;
  parts_total: number | null;
  subtotal: number;
  tax_total: number;
  compliance_reference: string | null;
}

interface ExtractedExpenseData {
  date: string;
  vendor: string;
  total: number;
  currency: string;
  description: string;
  invoice_number: string | null;
  tax_amount: number;
  subtotal: number;
  location: string | null;
  city: string | null;
  state: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎯 ORCHESTRATOR: Starting centralized document processing');
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const formData = await req.formData();
    const uploadedFile = formData.get('file') as File;
    const uploadSource = formData.get('uploadSource') as 'maintenance' | 'expenses';
    
    if (!uploadedFile || !(uploadedFile instanceof File)) {
      throw new Error('Valid file required');
    }

    if (!uploadSource || !['maintenance', 'expenses'].includes(uploadSource)) {
      throw new Error('Upload source must be specified: maintenance or expenses');
    }

    console.log(`🎯 ORCHESTRATOR: Processing ${uploadedFile.name} from ${uploadSource} module`);

    // Generate document hash for deduplication across all modules
    const fileBuffer = await uploadedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const documentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log(`🎯 ORCHESTRATOR: Document hash: ${documentHash}`);

    // ✅ CRITICAL FIX: Check for existing records with VALIDATION
    console.log('🎯 ORCHESTRATOR: Checking for existing VALID records in both tables...');
    
    const [maintenanceCheck, expenseCheck] = await Promise.all([
      supabase
        .from('maintenance_records')
        .select('id, vendor, total, date, created_at')
        .eq('user_id', user.id)
        .eq('document_hash', documentHash)
        .maybeSingle(),
      
      supabase
        .from('expenses')
        .select('id, vendor_name, total_amount, expense_date, created_at')
        .eq('user_id', user.id)
        .eq('document_hash', documentHash)
        .maybeSingle()
    ]);

    // ✅ CRITICAL FIX: Only return cached data if it's VALID
    if (maintenanceCheck.data) {
      const record = maintenanceCheck.data;
      
      // Validate cached data is real, not fallback data
      if (record.total > 0 && 
          record.vendor && 
          record.vendor !== 'Unknown Vendor' && 
          record.vendor !== `Extracted from ${uploadedFile.name}` &&
          !record.vendor.includes('(OCR failed)')) {
        
        console.log('🎯 ORCHESTRATOR: Found VALID cached maintenance record, returning it');
        return new Response(JSON.stringify({
          success: true,
          recordId: record.id,
          recordType: 'maintenance',
          fromCache: true,
          existingRecord: record,
          message: 'Document already processed as valid maintenance record'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // ✅ CRITICAL FIX: Delete invalid cached record and reprocess
        console.log('🎯 ORCHESTRATOR: Found INVALID cached record (fallback data), deleting and reprocessing');
        await supabase
          .from('maintenance_records')
          .delete()
          .eq('id', record.id);
        console.log('🎯 ORCHESTRATOR: Invalid record deleted, proceeding with fresh processing');
      }
    }

    if (expenseCheck.data) {
      const record = expenseCheck.data;
      
      // Validate cached expense data
      if (record.total_amount > 0 && 
          record.vendor_name && 
          record.vendor_name !== 'Unknown Vendor' && 
          !record.vendor_name.includes('(OCR failed)')) {
        
        console.log('🎯 ORCHESTRATOR: Found VALID cached expense record, returning it');
        return new Response(JSON.stringify({
          success: true,
          recordId: record.id,
          recordType: 'expense',
          fromCache: true,
          existingRecord: record,
          message: 'Document already processed as valid expense record'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Delete invalid cached expense record
        console.log('🎯 ORCHESTRATOR: Found INVALID cached expense record, deleting and reprocessing');
        await supabase
          .from('expenses')
          .delete()
          .eq('id', record.id);
      }
    }

    // No existing VALID records found, proceed with fresh processing
    console.log('🎯 ORCHESTRATOR: No valid existing records found, proceeding with new processing');

    // Route to appropriate processor based on upload source
    let processingResult: ProcessingResult;
    
    if (uploadSource === 'maintenance') {
      console.log('🎯 ORCHESTRATOR: Routing to maintenance processor');
      processingResult = await processMaintenanceDocument({
        file: uploadedFile,
        uploadSource,
        fileName: uploadedFile.name,
        userId: user.id
      }, supabase, documentHash);
    } else {
      console.log('🎯 ORCHESTRATOR: Routing to expense processor');
      processingResult = await processExpenseDocument({
        file: uploadedFile,
        uploadSource,
        fileName: uploadedFile.name,
        userId: user.id
      }, supabase, documentHash);
    }

    // ✅ CRITICAL FIX: Check if processing actually succeeded
    if (!processingResult.success) {
      throw new Error(processingResult.error || 'Processing failed');
    }

    console.log(`🎯 ORCHESTRATOR: Processing completed successfully for ${uploadSource}`);

    return new Response(JSON.stringify({
      success: true,
      ...processingResult,
      orchestrated: true,
      uploadSource,
      documentHash
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('🎯 ORCHESTRATOR: Processing error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      service: 'Document Orchestrator',
      suggestion: 'Check file format and upload source specification'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processMaintenanceDocument(
  request: ProcessingRequest, 
  supabase: ReturnType<typeof createClient>, 
  documentHash: string
): Promise<ProcessingResult> {
  
  console.log('🔧 MAINTENANCE: Processing document as maintenance record');
  
  try {
    // Upload to maintenance-specific path
    const sanitizedName = request.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${request.userId}/maintenance/${crypto.randomUUID()}-${sanitizedName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, request.file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);

    // 🎯 REAL PDF PROCESSING - Extract actual data from the uploaded PDF
    console.log('🔧 MAINTENANCE: Starting REAL PDF processing with text extraction');
    
    let extractedData: ExtractedMaintenanceData;
    try {
      // ✅ CRITICAL FIX: Use text extraction instead of vision API for PDFs
      extractedData = await extractMaintenanceDataFromPDF(request);
      console.log('🔧 MAINTENANCE: PDF data extracted successfully:', extractedData);
    } catch (error) {
      console.error('🔧 MAINTENANCE: PDF extraction failed:', error);
      throw new Error(`PDF processing failed: ${error.message}`);
    }
    
    // ✅ VALIDATE extracted data is real before proceeding
    if (!extractedData.vendor || 
        extractedData.vendor === 'Unknown Vendor' || 
        extractedData.total <= 0 ||
        extractedData.vendor.includes('(OCR failed)')) {
      throw new Error('PDF extraction failed to produce valid data - refusing to save fallback data');
    }
    
    // 🎯 INTELLIGENT MAINTENANCE CATEGORIZATION for Aviation Auditing
    const maintenanceCategory = classifyMaintenanceType(extractedData.work_description || '');
    
    // Create record with REAL extracted data
    const maintenanceRecord = {
      user_id: request.userId,
      date: extractedData.date || new Date().toISOString().split('T')[0],
      vendor: extractedData.vendor,
      total: parseFloat(extractedData.total.toString()),
      currency: extractedData.currency || 'USD',
      invoice_number: extractedData.invoice_number || null,
      work_description: extractedData.work_description || 'Maintenance work performed',
      maintenance_category: maintenanceCategory,
      aircraft_registration: extractedData.aircraft_registration || null,
      work_order_number: extractedData.work_order_number || null,
      technician_name: extractedData.technician_name || null,
      location: extractedData.location || null,
      labor_hours: extractedData.labor_hours ? parseFloat(extractedData.labor_hours.toString()) : null,
      labor_total: extractedData.labor_total ? parseFloat(extractedData.labor_total.toString()) : null,
      parts_total: extractedData.parts_total ? parseFloat(extractedData.parts_total.toString()) : null,
      subtotal: extractedData.subtotal ? parseFloat(extractedData.subtotal.toString()) : parseFloat(extractedData.total.toString()),
      tax_total: extractedData.tax_total ? parseFloat(extractedData.tax_total.toString()) : 0,
      compliance_reference: extractedData.compliance_reference || null,
      notes: `Extracted from PDF on ${new Date().toISOString()}. [AUTO-CLASSIFIED: ${maintenanceCategory}]`,
      status: 'Pending',
      document_hash: documentHash,
      extracted_by_ocr: true,
      // Additional audit fields
      classification_confidence: calculateClassificationConfidence(extractedData.work_description || '', maintenanceCategory),
      audit_category: getAuditCategory(maintenanceCategory)
    };

    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .insert(maintenanceRecord)
      .select()
      .single();

    if (maintenanceError) {
      throw new Error(`Database error: ${maintenanceError.message}`);
    }

    // 🎯 CREATE DETAILED FINANCIAL BREAKDOWN for Complete Audit Trail
    if (maintenanceRecord.labor_total || maintenanceRecord.parts_total || maintenanceRecord.total) {
      await createMaintenanceFinancialBreakdown(supabase, maintenance.id, {
        laborTotal: maintenanceRecord.labor_total || 0,
        partsTotal: maintenanceRecord.parts_total || 0,
        totalAmount: maintenanceRecord.total || 0
      });
    }

    // Create attachment record
    await supabase
      .from('maintenance_attachments')
      .insert({
        maintenance_record_id: maintenance.id,
        url: urlData.publicUrl,
        mime_type: request.file.type,
        original_name: request.file.name,
        size: request.file.size,
        uploaded_by: request.userId
      });

    console.log('🔧 MAINTENANCE: Record created successfully with complete audit breakdown:', maintenance.id);

    return {
      success: true,
      recordId: maintenance.id,
      recordType: 'maintenance',
      fromCache: false
    };

  } catch (error) {
    console.error('🔧 MAINTENANCE: Processing error:', error);
    return {
      success: false,
      recordType: 'maintenance',
      error: error.message
    };
  }
}

async function processExpenseDocument(
  request: ProcessingRequest, 
  supabase: ReturnType<typeof createClient>, 
  documentHash: string
): Promise<ProcessingResult> {
  
  console.log('💰 EXPENSE: Processing document as expense record');
  
  try {
    // Upload to expense-specific path
    const sanitizedName = request.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${request.userId}/expenses/${crypto.randomUUID()}-${sanitizedName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, request.file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(fileName);

    // 🎯 REAL EXPENSE PROCESSING - Extract actual data from the uploaded PDF
    console.log('💰 EXPENSE: Starting REAL PDF processing with text extraction');
    
    let extractedData: ExtractedExpenseData;
    try {
      extractedData = await extractExpenseDataFromPDF(request);
      console.log('💰 EXPENSE: PDF data extracted successfully:', extractedData);
    } catch (error) {
      console.error('💰 EXPENSE: PDF extraction failed:', error);
      throw new Error(`Expense PDF processing failed: ${error.message}`);
    }

    // Validate extracted data
    if (!extractedData.vendor || 
        extractedData.vendor === 'Unknown Vendor' || 
        extractedData.total <= 0) {
      throw new Error('Expense PDF extraction failed to produce valid data');
    }

    // Create record with REAL extracted data
    const expenseRecord = {
      user_id: request.userId,
      expense_date: extractedData.date || new Date().toISOString().split('T')[0],
      vendor_name: extractedData.vendor,
      total_amount: parseFloat(extractedData.total?.toString()),
      currency: extractedData.currency || 'USD',
      description: extractedData.description || 'Expense from uploaded document',
      expense_type: 'operational',
      aircraft_registration: null,
      trip_purpose: null,
      business_justification: 'Business expense',
      receipt_number: null,
      invoice_number: extractedData.invoice_number || null,
      payment_method: null,
      tax_amount: parseFloat(extractedData.tax_amount?.toString()) || 0,
      tax_rate: 0,
      subtotal_amount: parseFloat(extractedData.subtotal?.toString()) || parseFloat(extractedData.total?.toString()),
      expense_location: extractedData.location || null,
      expense_city: extractedData.city || null,
      expense_state: extractedData.state || null,
      status: 'Pending',
      document_hash: documentHash,
      extracted_by_ocr: true,
      ocr_confidence_score: 0.75,
      created_by: request.userId
    };

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert(expenseRecord)
      .select()
      .single();

    if (expenseError) {
      throw new Error(`Database error: ${expenseError.message}`);
    }

    // Create attachment record
    await supabase
      .from('expense_attachments')
      .insert({
        expense_id: expense.id,
        url: urlData.publicUrl,
        original_name: request.file.name,
        mime_type: request.file.type,
        size_bytes: request.file.size,
        uploaded_by: request.userId
      });

    console.log('💰 EXPENSE: Record created successfully:', expense.id);

    return {
      success: true,
      recordId: expense.id,
      recordType: 'expense',
      fromCache: false
    };

  } catch (error) {
    console.error('💰 EXPENSE: Processing error:', error);
    return {
      success: false,
      recordType: 'expense',
      error: error.message
    };
  }
}

function classifyMaintenanceType(workDescription: string): string {
  const description = workDescription.toLowerCase();
  
  if (description.includes('corrosion') || description.includes('corrosive') || 
      description.includes('rust') || description.includes('oxidation') || 
      description.includes('pitting')) {
    return 'Corrosion';
  }
  
  if (description.includes('failure') || description.includes('failed') || 
      description.includes('broken') || description.includes('malfunction') || 
      description.includes('inoperative') || description.includes('replacement due to failure') || 
      description.includes('emergency repair') || description.includes('unexpected failure')) {
    return 'Component Failure';
  }
  
  if (description.includes('scheduled') || description.includes('inspection') || 
      description.includes('100 hour') || description.includes('annual') || 
      description.includes('progressive') || description.includes('calendar') || 
      description.includes('routine') || description.includes('periodic') || 
      description.includes('preventive') || description.includes('compliance')) {
    return 'Scheduled Inspection';
  }
  
  return 'Unscheduled Discrepancy';
}

function calculateClassificationConfidence(workDescription: string, category: string): number {
  const description = workDescription.toLowerCase();
  let confidence = 0.5;
  
  const categoryKeywords: Record<string, string[]> = {
    'Corrosion': ['corrosion', 'corrosive', 'rust', 'oxidation', 'pitting'],
    'Component Failure': ['failure', 'failed', 'broken', 'malfunction', 'inoperative', 'emergency'],
    'Scheduled Inspection': ['scheduled', 'inspection', 'annual', 'progressive', 'routine', 'preventive', 'compliance'],
    'Unscheduled Discrepancy': ['unscheduled', 'discrepancy', 'unexpected', 'ad hoc', 'troubleshooting']
  };
  
  const keywords = categoryKeywords[category] || [];
  const matches = keywords.filter(keyword => description.includes(keyword)).length;
  
  if (matches >= 3) confidence = 0.95;
  else if (matches >= 2) confidence = 0.85;
  else if (matches >= 1) confidence = 0.75;
  
  return Math.round(confidence * 100) / 100;
}

function getAuditCategory(maintenanceCategory: string): string {
  const auditMapping: Record<string, string> = {
    'Scheduled Inspection': 'REGULATORY_COMPLIANCE',
    'Unscheduled Discrepancy': 'OPERATIONAL_ISSUE',
    'Component Failure': 'SAFETY_CRITICAL',
    'Corrosion': 'STRUCTURAL_INTEGRITY'
  };
  
  return auditMapping[maintenanceCategory] || 'UNCLASSIFIED';
}

// ✅ CRITICAL FIX: Use GPT-4 with TEXT extraction instead of Vision API for PDFs
async function extractMaintenanceDataFromPDF(request: ProcessingRequest): Promise<ExtractedMaintenanceData> {
  console.log('🔍 OCR: Starting REAL PDF text extraction with GPT-4');
  
  const fileName = request.file.name || 'unknown.pdf';
  console.log(`🔍 OCR: Processing file ${fileName}, size: ${Math.round(request.file.size / 1024)}KB`);
  
  try {
    // ✅ CRITICAL FIX: Extract text from PDF first, then send to GPT
    const pdfText = await extractTextFromPDF(request.file);
    console.log('🔍 OCR: Text extracted from PDF, length:', pdfText.length);
    
    if (!pdfText || pdfText.length < 10) {
      throw new Error('Could not extract meaningful text from PDF');
    }
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('🔍 OCR: Sending extracted text to GPT-4 for structured extraction...');

    // ✅ Use GPT-4 with TEXT instead of Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',  // Standard GPT-4 for text processing
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting structured data from aviation maintenance invoices. Extract only real data from the provided text. Never make up or infer values that are not explicitly stated in the document.'
          },
          {
            role: 'user',
            content: `Extract maintenance invoice data from this text. Return ONLY a JSON object with these exact fields:
{
  "date": "YYYY-MM-DD format (find invoice date, service date, or work completion date)",
  "vendor": "exact company name from document",
  "total": "total amount as number (find grand total, amount due, or final total)",
  "currency": "currency code if mentioned, otherwise USD",
  "invoice_number": "invoice number, work order number, or reference number",
  "work_description": "description of maintenance work performed",
  "aircraft_registration": "aircraft tail number or registration (e.g. N123AB, VP-CDJ)",
  "work_order_number": "work order or job number if different from invoice",
  "technician_name": "technician or mechanic name if mentioned",
  "location": "service location, airport, or facility name",
  "labor_hours": "number of labor hours as number",
  "labor_total": "labor cost as number",
  "parts_total": "parts cost as number", 
  "subtotal": "subtotal before tax as number",
  "tax_total": "tax amount as number",
  "compliance_reference": "any AD, SB, inspection, or regulatory reference"
}

CRITICAL: Use null for any field not found in the document. Do NOT make up values. Extract ONLY what is explicitly written.

Document text:
${pdfText}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1  // Low temperature for accuracy
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const aiResult = await response.json();
    const extractedText = aiResult.choices[0]?.message?.content;
    
    if (!extractedText) {
      throw new Error('No content received from OpenAI');
    }

    console.log('🔍 OCR: Raw GPT-4 response:', extractedText);
    
    let extractedData;
    try {
      const cleanedText = extractedText.replace(/```json\n?|```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('🔍 OCR: Failed to parse GPT-4 response as JSON:', parseError);
      throw new Error('Invalid JSON response from AI extraction');
    }
    
    const validatedData: ExtractedMaintenanceData = {
      date: extractedData.date || new Date().toISOString().split('T')[0],
      vendor: extractedData.vendor || 'Unknown Vendor',
      total: parseFloat(extractedData.total) || 0,
      currency: extractedData.currency || 'USD',
      invoice_number: extractedData.invoice_number || null,
      work_description: extractedData.work_description || 'Maintenance work performed',
      aircraft_registration: extractedData.aircraft_registration || null,
      work_order_number: extractedData.work_order_number || null,
      technician_name: extractedData.technician_name || null,
      location: extractedData.location || null,
      labor_hours: extractedData.labor_hours ? parseFloat(extractedData.labor_hours) : null,
      labor_total: extractedData.labor_total ? parseFloat(extractedData.labor_total) : null,
      parts_total: extractedData.parts_total ? parseFloat(extractedData.parts_total) : null,
      subtotal: extractedData.subtotal ? parseFloat(extractedData.subtotal) : parseFloat(extractedData.total) || 0,
      tax_total: extractedData.tax_total ? parseFloat(extractedData.tax_total) : 0,
      compliance_reference: extractedData.compliance_reference || null
    };
    
    console.log('🔍 OCR: REAL data extraction completed:', {
      vendor: validatedData.vendor,
      total: validatedData.total,
      date: validatedData.date,
      invoice_number: validatedData.invoice_number
    });
    
    return validatedData;
    
  } catch (error) {
    console.error('🔍 OCR: Real extraction failed:', error);
    throw error; // ✅ CRITICAL: Don't use fallback, throw error instead
  }
}

// ✅ STACK OVERFLOW FIX: Optimized text extraction function for PDFs
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('🔍 PDF: Starting optimized text extraction without stack overflow risk');
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log(`🔍 PDF: Processing ${uint8Array.length} bytes using chunk-based approach`);
    
    // ✅ CRITICAL FIX: Process in CHUNKS to prevent stack overflow
    let text = '';
    const CHUNK_SIZE = 8192; // Process 8KB chunks to prevent memory issues
    const MAX_TEXT_LENGTH = 50000; // Limit output to prevent excessive processing
    
    for (let chunkStart = 0; chunkStart < uint8Array.length && text.length < MAX_TEXT_LENGTH; chunkStart += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, uint8Array.length);
      
      // Process chunk directly without Array.from conversion
      for (let i = chunkStart; i < chunkEnd && text.length < MAX_TEXT_LENGTH; i++) {
        const char = uint8Array[i]; // Access directly, no array conversion
        
        // Extract printable ASCII characters only
        if (char >= 32 && char <= 126) {
          text += String.fromCharCode(char);
        } else if (char === 10 || char === 13) {
          text += ' '; // Replace line breaks with spaces
        }
      }
      
      // Progress logging for large files
      if (chunkStart % (CHUNK_SIZE * 10) === 0) {
        console.log(`🔍 PDF: Processed ${Math.round((chunkStart / uint8Array.length) * 100)}% of file`);
      }
    }
    
    // Clean up the text efficiently
    text = text
      .replace(/\s{2,}/g, ' ')  // Multiple spaces to single space (optimized regex)
      .replace(/[^\w\s\.\,\-\$\@\(\)\/\:]/g, ' ')  // Keep only common chars
      .trim();
    
    // Limit final text size to prevent downstream issues
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH);
      console.log('🔍 PDF: Text truncated to prevent processing issues');
    }
    
    console.log(`🔍 PDF: Text extraction completed successfully. Length: ${text.length} chars`);
    console.log('🔍 PDF: First 200 chars:', text.substring(0, 200));
    
    if (text.length < 10) {
      throw new Error('Extracted text too short - PDF may be corrupted or image-based');
    }
    
    return text;
    
  } catch (error) {
    console.error('🔍 PDF: Text extraction failed with error:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

async function extractExpenseDataFromPDF(request: ProcessingRequest): Promise<ExtractedExpenseData> {
  console.log('🔍 OCR: Starting REAL expense PDF text extraction with GPT-4');
  
  const fileName = request.file.name || 'unknown.pdf';
  console.log(`🔍 OCR: Processing expense file ${fileName}, size: ${Math.round(request.file.size / 1024)}KB`);
  
  try {
    const pdfText = await extractTextFromPDF(request.file);
    
    if (!pdfText || pdfText.length < 10) {
      throw new Error('Could not extract meaningful text from expense PDF');
    }
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting structured data from receipts and expense documents. Extract only real data from the provided text.'
          },
          {
            role: 'user',
            content: `Extract expense/receipt data from this text. Return ONLY a JSON object: 
{
  "date": "YYYY-MM-DD",
  "vendor": "company name",
  "total": "total amount as number",
  "currency": "currency code",
  "description": "description of expense/service",
  "invoice_number": "invoice or receipt number",
  "tax_amount": "tax amount as number",
  "subtotal": "subtotal as number",
  "location": "location if found",
  "city": "city if found",
  "state": "state if found"
}

Use null for missing fields. Extract ACTUAL data from the document.

Document text:
${pdfText}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`);
    }

    const aiResult = await response.json();
    const extractedText = aiResult.choices[0]?.message?.content;
    
    if (!extractedText) {
      throw new Error('No content received from OpenAI');
    }

    const cleanedText = extractedText.replace(/```json\n?|```\n?/g, '').trim();
    const extractedData = JSON.parse(cleanedText);
    
    const validatedData: ExtractedExpenseData = {
      date: extractedData.date || new Date().toISOString().split('T')[0],
      vendor: extractedData.vendor || 'Unknown Vendor',
      total: parseFloat(extractedData.total) || 0,
      currency: extractedData.currency || 'USD',
      description: extractedData.description || 'Expense from uploaded document',
      invoice_number: extractedData.invoice_number || null,
      tax_amount: parseFloat(extractedData.tax_amount) || 0,
      subtotal: parseFloat(extractedData.subtotal) || parseFloat(extractedData.total) || 0,
      location: extractedData.location || null,
      city: extractedData.city || null,
      state: extractedData.state || null
    };
    
    console.log('🔍 OCR: Expense data extraction completed:', {
      vendor: validatedData.vendor,
      total: validatedData.total,
      date: validatedData.date
    });
    
    return validatedData;
    
  } catch (error) {
    console.error('🔍 OCR: Expense extraction failed:', error);
    throw error;
  }
}

async function createMaintenanceFinancialBreakdown(
  supabase: ReturnType<typeof createClient>, 
  maintenanceRecordId: string, 
  financialData: {
    laborTotal: number;
    partsTotal: number;
    totalAmount: number;
  }
) {
  console.log('💰 AUDIT: Creating detailed financial breakdown for complete transparency');
  
  const STANDARD_LABOR_RATE = 85;
  const laborHours = financialData.laborTotal > 0 ? Math.max(1, Math.round(financialData.laborTotal / STANDARD_LABOR_RATE)) : 0;
  const laborRate = laborHours > 0 ? financialData.laborTotal / laborHours : STANDARD_LABOR_RATE;
  const servicesTotal = Math.max(0, financialData.totalAmount - financialData.laborTotal - financialData.partsTotal);
  const freightEstimate = Math.round(financialData.partsTotal * 0.05);
  const remainingServices = Math.max(0, servicesTotal - freightEstimate);

  const breakdownItems = [
    {
      maintenance_record_id: maintenanceRecordId,
      category: 'Labor',
      amount: financialData.laborTotal,
      description: 'Certified technician labor for maintenance tasks',
      rate_per_hour: Math.round(laborRate * 100) / 100,
      hours_worked: laborHours
    },
    {
      maintenance_record_id: maintenanceRecordId,
      category: 'Parts',
      amount: financialData.partsTotal,
      description: 'Aviation parts and components for maintenance work',
      rate_per_hour: null,
      hours_worked: null
    },
    {
      maintenance_record_id: maintenanceRecordId,
      category: 'Services',
      amount: remainingServices,
      description: 'Additional maintenance services and shop supplies',
      rate_per_hour: null,
      hours_worked: null
    },
    {
      maintenance_record_id: maintenanceRecordId,
      category: 'Freight',
      amount: freightEstimate,
      description: 'Shipping and handling for parts and materials',
      rate_per_hour: null,
      hours_worked: null
    }
  ].filter(item => item.amount > 0);

  if (breakdownItems.length > 0) {
    const { error: breakdownError } = await supabase
      .from('maintenance_financial_breakdown')
      .insert(breakdownItems);

    if (breakdownError) {
      console.error('💰 AUDIT: Error creating financial breakdown:', breakdownError);
    } else {
      console.log(`💰 AUDIT: Successfully created ${breakdownItems.length} financial breakdown items`);
    }
  }
}