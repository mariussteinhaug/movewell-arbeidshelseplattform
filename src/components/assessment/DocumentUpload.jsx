import React, { useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DocumentUpload({ uploadedFiles = [], onFilesChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const ACCEPTED = useMemo(
    () => new Set(["pdf", "doc", "docx", "jpg", "jpeg", "png"]),
    []
  );

  // Apple-feel: hold det enkelt. 10 MB per fil er ofte nok for “legeerklæring”.
  const MAX_MB = 10;
  const MAX_BYTES = MAX_MB * 1024 * 1024;

  const openPicker = () => {
    if (uploading) return;
    setError("");
    inputRef.current?.click();
  };

  const validateFile = (file) => {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPTED.has(ext)) {
      return `Filtypen .${ext || "?"} støttes ikke. Tillatt: PDF, DOC/DOCX, JPG/PNG.`;
    }
    if (file.size > MAX_BYTES) {
      return `Filen "${file.name}" er for stor. Maks ${MAX_MB} MB per fil.`;
    }
    return null;
  };

  const humanSize = (bytes) => {
    if (typeof bytes !== "number") return "";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    // reset input så samme fil kan lastes opp igjen
    e.target.value = "";

    if (files.length === 0) return;

    // validate all first
    for (const f of files) {
      const err = validateFile(f);
      if (err) {
        setError(err);
        return;
      }
    }

    setUploading(true);
    setError("");

    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return {
          name: file.name,
          url: file_url,
          size: file.size,
          uploaded_at: new Date().toISOString(),
        };
      });

      const uploaded = await Promise.all(uploadPromises);

      // Unngå duplikater på navn+url (enkelt)
      const merged = [...uploadedFiles, ...uploaded].filter(
        (f, idx, arr) => idx === arr.findIndex((x) => x.url === f.url)
      );

      onFilesChange(merged);
    } catch (err) {
      console.error("Opplasting feilet:", err);
      setError("Kunne ikke laste opp fil. Prøv igjen.");
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
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h4 className="text-sm font-medium text-slate-900">
              Relevante dokumenter (valgfritt)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              F.eks. legeerklæring eller tidligere behandlingsplaner (maks {MAX_MB} MB).
            </p>
          </div>

          <input
            ref={inputRef}
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
            onClick={openPicker}
            disabled={uploading}
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
        </div>

        <AnimatePresence>
          {!!error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={file.url || index}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-slate-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {file.size ? humanSize(file.size) : "Lastet opp"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      "hover:bg-slate-100 active:bg-slate-200"
                    )}
                    aria-label={`Fjern ${file.name}`}
                  >
                    <X className="h-4 w-4 text-slate-500" />
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
