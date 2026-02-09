import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/main");
  } else {
    redirect("/auth/v2/signin");
  }

  return null;
}
