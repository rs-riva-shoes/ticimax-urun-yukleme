import React from "react"
import Image from "next/image"

export function LionIcon({ className, size = 64 }: { className?: string; size?: number }) {
    return (
        <Image
            src="/arslan-logo.png"
            alt="Arslan Panel Logo"
            width={size}
            height={size}
            className={className}
            priority
        />
    )
}
