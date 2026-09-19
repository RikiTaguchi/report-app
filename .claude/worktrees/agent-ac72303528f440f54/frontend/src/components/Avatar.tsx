import { resolveFileUrl } from "@/lib/api";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  photoClassName: string;
  textClassName?: string;
}

export function Avatar({ src, name, photoClassName, textClassName }: AvatarProps) {
  if (src) {
    return <img src={resolveFileUrl(src)} alt="" className={photoClassName} />;
  }
  const initial = name ? name.slice(0, 1) : "?";
  return textClassName ? <div className={textClassName}>{initial}</div> : <>{initial}</>;
}
