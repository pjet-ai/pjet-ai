import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plane, 
  Wrench, 
  Receipt, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  Plus
} from 'lucide-react';

export default function Demo() {
  // Mock data for demo purposes
  const upcomingMaintenance = [
    { aircraft: 'N123ABC', task: '100-hour inspection', dueDate: '2024-08-15', status: 'due' },
    { aircraft: 'N456DEF', task: 'Oil change', dueDate: '2024-08-20', status: 'upcoming' },
    { aircraft: 'N789GHI', task: 'Annual inspection', dueDate: '2024-09-01', status: 'upcoming' },
  ];

  const recentExpenses = [
    { date: '2024-07-20', description: 'Fuel - Dubai Intl', amount: '$1,250' },
    { date: '2024-07-18', description: 'Landing fees - Riyadh', amount: '$320' },
    { date: '2024-07-15', description: 'Oil change parts', amount: '$180' },
  ];

  const alerts = [
    { type: 'warning', message: 'N123ABC: 100-hour inspection due in 3 days' },
    { type: 'info', message: 'New compliance update: UAE aviation regulations' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Demo Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">Demo Mode</h2>
              <p className="text-sm text-muted-foreground">This is a demonstration of DJG Aviation's features with sample data.</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/auth'}>
              Sign Up to Get Started
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Flight Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the demo, Captain. Here's your aircraft management overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Aircraft"
            value="3"
            icon={Plane}
            trend={{ value: "+1 this month", isPositive: true }}
          />
          <StatCard
            title="Pending Maintenance"
            value="2"
            icon={Wrench}
            trend={{ value: "1 overdue", isPositive: false }}
          />
          <StatCard
            title="Monthly Expenses"
            value="$8,450"
            icon={Receipt}
            trend={{ value: "+12% from last month", isPositive: false }}
          />
          <StatCard
            title="Open Incidents"
            value="1"
            icon={AlertTriangle}
            trend={{ value: "-2 resolved this week", isPositive: true }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Maintenance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-aviation-blue" />
                <span>Upcoming Maintenance</span>
              </CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingMaintenance.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{item.aircraft}</p>
                      <p className="text-sm text-muted-foreground">{item.task}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.dueDate}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                        item.status === 'due' ? 'bg-destructive text-destructive-foreground' :
                        'bg-warning text-warning-foreground'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-aviation-blue" />
                <span>Recent Expenses</span>
              </CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentExpenses.map((expense, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">{expense.date}</p>
                    </div>
                    <p className="font-semibold text-foreground">{expense.amount}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-aviation-blue" />
              <span>System Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'warning' ? 'bg-warning/10 border-l-warning' :
                  'bg-info/10 border-l-info'
                }`}>
                  <p className="text-sm">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}