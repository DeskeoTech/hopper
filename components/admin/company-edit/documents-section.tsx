"use client"

import { useState, useRef } from "react"
import { FileText, Upload, ExternalLink, Trash2, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  getCompanyDocumentUrl,
  uploadCompanyKbisAdmin,
  deleteCompanyKbis,
} from "@/lib/actions/companies"
import { toast } from "sonner"
import type { CompanyType } from "@/lib/types/database"

interface DocumentsSectionProps {
  companyId: string
  kbisStoragePath: string | null
  companyType: CompanyType | null
}

function getFileName(storagePath: string) {
  const parts = storagePath.split("/")
  return parts[parts.length - 1]
}

function getFileExtension(storagePath: string) {
  const ext = storagePath.split(".").pop()?.toUpperCase()
  return ext || "FICHIER"
}

export function DocumentsSection({
  companyId,
  kbisStoragePath,
  companyType,
}: DocumentsSectionProps) {
  const [loading, setLoading] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isMultiEmployee = companyType === "multi_employee"

  const handleView = async () => {
    if (!kbisStoragePath) return
    setLoading(true)
    const result = await getCompanyDocumentUrl(kbisStoragePath)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    if (result.url) {
      window.open(result.url, "_blank")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setUploadConfirmOpen(true)
  }

  const handleUploadConfirm = async () => {
    if (!pendingFile) return
    setLoading(true)
    const formData = new FormData()
    formData.append("file", pendingFile)
    const result = await uploadCompanyKbisAdmin(companyId, formData)
    setLoading(false)
    setUploadConfirmOpen(false)
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("KBIS mis à jour")
    window.location.reload()
  }

  const handleDeleteConfirm = async () => {
    if (!kbisStoragePath) return
    setLoading(true)
    const result = await deleteCompanyKbis(companyId, kbisStoragePath)
    setLoading(false)
    setDeleteConfirmOpen(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("KBIS supprimé")
    window.location.reload()
  }

  return (
    <>
      <div className="rounded-lg bg-card p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 type-h3 text-foreground">
          <FileText className="h-5 w-5" />
          Documents
        </h2>

        <div className="space-y-4">
          {/* KBIS */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">KBIS</span>
              {isMultiEmployee && (
                <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                  Requis
                </span>
              )}
            </div>

            {kbisStoragePath ? (
              <div className="flex items-center gap-3 rounded-sm border border-border p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {getFileName(kbisStoragePath)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getFileExtension(kbisStoragePath)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleView}
                    disabled={loading}
                    title="Voir le document"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    title="Remplacer"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={loading}
                    title="Supprimer"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-dashed border-border p-4 text-center">
                <p className="mb-3 text-sm text-muted-foreground">Aucun KBIS fourni</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importer un KBIS
                </Button>
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Confirmation */}
      <AlertDialog open={uploadConfirmOpen} onOpenChange={setUploadConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {kbisStoragePath ? "Remplacer le KBIS" : "Importer un KBIS"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {kbisStoragePath
                ? `Voulez-vous remplacer le KBIS actuel par "${pendingFile?.name}" ?`
                : `Voulez-vous importer "${pendingFile?.name}" comme KBIS ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ""
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUploadConfirm} disabled={loading}>
              {loading ? "Upload..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le KBIS</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer le document KBIS ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
