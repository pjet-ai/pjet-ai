import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  ArrowRight, 
  Plane, 
  Calendar, 
  MapPin, 
  Clock, 
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import AirportAutocomplete from '@/components/AirportAutocomplete';
import { useNavigate } from 'react-router-dom';
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

const NewFlight = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
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

  // Check authentication on component mount
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to record flights.",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }, [user, loading, navigate, toast]);

  const steps = [
    { number: 1, title: 'Origin & Date', icon: MapPin },
    { number: 2, title: 'Destination & Time', icon: Clock },
    { number: 3, title: 'Flight Details', icon: FileText },
    { number: 4, title: 'Review & Save', icon: CheckCircle }
  ];

  const flightTypes = [
    { value: 'Practice', label: '✈️ Practice', description: 'Training and skill development flights' },
    { value: 'Recreational', label: '🎯 Recreational', description: 'Personal enjoyment and leisure flights' },
    { value: 'Transfer', label: '🚁 Transfer', description: 'Aircraft repositioning and ferry flights' },
    { value: 'Commercial', label: '💼 Commercial', description: 'Revenue-generating passenger or cargo flights' }
  ];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return flightData.departureLocation.trim().length >= 2 && flightData.flightDate !== '';
      case 2:
        return flightData.destinationLocation.trim().length >= 2 && flightData.departureTime !== '';
      case 3:
        return flightData.flightType !== '' && flightData.flightPurpose.trim().length >= 10;
      case 4:
        return true; // Step 4 is always valid
      default:
        return false;
    }
  };

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

  const handleNext = () => {
    // Check authentication first
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({
        title: "Please complete all required fields",
        description: "All fields in this step are required to continue.",
        variant: "destructive"
      });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    console.log('handleSave called');
    console.log('User:', user);
    console.log('Flight data:', flightData);
    
    if (!user) {
      console.error('No user found');
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const referenceId = generateReferenceId();
      console.log('Generated reference ID:', referenceId);
      
      const flightRecord = {
        user_id: user.id,
        reference_id: referenceId,
        departure_location: flightData.departureLocation,
        destination_location: flightData.destinationLocation,
        flight_date: flightData.flightDate,
        departure_time: flightData.departureTime,
        flight_type: flightData.flightType,
        flight_purpose: flightData.flightPurpose,
        observations: flightData.observations || null
      };

      console.log('Flight record to insert:', flightRecord);

      const { data, error } = await supabase
        .from('flights')
        .insert(flightRecord)
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Flight saved successfully:', data);

      toast({
        title: "Flight saved successfully!",
        description: `Your flight has been recorded with reference ID: ${referenceId}`,
      });

      // Reset form and go back to logbook
      setFlightData({
        departureLocation: '',
        flightDate: '',
        destinationLocation: '',
        departureTime: '',
        flightType: '',
        flightPurpose: '',
        observations: ''
      });
      setCurrentStep(1);
      navigate('/flight-logbook');
    } catch (error) {
      console.error('Error saving flight:', error);
      toast({
        title: "Error saving flight",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
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
        );

      case 2:
        return (
          <div className="space-y-6">
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
        );

      case 3:
        return (
          <div className="space-y-6">
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
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <CheckCircle className="h-5 w-5" />
                <h3 className="font-medium">Flight Summary</h3>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Review your flight information before saving
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Departure</Label>
                  <p className="text-lg font-medium">{flightData.departureLocation}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Destination</Label>
                  <p className="text-lg font-medium">{flightData.destinationLocation}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="text-lg font-medium">{new Date(flightData.flightDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Time</Label>
                  <p className="text-lg font-medium">{flightData.departureTime}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Flight Type</Label>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {flightTypes.find(t => t.value === flightData.flightType)?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Purpose</Label>
                  <p className="text-sm">{flightData.flightPurpose}</p>
                </div>
                {flightData.observations && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Observations</Label>
                    <p className="text-sm">{flightData.observations}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Reference ID</Label>
                  <p className="text-lg font-mono font-medium text-blue-600 dark:text-blue-400">
                    {generateReferenceId()}
                  </p>
                </div>
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
        );

      default:
        return null;
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
          <Button variant="outline" size="sm" onClick={() => navigate('/flight-logbook')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Logbook
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Plane className="h-8 w-8 text-blue-600" />
              New Flight
            </h1>
            <p className="text-muted-foreground">
              Record a new flight with our guided step-by-step process
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex items-center">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' :
                      isCompleted ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      <IconComponent className="h-4 w-4" />
                      <span className="font-medium">{step.title}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-300 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <MapPin className="h-5 w-5" />}
              {currentStep === 2 && <Clock className="h-5 w-5" />}
              {currentStep === 3 && <FileText className="h-5 w-5" />}
              {currentStep === 4 && <CheckCircle className="h-5 w-5" />}
              Step {currentStep}: {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Enter the departure location and flight date"}
              {currentStep === 2 && "Specify the destination and departure time"}
              {currentStep === 3 && "Classify the flight type and describe its purpose"}
              {currentStep === 4 && "Review all information and save your flight record"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < 4 ? (
            <Button 
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Saving...' : 'Save Flight'}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NewFlight;
