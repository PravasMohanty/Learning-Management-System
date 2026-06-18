"use client";

import { use } from "react";
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
import { ArrowLeft } from "lucide-react";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  thumbnail_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").optional(),
  level: z.string().optional(),
  category: z.string().optional(),
});

export default function EditCoursePage({ params }) {
  const { courseId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => courseAPI.getById(courseId),
    enabled: !!courseId,
  });

  const course = data?.data;

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
          thumbnail_url: course.thumbnail_url || "",
          price: course.price || 0,
          level: course.level || "beginner",
          category: course.category || "",
        }
      : undefined,
  });

  const mutation = useMutation({
    mutationFn: (formData) => courseAPI.update(courseId, formData),
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
      thumbnail_url: formData.thumbnail_url || undefined,
      category: formData.category || undefined,
    });
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
                <Input label="Thumbnail URL" optional error={errors.thumbnail_url?.message} {...register("thumbnail_url")} />
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
