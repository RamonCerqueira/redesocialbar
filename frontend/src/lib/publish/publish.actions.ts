import { PostModel } from './post.schema';
import { apiRequest, uploadImage } from '../api';

export interface PublishActionHandlers {
  onCamera: () => Promise<void> | void;
  onGallery: () => void;
  onTagFriends: () => void;
  onQuickTag: (tagId: string) => void;
  onLocation: () => void;
  onVisibility: (optionId: 'bar-feed' | 'flirt-wall') => void;
  onPublish: (postData: PostModel) => Promise<any>;
}

export async function submitPost(postData: PostModel): Promise<any> {
  const type = postData.visibility.flirtWall && !postData.visibility.barFeed ? 'FLIRT' : 'FEED';

  return await apiRequest('/posts', {
    method: 'POST',
    body: JSON.stringify({
      restaurantSlug: postData.venueId || 'pirambeira',
      type,
      content: postData.caption,
      flirtContext: postData.location.name,
      mediaUrls: await Promise.all(postData.media.map((m) => uploadImage(m.url))),
      taggedPirambeiros: postData.taggedUsers,
      tags: postData.tags,
    }),
  });
}
