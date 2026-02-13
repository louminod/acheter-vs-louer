import {
  SimulationParams,
  SimulationResult,
  MonthlyData,
} from "./types";
import {
  TAUX_NOTAIRE_ANCIEN,
  TAUX_NOTAIRE_NEUF,
  TAUX_TAXE_FONCIERE,
  CHARGES_COPRO_M2,
  TAUX_ASSURANCE_PNO,
  TAUX_ENTRETIEN,
  TAUX_ASSURANCE_EMPRUNTEUR,
} from "./constants";

function calcMensualite(capital: number, tauxAnnuel: number, dureeMois: number): number {
  const r = tauxAnnuel / 100 / 12;
  if (r === 0) return capital / dureeMois;
  return (capital * r) / (1 - Math.pow(1 + r, -dureeMois));
}

export function runSimulation(params: SimulationParams): SimulationResult {
  const { achat, location, horizonAns } = params;
  const totalMonths = horizonAns * 12;
  const dureeCreditMois = achat.dureeCredit * 12;

  // Frais de notaire
  const fraisNotaire = achat.prixBien * (achat.isNeuf ? TAUX_NOTAIRE_NEUF : TAUX_NOTAIRE_ANCIEN);
  const capitalEmprunte = achat.prixBien + fraisNotaire - achat.apport;
  const mensualiteCredit = calcMensualite(capitalEmprunte, achat.tauxCredit, dureeCreditMois);

  // Charges mensuelles fixes
  const taxeFonciereMensuel = (achat.prixBien * TAUX_TAXE_FONCIERE) / 12;
  const chargesCoproMensuel = (achat.surface * CHARGES_COPRO_M2) / 12;
  const assurancePNOMensuel = (achat.prixBien * TAUX_ASSURANCE_PNO) / 12;
  const entretienMensuel = (achat.prixBien * TAUX_ENTRETIEN) / 12;
  const assuranceEmprunteurMensuel = (capitalEmprunte * TAUX_ASSURANCE_EMPRUNTEUR) / 12;

  const chargesFixes = taxeFonciereMensuel + chargesCoproMensuel + assurancePNOMensuel + entretienMensuel;
  const coutMensuelTotalAchat = mensualiteCredit + chargesFixes + assuranceEmprunteurMensuel;
  const coutMensuelApresCredit = chargesFixes;

  // Location: investissement mensuel
  const loyerInitial = location.loyerMensuel;
  const investissementMensuelInitial = Math.max(0, coutMensuelTotalAchat - loyerInitial);

  const monthly: MonthlyData[] = [];
  let capitalRestantDu = capitalEmprunte;
  let valeurBien = achat.prixBien;
  let capitalPlace = location.apportInvesti; // Montant investi dès le départ par le locataire
  let coutTotalAchat = achat.apport + fraisNotaire; // Apport + frais initiaux
  let coutTotalLocation = 0;
  let loyersCumules = 0;
  let coutTotalCredit = 0;
  let taxesChargesCumulees = 0;
  let pointCroisement: number | null = null;
  let prevDiff = 0;

  const tauxMensuelCredit = achat.tauxCredit / 100 / 12;
  const rendementMensuel = location.rendementPlacement / 100 / 12;

  for (let m = 1; m <= totalMonths; m++) {
    const year = Math.ceil(m / 12);

    // === ACHAT ===
    if (m <= dureeCreditMois) {
      const interets = capitalRestantDu * tauxMensuelCredit;
      const capitalRembourse = mensualiteCredit - interets;
      capitalRestantDu = Math.max(0, capitalRestantDu - capitalRembourse);
      coutTotalCredit += mensualiteCredit;
      coutTotalAchat += coutMensuelTotalAchat;
    } else {
      coutTotalAchat += coutMensuelApresCredit;
    }
    taxesChargesCumulees += chargesFixes + (m <= dureeCreditMois ? assuranceEmprunteurMensuel : 0);

    // Revalorisation annuelle du bien (chaque 12 mois)
    if (m % 12 === 0) {
      valeurBien *= 1 + achat.tauxRevalorisation / 100;
    }

    const patrimoineAchat = valeurBien - capitalRestantDu;

    // === LOCATION ===
    const loyerActuel = loyerInitial * Math.pow(1 + location.augmentationLoyer / 100, year - 1);
    const coutMensuelAchatActuel = m <= dureeCreditMois ? coutMensuelTotalAchat : coutMensuelApresCredit;
    const investissementMensuel = Math.max(0, coutMensuelAchatActuel - loyerActuel);

    loyersCumules += loyerActuel;
    coutTotalLocation += loyerActuel;

    // Rendement composé mensuel
    capitalPlace = capitalPlace * (1 + rendementMensuel) + investissementMensuel;

    const patrimoineLocation = capitalPlace;

    // Point de croisement
    const diff = patrimoineAchat - patrimoineLocation;
    if (m > 1 && prevDiff * diff < 0 && pointCroisement === null) {
      pointCroisement = m;
    }
    prevDiff = diff;

    monthly.push({
      month: m,
      year,
      patrimoineAchat,
      patrimoineLocation,
      coutMensuelAchat: coutMensuelAchatActuel,
      coutMensuelLocation: loyerActuel,
      capitalRestantDu,
      valeurBien,
      capitalPlace,
    });
  }

  const last = monthly[monthly.length - 1];
  const rendementsCumules = capitalPlace - achat.apport - (coutTotalLocation > loyersCumules ? coutTotalLocation - loyersCumules : 0);

  return {
    monthly,
    coutTotalAchat,
    coutTotalLocation,
    patrimoineNetAchat: last.patrimoineAchat,
    patrimoineNetLocation: last.patrimoineLocation,
    fraisNotaire,
    mensualiteCredit,
    coutMensuelTotalAchat,
    investissementMensuel: investissementMensuelInitial,
    mensualiteCreditMensuel: mensualiteCredit,
    taxeFonciereMensuel,
    chargesCoproMensuel,
    assurancePNOMensuel,
    entretienMensuel,
    assuranceEmprunteurMensuel,
    coutTotalCredit,
    taxesChargesCumulees,
    loyersCumules,
    rendementsCumules,
    pointCroisement,
  };
}
