"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from "antd";
import type { FormInstance } from "antd/es/form";
import dayjs from "dayjs";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

import { STATUS_OPTIONS } from "@constants/timesheet.constants";
import { setSubProjects } from "@stores/reducers/timesheet-slice";
import { AppDispatch, RootState } from "@stores/store";
import { SubProject } from "@/stores/type";

interface TimesheetFormModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  form: FormInstance;
  fetchSubProjects: (projectId: number) => Promise<SubProject[]>;
}

//** Component: Modal ฟอร์มสำหรับสร้าง/แก้ไข/คัดลอกข้อมูล */
const TimesheetFormModal: React.FC<TimesheetFormModalProps> = ({
  open,
  onCancel,
  onSubmit,
  form,
  fetchSubProjects,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, subProjects, formMode, actionLoading, activeRecord } =
    useSelector((state: RootState) => state.timesheet);
  const selectedProjectId = Form.useWatch("project_id", form);
  const { t } = useTranslation();

  const modalTitleMap: any = {
    create: t("timesheet_components.create_new_entry", "สร้างรายการใหม่"),
    edit: t("timesheet_components.edit_entry", "แก้ไขรายการ"),
    copy: t("timesheet_components.copy_entry", "คัดลอกรายการ"),
  };

  //** การทำงาน: เมื่อมีการเปลี่ยนแปลงโปรเจ็กต์ ให้โหลดโปรเจ็กต์ย่อยใหม่ */
  useEffect(() => {
    if (selectedProjectId) {
      fetchSubProjects(selectedProjectId).then((items) => {
        dispatch(setSubProjects(items));
      });
    } else {
      dispatch(setSubProjects([]));
    }
  }, [selectedProjectId, fetchSubProjects, dispatch]);

  //** การทำงาน: ตั้งค่าฟอร์มเมื่อโหมดหรือข้อมูลที่เลือกเปลี่ยนไป */
  useEffect(() => {
    if (open) {
      if (formMode === "edit" && activeRecord) {
        form.setFieldsValue({
          ...activeRecord,
          date: dayjs(activeRecord.date),
          work_hour: activeRecord.hours,
          sub_project_id: activeRecord.feature_id,
        });
        if (activeRecord.project_id) {
          fetchSubProjects(activeRecord.project_id).then((items) =>
            dispatch(setSubProjects(items))
          );
        }
      } else if (formMode === "copy" && activeRecord) {
        form.setFieldsValue({
          ...activeRecord,
          date: dayjs(), // Set to today
          work_hour: activeRecord.hours,
          sub_project_id: activeRecord.feature_id,
        });
        if (activeRecord.project_id) {
          fetchSubProjects(activeRecord.project_id).then((items) =>
            dispatch(setSubProjects(items))
          );
        }
      } else {
        form.resetFields();
        form.setFieldsValue({ date: dayjs() });
      }
    }
  }, [open, formMode, activeRecord, form, fetchSubProjects, dispatch]);

  return (
    <Modal
      open={open}
      title={modalTitleMap[formMode]}
      onCancel={onCancel}
      destroyOnHidden
      footer={[
        <Button key="back" onClick={onCancel} disabled={actionLoading}>
          {t("timesheet_components.cancel", "ยกเลิก")}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={actionLoading}
          onClick={onSubmit}
        >
          {t("timesheet_components.save", "บันทึก")}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="timesheet_form"
        initialValues={{ date: dayjs() }}
      >
        <Form.Item
          name="date"
          label={t("timesheet_components.date", "วันที่")}
          rules={[
            {
              required: true,
              message: t(
                "timesheet_components.please_select_date",
                "กรุณาเลือกวันที่"
              ),
            },
          ]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="project_id"
          label={t("timesheet_components.project", "โปรเจ็ค")}
          rules={[
            {
              required: true,
              message: t(
                "timesheet_components.please_select_project",
                "กรุณาเลือกโปรเจ็ค"
              ),
            },
          ]}
        >
          <Select
            showSearch
            placeholder={t(
              "timesheet_components.select_project_placeholder",
              "เลือกโปรเจ็ค"
            )}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        </Form.Item>
        <Form.Item
          name="sub_project_id"
          label={t("timesheet_components.feature_optional", "ฟีเจอร์ (ถ้ามี)")}
        >
          <Select
            showSearch
            allowClear
            placeholder={t(
              "timesheet_components.select_feature_placeholder",
              "เลือกฟีเจอร์"
            )}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={subProjects.map((s) => ({ value: s.id, label: s.name }))}
            disabled={!selectedProjectId || subProjects.length === 0}
          />
        </Form.Item>
        <Form.Item
          name="work_hour"
          label={t("timesheet_components.work_hours", "ชั่วโมงทำงาน")}
          rules={[
            {
              required: true,
              message: t(
                "timesheet_components.enter_work_hours",
                "กรุณากรอกชั่วโมงทำงาน"
              ),
            },
          ]}
        >
          <InputNumber
            min={0.5}
            max={24}
            step={0.5}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          name="status"
          label={t("timesheet_components.status", "สถานะ")}
          rules={[
            {
              required: true,
              message: t(
                "timesheet_components.please_select_status",
                "กรุณาเลือกสถานะ"
              ),
            },
          ]}
        >
          <Select
            placeholder={t(
              "timesheet_components.select_status_placeholder",
              "เลือกสถานะ"
            )}
          >
            {STATUS_OPTIONS.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                {t(`timesheet_components.status_${opt.value.toLowerCase()}`)}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="description"
          label={t("timesheet_components.description", "คำอธิบาย")}
        >
          <Input.TextArea
            rows={4}
            placeholder={t(
              "timesheet_components.description_placeholder",
              "รายละเอียดงาน"
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TimesheetFormModal;
