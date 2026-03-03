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
  uploadCompanyDocument,
  deleteCompanyDocument,
} from "@/lib/actions/companies"
import { toast } from "sonner"
import type { CompanyType } from "@/lib/types/database"

type DocumentType = "kbis" | "identity_document" | "rib"

interface DocumentsSectionProps {
  companyId: string
  kbisStoragePath: string | null
  identityDocumentStoragePath: string | null
  ribStoragePath: string | null
  companyType: CompanyType | null
}

const DOCUMENT_CONFIG: Record<DocumentType, { label: string; emptyMessage: string; importLabel: string }> = {
  kbis: {
    label: "KBIS",
    emptyMessage: "Aucun KBIS fourni",
    importLabel: "Importer un KBIS",
  },
  identity_document: {
    label: "Pièce d'identité",
    emptyMessage: "Aucune pièce d'identité fournie",
    importLabel: "Importer une pièce d'identité",
  },
  rib: {
    label: "RIB",
    emptyMessage: "Aucun RIB fourni",
    importLabel: "Importer un RIB",
  },
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
  identityDocumentStoragePath,
  ribStoragePath,
  companyType,
}: DocumentsSectionProps) {
  const [loading, setLoading] = useState<DocumentType | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<DocumentType | null>(null)
  const [uploadConfirmOpen, setUploadConfirmOpen] = useState<DocumentType | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const kbisInputRef = useRef<HTMLInputElement>(null)
  const identityInputRef = useRef<HTMLInputElement>(null)
  const ribInputRef = useRef<HTMLInputElement>(null)

  const isMultiEmployee = companyType === "multi_employee"

  const getInputRef = (type: DocumentType) => {
    switch (type) {
      case "kbis": return kbisInputRef
      case "identity_document": return identityInputRef
      case "rib": return ribInputRef
    }
  }

  const getStoragePath = (type: DocumentType) => {
    switch (type) {
      case "kbis": return kbisStoragePath
      case "identity_document": return identityDocumentStoragePath
      case "rib": return ribStoragePath
    }
  }

  const handleView = async (type: DocumentType) => {
    const path = getStoragePath(type)
    if (!path) return
    setLoading(type)
    const result = await getCompanyDocumentUrl(path)
    setLoading(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    if (result.url) {
      window.open(result.url, "_blank")
    }
  }

  const handleFileSelect = (type: DocumentType) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setUploadConfirmOpen(type)
  }

  const handleUploadConfirm = async () => {
    if (!pendingFile || !uploadConfirmOpen) return
    const type = uploadConfirmOpen
    setLoading(type)
    const formData = new FormData()
    formData.append("file", pendingFile)

    let result: { error?: string; success?: boolean }
    if (type === "kbis") {
      result = await uploadCompanyKbisAdmin(companyId, formData)
    } else {
      result = await uploadCompanyDocument(companyId, type, formData)
    }

    setLoading(null)
    setUploadConfirmOpen(null)
    setPendingFile(null)
    const ref = getInputRef(type)
    if (ref.current) ref.current.value = ""
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`${DOCUMENT_CONFIG[type].label} mis à jour`)
    window.location.reload()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmOpen) return
    const type = deleteConfirmOpen
    const path = getStoragePath(type)
    if (!path) return

    setLoading(type)
    let result: { error?: string; success?: boolean }
    if (type === "kbis") {
      result = await deleteCompanyKbis(companyId, path)
    } else {
      result = await deleteCompanyDocument(companyId, type, path)
    }

    setLoading(null)
    setDeleteConfirmOpen(null)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`${DOCUMENT_CONFIG[type].label} supprimé`)
    window.location.reload()
  }

  const renderDocumentRow = (type: DocumentType, required?: boolean) => {
    const config = DOCUMENT_CONFIG[type]
    const storagePath = getStoragePath(type)
    const inputRef = getInputRef(type)
    const isLoading = loading === type

    return (
      <div key={type}>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{config.label}</span>
          {required && (
            <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
              Requis
            </span>
          )}
          {!required && type !== "kbis" && (
            <span className="rounded-sm bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              Optionnel
            </span>
          )}
        </div>

        {storagePath ? (
          <div className="flex items-center gap-3 rounded-sm border border-border p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {getFileName(storagePath)}
              </p>
              <p className="text-xs text-muted-foreground">
                {getFileExtension(storagePath)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(type)}
                disabled={isLoading}
                title="Voir le document"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={isLoading}
                title="Remplacer"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmOpen(type)}
                disabled={isLoading}
                title="Supprimer"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-sm border border-dashed border-border p-4 text-center">
            <p className="mb-3 text-sm text-muted-foreground">{config.emptyMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {config.importLabel}
            </Button>
          </div>
        )}
      </div>
    )
  }

  const activeDeleteConfig = deleteConfirmOpen ? DOCUMENT_CONFIG[deleteConfirmOpen] : null
  const activeUploadConfig = uploadConfirmOpen ? DOCUMENT_CONFIG[uploadConfirmOpen] : null
  const activeUploadPath = uploadConfirmOpen ? getStoragePath(uploadConfirmOpen) : null

  return (
    <>
      <div className="rounded-lg bg-card p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 type-h3 text-foreground">
          <FileText className="h-5 w-5" />
          Documents
        </h2>

        <div className="space-y-4">
          {renderDocumentRow("kbis", isMultiEmployee)}
          {renderDocumentRow("identity_document")}
          {renderDocumentRow("rib")}
        </div>

        <input
          ref={kbisInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect("kbis")}
          className="hidden"
        />
        <input
          ref={identityInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect("identity_document")}
          className="hidden"
        />
        <input
          ref={ribInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect("rib")}
          className="hidden"
        />
      </div>

      {/* Upload Confirmation */}
      <AlertDialog open={!!uploadConfirmOpen} onOpenChange={(open) => { if (!open) { setUploadConfirmOpen(null); setPendingFile(null) } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activeUploadPath ? `Remplacer ${activeUploadConfig?.label}` : `Importer ${activeUploadConfig?.label}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeUploadPath
                ? `Voulez-vous remplacer le document actuel par "${pendingFile?.name}" ?`
                : `Voulez-vous importer "${pendingFile?.name}" ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingFile(null)
                if (uploadConfirmOpen) {
                  const ref = getInputRef(uploadConfirmOpen)
                  if (ref.current) ref.current.value = ""
                }
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleUploadConfirm} disabled={!!loading}>
              {loading ? "Upload..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmOpen} onOpenChange={(open) => { if (!open) setDeleteConfirmOpen(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {activeDeleteConfig?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer ce document ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!loading}
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
