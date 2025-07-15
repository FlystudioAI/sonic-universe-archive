import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const spotifyClientId = Deno.env.get('SPOTIFY_CLIENT_ID');
const spotifyClientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
const newsApiKey = Deno.env.get('NEWS_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface NewsItem {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  author?: string;
  publishedAt: string;
  category: string;
  tags?: string[];
}

interface ChartItem {
  chartType: string;
  position: number;
  songTitle: string;
  artistName: string;
  albumName?: string;
  coverArtUrl?: string;
  chartDate: string;
  previousPosition?: number;
  weeksOnChart?: number;
  peakPosition?: number;
  externalId?: string;
  sourceUrl?: string;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    let result;
    
    switch (action) {
      case 'fetch-news':
        result = await fetchMusicNews();
        break;
      case 'fetch-charts':
        result = await fetchMusicCharts(params.chartType);
        break;
      case 'fetch-trends':
        result = await fetchMusicTrends();
        break;
      case 'get-news':
        result = await getMusicNews(params.limit || 20, params.category);
        break;
      case 'get-charts':
        result = await getMusicCharts(params.chartType, params.limit || 50);
        break;
      case 'get-trends':
        result = await getMusicTrends(params.limit || 20);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in music-news-and-charts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchMusicNews(): Promise<{ success: boolean; count: number }> {
  console.log('Fetching music news from multiple sources...');
  
  const newsItems: NewsItem[] = [];
  
  // Fetch from NewsAPI if available
  if (newsApiKey) {
    try {
      const newsApiItems = await fetchFromNewsAPI();
      newsItems.push(...newsApiItems);
    } catch (error) {
      console.error('Error fetching from NewsAPI:', error);
    }
  }
  
  // Fetch from music RSS feeds
  try {
    const rssItems = await fetchFromMusicRSS();
    newsItems.push(...rssItems);
  } catch (error) {
    console.error('Error fetching from RSS feeds:', error);
  }
  
  // Fetch from Billboard RSS
  try {
    const billboardItems = await fetchFromBillboardRSS();
    newsItems.push(...billboardItems);
  } catch (error) {
    console.error('Error fetching from Billboard RSS:', error);
  }
  
  // Store news items in database
  let insertedCount = 0;
  for (const item of newsItems) {
    try {
      const { error } = await supabase
        .from('music_news')
        .upsert({
          title: item.title,
          description: item.description,
          url: item.url,
          image_url: item.imageUrl,
          source: item.source,
          author: item.author,
          published_at: item.publishedAt,
          category: item.category,
          tags: item.tags || []
        }, { onConflict: 'url' });
      
      if (!error) insertedCount++;
    } catch (error) {
      console.error('Error inserting news item:', error);
    }
  }
  
  console.log(`Fetched and stored ${insertedCount} news items`);
  return { success: true, count: insertedCount };
}

async function fetchFromNewsAPI(): Promise<NewsItem[]> {
  const response = await fetch(
    `https://newsapi.org/v2/everything?q=music OR musician OR album OR song OR concert OR festival&sortBy=publishedAt&language=en&apiKey=${newsApiKey}`
  );
  
  if (!response.ok) throw new Error('NewsAPI request failed');
  
  const data = await response.json();
  
  return data.articles.map((article: any) => ({
    title: article.title,
    description: article.description,
    url: article.url,
    imageUrl: article.urlToImage,
    source: 'NewsAPI',
    author: article.author,
    publishedAt: article.publishedAt,
    category: 'general',
    tags: ['music', 'news']
  }));
}

async function fetchFromMusicRSS(): Promise<NewsItem[]> {
  const rssFeeds = [
    'https://pitchfork.com/rss/news/',
    'https://www.rollingstone.com/music/rss/',
    'https://www.musicnews.com/rss.xml'
  ];
  
  const items: NewsItem[] = [];
  
  for (const feedUrl of rssFeeds) {
    try {
      const response = await fetch(feedUrl);
      if (!response.ok) continue;
      
      const xmlText = await response.text();
      const rssItems = parseRSSFeed(xmlText, feedUrl);
      items.push(...rssItems);
    } catch (error) {
      console.error(`Error fetching RSS from ${feedUrl}:`, error);
    }
  }
  
  return items;
}

async function fetchFromBillboardRSS(): Promise<NewsItem[]> {
  try {
    const response = await fetch('https://www.billboard.com/feed/');
    if (!response.ok) throw new Error('Billboard RSS request failed');
    
    const xmlText = await response.text();
    return parseRSSFeed(xmlText, 'Billboard');
  } catch (error) {
    console.error('Error fetching Billboard RSS:', error);
    return [];
  }
}

function parseRSSFeed(xmlText: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  // Simple XML parsing for RSS items
  const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g);
  
  if (!itemMatches) return items;
  
  for (const itemXml of itemMatches) {
    try {
      const title = extractXMLContent(itemXml, 'title');
      const description = extractXMLContent(itemXml, 'description');
      const link = extractXMLContent(itemXml, 'link');
      const pubDate = extractXMLContent(itemXml, 'pubDate');
      const author = extractXMLContent(itemXml, 'author');
      
      if (title && description && link && pubDate) {
        items.push({
          title: title.replace(/<!\[CDATA\[|\]\]>/g, ''),
          description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, ''),
          url: link,
          source: source,
          author: author,
          publishedAt: new Date(pubDate).toISOString(),
          category: 'music',
          tags: ['music', 'news']
        });
      }
    } catch (error) {
      console.error('Error parsing RSS item:', error);
    }
  }
  
  return items;
}

function extractXMLContent(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`));
  return match ? match[1].trim() : '';
}

async function fetchMusicCharts(chartType?: string): Promise<{ success: boolean; count: number }> {
  console.log('Fetching music charts...');
  
  const chartItems: ChartItem[] = [];
  
  // Fetch Spotify charts if credentials available
  if (spotifyClientId && spotifyClientSecret) {
    try {
      const spotifyCharts = await fetchSpotifyCharts();
      chartItems.push(...spotifyCharts);
    } catch (error) {
      console.error('Error fetching Spotify charts:', error);
    }
  }
  
  // Fetch Billboard charts (using web scraping or API if available)
  try {
    const billboardCharts = await fetchBillboardCharts();
    chartItems.push(...billboardCharts);
  } catch (error) {
    console.error('Error fetching Billboard charts:', error);
  }
  
  // Store chart items in database
  let insertedCount = 0;
  for (const item of chartItems) {
    try {
      const { error } = await supabase
        .from('music_charts')
        .upsert({
          chart_type: item.chartType,
          position: item.position,
          song_title: item.songTitle,
          artist_name: item.artistName,
          album_name: item.albumName,
          cover_art_url: item.coverArtUrl,
          chart_date: item.chartDate,
          previous_position: item.previousPosition,
          weeks_on_chart: item.weeksOnChart,
          peak_position: item.peakPosition,
          external_id: item.externalId,
          source_url: item.sourceUrl,
          metadata: item.metadata
        }, { onConflict: 'chart_type,position,chart_date' });
      
      if (!error) insertedCount++;
    } catch (error) {
      console.error('Error inserting chart item:', error);
    }
  }
  
  console.log(`Fetched and stored ${insertedCount} chart items`);
  return { success: true, count: insertedCount };
}

async function fetchSpotifyCharts(): Promise<ChartItem[]> {
  // Get Spotify access token
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${spotifyClientId}:${spotifyClientSecret}`)}`
    },
    body: 'grant_type=client_credentials'
  });
  
  if (!tokenResponse.ok) throw new Error('Failed to get Spotify token');
  
  const tokenData = await tokenResponse.json();
  
  // Fetch Spotify Top 50 Global playlist
  const playlistResponse = await fetch('https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=50', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`
    }
  });
  
  if (!playlistResponse.ok) throw new Error('Failed to fetch Spotify playlist');
  
  const playlistData = await playlistResponse.json();
  
  return playlistData.items.map((item: any, index: number) => ({
    chartType: 'spotify_global_top_50',
    position: index + 1,
    songTitle: item.track.name,
    artistName: item.track.artists.map((a: any) => a.name).join(', '),
    albumName: item.track.album.name,
    coverArtUrl: item.track.album.images[0]?.url,
    chartDate: new Date().toISOString().split('T')[0],
    externalId: item.track.id,
    sourceUrl: item.track.external_urls.spotify,
    metadata: {
      popularity: item.track.popularity,
      duration_ms: item.track.duration_ms,
      explicit: item.track.explicit
    }
  }));
}

async function fetchBillboardCharts(): Promise<ChartItem[]> {
  // This is a simplified implementation
  // In a real-world scenario, you'd use a Billboard API or web scraping
  // For now, return empty array
  return [];
}

async function fetchMusicTrends(): Promise<{ success: boolean; count: number }> {
  console.log('Fetching music trends...');
  
  // This would involve fetching from social media APIs
  // For now, return success with 0 count
  return { success: true, count: 0 };
}

async function getMusicNews(limit: number, category?: string): Promise<any[]> {
  let query = supabase
    .from('music_news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
}

async function getMusicCharts(chartType?: string, limit: number = 50): Promise<any[]> {
  let query = supabase
    .from('music_charts')
    .select('*')
    .order('chart_date', { ascending: false })
    .order('position', { ascending: true })
    .limit(limit);
  
  if (chartType) {
    query = query.eq('chart_type', chartType);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
}

async function getMusicTrends(limit: number): Promise<any[]> {
  const { data, error } = await supabase
    .from('music_trends')
    .select('*')
    .order('trend_date', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return data || [];
}