export interface PostMediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface PostLocation {
  venueId: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PostVisibility {
  barFeed: boolean;
  flirtWall: boolean;
}

export interface PostModel {
  id?: string | null;
  authorId: string;
  venueId: string;
  type: 'photo' | 'video' | 'text';
  media: PostMediaItem[];
  caption: string;
  tags: string[];
  taggedUsers: string[];
  location: PostLocation;
  checkinId?: string | null;
  visibility: PostVisibility;
  createdAt?: string | null;
}

export const INITIAL_POST_MODEL: PostModel = {
  authorId: 'current-user',
  venueId: 'pirambeira',
  type: 'photo',
  media: [],
  caption: '',
  tags: [],
  taggedUsers: [],
  location: {
    venueId: 'pirambeira',
    name: 'Pirambeira',
  },
  visibility: {
    barFeed: true,
    flirtWall: false,
  },
};
