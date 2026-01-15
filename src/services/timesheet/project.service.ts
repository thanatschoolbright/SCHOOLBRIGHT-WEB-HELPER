import { Service as SubProjectBackendService } from "@/services/backend/timesheet/sub-project/sub-project.service";

export const ProjectService = {
  /**
   * ค้นหาโครงการย่อย (Sub Project) ตามชื่อ
   * รูปแบบการแสดงผล: ชื่อโครงการย่อย (ชื่อโครงการหลัก) (รหัส ID โครงการย่อย-รหัส ID โครงการหลัก)
   * @param query คำค้นหา
   */
  searchSubProject: async (query: string) => {
    const results = await SubProjectBackendService.search(query);

    return results.map((item) => {
      const mainProjectName = item.project?.name || "";
      const subProjectName = item.name;
      const mainProjectId = item.projectId;
      const subProjectId = item.id;

      // Display format: ชื่อโครงการย่อย (ชื่อโครงการหลัก) (รหัส ID โครงการย่อย-รหัส ID โครงการหลัก)
      const displayLabel = `${subProjectName} (${mainProjectName}) (${subProjectId}-${mainProjectId})`;

      return {
        id: subProjectId,
        name: subProjectName,
        main_project_id: mainProjectId,
        main_project_name: mainProjectName,
        display_label: displayLabel,
        full_data: item,
      };
    });
  },
};
