import axios from 'axios';

// MusicBrainz API Service
export class MusicBrainzService {
  private baseURL = 'https://musicbrainz.org/ws/2';
  private userAgent = import.meta.env.VITE_MUSICBRAINZ_USER_AGENT || 'TunesDB/1.0.0';

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async searchArtists(query: string, limit = 10) {
    await this.delay(1000); // Rate limiting
    try {
      const response = await axios.get(`${this.baseURL}/artist`, {
        params: {
          query,
          fmt: 'json',
          limit
        },
        headers: {
          'User-Agent': this.userAgent
        }
      });
      return response.data.artists || [];
    } catch (error) {
      console.error('MusicBrainz artist search error:', error);
      return [];
    }
  }

  async searchReleases(artistMbid: string, limit = 50) {
    await this.delay(1000);
    try {
      const response = await axios.get(`${this.baseURL}/release`, {
        params: {
          artist: artistMbid,
          fmt: 'json',
          limit,
          inc: 'recordings+artist-credits'
        },
        headers: {
          'User-Agent': this.userAgent
        }
      });
      return response.data.releases || [];
    } catch (error) {
      console.error('MusicBrainz release search error:', error);
      return [];
    }
  }

  async getRecording(mbid: string) {
    await this.delay(1000);
    try {
      const response = await axios.get(`${this.baseURL}/recording/${mbid}`, {
        params: {
          fmt: 'json',
          inc: 'artist-credits+releases+tags+genres'
        },
        headers: {
          'User-Agent': this.userAgent
        }
      });
      return response.data;
    } catch (error) {
      console.error('MusicBrainz recording error:', error);
      return null;
    }
  }
}

// Last.fm API Service
export class LastFmService {
  private apiKey = import.meta.env.VITE_LASTFM_API_KEY;
  private baseURL = 'https://ws.audioscrobbler.com/2.0/';

  async getArtistInfo(artist: string) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          method: 'artist.getinfo',
          artist,
          api_key: this.apiKey,
          format: 'json'
        }
      });
      return response.data.artist;
    } catch (error) {
      console.error('Last.fm artist info error:', error);
      return null;
    }
  }

  async getTrackInfo(artist: string, track: string) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          method: 'track.getinfo',
          artist,
          track,
          api_key: this.apiKey,
          format: 'json'
        }
      });
      return response.data.track;
    } catch (error) {
      console.error('Last.fm track info error:', error);
      return null;
    }
  }

  async getTopTracks(country = '', limit = 50) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          method: 'chart.gettoptracks',
          api_key: this.apiKey,
          format: 'json',
          limit,
          ...(country && { country })
        }
      });
      return response.data.tracks?.track || [];
    } catch (error) {
      console.error('Last.fm top tracks error:', error);
      return [];
    }
  }

  async getSimilarArtists(artist: string, limit = 20) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          method: 'artist.getsimilar',
          artist,
          api_key: this.apiKey,
          format: 'json',
          limit
        }
      });
      return response.data.similarartists?.artist || [];
    } catch (error) {
      console.error('Last.fm similar artists error:', error);
      return [];
    }
  }
}

// AudioDB Service
export class AudioDBService {
  private baseURL = 'https://www.theaudiodb.com/api/v1/json/2';

  async searchArtist(artist: string) {
    try {
      const response = await axios.get(`${this.baseURL}/search.php`, {
        params: { s: artist }
      });
      return response.data.artists || [];
    } catch (error) {
      console.error('AudioDB artist search error:', error);
      return [];
    }
  }

  async getArtistAlbums(artistId: string) {
    try {
      const response = await axios.get(`${this.baseURL}/album.php`, {
        params: { i: artistId }
      });
      return response.data.album || [];
    } catch (error) {
      console.error('AudioDB albums error:', error);
      return [];
    }
  }

  async getAlbumTracks(albumId: string) {
    try {
      const response = await axios.get(`${this.baseURL}/track.php`, {
        params: { m: albumId }
      });
      return response.data.track || [];
    } catch (error) {
      console.error('AudioDB tracks error:', error);
      return [];
    }
  }
}

// Genius API Service
export class GeniusService {
  private accessToken = import.meta.env.VITE_GENIUS_ACCESS_TOKEN;
  private baseURL = 'https://api.genius.com';

  async searchSongs(query: string) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: { q: query },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      return response.data.response.hits || [];
    } catch (error) {
      console.error('Genius search error:', error);
      return [];
    }
  }

  async getSongDetails(songId: string) {
    try {
      const response = await axios.get(`${this.baseURL}/songs/${songId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      return response.data.response.song;
    } catch (error) {
      console.error('Genius song details error:', error);
      return null;
    }
  }

  async getArtistSongs(artistId: string, page = 1) {
    try {
      const response = await axios.get(`${this.baseURL}/artists/${artistId}/songs`, {
        params: {
          page,
          per_page: 50,
          sort: 'popularity'
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      return response.data.response.songs || [];
    } catch (error) {
      console.error('Genius artist songs error:', error);
      return [];
    }
  }
}

// Discogs API Service
export class DiscogsService {
  private apiKey = import.meta.env.VITE_DISCOGS_API_KEY;
  private baseURL = 'https://api.discogs.com';

  async searchReleases(query: string, type = 'release') {
    try {
      const response = await axios.get(`${this.baseURL}/database/search`, {
        params: {
          q: query,
          type,
          key: this.apiKey,
          secret: import.meta.env.VITE_DISCOGS_SECRET
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('Discogs search error:', error);
      return [];
    }
  }

  async getRelease(releaseId: string) {
    try {
      const response = await axios.get(`${this.baseURL}/releases/${releaseId}`, {
        params: {
          key: this.apiKey,
          secret: import.meta.env.VITE_DISCOGS_SECRET
        }
      });
      return response.data;
    } catch (error) {
      console.error('Discogs release error:', error);
      return null;
    }
  }
}

// Integrated Music Data Service
export class IntegratedMusicDataService {
  private musicBrainz = new MusicBrainzService();
  private lastFm = new LastFmService();
  private audioDB = new AudioDBService();
  private genius = new GeniusService();
  private discogs = new DiscogsService();

  async getComprehensiveArtistData(artistName: string) {
    const results = await Promise.allSettled([
      this.musicBrainz.searchArtists(artistName, 1),
      this.lastFm.getArtistInfo(artistName),
      this.audioDB.searchArtist(artistName),
      this.lastFm.getSimilarArtists(artistName)
    ]);

    return {
      musicBrainz: results[0].status === 'fulfilled' ? results[0].value[0] : null,
      lastFm: results[1].status === 'fulfilled' ? results[1].value : null,
      audioDB: results[2].status === 'fulfilled' ? results[2].value[0] : null,
      similarArtists: results[3].status === 'fulfilled' ? results[3].value : []
    };
  }

  async getComprehensiveTrackData(artistName: string, trackName: string) {
    const results = await Promise.allSettled([
      this.lastFm.getTrackInfo(artistName, trackName),
      this.genius.searchSongs(`${artistName} ${trackName}`)
    ]);

    const geniusResults = results[1].status === 'fulfilled' ? results[1].value : [];
    const geniusTrack = geniusResults.length > 0 ? geniusResults[0].result : null;

    return {
      lastFm: results[0].status === 'fulfilled' ? results[0].value : null,
      genius: geniusTrack
    };
  }

  async getPopularTracks(country?: string) {
    return this.lastFm.getTopTracks(country);
  }

  async enrichTrackWithLyrics(trackData: any) {
    if (!trackData.genius?.id) return trackData;
    
    const detailedSong = await this.genius.getSongDetails(trackData.genius.id);
    return {
      ...trackData,
      genius: detailedSong
    };
  }
}

export const musicDataService = new IntegratedMusicDataService();