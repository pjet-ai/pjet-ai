import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Plane, 
  Search, 
  Filter, 
  Calendar,
  MapPin,
  Clock,
  FileText,
  Edit,
  Trash2,
  Download,
  Plus,
  AlertTriangle,
  Upload,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UploadInvoiceModal } from '@/components/UploadInvoiceModal';

interface Flight {
  id: number;
  reference_id: string;
  departure_location: string;
  destination_location: string;
  flight_date: string;
  departure_time: string;
  flight_type: string;
  flight_purpose: string;
  observations?: string;
  invoice_url?: string;
  created_at: string;
  updated_at: string;
}

const FlightHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState<Flight | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Upload invoice state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [flightToUpload, setFlightToUpload] = useState<Flight | null>(null);

  const flightTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'Practice', label: '✈️ Practice' },
    { value: 'Recreational', label: '🎯 Recreational' },
    { value: 'Transfer', label: '🚁 Transfer' },
    { value: 'Commercial', label: '💼 Commercial' }
  ];

  const getFlightTypeColor = (type: string) => {
    switch (type) {
      case 'Practice':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Recreational':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Transfer':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Commercial':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getFlightTypeIcon = (type: string) => {
    switch (type) {
      case 'Practice':
        return '✈️';
      case 'Recreational':
        return '🎯';
      case 'Transfer':
        return '🚁';
      case 'Commercial':
        return '💼';
      default:
        return '✈️';
    }
  };

  const fetchFlights = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('flights')
        .select('*')
        .eq('user_id', user.id)
        .order('flight_date', { ascending: false });

      if (error) throw error;
      setFlights(data || []);
    } catch (error) {
      console.error('Error fetching flights:', error);
      toast({
        title: "Error loading flights",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, [user]);

  useEffect(() => {
    let filtered = flights;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(flight =>
        flight.departure_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.destination_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.reference_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.flight_purpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(flight => flight.flight_type === filterType);
    }

    setFilteredFlights(filtered);
  }, [flights, searchTerm, filterType]);

  const handleEditFlight = (flight: Flight) => {
    // Navigate to edit page with flight data
    navigate('/flight-logbook/edit', { 
      state: { 
        flightData: flight,
        isEdit: true 
      } 
    });
  };

  const handleUploadClick = (flight: Flight) => {
    setFlightToUpload(flight);
    setUploadModalOpen(true);
  };

  const handleDeleteClick = (flight: Flight) => {
    setFlightToDelete(flight);
    setDeleteDialogOpen(true);
  };

  const handleDeleteFlight = async () => {
    if (!flightToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('flights')
        .delete()
        .eq('id', flightToDelete.id);

      if (error) throw error;

      toast({
        title: "Flight deleted successfully",
        description: "The flight record has been removed from your logbook.",
      });

      fetchFlights();
      setDeleteDialogOpen(false);
      setFlightToDelete(null);
    } catch (error) {
      console.error('Error deleting flight:', error);
      toast({
        title: "Error deleting flight",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportFlights = () => {
    const csvContent = [
      ['Reference ID', 'Departure', 'Destination', 'Date', 'Time', 'Type', 'Purpose', 'Observations'],
      ...filteredFlights.map(flight => [
        flight.reference_id,
        flight.departure_location,
        flight.destination_location,
        new Date(flight.flight_date).toLocaleDateString(),
        flight.departure_time,
        flight.flight_type,
        flight.flight_purpose,
        flight.observations || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flight-logbook-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: "Your flight logbook has been exported to CSV.",
    });
  };

  const totalFlights = flights.length;
  const thisMonthFlights = flights.filter(flight => {
    const flightDate = new Date(flight.flight_date);
    const now = new Date();
    return flightDate.getMonth() === now.getMonth() && flightDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/flight-logbook')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Logbook
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Plane className="h-8 w-8 text-blue-600" />
              Flight History
            </h1>
            <p className="text-muted-foreground">
              View and manage your flight records
            </p>
          </div>
          <Button onClick={() => navigate('/flight-logbook/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Flight
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Total Flights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFlights}</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                All time flights recorded
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
              <div className="text-2xl font-bold">{thisMonthFlights}</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Flights this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Flight Records</CardTitle>
            <CardDescription>
              Search and filter your flight history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search flights..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {flightTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportFlights}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading flights...</span>
              </div>
            ) : filteredFlights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? 'No flights found matching your search criteria.' 
                  : 'No flights recorded yet. Start by adding your first flight!'
                }
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFlights.map((flight) => (
                  <div key={flight.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getFlightTypeIcon(flight.flight_type)}</span>
                          <h3 className="font-medium">{flight.reference_id}</h3>
                          <Badge className={getFlightTypeColor(flight.flight_type)}>
                            {flight.flight_type}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="space-y-1">
                            <p><span className="font-medium">Route:</span> {flight.departure_location} → {flight.destination_location}</p>
                            <p><span className="font-medium">Date:</span> {new Date(flight.flight_date).toLocaleDateString()}</p>
                          </div>
                          <div className="space-y-1">
                            <p><span className="font-medium">Time:</span> {flight.departure_time}</p>
                            <p><span className="font-medium">Purpose:</span> {flight.flight_purpose.substring(0, 50)}{flight.flight_purpose.length > 50 ? '...' : ''}</p>
                          </div>
                        </div>
                        {flight.observations && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Observations:</span> {flight.observations}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUploadClick(flight)}
                          className={`${
                            flight.invoice_url 
                              ? 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20' 
                              : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20'
                          }`}
                          title={flight.invoice_url ? 'Invoice uploaded - Click to replace' : 'Upload invoice PDF'}
                        >
                          {flight.invoice_url ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditFlight(flight)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteClick(flight)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Invoice Modal */}
        {flightToUpload && (
          <UploadInvoiceModal
            open={uploadModalOpen}
            onOpenChange={setUploadModalOpen}
            flight={flightToUpload}
            onUploadSuccess={() => {
              fetchFlights(); // Refresh the flights list
              setUploadModalOpen(false);
              setFlightToUpload(null);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Flight Record
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Are you sure you want to delete this flight record? This action cannot be undone.</p>
                {flightToDelete && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <div><strong>Reference ID:</strong> {flightToDelete.reference_id}</div>
                    <div><strong>Route:</strong> {flightToDelete.departure_location} → {flightToDelete.destination_location}</div>
                    <div><strong>Date:</strong> {new Date(flightToDelete.flight_date).toLocaleDateString()}</div>
                    <div><strong>Time:</strong> {flightToDelete.departure_time}</div>
                    <div><strong>Type:</strong> {flightToDelete.flight_type}</div>
                    <div><strong>Purpose:</strong> {flightToDelete.flight_purpose.substring(0, 50)}{flightToDelete.flight_purpose.length > 50 ? '...' : ''}</div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFlight}
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
};

export default FlightHistory;
