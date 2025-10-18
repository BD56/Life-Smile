export const CARD_DEFINITIONS = {
    // ÉTUDES
    'etudes1': { 
        name: "Études", 
        type: 'pro', 
        category: 'etudes', 
        smiles: 1, 
        text: "Niveau d'études : 1", 
        value: 1
    },
    'etudes_double': { 
        name: "Études Doubles", 
        type: 'pro', 
        category: 'etudes', 
        smiles: 2, 
        text: "Compte pour 2 niveaux d'études.", 
        value: 2 
    },

    // MÉTIERS
    'barman': { 
        name: "Barman", 
        type: 'pro', 
        category: 'metier', 
        smiles: 1, 
        text: "INTÉRIMAIRE. Néc: 0 ét. Sal max: 1", 
        requirements: { etudes: 0 }, 
        salaryMax: 1, 
        status: 'interimaire' 
    },
    'prof': { 
        name: "Prof", 
        type: 'pro', 
        category: 'metier', 
        smiles: 2, 
        text: "FONCTIONNAIRE. Néc: 2 ét. Sal max: 2", 
        requirements: { etudes: 2 }, 
        salaryMax: 2, 
        status: 'fonctionnaire' 
    },
    'grand_prof': { 
        name: "Grand Prof", 
        type: 'pro', 
        category: 'metier', 
        smiles: 3, 
        text: "PROMOTION. Néc: Prof. Sal max: 3", 
        requirements: { metier: 'prof' }, 
        salaryMax: 3, 
        status: 'fonctionnaire' 
    },
    'medecin': { 
        name: "Médecin", 
        type: 'pro', 
        category: 'metier', 
        smiles: 3, 
        text: "AVANTAGE: Immunisé à Maladie. Néc: 4 ét. Sal max: 4", 
        requirements: { etudes: 4 }, 
        salaryMax: 4, 
        advantage: 'immune_to_maladie' 
    },
    'avocat': { 
        name: "Avocat", 
        type: 'pro', 
        category: 'metier', 
        smiles: 3, 
        text: "AVANTAGE: Immunisé au divorce. Néc: 3 ét. Sal max: 3", 
        requirements: { etudes: 3 }, 
        salaryMax: 3, 
        advantage: 'immune_to_divorce_malus' 
    },
    'chercheur': { 
        name: "Chercheur", 
        type: 'pro', 
        category: 'metier', 
        smiles: 3, 
        text: "AVANTAGE: Main de 6 cartes. Néc: 4 ét. Sal max: 3", 
        requirements: { etudes: 4 }, 
        salaryMax: 3, 
        advantage: 'extra_card'
    },
    'journaliste': { 
        name: "Journaliste", 
        type: 'pro', 
        category: 'metier', 
        smiles: 2, 
        text: "Permet de poser un Grand Prix. Néc: 3 ét. Sal max: 3", 
        requirements: { etudes: 3 }, 
        salaryMax: 3
    },
    'bandit': { 
        name: "Bandit", 
        type: 'pro', 
        category: 'metier', 
        smiles: 0, 
        text: "Immunisé aux impôts. Néc: 0 ét. Sal max: 4", 
        requirements: { etudes: 0 }, 
        salaryMax: 4
    },
    'architecte': { 
        name: "Architecte", 
        type: 'pro', 
        category: 'metier', 
        smiles: 2, 
        text: "AVANTAGE: Pose une maison gratuitement. Néc: 4 ét. Sal max: 3", 
        requirements: { etudes: 4 }, 
        salaryMax: 3, 
        advantage: 'free_house'
    },
    'pilote': { 
        name: "Pilote", 
        type: 'pro', 
        category: 'metier', 
        smiles: 3, 
        text: "AVANTAGE: Voyages gratuits. Néc: 3 ét. Sal max: 4", 
        requirements: { etudes: 3 }, 
        salaryMax: 4, 
        advantage: 'free_trip'
    },
    'policier': { 
        name: "Policier", 
        type: 'pro', 
        category: 'metier', 
        smiles: 2, 
        text: "AVANTAGE: Défausse le Bandit. Néc: 2 ét. Sal max: 2", 
        requirements: { etudes: 2 }, 
        salaryMax: 2, 
        advantage: 'discards_bandit', 
        status: 'fonctionnaire'
    },
    'militaire': { 
        name: "Militaire", 
        type: 'pro', 
        category: 'metier', 
        smiles: 2, 
        text: "AVANTAGE: Protège de l'Attentat. Néc: 1 ét. Sal max: 2", 
        requirements: { etudes: 1 }, 
        salaryMax: 2, 
        advantage: 'protects_from_attentat', 
        status: 'fonctionnaire'
    },
    'pharmacien': { 
        name: "Pharmacien", 
        type: 'pro', 
        category: 'metier', 
        smiles: 2, 
        text: "AVANTAGE: Immunisé à Maladie. Néc: 4 ét. Sal max: 3", 
        requirements: { etudes: 4 }, 
        salaryMax: 3, 
        advantage: 'immune_to_maladie'
    },
    'garagiste': { 
        name: "Garagiste", 
        type: 'pro', 
        category: 'metier', 
        smiles: 1, 
        text: "AVANTAGE: Immunisé aux Accidents. Néc: 1 ét. Sal max: 2", 
        requirements: { etudes: 1 }, 
        salaryMax: 2, 
        advantage: 'immune_to_accident'
    },

    // SALAIRES
    'salaire1': { 
        name: "Salaire Nv.1", 
        type: 'pro', 
        category: 'salaire', 
        smiles: 1, 
        text: "Revenu de niveau 1", 
        level: 1 
    },
    'salaire2': { 
        name: "Salaire Nv.2", 
        type: 'pro', 
        category: 'salaire', 
        smiles: 1, 
        text: "Revenu de niveau 2", 
        level: 2 
    },
    'salaire3': { 
        name: "Salaire Nv.3", 
        type: 'pro', 
        category: 'salaire', 
        smiles: 1, 
        text: "Revenu de niveau 3", 
        level: 3 
    },
    'salaire4': { 
        name: "Salaire Nv.4", 
        type: 'pro', 
        category: 'salaire', 
        smiles: 1, 
        text: "Revenu de niveau 4", 
        level: 4 
    },

    // VIE PERSONNELLE
    'flirt': { 
        name: "Flirt", 
        type: 'perso', 
        category: 'flirt', 
        smiles: 1, 
        text: "Permet de se marier."
    },
    'mariage': { 
        name: "Mariage", 
        type: 'perso', 
        category: 'mariage', 
        smiles: 3, 
        text: "Néc: 1 flirt. Permet d'avoir des enfants.", 
        requirements: { flirt: 1 }
    },
    'enfant': { 
        name: "Enfant", 
        type: 'perso', 
        category: 'enfant', 
        smiles: 2, 
        text: "Néc: marié.", 
        requirements: { mariage: 1 }
    },
    'adultere': { 
        name: "Adultère", 
        type: 'perso', 
        category: 'adultere', 
        smiles: 0, 
        text: "Permet de flirter en étant marié. Néc: marié.", 
        requirements: { mariage: 1 }
    },

    // ACQUISITIONS
    'animal': { 
        name: "Animal", 
        type: 'acquisition', 
        category: 'acquisition', 
        smiles: 1, 
        text: "Un ami fidèle. Gratuit.", 
        cost: 0 
    },
    'voyage': { 
        name: "Voyage", 
        type: 'acquisition', 
        category: 'acquisition', 
        smiles: 2, 
        text: "Un beau voyage. Coût: 2", 
        cost: 2 
    },
    'maison': { 
        name: "Maison", 
        type: 'acquisition', 
        category: 'acquisition', 
        smiles: 3, 
        text: "Coût: 4 (moitié si marié)", 
        cost: 4 
    },

    // DISTINCTIONS
    'grand_prix': { 
        name: "Grand Prix", 
        type: 'distinction', 
        category: 'distinction', 
        smiles: 4, 
        text: "Augmente le salaire au Nv. 4. Néc: Chercheur/Journaliste", 
        requirements: { metiers: ['chercheur', 'journaliste'] }
    },
    'legion_honneur': { 
        name: "Légion d'Honneur", 
        type: 'distinction', 
        category: 'distinction', 
        smiles: 3, 
        text: "Pour tous sauf Bandit", 
        requirements: { excluded_metiers: ['bandit'] }
    },

    // MALUS
    'accident': { 
        name: "Accident", 
        type: 'malus', 
        smiles: 0, 
        text: "Passez un tour.", 
        action: { type: 'skip_turn' }, 
        requiresTarget: true 
    },
    'licenciement': { 
        name: "Licenciement", 
        type: 'malus', 
        smiles: 0, 
        text: "Vous perdez votre emploi.", 
        action: { type: 'discard_metier' }, 
        requiresTarget: true 
    },
    'divorce_malus': { 
        name: "Divorce", 
        type: 'malus', 
        smiles: 0, 
        text: "Vous perdez votre mariage.", 
        action: { type: 'discard_mariage' }, 
        requiresTarget: true 
    },
    'impot': { 
        name: "Impôt", 
        type: 'malus', 
        smiles: 0, 
        text: "Jetez votre dernier salaire.", 
        action: { type: 'discard_salaire' }, 
        requiresTarget: true 
    },
    'redoublement': { 
        name: "Redoublement", 
        type: 'malus', 
        smiles: 0, 
        text: "Jetez votre dernière carte Études.", 
        action: { type: 'discard_etudes' }, 
        requiresTarget: true 
    },
    'burn_out': { 
        name: "Burn Out", 
        type: 'malus', 
        smiles: 0, 
        text: "Passez un tour si vous avez un métier.", 
        action: { type: 'skip_turn_if_worker' }, 
        requiresTarget: true 
    },
    'maladie': { 
        name: "Maladie", 
        type: 'malus', 
        smiles: 0, 
        text: "Passez un tour.", 
        action: { type: 'skip_turn' }, 
        requiresTarget: true 
    },
    'prison': { 
        name: "Prison", 
        type: 'malus', 
        smiles: 0, 
        text: "Pour Bandit. Passez 3 tours et perdez votre métier.", 
        action: { type: 'prison' }, 
        requiresTarget: true 
    },
    'attentat': { 
        name: "Attentat", 
        type: 'malus', 
        smiles: 0, 
        text: "Tous les joueurs perdent leurs enfants.", 
        action: { type: 'discard_all_enfants' }, 
        requiresTarget: false 
    },

    // CARTES SPÉCIALES
    'piston': { 
        name: "Piston", 
        type: 'special', 
        category: 'special', 
        smiles: 0, 
        text: "Posez un métier sans les études requises.", 
        action: { type: 'piston' } 
    },
    'troc': { 
        name: "Troc", 
        type: 'special', 
        category: 'special', 
        smiles: 0, 
        text: "Échangez une carte au hasard avec un adversaire.", 
        action: { type: 'troc' }, 
        requiresTarget: true 
    },
    'anniversaire': { 
        name: "Anniversaire", 
        type: 'special', 
        category: 'special', 
        smiles: 0, 
        text: "Un adversaire vous donne un de ses salaires.", 
        action: { type: 'anniversaire' }, 
        requiresTarget: true 
    },
    'vengeance': { 
        name: "Vengeance", 
        type: 'special', 
        category: 'special', 
        smiles: 0, 
        text: "Utilisez un malus reçu contre un adversaire.", 
        action: { type: 'vengeance' } 
    },
    'arc_en_ciel': { 
        name: "Arc-en-ciel", 
        type: 'special', 
        smiles: 0, 
        text: "Jouez jusqu'à 3 cartes.", 
        action: { type: 'arc_en_ciel' } 
    },
    'chance': { 
        name: "Chance", 
        type: 'special', 
        smiles: 0, 
        text: "Choisissez 1 carte parmi les 3 prochaines de la pioche.", 
        action: { type: 'chance' } 
    },
    'tsunami': { 
        name: "Tsunami", 
        type: 'special', 
        smiles: 0, 
        text: "Mélangez et redistribuez toutes les mains.", 
        action: { type: 'tsunami' } 
    },

    // CARTES RÉSUMÉES (pour l'affichage)
    'summary_etudes': { 
        name: "Études", 
        type: 'pro', 
        category: 'etudes', 
        smiles: 0, 
        text: "Niveau total" 
    },
    'summary_salaire': { 
        name: "Salaire", 
        type: 'pro', 
        category: 'salaire', 
        smiles: 0, 
        text: "Revenu total" 
    },
    'summary_flirt': { 
        name: "Flirts", 
        type: 'perso', 
        category: 'flirt', 
        smiles: 0, 
        text: "Nombre total" 
    },
    'summary_enfant': { 
        name: "Enfants", 
        type: 'perso', 
        category: 'enfant', 
        smiles: 0, 
        text: "Nombre total" 
    },
};