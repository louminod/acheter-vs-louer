import {
  SimulationParams,
  SimulationResult,
  MonthlyData,
  ScpiCreditDetails,
  InvestmentStrategy,
} from "./types";
import {
  TAUX_NOTAIRE_ANCIEN,
  TAUX_NOTAIRE_NEUF,
  TAUX_TAXE_FONCIERE,
  CHARGES_COPRO_M2,
  TAUX_ASSURANCE_PNO,
  TAUX_ENTRETIEN,
  TAUX_ASSURANCE_EMPRUNTEUR,
  INVESTMENT_STRATEGY,
  PRIX_PART_SCPI,
} from "./constants";

/**
 * Calcule une mensualité de crédit selon la formule standard d'amortissement
 * @param capital - Montant emprunté en euros
 * @param tauxAnnuel - Taux d'intérêt annuel en pourcentage
 * @param dureeMois - Durée du prêt en mois
 * @returns Mensualité en euros
 */
function calcMensualite(capital: number, tauxAnnuel: number, dureeMois: number): number {
  const r = tauxAnnuel / 100 / 12;
  if (r === 0) return capital / dureeMois;
  return (capital * r) / (1 - Math.pow(1 + r, -dureeMois));
}

/**
 * Calcule les détails du SCPI crédit basé sur l'effort mensuel disponible
 * Résout l'équation: effort = mensualité_crédit - dividendes_SCPI
 * @param effortMensuel - Montant mensuel disponible pour l'effort net (mensualité moins dividendes)
 * @returns Détails complets de l'opération SCPI crédit
 * @throws Error si les dividendes dépassent la mensualité (cas limite non viable)
 */
function calcScpiCreditDetails(effortMensuel: number): ScpiCreditDetails {
  const strategy = INVESTMENT_STRATEGY.scpiCredit;
  const dureeMois = strategy.dureeCreditAns * 12;
  const tauxMensuel = strategy.tauxCredit / 100 / 12;
  const dividendeMensuel = (strategy.rendementDividendes / 100) / 12;

  // Résolution de l'équation: effortMensuel = mensualiteCredit - (nombreParts * PRIX_PART_SCPI * dividendeMensuel)
  // Où mensualiteCredit = montantEmprunte * facteur_mensualite
  // Et montantEmprunte = nombreParts * PRIX_PART_SCPI
  
  const facteurMensualite = tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -dureeMois));
  const denominateur = facteurMensualite - dividendeMensuel;
  
  if (denominateur <= 0) {
    // Les dividendes dépassent la mensualité - cas limite
    throw new Error("Dividendes SCPI supérieurs à la mensualité de crédit");
  }

  const nombreParts = effortMensuel / (PRIX_PART_SCPI * denominateur);
  const montantEmprunte = nombreParts * PRIX_PART_SCPI;
  const mensualiteCredit = montantEmprunte * facteurMensualite;
  const dividendesMensuels = nombreParts * PRIX_PART_SCPI * dividendeMensuel;

  return {
    montantEmprunte,
    mensualiteCredit,
    effortNet: effortMensuel,
    nbPartsAchetees: nombreParts,
    dividendesMensuels,
    finCreditMois: dureeMois,
  };
}

/**
 * Calcule le rendement blended pondéré de la stratégie d'investissement
 * Tient compte des phases du SCPI crédit (pendant/après remboursement)
 * @param scpiCredit - Détails de l'opération SCPI crédit
 * @param moisActuel - Mois actuel de la simulation (pour déterminer la phase SCPI)
 * @returns Rendement annuel pondéré en pourcentage
 */
function calcRendementBlended(scpiCredit: ScpiCreditDetails, moisActuel: number): number {
  const strategy = INVESTMENT_STRATEGY;
  
  // AV et PER: rendements simples
  const rendementAV = (strategy.assuranceVie.allocation / 100) * strategy.assuranceVie.rendement;
  const rendementPER = (strategy.per.allocation / 100) * strategy.per.rendement;
  
  // SCPI Cash: dividendes + revalo
  const rendementSCPICash = (strategy.scpiCash.allocation / 100) * 
    (strategy.scpiCash.rendementDividendes + strategy.scpiCash.rendementRevalo);
  
  // SCPI Crédit: dépend de la phase
  let rendementSCPICredit: number;
  if (moisActuel <= scpiCredit.finCreditMois) {
    // Phase crédit: rendement effectif réduit par l'effort
    // Approximation: seuls les dividendes nets participent au rendement
    rendementSCPICredit = (strategy.scpiCredit.allocation / 100) * strategy.scpiCredit.rendementRevalo;
  } else {
    // Phase post-crédit: rendement plein + cash flow libéré 
    rendementSCPICredit = (strategy.scpiCredit.allocation / 100) * 
      (strategy.scpiCredit.rendementDividendes + strategy.scpiCredit.rendementRevalo);
  }
  
  return rendementAV + rendementPER + rendementSCPICash + rendementSCPICredit;
}

/**
 * Exécute la simulation complète "Achat vs Location" avec stratégie d'investissement blended
 * 
 * Pour le scénario achat: calcule l'évolution du patrimoine (valeur bien - dette restante)
 * Pour le scénario location: répartit l'investissement mensuel selon une stratégie diversifiée:
 * - 30% Assurance Vie (4% net/an)
 * - 20% PER (4% net/an)  
 * - 25% SCPI Cash (5.5% dividendes + 1% revalo = ~6.5%)
 * - 25% SCPI Crédit (phases: effort réduit puis dividendes libérés)
 * 
 * @param params - Paramètres complets de la simulation
 * @returns Résultats détaillés mois par mois et totaux
 */
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

  // Location: investissement mensuel initial
  const loyerInitial = location.loyerMensuel;
  const investissementMensuelInitial = Math.max(0, coutMensuelTotalAchat - loyerInitial);

  // === NOUVELLE STRATÉGIE D'INVESTISSEMENT BLENDED ===
  
  // Calcul des détails SCPI Crédit basé sur l'allocation
  const allocationSCPICredit = investissementMensuelInitial * (INVESTMENT_STRATEGY.scpiCredit.allocation / 100);
  const scpiCredit = calcScpiCreditDetails(allocationSCPICredit);

  // Répartition de l'apport initial entre les 4 enveloppes
  const apportAV = location.apportInvesti * (INVESTMENT_STRATEGY.assuranceVie.allocation / 100);
  const apportPER = location.apportInvesti * (INVESTMENT_STRATEGY.per.allocation / 100);
  const apportSCPICash = location.apportInvesti * (INVESTMENT_STRATEGY.scpiCash.allocation / 100);
  const apportSCPICredit = location.apportInvesti * (INVESTMENT_STRATEGY.scpiCredit.allocation / 100);

  // Initialisation des capitaux par enveloppe
  let capitalAV = apportAV;
  let capitalPER = apportPER;
  let capitalSCPICash = apportSCPICash;
  let capitalSCPICredit = apportSCPICredit; // Valeur des parts SCPI crédit
  let restantDuSCPI = Math.max(0, scpiCredit.montantEmprunte - apportSCPICredit); // Dette SCPI restante

  const monthly: MonthlyData[] = [];
  let capitalRestantDu = capitalEmprunte;
  let valeurBien = achat.prixBien;
  let coutTotalAchat = achat.apport + fraisNotaire;
  let coutTotalLocation = 0;
  let loyersCumules = 0;
  let coutTotalCredit = 0;
  let taxesChargesCumulees = 0;
  let pointCroisement: number | null = null;
  let prevDiff = 0;

  const tauxMensuelCredit = achat.tauxCredit / 100 / 12;
  
  // Taux mensuels pour chaque enveloppe
  const tauxMensuelAV = INVESTMENT_STRATEGY.assuranceVie.rendement / 100 / 12;
  const tauxMensuelPER = INVESTMENT_STRATEGY.per.rendement / 100 / 12;
  const tauxMensuelSCPICashDividendes = INVESTMENT_STRATEGY.scpiCash.rendementDividendes / 100 / 12;
  const tauxMensuelSCPICashRevalo = INVESTMENT_STRATEGY.scpiCash.rendementRevalo / 100 / 12;
  const tauxMensuelSCPICreditDividendes = INVESTMENT_STRATEGY.scpiCredit.rendementDividendes / 100 / 12;
  const tauxMensuelSCPICreditRevalo = INVESTMENT_STRATEGY.scpiCredit.rendementRevalo / 100 / 12;
  const tauxMensuelCreditSCPI = INVESTMENT_STRATEGY.scpiCredit.tauxCredit / 100 / 12;

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

    // Revalorisation annuelle du bien
    if (m % 12 === 0) {
      valeurBien *= 1 + achat.tauxRevalorisation / 100;
    }

    const patrimoineAchat = valeurBien - capitalRestantDu;

    // === LOCATION AVEC STRATÉGIE BLENDED ===
    const loyerActuel = loyerInitial * Math.pow(1 + location.augmentationLoyer / 100, year - 1);
    const coutMensuelAchatActuel = m <= dureeCreditMois ? coutMensuelTotalAchat : coutMensuelApresCredit;
    const investissementMensuelTotal = Math.max(0, coutMensuelAchatActuel - loyerActuel);

    loyersCumules += loyerActuel;
    coutTotalLocation += loyerActuel;

    // Répartition mensuelle entre enveloppes
    let invAV = investissementMensuelTotal * (INVESTMENT_STRATEGY.assuranceVie.allocation / 100);
    let invPER = investissementMensuelTotal * (INVESTMENT_STRATEGY.per.allocation / 100);
    let invSCPICash = investissementMensuelTotal * (INVESTMENT_STRATEGY.scpiCash.allocation / 100);
    let invSCPICredit = investissementMensuelTotal * (INVESTMENT_STRATEGY.scpiCredit.allocation / 100);

    // Phase SCPI Crédit
    let cashFlowLibere = 0;
    if (m <= scpiCredit.finCreditMois) {
      // Phase crédit: l'effort net va au remboursement du crédit SCPI
      const interetsSCPI = restantDuSCPI * tauxMensuelCreditSCPI;
      const capitalRembourseSCPI = Math.min(scpiCredit.mensualiteCredit - interetsSCPI, restantDuSCPI);
      restantDuSCPI = Math.max(0, restantDuSCPI - capitalRembourseSCPI);
      
      // L'investissement alloué au SCPI crédit sert à payer l'effort net
      // Le reste (dividendes SCPI) est réinvesti dans la même enveloppe
    } else {
      // Phase post-crédit: le cash flow est libéré (mensualité + dividendes)
      cashFlowLibere = scpiCredit.mensualiteCredit + scpiCredit.dividendesMensuels;
    }

    // Évolution des capitaux avec rendements composés
    capitalAV = capitalAV * (1 + tauxMensuelAV) + invAV;
    capitalPER = capitalPER * (1 + tauxMensuelPER) + invPER;
    
    // SCPI Cash: dividendes réinvestis + revalorisation des parts
    const dividendesSCPICash = capitalSCPICash * tauxMensuelSCPICashDividendes;
    capitalSCPICash = capitalSCPICash * (1 + tauxMensuelSCPICashRevalo) + invSCPICash + dividendesSCPICash;
    
    // SCPI Crédit: revalorisation des parts + évolution
    const dividendesSCPICredit = capitalSCPICredit * tauxMensuelSCPICreditDividendes;
    if (m <= scpiCredit.finCreditMois) {
      // Pendant le crédit: dividendes réinvestis dans cette enveloppe
      capitalSCPICredit = capitalSCPICredit * (1 + tauxMensuelSCPICreditRevalo) + dividendesSCPICredit;
    } else {
      // Après le crédit: dividendes + revalorisation + cash flow libéré réparti
      capitalSCPICredit = capitalSCPICredit * (1 + tauxMensuelSCPICreditRevalo) + dividendesSCPICredit;
      
      // Répartition du cash flow libéré proportionnellement aux autres enveloppes
      const totalAutres = INVESTMENT_STRATEGY.assuranceVie.allocation + INVESTMENT_STRATEGY.per.allocation + INVESTMENT_STRATEGY.scpiCash.allocation;
      capitalAV += cashFlowLibere * (INVESTMENT_STRATEGY.assuranceVie.allocation / totalAutres);
      capitalPER += cashFlowLibere * (INVESTMENT_STRATEGY.per.allocation / totalAutres);
      capitalSCPICash += cashFlowLibere * (INVESTMENT_STRATEGY.scpiCash.allocation / totalAutres);
    }

    // Patrimoine location = somme de toutes les enveloppes - dette SCPI restante
    const patrimoineLocation = capitalAV + capitalPER + capitalSCPICash + capitalSCPICredit - restantDuSCPI;

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
      capitalPlace: patrimoineLocation, // Pour compatibilité
    });
  }

  const last = monthly[monthly.length - 1];
  const rendementsCumules = last.patrimoineLocation - location.apportInvesti - loyersCumules;

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

/**
 * Calcule les détails SCPI crédit pour l'affichage dans l'interface
 */
export function getScpiCreditDetails(investissementMensuel: number): ScpiCreditDetails {
  const allocationSCPICredit = investissementMensuel * (INVESTMENT_STRATEGY.scpiCredit.allocation / 100);
  return calcScpiCreditDetails(allocationSCPICredit);
}

/**
 * Calcule le rendement blended pondéré moyen de la stratégie
 * (approximation pour affichage, ne tient pas compte des phases SCPI crédit)
 */
export function getRendementBlended(): number {
  const strategy = INVESTMENT_STRATEGY;
  
  const rendementAV = (strategy.assuranceVie.allocation / 100) * strategy.assuranceVie.rendement;
  const rendementPER = (strategy.per.allocation / 100) * strategy.per.rendement;
  const rendementSCPICash = (strategy.scpiCash.allocation / 100) * 
    (strategy.scpiCash.rendementDividendes + strategy.scpiCash.rendementRevalo);
  
  // Pour SCPI crédit, utilise une approximation du rendement moyen
  // (en réalité il varie selon les phases)
  const rendementSCPICredit = (strategy.scpiCredit.allocation / 100) * 
    (strategy.scpiCredit.rendementDividendes + strategy.scpiCredit.rendementRevalo) * 0.7; // facteur de réduction pendant crédit
  
  return rendementAV + rendementPER + rendementSCPICash + rendementSCPICredit;
}

/**
 * Retourne la stratégie d'investissement avec les détails pour l'affichage
 */
export function getInvestmentStrategy(): typeof INVESTMENT_STRATEGY {
  return INVESTMENT_STRATEGY;
}
