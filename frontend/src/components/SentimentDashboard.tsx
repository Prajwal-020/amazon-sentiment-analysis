'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Smartphone, TrendingUp, Star, MessageCircle, BarChart3, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface SmartphoneData {
  name: string;
  link: string;
  price?: string;
  rating?: number;
  review_count: number;
  average_sentiment: number;
  positive_ratio: number;
  composite_score: number;
  last_updated: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SentimentDashboard() {
  const [data, setData] = useState<SmartphoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:8001/top-mobiles');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // First trigger refresh on backend
      await fetch('http://localhost:8001/refresh', { method: 'POST' });
      // Then fetch new data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.7) return 'text-green-600 bg-green-50';
    if (sentiment >= 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment >= 0.7) return 'Positive';
    if (sentiment >= 0.5) return 'Neutral';
    return 'Negative';
  };

  const chartData = data.map((item, index) => ({
    name: item.name.split(' ').slice(0, 2).join(' '),
    sentiment: Math.round(item.average_sentiment * 100),
    positive_ratio: Math.round(item.positive_ratio * 100),
    composite_score: Math.round(item.composite_score * 100),
    reviews: item.review_count,
    rank: index + 1
  }));

  const pieData = data.map((item, index) => ({
    name: item.name.split(' ').slice(0, 2).join(' '),
    value: Math.round(item.composite_score * 100),
    color: COLORS[index % COLORS.length]
  }));

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Data</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchData} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Smartphone className="w-8 h-8 text-blue-600" />
              Sentiment-Ranked Smartphones
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time sentiment analysis of Amazon India's bestseller smartphones
            </p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
          
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Phones</p>
                  <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.reduce((sum, item) => sum + item.review_count, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Sentiment</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.length > 0 ? Math.round((data.reduce((sum, item) => sum + item.average_sentiment, 0) / data.length) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Top Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.length > 0 ? Math.round(Math.max(...data.map(item => item.composite_score)) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="ranking" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ranking">📱 Rankings</TabsTrigger>
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="insights">💡 Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.map((phone, index) => (
                <Card key={phone.name} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight mb-2">
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="line-clamp-2">{phone.name}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{phone.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          {phone.price && (
                            <Badge variant="outline" className="text-xs">
                              {phone.price}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Composite Score</span>
                          <span className="text-sm font-bold text-blue-600">
                            {Math.round(phone.composite_score * 100)}%
                          </span>
                        </div>
                        <Progress value={phone.composite_score * 100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Sentiment</span>
                          <Badge className={`text-xs ${getSentimentColor(phone.average_sentiment)}`}>
                            {getSentimentLabel(phone.average_sentiment)}
                          </Badge>
                        </div>
                        <Progress value={phone.average_sentiment * 100} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Positive Reviews</span>
                          <span className="text-sm font-bold text-green-600">
                            {Math.round(phone.positive_ratio * 100)}%
                          </span>
                        </div>
                        <Progress value={phone.positive_ratio * 100} className="h-2" />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{phone.review_count} reviews</span>
                      </div>
                      {phone.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{phone.rating}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Sentiment Comparison
                  </CardTitle>
                  <CardDescription>
                    Average sentiment scores across top smartphones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Bar dataKey="sentiment" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Share by Score</CardTitle>
                  <CardDescription>
                    Composite scores distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>🏆 Top Performer</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{data[0].name}</h3>
                      <p className="text-sm text-gray-600">
                        Leads with a composite score of {Math.round(data[0].composite_score * 100)}%
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Badge className="bg-green-100 text-green-800">
                          {Math.round(data[0].positive_ratio * 100)}% Positive
                        </Badge>
                        <Badge variant="outline">
                          {data[0].review_count} Reviews
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📈 Sentiment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Highly Positive (70%+)</span>
                      <span className="font-semibold text-green-600">
                        {data.filter(item => item.average_sentiment >= 0.7).length} phones
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Neutral (50-70%)</span>
                      <span className="font-semibold text-yellow-600">
                        {data.filter(item => item.average_sentiment >= 0.5 && item.average_sentiment < 0.7).length} phones
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Negative (&lt;50%)</span>
                      <span className="font-semibold text-red-600">
                        {data.filter(item => item.average_sentiment < 0.5).length} phones
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
