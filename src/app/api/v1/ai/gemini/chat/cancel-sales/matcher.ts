import {callApiService as axios} from "@services/axios-instance/sb-helper.axios";

const normalize = (value?: string) =>
  (value || "")
    .toLowerCase()
    .replace(/โรงเรียน/g, "")
    .replace(/\s+/g, "")
    .trim();

export interface SchoolMatch {
  schoolId?: string;
  schoolName?: string;
  schoolNameEN?: string;
}

export interface UserMatch {
  userId?: string;
  name?: string;
  lastName?: string;
  identifier?: string;
}

export const matchSchool = async (
  origin: string,
  searchTerm?: string
): Promise<SchoolMatch | null> => {
  if (!searchTerm) return null;

  const response = await axios.get(`${origin}/api/v1/school`);
  const schools: Array<{
    SchoolID: number | string;
    SchoolName: string;
    SchoolNameEN: string;
  }> = response.data?.data ?? [];

  const trimmedSearchTerm = String(searchTerm).trim();
  const normalizedTerm = normalize(searchTerm);
  if (!normalizedTerm) return null;

  if (/^\d+$/.test(trimmedSearchTerm)) {
    const numericMatch = schools.find(
      (school) => String(school.SchoolID) === trimmedSearchTerm
    );
    if (numericMatch) {
      return {
        schoolId: String(numericMatch.SchoolID),
        schoolName: numericMatch.SchoolName.trim(),
        schoolNameEN: (numericMatch.SchoolNameEN || "").trim(),
      };
    }
  }

  const candidates = schools
    .map((school) => {
      const normalizedName = normalize(school.SchoolName);
      const normalizedNameEN = normalize(school.SchoolNameEN);

      let score = 0;
      if (
        normalizedTerm === normalizedName ||
        (normalizedNameEN && normalizedTerm === normalizedNameEN)
      ) {
        score = 3;
      } else if (
        (normalizedName && normalizedTerm.includes(normalizedName)) ||
        (normalizedNameEN && normalizedTerm.includes(normalizedNameEN))
      ) {
        score = 2;
      } else if (
        (normalizedName && normalizedName.includes(normalizedTerm)) ||
        (normalizedNameEN && normalizedNameEN.includes(normalizedTerm))
      ) {
        score = 1;
      }

      return { school, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) return null;

  const matched = candidates[0].school;
  return {
    schoolId: String(matched.SchoolID),
    schoolName: matched.SchoolName.trim(),
    schoolNameEN: (matched.SchoolNameEN || "").trim(),
  };
};

export const matchUserByName = async (
  origin: string,
  schoolId: string,
  firstName?: string,
  lastName?: string,
  identifierHint?: string
): Promise<UserMatch | null> => {
  if (!schoolId) return null;

  const response = await axios.get(
    `${origin}/api/v1/school/get-user?school_id=${schoolId}`
  );
  const users: Array<{
    UserID: number | string;
    Name: string;
    LastName: string;
    BarCode: string;
    username: string;
  }> = response.data?.data ?? [];

  const normalizedFirst = normalize(firstName);
  const normalizedLast = normalize(lastName);
  const normalizedIdentifier = normalize(identifierHint);

  const candidates = users
    .map((user) => {
      const userFirst = normalize(user.Name);
      const userLast = normalize(user.LastName);
      const barcode = normalize(user.BarCode);
      const username = normalize(user.username);

      let score = 0;
      if (normalizedFirst && userFirst === normalizedFirst) score += 2;
      if (normalizedLast && userLast === normalizedLast) score += 2;
      if (
        normalizedFirst &&
        normalizedLast &&
        `${userFirst}${userLast}`.includes(normalizedFirst + normalizedLast)
      ) {
        score += 1;
      }
      if (normalizedIdentifier && (barcode === normalizedIdentifier || username === normalizedIdentifier)) {
        score += 3;
      }

      return { user, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 1);

  if (!candidates.length) return null;

  const topUser = candidates[0].user;
  return {
    userId: String(topUser.UserID),
    name: topUser.Name,
    lastName: topUser.LastName,
    identifier: topUser.username || topUser.BarCode,
  };
};
