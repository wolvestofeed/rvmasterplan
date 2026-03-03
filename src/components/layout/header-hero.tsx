import Image from "next/image";

interface HeaderHeroProps {
    title: string;
    description: string;
    imageUrl?: string;
    imageClass?: string;
}

export function HeaderHero({ title, description, imageUrl = "/images/logos/RV-MasterPlan_logo-header.jpg", imageClass = "object-cover object-center" }: HeaderHeroProps) {
    return (
        <div className="relative w-full h-80 rounded-xl overflow-hidden mb-8 mt-6 bg-[#f8fbf5]">
            <div className="absolute inset-0">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className={imageClass}
                    priority
                />
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/10"></div>

            {/* Title Box */}
            <div className="absolute left-8 bottom-6 max-w-lg bg-black/40 backdrop-blur-md p-6 rounded-lg border border-white/10">
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{title}</h1>
                <p className="text-white/90 text-sm md:text-base leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );
}
