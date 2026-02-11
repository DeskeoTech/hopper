import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité | Hopper Coworking",
}

export default function PolitiqueDeConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="type-h2 text-foreground">
        Politique de confidentialité
      </h1>

      <div className="mt-6 space-y-8 rounded-[16px] bg-card p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Dernière mise à jour : février 2026
        </p>

        <section>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight text-foreground">
            1. Responsable du traitement
          </h2>
          <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Le responsable du traitement des données personnelles est la
              société <strong>Space Management</strong>, société par actions
              simplifiée, dont le siège social est situé au 10, rue de la
              Victoire (Bâtiment B), 75009 Paris, immatriculée au RCS de Paris
              sous le numéro 820 073 773 (ci-après « <strong>Deskeo</strong> »).
            </p>
            <p className="mt-3">
              Contact :{" "}
              <a
                href="mailto:sales@deskeo.fr"
                className="text-foreground underline underline-offset-2 transition-colors hover:text-foreground/70"
              >
                sales@deskeo.fr
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight text-foreground">
            2. Données personnelles collectées
          </h2>
          <div className="mt-3 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground">
                Données d&apos;identification
              </h3>
              <p className="mt-1">
                Nom, prénom, adresse e-mail, numéro de téléphone, photo de
                profil.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Données relatives à l&apos;entreprise
              </h3>
              <p className="mt-1">
                Raison sociale, adresse, téléphone, e-mail de contact, extrait
                Kbis, logo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Données de réservation
              </h3>
              <p className="mt-1">
                Dates et horaires de réservation, ressources réservées (postes,
                salles de réunion), crédits utilisés, statut de la réservation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Données de paiement
              </h3>
              <p className="mt-1">
                Les paiements sont traités par notre prestataire Stripe. Deskeo
                ne stocke pas vos données bancaires (numéro de carte, CVV). Seul
                un identifiant client Stripe est conservé pour permettre la
                gestion de votre abonnement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Données de connexion et de navigation
              </h3>
              <p className="mt-1">
                Adresse e-mail utilisée pour l&apos;authentification, données de
                session, pages consultées.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Données de support
              </h3>
              <p className="mt-1">
                Type de demande, commentaires, informations transmises lors
                d&apos;une demande d&apos;assistance.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight text-foreground">
            3. Finalités et bases légales du traitement
          </h2>
          <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <div className="overflow-x-auto">
              <table className="mt-2 w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-foreground/10">
                    <th className="pb-2 pr-4 font-semibold text-foreground">
                      Finalité
                    </th>
                    <th className="pb-2 font-semibold text-foreground">
                      Base légale
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/5">
                  <tr>
                    <td className="py-2 pr-4">
                      Gestion de votre compte et authentification
                    </td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      Gestion des réservations et des Pass
                    </td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      Traitement des paiements et facturation
                    </td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      Support client et gestion des réclamations
                    </td>
                    <td className="py-2">Exécution du contrat</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      Amélioration de l&apos;Application (analytics)
                    </td>
                    <td className="py-2">Intérêt légitime</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">
                      Respect des obligations légales et comptables
                    </td>
                    <td className="py-2">Obligation légale</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight text-foreground">
            4. Destinataires des données
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Vos données personnelles peuvent être partagées avec les
              sous-traitants suivants, dans le cadre strict des finalités
              décrites ci-dessus :
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Supabase</strong> — Hébergement de la base de données,
                authentification et stockage de fichiers
              </li>
              <li>
                <strong>Stripe</strong> — Traitement des paiements et gestion
                des abonnements
              </li>
              <li>
                <strong>Vercel</strong> — Hébergement de l&apos;Application et
                analytics de navigation
              </li>
              <li>
                <strong>Google</strong> — Authentification (Google OAuth) et
                affichage cartographique (Google Maps)
              </li>
            </ul>
            <p>
              Ces prestataires sont soumis à des obligations contractuelles de
              protection des données conformes au RGPD.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight text-foreground">
            5. Transferts de données hors UE
          </h2>
          <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Certains de nos sous-traitants peuvent traiter des données en
              dehors de l&apos;Union européenne (notamment aux États-Unis). Dans
              ce cas, les transferts sont encadrés par des garanties appropriées
              conformément au RGPD, telles que les clauses contractuelles types
              de la Commission européenne ou le cadre EU-US Data Privacy
              Framework.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight text-foreground">
            6. Durée de conservation
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Vos données personnelles sont conservées pendant la durée
              nécessaire aux finalités pour lesquelles elles ont été collectées :
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Données de compte :</strong> pendant la durée de votre
                inscription, puis supprimées dans un délai de 3 ans après votre
                dernière activité
              </li>
              <li>
                <strong>Données de réservation :</strong> pendant la durée du
                contrat, puis archivées conformément aux obligations légales
              </li>
              <li>
                <strong>Données de facturation :</strong> 10 ans conformément
                aux obligations comptables
              </li>
              <li>
                <strong>Données de navigation :</strong> 13 mois maximum
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight text-foreground">
            7. Vos droits
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Conformément au Règlement Général sur la Protection des Données
              (RGPD) et à la loi Informatique et Libertés, vous disposez des
              droits suivants :
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Droit d&apos;accès :</strong> obtenir la confirmation
                que vos données sont traitées et en recevoir une copie
              </li>
              <li>
                <strong>Droit de rectification :</strong> demander la correction
                de données inexactes ou incomplètes
              </li>
              <li>
                <strong>Droit à l&apos;effacement :</strong> demander la
                suppression de vos données, sous réserve des obligations légales
                de conservation
              </li>
              <li>
                <strong>Droit à la portabilité :</strong> recevoir vos données
                dans un format structuré et couramment utilisé
              </li>
              <li>
                <strong>Droit d&apos;opposition :</strong> vous opposer au
                traitement de vos données pour des motifs légitimes
              </li>
              <li>
                <strong>Droit à la limitation :</strong> demander la limitation
                du traitement de vos données dans certains cas
              </li>
            </ul>
            <p>
              Pour exercer vos droits, contactez-nous à l&apos;adresse :{" "}
              <a
                href="mailto:sales@deskeo.fr"
                className="text-foreground underline underline-offset-2 transition-colors hover:text-foreground/70"
              >
                sales@deskeo.fr
              </a>
            </p>
            <p>
              Vous disposez également du droit d&apos;introduire une réclamation
              auprès de la Commission Nationale de l&apos;Informatique et des
              Libertés (CNIL) :{" "}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 transition-colors hover:text-foreground/70"
              >
                www.cnil.fr
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight text-foreground">
            8. Cookies
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              L&apos;Application utilise des cookies strictement nécessaires au
              fonctionnement du service :
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Cookies de session :</strong> gestion de votre
                authentification et de votre session utilisateur (fournis par
                Supabase)
              </li>
              <li>
                <strong>Cookies d&apos;analytics :</strong> mesure
                d&apos;audience anonymisée pour améliorer l&apos;Application
                (fournis par Vercel Analytics)
              </li>
            </ul>
            <p>
              Aucun cookie publicitaire ou de suivi à des fins commerciales
              n&apos;est utilisé.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight text-foreground">
            9. Sécurité des données
          </h2>
          <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Deskeo met en œuvre les mesures techniques et organisationnelles
              appropriées pour protéger vos données personnelles contre tout
              accès non autorisé, altération, divulgation ou destruction.
              L&apos;accès aux données est restreint aux seules personnes
              habilitées, et les communications sont chiffrées via le protocole
              HTTPS.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight text-foreground">
            10. Modification de la politique
          </h2>
          <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Deskeo se réserve le droit de modifier la présente politique de
              confidentialité à tout moment. Toute modification sera publiée sur
              cette page avec une date de mise à jour. En cas de modification
              substantielle, les utilisateurs seront informés via
              l&apos;Application.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
