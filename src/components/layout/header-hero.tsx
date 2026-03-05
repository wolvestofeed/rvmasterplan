import Image from "next/image";
import { ReactNode } from "react";

interface HeaderHeroProps {
    title: string;
    description: string;
    imageUrl?: string | null;
    imageClass?: string;
    children?: ReactNode;
}

export function HeaderHero({ title, description, imageUrl, imageClass = "object-cover object-center", children }: HeaderHeroProps) {
    const displayImage = imageUrl || "/images/logos/RV-MasterPlan_logo-header.jpg";
    return (
        <div className="relative w-full h-80 rounded-xl overflow-hidden mb-8 mt-6 bg-[#f8fbf5]">
            <div className="absolute inset-0">
                <Image
                    src={displayImage}
                    alt={title}
                    fill
                    className={imageClass}
                    priority
                />
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-white/10"></div>

            {/* Title Box */}
            <div className="absolute left-8 bottom-6 max-w-lg bg-white/70 p-6 rounded-lg border border-white/40 shadow-lg">
                <h1 className="text-3xl font-bold text-[#2a4f3f] mb-2 tracking-tight">{title}</h1>
                <p className="text-[#2a4f3f] text-sm md:text-base leading-relaxed font-medium">
                    {description}
                </p>
            </div>

            {/* Optional children overlay */}
            {children}
        </div>
    );
}
