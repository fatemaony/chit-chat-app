import { Suspense } from "react";
import { ThreadDetail } from "@/components/threads/thread-detail";
import { CircularLoader } from "@/components/ui/circular-loader";

interface ThreadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ThreadDetailPage({ params }: ThreadDetailPageProps) {
  const { id } = await params;

  return (
    <div className="flex w-full flex-1 flex-col">
      <Suspense
        fallback={
          <CircularLoader
            label="Loading Thread..."
            className="rounded-lg border border-border bg-card py-10"
          />
        }
      >
        <ThreadDetail id={Number(id)} />
      </Suspense>
    </div>
  );
}
