// pages/index.tsx
"use client";

import {useEffect} from "react";
import Navbar from "@/components/navbar";
import HeroSection from "@/components/section/hero";
import AboutSection from "@/components/section/about";
import SkillsSection from "@/components/section/skill";
import WorksSection from "@/components/section/work-experience";
import ContactSection from "@/components/section/contact";
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
