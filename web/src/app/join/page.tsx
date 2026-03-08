import { Suspense } from "react";
import JoinPageClient from "./JoinPageClient";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <JoinPageClient />
    </Suspense>
  );
}
