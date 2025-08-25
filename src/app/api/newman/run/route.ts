// src/app/api/run-postman/route.ts
import { NextResponse } from "next/server";
// import path from "path";
// import newman from "newman"; // ✅ now works because it's installed

export const dynamic = "force-dynamic";

export async function POST() {
  // const collectionPath = path.resolve("src/data/postman/main-test.json");
  // const collectionPath2 = path.resolve("src/data/postman/test_19052025.json");
  // const environmentPath = path.resolve(
  //   "src/data/postman/production-school-bright-v2.json"
  // );

  // try {
  //   const result = await new Promise((resolve, reject) => {
  //     newman.run(
  //       {
  //         collection: collectionPath2,
  //         environment: environmentPath,
  //         reporters: ["json"],
  //       },
  //       (err, summary) => {
  //         if (err) return reject(err);
  //         resolve(summary);
  //       }
  //     );
  //   });

  //   return NextResponse.json(result); // 👈 ส่ง full result json กลับ
  // } catch (error: any) {
  //   console.error("❌ Newman run failed:", error);
  //   return NextResponse.json(
  //     { error: error.message ?? "Unknown error" },
  //     { status: 500 }
  //   );
  // }
  return NextResponse.json({});
}
