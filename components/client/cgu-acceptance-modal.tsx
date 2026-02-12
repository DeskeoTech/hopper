"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { acceptCgu } from "@/lib/actions/cgu";

export function CguAcceptanceModal() {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!accepted) return;
    setLoading(true);
    setError(null);

    const result = await acceptCgu();

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Page will revalidate and modal will close
    // because cgu_accepted_at will be set
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Conditions Générales</DialogTitle>
        </VisuallyHidden>

        <div className="space-y-6">
          {/* Logo */}
          <div className="mx-auto">
            <Image
              src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
              alt="Hopper Logo"
              width={180}
              height={72}
              className="mx-auto h-16 w-auto"
              priority
            />
          </div>

          {/* Title & Description */}
          <div className="space-y-2 text-center">
            <h2 className="font-header text-2xl font-bold uppercase tracking-tight">
              Mise à jour
            </h2>
            <p className="text-sm text-muted-foreground">
              Nos conditions générales ont été mises à jour ou vous ne les avez
              pas encore acceptées. Veuillez les accepter pour continuer à
              utiliser l&apos;application.
            </p>
          </div>

          {/* Checkbox acceptance */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="cgu-accept"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="cgu-accept"
              className="cursor-pointer text-sm leading-relaxed text-muted-foreground"
            >
              J&apos;accepte les{" "}
              <a
                href="/conditions-generales"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-foreground hover:text-primary"
              >
                Conditions Générales
              </a>{" "}
              et la{" "}
              <a
                href="/politique-de-confidentialite"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-foreground hover:text-primary"
              >
                Politique de confidentialité
              </a>
            </Label>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <Button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validation...
              </>
            ) : (
              "Accepter et continuer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
