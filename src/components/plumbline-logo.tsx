import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/plumbline-logo.png";

type PlumblineLogoProps = { href?: string; className?: string };

export function PlumblineLogo({ href = "/", className = "h-8 w-auto" }: PlumblineLogoProps) {
  return (
    <Link href={href} className="inline-flex shrink-0 self-start">
      <Image src={logo} alt="Plumbline" className={className} loading="eager" />
    </Link>
  );
}
