"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { discussionAPI } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import PageContainer from "@/components/layout/PageContainer";
import { SkeletonLine } from "@/components/ui/Skeleton";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Lock,
  Unlock,
  CheckCircle,
  Trash2,
  Clock,
} from "lucide-react";

export default function DiscussionThreadPage({ params }) {
  const { courseId, discussionId } = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";

  const [replyBody, setReplyBody] = useState("");

  // Fetch discussion + replies
  const { data, isLoading } = useQuery({
    queryKey: ["discussion", discussionId],
    queryFn: () => discussionAPI.getById(discussionId),
    enabled: !!discussionId,
  });

  const discussion = data?.discussion;
  const replies = data?.replies || [];

  // Add reply
  const replyMutation = useMutation({
    mutationFn: (body) => discussionAPI.addReply(discussionId, body),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ["discussion", discussionId],
      });
      setReplyBody("");
      toast.success("Reply posted!");
    },
    onError: (err) => toast.error(err.message || "Failed to post reply"),
  });

  // Delete reply
  const deleteReplyMutation = useMutation({
    mutationFn: (replyId) => discussionAPI.deleteReply(replyId),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ["discussion", discussionId],
      });
      toast.success("Reply deleted");
    },
  });

  // Delete discussion
  const deleteDiscussionMutation = useMutation({
    mutationFn: () => discussionAPI.delete(discussionId),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Discussion deleted");
      window.location.href = isAdmin
        ? `/admin/courses/${courseId}/discussions`
        : `/student/courses/${courseId}/discussions`;
    },
  });

  // Mark resolved
  const resolveMutation = useMutation({
    mutationFn: () => discussionAPI.markResolved(discussionId),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ["discussion", discussionId],
      });
      toast.success("Marked as resolved");
    },
  });

  // Toggle lock
  const lockMutation = useMutation({
    mutationFn: () => discussionAPI.toggleLock(discussionId),
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      queryClient.invalidateQueries({
        queryKey: ["discussion", discussionId],
      });
      toast.success(res.message);
    },
  });

  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyBody.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    replyMutation.mutate(replyBody.trim());
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
      year: "numeric",
    });
  };

  const AuthorBlock = ({ profile, date }) => (
    <div className="discussion-author">
      <div
        className={`discussion-author-avatar ${
          profile?.role === "admin" ? "admin" : ""
        }`}
      >
        {profile?.name?.charAt(0)?.toUpperCase() || "?"}
      </div>
      <div>
        <div className="discussion-author-name">{profile?.name || "Unknown"}</div>
        <div className="discussion-author-role">{profile?.role || "user"}</div>
      </div>
      <div className="discussion-author-date">
        <Clock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
        {timeAgo(date)}
      </div>
    </div>
  );

  const discussionsUrl = isAdmin
    ? `/admin/courses/${courseId}/discussions`
    : `/student/courses/${courseId}/discussions`;

  if (isLoading) {
    return (
      <PageContainer title="Loading...">
        <div className="card">
          <div className="card-body">
            <SkeletonLine width="60%" />
            <SkeletonLine width="90%" />
            <SkeletonLine width="40%" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!discussion) {
    return (
      <PageContainer title="Discussion Not Found">
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: 40 }}>
            <p className="text-muted">This discussion could not be found.</p>
            <Link href={discussionsUrl} className="btn btn-outline" style={{ marginTop: 16 }}>
              <ArrowLeft size={16} /> Back to Discussions
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title=""
      actions={
        <Link href={discussionsUrl} className="btn btn-outline">
          <ArrowLeft size={16} /> All Discussions
        </Link>
      }
    >
      <div className="discussion-thread">
        {/* Question */}
        <div className="discussion-thread-question">
          <AuthorBlock profile={discussion.profiles} date={discussion.created_at} />

          <div className="discussion-thread-title">{discussion.title}</div>

          {/* Badges */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span className={`discussion-badge ${discussion.status}`}>
              {discussion.status === "resolved" && (
                <CheckCircle size={12} />
              )}
              {discussion.status}
            </span>
            {discussion.is_locked && (
              <span className="discussion-badge locked">
                <Lock size={12} /> locked
              </span>
            )}
            {discussion.course_modules?.title && (
              <span
                className="discussion-badge"
                style={{
                  backgroundColor: "rgba(201, 162, 39, 0.12)",
                  color: "var(--color-accent-dark)",
                }}
              >
                {discussion.course_modules.title}
              </span>
            )}
          </div>

          <div className="discussion-thread-body">{discussion.body}</div>

          {/* Moderation actions (admin) + Delete (author or admin) */}
          {(isAdmin || discussion.author_id === user?.id) && (
            <div className="discussion-mod-actions">
              {isAdmin && discussion.status !== "resolved" && (
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => resolveMutation.mutate()}
                  disabled={resolveMutation.isPending}
                >
                  <CheckCircle size={14} />
                  {resolveMutation.isPending ? "..." : "Mark Resolved"}
                </button>
              )}

              {isAdmin && (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => lockMutation.mutate()}
                  disabled={lockMutation.isPending}
                >
                  {discussion.is_locked ? (
                    <>
                      <Unlock size={14} /> Unlock
                    </>
                  ) : (
                    <>
                      <Lock size={14} /> Lock
                    </>
                  )}
                </button>
              )}

              {(isAdmin || discussion.author_id === user?.id) && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    if (confirm("Delete this discussion and all replies?")) {
                      deleteDiscussionMutation.mutate();
                    }
                  }}
                  disabled={deleteDiscussionMutation.isPending}
                >
                  <Trash2 size={14} />
                  {deleteDiscussionMutation.isPending ? "..." : "Delete"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Replies */}
        <div className="discussion-replies-header">
          <MessageSquare
            size={16}
            style={{ verticalAlign: "middle", marginRight: 6 }}
          />
          {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        </div>

        {replies.length === 0 ? (
          <p
            className="text-muted text-sm"
            style={{ textAlign: "center", padding: "20px 0" }}
          >
            No replies yet. Be the first to respond!
          </p>
        ) : (
          <div>
            {replies.map((reply) => (
              <div key={reply.id} className="reply-card">
                <AuthorBlock profile={reply.profiles} date={reply.created_at} />
                <div className="reply-body">{reply.body}</div>

                {/* Delete own reply or admin delete */}
                {(reply.author_id === user?.id || isAdmin) && (
                  <div className="reply-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        if (confirm("Delete this reply?")) {
                          deleteReplyMutation.mutate(reply.id);
                        }
                      }}
                      disabled={deleteReplyMutation.isPending}
                      style={{ color: "var(--color-error)" }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Reply form */}
        {discussion.is_locked ? (
          <div className="discussion-locked-notice">
            <Lock
              size={16}
              style={{ verticalAlign: "middle", marginRight: 6 }}
            />
            This discussion is locked. No new replies can be added.
          </div>
        ) : (
          <form className="discussion-reply-form" onSubmit={handleSubmitReply}>
            <label className="form-label">Your Reply</label>
            <textarea
              id="reply-body"
              className="form-textarea"
              placeholder="Write your reply..."
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={3}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={replyMutation.isPending}
            >
              <Send size={14} />
              {replyMutation.isPending ? "Posting..." : "Post Reply"}
            </button>
          </form>
        )}
      </div>
    </PageContainer>
  );
}
