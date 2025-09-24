/**
 * 🧪 TEST RÁPIDO: Validar extractor de PDF real
 */

const fs = require('fs');

// Implementación del extractor real
async function extractTextFromPDFReal(filePath) {
  console.log('🔍 REAL-PDF-EXTRACTOR: Starting advanced text extraction');
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(fileBuffer);
    
    console.log(`📄 Processing PDF: ${uint8Array.length} bytes`);
    
    // Convert to string for processing
    const pdfString = new TextDecoder('latin1').decode(uint8Array);
    
    let extractedText = '';
    
    // METHOD 1: Extract text from PDF text objects
    console.log('🔍 Trying Method 1: Text objects...');
    const textStreams = extractFromTextObjects(pdfString);
    if (textStreams.length > 50) {
      extractedText += textStreams + ' ';
      console.log('✅ Method 1: Text objects extraction successful');
    }
    
    // METHOD 2: Extract from uncompressed streams  
    console.log('🔍 Trying Method 2: Uncompressed streams...');
    const streamText = extractFromStreams(pdfString);
    if (streamText.length > 50) {
      extractedText += streamText + ' ';
      console.log('✅ Method 2: Stream extraction successful');
    }
    
    // METHOD 3: Look for readable text patterns
    console.log('🔍 Trying Method 3: Readable patterns...');
    const patternText = extractReadablePatterns(pdfString);
    if (patternText.length > 50) {
      extractedText += patternText + ' ';
      console.log('✅ Method 3: Pattern extraction successful');
    }
    
    // Clean final text
    extractedText = cleanExtractedText(extractedText);
    
    console.log(`🎯 REAL-EXTRACTION: ${extractedText.length} characters extracted`);
    console.log(`📄 Sample: "${extractedText.substring(0, 200)}..."`);
    
    if (extractedText.length < 50) {
      console.warn('⚠️ Warning: Insufficient text extracted');
    }
    
    return extractedText;
    
  } catch (error) {
    console.error('❌ REAL-EXTRACTION failed:', error);
    throw error;
  }
}

// Extract text from BT/ET (Begin Text/End Text) blocks
function extractFromTextObjects(pdfString) {
  const textBlocks = [];
  
  // Find text objects between BT and ET
  const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match;
  
  while ((match = btEtRegex.exec(pdfString)) !== null) {
    const textBlock = match[1];
    
    // Extract Tj commands (single strings)
    const tjRegex = /\(((?:[^\\)]|\\.))*\)\s*Tj/g;
    let tjMatch;
    
    while ((tjMatch = tjRegex.exec(textBlock)) !== null) {
      const text = cleanPDFString(tjMatch[1]);
      if (text.length > 0) {
        textBlocks.push(text);
      }
    }
    
    // Extract TJ commands (string arrays)
    const tjArrayRegex = /\[((?:[^\]]|\](?!\s*TJ))*)\]\s*TJ/g;
    let tjArrayMatch;
    
    while ((tjArrayMatch = tjArrayRegex.exec(textBlock)) !== null) {
      const arrayContent = tjArrayMatch[1];
      const stringRegex = /\(((?:[^\\)]|\\.))*\)/g;
      let stringMatch;
      
      while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
        const text = cleanPDFString(stringMatch[1]);
        if (text.length > 0) {
          textBlocks.push(text);
        }
      }
    }
  }
  
  return textBlocks.join(' ');
}

// Extract text from uncompressed streams
function extractFromStreams(pdfString) {
  const streamTexts = [];
  
  // Look for uncompressed streams containing text
  const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
  let match;
  
  while ((match = streamRegex.exec(pdfString)) !== null) {
    const streamContent = match[1];
    
    // Skip binary/compressed streams (contain many non-printable characters)
    const printableRatio = (streamContent.match(/[a-zA-Z0-9\s]/g) || []).length / streamContent.length;
    
    if (printableRatio > 0.7) {
      // This looks like uncompressed text
      const readableText = extractReadableChars(streamContent);
      if (readableText.length > 10) {
        streamTexts.push(readableText);
      }
    }
  }
  
  return streamTexts.join(' ');
}

// Extract readable patterns from PDF
function extractReadablePatterns(pdfString) {
  const patterns = [];
  
  // Look for common invoice patterns
  const invoicePatterns = [
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, // Company names
    /\$\d+\.?\d*/g, // Dollar amounts
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g, // Dates
    /Invoice\s*#?\s*:?\s*\d+/gi, // Invoice numbers
    /Total\s*:?\s*\$?\d+\.?\d*/gi // Totals
  ];
  
  for (const pattern of invoicePatterns) {
    const matches = pdfString.match(pattern);
    if (matches) {
      patterns.push(...matches);
    }
  }
  
  return patterns.join(' ');
}

// Clean PDF string escapes
function cleanPDFString(str) {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r') 
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
    .trim();
}

// Extract only readable characters
function extractReadableChars(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // Keep printable ASCII + common extended characters
    if ((char >= 32 && char <= 126) || char === 10 || char === 13 || char === 9) {
      result += str.charAt(i);
    }
  }
  return result.replace(/\s+/g, ' ').trim();
}

// Clean final extracted text
function cleanExtractedText(text) {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s\-.,/$():]/g, '') // Keep basic punctuation
    .trim();
}

// Test execution
async function main() {
  const pdfPath = process.argv[2] || 'mega_factura.pdf';
  
  console.log('🚀 TESTING REAL PDF EXTRACTOR');
  console.log(`📄 File: ${pdfPath}\n`);
  console.log('='.repeat(50));
  
  try {
    const extractedText = await extractTextFromPDFReal(pdfPath);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 FINAL RESULT:');
    console.log(`📏 Length: ${extractedText.length} characters`);
    console.log(`📄 Full text: "${extractedText}"`);
    
    // Analysis
    const hasNumbers = /\d+/.test(extractedText);
    const hasCurrency = /\$|\bdollar|USD/i.test(extractedText);
    const hasCompanyNames = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(extractedText);
    
    console.log('\n🔬 ANALYSIS:');
    console.log(`🔢 Contains numbers: ${hasNumbers}`);
    console.log(`💰 Contains currency: ${hasCurrency}`);
    console.log(`🏢 Contains company names: ${hasCompanyNames}`);
    
    if (extractedText.length > 100 && (hasNumbers || hasCurrency)) {
      console.log('\n✅ SUCCESS: Real extraction working!');
    } else {
      console.log('\n❌ ISSUE: Still not extracting meaningful content');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

main().catch(console.error);