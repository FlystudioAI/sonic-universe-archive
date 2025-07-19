import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Music, User, Sparkles, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: {
    songs: Array<{ id: string; title: string }>;
    artists: Array<{ id: string; name: string }>;
    news: Array<{ id: string; title: string }>;
  };
}

const MusicChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm SonicSage, your AI music oracle. Ask me anything about songs, artists, albums, or music history. I can tell you stories behind the music, explain influences, or help you discover new sounds!",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if database has data
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    checkDatabaseData();
  }, []);

  const checkDatabaseData = async () => {
    try {
      const { data } = await supabase.from('songs').select('id').limit(1);
      setHasData(data && data.length > 0);
    } catch (error) {
      console.error('Error checking database:', error);
      setHasData(false);
    }
  };

  const populateDatabase = async () => {
    setIsPopulating(true);
    try {
      const { data, error } = await supabase.functions.invoke('populate-sample-data');
      if (error) throw error;
      console.log('Database populated:', data);
      setHasData(true);
      
      // Add system message
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: "Great! I've just populated the database with classic songs from The Beatles, Pink Floyd, Bob Dylan, Led Zeppelin, and David Bowie. Now ask me anything about these legendary artists and their music!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error('Error populating database:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const queryText = input;
    setInput('');
    setIsLoading(true);

    try {
      console.log('Sending chat request:', queryText);
      
      const { data, error } = await supabase.functions.invoke('music-chat', {
        body: { query: queryText }
      });

      console.log('Chat response:', data, error);

      if (error) {
        console.error('Chat error:', error);
        throw error;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.answer || "I received your question but couldn't generate a response. Please try again.",
        timestamp: new Date(),
        sources: data.sources
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I apologize, but I'm having trouble connecting right now. The error was: ${error.message || 'Unknown error'}. Please try again in a moment.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "What's the story behind Dark Side of the Moon?",
    "Who influenced Jimi Hendrix?",
    "Songs that sample classical music",
    "What makes a song go viral?",
  ];

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">SonicSage</h3>
                <p className="text-sm text-muted-foreground">Your AI music oracle</p>
              </div>
            </div>
            
            {!hasData && (
              <Button 
                onClick={populateDatabase} 
                disabled={isPopulating}
                variant="outline"
                size="sm"
              >
                {isPopulating ? 'Loading...' : 'Add Sample Music'}
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Music className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                    <Card className={`${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card'
                    }`}>
                      <CardContent className="p-3">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Sources */}
                        {message.sources && (
                          <div className="mt-3 space-y-2">
                            {message.sources.songs.length > 0 && (
                              <div>
                                <p className="text-xs font-medium mb-1">Referenced Songs:</p>
                                <div className="flex flex-wrap gap-1">
                                  {message.sources.songs.map((song) => (
                                    <Badge key={song.id} variant="secondary" className="text-xs">
                                      {song.title}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {message.sources.artists.length > 0 && (
                              <div>
                                <p className="text-xs font-medium mb-1">Referenced Artists:</p>
                                <div className="flex flex-wrap gap-1">
                                  {message.sources.artists.map((artist) => (
                                    <Badge key={artist.id} variant="outline" className="text-xs">
                                      {artist.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                          <Clock className="h-3 w-3" />
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Music className="h-4 w-4 text-white" />
                </div>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="p-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(question)}
                  className="text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about any song, artist, or music topic..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading}
              className="px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MusicChatInterface;