import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  fileName?: string;
  recordId?: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  open,
  onOpenChange,
  pdfUrl,
  fileName = 'Maintenance Invoice',
  recordId
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset states when modal opens/closes
  useEffect(() => {
    if (open) {
      setError(null);
      setLoading(true);
    } else {
      setLoading(false);
      setError(null);
    }
  }, [open]);


  const handlePdfLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handlePdfError = () => {
    setLoading(false);
    setError('Failed to load PDF. The file may be corrupted or inaccessible.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 [&>button]:h-10 [&>button]:w-10 [&>button]:rounded-full [&>button]:hover:bg-destructive/20 [&>button]:hover:text-destructive [&>button]:transition-all [&>button]:duration-200 [&>button]:border-2 [&>button]:border-destructive/20 [&>button]:bg-background/80 [&>button]:backdrop-blur-sm [&>button]:shadow-lg [&>button]:hover:border-destructive/40 [&>button]:hover:shadow-xl [&>button]:hover:scale-105">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!pdfUrl ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No PDF Available</h3>
                <p className="text-muted-foreground">
                  No PDF invoice is attached to this maintenance record.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                <h3 className="text-lg font-semibold mb-2">Error Loading PDF</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => window.open(pdfUrl, '_blank')}
                  disabled={loading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative h-[70vh]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading PDF...</p>
                  </div>
                </div>
              )}
              
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title={fileName}
                onLoad={handlePdfLoad}
                onError={handlePdfError}
                style={{ minHeight: '500px' }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
