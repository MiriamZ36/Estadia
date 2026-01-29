export const handleFileUpload = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("El archivo debe ser una imagen"))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"))
    }
    reader.readAsDataURL(file)
  })
}
