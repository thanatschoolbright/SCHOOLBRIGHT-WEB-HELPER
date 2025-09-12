"use client";
import React, { useState } from "react";
import DashboardLayout from "@components/layouts/backend-layout";
import ContentCard from "@components/layouts/backend/content";
import BaseLoadingComponent from "@components/loading/loading-component-1";
import { FiPlus } from "react-icons/fi";
import TableComponent from "@components/table/base-table-component";
import { useAppSelector } from "@stores/store";

interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  by: number;
  createdBy: number;
}

export default function Page() {
  const AUTHENTICATION = useAppSelector((state) => state.callAdminLogin);

  const limit = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [total_pages, settotal_pages] = useState<number>(1);

  const [projects, setProjects] = useState<Project[]>([]);

  const headers = ["ลำดับ", "ชื่อโปรเจค", "คำอธิบาย", "จัดการ"];
  const rows = projects.map((project, index) => [
    index + 1 + (currentPage - 1) * limit,
    project.name,
    project.description,
    <div className="flex space-x-2 justify-center" key={project.id}>
      {/* Modals and related buttons removed */}
    </div>,
  ]);

  const getPaginationItems = (total: number, current: number) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l: number = 0;

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const loading = false;

  if (loading) {
    return (
      <DashboardLayout>
        <BaseLoadingComponent />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        <ContentCard title="รายการโปรเจค" className="w-full">
          <TableComponent
            headers={headers}
            rows={rows}
            alignments={["center", "left", "left", "center"]}
          />
          {/* Pagination UI */}
          <div className="mt-4 flex justify-center items-center space-x-2">
            <button
              type="button"
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous Page"
            >
              ก่อนหน้า
            </button>
            {getPaginationItems(total_pages, currentPage).map((page, idx) =>
              page === "..." ? (
                <span key={`dots-${idx}`} className="px-2 select-none">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className={`px-3 py-1 rounded ${
                    page === currentPage
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => setCurrentPage(page as number)}
                  aria-current={page === currentPage ? "page" : undefined}
                >
                  {page}
                </button>
              )
            )}
            <button
              type="button"
              className={`px-3 py-1 rounded ${
                currentPage === total_pages
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() =>
                currentPage < total_pages && setCurrentPage(currentPage + 1)
              }
              disabled={currentPage === total_pages}
              aria-label="Next Page"
            >
              ถัดไป
            </button>
          </div>
        </ContentCard>
      </div>
    </DashboardLayout>
  );
}
