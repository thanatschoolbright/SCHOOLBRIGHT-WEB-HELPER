import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  incomingRequest: NextRequest,
): Promise<NextResponse> {
  const old_url = "https://sbapi.schoolbright.co/";

  axios.post(old_url + "api/v1/school", incomingRequest).then((response) => {
    console.log(response.data);
  });
}
