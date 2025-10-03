import { SearchableSelectComponent } from "@components/input-field/searchable-select-component";
import React, { FC, useEffect, useState } from "react";
import { useAppSelector } from "@stores/store";

type School = {
  SchoolID: number;
  SchoolName: string;
};

type Option = {
  label: string;
  value: string;
};

type Props = {
  onChange: (value: any) => void;
  defaultValue: any;
  label?: string;
};

/**
 * DropdownSchoolComponent renders a searchable select dropdown for schools.
 * It fetches the school list from the Redux store and formats it as options.
 */
const DropdownSchoolComponent: FC<Props> = ({
  onChange,
  defaultValue,
  label,
}) => {
  const [schools, setSchools] = useState<Option[]>([]);

  // Select the school list state from the Redux store
  const schoolListState = useAppSelector((state) => state.callSchoolList);

  // Effect to update the schools options when the school list state changes
  useEffect(() => {
    const schoolData: School[] | undefined =
      schoolListState?.response?.data?.data;
    if (schoolData && Array.isArray(schoolData)) {
      const formattedSchools = schoolData.map((item) => ({
        label: item.SchoolName,
        value: String(item.SchoolID),
      }));
      setSchools(formattedSchools);
    } else {
      setSchools([]);
    }
  }, [schoolListState?.response]);

  return (
    <SearchableSelectComponent
      label={label ?? "เลือกโรงเรียน"}
      id="school_id"
      name="school_id"
      multiselect={false}
      options={[
        { label: "ทุกโรงเรียน", value: "" },
        ...schools.map((school) => ({
          label: `${school.label} (${school.value})`,
          value: school.value,
        })),
      ]}
      value={defaultValue}
      onChange={onChange}
      placeholder="เลือกโรงเรียน"
    />
  );
};

export default DropdownSchoolComponent;
