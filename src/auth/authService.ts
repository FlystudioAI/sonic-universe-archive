import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserPreferences, UserInteraction } from '../types';

export class AuthService {
  private currentUser: User | null = null;

  constructor() {
    // Listen for auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        this.currentUser = await this.getOrCreateUserProfile(firebaseUser);
      } else {
        this.currentUser = null;
      }
    });
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      // Create user profile in Firestore
      const userProfile = await this.createUserProfile(userCredential.user, {
        interests: [], // Will be set during onboarding
        subscriptionTier: 'free'
      });

      return userProfile;
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error('Failed to create account');
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await this.getOrCreateUserProfile(userCredential.user);
      return userProfile;
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error('Invalid email or password');
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userProfile = await this.getOrCreateUserProfile(userCredential.user);
      return userProfile;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw new Error('Failed to sign in with Google');
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  private async createUserProfile(firebaseUser: FirebaseUser, additionalData: Partial<User> = {}): Promise<User> {
    const userProfile: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      interests: [],
      subscriptionTier: 'free',
      createdAt: new Date(),
      lastActive: new Date(),
      ...additionalData
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userProfile);
    return userProfile;
  }

  private async getOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<User> {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      
      // Update last active timestamp
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastActive: new Date()
      });
      
      return {
        ...userData,
        lastActive: new Date()
      };
    } else {
      // Create new user profile
      return this.createUserProfile(firebaseUser);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  isPremiumUser(): boolean {
    return this.currentUser?.subscriptionTier === 'premium';
  }

  // User onboarding - set initial interests
  async completeOnboarding(interests: string[]): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    await updateDoc(doc(db, 'users', this.currentUser.uid), {
      interests: interests
    });

    this.currentUser.interests = interests;
  }

  // Update user preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const preferencesRef = doc(db, 'userPreferences', this.currentUser.uid);
    await setDoc(preferencesRef, preferences, { merge: true });
  }

  async getUserPreferences(): Promise<UserPreferences> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const preferencesDoc = await getDoc(doc(db, 'userPreferences', this.currentUser.uid));
    
    if (preferencesDoc.exists()) {
      return preferencesDoc.data() as UserPreferences;
    } else {
      // Return default preferences
      const defaultPreferences: UserPreferences = {
        topics: this.currentUser.interests,
        sources: [],
        contentTypes: ['breaking', 'analysis'],
        podcastFrequency: 'daily',
        emailNotifications: true,
        pushNotifications: true
      };

      await this.updatePreferences(defaultPreferences);
      return defaultPreferences;
    }
  }

  // User interaction tracking for personalization
  async trackUserInteraction(interaction: Omit<UserInteraction, 'userId' | 'timestamp'>): Promise<void> {
    if (!this.currentUser) return;

    const interactionData: UserInteraction = {
      userId: this.currentUser.uid,
      timestamp: new Date(),
      ...interaction
    };

    await addDoc(collection(db, 'userInteractions'), interactionData);
  }

  async getUserInteractionHistory(limit: number = 100): Promise<UserInteraction[]> {
    if (!this.currentUser) return [];

    const q = query(
      collection(db, 'userInteractions'),
      where('userId', '==', this.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserInteraction);
  }

  // Subscription management
  async upgradeToPremium(stripeSubscriptionId: string): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    await updateDoc(doc(db, 'users', this.currentUser.uid), {
      subscriptionTier: 'premium'
    });

    // Store subscription details
    await setDoc(doc(db, 'subscriptions', this.currentUser.uid), {
      userId: this.currentUser.uid,
      tier: 'premium',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      stripeSubscriptionId
    });

    this.currentUser.subscriptionTier = 'premium';
  }

  async cancelSubscription(): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    await updateDoc(doc(db, 'subscriptions', this.currentUser.uid), {
      status: 'canceled'
    });

    // Note: Keep premium access until period ends
    // The subscription tier will be downgraded via webhook or scheduled function
  }

  // Analytics and insights
  async getUserEngagementStats(): Promise<{
    totalInteractions: number;
    articlesRead: number;
    podcastsListened: number;
    tweetsViewed: number;
    averageSessionTime: number;
  }> {
    if (!this.currentUser) {
      return {
        totalInteractions: 0,
        articlesRead: 0,
        podcastsListened: 0,
        tweetsViewed: 0,
        averageSessionTime: 0
      };
    }

    const interactions = await this.getUserInteractionHistory(1000);
    
    const stats = {
      totalInteractions: interactions.length,
      articlesRead: interactions.filter(i => i.itemType === 'article' && i.actionType === 'view').length,
      podcastsListened: interactions.filter(i => i.itemType === 'podcast' && i.actionType === 'listen_complete').length,
      tweetsViewed: interactions.filter(i => i.itemType === 'tweet' && i.actionType === 'view').length,
      averageSessionTime: 0 // Would need session tracking to calculate this
    };

    return stats;
  }

  // Content recommendations based on user behavior
  getRecommendedTopics(): string[] {
    if (!this.currentUser) return [];

    // Start with user interests
    const topics = [...this.currentUser.interests];

    // TODO: Enhance with ML-based recommendations using interaction history
    // For now, return basic recommendations
    const aiTopics = ['ChatGPT', 'OpenAI', 'Machine Learning', 'Neural Networks', 'Computer Vision'];
    
    return [...new Set([...topics, ...aiTopics])].slice(0, 10);
  }

  // User saved content management
  async saveArticle(articleId: string): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    await addDoc(collection(db, 'savedContent'), {
      userId: this.currentUser.uid,
      itemId: articleId,
      itemType: 'article',
      savedAt: new Date()
    });

    await this.trackUserInteraction({
      itemId: articleId,
      itemType: 'article',
      actionType: 'save'
    });
  }

  async getSavedArticles(): Promise<string[]> {
    if (!this.currentUser) return [];

    const q = query(
      collection(db, 'savedContent'),
      where('userId', '==', this.currentUser.uid),
      where('itemType', '==', 'article'),
      orderBy('savedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data().itemId);
  }

  async unsaveArticle(articleId: string): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'savedContent'),
      where('userId', '==', this.currentUser.uid),
      where('itemId', '==', articleId),
      where('itemType', '==', 'article')
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach(async (docSnapshot) => {
      await docSnapshot.ref.delete();
    });
  }
}