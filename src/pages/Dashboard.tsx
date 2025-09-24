import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plane, 
  Wrench, 
  Receipt, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  FileText,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [aircraftCount, setAircraftCount] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // No maintenance data yet - show empty state
  const upcomingMaintenance: any[] = [];

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load aircraft count
      const { data: aircraft } = await supabase
        .from('aircraft')
        .select('id')
        .eq('user_id', user?.id);
      
      setAircraftCount(aircraft?.length || 0);

      // Load monthly expenses
      const currentMonth = new Date().toISOString().slice(0, 7);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = nextMonth.toISOString().slice(0, 7);
      
      const { data: expenses } = await supabase
        .from('expenses')
        .select('total_amount')
        .eq('user_id', user?.id)
        .gte('expense_date', `${currentMonth}-01`)
        .lt('expense_date', `${nextMonthStr}-01`);
      
      const total = expenses?.reduce((sum, expense) => sum + Number(expense.total_amount), 0) || 0;
      setMonthlyExpenses(total);

      // Load recent expenses
      const { data: recentExp } = await supabase
        .from('expenses')
        .select('vendor_name, total_amount, expense_date')
        .eq('user_id', user?.id)
        .order('expense_date', { ascending: false })
        .limit(5);
      
      setRecentExpenses(recentExp || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Flight Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Captain. Here's your aircraft management overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Aircraft"
            value={loading ? "..." : aircraftCount.toString()}
            icon={Plane}
          />
          <StatCard
            title="Pending Maintenance"
            value="0"
            icon={Wrench}
          />
          <StatCard
            title="Monthly Expenses"
            value={loading ? "..." : `$${monthlyExpenses.toLocaleString()}`}
            icon={Receipt}
          />
          <StatCard
            title="Open Incidents"
            value="0"
            icon={AlertTriangle}
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
                {upcomingMaintenance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No upcoming maintenance tasks</p>
                    <p className="text-sm">Click "Add Task" to schedule maintenance</p>
                  </div>
                ) : (
                  upcomingMaintenance.map((item, index) => (
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
                  ))
                )}
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
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Loading expenses...</p>
                  </div>
                ) : recentExpenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No recent expenses</p>
                    <p className="text-sm">Click "Add Expense" to record expenses</p>
                  </div>
                ) : (
                  recentExpenses.map((expense, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{expense.vendor_name}</p>
                        <p className="text-sm text-muted-foreground">{new Date(expense.expense_date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-semibold text-foreground">${Number(expense.total_amount).toFixed(2)}</p>
                    </div>
                  ))
                )}
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
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No system alerts</p>
                <p className="text-sm">All systems operational</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}