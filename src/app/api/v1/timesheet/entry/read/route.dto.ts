export async function DTO(data?: any) {
  return {
    id: data?.id,
    project_id: data?.projectId,
    project_name: data?.project?.name,
    feature_id: data?.featureId,
    feature_name: data?.feature?.name,
    date: data?.date,
    hours: data?.hours,
    description: data?.description,
    status: data?.status,
    created_at: data?.createdAt,
    updated_at: data?.updatedAt,
    created_by: data?.createdBy,
    updated_by: data?.updatedBy,
  };
}
