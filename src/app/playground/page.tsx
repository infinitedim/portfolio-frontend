import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { PlaygroundClient } from "@/components/organisms/playground/playground-client";

export default function PlaygroundPage() {
  return (
    <StandardPageLayout>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <PlaygroundClient />
      </div>
    </StandardPageLayout>
  );
}
