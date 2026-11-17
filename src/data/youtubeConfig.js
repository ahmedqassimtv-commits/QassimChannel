export const YOUTUBE_CONFIG = {
  channelHandle: '@AhmedQassimTV',
  channelUrl: 'https://www.youtube.com/@AhmedQassimTV',
  channelId: '',
  workerFeedUrl: '',
};

export function getYouTubeFeedUrls(channelId) {
  if (!channelId || !channelId.startsWith('UC') || channelId.length < 24) {
    return null;
  }
  const suffix = channelId.slice(2);
  return {
    all: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    longVideos: `https://www.youtube.com/feeds/videos.xml?playlist_id=UULF${suffix}`,
    shorts: `https://www.youtube.com/feeds/videos.xml?playlist_id=UUSH${suffix}`,
  };
}