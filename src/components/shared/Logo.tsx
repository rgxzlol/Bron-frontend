import { siteConfig } from "@/config/site"
import Link from "next/link"

interface LogoProps {
    className?: string;
}

export const Logo = ({ className = 'text-[70px]' }: LogoProps) => {
    return (
        <Link href="/" className={`font-semibold ${className}`.trim()}>
            {siteConfig.name}
        </Link>
    )
}