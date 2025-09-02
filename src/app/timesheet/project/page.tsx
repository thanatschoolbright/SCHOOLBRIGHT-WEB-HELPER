"use client";
import React, { useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { FiPlus, FiCheckCircle } from "react-icons/fi";
import RoundedButton from "@components/button/rounded-button-component";
import InputComponent from "@components/input-field/input-component";
import TableComponent from "@/components/table/base-table-component";

interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}

interface ProjectForm {
  name: string;
  description: string;
}

export default function Page() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: "School Bright",
      description: "ระบบหลักของโรงเรียน",
      createdAt: "2025-09-02 13:30:00",
    },
    {
      id: 2,
      name: "Bus Feature",
      description: "โมดูลจัดการรถบัส",
      createdAt: "2025-09-02 14:00:00",
    },
    {
      id: 3,
      name: "Accounting",
      description: "ระบบบัญชีภายใน",
      createdAt: "2025-09-02 14:30:00",
    },
  ]);
  const [form, setForm] = useState<ProjectForm>({
    name: "",
    description: "",
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const newProject = {
      id: projects.length + 1,
      name: form.name,
      description: form.description,
      createdAt: new Date().toLocaleString(),
    };
    setProjects([...projects, newProject]);
    setForm({ name: "", description: "" });
  };

  const headers = ["ID", "ชื่อโปรเจค", "คำอธิบาย", "สร้างเมื่อ"];
  const rows = projects.map((project) => [
    project.id,
    project.name,
    project.description,
    project.createdAt,
  ]);

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        {/* Input Field */}
        <ContentCard title="เพิ่มโปรเจคใหม่" className="xl:col-span-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputComponent
              label="ชื่อโปรเจค"
              id="name"
              name="name"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, name: e.target.value })
              }
              type="text"
              placeholder="กรอกชื่อโปรเจค"
            />
            <InputComponent
              label="คำอธิบายโปรเจค"
              id="description"
              name="description"
              value={form.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm({ ...form, description: e.target.value })
              }
              type="text"
              placeholder="กรอกคำอธิบายโปรเจค"
            />
          </div>
          <RoundedButton
            type="button"
            className="bg-green-500 hover:bg-green-600 text-white group transition-all duration-300 mt-5 mx-auto"
            onClick={handleSubmit}
          >
            <span className="flex items-center overflow-hidden">
              <FiPlus className="w-5 h-5 mr-2" />
              <span className="max-w-xs transition-all duration-300 whitespace-nowrap">
                เพิ่มโปรเจค
              </span>
              <span className="opacity-0 max-w-0 -translate-x-2 group-hover:opacity-100 group-hover:max-w-xs group-hover:translate-x-0 transition-all duration-300 flex-shrink-0 ms-3">
                <FiCheckCircle className="w-4 h-4" />
              </span>
            </span>
          </RoundedButton>
        </ContentCard>

        <ContentCard title="รายการโปรเจค" className="w-full">
          <TableComponent headers={headers} rows={rows} />
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
