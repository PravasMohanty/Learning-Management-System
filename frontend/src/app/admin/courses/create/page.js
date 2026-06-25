"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { courseAPI } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageContainer from "@/components/layout/PageContainer";
import { Input, Textarea, Select } from "@/components/ui/Input";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Upload, X, Image } from "lucide-react";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().min(0, "Price cannot be negative").optional(),
  level: z.string().optional(),
  category: z.string().optional(),
});

export default function CreateCoursePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      level: "beginner",
      category: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => courseAPI.create(data, thumbnailFile),
    onSuccess: (response) => {
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Course created successfully");
      router.push("/admin/courses");
    },
    onError: (err) => toast.error(err.message || "Failed to create course"),
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      category: data.category || undefined,
    };
    mutation.mutate(payload);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed");
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <PageContainer
      title="Create Course"
      subtitle="Add a new course to the platform"
      actions={
        <Link href="/admin/courses" className="btn btn-outline">
          <ArrowLeft size={16} /> Back to Courses
        </Link>
      }
    >
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label="Course Title"
              placeholder="e.g. Introduction to Computer Science"
              error={errors.title?.message}
              {...register("title")}
            />

            <Textarea
              label="Description"
              placeholder="Describe the course content and objectives..."
              error={errors.description?.message}
              {...register("description")}
            />

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

              <Input
                label="Category"
                placeholder="e.g. Computer Science"
                optional
                error={errors.category?.message}
                {...register("category")}
              />
            </div>

            <div className="form-row">
              <Input
                label="Price"
                type="number"
                placeholder="0"
                optional
                hint="Set to 0 for free courses"
                error={errors.price?.message}
                {...register("price")}
              />

              {/* Thumbnail File Upload */}
              <div className="form-group">
                <label className="form-label">
                  Thumbnail Image
                  <span className="form-label-optional">(optional, JPG/PNG, max 5MB)</span>
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
              <button
                type="submit"
                className="btn btn-primary"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Creating..." : "Create Course"}
              </button>
              <Link href="/admin/courses" className="btn btn-outline">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
