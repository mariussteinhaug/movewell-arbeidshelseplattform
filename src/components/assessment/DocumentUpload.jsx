import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, File, X, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentUpload({ uploadedFiles, onFilesChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { name: file.name, url: file_url };
      });

      const uploaded = await Promise.all(uploadPromises);
      onFilesChange([...uploadedFiles, ...uploaded]);
    } catch (error) {
      console.error('Opplasting feilet:', error);
      alert('Kunne ikke laste opp fil. Prøv igjen.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    onFilesChange(uploadedFiles.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-4 bg-slate-50 border-slate-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-slate-900">Relevante dokumenter (valgfritt)</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              F.eks. legeerklæring, tidligere behandlingsplaner
            </p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              className="pointer-events-none"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Laster opp...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Last opp
                </>
              )}
            </Button>
          </label>
        </div>

        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <File className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{file.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-slate-100 rounded"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}