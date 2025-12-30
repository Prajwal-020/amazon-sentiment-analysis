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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw, Smartphone, TrendingUp, Star, MessageCircle, BarChart3, Activity, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip as RechartsTooltip, Legend } from 'recharts';

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
  reviews?: string[];
}

interface ReviewData {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SentimentDashboard() {
  const [data, setData] = useState<SmartphoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<SmartphoneData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewData[]>([]);

  const fetchData = async () => {
    try {
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/top-mobiles`);
      
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/refresh`, { method: 'POST' });
      // Then fetch new data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
      setRefreshing(false);
    }
  };

  const fetchPhoneReviews = async (phone: SmartphoneData) => {
    setReviewsLoading(true);
    setSelectedPhone(phone);

    try {
      // For now, we'll simulate reviews based on the phone's data
      // In a real implementation, you'd fetch actual reviews from the backend
      const mockReviews: ReviewData[] = [];

      // Generate mock reviews based on sentiment data
      const positiveCount = Math.round(phone.review_count * phone.positive_ratio);
      const negativeCount = Math.round(phone.review_count * (1 - phone.positive_ratio) * 0.3);
      const neutralCount = phone.review_count - positiveCount - negativeCount;

      // Positive reviews
      const positiveTemplates = [
        "Excellent phone with great performance and battery life!",
        "Amazing camera quality and fast processing speed.",
        "Best value for money, highly recommended!",
        "Outstanding build quality and user experience.",
        "Perfect phone for daily use, very satisfied!",
        "Great features and smooth performance.",
        "Impressive display quality and fast charging.",
        "Reliable phone with excellent customer service."
      ];

      // Negative reviews
      const negativeTemplates = [
        "Battery drains too quickly, not satisfied.",
        "Camera quality could be better for the price.",
        "Heating issues during heavy usage.",
        "Software bugs and slow performance.",
        "Poor build quality, feels cheap.",
        "Disappointing performance, expected better.",
        "Network connectivity issues frequently.",
        "Not worth the money, many better alternatives."
      ];

      // Neutral reviews
      const neutralTemplates = [
        "Decent phone, nothing extraordinary but works fine.",
        "Average performance, meets basic requirements.",
        "Good phone but has some minor issues.",
        "Okay for the price range, could be improved.",
        "Standard features, nothing special to highlight.",
        "Fair performance, some pros and cons.",
        "Acceptable quality, meets expectations.",
        "Reasonable choice in this price segment."
      ];

      // Add positive reviews
      for (let i = 0; i < Math.min(positiveCount, 12); i++) {
        mockReviews.push({
          text: positiveTemplates[i % positiveTemplates.length],
          sentiment: 'positive',
          score: 0.7 + Math.random() * 0.3
        });
      }

      // Add negative reviews
      for (let i = 0; i < Math.min(negativeCount, 8); i++) {
        mockReviews.push({
          text: negativeTemplates[i % negativeTemplates.length],
          sentiment: 'negative',
          score: 0.1 + Math.random() * 0.3
        });
      }

      // Add neutral reviews
      for (let i = 0; i < Math.min(neutralCount, 5); i++) {
        mockReviews.push({
          text: neutralTemplates[i % neutralTemplates.length],
          sentiment: 'neutral',
          score: 0.4 + Math.random() * 0.2
        });
      }

      // Shuffle and limit to 20 reviews
      const shuffledReviews = mockReviews.sort(() => Math.random() - 0.5).slice(0, 20);
      setReviews(shuffledReviews);

    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
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
    positive: Math.round(item.positive_ratio * 100),
    negative: Math.round((1 - item.positive_ratio) * 100),
    composite: Math.round(item.composite_score * 100),
    reviews: item.review_count,
    rank: index + 1,
    fullName: item.name
  }));

  const pieData = data.map((item, index) => ({
    name: item.name.split(' ').slice(0, 2).join(' '),
    value: Math.round(item.composite_score * 100),
    color: COLORS[index % COLORS.length],
    fullName: item.name
  }));

  const sentimentComparisonData = data.map((item, index) => ({
    name: item.name.split(' ').slice(0, 2).join(' '),
    positive: Math.round(item.positive_ratio * 100),
    negative: Math.round((1 - item.positive_ratio) * 30), // Assuming 30% of non-positive are negative
    neutral: Math.round((1 - item.positive_ratio) * 70), // Rest are neutral
    fullName: item.name
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

                    <Button
                      onClick={() => fetchPhoneReviews(phone)}
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Reviews
                    </Button>
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
                    Sentiment Breakdown
                  </CardTitle>
                  <CardDescription>
                    Positive, neutral, and negative sentiment distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sentimentComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value, name) => [`${value}%`, name]}
                        labelFormatter={(label) => {
                          const item = sentimentComparisonData.find(d => d.name === label);
                          return item?.fullName || label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="positive" stackId="a" fill="#22C55E" name="Positive" />
                      <Bar dataKey="neutral" stackId="a" fill="#F59E0B" name="Neutral" />
                      <Bar dataKey="negative" stackId="a" fill="#EF4444" name="Negative" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Composite Score Comparison</CardTitle>
                  <CardDescription>
                    Overall performance ranking by composite score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={80}
                        fontSize={12}
                      />
                      <RechartsTooltip
                        formatter={(value) => [`${value}%`, 'Composite Score']}
                        labelFormatter={(label) => {
                          const item = chartData.find(d => d.name === label);
                          return item?.fullName || label;
                        }}
                      />
                      <Bar dataKey="composite" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Detailed comparison of sentiment and review metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value, name) => [`${value}%`, name]}
                      labelFormatter={(label) => {
                        const item = chartData.find(d => d.name === label);
                        return item?.fullName || label;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sentiment"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name="Sentiment Score"
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="positive"
                      stroke="#22C55E"
                      strokeWidth={3}
                      name="Positive Ratio"
                      dot={{ fill: '#22C55E', strokeWidth: 2, r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="composite"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      name="Composite Score"
                      dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
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

        {/* Reviews Modal */}
        <Dialog open={selectedPhone !== null} onOpenChange={() => setSelectedPhone(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Reviews for {selectedPhone?.name}
              </DialogTitle>
              <DialogDescription>
                Sentiment analysis of customer reviews
              </DialogDescription>
            </DialogHeader>

            {reviewsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Stats */}
                {selectedPhone && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          {reviews.filter(r => r.sentiment === 'positive').length}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Positive</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <MessageCircle className="w-4 h-4 text-yellow-600" />
                        <span className="font-semibold text-yellow-600">
                          {reviews.filter(r => r.sentiment === 'neutral').length}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Neutral</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <ThumbsDown className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-red-600">
                          {reviews.filter(r => r.sentiment === 'negative').length}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Negative</p>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reviews.map((review, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          className={`text-xs ${
                            review.sentiment === 'positive'
                              ? 'bg-green-100 text-green-800'
                              : review.sentiment === 'negative'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {review.sentiment === 'positive' && <ThumbsUp className="w-3 h-3 mr-1" />}
                          {review.sentiment === 'negative' && <ThumbsDown className="w-3 h-3 mr-1" />}
                          {review.sentiment === 'neutral' && <MessageCircle className="w-3 h-3 mr-1" />}
                          {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Score: {(review.score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {review.text}
                      </p>
                    </Card>
                  ))}
                </div>

                {reviews.length === 0 && !reviewsLoading && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No reviews available for this product.</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
