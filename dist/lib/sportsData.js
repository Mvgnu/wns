"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allSports = exports.sportsCategories = void 0;
exports.getSportsByCategory = getSportsByCategory;
exports.getSportByValue = getSportByValue;
exports.getSportsAsSelectOptions = getSportsAsSelectOptions;
exports.sportsCategories = [
    "Outdoor & Adventure Activities",
    "Team & Recreational Sports",
    "Racquet & Court Sports",
    "Urban & Street Activities",
    "Fitness & Martial Arts",
    "Other Community-Oriented Hobbies"
];
exports.allSports = [
    // Outdoor & Adventure Activities
    { value: 'mountain_biking', label: 'Mountainbiken', category: 'Outdoor & Adventure Activities', description: 'Radfahren im Gelände auf speziell ausgestatteten Fahrrädern' },
    { value: 'hiking', label: 'Wandern', category: 'Outdoor & Adventure Activities', description: 'Ausgedehnte Spaziergänge in der Natur, oft auf markierten Wegen' },
    { value: 'trail_running', label: 'Trail Running', category: 'Outdoor & Adventure Activities', description: 'Laufen auf Naturpfaden und in unwegsamem Gelände' },
    { value: 'rock_climbing', label: 'Klettern/Bouldern', category: 'Outdoor & Adventure Activities', description: 'Klettern an Felsen oder künstlichen Wänden mit oder ohne Seil' },
    { value: 'kayaking', label: 'Kajak/Kanu', category: 'Outdoor & Adventure Activities', description: 'Paddeln in kleinen Booten auf Flüssen, Seen oder im Meer' },
    { value: 'paddleboarding', label: 'Stand-Up Paddleboarding', category: 'Outdoor & Adventure Activities', description: 'Stehend auf einem Board paddeln' },
    { value: 'paragliding', label: 'Paragliding', category: 'Outdoor & Adventure Activities', description: 'Gleiten mit einem Gleitschirm' },
    { value: 'skiing', label: 'Ski & Snowboard', category: 'Outdoor & Adventure Activities', description: 'Wintersport auf Schnee' },
    { value: 'surfing', label: 'Surfen', category: 'Outdoor & Adventure Activities', description: 'Gleiten auf Meereswellen mit einem Surfbrett' },
    { value: 'orienteering', label: 'Orientierungslauf', category: 'Outdoor & Adventure Activities', description: 'Navigation durch unbekanntes Gelände mithilfe von Karte und Kompass' },
    // Team & Recreational Sports
    { value: 'soccer', label: 'Fußball', category: 'Team & Recreational Sports', description: 'Mannschaftssport mit einem Ball, der mit den Füßen gespielt wird' },
    { value: 'volleyball', label: 'Volleyball', category: 'Team & Recreational Sports', description: 'Ballsport, bei dem zwei Mannschaften einen Ball über ein Netz spielen' },
    { value: 'basketball', label: 'Basketball', category: 'Team & Recreational Sports', description: 'Ballsport, bei dem Punkte durch Werfen des Balls in einen Korb erzielt werden' },
    { value: 'ultimate_frisbee', label: 'Ultimate Frisbee', category: 'Team & Recreational Sports', description: 'Mannschaftssport mit einer fliegenden Scheibe' },
    { value: 'rugby', label: 'Rugby', category: 'Team & Recreational Sports', description: 'Kontaktsport mit ovalem Ball' },
    { value: 'baseball', label: 'Softball/Baseball', category: 'Team & Recreational Sports', description: 'Schlagballspiel mit Schläger und Ball' },
    { value: 'cricket', label: 'Cricket', category: 'Team & Recreational Sports', description: 'Schlagballspiel, das mit Schläger und Ball auf einem Rasenplatz gespielt wird' },
    { value: 'handball', label: 'Handball', category: 'Team & Recreational Sports', description: 'Mannschaftssport, bei dem ein Ball mit den Händen gespielt wird' },
    // Racquet & Court Sports
    { value: 'squash', label: 'Squash', category: 'Racquet & Court Sports', description: 'Rückschlagspiel mit Schlägern und einem kleinen Gummiball' },
    { value: 'tennis', label: 'Tennis', category: 'Racquet & Court Sports', description: 'Rückschlagspiel mit Schlägern und einem Filzball' },
    { value: 'badminton', label: 'Badminton', category: 'Racquet & Court Sports', description: 'Rückschlagspiel mit Schlägern und einem Federball' },
    { value: 'pickleball', label: 'Pickleball', category: 'Racquet & Court Sports', description: 'Rückschlagspiel, das Elemente von Tennis, Badminton und Tischtennis kombiniert' },
    // Urban & Street Activities
    { value: 'skating', label: 'Skateboarding', category: 'Urban & Street Activities', description: 'Fahren und Tricks auf einem Skateboard' },
    { value: 'inline_skating', label: 'Inline Skating', category: 'Urban & Street Activities', description: 'Fahren auf Inline-Skates' },
    { value: 'roller_skating', label: 'Rollschuhlaufen', category: 'Urban & Street Activities', description: 'Fahren auf traditionellen Rollschuhen' },
    { value: 'parkour', label: 'Parkour & Freerunning', category: 'Urban & Street Activities', description: 'Effiziente Bewegung durch urbane Umgebungen, Überwinden von Hindernissen' },
    { value: 'street_hockey', label: 'Street Hockey', category: 'Urban & Street Activities', description: 'Hockey-Variante, die auf Straßen oder Plätzen gespielt wird' },
    // Fitness & Martial Arts
    { value: 'running', label: 'Laufen/Joggen', category: 'Fitness & Martial Arts', description: 'Laufen als Fitness- oder Wettkampfaktivität' },
    { value: 'crossfit', label: 'CrossFit & Gruppentraining', category: 'Fitness & Martial Arts', description: 'Hochintensives funktionelles Training in Gruppen' },
    { value: 'martial_arts', label: 'Kampfsport', category: 'Fitness & Martial Arts', description: 'Verschiedene Kampfkunststile wie Karate, Judo, Taekwondo, BJJ, etc.' },
    { value: 'yoga', label: 'Yoga', category: 'Fitness & Martial Arts', description: 'Körper- und Geistespraktik mit Haltungen, Atmung und Meditation' },
    { value: 'dance', label: 'Tanz & Zumba', category: 'Fitness & Martial Arts', description: 'Rhythmische Bewegung zu Musik als Kunst- oder Fitnessform' },
    // Other Community-Oriented Hobbies
    { value: 'bowling', label: 'Bowling', category: 'Other Community-Oriented Hobbies', description: 'Präzisionssport, bei dem Kugeln auf Pins gerollt werden' },
    { value: 'archery', label: 'Bogenschießen', category: 'Other Community-Oriented Hobbies', description: 'Schießen mit Pfeil und Bogen auf Ziele' },
    { value: 'golf', label: 'Golf', category: 'Other Community-Oriented Hobbies', description: 'Präzisionssport, bei dem ein Ball mit Schlägern in ein Loch gespielt wird' },
    { value: 'obstacle_racing', label: 'Hindernislauf', category: 'Other Community-Oriented Hobbies', description: 'Wettlauf mit verschiedenen Hindernissen (z.B. Spartan Race, Tough Mudder)' },
    { value: 'fishing', label: 'Angeln', category: 'Other Community-Oriented Hobbies', description: 'Fangen von Fischen mit Angel und Köder' },
    { value: 'photography', label: 'Fotografie', category: 'Other Community-Oriented Hobbies', description: 'Bildaufnahme mit einer Kamera' },
    { value: 'other', label: 'Sonstiges', category: 'Other Community-Oriented Hobbies', description: 'Andere Sportarten und Aktivitäten' }
];
// Function to get sports grouped by categories
function getSportsByCategory() {
    const sportsByCategory = {};
    exports.sportsCategories.forEach(category => {
        sportsByCategory[category] = exports.allSports.filter(sport => sport.category === category);
    });
    return sportsByCategory;
}
// Function to get a sport by its value
function getSportByValue(value) {
    return exports.allSports.find(sport => sport.value === value);
}
// Function to get sports as options for select components
function getSportsAsSelectOptions() {
    return exports.allSports.map(sport => ({
        value: sport.value,
        label: sport.label
    }));
}
