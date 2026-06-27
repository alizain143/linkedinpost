export function buildPostMediaStorageKey(
  workspaceId: string,
  postPackageId: string,
  postMediaId: string,
  extension = 'png',
): string {
  return `workspaces/${workspaceId}/posts/${postPackageId}/media/${postMediaId}.${extension}`;
}
