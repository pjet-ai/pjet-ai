import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plane, 
  Calendar, 
  MapPin, 
  Clock, 
  FileText,
  CheckCircle,
  Save,
  Edit
} from 'lucide-react';
import AirportAutocomplete from '@/components/AirportAutocomplete';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FlightData {
  departureLocation: string;
  flightDate: string;
  destinationLocation: string;
  departureTime: string;
  flightType: string;
  flightPurpose: string;
  observations: string;
}

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
  created_at: string;
  updated_at: string;
}

const EditFlight = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [flightData, setFlightData] = useState<FlightData>({
    departureLocation: '',
    flightDate: '',
    destinationLocation: '',
    departureTime: '',
    flightType: '',
    flightPurpose: '',
    observations: ''
  });

  const flightTypes = [
    { value: 'Practice', label: '✈️ Practice', description: 'Training and skill development flights' },
    { value: 'Recreational', label: '🎯 Recreational', description: 'Personal enjoyment and leisure flights' },
    { value: 'Transfer', label: '🚁 Transfer', description: 'Aircraft repositioning and ferry flights' },
    { value: 'Commercial', label: '💼 Commercial', description: 'Revenue-generating passenger or cargo flights' }
  ];

  // Get flight data from navigation state
  useEffect(() => {
    if (location.state?.flightData) {
      const flight: Flight = location.state.flightData;
      setFlightData({
        departureLocation: flight.departure_location,
        flightDate: flight.flight_date,
        destinationLocation: flight.destination_location,
        departureTime: flight.departure_time,
        flightType: flight.flight_type,
        flightPurpose: flight.flight_purpose,
        observations: flight.observations || ''
      });
    } else {
      // If no flight data, redirect back to history
      navigate('/flight-logbook/history');
    }
  }, [location.state, navigate]);

  // Check authentication on component mount
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to edit flights.",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [user, loading, navigate, toast]);

  const generateReferenceId = (): string => {
    const date = new Date(flightData.flightDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    
    const location = flightData.departureLocation
      .toUpperCase()
      .replace(/\s+/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .substring(0, 15);
    
    const time = flightData.departureTime.replace(':', '');
    
    return `${day}${month}${year}${location}${time}`;
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive"
      });
      return;
    }

    if (!location.state?.flightData) {
      toast({
        title: "Error",
        description: "No flight data found to update.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const flight: Flight = location.state.flightData;
      const referenceId = generateReferenceId();
      
      const flightRecord = {
        reference_id: referenceId,
        departure_location: flightData.departureLocation,
        destination_location: flightData.destinationLocation,
        flight_date: flightData.flightDate,
        departure_time: flightData.departureTime,
        flight_type: flightData.flightType,
        flight_purpose: flightData.flightPurpose,
        observations: flightData.observations || null
      };

      const { data, error } = await supabase
        .from('flights')
        .update(flightRecord)
        .eq('id', flight.id)
        .select();

      if (error) throw error;

      toast({
        title: "Flight updated successfully!",
        description: `Your flight has been updated with reference ID: ${referenceId}`,
      });

      navigate('/flight-logbook/history');
    } catch (error) {
      console.error('Error updating flight:', error);
      toast({
        title: "Error updating flight",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </Layout>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/flight-logbook/history')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Plane className="h-8 w-8 text-blue-600" />
              Edit Flight
            </h1>
            <p className="text-muted-foreground">
              Update your flight information
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Flight Information
            </CardTitle>
            <CardDescription>
              Update the flight details below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Origin & Date */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Origin & Date
              </h3>
              
              <AirportAutocomplete
                label="Departure Location"
                placeholder="e.g., Barcelona, Madrid, Valencia..."
                value={flightData.departureLocation}
                onChange={(value) => setFlightData({...flightData, departureLocation: value})}
                description="Enter the airport or location where your flight departed from"
                required={true}
              />
              
              <div className="space-y-2">
                <Label htmlFor="flightDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Flight Date
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="flightDate"
                  type="date"
                  value={flightData.flightDate}
                  onChange={(e) => setFlightData({...flightData, flightDate: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                  className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert"
                />
                <p className="text-sm text-muted-foreground">
                  Select the date of your flight (cannot be in the future)
                </p>
              </div>
            </div>

            {/* Destination & Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Destination & Time
              </h3>
              
              <AirportAutocomplete
                label="Destination Location"
                placeholder="e.g., Paris, London, Rome..."
                value={flightData.destinationLocation}
                onChange={(value) => setFlightData({...flightData, destinationLocation: value})}
                description="Enter the airport or location where your flight arrived"
                required={true}
              />
              
              <div className="space-y-2">
                <Label htmlFor="departureTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 dark:text-white" />
                  Departure Time
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={flightData.departureTime}
                  onChange={(e) => setFlightData({...flightData, departureTime: e.target.value})}
                  className="[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the time when your flight departed (24-hour format)
                </p>
              </div>
            </div>

            {/* Flight Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Flight Details
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="flightType">Flight Type</Label>
                <Select value={flightData.flightType} onValueChange={(value) => setFlightData({...flightData, flightType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select flight type" />
                  </SelectTrigger>
                  <SelectContent>
                    {flightTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {flightData.flightType && (
                  <p className="text-sm text-muted-foreground">
                    {flightTypes.find(t => t.value === flightData.flightType)?.description}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="flightPurpose">Flight Purpose</Label>
                <Textarea
                  id="flightPurpose"
                  placeholder="Describe briefly the purpose of this flight..."
                  value={flightData.flightPurpose}
                  onChange={(e) => setFlightData({...flightData, flightPurpose: e.target.value})}
                  rows={4}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Minimum 10 characters required</span>
                  <span>{flightData.flightPurpose.length}/500</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observations">Additional Observations (Optional)</Label>
                <Textarea
                  id="observations"
                  placeholder="Add any additional observations about the flight..."
                  value={flightData.observations}
                  onChange={(e) => setFlightData({...flightData, observations: e.target.value})}
                  rows={3}
                />
                <div className="flex justify-end text-sm text-muted-foreground">
                  <span>{flightData.observations.length}/1000</span>
                </div>
              </div>
            </div>

            {/* Reference ID Display */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <CheckCircle className="h-5 w-5" />
                <h3 className="font-medium">Updated Reference ID</h3>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                This will be your new flight reference ID after saving
              </p>
              <p className="text-lg font-mono font-medium text-blue-600 dark:text-blue-400 mt-2">
                {generateReferenceId()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={saving || !flightData.departureLocation || !flightData.flightDate || !flightData.destinationLocation || !flightData.departureTime || !flightData.flightType || flightData.flightPurpose.length < 10}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? 'Updating...' : 'Update Flight'}
            <Save className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default EditFlight;
