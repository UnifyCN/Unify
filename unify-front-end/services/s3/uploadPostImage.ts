import { uploadProfilePicture } from './uploadProfilePicture';

export const uploadPostImage = async (
  asset: { uri: string },
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<{ success: boolean; key?: string; error?: string }> => {
  const response = await fetch(asset.uri);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  return uploadProfilePicture(buffer, contentType);
};
