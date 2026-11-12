"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

export type ImageItem = { url: string; alt: string };

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Sube imágenes al bucket "product-images" con la sesión del admin (la RLS de Storage solo deja subir a admins).
 * Las imágenes quitadas se borran del almacenamiento al guardar el producto.
 */
export function ImageManager({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: ImageItem[];
  onChange: (next: ImageItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const valid = [...files].filter((f) => {
      if (!TYPES.includes(f.type)) {
        setError(`"${f.name}" no es JPG, PNG, WebP ni AVIF.`);
        return false;
      }
      if (f.size > MAX_BYTES) {
        setError(`"${f.name}" pesa más de 5 MB. Redúcela antes de subirla.`);
        return false;
      }
      return true;
    });
    if (images.length + valid.length > 12) {
      setError("Máximo 12 imágenes por producto.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setUploading(valid.length);
    const added: ImageItem[] = [];
    for (const file of valid) {
      const ext = file.type.split("/")[1].replace("jpeg", "jpg");
      const path = `${productId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (upErr) {
        setError(`No se pudo subir "${file.name}": ${upErr.message}`);
      } else {
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        added.push({ url: data.publicUrl, alt: "" });
      }
      setUploading((n) => n - 1);
    }
    onChange([...images, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(i: number, dir: -1 | 1) {
    const next = images.slice();
    const [it] = next.splice(i, 1);
    next.splice(i + dir, 0, it);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {images.length > 0 && (
        <ol className="flex flex-col gap-2">
          {images.map((img, i) => (
            <li key={img.url} className="flex items-center gap-3 rounded-md bg-surface-2 p-2">
              <Image
                src={img.url}
                alt=""
                width={72}
                height={72}
                unoptimized={img.url.endsWith(".svg")}
                className="size-18 shrink-0 rounded-sm bg-surface-3 object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <label htmlFor={`${id}-alt-${i}`} className="text-xs text-muted">
                  {i === 0 ? "Principal · " : ""}Texto alternativo (qué se ve en la foto)
                </label>
                <input
                  id={`${id}-alt-${i}`}
                  value={img.alt}
                  maxLength={200}
                  onChange={(e) => onChange(images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                  placeholder="Ej.: Monitor de frente, encendido"
                  className="h-10 w-full rounded-sm bg-surface-3 px-3 text-sm"
                />
              </div>
              <div className="flex shrink-0 gap-1">
                <IconBtn label="Subir" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ArrowUp className="size-4" />
                </IconBtn>
                <IconBtn label="Bajar" onClick={() => move(i, 1)} disabled={i === images.length - 1}>
                  <ArrowDown className="size-4" />
                </IconBtn>
                <IconBtn label="Quitar" onClick={() => onChange(images.filter((_, j) => j !== i))} danger>
                  <Trash2 className="size-4" />
                </IconBtn>
              </div>
            </li>
          ))}
        </ol>
      )}

      <label
        htmlFor={id}
        className={cn(
          "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md bg-surface-2 p-4 text-center text-[15px] transition-colors hover:bg-surface-3",
          uploading > 0 && "pointer-events-none opacity-60",
        )}
      >
        <ImagePlus aria-hidden className="size-6 text-primary" />
        <span className="font-semibold">{uploading > 0 ? `Subiendo ${uploading}…` : "Agregar imágenes"}</span>
        <span className="text-sm text-muted">JPG, PNG, WebP o AVIF · máx. 5 MB · la primera es la principal</span>
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={TYPES.join(",")}
        multiple
        className="sr-only"
        onChange={(e) => upload(e.target.files)}
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-10 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-3 disabled:opacity-30",
        danger ? "hover:text-danger" : "hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
