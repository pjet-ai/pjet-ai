-- Testing script for the Document Orchestrator Solution
-- This script helps verify the solution is working correctly

-- 1. Check existing records with same document hash (duplicates)
SELECT 
  'maintenance_records' as table_name,
  id,
  vendor as vendor_name,
  total as amount,
  date,
  document_hash,
  created_at
FROM maintenance_records 
WHERE document_hash IS NOT NULL
  AND document_hash IN (
    SELECT document_hash 
    FROM maintenance_records 
    WHERE document_hash IS NOT NULL 
    GROUP BY document_hash 
    HAVING COUNT(*) > 1
  )

UNION ALL

SELECT 
  'expenses' as table_name,
  id::text,
  vendor_name,
  total_amount,
  expense_date::text,
  document_hash,
  created_at
FROM expenses 
WHERE document_hash IS NOT NULL
  AND document_hash IN (
    SELECT document_hash 
    FROM expenses 
    WHERE document_hash IS NOT NULL 
    GROUP BY document_hash 
    HAVING COUNT(*) > 1
  )

ORDER BY document_hash, created_at;

-- 2. Check for cross-table duplicates (same document in both tables)
WITH cross_duplicates AS (
  SELECT m.document_hash
  FROM maintenance_records m
  INNER JOIN expenses e ON m.document_hash = e.document_hash
  WHERE m.document_hash IS NOT NULL
)
SELECT 
  'CROSS-TABLE DUPLICATES FOUND' as status,
  document_hash,
  COUNT(*) as occurrences
FROM cross_duplicates
GROUP BY document_hash;

-- 3. Recent records analysis
SELECT 
  'Recent Activity - Last 24 hours' as analysis,
  'maintenance_records' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT document_hash) as unique_documents,
  COUNT(*) - COUNT(DISTINCT document_hash) as potential_duplicates
FROM maintenance_records 
WHERE created_at >= NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'Recent Activity - Last 24 hours',
  'expenses',
  COUNT(*),
  COUNT(DISTINCT document_hash),
  COUNT(*) - COUNT(DISTINCT document_hash)
FROM expenses 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 4. Validation queries for testing
-- Run this BEFORE testing the orchestrator
SELECT 
  'PRE-TEST STATUS' as test_phase,
  table_name,
  total_records,
  unique_hashes,
  potential_duplicates
FROM (
  SELECT 
    'maintenance_records' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT document_hash) as unique_hashes,
    COUNT(*) - COUNT(DISTINCT document_hash) as potential_duplicates
  FROM maintenance_records
  
  UNION ALL
  
  SELECT 
    'expenses',
    COUNT(*),
    COUNT(DISTINCT document_hash),
    COUNT(*) - COUNT(DISTINCT document_hash)
  FROM expenses
) stats;