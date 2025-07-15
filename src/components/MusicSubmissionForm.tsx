import React, { useState } from 'react';
import { Upload, Music, User, Calendar, Tag, Mic, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MusicSubmissionData {
  title: string;
  artist_name: string;
  album_title?: string;
  duration_ms?: number;
  release_date?: string;
  bpm?: number;
  song_key?: string;
  key_mode?: 'major' | 'minor';
  energy_level?: 'low' | 'medium' | 'high' | 'very_high';
  mood?: string;
  genres: string[];
  instruments: string[];
  themes: string[];
  lyrics?: string;
  description?: string;
  audio_url?: string;
  cover_art_url?: string;
  music_video_url?: string;
  contact_email: string;
  record_label?: string;
  publishing_rights?: string;
}

const MusicSubmissionForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<MusicSubmissionData>({
    title: '',
    artist_name: '',
    genres: [],
    instruments: [],
    themes: [],
    contact_email: ''
  });

  const [currentGenre, setCurrentGenre] = useState('');
  const [currentInstrument, setCurrentInstrument] = useState('');
  const [currentTheme, setCurrentTheme] = useState('');

  React.useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user);
    };
    getCurrentUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit music.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submissionData = {
        ...formData,
        user_id: user.id,
        duration_ms: formData.duration_ms ? parseInt(formData.duration_ms.toString()) : null,
        bpm: formData.bpm ? parseFloat(formData.bpm.toString()) : null,
      };

      const { error } = await supabase
        .from('user_music_submissions')
        .insert(submissionData);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Submission Successful!",
        description: "Your music has been submitted for review. We'll contact you soon!",
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your music. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof MusicSubmissionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = (field: 'genres' | 'instruments' | 'themes', value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      updateField(field, [...formData[field], value.trim()]);
      setter('');
    }
  };

  const removeTag = (field: 'genres' | 'instruments' | 'themes', index: number) => {
    updateField(field, formData[field].filter((_, i) => i !== index));
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Submission Successful!</h2>
          <p className="text-muted-foreground mb-4">
            Thank you for submitting your music to TunesDB. Our team will review your submission and contact you within 3-5 business days.
          </p>
          <Button onClick={() => { setSubmitted(false); setFormData({ title: '', artist_name: '', genres: [], instruments: [], themes: [], contact_email: '' }); }}>
            Submit Another Song
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Submit Your Music to TunesDB
          </CardTitle>
          <p className="text-muted-foreground">
            Are you an artist, band, or record label? Submit your music to be included in our comprehensive database.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Song Title *
                </label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Enter song title"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Artist Name *
                </label>
                <Input
                  required
                  value={formData.artist_name}
                  onChange={(e) => updateField('artist_name', e.target.value)}
                  placeholder="Enter artist or band name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Album Title</label>
                <Input
                  value={formData.album_title || ''}
                  onChange={(e) => updateField('album_title', e.target.value)}
                  placeholder="Enter album name (optional)"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Release Date
                </label>
                <Input
                  type="date"
                  value={formData.release_date || ''}
                  onChange={(e) => updateField('release_date', e.target.value)}
                />
              </div>
            </div>

            {/* Audio Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">BPM</label>
                <Input
                  type="number"
                  min="40"
                  max="200"
                  value={formData.bpm || ''}
                  onChange={(e) => updateField('bpm', e.target.value)}
                  placeholder="120"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Energy Level</label>
                <Select value={formData.energy_level || ''} onValueChange={(value) => updateField('energy_level', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select energy level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="very_high">Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mood</label>
                <Select value={formData.mood || ''} onValueChange={(value) => updateField('mood', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="melancholic">Melancholic</SelectItem>
                    <SelectItem value="uplifting">Uplifting</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                    <SelectItem value="peaceful">Peaceful</SelectItem>
                    <SelectItem value="nostalgic">Nostalgic</SelectItem>
                    <SelectItem value="romantic">Romantic</SelectItem>
                    <SelectItem value="mysterious">Mysterious</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Genres
                </label>
                <div className="flex gap-2">
                  <Input
                    value={currentGenre}
                    onChange={(e) => setCurrentGenre(e.target.value)}
                    placeholder="Add genre (e.g., Rock, Pop, Jazz)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('genres', currentGenre, setCurrentGenre);
                      }
                    }}
                  />
                  <Button type="button" onClick={() => addTag('genres', currentGenre, setCurrentGenre)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.genres.map((genre, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag('genres', index)}>
                      {genre} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Instruments
                </label>
                <div className="flex gap-2">
                  <Input
                    value={currentInstrument}
                    onChange={(e) => setCurrentInstrument(e.target.value)}
                    placeholder="Add instrument (e.g., Guitar, Piano, Drums)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('instruments', currentInstrument, setCurrentInstrument);
                      }
                    }}
                  />
                  <Button type="button" onClick={() => addTag('instruments', currentInstrument, setCurrentInstrument)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.instruments.map((instrument, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag('instruments', index)}>
                      {instrument} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Media URLs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Audio URL</label>
                <Input
                  type="url"
                  value={formData.audio_url || ''}
                  onChange={(e) => updateField('audio_url', e.target.value)}
                  placeholder="Link to your song (SoundCloud, YouTube, etc.)"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Art URL</label>
                <Input
                  type="url"
                  value={formData.cover_art_url || ''}
                  onChange={(e) => updateField('cover_art_url', e.target.value)}
                  placeholder="Link to cover art image"
                />
              </div>
            </div>

            {/* Description & Lyrics */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Tell us about your song, its inspiration, or story behind it..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Lyrics</label>
                <Textarea
                  value={formData.lyrics || ''}
                  onChange={(e) => updateField('lyrics', e.target.value)}
                  placeholder="Paste your song lyrics here (optional)"
                  rows={6}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Email *</label>
                <Input
                  type="email"
                  required
                  value={formData.contact_email}
                  onChange={(e) => updateField('contact_email', e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Record Label</label>
                <Input
                  value={formData.record_label || ''}
                  onChange={(e) => updateField('record_label', e.target.value)}
                  placeholder="Label name (if applicable)"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !user}
              className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Music for Review
                </>
              )}
            </Button>

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                Please sign in to submit your music to TunesDB
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MusicSubmissionForm;