export interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  city: string;
  interests: string[];
  checkInCount: number;
  showInFlirtRadar: boolean;
  allowFlirtFrom: string;
  invisibleMode: boolean;
}

export interface User {
  id: string;
  email: string;
  role: 'USER' | 'RESTAURANT_ADMIN' | 'SUPERADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  profile: UserProfile;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  phone?: string;
  instagram?: string;
  logoUrl?: string;
  coverUrl?: string;
  rating: number;
  activePeopleCount?: number;
  openingHours?: Record<string, string>;
  menuCategories?: Array<{
    name: string;
    items: Array<{ name: string; price: string; description: string }>;
  }>;
}

export interface CheckIn {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CHECKED_OUT';
  startedAt: string;
  expiresAt: string;
  restaurant: Restaurant;
}

export interface Patron {
  checkInId: string;
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  interests: string[];
  checkInCount: number;
  showInFlirtRadar: boolean;
  startedAt: string;
  timePresentMinutes: number;
}

export interface PostComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface Post {
  id: string;
  content: string;
  type: 'FEED' | 'FLIRT' | 'SPONSORED';
  flirtContext?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  userReaction?: 'LIKE' | 'HEART' | 'CHEERS' | 'FIRE' | null;
  media: string[];
  isVideo?: boolean;
  videoUrl?: string;
  videoDuration?: string;
  isBarOfficial?: boolean;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    checkInCount?: number;
    isOfficial?: boolean;
  };
  comments: PostComment[];
}

export interface FlirtNote {
  id: string;
  content: string;
  flirtContext: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface Meetup {
  id: string;
  title: string;
  description: string;
  scheduledFor: string;
  status: string;
  participantsCount: number;
  isJoined: boolean;
  creator: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  participants: Array<{
    userId: string;
    name?: string;
    avatarUrl?: string;
  }>;
}

export interface BarEvent {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  startTime: string;
  coverImageUrl?: string;
  participantsCount: number;
  isRsvpd: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  discountText: string;
  description: string;
  validUntil: string;
  terms?: string;
  badge?: string;
  totalCoupons: number;
  redeemedCount: number;
  isAvailable: boolean;
  userCoupon?: {
    id: string;
    code: string;
    status: 'CLAIMED' | 'USED' | 'EXPIRED';
    claimedAt: string;
  } | null;
}

export interface Conversation {
  id: string;
  type: string;
  restaurantName: string;
  restaurantSlug: string;
  updatedAt: string;
  otherUser?: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  } | null;
  lastMessage?: {
    content: string;
    createdAt: string;
    isMine: boolean;
    isRead: boolean;
  } | null;
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  isRead: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
