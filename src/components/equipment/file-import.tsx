'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileJson, Loader2, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FileImportProps {
  onFileLoaded: (content: string, filename: string) => void;
  accept?: string;
  className?: string;
  compact?: boolean;
}

export function FileImport({ onFileLoaded, accept = '.txt,.json', className, compact }: FileImportProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const content = await file.text();
      onFileLoaded(content, file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取文件失败');
    } finally {
      setIsLoading(false);
    }
  }, [onFileLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  if (compact) {
    return (
      <div className={cn("inline-flex", className)}>
        <button
          type="button"
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "inline-flex items-center gap-1.5 h-7 px-2.5 rounded border text-xs font-mono transition-colors",
            "border-steel-700 text-steel-400 hover:border-gold-500/30 hover:text-gold-400",
            isDragOver && "border-gold-500/60 text-gold-400 bg-gold-500/[0.04]",
            isLoading && "pointer-events-none opacity-60"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          {isLoading ? '解析中...' : '重新导入'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Card
        className={cn(
          "cursor-pointer border-dashed border-steel-700 transition-all duration-300",
          "hover:border-gold-500/40 hover:bg-gold-500/[0.02]",
          isDragOver && "border-gold-500/60 bg-gold-500/[0.04] glow-amber",
          isLoading && "pointer-events-none opacity-60"
        )}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="relative flex flex-col items-center justify-center gap-4 py-14 overflow-hidden">
          {/* Scan line effect */}
          {(isDragOver || isLoading) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent animate-scan" />
            </div>
          )}

          {isLoading ? (
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
              <div className="absolute inset-0 rounded-full animate-glow-pulse bg-gold-500/10 blur-xl" />
            </div>
          ) : (
            <div className={cn(
              "relative flex items-center justify-center w-14 h-14 rounded border transition-all duration-300",
              isDragOver
                ? "border-gold-500/50 bg-gold-500/10"
                : "border-steel-700 bg-steel-900/50"
            )}>
              {isDragOver ? (
                <Database className="h-6 w-6 text-gold-400" />
              ) : (
                <Upload className="h-6 w-6 text-steel-400" />
              )}
              {/* Corner accents */}
              <div className="absolute -top-px -left-px w-2 h-2 border-t border-l border-gold-500/40" />
              <div className="absolute -top-px -right-px w-2 h-2 border-t border-r border-gold-500/40" />
              <div className="absolute -bottom-px -left-px w-2 h-2 border-b border-l border-gold-500/40" />
              <div className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-gold-500/40" />
            </div>
          )}

          <div className="text-center space-y-1">
            <p className={cn(
              "text-sm font-medium tracking-wide transition-colors",
              isDragOver ? "text-gold-400" : "text-steel-200"
            )}>
              {isLoading ? '正在解析数据...' : '拖拽装备数据到此处'}
            </p>
            <p className="text-[11px] font-mono text-steel-500 tracking-wider uppercase">
              {isLoading ? 'processing' : '支持 .txt / .json 格式'}
            </p>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <Alert variant="destructive" className="border-destructive/30">
          <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
