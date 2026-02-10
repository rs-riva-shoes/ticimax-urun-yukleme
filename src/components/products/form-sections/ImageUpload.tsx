import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export function ImageUpload({ files, setFiles }: ImageUploadProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles((prev) => [...prev, ...acceptedFiles]);
    }, [setFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".webp"],
        },
    });

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <Card className="border-dashed border-2 border-primary/20 bg-background/50">
            <CardContent className="pt-6">
                <div
                    {...getRootProps()}
                    className={cn(
                        "flex flex-col items-center justify-center h-48 rounded-xl transition-all cursor-pointer",
                        isDragActive
                            ? "bg-primary/5 scale-[0.99] border-primary"
                            : "hover:bg-primary/5"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-lg font-medium">
                        {isDragActive ? "Dosyaları buraya bırakın" : "Fotoğrafları sürükleyip bırakın"}
                    </p>
                </div>

                {/* Image Preview Grid */}
                <AnimatePresence>
                    {files.length > 0 && (
                        <div className="grid grid-cols-5 gap-3 mt-6">
                            {files.map((file, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="relative aspect-[3/4] group rounded-lg overflow-hidden border bg-background"
                                >
                                    <Image
                                        src={URL.createObjectURL(file)}
                                        alt="preview"
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(i);
                                        }}
                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
