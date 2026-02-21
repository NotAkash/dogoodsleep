import { getApiDocs } from "@/lib/swagger";
import React from "react";
import ReactSwagger from "./react-swagger";

export const runtime = "edge";

export default function ApiDocPage() {
  const spec = getApiDocs();
  return (
    <section>
      <ReactSwagger spec={spec} />
    </section>
  );
}
