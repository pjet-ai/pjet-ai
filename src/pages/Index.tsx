import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  Plane, 
  Shield, 
  BarChart3, 
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import heroImage from '@/assets/private-jet-hero.jpg';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Plane,
      title: "Aircraft Management",
      description: "Comprehensive fleet tracking with maintenance schedules and compliance monitoring"
    },
    {
      icon: Shield,
      title: "Safety & Compliance",
      description: "International aviation standards compliance for Middle East operations"
    },
    {
      icon: BarChart3,
      title: "AI-Powered Analytics",
      description: "Smart insights for cost optimization and operational efficiency"
    },
    {
      icon: Users,
      title: "Pilot-Friendly Design",
      description: "Intuitive interface designed specifically for aviation professionals"
    }
  ];

  const benefits = [
    "Automated receipt scanning and expense tracking",
    "Predictive maintenance scheduling",
    "Real-time compliance monitoring",
    "Cross-country regulation tracking",
    "Mobile-optimized for cockpit use"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative bg-gradient-to-br from-aviation-blue/80 via-aviation-blue/70 to-aviation-blue/60 text-white bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-aviation-blue/60"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Plane className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              DJG Aviation
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Professional aircraft management platform for private pilots in the Middle East. 
              Streamline operations, reduce costs, and ensure compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-aviation-blue hover:bg-white/90 text-lg px-8"
                onClick={() => navigate('/auth')}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white border-white text-aviation-blue hover:bg-white/90 text-lg px-8"
                onClick={() => navigate('/demo')}
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Professional Aviation Management
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From maintenance tracking to expense management, DJG Aviation provides comprehensive tools 
              for efficient aircraft operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="p-3 bg-aviation-light rounded-xl w-fit mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-aviation-blue" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits List */}
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground text-center mb-8">Key Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-aviation-light">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Transform Your Aviation Operations?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join pilots across the Middle East who trust DJG Aviation for their aircraft management needs.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              Start Your Free Setup
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
