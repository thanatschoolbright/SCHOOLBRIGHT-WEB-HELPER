export const formatProjectCode = (projectId: number | string): string => {
  return String(projectId).padStart(4, "0");
};

export const formatSubProjectCode = (subProjectId: number | string): string => {
  return String(subProjectId).padStart(4, "0");
};

export const formatFullProjectCode = (
  projectId: number | string,
  subProjectId?: number | string | null
): string => {
  const formattedProjectId = formatProjectCode(projectId);

  if (subProjectId === null || subProjectId === undefined) {
    return formattedProjectId;
  }

  const formattedSubProjectId = formatSubProjectCode(subProjectId);
  return `${formattedProjectId}/${formattedSubProjectId}`;
};
