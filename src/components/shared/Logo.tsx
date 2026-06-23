import { siteConfig } from "@/config/site"
import Link from "next/link"

export const Logo = () => {
    return (
        <Link href="/" className='self-start text-[60px] font-semibold'>
            {siteConfig.name}
        </Link>
    )
}