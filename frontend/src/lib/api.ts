import {
  MOCK_RESTAURANT,
  MOCK_CURRENT_USER,
  MOCK_PATRONS,
  MOCK_POSTS,
  MOCK_BAR_POSTS,
  MOCK_FLIRT_NOTES,
  MOCK_MEETUPS,
  MOCK_EVENTS,
  MOCK_PROMOTIONS,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_STORIES,
} from './mock-data';
import { Story } from './types';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getMockFallback(endpoint: string, options: RequestInit = {}): any {
  const method = (options.method || 'GET').toUpperCase();

  // POST actions simulation
  if (method === 'POST') {
    if (endpoint.includes('/check-ins')) {
      return { success: true, message: 'Check-in realizado com sucesso!', startedAt: new Date().toISOString() };
    }
    if (endpoint.includes('/react')) {
      return { success: true, reaction: 'CHEERS' };
    }
    if (endpoint.includes('/comments')) {
      return {
        id: 'new-comm-' + Date.now(),
        content: 'Comentário enviado!',
        createdAt: new Date().toISOString(),
        author: {
          id: MOCK_CURRENT_USER.id,
          name: MOCK_CURRENT_USER.profile.name,
          username: MOCK_CURRENT_USER.profile.username,
          avatarUrl: MOCK_CURRENT_USER.profile.avatarUrl,
        },
      };
    }
    if (endpoint.includes('/flirt/interest')) {
      return { isMatch: true, message: '✨ Deu match mútuo!' };
    }
    if (endpoint.includes('/claim')) {
      return {
        id: 'cup-new-' + Date.now(),
        code: 'PIRAMBA-HAPPY-' + Math.floor(1000 + Math.random() * 9000),
        status: 'CLAIMED',
        claimedAt: new Date().toISOString(),
      };
    }
    if (endpoint.includes('/rsvp')) {
      return { success: true, isRsvpd: true };
    }
    if (endpoint.includes('/meetups') && endpoint.includes('/join')) {
      return { success: true, isJoined: true };
    }
    if (endpoint.includes('/messages')) {
      return {
        id: 'msg-' + Date.now(),
        content: 'Mensagem enviada com sucesso',
        createdAt: new Date().toISOString(),
        isMine: true,
        isRead: false,
      };
    }
    if (endpoint.includes('/stories') && endpoint.includes('/reply')) {
      return { success: true, message: 'Mensagem enviada com sucesso ao autor do story!' };
    }
    if (endpoint.includes('/stories')) {
      try {
        const body = options.body ? JSON.parse(options.body as string) : {};
        const newStory: Story = {
          id: 'story-' + Date.now(),
          mediaUrl: body.mediaUrl || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1080&q=80',
          mediaType: body.mediaType || 'IMAGE',
          caption: body.caption,
          createdAt: new Date().toISOString(),
          author: {
            id: MOCK_CURRENT_USER.id,
            name: MOCK_CURRENT_USER.profile.name,
            username: MOCK_CURRENT_USER.profile.username,
            avatarUrl: MOCK_CURRENT_USER.profile.avatarUrl,
            isOfficial: false,
          },
        };
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('tonopiramba_stories');
          const currentStories: Story[] = stored ? JSON.parse(stored) : MOCK_STORIES;
          localStorage.setItem('tonopiramba_stories', JSON.stringify([newStory, ...currentStories]));
        }
        return newStory;
      } catch {
        return { success: true };
      }
    }
    if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
      return {
        token: 'mock-jwt-token-pirambeira',
        user: MOCK_CURRENT_USER,
      };
    }
    return { success: true };
  }

  // GET queries
  if (endpoint.includes('/stories')) {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tonopiramba_stories');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return MOCK_STORIES;
  }
  if (endpoint.includes('/who-is-here') || endpoint.includes('/check-ins/here')) {
    return { totalActivePatrons: 87, patrons: MOCK_PATRONS };
  }

  if (endpoint.includes('/check-ins/active')) {
    return {
      isActive: true,
      restaurantName: 'Restaurante Pirambeira',
      restaurantSlug: 'pirambeira',
      startedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 200 * 60 * 1000).toISOString(),
    };
  }
  if (endpoint.includes('/posts/bar') || endpoint.includes('/posts/official')) {
    return MOCK_BAR_POSTS;
  }
  if (endpoint.includes('/posts/feed')) {
    return MOCK_POSTS;
  }
  if (endpoint.includes('/flirt/notes')) {
    return MOCK_FLIRT_NOTES;
  }
  if (endpoint.includes('/meetups')) {
    return MOCK_MEETUPS;
  }
  if (endpoint.includes('/events')) {
    return MOCK_EVENTS;
  }
  if (endpoint.includes('/promotions')) {
    return MOCK_PROMOTIONS;
  }
  if (endpoint.includes('/chat/conversations') && endpoint.includes('/messages')) {
    return MOCK_MESSAGES;
  }
  if (endpoint.includes('/chat/conversations')) {
    return MOCK_CONVERSATIONS;
  }
  if (endpoint.includes('/restaurants/slug/pirambeira') || endpoint.includes('/restaurants/pirambeira')) {
    return MOCK_RESTAURANT;
  }
  if (endpoint.includes('/users/me')) {
    return MOCK_CURRENT_USER;
  }
  if (endpoint.includes('/users/profile')) {
    return { ...MOCK_CURRENT_USER.profile, postsCount: 12, followersCount: 45, followingCount: 38 };
  }
  if (endpoint.includes('/admin/dashboard')) {
    return {
      activeCount: 87,
      averageStayMinutes: 74,
      couponsClaimedToday: 38,
      couponsUsedToday: 29,
      peakHour: '20:30',
      totalRevenueEstimated: 'R$ 8.420,00',
    };
  }
  if (endpoint.includes('/check-username')) {
    const rawUsername = endpoint.split('/check-username/')[1] || '';
    const clean = decodeURIComponent(rawUsername).toLowerCase().replace('@', '').trim();
    const takenUsernames = [
      'ramoncerqueira',
      'laribahia',
      'lucas_ferreira',
      'camilapeixoto',
      'tiagomenezes',
      'biacastro',
      'diego_alcantara',
      'pirambeira',
      'chef_edumoraes',
      'admin',
    ];
    const isTaken = takenUsernames.includes(clean);
    return {
      available: !isTaken,
      cleanUsername: clean,
      message: isTaken
        ? 'Este @ de Pirambeiro já está em uso por outro frequentador!'
        : 'Nome de Pirambeiro disponível!',
    };
  }
  if (endpoint.includes('/moderation/reports')) {
    return [];
  }

  return [];
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tonopiramba_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      // If server responded with error, check if fallback is appropriate
      const errorMsg = data?.message
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message
        : 'Ocorreu um erro na requisição.';
      throw new ApiError(res.status, errorMsg);
    }

    return data as T;
  } catch (err: any) {
    // Graceful fallback to rich mock data when backend is offline or unreachable
    if (err?.name !== 'ApiError' || err?.status >= 500 || err?.status === 404) {
      console.warn(`[Tô no Piramba] Backend offline ou rota 404 em ${endpoint}. Ativando mock interativo.`);
      return getMockFallback(endpoint, options) as T;
    }

    throw err;
  }
}
