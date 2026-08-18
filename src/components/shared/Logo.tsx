import { siteConfig } from "@/config/site"
import Link from "next/link"

interface LogoProps {
    className?: string;
}

export const Logo = ({ className = '' }: LogoProps) => {
    return (
        <Link href="/" className={`text-[70px] font-semibold ${className}`.trim()}>
            {siteConfig.name}
        </Link>
    )
}