"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect old bulk-upload URL to the new students page
export default function BulkUploadRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/students");
  }, [router]);

  return null;
}
