"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Send, Lock, CheckCircle } from "lucide-react";

interface Props {
  assessmentId: string;
  currentStatus: string;
}

export default function PublishButton({ assessmentId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // CLOSED assessments just show a badge — no action available
  if (currentStatus === "CLOSED") {
    return (
      <Badge variant="warning" className="px-3 py-1.5 text-xs">
        <CheckCircle size={12} className="mr-1" />
        Closed
      </Badge>
    );
  }

  // Only DRAFT and PUBLISHED have actionable states
  if (currentStatus !== "DRAFT" && currentStatus !== "PUBLISHED") return null;

  const isPublished = currentStatus === "PUBLISHED";

  async function handle() {
    setLoading(true);
    try {
      await fetch(`/api/lecturer/assessments/${assessmentId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isPublished ? "close" : "publish" }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant={isPublished ? "danger" : "primary"}
      loading={loading}
      onClick={handle}
    >
      {isPublished ? (
        <>
          <Lock size={14} />
          Close Assessment
        </>
      ) : (
        <>
          <Send size={14} />
          Publish Assessment
        </>
      )}
    </Button>
  );
}
