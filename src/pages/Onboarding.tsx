import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Plane, User, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseType: '',
    
    // Aircraft Info
    aircraftModel: '',
    registration: '',
    yearManufactured: '',
    serialNumber: '',
    baseLocation: '',
    
    // Additional Info
    operationType: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update profiles with license information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          license_number: formData.licenseNumber,
          license_type: formData.licenseType,
          onboarding_completed: true
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Insert aircraft data if provided
      if (formData.aircraftModel && formData.registration) {
        const { error: aircraftError } = await supabase
          .from('aircraft')
          .insert({
            user_id: user.id,
            model: formData.aircraftModel,
            registration: formData.registration,
            year_manufactured: formData.yearManufactured ? parseInt(formData.yearManufactured) : null,
            serial_number: formData.serialNumber,
            base_location: formData.baseLocation
          });

        if (aircraftError) throw aircraftError;
      }

      // Insert operations data if provided
      if (formData.operationType) {
        const { error: operationsError } = await supabase
          .from('operations')
          .insert({
            user_id: user.id,
            operation_type: formData.operationType,
            notes: formData.notes
          });

        if (operationsError) throw operationsError;
      }

      toast({
        title: "Welcome to DJG Aviation!",
        description: "Your account has been set up successfully.",
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save onboarding data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Personal Information", icon: User },
    { number: 2, title: "Aircraft Details", icon: Plane },
    { number: 3, title: "Operation Details", icon: FileText },
    { number: 4, title: "Complete Setup", icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Plane className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to DJG Aviation</h1>
          <p className="text-muted-foreground mt-2">Let's set up your pilot profile and aircraft details</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex flex-col items-center">
              <div className={`p-3 rounded-full ${
                currentStep >= step.number ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <step.icon className="h-5 w-5" />
              </div>
              <p className="text-xs mt-2 text-center font-medium">{step.title}</p>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mt-4 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Personal Information"}
              {currentStep === 2 && "Aircraft Details"}
              {currentStep === 3 && "Operation Details"}
              {currentStep === 4 && "Complete Your Setup"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licenseNumber">Pilot License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      placeholder="Enter license number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseType">License Type</Label>
                    <Select onValueChange={(value) => handleInputChange('licenseType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select license type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ppl">Private Pilot License (PPL)</SelectItem>
                        <SelectItem value="cpl">Commercial Pilot License (CPL)</SelectItem>
                        <SelectItem value="atpl">Airline Transport Pilot License (ATPL)</SelectItem>
                        <SelectItem value="ir">Instrument Rating (IR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Aircraft Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="aircraftModel">Aircraft Model</Label>
                  <Input
                    id="aircraftModel"
                    value={formData.aircraftModel}
                    onChange={(e) => handleInputChange('aircraftModel', e.target.value)}
                    placeholder="e.g., Cessna 172, Piper Cherokee"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registration">Aircraft Registration</Label>
                    <Input
                      id="registration"
                      value={formData.registration}
                      onChange={(e) => handleInputChange('registration', e.target.value)}
                      placeholder="e.g., N123ABC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearManufactured">Year Manufactured</Label>
                    <Input
                      id="yearManufactured"
                      value={formData.yearManufactured}
                      onChange={(e) => handleInputChange('yearManufactured', e.target.value)}
                      placeholder="e.g., 2020"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="Enter aircraft serial number"
                  />
                </div>
                <div>
                  <Label htmlFor="baseLocation">Base Location</Label>
                  <Select onValueChange={(value) => handleInputChange('baseLocation', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select base location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dxb">Dubai International (DXB)</SelectItem>
                      <SelectItem value="rix">Riyadh King Khalid (RUH)</SelectItem>
                      <SelectItem value="kuw">Kuwait International (KWI)</SelectItem>
                      <SelectItem value="doh">Doha Hamad International (DOH)</SelectItem>
                      <SelectItem value="bah">Bahrain International (BAH)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Operation Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="operationType">Primary Operation Type</Label>
                  <Select onValueChange={(value) => handleInputChange('operationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal/Recreational</SelectItem>
                      <SelectItem value="business">Business Aviation</SelectItem>
                      <SelectItem value="charter">Charter Operations</SelectItem>
                      <SelectItem value="training">Flight Training</SelectItem>
                      <SelectItem value="cargo">Cargo Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional information about your operations..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-accent rounded-lg">
                  <CheckCircle className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Setup Complete!</h3>
                  <p className="text-muted-foreground">
                    Your DJG Aviation account is ready. You can now start managing your aircraft operations.
                  </p>
                </div>
                <div className="text-left bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">What's Next?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Access your personalized dashboard</li>
                    <li>• Set up maintenance schedules</li>
                    <li>• Upload and manage expense receipts</li>
                    <li>• Track incidents and compliance</li>
                    <li>• View analytics and insights</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={isLoading}>
                  {isLoading ? "Setting up your account..." : "Enter Dashboard"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}