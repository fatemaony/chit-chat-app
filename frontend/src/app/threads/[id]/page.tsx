import { ThreadDetail } from "@/components/threads/thread-detail";

interface ThreadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ThreadDetailPage({ params }: ThreadDetailPageProps) {
  const { id } = await params;

  return (
    <div className="flex w-full flex-1 flex-col">
      <ThreadDetail id={Number(id)} />
    </div>
  );
}
