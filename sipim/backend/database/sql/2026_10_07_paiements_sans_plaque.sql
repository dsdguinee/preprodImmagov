-- Paiements « Carte Grise,Vignette » : seuls la carte grise et la vignette ont été achetées, pas de plaque.
-- Ils avaient type_plaque = 'EP' à tort, ce qui ajoutait 350 000 GNF dans la liste, la facture et les tableaux de bord.
-- Sans plaque, type_plaque doit être NULL (comme pour un paiement « Sans plaque » du formulaire).

-- 1. Vérifier les lignes concernées avant correction
SELECT paiement_id, reference, type_document, type_plaque
FROM paiements
WHERE type_document = 'Carte Grise,Vignette' AND type_plaque IS NOT NULL;

-- 2. Correction
UPDATE paiements
SET type_plaque = NULL
WHERE type_document = 'Carte Grise,Vignette' AND type_plaque IS NOT NULL;
