"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"
import { handleFileUpload } from "@/lib/file-upload"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface FileUploadInputProps {
  label: string
  value?: string
  onChange: (value: string) => void
  accept?: string
}

export function FileUploadInput({ label, value, onChange, accept = "image/*" }: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const dataUrl = await handleFileUpload(file)
      onChange(dataUrl)
    } catch (error) {
      console.error("Error uploading file:", error)
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
