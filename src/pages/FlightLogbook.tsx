import React from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Plus, 
  History, 
  Calendar,
  Clock,
  MapPin,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const FlightLogbook = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const quickActions = [
    {
      title: "New Flight",
      description: "Record a new flight with guided step-by-step capture",
      icon: Plus,
      action: () => navigate('/flight-logbook/new'),
      color: "bg-blue-500 hover:bg-blue-600",
      textColor: "text-white"
    },
    {
      title: "Flight History",
      description: "View and manage your flight records",
      icon: History,
      action: () => navigate('/flight-logbook/history'),
      color: "bg-green-500 hover:bg-green-600",
      textColor: "text-white"
    }
  ];

  const flightTypes = [
    { type: 'Practice', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: '✈️' },
    { type: 'Recreational', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '🎯' },
    { type: 'Transfer', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: '🚁' },
    { type: 'Commercial', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: '💼' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Plane className="h-8 w-8 text-blue-600" />
            Flight Logbook
          </h1>
          <p className="text-muted-foreground">
            Record and manage your flight activities with our guided capture system
          </p>
        </div>

        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Welcome to Your Flight Logbook
            </CardTitle>
            <CardDescription>
              Keep track of your flights with our intuitive step-by-step recording system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Date Tracking</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Record flight dates automatically</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <MapPin className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Location Logging</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Track departure and destination</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">Purpose Documentation</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Document flight purpose and notes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={action.action}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <IconComponent className={`h-5 w-5 ${action.textColor}`} />
                      </div>
                      {action.title}
                    </CardTitle>
                    <CardDescription>
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Flight Types Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Flight Types
            </CardTitle>
            <CardDescription>
              Different types of flights you can record in your logbook
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {flightTypes.map((flightType, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="text-2xl">{flightType.icon}</span>
                  <div>
                    <Badge className={flightType.color}>
                      {flightType.type}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {flightType.type === 'Practice' && 'Training and skill development flights'}
                      {flightType.type === 'Recreational' && 'Personal enjoyment and leisure flights'}
                      {flightType.type === 'Transfer' && 'Aircraft repositioning and ferry flights'}
                      {flightType.type === 'Commercial' && 'Revenue-generating passenger or cargo flights'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Getting Started
            </CardTitle>
            <CardDescription>
              Follow these simple steps to record your first flight
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Click "New Flight"</h4>
                  <p className="text-sm text-muted-foreground">
                    Start the guided flight recording process
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Fill in Flight Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete each step with departure, destination, and purpose
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Review and Save</h4>
                  <p className="text-sm text-muted-foreground">
                    Review your flight information and save to your logbook
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default FlightLogbook;
