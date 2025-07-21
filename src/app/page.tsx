// pages/index.tsx
"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";

export default function Home() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/auth/signin");
    }, [router]);


    return (
        <div className="bg-gray-100 text-white">

        </div>
    );
}
