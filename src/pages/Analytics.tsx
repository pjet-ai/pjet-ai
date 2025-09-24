import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Fuel,
  Wrench,
  Plane,
  Download,
  PieChart,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface AnalyticsData {
  totalExpenses: number;
  totalMaintenance: number;
  monthlyExpenses: number;
  monthlyMaintenance: number;
  expensesByCategory: { category: string; amount: number; percentage: number }[];
  maintenanceByType: { type: string; amount: number; count: number; percentage: number }[];
  monthlyTrends: { month: string; expenses: number; maintenance: number }[];
  aircraftCount: number;
  costPerHour: number;
  upcomingMaintenance: number;
}

export default function Analytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalExpenses: 0,
    totalMaintenance: 0,
    monthlyExpenses: 0,
    monthlyMaintenance: 0,
    expensesByCategory: [],
    maintenanceByType: [],
    monthlyTrends: [],
    aircraftCount: 0,
    costPerHour: 0,
    upcomingMaintenance: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState('12'); // months

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, selectedPeriod]);

  const loadAnalyticsData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - parseInt(selectedPeriod));
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Load expenses data
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('total_amount, expense_type, expense_date, currency')
        .eq('user_id', user.id)
        .gte('expense_date', startDate.toISOString().split('T')[0])
        .order('expense_date', { ascending: true });

      if (expensesError) throw expensesError;

      // Load maintenance data
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .select('total, maintenance_type, date, currency')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (maintenanceError) throw maintenanceError;

      // Load aircraft count
      const { data: aircraft, error: aircraftError } = await supabase
        .from('aircraft')
        .select('id')
        .eq('user_id', user.id);

      if (aircraftError) throw aircraftError;

      // Calculate totals
      const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.total_amount), 0) || 0;
      const totalMaintenance = maintenance?.reduce((sum, mnt) => sum + Number(mnt.total), 0) || 0;
      
      // Calculate monthly totals
      const monthlyExpenses = expenses?.filter(exp => 
        exp.expense_date.startsWith(currentMonth)
      ).reduce((sum, exp) => sum + Number(exp.total_amount), 0) || 0;
      
      const monthlyMaintenance = maintenance?.filter(mnt => 
        mnt.date.startsWith(currentMonth)
      ).reduce((sum, mnt) => sum + Number(mnt.total), 0) || 0;

      // Calculate expenses by category
      const categoryTotals: { [key: string]: number } = {};
      expenses?.forEach(exp => {
        const category = exp.expense_type || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(exp.total_amount);
      });

      const expensesByCategory = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

      // Calculate maintenance by type
      const maintenanceTypeTotals: { [key: string]: { amount: number; count: number } } = {};
      maintenance?.forEach(mnt => {
        const type = mnt.maintenance_type || 'Other';
        if (!maintenanceTypeTotals[type]) {
          maintenanceTypeTotals[type] = { amount: 0, count: 0 };
        }
        maintenanceTypeTotals[type].amount += Number(mnt.total);
        maintenanceTypeTotals[type].count += 1;
      });

      const maintenanceByType = Object.entries(maintenanceTypeTotals)
        .map(([type, data]) => ({
          type,
          amount: data.amount,
          count: data.count,
          percentage: totalMaintenance > 0 ? (data.amount / totalMaintenance) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

      // Calculate monthly trends (last 12 months)
      const monthlyTrends = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toISOString().slice(0, 7);
        
        const monthExpenses = expenses?.filter(exp => 
          exp.expense_date.startsWith(monthStr)
        ).reduce((sum, exp) => sum + Number(exp.total_amount), 0) || 0;
        
        const monthMaintenance = maintenance?.filter(mnt => 
          mnt.date.startsWith(monthStr)
        ).reduce((sum, mnt) => sum + Number(mnt.total), 0) || 0;
        
        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          expenses: monthExpenses,
          maintenance: monthMaintenance
        });
      }

      // Calculate cost per hour (simplified calculation)
      const aircraftCount = aircraft?.length || 0;
      const totalOperatingCost = totalExpenses + totalMaintenance;
      const estimatedFlightHours = aircraftCount * 50 * parseInt(selectedPeriod); // 50 hours per month per aircraft
      const costPerHour = estimatedFlightHours > 0 ? totalOperatingCost / estimatedFlightHours : 0;

      setAnalytics({
        totalExpenses,
        totalMaintenance,
        monthlyExpenses,
        monthlyMaintenance,
        expensesByCategory,
        maintenanceByType,
        monthlyTrends,
        aircraftCount,
        costPerHour,
        upcomingMaintenance: 0 // Placeholder for future implementation
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: "Error Loading Analytics",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate total operating cost
  const totalOperatingCost = analytics.totalExpenses + analytics.totalMaintenance;
  const monthlyOperatingCost = analytics.monthlyExpenses + analytics.monthlyMaintenance;

  // Get top categories for display
  const topExpenseCategories = analytics.expensesByCategory.slice(0, 5);
  const topMaintenanceTypes = analytics.maintenanceByType.slice(0, 5);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your fleet's operational costs and performance.
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
                <SelectItem value="24">Last 24 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Operating Cost"
            value={formatCurrency(totalOperatingCost)}
            icon={DollarSign}
            trend={monthlyOperatingCost > 0 ? "up" : "stable"}
          />
          <StatCard
            title="Monthly Cost"
            value={formatCurrency(monthlyOperatingCost)}
            icon={Calendar}
          />
          <StatCard
            title="Cost per Hour"
            value={formatCurrency(analytics.costPerHour)}
            icon={Activity}
          />
          <StatCard
            title="Aircraft Count"
            value={analytics.aircraftCount.toString()}
            icon={Plane}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-aviation-blue" />
                <span>Expense Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-blue mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading expense data...</p>
                </div>
              ) : topExpenseCategories.length > 0 ? (
                <div className="space-y-4">
                  {topExpenseCategories.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{category.category}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">
                            {category.percentage.toFixed(1)}%
                          </span>
                          <span className="font-medium">
                            {formatCurrency(category.amount)}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={category.percentage} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No expense data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Maintenance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-aviation-blue" />
                <span>Maintenance Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-blue mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading maintenance data...</p>
                </div>
              ) : topMaintenanceTypes.length > 0 ? (
                <div className="space-y-4">
                  {topMaintenanceTypes.map((type, index) => (
                    <div key={type.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{type.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {type.count} records
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">
                            {type.percentage.toFixed(1)}%
                          </span>
                          <span className="font-medium">
                            {formatCurrency(type.amount)}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={type.percentage} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No maintenance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-aviation-blue" />
              <span>Monthly Cost Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aviation-blue mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading trend data...</p>
              </div>
            ) : analytics.monthlyTrends.length > 0 ? (
              <div className="space-y-6">
                {/* Simple bar chart representation */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {analytics.monthlyTrends.slice(-8).map((month, index) => {
                    const totalMonth = month.expenses + month.maintenance;
                    const maxValue = Math.max(...analytics.monthlyTrends.map(m => m.expenses + m.maintenance));
                    const heightPercentage = maxValue > 0 ? (totalMonth / maxValue) * 100 : 0;
                    
                    return (
                      <div key={month.month} className="text-center">
                        <div className="text-xs font-medium mb-2">{month.month}</div>
                        <div className="relative bg-muted rounded h-32 flex items-end justify-center">
                          <div 
                            className="bg-aviation-blue rounded-t w-8 min-h-[4px] transition-all"
                            style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatCurrency(totalMonth)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-aviation-blue rounded"></div>
                    <span>Total Operating Cost</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-aviation-blue" />
              <span>Key Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Maintenance vs Expenses</div>
                <div className="text-lg font-bold">
                  {totalOperatingCost > 0 
                    ? `${((analytics.totalMaintenance / totalOperatingCost) * 100).toFixed(1)}%` 
                    : '0%'
                  }
                </div>
                <div className="text-xs text-muted-foreground">maintenance of total cost</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Average Monthly Cost</div>
                <div className="text-lg font-bold">
                  {formatCurrency(totalOperatingCost / parseInt(selectedPeriod))}
                </div>
                <div className="text-xs text-muted-foreground">over selected period</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-1">Cost Efficiency</div>
                <div className="text-lg font-bold">
                  {analytics.aircraftCount > 0 
                    ? formatCurrency(totalOperatingCost / analytics.aircraftCount)
                    : formatCurrency(0)
                  }
                </div>
                <div className="text-xs text-muted-foreground">cost per aircraft</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}