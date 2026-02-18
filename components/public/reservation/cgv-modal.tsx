"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CGVModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CENTERS_LIST = [
  "10, rue de la Victoire à Paris (75009) au RDC",
  "10, rue de la Victoire à Paris (75009) au R+1",
  "63 rue des Peupliers à Boulogne Billancourt (92100)",
  "9, rue Jadin à Paris (75017)",
  "17, boulevard Morland à Paris (75004)",
  "62, rue Saint-Anne (75002)",
  "22, rue Chauchat à Paris (75009)",
  "145, avenue Charles de Gaulle à Neuilly-sur-Seine (92200)",
  "12, rue Juliette Récamier à Lyon (69006) (le Centre \"Next\")",
]

export function CGVModal({ open, onOpenChange }: CGVModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0">
        <div className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-xl font-bold">
            Conditions Générales de Vente et d&apos;Utilisation du Pass Hopper
          </DialogTitle>
        </div>

        <ScrollArea className="flex-1 px-6 py-4 max-h-[60vh]">
          <div className="space-y-6 text-sm text-foreground">
            <section>
              <h3 className="font-bold text-base mb-2">1. Préambule</h3>
              <p className="text-muted-foreground leading-relaxed">
                Les présentes Conditions Générales de Vente et d&apos;Utilisation
                (ci-après les « CGVU ») régissent les conditions d&apos;achat et
                d&apos;utilisation du Pass Hopper (ci-après le « Pass »), un service
                proposé par Deskeo (ci-après le « Prestataire »).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                L&apos;achat d&apos;un Pass Hopper implique l&apos;acceptation
                pleine et entière des présentes CGVU.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">2. Champ d&apos;application</h3>
              <p className="text-muted-foreground leading-relaxed">
                Les présentes CGVU s&apos;appliquent à toute commande d&apos;un Pass
                Hopper effectuée via le site internet de Deskeo ou tout autre canal
                de vente agréé par le Prestataire.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Le Prestataire se réserve le droit de modifier les présentes CGVU à
                tout moment. Les CGVU applicables sont celles en vigueur à la date
                de la commande.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">3. Description de l&apos;offre</h3>
              <p className="text-muted-foreground leading-relaxed">
                Le Pass Hopper est un titre d&apos;accès nominatif permettant à son
                titulaire (ci-après le « Client ») d&apos;utiliser les espaces de
                coworking Hopper (ci-après les « Centres ») selon les conditions
                définies par le type de Pass souscrit.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Trois types de Pass sont proposés : Pass Day (journalier), Pass Week
                (hebdomadaire, 5 jours ouvrés consécutifs) et Pass Month (mensuel,
                20 jours ouvrés). Chaque Pass donne accès à un poste de travail en
                open space dans le Centre sélectionné lors de la réservation.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Le Pass inclut l&apos;accès aux équipements communs du Centre
                (WiFi, imprimante, cuisine, etc.) ainsi qu&apos;un crédit de salle
                de réunion selon les disponibilités.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">4. Description des Centres</h3>
              <p className="text-muted-foreground leading-relaxed">
                Le Prestataire met à disposition les Centres suivants :
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                {CENTERS_LIST.map((center, idx) => (
                  <li key={idx}>{center}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">5. Conditions tarifaires</h3>
              <h4 className="font-semibold mt-3 mb-1">5.1 Pass Journalier / Hebdomadaire</h4>
              <p className="text-muted-foreground leading-relaxed">
                Le Pass Day et le Pass Week sont facturés en une seule fois au moment
                de la réservation. Le paiement est effectué par carte bancaire via
                la plateforme de paiement sécurisée Stripe.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Les prix sont indiqués en euros hors taxes (HT). La TVA applicable
                de 20% est ajoutée au moment du paiement.
              </p>

              <h4 className="font-semibold mt-3 mb-1">5.2 Pass Mensuel</h4>
              <p className="text-muted-foreground leading-relaxed">
                Le Pass Month fait l&apos;objet d&apos;un abonnement mensuel
                renouvelable automatiquement. Le Client peut résilier son abonnement
                à tout moment depuis son espace personnel ou le portail Stripe.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                La résiliation prend effet à la fin de la période en cours. Aucun
                remboursement prorata temporis n&apos;est effectué.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">6. Remise de badge</h3>
              <p className="text-muted-foreground leading-relaxed">
                Un badge d&apos;accès sera remis au Client lors de sa première visite
                dans le Centre choisi. Le Client s&apos;engage à restituer le badge
                à l&apos;issue de sa période d&apos;utilisation.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">7. Services dans les Centres</h3>
              <p className="text-muted-foreground leading-relaxed">
                Le Client bénéficie de l&apos;ensemble des services proposés dans le
                Centre, notamment : accès WiFi haut débit, impression, cuisine
                équipée, café et thé, et tout autre équipement indiqué sur la fiche
                du Centre.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">8. Usage du Centre</h3>
              <p className="text-muted-foreground leading-relaxed">
                Le Client s&apos;engage à utiliser les espaces et équipements mis à
                sa disposition avec soin et dans le respect des autres utilisateurs.
                Tout comportement nuisible ou dégradation pourra entraîner
                l&apos;exclusion immédiate et définitive du Client sans
                remboursement.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">9. Accès au Centre</h3>
              <p className="text-muted-foreground leading-relaxed">
                L&apos;accès au Centre est possible pendant les heures d&apos;ouverture
                indiquées sur la fiche du Centre. Le Prestataire se réserve le droit
                de modifier les horaires d&apos;ouverture en cas de force majeure.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">10. Assurance</h3>
              <p className="text-muted-foreground leading-relaxed">
                Le Client est responsable de ses effets personnels et de son matériel
                informatique. Le Prestataire décline toute responsabilité en cas de
                vol, perte ou dommage.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-base mb-2">11. Données personnelles</h3>
              <p className="text-muted-foreground leading-relaxed">
                Les données personnelles collectées dans le cadre de la souscription
                d&apos;un Pass sont traitées conformément au Règlement Général sur la
                Protection des Données (RGPD). Pour toute question relative à vos
                données, contactez-nous à l&apos;adresse : privacy@deskeo.com.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border">
          <Button onClick={() => onOpenChange(false)} className="w-full rounded-full">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
