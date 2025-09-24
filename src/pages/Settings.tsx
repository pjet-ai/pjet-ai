import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Plane, FileText, Loader2, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    licenseNumber: '',
    licenseType: '',
    company: ''
  });

  const [aircraftData, setAircraftData] = useState({
    model: '',
    registration: '',
    yearManufactured: '',
    serialNumber: '',
    baseLocation: ''
  });

  const [operationsData, setOperationsData] = useState({
    operationType: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profile) {
        setProfileData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          phone: profile.phone || '',
          licenseNumber: profile.license_number || '',
          licenseType: profile.license_type || '',
          company: profile.company || ''
        });
      }

      // Load aircraft data
      const { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      if (aircraftError) throw aircraftError;

      if (aircraft && aircraft.length > 0) {
        const aircraftItem = aircraft[0];
        setAircraftData({
          model: aircraftItem.model || '',
          registration: aircraftItem.registration || '',
          yearManufactured: aircraftItem.year_manufactured?.toString() || '',
          serialNumber: aircraftItem.serial_number || '',
          baseLocation: aircraftItem.base_location || ''
        });
      }

      // Load operations data
      const { data: operations, error: operationsError } = await supabase
        .from('operations')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      if (operationsError) throw operationsError;

      if (operations && operations.length > 0) {
        const operation = operations[0];
        setOperationsData({
          operationType: operation.operation_type || '',
          notes: operation.notes || ''
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load your data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phone,
          license_number: profileData.licenseNumber,
          license_type: profileData.licenseType,
          company: profileData.company
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAircraftSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Check if aircraft already exists
      const { data: existingAircraft } = await supabase
        .from('aircraft')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingAircraft && existingAircraft.length > 0) {
        // Update existing aircraft
        const { error } = await supabase
          .from('aircraft')
          .update({
            model: aircraftData.model,
            registration: aircraftData.registration,
            year_manufactured: aircraftData.yearManufactured ? parseInt(aircraftData.yearManufactured) : null,
            serial_number: aircraftData.serialNumber,
            base_location: aircraftData.baseLocation
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new aircraft
        const { error } = await supabase
          .from('aircraft')
          .insert({
            user_id: user.id,
            model: aircraftData.model,
            registration: aircraftData.registration,
            year_manufactured: aircraftData.yearManufactured ? parseInt(aircraftData.yearManufactured) : null,
            serial_number: aircraftData.serialNumber,
            base_location: aircraftData.baseLocation
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Aircraft information updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update aircraft information.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log out.",
        variant: "destructive"
      });
    }
  };

  const handleOperationsSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Check if operations already exists
      const { data: existingOps } = await supabase
        .from('operations')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingOps && existingOps.length > 0) {
        // Update existing operations
        const { error } = await supabase
          .from('operations')
          .update({
            operation_type: operationsData.operationType,
            notes: operationsData.notes
          })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new operations
        const { error } = await supabase
          .from('operations')
          .insert({
            user_id: user.id,
            operation_type: operationsData.operationType,
            notes: operationsData.notes
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Operations information updated successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update operations information.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and aircraft information</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="aircraft" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Aircraft
            </TabsTrigger>
            <TabsTrigger value="operations" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profileData.company}
                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Enter your company name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="licenseNumber">Pilot License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={profileData.licenseNumber}
                      onChange={(e) => setProfileData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      placeholder="Enter license number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="licenseType">License Type</Label>
                    <Select value={profileData.licenseType} onValueChange={(value) => setProfileData(prev => ({ ...prev, licenseType: value }))}>
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
                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aircraft">
            <Card>
              <CardHeader>
                <CardTitle>Aircraft Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="aircraftModel">Aircraft Model</Label>
                  <Input
                    id="aircraftModel"
                    value={aircraftData.model}
                    onChange={(e) => setAircraftData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., Cessna 172, Piper Cherokee"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registration">Aircraft Registration</Label>
                    <Input
                      id="registration"
                      value={aircraftData.registration}
                      onChange={(e) => setAircraftData(prev => ({ ...prev, registration: e.target.value }))}
                      placeholder="e.g., N123ABC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearManufactured">Year Manufactured</Label>
                    <Input
                      id="yearManufactured"
                      value={aircraftData.yearManufactured}
                      onChange={(e) => setAircraftData(prev => ({ ...prev, yearManufactured: e.target.value }))}
                      placeholder="e.g., 2020"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={aircraftData.serialNumber}
                    onChange={(e) => setAircraftData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="Enter aircraft serial number"
                  />
                </div>
                <div>
                  <Label htmlFor="baseLocation">Base Location</Label>
                  <Select value={aircraftData.baseLocation} onValueChange={(value) => setAircraftData(prev => ({ ...prev, baseLocation: value }))}>
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
                <div className="flex justify-end">
                  <Button onClick={handleAircraftSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Aircraft Info"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations">
            <Card>
              <CardHeader>
                <CardTitle>Operations Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="operationType">Primary Operation Type</Label>
                  <Select value={operationsData.operationType} onValueChange={(value) => setOperationsData(prev => ({ ...prev, operationType: value }))}>
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
                    value={operationsData.notes}
                    onChange={(e) => setOperationsData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information about your operations..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleOperationsSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Operations Info"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Account Information</h3>
                    <p className="text-sm text-muted-foreground">
                      Email: {user?.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-destructive mb-2">Logout</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sign out of your DJG Aviation account. You'll need to log in again to access your dashboard.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={handleLogout}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {isSaving ? "Logging out..." : "Logout"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}