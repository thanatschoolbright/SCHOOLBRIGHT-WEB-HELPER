"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/v2/signin");
  }, [router]);

  return <div className="bg-gray-100 text-white"></div>;
}
