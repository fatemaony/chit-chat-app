import { Suspense } from "react";
import ThreadsHomePage from "@/components/threads/threads-home";
import { CircularLoader } from "@/components/ui/circular-loader";

export default function ThreadsPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <Suspense
        fallback={
          <CircularLoader
            label="Loading Threads..."
            className="py-10"
          />
        }
      >
        <ThreadsHomePage />
      </Suspense>
    </div>
  );
}
