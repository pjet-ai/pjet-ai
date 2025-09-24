import { supabase } from '@/integrations/supabase/client';
import { MaintenanceAttachment } from '@/types/maintenance';

/**
 * Get PDF attachments for a maintenance record
 * @param maintenanceRecordId - The ID of the maintenance record
 * @returns Promise<MaintenanceAttachment[]> - Array of attachments
 */
export const getMaintenanceAttachments = async (
  maintenanceRecordId: string
): Promise<MaintenanceAttachment[]> => {
  try {
    const { data, error } = await supabase
      .from('maintenance_attachments')
      .select('*')
      .eq('maintenance_record_id', maintenanceRecordId)
      .eq('mime_type', 'application/pdf')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching maintenance attachments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMaintenanceAttachments:', error);
    return [];
  }
};

/**
 * Get the primary PDF attachment for a maintenance record
 * @param maintenanceRecordId - The ID of the maintenance record
 * @returns Promise<MaintenanceAttachment | null> - The primary PDF attachment or null
 */
export const getPrimaryPdfAttachment = async (
  maintenanceRecordId: string
): Promise<MaintenanceAttachment | null> => {
  try {
    const attachments = await getMaintenanceAttachments(maintenanceRecordId);
    
    // Return the first (most recent) PDF attachment
    return attachments.length > 0 ? attachments[0] : null;
  } catch (error) {
    console.error('Error in getPrimaryPdfAttachment:', error);
    return null;
  }
};

/**
 * Check if a maintenance record has PDF attachments
 * @param maintenanceRecordId - The ID of the maintenance record
 * @returns Promise<boolean> - True if has PDF attachments
 */
export const hasPdfAttachment = async (
  maintenanceRecordId: string
): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('maintenance_attachments')
      .select('*', { count: 'exact', head: true })
      .eq('maintenance_record_id', maintenanceRecordId)
      .eq('mime_type', 'application/pdf');

    if (error) {
      console.error('Error checking PDF attachment:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error('Error in hasPdfAttachment:', error);
    return false;
  }
};
