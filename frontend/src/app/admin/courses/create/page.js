"use client";

import { useState } from "react";
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
import { ArrowLeft } from "lucide-react";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  thumbnail_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").optional(),
  level: z.string().optional(),
  category: z.string().optional(),
});

export default function CreateCoursePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail_url: "",
      price: 0,
      level: "beginner",
      category: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => courseAPI.create(data),
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
      thumbnail_url: data.thumbnail_url || undefined,
      category: data.category || undefined,
    };
    mutation.mutate(payload);
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

              <Input
                label="Thumbnail URL"
                placeholder="https://example.com/image.jpg"
                optional
                error={errors.thumbnail_url?.message}
                {...register("thumbnail_url")}
              />
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
