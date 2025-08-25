// src/app/api/postman/run/route.ts
import { NextResponse } from "next/server";
// import newman from "newman";

export const runtime = "nodejs";

export async function POST() {
  // return new Promise<NextResponse>((resolve) => {
  //   newman.run(
  //     {
  //       collection: "41748450-1eb5e606-a55d-4cf9-a867-733117e91551",
  //       environment: "41748745-ad6ffcec-bdf7-4d7e-872a-9afb149c12ad",
  //       reporters: ["json"],
  //     },
  //     (err, summary) => {
  //       if (err) {
  //         return resolve(
  //           NextResponse.json({ error: err.message }, { status: 500 })
  //         );
  //       }
  //       // summary.run.executions is your array of results
  //       resolve(NextResponse.json({ report: summary.run }));
  //     }
  //   );
  // });
  return NextResponse.json({ status: "Newman run is disabled in this example." });
}
