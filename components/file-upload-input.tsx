"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface FileUploadInputProps {
  label: string
  value?: string
  onChange: (value: string) => void
  accept?: string
  folder?: string
}

export function FileUploadInput({ label, value, onChange, accept = "image/*", folder = "general" }: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const supabase = createSupabaseBrowserClient()

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const extension = (file.name.split(".").pop() || "jpg").toLowerCase()
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`
      const path = `${folder}/${id}.${extension}`

      const { error: uploadError } = await supabase.storage.from("fotos").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("fotos").getPublicUrl(path)

      onChange(publicUrl)
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        variant: "destructive",
        title: "No fue posible subir la imagen",
        description: "Verifica permisos del bucket fotos e intenta nuevamente.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange("")
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        {value && (
          <Avatar className="h-16 w-16">
            <AvatarImage src={value || "/placeholder.svg"} alt={label} />
            <AvatarFallback>IMG</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1">
          <Input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClick}
              disabled={isUploading}
              className="flex-1 bg-transparent"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Subiendo..." : value ? "Cambiar" : "Subir"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="icon" onClick={handleRemove}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
