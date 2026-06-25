"use client";

import { use, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courseAPI } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageContainer from "@/components/layout/PageContainer";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { SkeletonLine } from "@/components/ui/Skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, X, Image } from "lucide-react";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price cannot be negative").optional(),
  level: z.string().optional(),
  category: z.string().optional(),
});

export default function EditCoursePage({ params }) {
  const { courseId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [previewInitialized, setPreviewInitialized] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => courseAPI.getById(courseId),
    enabled: !!courseId,
  });

  const course = data?.data;

  // Initialize preview with existing thumbnail
  if (course?.thumbnail_url && !previewInitialized) {
    setThumbnailPreview(course.thumbnail_url);
    setPreviewInitialized(true);
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
    values: course
      ? {
          title: course.title || "",
          description: course.description || "",
          price: course.price || 0,
          level: course.level || "beginner",
          category: course.category || "",
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (formData) => courseAPI.update(courseId, formData, thumbnailFile),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      toast.success("Course updated successfully");
      router.push(`/admin/courses/${courseId}`);
    },
    onError: (err) => toast.error(err.message || "Failed to update course"),
  });

  const onSubmit = (formData) => {
    mutation.mutate({
      ...formData,
      category: formData.category || undefined,
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    // If the preview was a blob URL (new file), revoke it
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <PageContainer
      title="Edit Course"
      subtitle={isLoading ? "Loading..." : course?.title || ""}
      actions={
        <Link href={`/admin/courses/${courseId}`} className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Course
        </Link>
      }
    >
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div>
              <SkeletonLine width="60%" />
              <SkeletonLine width="80%" />
              <SkeletonLine width="40%" />
              <SkeletonLine width="50%" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Input label="Course Title" error={errors.title?.message} {...register("title")} />
              <Textarea label="Description" error={errors.description?.message} {...register("description")} />
              <div className="form-row">
                <Select
                  label="Level"
                  options={[
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
                  ]}
                  error={errors.level?.message}
                  {...register("level")}
                />
                <Input label="Category" optional error={errors.category?.message} {...register("category")} />
              </div>
              <div className="form-row">
                <Input label="Price" type="number" optional error={errors.price?.message} {...register("price")} />

                {/* Thumbnail File Upload */}
                <div className="form-group">
                  <label className="form-label">
                    Thumbnail Image
                    <span className="form-label-optional">(JPG/PNG, max 5MB)</span>
                  </label>

                  {thumbnailPreview ? (
                    <div
                      style={{
                        position: "relative",
                        display: "inline-block",
                        borderRadius: "var(--radius-md)",
                        overflow: "hidden",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        style={{
                          width: 200,
                          height: 120,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <button
                        type="button"
                        onClick={removeThumbnail}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          backgroundColor: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={14} />
                      </button>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs"
                        style={{
                          textAlign: "center",
                          padding: "4px 0",
                          cursor: "pointer",
                          color: "var(--color-primary)",
                          backgroundColor: "var(--color-bg)",
                        }}
                      >
                        Change image
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: "2px dashed var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        padding: "20px 16px",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all var(--transition-fast)",
                        backgroundColor: "var(--color-bg)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--color-primary)";
                        e.currentTarget.style.backgroundColor = "var(--color-bg-white)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--color-border)";
                        e.currentTarget.style.backgroundColor = "var(--color-bg)";
                      }}
                    >
                      <Image
                        size={24}
                        style={{
                          color: "var(--color-muted)",
                          marginBottom: 4,
                        }}
                      />
                      <div className="text-sm text-muted">
                        Click to upload thumbnail
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </button>
                <Link href={`/admin/courses/${courseId}`} className="btn btn-outline">Cancel</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
