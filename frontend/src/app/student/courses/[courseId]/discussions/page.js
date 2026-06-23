"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { discussionAPI, moduleAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PageContainer from "@/components/layout/PageContainer";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonLine } from "@/components/ui/Skeleton";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Search,
  Clock,
  User,
  Lock,
  CheckCircle,
  X,
} from "lucide-react";

export default function CourseDiscussionsPage({ params }) {
  const { courseId } = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [filterModule, setFilterModule] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [moduleId, setModuleId] = useState("");

  // Fetch modules for filter/form
  const { data: modulesData } = useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: () => moduleAPI.getByCourseId(courseId),
    enabled: !!courseId,
  });

  const modules = modulesData?.data || [];

  // Fetch discussions
  const { data: discussionsData, isLoading } = useQuery({
    queryKey: [
      "course-discussions",
      courseId,
      filterModule,
      filterStatus,
      searchQuery,
    ],
    queryFn: () =>
      discussionAPI.getCourseDiscussions(courseId, {
        module_id: filterModule || undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        search: searchQuery || undefined,
      }),
    enabled: !!courseId,
  });

  const discussions = discussionsData?.discussions || [];

  // Create discussion mutation
  const createMutation = useMutation({
    mutationFn: (data) => discussionAPI.create(data),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ["course-discussions", courseId],
      });
      toast.success("Discussion created!");
      setShowForm(false);
      setTitle("");
      setBody("");
      setModuleId("");
    },
    onError: (err) => toast.error(err.message || "Failed to create discussion"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    createMutation.mutate({
      course_id: courseId,
      module_id: moduleId || null,
      title: title.trim(),
      body: body.trim(),
    });
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <PageContainer
      title="Course Discussions"
      subtitle="Ask questions, share knowledge, and find answers"
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <X size={16} /> Cancel
              </>
            ) : (
              <>
                <Plus size={16} /> Ask a Question
              </>
            )}
          </button>
          <Link
            href={
              user?.role === "admin"
                ? `/admin/courses/${courseId}`
                : `/student/courses/${courseId}`
            }
            className="btn btn-outline"
          >
            <ArrowLeft size={16} /> Back to Course
          </Link>
        </div>
      }
    >
      {/* Create discussion form */}
      {showForm && (
        <form className="discussion-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Question Title</label>
            <input
              id="discussion-title"
              className="form-input"
              type="text"
              placeholder="What is your question about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Module
              <span className="form-label-optional">(optional)</span>
            </label>
            <select
              id="discussion-module"
              className="form-select"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
            >
              <option value="">General — not specific to a module</option>
              {modules.map((mod) => (
                <option key={mod.id} value={mod.id}>
                  Module {mod.position}: {mod.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              id="discussion-body"
              className="form-textarea"
              placeholder="Describe your question in detail..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Posting..." : "Post Question"}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="discussion-filters">
        <div className="discussion-search" style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-muted)",
            }}
          />
          <input
            id="discussion-search"
            className="form-input"
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 32, maxWidth: "100%" }}
          />
        </div>

        <select
          id="discussion-filter-module"
          className="form-select"
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
        >
          <option value="">All Modules</option>
          {modules.map((mod) => (
            <option key={mod.id} value={mod.id}>
              {mod.title}
            </option>
          ))}
        </select>

        <select
          id="discussion-filter-status"
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Discussion list */}
      {isLoading ? (
        <div className="card">
          <div className="card-body">
            <SkeletonLine width="60%" />
            <SkeletonLine width="40%" />
            <SkeletonLine width="80%" />
          </div>
        </div>
      ) : discussions.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No discussions yet"
          description={
            searchQuery || filterModule || filterStatus !== "all"
              ? "No discussions match your filters."
              : 'Be the first to ask a question! Click "Ask a Question" above.'
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {discussions.map((d) => (
            <Link
              key={d.id}
              href={
                user?.role === "admin"
                  ? `/admin/courses/${courseId}/discussions/${d.id}`
                  : `/student/courses/${courseId}/discussions/${d.id}`
              }
              className="discussion-card"
            >
              <div className="discussion-card-header">
                <div className="discussion-card-title">{d.title}</div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <span className={`discussion-badge ${d.status}`}>
                    {d.status === "resolved" && <CheckCircle size={12} />}
                    {d.status}
                  </span>
                  {d.is_locked && (
                    <span className="discussion-badge locked">
                      <Lock size={12} /> locked
                    </span>
                  )}
                </div>
              </div>

              <div className="discussion-card-meta">
                <span>
                  <User size={12} />
                  {d.profiles?.name || "Unknown"}
                </span>
                <span>
                  <Clock size={12} />
                  {timeAgo(d.created_at)}
                </span>
                {d.course_modules?.title && (
                  <span style={{ color: "var(--color-accent-dark)" }}>
                    {d.course_modules.title}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
