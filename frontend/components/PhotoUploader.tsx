"use client";

import { useRef, useState, useCallback } from "react";
import { X, ImagePlus } from "lucide-react";

interface PhotoUploaderProps {
    onFilesChange: (files: File[]) => void;
    files: File[];
}

export default function PhotoUploader({ onFilesChange, files }: PhotoUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const addFiles = useCallback(
        (newFiles: FileList | File[]) => {
            const imageFiles = Array.from(newFiles).filter((f) =>
                f.type.startsWith("image/")
            );
            if (imageFiles.length === 0) return;
            onFilesChange([...files, ...imageFiles]);
        },
        [files, onFilesChange]
    );

    const removeFile = useCallback(
        (index: number) => {
            onFilesChange(files.filter((_, i) => i !== index));
        },
        [files, onFilesChange]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        },
        [addFiles]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
          relative cursor-pointer rounded-lg border-2 border-dashed p-6
          flex flex-col items-center justify-center gap-2 transition-colors
          ${isDragging
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/40"
                    }
        `}
            >
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                    <span className="font-medium text-primary">Click to upload</span> or
                    drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                    PNG, JPG, HEIC up to 10MB each
                </p>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files) addFiles(e.target.files);
                    e.target.value = "";
                }}
            />

            {/* Thumbnails */}
            {files.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {files.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                                {file.name}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
