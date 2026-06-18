"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userAPI } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import DataTable from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Trash2, Eye } from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: userAPI.getAll,
  });

  const lockMutation = useMutation({
    mutationFn: (userId) => userAPI.lockAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User account locked");
    },
    onError: (err) => toast.error(err.message || "Failed to lock account"),
  });

  const unlockMutation = useMutation({
    mutationFn: (userId) => userAPI.unlockAccount(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User account unlocked");
    },
    onError: (err) => toast.error(err.message || "Failed to unlock account"),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => userAPI.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted");
      setDeleteModal(null);
    },
    onError: (err) => toast.error(err.message || "Failed to delete user"),
  });

  const users = data?.data || [];

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    {
      header: "Role",
      accessor: "role",
      cell: (row) => <Badge variant={row.role}>{row.role}</Badge>,
    },
    {
      header: "Status",
      accessor: "is_locked",
      cell: (row) => (
        <Badge variant={row.is_locked ? "locked" : "active"}>
          {row.is_locked ? "Locked" : "Active"}
        </Badge>
      ),
    },
    {
      header: "Joined",
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
      width: "140px",
      cell: (row) => (
        <div className="data-table-actions">
          <button
            className="btn-icon"
            title="View profile"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/users/${row.id}`);
            }}
          >
            <Eye size={16} />
          </button>
          {row.is_locked ? (
            <button
              className="btn-icon"
              title="Unlock account"
              onClick={(e) => {
                e.stopPropagation();
                unlockMutation.mutate(row.id);
              }}
            >
              <Unlock size={16} />
            </button>
          ) : (
            <button
              className="btn-icon"
              title="Lock account"
              onClick={(e) => {
                e.stopPropagation();
                lockMutation.mutate(row.id);
              }}
            >
              <Lock size={16} />
            </button>
          )}
          <button
            className="btn-icon"
            title="Delete user"
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
      title="Users"
      subtitle="Manage all registered users"
    >
      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        searchPlaceholder="Search by name or email..."
        emptyTitle="No users found"
        emptyDescription="Users will appear here once they register."
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete User"
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
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete <strong>{deleteModal?.name}</strong> (
          {deleteModal?.email})? This action cannot be undone.
        </p>
      </Modal>
    </PageContainer>
  );
}
