import { ClientOnly } from "./client";

export default function Page({ params }: { params: { slug?: string[] } }) {
  return <ClientOnly />;
}
