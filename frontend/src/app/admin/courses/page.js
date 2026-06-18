"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Eye, Pencil, Trash2, Globe } from "lucide-react";

export default function AdminCoursesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: courseAPI.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (courseId) => courseAPI.delete(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Course deleted");
      setDeleteModal(null);
    },
    onError: (err) => toast.error(err.message || "Failed to delete course"),
  });

  const publishMutation = useMutation({
    mutationFn: (courseId) => courseAPI.publish(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Course published");
    },
    onError: (err) => toast.error(err.message || "Failed to publish course"),
  });

  const courses = data?.data || [];

  const columns = [
    { header: "Title", accessor: "title" },
    {
      header: "Category",
      accessor: "category",
      cell: (row) => row.category || "—",
    },
    {
      header: "Level",
      accessor: "level",
      cell: (row) => <Badge variant={row.level}>{row.level || "—"}</Badge>,
    },
    {
      header: "Price",
      accessor: "price",
      cell: (row) => (row.price > 0 ? `₹${row.price}` : "Free"),
    },
    {
      header: "Status",
      accessor: "published",
      cell: (row) => (
        <Badge variant={row.published ? "published" : "draft"}>
          {row.published ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      header: "Created",
      accessor: "created_at",
      cell: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
    },
    {
      header: "Actions",
      accessor: null,
      sortable: false,
      width: "160px",
      cell: (row) => (
        <div className="data-table-actions">
          <button
            className="btn-icon"
            title="View course"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/courses/${row.id}`);
            }}
          >
            <Eye size={16} />
          </button>
          <button
            className="btn-icon"
            title="Edit course"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/courses/${row.id}/edit`);
            }}
          >
            <Pencil size={16} />
          </button>
          {!row.published && (
            <button
              className="btn-icon"
              title="Publish course"
              style={{ color: "var(--color-success)" }}
              onClick={(e) => {
                e.stopPropagation();
                publishMutation.mutate(row.id);
              }}
            >
              <Globe size={16} />
            </button>
          )}
          <button
            className="btn-icon"
            title="Delete course"
            style={{ color: "var(--color-error)" }}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal(row);
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Courses"
      subtitle="Manage all courses"
      actions={
        <Link href="/admin/courses/create" className="btn btn-primary">
          <Plus size={16} /> Create Course
        </Link>
      }
    >
      <DataTable
        columns={columns}
        data={courses}
        loading={isLoading}
        searchPlaceholder="Search courses..."
        emptyTitle="No courses yet"
        emptyDescription="Create your first course to get started."
      />

      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Course"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteModal(null)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => deleteMutation.mutate(deleteModal.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Course"}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>{deleteModal?.title}</strong>? This will also
          remove all modules, assignments, and related data. This action cannot be undone.
        </p>
      </Modal>
    </PageContainer>
  );
}
