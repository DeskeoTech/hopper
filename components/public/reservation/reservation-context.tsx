"use client"

import { createContext, useState, useContext, useCallback, useMemo } from "react"

type ReservationContextValue = {
  activeTab: string
  setActiveTab: (tab: string) => void
  currentPhotoIndex: number
  setCurrentPhotoIndex: (index: number) => void
  fullscreenPhoto: boolean
  setFullscreenPhoto: (open: boolean) => void
  showFullDescription: boolean
  setShowFullDescription: (show: boolean) => void
  residenceModalOpen: boolean
  setResidenceModalOpen: (open: boolean) => void
  resetState: () => void
}

const ReservationContext = createContext<ReservationContextValue>({} as ReservationContextValue)

export function useReservationContext() {
  return useContext(ReservationContext)
}

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window === "undefined") return "about"
    return sessionStorage.getItem("reservation_tab") ?? "about"
  })
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [fullscreenPhoto, setFullscreenPhoto] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [residenceModalOpen, setResidenceModalOpen] = useState(false)

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab)
    sessionStorage.setItem("reservation_tab", tab)
  }, [])

  // Appelé dans handleClose — remet à zéro SAUF l'onglet actif
  const resetState = useCallback(() => {
    setCurrentPhotoIndex(0)
    setFullscreenPhoto(false)
    setShowFullDescription(false)
  }, [])

  const value = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      currentPhotoIndex,
      setCurrentPhotoIndex,
      fullscreenPhoto,
      setFullscreenPhoto,
      showFullDescription,
      setShowFullDescription,
      residenceModalOpen,
      setResidenceModalOpen,
      resetState,
    }),
    [activeTab, setActiveTab, currentPhotoIndex, fullscreenPhoto, showFullDescription, residenceModalOpen, resetState]
  )

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  )
}

export default ReservationProvider