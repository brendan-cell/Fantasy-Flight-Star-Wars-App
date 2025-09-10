// Firebase Imports
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, writeBatch, deleteDoc, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};

// --- Firebase Initialization ---
let app;
if (!getApps().length) { app = initializeApp(firebaseConfig); }
else { app = getApp(); }
const auth = getAuth(app);
const db = getFirestore(app);
let userId = null;
let isAuthReady = false;
let isSaving = false;
let currentCharacterData = {};
let currentRollContext = {};

// --- MASTER DATA LISTS ---
const gearCategorization = {
    "Ranged Weapons": { subcategories: ["Ranged (Light)", "Ranged (Heavy)", "Gunnery"], matchKey: 'skill' },
    "Melee Weapons": { subcategories: ["Brawl", "Melee"], matchKey: 'skill' },
    "Armor": { subcategories: ["Attire", "Worn Equipment", "Light", "Heavy", "Beast Armor"], matchKey: 'subcategory' },
    "Medical": { subcategories: ["Medical", "Drugs and Poisons", "Consumables"], matchKey: 'subcategory' },
    "Gear and Equipment": { subcategories: ["Comms", "Cybernetics", "Droids", "Scanners", "Security", "Survival", "Tools"], matchKey: 'subcategory' }
};

const masterGearList = {
    
    // Ranged Weapons
    "'precision-X'-marksman-rifle": { name: "'Precision-X' Marksman Rifle", type:"weapon", category:"Ranged Weapons", skill:"Ranged (Heavy)", damage: 9, crit: 3, range:"Long", price: 1500, encumbrance: 5, rarity: 8, hp: 1, special:"Pierce 1, Stun setting" },
    "renegade-heavy-blaster-pistol": { name: "'Renegade' Heavy Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 8, crit: 3, range: "Medium", encumbrance: 2, hp: 3, price: 950, rarity: 4, special: "Inaccurate 1, Stun setting" },
    "security-s5-heavy-blaster-pistol": { name: "'Security' S-5 Heavy Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 7, crit: 3, range: "Medium", encumbrance: 3, hp: 1, price: 1250, rarity: 7, special: "Stun setting" },
    "subduer-9-riot-blaster-gag": { name: "'Subduer-9' Riot Blaster (GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 6, range: "Long", encumbrance: 6, hp: 3, price: 1250, rarity: 5, special: "Blast 6, Cumbersome 3, Stun Damage" },
    "12-defender": { name: "12 Defender", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 5, range: "Short", encumbrance: 1, hp: 0, price: 25, rarity: 4, special: "Inferior, Limited Ammo 2" },
    "a280-cfe-pistol": { name: "A280-CFE Convertible Heavy Blaster Pistol (pistol mode)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 8, crit: 3, range: "Medium", encumbrance: 3, hp: 1, r: true, price: 1700, rarity: 7, special: "Stun setting" },
    "a280-cfe-rifle": { name: "A280-CFE Convertible Heavy Blaster Pistol (rifle mode)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Long", encumbrance: 3, hp: 1, r: true, price: 1700, rarity: 7, special: "Accurate 1, Pierce 1, Stun setting" },
    "a280c-heavy-blaster-rifle": { name: "A280C Heavy Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 4, range: "Long", encumbrance: 5, hp: 2, price: 1800, rarity: 7, special: "Accurate 1, Cumbersome 3, Stun setting" },
    "a95-stingbeam": { name: "A95 Stingbeam", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Engaged", encumbrance: 1, hp: 0, price: 400, rarity: 5, special: "Stun setting, Vicious 1" },
    "ab-75-bo-rifle": { name: "AB-75 Bo-Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 4, range: "Medium", encumbrance: 4, hp: 4, r: true, price: 900, rarity: 7, special: "Stun Setting" },
    "acp-repeater-gun": { name: "ACP Repeater Gun", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 3, range: "Medium", encumbrance: 3, hp: 1, price: 1000, rarity: 6, special: "Auto-fire, Stun setting" },
    "accelerated-charged-particle-array-gun": { name: "Accelerated Charged Particle Array Gun", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 6, crit: 3, range: "Short", encumbrance: 3, hp: 3, price: 890, rarity: 6, special: "Blast 6, Stun Setting" },
    "ata-pulse-wave-blaster": { name: "ATA Pulse-Wave Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Short", encumbrance: 2, hp: 2, r: true, price: 750, rarity: 6, special: "Vicious 3" },
    "dh-17c-short-carbine": { name: "DH-17c Short Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 4, crit: 3, range: "Short", encumbrance: 3, hp: 2, price: 950, rarity: 6, special: "Auto-fire, Stun setting" },
    "dl-7h-heavy-blaster-pistol": { name: "DL-7H Heavy Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 8, crit: 3, range: "Medium", encumbrance: 2, hp: 2, r: true, price: 850, rarity: 6, special: "Stun setting" },
    "blaster-carbine": { name: "Blaster Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 3, range: "Medium", encumbrance: 3, hp: 4, price: 850, rarity: 5, special: "Stun setting" },
    "blaster-pistol": { name: "Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Medium", price: 400, special: "Stun setting", encumbrance: 1 },
    "blaster-rifle": { name: "Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 3, range: "Long", price: 900, special: "Stun setting", encumbrance: 4 },
    "bola-carbine": { name: "Bola Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Medium", encumbrance: 3, hp: 3, price: 1600, rarity: 6, special: "Accurate 1, Ensnare 1" },
    "boonta-blaster": { name: "Boonta Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Short", encumbrance: 1, hp: 1, price: 1000, rarity: 8, special: "Stun setting" },
    "br-219-heavy-blaster-pistol": { name: "BR-219 Heavy Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 8, crit: 3, range: "Short", encumbrance: 2, hp: 2, r: true, price: 625, rarity: 7, special: "Stun setting, Vicious 2" },
    "c-10-dragoneye-reaper": { name: "C-10 \"Dragoneye Reaper\" Heavy Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 8, crit: 3, range: "Medium", encumbrance: 3, hp: 3, price: 1000, rarity: 7, special: "Stun setting" },
    "cdef-blaster-pistol": { name: "CDEF Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 4, range: "Medium", encumbrance: 1, hp: 1, price: 150, rarity: 4, special: "Inferior, Stun setting" },
    "cr-2-heavy-blaster-pistol": { name: "CR-2 Heavy Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 7, crit: 4, range: "Medium", encumbrance: 2, hp: 2, price: 600, rarity: 5, special: "Stun setting" },
    "cr-8-takedown-rifle": { name: "CR-8 Takedown Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 3, range: "Extreme", encumbrance: 4, hp: 1, r: true, price: 3250, rarity: 7, special: "Accurate 2, Prepare 2, Pierce 2, Slow-Firing 1" },
    "hl-27-light-blaster-pistol": { name: "HL-27 Light Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Medium", encumbrance: 1, hp: 2, price: 450, rarity: 4, special: "Accurate 1, Stun setting" },
    "cs14-ghost-light-blaster-pistol": { name: "CS14 \"Ghost\" Light Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Short", encumbrance: 1, hp: 0, r: true, price: 550, rarity: 6, special: "Stun setting" },
    "cybernetic-weapon-implant-light-blaster-pistol": { name: "Cybernetic Weapon Implant (light blaster pistol)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 4, range: "Medium", encumbrance: 0, hp: 2, price: 4000, rarity: 7, special: "Stun setting" },
    "411-holdout-blaster": { name: "411 Holdout Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 4, crit: 4, range: "Medium", encumbrance: 1, hp: 1, r: true, price: 350, rarity: 5, special: "Stun setting" },
    "dc-12u-beam-rifle": { name: "DC-12U Beam Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 3, range: "Medium", encumbrance: 3, hp: 3, r: true, price: 1600, rarity: 7, special: "Linked 1" },
    "dc-15-blaster-rifle": { name: "DC-15 Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 3, range: "Long", encumbrance: 6, hp: 4, r: true, price: 2200, rarity: 6, special: "Cumbersome 3, Pierce 1, Stun setting" },
    "dc-15a-blaster-carbine-cotr": { name: "DC-15A Blaster Carbine (CotR)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 3, range: "Medium", encumbrance: 3, hp: 4, r: true, price: 1400, rarity: 5, special: "Auto-fire, Pierce 1, Stun setting" },
    "ddc-mr6-modular-rifle": { name: "DDC-MR6 Modular Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 3, range: "Medium", encumbrance: 3, hp: 6, price: 1000, rarity: 6, special: "Stun setting" },
    "de-10-blaster-pistol": { name: "DE-10 Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 2, range: "Long", encumbrance: 1, hp: 2, price: 1400, rarity: 8, special: "Accurate 1, Stun setting" },
    "defender-sporting-blaster-pistol": { name: "Defender Sporting Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Medium", encumbrance: 1, hp: 1, price: 650, rarity: 6, special: "Stun setting, Accurate 1" },
    "dh-17-blaster-carbine-gag": { name: "DH-17 Blaster Carbine (GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Medium", encumbrance: 2, hp: 3, price: 900, rarity: 6, special: "Auto-fire, Inaccurate 2, Stun setting" },
    "dh-x-heavy-blaster-rifle": { name: "DH-X Heavy Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 3, range: "Long", encumbrance: 7, hp: 4, price: 1900, rarity: 6, special: "Cumbersome 3, Pierce 2" },
    "disruptor-pistol": { name: "Disruptor Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 10, crit: 2, range: "Short", encumbrance: 2, hp: 2, r: true, price: 3000, rarity: 6, special: "Vicious 4" },
    "disruptor-rifle": { name: "Disruptor Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 2, range: "Long", encumbrance: 5, hp: 4, r: true, price: 5000, rarity: 6, special: "Cumbersome 2, Vicious 5" },
    "dl-19c-blaster-pistol-gag": { name: "DL-19C Blaster Pistol (GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 4, range: "Medium", encumbrance: 1, hp: 4, price: 1000, rarity: 4, special: "Stun setting" },
    "dls-12-heavy-blaster-carbine": { name: "DLS-12 Heavy Blaster Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 3, range: "Medium", encumbrance: 4, hp: 3, price: 1350, rarity: 7, special: "Auto-fire, Cumbersome 2" },
    "dlt-19d-heavy-blaster-rifle": { name: "DLT-19D Heavy Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 3, range: "Long", encumbrance: 5, hp: 1, r: true, price: 3100, rarity: 9, special: "Accurate 2, Auto-fire, Cumbersome 3, Pierce 2" },
    "dr-45-dragoon-cavalry-blaster-pistol-gag": { name: "DR-45 \"Dragoon\" Cavalry Blaster (pistol mode | GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 8, crit: 3, range: "Medium", encumbrance: 1, hp: 3, price: 1900, rarity: 6, special: "Accurate, Stun setting" },
    "dr-45-dragoon-cavalry-blaster-carbine-gag": { name: "DR-45 \"Dragoon\" Cavalry Blaster (carbine mode | GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Medium", encumbrance: 1, hp: 3, price: 1900, rarity: 6, special: "Accurate, Stun setting" },
    "droid-disruptor": { name: "Droid Disruptor", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Short", encumbrance: 2, hp: 1, price: 800, rarity: 7, special: "Vicious 3 (droid only)" },
    "dueling-pistol-gag": { name: "Dueling Pistol (GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 9, crit: 2, range: "Short", encumbrance: 2, hp: 2, price: 750, rarity: 5, special: "Accurate 1, Limited Ammo 1, Prepare 1" },
    "e-11d-blaster-carbine": { name: "E-11D Blaster Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 3, range: "Medium", encumbrance: 3, hp: 2, r: true, price: 1400, rarity: 9, special: "Stun setting" },
    "e-11s-sniper-rifle-gag": { name: "E-11s Sniper Rifle (GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 3, range: "Extreme", encumbrance: 6, hp: 3, r: true, price: 3500, rarity: 7, special: "Accurate 1, Cumbersome 2, Pierce 3, Slow-Firing 1" },
    "e-22-blaster-rifle": { name: "E-22 Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Medium", encumbrance: 4, hp: 2, r: true, price: 1500, rarity: 8, special: "Cumbersome 2, Linked 1, Stun setting" },
    "e-5-blaster-rifle": { name: "E-5 Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 3, range: "Long", encumbrance: 2, hp: 2, price: 600, rarity: 4, special: "Stun setting" },
    "e5-blaster-carbine": { name: "E-5 Blaster Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 3, range: "Medium", encumbrance: 3, hp: 4, price: 550, rarity: 3, special: "Inaccurate 1, Stun setting" },
    "ee-3-blaster-carbine": { name: "EE-3 Blaster Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Medium", encumbrance: 3, hp: 3, price: 1500, rarity: 6, special: "Auto-fire, Stun setting" },
    "elg-3a-blaster-pistol": { name: "ELG-3A Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 4, range: "Short", encumbrance: 1, hp: 0, price: 400, rarity: 5, special: "Stun setting" },
    "galaar-15-blaster-carbine": { name: "GALAAR-15 Blaster Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 2, range: "Long", encumbrance: 4, hp: 4, price: 1100, rarity: 7, special: "Accurate 1, Stun setting" },
    "glx-firelance-blaster-rifle": { name: "GLX Firelance Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 3, range: "Long", encumbrance: 3, hp: 3, price: 1600, rarity: 6, special: "Auto-fire, Disorient 2, Stun setting" },
    "h-7-equalizer-blaster-pistol": { name: "H-7 \"Equalizer\" Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 7, crit: 2, range: "Medium", encumbrance: 2, hp: 3, price: 1200, rarity: 8, special: "Stun setting, Superior" },
    "hbt-4-hunting-blaster": { name: "HBt-4 Hunting Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 3, range: "Medium", encumbrance: 5, hp: 2, price: 900, rarity: 6, special: "Cumbersome 2, Stun setting" },
    "heartwood-blaster": { name: "Heartwood Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 6, crit: 5, range: "Medium", encumbrance: 3, hp: 1, price: 1000, rarity: 6, special: "Cumbersome 2, Stun 3" },
    "heavy-blaster-pistol": { name: "Heavy Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 7, crit: 3, range: "Medium", encumbrance: 2, hp: 3, price: 700, rarity: 6, special: "Stun setting" },
    "heavy-blaster-rifle": { name: "Heavy Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 3, range: "Long", encumbrance: 6, hp: 4, price: 1500, rarity: 6, special: "Auto-fire, Cumbersome 3" },
    "heavy-repeating-blaster": { name: "Heavy Repeating Blaster", type: "weapon", category: "Ranged Weapons", skill: "Gunnery", damage: 15, crit: 2, range: "Long", encumbrance: 9, hp: 4, r: true, price: 6000, rarity: 8, special: "Auto-fire, Cumbersome 5, Pierce 2, Vicious 1" },
    "hh-50-heavy-blaster-pistol": { name: "HH-50 Heavy Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 7, crit: 3, range: "Short", encumbrance: 3, hp: 2, price: 1300, rarity: 7, special: "Linked 1, Stun Setting, Vicious 1" },
    "hob-heavy-repeating-blaster-gag": { name: "HOB Heavy Repeating Blaster (GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 3, range: "Long", encumbrance: 6, hp: 4, price: 1500, rarity: 6, special: "Auto-fire, Cumbersome 3" },
    "hob-heavy-repeating-blaster-dc": { name: "HOB Heavy Repeating Blaster (DC)", type: "weapon", category: "Ranged Weapons", skill: "Gunnery", damage: 15, crit: 3, range: "Extreme", encumbrance: 10, hp: 4, r: true, price: 6500, rarity: 8, special: "Auto-fire, Cumbersome 6, Pierce 2, Vicious 1" },
    "holdout-blaster": { name: "Holdout Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 4, range: "Short", encumbrance: 1, hp: 1, price: 200, rarity: 4, special: "Stun setting" },
    "imperial-heavy-repeater": { name: "Imperial Heavy Repeater", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 4, range: "Medium", encumbrance: 3, hp: 2, r: true, price: 1500, rarity: 7, special: "Auto-fire, Cumbersome 4" },
    "ionization-blaster-gag-aor": { name: "Ionization Blaster (GaG, AoR)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 10, crit: 5, range: "Short", encumbrance: 3, hp: 3, price: 250, rarity: 3, special: "Disorient 5, Ion" },
    "ir-5-intimidator-blaster-pistol": { name: "IR-5 \"Intimidator\" Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Medium", encumbrance: 2, hp: 2, r: true, price: 750, rarity: 6, special: "Auto-fire, Inaccurate 1" },
    "j-10-dual-blaster-cannon": { name: "J-10 Dual Blaster Cannon", type: "weapon", category: "Ranged Weapons", skill: "Gunnery", damage: 13, crit: 2, range: "Long", encumbrance: 8, hp: 3, r: true, price: 6750, rarity: 7, special: "Cumbersome 5, Inaccurate 1, Linked 1" },
    "ko-2-heavy-stun-pistol": { name: "KO-2 Heavy Stun Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 8, crit: 0, range: "Short", encumbrance: 2, hp: 3, price: 650, rarity: 5, special: "Stun Damage" },
    "l7-liquidsilver-light-blaster-pistol-gag": { name: "L7 Liquidsilver Light Blaster Pistol (GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Medium", encumbrance: 1, hp: 1, price: 1000, rarity: 5, special: "Accurate 1, Pierce 2" },
    "lbr-9-stun-rifle": { name: "LBR-9 Stun Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 0, range: "Long", encumbrance: 6, hp: 4, price: 2800, rarity: 4, special: "Disorient 2, Stun Damage" },
    "ld-1-target-rifle": { name: "LD-1 Target Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 4, range: "Extreme", encumbrance: 6, hp: 3, price: 1275, rarity: 7, special: "Accurate 2, Cumbersome 3, Pierce 3, Slow-Firing 1" },
    "light-blaster-pistol": { name: "Light Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 4, range: "Medium", encumbrance: 1, hp: 2, price: 300, rarity: 4, special: "Stun setting" },
    "light-repeating-blaster": { name: "Light Repeating Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 11, crit: 3, range: "Long", encumbrance: 7, hp: 4, r: true, price: 2250, rarity: 7, special: "Auto-fire, Cumbersome 4, Pierce 1" },
    "lj-40-concussion-carbine": { name: "LJ-40 Concussion Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Short", encumbrance: 4, hp: 1, r: true, price: 2500, rarity: 8, special: "Blast 3, Concussive 1, Knockdown, Limited Ammo 3" },
    "lj-50-concussion-rifle": { name: "LJ-50 Concussion Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 2, range: "Medium", encumbrance: 6, hp: 2, r: true, price: 2000, rarity: 7, special: "Blast 4, Concussive 2, Cumbersome 3, Knockdown, Limited Ammo 4" },
    "lucky-blaster": { name: "Lucky Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 4, range: "Medium", encumbrance: 1, hp: 2, price: 400, rarity: 10, special: "Stun setting" },
    "m-300-hunting-blaster-gag": { name: "M-300 Hunting Blaster (GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Extreme", encumbrance: 4, hp: 1, price: 1600, rarity: 6, special: "Accurate 1, Cumbersome 2, Pierce 2, Stun Damage" },
    "model-44-blaster-pistol": { name: "Model 44 Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Medium", encumbrance: 1, hp: 4, price: 500, rarity: 4, special: "Stun setting" },
    "military-holdout-blaster": { name: "Military Holdout Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Short", encumbrance: 1, hp: 0, price: 500, rarity: 5, special: "Stun setting" },
    "model-53-quicktrigger-blaster-pistol": { name: "Model 53 \"Quicktrigger\" Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Medium", encumbrance: 1, hp: 4, price: 450, rarity: 4, special: "Stun setting" },
    "model-80-blaster-pistol": { name: "Model 80 Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 2, range: "Medium", encumbrance: 2, hp: 3, price: 550, rarity: 5, special: "Stun setting" },
    "model-q4-quickfire-holdout-blaster": { name: "Model Q4 Quickfire Holdout Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Short", encumbrance: 1, hp: 0, price: 250, rarity: 4, special: "Stun setting" },
    "model-1-nova-viper-blaster-pistol": { name: "Model-1 \"Nova Viper\" Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 7, crit: 3, range: "Medium", encumbrance: 2, hp: 2, price: 4500, rarity: 9, special: "Accurate 2, Pierce 2, Stun setting" },
    "mon-calamari-battle-baton": { name: "Mon Calamari Battle Baton", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 4, range: "Medium", encumbrance: 1, hp: 1, price: 250, rarity: 6, special: "Stun setting" },
    "mon-calamari-spear-blaster": { name: "Mon Calamari Spear Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Long", encumbrance: 5, hp: 3, price: 1350, rarity: 5, special: "Stun setting" },
    "mr-90-proton-rifle-gag": { name: "MR-90 Proton Rifle (GaG)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 2, range: "Extreme", encumbrance: 6, hp: 3, r: true, price: 3100, rarity: 8, special: "Accurate 1, Cumbersome 3, Knockdown" },
    "mwc-35c-staccato-lightning-repeating-cannon-standard": { name: "MWC-35c \"Staccato Lightning\" Repeating Cannon (standard mode)", type: "weapon", category: "Ranged Weapons", skill: "Gunnery", damage: 9, crit: 3, range: "Long", encumbrance: 5, hp: 2, price: 3000, rarity: 7, special: "Auto-fire, Cumbersome 3, Pierce 2, Vicious 1" },
    "mwc-35c-staccato-lightning-repeating-cannon-single": { name: "MWC-35c \"Staccato Lightning\" Repeating Cannon (single-shot mode)", type: "weapon", category: "Ranged Weapons", skill: "Gunnery", damage: 13, crit: 3, range: "Long", encumbrance: 5, hp: 2, price: 3000, rarity: 7, special: "Cumbersome 3, Pierce 4, Prepare 1, Vicious 2" },
    "nightstinger-blaster-rifle": { name: "Nightstinger Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 2, range: "Extreme", encumbrance: 7, hp: 4, price: 6500, rarity: 9, special: "Accurate 2, Cumbersome 3, Pierce 1, Stun setting" },
    "ok-98-blaster-carbine-stock": { name: "OK-98 Blaster Carbine (stock)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 3, range: "Medium", encumbrance: 4, hp: 3, price: 1100, rarity: 5, special: "Stun setting" },
    "ok-98-blaster-carbine-modified": { name: "OK-98 Blaster Carbine (modified)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 11, crit: 3, range: "Medium", encumbrance: 4, hp: 3, price: 1100, rarity: 5, special: "Stun setting" },
    "pb08-heavy-blaster-pistol": { name: "PB08 Heavy Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Medium", encumbrance: 2, hp: 2, price: 800, rarity: 6, special: "Stun setting" },
    "pistol-hilt-stun-blaster": { name: "Pistol Hilt (stun blaster)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Short", encumbrance: 0, hp: 0, price: 750, rarity: 5, special: "Stun Damage" },
    "pulse-cannon": { name: "Pulse Cannon", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 3, range: "Extreme", encumbrance: 5, hp: 1, r: true, price: 2750, rarity: 6, special: "Cumbersome 3, Pierce 2, Slow-Firing 1" },
    "reciprocating-quad-blaster-cannon": { name: "Reciprocating Quad Blaster Cannon", type: "weapon", category: "Ranged Weapons", skill: "Gunnery", damage: 10, crit: 2, range: "Long", encumbrance: 8, hp: 4, r: true, price: 9950, rarity: 8, special: "Auto-fire (Only), Breach 1, Cumbersome 4, Inaccurate 1, Prepare 2" },
    "se-14c-blaster-pistol": { name: "SE-14C Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 4, range: "Short", encumbrance: 1, hp: 2, price: 650, rarity: 6, special: "Auto-fire, Stun setting" },
    "secondary-ion-blaster": { name: "Secondary Ion Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 5, range: "Short", encumbrance: 2, hp: 0, price: 400, rarity: 6, special: "Disorient 5, Ion" },
    "site-145-replica-blaster-pistol": { name: "Site-145 Replica Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Medium", encumbrance: 1, hp: 0, r: true, price: 1750, rarity: 8, special: "Stun setting" },
    "skz-sporting-blaster": { name: "SKZ Sporting Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 4, range: "Long", encumbrance: 3, hp: 4, price: 600, rarity: 4, special: "Stun setting" },
    "spukami-pocket-blaster": { name: "Spukami Pocket Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Short", encumbrance: 1, hp: 1, price: 200, rarity: 2, special: "Stun setting" },
    "ssb-1-static-pistol": { name: "SSB-1 Static Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 2, crit: 4, range: "Short", encumbrance: 2, hp: 1, price: 850, rarity: 7, special: "Disorient 1, Stun 8" },
    "mk-ii-paladin-blaster-rifle": { name: "Mk II \"Paladin\" Blaster Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Long", encumbrance: 4, hp: 2, price: 3250, rarity: 8, special: "Auto-fire, Pierce 1, Stun setting, Superior" },
    "st-m40-heavy-repeating-blaster-pistol": { name: "ST-M40 Heavy Repeating Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Short", encumbrance: 2, hp: 2, price: 2100, rarity: 5, special: "Auto-fire, Inaccurate 1" },
    "sx-21-pump-action-scatter-blaster": { name: "SX-21 Pump-Action Scatter Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 3, range: "Short", encumbrance: 6, hp: 4, price: 1200, rarity: 6, special: "Blast 6, Cumbersome 3, Prepare 1" },
    "t-7-ion-disruptor": { name: "T-7 Ion Disruptor", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 12, crit: 2, range: "Long", encumbrance: 6, hp: 2, r: true, price: 8000, rarity: 9, special: "Blast 6, Breach 2, Cumbersome 3, Slow-Firing 1, Vicious 6" },
    "idx-9-ion-stunner": { name: "IDX-9 Ion Stunner", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 7, crit: 0, range: "Medium", encumbrance: 1, hp: 2, price: 300, rarity: 4, special: "Ion, Stun Damage" },
    "variable-holdout-blaster": { name: "Variable Holdout Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: '1-7', crit: 4, range: "Short", encumbrance: 1, hp: 0, price: 400, rarity: 7, special: "Limited Ammo 12" },
    "ves-700-pulse-rifle": { name: "VES-700 Pulse Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Medium", encumbrance: 4, hp: 3, price: 950, rarity: 6, special: "Blast 6, Stun setting" },
    "vx-sidewinder-repeating-blaster": { name: "VX \"Sidewinder\" Repeating Blaster", type: "weapon", category: "Ranged Weapons", skill: "Gunnery", damage: 12, crit: 3, range: "Long", encumbrance: 8, hp: 4, r: true, price: 3350, rarity: 7, special: "Auto-fire, Cumbersome 5, Pierce 1, Vicious 1" },
    "weequay-blaster-lance": { name: "Weequay Blaster Lance", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Extreme", encumbrance: 5, hp: 2, price: 850, rarity: 6, special: "Accurate 1, Cumbersome 2" },
    "westar-35-blaster-pistol": { name: "WESTAR-35 Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 2, range: "Medium", encumbrance: 1, hp: 3, price: 1200, rarity: 8, special: "Accurate 1, Stun setting" },
    "wrist-blaster": { name: "Wrist Blaster", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 3, range: "Engaged", encumbrance: 1, hp: 0, r: true, price: 1200, rarity: 6, special: "Limited Ammo 1, Pierce 4" },
    "x-30-lancer-precision-blaster-pistol": { name: "X-30 \"Lancer\" Precision Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 4, range: "Long", encumbrance: 1, hp: 3, price: 1000, rarity: 5, special: "Accurate 1, Pierce 2" },
    "xl-2-flashfire-light-blaster-pistol": { name: "XL-2 \"Flashfire\" Light Blaster Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Medium", encumbrance: 1, hp: 3, price: 450, rarity: 5, special: "Disorient 1, Stun setting" },
    "aj-23-concussive-rifle": { name: "AJ-23 Concussive Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 5, range: "Short", encumbrance: 4, hp: 2, price: 8000, rarity: 4, special: "Blast 7, Concussive 2, Inaccurate 2, Knockdown, Stun Damage"},
    "d-29-repulsor-rifle": {name: "D-29 Repulsor Rifle", type: "weapon", category: "Ranged Weapons", skill: "Gunnery", damage: 8, crit: 4, range: "Medium", encumbrance: 3, hp:3, price: 1550, rarity: 7, special: "Disorient 3, Knockdown, Stun Damage"},
    "swe2-sonicsrifle": {name: "SWE/2 Sonic Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 6, range: "Long", encumbrance: 4, hp: 0, price: 1200, rarity: 6, special: "Concussive 1, Slow-Firing 1, Stun Damage"},
    "aa8-8-gauge-scatter-gun": {name: "AA8 8-Gauge Scatter Gun", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 6, range: "Short", encumbrance: 3, hp: 2, price: 550, rarity: 4, special: "Blast 3, Knockdown"},
    "berserker-rifle": {name: "Berserker Rifle", type: "weapon", category: "Ranged Weapons", skill: "", damage: 7, crit: 4, range: "Medium", encumbrance: 4, hp: 0, r: true, price: 600, rarity: 5, special: "Burn 1, Cumbersome 3, Disorient 1"},
    "model-57-homesteader-hunting-rifle-(standard-rounds)": {name: 'Model 57 "Homesteader" Hunting Rifle (standard rounds)', type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 5, range: "Long", encumbrance: 5, hp: 4, price: 500, rarity: 6, special: "Accurate 1, Cumbersome 2"},
    "model-57-homesteader-hunting-rifle-(detonator-rounds)": {name: 'Model 57 "Homesteader" Hunting Rifle (detonator rounds)', type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 5, range: "Long", encumbrance: 5, hp: 4, price: 500, rarity: 6, special: "Accurate 1, Blast 4,Cumbersome 2, Knockdown"},
    "df-d1-duo-flechette-rifle": {name: "DF-D1 Duo-Flechette Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 9, crit: 3, range: "Short", encumbrance: 3, hp: 3, r: true, price: 1000, rarity: 5, special: "Blast 4, Limited Ammo 5, Linked 1, Vicious 2"},
    "model-77-air-rifle": {name: "Model 77 Air Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 6, crit: "N/A", range: "Long", encumbrance: 3, hp: 3, price: 1100, rarity: 6, special: "Pierce 4, Stun Damage"},
    "fwg-5-flechette-pistol": {name: "FWG-5 Flechette Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (light)", damage: 6, crit: 5, range: "Short", encumbrance: 1, hp: 2, r: true, price: 825, rarity: 2, special: "Guided 3, Limited Ammo 3"},
    "fwg-7-flechette-smart-carbine": {name: "FWG-7 Flechette Smart Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 5, crit: 3, range: "Medium", encumbrance: 5, hp: 3, price: 1800, rarity: 7, special: "Blast 4, Guided 2, Pierce 3"},
    "fyr-assault-carbine": {name: "Fyr Assault Carbine", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 6, crit: 5, range: "short", encumbrance: 4, hp: 1, price: 250, rarity: 4, special: "Auto-fire, Inaccurate 1"},
    'kd-30-"dissuader"-pistol': {name: 'KD-30 "Dissuader" Pistol', type: "weapon", category: "Ranged Weapons", skill: "Ranged (light)", damage: 4, crit: 5, range: "Short", encumbrance: 2, hp: 0, price: 350, rarity: 6, special: "Pierce 1, Vicious 1"},
    'mark-V-"sand-panther"-hunting-rifle': {name: 'Mark V "Sand Panther" Hunting Rifle', type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 3, range: "Long", encumbrance: 5, hp: 2, price: 1750, rarity: 7, special: ""},
    "model-38-sharpshooters-rifle-(standard-penetrator-ammunition)": {name: "Model 38 Sharpshooter's Rifle (standard penetrator ammunition)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Extreme", encumbrance: 5, hp: 4, price: 3000, rarity: 6, special: "Accurate 2, Pierce 3"},
    "model-38-sharpshooters-rifle-(standard-penetrator-ammunition)": {name: "Model 38 Sharpshooter's Rifle (standard penetrator ammunition)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: 3, range: "Extreme", encumbrance: 5, hp: 4, price: 3000, rarity: 6, special: "Accurate 2, Blast 5, Knockdown"},
    'model-4-"Thunderhead"-scatter-gun': {name: 'Model 4 "Thunderhead" Scatter Gun', type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 4, range: "Short", encumbrance: 4, hp: 3, price: 700, rarity: 5, special: "Blast 5, Knockdown, Vicious 1"},
    "panic-pistol": {name: "Panic Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: 5, range: "Short", encumbrance: 1, hp: 0, price: 400, rarity: 3, special: "Inaccurate 1"},
    "sh-9-slugthrower-pistol": {name: "SH-9 Slugthrower Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 4, crit: 5, range: "Short", encumbrance: 1, hp: 0, price: 250, rarity: 4, special: "Limited Ammo 5, Pierce 2"},
    "slugthrower-pistol": {name: "Slugthrower Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 4, crit: 5, range: "Short", encumbrance: 1, hp: 0, price: 100, rarity: 3, special: ""},
    "sslugthrower-rifle": {name: "Slugthrower Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 5, range: "Medium", encumbrance: 5, hp: 1, price: 250, rarity:3 , special: "Cumbersome 2"},
    "verpine-heavy-shatter-sifle": {name: "Verpine Heavy Shatter Rifle", type: "weapon", category: "Ranged Weapons", skill: "Gunnery", damage: 15, crit: 2, range: "Extreme", encumbrance: 4, hp: 4, price: 45000, rarity: 8, special: "Accurate 2, Knockdown, Pierce 6"},
    "verpine-shatter-pistol": {name: "Verpine Shatter Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 8, crit: 3, range: "Medium", encumbrance: 1, hp: 2, price: 15000, rarity: 8, special: "Knockdown, Pierce 2"},
    "verpine-shatter-pistol": { name: "Verpine Shatter Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 8, crit: 3, range: "Medium", encumbrance: 1, hp: 2, price: 15000, rarity: 8, special: "Knockdown, Pierce 2" },
    "verpine-shatter-rifle": { name: "Verpine Shatter Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 12, crit: 3, range: "Extreme", encumbrance: 3, hp: 3, price: 30000, rarity: 8, special: "Knockdown, Pierce 4" },
    "vodran-hunting-rifle": { name: "Vodran Hunting Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: 4, range: "Long", encumbrance: 4, hp: 2, price: 800, rarity: 7, special: "Cumbersome 2" },
    "model-c-fiver-self-defense-pistol": { name: 'Model C "Fiver" Self-Defense Pistol', type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 4, range: "Short", encumbrance: 2, hp: 1, price: 200, rarity: 4, special: "Accurate 1, Limited Ammo 5" },
    "z-6-rotary-blaster-cannon": { name: "Z-6 Rotary Blaster Cannon", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 12, crit: 4, range: "Long", encumbrance: 6, hp: 3, price: 3000, rarity: 7, special: "Auto-fire (Only), Cumbersome 3, Prepare 1" },
    "dart-gun-gear-attachment": { name: "Dart Gun (gear attachment)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 2, crit: 5, range: "Short", encumbrance: 0, hp: 0, price: 200, rarity: 4, special: "Limited Ammo 1, Pierce 1" },
    "gungan-atlatl-plasma-ball": { name: "Gungan Atlatl (plasma ball)", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Medium", encumbrance: 2, hp: 0, price: 100, rarity: 7, special: "Accurate 1, Burn 1, Ion, Limited Ammo 1" },
    "m9-boomer-heavy-pistol": { name: 'M9 "Boomer" Heavy Pistol', type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Medium", encumbrance: 3, hp: 2, price: 1000, rarity: 6, special: "Blast 5, Cumbersome 2, Inaccurate 1" },
    "micro-rocket-launcher-pistol": { name: "Micro-Rocket Launcher Pistol", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 0, crit: null, range: "Medium", encumbrance: 3, hp: 0, price: 500, rarity: 7, special: "" },
    "rlr-331-bulldog-rocket-rifle": { name: 'RLR-331 "Bulldog" Rocket Rifle', type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 10, crit: 4, range: "Long", encumbrance: 6, hp: 3, price: 2200, rarity: 7, special: "Blast 8, Cumbersome 3, Guided 3, Limited Ammo 6" },
    "gungan-plasma-ball": { name: "Gungan Plasma Ball", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 5, crit: 3, range: "Short", encumbrance: 0, hp: 0, price: 20, rarity: 7, special: "Burn 1, Ion, Limited Ammo 1" },
    "cryoban-rifle": { name: "CryoBan Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 6, crit: null, range: "Medium", encumbrance: 2, hp: 1, price: 450, rarity: 6, special: "Ensnare 1, Pierce 5, Stun Damage" },
    "spray-rifle": { name: "Spray Rifle", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 7, crit: null, range: "Medium", encumbrance: 4, hp: 1, price: 2700, rarity: 6, special: "Burn 3, Limited Ammo 3, Pierce 3, Prepare 1, Stun Damage" },
    "ao14-aranea-net-gun-ss": { name: 'AO14 "Aranea" Net Gun (SS)', type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 3, crit: null, range: "Medium", encumbrance: 4, hp: 2, price: 775, rarity: 5, special: "Ensnare 5, Limited Ammo 1" },
    "ao14-aranea-net-gun-etu": { name: 'AO14 "Aranea" Net Gun (EtU)', type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 3, crit: null, range: "Medium", encumbrance: 4, hp: 2, price: 750, rarity: 5, special: "Ensnare 5" },
    "r-88-suppressor-riot-rifle": { name: 'R-88 "Suppressor" Riot Rifle', type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 8, crit: null, range: "Medium", encumbrance: 4, hp: 2, price: 2000, rarity: 5, special: "Blast 5, Disorient 3, Stun Damage" },
    "tangle-gun-7": { name: "Tangle Gun 7", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 1, crit: 4, range: "Short", encumbrance: 2, hp: 1, price: 500, rarity: 5, special: "Ensnare 3" },
    "ion-thruster-gun": { name: "Ion Thruster Gun", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 5, crit: 4, range: "Short", encumbrance: 8, hp: 0, price: 300, rarity: 2, special: "Concussive 1, Cumbersome 5, Ion, Prepare 1" },
    "multi-goo-gun": { name: "Multi-Goo Gun", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 2, crit: null, range: "Short", encumbrance: 2, hp: 1, price: 250, rarity: 1, special: "Disorient 1, Ensnare 4, Knockdown" },
    "repulsor-gun": { name: "Repulsor Gun", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Heavy)", damage: 3, crit: 5, range: "Short", encumbrance: 5, hp: 0, price: 200, rarity: 3, special: "Knockdown" },
    "rivet-gun": { name: "Rivet Gun", type: "weapon", category: "Ranged Weapons", skill: "Ranged (Light)", damage: 4, crit: 3, range: "Engaged", encumbrance: 4, hp: 1, price: 900, rarity: 1, special: "Ensnare 1, Inaccurate 1, Limited Ammo 1" },
    
    //Melee
    "vibrosword": { name: "Vibrosword", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 2, range: "Engaged", encumbrance: 3, hp: 3, price: 750, rarity: 5, special: "Defensive 1, Pierce 2, Vicious 1" },
    "storm-charge-suit-gag-shock-gloves": { name: '"Storm" Charge Suit (GaG | shock gloves)', type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 0, crit: 5, range: "Engaged", encumbrance: 3, hp: 0, price: 2000, rarity: 2, special: "Stun 3" },
    "storm-charge-suit-dc-shock-gloves": { name: '"Storm" Charge Suit (DC | shock gloves)', type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 0, crit: 5, range: "Engaged", encumbrance: 3, hp: 0, price: 2000, rarity: 6, special: "Stun 3" },
    "backhand-shock-gloves": { name: "Backhand Shock Gloves", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 1, crit: 3, range: "Engaged", encumbrance: 0, hp: 2, price: 2000, rarity: 4, special: "Concussive 1, Slow-Firing 1, Stun Damage" },
    "blast-knuckles": { name: "Blast Knuckles", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 4, crit: 4, range: "Engaged", encumbrance: 2, hp: 0, price: 500, rarity: 6, special: "Inaccurate 1" },
    "brass-knuckles": { name: "Brass Knuckles", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 1, crit: 4, range: "Engaged", encumbrance: 1, hp: 0, price: 25, rarity: 0, special: "Disorient 3" },
    "crushgaunts": { name: "Crushgaunts", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 4, crit: 2, range: "Engaged", encumbrance: 1, hp: 0, price: 5000, rarity: 8, special: "Cortosis, Sunder, Vicious 2" },
    "exoglove": { name: "Exoglove", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 2, crit: 4, range: "Engaged", encumbrance: 2, hp: 1, price: 2000, rarity: 4, special: "Knockdown" },
    "garrote": { name: "Garrote", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: null, crit: null, range: "Engaged", encumbrance: 1, hp: 0, price: 50, rarity: 2, special: "Stun setting" },
    "garrote-chrono": { name: "Garrote Chrono", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: null, crit: null, range: "Engaged", encumbrance: 0, hp: null, price: 100, rarity: 5, special: "Stun setting" },
    "koromondain-svt-300-stun-cloak": { name: "Koromondain SVT-300 Stun Cloak", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 7, crit: 3, range: "Engaged", encumbrance: 2, hp: 0, price: 1500, rarity: 4, special: "Limited Ammo 3, Stun Damage" },
    "kyuzo-petars-single": { name: "Kyuzo Petars (single)", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 2, crit: 3, range: "Engaged", encumbrance: 1, hp: 0, price: 2000, rarity: 7, special: "Pierce 3, Vicious 2" },
    "kyuzo-petars-pair": { name: "Kyuzo Petars (pair)", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 2, crit: 3, range: "Engaged", encumbrance: 1, hp: 0, price: 2000, rarity: 7, special: "Defensive 1, Pierce 3, Sunder, Vicious 2" },
    "needle-gloves": { name: "Needle Gloves", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 0, crit: 5, range: "Engaged", encumbrance: 1, hp: 0, price: 750, rarity: 8, special: "" },
    "refined-cortosis-gauntlets": { name: "Refined Cortosis Gauntlets", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 1, crit: 4, range: "Engaged", encumbrance: 3, hp: 2, price: 1000, rarity: 7, special: "Cortosis" },
    "reinforced-gauntlets": { name: "Reinforced Gauntlets", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 1, crit: 4, range: "Engaged", encumbrance: null, hp: null, price: 250, rarity: 2, special: "Disorient 3" },
    "repulsor-fist": { name: "Repulsor Fist", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 8, crit: 3, range: "Engaged", encumbrance: null, hp: null, price: 4750, rarity: 7, special: "Concussive 1, Slow-Firing 2" },
    "retractable-garrote-entry": { name: "Retractable Garrote (entry)", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: null, crit: null, range: "Engaged", encumbrance: null, hp: null, price: 200, rarity: 6, special: "Stun setting" },
    "retractable-garrote-table": { name: "Retractable Garrote (table)", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: null, crit: null, range: "Engaged", encumbrance: null, hp: null, price: 300, rarity: 6, special: "Stun setting" },
    "s-1-vamblade-single": { name: "S-1 Vamblade (single)", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 1, crit: 3, range: "Engaged", encumbrance: 2, hp: 1, price: 500, rarity: 4, special: "Defensive 1" },
    "s-1-vamblade-pair": { name: "S-1 Vamblade (pair)", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 1, crit: 3, range: "Engaged", encumbrance: 2, hp: 1, price: 500, rarity: 4, special: "Accurate 1, Defensive 1, Sunder" },
    "sap-gloves": { name: "Sap Gloves", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 2, crit: 5, range: "Engaged", encumbrance: 1, hp: 1, price: 50, rarity: 4, special: "Concussive 1" },
    "shield-gauntlet": { name: "Shield Gauntlet", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 1, crit: 5, range: "Engaged", encumbrance: 1, hp: 0, price: 1500, rarity: 8, special: "Deflection 2, Stun Damage" },
    "shock-boots": { name: "Shock Boots", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 0, crit: 5, range: "Engaged", encumbrance: 2, hp: 0, price: 1250, rarity: 5, special: "Disorient 3, Stun 3" },
    "shock-gloves": { name: "Shock Gloves", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 0, crit: 5, range: "Engaged", encumbrance: 0, hp: 1, price: 300, rarity: 2, special: "Stun 3" },
    "vibroknucklers": { name: "Vibroknucklers", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 1, crit: 2, range: "Engaged", encumbrance: 1, hp: 0, price: 350, rarity: 4, special: "Pierce 1, Vicious 1" },
    "czerhander-vx-vibro-greatsword": { name: '"Czerhander" VX Vibro-greatsword', type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 2, range: "Engaged", encumbrance: 4, hp: 3, price: 900, rarity: 6, special: "Defensive 2, Pierce 2, Vicious 2" },
    "akrab-clip-point-vibrodagger": { name: "aKraB Clip-point Vibrodagger", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 2, range: "Engaged", encumbrance: 1, hp: 1, price: 550, rarity: 5, special: "Pierce 3, Vicious 1" },
    "ab-75-bo-rifle-melee-mode": { name: "AB-75 Bo-Rifle (melee mode)", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 4, range: "Engaged", encumbrance: 4, hp: 4, price: 900, rarity: 7, special: "Stun 5, Stun setting" },
    "activv1-riot-shield": { name: "Activv1 Riot Shield", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 0, crit: 6, range: "Engaged", encumbrance: 5, hp: 1, price: 300, rarity: 4, special: "Cumbersome 3, Defensive 2, Deflection 2, Disorient 1" },
    "ancient-sword": { name: "Ancient Sword", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 2, crit: 3, range: "Engaged", encumbrance: 3, hp: 1, price: 350, rarity: 8, special: "Defensive 1" },
    "arggarok-gag": { name: "Arg'garok (GaG)", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 5, crit: 3, range: "Engaged", encumbrance: 5, hp: 3, price: 1000, rarity: 7, special: "Cumbersome 5, Inaccurate 1, Pierce 1, Sunder" },
    "ashla-staff": { name: "Ashla Staff", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Engaged", encumbrance: 4, hp: 2, price: 3000, rarity: 7, special: "" },
    "bardottan-electrolance": { name: "Bardottan Electrolance", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Engaged", encumbrance: 3, hp: 2, price: 300, rarity: 5, special: "Defensive 2, Stun setting" },
    "bayonet": { name: "Bayonet", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: 1, hp: null, price: 50, rarity: 1, special: "" },
    "beastmasters-vibro-glaive": { name: "Beastmaster's Vibro-glaive", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 2, range: "Engaged", encumbrance: 3, hp: 3, price: 975, rarity: 6, special: "Defensive 2, Pierce 3" },
    "beskad": { name: "Beskad", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 2, range: "Engaged", encumbrance: 4, hp: 2, price: 6500, rarity: 8, special: "Cortosis, Cumbersome 3, Sunder, Vicious 3" },
    "blade-breaker": { name: "Blade-breaker", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 0, crit: 4, range: "Engaged", encumbrance: 1, hp: 1, price: 250, rarity: 5, special: "Defensive 2, Pierce 1, Sunder" },
    "boot-blade-gag": { name: "Boot Blade (GaG)", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: 2, hp: null, price: 100, rarity: 5, special: "" },
    "ceremonial-blade": { name: "Ceremonial Blade", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Engaged", encumbrance: 2, hp: 3, price: 650, rarity: 7, special: "Defensive 1" },
    "combat-knife": { name: "Combat Knife", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: 1, hp: 0, price: 25, rarity: 1, special: "" },
    "concealed-escape-kit-monoknife": { name: "Concealed Escape Kit (monoknife)", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: null, hp: null, price: 450, rarity: 7, special: "Pierce 1" },
    "corellian-cutlass": { name: "Corellian Cutlass", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Engaged", encumbrance: 2, hp: 1, price: 300, rarity: 3, special: "Defensive 1, Vicious 1" },
    "cortosis-shield": { name: "Cortosis Shield", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 0, crit: 6, range: "Engaged", encumbrance: 4, hp: 0, price: 900, rarity: 7, special: "Cortosis, Cumbersome 3, Defensive 2, Deflection 2" },
    "cortosis-staff-refined": { name: "Cortosis Staff (Refined)", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 5, range: "Engaged", encumbrance: 4, hp: 2, price: 2500, rarity: 7, special: "Cortosis" },
    "cortosis-sword": { name: "Cortosis Sword", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Engaged", encumbrance: 3, hp: 2, price: 1350, rarity: 7, special: "Cortosis, Defensive 1" },
    "cs-12-stun-master": { name: "CS-12 Stun Master", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 6, crit: 3, range: "Engaged", encumbrance: 1, hp: 0, price: 575, rarity: 3, special: "Disorient 2, Stun Damage" },
    "czerka-peacekeeper-stun-baton": { name: 'Czerka "Peacekeeper" Stun Baton', type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 4, range: "Engaged", encumbrance: 3, hp: 2, price: 500, rarity: 3, special: "Cumbersome 3, Disorient 2, Stun 3" },
    "diiro": { name: "Diiro", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: 2, hp: 0, price: 250, rarity: 2, special: "Defensive 1" },
    "double-bladed-vibrosword": { name: "Double-Bladed Vibrosword", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 2, range: "Engaged", encumbrance: 4, hp: 3, price: 1300, rarity: 6, special: "Defensive 1, Linked 1, Pierce 2, Unwieldy 3, Vicious 1" },
    "duskblade": { name: "Duskblade", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 3, range: "Engaged", encumbrance: 2, hp: 1, price: 1800, rarity: 8, special: "Pierce 2, Superior" },
    "electronet-gag": { name: "Electronet (GaG)", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 6, crit: 6, range: "Medium", encumbrance: 2, hp: 0, price: 350, rarity: 6, special: "Ensnare 5, Knockdown, Limited Ammo 1, Stun Damage" },
    "electronet-ktp": { name: "Electronet (KtP)", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 6, crit: 6, range: "Engaged", encumbrance: 2, hp: 0, price: 350, rarity: 6, special: "Ensnare 5, Knockdown, Limited Ammo 1, Stun Damage" },
    "electrostaff": { name: "Electrostaff", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 4, crit: 3, range: "Engaged", encumbrance: 4, hp: 3, price: 4500, rarity: 6, special: "Cortosis, Cumbersome 3, Linked 1, Stun setting, Unwieldy 3" },
    "energy-buckler": { name: "Energy Buckler", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 0, crit: 5, range: "Engaged", encumbrance: 2, hp: 1, price: 1000, rarity: 7, special: "Concussive 1, Defensive 1, Deflection 1" },
    "explorers-knife": { name: "Explorer's Knife", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: 2, hp: 0, price: 100, rarity: 3, special: "Vicious 1" },
    "fear-stick": { name: "Fear Stick", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 5, crit: null, range: "Engaged", encumbrance: 1, hp: 0, price: 1500, rarity: 8, special: "Limited Ammo 3, Pierce 1, Stun Damage" },
    "findsman-shockprod": { name: "Findsman Shockprod", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 5, range: "Engaged", encumbrance: 3, hp: 1, price: 1400, rarity: 6, special: "Cortosis, Defensive 1, Stun Damage" },
    "flashstick": { name: "Flashstick", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: null, range: "Engaged", encumbrance: 2, hp: 2, price: 375, rarity: 4, special: "Disorient 3, Stun Damage" },
    "force-pike": { name: "Force Pike", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 2, range: "Engaged", encumbrance: 3, hp: 3, price: 500, rarity: 4, special: "Pierce 1, Stun setting" },
    "gaffi-stick": { name: "Gaffi Stick", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Engaged", encumbrance: 3, hp: 0, price: 100, rarity: 2, special: "Defensive 1, Disorient 3" },
    "gungan-electropole": { name: "Gungan Electropole", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 4, range: "Engaged", encumbrance: 3, hp: 2, price: 450, rarity: 5, special: "Stun 3, Stun setting" },
    "gungan-personal-energy-shield": { name: "Gungan Personal Energy Shield", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: -1, crit: 5, range: "Engaged", encumbrance: 4, hp: 0, price: 1000, rarity: 7, special: "Defensive 2, Deflection 2" },
    "huntsman-vibrospear": { name: "Huntsman Vibrospear", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 3, range: "Engaged", encumbrance: 4, hp: 2, price: 950, rarity: 6, special: "Pierce 2, Vicious 2" },
    "individual-field-disruptor": { name: "Individual Field Disruptor", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: null, range: "Engaged", encumbrance: null, hp: 0, price: 9500, rarity: 7, special: "Stun Damage" },
    "ion-pike": { name: "Ion Pike", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 10, crit: 3, range: "Engaged", encumbrance: 2, hp: 1, price: 750, rarity: 6, special: "Inaccurate 1, Ion, Pierce 4" },
    "kal": { name: "Kal", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 2, range: "Engaged", encumbrance: 1, hp: 1, price: 4000, rarity: 8, special: "Cortosis, Sunder, Vicious 2" },
    "kyuzo-war-shield": { name: "Kyuzo War Shield", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 4, range: "Engaged", encumbrance: 3, hp: 0, price: 750, rarity: 8, special: "Cumbersome 3, Defensive 1, Deflection 2, Disorient 1" },
    "longeing-whip": { name: "Longeing Whip", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 5, range: "Short", encumbrance: 3, hp: 1, price: 600, rarity: 4, special: "Ensnare 2, Stun Damage" },
    "m3-bulwark-blast-shield": { name: "M3 Bulwark Blast Shield", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 6, range: "Engaged", encumbrance: 6, hp: 1, price: 600, rarity: 5, special: "Cumbersome 3, Defensive 2, Deflection 2" },
    "m8-combat-knife": { name: "M8 Combat Knife", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: 1, hp: 1, price: 150, rarity: 4, special: "Accurate 1, Pierce 1" },
    "mmd-18-molecular-dagger": { name: "MMD-18 Molecular Dagger", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Engaged", encumbrance: 1, hp: 1, price: 100, rarity: 4, special: "Pierce 4" },
    "model-14-stalker-vibrospear": { name: 'Model 14 "Stalker" Vibrospear', type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 2, range: "Engaged", encumbrance: 4, hp: 2, price: 490, rarity: 6, special: "Defensive 1, Pierce 2, Vicious 2" },
    "model-7-therm-ax": { name: 'Model 7 Therm-ax', type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Engaged", encumbrance: 4, hp: 3, price: 850, rarity: 5, special: "Burn 2, Sunder, Vicious 1" },
    "mon-calamari-coral-pike": { name: "Mon Calamari Coral Pike", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 2, range: "Engaged", encumbrance: 3, hp: 3, price: 1000, rarity: 6, special: "Defensive 1, Pierce 2" },
    "mon-calamari-energy-lance": { name: "Mon Calamari Energy Lance", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 2, range: "Engaged", encumbrance: 4, hp: 2, price: 1500, rarity: 6, special: "Cumbersome 3 (dismounted), Pierce 3" },
    "mon-calamari-spear-blaster-spear-profile": { name: "Mon Calamari Spear Blaster (spear profile)", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Engaged", encumbrance: 5, hp: 3, price: 1350, rarity: 5, special: "Pierce 1" },
    "morgukai-cortosis-staff": { name: "Morgukai Cortosis Staff", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 8, crit: 1, range: "Engaged", encumbrance: 3, hp: 0, price: 9000, rarity: 10, special: "Breach 1, Cortosis, Defensive 1" },
    "msw-12-nanodagger": { name: "MSW-12 NanoDagger", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 2, range: "Engaged", encumbrance: 1, hp: 0, price: 700, rarity: 6, special: "Pierce 5, Vicious 1" },
    "msw-9-molecular-stiletto": { name: "MSW-9 Molecular Stiletto", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 0, crit: 2, range: "Engaged", encumbrance: 1, hp: 1, price: 500, rarity: 5, special: "Pierce 5, Vicious 1" },
    "neuronic-lash": { name: "Neuronic Lash", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 5, range: "Short", encumbrance: 1, hp: 1, price: 800, rarity: 7, special: "Ensnare 1, Stun 3, Stun Damage" },
    "neuronic-whip": { name: "Neuronic Whip", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 4, range: "Short", encumbrance: 1, hp: 1, price: 750, rarity: 6, special: "Disorient 4, Ensnare 1, Stun Damage" },
    "ouro-blade": { name: "Ouro Blade", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: 1, hp: 0, price: 600, rarity: 4, special: "" },
    "parrying-dagger": { name: "Parrying Dagger", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: 1, hp: 0, price: 150, rarity: 5, special: "Defensive 1" },
    "parrying-vibroblade": { name: "Parrying Vibroblade", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 2, range: "Engaged", encumbrance: 1, hp: 2, price: 400, rarity: 6, special: "Defensive 1, Pierce 2, Vicious 1" },
    "punch-dagger": { name: "Punch Dagger", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: 1, hp: 1, price: 75, rarity: 4, special: "Pierce 1" },
    "retractable-wrist-blades": { name: "Retractable Wrist Blades", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 3, range: "Engaged", encumbrance: null, hp: null, price: 150, rarity: 1, special: "Pierce 1" },
    "rodian-cryogen-whip": { name: "Rodian Cryogen Whip", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Short", encumbrance: 1, hp: 1, price: 1550, rarity: 7, special: "Ensnare 1, Vicious 2, Unwieldy 3" },
    "rs01-ripper-powersword": { name: 'RS01 "Ripper" Powersword', type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 2, range: "Engaged", encumbrance: 4, hp: 3, price: 1050, rarity: 6, special: "Cumbersome 3, Pierce 2, Sunder, Knockdown, Vicious 2" },
    "ryyk-blade": { name: "Ryyk Blade", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 2, range: "Engaged", encumbrance: 3, hp: 3, price: 400, rarity: 8, special: "Cumbersome 3, Defensive 1, Superior" },
    "selonian-glaive": { name: "Selonian Glaive", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 3, range: "Engaged", encumbrance: 5, hp: 3, price: 1200, rarity: 7, special: "Defensive 1, Pierce 3" },
    "semblan-obsidian-dagger": { name: "Semblan Obsidian Dagger", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 0, crit: 1, range: "Engaged", encumbrance: 1, hp: 0, price: 300, rarity: 4, special: "" },
    "shistavanen-combat-utility-vibroblade": { name: "Shistavanen Combat Utility Vibroblade", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 2, range: "Engaged", encumbrance: 2, hp: 0, price: 600, rarity: 7, special: "Pierce 2, Vicious 1" },
    "shock-whip": { name: "Shock Whip", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 4, crit: 4, range: "Short", encumbrance: 3, hp: 2, price: 600, rarity: 8, special: "Ensnare 3, Stun Damage" },
    "shockprod-staff": { name: "Shockprod Staff", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 7, crit: 3, range: "Short", encumbrance: 4, hp: 3, price: 1500, rarity: 7, special: "Disorient 4, Stun setting" },
    "sith-shield": { name: "Sith Shield", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 4, range: "Engaged", encumbrance: 3, hp: 2, price: 10000, rarity: 10, special: "Cortosis, Defensive 1, Deflection 2, Vicious 1" },
    "snap-baton": { name: "Snap Baton", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 4, range: "Engaged", encumbrance: 1, hp: 1, price: 50, rarity: 4, special: "Disorient 2" },
    "sorosuub-persuader-animal-shock-prod": { name: 'SoroSuub "Persuader" Animal Shock Prod', type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 4, range: "Engaged", encumbrance: 4, hp: 2, price: 1000, rarity: 4, special: "Concussive 1, Slow-Firing 1, Stun Setting" },
    "spray-stick-stun-pad": { name: "Spray Stick (stun pad)", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: null, range: "Engaged", encumbrance: 4, hp: 0, price: 2500, rarity: 8, special: "Inaccurate 1, Stun Damage" },
    "mk-ii-paladin-blaster-rifle-stun-prod": { name: 'Mk II "Paladin" Blaster Rifle (stun prod)', type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 6, range: "Engaged", encumbrance: 4, hp: 2, price: 3250, rarity: 8, special: "Disorient 2, Stun Damage" },
    "staff-of-office": { name: "Staff of Office", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 4, range: "Engaged", encumbrance: 3, hp: 2, price: 350, rarity: 6, special: "Defensive 1, Disorient 2" },
    "stealth-vibroknife": { name: "Stealth Vibroknife", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 2, range: "Engaged", encumbrance: 1, hp: 1, price: 350, rarity: 6, special: "Pierce 1, Vicious 1" },
    "sword-cane": { name: "Sword Cane", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 3, range: "Engaged", encumbrance: 2, hp: 1, price: 475, rarity: 6, special: "Defensive 1" },
    "thunderbolt-shock-prod": { name: "Thunderbolt Shock Prod", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 5, crit: 3, range: "Engaged", encumbrance: 2, hp: 2, price: 875, rarity: 6, special: "Concussive 1, Stun Damage" },
    "trailbreaker-poleaxe": { name: "Trailbreaker Poleaxe", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 3, range: "Engaged", encumbrance: 5, hp: 1, price: 610, rarity: 4, special: "Defensive 1, Pierce 2, Unwieldy 2" },
    "training-stick": { name: "Training Stick", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 1, crit: 5, range: "Engaged", encumbrance: 2, hp: 0, price: 35, rarity: 3, special: "Accurate 1, Disorient 1, Stun Damage" },
    "truncheon": { name: "Truncheon", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 5, range: "Engaged", encumbrance: 2, hp: 0, price: 15, rarity: 1, special: "Disorient 2" },
    "tuskbeast-pike": { name: "Tuskbeast Pike", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 4, crit: 3, range: "Engaged", encumbrance: 3, hp: 1, price: 1050, rarity: 8, special: "Defensive 1, Knockdown" },
    "tz-97-zapper-shock-baton": { name: 'TZ-97 "Zapper" Shock Baton', type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 5, crit: 4, range: "Engaged", encumbrance: 2, hp: 2, price: 900, rarity: 6, special: "Concussive 1, Stun Damage" },
    "vibro-ax": { name: "Vibro-ax", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 2, range: "Engaged", encumbrance: 4, hp: 3, price: 750, rarity: 5, special: "Pierce 2, Sunder, Vicious 3" },
    "vibro-bayonet": { name: "Vibro-bayonet", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 2, range: "Engaged", encumbrance: 1, hp: null, price: 300, rarity: 3, special: "Inaccurate 1, Pierce 2, Vicious 1" },
    "vibro-machete": { name: "Vibro-machete", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 2, range: "Engaged", encumbrance: 2, hp: 1, price: 550, rarity: 4, special: "Pierce 1, Sunder, Vicious 1" },
    "vibroknife": { name: "Vibroknife", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 2, range: "Engaged", encumbrance: 1, hp: 2, price: 250, rarity: 3, special: "Pierce 2, Vicious 1" },
    "vibrorang-in-melee": { name: "Vibrorang (in melee)", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 2, range: "Engaged", encumbrance: 1, hp: 0, price: 300, rarity: 4, special: "Inaccurate 1, Pierce 2, Vicious 1" },
    "vibrorapier": { name: "Vibrorapier", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 2, range: "Engaged", encumbrance: 2, hp: 2, price: 1200, rarity: 7, special: "Defensive 1, Pierce 4" },
    "voss-warspear": { name: "Voss Warspear", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 4, range: "Engaged", encumbrance: 4, hp: 2, price: 215, rarity: 8, special: "Defensive 2" },
    "weik-greatsword": { name: "Weik Greatsword", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 4, crit: 3, range: "Engaged", encumbrance: 4, hp: 2, price: 315, rarity: 8, special: "Cumbersome 4, Defensive 1" },
    "z2-stun-baton": { name: "Z2 Stun Baton", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 6, range: "Engaged", encumbrance: 2, hp: 2, price: 200, rarity: 4, special: "Disorient 2, Stun Damage" },
    "z6-riot-control-baton": { name: "Z6 Riot Control Baton", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 5, range: "Engaged", encumbrance: 2, hp: 1, price: 1000, rarity: 4, special: "Cortosis, Disorient 2, Stun Damage" },
    "breaker-heavy-hydrospanner": { name: '"Breaker" Heavy Hydrospanner', type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 4, range: "Engaged", encumbrance: 3, hp: null, price: 250, rarity: 2, special: "Cumbersome 3, Disorient 1, Inaccurate 1" },
    "copora-tech-thermal-cutter": { name: "Copora-Tech Thermal Cutter", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 4, crit: 4, range: "Engaged", encumbrance: 2, hp: null, price: 125, rarity: 3, special: "Burn 1, Inaccurate 2" },
    "electromag-pulse-disruptor": { name: "Electromag-Pulse Disruptor", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 5, crit: 4, range: "Engaged", encumbrance: 1, hp: 0, price: 180, rarity: 5, special: "Disorient 1, Ion" },
    "engineers-hammer": { name: "Engineer's Hammer", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 5, range: "Engaged", encumbrance: 2, hp: null, price: 350, rarity: 2, special: "Cumbersome 3, Disorient 1, Knockdown" },
    "entrenching-tool": { name: "Entrenching Tool", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 4, range: "Engaged", encumbrance: 1, hp: null, price: 20, rarity: 1, special: "" },
    "fusion-cutter": { name: "Fusion Cutter", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 5, crit: 3, range: "Engaged", encumbrance: 2, hp: null, price: 175, rarity: 2, special: "Breach 1, Burn 3, Sunder, Vicious 3" },
    "g9-gx-pulse-drill": { name: "G9-GX Pulse Drill", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 5, crit: 4, range: "Engaged", encumbrance: 5, hp: 2, price: 1100, rarity: 4, special: "Breach 1, Cumbersome 3, Inaccurate 2" },
    "hand-grinder": { name: "Hand Grinder", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 4, range: "Engaged", encumbrance: 5, hp: 4, price: 500, rarity: 3, special: "Cumbersome 3, Prepare 1, Vicious 4" },
    "j-7b-beamdrill": { name: "J-7b Beamdrill", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 9, crit: 2, range: "Engaged", encumbrance: 6, hp: 0, price: 3000, rarity: 5, special: "Breach 1, Cumbersome 4, Inaccurate 2, Sunder" },
    "mk-viii-vibrosaw": { name: "Mk. VIII Vibrosaw", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 4, crit: 2, range: "Engaged", encumbrance: 6, hp: 3, price: 1500, rarity: 5, special: "Cumbersome 5, Pierce 2, Sunder, Vicious 2" },
    "personal-vibrosaw": { name: "Personal Vibrosaw", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 4, crit: 2, range: "Engaged", encumbrance: null, hp: null, price: 900, rarity: 1, special: "Cumbersome 4, Pierce 2, Sunder, Unwieldy 4, Vicious 2" },
    "slicewire": { name: "Slicewire", type: "weapon", category: "Melee Weapons", skill: "Brawl", damage: 2, crit: 2, range: "Engaged", encumbrance: 1, hp: null, price: 200, rarity: 7, special: "Pierce 2, Vicious 3" },
    "vibro-pickaxe": { name: "Vibro-Pickaxe", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 2, crit: 2, range: "Engaged", encumbrance: 5, hp: null, price: 650, rarity: 3, special: "Cumbersome 4, Pierce 3, Sunder, Vicious 1" },
    "welding-rod": { name: "Welding Rod", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 3, crit: 2, range: "Engaged", encumbrance: 4, hp: 0, price: 1750, rarity: 5, special: "Breach 1, Inaccurate 2" },
    "whipcord-thrower": { name: "Whipcord Thrower", type: "weapon", category: "Melee Weapons", skill: "Melee", damage: 1, crit: 5, range: "Short", encumbrance: null, hp: null, price: 600, rarity: 1, special: "Ensnare 2" },
    "basic-lightsaber": { name: "Basic Lightsaber", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 6, crit: 2, range: "Engaged", encumbrance: 1, hp: 5, price: 9300, rarity: 10, special: "Breach 1, Sunder" },
    "broadsaber": { name: "Broadsaber", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 7, crit: 2, range: "Engaged", encumbrance: 1, hp: 2, price: 11000, rarity: 10, special: "Breach 1, Sunder, Unwieldy 3" },
    "contained-energy-ax": { name: "Contained Energy Ax", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 3, crit: 2, range: "Engaged", encumbrance: 4, hp: 3, price: 7500, rarity: 8, special: "Breach 1, Cumbersome 3, Sunder, Vicious 3" },
    "crossguard-lightsaber": { name: "Crossguard Lightsaber", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 6, crit: 2, range: "Engaged", encumbrance: 1, hp: 4, price: 9700, rarity: 10, special: "Breach 1, Defensive 1, Sunder" },
    "double-bladed-lightsaber": { name: "Double-Bladed Lightsaber", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 6, crit: 2, range: "Engaged", encumbrance: 2, hp: 4, price: 18600, rarity: 10, special: "Breach 1, Linked 1, Sunder, Unwieldy 3" },
    "great-lightsaber": { name: "Great Lightsaber", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 7, crit: 2, range: "Engaged", encumbrance: 2, hp: 3, price: 12000, rarity: 10, special: "Breach 1, Cumbersome 3, Sunder" },
    "guard-shoto": { name: "Guard Shoto", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 5, crit: 2, range: "Engaged", encumbrance: 1, hp: 3, price: 9700, rarity: 10, special: "Breach 1, Defensive 1, Deflection 2, Sunder, Unwieldy 4" },
    "lightfoil": { name: "Lightfoil", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 5, crit: 2, range: "Engaged", encumbrance: 1, hp: 1, price: 9850, rarity: 10, special: "Breach 1, Defensive 2, Sunder" },
    "lightsaber": { name: "Lightsaber", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 10, crit: 1, range: "Engaged", encumbrance: 1, hp: 0, price: 10000, rarity: 10, special: "Breach 1, Sunder, Vicious 2" },
    "lightsaber-pike": { name: "Lightsaber Pike", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 6, crit: 2, range: "Engaged", encumbrance: 3, hp: 3, price: 9600, rarity: 10, special: "Breach 1, Cumbersome 3, Defensive 1, Sunder" },
    "lightwhip": { name: "Lightwhip", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 4, crit: 4, range: "Short", encumbrance: 1, hp: 1, price: 11400, rarity: 10, special: "Ensnare 1, Pierce 5, Unwieldy 4" },
    "philaxian-phase-knife": { name: "Philaxian Phase-Knife", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 1, crit: 3, range: "Engaged", encumbrance: 1, hp: 1, price: 1500, rarity: null, special: "Pierce 4, Vicious 1" },
    "shoto-lightsaber-gag-fad": { name: "Shoto Lightsaber (GaG, FaD)", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 5, crit: 2, range: "Engaged", encumbrance: 1, hp: 3, price: 9300, rarity: 10, special: "Accurate 1, Breach 1, Sunder" },
    "shoto-lightsaber-rots": { name: "Shoto Lightsaber (RotS)", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 5, crit: 2, range: "Engaged", encumbrance: 1, hp: 3, price: 8000, rarity: 10, special: "Accurate 1, Breach 1, Sunder" },
    "temple-guard-lightsaber-pike": { name: "Temple Guard Lightsaber Pike", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 6, crit: 2, range: "Engaged", encumbrance: 2, hp: 4, price: 20000, rarity: 10, special: "Breach 1, Defensive 1, Linked 1, Sunder, Stun 4, Unwieldy 3" },
    "training-lightsaber": { name: "Training Lightsaber", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 6, crit: null, range: "Engaged", encumbrance: 1, hp: 5, price: 400, rarity: 6, special: "Stun Damage" },
    "basic-lightsaber-hilt": { name: "Basic Lightsaber Hilt", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 0, crit: null, range: "Engaged", encumbrance: 1, hp: 5, price: 300, rarity: 5, special: "" },
    "broadsaber-hilt": { name: "Broadsaber Hilt", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 0, crit: null, range: "Engaged", encumbrance: 1, hp: 4, price: 600, rarity: 6, special: "Unwieldy 3" },
    "crossguard-lightsaber-hilt": { name: "Crossguard Lightsaber Hilt", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 0, crit: null, range: "Engaged", encumbrance: 1, hp: 4, price: 900, rarity: 7, special: "Defensive 1" },
    "double-bladed-lightsaber-hilt": { name: "Double-Bladed Lightsaber Hilt", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 0, crit: null, range: "Engaged", encumbrance: 2, hp: 4, price: 600, rarity: 6, special: "Linked 1, Unwieldy 3" },
    "great-lightsaber-hilt": { name: "Great Lightsaber Hilt", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 0, crit: null, range: "Engaged", encumbrance: 2, hp: 5, price: 700, rarity: 6, special: "Cumbersome 3" },
    "guard-shoto-hilt": { name: "Guard Shoto Hilt", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 0, crit: null, range: "Engaged", encumbrance: 1, hp: 3, price: 700, rarity: 7, special: "Defensive 1, Deflection 2, Unwieldy 4" },
    "lightfoil-hilt": { name: "Lightfoil Hilt", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 0, crit: null, range: "Engaged", encumbrance: 1, hp: 3, price: 350, rarity: 6, special: "Defensive 2" },
    "lightsaber-pike-hilt": { name: "Lightsaber Pike Hilt", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 0, crit: null, range: "Engaged", encumbrance: 3, hp: 3, price: 600, rarity: 7, special: "Cumbersome 3, Defensive 1" },
    "shoto-hilt": { name: "Shoto Hilt", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 0, crit: null, range: "Engaged", encumbrance: 1, hp: 3, price: 300, rarity: 6, special: "Accurate 1" },
    "temple-guard-lightsaber-pike-hilt": { name: "Temple Guard Lightsaber Pike Hilt", type: "weapon", category: "Melee Weapons", skill: "Lightsaber", damage: 0, crit: null, range: "Engaged", encumbrance: 2, hp: 4, price: 2000, rarity: 9, special: "Defensive 1, Linked 1, Stun 4" },
    
    // Armor
    "banal-apparel": { name: "Banal Apparel", type: "armor", category: "Armor", subcategory: "Attire", soak: 0, defense: 0, price: 25, encumbrance: 0, hp: 0, r: false, rarity: 0, description: "Opposing character upgrade the difficulty of any checks made to identify the wearer once." },
    "cargo-clothes": { name: "Cargo Clothes", type: "armor", category: "Armor", subcategory: "Attire", soak: 0, defense: 0, price: 30, encumbrance: 1, hp: 0, r: false, rarity: 0, description: "A character wearing cargo clothing may carry up to three items of encumbrance 1 or lower without their counting toward the character's encumbrance value." },
    "concealing-robes": { name: "Concealing Robes", type: "armor", category: "Armor", subcategory: "Attire", soak: 1, defense: 0, price: 150, encumbrance: 1, hp: 0, r: false, rarity: 2, description: "Thanks to their cut and construction, concealing robes add a setback die to checks to notice or recognize an individual wearing them." },
    "diplomats-robes": { name: "Diplomat's Robes", type: "armor", category: "Armor", subcategory: "Attire", soak: 0, defense: 0, price: 400, encumbrance: 2, hp: 0, r: false, rarity: 6, description: "A character wearing diplomat's robes adds a boost die to social checks related to claiming diplomatic authority, accessing classified data, and using organizational status to bypass normal protocol." },
    "heavy-clothing": { name: "Heavy Clothing", type: "armor", category: "Armor", subcategory: "Attire", soak: 1, defense: 0, price: 50, encumbrance: 1, hp: 0, r: false, rarity: 0, description: "The most basic form of protection for many is simple yet durable heavy clothing." },
    "heavy-robes": { name: "Heavy Robes", type: "armor", category: "Armor", subcategory: "Attire", soak: 0, defense: 1, price: 150, encumbrance: 1, hp: 0, r: false, rarity: 2, description: "Many Jedi wear thick robes, sometimes with ceremonial significance, and sometimes simply to protect themselves against the elements in the course of their work." },
    "holographic-costume": { name: "Holographic Costume", type: "armor", category: "Armor", subcategory: "Attire", soak: 0, defense: 1, price: 750, encumbrance: 2, hp: 0, r: false, rarity: 8, description: "To record a new outfit, a character must make an Easy difficulty Computers check while in possession of a garment to be recorded, or a Daunting difficulty Computers check to create a facsimile of a garment that is not on hand." },
    "lectors-outfit": { name: "Lector's Outfit", type: "armor", category: "Armor", subcategory: "Attire", soak: 1, defense: 0, price: 525, encumbrance: 2, hp: 1, r: false, rarity: 6, description: "A character wearing a lector's outfit adds a boost die to any social check involving a large group of listeners, and can be heard clearly even at considerable distances." },
    "noble-regalia": { name: "Noble Regalia", type: "armor", category: "Armor", subcategory: "Attire", soak: 0, defense: 0, price: 750, encumbrance: 1, hp: 3, r: false, rarity: 7, description: "The wearer downgrades the difficulty of social checks to interact with other nobility and their subordinates once." },
    "nomad-greatcoat": { name: "Nomad Greatcoat", type: "armor", category: "Armor", subcategory: "Attire", soak: 1, defense: 0, price: 100, encumbrance: 1, hp: 0, r: false, rarity: 4, description: "The Nomad Greatcoat reduces the difficulty of Resilience checks made to resist the effects of extreme cold by one, and removes a setback die added to checks due to extreme cold." },
    "performers-attire": { name: "Performer's Attire", type: "armor", category: "Armor", subcategory: "Attire", soak: 0, defense: 0, price: 50, encumbrance: 0, hp: 0, r: false, rarity: 4, description: "A character wearing performer's attire adds a boost die to checks to perform or otherwise attract attention." },
    "pit-crew-coveralls": { name: "Pit Crew Coveralls", type: "armor", category: "Armor", subcategory: "Attire", soak: 1, defense: 0, price: 150, encumbrance: 1, hp: 1, r: false, rarity: 2, description: "When wearing pit crew coveralls, a character reduces damage [they] suffer from fires and weapons with the Burn quality by 1. In addition, wearing pit crew coveralls increases the character's encumbrance threshold by 1." },
    "polis-massan-bodysuit": { name: "Polis Massan Bodysuit", type: "armor", category: "Armor", subcategory: "Attire", soak: 1, defense: 0, price: 300, encumbrance: 1, hp: 1, r: false, rarity: 6, description: "All Polis Massan bodysuits include a tiny head-mounted multidirectional glow rod as well as an integrated utility belt (which increases the wearer's encumbrance threshold by one). Though designed with Polis Massan physiology in mind, bodysuits for use by other species have been commissioned." },
    "resplendent-robes": { name: "Resplendent Robes", type: "armor", category: "Armor", subcategory: "Attire", soak: 1, defense: 0, price: 500, encumbrance: 2, hp: 0, r: false, rarity: 5, description: "As long as the character wearing resplendent robes purposefully draws attention to themselves, each of their allies in medium range adds a boost die to Perception, Skulduggery, and Stealth checks." },
    "smugglers-trenchcoat": { name: "Smuggler's Trenchcoat", type: "armor", category: "Armor", subcategory: "Attire", soak: 1, defense: 1, price: 1650, encumbrance: 3, hp: 0, r: false, rarity: 7, description: "Checks made to find anything hidden within a smuggler's trenchcoat while it is being worn are opposed by the Skulduggery of the wearer. The coat can conceal items with a total encumbrance value of up to 2." },
    "tracker-utility-vest": { name: "Tracker Utility Vest", type: "armor", category: "Armor", subcategory: "Attire", soak: 0, defense: 0, price: 100, encumbrance: 0, hp: 1, r: false, rarity: 2, description: "When worn, the Tracker utility vest increases the wearer's encumbrance threshold by 2." },
    "gundark-scav-suit": { name: '"Gundark" Scav-Suit', type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 1, price: 3000, encumbrance: 2, hp: 2, r: false, rarity: 6, description: "The inbuilt sensor array on a \"Gundark\" scav-suit adds a boost die to the wearer's Perception checks, and an additional boost die to all checks to detect or analyze technological parts and items. However, if the suit's systems become damaged due to a Critical Injury, aimed shot, or other circumstance, the wearer instead suffers a setback die due to sensor feedback on all Perception checks instead until the suit is repaired." },
    "shockrider-crash-suit": { name: "Shockrider Crash Suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 2, defense: 0, price: 3000, encumbrance: 2, hp: 1, r: false, rarity: 3, description: "Thanks to its rugged construction and integrated armor, a crash suit reduces any strain received from Critical Hits dealt to the wearer's vehicle by 1 (to a minimum of 1) and the flame-resistant coating reduces the damage dealt to the wearer by fires and weapons with the Burn quality by 1." },
    "adverse-environment-gear": { name: "Adverse Environment Gear", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 0, price: 500, encumbrance: 2, hp: 1, r: false, rarity: 1, description: "Characters with this gear may ignore a setback die imposed by the environment in which they find themselves. The gear must be appropriate for the environment at hand." },
    "biogel-suit": { name: "Biogel Suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 2, defense: 0, price: 350, encumbrance: 6, hp: 0, r: false, rarity: 1, description: "The armor gains +1 soak when the wearer suffers damage from Brawl weapons or bludgeoning Melee weapons. A character adds a setback die to any Brawn- or Agility-based checks while wearing this armor." },
    "cf-9-republic-naval-flight-suit": { name: "CF-9 Republic Naval Flight Suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 1, price: 1200, encumbrance: 3, hp: 2, r: true, rarity: 6, description: "CF-9 flight suits include a built-in respirator. Characters wearing CF-9 Republic naval flight suits remove up to one setback die from Piloting (Space) and Piloting (Planetary) checks added due to the danger or physical stress of the action." },
    "climbsuit": { name: "Climbsuit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 0, price: 1450, encumbrance: 2, hp: 2, r: false, rarity: 4, description: "Wearing a Climbsuit upgrades the ability of the wearer's checks to climb or rappel down a surface once. The Climbsuit also reduces damage and strain suffered from falling by 5 and reduces any Critical Injury results from falling by 10." },
    "cloaking-coat": { name: "Cloaking Coat", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 0, price: 550, encumbrance: 4, hp: 1, r: true, rarity: 8, description: "A cloaking coat upgrades the difficulty of checks using sensors or electronic forms of detection to find an individual wearing it twice. Droids with an Intellect lower than the wearer's ranks in Computers are affected similarly when trying to detect the wearer." },
    "crash-gear": { name: "Crash Gear", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 0, price: 550, encumbrance: 1, hp: 1, r: false, rarity: 3, description: "A character wearing crash gear ignores the effects of ongoing Critical Injuries on any Intellect- or Cunning-related checks, but still suffers from the injuries themselves. They also cannot be disoriented." },
    "eod-mk-ii-explosives-disposal-armor": { name: "EOD-Mk II Explosives Disposal Armor", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 4, defense: 0, price: 5300, encumbrance: 8, hp: 0, r: false, rarity: 6, description: "Due to its extremely thick padding and ponderous form, character wearing EOD-Mk II armor lose their free movement. CUSTOMIZATIONS EOD-Mk II Upgrade Options: EOD-MK II suits lack any standard modification options, but can be upgraded with two valuable attachments. These attachments are integrated load bearing gear and a data link for controlling EOD and demolitions remotes, such as the EOD-Mk IV. As the suits are designed for these upgrades, neither takes up any hard points for the armor, but each upgrade can only be taken once. Integrated load-bearing gear reduces the suit's encumbrance by 3, and costs an additional 700 credits with a rarity of 3. The data link allows the wearer to control a single EOD remote and costs an extra 300 credits with a rarity of 4." },
    "enviro-suit": { name: "Enviro-suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 2, defense: 0, price: 750, encumbrance: 2, hp: 1, r: false, rarity: 2, description: "Enviro-suits have an operation life of eight hours until they need to be recharged and refilled. Due to their many layers of protective shielding, enviro-suits tend to be bulky and reduce a wearer's sense of their surroundings. An individual wearing an enviro-suit suffers one setback die on Agility- and Perception-based checks." },
    "fabricators-protective-gear": { name: "Fabricators' Protective Gear", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 0, price: 450, encumbrance: 1, hp: 0, r: false, rarity: 1, description: "This armor allows the wearer to ignore the effects of fires or acids of rating 1 or 2. It has a soak value of 3 against damage from weapons with the Blast quality, but only when the quality is activated and used to inflict damage on the wearer. It provides only 1 point of soak against all other damage that was not inflicted through that quality." },
    "g-suit": { name: "G-suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 0, price: 2000, encumbrance: 2, hp: 1, r: false, rarity: 3, description: "A character wearing a g-suit reduces the strain cost to perform a second Pilot Only maneuver during a turn by 1." },
    "hauling-harness": { name: "Hauling Harness", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 1, price: 1000, encumbrance: 3, hp: 2, r: false, rarity: 6, description: "A character wearing a hauling harness increases [their] encumbrance capacity by 6, but also upgrades the difficulty of any combat check [they] make twice." },
    "individual-field-disruptor-worn": { name: "Individual Field Disruptor", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 0, defense: 1, price: 9500, encumbrance: 0, hp: 0, r: true, rarity: 7, description: "The field creates a shimmering field around the wearer, forming a two-meter-diameter sphere around the device and individual while obscuring the wearer's visibility. If the field contacts another energy field, the other field ceases to offer any defense as long as the two fields intersect. If a character wearing an active field enters engaged range with a droid, the droid suffers 5 Stun damage. If the field enters engaged range with any other electronic device, the device shorts out and becomes inactive for the remainder of the encounter. If the wearer makes a melee attack while the field is active, the wearer counts as being armed with a Melee weapon with +2 damage and the Stun Damage item quality." },
    "mechanics-utility-suit": { name: "Mechanic's Utility Suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 2, defense: 0, price: 1175, encumbrance: 5, hp: 1, r: false, rarity: 3, description: "The wearer counts as having a tool kit." },
    "p-14-hazardous-industry-suit": { name: "P-14 Hazardous Industry Suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 2, defense: 0, price: 1000, encumbrance: 7, hp: 2, r: false, rarity: 4, description: "A hazardous industry suit counts as a breath mask. Further, the wearer adds two boost dice to Resilience checks to resist heat, cold, radiation, and other hostile environmental conditions. The wearer does not suffer the effects of the Burn or Disorient item qualities. When the wearer suffers strain in order to take an extra maneuver, they suffer 1 additional strain." },
    "personal-deflector-shield": { name: "Personal Deflector Shield", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 0, defense: 2, price: 10000, encumbrance: 3, hp: 0, r: false, rarity: 8, description: "When the wielder is using a PDS, the GM can spend any despair result they generate to have it run out of power for the remainder of the encounter." },
    "reflect-body-glove": { name: "Reflect Body Glove", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 3, defense: 0, price: 2500, encumbrance: 2, hp: 0, r: false, rarity: 5, description: "Add two setback dice to a character's Vigilance and Perception checks to notice the user is wearing armor. After a successful combat check has been resolved against the wearer, the reflect body glove's soak is reduced by one, to a minimum of zero. The suit's soak may be restored to its original value by making an Average difficulty Mechanics check." },
    "reinforced-environment-gear": { name: "Reinforced Environment Gear", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 0, price: 850, encumbrance: 2, hp: 2, r: false, rarity: 4, description: "Reinforced environment gear allows a wearer to ignore a setback die imposed by environmental conditions and reduces Critical Injuries suffered from falling by 20. The suit also includes a filter, granting a boost die to Resilience checks to resist toxic atmospheres or airborne toxins." },
    "sakiyan-shadowsuit": { name: "Sakiyan Shadowsuit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 0, price: 2500, encumbrance: 1, hp: 1, r: false, rarity: 8, description: "A Sakiyan shadowsuit grants two boost dice to Stealth checks the wearer makes." },
    "seascape-diving-suit": { name: "SeaScape Diving Suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 2, defense: 0, price: 400, encumbrance: 3, hp: 0, r: false, rarity: 2, description: "The SeaScape diving suit can provide six hours of atmosphere to an air-breather. During this time, the wearer also has access to fresh water, nutrition supplements, and other biological necessities. While wearing a SeaScape diving suit, a character does not suffer movement penalties for traveling through water." },
    "sith-pain-harness": { name: "Sith Pain Harness", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 2, defense: 0, price: 3500, encumbrance: 2, hp: 0, r: true, rarity: 9, description: "While wearing the Sith Pain Harness, a character can choose to suffer one wound as an incidental to add an automatic success result to the next Discipline check they make during the current round. They then suffer 1 Conflict." },
    "thinsuit": { name: "Thinsuit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 0, price: 1200, encumbrance: 0, hp: 0, r: false, rarity: 6, description: "It comes with a facemask and filtration system that purifies standard atmosphere for up to six hours and provides one hour of internal power. The stock suit comes with six removable filters and power packs, easily stored in its many pockets. A character equipped with a Thinsuit removes two setback dice imposed by the environment from their checks." },
    "training-suit": { name: "Training Suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 2, defense: 0, price: 400, encumbrance: 6, hp: 0, r: true, rarity: 9, description: "Unless the integrated weights are removed, a Jedi training suit has an encumbrance of 6. Removal of these weights, which requires an Easy difficulty Mechanics check, reduces the suit's encumbrance to 4. At the GM's discretion, training while wearing the weights might help a character develop physical fitness or adapt to high-gravity environments." },
    "tx-3-combat-flight-suit": { name: "TX-3 Combat Flight Suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 0, defense: 1, price: 3000, encumbrance: 4, hp: 2, r: true, rarity: 6, description: "Without an external oxygen source, a person wearing a TX-3 flight suit can survive for up to 24 hours in hard vacuum." },
    "wing-commander-armored-flight-suit": { name: "Wing Commander Armored Flight Suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 1, price: 1500, encumbrance: 3, hp: 1, r: false, rarity: 6, description: "Thanks to its rugged construction and integrated armor, the Wing Commander suit reduces any strain received from Critical Hits dealt to the wearer's vehicle by one (to a minimum of 1) and the flame-resistant coating reduces damage dealt to the wearer by fires and weapons with the Burn quality by 1." },
    "zephyr-stealth-suit": { name: "Zephyr Stealth Suit", type: "armor", category: "Armor", subcategory: "Worn Equipment", soak: 1, defense: 1, price: 5500, encumbrance: 2, hp: 1, r: true, rarity: 8, description: "A character wearing a zephyr stealth suit upgrade the ability of any Stealth checks [they] make once." },
    "storm-charge-suit": { name: '"Storm" Charge Suit', type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 2000, encumbrance: 3, hp: 0, r: false, rarity: 2, description: "If the wearer of the charge suit is hit by a melee attack and the attack generates a despair result, the attacker is automatically hit by an attack dealing 8 damage. This damage is applied to the attacker's strain threshold. If the attack generates two threat results, the attacker is disoriented for one round. Wearing a charge suit counts as being equipped with shock gloves (Brawl; Damage +0; Critical 5; Range [Engaged]; Stun 3)." },
    "alliance-engineers-helmet-and-vest": { name: "Alliance Engineer's Helmet and Vest", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 0, price: 75, encumbrance: 1, hp: 0, r: false, rarity: 1, description: "While wearing an Alliance engineer's helmet and vest, the character counts as having 1 rank (or one additional rank) in the Durable talent." },
    "alliance-light-stealth-armor": { name: "Alliance Light Stealth Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 2200, encumbrance: 3, hp: 2, r: true, rarity: 7, description: "This armor adds a boost die to the wearer's Stealth checks." },
    "armored-clothing": { name: "Armored Clothing", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 1, price: 1000, encumbrance: 3, hp: 1, r: false, rarity: 6, description: "As this armor is reasonably subtle, it takes a thorough search of an individual's person to detect that they're wearing it, an action that requires an Average difficulty Perception check." },
    "armored-drop-suit": { name: "Armored Drop Suit", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 1, price: 7500, encumbrance: 6, hp: 2, r: false, rarity: 7, description: "As a maneuver, the wearer can engage the suit's flight systems to function as a silhouette 0, speed 2, handling +2, system strain threshold 3 vehicle that requires Piloting (Planetary) to operate. Further, while the flight systems are engaged and the wearer is conscious, they do not suffer damage from falling." },
    "armored-half-vest": { name: "Armored Half-vest", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 1, price: 500, encumbrance: 3, hp: 0, r: false, rarity: 5, description: "Whenever a character wearing an armored half-vest suffers a Critical Injury, the armor becomes damaged by one step." },
    "beast-hide-armor": { name: "Beast-hide Armor (GaG)", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 0, price: 300, encumbrance: 2, hp: 0, r: false, rarity: 3, description: "When wearing beast-hide armor, a character gains an automatic advantage result on Coercion checks and an automatic threat on Charm checks. The GM may determine that this armor provides further benefits or drawbacks depending on the situation." },
    "blast-vest": { name: "Blast Vest", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 0, price: 200, encumbrance: 3, hp: 1, r: false, rarity: 3, description: "The armor gains +2 soak when the wearer suffers damage from a slugthrower or other physical projectile." },
    "catch-vest": { name: "Catch Vest", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 300, encumbrance: 1, hp: 0, r: false, rarity: 3, description: "Catch vests have a soak value of 2 against damage from energy-based weapons only; they provide only 1 point of soak against all other forms of damage." },
    "clone-dive-armor": { name: "Clone Dive Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 4500, encumbrance: 3, hp: 2, r: true, rarity: 7, description: "Clone dive armor provides twelve hours of oxygen. During this time, the wearer also has fresh water, nutrition supplements, and other biological necessities. While wearing clone dive armor, a character does not suffer movement penalties for travelling through water and removes up to one setback die from Perception checks due to underwater conditions." },
    "clone-reconnaissance-armor": { name: "Clone Reconnaissance Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 4000, encumbrance: 3, hp: 2, r: true, rarity: 6, description: "Characters wearing clone reconnaissance armor add a boost die to Stealth checks they make. These suits incorporate visors with integrated thermal and low-light sensors, allowing wearers to remove a setback die from visual Perception checks they make." },
    "custom-tailored-armored-jacket": { name: "Custom Tailored Armored Jacket", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 6200, encumbrance: 1, hp: 0, r: false, rarity: 7, description: "Kamperdine armored jackets are each tailored to a specific wearer. When worn by that wearer, they add an advantage result to any successful Charm, Deception, or Negotiation checks the character makes (the GM may decide that the bonus does not apply in certain situations, such as dealings over a comlink)." },
    "flare-jacket": { name: "Flare Jacket", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 0, price: 1500, encumbrance: 3, hp: 0, r: false, rarity: 8, description: "Once per encounter, a character wearing a flare jacket can trigger the charges as a maneuver. Each character within short range (besides the wearer) must make a Hard difficulty Vigilance check. Each character who fails is staggered for one round, plus one additional round per three threat results." },
    "formal-council-armor": { name: "Formal Council Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 8000, encumbrance: 5, hp: 2, r: true, rarity: 10, description: "A character wearing formal Council armor adds two automatic advantage results to Negotiation checks when interacting with individuals who hold Jedi in high regard. At the GM's discretion, the character may add two automatic advantage results to Coercion checks when interacting with individuals who hate or fear the Jedi (such as representatives of the Galactic Empire)." },
    "hunters-trophy-armor-completed": { name: "Hunter's Trophy Armor (completed)", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 2000, encumbrance: 4, hp: 1, r: true, rarity: 9, description: "A character wearing trophy armor suffers a setback die to Charm checks, but gains two boost die to Coercion checks due to the armor's intimidating appearance. At the GM's discretion, Charm checks made to impress or persuade other characters of the wearer's prowess may receive two boost dice instead of a setback die." },
    "imperial-storm-commando-armor": { name: "Imperial Storm Commando Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 5000, encumbrance: 4, hp: 4, r: true, rarity: 9, description: "The armor's helmet is equipped with macrobinoculars and scanner goggles, as well as a comlink. While wearing storm commando armor, a character removes a setback die due to darkness, smoke, or similar environmental factors that obscure vision from Perception, Vigilance, and combat checks. Additionally, this armor adds a setback die to other characters' Perception checks to detect the wearer." },
    "jedi-commander-armor": { name: "Jedi Commander Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 1, price: 5000, encumbrance: 5, hp: 3, r: true, rarity: 8, description: "The traditional robes of the Jedi are appropriate for their work as mediators and peacekeepers, but when leading detachments of clone troopers, many Jedi have opted for additional protection to fit their new role." },
    "jedi-reconnaissance-armor": { name: "Jedi Reconnaissance Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 1, price: 4000, encumbrance: 2, hp: 2, r: false, rarity: 8, description: "Characters wearing Jedi reconnaissance armor add a boost die to Stealth checks they make." },
    "jedi-temple-guard-armor": { name: "Jedi Temple Guard Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 2, price: 12000, encumbrance: 4, hp: 3, r: true, rarity: 10, description: "The armored mask contains a helmet comlink and in-helmet scanner." },
    "mk-i-nightstalker-infiltrator-suit": { name: "Mk I NightStalker Infiltrator Suit", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 4800, encumbrance: 2, hp: 1, r: true, rarity: 9, description: "When wearing a NightStalker suit, the wearer adds an automatic success result to Stealth checks they make and adds an automatic threat result to social skill checks they make." },
    "mk-iii-flak-vest": { name: "Mk III Flak Vest", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 0, price: 300, encumbrance: 3, hp: 1, r: false, rarity: 2, description: "This armor gains +1 soak when the wearer suffers damage from the Blast quality." },
    "mk-ix-personal-mimetic-concealment-suit": { name: "Mk IX Personal Mimetic Concealment Suit (FC)", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 1, price: 8000, encumbrance: 2, hp: 2, r: true, rarity: 8, description: "Wearing this armor upgrades the ability of all Stealth checks made by the wearer twice. In addition, the GM may spend a despair result or three threat results on any Stealth checks made by the wearer while the suit is active to have its power pack run dry. The suit cannot be used again until the powerpack is replaced, which requires a maneuver." },
    "mountaineer-armor": { name: "Mountaineer Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 1, price: 1800, encumbrance: 3, hp: 2, r: false, rarity: 6, description: "Mountaineer armor adds two boost dice to all Athletics checks made by the wearer to climb or rappel." },
    "padded-armor": { name: "Padded Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 500, encumbrance: 2, hp: 0, r: false, rarity: 1, description: "Made of thick, reinforced, wear-resistant textiles woven with energy dispersion mesh, this light armor is one of the most common forms of personal armor protection in the galaxy." },
    "pioneer-armor": { name: "Pioneer Armor (FO)", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 0, price: 200, encumbrance: 1, hp: 1, r: false, rarity: 4, description: "Pioneer armor increases a wearer's encumbrance threshold by 3." },
    "riot-armor": { name: "Riot Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 0, price: 950, encumbrance: 3, hp: 2, r: false, rarity: 4, description: "Produced by countless manufacturers throughout the galaxy, riot armor is light combat armor designed for personal protection in high-intensity conflicts." },
    "second-skin-armor": { name: "Second Skin Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 1, price: 2000, encumbrance: 2, hp: 0, r: false, rarity: 7, description: "Add two setback dice to a character's Perception checks to notice second skin armor on the wearer." },
    "survivalist-armor": { name: "Survivalist Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 0, price: 350, encumbrance: 3, hp: 2, r: false, rarity: 6, description: "Wearing a suit of Survivalist armor increases the wearer's encumbrance threshold by 1." },
    "timber-cuirass": { name: "Timber Cuirass", type: "armor", category: "Armor", subcategory: "Light", soak: 2, defense: 1, price: 4000, encumbrance: 4, hp: 1, r: false, rarity: 5, description: "Armorers crafted the classic cuirass from a single living piece of Heartwood." },
    "type-iii-berethron-personal-modular-armor": { name: "Type III \"Berethron\" Personal Modular Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 1, price: 1250, encumbrance: 3, hp: 3, r: true, rarity: 6, description: "Manufactured in the Corellian sector for the Corellian Defense Force and CorSec forces, the Type III \"Berethron\" personal modular armor system is a relatively lightweight form of armored clothing that allows for considerable mission-specific customization." },
    "verpine-fiber-ultramesh-armor": { name: "Verpine Fiber Ultramesh Armor", type: "armor", category: "Armor", subcategory: "Light", soak: 1, defense: 0, price: 3000, encumbrance: 3, hp: 2, r: false, rarity: 5, description: "As a maneuver, the wearer may power up or power down the armor. While the armor is powered up, the wearer gains +2 defense. However, any character may spend a triumph result or two advantage results from a combat check against the wearer to cause it to run out of power, at which point the armor becomes powered down and cannot be powered up until the end of the encounter." },
    "ancient-battle-armor": { name: "Ancient Battle Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 0, price: 3750, encumbrance: 6, hp: 1, r: false, rarity: 9, description: "While worn by a character with a Force rating of 1 or higher, ancient battle armor gains Defense 1." },
    "px-11-battlement-powered-armor": { name: "PX-11 \"Battlement\" Powered Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 3, defense: 1, price: 9000, encumbrance: 3, hp: 3, r: true, rarity: 9, description: "The suit forms a vacuum-sealed life support system, allowing the wearer to survive in a vacuum or toxic environment for up to one hour. The suit's helmet incorporates a comlink as well as sophisticated optical and auditory sensors, allowing the wearer to deduct two setback dice from all Perception, Surveillance, Vigilance and combat skill checks due to darkness, smoke, or similar environmental factors that obscure vision. PX-11 armor suit charge packs supply enough power for 12 hours of use. In addition to its protective value, the armor increases the wearer's Brawn by 1 while wearing the armor. This does not increase [their] soak or wound threshold. The wearer also gains +1 rank of the Athletics skill as long as [they] are wearing the armor. The listed encumbrance value assumes the armor is powered. If a Battlement suit loses power or ceases to function for any reason, its encumbrance becomes 12, its defense becomes 0, and the wearer loses the Brawn increase. Equipping the armor without assistance takes five minutes. Assistance cuts this time in half." },
    "armored-robes": { name: "Armored Robes", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 1, price: 4500, encumbrance: 5, hp: 2, r: true, rarity: 8, description: "Often worn by Jedi engaging in dangerous activity during the Clone Wars, armored robes grant exceptional protection." },
    "chitin-armor": { name: "Chitin Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 0, price: 600, encumbrance: 4, hp: 1, r: false, rarity: 6, description: "Chitin armor makes a strong statement about the wearer and these suits tend to have a startling effect on people in civilized society. A character wearing a suit of chitin armor adds an automatic advantage result to [their] Coercion checks and an automatic threat result to [their] Charm checks. The Game Master may determine that the armor provides further benefits or drawbacks, depending the situation." },
    "cresh-luck-armor": { name: "Cresh \"Luck\" Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 0, price: 1000, encumbrance: 4, hp: 1, r: false, rarity: 5, description: "Cresh Luck armor adds an automatic advantage result to the wearer's Vigilance checks." },
    "heavy-battle-armor": { name: "Heavy Battle Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 1, price: 5000, encumbrance: 6, hp: 4, r: true, rarity: 7, description: "Heavy battle armor can be eligible to be fully sealed, or it can take the form of a heavy vest and blast helmet." },
    "ht-77-cold-assault-armor": { name: "HT-77 Cold Assault Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 0, price: 4000, encumbrance: 6, hp: 2, r: true, rarity: 6, description: "HT-77 cold assault armor comes with a built-in comlink, and it adds two boost dice to the wearer's checks to avoid adverse effects from exposure to cold temperatures and weather. Additionally, the wearer removes a setback die imposed by cold-weather conditions on their Perception checks." },
    "hutt-shell-armor": { name: "Hutt Shell Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 2, price: 25000, encumbrance: 6, hp: 4, r: true, rarity: 9, description: "Hutt Shell Armor allows a Hutt to ignore the effects of the Awkward and Ponderous abilities (if [they] possess either or both of these). Further, the wearer does not have to spend additional maneuvers when navigating difficult terrain." },
    "imperial-hazard-trooper-armor": { name: "Imperial Hazard Trooper Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 3, defense: 0, price: 18000, encumbrance: 4, hp: 3, r: true, rarity: 8, description: "Once active, the armor's internal life support and power systems allow the wearer to survive in radiation zones, acid and toxic environments, extreme pressures, and total vacuum for up to twenty-four hours. The armor also incorporates a high-powered comlink able to communicate from the ground to low orbit. The helmet is equipped with a multifrequency targeting and acquisition system that removes two setback die due to darkness, smoke, or similar environmental factors that obscure vision from the wearer's Perception, Vigilance, and combat checks." },
    "jedi-battle-armor": { name: "Jedi Battle Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 1, price: 7500, encumbrance: 5, hp: 5, r: true, rarity: 9, description: "A character wearing Jedi battle armor fitted for somebody else adds two setback dice to all combat checks. A suit of Jedi battle armor can be fitted to a new wearer with a Hard difficulty Mechanics check that takes an hour to complete. Jedi battle armor is eligible to be sealed against vacuums and other hazardous environments." },
    "katarn-class-commando-armor": { name: "Katarn-class Commando Armor (CotR)", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 1, price: 6500, encumbrance: 4, hp: 3, r: true, rarity: 7, description: "Its insulated bodysuit grants the wearer protection from heat, cold, radiation, and most known toxins. A six-hour air supply enables the wearer to function in hostile environments, including the vacuum of space. Integrated scanners and communications suites enable the wearer to track hostiles while keeping in touch with allies. The armor's backpack is modular, enabling it to incorporate modifications suited to specific battlefield needs such as survival gear, additional oxygen supplies, and field electronics. A full suit of Katarn-class armor provides a wearer with all the benefits of a combat scanner and a breath mask, and increases the wearer's encumbrance threshold by 3. In addition, the suit's systems remove a setback die from all Perception and Survival checks made by the wearer." },
    "kav-dann-power-armor": { name: "Kav-Dann Power Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 2, price: 13500, encumbrance: 4, hp: 6, r: true, rarity: 7, description: "Like many other varieties of powered armor, a Kav-Dann suit is spaceworthy and includes a full life-support suite that can be modified for most alien physiologies. A wearer can survive for four hours in a vacuum or unbreathable atmosphere, and gains a boost die to checks to resist the effects of radiation. The helmet incorporates a long-range comlink and a basic visual package that allows the wearer to remove a setback die caused by to darkness, smoke, or other environmental factors that might affect vision from all Perception, Vigilance, and Combat checks. Kav-Dann power armor increases the wearer's Brawn by 1 so long as it remains powered, though this bonus does not increase the user's soak or wound threshold. The listed encumbrance of 4 reflects the bulk of the armor when powered. If the suit loses power for any reason, the encumbrance increases to 12, defense is reduced to 0, and the bonus to Brawn is lost. Donning a suit of Kav-Dann power armor takes ten minutes, though this time can be halved if the wearer is assisted." },
    "laminate-armor": { name: "Laminate Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 0, price: 2500, encumbrance: 4, hp: 3, r: false, rarity: 5, description: "Suits of laminate armor consist of a number of formfitted plastoid plates designed to protect important areas, worn over a snug, reinforced armorweave body glove." },
    "leviathan-power-armor": { name: "Leviathan Power Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 2, price: 15000, encumbrance: 8, hp: 1, r: false, rarity: 8, description: "Any character wearing a Leviathan suit that was not built for [them] upgrades the difficulty of Agility and Brawn-based checks once. A Leviathan suit is fully sealed and has an integrated respirator. It automatically possesses the following attachments: a heating system, an enhanced optics suite, and a strength enhancement system. These attachments are already installed and cannot be removed. Each suit is also equipped with one Mon Cal Defenses mini torpedo launcher and one Salus DF-D1 duo-flechette rifle." },
    "mandalorian-armor": { name: "Mandalorian Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 1, price: 6000, encumbrance: 6, hp: 5, r: true, rarity: 8, description: "All Mandalorian armor suits include an integrated comlink and are vacuum sealed. Beyond that, most conform to the defense, soak, encumbrance, and hard points values presented above, though exceptions exist." },
    "n-57-armor": { name: "N-57 Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 0, price: 3000, encumbrance: 5, hp: 5, r: false, rarity: 6, description: "As a maneuver, the wearer may recharge an energy weapon or device that has run out of power or ammunition in the manner of an extra reload/power pack." },
    "mk-ii-hotspot-insulated-armor": { name: "Mk II \"Hotspot\" Insulated Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 0, price: 5500, encumbrance: 6, hp: 2, r: true, rarity: 7, description: "Mk II \"Hotspot\" insulated armor comes with a built-in comlink. It adds two boost dice to the wearer's checks to avoid adverse effects from exposure to extreme heat or toxic gases and reduces the damage the wearer takes from fire and hazardous environments by 1. Additionally, when targeting the wearer, attackers must spend one additional advantage result to activate the Burn item quality and treat the quality's rating as one lower." },
    "mk-ii-steelskin-anti-concussive-armor": { name: "Mk II \"Steelskin\" Anti-concussive Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 3, defense: 0, price: 6500, encumbrance: 8, hp: 1, r: true, rarity: 7, description: "All Brawn- and Agility-based checks while wearing Steelskin armor gain a setback die. Whenever the bearer is staggered or disoriented from a weapon's item quality, the armor reduces the rounds staggered or disoriented by one." },
    "mk-iv-riot-armor": { name: "Mk IV Riot Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 1, defense: 1, price: 1850, encumbrance: 3, hp: 1, r: true, rarity: 6, description: "This armor includes a breath mask that allows the user to filter out airborne toxins and gases (but not to breathe in atmospheres without the character's required atmosphere mix). In addition, when staggered or disoriented, the wearer reduces the duration of the effect by one round, to a minimum of one round." },
    "phase-i-arc-trooper-armor-rots": { name: "Phase I ARC Trooper Armor (RotS)", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 1, price: 6000, encumbrance: 5, hp: 4, r: true, rarity: 7, description: "Phase I ARC trooper armor includes a comlink The various systems built into Phase I ARC trooper armor remove a setback die from all Perception checks made by the wearer. And provide all the benefits of a hardened comlink. In addition, the integrated load-bearing harness increases the wearer's encumbrance threshold by three." },
    "phase-i-arc-trooper-armor-kof": { name: "Phase I ARC Trooper Armor (KoF)", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 1, price: 5000, encumbrance: 4, hp: 2, r: true, rarity: 8, description: "Phase I ARC trooper armor includes a comlink. The various systems built into Phase I ARC trooper armor remove a setback die from all Perception checks made by the wearer. And provide all the benefits of a hardened comlink. In addition, the integrated load-bearing harness increases the wearer's encumbrance threshold by three." },
    "phase-i-clone-trooper-armor": { name: "Phase I Clone Trooper Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 0, price: 2000, encumbrance: 4, hp: 3, r: true, rarity: 6, description: "It is pressurized against vacuum—not enough to allow extended operations, but sufficient for a few minutes of life support in an emergency. Phase I clone trooper armor includes a comlink. At the GM's discretion, characters unused to moving in this armor may suffer a setback die to Coordination checks until they acclimatize to the distribution of its weight." },
    "phase-ii-arc-trooper-armor": { name: "Phase II ARC Trooper Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 1, price: 5500, encumbrance: 4, hp: 2, r: true, rarity: 7, description: "Phase II ARC trooper armor includes an integrated comlink with scrambler capable of using all standard Republic communications protocols. The survival pack incorporates emergency rations, a water filtration system, a microfiber line, and a distress beacon." },
    "phase-ii-clone-trooper-armor": { name: "Phase II Clone Trooper Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 0, price: 3000, encumbrance: 4, hp: 4, r: true, rarity: 6, description: "Phase II clone trooper armor includes an integrated comlink with scrambler capable of using all standard Republic communications protocols." },
    "powered-capacitive-armor": { name: "Powered Capacitive Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 1, defense: 1, price: 3000, encumbrance: 4, hp: 2, r: true, rarity: 8, description: "As a maneuver, the wearer may power up or power down the armor. While the armor is powered and the plates are locked in place, the wearer gains +1 soak and +1 defense but loses their free maneuver during each of their turns." },
    "rebel-heavy-battle-armor": { name: "Rebel Heavy Battle Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 1, price: 6000, encumbrance: 5, hp: 5, r: true, rarity: 8, description: "Rebel heavy battle armor is equipped with a helmet-fitted breath mask and respirator." },
    "scavenged-clone-armor": { name: "Scavenged Clone Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 0, price: 1000, encumbrance: 5, hp: 2, r: true, rarity: 4, description: "Due to the piecemeal nature of its construction and the difficulty of adapting the specific fit of clone armor, all wearers of scavenged clone armor suffer a setback die to Coordination and Stealth checks while wearing it. Characters wearing scavenged clone armor may suffer one or more setback dice on interactions with Republic officials and representatives, at the GM's discretion." },
    "protector-1-combat-armor": { name: "Protector 1 Combat Armor", type: "armor", category: "Armor", subcategory: "Heavy", soak: 2, defense: 1, price: 5500, encumbrance: 4, hp: 3, r: true, rarity: 7, description: "The Protector 1 from the Tagge Company is representative of an entire class of heavy battle armor, consisting of strong durasteel plates over a ballistic mesh suit." },
    "waterweave": { name: "Waterweave", type: "armor", category: "Armor", subcategory: "Heavy", soak: 1, defense: 2, price: 6500, encumbrance: 7, hp: 1, r: false, rarity: 5, description: "Waterweave armor has encumbrance 7. However, while submerged, the armor's encumbrance changes to 0." },
    "anipro-layered-beast-armor": { name: "AniPro Layered Beast Armor", type: "armor", category: "Armor", subcategory: "Beast Armor", soak: 1, defense: 1, price: 2500, encumbrance: 4, hp: 0, r: false, rarity: 5, description: "Light and easy to maintain, the AniPro-series layered beast armor by VeTech strikes a good balance between protection and practicality." },
    "caballerin-series-riding-tack": { name: "Caballerin-Series Riding Tack", type: "armor", category: "Armor", subcategory: "Beast Armor", soak: 0, defense: 0, price: 250, encumbrance: 2, hp: 0, r: false, rarity: 4, description: "No matter how tame and biddable a creature is, and how much a rider belives [they] can trust [their] mount, a good set of riding tack is an indispensable part of a beast rider's accoutrement." },
    "capari-series-padded-beast-armor": { name: "Capari-series Padded Beast Armor", type: "armor", category: "Armor", subcategory: "Beast Armor", soak: 2, defense: 0, price: 2500, encumbrance: 4, hp: 0, r: false, rarity: 5, description: "Lighter and more flexible than the heavy Destri-series armor, Capari-series padded beast armor by Piccatech Ltd. offers an excellent balance between protection and wearability." },
    "destri-series-laminate-beast-armor": { name: "Destri-series Laminate Beast Armor", type: "armor", category: "Armor", subcategory: "Beast Armor", soak: 4, defense: 0, price: 8500, encumbrance: 7, hp: 1, r: false, rarity: 7, description: "Destri armor is relatively heavy, and although it's designed to be as easy as possible on the beast wearing it, the armor still necessarily restricts movement and tends to make a creature slower. Beasts wearing Destri-series beast armor have their Agility reduced by 1, to a minimum of 1." },
    "h-series-megafauna-carriage": { name: "H-series Megafauna Carriage", type: "armor", category: "Armor", subcategory: "Beast Armor", soak: 0, defense: 1, price: 5500, encumbrance: 5, hp: 2, r: false, rarity: 7, description: "A beast must have a slihouette of at least 3 and a Brawn of at least 5 to be fitted with a howdah. Basic howdah configurations are readily available for beasts with a tetrapodal or quadrupedal stance, like fambaa or dewback, at the listed price. Howdahs for creatures with more appendages, like the six-legged acklay, can be had for a small additional fee, generally 500 credits. Howdahs can be armored and fitted with one or two Gunnery or vehicle-scale weapons, following the usual restrictions for silhouette." },

    // Medical
    "stimpack": { name: "Stimpack", type: "gear", category: "Medical", subcategory: "Medical", price: 25, description: "Heals 5 wounds. Can be used once.", encumbrance: 0, rarity: 2 },
    "emergency-medpac": { name: "Emergency Medpac", type: "gear", category: "Medical", subcategory: "Medical", price: 100, description: "Enables safe healing of others. Emergency medpacs allow characters to use the Medicine skill to heal others without penalty", encumbrance: 1, rarity: 1 },
    "antishock-blanket": { name: "Antishock Blanket", type: "gear", category: "Medical", subcategory: "Medical", price: 250, encumbrance: 2, rarity: 2, r: false, description: "Makes healing critical injuries easier. When a character uses an antishock blanket to help heal a Critical Injury, the character may reduce the difficulty of the Medicine check made to heal the injury by one, to a minimum of Easy." },
    "athakam-medtech-military-medpac": { name: "Athakam Medtech Military Medpac (Untrained/Emergency)", type: "gear", category: "Medical", subcategory: "Medical", price: 400, encumbrance: 2, rarity: 3, r: false, description: "Enables safe unskilled healing of others. This advanced medpac is carried by soldiers and security personnel who lack advanced medical training to treat severe trauma in battlefield conditions. Medpacs allow characters to attempt to heal others using Medicine checks without penalty. In addition, if the user has no ranks in Medicine, [they] count as having 1 rank in Medicine when using this medpac." },
    "bacta-1-litre": { name: "Bacta (1 litre)", type: "gear", category: "Medical", subcategory: "Medical", price: 20, encumbrance: 1, rarity: 1, r: false, description: "An ancient healing technology, bacta is nothing less than miraculous. Developed thousands of years ago, it is a viscous, clear liquid within which live millions of genetically altered and synthetic bacteria." },
    "bacta-person-sized-tank": { name: "Bacta (person-sized tank)", type: "gear", category: "Medical", subcategory: "Medical", price: 4000, encumbrance: 12, rarity: 1, r: false, description: "Accelerates healing over rest" },
    "bioscan-xeno-medicine": { name: "Bioscan (Xeno-Medicine)", type: "gear", category: "Medical", subcategory: "Medical", price: 5000, encumbrance: 1, rarity: 2, r: false, description: "Makes healing easier. A character using a bioscan can remove two setback dice from any Medicine checks the character makes." },
    "blood-scanner": { name: "Blood Scanner", type: "gear", category: "Medical", subcategory: "Medical", price: 400, encumbrance: 1, rarity: 5, r: false, description: "Assists in identification of toxins/diseases in patient. As an action, a character with a blood scanner may make an Easy difficulty Medicine check to identify foreign elements (including poisons) in a blood sample. In addition to allowing the character to treat any present toxins with the proper antidote, the extensive information about the patient's health adds two automatic advantage results to the next Medicine check the character makes to treat the patient" },
    "calming-salve": { name: "Calming Salve", type: "gear", category: "Medical", subcategory: "Medical", price: 25, encumbrance: 0, rarity: 3, r: false, description: "Revitalizes force sensitives through their connection to the force. Once per session as an action, a Force-sensitive character may use the Calming Salve and make a Force power check. They may spend a Force point generated from Light point results to recover one strain per Force point spent this way." },
    "capc-ecm-598-medical-backpack": { name: "CAPC ECM-598 Medical Backpack", type: "gear", category: "Medical", subcategory: "Medical", price: 450, encumbrance: 2, rarity: 4, r: false, description: "Makes healing easier all around. The ECM-598 medical backpack allows characters to attempt to heal others using Medicine checks without penalty. In addition, it grants a boost die to all Medicine checks made while using the ECM-598 and, thanks to the tutorials and information on the datapad, individuals using this decrease the difficulty of any Medicine checks they make to heal Critical Injuries by 1 to a minimum of Easy difficulty." },
    "chiewab-iraps-cerebral-stablisizer": { name: "Chiewab IRAPS Cerebral Stablisizer", type: "gear", category: "Medical", subcategory: "Medical", price: 2200, encumbrance: 3, rarity: 7, r: false, description: "Brings a patient back from the brink of death. A cerebral stabilizer must be applied to a patient within one round of suffering a Critical Injury. This device may be applied to a character suffering from a \"Bleeding Out\" or \"The End is Nigh\" Critical Injury, or to a character who has died during the current round. Applying the device requires an Average difficulty Medicine check. This stabilizes the character, negating the effects of the Critical Injury as long as the device remains attached. If the character died, they are brought back to life, and their Critical Injury changes to the \"Gruesome Injury\" Critical Injury result (gaining all that injury's effects instead)" },
    "healers-kit": { name: "Healer's Kit", type: "gear", category: "Medical", subcategory: "Medical", price: 0, encumbrance: 2, rarity: 0, r: false, description: "Kit assembled from available materials to enable safe healing of others. Rather than being purchased, a character must fashion [their] own contained and equip the empty pack with native medicinal items through a Hard difficulty Survival check. A healer's kit allows the character to use the Medicine skill to heal [themself] or other individuals without penalty. The GM may spend a despair result on a Medicine check when a character is using a healer's kit to indicate that some or all of the medicinal items have been exhausted in the attempt. In such a case, the healer's kit cannot be used again until the character spends some time restocking and makes an Average difficulty Survival check." },
    "med-aid-patch": { name: "Med-Aid Patch", type: "gear", category: "Medical", subcategory: "Medical", price: 20, encumbrance: 1, rarity: 4, r: false, description: "Improves healing outcomes of patient. When making a Medicine check to heal wounds from a character, a character can expend up to one med-aid patch to add an automatic success and advantage result to the results of the check. A character cannot use more than one med-aid patch per check" },
    "medpac": { name: "Medpac", type: "gear", category: "Medical", subcategory: "Medical", price: 400, encumbrance: 2, rarity: 2, r: false, description: "Improves healing capacity, and contains a stimpack. Standard medpacs allow a user to perform relatively complex medical procedures in the field. Like emergency medpacs, they allow a character to use the Medicine skill without penalty. They also grant a boost die to all Medicine checks. Thanks to their stock of stim applicators, medpacs grant a group the equivalent of one stimpack per scene, at the GM's discretion" },
    "military-traumapac": { name: "Military Traumapac", type: "gear", category: "Medical", subcategory: "Medical", price: 50, encumbrance: 1, rarity: 3, r: false, description: "Sending every soldier into battle with a medkit is not feasible due to weight and cost limitations, but SyntheTech/MedTech has optimized its traumapac for militias, mercenaries, and local defense forces. A traumapac only allows a character to use the Medicine skill to attempt to remove Critical Injuries from others without penalty." },
    "nullicaine": { name: "Nullicaine", type: "gear", category: "Medical", subcategory: "Medical", price: 25, encumbrance: 0, rarity: 2, r: false, description: "Temporarily suppress the effects of a critical injury. A character may apply nullicaine to themself or an engaged character by making an Easy difficulty Medicine check and choosing one Easy, Average, or Hard difficulty Critical Injury the target is currently suffering. If the check succeeds, the target immediately suffers 3 strain and ignores the chosen Critical Injury until the end of the encounter. Nullicaine only affects living creatures" },
    "physicians-kit": { name: "Physician's Kit", type: "gear", category: "Medical", subcategory: "Medical", price: 400, encumbrance: 2, rarity: 2, r: false, description: "Carried by doctors and healers on backwater worlds, physician's kits are bigger and more comprehensive than their medpac cousins. A physician's kit allows a user to perform relatively complex medical procedures in the field. Like emergency medpacs, physician's kits allow a character to use the Medicine skill without penalty, and in addition grant a boost die to all Medicine skill checks. Also, thanks to their stock of stimulants and other unguents, these kits add an automatic advantage result to successful Medicine checks made while using the kit." },
    "plasma-protein-replicator": { name: "Plasma Protein Replicator", type: "gear", category: "Medical", subcategory: "Medical", price: 5500, encumbrance: 3, rarity: 4, r: false, description: "Replenishing an individual's vital bodily fluids from an external source can reduce the recovery time from particularly traumatic injuries. When a character uses a plasma protein replicator to help heal a Critical Injury, the character adds an automatic success result to the Medicine check made to heal the injury." },
    "spray-plasto-cast": { name: "Spray Plasto-Cast", type: "gear", category: "Medical", subcategory: "Medical", price: 35, encumbrance: 1, rarity: 1, r: false, description: "Quickly immobilizing a limb injury after it happens can prevent the extremity from becoming more seriously damaged through accidental misuse. A character can make an Easy difficulty Medicine check to apply a spray plasto-cast to a limb that has been crippled or disabled due to a Critical Injury. If successful, the Critical Injury heals automatically after one week of narrative time" },
    "stimstick": { name: "Stimstick", type: "gear", category: "Medical", subcategory: "Medical", price: 5, encumbrance: 0, rarity: 2, r: false, description: "Throughout history, the most basic form of security against intrusion has come in the form of observant sentries. A character who chews a stimstick removes a setback die from their Discipline, Perception, Resilience, or Vigilance checks to stay awake or notice something due to fatigue or lack of sleep until the end of the encounter. At the end of the encounter, the character suffers 1 strain." },
    "synthskin-synthflesh": { name: "Synthskin/Synthflesh", type: "gear", category: "Medical", subcategory: "Medical", price: 10, encumbrance: 0, rarity: 1, r: false, description: "Cosmetic application to replace lost skin and flesh. Synthskin and synthflesh are two versions of a synthetic, skin-like covering used in medicine and the production of cybernetic limbs. Synthskin applications are one-use items that can be used as first aid to treat cuts and bruises." },
    "xv-09-chemical-restraint-harness": { name: "XV-09 Chemical Restraint Harness", type: "gear", category: "Medical", subcategory: "Medical", price: 1200, encumbrance: 2, rarity: 5, r: false, description: "Using a Pacifier on a wild animal is a temporary fix at best, and should only be done in emergencies. Mounting the harness on a creature requires a Hard difficulty Survival check to ensure the harness is fitted properly and the auto-hypo is situated correctly. The difficulty of this check can be reduced by 1 with a successful Knowledge (Xenology) check. If successful, the XV-09 grants two boost dice to any Survival checks made to control the beast wearing the harness. In addition, creatures that are successfully pacified gain a boost die to any Discipline checks. Game Masters can spend any threat result generated by the initial Survival check to reflect one or more negative side effects caused by the drugs. The exact nature of these side effects is left to the Game Master's discretion. In addition, the Game Master can spend three threat results or a despair result to reflect a catastrophic reaction to the drugs, such as a heart attack or brain aneurysm, which results in the animal's death. While safe for use on animals, the powerful mixture of chemicals in the harness can be dangerous to the minds of sentient beings. Attaching the harness to a sentient being can result in permanent brain damage and even death." },
    "xv-20-portable-veterinary-kit": { name: "XV-20 Portable Veterinary Kit", type: "gear", category: "Medical", subcategory: "Medical", price: 500, encumbrance: 2, rarity: 3, r: false, description: "The XV-20 operates in a manner similar to a portable healing kit in that it allows an individual to treat a wounded or ill creature without penalty. Additionally, the kit grants a boost die to all Medicine, Survival, and Knowledge (Xenology) skill checks made to diagnose or treat such animals" },
    "xc-38-veterinary-kit": { name: "XC-38 Veterinary Kit", type: "gear", category: "Medical", subcategory: "Medical", price: 600, encumbrance: 3, rarity: 3, r: false, description: "Designed for use by veterinarians, beast breeders, or anyone who deals with large and dangerous animals for a living, the PLAV contains enough drugs, medical supplies, specialty tools, and other gear to stabilize wounded creatures in the field until they can be moved. The PLAV allows a user to examine, analyze, and perform medical procedures on all manner of creatures. As the medpac does for humanoid species, the PLAV allows a character to medically treat alien creatures without penalty. Additionally, it grants a boost die to all Medicine, Survival, and Knowledge (Xenology) skill checks made to analyze or treat these creatures" },

    // Drugs and Poisons
    "affide-crystal": { name: "Affide Crystal", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 500, encumbrance: 0, rarity: 8, r: true, description: "Affide crystals are commonly used as a last-resort 'suicide pill' in the event of capture or torture. A single affide crystal is a poison that requires an upgraded Daunting difficulty Resilience check to overcome when ingested. The poison inflicts 10 wounds and a Critical Injury on a failed check. Each threat result generated adds +40 to the roll for the Critical Injury result. GMs may spend three threat results or a despair result to kill a target instantly, leaving no opportunity for resuscitation" },
    "antidote-set": { name: "Antidote Set", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 250, encumbrance: 1, rarity: 5, r: false, description: "Poisoning is not a common concern for most citizens, but for certain high-value persons of interest, it is an all too real hazard. A character using an antidote set reduces the difficulty of any check to resist a poison by two (to a minimum of Easy difficulty). If they do not know which poison was used, they must make a Hard difficulty Knowledge (Underworld) check to make an educated guess at the poison based on the region, the poison's qualities, and other evidence at their disposal to benefit from this item" },
    "bearsloth-venom": { name: "Bearsloth Venom", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 150, encumbrance: 0, rarity: 3, r: false, description: "At any dose size, this poison has a Daunting difficulty (which the target resists with Resilience). If the target fails, the poison causes an immediate Critical Injury, but instead of rolling on the Critical Injury Result table, the character automatically suffers the following special Critical Injury: Wracking Venom (Hard difficulty): Whenever this character would otherwise suffer 1 or more wounds or 1 or more strain, this character suffers that number of wounds or strain plus 2 instead. Bearsloth venom can be harvested and in the marketplaces of Quolas, this poison has a price and rarity as above." },
    "cyanosis-d-570": { name: "Cyanosis D-570", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 50, encumbrance: 1, rarity: 4, r: false, description: "Cyanoxis D-570 was originally developed by Toxico as an all-purpose rodenticide. One dose of Cyanoxis D-570 requires a character to make a Hard difficulty Resilience check to overcome. On a failed check, the poison inflicts 2 wounds and 2 strain immediately, plus 1 wound and 1 strain per day for ten days or until the target succumbs to death. Each threat result generated inflicts 1 additional strain per day as internal blood loss takes its toll on the target's constitution. A despair result can be spent to increase the number of days the poison stays in effect by one." },
    "dendriton-toxin": { name: "Dendriton Toxin", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 125, encumbrance: 0, rarity: 7, r: true, description: "Dendriton toxion is an exceedingly lethal neurotoxin favored by assassins who prefer their victims to suffer. Any sized dose has a Daunting difficulty. If the target fails the check, the poison inflicts 1 strain at the end of [their] next turn, 3 strain at the end of [their] subsequent turn, and 5 strain at the end of the turn after that one (this ignores soak). In addition, the target suffers a setback die to any check [they] attempt while under the effects of the poison, and each threat result [they] generate on those checks inflicts 1 additional strain (this ignores soak) as the target is wracked with pain and violent muscle spasms. The GM may spend a despair result on the initial Resilience check to make the target make another check against the poison at the end of [their] third turn or suffer an additional 5 strain (this ignores soak) as the poison torments [them]." },
    "dioxis-gas": { name: "Dioxis Gas", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 100, encumbrance: 0, rarity: 6, r: true, description: "Used since before the Clone Wars, dioxis can be lethal to most carbon-based life forms within less than one minute following exposure. A single dose has a Hard difficulty, while two or more doses combined have a Daunting difficulty. The poison inflicts 5 wounds if the target fails a check at the relevant difficulty (this ignores soak). In addition, each threat result generated inflicts 2 strain on the target (this ignores soak), who becomes overwhelmed by the nausea and muscle spasms caused by the choking gas. The gas lingers in the air for up to 3 rounds unless dissipated by high winds." },
    "questioner-9-serum-single": { name: "Questioner-9 Interrogation Serum (single)", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 300, encumbrance: 0, rarity: 6, r: true, description: "Reduces ability to lie or with-hold information. Interrogators typically inject the serum into a restrained or helpless target, but Questioner-9 can also operate through ingestion by an unsuspecting diner. The serum takes effect in the victim's system after a delay of about five minutes. At this point, the victim upgrades the difficulty of all checks to withhold information or resist manipulation (including resisting Force powers such as Influence) once for the next 24 hours" },
    "questioner-9-serum-box": { name: "Questioner-9 Interrogation Serum (box of 100)", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 24000, encumbrance: 5, rarity: 7, r: true, description: "Reduces ability to lie or with-hold information. Interrogators typically inject the serum into a restrained or helpless target, but Questioner-9 can also operate through ingestion by an unsuspecting diner. The serum takes effect in the victim's system after a delay of about five minutes. At this point, the victim upgrades the difficulty of all checks to withhold information or resist manipulation (including resisting Force powers such as Influence) once for the next 24 hours" },
    "raquor-venom": { name: "Raquor Venom", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 150, encumbrance: 0, rarity: 7, r: true, description: "Extracted from the glandular toxin sacs of Sriluurian dark wolves, raquor venom is a powerful paralytic enzyme inhibitor. Any sized dose has a Daunting difficulty. The poison Staggers the target for 2 rounds if the target inflicts 2 strain on the target (this ignores soak), and the GM may spend a despair result to Immobilize the target for 2 rounds. While raquor venom is usually introduced via injection, it can be aerosolized for use in poison gas grenades, though this reduces the effectiveness to a Hard difficulty." },
    "skirtopanol": { name: "Skirtopanol", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 500, encumbrance: 0, rarity: 8, r: true, description: "Originally produced for Corellian Security (CorSec) intelligence agents by Chiewab Amalgamated Pharmaceuticals, Skirtopanol is a powerful truth serum used to coerce confessions out of suspects. One dose of Skirtopanol requires a Hard difficulty Resilience check to overcome. On a failed check, the drug inflicts 5 strain, and the difficulty of all checks the target makes to resist Charm or Coercion for the remainder of the encounter is upgraded once. In addition, each threat result generated on the original check inflicts 2 strain on the target. Finally, the GM can spend a despair result to make the target check against the drug again during the next round, as it remains in their system." },
    "sleeppack": { name: "Sleeppack", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 250, encumbrance: 0, rarity: 3, r: false, description: "Physically similar to a stimpack, a sleeppack is an auto-injection tube filled with a variety of natural and synthetic sedatives. Applying a sleeppack to an aware and unwilling target requires the wielder to make a Hard difficulty Brawl or Melee combat check against the target. Instead of inflicting damage, if the attacker succeeds, the target must immediately resist the effects of the medications that flood the system as a poison (with a Resilience check). Any sized dose has a Hard difficulty, and failure inflicts 10 strain." },
    "synthetic-anesthetic": { name: "Synthetic Anesthetic", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 35, encumbrance: 0, rarity: 4, r: false, description: "This is a general anesthetic produced on many worlds for medical procedures and designed to render the user unconscious. This poison may be introduced into a target's body via aerosol deployment, food ingestion, or injection with an applicator or dart. Resisting a single dose requires an Average difficulty Resilience check, while two ore more doses combined into a single application require a Hard difficulty Resilience check. The poison inflicts 5 strain if the target fails the check. One to two threat results my be spent to force the target to give up their free maneuver during their next turn (the target may still take two maneuvers, however). Three threat results or more may be spent to stagger the target during their next turn. Finally, a despair result may be spent to make the target test against the poison again during the next round, as the poison remains in the target's system" },
    "synthetic-neuroparalytic": { name: "Synthetic Neuroparalytic", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 75, encumbrance: 0, rarity: 6, r: true, description: "Poisons that paralyze a target but leave higher cognitive functions intact are difficult to create and administer. This poison may only be introduced into a target via injection, as with an applicator or dart. Any dose size requires a Hard difficulty Resilience check to resist. The poison immobilizes the target for three rounds if the target fails the check. In addition, each threat result may be spent to inflict 1 strain on the target. A result of despair may be spent to make the target test against the poison again during the next round, as the poison remains in their system." },
    "synthetic-neurotoxin": { name: "Synthetic Neurotoxin", type: "gear", category: "Medical", subcategory: "Drugs and Poisons", price: 50, encumbrance: 0, rarity: 6, r: true, description: "Synthetic neurotoxin is a general poison synthetically produced, often illegally, on hundreds of worlds. This poison may be introduced into the target's body via aerosol deployment, food ingestion, or injection with an applicator or dart. Resisting a single dose requires an Average difficulty Resilience check, while two or more doses combined into a single application require a Hard difficulty Resilience check. The poison inflicts 5 wounds if the target fails the check. Each threat result generated may be spent to inflict 1 strain on the target as the effort of fighting the poison overwhelms them. Finally, a despair result may be spent to make the target test against the poison again during the next round, as the poison remains in their system." },

    // Tools
    "applied-imaging-b310-micro-imager": { name: "Applied Imaging B310 Micro-Imager", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 5250, encumbrance: 2, rarity: 2, r: false, description: "Magnifies objects up to 100,000 times its original size. A micro-imager adds two boost dice to any Perception, Knowledge (Lore), or Knowledge (Education), checks for which magnification of fine details can contribute to the research at hand." },
    "arakyd-industries-recon-remote": { name: "Arakyd Industries Recon Remote", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 250, encumbrance: 1, rarity: 3, r: false, description: "Flying camera which transmits up to 20km away for 24h. The Recon Remote is roughly the size of a shuura fruit (silhouette 0), and can travel at speeds of 20 km per hour. They feature full 360 degree visual sensors with night vision capability and have the ability to transmit data to a remote receiver up to 20 kilometers away. The control unit can monitor the input from up to four of these remotes simultaneously. Arakyd Industries' brand of remote can run for 24 hours before needing to be recharge." },
    "authentication-tools": { name: "Authentication Tools", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 100, encumbrance: 1, rarity: 5, r: false, description: "Checks for falsified documents. A character using authentication tools adds two boost dice to checks to determine if a document has been falsified." },
    "bardottan-chronoscanner": { name: "Bardottan Chronoscanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 1200, encumbrance: 0, rarity: 2, r: false, description: "Distinguishes antiquities from replicas." },
    "bioscan-scanner": { name: "Bioscan (Scanner)", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 2000, encumbrance: 1, rarity: 1, r: false, description: "Can detect life-forms and potentially identify their identity. Using a bioscan to scan an area for life signs grants a boost die to any opposed Perception checks vs Stealth. Using the device to verify a person's identity requires an Average difficulty Computers check and a biometric identifier (such as DNA or a record of physiological characteristics) for comparison. The Game Master may modify this difficulty based upon any unusual anatomical characteristics of the target's species." },
    "bothawui-hsi-280-hyperwave-signal-interceptor": { name: "Bothawui Communications Conglomerate HSI-280 Hyperwave Signal Interceptor", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 10500, encumbrance: 5, rarity: 8, r: false, description: "Intercepts communications travelling through hyperspace and subspace." },
    "cargo-scanner": { name: "Cargo Scanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 300, encumbrance: 1, rarity: 4, r: false, description: "Determines carrying capacity of a vessel. A character using a cargo scanner may make an Average difficulty Computers check to increase the available encumbrance capacity of a planetary vehicle or starship with a silhouette of 3 or more by 10 percent (rounding up) thanks to more efficient organization." },
    "chedak-mark-10-demolitions-scanner": { name: "Chedak Mark 10 Demolitions Scanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 300, encumbrance: 1, rarity: 4, r: false, description: "Detects explosive devices. The demolitions scanner allows the user to detect concealed explosive devices, and adds a boost die to any checks to do so." },
    "com-scan": { name: "Com-Scan", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 5000, encumbrance: 10, rarity: 6, r: true, description: "Triangulates location of known comlinks/tranceivers at close planetary range. Using a com-scan, a character can triangulate the location and movement of a known comlink or a transceiver with an Average difficulty Computers check. The device functions out to close range on planetary scale. Prevailing atmospheric conditions or excessive background signals can reduce its efficacy." },
    "concealed-recorder": { name: "Concealed Recorder", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 175, encumbrance: 0, rarity: 5, r: false, description: "Records audio from an inconspicuous device. Add two setback dice to a character's Perception checks to find a concealed recorder on a person's body." },
    "cryoncorp-armascan-weapon-detection-goggles": { name: "CryonCorp Armascan Weapon Detection Goggles", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 750, encumbrance: 1, rarity: 5, r: false, description: "Detects weaponry of all kind. A character using weapon detection goggles may add up to two boost dice to Perception checks when attempting to find a concealed weapon on a person." },
    "cryoncorp-enhancescan-long-range-terrain-scanner": { name: "CryonCorp EnhanceScan Long-Range Terrain Scanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 850, encumbrance: 6, rarity: 6, r: false, description: "Produces detailed maps of a planetary body. Successfully using the LRTS requires an Average difficult Computers check on the part of the operator. Maps produced with the LRTS add a boost die to any Survival check made to navigate using the map plus an automatic success result for every two advantage results gained on the Computers check." },
    "cryoncorp-ground-penetrating-sensor-pack": { name: "CryonCorp Ground-Penetrating Sensor Pack", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 950, encumbrance: 5, rarity: 7, r: false, description: "Produces subterranean images / composition charts. Using a GPSP does not require a skill check, but interpreting the unit's finding might. If the Game Master sees fit, [they] can require a Computers skill check to figure out what exactly the GPSP is seeing." },
    "databar-sds-632-surveillance-detector": { name: "Databar SDS-632 Surveillance Detector", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 450, encumbrance: 1, rarity: 3, r: false, description: "Short range detector for listening devices. A surveillance detector adds two boost dice to any Perception or Vigilance checks to attempt to identify the presence of a bug within short range of the user." },
    "electrobinoculars": { name: "Electrobinoculars", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 250, encumbrance: 1, rarity: 1, r: false, description: "Magnifies targets at range & vision in different light conditions. Electrobinoculars allow their user to see normally in low light, extremely bright conditions, and inclement conditions. They also provide magnification of targets up to ten kilometers away. When using electrobinoculars, characters may remove a setback die from any Perception checks made to identify an object in low light or at long distances." },
    "fabritech-7000-geoscanner": { name: "Fabritech 7000 Geoscanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 4800, encumbrance: 2, rarity: 3, r: false, description: "Scans planetary surfaces for subterranean environments. A geoscanner adds a boost die to any Perception, Knowledge (Lore), or Knowledge (Education) checks related to studying the subterranean environment within medium range of the user." },
    "general-purpose-scanner": { name: "General Purpose Scanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 500, encumbrance: 2, rarity: 3, r: false, description: "General purpose scanners are usually small, handheld devices designed to sense and record a variety of data." },
    "hand-scanner": { name: "Hand Scanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 100, encumbrance: 0, rarity: 2, r: false, description: "Specialised scanner designed for a single task. While this device provides no specific bonuses, it may allow character to uncover information related to its focus, at the GM's discretion." },
    "holoscanner-small-unit": { name: "Holoscanner (small unit)", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 2000, encumbrance: 10, rarity: 5, r: false, description: "Assists in detecting concealed items in a container or person. Holoscanners reduce the difficulty of Perception or Vigilance checks to discover concealed items on a person or in a container or vehicle by two. A holoscanner cannot typically scan an item or group of items with encumbrance higher than its own." },
    "holoscanner-large-unit": { name: "Holoscanner (large unit)", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 10000, encumbrance: 100, rarity: 5, r: false, description: "Assists in detecting concealed items in a container or person. Holoscanners reduce the difficulty of Perception or Vigilance checks to discover concealed items on a person or in a container or vehicle by two. A holoscanner cannot typically scan an item or group of items with encumbrance higher than its own." },
    "hunting-goggles": { name: "Hunting Goggles", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 600, encumbrance: 0, rarity: 5, r: false, description: "Enhances tracking of specified targets. Hunting goggles grant a boost die to any Perception checks made to locate prey, and thanks to their image magnification and enhancement, they remove up to two setback dice imposed due to concealment, darkness, fog, or mist from all Ranged (Light) and Ranged (Heavy) checks." },
    "idellian-arrays-ilf-6500-life-form-scanner": { name: "Idellian Arrays ILF-6500 Life Form Scanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 900, encumbrance: 4, rarity: 5, r: false, description: "Monitors area for life-forms, capable of tracking and determining threat level. Setting up the ILF-6500 requires either an Average difficulty Survival check or a Hard difficulty Education or Computers check to ensure that the device is properly calibrated and located in the best possible area for taking full advantage of its scanning capabilities." },
    "infrabinoculars-basic": { name: "Infrabinoculars (basic)", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 350, encumbrance: 1, rarity: 5, r: false, description: "Views through thick walls. A character using infrabinoculars can see through up to two meters of wall, possibly allowing surveillance of a whole building at once. Walls made of dense materials or constructed to shield their interiors may impose one or more setback dice on Perception checks." },
    "infrabinoculars-long-range": { name: "Infrabinoculars (long-range)", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 500, encumbrance: 1, rarity: 6, r: false, description: "Views through thick walls at longer range. A character using infrabinoculars can see through up to two meters of wall, possibly allowing surveillance of a whole building at once. Walls made of dense materials or constructed to shield their interiors may impose one or more setback dice on Perception checks. Some models of infrabinoculars can alternate between this infrared sensor package and a long-range view equivalent to that of electrobinoculars." },
    "low-feedback-scanner": { name: "Low-Feedback Scanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 700, encumbrance: 4, rarity: 5, r: false, description: "Detects radiation and life-forms at range. This sensor can detect radiation sources of silhouette 1 or larger within short range, life forms within medium range, power sources within long range, and comms signals within extreme range. Extend the range of detection by 1 range band for every silhouette size by which the target's size exceeds silhouette 1." },
    "macrobinoculars": { name: "Macrobinoculars", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 75, encumbrance: 1, rarity: 2, r: false, description: "Simpler, less expensive, and often more reliable than electrobinoculars, macrobinoculars are a common sight throughout the galaxy." },
    "microdroid-listener": { name: "Microdroid Listener", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 1500, encumbrance: 0, rarity: 6, r: true, description: "Tiny droid that can record audio and move about, must be retrieved to obtain data. Planting this device without being noticed requires an opposed Skulduggery check vs. Vigilance. Once the bug is in place, a character must make a Daunting difficulty Vigilance check to locate it even when they are specifically searching for one. The microdroid has no self-defense or evasive capabilities, although some manufacturers fit their models with a self-destruct in case of tampering." },
    "mine-detector": { name: "Mine Detector", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 350, encumbrance: 1, rarity: 4, r: false, description: "Reveals mines within a decent range. Using a mine detector to locate concealed mines requires a Hard difficulty Computers or Average difficulty Vigilance check with appropriate modifications for environmental conditions such as weather, flora, roughly terrain, or the composition of the ground. On a successful check, all mines and other explosive devices within medium range are revealed to the user." },
    "paradour-enterprises-signature-scent-synthesizer": { name: "Paradour Enterprises Signature Scent Synthesizer", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 1500, encumbrance: 1, rarity: 4, r: false, description: "Produces pleasant smells, such as perfume. Using a signature scent synthesizer prior to a discussion removes two setback dice from the first Charm, Coercion, or Negotiation check made during the encounter." },
    "px-7-heat-sensor": { name: "PX-7 Heat Sensor", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 250, encumbrance: 3, rarity: 7, r: false, description: "Detects all heat signatures. A PX-7 heat sensor adds two boost dice to Perception checks to find heat-emitting objects within short range and adds a boost die to Mechanics checks to remove Critical Hits from starships and Critical Injuries from droids." },
    "scanner-goggles": { name: "Scanner Goggles", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 150, encumbrance: 0, rarity: 3, r: false, description: "Basic electrobinoculars integrated in goggles. When worn, scanner goggles allow the wearer to see normally in dark conditions." },
    "se-90-structural-engineering-scanner": { name: "SE-90 Structural Engineering Scanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 675, encumbrance: 1, rarity: 6, r: false, description: "Can see through walls and bulkheads within a short range. Using an SE–90 requires an Average difficulty Computers check modified according to construction materials and environmental interference per the GM's discretion. A character who succeeds can see through walls or bulkheads up to short range until the end of the encounter or the scanner is moved." },
    "se-vigilant-automated-sensor": { name: "SE-Vigilant Automated Sensor", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 3000, encumbrance: 2, rarity: 4, r: false, description: "Detects motion at range, then scans for threat levels when triggered. This lightweight beacon is a sensor pod attached to a 1.6-meter collapsible post primarily used by homesteads, militias, and big game hunters." },
    "shipboard-systems-scanner": { name: "Shipboard Systems Scanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 145, encumbrance: 1, rarity: 4, r: false, description: "Detects system strain on vehicles and starships. A shipboard systems scanner removes a setback die from checks to remove system strain from starships and vehicles." },
    "sporting-macrobinoculars": { name: "Sporting Macrobinoculars", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 250, encumbrance: 1, rarity: 2, r: false, description: "Macrobinoculars with recording ability. Sporting macrobinoculars magnify objects up to five kilometers away, and can record objects viewed. They also remove a setback die imposed due to long range or poor light." },
    "suritech-foodstuffs-ez1-analyser": { name: "SuriTech Foodstuffs Ez1 Analyser", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 300, encumbrance: 1, rarity: 3, r: false, description: "Scans food for safety - per species. No skill check is required to use a food analyzer." },
    "surveillance-scanner": { name: "Surveillance Scanner", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 750, encumbrance: 2, rarity: 5, r: false, description: "Scans for surveillance equipment. Surveillance scanners have a range of close on the planetary scale or long on the personal scale. Using a surveillance scanner upgrades the ability of any checks made to locate bugs, sweep rooms for hidden cameras, pick up data streams, or engage in any other counter-surveillance activities once." },
    "surveillance-tagger": { name: "Surveillance Tagger", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 175, encumbrance: 0, rarity: 4, r: true, description: "Tracks and transmits audio back from planted location. Tiny and unobtrusive, surveillance taggers are small radio transmitting beacons used to aid in surveillance and tracking." },
    "surveyors-equipment": { name: "Surveyor's Equipment", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 700, encumbrance: 6, rarity: 8, r: false, description: "Maps surfaces for ease of construction. Surveyor's equipment adds two boost dice to a character's Perception checks when determining locations on a planet's surface, measuring distances, plotting settlements or bases, or creating detailed planetary maps." },
    "taggeco-privacy-7-audio-curtain": { name: "TaggeCo Privacy-7 Audio Curtain", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 500, encumbrance: 4, rarity: 6, r: false, description: "Barrier which disrupts audio waves. Characters attempting to listen in on a conversation which is being obscured by one or more audio curtains must make a Hard difficulty Perception check to understand anything being said. The GM can spend a threat or despair result to have the character misunderstand key words or phrases." },
    "toxin-detector": { name: "Toxin Detector", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 125, encumbrance: 1, rarity: 4, r: false, description: "Determines if there are toxins or poisons in the environment. Toxin detectors are simple handheld devices that can detect traces of toxins and poisons." },
    "trackers-goggles": { name: "Tracker's Goggles", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 600, encumbrance: 0, rarity: 5, r: false, description: "Enhances tracking abilities of wearer. Tracker's goggles grant a boost die to the wearer's Perception checks to locate a target by sight. Additionally, they remove two setback dice imposed due to concealment, darkness, fog, or mist from the wearer's Ranged (Light) and Ranged (Heavy) checks." },
    "veridicator-200": { name: "Veridicator 200", type: "gear", category: "Gear and Equipment", subcategory: "Scanners", price: 4000, encumbrance: 1, rarity: 8, r: false, description: "Assists in telling whether someone is lying or not. Only one target can be scanned and monitored at a time, and they must be relatively nearby. Both the user and the target must remain relatively still, though small movements are unlikely to affect the device's readings. A character wearing a Veridicator 200 adds two boost dice to checks to discern whether another character is lying or omitting significant information and adds two boost dice to checks to ascertain another character's mental state." },
    
    // Black Market
    "stealth-field-generator": { name: "Stealth Field Generator", type: "gear", category: "Black Market", price: 800, description: "Grants a bonus to Stealth checks for a limited duration.", encumbrance: 1 }
};

const masterAbilityList = {
    "Auto-fire": {
        name: "Auto-fire (Active)",
        cost: 2,
        description: "Spend 2 Advantage to hit an additional time. Can be activated multiple times. Each hit deals base damage plus un-canceled Successes."
    },
    "Blast": {
        name: "Blast (Active)",
        cost: 0, // Special cost, handled in logic
        description: "If the attack hits, spend Advantage to activate. Each character engaged with the target suffers damage equal to the Blast rating. Can be triggered on a miss for 3 Advantage."
    },
    "Breach": {
        name: "Breach (Passive)",
        description: "Ignores one point of Armor (and 10 points of soak) for each rating of Breach."
    },
    "Burn": {
        name: "Burn (Active)",
        cost: 0, // Activates on success
        description: "If the attack is successful, the target continues to suffer the weapon's base damage for a number of rounds equal to the Burn rating."
    },
    "Concussive": {
        name: "Concussive (Active)",
        cost: 0, // Activates on success
        description: "The target is staggered for a number of rounds equal to the weapon's Concussive rating."
    },
    "Cortosis": {
        name: "Cortosis (Passive)",
        description: "Immune to the Sunder quality. Armor with this quality makes the wearer's soak immune to Pierce and Breach."
    },
    "Cumbersome": {
        name: "Cumbersome (Passive)",
        description: "Requires a Brawn characteristic equal to or greater than the Cumbersome rating. For each point of Brawn the character is deficient, increase the difficulty of checks made with the weapon by one."
    },
    "Defensive": {
        name: "Defensive (Passive)",
        description: "A weapon with this quality increases the wielder's melee defense by its rating."
    },
    "Deflection": {
        name: "Deflection (Passive)",
        description: "A weapon with this quality increases the wielder's ranged defense by its rating."
    },
    "disorient": { 
        name: "Disorient", 
        description: "After hitting with a combat check, may spend 2 Advantage to disorient the target for a number of rounds equal to ranks in Disorient.", 
        type: "active",
        cost: { advantage: 2 } // Add this line
    },
    "Ensnare": {
        name: "Ensnare (Active)",
        cost: 0, // Activates on success
        description: "On a successful hit, the target is immobilized for a number of rounds equal to the Ensnare rating. The target can attempt a Hard Athletics check to break free."
    },
    "Guided": {
        name: "Guided (Active)",
        cost: 3, // Assuming a cost for the subsequent activation
        description: "After a miss, you can spend Advantage to have the projectile continue tracking and attack again on a subsequent turn. The difficulty is based on the target's silhouette."
    },
    "Knockdown": {
        name: "Knockdown (Active)",
        cost: 0, // Activates with Advantage or Triumph
        description: "When triggered, the target is knocked prone. Unless specified otherwise, requires Advantage to activate."
    },
    "Inaccurate": {
        name: "Inaccurate (Passive)",
        description: "Adds a Setback die to the attacker's dice pool for each rating of Inaccurate."
    },
    "Inferior": {
        name: "Inferior (Passive)",
        description: "This weapon is of shoddy craftsmanship. An Inferior weapon generates one automatic Threat on all checks related to its use. Its base damage is decreased by one."
    },
    "Ion": {
        name: "Ion (Passive)",
        description: "Deals ion damage, which is effective against droids, vehicles, and shields, typically inflicting system strain instead of wounds."
    },
    "Limited Ammo": {
        name: "Limited Ammo (Passive)",
        description: "The weapon can only be used a number of times equal to its rating before it must be reloaded, which requires a maneuver."
    },
    "Linked": {
        name: "Linked (Active)",
        cost: 2,
        description: "Spend 2 Advantage to hit an additional time. Can be activated a number of times equal to the Linked rating."
    },
    "Linked": {
        name: "Linked (Active)",
        cost: 2,
        description: "On a successful attack, spend 2 Advantage to gain an additional hit. This may be done a number of times equal to the weapon's Linked rating. Each hit deals base damage plus total Successes scored on the check."
    },

    "Pierce": {
        name: "Pierce (Passive)",
        description: "An attack made with this weapon ignores one point of soak for each rank of Pierce. If the weapon has more ranks of Pierce than the target's total soak, it completely ignores the target's soak."
    },
    "Prepare": {
        name: "Prepare (Passive)",
        description: "This weapon requires time to set up. The user must perform a number of preparation maneuvers equal to the weapon's Prepare rating before making attacks with that weapon."
    },
    "Slow-Firing": {
        name: "Slow-Firing (Passive)",
        description: "This weapon needs time to recharge or cool down. A weapon's Slow-Firing rating dictates how quickly it can be fired after an attack. For example, Slow-Firing 2 means you must wait two Rounds after firing before it can be fired again."
    },
    "Stun Setting": {
        name: "Stun Setting (Active)",
        cost: 0,
        description: "A weapon with Stun causes strain to the target. When the Stun quality is activated, it inflicts strain equal to the weapon's Stun rating."
    },
    "Stun Damage": {
        name: "Stun Damage (Passive)",
        description: "Some weapons deal Stun damage instead of regular damage. In this case, the weapon deals damage as strain instead of wounds. This damage is still reduced by a target's soak. A variant of this is a Stun setting. As a free action, the wielder can choose to switch the setting of his weapon to 'Stun.' In this case, it does stun damage as described above. When weapons with a stun setting are used to deal stun damage, their range changes to short and cannot be increased."
    },
    "Sunder": {
        name: "Sunder (Active)",
        cost: 1, // Requires a Triumph to activate
        description: "When activated, the attacker chooses one item openly wielded by the target (weapon, shield, etc.). That item is damaged one step from undamaged to Minor, Minor to Moderate, or Moderate to Major. If it already suffers Major damage, it is destroyed."
    },
    "Superior": {
        name: "Superior (Passive)",
        description: "A Superior weapon is a sterling example of its kind. It generates one automatic Advantage on all checks related to its use, and its base damage is increased by one."
    },
    "Tractor": {
        name: "Tractor (Passive)",
        description: "Instead of firing searing beams of laser fire or crackling ion discharges, this weapon fires relatively harmless electromagnetic beams that ensnare ships and hold them fast in space."
    },
    "Vicious": {
        name: "Vicious (Passive)",
        description: "When this weapon scores a critical injury, the character adds ten times the Vicious rating to the critical roll. With Vicious 3, for example, the victim adds +30 to his critical hit result."
    }
};

const masterSkillsList = {
    general: [
        { name: "Astrogation", char: "Int" }, 
        { name: "Athletics", char: "Br" }, 
        { name: "Charm", char: "Pr" },
        { name: "Coercion", char: "Will" }, 
        { name: "Computers", char: "Int" }, 
        { name: "Cool", char: "Pr" },
        { name: "Coordination", char: "Ag" }, 
        { name: "Deception", char: "Cun" }, 
        { name: "Discipline", char: "Will" },
        { name: "Leadership", char: "Pr" }, 
        { name: "Mechanics", char: "Int" }, 
        { name: "Medicine", char: "Int" },
        { name: "Negotiation", char: "Pr" }, 
        { name: "Perception", char: "Cun" }, 
        { name: "Piloting (Planetary)", char: "Ag" },
        { name: "Piloting (Space)", char: "Ag" }, 
        { name: "Resilience", char: "Br" }, 
        { name: "Skulduggery", char: "Cun" },
        { name: "Stealth", char: "Ag" }, 
        { name: "Streetwise", char: "Cun" }, 
        { name: "Survival", char: "Cun" },
        { name: "Vigilance", char: "Will" },
    ],
    combat: [
        { name: "Brawl", char: "Br" }, 
        { name: "Gunnery", char: "Ag" }, 
        { name: "Melee", char: "Br" },
        { name: "Ranged (Light)", char: "Ag" }, 
        { name: "Ranged (Heavy)", char: "Ag" },
    ],
    knowledge: [
        { name: "Knowledge (Core Worlds)", char: "Int" }, 
        { name: "Knowledge (Education)", char: "Int" }, 
        { name: "Knowledge (Lore)", char: "Int" },
        { name: "Knowledge (Outer Rim)", char: "Int" }, 
        { name: "Knowledge (Underworld)", char: "Int" }, 
        { name: "Knowledge (Xenology)", char: "Int" },
    ]
};

const masterSpeciesList = {
    "aleena": {
        name: "Aleena",
        description: "A diminutive species known for their incredible speed and reflexes.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Aleena.png?alt=media&token=b2a2f51c-69c0-4e6a-be7f-14526e61cea4",
        stats: { brawn: 1, agility: 3, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 95,
        woundThreshold: "8 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Starts with 1 rank in Coordination and 1 rank in the Durable talent. Silhouette 0." }
        ],
    homeworld: "Place holder",
    physiology: "Place holder",
    society: "Place holder",
    language: "Place holder",
    additional: "Place holder"
    },
    "anx": {
        name: "Anx",
        description: "Tall, saurian sentients with massive head-crests that indicate their mood through color changes.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Anx.png?alt=media&token=fa6ecfab-3470-4830-9ecd-a06db55b4793",
        stats: { brawn: 3, agility: 1, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 85,
        woundThreshold: "13 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Starts with 1 rank in the Kill With Kindness talent and 1 rank in the Lethal Blows talent. Their Mood Indicator crest adds Setback to all Deception checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "aquala-aqualish": {
        name: "Aqualish - Aquala",
        description: "A triad of aggressive, tusked sub-species from the planet Ando, often found in rough-and-tumble professions across the galaxy.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Aqualish.png?alt=media&token=9ed20969-14fd-44ab-acd0-651f25b4bd59",
        stats: { brawn: 3, agility: 2, intellect: 1, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 90,
        woundThreshold: "11 + Brawn",
        strainThreshold: "8 + Willpower",
        specialAbilities: [
            { text: "All Aqualish are amphibious and begin with one rank in Brawl (max 2 at creation)." },
            { title: "Aquala:", text: "Begin with one rank in Resilience. Remove Setback from cold/wet conditions." },
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "quara-aqualish": {
        name: "Aqualish - Quara",
        description: "A triad of aggressive, tusked sub-species from the planet Ando, often found in rough-and-tumble professions across the galaxy.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Aqualish.png?alt=media&token=9ed20969-14fd-44ab-acd0-651f25b4bd59",
        stats: { brawn: 3, agility: 2, intellect: 1, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 90,
        woundThreshold: "11 + Brawn",
        strainThreshold: "8 + Willpower",
        specialAbilities: [
            { text: "All Aqualish are amphibious and begin with one rank in Brawl (max 2 at creation)." },
            { title: "Quara:", text: "Begin with one rank in Athletics or Coercion. Remove Setback when tracking in natural environments." },
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "ualaq-aqualish": {
        name: "Aqualish - Ualaq",
        description: "A triad of aggressive, tusked sub-species from the planet Ando, often found in rough-and-tumble professions across the galaxy.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Aqualish.png?alt=media&token=9ed20969-14fd-44ab-acd0-651f25b4bd59",
        stats: { brawn: 3, agility: 2, intellect: 1, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 90,
        woundThreshold: "11 + Brawn",
        strainThreshold: "8 + Willpower",
        specialAbilities: [
            { text: "All Aqualish are amphibious and begin with one rank in Brawl (max 2 at creation)." },
            { title: "Ualaq:", text: "Begin with one rank in Survival or Perception. Remove Setback from dark, but suffer Setback in bright light." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "arcona": {
        name: "Arcona",
        description: "Slim, reptilian humanoids with compound eyes and a strong sense of community. Their wanderlust takes them all over the galaxy.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Arcona.png?alt=media&token=7d27644a-3dd1-49ed-a12d-21f2e48240a8",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 2 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Vigilance. They still may not train Vigilance above rank 2 during character creation." },
            { text: "Remove Setback dice imposed due to arid or hot environmental conditions." },
            { title: "Mood Readers:", text: "Add Advantage to any Charm or Negotiation checks they make." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "arkanian": {
        name: "Arkanian",
        description: "A near-human species known for their intelligence, arrogance, and penchant for genetic engineering.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Arkanian.png?alt=media&token=277d1db6-9afd-4c38-aff0-223a3d5b9111",
        stats: { brawn: 2, agility: 2, intellect: 3, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Medicine. They still may not train Medicine above rank 2 during character creation." },
            { title: "Dark Vision:", text: "Arkanians can see in the dark without penalty." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "balosar": {
        name: "Balosar",
        description: "A species of near-humans with retractable antennapalps, often found in the galactic underworld due to their natural cunning and resilience to toxins.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Balosar.png?alt=media&token=5f2e3d99-17c0-487a-88f1-024d4947fdce",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 3, willpower: 1, presence: 2 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Streetwise. They still may not train Streetwise above rank 2 during character creation." },
            { title: "Antennapalps:", text: "Balosars can add Boost to all Perception checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "bardottan": {
        name: "Bardottan",
        description: "A contemplative and deeply spiritual saurian species, Bardottans are known for their wisdom and connection to the Force.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Bardottan.png?alt=media&token=20b4aeb0-455f-4b09-9d90-1711fa66743e",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 1, willpower: 3, presence: 2 },
        startingXp: 105,
        woundThreshold: "9 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Knowledge (Lore). They may not train it above rank 2 during character creation." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "besalisk": {
        name: "Besalisk",
        description: "Large, four-armed humanoids from the icy planet of Ojom, Besalisks are hardy, sociable, and surprisingly dexterous.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Besalisk.png?alt=media&token=409d76c7-9095-468f-b309-2a62b1179ab2",
        stats: { brawn: 3, agility: 1, intellect: 2, cunning: 1, willpower: 2, presence: 2 },
        startingXp: 85,
        woundThreshold: "12 + Brawn",
        strainThreshold: "7 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Resilience. They still may not train it above rank 2 during character creation." },
            { title: "Additional Limbs:", text: "Besalisks have four arms, which grants them an additional free maneuver per turn." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "bith": {
        name: "Bith",
        description: "Highly intelligent beings with a keen sense of hearing and smell, often found as musicians, scientists, or technicians.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Bith.png?alt=media&token=51f659bd-b035-4c23-8552-1437e3fd8e22",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 3 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Perception. They may not train it above rank 2 during character creation." },
            { title: "Sensitive Hearing:", text: "Add Boost to all Perception checks involving sound." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "bothan": { 
        name: "Bothan", 
        description: "Bothans are the galaxy's information brokers. Adept at picking up on secrets or seeing things other species ignore, Bothans can be valuable assets in any endeavor—or untrustworthy partners.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Bothan-NEGAS.png?alt=media&token=5dfede5f-fcc4-4688-8604-c7462e90abad", 
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 3, willpower: 2, presence: 2 }, 
        startingXp: 100, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "11 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Streetwise." }, 
            { text: "Start with one rank in the Convincing Demeanor talent." }
        ],
        bonuses: [
            { type: 'skill', id: 'Streetwise' },
            { type: 'talent', id: 'convincing-demeanor' }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "caamasi": {
        name: "Caamasi",
        description: "A species of furred humanoids recovering from the brink of extinction, known for their pacifist nature and the ability to share memories.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Caamasi.png?alt=media&token=8c6c9ba2-ecc9-4dc0-883c-34744063abff",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 1, willpower: 3, presence: 2 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in either Charm or Discipline. They still may not train either above rank 2 during character creation." },
            { title: "Memnii:", text: "Once per game session, a Caamasi may form a new memnis that encompasses one scene or encounter." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "cerean": {
        name: "Cerean",
        description: "A distinctive species with extended, cone-like skulls which house large, binary brains, allowing for extraordinary mental aptitude.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Cerean.png?alt=media&token=fb74b219-47ab-490d-a36a-8e8d0a6d3031",
        stats: { brawn: 2, agility: 1, intellect: 3, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 90,
        woundThreshold: "10 + Brawn",
        strainThreshold: "13 + Brawn",
        specialAbilities: [
            { text: "Begin with one rank in Vigilance. They still may not train Vigilance above rank 2 during character creation." },
            { title: "Binary Processing:", text: "Cereans treat all Knowledge skills as career skills." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "chadra-fan": {
        name: "Chadra-Fan",
        description: "A small, gregarious, and overwhelmingly cheerful species of rodents, known for their mechanical aptitude.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Chadra-Fan.png?alt=media&token=3fdbcb92-9389-42ce-b3a9-ae49169dc404",
        stats: { brawn: 1, agility: 3, intellect: 3, cunning: 2, willpower: 1, presence: 2 },
        startingXp: 90,
        woundThreshold: "9 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Mechanics. They may not train it above rank 2 during character creation." },
            { title: "Acute Senses:", text: "Remove up to 2 Setback dice from Perception checks." },
            { text: "Chadra-Fan are Silhouette 0." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "chagrian": {
        name: "Chagrian",
        description: "Amphibious humanoids with large horns and a natural resistance to toxins, often found in positions of authority.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Chagrian.png?alt=media&token=14fadd04-b1ef-4e45-9ce9-780a3c551a3b",
        stats: { brawn: 2, agility: 1, intellect: 2, cunning: 2, willpower: 3, presence: 2 },
        startingXp: 90,
        woundThreshold: "11 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Resilience. They may not train it above rank 2 during character creation." },
            { title: "Amphibious:", text: "Can breathe underwater without penalty." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "chevin": {
        name: "Chevin",
        description: "Solidly built elephantine humanoids with long snouts and a reputation for being shrewd, and often ruthless, merchants.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Chevin.png?alt=media&token=4b711490-cabd-4ba9-b9e2-dafb15c9b595",
        stats: { brawn: 3, agility: 1, intellect: 2, cunning: 3, willpower: 2, presence: 1 },
        startingXp: 80,
        woundThreshold: "11 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Negotiation. They may not train it above rank 2 during character creation." },
            { title: "Advanced Olfaction:", text: "Add a Boost Die to Perception checks involving the sense of smell." },
            { text: "Start with one rank in the Durable talent." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "chiss": {
        name: "Chiss",
        description: "A near-human species with blue skin and glowing red eyes, known for their strategic thinking and mysterious origins in the Unknown Regions.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Chiss.png?alt=media&token=61fcdc24-ee96-4aa6-b1d5-f520b548d657",
        stats: { brawn: 2, agility: 2, intellect: 3, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Cool. They may not train it above rank 2 during character creation." },
            { title: "Infravision:", text: "Remove up to 2 Setback Dice added to checks by lighting conditions." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "clawdite": {
        name: "Clawdite",
        description: "A species of reptilian shapeshifters, able to alter their appearance to mimic other humanoids of a similar size and shape.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Clawdite.png?alt=media&token=92618b56-f3ca-4bfb-ad8c-1a89e0144c60",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 3, willpower: 1, presence: 2 },
        startingXp: 95,
        woundThreshold: "9 + Brawn",
        strainThreshold: "9 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Resilience. They may not train it above rank 2 during character creation." },
            { title: "Changeling:", text: "Can change their appearance at will, adding Boost to Deception checks to disguise themselves." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "cosian": {
        name: "Cosian",
        description: "A long-lived, reptilian species known for their patience, wisdom, and strong sense of tradition.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Cosian.png?alt=media&token=e6674e46-ba72-4959-9eab-f22a2572a837",
        stats: { brawn: 1, agility: 2, intellect: 3, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 95,
        woundThreshold: "10 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Knowledge (Lore). They may not train it above rank 2 during character creation." },
            { title: "Strong Backed:", text: "Count their Brawn as 1 higher for encumbrance purposes." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
"dathomirian": {
    name: "Dathomirian",
    description: "A near-human species from Dathomir, known for their powerful connection to the Force and their warrior culture.",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Dathomirian.png?alt=media&token=a559763e-bf7f-4a2a-beed-5e92b92b653a",
    stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
    startingXp: 100,
    woundThreshold: "10 + Brawn",
    strainThreshold: "11 + Willpower",
    specialAbilities: [
        { text: "Begin with one rank in Coercion or Survival." },
        { title: "Resilient Metabolism:", text: "Add Boost to Resilience checks." }
    ],
    bonuses: [
        { 
            type: 'choice',
            options: [
                { type: 'skill', id: 'Coercion' },
                { type: 'skill', id: 'Survival' }
            ]
        },
        { type: 'dice_bonus', skill: 'Resilience', dice: 'boost', amount: 1 }
    ],
    homeworld: "Place holder",
    physiology: "Place holder",
    society: "Place holder",
    language: "Place holder",
    additional: "Place holder"
},
    "devaronian": {
        name: "Devaronian",
        description: "A species of horned humanoids known for their wanderlust and, often, their untrustworthy nature.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Devaronian.png?alt=media&token=b51f05e1-5237-42b1-b776-7b36a1bf34bd",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 3, willpower: 2, presence: 1 },
        startingXp: 95,
        woundThreshold: "11 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Survival or Deception." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "dowutin": {
        name: "Dowutin",
        description: "A massive species of hulking sentients known for their incredible strength and durability.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Dowutin.png?alt=media&token=43d4f2dd-45e4-4f38-8db1-5247d03fe956",
        stats: { brawn: 3, agility: 1, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 85,
        woundThreshold: "15 + Brawn",
        strainThreshold: "8 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Resilience." },
            { title: "Large:", text: "Dowutin are Silhouette 2." },
            { title: "Immovable:", text: "Cannot be knocked prone." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "drabatan": {
        name: "Drabatan",
        description: "A species of tall, slender amphibians with a reputation for being both charismatic and boisterous.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Drabatan.png?alt=media&token=222b7d68-6456-4557-83d0-ae9e281af38b",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 1, willpower: 2, presence: 3 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Charm or Leadership." },
            { title: "Big Noise:", text: "Can make a loud bellow once per encounter to disorient targets." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "drall": { 
        name: "Drall", 
        description: "The Drall are renowned throughout the galaxy as thinkers.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Drall.png?alt=media&token=017b1e7a-1718-4b1a-82af-63c735de41d6",
        stats: { brawn: 1, agility: 1, intellect: 4, cunning: 2, willpower: 2, presence: 2 }, 
        startingXp: 90, 
        woundThreshold: "8 + Brawn", 
        strainThreshold: "12 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Knowledge (Education)." }, 
            { text: "A Drall adds a Boost Die to the dice pool when providing skilled assistance." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },  
    "dressellian": {
        name: "Dressellian",
        description: "A gruff, wrinkle-faced species of gritty outdoorsmen and master scouts.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Dressellian.png?alt=media&token=faea4dfb-558b-41ab-88a4-ae5f93921c9a",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 1 },
        startingXp: 110,
        woundThreshold: "11 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Survival." },
            { title: "Primitive:", text: "Upgrade the difficulty of checks involving advanced technology. Can spend 10 XP at character creation to remove this penalty permanently." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "droid": { 
        name: "Droid", 
        description: "Mechanical beings built for a variety of roles.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Droid.png?alt=media&token=563778f0-4a35-437a-8f92-e338db6d9b09",
        stats: { brawn: 1, agility: 1, intellect: 1, cunning: 1, willpower: 1, presence: 1 }, 
        startingXp: 175, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Does not need to eat, sleep, or breathe, and is unaffected by toxins or poisons." }, 
            { title: "Inorganic:", text: "Does not benefit from bacta, stimpacks, or Medicine." }, 
            { title: "Mechanical Being:", text: "Cannot become Force sensitive." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "dug": {
        name: "Dug",
        description: "A species known for their unique locomotion, using their powerful arms to walk, leaving their legs free for grappling and other tasks.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Clawdite.png?alt=media&token=92618b56-f3ca-4bfb-ad8c-1a89e0144c60",
        stats: { brawn: 2, agility: 3, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 90,
        woundThreshold: "9 + Brawn",
        strainThreshold: "8 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Brawl." },
            { text: "Start with one rank in the Defensive Driving talent." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "duros": { 
        name: "Duros", 
        description: "Revered as pilots, explorers, and storytellers.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Duros.png?alt=media&token=a97fc375-0b95-4576-94f8-031c70327fe2",
        stats: { brawn: 1, agility: 2, intellect: 3, cunning: 2, willpower: 2, presence: 2 }, 
        startingXp: 100, 
        woundThreshold: "11 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Piloting (Space)." }, 
            { title: "Intuitive Navigation:", text: "Add Advantage to all Astrogation checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "elom": {
        name: "Elom",
        description: "A species of squat, muscular humanoids native to the planet Elom, known for their digging abilities.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Elom.png?alt=media&token=d7a6d97a-3326-4350-9abe-c4555c0b6727",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "9 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Resilience." },
            { title: "Digging Claws:", text: "Can burrow through loose earth and gain a defensive bonus." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "elomin": {
        name: "Elomin",
        description: "A tall, slender species known for their intelligence and meticulous nature.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Elomin.png?alt=media&token=8907d7f9-64a2-48d5-8500-7bc942107d41",
        stats: { brawn: 2, agility: 2, intellect: 3, cunning: 2, willpower: 1, presence: 2 },
        startingXp: 105,
        woundThreshold: "9 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Charm and one rank in Knowledge (Education)." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "ewok": {
        name: "Ewok",
        description: "A small, furry species of hunter-gatherers from the forest moon of Endor.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Ewok.png?alt=media&token=9f7a50c5-2421-4ddc-ab93-14de52370de0",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 3, willpower: 1, presence: 2 },
        startingXp: 120,
        woundThreshold: "9 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Stealth or Survival." },
            { title: "Acute Senses:", text: "Add Boost to Perception checks." },
            { title: "Low-Tech:", text: "Add Setback to checks involving advanced technology." },
            { text: "Ewoks are Silhouette 0." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "falleen": {
        name: "Falleen",
        description: "A species of reptilian humanoids known for their ability to exude potent pheromones.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Falleen.png?alt=media&token=109e5f6d-63f8-4208-83b5-524931330348",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 3 },
        startingXp: 90,
        woundThreshold: "10 + Brawn",
        strainThreshold: "12 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Charm." },
            { title: "Beguiling Pheromones:", text: "Can suffer strain to upgrade Charm, Deception, or Negotiation checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "gand": { 
        name: "Gand", 
        description: "Mysterious insectoid species whose 'findsmen' treat tracking quarry as a religious duty.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Gand.png?alt=media&token=10f0f3c7-a2e8-49b8-81ff-f44db821d054",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 1 }, 
        startingXp: 100, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Starts with one rank in Discipline." }, 
            { title: "Ammonia Breathers:", text: "Player chooses if the Gand has lungs. If so, they start with an ammonia respirator and treat oxygen as a dangerous atmosphere (Rating 8), but gain +10 starting XP." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "gank": {
        name: "Gank",
        description: "A mysterious species of mercenaries, rarely seen without their signature high-tech battle armor.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Gank.png?alt=media&token=fc317319-c754-43ec-959b-32e7fd0e5b6b",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 110,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Coercion or Vigilance." },
            { title: "Cyborg:", text: "Starts with up to two cybernetics costing up to 5,000 credits." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "geonosian": {
        name: "Geonosian",
        description: "An insectoid species from Geonosis, known for their hive-based society and skill in droid manufacturing.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Geonosian.png?alt=media&token=6f85daac-0677-4f27-909f-a49d40e72ac6",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 1, willpower: 1, presence: 1 },
        startingXp: 140,
        woundThreshold: "9 + Brawn",
        strainThreshold: "9 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in the skill of their choice." },
            { title: "Industrious:", text: "Reduce the credit cost of items they craft." },
            { title: "Winged:", text: "Can fly for short periods." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "gigoran": {
        name: "Gigoran",
        description: "A large, furred species known for their strength and loyalty, often mistaken for Wookiees.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Gigoran.png?alt=media&token=70be821e-e944-4228-912e-0c250cc04a5b",
        stats: { brawn: 3, agility: 2, intellect: 1, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 100,
        woundThreshold: "12 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Brawl." },
            { title: "Adapted to the Cold:", text: "Remove Setback from cold environments." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "gossam": {
        name: "Gossam",
        description: "A small species of reptilian origin with a reputation for being shrewd and opportunistic.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Gossam.png?alt=media&token=70a99a48-d3ce-404a-a9c8-fe8cdad1e8b7",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 3, willpower: 2, presence: 2 },
        startingXp: 100,
        woundThreshold: "9 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Deception." },
            { text: "Gossams are Silhouette 0." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "gotal": {
        name: "Gotal",
        description: "A species of shaggy-haired humanoids with head cones that allow them to sense energy fields and emotions.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Gotal.png?alt=media&token=4d0f821d-5465-453e-8b53-c37d393bb864",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 3, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "9 + Brawn",
        strainThreshold: "8 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Perception." },
            { title: "Energy Sensitivity:", text: "Can sense the presence and emotional states of living things within short range." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "gran": { 
        name: "Gran", 
        description: "Keen of sight, inherently peaceful and nature-loving.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Gran.png?alt=media&token=a7c24914-9182-4af3-85aa-ed9118d7e28a",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 1, willpower: 2, presence: 3 }, 
        startingXp: 100, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "9 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Charm or Negotiation." }, 
            { title: "Enhanced Vision:", text: "Remove up to 2 setback dice from concealment." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "gungan": {
        name: "Gungan",
        description: "An amphibious species from Naboo with a unique culture and physiology.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Gungan.png?alt=media&token=c932bcd9-b2d0-4974-8891-81562b9de418",
        stats: { brawn: 2, agility: 2, intellect: 1, cunning: 2, willpower: 2, presence: 3 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Athletics." },
            { title: "Amphibious:", text: "Can breathe underwater without penalty." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "harch": {
        name: "Harch",
        description: "A species of sentient arachnids with six arms and a reputation for being cunning and patient.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Harch.png?alt=media&token=120bf073-772a-496a-8fbd-0195ecc02bfd",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 3, willpower: 2, presence: 1 },
        startingXp: 75,
        woundThreshold: "11 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Perception." },
            { title: "Additional Limbs:", text: "Gain an additional free maneuver per turn." },
            { title: "Venomous Fangs:", text: "Can make a Brawl attack to inject venom." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "human": { 
        name: "Human", 
        description: "The most numerous and widespread species in the galaxy.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Human.png?alt=media&token=1a47adb3-78e0-41ea-b4e5-53fb63d95d54", 
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2}, 
        startingXp: 110, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "One free rank in two different non-career skills of choice." }
        ],
        homeworld: "Coruscant (presumed)",
        physiology: "Human physiology is the galactic standard. They have a wide range of skin, hair, and eye colors. Their biology allows them to adapt to a vast number of temperate environments throughout the galaxy with relative ease.",
        society: "Humans are the most populous and culturally dominant species in the galaxy, found on nearly every inhabited world. Their societies are incredibly diverse, ranging from high-tech ecumenopolises to primitive tribal villages. They have no single unifying culture, instead adopting and adapting the traditions of the worlds they settle.",
        language: "Most humans speak Galactic Basic. Due to their widespread nature, they often learn local languages as well.",
        additional: "Humans can be found in nearly every profession and walk of life, from Jedi Knights to smugglers, and from senators to moisture farmers."
    },
    "clone": {
        name: "Human - Clone",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Clone.png?alt=media&token=4933cf43-c0a6-497b-abb1-b3435909b3ca",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 100,
        woundThreshold: "11 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Knowledge (Warfare) and one rank in Resilience." },
            { text: "Start with one rank in the Physical Training talent." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "corellian-human": { 
        name: "Human - Corellian", 
        description: "Humans from Corellia, known for their piloting skills and reckless nature.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Corellian_Human.png?alt=media&token=760d0c53-efbd-4eac-a8c3-129b6385bcc4", 
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2 }, 
        startingXp: 110, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Piloting (Planetary) or Piloting (Space). May train Piloting up to rank 3 during character creation." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "mandalorian-human": {
        name: "Human - Mandalorian",
        description: "Humans raised in the Mandalorian culture, known for their martial prowess and strict code of honor.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Mandalorian_Human.png?alt=media&token=44d0a78a-28ee-4f90-a9d3-b7c76d624ade",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 105,
        woundThreshold: "11 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in a combat skill of their choice, or one rank in two Knowledge skills of their choice." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "hutt": {
        name: "Hutt",
        description: "Large, slug-like gastropods with immense physical and mental strength, often found in positions of power in the criminal underworld.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Hutt.png?alt=media&token=79a654d5-1ac0-49a9-9741-80134aed7082",
        stats: { brawn: 3, agility: 1, intellect: 2, cunning: 2, willpower: 3, presence: 2 },
        startingXp: 70,
        woundThreshold: "13 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Coercion or Discipline." },
            { text: "Start with one rank in the Enduring talent and one rank in the Nobody's Fool talent." },
            { title: "Ponderous:", text: "Can never spend more than one maneuver moving per turn." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "ikaru": {
        name: "Ikaru",
        description: "The heavy-browed, simian Iakaru are a rare sight in the galaxy, as their species never developed hyperdrive technology, and relatively few ventured offworld until recent years.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Iakaru.png?alt=media&token=af4b5003-b874-4bee-83a6-8d5d3bc30dc2",
        stats: { brawn: 2, agility: 3, intellect: 2, cunning: 2, willpower: 1, presence: 2 },
        startingXp: 100,
        woundThreshold: "9 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Piloting (Space)." },
            { title: "Brachiation:", text: "Can move through trees and similar environments with ease." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "iktotchi": {
        name: "Iktotchi",
        description: "A species of horned humanoids with limited precognitive abilities, often seen as stoic and reserved.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Iktotchi.png?alt=media&token=23267491-0c25-45a6-bbe0-ebea716ae4fb",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 1 },
        startingXp: 90,
        woundThreshold: "10 + Brawn",
        strainThreshold: "12 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Vigilance." },
            { title: "Precognition:", text: "Can add Boost to initiative checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "ishi-tib": {
        name: "Ishi Tib",
        description: "An amphibious species with large eyes and a beak-like mouth, known for their intelligence and organizational skills.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Ishi_Tib.png?alt=media&token=d54e8d51-5d31-4f1d-8c09-b268997a1b1c",
        stats: { brawn: 2, agility: 2, intellect: 3, cunning: 2, willpower: 1, presence: 2 },
        startingXp: 100,
        woundThreshold: "12 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Discipline." },
            { title: "Amphibious:", text: "Can breathe underwater without penalty." },
            { title: "Water Dependence:", text: "Must rehydrate regularly or suffer penalties." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "ithorian": { 
        name: "Ithorian", 
        description: "Called 'Hammerheads' for their unique head structure.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Ithorian.png?alt=media&token=d2e6dcda-6330-4b40-9b99-220f0e6631a9",
        stats: { brawn: 2, agility: 1, intellect: 2, cunning: 2, willpower: 3, presence: 2 }, 
        startingXp: 90, 
        woundThreshold: "9 + Brawn", 
        strainThreshold: "12 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Survival." }, 
            { title: "Ithorian Bellow:", text: "Can make a powerful sonic attack." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "jawa": {
        name: "Jawa",
        description: "A species of small, rodent-like scavengers from Tatooine, known for their expertise in salvaging and repairing technology.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Jawa.png?alt=media&token=2814ef9b-ba79-4567-8bb1-b428f1a45251",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 3, willpower: 2, presence: 1 },
        startingXp: 120,
        woundThreshold: "8 + Brawn",
        strainThreshold: "8 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Negotiation or Skulduggery." },
            { title: "Clever Negotiators:", text: "Add Boost to Negotiation checks." },
            { text: "Jawas are Silhouette 0." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "kalleran": {
        name: "Kalleran",
        description: "A species of agile humanoids with a natural talent for stealth and heightened senses.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Kalleran.png?alt=media&token=b09c8867-9a87-4a7d-a34d-52262c9be62a",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 90,
        woundThreshold: "8 + Brawn",
        strainThreshold: "12 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Streetwise." },
            { title: "Heightened Awareness:", text: "Add Boost to Perception checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "kaminoan": {
        name: "Kaminoan",
        description: "A tall, slender species of cloners from the planet Kamino, known for their scientific expertise and detached demeanor.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Kaminoan.png?alt=media&token=a9d94830-96fc-4b04-a709-ac65a53da15d",
        stats: { brawn: 1, agility: 2, intellect: 3, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 100,
        woundThreshold: "9 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Medicine." },
            { text: "Start with one rank in the Researcher talent." },
            { title: "Expressionless:", text: "Add Setback to all Charm and Deception checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "karkarodon": {
        name: "Karkarodon",
        description: "An amphibious species of shark-like humanoids, known for their ferocity in combat.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Karkarodon.png?alt=media&token=6435f092-20fd-4c5f-add2-8caf70a9faaf",
        stats: { brawn: 3, agility: 2, intellect: 1, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 90,
        woundThreshold: "12 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Athletics." },
            { title: "Amphibious:", text: "Can breathe underwater without penalty." },
            { title: "Jaws:", text: "Can use their teeth as a natural weapon." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "kel-dor": { 
        name: "Kel Dor", 
        description: "A kindly and soft-spoken species, easily identified by their protective eyewear and rebreather masks.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Kel_Dor.png?alt=media&token=6fb260e7-9033-4570-8016-7a2248174685",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 2 }, 
        startingXp: 100, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Knowledge (Education)." }, 
            { title: "Dark Vision:", text: "Remove up to 2 setback dice imposed due to darkness." }, 
            { title: "Atmospheric Requirement:", text: "Must wear a specialized mask to breathe and see outside their native atmosphere." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "klatooinian": {
        name: "Klatooinian",
        description: "A heavily built species descended from canine ancestors, known for their loyalty and devotion.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Klatooinian.png?alt=media&token=48d19063-1177-4dec-b94b-1562788cb814",
        stats: { brawn: 2, agility: 3, intellect: 2, cunning: 2, willpower: 1, presence: 2 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in either Brawl, Ranged (Heavy), or Ranged (Light), and one additional rank of one non-career skill of his choice (max 2 at creation)." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "kubaz": {
        name: "Kubaz",
        description: "An insectivorous species with long snouts, often employed as spies and informants.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Kubaz.png?alt=media&token=50c31f71-9151-4189-86fe-350c0eacd5cb",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 1 },
        startingXp: 100,
        woundThreshold: "9 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Stealth or Survival." },
            { title: "Enhanced Vision:", text: "Add Boost to Perception checks involving sight." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "kyuzo": {
        name: "Kyuzo",
        description: "A species of humanoids from a high-gravity world, making them incredibly agile and strong in standard gravity.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Kyuzo.png?alt=media&token=e1a98819-80d9-4e39-a166-3e4f6902edf3",
        stats: { brawn: 2, agility: 3, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 90,
        woundThreshold: "11 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Coordination." },
            { title: "Dense Musculature:", text: "Add Boost to Resilience checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "lannik": {
        name: "Lannik",
        description: "A species of short, warlike humanoids with long ears, known for their courage and stubbornness.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Lannik.png?alt=media&token=280ce97e-cf4e-484d-83cf-6ad873a66f12",
        stats: { brawn: 2, agility: 1, intellect: 3, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 100,
        woundThreshold: "8 + Brawn",
        strainThreshold: "12 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Streetwise." },
            { title: "Indomitable:", text: "Can reroll failed Fear checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "lasat": {
        name: "Lasat",
        description: "A species of tall, strong, and agile humanoids with prehensile feet, known for their warrior culture.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Lasat.png?alt=media&token=4834afd5-0cb5-4e47-8ab2-6b805718ab88",
        stats: { brawn: 3, agility: 3, intellect: 2, cunning: 1, willpower: 2, presence: 1 },
        startingXp: 90,
        woundThreshold: "12 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Brawl or Knowledge (Lore)." },
            { title: "Prehensile Feet:", text: "Can use their feet to perform simple actions." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "melitto": {
        name: "Melitto",
        description: "An insectoid species with a hive-mind social structure, known for their reliance on toxins and their unique sensory abilities.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Melitto.png?alt=media&token=3148c623-c984-4770-b32b-24da6cb1d7ec",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 1, presence: 2 },
        startingXp: 100,
        woundThreshold: "9 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Perception." },
            { title: "Sightless Vision:", text: "Can perceive their surroundings without sight." },
            { title: "Reliant on Toxins:", text: "Require regular exposure to specific toxins to survive." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "mikkian": {
        name: "Mikkian",
        description: "A species of humanoids with colorful skin and head-tendrils, known for their discipline and sensory abilities.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Mikkian.png?alt=media&token=b2dd5b33-8840-41a1-a01f-e9c620cc7337",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 2 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Discipline." },
            { title: "Sensory Tendrils:", text: "Add Boost to Perception checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "mirialan": { 
        name: "Mirialan", 
        description: "A near-human species whose culture is characterized by a deepseated faith and respect for an individual's destiny.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Mirialan.png?alt=media&token=cc97e351-c219-4e37-82e5-2ba4e65d169a",
        stats: { brawn: 2, agility: 3, intellect: 2, cunning: 1, willpower: 2, presence: 2 }, 
        startingXp: 100, 
        woundThreshold: "11 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Discipline and one rank in Cool." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "mon-calamari": { 
        name: "Mon Calamari", 
        description: "Artisans, dreamers, and devoted allies.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Mon_Calamari.png?alt=media&token=55c6fb75-a199-4440-9cc4-c22c0de243a3",
        stats: { brawn: 2, agility: 2, intellect: 3, cunning: 1, willpower: 2, presence: 2 }, 
        startingXp: 100, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Knowledge (Education)." }, 
            { title: "Amphibious:", text: "Can breathe underwater without penalty." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "mustafarian": {
        name: "Mustafarian",
        description: "A species of insectoid sentients adapted to the volcanic environment of Mustafar.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Mustafarian.png?alt=media&token=b8fc68b6-a5b9-47dd-9dca-78d167754843",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { title: "Sub-Species Options:", text: "Choose one of the following sub-species:" },
            { title: "Northern:", text: "Start with one rank in the Eye For Detail talent." },
            { title: "Southern:", text: "Start with one rank in the Enduring talent." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "muun": {
        name: "Muun",
        description: "A tall, gaunt species known for their mathematical prowess and influence in galactic finance.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Muun.png?alt=media&token=0d6c5071-2fda-42c9-b7a9-9f5801b88c01",
        stats: { brawn: 2, agility: 2, intellect: 3, cunning: 3, willpower: 1, presence: 1 },
        startingXp: 90,
        woundThreshold: "9 + Brawn",
        strainThreshold: "9 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Knowledge (Education) and one rank in Knowledge (Core Worlds)." },
            { title: "Deep Pockets:", text: "Start with extra credits." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "nautolan": { 
        name: "Nautolan", 
        description: "An amphibious species renowned for empathetic and cheerful natures.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Nautolan.png?alt=media&token=8d931558-768f-4350-92a6-3744634589e3",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 1, presence: 2 }, 
        startingXp: 100, 
        woundThreshold: "11 + Brawn", 
        strainThreshold: "9 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Athletics." }, 
            { title: "Amphibious:", text: "Can breathe underwater without penalty." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "neimoidian": {
        name: "Neimoidian",
        description: "An offshoot of the Duros species, known for their business acumen and, often, their cowardice.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Neimoidian.png?alt=media&token=34678e44-85b0-4563-a164-671671cd6471",
        stats: { brawn: 1, agility: 2, intellect: 3, cunning: 3, willpower: 1, presence: 2 },
        startingXp: 90,
        woundThreshold: "11 + Brawn",
        strainThreshold: "9 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in either Deception or Negotiation." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "green-nikto": {
        name: "Nikto - Green",
        description: "A species with several subspecies, known for their fierce nature and long-standing servitude to the Hutts.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Nikto.png?alt=media&token=f4c6cbdf-90ce-4f44-a352-7091c3d64512",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "11 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { title: "Green Nikto:", text: "One rank in Coordination. Add Boost to climbing checks. Claws deal +1 damage." },
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "mountain-nikto": {
        name: "Nikto - Mountain",
        description: "A species with several subspecies, known for their fierce nature and long-standing servitude to the Hutts.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Nikto.png?alt=media&token=f4c6cbdf-90ce-4f44-a352-7091c3d64512",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "11 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { title: "Mountain Nikto:", text: "One rank in Survival. Gain the Natural Outdoorsman talent." },
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "pale-nikto": {
        name: "Nikto - Pale",
        description: "A species with several subspecies, known for their fierce nature and long-standing servitude to the Hutts.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Nikto.png?alt=media&token=f4c6cbdf-90ce-4f44-a352-7091c3d64512",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "11 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { title: "Pale Nikto:", text: "One rank in Athletics. No movement penalties in water." },
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "red-nikto": {
        name: "Nikto - Red",
        description: "A species with several subspecies, known for their fierce nature and long-standing servitude to the Hutts.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Nikto.png?alt=media&token=f4c6cbdf-90ce-4f44-a352-7091c3d64512",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "11 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { title: "Red Nikto:", text: "One rank in Resilience. Remove Setback from hot environments." },
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "southern-nikto": {
        name: "Nikto - Southern",
        description: "A species with several subspecies, known for their fierce nature and long-standing servitude to the Hutts.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Nikto.png?alt=media&token=f4c6cbdf-90ce-4f44-a352-7091c3d64512",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "11 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { title: "Southern Nikto:", text: "One rank in Perception. Add Boost to sound-based Perception/Vigilance checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "pantoran": {
        name: "Pantoran",
        description: "A near-human species with blue skin and a strong cultural identity, native to the moon of Pantora.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Pantoran.png?alt=media&token=fc27a6b6-79c4-481b-a46e-d94c38a32fb5",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 1, presence: 3 },
        startingXp: 110,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Cool or Negotiation." },
            { title: "Tundra Dwellers:", text: "Remove Setback from cold environments." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "pau_an": {
        name: "Pau'an",
        description: "A tall, gaunt species with a long lifespan, often seen as ancient and wise.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Pau'an.png?alt=media&token=160146f0-4c3f-4b67-91f1-0cb32b9f35dc",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 2 },
        startingXp: 95,
        woundThreshold: "12 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Negotiation or Coercion." },
            { title: "Sensitive Hearing:", text: "Add Boost to Perception checks involving sound." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "phydolon": {
        name: "Phydolon",
        description: "A species of sentient symbiotic organisms that can merge with other beings.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Phydolon.png?alt=media&token=dd3fd5a9-d7c3-4ed3-bc3c-dd599dc560db",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 1 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Cool or Discipline." },
            { title: "Symbiotic Resilience:", text: "Gain a bonus to Resilience checks." },
            { title: "Symbiont Isolation:", text: "Suffer penalties when separated from their symbiont." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "polis-massan": {
        name: "Polis Massan",
        description: "A mute, slender species of miners and medics known for their telepathic abilities.",
        stats: { brawn: 1, agility: 2, intellect: 3, cunning: 2, willpower: 3, presence: 1 },
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Polis_Massan.png?alt=media&token=f9574396-f66d-4d9e-8849-bf6316568315",
        startingXp: 100,
        woundThreshold: "8 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Medicine." },
            { title: "No Vocal Cords:", text: "Cannot speak, but can communicate via telepathy." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "quarren": {
        name: "Quarren",
        description: "An amphibious species with squid-like heads, known for their stubborn and pragmatic nature.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Quarren.png?alt=media&token=3853cfd0-7fd1-4dea-ae45-e74a04990e66",
        stats: { brawn: 2, agility: 2, intellect: 1, cunning: 2, willpower: 3, presence: 2 },
        startingXp: 95,
        woundThreshold: "10 + Brawn",
        strainThreshold: "8 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Negotiation." },
            { title: "Amphibious:", text: "Can breathe underwater without penalty." },
            { title: "Ink Spray:", text: "Can emit a cloud of ink to disorient opponents." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "quermian": {
        name: "Quermian",
        description: "A species of long-necked, two-brained sentients known for their intelligence and telepathic abilities.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Quermian.png?alt=media&token=cfacd3eb-a19a-4b56-bc13-3755b2b8797e",
        stats: { brawn: 1, agility: 2, intellect: 3, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 85,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Perception." },
            { title: "Additional Limbs:", text: "Have two pairs of arms, granting an additional free maneuver per turn." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "rodian": { 
        name: "Rodian", 
        description: "Rodians are born to hunt, coming from a hostile world that breeds killer instincts.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Rodian.png?alt=media&token=d0ca6ba9-c69c-452d-aa37-69588dea3695",
        stats: { brawn: 2, agility: 3, intellect: 2, cunning: 2, willpower: 1, presence: 2 }, 
        startingXp: 100, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Starts with one rank in Survival." }, 
            { text: "Starts with one rank in the Expert Tracker talent." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "sakiyan": {
        name: "Sakiyan",
        description: "A species of renowned hunters and assassins with exceptional tracking skills.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Sakiyan.png?alt=media&token=6496d6a8-1ac0-4a30-afb9-959aa671b34f",
        stats: { brawn: 2, agility: 2, intellect: 3, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 80,
        woundThreshold: "8 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Perception or Vigilance." },
            { text: "Start with one rank in the Expert Tracker talent." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "sathari": {
        name: "Sathari",
        description: "A species of winged humanoids known for their gliding abilities.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Sathari.png?alt=media&token=a00d8e3d-c435-4887-b983-9ee8f482bf55",
        stats: { brawn: 1, agility: 3, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 100,
        woundThreshold: "8 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Coordination." },
            { title: "Glider:", text: "Can glide through the air." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "selonian": { 
        name: "Selonian", 
        description: "For Selonians, nothing is more important than the protection and preservation of their species.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Selonian.png?alt=media&token=c8b66fe2-aa33-4a42-a90b-602ca4e90f41",
        stats: { brawn: 2, agility: 3, intellect: 2, cunning: 1, willpower: 3, presence: 1 }, 
        startingXp: 80, 
        woundThreshold: "11 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Coordination." }, 
            { text: "A Selonian's eyes allow her to see in near total darkness." }, 
            { title: "Tail:", text: "A Selonian's tail may be used as a Brawl weapon." } 
            ],
            homeworld: "Place holder",
            physiology: "Place holder",
            society: "Place holder",
            language: "Place holder",
            additional: "Place holder"
        },
    "shistavanen": {
        name: "Shistavanen",
        description: "A species of predatory, wolf-like humanoids known for their hunting and tracking abilities.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Shistavanen.png?alt=media&token=31eb5118-57cd-4128-b3fe-5e542514d4de",
        stats: { brawn: 2, agility: 3, intellect: 3, cunning: 2, willpower: 1, presence: 1 },
        startingXp: 80,
        woundThreshold: "12 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Brawl or Survival." },
            { title: "Hunter's Instincts:", text: "Add Boost to Perception checks to find prey." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "skakoan": {
        name: "Skakoan",
        description: "A species that evolved in a methane-rich atmosphere, requiring a pressure suit to survive elsewhere.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Skakoan.png?alt=media&token=6f02e4cc-cd73-4d35-91bf-eed49336bfe4",
        stats: { brawn: 2, agility: 2, intellect: 3, cunning: 1, willpower: 2, presence: 2 },
        startingXp: 80,
        woundThreshold: "10 + Brawn",
        strainThreshold: "8 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Knowledge (Education) and one rank in Mechanics." },
            { title: "Methane Breather:", text: "Must wear a pressure suit in standard atmospheres." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "sullustan": { 
        name: "Sullustan", 
        description: "Born underground but with a yearning for the stars.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Sullustan.png?alt=media&token=619ffc2e-18f5-4ba6-9aca-9c23e87b9ef2",
        stats: { brawn: 2, agility: 3, intellect: 2, cunning: 1, willpower: 2, presence: 2 }, 
        startingXp: 100, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Begin with 1 rank in Astrogation." }, 
            { text: "Start with one rank in the Skilled Jockey talent." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "thisspiasian": {
        name: "Thisspiasian",
        description: "A serpentine species with four arms, known for their calm and meditative nature.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Thisspiasian.png?alt=media&token=03f897cf-c1d9-40e4-bd1a-d2bb00efb116",
        stats: { brawn: 2, agility: 3, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "8 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Discipline." },
            { title: "Rest and Meditation:", text: "Can recover strain more effectively." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "tholothian": {
        name: "Tholothian",
        description: "A near-human species with scaled cranial plates, known for their cultural adaptability.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Tholothian.png?alt=media&token=29053947-b2f9-4975-b182-ee2cffc2f7a9",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 95,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Knowledge (Xenology)." },
            { title: "Cultural Adopters:", text: "Can choose a career skill from another career." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "tognath": {
        name: "Tognath",
        description: "An insectoid species that must wear complex breathing apparatus to survive outside their native atmosphere.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Tognath.png?alt=media&token=2f8335fe-4721-4545-846b-eae414c48a2a",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 1 },
        startingXp: 95,
        strainThreshold: "9 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Perception and one rank in Coordination." },
            { title: "Primitive Nerves:", text: "Gain a bonus to resist pain." },
            { title: "Cybernetic Implants:", text: "Start with a free cybernetic implant." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "togruta": { 
        name: "Togruta", 
        description: "A carnivorous humanoid species from the planet Shili.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Togruta.png?alt=media&token=1272e241-3b21-4889-a88f-0a77d97439d8",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 3, willpower: 2, presence: 2 }, 
        startingXp: 100, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Perception." }, 
            { title: "Pack Instincts:", text: "Grant 2 Boost dice instead of 1 when performing the assist maneuver." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "toydarian": {
        name: "Toydarian",
        description: "A species of small, winged humanoids with a natural resistance to Force-based mind manipulation.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Toydarian.png?alt=media&token=693688fd-f469-4762-aae1-3ec6a0f33b68",
        stats: { brawn: 1, agility: 1, intellect: 2, cunning: 2, willpower: 3, presence: 3 },
        startingXp: 90,
        woundThreshold: "9 + Brawn",
        strainThreshold: "12 + Willpower",
        specialAbilities: [
            { text: "Toydarians are Silhouette 0." },
            { title: "Hoverer:", text: "Can hover and ignore difficult terrain." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "trandoshan": { 
        name: "Trandoshan", 
        description: "Trandoshans are belligerent, lizard-like humanoids who have an avowed hatred of Wookiees.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Trandoshan.png?alt=media&token=9f158ad1-65b0-4f65-9ac6-07e37d31858b",
        stats: { brawn: 3, agility: 1, intellect: 2, cunning: 2, willpower: 2, presence: 2 }, 
        startingXp: 90, 
        woundThreshold: "12 + Brawn", 
        strainThreshold: "9 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Perception." }, 
            { title: "Regeneration:", text: "Recovers one additional wound from natural rest." }, 
            { title: "Claws:", text: "Deal +1 damage in Brawl checks." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "tusken": {
        name: "Tusken",
        description: "A nomadic species of desert dwellers from Tatooine, also known as Sand People.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Tusken_Raider.png?alt=media&token=c314f8a7-a653-49c2-a875-dd5e6fff7592",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 1 },
        startingXp: 105,
        woundThreshold: "11 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Survival." },
            { title: "Bantha Riders:", text: "Start with a trained Bantha." },
            { title: "Water Reclamator:", text: "Can survive longer without water." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "twi_lek": { 
        name: "Twi'lek", 
        description: "Elegant and cunning humanoids from Ryloth.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Twi'lek.png?alt=media&token=da3df609-14ab-4be4-9d34-586c7917b62a",
        stats: { brawn: 1, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 3}, 
        startingXp: 100, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "11 + Willpower", 
        specialAbilities: [
            { title: "Desert Dwellers:", text: "Remove one setback die imposed by arid or hot environments." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "umbaran": {
        name: "Umbaran",
        description: "A pale-skinned near-human species from the shadowy world of Umbara, known for their ability to see in the ultraviolet spectrum.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Profile_Umbaran.png?alt=media&token=b4cd86ef-3c02-4bf0-9635-35e2c73f1ca6",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 2, presence: 2 },
        startingXp: 100,
        woundThreshold: "10 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Deception." },
            { title: "Entrancing Gaze:", text: "Can use their gaze to disorient others." },
            { title: "Shadow Dweller:", text: "Gain a bonus to Stealth checks in darkness." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "verpine": {
        name: "Verpine",
        description: "An insectoid species of skilled technicians and engineers with a hive-mind society.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Verpine.png?alt=media&token=ef9e4130-d8f1-44d3-a12a-7aac8f52a3e9",
        stats: { brawn: 2, agility: 3, intellect: 3, cunning: 1, willpower: 2, presence: 1 },
        startingXp: 80,
        woundThreshold: "9 + Brawn",
        strainThreshold: "12 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Mechanics." },
            { title: "Microvision:", text: "Can see fine details." },
            { title: "Radio-Wave Comms:", text: "Can communicate silently with other Verpine." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "vurk": {
        name: "Vurk",
        description: "A reptilian species with a tall, crested head, known for their diplomatic and charismatic nature.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Vurk.png?alt=media&token=c8cc5f1c-6dc8-460b-b9c8-f46ab375bce9",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 1, willpower: 2, presence: 3 },
        startingXp: 100,
        woundThreshold: "11 + Brawn",
        strainThreshold: "11 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Negotiation." },
            { title: "Amphibious:", text: "Can breathe underwater without penalty." },
            { title: "Cold Blooded:", text: "Suffer penalties in cold environments." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "weequay": {
        name: "Weequay",
        description: "A species of humanoids with tough, leathery skin, known for their pheromonal communication.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Weequay.png?alt=media&token=16eaa95f-955b-48d9-b04b-c256a5f68b5e",
        stats: { brawn: 3, agility: 2, intellect: 1, cunning: 3, willpower: 2, presence: 1 },
        startingXp: 90,
        woundThreshold: "10 + Brawn",
        strainThreshold: "9 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Resilience or Athletics." },
            { title: "Pheromones:", text: "Can communicate silently with other Weequay." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "whiphid": {
        name: "Whiphid",
        description: "A large, furred species of hunters from the icy planet of Toola.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Whiphid.png?alt=media&token=66a11567-0e87-4cc9-877a-80e73a9da2fe",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 1, willpower: 2, presence: 2 },
        startingXp: 80,
        woundThreshold: "12 + Brawn",
        strainThreshold: "10 + Willpower",
        specialAbilities: [
            { text: "Begin with one rank in Survival." },
            { title: "Hardy Survivalist:", text: "Remove Setback from cold environments." },
            { title: "Tusks:", text: "Can use their tusks as a natural weapon." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "wookiee": { 
        name: "Wookiee", 
        description: "Towering, furred sentients from Kashyyyk.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Wookiee.png?alt=media&token=8bc20334-6784-48df-9247-63e55976e414",
        stats: { brawn: 3, agility: 2, intellect: 2, cunning: 2, willpower: 1, presence: 2}, 
        startingXp: 90, 
        woundThreshold: "14 + Brawn", 
        strainThreshold: "8 + Willpower", 
        specialAbilities: [
            { title: "Wookiee Rage:", text: "When critically injured, may perform one free maneuver without spending strain." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "xexto": {
        name: "Xexto",
        description: "A wiry, six-limbed species with a love for adventure and excitement.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Xexto.png?alt=media&token=24450e10-67ff-478f-9fbf-12bafffa7257",
        stats: { brawn: 1, agility: 3, intellect: 2, cunning: 2, willpower: 1, presence: 2 },
        startingXp: 85,
        woundThreshold: "9 + Brawn",
        strainThreshold: "9 + Willpower",
        specialAbilities: [
            { text: "Start with one rank in the Confidence talent." },
            { title: "Additional Limbs:", text: "Have six limbs, granting an additional free maneuver per turn." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
    "zabrak": { 
        name: "Zabrak", 
        description: "Zabrak resemble humans but are easily distinguished by their vestigial horns.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Species_Image_Zabrak.png?alt=media&token=10a01eed-20b4-4e37-aa6c-315c1eb24637",
        stats: { brawn: 2, agility: 2, intellect: 2, cunning: 2, willpower: 3, presence: 1 }, 
        startingXp: 100, 
        woundThreshold: "10 + Brawn", 
        strainThreshold: "10 + Willpower", 
        specialAbilities: [
            { text: "Begin with one rank in Survival." }, 
            { title: "Fearsome Countenance:", text: "Add 1 advantage to all Coercion checks they make." }
        ],
        homeworld: "Place holder",
        physiology: "Place holder",
        society: "Place holder",
        language: "Place holder",
        additional: "Place holder"
    },
};
const masterCareersList = {
    "ace": { 
        name: "Ace", 
        description: "Piloting vehicles, from repulsorlift speeders to massive starships and everything in between, is a fairly common skill for anyone who lives outside of a completely isolated society.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Ace.jpeg?alt=media&token=51f4c13d-ef2c-4c9b-b8a0-ec4704d0e2a1",
        careerSkills: ["Astrogation", "Cool", "Gunnery", "Mechanics", "Perception", "Piloting (Planetary)", "Piloting (Space)", "Ranged (Light)"],
        freeRanks: 4,
        specializations: ["beast-rider", "driver", "gunner", "hotshot", "pilot", "rigger"] 
    },
    "bounty-hunter": { 
        name: "Bounty Hunter", 
        description: "A professional who tracks, captures, or kills targets for a living.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Bounty%20Hunter.png?alt=media&token=274d12f0-8204-476d-be52-ec82ce1c09f8",
        careerSkills: ["Athletics", "Brawl", "Perception", "Piloting (Planetary)", "Piloting (Space)", "Ranged (Heavy)", "Streetwise", "Vigilance"],
        freeRanks: 4,
        specializations: ["assassin", "gadgeteer", "martial-artist", "operator", "skip-tracer", "survivalist"] 
    },
    "colonist": { 
        name: "Colonist", 
        description: "A hardy individual who seeks to build a new life on the frontiers.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Colonist.png?alt=media&token=e44206c4-9f32-4396-81f0-458dfeff07bb",
        careerSkills: ["Charm", "Deception", "Knowledge (Core Worlds)", "Knowledge (Education)", "Knowledge (Lore)", "Leadership", "Negotiation", "Streetwise"],
        freeRanks: 4,
        specializations: ["doctor", "entrepreneur", "marshal", "performer", "politico", "scholar"] 
    },
    "commander": { 
        name: "Commander", 
        description: "A leader of troops and a master of the battlefield.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Commander.jpeg?alt=media&token=deae45c8-fe28-41d6-8580-14d646ecfc36",
        careerSkills: ["Coercion", "Cool", "Discipline", "Knowledge (Warfare)", "Leadership", "Perception", "Ranged (Light)", "Vigilance"],
        freeRanks: 4,
        specializations: ["commodore", "figurehead", "instructor", "squadron-leader", "strategist", "tactician"] 
    },
    "consular": { 
        name: "Consular", 
        description: "A Force-user who uses their power for diplomacy and negotiation.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Consular.png?alt=media&token=3bbd91d5-76d2-4449-952a-06cd40a1faf9",
        careerSkills: ["Cool", "Discipline", "Knowledge (Education)", "Knowledge (Lore)", "Leadership", "Negotiation"], 
        freeRanks: 3, 
        forceRating: 1, 
        specializations: ["arbiter", "ascetic", "healer", "niman-disciple", "sage", "teacher"] 
    },
    "diplomat": { 
        name: "Diplomat", 
        description: "A master of social navigation, from the galactic senate to the back alleys of Nar Shaddaa.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Diplomat.jpg?alt=media&token=c4d382cd-eb40-4e55-b6e3-f50e9cc19fb5",
        careerSkills: ["Charm", "Deception", "Knowledge (Core Worlds)", "Knowledge (Lore)", "Knowledge (Outer Rim)", "Knowledge (Xenology)", "Leadership", "Negotiation"],
        freeRanks: 4,
        specializations: ["advocate", "agitator", "ambassador", "analyst", "propagandist", "quartermaster"] 
    },
    "engineer": { 
        name: "Engineer", 
        description: "A master of machines and technology.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Engineer.png?alt=media&token=23e8369c-f882-4508-8908-605e7567e492",
        careerSkills: ["Athletics", "Computers", "Knowledge (Education)", "Mechanics", "Perception", "Piloting (Space)", "Ranged (Light)", "Vigilance"],
        freeRanks: 4,
        specializations: ["droid-specialist", "mechanic", "saboteur", "sapper", "scientist", "shipwright"] 
    },
    "explorer": { 
        name: "Explorer", 
        description: "Driven by a desire to see what lies beyond the next star.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Explorer.png?alt=media&token=d9c7577f-7baf-45a4-b605-ca488025ffdc",
        careerSkills: ["Astrogation", "Cool", "Knowledge (Lore)", "Knowledge (Outer Rim)", "Knowledge (Xenology)", "Perception", "Piloting (Space)", "Survival"],
        freeRanks: 4,
        specializations: ["archaeologist", "big-game-hunter", "driver-explorer", "fringer", "scout-explorer", "trader"] 
    },
    "guardian": { 
        name: "Guardian", 
        description: "A Force-user dedicated to protecting the innocent and upholding justice.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Guardian.jpeg?alt=media&token=8133be71-d107-443c-b36a-db909b6f5ec3",
        careerSkills: ["Brawl", "Cool", "Discipline", "Melee", "Resilience", "Vigilance"], 
        freeRanks: 3, 
        forceRating: 1, 
        specializations: ["armorer", "peacekeeper", "protector", "soresu-defender", "warden", "warleader"] 
    },
    "hired-gun": { 
        name: "Hired Gun", 
        description: "A warrior for hire, selling their combat skills to the highest bidder.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Hired%20Gun.png?alt=media&token=b9be640a-114a-4fd0-9431-612df747ce51",
        careerSkills: ["Athletics", "Brawl", "Discipline", "Melee", "Piloting (Planetary)", "Ranged (Light)", "Resilience", "Vigilance"],
        freeRanks: 4,
        specializations: ["bodyguard", "demolitionist", "enforcer", "heavy-hired-gun", "marauder", "mercenary-soldier"] 
    },
    "mystic": { 
        name: "Mystic", 
        description: "A Force-user who seeks to understand the deeper mysteries of the Force.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Mystic.png?alt=media&token=14b97c46-7664-455d-969e-f88f65402221",
        careerSkills: ["Charm", "Coercion", "Knowledge (Lore)", "Knowledge (Outer Rim)", "Perception", "Vigilance"], 
        freeRanks: 3, 
        forceRating: 1, 
        specializations: ["advisor", "alchemist", "magus", "makashi-duelist", "prophet", "seer"] 
    },
    "seeker": { 
        name: "Seeker", 
        description: "A Force-user who thrives in the wilderness, tracking down lost artifacts and secrets.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Seeker.png?alt=media&token=b08904d5-296d-4a0a-9cdd-08940c51db10",
        careerSkills: ["Knowledge (Xenology)", "Piloting (Planetary)", "Piloting (Space)", "Ranged (Heavy)", "Survival", "Vigilance"], 
        freeRanks: 3, 
        forceRating: 1, 
        specializations: ["ataru-striker", "executioner", "hermit", "hunter", "navigator", "pathfinder"] 
    },
    "sentinel": { 
        name: "Sentinel", 
        description: "A Force-user who operates in the shadows, blending investigation with their Force abilities.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Sentinel.png?alt=media&token=e697d706-3f7a-439c-b610-9c711d921f85",
        careerSkills: ["Computers", "Deception", "Knowledge (Core Worlds)", "Perception", "Skulduggery", "Stealth"], 
        freeRanks: 3, 
        forceRating: 1, 
        specializations: ["artisan", "investigator", "racer", "sentry", "shadow", "shien-expertise"] 
    },
    "smuggler": { 
        name: "Smuggler", 
        description: "A rogue who lives by their wits, making a living by transporting illegal goods.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Smuggler.png?alt=media&token=3a3f7588-fac9-4d8c-aa5e-344db406d29f",
        careerSkills: ["Coordination", "Deception", "Knowledge (Underworld)", "Perception", "Piloting (Space)", "Skulduggery", "Streetwise", "Vigilance"],
        freeRanks: 4,
        specializations: ["charmer", "gambler", "gunslinger", "pilot-smuggler", "scoundrel", "thief"] 
    },
    "soldier": { 
        name: "Soldier", 
        description: "A front-line combatant, adept with a variety of weapons and tactics.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Soldier.jpg?alt=media&token=33f9d224-6ecc-4560-818a-d4f7ecd2d34d",
        careerSkills: ["Athletics", "Brawl", "Knowledge (Warfare)", "Medicine", "Melee", "Ranged (Light)", "Ranged (Heavy)", "Survival"],
        freeRanks: 4,
        specializations: ["commando", "heavy", "medic", "sharpshooter", "trailblazer", "vanguard"] 
    },
    "spy": { 
        name: "Spy", 
        description: "A master of espionage, subterfuge, and infiltration.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Spy.png?alt=media&token=e518709c-7943-4516-be26-c1bdda7f8449",
        careerSkills: ["Computers", "Cool", "Coordination", "Deception", "Knowledge (Warfare)", "Perception", "Skulduggery", "Stealth"],
        freeRanks: 4,
        specializations: ["courier", "infiltrator", "interrogator", "scout", "sleeper-agent", "slicer"] 
    },
    "technician": { 
        name: "Technician", 
        description: "A master of technology, from slicing computers to repairing starships.",
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Technician.jpeg?alt=media&token=4a345445-b0f6-4a18-a6a7-2f6a8af85690",
        careerSkills: ["Astrogation", "Computers", "Coordination", "Discipline", "Knowledge (Outer Rim)", "Mechanics", "Perception", "Piloting (Planetary)"],
        freeRanks: 4,
        specializations: ["cyber-tech", "droid-tech", "mechanic-tech", "modder", "outlaw-tech", "slicer-tech"] 
    },
    "warrior": { 
        name: "Warrior", 
        description: "A Force-user who focuses on combat and martial prowess.", 
        imageUrl: "https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Career%20Image%20Warrior.png?alt=media&token=14b0c284-b765-46ba-93b5-d349fc5d3fe0",
        careerSkills: ["Athletics", "Brawl", "Cool", "Melee", "Perception", "Survival"], 
        freeRanks: 3, 
        forceRating: 1, 
        specializations: ["aggressor", "colossus", "juyo-berserker", "shii-cho-knight", "starfighter-ace", "steel-hand-adept"] 
    },
};

const masterSpecializationsList = {
    // Ace
    "beast-rider": { 
        name: "Beast Rider", 
        career: "ace", 
        description: "A master of riding and controlling animal mounts.", 
        careerSkills: ["Athletics", "Knowledge (Xenology)", "Perception", "Survival"], 
        freeRanks: 2 
    },
    "driver": { 
        name: "Driver", 
        career: "ace", 
        description: "An expert in handling ground-based vehicles.", 
        careerSkills: ["Cool", "Discipline", "Mechanics", "Piloting (Planetary)", "Gunnery"], 
        freeRanks: 2 
    },
    "gunner": { 
        name: "Gunner", 
        career: "ace", 
        description: "A specialist in vehicle-mounted weaponry.", 
        careerSkills: ["Discipline", "Gunnery", "Ranged (Heavy)", "Resilience"], 
        freeRanks: 2 
    },
    "hotshot": { 
        name: "Hotshot", 
        career: "ace", 
        description: "A flashy and daring pilot who pushes their vehicle to its limits.", 
        careerSkills: ["Cool", "Coordination", "Piloting (Planetary)", "Piloting (Space)"], 
        freeRanks: 2 
    },
    "pilot": { 
        name: "Pilot", 
        career: "ace", 
        description: "A skilled starfighter or transport pilot.", 
        careerSkills: ["Astrogation", "Gunnery", "Piloting (Planetary)", "Piloting (Space)"], 
        freeRanks: 2 
    },
    "rigger": { 
        name: "Rigger", 
        career: "ace", 
        description: "A technician who specializes in vehicle modification and repair.", 
        careerSkills: ["Computers", "Knowledge (Education)", "Knowledge (Underworld)", "Stealth"], 
        freeRanks: 2 
    },
    // Commander
    "commodore": { 
        name: "Commodore", 
        career: "commander", 
        description: "A commander of capital ships and fleets.", 
        careerSkills: ["Astrogation", "Computers", "Knowledge (Education)", "Knowledge (Outer Rim)"], 
        freeRanks: 2 
    },
    "figurehead": { 
        name: "Figurehead", 
        career: "commander", 
        description: "An inspiring leader who serves as the face of a movement or organization.", 
        careerSkills: ["Cool", "Leadership", "Negotiation", "Knowledge (Core Worlds)"], 
        freeRanks: 2 
    },
    "instructor": { 
        name: "Instructor", 
        career: "commander", 
        description: "A teacher and trainer of soldiers.", 
        careerSkills: ["Discipline", "Medicine", "Ranged (Heavy)", "Knowledge (Education)"], 
        freeRanks: 2 
    },
    "squadron-leader": { 
        name: "Squadron Leader", 
        career: "commander", 
        description: "A leader of a starfighter squadron.", 
        careerSkills: ["Gunnery", "Mechanics", "Piloting (Planetary)", "Piloting (Space)"], 
        freeRanks: 2 
    },
    "strategist": { 
        name: "Strategist", 
        career: "commander", 
        description: "A master of grand-scale military planning.", 
        careerSkills: ["Computers", "Cool", "Vigilance", "Knowledge (Warfare)"], 
        freeRanks: 2 
    },
    "tactician": { 
        name: "Tactician", 
        career: "commander", 
        description: "An expert in small-unit tactics and battlefield command.", 
        careerSkills: ["Brawl", "Discipline", "Leadership", "Ranged (Heavy)"], 
        freeRanks: 2 
    },
    // Diplomat
    "advocate": { 
        name: "Advocate", 
        career: "diplomat", 
        description: "A champion of the people, fighting for their rights and causes.", 
        careerSkills: ["Coercion", "Deception", "Negotiation", "Vigilance"], 
        freeRanks: 2 
    },
    "agitator": { 
        name: "Agitator", 
        career: "diplomat", 
        description: "A rabble-rouser who can stir up a crowd and incite action.", 
        careerSkills: ["Coercion", "Deception", "Knowledge (Underworld)", "Streetwise"], 
        freeRanks: 2 
    },
    "ambassador": { 
        name: "Ambassador", 
        career: "diplomat", 
        description: "A formal representative of a government or organization.", 
        careerSkills: ["Charm", "Discipline", "Knowledge (Core Worlds)", "Negotiation"], 
        freeRanks: 2 
    },
    "analyst": { 
        name: "Analyst", 
        career: "diplomat", 
        description: "An expert in gathering and interpreting information.", 
        careerSkills: ["Computers", "Knowledge (Education)", "Knowledge (Warfare)", "Perception"], 
        freeRanks: 2 
    },
    "propagandist": { 
        name: "Propagandist", 
        career: "diplomat", 
        description: "A master of shaping public opinion and spreading information.", 
        careerSkills: ["Charm", "Deception", "Knowledge (Warfare)", "Perception"], 
        freeRanks: 2 
    },
    "quartermaster": { 
        name: "Quartermaster", 
        career: "diplomat", 
        description: "A logistician who ensures that an organization has the resources it needs.", 
        careerSkills: ["Computers", "Negotiation", "Skulduggery", "Vigilance"], 
        freeRanks: 2 
    },
    // Engineer
    "droid-specialist": { 
        name: "Droid Specialist", 
        career: "engineer", 
        description: "An expert in the design, construction, and repair of droids.", 
        careerSkills: ["Computers", "Cool", "Mechanics", "Melee"], 
        freeRanks: 2 
    },
    "mechanic": { 
        name: "Mechanic", 
        career: "engineer", 
        escription: "A hands-on technician who can fix almost anything.", 
        careerSkills: ["Brawl", "Mechanics", "Piloting (Space)", "Skulduggery"], 
        freeRanks: 2 
    },
    "saboteur": { 
        name: "Saboteur", 
        career: "engineer", 
        description: "An expert in demolition and disabling enemy equipment.", 
        careerSkills: ["Coordination", "Mechanics", "Skulduggery", "Stealth"], 
        freeRanks: 2 
    },
    "sapper": { 
        name: "Sapper", 
        career: "engineer", 
        description: "A combat engineer who specializes in fortifications and demolitions.", 
        careerSkills: ["Athletics", "Mechanics", "Survival", "Knowledge (Warfare)"], 
        freeRanks: 2 
    },
    "scientist": { 
        name: "Scientist", 
        career: "engineer", 
        description: "A researcher and inventor who pushes the boundaries of knowledge.", 
        careerSkills: ["Computers", "Knowledge (Education)", "Knowledge (Lore)", "Medicine"], 
        freeRanks: 2 
    },
    "shipwright": { 
        name: "Shipwright", 
        career: "engineer", 
        description: "A specialist in the design and construction of starships.", 
        careerSkills: ["Mechanics", "Piloting (Space)", "Gunnery", "Knowledge (Education)"], 
        freeRanks: 2 
    },
    // Soldier
    "commando": { 
        name: "Commando", 
        career: "soldier", 
        description: "An elite soldier trained for special operations.", 
        careerSkills: ["Brawl", "Melee", "Resilience", "Survival"], 
        freeRanks: 2 
    },
    "heavy": { 
        name: "Heavy", 
        career: "soldier", 
        description: "A specialist in heavy weapons and armor.", 
        careerSkills: ["Gunnery", "Perception", "Ranged (Heavy)", "Resilience"], 
        freeRanks: 2 
    },
    "medic": { 
        name: "Medic", 
        career: "soldier", 
        description: "A combat medic who keeps their comrades alive.", 
        careerSkills: ["Knowledge (Xenology)", "Medicine", "Resilience", "Vigilance"], 
        freeRanks: 2 
    },
    "sharpshooter": { 
        name: "Sharpshooter", 
        career: "soldier", 
        description: "A master of ranged combat.", 
        careerSkills: ["Cool", "Perception", "Ranged (Light)", "Ranged (Heavy)"], 
        freeRanks: 2 
    },
    "trailblazer": { 
        name: "Trailblazer", 
        career: "soldier", 
        description: "A scout and survivalist who operates deep in enemy territory.", 
        careerSkills: ["Knowledge (Outer Rim)", "Perception", "Stealth", "Survival"], 
        freeRanks: 2 
    },
    "vanguard": { 
        name: "Vanguard", 
        career: "soldier", 
        description: "A frontline trooper who leads the charge.", 
        careerSkills: ["Athletics", "Cool", "Vigilance", "Resilience"], 
        freeRanks: 2 
    },
    // Spy
    "courier": { 
        name: "Courier", 
        career: "spy", 
        description: "A specialist in delivering sensitive information and materials.", 
        careerSkills: ["Athletics", "Deception", "Streetwise", "Vigilance"], 
        freeRanks: 2 
    },
    "infiltrator": { 
        name: "Infiltrator", 
        career: "spy", 
        description: "A master of disguise and stealth.", 
        careerSkills: ["Deception", "Melee", "Skulduggery", "Streetwise"], 
        freeRanks: 2 
    },
    "interrogator": { 
        name: "Interrogator", 
        career: "spy", 
        description: "An expert in extracting information from unwilling subjects.", 
        careerSkills: ["Charm", "Coercion", "Medicine", "Perception"], 
        freeRanks: 2 
    },
    "scout": { 
        name: "Scout", 
        career: "spy", 
        description: "A reconnaissance specialist who operates ahead of the main force.", 
        careerSkills: ["Athletics", "Medicine", "Piloting (Planetary)", "Survival"], 
        freeRanks: 2 
    },
    "sleeper-agent": { 
        name: "Sleeper Agent", 
        career: "spy", 
        description: "An undercover agent who lives a normal life until activated.", 
        careerSkills: ["Charm", "Cool", "Deception", "Knowledge (Education)"], 
        freeRanks: 2 
    },
    "slicer": { 
        name: "Slicer", 
        career: "spy", 
        description: "A master computer hacker.", 
        careerSkills: ["Computers", "Knowledge (Education)", "Knowledge (Underworld)", "Stealth"], 
        freeRanks: 2 
    },
    // Bounty Hunter
    "assassin": { 
        name: "Assassin", 
        career: "bounty-hunter", 
        description: "The Assassin is a master of dealing death.", 
        careerSkills: ["Melee", "Ranged (Heavy)", "Skulduggery", "Stealth"], 
        freeRanks: 2 },
    "gadgeteer": { 
        name: "Gadgeteer", 
        career: "bounty-hunter", 
        description: "The Gadgeteer is a master of employing a wide variety of tools.", 
        careerSkills: ["Brawl", "Coercion", "Mechanics", "Ranged (Light)"], 
        freeRanks: 2 
    },
    "martial-artist": { 
        name: "Martial Artist", 
        career: "bounty-hunter", 
        description: "A master of unarmed combat.", 
        careerSkills: ["Athletics", "Coordination", "Discipline", "Brawl"], 
        freeRanks: 2 
    },
    "operator": { 
        name: "Operator", 
        career: "bounty-hunter", 
        description: "A vehicle specialist who uses their ride to hunt their prey.", 
        careerSkills: ["Astrogation", "Piloting (Planetary)", "Piloting (Space)", "Gunnery"], 
        freeRanks: 2 
    },
    "skip-tracer": { 
        name: "Skip Tracer", 
        career: "bounty-hunter", 
        description: "An expert in finding people who don't want to be found.", 
        careerSkills: ["Cool", "Negotiation", "Skulduggery", "Knowledge (Underworld)"], 
        freeRanks: 2 
    },
    "survivalist": { 
        name: "Survivalist", 
        career: "bounty-hunter", 
        description: "A master of tracking and survival in hostile environments.", 
        careerSkills: ["Knowledge (Xenology)", "Perception", "Resilience", "Survival"], 
        freeRanks: 2 
    },
    // Colonist
    "doctor": { 
        name: "Doctor", 
        career: "colonist", 
        description: "The Doctor is a healer, a mender of wounds, and a saver of lives.", 
        careerSkills: ["Cool", "Knowledge (Education)", "Medicine", "Resilience"], 
        freeRanks: 2 
    },
    "entrepreneur": { 
        name: "Entrepreneur", 
        career: "colonist", 
        description: "A business-savvy individual who can turn a profit anywhere.", 
        careerSkills: ["Discipline", "Knowledge (Education)", "Knowledge (Underworld)", "Negotiation"], 
        freeRanks: 2 
    },
    "marshal": { 
        name: "Marshal", 
        career: "colonist", 
        description: "A law officer who keeps the peace on the fringe.", 
        careerSkills: ["Coercion", "Knowledge (Underworld)", "Ranged (Light)", "Vigilance"], 
        freeRanks: 2 
    },
    "performer": { 
        name: "Performer", 
        career: "colonist", 
        description: "An artist who can captivate an audience.", 
        careerSkills: ["Charm", "Coordination", "Deception", "Melee"], 
        freeRanks: 2 
    },
    "politico": { 
        name: "Politico", 
        career: "colonist", 
        description: "A leader who can inspire and manipulate others.", 
        careerSkills: ["Charm", "Coercion", "Deception", "Knowledge (Core Worlds)"], 
        freeRanks: 2 
    },
    "scholar": { 
        name: "Scholar", 
        career: "colonist", 
        description: "A seeker of knowledge and lore.", 
        careerSkills: ["Knowledge (Outer Rim)", "Knowledge (Underworld)", "Knowledge (Xenology)", "Perception"], 
        freeRanks: 2 
    },
    // Explorer
    "archaeologist": { 
        name: "Archaeologist", 
        career: "explorer", 
        description: "A seeker of lost artifacts and ancient secrets.", 
        careerSkills: ["Athletics", "Discipline", "Knowledge (Education)", "Knowledge (Lore)"], 
        freeRanks: 2 
    },
    "big-game-hunter": { 
        name: "Big-Game Hunter", 
        career: "explorer", 
        description: "A tracker and hunter of dangerous creatures.", 
        careerSkills: ["Knowledge (Xenology)", "Ranged (Heavy)", "Stealth", "Survival"], 
        freeRanks: 2 
    },
    "driver-explorer": { 
        name: "Driver", 
        career: "explorer", 
        description: "An expert in handling ground-based vehicles.", 
        careerSkills: ["Cool", "Gunnery", "Mechanics", "Piloting (Planetary)"], 
        freeRanks: 2 
    },
    "fringer": { 
        name: "Fringer", 
        career: "explorer", 
        description: "A rugged individual who knows their way around the Outer Rim.", 
        careerSkills: ["Astrogation", "Coordination", "Negotiation", "Streetwise"], 
        freeRanks: 2 
    },
    "scout-explorer": { 
        name: "Scout", 
        career: "explorer", 
        description: "A reconnaissance specialist who operates ahead of the main force.", 
        careerSkills: ["Athletics", "Medicine", "Piloting (Planetary)", "Survival"], freeRanks: 2 
    },
    "trader": { 
        name: "Trader", 
        career: "explorer", 
        description: "A merchant who travels the galaxy in search of profit.", 
        careerSkills: ["Deception", "Knowledge (Core Worlds)", "Knowledge (Underworld)", "Negotiation"], 
        freeRanks: 2 
    },
    // Hired Gun
    "bodyguard": { 
        name: "Bodyguard", 
        career: "hired-gun", 
        description: "A protector who uses their skills to keep others safe.", 
        careerSkills: ["Gunnery", "Perception", "Piloting (Planetary)", "Ranged (Heavy)"], 
        freeRanks: 2 
    },
    "demolitionist": { 
        name: "Demolitionist", 
        career: "hired-gun", 
        description: "An expert in explosives and destruction.", 
        careerSkills: ["Computers", "Cool", "Mechanics", "Skulduggery"], 
        freeRanks: 2 
    },
    "enforcer": {
        name: "Enforcer", 
        career: "hired-gun", 
        description: "An intimidating figure who uses fear to get what they want.", 
        careerSkills: ["Brawl", "Coercion", "Knowledge (Underworld)", "Streetwise"], 
        freeRanks: 2 
    },
    "heavy-hired-gun": { 
        name: "Heavy", 
        career: "hired-gun", 
        description: "A specialist in heavy weapons and armor.", 
        careerSkills: ["Gunnery", "Perception", "Ranged (Heavy)", "Resilience"], 
        freeRanks: 2 
    },
    "marauder": { 
        name: "Marauder", 
        career: "hired-gun", 
        description: "A brutal warrior who thrives in close-quarters combat.", 
        careerSkills: ["Coercion", "Melee", "Resilience", "Survival"], 
        freeRanks: 2 
    },
    "mercenary-soldier": { 
        name: "Mercenary Soldier", 
        career: "hired-gun", 
        description: "A professional soldier who fights for money.", 
        careerSkills: ["Discipline", "Gunnery", "Leadership", "Ranged (Heavy)"], 
        freeRanks: 2 
    },
    // Smuggler
    "charmer": { 
        name: "Charmer", 
        career: "smuggler", 
        description: "A smooth talker who can get out of any situation.", 
        careerSkills: ["Charm", "Cool", "Leadership", "Negotiation"], 
        freeRanks: 2 
    },
    "gambler": { 
        name: "Gambler", 
        career: "smuggler", 
        description: "A risk-taker who relies on luck and skill to win big.", 
        careerSkills: ["Computers", "Cool", "Deception", "Skulduggery"], 
        freeRanks: 2 
    },
    "gunslinger": { 
        name: "Gunslinger", 
        career: "smuggler", 
        description: "A master of the blaster pistol.", 
        careerSkills: ["Coercion", "Cool", "Knowledge (Outer Rim)", "Ranged (Light)"], 
        freeRanks: 2 
    },
    "pilot-smuggler": { 
        name: "Pilot", 
        career: "smuggler", 
        description: "A skilled starship pilot.", 
        careerSkills: ["Astrogation", "Gunnery", "Piloting (Planetary)", "Piloting (Space)"], 
        freeRanks: 2 
    },
    "scoundrel": { 
        name: "Scoundrel", 
        career: "smuggler", 
        description: "A rogue who plays by their own rules.", 
        careerSkills: ["Charm", "Cool", "Deception", "Ranged (Light)"], 
        freeRanks: 2 },
    "thief": { 
        name: "Thief", 
        career: "smuggler", 
        description: "A master of stealth and infiltration.", 
        careerSkills: ["Computers", "Skulduggery", "Stealth", "Vigilance"],
        freeRanks: 2 
    },
    // Technician
    "cyber-tech": { 
        name: "Cyber Tech", 
        career: "technician", 
        description: "A specialist in cybernetics and medical technology.", 
        careerSkills: ["Athletics", "Mechanics", "Medicine", "Vigilance"], 
        freeRanks: 2 
    },
    "droid-tech": { 
        name: "Droid Tech", 
        career: "technician", 
        description: "An expert in droid repair and programming.", 
        careerSkills: ["Computers", "Cool", "Mechanics", "Leadership"], 
        freeRanks: 2 
    },
    "mechanic-tech": { 
        name: "Mechanic", 
        career: "technician", 
        description: "A hands-on technician who can fix almost anything.", 
        careerSkills: ["Brawl", "Mechanics", "Piloting (Space)", "Skulduggery"], 
        freeRanks: 2 
    },
    "modder": { 
        name: "Modder", 
        career: "technician", 
        description: "A specialist in modifying and upgrading equipment.", 
        careerSkills: ["Gunnery", "Mechanics", "Piloting (Space)", "Streetwise"], 
        freeRanks: 2 
    },
    "outlaw-tech": { 
        name: "Outlaw Tech", 
        career: "technician", 
        description: "A technician who operates outside the law.", 
        careerSkills: ["Knowledge (Education)", "Knowledge (Underworld)", "Mechanics", "Streetwise"], 
        freeRanks: 2 
    },
    "slicer-tech": { 
        name: "Slicer", 
        career: "technician", 
        description: "A master computer hacker.", 
        careerSkills: ["Computers", "Knowledge (Education)", "Knowledge (Underworld)", "Stealth"], 
        freeRanks: 2 
    },
    // Consular
    "arbiter": { 
        name: "Arbiter", 
        career: "consular", 
        description: "A mediator and judge who seeks peaceful resolutions.", 
        careerSkills: ["Negotiation", "Perception", "Lightsaber", "Knowledge (Xenology)"], 
        freeRanks: 2 
    },
    "ascetic": { 
        name: "Ascetic", 
        career: "consular", 
        description: "A disciplined Force-user who focuses on self-control and inner strength.", 
        careerSkills: ["Athletics", "Discipline", "Resilience", "Vigilance"], 
        freeRanks: 2 
    },
    "healer": { 
        name: "Healer", 
        career: "consular", 
        description: "A Force-user who uses their power to mend wounds and save lives.", 
        careerSkills: ["Discipline", "Knowledge (Education)", "Knowledge (Xenology)", "Medicine"], 
        freeRanks: 2 
    },
    "niman-disciple": { 
        name: "Niman Disciple", 
        career: "consular", 
        description: "A practitioner of the Niman lightsaber form, balancing combat and Force powers.", 
        careerSkills: ["Discipline", "Leadership", "Lightsaber", "Negotiation"], 
        freeRanks: 2 
    },
    "sage": { 
        name: "Sage", 
        career: "consular", 
        description: "A scholar and advisor who seeks knowledge and wisdom.", 
        careerSkills: ["Astrogation", "Charm", "Cool", "Knowledge (Lore)"], 
        freeRanks: 2 
    },
    "teacher": { 
        name: "Teacher", 
        career: "consular",
        description: "A mentor who guides others in the ways of the Force.", 
        careerSkills: ["Leadership", "Perception", "Knowledge (Education)", "Knowledge (Lore)"], 
        freeRanks: 2 
    },
    // Guardian
    "armorer": { 
        name: "Armorer", 
        career: "guardian", 
        description: "A craftsman who creates and maintains weapons and armor.", 
        careerSkills: ["Knowledge (Outer Rim)", "Lightsaber", "Mechanics", "Resilience"], 
        freeRanks: 2 
    },
    "peacekeeper": { 
        name: "Peacekeeper", 
        career: "guardian", 
        description: "A protector who maintains order and defends the innocent.", 
        careerSkills: ["Discipline", "Leadership", "Perception", "Piloting (Planetary)"], 
        freeRanks: 2 
    },
    "protector": {
        name: "Protector", 
        career: "guardian", 
        description: "A bodyguard and defender of others.", 
        careerSkills: ["Athletics", "Medicine", "Ranged (Light)", "Resilience"], 
        freeRanks: 2 
    },
    "soresu-defender": { 
        name: "Soresu Defender", 
        career: "guardian", 
        description: "A master of the Soresu lightsaber form, focused on defense.", 
        careerSkills: ["Discipline", "Knowledge (Lore)", "Lightsaber", "Vigilance"], 
        freeRanks: 2 
    },
    "warden": { 
        name: "Warden", 
        career: "guardian", 
        description: "A guardian of a specific place or person.", 
        careerSkills: ["Brawl", "Coercion", "Discipline", "Knowledge (Underworld)"], 
        freeRanks: 2 
    },
    "warleader": { 
        name: "Warleader", 
        career: "guardian", 
        description: "A commander who leads from the front.", 
        careerSkills: ["Leadership", "Perception", "Ranged (Light)", "Survival"], 
        freeRanks: 2 
    },
    // Mystic
    "advisor": { 
        name: "Advisor", 
        career: "mystic", 
        description: "A wise counselor who offers guidance to others.", 
        careerSkills: ["Charm", "Deception", "Negotiation", "Streetwise"], 
        freeRanks: 2 
    },
    "alchemist": { 
        name: "Alchemist", 
        career: "mystic", 
        description: "A creator of potions and elixirs using the Force.", 
        careerSkills: ["Medicine", "Resilience", "Knowledge (Education)", "Knowledge (Xenology)"], 
        freeRanks: 2 
    },
    "magus": { 
        name: "Magus", 
        career: "mystic", 
        description: "A powerful Force-user who delves into the arcane.", 
        careerSkills: ["Coercion", "Discipline", "Medicine", "Knowledge (Lore)"], 
        freeRanks: 2 
    },
    "makashi-duelist": {
        name: "Makashi Duelist", 
        career: "mystic", 
        description: "A master of the Makashi lightsaber form, focused on elegance and precision.", 
        careerSkills: ["Charm", "Cool", "Coordination", "Lightsaber"], 
        freeRanks: 2 
    },
    "prophet": { 
        name: "Prophet", 
        career: "mystic", 
        description: "A seer who can glimpse the future.", 
        careerSkills: ["Charm", "Coercion", "Deception", "Leadership"], 
        freeRanks: 2 
    },
    "seer": { 
        name: "Seer", 
        career: "mystic", 
        description: "A wise Force-user who can perceive things others cannot.", 
        careerSkills: ["Discipline", "Knowledge (Lore)", "Survival", "Vigilance"], 
        freeRanks: 2 
    },
    // Seeker
    "ataru-striker": { 
        name: "Ataru Striker", 
        career: "seeker", 
        description: "A practitioner of the Ataru lightsaber form, focused on acrobatics and aggression.", 
        careerSkills: ["Athletics", "Coordination", "Lightsaber", "Perception"], 
        freeRanks: 2 
    },
    "executioner": { 
        name: "Executioner", 
        career: "seeker", 
        description: "A grim warrior who specializes in finishing off their opponents.", 
        careerSkills: ["Discipline", "Melee", "Perception", "Ranged (Heavy)"], 
        freeRanks: 2 
    },
    "hermit": { 
        name: "Hermit", 
        career: "seeker", 
        description: "A solitary Force-user who lives in seclusion.", 
        careerSkills: ["Discipline", "Knowledge (Xenology)", "Stealth", "Survival"], 
        freeRanks: 2 
    },
    "hunter": { 
        name: "Hunter", 
        career: "seeker", 
        description: "A tracker and hunter who uses the Force to find their prey.", 
        careerSkills: ["Coordination", "Ranged (Heavy)", "Stealth", "Vigilance"], 
        freeRanks: 2 
    },
    "navigator": { 
        name: "Navigator", 
        career: "seeker", 
        description: "A pilot who uses the Force to navigate the stars.", 
        careerSkills: ["Astrogation", "Knowledge (Outer Rim)", "Perception", "Survival"], 
        freeRanks: 2 
    },
    "pathfinder": { 
        name: "Pathfinder", 
        career: "seeker", 
        description: "A scout who forges new paths through the wilderness.", 
        careerSkills: ["Medicine", "Ranged (Light)", "Resilience", "Survival"], 
        freeRanks: 2 
    },
    // Sentinel
    "artisan": { 
        name: "Artisan", 
        career: "sentinel", 
        description: "A craftsman who creates and modifies items with the Force.", 
        careerSkills: ["Astrogation", "Computers", "Knowledge (Education)", "Mechanics"], 
        freeRanks: 2 
    },
    "investigator": { 
        name: "Investigator", 
        career: "sentinel", 
        description: "A detective who uses the Force to solve mysteries.", 
        careerSkills: ["Knowledge (Education)", "Knowledge (Underworld)", "Perception", "Streetwise"], 
        freeRanks: 2 
    },
    "racer": { 
        name: "Racer", 
        career: "sentinel", 
        description: "A pilot who competes in high-speed races.", 
        careerSkills: ["Cool", "Coordination", "Piloting (Planetary)", "Piloting (Space)"], 
        freeRanks: 2 
    },
    "sentry": { 
        name: "Sentry", 
        career: "sentinel", 
        description: "A guardian who protects a specific location or person.", 
        careerSkills: ["Coordination", "Lightsaber", "Stealth", "Vigilance"], 
        freeRanks: 2 
    },
    "shadow": { 
        name: "Shadow", 
        career: "sentinel", 
        description: "A stealthy agent who operates in secret.", 
        careerSkills: ["Knowledge (Underworld)", "Skulduggery", "Stealth", "Streetwise"], 
        freeRanks: 2
    },
    "shien-expertise": { 
        name: "Shien Expertise", 
        career: "sentinel", 
        description: "A master of the Shien lightsaber form, focused on deflecting blaster bolts.", 
        careerSkills: ["Athletics", "Lightsaber", "Resilience", "Skulduggery"], 
        freeRanks: 2 
    },
    // Warrior
    "aggressor": { 
        name: "Aggressor", 
        career: "warrior", 
        description: "A brutal combatant who overwhelms their opponents with sheer force.", 
        careerSkills: ["Coercion", "Knowledge (Underworld)", "Ranged (Light)", "Streetwise"], 
        freeRanks: 2 
    },
    "colossus": { 
        name: "Colossus", 
        career: "warrior", 
        description: "A towering warrior who can withstand incredible punishment.", 
        careerSkills: ["Discipline", "Resilience", "Brawl", "Melee", "Lightsaber"], 
        freeRanks: 2 
    },
    "juyo-berserker": { 
        name: "Juyo Berserker", 
        career: "warrior", 
        description: "A practitioner of the Juyo lightsaber form, a wild and unpredictable style.", 
        careerSkills: ["Coercion", "Discipline", "Melee"], 
        freeRanks: 2 
    },
    "shii-cho-knight": { 
        name: "Shii-Cho Knight", 
        career: "warrior", 
        description: "A master of the Shii-Cho lightsaber form, the foundation of all other styles.", careerSkills: ["Athletics", "Coordination", "Lightsaber", "Melee"], freeRanks: 2 },
    "starfighter-ace": { 
        name: "Starfighter Ace", career: "warrior", 
        description: "A skilled pilot who excels in starfighter combat.", 
        careerSkills: ["Astrogation", "Gunnery", "Mechanics", "Piloting (Space)"], 
        freeRanks: 2 
    },
    "steel-hand-adept": { 
        name: "Steel Hand Adept", 
        career: "warrior", 
        description: "A master of unarmed combat, able to channel the Force through their fists.", 
        careerSkills: ["Coordination", "Discipline", "Vigilance", "Brawl"], 
        freeRanks: 2 
    },
};

const masterTalentsList = {
    "aggressive-negotiations": { name: "Aggressive Negotiations", description: "Once per session, perform a Hard Charm check. Success allows the character to make a single Lightsaber combat check, adding Force dice equal to the character's Force rating. The difficulty of this check cannot be upgraded. The difficulty of all Negotiation checks is increased for the rest of the encounter by 2.", type: "active", isForceTalent: true },
    "all-terrain-driver": { name: "All-Terrain Driver", description: "Do not suffer usual penalties for driving through difficult terrain when using Piloting (Planetary).", type: "passive" },
    "anatomy-lessons": { name: "Anatomy Lessons", description: "After making a successful combat check, may spend 1 Destiny Point to add damage equal to Intellect to one hit.", type: "active" },
    "armor-master": { name: "Armor Master", description: "When wearing armor, increase total soak value by 1.", type: "passive" },
    "bacta-specialist": { name: "Bacta Specialist", description: "Patients regain 1 additional wound per rank of Bacta Specialist when they heal wounds via bacta tanks or long term care.", type: "passive" },
    "bad-cop": { name: "Bad Cop", description: "May spend a Destiny Point from a Coercion or Deception check to upgrade the ability of a single ally's subsequent Coercion, Deception, or Charm interaction check against the target a number of times equal to ranks in Bad Cop.", type: "active" },
    "bad-motivator": { name: "Bad Motivator", description: "Once per session, may take a Bad Motivator action; make a Hard Mechanics check. If successful, one targeted device or vehicle is temporarily disabled.", type: "active" },
    "bad-press": { name: "Bad Press", description: "Once per session, choose one NPC. Make a Hard Deception check. If successful, all of that NPC's allies and organization members have their wound and strain thresholds reduced by 1, plus 1 per Success until the end of the session.", type: "active" },
    "balance": { name: "Balance", description: "When the character recovers strain at the end of the encounter, he may add a number of Boost dice to the check. If successful, he recovers an additional strain equal to his Force rating.", type: "active", isForceTalent: true },
    "beast-wrangler": { name: "Beast Wrangler", description: "Add a Boost die per rank of Beast Wrangler to all checks to tame or wrangle creatures.", type: "passive" },
    "biggest-fan": { name: "Biggest Fan", description: "Once per session, may take the Biggest Fan action to make a Hard Charm check to introduce a helpful N PC into the character's biggest fan.", type: "active" },
    "black-market-contacts": { name: "Black Market Contacts", description: "When purchasing illegal goods, may reduce rarity by 1 per rank of Black Market Contacts, increasing the cost by 50% of the base cost per reduction.", type: "active" },
    "blackmail": { name: "Blackmail", description: "When an NPC exceeds his strain threshold, may spend 1 Destiny Point to choose to have him perform a single task of choice instead.", type: "active" },
    "blooded": { name: "Blooded", description: "Add a Boost die per rank of Blooded to all checks to resist or recover from poisons, venoms, and other toxins. Reduce the duration of ongoing poisons by half (rounded up) per rank of Blooded to a minimum of 1.", type: "active" },
    "body-guard": { name: "Body Guard", description: "Once per round, perform the Body Guard maneuver to guard an engaged character. Suffer strain no greater than ranks in Body Guard. Until the beginning of the next turn, upgrade the difficulty of all combat checks targeting the character by that number.", type: "active" },
    "bolstered-armor": { name: "Bolstered Armor", description: "Increase the armor value of Signature Vehicle by 1 per rank of Bolstered Armor.", type: "passive" },
    "bought-info": { name: "Bought Info", description: "Instead of making a Knowledge check, may take a Bought Info action. Spend credits equal to 50 times the difficulty of the check to pass with one Success.", type: "active" },
    "brace": { name: "Brace", description: "Perform the Brace maneuver to remove a Setback die per rank of Brace from the next action. Setback dice added by environmental effects cannot be removed.", type: "active" },
    "brilliant-evasion": { name: "Brilliant Evasion", description: "Once per encounter may take a Brilliant Evasion action. Select one opponent and make an opposed Piloting (Planetary) or Piloting (Space) check to stop opponent from attacking the pilot for rounds equal to Agility.", type: "active" },
    "bypass-security": { name: "Bypass Security", description: "Remove a Setback die per rank of Bypass Security from Skulduggery checks to disable a security device or open a locked door.", type: "passive" },
    "calm-commander": { name: "Calm Commander", description: "May use ranks in Cool to upgrade the difficulty of checks to resist Coercion instead of Discipline. May use ranks in Cool to upgrade the difficulty of checks to resist fear instead of Leadership.", type: "passive" },
    "calming-aura": { name: "Calming Aura", description: "When an opponent targets the character with a combat check, may spend a Destiny Point to force the opponent to remove all dice from their pool and add dice equal to the character's Force rating. The difficulty of all Charm checks is reduced by 1.", type: "active", isForceTalent: true },
    "careful-planning": { name: "Careful Planning", description: "Once per session, may introduce a 'fact' into the narrative as if a Destiny Point had been spent.", type: "active" },
    "center-of-being": { name: "Center of Being", description: "Take a Center of Being maneuver; make a Hard Discipline check. For a number of next turn, attacks against the character increase their critical rating by 1 per rank of Center of Being.", type: "active", isForceTalent: true },
    "clever-commander": { name: "Clever Commander", description: "May use ranks in Knowledge (Warfare) to upgrade the ability of Leadership checks. May use ranks in Cool to upgrade the ability of Leadership checks instead of ranks in Leadership.", type: "passive" },
    "codebreaker": { name: "Codebreaker", description: "Remove a Setback die per rank of Codebreaker from checks to decrypt communications. Decrease the time to break codes or decrypt communications by half.", type: "passive" },
    "combat-programming": { name: "Combat Programming", description: "Once per encounter, make a Hard Computers check to allow a droid to gain a Boost die on all combat checks for the duration of the encounter.", type: "active" },
    "command": { name: "Command", description: "Add a Boost die per rank of Command to all Leadership checks. Affected targets add a Boost die to Discipline checks for the next 24 hours.", type: "passive" },
    "commanding-presence": { name: "Commanding Presence", description: "Remove a Setback die per rank of Commanding Presence from all Leadership and Cool checks.", type: "passive" },
    "conditioned": { name: "Conditioned", description: "Remove a Setback die per rank of Conditioned from Athletics and Coordination checks. Reduce the damage and strain suffered from falling by 1 per rank of Conditioned.", type: "passive" },
    "confidence": { name: "Confidence", description: "May decrease the difficulty of Discipline checks to avoid fear by 1 per rank of Confidence.", type: "passive" },
    "congenial": { name: "Congenial", description: "May suffer a number of strain to downgrade the difficulty of Charm or Negotiation checks, or upgrade the difficulty when targeted by Charm or Negotiation checks by an equal number. Strain suffered cannot exceed ranks in Congenial.", type: "active" },
    "construction-specialist": { name: "Construction Specialist", description: "Remove a Setback die equal to ranks in Construction Specialist from checks to construct defenses, fortifications, and similar projects.", type: "passive" },
    "contingency-plan": { name: "Contingency Plan", description: "Spend 1 Destiny Point to recover strain equal to Cunning rating.", type: "active" },
    "contraption": { name: "Contraption", description: "Once per session, may take a Contraption action; make a Hard Mechanics check to temporarily solve a current problem with the parts on hand.", type: "active" },
    "convincing-demeanor": { name: "Convincing Demeanor", description: "Remove a Setback die per rank of Convincing Demeanor from Deception or Skulduggery checks.", type: "passive" },
    "coordinated-assault": { name: "Coordinated Assault", description: "Take a Coordinated Assault maneuver; a number of allies equal to Leadership ranks add a Boost die to their combat checks for the next turn. Range increases per rank of Coordinated Assault.", type: "active" },
    "coordination-dodge": { name: "Coordination Dodge", description: "When targeted by a combat check, may spend 1 Destiny Point to add Threat equal to ranks in Coordination to the check.", type: "active" },
    "corellian-sendoff": { name: "Corellian Sendoff", description: "Take a Corellian Sendoff action targeting two ships or vehicles in close range; make a Hard Piloting check to cause them to suffer a minor collision.", type: "active" },
    "creative-design": { name: "Creative Design", description: "As part of resolving a successful check, the character may also apply a number of additional mods equal to ranks in Creative Design. The GM may then require the character to spend that same number of Advantage.", type: "active" },
    "crippling-blow": { name: "Crippling Blow", description: "Increase the difficulty of the next combat check the target makes by 1. If the check deals damage, target suffers 1 strain each time he moves for the remainder of the encounter.", type: "active" },
    "crucial-point": { name: "Crucial Point", description: "Once per session, the character may add a Triumph to successful Charm or Negotiation checks. This talent may be used to fulfill one potential Obligation, but the next will do nearly anything to retaliate.", type: "active" },
    "customized-cooling-unit": { name: "Customized Cooling Unit", description: "Increase the system strain threshold of Signature Vehicle by 1 per rank of Customized Cooling Unit.", type: "passive" },
    "cutting-question": { name: "Cutting Question", description: "Once per encounter, when making a Coercion check, the character may also use his Intellect characteristic.", type: "active" },
    "dead-to-rights": { name: "Dead to Rights", description: "Spend 1 Destiny Point to add additional damage equal to half Agility rounded up to one hit of successful starship or vehicle-mounted weaponry.", type: "active" },
    "deadly-accuracy": { name: "Deadly Accuracy", description: "When acquired, choose 1 combat skill. Add damage equal to ranks in that skill to one hit of successful attack made using that skill.", type: "passive" },
    "debilitating-shot": { name: "Debilitating Shot", description: "Upon successful attack with a starship or vehicle weapon, may spend 2 Advantage to reduce the maximum speed of the target by 1, to a minimum of 1, until the end of the next round.", type: "active" },
    "deceptive-taunt": { name: "Deceptive Taunt", description: "Once per session, may make an opposed Deception vs. Discipline check. If successful, one adversary must attack the character during the adversary's next turn.", type: "active" },
    "dedication": { name: "Dedication", description: "Gain +1 to a single characteristic. This cannot bring a characteristic above 6.", type: "passive" },
    "defensive-driving": { name: "Defensive Driving", description: "Increase defense of vehicle or starship being piloted by 1 per rank of Defensive Driving.", type: "passive" },
    "defensive-stance": { name: "Defensive Stance", description: "Once per round, may perform a Defensive Stance maneuver to add a Setback die per rank of Defensive Stance to all incoming melee attacks.", type: "active" },
    "defensive-training": { name: "Defensive Training", description: "When making a Lightsaber, Melee, or Brawl combat check, may add the Defensive quality with a rating equal to ranks in Defensive Training.", type: "active" },
    "desperate-repairs": { name: "Desperate Repairs", description: "Once per session, may make a Hard Mechanics check on one engaged friendly starship or vehicle; the droid becomes immobile for the remainder of the round, then heals all strain and may repair any Critical Injury of severity greater than Hard.", type: "active" },
    "design-flaw": { name: "Design Flaw", description: "When making a combat check with a personal scale weapon against a droid, may add a number of Advantage equal to ranks of Design Flaw.", type: "active" },
    "discredit": { name: "Discredit", description: "Once per encounter, take the Discredit action; make a Hard Deception check to increase the difficulty of one character's Social skill checks by one for every Success until the end of the encounter.", type: "active" },
    "disorient": { name: "Disorient", description: "After hitting with a combat check, may spend 2 Advantage to disorient the target for a number of rounds equal to ranks in Disorient.", type: "active" },
    "distracting-behavior": { name: "Distracting Behavior", description: "Make a Distracting Behavior maneuver and suffer strain no greater than ranks in Cunning. Until the beginning of the next turn, combat checks against the character increase their difficulty, and this increases with additional ranks.", type: "active" },
    "dockyard-expertise": { name: "Dockyard Expertise", description: "May make an Average Knowledge (Education) check to find a safe and secure space dock. If successful, the cost of all repairs is reduced by 25% per rank of Dockyard Expertise.", type: "active" },
    "dodge": { name: "Dodge", description: "When targeted by a combat check, may perform a Dodge incidental to suffer a number of strain no greater than ranks of Dodge, then upgrade the difficulty of the check by that number.", type: "active" },
    "draw-closer": { name: "Draw Closer", description: "Perform a Draw Closer action; make an opposed Lightsaber vs. Melee combat check against one non-nemesis target at medium range, adding Force dice no greater than Force rating to the check. Spend Force results to move the target one range band closer or to add a number of damage to the check.", type: "active", isForceTalent: true },
    "durable": { name: "Durable", description: "May spend any number of maneuvers to move to cover, decreasing the difficulty of the check to do so by 1 per rank of Durable.", type: "passive" },
    "empty-soul": { name: "Empty Soul", description: "If the character is carrying no more than 1 encumbrance or less, add a Boost die to Force power checks.", type: "passive", isForceTalent: true },
    "encoded-communique": { name: "Encoded Communique", description: "Upgrade the difficulty once of checks to intercept this character's coded messages without the proper gear. The proper gear reduces the time to equal to Computers skill.", type: "passive" },
    "encouraging-words": { name: "Encouraging Words", description: "After an ally fails a skill check, may suffer 1 strain to allow that ally to re-roll the check once. The character may not re-roll the check during an out-of-turn incidental.", type: "active" },
    "enduring": { name: "Enduring", description: "Gain +1 strain threshold.", type: "passive" },
    "exhaust-port": { name: "Exhaust Port", description: "Before attacking a starship of silhouette 5 or larger, may spend 1 Destiny Point to ignore its armor on that attack. Massive rule for the attack.", type: "active" },
    "expert-handler": { name: "Expert Handler", description: "Remove a Setback die per rank of Expert Handler from all checks made to ride beasts.", type: "passive" },
    "expert-tracker": { name: "Expert Tracker", description: "Remove a Setback die per rank of Expert Tracker from checks to find tracks or track targets. Decrease time to track a target by half.", type: "passive" },
    "eye-for-detail": { name: "Eye for Detail", description: "After making a Mechanics or Skulduggery check, may suffer 1 strain to upgrade the success of the check by one.", type: "active" },
    "familiar-suns": { name: "Familiar Suns", description: "Once per session, may perform the Familiar Suns action; make a Hard Knowledge (Core Worlds) check to reveal one vital fact about the local planetary environment and other useful information.", type: "active" },
    "fancy-paint-job": { name: "Fancy Paint Job", description: "Upgrade all Charm, Deception, and Negotiation checks made in the presence of Signature Vehicle once.", type: "passive" },
    "field-commander": { name: "Field Commander", description: "Take the Field Commander action; make an Average Leadership check. Each Success allows one ally to perform one free maneuver.", type: "active" },
    "fine-tuning": { name: "Fine Tuning", description: "When repairing system strain on a starship or vehicle, repair 1 additional system strain per rank of Fine Tuning.", type: "passive" },
    "fire-control": { name: "Fire Control", description: "Take the Fire Control action; make a Hard Computers check to allow the ship to fire all its weapons at a single target from the current starship or vehicle's fire arc. The target must be one silhouette size higher or more. The effect lasts until the beginning of the next turn. Does not stack.", type: "active" },
    "forager": { name: "Forager", description: "Remove a Setback die per rank of Forager from all skill checks to find food, water, or shelter. Survival checks to forage take half the time.", type: "passive" },
    "force-assault": { name: "Force Assault", description: "Spend Force results on a successful Lightsaber combat check to immediately perform a Move force power action as a maneuver.", type: "active", isForceTalent: true },
    "force-protection": { name: "Force Protection", description: "Perform the Force Protection action; suffer 1 strain and commit Force dice up to Force rating. Increase soak by number of Force results until the beginning of next turn. Suffer 1 strain for each Force die that remains committed.", type: "active", isForceTalent: true },
    "force-rating": { name: "Force Rating", description: "Gain +1 Force rating.", type: "passive", isForceTalent: true },
    "form-on-me": { name: "Form On Me", description: "Allies equal to ranks in Leadership within close range of the starship gain the benefits of the Defensive Driving talent.", type: "passive" },
    "fortified-vacuum-seal": { name: "Fortified Vacuum Seal", description: "Increase the hull trauma threshold of Signature Vehicle by 1 per rank of Fortified Vacuum Seal.", type: "passive" },
    "full-stop": { name: "Full Stop", description: "When piloting a vehicle, take a Full Stop maneuver to reduce speed to zero and suffer system strain equal to the speed reduced.", type: "active" },
    "full-throttle": { name: "Full Throttle", description: "Take a Full Throttle action; make a Hard Piloting check to increase a vehicle's top speed by 1 for a number of rounds equal to Cunning.", type: "active" },
    "galaxy-mapper": { name: "Galaxy Mapper", description: "Remove a Setback die per rank of Galaxy Mapper from Astrogation checks. Astrogation checks take half normal time.", type: "passive" },
    "gearhead": { name: "Gearhead", description: "Remove a Setback die per rank of Gearhead from all Mechanics checks. Halve the credit cost to repair a vehicle.", type: "passive" },
    "go-without": { name: "Go Without", description: "Once per session, the character acts as having the 'go-without' talent when making a skill check.", type: "active" },
    "good-cop": { name: "Good Cop", description: "May spend a Destiny Point to add a Boost die from a Charm or Negotiation check to a single ally's subsequent Charm, Deception, or Coercion check against the target a number of rounds equal to ranks in Good Cop.", type: "passive" },
    "grapple": { name: "Grapple", description: "Once per round, may perform the Grapple maneuver. Until the beginning of the character's next turn, opponents must perform 2 maneuvers to move from engaged to short range.", type: "active" },
    "greased-palms": { name: "Greased Palms", description: "Before making a social skill check, may spend up to 50 credits per rank of Greased Palms to upgrade the ability of the check once for every 50 spent.", type: "active" },
    "grit": { name: "Grit", description: "Gain +1 strain threshold.", type: "passive" },
    "hard-boiled": { name: "Hard-Boiled", description: "When recovering strain after an encounter, may make a Hard-Boiled check to recover 1 wound per Success.", type: "passive" },
    "hard-headed": { name: "Hard Headed", description: "When staggered or disoriented, may perform the Hard Headed action; make a Daunting Discipline check to remove the condition. The difficulty is reduced per rank of Hard Headed.", type: "active" },
    "healing-trance": { name: "Healing Trance", description: "Commit Force dice. For every full round the character remains in a Healing Trance, he may heal 1 wound per Force die committed.", type: "active", isForceTalent: true },
    "heroic-fortitude": { name: "Heroic Fortitude", description: "May spend 1 Destiny Point to ignore the effects of Critical Injuries on Brawn or Agility checks until the end of the encounter.", type: "active" },
    "hidden-storage": { name: "Hidden Storage", description: "Gain hidden storage in vehicle or gear that holds items with total encumbrance equal to ranks in Hidden Storage.", type: "passive" },
    "high-g-training": { name: "High-G Training", description: "When a starship or vehicle is being piloted would suffer system strain due to pilot error, may suffer 1 strain up to ranks in High-G Training to prevent an equal amount of system strain.", type: "active" },
    "hindering-shot": { name: "Hindering Shot", description: "Increase the difficulty of the next Gunnery check by 1. If the check deals damage, target starship or vehicle cannot travel faster than speed 1 until the end of the next round.", type: "active" },
    "hold-together": { name: "Hold Together", description: "Spend 1 Destiny Point to perform a Hold Together action to allow a starship or vehicle to ignore the effects of a Critical Hit until the end of the encounter. The vehicle takes 1 system strain.", type: "active" },
    "hunter": { name: "Hunter", description: "Add a Boost die per rank of Hunter to all checks when interacting with beasts or animals (including combat). Add +10 to Critical Injury results against animals per rank of Hunter.", type: "passive" },
    "improved-armor-master": { name: "Improved Armor Master", description: "When wearing armor with a soak value of 2 or higher, increase defense by 1.", type: "passive" },
    "improved-body-guard": { name: "Improved Body Guard", description: "One engaged ally protected by the Body Guard maneuver may suffer 1 less strain to use the maneuver after the 1st instead.", type: "active" },
    "improved-calming-aura": { name: "Improved Calming Aura", description: "Spend a maneuver and suffer 2 strain to extend the effects of the Calming Aura talent to allies equal to Willpower at short range until the start of the next turn.", type: "active", isForceTalent: true },
    "improved-center-of-being": { name: "Improved Center of Being", description: "Suffer 2 strain to perform Center of Being maneuver as an incidental.", type: "active", isForceTalent: true },
    "improved-commanding-presence": { name: "Improved Commanding Presence", description: "Once per session, may take an action to make an opposed Cool vs. Discipline check. If successful, the target may not attack the character for the remainder of the encounter.", type: "active" },
    "improved-confidence": { name: "Improved Confidence", description: "May spend a Destiny Point to ignore the effects of fear checks for a number of rounds equal to ranks in Cool on the same fear check.", type: "passive" },
    "improved-corellian-sendoff": { name: "Improved Corellian Sendoff", description: "When performing a Corellian Sendoff, may spend 3 Advantage to suffer a major collision instead.", type: "passive" },
    "improved-dead-to-rights": { name: "Improved Dead to Rights", description: "Spend 1 Destiny Point to add additional damage equal to Agility to one hit of successful attack made with starship or vehicle-mounted weaponry.", type: "active" },
    "improved-defenses": { name: "Improved Defenses", description: "May make an Average Survival check to fashion small defenses. It grants cover to up to the characters for the rest of the encounter.", type: "active" },
    "improved-detonation": { name: "Improved Detonation", description: "Once per session, make a Hard Mechanics check to build a small, improvised detonation device, dealing damage and blast in short range. Add Intellect + ranks in Mechanics to damage.", type: "active" },
    "improved-distracting-behavior": { name: "Improved Distracting Behavior", description: "The Distracting Behavior maneuver may now add a Boost die to allies' checks when NPCs target the character's cover.", type: "active" },
    "improved-field-commander": { name: "Improved Field Commander", description: "Field Commander action affects allies equal to double the number of Success. May spend a Destiny Point to allow one ally to perform 1 free action instead.", type: "passive" },
    "improved-full-throttle": { name: "Improved Full Throttle", description: "Suffer 1 strain to attempt Full Throttle as a maneuver and reduce the difficulty to Average.", type: "active" },
    "improved-hard-headed": { name: "Improved Hard Headed", description: "When incapacitated due to strain exceeding threshold, may perform a Difficult Hard Headed action to recover strain to 1 below threshold.", type: "active" },
    "improved-healing-trance": { name: "Improved Healing Trance", description: "When healing wounds due to Healing Trance, make a Hard Medicine check to heal one Critical Injury. The difficulty of the check is reduced for each additional Critical Injury.", type: "active", isForceTalent: true },
    "improved-in-the-know": { name: "Improved In the Know", description: "Once per session, if in PC's Duty, may make an opposed Deception vs. Vigilance check. If successful, they have a target NPC believe specific false information.", type: "active" },
    "improved-inspiring-rhetoric": { name: "Improved Inspiring Rhetoric", description: "Each ally affected by Inspiring Rhetoric gains a Boost die on all skill checks for a number of rounds equal to ranks in Leadership.", type: "passive" },
    "improved-plausible-deniability": { name: "Improved Plausible Deniability", description: "Take an Improved Plausible Deniability action; make a Hard Coercion check. If successful, one bystander per Success must use his next ability to depart quietly.", type: "active" },
    "improved-position": { name: "Improved Position", description: "The character may make a Hard Mechanics check to construct a device that provides video cover for the group and its vehicles.", type: "active" },
    "improved-precision-strike": { name: "Improved Precision Strike", description: "Once per round, when making a combat check with a Brawl or Melee weapon, may suffer 2 strain to decrease the target's critical rating by 1 to a minimum of 1 for the current attack.", type: "active" },
    "improved-ready-for-anything": { name: "Improved Ready for Anything", description: "When making Cool or Vigilance checks to determine initiative, may add Success equal to ranks in Ready for Anything.", type: "passive" },
    "improved-researcher": { name: "Improved Researcher", description: "Once per check, a Knowledge check on characters and allies grants a Boost die to that character's checks until the end of his next turn.", type: "passive" },
    "improved-savvy-negotiator": { name: "Improved Savvy Negotiator", description: "Make a Hard Negotiation check to add a number of Setback dice per rank of Savvy Negotiator to an opponent's points as malicious rumors.", type: "active" },
    "improved-scathing-tirade": { name: "Improved Scathing Tirade", description: "Each enemy affected by Scathing Tirade suffers a Setback die on all skill checks for a number of rounds equal to ranks in Coercion.", type: "passive" },
    "improved-shortcut": { name: "Improved Shortcut", description: "When engaging in a chase or race, may suffer 2 strain to add 2 Boost dice to the check per rank in Shortcut.", type: "active" },
    "improved-spur": {name: "Improved Spur", description: "Suffer 1 strain to attempt Spur as a maneuver and derease its difficulty to Average", type: "active"},
    "improved-stim-application": { name: "Improved Stim Application", description: "When performing Stim Application action, increase difficulty of check to Hard to allow target to ignore the effects of Critical Injuries and suffer 1 less strain.", type: "active" },
    "improved-stunning-blow": { name: "Improved Stunning Blow", description: "When dealing strain damage with a Melee or Brawl attack, the target is staggered for 1 round per 2 Advantage spent.", type: "active" },
    "improved-sunder": { name: "Improved Sunder", description: "Each Advantage spent to activate a weapons Sunder quality damages an item two steps, instead of one.", type: "passive" },
    "improved-time-to-go": { name: "Improved Time to Go", description: "When activating Time to Go, allow 1 engaged ally to also perform the move maneuver as an incidental to get into a vehicle that is in or out of the Blast range of a weapon or explosion.", type: "passive" },
    "improved-unrelenting-skeptic": { name: "Improved Unrelenting Skeptic", description: "When targeted by a Deception check, the character may spend 1 Destiny Point to add 2 results.", type: "active" },
    "improved-wise-warrior": { name: "Improved Wise Warrior", description: "When performing the Wise Warrior incidental, one ally may add a number of Boost dice to all skill checks he makes before the end of the character's next turn.", type: "active" },
    "in-the-know": { name: "In the Know", description: "Remove a Setback die up to ranks in In the Know from checks to get information from people or communicate with them. If successful, this character's allegiance is interviews.", type: "active" },
    "incite-rebellion": { name: "Incite Rebellion", description: "Once per session, perform an Incite Rebellion action; make an opposed Coercion check. If successful, a number of minions or rivals equal to ranks in Coercion become the character's minions until the end of the encounter.", type: "active" },
    "indistinguishable": { name: "Indistinguishable", description: "Upgrade the difficulty of checks to identify the character once per rank of Indistinguishable.", type: "passive" },
    "informant": { name: "Informant", description: "Once per session, may reveal a contact who can provide information on a chosen subject.", type: "active" },
    "inspiring-rhetoric": { name: "Inspiring Rhetoric", description: "Take the Inspiring Rhetoric action; make an Average Leadership check. Each Success causes 1 ally in close range to recover 1 strain. The character and affected ally recover 1 additional strain.", type: "active" },
    "intense-focus": { name: "Intense Focus", description: "Perform an Intense Focus maneuver; suffer 1 strain and upgrade the ability of the next skill check once.", type: "active" },
    "intense-presence": { name: "Intense Presence", description: "Spend 1 Destiny Point to inflict strain equal to Presence rating.", type: "active" },
    "interjection": { name: "Interjection", description: "After another character makes a skill check, may suffer 3 strain to take an interjection action; make an Average Vigilance check. If successful, add a number of Success and a number of Advantage equal to the results.", type: "active" },
    "intimidating": { name: "Intimidating", description: "May suffer a number of strain to downgrade the difficulty of Coercion checks, or upgrade the difficulty of checks targeting the character with Coercion checks, by an equal number. Strain suffered this way cannot exceed ranks in Intimidating.", type: "active" },
    "inventor": { name: "Inventor", description: "When constructing new items, may add or remove a number of hard points or add or remove a number of mods per rank of Inventor.", type: "passive" },
    "iron-body": { name: "Iron Body", description: "Remove a Setback die per rank of Iron Body from Coordination and Resilience checks. Reduce the critical rating of all Brawl attacks by 1 per rank of Iron Body (to a minimum of 1).", type: "passive" },
    "iron-soul": { name: "Iron Soul", description: "When carrying items that total 1 encumbrance or less, may take an Iron Soul counter; heal all strain the character is suffering.", type: "passive" },
    "its-not-that-bad": { name: "It's Not That Bad", description: "When an ally suffers a Critical Injury, the character may take an It's Not That Bad action; make a Hard Charm check. If successful, the ally does not suffer the effects of the Critical Injury for a number of rounds equal to Willpower, after which the effects return.", type: "active" },
    "jump-up": { name: "Jump Up", description: "Once per round, may stand from seated or prone as an incidental.", type: "active" },
    "jury-rigged": { name: "Jury Rigged", description: "Choose 1 weapon, armor, or gear. It now has a permanent improvement which remains until the item is replaced.", type: "passive" },
    "kill-with-kindness": { name: "Kill with Kindness", description: "Remove a Setback die per rank of Kill with Kindness from all Charm and Leadership checks.", type: "passive" },
    "know-it-all": { name: "Know-it-all", description: "Once per session, perfectly recall an important fact previously learned, as if a Destiny Point had been spent.", type: "active" },
    "know-somebody": { name: "Know Somebody", description: "Once per session, when attempting to purchase a legally available item, re-duce its rarity by 1 per rank of Know Somebody.", type: "active" },
    "knowledge-specialization": { name: "Knowledge Specialization", description: "When acquired, choose 1 Knowledge skill. When making that skill check, may spend a Triumph to gain additional successes equal to ranks in that Knowledge skill.", type: "passive" },
    "knowledgeable-healing": { name: "Knowledgeable Healing", description: "When healing an ally, spend 1 Destiny Point to make a Medicine check. The ally heals additional wounds equal to ranks in Knowledge (Xenology).", type: "active" },
    "known-schematic": { name: "Known Schematic", description: "Once per session, may perform the Known Schematic action; make a Hard Knowledge (Education) check. Success grants familiarity with a building or ship's layout.", type: "active" },
    "koidogran-turn": { name: "Koidogran Turn", description: "When an opponent has flown past, make a Koidogran Turn maneuver to remove the effects.", type: "active" },
    "larger-project": { name: "Larger Project", description: "Signature Vehicle can have a silhouette 1 larger per rank of Larger Project.", type: "passive" },
    "lethal-blows": { name: "Lethal Blows", description: "Add +10 per rank of Lethal Blows to any Critical Injury results inflicted on opponents.", type: "passive" },
    "lets-ride": { name: "Let's Ride", description: "Once per round, may mount or dismount a vehicle or beast, or enter a cockpit or weapon station on a vehicle, as an incidental.", type: "active" },
    "machine-mender": { name: "Machine Mender", description: "When making a Mechanics check to help a character heal, the character heals 1 additional wound per rank of Machine Mender.", type: "passive" },
    "martial-grace": { name: "Martial Grace", description: "Once per round, suffer 2 strain to add damage equal to ranks in Coordination to one hit of a successful Brawl attack.", type: "active" },
    "master-artisan": { name: "Master Artisan", description: "Once per round, may take a Master Artisan action; suffer 2 strain to decrease the difficulty of the next Mechanics check by 1, to a minimum of Easy.", type: "active" },
    "master-demolitionist": { name: "Master Demolitionist", description: "When resolving an attack with a Blast or ordnance weapon, may add damage equal to the weapon's Blast quality act to the total damage, even if it already acts at short.", type: "active" },
    "master-doctor": { name: "Master Doctor", description: "Once per round, suffer 2 strain to decrease the difficulty of a Medicine check by 1.", type: "active" },
    "master-driver": { name: "Master Driver", description: "Once per round when piloting a vehicle, may suffer 2 strain to perform any action as a maneuver.", type: "active" },
    "master-grenadier": { name: "Master Grenadier", description: "Decrease the Advantage cost to activate the Blast quality on any weapon the user has by 1 to a minimum of 1.", type: "passive" },
    "master-instructor": { name: "Master Instructor", description: "Once per encounter, as an out of turn incidental, may suffer 3 strain to allow an ally to use the character's ranks in Discipline or Leadership for one Discipline check an ally makes.", type: "active" },
    "master-leader": { name: "Master Leader", description: "Once per round, suffer 2 strain to decrease the difficulty of the next Leadership check by 1 to a minimum of Easy.", type: "active" },
    "master-merchant": { name: "Master Merchant", description: "When buying or selling goods legally, may take an Obligation, buy for 25% less or sell for 25% more, buy for 25% less and take 1 less Obligation, or take 1 less.", type: "active" },
    "master-of-shadows": { name: "Master of Shadows", description: "Once per round, suffer 2 strain to decrease difficulty of next Stealth or Skulduggery check by one.", type: "active" },
    "master-pilot": { name: "Master Pilot", description: "Once per round when piloting a starship, may suffer 2 strain to perform any action as a maneuver.", type: "active" },
    "master-starhopper": { name: "Master Starhopper", description: "Once per round, suffer 2 strain to decrease the difficulty of the next Astrogation check by 1 to a minimum of Easy.", type: "active" },
    "master-strategist": { name: "Master Strategist", description: "Once per session, during a mass combat, may suffer 3 strain to downgrade the difficulty of a Mass Combat check once.", type: "active" },
    "meditative-training": { name: "Meditative Training", description: "When suffocating (see Force and Destiny Core Rulebook, page 222), the character suffers 1 strain each round instead of 2. When exposed to vacuum, the character suffers 1 strain each round instead of 3.", type: "active", isForceTalent: true },
    "mental-fortress": { name: "Mental Fortress", description: "Spend 1 Destiny Point to ignore the effects of Critical Injuries on Intellect or Cunning checks until the end of the encounter.", type: "active" },
    "mind-bleed": { name: "Mind Bleed", description: "When attacked, the character may suffer strain no greater than the number of ranks in Discipline to force the attacker to suffer the same amount of strain. If he is engaged, the attacker also suffers a number of wounds equal to the strain suffered by the character.", type: "active", isForceTalent: true },
    "mind-over-matter": { name: "Mind Over Matter", description: "The character may spend 1 Destiny Point to recover strain equal to Willpower rating.", type: "active" },
    "natural-athlete": { name: "Natural Athlete", description: "Once per session, may re-roll any 1 Athletics or Coordination check.", type: "passive" },
    "natural-brawler": { name: "Natural Brawler", description: "Once per session, may re-roll any 1 Brawl or Melee check.", type: "passive" },
    "natural-charmer": { name: "Natural Charmer", description: "Once per session, may re-roll any 1 Charm or Deception check.", type: "passive" },
    "natural-doctor": { name: "Natural Doctor", description: "Once per session, may re-roll any 1 Medicine check.", type: "passive" },
    "natural-driver": { name: "Natural Driver", description: "Once per session, may re-roll any 1 Piloting (Planetary) or Gunnery check.", type: "passive" },
    "natural-enforcer": { name: "Natural Enforcer", description: "Once per session, may re-roll any 1 Coercion or Streetwise check.", type: "passive" },
    "natural-instructor": { name: "Natural Instructor", description: "Once per session, may re-roll one Discipline or Leadership check.", type: "passive" },
    "natural-leader": { name: "Natural Leader", description: "Once per session, may re-roll any 1 Cool or Leadership check.", type: "passive" },
    "natural-marksman": { name: "Natural Marksman", description: "Once per session, may re-roll any 1 Ranged (Light) or Ranged (Heavy) check.", type: "passive" },
    "natural-merchant": { name: "Natural Merchant", description: "Once per session, may re-roll any 1 Streetwise or Negotiation check.", type: "passive" },
    "natural-negotiator": { name: "Natural Negotiator", description: "Once per session, may re-roll any 1 Cool or Negotiation check.", type: "passive" },
    "natural-outdoorsman": { name: "Natural Outdoorsman", description: "Once per session, may re-roll any 1 Resilience or Survival check.", type: "passive" },
    "natural-pilot": { name: "Natural Pilot", description: "Once per session, may re-roll any 1 Piloting (Space) or Gunnery check.", type: "passive" },
    "natural-programmer": { name: "Natural Programmer", description: "Once per session, may re-roll any 1 Computers or Astrogation check.", type: "passive" },
    "natural-scholar": { name: "Natural Scholar", description: "Once per session, may re-roll any 1 Knowledge skill check.", type: "passive" },
    "natural-tinkerer": { name: "Natural Tinkerer", description: "Once per session, may re-roll any 1 Mechanics check.", type: "passive" },
    "niman-technique": { name: "Niman Technique", description: "When making a Lightsaber combat check, the character may use Willpower instead of Brawn.", type: "passive" },
    "nobodys-fool": { name: "Nobody's Fool", description: "Upgrade the difficulty of incoming Charm, Coercion, and Deception checks once per rank of Nobody's Fool.", type: "passive" },
    "not-today": { name: "Not Today", description: "Once per session, spend a Destiny Point to save the Signature Vehicle from destruction.", type: "active" },
    "now-the-master": { name: "Now the Master", description: "Once per session, become one with the Force power that any character in the encounter possesses. May use that Force power until the end of the encounter.", type: "active", isForceTalent: true },
    "offensive-driving": { name: "Offensive Driving", description: "As a maneuver, suffer 1 system strain to the vehicle to add 1 Setback die to the highest defense of the target's vehicle for the character's next Piloting check against that target.", type: "active" },
    "once-a-learner": { name: "Once a Learner", description: "As an action, suffer 4 strain and choose one ally in medium range. Increase the ally's Cunning and Willpower by 1 until the end of the round.", type: "active" },
    "one-with-the-universe": { name: "One with the Universe", description: "Once per session, may perform One with the Universe action; make an Average Astrogation check. Success allows the character to add Force results to all Force power checks in the encounter. May check with Knowledge (Xenology) instead.", type: "active", isForceTalent: true },
    "outdoorsman": { name: "Outdoorsman", description: "Remove a Setback die per rank of Outdoorsman from checks to move through terrain or manage mounts. Decrease overland travel times by half.", type: "passive" },
    "overbalance": { name: "Overbalance", description: "When a combat check made by an engaged foe misses, may spend 2 Advantage to stagger the attacker until the end of his next turn.", type: "active" },
    "overstocked-ammo": { name: "Overstocked Ammo", description: "Increase the value of the Limited Ammo quality of all weapons on the Signature Vehicle by 1 per rank of Overstocked Ammo.", type: "passive" },
    "overwhelm-defenses": { name: "Overwhelm Defenses", description: "Upon a successful attack with a starship or vehicle weapon, may spend 2 Advantage per rank of Overwhelm Defenses to reduce the defense in the targeted zone by 1 for every Advantage spent.", type: "active" },
    "pain-management": { name: "Pain Management", description: "Once per encounter, may take a Pain Management action; make an Average Medicine check to allow an ally to ignore the effects of all Critical Injuries until the end of the encounter.", type: "active" },
    "parry": { name: "Parry", description: "When hit by a melee attack, suffer 3 strain to reduce the damage by 2 plus ranks in Parry.", type: "active" },
    "physical-training": { name: "Physical Training", description: "Add a Boost die per rank of Physical Training to Athletics and Resilience checks.", type: "passive" },
    "physician": { name: "Physician", description: "When making a Medicine check to heal wounds, the target heals 1 additional wound per rank of Physician.", type: "passive" },
    "planet-mapper": { name: "Planet Mapper", description: "Remove a Setback die per rank of Planet Mapper from Streetwise or Survival checks made to navigate on a world. Such checks also take half normal time.", type: "passive" },
    "plausible-deniability": { name: "Plausible Deniability", description: "Remove a Setback die per rank of Plausible Deniability from all Coercion and Deception checks.", type: "passive" },
    "point-blank": { name: "Point Blank", description: "Add 1 damage per rank of Point Blank to one hit of a successful attack made with Ranged (Heavy) or Ranged (Light) skills at close range or engaged.", type: "passive" },
    "positive-spin": { name: "Positive Spin", description: "Whenever any character's Duty would increase, it increases by 1 additional per rank of Positive Spin.", type: "passive" },
    "powerful-blast": { name: "Powerful Blast", description: "Increase Blast damage dealt by explosives, explosive weapons, and grenades by 1 per rank of Powerful Blast.", type: "passive" },
    "precise-aim": { name: "Precise Aim", description: "Once per round, may perform Precise Aim maneuver. Suffer a number of strain no greater than ranks in Precise Aim, then reduce target's melee and ranged defense by that number.", type: "active"},
    "precision-strike": { name: "Precision Strike", description: "When this character inflicts a Critical Injury with a Brawl, Melee, or Lightsaber weapon, may spend 2 Advantage to change the result to any Easy Critical Injury.", type: "active" },
    "preemptive-avoidance": { name: "Preemptive Avoidance", description: "May spend a Destiny Point to disengage from an engaged enemy as an out-of-turn incidental.", type: "active" },
    "pressure-point": { name: "Pressure Point", description: "When making a Brawl check against an opponent, inflict a Critical Injury to deal equivalent strain damage. This may not exceed ranks of Medicine (this ignores soak).", type: "active" },
    "push-the-specs": { name: "Push the Specs", description: "Perform the Push the Specs action when making an Average Mechanics check. With success, increase a starship's speed by 1 for a number of rounds equal to the character's Intellect.", type: "active" },
    "quick-draw": { name: "Quick Draw", description: "Once per round, draw or holster a weapon or accessible item as an incidental.", type: "active" },
    "quick-strike": { name: "Quick Strike", description: "Add a Boost die per rank of Quick Strike to combat checks against targets that have not acted yet this encounter.", type: "passive" },
    "rapid-reaction": { name: "Rapid Reaction", description: "Suffer a number of strain to add an equal number of Success to Initiative checks. Strain suffered cannot exceed ranks in Rapid Reaction.", type: "active" },
    "rapid-recovery": { name: "Rapid Recovery", description: "When recovering strain at the end of an encounter, recover 1 additional strain per rank of Rapid Recovery.", type: "passive" },
    "ready-for-anything": { name: "Ready for Anything", description: "Perform the Ready for Anything maneuver; suffer strain no greater than ranks in Ready for Anything to add a Boost die to Cool or Vigilance checks to determine initiative order.", type: "passive" },
    "reconstruct-the-scene": { name: "Reconstruct the Scene", description: "Perform the Reconstruct the Scene action. Spend a Destiny Point to make a Hard Perception check to learn one of the physical characteristics of a person who was at the scene within 24 hours.", type: "active" },
    "redundant-systems": { name: "Redundant Systems", description: "Once per session, may take a Redundant Systems action; make a Hard Mechanics check to repair damage to a malfunctioning device without breaking the first device.", type: "active" },
    "reflect": { name: "Reflect", description: "When hit by a ranged attack, may suffer 3 strain to reduce damage by 2 plus ranks in Reflect.", type: "active", isForceTalent: true },
    "reinforced-frame": { name: "Reinforced Frame", description: "Signature Vehicle gains Massive 1; when making an attack targeting the starship or vehicle, the Critical rating of the weapon used is treated as 1 higher.", type: "passive" },
    "repair-patch-specialization": { name: "Repair Patch Specialization", description: "When making an emergency repair patch, the target heals 1 additional wound per rank of Repair Patch Specialization.", type: "passive" },
    "reroute-processors": { name: "Reroute Processors", description: "After a successful check, may take a Reroute Processors action; make an opposed Computers check to add a number of damage to the ship's strain equal to the character's Intellect.", type: "active" },
    "researcher": { name: "Researcher", description: "Remove a Setback die per rank of Researcher from all Knowledge checks. Researching a subject takes half the time.", type: "passive" },
    "resolve": { name: "Resolve", description: "When a character involuntarily suffers strain, he suffers 1 less strain per rank of Resolve, to a minimum of 1.", type: "passive" },
    "respected-scholar": { name: "Respected Scholar", description: "May downgrade the difficulty of checks to interact with academic institutions or personnel by one level per rank of Respected Scholar.", type: "passive" },
    "savvy-negotiator": { name: "Savvy Negotiator", description: "Remove a Setback die per rank of Savvy Negotiator from all Charm and Streetwise checks.", type: "passive" },
    "scathing-tirade": { name: "Scathing Tirade", description: "Take a Scathing Tirade action; make an Average Coercion check. Each Success causes 1 enemy in close range to suffer 1 strain. The character and affected enemy suffer 1 additional strain.", type: "active" },
    "second-chances": { name: "Second Chances", description: "Once per encounter, choose a number of positive dice no greater than ranks in Second Chances and re-roll them.", type: "active" },
    "second-wind": { name: "Second Wind", description: "Once per encounter, may use the Second Wind incidental to recover strain equal to ranks in Second Wind.", type: "active" },
    "selective-detonation": { name: "Selective Detonation", description: "When using any weapon with the Blast quality, spend a Triumph to have a number of allies who would normally be affected by the blast ignore the damage. This cannot exceed ranks in Selective Detonation.", type: "active" },
    "sense-danger": { name: "Sense Danger", description: "Once per session, may remove a Setback die from any 1 check.", type: "passive" },
    "sense-emotions": { name: "Sense Emotions", description: "Add a Boost die to all Charm, Coercion, and Deception checks unless the target is immune to Force powers.", type: "passive", isForceTalent: true },
    "showboat": { name: "Showboat", description: "When making a check in a chase or dogfight, may suffer 2 strain to gain 2 Advantage on success or 2 Threat on failure.", type: "active" },
    "shortcut": { name: "Shortcut", description: "During a chase, add a Boost die per rank in Shortcut to any checks made to catch or escape an opponent.", type: "passive" },
    "side-step": { name: "Side Step", description: "Once per round, may perform the Side Step maneuver and suffer a number of strain no greater than ranks in Side Step to add an equal number of Setback dice to incoming ranged attacks. Strain suffered cannot exceed ranks in Side Step.", type: "active" },
    "signature-vehicle": { name: "Signature Vehicle", description: "Choose one starship or vehicle. It gains one free permanent upgrade. All Mechanics checks made on it are one difficulty easier.", type: "passive" },
    "situational-awareness": { name: "Situational Awareness", description: "Allies within short range of the vehicle add a Boost die to their Perception and Vigilance checks. Allies within close range add 2 Boost dice.", type: "passive" },
    "sixth-sense": { name: "Sixth Sense", description: "Gain +1 ranged defense.", type: "passive" },
    "skilled-jockey": { name: "Skilled Jockey", description: "Remove a Setback die per rank of Skilled Jockey from all Piloting (Planetary) and Piloting (Space) checks.", type: "passive" },
    "skilled-teacher": { name: "Skilled Teacher", description: "If an ally at short range has fewer ranks in a skill than the character, the character may perform a Skilled Teacher incidental to suffer a number of strain no greater than ranks of Skilled Teacher, then add a number of Success to the ally's next check.", type: "active" },
    "slippery-minded": { name: "Slippery Minded", description: "If under the effects of a Force power, may perform a Slippery Minded action; make a Hard Deception check to immediately end the effects.", type: "active" },
    "smart-handling": { name: "Smart Handling", description: "Once per session, take the Smart Handling action; make a Hard Piloting check. Until the start of the character's next turn, the handling increases by 1 plus an additional 1 per Success on the check, to a maximum handling of +3.", type: "active" },
    "smooth-talker": { name: "Smooth Talker", description: "When first acquired, choose 1 skill: Charm, Coercion, Deception, or Negotiation. When making checks with that skill, spend a Destiny Point to add additional Success equal to ranks in Smooth Talker.", type: "active" },
    "sniper-shot": { name: "Sniper Shot", description: "Before making a non-thrown ranged attack, may perform a Sniper Shot maneuver to increase the weapon's range by 1 range band per rank in Sniper Shot. Upgrade the difficulty of the check by 1 per range band increase.", type: "active" },
    "soft-spot": { name: "Soft Spot", description: "After making a successful attack, may spend 1 Destiny Point to add additional damage equal to Cunning to one hit.", type: "active" },
    "solid-repairs": { name: "Solid Repairs", description: "When repairing hull trauma on a starship or vehicle, repair 1 additional hull trauma per rank of Solid Repairs.", type: "passive" },
    "soothing-tone": { name: "Soothing Tone", description: "Take a Soothing Tone action; make an Average Knowledge (Xenology) check to allow a beast to recover strain equal to Success.", type: "active" },
    "sound-investments": { name: "Sound Investments", description: "At the start of each session, gain 100 credits for each rank of Sound Investments.", type: "passive" },
    "spare-clip": { name: "Spare Clip", description: "Cannot run out of ammo due to Despair. May spend Advantage to regain 1 limited ammo quality run out of ammo as normal.", type: "passive" },
    "speaks-binary": { name: "Speaks Binary", description: "When directing NPC droids, the character may add a Boost die per rank of Speaks Binary on checks.", type: "passive" },
    "spur": { name: "Spur", description: "Take a Spur action; make a Hard Survival check to increase a mount's speed by 1. The beast suffers 1 strain each round it stays spurred.", type: "active" },
    "stalker": { name: "Stalker", description: "Add a Boost die per rank of Stalker to all Stealth and Coordination checks.", type: "passive" },
    "steely-nerves": { name: "Steely Nerves", description: "Spend 1 Destiny Point to ignore the effects of Critical Injuries on Brawn or Agility checks until the end of the encounter. Add a Boost die to Cool and Vigilance checks until the end of the encounter.", type: "active" },
    "stim-application": { name: "Stim Application", description: "Take the Stim Application action; make an Average Medicine check to allow a character to ignore the effects of all Critical Injuries for the remainder of the encounter and suffers 1 strain.", type: "active" },
    "stimpack-specialization": { name: "Stimpack Specialization", description: "Stimpacks heal 1 additional wound. Character can use a stimpack on an ally as a maneuver. Character may carry 1 additional stimpack per rank of Stimpack Specialization.", type: "passive" },
    "street-smarts": { name: "Street Smarts", description: "Remove a Setback die per rank of Street Smarts from Streetwise and Knowledge (Underworld) checks.", type: "passive" },
    "stroke-of-genius": { name: "Stroke of Genius", description: "Once per skill check using Intellect, may spend a Destiny Point to add additional Success equal to the character's Intellect characteristic.", type: "active" },
    "strong-arm": { name: "Strong Arm", description: "Treat thrown weapons as if they had 1 greater range.", type: "passive" },
    "stunning-blow": { name: "Stunning Blow", description: "When making a Melee attack, may inflict strain as strain damage instead of wounds. This may not exceed ranks in Stunning Blow.", type: "active" },
    "sum-djem": { name: "Sum Djem", description: "May spend a Triumph or a number of Advantage on a successful Lightsaber check to disarm an opponent.", type: "active" },
    "superior-reflexes": { name: "Superior Reflexes", description: "Gain +1 melee defense.", type: "passive" },
    "supporting-evidence": { name: "Supporting Evidence", description: "When assisting an ally with a Charm, Deception, or Leadership check, add automatic Success per rank of Supporting Evidence.", type: "passive" },
    "supreme-full-throttle": { name: "Supreme Full Throttle", description: "When performing Full Throttle max speed is increased by 2 instead of 1", type: "passive" },
    "supreme-inspiring-rhetoric": { name: "Supreme Inspiring Rhetoric", description: "Suffer 1 strain to perform Inspiring Rhetoric as a maneuver, not an action.", type: "active" },
    "supreme-precision-strike": { name: "Supreme Precision Strike", description: "Once per round, when inflicting a Critical Injury with an unarmed attack, may suffer 2 strain to change the result to any Hard Critical Injury.", type: "active" },
    "supreme-scathing-tirade": { name: "Supreme Scathing Tirade", description: "Suffer 1 strain to perform Scathing Tirade as a maneuver, not an action.", type: "active" },
    "supreme-spur": { name: "Supreme Spur", description: "When activating and maintaining Spur, the beast only suffers 1 strain instead of 2.", type: "passive" },
    "supreme-stim-application": { name: "Supreme Stim Application", description: "When performing the Stim Application action, may spend a Destiny Point to increase an additional Characteristic by 1.", type: "passive" },
    "surgeon": { name: "Surgeon", description: "When making a Medicine check to heal wounds, the target heals 1 additional wound per rank of Surgeon.", type: "passive" },
    "swift": { name: "Swift", description: "Do not suffer the usual penalties for moving through difficult terrain.", type: "passive" },
    "targeted-blow": { name: "Targeted Blow", description: "After making a successful attack, may spend 1 Destiny Point to add damage equal to Agility to one hit.", type: "active" },
    "technical-aptitude": { name: "Technical Aptitude", description: "Reduce time needed to complete Computer-related tasks by 25% per rank of Technical Aptitude.", type: "passive" },
    "thats-how-its-done": { name: "That's How It's Done", description: "May suffer 1 strain on a successful skill check to add Advantage to that check by a number of allies equal to ranks in Leadership. This effect lasts for a number of rounds during the next round.", type: "active" },
    "the-force-is-my-ally": { name: "The Force is My Ally", description: "Once per session, may suffer 2 strain to perform a Force power action as a maneuver.", type: "active", isForceTalent: true },
    "thorough-assessment": { name: "Thorough Assessment", description: "Once per session, take a Thorough Assessment action; make a Hard Knowledge check. Successes may be distributed during the encounter.", type: "active" },
    "throwing-credits": { name: "Throwing Credits", description: "At the beginning of a session, spend 100 credits to ignore the effects of 1 Setback die due to triggered Obligation.", type: "active" },
    "time-to-go": { name: "Time to Go", description: "May spend 1 Destiny Point to perform a move maneuver as an incidental to get into a vehicle that is in or out of the Blast range of a weapon or explosion.", type: "active" },
    "tinkerer": { name: "Tinkerer", description: "May add 1 additional hard point to a number of items equal to ranks in Tinkerer. Each item may only be modified once.", type: "passive" },
    "toughened": { name: "Toughened", description: "Gain +2 wound threshold.", type: "passive" },
    "tricky-target": { name: "Tricky Target", description: "Count vehicle or starship being piloted as having silhouette 1 lower when being attacked by opponents.", type: "passive" },
    "true-aim": { name: "True Aim", description: "Once per round, may perform a True Aim maneuver to gain benefits of aiming and upgrade the combat check once per rank of True Aim.", type: "active" },
    "tuned-maneuvering-thrusters": { name: "Tuned Maneuvering Thrusters", description: "Increase the handling of Signature Vehicle by 1 per rank of Tuned Maneuvering Thrusters.", type: "passive" },
    "twisted-words": { name: "Twisted Words", description: "When an incoming social skill check succeeds, may suffer 1 strain as an incidental to add a number of Failure equal to ranks in Coercion on the speaker.", type: "active" },
    "unarmed-parry": { name: "Unarmed Parry", description: "May Parry while unarmed. Reduce strain cost to Parry by 1 (to a minimum of 1).", type: "passive" },
    "unrelenting-skeptic": { name: "Unrelenting Skeptic", description: "When targeted by a Deception check, the character may add a Setback die to the check equal to ranks in Vigilance.", type: "passive" },
    "utility-belt": { name: "Utility Belt", description: "Spend 1 Destiny Point to perform a Utility Belt incidental; produce a previously stowed tool or small weapon (with restrictions) from a tool kit or belt.", type: "active" },
    "valuable-facts": { name: "Valuable Facts", description: "Once per encounter, perform a Valuable Facts action; make an Average Knowledge check. Add a Boost die to one ally's checks during the encounter.", type: "active" },
    "weak-foundation": { name: "Weak Foundation", description: "Once per session, may take the Weak Foundation action; make a Hard Knowledge (Warfare) check. If successful, for the remainder of the encounter, the character and all allies add a Boost die to all combat checks made against the identified fixed structure.", type: "active" },
    "well-read": { name: "Well Read", description: "Choose any 1 Knowledge skill. It permanently becomes a career skill.", type: "passive" },
    "well-rounded": { name: "Well Rounded", description: "Choose any 2 skills. They permanently become career skills.", type: "passive" },
    "well-traveled": { name: "Well Traveled", description: "Knowledge (Core Worlds) and Knowledge (Outer Rim) become career skills.", type: "passive" },
    "wheel-and-deal": { name: "Wheel and Deal", description: "When selling goods legally, gain 10% more credits per rank of Wheel and Deal.", type: "passive" },
    "wise-warrior": { name: "Wise Warrior", description: "When making a combat check, may perform a Wise Warrior incidental. May add a number of Boost dice to any characteristic for the check.", type: "active" },
    "works-like-a-charm": { name: "Works Like a Charm", description: "Once per session, make a check using a characteristic other than the characteristic linked to that skill.", type: "active" },
"animal-companion": { name: "Animal Companion", description: "Gain an animal companion that follows most commands. The specifics of the animal are determined by the GM.", type: "passive" },
"bring-it-down": { name: "Bring it Down", description: "Once per attack, spend 1 Destiny Point to add damage equal to Brawn to a single hit of a successful attack.", type: "active" },
"expert-survivalist": { name: "Expert Survivalist", description: "When attempting a Survival check, may spend a Triumph to succeed with a number of Successes equal to ranks in Survival.", type: "active" },
"foraging-master": { name: "Foraging Master", description: "When making a Survival check to forage, the character finds enough food for a number of people equal to his ranks in Survival.", type: "passive" },
"grievous-wounds": { name: "Grievous Wounds", description: "When an attack inflicts a Critical Injury, the target suffers 1 strain whenever they perform an action.", type: "passive" },
"heightened-awareness": { name: "Heightened Awareness", description: "Allies in close range add a Boost die to Perception or Vigilance checks. Engaged allies add 2 Boost dice.", type: "passive" },
"heroic-recovery": { name: "Heroic Recovery", description: "Once per encounter, may take a Heroic Recovery action to recover strain equal to ranks in Resilience.", type: "active" },
"hunter": { name: "Hunter", description: "Add a Boost die per rank of Hunter to all checks when interacting with beasts or animals (including combat). Add +10 to Critical Injury results against animals per rank of Hunter.", type: "passive" },
"hunters-quarry": { name: "Hunter's Quarry", description: "Take Hunter's Quarry action; make a Hard Survival check to upgrade the ability of all combat checks made against a target for the remainder of the character's next turn.", type: "active" },
"improved-hunters-quarry": { name: "Improved Hunter's Quarry", description: "Suffer 2 strain to perform Hunter's Quarry action as a maneuver.", type: "active" },
"keen-eyed": { name: "Keen Eyed", description: "Remove a Setback die per rank of Keen Eyed from all Perception and Vigilance checks.", type: "passive" },
"knockdown": { name: "Knockdown", description: "After hitting with a melee attack, may spend a Triumph to knock the target prone.", type: "active" },
"master-of-the-wilds": { name: "Master of the Wilds", description: "May spend a Destiny Point to have the character and his allies ignore the effects of terrain for the remainder of the encounter.", type: "active" },
"master-predator": { name: "Master Predator", description: "Add a number of Boost dice equal to ranks in Stealth to all combat checks when the character is unnoticed.", type: "active" },
"museum-worthy": { name: "Museum Worthy", description: "Once per session, take Museum Worthy action; make a Hard Knowledge (Lore) check to gain information regarding a ruin, relic, or item of interest.", type: "active" },
"natural-hunter": { name: "Natural Hunter", description: "Once per session, may re-roll any 1 Perception or Vigilance check.", type: "passive" },
"one-with-nature": { name: "One with Nature", description: "When in a natural environment, the character does not suffer penalties for darkness, inclement weather, or other natural phenomena.", type: "passive" },
"out-of-commission": { name: "Out of Commission", description: "When an attack deals damage that exceeds a vehicle's hull trauma threshold, the vehicle is knocked out of commission for the remainder of the encounter.", type: "passive" },
"pin": { name: "Pin", description: "Take Pin action; make an opposed Athletics check to immobilize an engaged target for one round. May spend a Triumph to extend the duration one round.", type: "active" },
"prey-on-the-weak": { name: "Prey on the Weak", description: "Add 1 damage per rank of Prey on the Weak to one hit of a successful attack against a disoriented or immobilized target.", type: "passive" },
"rapid-ambush": { name: "Rapid Ambush", description: "After making a successful combat check against a target that was unaware of the character's presence, may spend a Triumph to have the character's turn occur immediately after the current turn.", type: "active" },
"stalker-s-prey": { name: "Stalker's Prey", description: "After a successful combat check against a target, may spend a Triumph to add a number of Setback dice equal to ranks in Stealth to the target's next skill check.", type: "active" },
"sure-footed": { name: "Sure Footed", description: "The character does not suffer movement penalties for difficult terrain.", type: "passive" },
"terrain-navigator": { name: "Terrain Navigator", description: "Remove a Setback die per rank of Terrain Navigator from all Piloting (Planetary) checks. In addition, the character may ignore the effects of difficult terrain while driving.", type: "passive" },
"thats-not-junk": { name: "That's Not Junk", description: "Once per session, may take a That's Not Junk action to find a specific tool or gear item amongst a pile of junk or scrap.", type: "active" },
"untamed-unafraid": { name: "Untamed, Unafraid", description: "Remove a Setback die per rank of Untamed, Unafraid from all checks to interact with wild creatures.", type: "passive" },
"unusual-pal": { name: "Unusual Pal", description: "When the character creates his animal companion, he may choose a silhouette 1 creature.", type: "passive" },
"wilderness-survival": { name: "Wilderness Survival", description: "The character may remove a number of Setback dice equal to his ranks in Survival from any checks to resist the effects of exposure to the elements.", type: "passive" },
"baleful-gaze": { name: "Baleful Gaze", description: "When targeted by a combat check from an enemy within medium range, may spend a Destiny Point to make an opposed Coercion vs. Discipline check. If successful, increase the difficulty of the check by a number of ranks equal to Coercion.", type: "active" },
"blind-spot": { name: "Blind Spot", description: "The character and allies in short range may spend a Destiny Point to benefit from cover.", type: "active" },
"circle-of-shelter": { name: "Circle of Shelter", description: "When an engaged ally suffers a hit, may perform a Circle of Shelter incidental to suffer the hit instead.", type: "active", isForceTalent: true },
"clever-solution": { name: "Clever Solution", description: "Once per session, make one skill check using Cunning rather than the characteristic linked to that skill.", type: "active" },
"comprehend-technology": { name: "Comprehend Technology", description: "May make an Average Knowledge (Education) check to use ancient or unfamiliar devices or droids. May spend a Destiny Point to use a single item.", type: "active" },
"defensive-circle": { name: "Defensive Circle", description: "May take the Defensive Circle action; make a Hard Lightsaber check. If successful, the character and one ally within short range increases their defense until the beginning of the next turn, plus 1 per Success.", type: "active", isForceTalent: true },
"enhanced-leader": { name: "Enhanced Leader", description: "When making a Leadership check, may spend a Destiny Point to add a number of Success no greater than Force rating to the result.", type: "active", isForceTalent: true },
"falling-avalanche": { name: "Falling Avalanche", description: "Suffer 2 strain to add damage equal to Brawn to the next successful Melee combat check made that turn.", type: "active" },
"fearsome": { name: "Fearsome", description: "When an adversary becomes engaged with the character, the character may make a Fearsome check, with the difficulty equal to the actor's ranks in Fearsome.", type: "active" },
"forewarning": { name: "Forewarning", description: "Perform the Forewarning action; make a Hard Vigilance check. Until the end of the encounter, all allies in medium range increase their defense rating until they act in the encounter.", type: "active", isForceTalent: true },
"imbue-item": { name: "Imbue Item", description: "Take the Imbue Item maneuver; make a Hard Discipline check and commit Force dice to grant one weapon or piece of armor a specific item quality while the Force dice remain committed. Suffer 1 strain every round the Force dice remains committed.", type: "active", isForceTalent: true },
"improved-parry": { name: "Improved Parry", description: "When parrying a hit that generated a Triumph or Despair, may spend a Triumph to hit the attacker once with the character's Melee weapon, dealing base damage. Ideal for original attack resolves.", type: "active" },
"improved-reflect": { name: "Improved Reflect", description: "When reflecting a hit that generated a Triumph or Despair, may spend a Triumph to hit one target within medium range with the same weapon, dealing base damage. Ideal for original attack resolves.", type: "active", isForceTalent: true },
"mental-tools": { name: "Mental Tools", description: "Always count as having the right tools for the job when performing Mechanics checks.", type: "passive" },
"no-escape": { name: "No Escape", description: "May spend a Triumph from a successful combat check to force a foe's Discipline check. If successful, the foe cannot perform a free maneuver during his next turn.", type: "active" },
"prescient-shot": { name: "Prescient Shot", description: "Add a Boost die to all Ranged (Light) and Ranged (Heavy) combat checks. The character is immune to Force powers.", type: "passive", isForceTalent: true },
"prime-positions": { name: "Prime Positions", description: "When this character or an ally in short range takes cover, he increases his soak value by 1 per rank of Prime Positions until he leaves that cover.", type: "passive" },
"prophetic-aim": { name: "Prophetic Aim", description: "While benefiting from an Aim maneuver, the character's Ranged (Light) and Ranged (Heavy) checks cannot cause allies to suffer damage. The character cannot cause allies engaged with the target to suffer damage.", type: "passive", isForceTalent: true },
"reinforce-item": { name: "Reinforce Item", description: "Take the Reinforce Item action; make a Hard Mechanics check to grant one weapon or piece of armor the Reinforced quality while the Force dice remain committed. Suffer 1 strain every round the Force dice remains committed.", type: "active", isForceTalent: true },
"saber-throw": { name: "Saber Throw", description: "Perform Saber Throw action; make a Ranged (Light) combat check as ranged attack at medium range, adding Force dice no greater than Force rating. If successful and the target is hit, the character may have the weapon return to hand.", type: "active", isForceTalent: true },
"soresu-technique": { name: "Soresu Technique", description: "When making a Lightsaber check, the character may use his Intellect instead of Brawn.", type: "passive" },
"strategic-form": { name: "Strategic Form", description: "May take the Strategic Form action; make a Hard Lightsaber (Intellect) check. If successful, for a number of rounds greater than Force rating, if the character is at short range he may only attack one target.", type: "active", isForceTalent: true },
"supreme-armor-master": { name: "Supreme Armor Master", description: "Once per round, may suffer 3 strain to take the Armor Master action to reduce the next Critical Injury the character suffers by 10 per point of soak, to a minimum of 1.", type: "active" },
"supreme-parry": { name: "Supreme Parry", description: "If the user did not make a combat check on his previous turn, may suffer 1 strain to use his Parry out of turn.", type: "active" },
"suppressing-fire": { name: "Suppressing Fire", description: "Character and allies in short range may perform the Suppressing Fire action once per round. Make a Ranged (Heavy) combat check, and for every Success, one enemy must suffer 1 strain per rank of Suppressing Fire on the target.", type: "active" },
"uncanny-senses": { name: "Uncanny Senses", description: "Add a Boost die per rank of Uncanny Senses to all Perception checks.", type: "passive" },
"unity-assault": { name: "Unity Assault", description: "If a missed combat check was assisted, may spend a Triumph to have the check hit one additional time.", type: "active", isForceTalent: true },
"barrage": { name: "Barrage", description: "Add 1 damage per rank of Barrage to one hit of a successful attack while using ranged skills at long or extreme range.", type: "passive" },
"burly": { name: "Burly", description: "Reduce any wielded weapon's Cumbersome quality and encumbrance rating by a number equal to ranks in Burly to a minimum of 1.", type: "passive" },
"feral-strength": { name: "Feral Strength", description: "Add 1 damage per rank of Feral Strength to one hit of successful attacks made using Brawl or Melee.", type: "passive" },
"frenzied-attack": { name: "Frenzied Attack", description: "When making a Melee or Brawl check, suffer a number of strain to upgrade the difficulty of the check by an equal number of times. The strain suffered cannot exceed ranks in Frenzied Attack.", type: "active" },
"heavy-hitter": { name: "Heavy Hitter", description: "Once per session, spend a Destiny Point to add damage equal to Brawn to a successful Ranged (Heavy) or Gunnery check. This adds to the attack, or increases the weapon's damage by 1.", type: "active" },
"heroic-resilience": { name: "Heroic Resilience", description: "Immediately after being hit by an attack but before applying soak, may spend a Destiny Point to increase soak by ranks in Resilience.", type: "active" },
"improved-improvised-detonation": { name: "Improved Improvised Detonation", description: "Reduce the difficulty of Improvised Detonation to Average and increase the damage twice ranks in Mechanics.", type: "passive" },
"loom": { name: "Loom", description: "When an ally engaged with the target makes a successful Charm, Deception, or Coercion check, the character adds a Boost die to the ally's check.", type: "active" },
"rain-of-death": { name: "Rain of Death", description: "Perform the Rain of Death maneuver; suffer 1 strain to add a Boost die to all ranged attacks made this turn.", type: "active" },
"steady-nerves": { name: "Steady Nerves", description: "Remove a Setback die per rank of Steady Nerves from all Cool or Skulduggery checks.", type: "passive" },
"talk-the-talk": { name: "Talk the Talk", description: "When making a Knowledge check to learn information, may spend 1 Destiny Point to add ranks in Coercion or Streetwise for the request.", type: "active" },
"walk-the-walk": { name: "Walk the Walk", description: "The character may spend a Destiny Point to add damage equal to his ranks in Coercion to a successful Brawl check.", type: "active" },
"alchemical-arts": { name: "Alchemical Arts", description: "After making a check to craft a poison or medicine, may suffer strain up to ranks in Alchemical Arts. For every two strain, add a Success or an Advantage.", type: "active" },
"channel-agony": { name: "Channel Agony", description: "After rolling Force dice, the character may suffer a number of wounds no greater than ranks in Channel Agony to add an equal number of Dark side results to the results.", type: "active", isForceTalent: true },
"duelists-training": { name: "Duelist's Training", description: "Add a Boost die to all Lightsaber checks when engaged with only one opponent.", type: "passive" },
"feint": { name: "Feint", description: "Spend a Triumph or 2 Advantage on a missed combat attack to upgrade the difficulty of the next combat check targeting the character by ranks in Feint.", type: "active" },
"font-of-power": { name: "Font of Power", description: "Once per session, may take a Font of Power action. Until the end of the encounter, the character may add automatic Success to all Force power checks based on alignment.", type: "active", isForceTalent: true },
"identify-ingredients": { name: "Identify Ingredients", description: "After being exposed to a substance, as an out of turn incidental, may commit Force dice no greater than Force rating to make a Hard Medicine check to learn its composition and key effects.", type: "active", isForceTalent: true },
"improved-concoction": { name: "Improved Concoction", description: "Once per session, as an action, make a Hard Medicine check, adding Force dice no greater than Force rating. If successful, create 1 dose of a poison or medicine with a rarity of 5 or lower.", type: "active" },
"improved-overwhelming-aura": { name: "Improved Overwhelming Aura", description: "Characters affected by Overwhelming Aura add automatic Threat to fear checks. The character is not affected by fear checks not caused by the character.", type: "passive", isForceTalent: true },
"knowledge-is-power": { name: "Knowledge is Power", description: "Once per session, when making a check, count Force rating as equal to ranks in Knowledge (Lore).", type: "active" },
"makashi-finish": { name: "Makashi Finish", description: "Take the Makashi Finish action; make an opposed Lightsaber (Presence) combat check against one engaged target, adding Force dice no greater than Force rating to any resulting critical injury.", type: "active" },
"makashi-flourish": { name: "Makashi Flourish", description: "Once per encounter, perform the Makashi Flourish action; make an Average Lightsaber (Presence) check. A number of engaged targets equal to Success suffer 1 strain and heal an equal amount of strain.", type: "active" },
"makashi-technique": { name: "Makashi Technique", description: "When making a check using the Lightsaber skill, the character may use Presence instead of Brawn.", type: "passive" },
"natural-mystic": { name: "Natural Mystic", description: "Once per session, may reroll any 1 Lore or Survival check.", type: "passive" },
"overwhelming-aura": { name: "Overwhelming Aura", description: "Commit Force dice to add an equal number of Success to all social checks. Add a Boost die to all Coercion checks and a Setback die to all Charm checks.", type: "active", isForceTalent: true },
"power-of-darkness": { name: "Power of Darkness", description: "Once per session, may perform a Power of Darkness action to make a Hard Discipline check. If successful, the character's wound threshold and strain threshold increase by the character's Dark Side point currently in the pool until the end of the encounter.", type: "active", isForceTalent: true },
"resist-disarm": { name: "Resist Disarm", description: "Suffer 2 strain to avoid being disarmed or having a weapon damaged or destroyed.", type: "active" },
"secret-lore": { name: "Secret Lore", description: "Remove a Setback die per rank of Secret Lore from all Knowledge (Lore) checks. Reduce the difficulty of all Knowledge (Lore) checks by 1.", type: "passive" },
"sense-advantage": { name: "Sense Advantage", description: "Once per session, may add a Boost die to 1 NPC's skill check.", type: "active", isForceTalent: true },
"transmogrify": { name: "Transmogrify", description: "When making a crafting check, may add Force dice no greater than Force rating to the check. May spend a Triumph to add a Triumph to the check.", type: "active", isForceTalent: true },
"uncanny-reactions": { name: "Uncanny Reactions", description: "Add a Boost die per rank of Uncanny Reactions to all Vigilance checks.", type: "passive" },
"animal-bond": { name: "Animal Bond", description: "Develop long-term bond with single animal of silhouette no greater than half Force rating, rounded down.", type: "active", isForceTalent: true },
"animal-empathy": { name: "Animal Empathy", description: "When making checks to influence or control an animal, may add Force dice no greater than Force rating. Spend Force results to add Success or Advantage to the check.", type: "active", isForceTalent: true },
"ataru-technique": { name: "Ataru Technique", description: "When making a check using the Lightsaber skill, the character may use Agility instead of Brawn.", type: "passive" },
"deathblow": { name: "Deathblow", description: "After making a successful attack with a non-starship/ vehicle weapon, the character may spend one Destiny Point to add damage equal to his Willpower to one hit of his successful attack.", type: "active" },
"essential-kill": { name: "Essential Kill", description: "When making a non-starship/vehicle combat check, the character may add Force dice no greater than Force rating to the check. He may spend Force results (as the character's choice), to the result.", type: "active", isForceTalent: true },
"force-connection": { name: "Force Connection", description: "When the character's bonded animal makes a successful check, the character may suffer 1 strain to add a Success. The character may also apply a number of Boost dice to his next check, once instead.", type: "active", isForceTalent: true },
"harass": { name: "Harass", description: "Whenever the character's bonded animal makes a successful combat check against a target, it may inflict a damage. The character may also upgrade the difficulty of the target's checks once instead.", type: "active", isForceTalent: true },
"hawk-bat-swoop": { name: "Hawk-Bat Swoop", description: "Take the Hawk-Bat Swoop action; make an opposed Athletics (Agility) vs. combat check against one non-nemesis target at medium range, adding Force dice no greater than Force rating. If successful, spend Force results to immobilize and disarm target.", type: "active", isForceTalent: true },
"holistic-navigation": { name: "Holistic Navigation", description: "When making an Astrogation check, the character may spend one Destiny Point to add a number of Success equal to his ranks in Perception.", type: "active", isForceTalent: true },
"improved-animal-bond": { name: "Improved Animal Bond", description: "When spending a maneuver to direct his bonded animal, the character may suffer 1 strain to have the animal's next check.", type: "active", isForceTalent: true },
"intuitive-shot": { name: "Intuitive Shot", description: "When making a Ranged (Heavy) or Ranged (Light) combat check, add Force dice no greater than Force rating to the check. May spend Force results to add damage to the check.", type: "active", isForceTalent: true },
"intuitive-navigation": { name: "Intuitive Navigation", description: "When performing an Astrogation (Intellect) skill check, the character may include his Force rating. The character may add a number of Success (character's choice) to the results.", type: "active", isForceTalent: true },
"marked-for-death": { name: "Marked for Death", description: "Take the Marked for Death action; make a Hard Coercion check to combat against one target. The target remains committed, but the original target is marked for death until the session ends.", type: "active", isForceTalent: true },
"menace": { name: "Menace", description: "Enemy within short range of the character's bonded animal adds a Setback die to all Discipline checks. Combat checks made against the character add a Setback die.", type: "passive", isForceTalent: true },
"mental-bond": { name: "Mental Bond", description: "May perform the Mental Bond action; make a Hard Discipline check. While committed, may communicate with a bonded animal at long range and perceive through its senses.", type: "active", isForceTalent: true },
"saber-swarm": { name: "Saber Swarm", description: "Take the Saber Swarm action; make a Hard Lightsaber check to make the next Lightsaber check un-cancelable by spending during check.", type: "active", isForceTalent: true },
"share-pain": { name: "Share Pain", description: "May perform the Share Pain action; make a Hard Discipline check. When bonded animal suffers wounds, the character suffers that number reduced to half, then character suffers that number reduced.", type: "active", isForceTalent: true },
"shroud": { name: "Shroud", description: "The character may spend 1 Destiny Point to make himself invisible to other characters, droids, and Force powers and make a Hard Stealth check, noticed for the remainder of an encounter.", type: "active", isForceTalent: true },
"sleight-of-mind": { name: "Sleight of Mind", description: "Adds a Boost die to all Stealth checks. The character is immune to Force powers.", type: "passive", isForceTalent: true },
"studious-plotting": { name: "Studious Plotting", description: "When making a Streetwise or Survival skill check to find a location, the character may use Intellect instead of Cunning.", type: "passive" },
"survival-of-the-fittest": { name: "Survival of the Fittest", description: "Once per session, may perform a Survival of the Fittest action; make a Hard Survival check. If successful, the character may treat his Brawn as equal to his ranks in Survival.", type: "active" },
"terrifying-kill": { name: "Terrifying Kill", description: "The character may spend 1 Destiny Point after performing a successful Terrifying Kill maneuver against a target to inflict a Critical Injury. Roll a Force die, spending Force results to inflict additional Critical Injuries and to inflict fear checks on enemies within short range of the target.", type: "active", isForceTalent: true },
"better-luck-next-time": { name: "Better Luck Next Time", description: "Take a Better Luck Next Time action; make a Hard Piloting check to force a competitor to suffer a major misfortune.", type: "active" },
"constant-vigilance": { name: "Constant Vigilance", description: "May use ranks in Vigilance when making checks to determine initiative.", type: "passive" },
"counterstrike": { name: "Counterstrike", description: "When an attack misses the character, may spend a Triumph or 2 Advantage to immediately make a combat check against the attacker during the encounter.", type: "active", isForceTalent: true },
"defensive-slicing": { name: "Defensive Slicing", description: "When defending computer systems, add a Setback die per rank of Defensive Slicing to the opposing checks.", type: "passive" },
"disruptive-strike": { name: "Disruptive Strike", description: "Perform a Disruptive Strike action; make a Lightsaber combat check, adding Force dice no greater than Force rating to the check. Spend Force results to add the same number of Setback dice to the next combat check the target makes.", type: "active", isForceTalent: true },
"fear-the-shadows": { name: "Fear the Shadows", description: "Perform the Fear the Shadows action; make a Hard Deception check to force a single minion group to flee in fear for the remainder of the encounter.", type: "active" },
"freerunning": { name: "Freerunning", description: "Suffer 1 strain when making an Athletics check to move to any location within short range.", type: "active" },
"impossible-fall": { name: "Impossible Fall", description: "Once per session, perform an Impossible Fall maneuver when falling; make a Force power check. Spend Force results to decrease the fall by one range band. The character may also spend Force results to have the character land in a specific additional range band.", type: "active", isForceTalent: true },
"improved-freerunning": { name: "Improved Freerunning", description: "Suffer 4 strain when making an Athletics check, the character may have an ally move to any location within medium range.", type: "active" },
"improved-saber-throw": { name: "Improved Saber Throw", description: "When performing the Saber Throw action, may inflict a Critical Injury on one target. When attacking a target at medium range, may spend a Triumph to have the weapon return to hand.", type: "active", isForceTalent: true },
"intuitive-improvements": { name: "Intuitive Improvements", description: "When making a check to craft or repair an item, may add Force dice no greater than Force rating to the check. Spend Force results to increase the item's hard points to 1, to a max of +2.", type: "active", isForceTalent: true },
"now-you-see-me": { name: "Now You See Me", description: "Once per session, take Now You See Me action; make a Hard Deception check. If successful, add a number of Success equal to Cunning to the next Stealth check the character makes against a single target about the character.", type: "active" },
"sense-the-scene": { name: "Sense the Scene", description: "Perform the Sense the Scene action; make a Hard Perception check, adding Force dice no greater than Force rating. Spend Force results to identify the emotional characteristics of those involved in the crime.", type: "active", isForceTalent: true },
"shien-technique": { name: "Shien Technique", description: "When making a check using the Lightsaber skill, the character may use Cunning instead of Brawn.", type: "passive" },
"superhuman-reflexes": { name: "Superhuman Reflexes", description: "Once per session, after generating a Triumph on a Piloting check, the character may add a number of Success equal to ranks in Cool.", type: "active" },
"supreme-reflect": { name: "Supreme Reflect", description: "If the user did not make a combat check during his previous turn, may suffer 1 strain to use his Reflect out of turn.", type: "active", isForceTalent: true },
"call-em": { name: "Call 'Em", description: "Do not add a Setback die to combat checks due to the use of the Aim maneuver.", type: "passive" },
"disarming-smile": { name: "Disarming Smile", description: "Take the Disarming Smile action; make an opposed Charm check to lower all defenses of one target to 0 until the end of the encounter.", type: "active" },
"dont-shoot": { name: "Don't Shoot!", description: "Once per session, make a Hard Charm check. On success, the character and allies may spend a Triumph to avoid all combat checks until the end of the character's next turn, unless making a combat check.", type: "active" },
"double-or-nothing": { name: "Double or Nothing", description: "Suffer 2 strain to perform the Double or Nothing incidental; make an opposed Deception vs. Cool check to add an equal number of Threat to the next check, canceling opposing symbols, and add an equal amount of remaining Threat.", type: "active" },
"fortune-favors-the-bold": { name: "Fortune Favors the Bold", description: "Once per session as an incidental, suffer 2 strain to flip 1 Destiny Point to its light side.", type: "active" },
"guns-blazing": { name: "Guns Blazing", description: "As an incidental, suffer 2 strain to add a Boost die to all Ranged (Light) checks when attacking with two weapons.", type: "active" },
"improved-double-or-nothing": { name: "Improved Double or Nothing", description: "When performing the Double or Nothing incidental, if successful, also double the amount of remaining Threat.", type: "passive" },
"improved-quick-draw": { name: "Improved Quick Draw", description: "May perform a Quick Draw incidental twice per round.", type: "passive" },
"just-kidding": { name: "Just Kidding!", description: "Once per round as an incidental, may spend a Destiny Point to ignore a number of Threat generated on a check. The character may also apply a number of Advantage to any ally in short range.", type: "active" },
"natural-rogue": { name: "Natural Rogue", description: "Once per session, may re-roll any 1 Skulduggery or Stealth check.", type: "passive" },
"sorry-about-the-mess": { name: "Sorry About the Mess", description: "Do not upgrade the Critical Rating of a weapon by 1 to a minimum of 1 when attacking targets that have not yet acted this encounter.", type: "passive" },
"spitfire": { name: "Spitfire", description: "After a successful combat check with non-starship/vehicle Ranged (Light) weapons, may spend a Triumph to add damage to other targets with-in range of the weapon.", type: "active" },
"supreme-double-or-nothing": { name: "Supreme Double or Nothing", description: "When performing the Double or Nothing incidental, may add a number of Force dice to the check.", type: "active", isForceTalent: true },
"up-the-ante": { name: "Up the Ante", description: "When gambling, win 10% more credits per rank of Up the Ante.", type: "passive" },
"ambush": { name: "Ambush", description: "Once per round while benefiting from cover, the character may perform the Ambush maneuver and make a Hard Stealth check to one hit of a successful combat check against a target with-in range before the end of the turn.", type: "active" },
"cunning-snare": { name: "Cunning Snare", description: "Once per encounter as an action, may create a trap on one other character within engaged range. The character may make an opposed Vigilance vs. Survival check to harm and ensnare.", type: "active" },
"dynamic-fire": { name: "Dynamic Fire", description: "When making a ranged attack while engaged with an opponent, may suffer 1 strain to reduce the ranged modifier by 1.", type: "active" },
"moving-target": { name: "Moving Target", description: "If the character has already acted this round, increase the ranged defense by 1 per rank of Moving Target.", type: "passive" },
"seize-the-initiative": { name: "Seize the Initiative", description: "Once per session, as an action, may make a Hard Athletics check. If successful, the character and PCs may take their turns immediately.", type: "active" },
"supreme-body-guard": { name: "Supreme Body Guard", description: "Body Guard maneuver may now affect a number of engaged characters up to ranks in Resilience.", type: "passive" },
"unstoppable": { name: "Unstoppable", description: "If a Critical Injury roll is 141 or higher, the character may spend a Destiny Point to not receive the critical injury.", type: "active" },
"a-step-ahead": { name: "A Step Ahead", description: "Once per session, the character may take an A Step Ahead action in order to use his Cunning and Intellect for the remainder of the encounter.", type: "active" },
"analyze-data": { name: "Analyze Data", description: "Once per session after capturing a datapad, the character may perform the Analyze Data action; make an Average Knowledge check. Once during the remainder of the session, add a Boost die equal to ranks in Knowledge to one check related to that data.", type: "active" },
"creative-killer": { name: "Creative Killer", description: "Reduce the critical rating of improvised weapons by 2 (to a minimum of 1).", type: "passive" },
"cunning-presence": { name: "Cunning Presence", description: "The character may suffer 2 strain to use his Cunning instead of Presence.", type: "active" },
"exhaustive-questioning": { name: "Exhaustive Questioning", description: "Whenever a character makes an opposed social check against a captured or restrained target, the enemy's strain threshold is reduced by 1 for the remainder of the session. The character may spend a Triumph to inflict 1 strain.", type: "active" },
"improved-defensive-slicing": { name: "Improved Defensive Slicing", description: "Defensive Slicing now upgrades the difficulty once per rank of Defensive Slicing and places the usual benefits.", type: "passive" },
"improved-hidden-storage": { name: "Improved Hidden Storage", description: "The character may use Hidden Storage to store an additional, easily subtly modified body.", type: "passive" },
"improved-indistinguishable": { name: "Improved Indistinguishable", description: "The character may spend a Destiny Point to have the effects of Indistinguishable last within short range equal to ranks in Deception.", type: "active" },
"improved-resist-questioning": { name: "Improved Resist Questioning", description: "When one ally within short range fails an opposed social skill check, the character may spend a Destiny Point to affect the check. If the check fails, the character may spend a Triumph to have the enemy believe false information to foe.", type: "active" },
"incite-distraction": { name: "Incite Distraction", description: "While in a crowd, may perform the Incite Distraction action; make an opposed Deception check. If successful, the area treats the area as difficult terrain and the character may spend a Triumph to make the character and allies immune to them instead.", type: "active" },
"inside-knowledge": { name: "Inside Knowledge", description: "Once per session while in a specific location, may perform the Inside Knowledge action; make a Hard Skulduggery check to then find a single personal item with a rarity no greater than Cunning plus 2 ranks in Skulduggery or gain a narrative benefit.", type: "active" },
"inside-person": { name: "Inside Person", description: "Once per session, the character may spend a Destiny Point to reveal that he has been undercover in an organization, building, or large vehicle for the past month. The character may add automatic Success to all social checks that are associated with that location.", type: "active" },
"know-their-weakness": { name: "Know Their Weakness", description: "Once per session, may perform the Know Their Weakness action and make a Hard Perception check to downgrade the difficulty of all combat checks against the target once per rank of Nobody's Fool until the end of the session.", type: "active" },
"lose-them": { name: "Lose Them", description: "When being followed or chased, the character may perform the Lose Them action; make a Hard Stealth check. If successful, add a number of Setback dice to all checks to follow him for the rest of the encounter and may spend a Triumph to have lost him completely.", type: "active" },
"made-you-talk": { name: "Made You Talk", description: "Once per session, may make an opposed social check against a captured enemy character to learn one vital secret. For every 2 strain inflicted on the target, the character may add a Boost die on the enemy NPC type.", type: "active" },
"master-slicer": { name: "Master Slicer", description: "Once per round, may take a Master Slicer incidental to suffer 2 strain to decrease the difficulty of Computers or other checks within this system to a minimum of Easy.", type: "active" },
"pilot-training": { name: "Pilot Training", description: "Piloting (Planetary) and Piloting (Space) become career skills.", type: "passive" },
"resist-questioning": { name: "Resist Questioning", description: "When targeted by an opposed social skill check, the character may suffer 2 strain to upgrade the difficulty of the check. If the check fails, the character may spend a Triumph to have the enemy believe he has provided false information to foe.", type: "active" },
"skilled-slicer": { name: "Skilled Slicer", description: "When making a Computers check, may spend a Triumph to have the check's effects last within this system as maneuvers.", type: "active" },
"custom-loadout": { name: "Custom Loadout", description: "May add 2 additional hard points to Signature Vehicle.", type: "passive" },
"cyberneticist": { name: "Cyberneticist", description: "Remove a Setback die per rank of Cyberneticist from checks to build, repair, and install cybernetics. Cybernetics cost 50% less.", type: "passive" },
"deft-maker": { name: "Deft Maker", description: "Remove a Setback die per rank of Deft Maker from all checks to repair, modify, construct, or craft droids. Reduce the material cost to craft droids by 50%.", type: "passive" },
"energy-transfer": { name: "Energy Transfer", description: "May take an Energy Transfer maneuver to move 1 energy from one device or replenish expendable ammunition for an energy weapon.", type: "active" },
"improved-overcharge": { name: "Improved Overcharge", description: "May spend a Triumph or 2 Advantage from an Overcharge check to have the cybernetic immediately take another action.", type: "active" },
"improved-speaks-binary": { name: "Improved Speaks Binary", description: "When directing NPC droids, those droids grant additional Boost dice in addition to other benefits.", type: "passive" },
"more-machine-than-man": { name: "More Machine Than Man", description: "Increase cybernetic implant capacity by 1 per rank of More Machine Than Man.", type: "passive" },
"overcharge": { name: "Overcharge", description: "Once per encounter, may take an Overcharge action; make a Hard Mechanics check. If successful, one cybernetic implant gains a specific benefit. On a Despair, the overcharged cybernetic shorts out.", type: "active" },
"resourceful-refit": { name: "Resourceful Refit", description: "May take the Resourceful Refit action; make an Average Mechanics check on one piece of gear to add a new one, reducing its quality by 1, or repair one damaged attachment.", type: "active" },
"supreme-overcharge": { name: "Supreme Overcharge", description: "May perform an Overcharge action on any number of cybernetics. On a Triumph, the overcharged cybernetic doesn't short out.", type: "active" },
"supreme-speaks-binary": { name: "Supreme Speaks Binary", description: "Once per encounter, may perform a Supreme Speaks Binary action; make a Hard Leadership check. If successful, all friendly NPC droids in the encounter may perform 1 free maneuver on the character's ranks for the skill of the character's choice.", type: "active" },
"utinnii": { name: "Utinnii!", description: "Remove a Setback die per rank of Utinnii! from all checks to find or scavenge items or parts. Such checks take half the time.", type: "passive" },
"acklays-settling-strike": { name: "Acklay's Settling Strike", description: "Brawl attacks gain the Pierce equal to Force Rating.", type: "passive", isForceTalent: true },
"against-all-odds": { name: "Against All Odds", description: "When incapacitated, perform an Against All Odds action; make a Hard Resilience check. If successful, the character may heal wounds equal to Force rating. Heal 1 additional wound per Advantage.", type: "active" },
"embrace-your-hate": { name: "Embrace Your Hate", description: "May spend a Destiny Point and suffer conflict equal to Dark Side Destiny Points to add an equal number of damage to the check. May use this ability once per encounter per rank.", type: "active", isForceTalent: true },
"far-strike": { name: "Far Strike", description: "As an action, make a Brawl check with a difficulty of Hard, adding Force dice up to Force rating to the check. If successful, the attack may be made at one range band for every Success, to a maximum of long.", type: "active", isForceTalent: true },
"headbutt": { name: "Headbutt", description: "Perform Headbutt incidental; make a Hard Discipline check to knock down and disorient one engaged enemy.", type: "active" },
"improved-dodge": { name: "Improved Dodge", description: "After using Dodge, can suffer 2 strain to perform Dodge as an out-of-turn incidental.", type: "active" },
"indomitable-will": { name: "Indomitable Will", description: "Once per encounter as a maneuver, suffer 3 strain to ignore the effects of all Critical Injuries and reduce all damage suffered by 1. The character may also suffer 1 strain each turn.", type: "active", isForceTalent: true },
"inner-peace": { name: "Inner Peace", description: "Once per encounter, convert a number of Dark Side Destiny Points equal to ranks in Inner Peace to Light Side Destiny Points and reduce Conflict gained this session.", type: "active", isForceTalent: true },
"intuitive-strike": { name: "Intuitive Strike", description: "When making a combat check with a non-starship/vehicle weapon, add Force dice no greater than Force rating to the check. Spend Force results to add damage.", type: "active", isForceTalent: true },
"juyo-savagery": { name: "Juyo Savagery", description: "Add +10 per rank of Juyo Savagery to Critical Injury rolls from attacks made with any lightsaber.", type: "passive" },
"multiple-opponents": { name: "Multiple Opponents", description: "Add a Boost die to all Melee, Brawl, and Lightsaber checks when engaged with multiple opponents.", type: "passive" },
"natural-blademaster": { name: "Natural Blademaster", description: "Once per session, may re-roll any 1 Lightsaber or Melee check.", type: "passive" },
"power-from-pain": { name: "Power From Pain", description: "Once per session as an incidental, may spend 1 Destiny Point to add damage equal to the character's current Critical Injury rating to the next combat check.", type: "active", isForceTalent: true },
"sapith-sundering": { name: "Sapith Sundering", description: "May spend a Triumph or Advantage on a successful Brawl check to damage the target's weapon. The character may also apply a number of damage to the check as a Triumph to activate the Sunder quality.", type: "active" },
"sarlacc-sweep": { name: "Sarlacc Sweep", description: "Increase the difficulty of Lightsaber checks by 1 to perform a Sarlacc Sweep action. If successful, the character may hit two additional enemy targets.", type: "active" },
"terrify": { name: "Terrify", description: "Take the Terrify action; make a Hard Coercion check, adding Force dice no greater than Force rating. If successful, one target within short range is immobilized and may spend a Triumph to extend the duration and immobilize an affected target.", type: "active", isForceTalent: true },
"vaapad-control": { name: "Vaapad Control", description: "When making a Lightsaber combat check, the character may spend a Triumph to add a number of damage equal to the character's Dark Side Destiny Points in the Destiny pool.", type: "active", isForceTalent: true },
};

const masterObligationList = {
    "addiction": { name: "Addiction", description: "The character has a strong addiction he must keep feeding. Whether it's a physical addiction to stims, dust, or alcohol, or a mental addiction such as gambling, law-breaking, or priceless antiques, the character devotes a lot of time, energy, and resources to pursuing or obtaining the object of his addiction. Avoiding this Obligation has an almost immediate result—withdrawal. The exact nature depends on the addiction, but the character finds it increasingly difficult to concentrate on even mundane tasks, often reflected in the GM adding anywhere from one setback to three setback to skill checks." },
    "betrayal": { name: "Betrayal", description: "This Obligation can work in one of two ways: either the character is the target of a deep and personal betrayal, or the character is the one who betrayed others. Whether it's as simple as a betrayed confidence or broken promise or as serious as treason or mutiny, the betrayal eats away at the character and affects his everyday life. The target of the betrayal may seek answers, compensation, or simply revenge." },
    "blackmail": { name: "Blackmail", description: "Someone has discovered one of the PC's dirty secrets and is using that knowledge for some sort of gain. To make matters worse, the blackmailer possesses evidence that could possibly leak out—a holovid, bank records, a weapon used during a crime, and so on. In order to keep the secret safe, the character must do what he is told, although the blackmailer is savvy enough to keep the demand simple enough to maintain the blackmail for as long as possible, generally demanding money or favors." },
    "bounty": { name: "Bounty", description: "For some reason, the character has a price on his head. This may be in the form of a legal warrant or a contract by criminals, collection agencies, or even someone who felt his honor violated in some way. What he did to earn this mark is up to his background, and the severity of his actions can be based on the size of his Obligation." },
    "criminal": { name: "Criminal", description: "The character has a criminal record, or was accused of a crime (perhaps one he didn't even commit), and is somehow embroiled in the legal system. Obligation may be settled by paying ongoing legal costs, making attempts to bury evidence, or efforts to prove his innocence." },
    "debt": { name: "Debt", description: "The character owes someone a great deal, whether that debt consists of money or something else. Perhaps the PC has a huge gambling debt to a Hutt, is indebted to the Czerka Corporation for his starship, owes a wealthy family for patronage, or has some other serious financial obligation. To make matters worse, depending on who owns the debt, even fully paying it off might not get the character completely off the hook—if the character can get that money, he can surely get more." },
    "dutybound": { name: "Dutybound", description: "The PC has a deep sense of duty that he feels compelled to fulfill, such as military service, making good on a contract, or following some sort of thieves' code. Unlike the Oath Obligation (see below), a Dutybound character has some legal or ritualistic bind to an organization or cause making it extremely difficult or detrimental if he fails to live up to that commitment." },
    "family": { name: "Family", description: "The character has deep ties with his family that require a great deal of time and attention. This could include providing care for or assistance to siblings or parents, the management of an inheritance, trust, or family business, or simply mediating between squabbling family members." },
    "favor": { name: "Favor", description: "The PC owes a big favor. Perhaps officials looked the other way when he smuggled in goods, or a friend got him out of prison. Regardless, the favors are stacking up, and soon he's going to be asked to pay them back or return the favor. This favor may be called in a little at a time, prolonging the Obligation." },
    "oath": { name: "Oath", description: "The character has sworn some sort of oath that dictates his thoughts and actions, shaping his moral view of the world. This could be an oath to a deity, a way of living (such as the Jedi Code), or a willingness to sacrifice for the betterment of some group or cause. Whatever the case, the Oath should be both serious and make life difficult in some ways for the character. It is a personal and deep undertaking, possibly without a truly obtainable end goal in sight. characters who do not live up to this oath face an internal and moral struggle." },
    "obsession": { name: "Obsession", description: "The PC has some unhealthy obsession that tends to interfere in his life, whether with a celebrity, a region, a political movement, a cultural icon, or some other facet of society or life. He must pursue this, possibly to the detriment of his health, finances, or well-being. A character with this Obligation tends to get along well with others that share his interest, but is looked at with pity, amusement, or even a bit of fear from others who don't understand." },
    "responsibility": { name: "Responsibility", description: "A character with the Responsibility Obligation feels a strong sense of accountability or relationship to a person, place, or thing (a responsibility to kin falls under the Family Obligation described above). This could include a strong connection to a mentor, a strong desire to care for orphans in a given location, or taking on the needs of an under-represented minority." },
};

const masterCriticalInjuries = [
    { range: [1, 5], severity: 'Easy', result: "Minor Nick: The target suffers 1 strain." },
    { range: [6, 10], severity: 'Easy', result: "Slowed Down: The target can only act during the last allied Initiative slot on his next turn." },
    { range: [11, 15], severity: 'Easy', result: "Sudden Jolt: The target drops whatever is in hand." },
    { range: [16, 20], severity: 'Easy', result: "Distracted: The target cannot perform a free maneuver during his next turn." },
    { range: [21, 25], severity: 'Easy', result: "Off-Balance: Add a Setback die to his next skill check." },
    { range: [26, 30], severity: 'Easy', result: "Discouraging Wound: Flip one light side Destiny point to a dark side Destiny Point (reverse if NPC)." },
    { range: [31, 35], severity: 'Easy', result: "Stunned: The target is staggered until the end of his next turn." },
    { range: [36, 40], severity: 'Easy', result: "Stinger: Increase difficulty of next check by one." },
    { range: [41, 45], severity: 'Average', result: "Bowled Over: The target is knocked prone and suffers 1 strain." },
    { range: [46, 50], severity: 'Average', result: "Head Ringer: The target increases the difficulty of all Intellect and Cunning checks by one until the end of the encounter." },
    { range: [51, 55], severity: 'Average', result: "Fearsome Wound: The target increases the difficulty of all Presence and Willpower checks by one until the end of the encounter." },
    { range: [56, 60], severity: 'Average', result: "Agonizing Wound: The target increases the difficulty of all Brawn and Agility checks by one until the end of the encounter." },
    { range: [61, 65], severity: 'Average', result: "Slightly Dazed: The target is disoriented until the end of the encounter." },
    { range: [66, 70], severity: 'Average', result: "Scattered Senses: The target removes all Boost dice from skill checks until the end of the encounter." },
    { range: [71, 75], severity: 'Average', result: "Hamstrung: The target loses his free maneuver until the end of the encounter." },
    { range: [76, 80], severity: 'Average', result: "Overpowered: The target leaves himself open, and the attacker may immediately attempt another free attack against him, using the exact same pool as the original attack." },
    { range: [81, 85], severity: 'Average', result: "Winded: Until the end of the encounter, the target cannot voluntarily suffer strain to activate any abilities or gain additional maneuvers." },
    { range: [86, 90], severity: 'Average', result: "Compromised: Increase difficulty of all skill checks by one until the end of the encounter." },
    { range: [91, 95], severity: 'Hard', result: "At the Brink: The target suffers 1 strain each time he performs an action." },
    { range: [96, 100], severity: 'Hard', result: "Crippled: One of the target's limbs (selected by the GM) is crippled until healed or replaced. Increase difficulty of all checks that require use of that limb by one." },
    { range: [101, 105], severity: 'Hard', result: "Maimed: One of the target's limbs (selected by the GM) is permanently lost. Unless the target has a cybernetic replacement, the target cannot perform actions that would require the use of that limb. All other actions gain a Setback die." },
    { range: [106, 110], severity: 'Hard', result: "Horrific Injury: Roll 1d10 to determine one of the target's characteristics—1-3 for Brawn, 4-6 for Agility, 7 for Intellect, 8 for Cunning, 9 for Presence, 10 for Willpower. Until this Critical Injury is healed, treat that characteristic as one point lower." },
    { range: [111, 115], severity: 'Hard', result: "Temporarily Lame: Until this Critical Injury is healed, the target cannot perform more than one maneuver during his turn." },
    { range: [116, 120], severity: 'Hard', result: "Blinded: The target can no longer see. Upgrade the difficulty of all checks twice. Upgrade the difficulty of Perception and Vigilance checks three times." },
    { range: [121, 125], severity: 'Hard', result: "Knocked Senseless: The target is staggered for the remainder of the encounter." },
    { range: [126, 130], severity: 'Daunting', result: "Gruesome Injury: Roll 1d10 to determine one of the target's characteristics—1-3 for Brawn, 4-6 for Agility, 7 for Intellect, 8 for Cunning, 9 for Presence, 10 for Willpower. That characteristic is permanently reduced by one, to a minimum of one." },
    { range: [131, 140], severity: 'Daunting', result: "Bleeding Out: Every round, the target suffers 1 wound and 1 strain at the beginning of his turn. For every five wounds he suffers beyond his wound threshold, he suffers one additional Critical Injury. Roll on this chart, suffering the injury (if he suffers this result a second time, add +10 to this roll again)." },
    { range: [141, 150], severity: 'Daunting', result: "The End is Nigh: The target will die after the last Initiative slot during the next round." },
    { range: [151, 999], severity: 'Daunting', result: "Dead: Complete, obliterated death." }
];

const specializationTalentTrees = {
    //Bounty Hunter
    "gadgeteer": {
        name: "Gadgeteer",
        layout: [
            // Row 1
            { id: "brace", cost: 5, connects: {} },
            { id: "toughened", cost: 5, connects: { down: true } },
            { id: "intimidating", cost: 5, connects: {} },
            { id: "defensive-stance", cost: 5, connects: { down: true } },
            // Row 2
            { id: "spare-clip", cost: 10, connects: { right: true } },
            { id: "jury-rigged", cost: 10, connects: { up: true, down: true, right: true, left: true } },
            { id: "point-blank", cost: 10, connects: { left: true } },
            { id: "disorient", cost: 10, connects: { up: true, down: true } },
            // Row 3
            { id: "toughened", cost: 15, connects: { right: true } },
            { id: "armor-master", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "natural-enforcer", cost: 15, connects: { left: true } },
            { id: "stunning-blow", cost: 15, connects: { up: true, down: true } },
            // Row 4
            { id: "jury-rigged", cost: 20, connects: { right: true } },
            { id: "tinkerer", cost: 20, connects: { up: true, down: true, right: true, left: true } },
            { id: "deadly-accuracy", cost: 20, connects: { left: true } },
            { id: "improved-stunning-blow", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "intimidating", cost: 25, connects: { right: true } },
            { id: "dedication", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "improved-armor-master", cost: 25, connects: { left: true } },
            { id: "crippling-blow", cost: 25, connects: { up: true } },
        ]
    },
    "assassin": {
        name: "Assassin",
        layout: [
            // Row 1
            { id: "grit", cost: 5, connects: { down: true } },
            { id: "lethal-blows", cost: 5, connects: { down: true } },
            { id: "stalker", cost: 5, connects: { down: true } },
            { id: "dodge", cost: 5, connects: { down: true } },
            // Row 2
            { id: "precise-aim", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "jump-up", cost: 10, connects: { up: true, down: true, left: true, right: true } },
            { id: "quick-strike", cost: 10, connects: { up: true, down: true, right: true, left: true } },
            { id: "quick-draw", cost: 10, connects: { left: true, up: true, down: true } },
            // Row 3
            { id: "targeted-blow", cost: 15, connects: { up: true, down: true } },
            { id: "stalker", cost: 15, connects: { right: true, up: true, down: true } },
            { id: "lethal-blows", cost: 15, connects: { up: true, down: true, left: true } },
            { id: "anatomy-lessons", cost: 15, connects: { up: true, down: true } },
            // Row 4
            { id: "stalker", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "sniper-shot", cost: 20, connects: { up: true, down: true, left: true } },
            { id: "dodge", cost: 20, connects: { up: true, down: true } },
            { id: "lethal-blows", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "precise-aim", cost: 25, connects: { up: true } },
            { id: "deadly-accuracy", cost: 25, connects: { up: true } },
            { id: "dedication", cost: 25, connects: { up: true } },
            { id: "master-of-shadows", cost: 25, connects: { up: true } }
        ]
    },
    "martial-artist": {
        name: "Martial Artist",
        layout: [
            // Row 1
            { id: "iron-body", cost: 5, connects: { down: true } },
            { id: "parry", cost: 5, connects: {} },
            { id: "grit", cost: 5, connects: {} },
            { id: "precision-strike", cost: 5, connects: { down: true } },
            // Row 2
            { id: "parry", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "toughened", cost: 10, connects: { left: true, down: true, right: true } },
            { id: "martial-grace", cost: 10, connects: { left: true, down: true, right: true } },
            { id: "grit", cost: 10, connects: { up: true, left: true } },
            // Row 3
            { id: "unarmed-parry", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "grapple", cost: 15, connects: { up: true, down: true, right: true, left: true } },
            { id: "iron-body", cost: 15, connects: { left: true, up: true, down: true, right: true } },
            { id: "improved-precision-strike", cost: 15, connects: { left: true, down: true } },
            // Row 4
            { id: "overbalance", cost: 20, connects: { up: true } },
            { id: "toughened", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "mind-over-matter", cost: 20, connects: { left: true, up: true } },
            { id: "grit", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "coordination-dodge", cost: 25, connects: { right: true } },
            { id: "dedication", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "natural-brawler", cost: 25, connects: { left: true } },
            { id: "supreme-precision-strike", cost: 25, connects: { up: true } },
        ]
    },
    "operator": {
        name: "Operator",
        layout: [
            // Row 1
            { id: "grit", cost: 5, connects: { down: true } },
            { id: "galaxy-mapper", cost: 5, connects: {} },
            { id: "shortcut", cost: 5, connects: { down: true } },
            { id: "overwhelm-defenses", cost: 5, connects: { down: true } },
            // Row 2
            { id: "full-throttle", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "planet-mapper", cost: 10, connects: { left: true, down: true } },
            { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "debilitating-shot", cost: 10, connects: { left: true, up: true, down: true } },
            // Row 3
            { id: "skilled-jockey", cost: 15, connects: { up: true, down: true } },
            { id: "all-terrain-driver", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "offensive-driving", cost: 15, connects: { left: true, up: true, down: true, right: true } },
            { id: "grit", cost: 15, connects: { up: true, down: true, left: true } },
            // Row 4
            { id: "lets-ride", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "shortcut", cost: 20, connects: { left: true, right: true, up: true, down: true } },
            { id: "grit", cost: 20, connects: { up: true, down: true, right: true, left: true } },
            { id: "overwhelm-defenses", cost: 20, connects: { left: true, up: true, down: true } },
            // Row 5
            { id: "dedication", cost: 25, connects: { up: true, right: true } },
            { id: "improved-shortcut", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "skilled-jockey", cost: 25, connects: { up: true, left: true } },
            { id: "hindering-shot", cost: 25, connects: { up: true } },
        ]
    },
    "skip-tracer": {
        name: "Skip Tracer",
        layout: [
            // Row 1
            { id: "bypass-security", cost: 5, connects: { down: true } },
            { id: "hard-boiled", cost: 5, connects: { down: true } },
            { id: "good-cop", cost: 5, connects: { down: true } },
            { id: "rapid-recovery", cost: 5, connects: { down: true } },
            // Row 2
            { id: "toughened", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "expert-tracker", cost: 10, connects: { left: true, down: true, right: true, up: true } },
            { id: "street-smarts", cost: 10, connects: { left: true, down: true, right: true, up: true } },
            { id: "bought-info", cost: 10, connects: { left: true, up: true, down: true } },
            // Row 3
            { id: "hard-boiled", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "rapid-recovery", cost: 15, connects: { up: true, down: true, left: true } },
            { id: "improved-street-smarts", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "street-smarts", cost: 15, connects: { left: true, up: true, down: true } },
            // Row 4
            { id: "bypass-security", cost: 20, connects: { up: true } },
            { id: "nobodys-fool", cost: 20, connects: { right: true, up: true, down: true } },
            { id: "good-cop", cost: 20, connects: { up: true, down: true, right: true, left: true } },
            { id: "informant", cost: 20, connects: { left: true, up: true } },
            // Row 5
            { id: "reconstruct-the-scene", cost: 25, connects: { right: true } },
            { id: "hard-boiled", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "dedication", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "soft-spot", cost: 25, connects: { left: true } },
        ]
    },
    "survivalist": {
        name: "Survivalist",
        layout: [
            // Row 1
            { id: "forager", cost: 5, connects: { down: true } },
            { id: "stalker", cost: 5, connects: { down: true } },
            { id: "outdoorsman", cost: 5, connects: { down: true } },
            { id: "expert-tracker", cost: 5, connects: {} },
            // Row 2
            { id: "outdoorsman", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "swift", cost: 10, connects: { up: true, down: true, right: true, left: true } },
            { id: "hunter", cost: 10, connects: { left: true, up: true, down: true, right: true } },
            { id: "soft-spot", cost: 10, connects: { left: true, down: true } },
            // Row 3
            { id: "toughened", cost: 15, connects: { up: true, down: true } },
            { id: "expert-tracker", cost: 15, connects: { up: true, down: true } },
            { id: "stalker", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "natural-outdoorsman", cost: 15, connects: { up: true, down: true, left: true } },
            // Row 4
            { id: "toughened", cost: 20, connects: { up: true, down: true } },
            { id: "hunter", cost: 20, connects: { up: true } },
            { id: "expert-tracker", cost: 20, connects: { up: true, down: true } },
            { id: "blooded", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "enduring", cost: 25, connects: { up: true, right: true } },
            { id: "dedication", cost: 25, connects: { left: true, right: true } },
            { id: "grit", cost: 25, connects: { up: true, left: true } },
            { id: "heroic-fortitude", cost: 25, connects: { up: true } },
        ]
    },
    //Ace
    "beast-rider": {
        name: "Beast Rider",
        layout: [
            // Row 1
            { id: "forager", cost: 5, connects: { down: true } },
            { id: "toughened", cost: 5, connects: { down: true } },
            { id: "outdoorsman", cost: 5, connects: { down: true } },
            { id: "beast-wrangler", cost: 5, connects: { down: true } },
            // Row 2
            { id: "outdoorsman", cost: 10, connects: { up: true, down: true } },
            { id: "expert-tracker", cost: 10, connects: { up: true, right: true, left: true } },
            { id: "toughened", cost: 10, connects: { up: true, left: true } },
            { id: "expert-handler", cost: 10, connects: { up: true } },
            // Row 3
            { id: "expert-tracker", cost: 15, connects: { right: true, up: true } },
            { id: "beast-wrangler", cost: 15, connects: { up: true, down: true, right: true, left: true } },
            { id: "lets-ride", cost: 15, connects: { down: true, right: true, left: true } },
            { id: "grit", cost: 15, connects: { up: true, down: true, left: true } },
            // Row 4
            { id: "improved-spur", cost: 20, connects: { down: true } },
            { id: "spur", cost: 20, connects: { up: true, right: true, left: true } },
            { id: "natural-outdoorsman", cost: 20, connects: { up: true, down: true, left: true } },
            { id: "expert-handler", cost: 20, connects: { up: true } },
            // Row 5
            { id: "supreme-spur", cost: 25, connects: { up: true } },
            { id: "dedication", cost: 25, connects: { right: true } },
            { id: "grit", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "soothing-tone", cost: 25, connects: { left: true } },
        ]
    },
    "gunner": {
        name: "Gunner",
        layout: [
            // Row 1
            { id: "durable", cost: 5, connects: { down: true } },
            { id: "grit", cost: 5, connects: {} },
            { id: "overwhelm-defenses", cost: 5, connects: { down: true } },
            { id: "debilitating-shot", cost: 5, connects: { down: true } },
            // Row 2
            { id: "toughened", cost: 10, connects: { up: true, right: true } },
            { id: "brace", cost: 10, connects: { down: true, left: true, right: true } },
            { id: "spare-clip", cost: 10, connects: { left: true, down: true, up: true } },
            { id: "true-aim", cost: 10, connects: { up: true, down: true } },
            // Row 3
            { id: "durable", cost: 15, connects: { right: true, down: true } },
            { id: "enduring", cost: 15, connects: { up: true, left: true } },
            { id: "jury-rigged", cost: 15, connects: { up: true, down: true } },
            { id: "overwhelm-defenses", cost: 15, connects: { up: true, down: true } },
            // Row 4
            { id: "toughened", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "enduring", cost: 20, connects: { left: true, down: true, right: true } },
            { id: "brace", cost: 20, connects: { left: true, up: true } },
            { id: "exhaust-port", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "heroic-fortitude", cost: 25, connects: { up: true, right: true } },
            { id: "jury-rigged", cost: 25, connects: { left: true, up: true, right: true } },
            { id: "dedication", cost: 25, connects: { left: true, right: true } },
            { id: "true-aim", cost: 25, connects: { left: true, up: true } }
        ]
    },
    "rigger": {
        name: "Rigger",
        layout: [
            // Row 1
            { id: "black-market-contacts", cost: 5, connects: { down: true } },
            { id: "toughened", cost: 5, connects: {} },
            { id: "gearhead", cost: 5, connects: { down: true } },
            { id: "larger-project", cost: 5, connects: { down: true } },
            // Row 2
            { id: "grit", cost: 10, connects: { up: true, down: true } },
            { id: "fancy-paint-job", cost: 10, connects: { right: true } },
            { id: "signature-vehicle", cost: 10, connects: { up: true, down: true, left: true } },
            { id: "larger-project", cost: 10, connects: { up: true } },
            // Row 3
            { id: "black-market-contacts", cost: 15, connects: { up: true, down: true } },
            { id: "overstocked-ammo", cost: 15, connects: { right: true } },
            { id: "tuned-maneuvering-thrusters", cost: 15, connects: { left: true, down: true, right: true, up: true } },
            { id: "bolstered-armor", cost: 15, connects: { left: true, down: true } },
            // Row 4
            { id: "toughened", cost: 20, connects: { up: true, down: true } },
            { id: "customized-cooling-unit", cost: 20, connects: { down: true, right: true } },
            { id: "gearhead", cost: 20, connects: { left: true, down: true, up: true } },
            { id: "fortified-vacuum-seal", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "dedication", cost: 25, connects: { up: true } },
            { id: "tuned-maneuvering-thrusters", cost: 25, connects: { up: true } },
            { id: "not-today", cost: 25, connects: { up: true } },
            { id: "reinforced-frame", cost: 25, connects: { up: true } }
        ]
    },
    "hotshot": {
        name: "Hotshot",
        layout: [
            // Row 1
            { id: "shortcut", cost: 5, connects: {} },
            { id: "high-g-training", cost: 5, connects: { down: true } },
            { id: "skilled-jockey", cost: 5, connects: { down: true } },
            { id: "grit", cost: 5, connects: { down: true } },
            // Row 2
            { id: "second-chances", cost: 10, connects: { down: true } },
            { id: "grit", cost: 10, connects: { up: true, down: true, left: true } },
            { id: "shortcut", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "high-g-training", cost: 10, connects: { left: true, up: true } },
            // Row 3
            { id: "dead-to-rights", cost: 15, connects: { right: true, down: true } },
            { id: "high-g-training", cost: 15, connects: { up: true, left: true, right: true } },
            { id: "grit", cost: 15, connects: { up: true, down: true, right: true, left: true } },
            { id: "intense-presence", cost: 15, connects: { left: true, down: true } },
            // Row 4
            { id: "second-chances", cost: 20, connects: { up: true, down: true } },
            { id: "corellian-sendoff", cost: 20, connects: { down: true, right: true } },
            { id: "koidogran-turn", cost: 20, connects: { left: true, down: true, up: true } },
            { id: "grit", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "improved-dead-to-rights", cost: 25, connects: { up: true } },
            { id: "improved-corellian-sendoff", cost: 25, connects: { up: true } },
            { id: "dedication", cost: 25, connects: { up: true, right: true } },
            { id: "showboat", cost: 25, connects: { left: true, up: true } }
        ]
    },
    "driver": {
        name: "Driver",
        layout: [
            // Row 1
            { id: "full-throttle", cost: 5, connects: { down: true } },
            { id: "all-terrain-driver", cost: 5, connects: {} },
            { id: "fine-tuning", cost: 5, connects: {} },
            { id: "gearhead", cost: 5, connects: { down: true } },
            // Row 2
            { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "skilled-jockey", cost: 10, connects: { right: true, left: true, down: true } },
            { id: "rapid-reaction", cost: 10, connects: { left: true, right: true } },
            { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
            // Row 3
            { id: "improved-full-throttle", cost: 15, connects: { up: true, down: true } },
            { id: "tricky-target", cost: 15, connects: { up: true } },
            { id: "fine-tuning", cost: 15, connects: { right: true } },
            { id: "toughened", cost: 15, connects: { left: true, up: true, down: true } },
            // Row 4
            { id: "defensive-driving", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "skilled-jockey", cost: 20, connects: { left: true, right: true } },
            { id: "natural-driver", cost: 20, connects: { left: true } },
            { id: "gearhead", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "supreme-full-throttle", cost: 25, connects: { up: true, right: true } },
            { id: "full-stop", cost: 25, connects: { left: true, right: true } },
            { id: "master-driver", cost: 25, connects: { left: true, right: true } },
            { id: "dedication", cost: 25, connects: { left: true, up: true } }
        ]
    },
    "pilot": {
        name: "Pilot",
        layout: [
            // Row 1
            { id: "full-throttle", cost: 5, connects: { down: true } },
            { id: "skilled-jockey", cost: 5, connects: { down: true } },
            { id: "galaxy-mapper", cost: 5, connects: { down: true } },
            { id: "lets-ride", cost: 5, connects: { down: true } },
            // Row 2
            { id: "skilled-jockey", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "dead-to-rights", cost: 10, connects: { up: true, down: true, left: true } },
            { id: "galaxy-mapper", cost: 10, connects: { right: true, up: true, down: true } },
            { id: "rapid-recovery", cost: 10, connects: { up: true, down: true, left: true } },
            // Row 3
            { id: "improved-full-throttle", cost: 15, connects: { up: true, down: true } },
            { id: "improved-dead-to-rights", cost: 15, connects: { up: true } },
            { id: "grit", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "natural-pilot", cost: 15, connects: { left: true, up: true, down: true } },
            // Row 4
            { id: "grit", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "supreme-full-throttle", cost: 20, connects: { left: true } },
            { id: "tricky-target", cost: 20, connects: { up: true, down: true } },
            { id: "defensive-driving", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "master-pilot", cost: 25, connects: { up: true, right: true } },
            { id: "dedication", cost: 25, connects: { left: true, right: true } },
            { id: "toughened", cost: 25, connects: { left: true, up: true, right: true } },
            { id: "brilliant-evasion", cost: 25, connects: { left: true, up: true } }
        ]
    },
    // Colonist
    "doctor": {
        name: "Doctor",
        layout: [
            // Row 1
            { id: "surgeon", cost: 5, connects: { down: true } },
            { id: "bacta-specialist", cost: 5, connects: {} },
            { id: "grit", cost: 5, connects: { down: true } },
            { id: "resolve", cost: 5, connects: {} },
            // Row 2
            { id: "stim-application", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "grit", cost: 10, connects: { left: true, right: true } },
            { id: "surgeon", cost: 10, connects: { up: true, down: true, right: true, left: true } },
            { id: "resolve", cost: 10, connects: { left: true, down: true } },
            // Row 3
            { id: "surgeon", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "grit", cost: 15, connects: { down: true, right: true, left: true } },
            { id: "bacta-specialist", cost: 15, connects: { left: true, up: true, down: true } },
            { id: "pressure-point", cost: 15, connects: { up: true, down: true } },
            // Row 4
            { id: "improved-stim-application", cost: 20, connects: { up: true, down: true } },
            { id: "natural-doctor", cost: 20, connects: { up: true, down: true } },
            { id: "toughened", cost: 20, connects: { up: true, down: true } },
            { id: "anatomy-lessons", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "supreme-stim-application", cost: 25, connects: { up: true, right: true } },
            { id: "master-doctor", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "dedication", cost: 25, connects: { up: true, left: true } },
            { id: "dodge", cost: 25, connects: { up: true } },
        ]
    },
    "entrepreneur": {
        name: "Entrepreneur",
        layout: [
            // Row 1
            { id: "sound-investments", cost: 5, connects: { down: true } },
            { id: "plausible-deniability", cost: 5, connects: {} },
            { id: "rapid-recovery", cost: 5, connects: { down: true } },
            { id: "grit", cost: 5, connects: {} },
            // Row 2
            { id: "rapid-recovery", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "wheel-and-deal", cost: 10, connects: { left: true, down: true } },
            { id: "sound-investments", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "wheel-and-deal", cost: 10, connects: { left: true, down: true } },
            // Row 3
            { id: "greased-palms", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "throwing-credits", cost: 15, connects: { up: true, left: true } },
            { id: "bought-info", cost: 15, connects: { up: true, right: true } },
            { id: "sound-investments", cost: 15, connects: { left: true, up: true, down: true } },
            // Row 4
            { id: "sound-investments", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "toughened", cost: 20, connects: { left: true, down: true } },
            { id: "master-merchant", cost: 20, connects: { right: true } },
            { id: "know-somebody", cost: 20, connects: { left: true, up: true, down: true } },
            // Row 5
            { id: "natural-merchant", cost: 25, connects: { up: true, right: true } },
            { id: "intense-focus", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "dedication", cost: 25, connects: { left: true, right: true } },
            { id: "sound-investments", cost: 25, connects: { up: true, left: true } },
        ]
    },
    "marshal": {
        name: "Marshal",
        layout: [
            // Row 1
            { id: "hard-headed", cost: 5, connects: {} },
            { id: "grit", cost: 5, connects: { down: true } },
            { id: "street-smarts", cost: 5, connects: { down: true } },
            { id: "toughened", cost: 5, connects: {} },
            // Row 2
            { id: "durable", cost: 10, connects: { right: true, down: true } },
            { id: "good-cop", cost: 10, connects: { up: true, down: true, right: true, left: true } },
            { id: "bad-cop", cost: 10, connects: { left: true, up: true, down: true, right: true } },
            { id: "quick-draw", cost: 10, connects: { left: true, down: true } },
            // Row 3
            { id: "hard-headed", cost: 15, connects: { up: true, down: true } },
            { id: "grit", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "good-cop", cost: 15, connects: { left: true, up: true, down: true } },
            { id: "point-blank", cost: 15, connects: { up: true, down: true } },
            // Row 4
            { id: "durable", cost: 20, connects: { up: true, down: true } },
            { id: "unrelenting-skeptic", cost: 20, connects: { right: true, up: true, down: true } },
            { id: "bad-cop", cost: 20, connects: { up: true, left: true } },
            { id: "point-blank", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "improved-hard-headed", cost: 25, connects: { up: true } },
            { id: "improved-unrelenting-skeptic", cost: 25, connects: { up: true, right: true } },
            { id: "dedication", cost: 25, connects: { left: true } },
            { id: "natural-marksman", cost: 25, connects: { up: true } },
        ]
    },
    "performer": {
        name: "Performer",
        layout: [
            // Row 1
            { id: "smooth-talker", cost: 5, connects: {} },
            { id: "kill-with-kindness", cost: 5, connects: { down: true } },
            { id: "distracting-behavior", cost: 5, connects: { down: true } },
            { id: "convincing-demeanor", cost: 5, connects: {} },
            // Row 2
            { id: "distracting-behavior", cost: 10, connects: { down: true, right: true } },
            { id: "congenial", cost: 10, connects: { left: true, right: true, up: true, down: true } },
            { id: "dodge", cost: 10, connects: { up: true, down: true, left: true, right: true } },
            { id: "jump-up", cost: 10, connects: { left: true } },
            // Row 3
            { id: "distracting-behavior", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "intense-presence", cost: 15, connects: { left: true, up: true } },
            { id: "natural-athlete", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "second-wind", cost: 15, connects: { left: true, down: true } },
            // Row 4
            { id: "smooth-talker", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "improved-distracting-behavior", cost: 20, connects: { down: true, left: true } },
            { id: "grit", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "toughened", cost: 20, connects: { left: true, up: true, down: true } },
            // Row 5
            { id: "biggest-fan", cost: 25, connects: { up: true } },
            { id: "deceptive-taunt", cost: 25, connects: { up: true } },
            { id: "coordination-dodge", cost: 25, connects: { up: true } },
            { id: "dedication", cost: 25, connects: { up: true } },
        ]
    },
    "politico": {
        name: "Politico",
        layout: [
            // Row 1
            { id: "kill-with-kindness", cost: 5, connects: { down: true } },
            { id: "grit", cost: 5, connects: { down: true } },
            { id: "plausible-deniability", cost: 5, connects: { down: true } },
            { id: "toughened", cost: 5, connects: { down: true } },
            // Row 2
            { id: "inspiring-rhetoric", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "kill-with-kindness", cost: 10, connects: { left: true, up: true } },
            { id: "scathing-tirade", cost: 10, connects: { up: true, right: true } },
            { id: "plausible-deniability", cost: 10, connects: { left: true, up: true, down: true } },
            // Row 3
            { id: "dodge", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "improved-inspiring-rhetoric", cost: 15, connects: { left: true, down: true } },
            { id: "improved-scathing-tirade", cost: 15, connects: { right: true, down: true } },
            { id: "well-rounded", cost: 15, connects: { up: true, down: true, left: true } },
            // Row 4
            { id: "grit", cost: 20, connects: { up: true, down: true } },
            { id: "supreme-inspiring-rhetoric", cost: 20, connects: { up: true } },
            { id: "supreme-scathing-tirade", cost: 20, connects: { up: true } },
            { id: "nobodys-fool", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "steely-nerves", cost: 25, connects: { up: true, right: true } },
            { id: "dedication", cost: 25, connects: { left: true, right: true } },
            { id: "natural-charmer", cost: 25, connects: { left: true, right: true } },
            { id: "intense-presence", cost: 25, connects: { up: true, left: true } },
        ]
    },
    "scholar": {
        name: "Scholar",
        layout: [
            // Row 1
            { id: "respected-scholar", cost: 5, connects: { down: true } },
            { id: "speaks-binary", cost: 5, connects: { down: true } },
            { id: "grit", cost: 5, connects: { down: true } },
            { id: "brace", cost: 5, connects: { down: true } },
            // Row 2
            { id: "researcher", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "respected-scholar", cost: 10, connects: { left: true, up: true } },
            { id: "resolve", cost: 10, connects: { up: true, right: true } },
            { id: "researcher", cost: 10, connects: { left: true, up: true, down: true } },
            // Row 3
            { id: "codebreaker", cost: 15, connects: { up: true, right: true } },
            { id: "knowledge-specialization", cost: 15, connects: { down: true, left: true } },
            { id: "natural-scholar", cost: 15, connects: { right: true, down: true } },
            { id: "well-rounded", cost: 15, connects: { up: true, left: true } },
            // Row 4
            { id: "knowledge-specialization", cost: 20, connects: { down: true, right: true } },
            { id: "intense-focus", cost: 20, connects: { left: true, up: true } },
            { id: "confidence", cost: 20, connects: { up: true, right: true } },
            { id: "resolve", cost: 20, connects: { left: true, down: true } },
            // Row 5
            { id: "stroke-of-genius", cost: 25, connects: { up: true, right: true } },
            { id: "mental-fortress", cost: 25, connects: { right: true, left: true } },
            { id: "dedication", cost: 25, connects: { right: true, left: true } },
            { id: "toughened", cost: 25, connects: { up: true, left: true } },
        ]
    },
    //Commander
    "commodore": {
        name: "Commodore",
        layout: [
            // Row 1
            { id: "solid-repairs", cost: 5, connects: { down: true } },
            { id: "command", cost: 5, connects: { down: true } },
            { id: "rapid-reaction", cost: 5, connects: { down: true } },
            { id: "galaxy-mapper", cost: 5, connects: { down: true } },
            // Row 2
            { id: "known-schematic", cost: 10, connects: { up: true, down: true } },
            { id: "commanding-presence", cost: 10, connects: { up: true, down: true } },
            { id: "grit", cost: 10, connects: { up: true, down: true } },
            { id: "familiar-suns", cost: 10, connects: { up: true, down: true } },
            // Row 3
            { id: "solid-repairs", cost: 15, connects: { up: true, down: true } },
            { id: "command", cost: 15, connects: { up: true, down: true } },
            { id: "rapid-reaction", cost: 15, connects: { up: true, down: true } },
            { id: "galaxy-mapper", cost: 15, connects: { up: true, down: true } },
            // Row 4
            { id: "hold-together", cost: 20, connects: { up: true, down: true } },
            { id: "commanding-presence", cost: 20, connects: { up: true, down: true } },
            { id: "grit", cost: 20, connects: { up: true, down: true } },
            { id: "master-starhopper", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "solid-repairs", cost: 25, connects: { up: true, right: true } },
            { id: "fire-control", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "dedication", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "galaxy-mapper", cost: 25, connects: { up: true, left: true } },
        ]
    },
    "figurehead": {
        name: "Figurehead",
        layout: [
            // Row 1
            { id: "grit", cost: 5, connects: {} },
            { id: "resolve", cost: 5, connects: { down: true } },
            { id: "confidence", cost: 5, connects: { down: true } },
            { id: "command", cost: 5, connects: { down: true } },
            // Row 2
            { id: "command", cost: 10, connects: { down: true, right: true } },
            { id: "inspiring-rhetoric", cost: 10, connects: { left: true, up: true, right: true } },
            { id: "calm-commander", cost: 10, connects: { up: true, down: true, left: true } },
            { id: "grit", cost: 10, connects: { left: true, down: true } },
            // Row 3
            { id: "commanding-presence", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "grit", cost: 15, connects: { down: true, left: true } },
            { id: "improved-inspiring-rhetoric", cost: 15, connects: { right: true, up: true, down: true } },
            { id: "positive-spin", cost: 15, connects: { up: true, down: true, left: true } },
            // Row 4
            { id: "resolve", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "confidence", cost: 20, connects: { right: true, left: true, up: true, down: true } },
            { id: "improved-confidence", cost: 20, connects: { up: true, left: true } },
            { id: "commanding-presence", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "intense-presence", cost: 25, connects: { up: true, right: true } },
            { id: "natural-leader", cost: 25, connects: { up: true, right: true, left: true } },
            { id: "dedication", cost: 25, connects: { right: true, left: true } },
            { id: "improved-commanding-presence", cost: 25, connects: { up: true, left: true } },
        ]
    },
    "instructor": {
        name: "Instructor",
        layout: [
            // Row 1
            { id: "conditioned", cost: 5, connects: { down: true } },
            { id: "physical-training", cost: 5, connects: { down: true } },
            { id: "body-guard", cost: 5, connects: { down: true } },
            { id: "grit", cost: 5, connects: {} },
            // Row 2
            { id: "toughened", cost: 10, connects: { up: true, down: true } },
            { id: "encouraging-words", cost: 10, connects: { up: true, down: true } },
            { id: "conditioned", cost: 10, connects: { right: true, up: true, down: true } },
            { id: "stimpack-specialization", cost: 10, connects: { left: true, down: true } },
            // Row 3
            { id: "physical-training", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "master-instructor", cost: 15, connects: { up: true, down: true, left: true } },
            { id: "body-guard", cost: 15, connects: { right: true, up: true, down: true } },
            { id: "improved-body-guard", cost: 15, connects: { up: true, down: true, left: true } },
            // Row 4
            { id: "field-commander", cost: 20, connects: { up: true, down: true, right: true } },
            { id: "grit", cost: 20, connects: { left: true, right: true, up: true, down: true } },
            { id: "stimpack-specialization", cost: 20, connects: { up: true, left: true, right: true } },
            { id: "toughened", cost: 20, connects: { left: true, up: true, down: true } },
            // Row 5
            { id: "improved-field-commander", cost: 25, connects: { up: true } },
            { id: "natural-instructor", cost: 25, connects: { up: true, right: true } },
            { id: "thats-how-its-done", cost: 25, connects: { left: true, right: true } },
            { id: "dedication", cost: 25, connects: { up: true, left: true } },
        ]
    },
    "squadron-leader": {
        name: "Squadron Leader",
        layout: [
            // Row 1
            { id: "grit", cost: 5, connects: { down: true } },
            { id: "quick-strike", cost: 5, connects: {} },
            { id: "lets-ride", cost: 5, connects: {} },
            { id: "defensive-driving", cost: 5, connects: { down: true } },
            // Row 2
            { id: "field-commander", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "confidence", cost: 10, connects: { down: true, left: true } },
            { id: "quick-strike", cost: 10, connects: { right: true, down: true } },
            { id: "situational-awareness", cost: 10, connects: { up: true, left: true } },
            // Row 3
            { id: "command", cost: 15, connects: { up: true, down: true } },
            { id: "grit", cost: 15, connects: { up: true, down: true } },
            { id: "full-stop", cost: 15, connects: { up: true, down: true } },
            { id: "defensive-driving", cost: 15, connects: { down: true } },
            // Row 4
            { id: "improved-field-commander", cost: 20, connects: { up: true } },
            { id: "command", cost: 20, connects: { right: true, up: true, down: true } },
            { id: "form-on-me", cost: 20, connects: { up: true, down: true, right: true, left: true } },
            { id: "tricky-target", cost: 20, connects: { left: true, up: true, down: true } },
            // Row 5
            { id: "master-leader", cost: 25, connects: { right: true } },
            { id: "confidence", cost: 25, connects: { up: true, left: true } },
            { id: "dedication", cost: 25, connects: { up: true } },
            { id: "brilliant-evasion", cost: 25, connects: { up: true } },
        ]
    },
    "strategist": {
        name: "Strategist",
        layout: [
            // Row 1
            { id: "researcher", cost: 5, connects: { down: true } },
            { id: "grit", cost: 5, connects: {} },
            { id: "ready-for-anything", cost: 5, connects: { down: true } },
            { id: "grit", cost: 5, connects: { down: true } },
            // Row 2
            { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
            { id: "clever-commander", cost: 10, connects: { left: true, down: true, right: true } },
            { id: "command", cost: 10, connects: { left: true, right: true, up: true, down: true } },
            { id: "well-read", cost: 10, connects: { up: true, left: true } },
            // Row 3
            { id: "knowledge-specialization", cost: 15, connects: { up: true, down: true, right: true } },
            { id: "researcher", cost: 15, connects: { up: true, down: true, left: true } },
            { id: "ready-for-anything", cost: 15, connects: { right: true, up: true, down: true } },
            { id: "master-strategist", cost: 15, connects: { left: true, down: true } },
            // Row 4
            { id: "improved-researcher", cost: 20, connects: { up: true, down: true } },
            { id: "knowledge-specialization", cost: 20, connects: { right: true, up: true, down: true } },
            { id: "coordinated-assault", cost: 20, connects: { up: true, down: true, right: true, left: true, } },
            { id: "command", cost: 20, connects: { left: true, up: true, down: true } },
            // Row 5
            { id: "thorough-assessment", cost: 25, connects: { up: true, right: true } },
            { id: "careful-planning", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "improved-ready-for-anything", cost: 25, connects: { up: true, left: true, right: true } },
            { id: "dedication", cost: 25, connects: { up: true, left: true } },
        ]
    },
    "tactician": {
        name: "Tactician",
        layout: [
            // Row 1
            { id: "outdoorsman", cost: 5, connects: { down: true } },
            { id: "commanding-presence", cost: 5, connects: { down: true } },
            { id: "toughened", cost: 5, connects: {} },
            { id: "side-step", cost: 5, connects: { down: true } },
            // Row 2
            { id: "outdoorsman", cost: 10, connects: { up: true, down: true } },
            { id: "confidence", cost: 10, connects: { up: true, down: true } },
            { id: "quick-draw", cost: 10, connects: { right: true } },
            { id: "swift", cost: 10, connects: { left: true, up: true, down: true } },
            // Row 3
            { id: "natural-outdoorsman", cost: 15, connects: { up: true } },
            { id: "toughened", cost: 15, connects: { right: true, up: true, down: true } },
            { id: "body-guard", cost: 15, connects: { left: true, right: true } },
            { id: "body-guard", cost: 15, connects: { left: true, up: true, down: true } },
            // Row 4
            { id: "confidence", cost: 20, connects: { right: true } },
            { id: "commanding-presence", cost: 20, connects: { up: true, down: true, right: true, left: true } },
            { id: "field-commander", cost: 20, connects: { left: true, down: true } },
            { id: "side-step", cost: 20, connects: { up: true, down: true } },
            // Row 5
            { id: "coordinated-assault", cost: 25, connects: { right: true } },
            { id: "natural-leader", cost: 25, connects: { up: true, left: true } },
            { id: "improved-field-commander", cost: 25, connects: { up: true } },
            { id: "dedication", cost: 25, connects: { up: true } },
        ]
    },

//Consular
"arbiter": {
    name: "Arbiter",
    layout: [
        // Row 1
        { id: "sense-emotions", cost: 5, connects: { down: true } },
        { id: "savvy-negotiator", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "nobodys-fool", cost: 5, connects: { } },
        // Row 2
        { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "congenial", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 10, connects: { up: true, down: true } },
        { id: "reflect", cost: 10, connects: { down: true } },
        // Row 3
        { id: "savvy-negotiator", cost: 15, connects: { up: true } },
        { id: "nobodys-fool", cost: 15, connects: { right: true, up: true, down: true } },
        { id: "parry", cost: 15, connects: { up: true, down: true, left: true } },
        { id: "improved-sunder", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "calming-aura", cost: 20, connects: { down: true, right: true } },
        { id: "crucial-point", cost: 20, connects: { up: true, left: true, right: true } },
        { id: "savvy-negotiator", cost: 20, connects: { left: true, right: true, up: true, down: true } },
        { id: "reflect", cost: 20, connects: { up: true, down: true, left: true } },
        // Row 5
        { id: "force-rating", cost: 25, connects: { up: true, right: true } },
        { id: "improved-savvy-negotiator", cost: 25, connects: { left: true, right: true } },
        { id: "dedication", cost: 25, connects: { up: true, left: true } },
        { id: "aggressive-negotiations", cost: 25, connects: { up: true } },
    ]
},
"ascetic": {
    name: "Ascetic",
    layout: [
        // Row 1
        { id: "physical-training", cost: 5, connects: { down: true } },
        { id: "confidence", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "grit", cost: 10, connects: { up: true, down: true } },
        { id: "force-protection", cost: 10, connects: { up: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, right: true, down: true } },
        { id: "go-without", cost: 10, connects: { up: true, left: true } },
        // Row 3
        { id: "meditative-training", cost: 15, connects: { up: true, down: true } },
        { id: "slippery-minded", cost: 15, connects: { right: true } },
        { id: "intense-focus", cost: 15, connects: { left: true, right: true, up: true, down: true } },
        { id: "physical-training", cost: 15, connects: { left: true } },
        // Row 4
        { id: "confidence", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "mind-bleed", cost: 20, connects: { left: true, right: true } },
        { id: "force-protection", cost: 20, connects: { up: true, down: true, right: true, left: true } },
        { id: "iron-soul", cost: 20, connects: { left: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true, right: true } },
        { id: "grit", cost: 25, connects: { right: true, left: true } },
        { id: "empty-soul", cost: 25, connects: { up: true, left: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
    ]
},
"healer": {
    name: "Healer",
    layout: [
        // Row 1
        { id: "surgeon", cost: 5, connects: { down: true } },
        { id: "healing-trance", cost: 5, connects: { down: true } },
        { id: "rapid-recovery", cost: 5, connects: { down: true } },
        { id: "physician", cost: 5, connects: { } },
        // Row 2
        { id: "physician", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "physician", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, right: true } },
        { id: "healing-trance", cost: 10, connects: { left: true, down: true } },
        // Row 3
        { id: "healing-trance", cost: 15, connects: { up:true, down: true, right: true } },
        { id: "grit", cost: 15, connects: { left: true, right: true, up: true, down: true } },
        { id: "knowledgeable-healing", cost: 15, connects: { down: true, left: true } },
        { id: "rapid-recovery", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "surgeon", cost: 20, connects: { up: true, down: true } },
        { id: "improved-healing-trance", cost: 20, connects: { up: true } },
        { id: "calming-aura", cost: 20, connects: { up: true, down: true } },
        { id: "toughened", cost: 20, connects: { up: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true, right: true } },
        { id: "natural-doctor", cost: 25, connects: { right: true, left: true } },
        { id: "force-rating", cost: 25, connects: { up: true, right: true, left: true } },
        { id: "improved-calming-aura", cost: 25, connects: { left: true } },
    ]
},
"niman-disciple": {
    name: "Niman Disciple",
    layout: [
        // Row 1
        { id: "parry", cost: 5, connects: { down: true } },
        { id: "nobodys-fool", cost: 5, connects: { down: true } },
        { id: "reflect", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "defensive-training", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "niman-technique", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "parry", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "parry", cost: 15, connects: { up: true, down: true } },
        { id: "sense-emotions", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "reflect", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "defensive-training", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "sum-djem", cost: 20, connects: { down: true, right: true } },
        { id: "reflect", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "draw-closer", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "center-of-being", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "force-assault", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "improved-center-of-being", cost: 25, connects: { up: true } },
    ]
},
"sage": {
    name: "Sage",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "kill-with-kindness", cost: 5, connects: { down: true } },
        { id: "researcher", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "smooth-talker", cost: 10, connects: { up: true, down: true } },
        { id: "researcher", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "confidence", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "knowledge-specialization", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "valuable-facts", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "smooth-talker", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "knowledge-specialization", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "one-with-the-universe", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "force-rating", cost: 20, connects: { down: true } },
        { id: "grit", cost: 20, connects: { down: true, right: true } },
        { id: "preemptive-avoidance", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "knowledge-specialization", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "balance", cost: 25, connects: { up: true } },
        { id: "the-force-is-my-ally", cost: 25, connects: { up: true } },
        { id: "natural-negotiator", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
    ]
},
"teacher": {
    name: "Teacher",
    layout: [
        // Row 1
        { id: "researcher", cost: 5, connects: { down: true } },
        { id: "respected-scholar", cost: 5, connects: { down: true } },
        { id: "sense-danger", cost: 5, connects: { down: true } },
        { id: "well-rounded", cost: 5, connects: { down: true } },
        // Row 2
        { id: "well-traveled", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "nobodys-fool", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "encouraging-words", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        { id: "skilled-teacher", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "master-instructor", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "now-the-master", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "improved-wise-warrior", cost: 20, connects: { down: true, right: true } },
        { id: "wise-warrior", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "once-a-learner", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "grit", cost: 25, connects: { up: true } },
        { id: "skilled-teacher", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
    ]
},

//diplomat
"agitator": {
    name: "Agitator",
    layout: [
        // Row 1
        { id: "plausible-deniability", cost: 5, connects: { down: true } },
        { id: "nobodys-fool", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "intimidating", cost: 5, connects: { down: true } },
        // Row 2
        { id: "street-smarts", cost: 10, connects: { up: true, down: true } },
        { id: "street-smarts", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "convincing-demeanor", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "intimidating", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "convincing-demeanor", cost: 15, connects: { up: true, down: true } },
        { id: "plausible-deniability", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "scathing-tirade", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "natural-enforcer", cost: 20, connects: { down: true } },
        { id: "nobodys-fool", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "improved-scathing-tirade", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "intimidating", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "intimidating", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "supreme-scathing-tirade", cost: 25, connects: { up: true } },
        { id: "incite-rebellion", cost: 25, connects: { up: true } },
    ]
},
"ambassador": {
    name: "Ambassador",
    layout: [
        // Row 1
        { id: "indistinguishable", cost: 5, connects: { down: true } },
        { id: "kill-with-kindness", cost: 5, connects: { down: true } },
        { id: "nobodys-fool", cost: 5, connects: { down: true } },
        { id: "confidence", cost: 5, connects: { down: true } },
        // Row 2
        { id: "indistinguishable", cost: 10, connects: { up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "dodge", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "kill-with-kindness", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "inspiring-rhetoric", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "steely-nerves", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "confidence", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "improved-inspiring-rhetoric", cost: 20, connects: { up: true, down: true } },
        { id: "intense-presence", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "works-like-a-charm", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "dodge", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "supreme-inspiring-rhetoric", cost: 25, connects: { up: true } },
        { id: "natural-charmer", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "sixth-sense", cost: 25, connects: { up: true } },
    ]
},
"quartermaster": {
    name: "Quartermaster",
    layout: [
        // Row 1
        { id: "know-somebody", cost: 5, connects: { down: true } },
        { id: "smooth-talker", cost: 5, connects: { down: true } },
        { id: "wheel-and-deal", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "smooth-talker", cost: 10, connects: { up: true, down: true } },
        { id: "greased-palms", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "master-merchant", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        { id: "wheel-and-deal", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "bought-info", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "know-somebody", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "sound-investments", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "sound-investments", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "intense-focus", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "natural-negotiator", cost: 25, connects: { up: true } },
        { id: "superior-reflexes", cost: 25, connects: { up: true } },
        { id: "toughened", cost: 25, connects: { up: true } },
    ]
},
"advocate": {
    name: "Advocate",
    layout: [
        // Row 1
        { id: "plausible-deniability", cost: 5, connects: { down: true } },
        { id: "nobodys-fool", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "confidence", cost: 5, connects: { down: true } },
        // Row 2
        { id: "discredit", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "plausible-deniability", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "supporting-evidence", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "nobodys-fool", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "twisted-words", cost: 15, connects: { up: true, down: true } },
        { id: "improved-plausible-deniability", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "encouraging-words", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "plausible-deniability", cost: 20, connects: { up: true, down: true } },
        { id: "grit", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "supporting-evidence", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "blackmail", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "interjection", cost: 25, connects: { up: true } },
        { id: "contingency-plan", cost: 25, connects: { up: true } },
    ]
},
"analyst": {
    name: "Analyst",
    layout: [
        // Row 1
        { id: "researcher", cost: 5, connects: { down: true } },
        { id: "knowledge-specialization", cost: 5, connects: { down: true } },
        { id: "codebreaker", cost: 5, connects: { down: true } },
        { id: "technical-aptitude", cost: 5, connects: { down: true } },
        // Row 2
        { id: "valuable-facts", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "researcher", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "supporting-evidence", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "knowledge-specialization", cost: 15, connects: { up: true, down: true } },
        { id: "improved-researcher", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "codebreaker", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "encoded-communique", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "grit", cost: 20, connects: { up: true, down: true } },
        { id: "know-it-all", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "knowledge-specialization", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "natural-programmer", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "knowledge-specialization", cost: 25, connects: { up: true } },
        { id: "thorough-assessment", cost: 25, connects: { up: true } },
        { id: "stroke-of-genius", cost: 25, connects: { up: true } },
    ]
},
"propagandist": {
    name: "Propagandist",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "positive-spin", cost: 5, connects: { down: true } },
        { id: "in-the-know", cost: 5, connects: { down: true } },
        { id: "cutting-question", cost: 5, connects: { down: true } },
        // Row 2
        { id: "in-the-know", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "improved-positive-spin", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "positive-spin", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "bad-press", cost: 15, connects: { up: true, down: true } },
        { id: "well-rounded", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "confidence", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "toughened", cost: 20, connects: { up: true, down: true } },
        { id: "confidence", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "dodge", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "informant", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "positive-spin", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "improved-in-the-know", cost: 25, connects: { up: true } },
        { id: "in-the-know", cost: 25, connects: { up: true } },
    ]
},

//Engineer
"mechanic": {
    name: "Mechanic",
    layout: [
        // Row 1
        { id: "gearhead", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "fine-tuning", cost: 5, connects: { down: true } },
        { id: "solid-repairs", cost: 5, connects: { down: true } },
        // Row 2
        { id: "redundant-systems", cost: 10, connects: { up: true, down: true } },
        { id: "solid-repairs", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "gearhead", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "solid-repairs", cost: 15, connects: { up: true, down: true } },
        { id: "enduring", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "bad-motivator", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "contraption", cost: 20, connects: { down: true } },
        { id: "solid-repairs", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "fine-tuning", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "hard-headed", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "natural-tinkerer", cost: 25, connects: { up: true } },
        { id: "hold-together", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "improved-hard-headed", cost: 25, connects: { up: true } },
    ]
},
"saboteur": {
    name: "Saboteur",
    layout: [
        // Row 1
        { id: "resolve", cost: 5, connects: { down: true } },
        { id: "second-wind", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "rapid-recovery", cost: 5, connects: { down: true } },
        // Row 2
        { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "powerful-blast", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "second-wind", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "time-to-go", cost: 15, connects: { up: true, down: true } },
        { id: "rapid-recovery", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "resolve", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "hard-headed", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "improved-time-to-go", cost: 20, connects: { down: true } },
        { id: "powerful-blast", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "selective-detonation", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "master-grenadier", cost: 25, connects: { up: true } },
        { id: "selective-detonation", cost: 25, connects: { up: true } },
        { id: "improved-hard-headed", cost: 25, connects: { up: true } },
    ]
},
"scientist": {
    name: "Scientist",
    layout: [
        // Row 1
        { id: "knowledge-specialization", cost: 5, connects: { down: true } },
        { id: "respected-scholar", cost: 5, connects: { down: true } },
        { id: "researcher", cost: 5, connects: { down: true } },
        { id: "speaks-binary", cost: 5, connects: { down: true } },
        // Row 2
        { id: "researcher", cost: 10, connects: { up: true, down: true } },
        { id: "knowledge-specialization", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "hidden-storage", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "tinkerer", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "respected-scholar", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "mental-fortress", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "speaks-binary", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "inventor", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "natural-scholar", cost: 20, connects: { down: true } },
        { id: "stroke-of-genius", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "inventor", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "tinkerer", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "intense-focus", cost: 25, connects: { up: true } },
        { id: "careful-planning", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "utility-belt", cost: 25, connects: { up: true } },
    ]
},
"droid-specialist": {
    name: "Droid Specialist",
    layout: [
        // Row 1
        { id: "design-flaw", cost: 5, connects: { down: true } },
        { id: "speaks-binary", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        // Row 2
        { id: "hidden-storage", cost: 10, connects: { up: true, down: true } },
        { id: "combat-programming", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "repair-patch-specialization", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "gearhead", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "gearhead", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "machine-mender", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "hidden-storage", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "speaks-binary", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "design-flaw", cost: 20, connects: { down: true } },
        { id: "desperate-repairs", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "machine-mender", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "repair-patch-specialization", cost: 25, connects: { up: true } },
        { id: "master-artisan", cost: 25, connects: { up: true } },
        { id: "reroute-processors", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"sapper": {
    name: "Sapper",
    layout: [
        // Row 1
        { id: "construction-specialist", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "durable", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "known-schematic", cost: 10, connects: { up: true, down: true } },
        { id: "contraption", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "construction-specialist", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "powerful-blast", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "grit", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "durable", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "improved-defenses", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "powerful-blast", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "utility-belt", cost: 20, connects: { down: true } },
        { id: "strong-arm", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "improved-detonation", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "master-grenadier", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "weak-foundation", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "improved-position", cost: 25, connects: { up: true } },
        { id: "master-demolitionist", cost: 25, connects: { up: true } },
    ]
},
"shipwright": {
    name: "Shipwright",
    layout: [
        // Row 1
        { id: "dockyard-expertise", cost: 5, connects: { down: true } },
        { id: "eye-for-detail", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "creative-design", cost: 5, connects: { down: true } },
        // Row 2
        { id: "solid-repairs", cost: 10, connects: { up: true, down: true } },
        { id: "fine-tuning", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "eye-for-detail", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "debilitating-shot", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "known-schematic", cost: 15, connects: { up: true, down: true } },
        { id: "dockyard-expertise", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "smart-handling", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "creative-design", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "bought-info", cost: 20, connects: { down: true } },
        { id: "push-the-specs", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "solid-repairs", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "creative-design", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "master-artisan", cost: 25, connects: { up: true } },
        { id: "stroke-of-genius", cost: 25, connects: { up: true } },
        { id: "exhaust-port", cost: 25, connects: { up: true } },
    ]
},

//Explorer
"archaeologist": {
    name: "Archaeologist",
    layout: [
        // Row 1
        { id: "well-rounded", cost: 5, connects: { down: true } },
        { id: "hard-headed", cost: 5, connects: { down: true } },
        { id: "researcher", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "durable", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "resolve", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "knowledge-specialization", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "stunning-blow", cost: 15, connects: { up: true, right: true } },
        { id: "knockdown", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "respected-scholar", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "researcher", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "hard-headed", cost: 20, connects: { up: true, down: true } },
        { id: "enduring", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "knowledge-specialization", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "pin", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "respected-scholar", cost: 25, connects: { up: true } },
        { id: "museum-worthy", cost: 25, connects: { up: true } },
    ]
},
"big-game-hunter": {
    name: "Big-Game Hunter",
    layout: [
        // Row 1
        { id: "forager", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "stalker", cost: 5, connects: { down: true } },
        { id: "outdoorsman", cost: 5, connects: { down: true } },
        // Row 2
        { id: "toughened", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "outdoorsman", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "confidence", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "swift", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "stalker", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "natural-hunter", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "expert-tracker", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "heightened-awareness", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "grit", cost: 20, connects: { down: true } },
        { id: "hunters-quarry", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "quick-strike", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "expert-tracker", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "bring-it-down", cost: 25, connects: { up: true } },
        { id: "improved-hunters-quarry", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "superior-reflexes", cost: 25, connects: { up: true } },
    ]
},
"driver-explorer": {
    name: "Driver",
    layout: [
        // Row 1
        { id: "full-throttle", cost: 5, connects: { down: true } },
        { id: "all-terrain-driver", cost: 5, connects: { down: true } },
        { id: "fine-tuning", cost: 5, connects: { down: true } },
        { id: "gearhead", cost: 5, connects: { down: true } },
        // Row 2
        { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "skilled-jockey", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "rapid-reaction", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "improved-full-throttle", cost: 15, connects: { up: true, down: true } },
        { id: "tricky-target", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "fine-tuning", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "defensive-driving", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "skilled-jockey", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "natural-driver", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "gearhead", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "supreme-full-throttle", cost: 25, connects: { up: true } },
        { id: "full-stop", cost: 25, connects: { up: true } },
        { id: "master-driver", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"fringer": {
    name: "Fringer",
    layout: [
        // Row 1
        { id: "galaxy-mapper", cost: 5, connects: { down: true } },
        { id: "street-smarts", cost: 5, connects: { down: true } },
        { id: "rapid-recovery", cost: 5, connects: { down: true } },
        { id: "street-smarts", cost: 5, connects: { down: true } },
        // Row 2
        { id: "skilled-jockey", cost: 10, connects: { up: true, down: true } },
        { id: "galaxy-mapper", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "master-starhopper", cost: 15, connects: { down: true, right: true } },
        { id: "defensive-driving", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "rapid-recovery", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "durable", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "rapid-recovery", cost: 20, connects: { up: true, down: true } },
        { id: "jump-up", cost: 20, connects: { up: true, down: true } },
        { id: "grit", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "knockdown", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "toughened", cost: 25, connects: { up: true } },
        { id: "dodge", cost: 25, connects: { up: true } },
        { id: "dodge", cost: 25, connects: { up: true } },
    ]
},
"scout-explorer": {
    name: "Scout",
    layout: [
        // Row 1
        { id: "rapid-recovery", cost: 5, connects: { down: true } },
        { id: "stalker", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "shortcut", cost: 5, connects: { down: true } },
        // Row 2
        { id: "forager", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "quick-strike", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "lets-ride", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "disorient", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "rapid-recovery", cost: 15, connects: { up: true, down: true } },
        { id: "natural-hunter", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "familiar-suns", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "shortcut", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "grit", cost: 20, connects: { down: true } },
        { id: "heightened-awareness", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "quick-strike", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "utility-belt", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "stalker", cost: 25, connects: { up: true } },
        { id: "disorient", cost: 25, connects: { up: true } },
    ]
},
"trader": {
    name: "Trader",
    layout: [
        // Row 1
        { id: "know-somebody", cost: 5, connects: { down: true } },
        { id: "convincing-demeanor", cost: 5, connects: { down: true } },
        { id: "wheel-and-deal", cost: 5, connects: { down: true } },
        { id: "smooth-talker", cost: 5, connects: { down: true } },
        // Row 2
        { id: "wheel-and-deal", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "spare-clip", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "know-somebody", cost: 15, connects: { up: true, down: true } },
        { id: "nobodys-fool", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "smooth-talker", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "nobodys-fool", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "wheel-and-deal", cost: 20, connects: { down: true } },
        { id: "steely-nerves", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "black-market-contacts", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "black-market-contacts", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "know-somebody", cost: 25, connects: { up: true } },
        { id: "natural-negotiator", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "master-merchant", cost: 25, connects: { up: true } },
    ]
},
"scout": {
    name: "Scout",
    layout: [
        // Row 1
        { id: "rapid-recovery", cost: 5, connects: { down: true } },
        { id: "stalker", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "shortcut", cost: 5, connects: { down: true } },
        // Row 2
        { id: "forager", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "quick-strike", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "lets-ride", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "disorient", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "rapid-recovery", cost: 15, connects: { up: true, down: true } },
        { id: "natural-hunter", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "familiar-suns", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "shortcut", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "grit", cost: 20, connects: { down: true } },
        { id: "heightened-awareness", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "quick-strike", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "utility-belt", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "stalker", cost: 25, connects: { up: true } },
        { id: "disorient", cost: 25, connects: { up: true } },
    ]
},

//Gaurdian
"armorer": {
    name: "Armorer",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "gearhead", cost: 5, connects: { down: true } },
        { id: "inventor", cost: 5, connects: { down: true } },
        // Row 2
        { id: "saber-throw", cost: 10, connects: { up: true, down: true } },
        { id: "armor-master", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "gearhead", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "toughened", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "improved-armor-master", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "inventor", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "mental-tools", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "comprehend-technology", cost: 20, connects: { down: true } },
        { id: "tinkerer", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "falling-avalanche", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "supreme-armor-master", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "imbue-item", cost: 25, connects: { up: true } },
        { id: "reinforce-item", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"peacekeeper": {
    name: "Peacekeeper",
    layout: [
        // Row 1
        { id: "command", cost: 5, connects: { down: true } },
        { id: "confidence", cost: 5, connects: { down: true } },
        { id: "second-wind", cost: 5, connects: { down: true } },
        { id: "commanding-presence", cost: 5, connects: { down: true } },
        // Row 2
        { id: "commanding-presence", cost: 10, connects: { up: true, down: true } },
        { id: "toughened", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "second-wind", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "confidence", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        { id: "enhanced-leader", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "command", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "field-commander", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "steely-nerves", cost: 20, connects: { down: true } },
        { id: "second-wind", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "improved-field-commander", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "unity-assault", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "natural-leader", cost: 25, connects: { up: true } },
    ]
},
"protector": {
    name: "Protector",
    layout: [
        // Row 1
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "body-guard", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        // Row 2
        { id: "parry", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "physician", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "stimpack-specialization", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "force-protection", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "reflect", cost: 15, connects: { up: true, down: true } },
        { id: "stimpack-specialization", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "heightened-awareness", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "center-of-being", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "circle-of-shelter", cost: 20, connects: { down: true } },
        { id: "force-protection", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "body-guard", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "center-of-being", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "improved-body-guard", cost: 25, connects: { up: true } },
    ]
},
"soresu-defender": {
    name: "Soresu Defender",
    layout: [
        // Row 1
        { id: "parry", cost: 5, connects: { down: true } },
        { id: "parry", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "defensive-stance", cost: 5, connects: { down: true } },
        // Row 2
        { id: "soresu-technique", cost: 10, connects: { up: true, down: true } },
        { id: "reflect", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "confidence", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "improved-parry", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "defensive-circle", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "parry", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "parry", cost: 20, connects: { up: true, down: true } },
        { id: "reflect", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "reflect", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "defensive-stance", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "supreme-parry", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "improved-reflect", cost: 25, connects: { up: true } },
        { id: "strategic-form", cost: 25, connects: { up: true } },
    ]
},
"warden": {
    name: "Warden",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "intimidating", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "precision-strike", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "confidence", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "scathing-tirade", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "bad-cop", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "sense-danger", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "confidence", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "fearsome", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "no-escape", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "toughened", cost: 20, connects: { up: true, down: true } },
        { id: "overbalance", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "baleful-gaze", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "bad-cop", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "grapple", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "fearsome", cost: 25, connects: { up: true } },
    ]
},
"warleader": {
    name: "Warleader",
    layout: [
        // Row 1
        { id: "prime-positions", cost: 5, connects: { down: true } },
        { id: "suppressing-fire", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "uncanny-senses", cost: 5, connects: { down: true } },
        // Row 2
        { id: "grit", cost: 10, connects: { up: true, down: true } },
        { id: "careful-planning", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "sense-danger", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "swift", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "suppressing-fire", cost: 15, connects: { up: true, down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "uncanny-senses", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "prescient-shot", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "coordinated-assault", cost: 20, connects: { down: true } },
        { id: "prime-positions", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "blind-spot", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "forewarning", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "clever-solution", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "prophetic-aim", cost: 25, connects: { up: true } },
    ]
},

//Hired Gun
"bodyguard": {
    name: "Bodyguard",
    layout: [
        // Row 1
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "barrage", cost: 5, connects: { down: true } },
        { id: "durable", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "body-guard", cost: 10, connects: { up: true, down: true } },
        { id: "hard-headed", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "barrage", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "brace", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "body-guard", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "side-step", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "defensive-stance", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "brace", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "enduring", cost: 20, connects: { down: true } },
        { id: "side-step", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "defensive-stance", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "hard-headed", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "barrage", cost: 25, connects: { up: true } },
        { id: "toughened", cost: 25, connects: { up: true } },
        { id: "improved-hard-headed", cost: 25, connects: { up: true } },
    ]
},
"demolitionist": {
    name: "Demolitionist",
    layout: [
        // Row 1
        { id: "powerful-blast", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "selective-detonation", cost: 5, connects: { down: true } },
        { id: "steady-nerves", cost: 5, connects: { down: true } },
        // Row 2
        { id: "toughened", cost: 10, connects: { up: true, down: true } },
        { id: "time-to-go", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "powerful-blast", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "enduring", cost: 15, connects: { down: true, right: true } },
        { id: "improved-time-to-go", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "steady-nerves", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "rapid-reaction", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "improvised-detonation", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "powerful-blast", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "selective-detonation", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "improved-improvised-detonation", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "master-grenadier", cost: 25, connects: { up: true } },
        { id: "selective-detonation", cost: 25, connects: { up: true } },
    ]
},
"enforcer": {
    name: "Enforcer",
    layout: [
        // Row 1
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "intimidating", cost: 5, connects: { down: true } },
        { id: "fearsome", cost: 5, connects: { down: true } },
        { id: "street-smarts", cost: 5, connects: { down: true } },
        // Row 2
        { id: "durable", cost: 10, connects: { up: true, down: true } },
        { id: "stunning-blow", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "natural-enforcer", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "talk-the-talk", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "intimidating", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "defensive-stance", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "loom", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "second-wind", cost: 20, connects: { down: true } },
        { id: "street-smarts", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "walk-the-walk", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "intimidating", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "fearsome", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "black-market-contacts", cost: 25, connects: { up: true } },
        { id: "fearsome", cost: 25, connects: { up: true } },
    ]
},
"heavy": {
    name: "Heavy",
    layout: [
        // Row 1
        { id: "burly", cost: 5, connects: { down: true } },
        { id: "barrage", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        // Row 2
        { id: "barrage", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "brace", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "spare-clip", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "durable", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "side-step", cost: 15, connects: { down: true } },
        { id: "burly", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "heroic-fortitude", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "brace", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "barrage", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "rain-of-death", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "heroic-resilience", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "burly", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "armor-master", cost: 25, connects: { up: true } },
        { id: "heavy-hitter", cost: 25, connects: { up: true } },
    ]
},
"marauder": {
    name: "Marauder",
    layout: [
        // Row 1
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "frenzied-attack", cost: 5, connects: { down: true } },
        { id: "feral-strength", cost: 5, connects: { down: true } },
        { id: "lethal-blows", cost: 5, connects: { down: true } },
        // Row 2
        { id: "feral-strength", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "heroic-fortitude", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "knockdown", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "enduring", cost: 15, connects: { down: true } },
        { id: "lethal-blows", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "frenzied-attack", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "toughened", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "feral-strength", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "natural-brawler", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "lethal-blows", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "frenzied-attack", cost: 25, connects: { up: true } },
        { id: "enduring", cost: 25, connects: { up: true } },
        { id: "defensive-stance", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"mercenary-soldier": {
    name: "Mercenary Soldier",
    layout: [
        // Row 1
        { id: "command", cost: 5, connects: { down: true } },
        { id: "second-wind", cost: 5, connects: { down: true } },
        { id: "point-blank", cost: 5, connects: { down: true } },
        { id: "side-step", cost: 5, connects: { down: true } },
        // Row 2
        { id: "second-wind", cost: 10, connects: { up: true, down: true } },
        { id: "confidence", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "strong-arm", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "point-blank", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "field-commander", cost: 15, connects: { down: true } },
        { id: "command", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "natural-marksman", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "sniper-shot", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "improved-field-commander", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "lethal-blows", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "deadly-accuracy", cost: 25, connects: { up: true } },
        { id: "true-aim", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "true-aim", cost: 25, connects: { up: true } },
    ]
},

//Mystic
"advisor": {
    name: "Advisor",
    layout: [
        // Row 1
        { id: "plausible-deniability", cost: 5, connects: { down: true } },
        { id: "know-somebody", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "kill-with-kindness", cost: 5, connects: { down: true } },
        // Row 2
        { id: "toughened", cost: 10, connects: { up: true, down: true } },
        { id: "know-somebody", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "knowledge-is-power", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "nobodys-fool", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "grit", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "smooth-talker", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "smooth-talker", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "plausible-deniability", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "nobodys-fool", cost: 20, connects: { down: true } },
        { id: "natural-charmer", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "contingency-plan", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "sense-emotions", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "steely-nerves", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "sense-advantage", cost: 25, connects: { up: true } },
    ]
},
"alchemist": {
    name: "Alchemist",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "stimpack-specialization", cost: 5, connects: { down: true } },
        { id: "researcher", cost: 5, connects: { down: true } },
        { id: "blooded", cost: 5, connects: { down: true } },
        // Row 2
        { id: "researcher", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "stim-application", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "alchemical-arts", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "stimpack-specialization", cost: 15, connects: { up: true, down: true } },
        { id: "blooded", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "improved-blooded", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "transmogrify", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "improved-stim-application", cost: 20, connects: { down: true } },
        { id: "knowledgeable-healing", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "alchemical-arts", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "identify-ingredients", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "improved-concoction", cost: 25, connects: { up: true } },
    ]
},
"makashi-duelist": {
    name: "Makashi Duelist",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "resist-disarm", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "parry", cost: 5, connects: { down: true } },
        // Row 2
        { id: "parry", cost: 10, connects: { up: true, down: true } },
        { id: "makashi-technique", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "duelists-training", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "feint", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "parry", cost: 15, connects: { up: true, down: true } },
        { id: "feint", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "parry", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "parry", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "intense-presence", cost: 20, connects: { down: true } },
        { id: "improved-parry", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "defensive-training", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "sum-djem", cost: 25, connects: { up: true } },
        { id: "makashi-finish", cost: 25, connects: { up: true } },
        { id: "makashi-flourish", cost: 25, connects: { up: true } },
    ]
},
"magus": {
    name: "Magus",
    layout: [
        // Row 1
        { id: "healing-trance", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "confidence", cost: 5, connects: { down: true } },
        { id: "resolve", cost: 5, connects: { down: true } },
        // Row 2
        { id: "confidence", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "healing-trance", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "channel-agony", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "secret-lore", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "improved-healing-trance", cost: 15, connects: { up: true, down: true } },
        { id: "secret-lore", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "resolve", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "knowledge-is-power", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "channel-agony", cost: 20, connects: { down: true } },
        { id: "mind-over-matter", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "channel-agony", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "power-of-darkness", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "transmogrify", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
    ]
},
"prophet": {
    name: "Prophet",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "overwhelming-aura", cost: 5, connects: { down: true } },
        { id: "rapid-recovery", cost: 5, connects: { down: true } },
        { id: "congenial", cost: 5, connects: { down: true } },
        // Row 2
        { id: "scathing-tirade", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "plausible-deniability", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "inspiring-rhetoric", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "rapid-recovery", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "rapid-recovery", cost: 15, connects: { up: true, down: true } },
        { id: "overwhelming-aura", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "twisted-words", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "fearsome", cost: 20, connects: { down: true } },
        { id: "grit", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "improved-inspiring-rhetoric", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "congenial", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "improved-overwhelming-aura", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "font-of-power", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"seer": {
    name: "Seer",
    layout: [
        // Row 1
        { id: "forager", cost: 5, connects: { down: true } },
        { id: "uncanny-reactions", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "expert-tracker", cost: 5, connects: { down: true } },
        // Row 2
        { id: "rapid-reaction", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "keen-eyed", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "uncanny-reactions", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "sense-danger", cost: 15, connects: { down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "forewarning", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "preemptive-avoidance", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "force-rating", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "sense-advantage", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "the-force-is-my-ally", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "dodge", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "rapid-reaction", cost: 25, connects: { up: true } },
        { id: "toughened", cost: 25, connects: { up: true } },
        { id: "natural-mystic", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
    ]
},

//Seeker
"ataru-striker": {
    name: "Ataru Striker",
    layout: [
        // Row 1
        { id: "conditioned", cost: 5, connects: { down: true } },
        { id: "parry", cost: 5, connects: { down: true } },
        { id: "jump-up", cost: 5, connects: { down: true } },
        { id: "quick-draw", cost: 5, connects: { down: true } },
        // Row 2
        { id: "dodge", cost: 10, connects: { up: true, down: true } },
        { id: "reflect", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "ataru-technique", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "quick-strike", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "quick-strike", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "reflect", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "parry", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "improved-parry", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "dodge", cost: 20, connects: { down: true } },
        { id: "hawk-bat-swoop", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "saber-swarm", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "conditioned", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "parry", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "saber-throw", cost: 25, connects: { up: true } },
        { id: "balance", cost: 25, connects: { up: true } },
    ]
},
"executioner": {
    name: "Executioner",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "quick-strike", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "quick-draw", cost: 5, connects: { down: true } },
        // Row 2
        { id: "mind-over-matter", cost: 10, connects: { up: true, down: true } },
        { id: "hunters-quarry", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "lethal-blows", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "lethal-blows", cost: 15, connects: { up: true, down: true } },
        { id: "improved-hunters-quarry", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "quick-strike", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "precise-aim", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "terrifying-kill", cost: 20, connects: { down: true } },
        { id: "precise-aim", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "marked-for-death", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "deathblow", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "lethal-blows", cost: 25, connects: { up: true } },
        { id: "essential-kill", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"hermit": {
    name: "Hermit",
    layout: [
        // Row 1
        { id: "forager", cost: 5, connects: { down: true } },
        { id: "soothing-tone", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "one-with-nature", cost: 5, connects: { down: true } },
        // Row 2
        { id: "conditioned", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "menace", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "animal-bond", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "enduring", cost: 15, connects: { down: true } },
        { id: "conditioned", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "survival-of-the-fittest", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "force-rating", cost: 20, connects: { up: true, down: true } },
        { id: "improved-animal-bond", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "harass", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "force-connection", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "grit", cost: 25, connects: { up: true } },
        { id: "natural-outdoorsman", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "shroud", cost: 25, connects: { up: true } },
    ]
},
"hunter": {
    name: "Hunter",
    layout: [
        // Row 1
        { id: "rapid-recovery", cost: 5, connects: { down: true } },
        { id: "hunter", cost: 5, connects: { down: true } },
        { id: "expert-tracker", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        // Row 2
        { id: "toughened", cost: 10, connects: { up: true, down: true } },
        { id: "expert-tracker", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "hunter", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "uncanny-senses", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "side-step", cost: 15, connects: { down: true, right: true } },
        { id: "keen-eyed", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "natural-hunter", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "uncanny-reactions", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "rapid-recovery", cost: 20, connects: { up: true, down: true } },
        { id: "soft-spot", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "sixth-sense", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "rapid-recovery", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "side-step", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "intuitive-shot", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
    ]
},
"navigator": {
    name: "Navigator",
    layout: [
        // Row 1
        { id: "studious-plotting", cost: 5, connects: { down: true } },
        { id: "expert-tracker", cost: 5, connects: { down: true } },
        { id: "shortcut", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "galaxy-mapper", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "improved-shortcut", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "planet-mapper", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "preemptive-avoidance", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "shortcut", cost: 15, connects: { up: true, down: true } },
        { id: "swift", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "uncanny-senses", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "galaxy-mapper", cost: 20, connects: { down: true } },
        { id: "holistic-navigation", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "force-rating", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "planet-mapper", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "one-with-the-universe", cost: 25, connects: { up: true } },
        { id: "intuitive-navigation", cost: 25, connects: { up: true } },
        { id: "master-starhopper", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"pathfinder": {
    name: "Pathfinder",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "keen-eyed", cost: 5, connects: { down: true } },
        { id: "forager", cost: 5, connects: { down: true } },
        { id: "swift", cost: 5, connects: { down: true } },
        // Row 2
        { id: "keen-eyed", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "outdoorsman", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "outdoorsman", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "animal-empathy", cost: 15, connects: { down: true } },
        { id: "animal-bond", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "sleight-of-mind", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "mental-bond", cost: 20, connects: { up: true, down: true } },
        { id: "force-rating", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "quick-movement", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "share-pain", cost: 25, connects: { up: true } },
        { id: "enduring", cost: 25, connects: { up: true } },
        { id: "natural-outdoorsman", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},

//Sentinel
"artisan": {
    name: "Artisan",
    layout: [
        // Row 1
        { id: "solid-repairs", cost: 5, connects: { down: true } },
        { id: "fine-tuning", cost: 5, connects: { down: true } },
        { id: "mental-tools", cost: 5, connects: { down: true } },
        { id: "technical-aptitude", cost: 5, connects: { down: true } },
        // Row 2
        { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "solid-repairs", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "fine-tuning", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "inventor", cost: 15, connects: { down: true } },
        { id: "imbue-item", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "natural-tinkerer", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "defensive-slicing", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "solid-repairs", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "force-rating", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "defensive-slicing", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "mental-fortress", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "master-artisan", cost: 25, connects: { up: true } },
        { id: "intuitive-improvements", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "comprehend-technology", cost: 25, connects: { up: true } },
    ]
},
"investigator": {
    name: "Investigator",
    layout: [
        // Row 1
        { id: "street-smarts", cost: 5, connects: { down: true } },
        { id: "keen-eyed", cost: 5, connects: { down: true } },
        { id: "uncanny-senses", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "talk-the-talk", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "street-smarts", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "toughened", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "keen-eyed", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "street-smarts", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "reconstruct-the-scene", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "sense-advantage", cost: 20, connects: { down: true } },
        { id: "unrelenting-skeptic", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "clever-solution", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "sense-the-scene", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "valuable-facts", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "improved-street-smarts", cost: 25, connects: { up: true } },
        { id: "force-rating", cost: 25, connects: { up: true } },
    ]
},
"racer": {
    name: "Racer",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "skilled-jockey", cost: 5, connects: { down: true } },
        { id: "conditioned", cost: 5, connects: { down: true } },
        { id: "shortcut", cost: 5, connects: { down: true } },
        // Row 2
        { id: "shortcut", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "full-throttle", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "shortcut", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "conditioned", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "skilled-jockey", cost: 15, connects: { up: true, down: true } },
        { id: "improved-full-throttle", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "freerunning", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "improved-freerunning", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "grit", cost: 20, connects: { down: true } },
        { id: "supreme-full-throttle", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "force-rating", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "better-luck-next-time", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "superhuman-reflexes", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "improved-shortcut", cost: 25, connects: { up: true } },
        { id: "intuitive-evasion", cost: 25, connects: { up: true } },
    ]
},
"sentry": {
    name: "Sentry",
    layout: [
        // Row 1
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "reflect", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "conditioned", cost: 5, connects: { down: true } },
        // Row 2
        { id: "uncanny-reactions", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "reflect", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "uncanny-reactions", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "sleight-of-mind", cost: 15, connects: { down: true } },
        { id: "improved-saber-throw", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "saber-throw", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "impossible-fall", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "dodge", cost: 20, connects: { up: true, down: true } },
        { id: "fear-the-shadows", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "constant-vigilance", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "sleight-of-mind", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "improved-reflect", cost: 25, connects: { up: true } },
        { id: "dodge", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"shadow": {
    name: "Shadow",
    layout: [
        // Row 1
        { id: "sleight-of-mind", cost: 5, connects: { down: true } },
        { id: "street-smarts", cost: 5, connects: { down: true } },
        { id: "codebreaker", cost: 5, connects: { down: true } },
        { id: "indistinguishable", cost: 5, connects: { down: true } },
        // Row 2
        { id: "well-rounded", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "mental-fortress", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "indistinguishable", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "shroud", cost: 15, connects: { down: true } },
        { id: "dodge", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "sleight-of-mind", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "slippery-minded", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "codebreaker", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "now-you-see-me", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "dodge", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "anatomy-lessons", cost: 25, connects: { up: true } },
        { id: "master-of-shadows", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"shien-expert": {
    name: "Shien Expert",
    layout: [
        // Row 1
        { id: "side-step", cost: 5, connects: { down: true } },
        { id: "conditioned", cost: 5, connects: { down: true } },
        { id: "street-smarts", cost: 5, connects: { down: true } },
        { id: "reflect", cost: 5, connects: { down: true } },
        // Row 2
        { id: "toughened", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "parry", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "shien-technique", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "reflect", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "parry", cost: 15, connects: { up: true, down: true } },
        { id: "counterstrike", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "improved-reflect", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "djem-so-deflection", cost: 20, connects: { down: true } },
        { id: "defensive-stance", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "saber-throw", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "reflect", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "falling-avalanche", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "disruptive-strike", cost: 25, connects: { up: true } },
        { id: "supreme-reflect", cost: 25, connects: { up: true } },
    ]
},

//Smuggler
"charmer": {
    name: "Charmer",
    layout: [
        // Row 1
        { id: "smooth-talker", cost: 5, connects: { down: true } },
        { id: "inspiring-rhetoric", cost: 5, connects: { down: true } },
        { id: "kill-with-kindness", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "kill-with-kindness", cost: 10, connects: { up: true, down: true } },
        { id: "improved-inspiring-rhetoric", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "congenial", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "plausible-deniability", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "disarming-smile", cost: 15, connects: { down: true } },
        { id: "works-like-a-charm", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "disarming-smile", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "smooth-talker", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "congenial", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "just-kidding", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "intense-presence", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "natural-charmer", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "dont-shoot", cost: 25, connects: { up: true } },
        { id: "resolve", cost: 25, connects: { up: true } },
    ]
},
"gambler": {
    name: "Gambler",
    layout: [
        // Row 1
        { id: "convincing-demeanor", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "up-the-ante", cost: 5, connects: { down: true } },
        // Row 2
        { id: "grit", cost: 10, connects: { up: true, down: true } },
        { id: "second-chances", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "dedication", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "supreme-double-or-nothing", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "second-chances", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "convincing-demeanor", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "fortune-favors-the-bold", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "natural-rogue", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "up-the-ante", cost: 20, connects: { down: true } },
        { id: "up-the-ante", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "clever-solution", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "second-chances", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "double-or-nothing", cost: 25, connects: { up: true } },
        { id: "smooth-talker", cost: 25, connects: { up: true } },
        { id: "natural-negotiator", cost: 25, connects: { up: true } },
        { id: "improved-double-or-nothing", cost: 25, connects: { up: true } },
    ]
},
"gunslinger": {
    name: "Gunslinger",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "quick-strike", cost: 5, connects: { down: true } },
        { id: "rapid-reaction", cost: 5, connects: { down: true } },
        { id: "quick-draw", cost: 5, connects: { down: true } },
        // Row 2
        { id: "lethal-blows", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "quick-strike", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "improved-quick-draw", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "toughened", cost: 15, connects: { down: true } },
        { id: "call-em", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "dodge", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "sorry-about-the-mess", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "confidence", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "lethal-blows", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "guns-blazing", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "rapid-reaction", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "spitfire", cost: 25, connects: { up: true } },
        { id: "natural-marksman", cost: 25, connects: { up: true } },
        { id: "deadly-accuracy", cost: 25, connects: { up: true } },
    ]
},
"pilot-smuggler": {
    name: "Pilot",
    layout: [
        // Row 1
        { id: "full-throttle", cost: 5, connects: { down: true } },
        { id: "skilled-jockey", cost: 5, connects: { down: true } },
        { id: "galaxy-mapper", cost: 5, connects: { down: true } },
        { id: "lets-ride", cost: 5, connects: { down: true } },
        // Row 2
        { id: "skilled-jockey", cost: 10, connects: { up: true, down: true } },
        { id: "dead-to-rights", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "galaxy-mapper", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "rapid-recovery", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "improved-full-throttle", cost: 15, connects: { down: true } },
        { id: "improved-dead-to-rights", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "natural-pilot", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "grit", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "supreme-full-throttle", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "tricky-target", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "defensive-driving", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "master-pilot", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "toughened", cost: 25, connects: { up: true } },
        { id: "brilliant-evasion", cost: 25, connects: { up: true } },
    ]
},
"scoundrel": {
    name: "Scoundrel",
    layout: [
        // Row 1
        { id: "black-market-contacts", cost: 5, connects: { down: true } },
        { id: "convincing-demeanor", cost: 5, connects: { down: true } },
        { id: "quick-draw", cost: 5, connects: { down: true } },
        { id: "rapid-reaction", cost: 5, connects: { down: true } },
        // Row 2
        { id: "convincing-demeanor", cost: 10, connects: { up: true, down: true } },
        { id: "black-market-contacts", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "convincing-demeanor", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "quick-strike", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "hidden-storage", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "black-market-contacts", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "side-step", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "toughened", cost: 20, connects: { down: true } },
        { id: "rapid-reaction", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "hidden-storage", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "side-step", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "natural-charmer", cost: 25, connects: { up: true } },
        { id: "soft-spot", cost: 25, connects: { up: true } },
        { id: "quick-strike", cost: 25, connects: { up: true } },
    ]
},
"thief": {
    name: "Thief",
    layout: [
        // Row 1
        { id: "street-smarts", cost: 5, connects: { down: true } },
        { id: "black-market-contacts", cost: 5, connects: { down: true } },
        { id: "indistinguishable", cost: 5, connects: { down: true } },
        { id: "bypass-security", cost: 5, connects: { down: true } },
        // Row 2
        { id: "black-market-contacts", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "dodge", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "hidden-storage", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "stalker", cost: 15, connects: { down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "rapid-reaction", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "shortcut", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "bypass-security", cost: 20, connects: { up: true, down: true } },
        { id: "natural-rogue", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "street-smarts", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "jump-up", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "master-of-shadows", cost: 25, connects: { up: true } },
        { id: "dodge", cost: 25, connects: { up: true } },
        { id: "indistinguishable", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},

//Soldier
"commando": {
    name: "Commando",
    layout: [
        // Row 1
        { id: "physical-training", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "point-blank", cost: 5, connects: { down: true } },
        // Row 2
        { id: "toughened", cost: 10, connects: { up: true, down: true } },
        { id: "durable", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "physical-training", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "strong-arm", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "blooded", cost: 15, connects: { down: true } },
        { id: "armor-master", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "natural-outdoorsman", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "feral-strength", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "toughened", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "heroic-fortitude", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "durable", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "knockdown", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "improved-armor-master", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "unstoppable", cost: 25, connects: { up: true } },
        { id: "feral-strength", cost: 25, connects: { up: true } },
    ]
},
"heavy": {
    name: "Heavy",
    layout: [
        // Row 1
        { id: "burly", cost: 5, connects: { down: true } },
        { id: "barrage", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        // Row 2
        { id: "barrage", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "brace", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "spare-clip", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "durable", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "side-step", cost: 15, connects: { down: true } },
        { id: "burly", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "heroic-fortitude", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "brace", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "barrage", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "rain-of-death", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "heroic-resilience", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "burly", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "armor-master", cost: 25, connects: { up: true } },
        { id: "heavy-hitter", cost: 25, connects: { up: true } },
    ]
},
"medic": {
    name: "Medic",
    layout: [
        // Row 1
        { id: "forager", cost: 5, connects: { down: true } },
        { id: "stimpack-specialization", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "surgeon", cost: 5, connects: { down: true } },
        // Row 2
        { id: "toughened", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "surgeon", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "stimpack-specialization", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "bacta-specialist", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "well-rounded", cost: 15, connects: { down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "stim-application", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "master-doctor", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "dodge", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "natural-doctor", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "improved-stim-application", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "stimpack-specialization", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "anatomy-lessons", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "its-not-that-bad", cost: 25, connects: { up: true } },
        { id: "supreme-stim-application", cost: 25, connects: { up: true } },
    ]
},
"sharpshooter": {
    name: "Sharpshooter",
    layout: [
        // Row 1
        { id: "expert-tracker", cost: 5, connects: { down: true } },
        { id: "sniper-shot", cost: 5, connects: { down: true } },
        { id: "brace", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "grit", cost: 10, connects: { up: true, down: true } },
        { id: "true-aim", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "deadly-accuracy", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "lethal-blows", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "brace", cost: 15, connects: { up: true, down: true } },
        { id: "lethal-blows", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "sniper-shot", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "true-aim", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "expert-tracker", cost: 20, connects: { down: true } },
        { id: "deadly-accuracy", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "crippling-blow", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "quick-fix", cost: 25, connects: { up: true } },
        { id: "natural-marksman", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "targeted-blow", cost: 25, connects: { up: true } },
    ]
},
"trailblazer": {
    name: "Trailblazer",
    layout: [
        // Row 1
        { id: "stalker", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "outdoorsman", cost: 5, connects: { down: true } },
        { id: "expert-tracker", cost: 5, connects: { down: true } },
        // Row 2
        { id: "disorient", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "prime-positions", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "cunning-snare", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "outdoorsman", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "grit", cost: 15, connects: { down: true } },
        { id: "dodge", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "blind-spot", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "dodge", cost: 20, connects: { up: true, down: true } },
        { id: "prey-on-the-weak", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "expert-tracker", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "one-with-nature", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "ambush", cost: 25, connects: { up: true } },
        { id: "disorient", cost: 25, connects: { up: true } },
        { id: "prey-on-the-weak", cost: 25, connects: { up: true } },
    ]
},
"vanguard": {
    name: "Vanguard",
    layout: [
        // Row 1
        { id: "body-guard", cost: 5, connects: { down: true } },
        { id: "conditioned", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "rapid-reaction", cost: 5, connects: { down: true } },
        // Row 2
        { id: "toughened", cost: 10, connects: { up: true, down: true } },
        { id: "moving-target", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "point-blank", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "suppressing-fire", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "conditioned", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "body-guard", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "rapid-reaction", cost: 15, connects: { left: true, up: true, down: true } },
        // Row 4
        { id: "improved-body-guard", cost: 20, connects: { down: true } },
        { id: "toughened", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "suppressing-fire", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "moving-target", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "supreme-body-guard", cost: 25, connects: { up: true } },
        { id: "dynamic-fire", cost: 25, connects: { up: true } },
        { id: "seize-the-initiative", cost: 25, connects: { up: true } },
    ]
},

//Spy
"courier": {
    name: "Courier",
    layout: [
        // Row 1
        { id: "indistinguishable", cost: 5, connects: { down: true } },
        { id: "shortcut", cost: 5, connects: { down: true } },
        { id: "well-traveled", cost: 5, connects: { down: true } },
        { id: "pilot-training", cost: 5, connects: { down: true } },
        // Row 2
        { id: "hidden-storage", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "swift", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "second-wind", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        { id: "indistinguishable", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "freerunning", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "shortcut", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "improved-hidden-storage", cost: 20, connects: { down: true } },
        { id: "hidden-storage", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "improved-indistinguishable", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "second-wind", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "incite-distraction", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "lose-them", cost: 25, connects: { up: true } },
        { id: "natural-athlete", cost: 25, connects: { up: true } },
    ]
},
"infiltrator": {
    name: "Infiltrator",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "dodge", cost: 5, connects: { down: true } },
        { id: "frenzied-attack", cost: 5, connects: { down: true } },
        { id: "defensive-stance", cost: 5, connects: { down: true } },
        // Row 2
        { id: "stunning-blow", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "soft-spot", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "jump-up", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "knockdown", cost: 15, connects: { up: true, down: true } },
        { id: "frenzied-attack", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "dodge", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "natural-brawler", cost: 20, connects: { down: true } },
        { id: "toughened", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "improved-stunning-blow", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "defensive-stance", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "clever-solution", cost: 25, connects: { up: true } },
        { id: "master-of-shadows", cost: 25, connects: { up: true } },
        { id: "natural-rogue", cost: 25, connects: { up: true } },
    ]
},
"interrogator": {
    name: "Interrogator",
    layout: [
        // Row 1
        { id: "intimidating", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "surgeon", cost: 5, connects: { down: true } },
        { id: "nobodys-fool", cost: 5, connects: { down: true } },
        // Row 2
        { id: "bad-cop", cost: 10, connects: { up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "surgeon", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "good-cop", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "resist-questioning", cost: 15, connects: { down: true } },
        { id: "bad-cop", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "nobodys-fool", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "know-their-weakness", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "improved-resist-questioning", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "intimidating", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "know-their-weakness", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "improved-know-their-weakness", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "pressure-point", cost: 25, connects: { up: true } },
        { id: "exhaustive-questioning", cost: 25, connects: { up: true } },
        { id: "made-you-talk", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"scout-spy": {
    name: "Scout",
    layout: [
        // Row 1
        { id: "rapid-recovery", cost: 5, connects: { down: true } },
        { id: "stalker", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "shortcut", cost: 5, connects: { down: true } },
        // Row 2
        { id: "forager", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "quick-strike", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "lets-ride", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "disorient", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "rapid-recovery", cost: 15, connects: { up: true, down: true } },
        { id: "natural-hunter", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "familiar-suns", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "shortcut", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "grit", cost: 20, connects: { down: true } },
        { id: "heightened-awareness", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "quick-strike", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "utility-belt", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "stalker", cost: 25, connects: { up: true } },
        { id: "disorient", cost: 25, connects: { up: true } },
    ]
},
"slicer": {
    name: "Slicer",
    layout: [
        // Row 1
        { id: "codebreaker", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "technical-aptitude", cost: 5, connects: { down: true } },
        { id: "bypass-security", cost: 5, connects: { down: true } },
        // Row 2
        { id: "defensive-slicing", cost: 10, connects: { up: true, down: true } },
        { id: "technical-aptitude", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "bypass-security", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "natural-programmer", cost: 15, connects: { down: true } },
        { id: "bypass-security", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "defensive-slicing", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "defensive-slicing", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "improved-defensive-slicing", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "codebreaker", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "resolve", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "skilled-slicer", cost: 25, connects: { up: true } },
        { id: "master-slicer", cost: 25, connects: { up: true } },
        { id: "mental-fortress", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"sleeper-agent": {
    name: "Sleeper Agent",
    layout: [
        // Row 1
        { id: "codebreaker", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "cunning-presence", cost: 5, connects: { down: true } },
        { id: "well-rounded", cost: 5, connects: { down: true } },
        // Row 2
        { id: "toughened", cost: 10, connects: { up: true, down: true } },
        { id: "bypass-security", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "convincing-demeanor", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "creative-killer", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "analyze-data", cost: 15, connects: { down: true } },
        { id: "codebreaker", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "convincing-demeanor", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "grit", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "bypass-security", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "durable", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "a-step-ahead", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "inside-person", cost: 25, connects: { up: true } },
        { id: "natural-charmer", cost: 25, connects: { up: true } },
        { id: "inside-knowledge", cost: 25, connects: { up: true } },
    ]
},

//Technician
"cyber-tech": {
    name: "Cyber Tech",
    layout: [
        // Row 1
        { id: "cyberneticist", cost: 5, connects: { down: true } },
        { id: "more-machine-than-man", cost: 5, connects: { down: true } },
        { id: "engineered-redundancies", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        // Row 2
        { id: "eye-for-detail", cost: 10, connects: { up: true, down: true } },
        { id: "toughened", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "energy-transfer", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "cyberneticist", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "overcharge", cost: 15, connects: { down: true } },
        { id: "more-machine-than-man", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "durable", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "surgeon", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "improved-overcharge", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "utility-belt", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "more-machine-than-man", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "surgeon", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "more-machine-than-man", cost: 25, connects: { up: true } },
        { id: "durable", cost: 25, connects: { up: true } },
        { id: "supreme-overcharge", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},
"droid-tech": {
    name: "Droid Tech",
    layout: [
        // Row 1
        { id: "machine-mender", cost: 5, connects: { down: true } },
        { id: "hidden-storage", cost: 5, connects: { down: true } },
        { id: "speaks-binary", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "deft-maker", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "eye-for-detail", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "speaks-binary", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        { id: "supreme-speaks-binary", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "improved-speaks-binary", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "hidden-storage", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "redundant-systems", cost: 20, connects: { down: true } },
        { id: "machine-mender", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "speaks-binary", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "deft-maker", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "eye-for-detail", cost: 25, connects: { up: true } },
        { id: "reroute-processors", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "machine-mender", cost: 25, connects: { up: true } },
    ]
},
"mechanic-tech": {
    name: "Mechanic",
    layout: [
        // Row 1
        { id: "gearhead", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "fine-tuning", cost: 5, connects: { down: true } },
        { id: "solid-repairs", cost: 5, connects: { down: true } },
        // Row 2
        { id: "redundant-systems", cost: 10, connects: { up: true, down: true } },
        { id: "solid-repairs", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "gearhead", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "solid-repairs", cost: 15, connects: { up: true, down: true } },
        { id: "enduring", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "bad-motivator", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "contraption", cost: 20, connects: { down: true } },
        { id: "solid-repairs", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "fine-tuning", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "hard-headed", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "natural-tinkerer", cost: 25, connects: { up: true } },
        { id: "hold-together", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "improved-hard-headed", cost: 25, connects: { up: true } },
    ]
},
"modder": {
    name: "Modder",
    layout: [
        // Row 1
        { id: "tinkerer", cost: 5, connects: { down: true } },
        { id: "resolve", cost: 5, connects: { down: true } },
        { id: "know-somebody", cost: 5, connects: { down: true } },
        { id: "signature-vehicle", cost: 5, connects: { down: true } },
        // Row 2
        { id: "gearhead", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "tinkerer", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "fancy-paint-job", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "larger-project", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "resourceful-refit", cost: 15, connects: { down: true } },
        { id: "resolve", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "larger-project", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "jury-rigged", cost: 20, connects: { up: true, down: true } },
        { id: "hidden-storage", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "tinkerer", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "gearhead", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "jury-rigged", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "natural-tinkerer", cost: 25, connects: { up: true } },
        { id: "custom-loadout", cost: 25, connects: { up: true } },
    ]
},
"outlaw-tech": {
    name: "Outlaw Tech",
    layout: [
        // Row 1
        { id: "tinkerer", cost: 5, connects: { down: true } },
        { id: "utinnii", cost: 5, connects: { down: true } },
        { id: "speaks-binary", cost: 5, connects: { down: true } },
        { id: "tinkerer", cost: 5, connects: { down: true } },
        // Row 2
        { id: "solid-repairs", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "utinnii", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "utility-belt", cost: 15, connects: { down: true } },
        { id: "side-step", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "brace", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "defensive-stance", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "jury-rigged", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "speaks-binary", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "inventor", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "jury-rigged", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "inventor", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "known-schematic", cost: 25, connects: { up: true } },
        { id: "brace", cost: 25, connects: { up: true } },
    ]
},
"slicer-tech": {
    name: "Slicer",
    layout: [
        // Row 1
        { id: "codebreaker", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "technical-aptitude", cost: 5, connects: { down: true } },
        { id: "bypass-security", cost: 5, connects: { down: true } },
        // Row 2
        { id: "defensive-slicing", cost: 10, connects: { up: true, down: true } },
        { id: "technical-aptitude", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "bypass-security", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "natural-programmer", cost: 15, connects: { down: true } },
        { id: "bypass-security", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "defensive-slicing", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "defensive-slicing", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "improved-defensive-slicing", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "codebreaker", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "resolve", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "skilled-slicer", cost: 25, connects: { up: true } },
        { id: "master-slicer", cost: 25, connects: { up: true } },
        { id: "mental-fortress", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
    ]
},

//Warrior
"aggressor": {
    name: "Aggressor",
    layout: [
        // Row 1
        { id: "intimidating", cost: 5, connects: { down: true } },
        { id: "plausible-deniability", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        // Row 2
        { id: "fearsome", cost: 10, connects: { up: true, down: true } },
        { id: "intimidating", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "prey-on-the-weak", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "sense-advantage", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "fearsome", cost: 15, connects: { up: true, down: true } },
        { id: "terrify", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "crippling-blow", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "grit", cost: 20, connects: { down: true } },
        { id: "improved-terrify", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "prey-on-the-weak", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "heroic-fortitude", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "fearsome", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "against-all-odds", cost: 25, connects: { up: true } },
    ]
},
"colossus": {
    name: "Colossus",
    layout: [
        // Row 1
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "durable", cost: 5, connects: { down: true } },
        { id: "hard-headed", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        // Row 2
        { id: "toughened", cost: 10, connects: { up: true, down: true } },
        { id: "durable", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "hard-headed", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "toughened", cost: 15, connects: { up: true, down: true } },
        { id: "durable", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "headbutt", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "enduring", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "toughened", cost: 20, connects: { down: true } },
        { id: "unstoppable", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "improved-hard-headed", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "indomitable-will", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "improved-toughened", cost: 25, connects: { up: true } },
        { id: "heroic-fortitude", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "power-from-pain", cost: 25, connects: { up: true } },
    ]
},
"juyo-berserker": {
    name: "Juyo Berserker",
    layout: [
        // Row 1
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "parry", cost: 5, connects: { down: true } },
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "intimidating", cost: 5, connects: { down: true } },
        // Row 2
        { id: "inner-peace", cost: 10, connects: { up: true, down: true } },
        { id: "parry", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "vaapad-control", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "lethal-blows", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "balance", cost: 15, connects: { down: true } },
        { id: "lethal-blows", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "quick-strike", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "embrace-your-hate", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "inner-peace", cost: 20, connects: { up: true, down: true } },
        { id: "intimidating", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "juyo-savagery", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "quick-strike", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "parry", cost: 25, connects: { up: true } },
        { id: "embrace-your-hate", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "multiple-opponents", cost: 25, connects: { up: true } },
    ]
},
"shii-cho-knight": {
    name: "Shii-Cho Knight",
    layout: [
        // Row 1
        { id: "parry", cost: 5, connects: { down: true } },
        { id: "second-wind", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        { id: "parry", cost: 5, connects: { down: true } },
        // Row 2
        { id: "second-wind", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "conditioned", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "multiple-opponents", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "durable", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "quick-draw", cost: 15, connects: { down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "parry", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "defensive-training", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "natural-blademaster", cost: 20, connects: { up: true, down: true } },
        { id: "sarlacc-sweep", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "improved-parry", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "sum-djem", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "center-of-being", cost: 25, connects: { up: true } },
        { id: "durable", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "parry", cost: 25, connects: { up: true } },
    ]
},
"starfighter-ace": {
    name: "Starfighter Ace",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "skilled-jockey", cost: 5, connects: { down: true } },
        { id: "rapid-reaction", cost: 5, connects: { down: true } },
        { id: "solid-repairs", cost: 5, connects: { down: true } },
        // Row 2
        { id: "intuitive-evasion", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "confidence", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "solid-repairs", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "galaxy-mapper", cost: 10, connects: { left: true, up: true, down: true } },
        // Row 3
        { id: "full-throttle", cost: 15, connects: { up: true, down: true } },
        { id: "rapid-reaction", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "exhaust-port", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "intuitive-strike", cost: 20, connects: { down: true } },
        { id: "touch-of-fate", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "grit", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "skilled-jockey", cost: 20, connects: { up: true, down: true } },
        // Row 5
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "tricky-target", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "intuitive-evasion", cost: 25, connects: { up: true } },
    ]
},
"steel-hand-adept": {
    name: "Steel Hand Adept",
    layout: [
        // Row 1
        { id: "grit", cost: 5, connects: { down: true } },
        { id: "iron-body", cost: 5, connects: { down: true } },
        { id: "iron-body", cost: 5, connects: { down: true } },
        { id: "toughened", cost: 5, connects: { down: true } },
        // Row 2
        { id: "martial-grace", cost: 10, connects: { up: true, down: true } },
        { id: "acklays-settling-strike", cost: 10, connects: { up: true, down: true, right: true } },
        { id: "unarmed-parry", cost: 10, connects: { left: true, up: true, down: true } },
        { id: "precision-strike", cost: 10, connects: { up: true, down: true } },
        // Row 3
        { id: "dodge", cost: 15, connects: { down: true } },
        { id: "swift", cost: 15, connects: { up: true, down: true, right: true } },
        { id: "parry", cost: 15, connects: { left: true, up: true, down: true } },
        { id: "improved-precision-strike", cost: 15, connects: { up: true, down: true } },
        // Row 4
        { id: "improved-dodge", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "toughened", cost: 20, connects: { left: true, up: true, down: true } },
        { id: "grit", cost: 20, connects: { up: true, down: true, right: true } },
        { id: "sapith-sundering", cost: 20, connects: { left: true, up: true, down: true } },
        // Row 5
        { id: "force-rating", cost: 25, connects: { up: true } },
        { id: "far-strike", cost: 25, connects: { up: true } },
        { id: "dedication", cost: 25, connects: { up: true } },
        { id: "dodge", cost: 25, connects: { up: true } },
    ]
},
};

function displayMessage(message, type = 'info', elementId = 'auth-message') {
    const messageDiv = document.getElementById(elementId) || document.getElementById('save-load-message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.color = type === 'error' ? '#222' : 'green';
        setTimeout(() => {
            if (messageDiv.textContent === message) messageDiv.textContent = '';
        }, 5000);
    }
}

function setupAbilityTooltips() {
    const tooltip = document.getElementById('ability-tooltip');
    if (!tooltip) return;

    document.body.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('interactive-ability')) {
            const abilityKey = e.target.dataset.ability;
            const ability = masterAbilityList[abilityKey];
            if (ability) {
                tooltip.innerHTML = `<h4>${ability.name}</h4><p>${ability.description}</p>`;
                tooltip.style.display = 'block';
            }
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        if (e.target.classList.contains('interactive-ability')) {
            tooltip.style.display = 'none';
        }
    });

    document.body.addEventListener('mousemove', (e) => {
        if (tooltip.style.display === 'block') {
            // Position tooltip near the cursor
            tooltip.style.left = `${e.pageX + 15}px`;
            tooltip.style.top = `${e.pageY + 15}px`;
        }
    });
}

function parseAndDisplaySpecialAbilities(text) {
    if (!text) return 'None';
    let parsedText = text;
    for (const key in masterAbilityList) {
        // Use a regular expression to match the ability name (case-insensitive)
        const regex = new RegExp(`\\b(${key})\\b`, 'gi');
        parsedText = parsedText.replace(regex, `<span class="interactive-ability" data-ability="${key}">$1</span>`);
    }
    return parsedText;
}

function openPanel(panelToOpen) {
    const poolPanel = document.getElementById("dice-pool-panel");
    const gearPanel = document.getElementById("gear-panel");
    if (!poolPanel || !gearPanel || !panelToOpen) return;

    const isPool = panelToOpen.id === "dice-pool-panel";
    const panelToClose = isPool ? gearPanel : poolPanel;
    const bodyClassToRemove = isPool ? "gear-open" : "pool-open";
    const bodyClassToAdd = isPool ? "pool-open" : "gear-open";

    panelToClose.classList.remove("open");
    document.body.classList.remove(bodyClassToRemove);
    
    panelToOpen.classList.add("open");
    document.body.classList.add(bodyClassToAdd);
}

function togglePanel(panelToOpen) {
    const poolPanel = document.getElementById("dice-pool-panel");
    const gearPanel = document.getElementById("gear-panel");
    if (!poolPanel || !gearPanel || !panelToOpen) return;

    const isPool = panelToOpen.id === "dice-pool-panel";
    const panelToClose = isPool ? gearPanel : poolPanel;
    const bodyClassToRemove = isPool ? "gear-open" : "pool-open";
    const bodyClassToAdd = isPool ? "pool-open" : "gear-open";

    if (panelToOpen.classList.contains("open")) {
        panelToOpen.classList.remove("open");
        document.body.classList.remove(bodyClassToAdd);
    } else {
        // Otherwise, close the other panel and open the new one.
        panelToClose.classList.remove("open");
        document.body.classList.remove(bodyClassToRemove);
        
        panelToOpen.classList.add("open");
        document.body.classList.add(bodyClassToAdd);
    }
}

function updateCharacterStats() {
    if (!currentCharacterData || !currentCharacterData.characteristics) return;

    const brawn = currentCharacterData.characteristics.brawn || 0;
    let soakValue = brawn; // Soak starts with Brawn value
    let defenseMelee = 0;
    let defenseRanged = 0;

    const equippedArmor = currentCharacterData.inventory?.find(
        item => item.equipped && masterGearList[item.id]?.type === 'armor'
    );

    if (equippedArmor) {
        const armorDetails = masterGearList[equippedArmor.id];
        soakValue += armorDetails.soak || 0;
        // Armor's defense value applies to both Melee and Ranged
        defenseMelee += armorDetails.defense || 0;
        defenseRanged += armorDetails.defense || 0;
    }
    
    const encumbranceThreshold = 5 + brawn;
    let currentEncumbrance = 0;
    if (currentCharacterData.inventory) {
        currentCharacterData.inventory.forEach(item => {
            const itemDetails = masterGearList[item.id];
            if (itemDetails && itemDetails.encumbrance) {
                const quantity = item.quantity || 1;
                currentEncumbrance += itemDetails.encumbrance * quantity;
            }
        });
    }

    const totalXP = currentCharacterData.totalXP || 0;
    const availableXP = currentCharacterData.availableXP || 0;
    const credits = currentCharacterData.startingCredits || 0;

    document.getElementById('total-xp-display').textContent = totalXP;
    document.getElementById('available-xp-display').textContent = availableXP;
    document.getElementById('encumbrance-threshold').textContent = encumbranceThreshold;
    document.getElementById('encumbrance-current').textContent = currentEncumbrance;
    document.getElementById('credits-display').textContent = credits;
    
    document.getElementById('soak-input').value = soakValue;
    document.getElementById('melee-defense-input').value = defenseMelee;
    document.getElementById('ranged-defense-input').value = defenseRanged;
}

function updateTopStatsHeader() {
    if (!currentCharacterData || !currentCharacterData.characteristics) return;

    const brawn = currentCharacterData.characteristics.brawn || 0;
    const encumbranceThreshold = 5 + brawn;

    let currentEncumbrance = 0;
    if (currentCharacterData.inventory) {
        currentCharacterData.inventory.forEach(item => {
            const itemDetails = masterGearList[item.id];
            if (itemDetails && itemDetails.encumbrance) {
                const quantity = item.quantity || 1;
                currentEncumbrance += itemDetails.encumbrance * quantity;
            }
        });
    }

    const totalXP = currentCharacterData.totalXP || 0;
    const availableXP = currentCharacterData.availableXP || 0;
    const credits = currentCharacterData.startingCredits || 0;

    document.getElementById('total-xp-display').textContent = totalXP;
    document.getElementById('available-xp-display').textContent = availableXP;
    document.getElementById('encumbrance-threshold').textContent = encumbranceThreshold;
    document.getElementById('encumbrance-current').textContent = currentEncumbrance;
    document.getElementById('credits-display').textContent = credits;
}

function populateSkills() {
    const containers = {
        general: document.getElementById('general-skills-grid'),
        combat: document.getElementById('combat-skills-grid'),
        knowledge: document.getElementById('knowledge-skills-grid'),
        custom: document.getElementById('custom-skills-grid'),
    };
    const createSkillRow = (skill) => `<div class="skill-row" data-skill-name="${skill.name}">
        <span class="skill-name-clickable">${skill.name} (${skill.char})</span>
        <label><input type="checkbox" /> Career</label>
        <div class="rank-circles" data-rank="0" data-ability-ranks="0" data-proficiency-ranks="0">
            ${[...Array(5)].map((_, i) => `<span data-value="${i + 1}"></span>`).join('')}
        </div>
    </div>`;
    
    const createCustomSkillRow = () => `<div class="skill-row">
        <span><input type="text" placeholder="Skill Name (Char)" /></span>
        <label><input type="checkbox" /> Career</label>
        <div class="rank-circles" data-rank="0" data-ability-ranks="0" data-proficiency-ranks="0">
            ${[...Array(5)].map((_, i) => `<span data-value="${i + 1}"></span>`).join('')}
        </div>
    </div>`;

    Object.keys(masterSkillsList).forEach(category => {
        if (containers[category]) {
            containers[category].innerHTML = masterSkillsList[category].map(createSkillRow).join('');
        }
    });
    if (containers.custom) {
        containers.custom.innerHTML = [...Array(3)].map(createCustomSkillRow).join('');
    }
}

function updateSingleRankDisplay(spanElement, state) {
    spanElement.className = '';
    spanElement.setAttribute('data-state', state);
    switch (state) {
        case 'ability':
            spanElement.textContent = '◆';
            spanElement.classList.add('ability-rank');
            break;
        case 'proficiency':
            spanElement.textContent = '⬢';
            spanElement.classList.add('proficiency-rank');
            break;
        default:
            spanElement.textContent = '';
            spanElement.classList.add('empty-rank');
            break;
    }
}

function updateSkillRankDataAttributes(container) {
    if (!container) return;
    let abilityRanks = 0;
    let proficiencyRanks = 0;
    container.querySelectorAll('span[data-value]').forEach(span => {
        const state = span.getAttribute('data-state');
        if (state === 'ability') abilityRanks++;
        else if (state === 'proficiency') proficiencyRanks++;
    });
    container.setAttribute('data-ability-ranks', abilityRanks);
    container.setAttribute('data-proficiency-ranks', proficiencyRanks);
    container.setAttribute('data-rank', abilityRanks + proficiencyRanks);
}

async function signupUser(email, password) {
    if (!email || !password) return displayMessage("Email and password are required.", 'error');
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        displayMessage("Sign up successful! Redirecting...", 'info');
    } catch (error) {
        const message = error.code === 'auth/email-already-in-use' ? 'This email is already registered.' :
                      error.code === 'auth/weak-password' ? 'Password must be at least 6 characters.' : error.message;
        displayMessage(message, 'error');
    }
}

async function loginUser(email, password) {
    if (!email || !password) return displayMessage("Email and password are required.", 'error');
    try {
        await signInWithEmailAndPassword(auth, email, password);
        displayMessage("Login successful! Redirecting...", 'info');
    } catch (error) {
        const message = (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') ?
                      "Invalid email or password." : `Login error: ${error.message}`;
        displayMessage(message, 'error');
    }
}

async function logoutUser() {
    try {
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        displayMessage(`Logout error: ${error.message}`, 'error', 'save-load-message');
    }
}

async function updateUserEmail() {
    const newEmail = document.getElementById('new-email-input').value;
    if (!newEmail) {
        return displayMessage("Please enter a new email address.", "error", "account-message");
    }

    try {
        await updateEmail(auth.currentUser, newEmail);
        displayMessage("Email address updated successfully!", "info", "account-message");
    } catch (error) {
        console.error("Error updating email: ", error);
        // Common error is needing recent login, prompt user to re-authenticate
        if (error.code === 'auth/requires-recent-login') {
            displayMessage("This action is sensitive. Please log out and log back in to update your email.", "error", "account-message");
        } else {
            displayMessage(`Error: ${error.message}`, "error", "account-message");
        }
    }
}

async function updateUserPassword() {
    const newPassword = document.getElementById('new-password-input').value;
    if (!newPassword) {
        return displayMessage("Please enter a new password.", "error", "account-message");
    }

    try {
        await updatePassword(auth.currentUser, newPassword);
        displayMessage("Password updated successfully!", "info", "account-message");
    } catch (error) {
        console.error("Error updating password: ", error);
        if (error.code === 'auth/requires-recent-login') {
            displayMessage("This action is sensitive. Please log out and log back in to update your password.", "error", "account-message");
        } else if (error.code === 'auth/weak-password') {
            displayMessage("Password should be at least 6 characters.", "error", "account-message");
        } else {
            displayMessage(`Error: ${error.message}`, "error", "account-message");
        }
    }
}

async function displayUserCharacters() {
    const characterListDiv = document.getElementById('character-list');
    const loadingMessage = document.getElementById('loading-characters-message');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    if (!characterListDiv || !loadingMessage) return;

    const characterCollectionRef = collection(db, `users/${userId}/character_sheets`);
    try {
        const querySnapshot = await getDocs(characterCollectionRef);
        loadingMessage.style.display = 'none';
        if (querySnapshot.empty) {
            characterListDiv.innerHTML = '<p>No characters found. Create one to get started!</p>';
            characterListDiv.classList.add('empty');
        } else {
            characterListDiv.classList.remove('empty');
            characterListDiv.innerHTML = ''; 
            querySnapshot.forEach(doc => {
                const character = doc.data();
                const card = document.createElement('div');
                card.className = 'character-card';
                card.dataset.id = doc.id;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'character-card-checkbox';
                checkbox.dataset.id = doc.id;
                
                card.innerHTML = `
                    <h2>${character.characterName || 'Unnamed Character'}</h2>
                    <p>${character.species || 'No species'} | ${character.career || 'No career'}</p>
                `;
                card.appendChild(checkbox);

                card.addEventListener('click', (e) => {
                    if (e.target.type !== 'checkbox') {
                        window.location.href = `character-sheet.html?id=${doc.id}`;
                    }
                });

                checkbox.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    card.classList.toggle('selected', e.target.checked);
                    const anySelected = document.querySelector('.character-card-checkbox:checked');
                    if (deleteSelectedBtn) {
                        deleteSelectedBtn.style.display = anySelected ? 'inline-block' : 'none';
                    }
                });

                characterListDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Error fetching characters: ", error);
        loadingMessage.textContent = "Error loading characters.";
    }
}

async function deleteSelectedCharacters() {
    const selectedCheckboxes = document.querySelectorAll('.character-card-checkbox:checked');
    if (selectedCheckboxes.length === 0) return alert("Please select characters to delete.");
    if (!confirm(`Are you sure you want to delete ${selectedCheckboxes.length} character(s)?`)) return;
    const batch = writeBatch(db);
    selectedCheckboxes.forEach(checkbox => {
        batch.delete(doc(db, `users/${userId}/character_sheets`, checkbox.dataset.id));
    });
    try {
        await batch.commit();
        displayUserCharacters(); 
    } catch (error) {
        console.error("Error deleting characters: ", error);
        alert("An error occurred while deleting characters.");
    }
}

async function deleteSingleCharacter() {
    const characterId = new URLSearchParams(window.location.search).get('id');
    if (!characterId) return alert("Cannot delete a character that hasn't been saved yet.");
    if (!confirm("Are you sure you want to permanently delete this character?")) return;
    try {
        await deleteDoc(doc(db, `users/${userId}/character_sheets`, characterId));
        window.location.href = 'character-hub.html';
    } catch (error) {
        displayMessage("Error deleting character.", "error", "save-load-message");
    }
}

async function createCampaign() {
    const hubNameInput = document.getElementById('campaign-name-input');
    const hubName = hubNameInput.value.trim();

    if (!hubName) {
        displayMessage("Please enter a campaign name.", "error", "campaign-message");
        return;
    }

    try {
        const hubsCollection = collection(db, 'hubs');
        const newHubRef = await addDoc(hubsCollection, {
            hubName: hubName,
            gmUserId: userId,
            playerUserIds: [],
            createdAt: serverTimestamp()
        });
        displayMessage("Campaign created successfully!", "info", "campaign-message");
        hubNameInput.value = '';
        // In the future, this will redirect to the campaign view page. For now, we'll just refresh the list.
        displayUserCampaigns(); 
    } catch (error) {
        console.error("Error creating campaign: ", error);
        displayMessage("Failed to create campaign.", "error", "campaign-message");
    }
}

async function joinCampaign() {
    const hubIdInput = document.getElementById('campaign-join-id-input');
    const hubId = hubIdInput.value.trim();

    if (!hubId) {
        displayMessage("Please enter a Campaign ID.", "error", "campaign-message");
        return;
    }

    try {
        const hubRef = doc(db, 'hubs', hubId);
        const hubDoc = await getDoc(hubRef);

        if (!hubDoc.exists()) {
            displayMessage("Campaign ID not found.", "error", "campaign-message");
            return;
        }

        const hubData = hubDoc.data();
        // Prevent GM from joining their own game as a player or re-joining
        if (hubData.gmUserId === userId || hubData.playerUserIds.includes(userId)) {
            displayMessage("You are already a member of this campaign.", "info", "campaign-message");
            return;
        }

        const updatedPlayerIds = [...hubData.playerUserIds, userId];
        await setDoc(hubRef, { playerUserIds: updatedPlayerIds }, { merge: true });

        displayMessage("Successfully joined the campaign!", "info", "campaign-message");
        hubIdInput.value = '';
        displayUserCampaigns();
    } catch (error) {
        console.error("Error joining campaign: ", error);
        displayMessage("Failed to join campaign.", "error", "campaign-message");
    }
}

async function displayUserCampaigns() {
    const campaignListDiv = document.getElementById('campaign-list');
    const loadingMessage = document.getElementById('loading-campaigns-message');
    if (!campaignListDiv || !loadingMessage) return;

    try {
        const hubsRef = collection(db, 'hubs');
        const gmQuery = query(hubsRef, where("gmUserId", "==", userId));
        const playerQuery = query(hubsRef, where("playerUserIds", "array-contains", userId));

        const [gmSnapshot, playerSnapshot] = await Promise.all([
            getDocs(gmQuery),
            getDocs(playerQuery)
        ]);

        const campaigns = new Map();
        gmSnapshot.forEach(doc => campaigns.set(doc.id, { id: doc.id, ...doc.data() }));
        playerSnapshot.forEach(doc => campaigns.set(doc.id, { id: doc.id, ...doc.data() }));

        loadingMessage.style.display = 'none';
        campaignListDiv.innerHTML = '';

        if (campaigns.size === 0) {
            campaignListDiv.innerHTML = '<p>You have not joined or created any campaigns yet.</p>';
        } else {
            campaigns.forEach(campaign => {
                const isGm = campaign.gmUserId === userId;
                const card = document.createElement('div');
                card.className = 'campaign-card';
                card.dataset.id = campaign.id;
                card.innerHTML = `
                    <h3>${campaign.hubName}</h3>
                    <p>Campaign ID: ${campaign.id}</p>
                    <p>Players: ${campaign.playerUserIds.length + 1}</p>
                    <span class="role-badge ${isGm ? 'gm' : ''}">${isGm ? 'Game Master' : 'Player'}</span>
                `;
                // UPDATE: This now links to the campaign view page
                card.addEventListener('click', () => {
                    window.location.href = `campaign-view.html?hubId=${campaign.id}`;
                });
                campaignListDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Error fetching campaigns: ", error);
        loadingMessage.textContent = "Error loading campaigns.";
    }
}

async function displayCampaignCharacters(hubId) {
    const characterListDiv = document.getElementById('campaign-character-list');
    if (!characterListDiv) return;

    const characterCollectionRef = collection(db, `hubs/${hubId}/characters`);
    try {
        const querySnapshot = await getDocs(characterCollectionRef);
        
        if (querySnapshot.empty) {
            characterListDiv.innerHTML = '<p>No characters in this campaign yet. Create one to get started!</p>';
        } else {
            characterListDiv.innerHTML = ''; 
            querySnapshot.forEach(doc => {
                const character = doc.data();
                const card = document.createElement('div');
                card.className = 'character-card';
                card.dataset.id = doc.id;
                
                card.innerHTML = `
                    <h2>${character.characterName || 'Unnamed Character'}</h2>
                    <p>${character.species || 'No species'} | ${character.career || 'No career'}</p>
                `;

                // Link to the character sheet, passing both the Hub ID and Character ID
                card.addEventListener('click', () => {
                    window.location.href = `character-sheet.html?hubId=${hubId}&id=${doc.id}`;
                });
                characterListDiv.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Error fetching campaign characters: ", error);
        characterListDiv.innerHTML = '<p>Error loading characters.</p>';
    }
}

function getCharacterData() {
    const data = {
        characterName: document.getElementById('character-name-input')?.value || '',
        species: document.getElementById('species-input')?.value || '',
        career: document.getElementById('career-input')?.value || '',
        specializationTrees: document.getElementById('specialization-input')?.value || '',
        totalXP: parseInt(document.getElementById('total-xp-input')?.value) || 0,
        availableXP: parseInt(document.getElementById('available-xp-input')?.value) || 0,
        characteristics: {
            brawn: parseInt(document.getElementById('brawn-char')?.value) || 0,
            agility: parseInt(document.getElementById('agility-char')?.value) || 0,
            intellect: parseInt(document.getElementById('intellect-char')?.value) || 0,
            cunning: parseInt(document.getElementById('cunning-char')?.value) || 0,
            willpower: parseInt(document.getElementById('willpower-char')?.value) || 0,
            presence: parseInt(document.getElementById('presence-char')?.value) || 0,
        },
        woundsCurrent: document.getElementById('wounds-current-input')?.value || '',
        woundsThreshold: document.getElementById('wounds-threshold-input')?.value || '',
        strainCurrent: document.getElementById('strain-current-input')?.value || '',
        strainThreshold: document.getElementById('strain-threshold-input')?.value || '',
        soakValue: document.getElementById('soak-input')?.value || 0,
        defenseMelee: document.getElementById('melee-defense-input')?.value || 0,
        defenseRanged: document.getElementById('ranged-defense-input')?.value || 0,
        skills: [],
        inventory: [],
    };
    
    document.querySelectorAll('.skill-row').forEach(row => {
        const skillName = row.dataset.skillName;
        if (skillName) {
            const isCareer = row.querySelector('input[type="checkbox"]').checked;
            const rankContainer = row.querySelector('.rank-circles');
            const rank = parseInt(rankContainer.dataset.rank) || 0;
            if (rank > 0) {
                 data.skills.push({ name: skillName, isCareer, rank });
            }
        }
    });

    document.querySelectorAll('#inventory-list .inventory-item').forEach(itemEl => {
        data.inventory.push({
            id: itemEl.dataset.itemId,
            equipped: itemEl.dataset.equipped === 'true' 
        });
    });
    return data;
}

function populateCharacterData(data) {
    if (!data) return;

    function getFullCharName(abbr) {
        switch (abbr) {
            case 'br': return 'brawn';
            case 'ag': return 'agility';
            case 'int': return 'intellect';
            case 'cun': return 'cunning';
            case 'will': return 'willpower';
            case 'pr': return 'presence';
            default: return '';
            updateSkillRankDataAttributes(rankContainer);
        }
    }

    const specTalentsListDiv = document.getElementById('talents-list');
    const bonusTalentsListDiv = document.getElementById('bonus-talents-list');

    if (specTalentsListDiv) {
        specTalentsListDiv.innerHTML = ''; 
        const specKey = data.specializationTrees?.toLowerCase().replace(/\s+/g, '-');
        const specTree = specializationTalentTrees[specKey];

        if (specTree && data.specializationTalents && data.specializationTalents.length > 0) {
            data.specializationTalents.forEach(talentIndex => {
                const talentId = specTree.layout[talentIndex]?.id;
                const talent = masterTalentsList[talentId];
                if (talent) {
                    const talentEl = document.createElement('div');
                    talentEl.className = 'talent-item';
                    talentEl.innerHTML = `<h4>${talent.name}</h4><p>${talent.description}</p>`;
                    specTalentsListDiv.appendChild(talentEl);
                }
            });
        } else {
            specTalentsListDiv.innerHTML = '<p>No talents purchased from specialization tree.</p>';
        }
    }

    if (bonusTalentsListDiv) {
        bonusTalentsListDiv.innerHTML = '';
        if (data.bonusTalents && data.bonusTalents.length > 0) {
            data.bonusTalents.forEach(talentId => {
                const talent = masterTalentsList[talentId];
                if (talent) {
                    const talentEl = document.createElement('div');
                    talentEl.className = 'talent-item';
                    talentEl.innerHTML = `<h4>${talent.name}</h4><p>${talent.description}</p>`;
                    bonusTalentsListDiv.appendChild(talentEl);
                }
            });
        } else {
            bonusTalentsListDiv.innerHTML = '<p>No talents granted by species or other sources.</p>';
        }
    }

    if (!data.skills) data.skills = [];
    if (!data.inventory) data.inventory = [];

    // Populate standard fields
    document.getElementById('character-name-input').value = data.characterName || '';
    document.getElementById('species-input').value = data.species || '';
    document.getElementById('career-input').value = data.career || '';
    document.getElementById('specialization-input').value = data.specializationTrees || '';
    if (data.characteristics) {
        for (const [char, value] of Object.entries(data.characteristics)) {
            const input = document.getElementById(`${char}-char`);
            if (input) input.value = value || 0;
        }
    }
    document.getElementById('wounds-current-input').value = data.woundsCurrent || '';
    document.getElementById('wounds-threshold-input').value = data.woundsThreshold || '';
    document.getElementById('strain-current-input').value = data.strainCurrent || '';
    document.getElementById('strain-threshold-input').value = data.strainThreshold || '';
    
    // Populate Skills
    if (data.skills && data.characteristics) {
        const skillCharMap = new Map();
        Object.values(masterSkillsList).flat().forEach(skill => {
            skillCharMap.set(skill.name, skill.char.toLowerCase());
        });

        document.querySelectorAll('.skill-row').forEach(row => {
            const skillName = row.dataset.skillName;
            if (!skillName) return;
            
            const savedSkill = data.skills.find(s => s.name === skillName);
            const rank = savedSkill ? savedSkill.rank : 0;
            const isCareer = savedSkill ? savedSkill.isCareer : false;
            const charAbbr = skillCharMap.get(skillName);
            const charKey = getFullCharName(charAbbr);
            const charValue = data.characteristics[charKey] || 0;
            
            const totalDice = Math.max(charValue, rank);
            const proficiencyDice = Math.min(charValue, rank);
            
            const careerLabel = row.querySelector('label');
            if (careerLabel) {
                 careerLabel.innerHTML = `<input type="checkbox" ${isCareer ? 'checked' : ''} disabled> Career <span class="skill-rank-number">(${rank})</span>`;
            }
            
            const rankContainer = row.querySelector('.rank-circles');
            const rankSpans = rankContainer.querySelectorAll('span');
            
            rankSpans.forEach((span, index) => {
                if (index < proficiencyDice) {
                    updateSingleRankDisplay(span, 'proficiency');
                } else if (index < totalDice) {
                    updateSingleRankDisplay(span, 'ability');
                } else {
                    updateSingleRankDisplay(span, 'empty');
                }
            });
            updateSkillRankDataAttributes(rankContainer);
        });
    }

    const talentsListDiv = document.getElementById('talents-list');
    if (talentsListDiv && data.specializationTrees) { // Simplified check
        talentsListDiv.innerHTML = ''; // Clear previous talents
        const specTree = specializationTalentTrees[data.specializationTrees.toLowerCase().replace(/\s+/g, '-')];
        if (specTree && data.talents && data.talents.length > 0) {
            data.talents.forEach(talentIndex => {
                const talentId = specTree.layout[talentIndex]?.id;
                const talent = masterTalentsList[talentId];
                if (talent) {
                    const talentEl = document.createElement('div');
                    talentEl.className = 'talent-item';
                    talentEl.innerHTML = `
                        <h4>${talent.name}</h4>
                        <p>${talent.description}</p>
                    `;
                    talentsListDiv.appendChild(talentEl);
                }
            });
        } else {
            talentsListDiv.innerHTML = '<p>No talents purchased from specialization tree.</p>';
        }
    }

    renderWeapons(data.inventory);
    renderInventory(data.inventory);
    renderEquippedArmor(data.inventory);
    updateCharacterStats(); 
    updateTopStatsHeader();
}

function renderWeapons(inventoryData = []) {
    const weaponsListDiv = document.getElementById('weapons-list');
    if (!weaponsListDiv) return;

    const header = weaponsListDiv.querySelector('.weapon-header');
    weaponsListDiv.innerHTML = '';
    if (header) {
        weaponsListDiv.appendChild(header);
    }

    const allWeapons = inventoryData.filter(item => {
        const itemDetails = masterGearList[item.id];
        return itemDetails && itemDetails.type === 'weapon';
    });

    if (allWeapons.length === 0) {
        const noWeaponsRow = document.createElement('div');
        noWeaponsRow.className = 'weapon-row';
        noWeaponsRow.textContent = 'No weapons in inventory.';
        noWeaponsRow.style.gridColumn = '1 / -1';
        noWeaponsRow.style.textAlign = 'center';
        noWeaponsRow.style.padding = '1rem';
        weaponsListDiv.appendChild(noWeaponsRow);
        return;
    }

    allWeapons.forEach(item => {
        const itemDetails = masterGearList[item.id];
        const weaponRow = document.createElement('div');
        weaponRow.className = 'weapon-row';
        weaponRow.dataset.itemId = item.id;

        // Use the new parser for the 'special' field
        const specialHTML = parseAndDisplaySpecialAbilities(itemDetails.special);

        weaponRow.innerHTML = `
            <span>${itemDetails.name}</span>
            <span>${itemDetails.skill || 'N/A'}</span>
            <span>${itemDetails.damage !== undefined ? itemDetails.damage : 'N/A'}</span>
            <span>${itemDetails.crit !== undefined ? itemDetails.crit : 'N/A'}</span>
            <span>${itemDetails.range || 'N/A'}</span>
            <span>${specialHTML}</span>
            <span>
                <button class="attack-btn weapon-action-button" data-item-id="${item.id}">Attack</button>
            </span>
        `;
        weaponsListDiv.appendChild(weaponRow);
    });
}

function renderEquippedArmor(inventoryData = []) {
    const armorDisplay = document.getElementById('equipped-armor-display');
    if (!armorDisplay) return;

    const equippedArmor = inventoryData.find(item => item.equipped && masterGearList[item.id]?.type === 'armor');

    if (equippedArmor) {
        const armorDetails = masterGearList[equippedArmor.id];
        armorDisplay.innerHTML = `
            <div class="equipped-armor-card">
                <h3>${armorDetails.name}</h3>
                <div class="equipped-armor-stats">
                    <span>Soak: ${armorDetails.soak || 0}</span>
                    <span>Defense: ${armorDetails.defense || 0}</span>
                    <span>Encumbrance: ${armorDetails.encumbrance || 0}</span>
                    <span>HP: ${armorDetails.hp || 0}</span>
                </div>
                <p class="equipped-armor-description">${armorDetails.description || 'No description available.'}</p>
            </div>
        `;
    } else {
        armorDisplay.innerHTML = '<p>No armor equipped.</p>';
    }
}

function renderInventory(inventoryData = []) {
    const inventoryListDiv = document.getElementById('inventory-list');
    if (!inventoryListDiv) return;
    inventoryListDiv.innerHTML = '';

    if (inventoryData.length === 0) {
        inventoryListDiv.innerHTML = '<p>Your inventory is empty.</p>';
        return;
    }

    inventoryData.forEach(itemData => {
        const itemDetails = masterGearList[itemData.id];
        if (itemDetails) {
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            itemEl.dataset.itemId = itemData.id;
            
            let actionButtonsHTML = '';
            if (itemDetails.type === 'armor') {
                const buttonText = itemData.equipped ? 'Unequip' : 'Equip';
                actionButtonsHTML = `<button class="equip-btn" data-item-id="${itemData.id}">${buttonText}</button>`;
            }
            
            itemEl.innerHTML = `
                <div class="item-header">
                    <span class="toggle-arrow">▶</span>
                    <span class="item-name">${itemDetails.name}</span>
                    <div class="item-actions">
                        ${actionButtonsHTML}
                        <button class="remove-item-btn" data-item-id="${itemData.id}">Delete</button>
                    </div>
                </div>
                <div class="item-description">${itemDetails.description || 'No description available.'}</div>
            `;
            inventoryListDiv.appendChild(itemEl);
        }
    });
}

function addItemToInventory(itemId) {
    const itemDetails = masterGearList[itemId];
    if (!itemDetails) return;
    const inventoryListDiv = document.getElementById('inventory-list');
    if (inventoryListDiv.querySelector(`[data-item-id="${itemId}"]`)) {
        return displayMessage(`${itemDetails.name} is already in your inventory.`, 'info', 'save-load-message');
    }
    const itemEl = document.createElement('div');
    itemEl.className = 'inventory-item';
    itemEl.dataset.itemId = itemId;
    itemEl.dataset.equipped = 'false';
    itemEl.innerHTML = `
        <div class="item-header">
            <span class="toggle-arrow">▶</span>
            <span class="item-name">${itemDetails.name}</span>
            <button class="equip-btn">Equip</button>
            <button class="remove-item-btn">X</button>
        </div>
        <div class="item-description">${itemDetails.description || 'No description available.'}</div>
    `;
    inventoryListDiv.appendChild(itemEl);
    autoSaveCharacter(); 
}



async function autoSaveCharacter() {
    if (isSaving || !isAuthReady || !auth.currentUser) return;
    if (!document.getElementById('character-name-input')) return;

    // --- NEW: Permission Check ---
    const isGm = currentCharacterData.hubGmId === userId; // We'll store GM ID on the character data
    const isOwner = currentCharacterData.ownerId === userId;
    const isCampaignCharacter = !!currentCharacterData.hubGmId;

    if (isCampaignCharacter && !isGm && !isOwner) {
        // If it's a campaign character and the user is neither the GM nor the owner, do not save.
        return;
    }
    
    isSaving = true;
    displayMessage("Saving...", "info", "save-load-message");

    // The rest of the function remains the same...
    if (currentCharacterData && currentCharacterData.characteristics) {
        currentCharacterData.characterName = document.getElementById('character-name-input')?.value || '';
        currentCharacterData.species = document.getElementById('species-input')?.value || '';
        currentCharacterData.career = document.getElementById('career-input')?.value || '';
        currentCharacterData.specializationTrees = document.getElementById('specialization-input')?.value || '';

        currentCharacterData.characteristics.brawn = parseInt(document.getElementById('brawn-char')?.value) || 0;
        currentCharacterData.characteristics.agility = parseInt(document.getElementById('agility-char')?.value) || 0;
        currentCharacterData.characteristics.intellect = parseInt(document.getElementById('intellect-char')?.value) || 0;
        currentCharacterData.characteristics.cunning = parseInt(document.getElementById('cunning-char')?.value) || 0;
        currentCharacterData.characteristics.willpower = parseInt(document.getElementById('willpower-char')?.value) || 0;
        currentCharacterData.characteristics.presence = parseInt(document.getElementById('presence-char')?.value) || 0;

        currentCharacterData.woundsCurrent = document.getElementById('wounds-current-input')?.value || '';
        currentCharacterData.woundsThreshold = document.getElementById('wounds-threshold-input')?.value || '';
        currentCharacterData.strainCurrent = document.getElementById('strain-current-input')?.value || '';
        currentCharacterData.strainThreshold = document.getElementById('strain-threshold-input')?.value || '';
    }

    const characterDataToSave = currentCharacterData;
    const urlParams = new URLSearchParams(window.location.search);
    const characterId = urlParams.get('id');
    const hubId = urlParams.get('hubId');

    try {
        if (characterId) {
            let docRef;
            if (hubId) {
                docRef = doc(db, `hubs/${hubId}/characters`, characterId);
                // Store GM ID for future permission checks
                const hubDoc = await getDoc(doc(db, 'hubs', hubId));
                if (hubDoc.exists()) {
                    characterDataToSave.hubGmId = hubDoc.data().gmUserId;
                }
            } else {
                docRef = doc(db, `users/${userId}/character_sheets`, characterId);
            }
            await setDoc(docRef, characterDataToSave, { merge: true });
        } else {
            // New character logic remains the same; it's handled by finalizeCharacterCreation
        }
        setTimeout(() => displayMessage("All changes saved.", "info", "save-load-message"), 500);
    } catch (e) {
        displayMessage(`Error saving: ${e.message}`, 'error', 'save-load-message');
    } finally {
        isSaving = false;
    }
}

async function loadCharacter() {
    const urlParams = new URLSearchParams(window.location.search);
    const characterId = urlParams.get('id');
    const hubId = urlParams.get('hubId');

    if (!characterId) {
        clearCharacterSheet();
        return;
    }
    if (!isAuthReady || !auth.currentUser) return;

    try {
        let docRef;
        if (hubId) {
            docRef = doc(db, `hubs/${hubId}/characters`, characterId);
            // Fetch campaign data at the same time
            const hubRef = doc(db, 'hubs', hubId);
            const hubDoc = await getDoc(hubRef);
            if (hubDoc.exists()) {
                setupSheetForCampaign(hubDoc.data(), hubId);
            }
        } else {
            docRef = doc(db, `users/${userId}/character_sheets`, characterId);
        }

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            currentCharacterData = docSnap.data();
            populateCharacterData(currentCharacterData);
        } else {
            displayMessage("Character not found.", 'error', 'save-load-message');
            clearCharacterSheet();
        }
    } catch (e) {
        displayMessage(`Error loading character: ${e.message}`, 'error', 'save-load-message');
    }
}

function clearCharacterSheet() {
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        input.value = (input.type === 'number') ? 0 : '';
    });
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
    document.querySelectorAll('.rank-circles').forEach(container => {
        container.querySelectorAll('span').forEach(span => updateSingleRankDisplay(span, 'empty'));
        updateSkillRankDataAttributes(container);
    });
    renderInventory([]);
}

function setupAutoSaveListeners() {
    document.querySelectorAll('input[type="text"], input[type="number"], input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', autoSaveCharacter);
    });
    const skillsLayout = document.querySelector('.skills-layout');
    if (skillsLayout) {
        skillsLayout.addEventListener('click', (event) => {
            if (event.target.closest('.rank-circles span')) {
                autoSaveCharacter();
            }
        });
    }
}

// --- DICE FUNCTIONS ---
const resultSymbols = {
    success: '<img src="https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Success.png?alt=media&token=037352b3-c654-4bd0-b21b-9cd4d5abc034" class="dice-result-icon" alt="Success">',
    advantage: '<img src="https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Advantage.png?alt=media&token=0ab112fb-ed4c-4e2e-bad8-7fb249a2d97e" class="dice-result-icon" alt="Advantage">',
    triumph: '<img src="https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Triumph.png?alt=media&token=7c0a4dfd-9268-4a13-b3d5-3b7d439c11d2" class="dice-result-icon" alt="Triumph">',
    failure: '<img src="https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Failure.png?alt=media&token=868326b1-65f9-447c-8b5e-24d8ec0935b8" class="dice-result-icon" alt="Failure">',
    threat: '<img src="https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Threat.png?alt=media&token=003e3e71-5fa0-42e5-8001-62eceae7030d" class="dice-result-icon" alt="Threat">',
    despair: '<img src="https://firebasestorage.googleapis.com/v0/b/star-wars-character-app.firebasestorage.app/o/Dispair.png?alt=media&token=c03807ee-3e40-4b2a-9b97-d06c3a51857c class="dice-result-icon" alt="Despair">'
};

const diceFaces = {
    ability: [[], [resultSymbols.success], [resultSymbols.success], [resultSymbols.success, resultSymbols.success], [resultSymbols.advantage], [resultSymbols.success, resultSymbols.advantage], [resultSymbols.advantage, resultSymbols.advantage], [resultSymbols.success, resultSymbols.advantage]],
    proficiency: [[], [resultSymbols.success], [resultSymbols.success], [resultSymbols.success, resultSymbols.success], [resultSymbols.success, resultSymbols.success], [resultSymbols.advantage], [resultSymbols.success, resultSymbols.advantage], [resultSymbols.success, resultSymbols.advantage], [resultSymbols.success, resultSymbols.advantage], [resultSymbols.advantage, resultSymbols.advantage], [resultSymbols.advantage, resultSymbols.advantage], [resultSymbols.triumph]],
    boost: [[], [], [resultSymbols.success], [resultSymbols.success, resultSymbols.advantage], [resultSymbols.advantage, resultSymbols.advantage], [resultSymbols.advantage]],
    difficulty: [[], [resultSymbols.failure], [resultSymbols.failure, resultSymbols.failure], [resultSymbols.threat], [resultSymbols.threat], [resultSymbols.threat], [resultSymbols.threat, resultSymbols.threat], [resultSymbols.failure, resultSymbols.threat]],
    challenge: [[], [resultSymbols.failure], [resultSymbols.failure], [resultSymbols.failure, resultSymbols.failure], [resultSymbols.failure, resultSymbols.failure], [resultSymbols.threat], [resultSymbols.threat], [resultSymbols.failure, resultSymbols.threat], [resultSymbols.failure, resultSymbols.threat], [resultSymbols.threat, resultSymbols.threat], [resultSymbols.threat, resultSymbols.threat], [resultSymbols.despair]],
    setback: [[], [], [resultSymbols.failure], [resultSymbols.failure], [resultSymbols.threat], [resultSymbols.threat]]
};

function rollSingleDie(type) {
    return diceFaces[type][Math.floor(Math.random() * diceFaces[type].length)];
}

let currentItemForAttack = null; 

function displayActiveAbilityOptions(itemId, availableAdvantage, attackHit, availableTriumph) {
    const item = masterGearList[itemId];
    if (!item) return;

    const resultsDiv = document.getElementById("dice-results");
    resultsDiv.querySelector('.active-ability-options')?.remove();
    resultsDiv.querySelector('.ability-btn')?.remove();

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'active-ability-options';
    
    // This is the corrected part: Always use the central 'currentRollContext'
    // instead of local variables that get reset.
    const advantageLeft = currentRollContext.advantage;
    const triumphLeft = currentRollContext.triumph;

    const specialText = item.special || "";

    // Critical Hit Button Logic
    if (currentRollContext.isCombatRoll && item.crit > 0) {
        const critCost = item.crit;
        const btn = document.createElement('button');
        btn.className = 'ability-btn';
        btn.textContent = `Critical Hit (Cost: ${critCost} Adv)`;
        btn.disabled = !attackHit || advantageLeft < critCost;
        btn.onclick = () => {
            currentRollContext.advantage -= critCost;
            handleCriticalHit(); 
            populateSpendOptions();
        };
        optionsContainer.appendChild(btn);
    }

    // Auto-fire
    if (specialText.includes('Auto-fire')) {
        const cost = masterAbilityList['Auto-fire'].cost;
        const btn = document.createElement('button');
        btn.className = 'ability-btn';
        btn.textContent = `Auto-fire (Cost: ${cost} Adv)`;
        btn.disabled = advantageLeft < cost || !attackHit;
        btn.onclick = () => {
            currentRollContext.advantage -= cost;
            displayMessage(`Hit again with Auto-fire! ${currentRollContext.advantage} Advantage remaining.`, 'info', 'save-load-message');
            populateSpendOptions();
        };
        optionsContainer.appendChild(btn);
    }
    
    // Knockdown
    if (specialText.includes('Knockdown')) {
        const cost = 2; 
        const btn = document.createElement('button');
        btn.className = 'ability-btn';
        btn.textContent = `Knockdown (Cost: ${cost} Adv)`;
        btn.disabled = advantageLeft < cost || !attackHit;
        btn.onclick = () => {
            currentRollContext.advantage -= cost;
            displayMessage(`Target knocked prone! ${currentRollContext.advantage} Advantage remaining.`, 'info', 'save-load-message');
            populateSpendOptions();
        };
        optionsContainer.appendChild(btn);
    }

    // Stun
    if (specialText.includes('Stun') && !specialText.includes('Stun Damage')) {
        const stunRatingMatch = specialText.match(/Stun (\d+)/i);
        const stunRating = stunRatingMatch ? parseInt(stunRatingMatch[1]) : 1;
        const cost = 2; 
        const btn = document.createElement('button');
        btn.className = 'ability-btn';
        btn.textContent = `Stun (Cost: ${cost} Adv)`;
        btn.disabled = advantageLeft < cost || !attackHit;
        btn.onclick = () => {
            currentRollContext.advantage -= cost;
            displayMessage(`Target suffers ${stunRating} strain! ${currentRollContext.advantage} Advantage remaining.`, 'info', 'save-load-message');
            populateSpendOptions();
        };
        optionsContainer.appendChild(btn);
    }

    // Sunder
    if (specialText.includes('Sunder')) {
        const cost = 1;
        const btn = document.createElement('button');
        btn.className = 'ability-btn';
        btn.textContent = `Sunder (Cost: ${cost} Triumph)`;
        btn.disabled = triumphLeft < cost || !attackHit;
        btn.onclick = () => {
            currentRollContext.triumph -= cost;
            displayMessage(`Target's item is damaged! ${currentRollContext.triumph} Triumph remaining.`, 'info', 'save-load-message');
            populateSpendOptions();
        };
        optionsContainer.appendChild(btn);
    }

    if (optionsContainer.children.length > 0) {
        resultsDiv.appendChild(optionsContainer);
    } else if (attackHit) {
        displayMessage('No abilities can be activated with the current roll.', 'info', 'save-load-message');
    }
}

function handleCriticalHit() {
    if (!currentCharacterData.criticalInjuries) {
        currentCharacterData.criticalInjuries = [];
    }

    const modifier = currentCharacterData.criticalInjuries.length * 10;
    const roll = Math.floor(Math.random() * 100) + 1 + modifier;
    
    let injuryResult = masterCriticalInjuries.find(crit => roll >= crit.range[0] && roll <= crit.range[1]);

    if (injuryResult) {
        currentCharacterData.criticalInjuries.push(injuryResult.result);
        autoSaveCharacter(); // Save the new injury to the character

        // Display the modal
        const modal = document.getElementById('critical-injury-modal');
        const modalBody = document.getElementById('crit-modal-body');
        
        modalBody.innerHTML = `
            <p><strong>Roll:</strong> ${roll} (d100 + ${modifier})</p>
            <p><strong>Severity:</strong> ${injuryResult.severity}</p>
            <p><strong>Result:</strong> ${injuryResult.result}</p>
        `;
        modal.style.display = 'flex';
    }
}

window.rollDice = async function(skillName = 'a roll') {
    const spendSection = document.getElementById('spend-symbols-section');
    if (spendSection) spendSection.style.display = 'none';

    const characterName = document.getElementById('character-name-input')?.value || 'A character';
    const pool = {
        ability: parseInt(document.getElementById("ability")?.value) || 0,
        proficiency: parseInt(document.getElementById("proficiency")?.value) || 0,
        boost: parseInt(document.getElementById("boost")?.value) || 0,
        difficulty: parseInt(document.getElementById("difficulty")?.value) || 0,
        challenge: parseInt(document.getElementById("challenge")?.value) || 0,
        setback: parseInt(document.getElementById("setback")?.value) || 0
    };

    let rawResults = [];
    Object.entries(pool).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) {
            rawResults.push(...rollSingleDie(type));
        }
    });

    let success = 0, advantage = 0, triumph = 0, despair = 0;
    rawResults.forEach(imgTag => {
        if (imgTag.includes('alt="Success"')) success++;
        if (imgTag.includes('alt="Failure"')) success--;
        if (imgTag.includes('alt="Advantage"')) advantage++;
        if (imgTag.includes('alt="Threat"')) advantage--;
        if (imgTag.includes('alt="Triumph"')) { success++; triumph++; }
        if (imgTag.includes('alt="Despair"')) { success--; despair++; }
    });
    
    // Store the results in our global context object
    currentRollContext = {
        advantage: advantage > 0 ? advantage : 0,
        triumph: triumph > 0 ? triumph : 0,
        isCombatRoll: !!window.currentItemForAttack,
        weaponId: window.currentItemForAttack,
        rollSuccess: success > 0
    };

    const finalSummaryParts = [];
    if (success > 0) finalSummaryParts.push(`${success} ${resultSymbols.success}`);
    if (success < 0) finalSummaryParts.push(`${Math.abs(success)} ${resultSymbols.failure}`);
    if (advantage > 0) finalSummaryParts.push(`${advantage} ${resultSymbols.advantage}`);
    if (advantage < 0) finalSummaryParts.push(`${Math.abs(advantage)} ${resultSymbols.threat}`);
    if (triumph > 0) finalSummaryParts.push(`${triumph} ${resultSymbols.triumph}`);
    if (despair > 0) finalSummaryParts.push(`${despair} ${resultSymbols.despair}`);
    
    const summaryHTML = finalSummaryParts.length > 0 ? finalSummaryParts.join(', ') : 'Wash (No net result)';
    const resultsDiv = document.getElementById("dice-results");
    resultsDiv.innerHTML = `<div class="summary-line">${summaryHTML}</div>`;
    
    // If there are symbols to spend, show the new section
    if (currentRollContext.advantage > 0 || currentRollContext.triumph > 0) {
        populateSpendOptions();
    }
    
    const fullResultsHTML = rawResults.length > 0 ? rawResults.join('') : 'None';

    await addDiceRollEntry({ 
        characterName,
        skillName,
        pool, 
        summary: summaryHTML,
        fullResults: fullResultsHTML 
    });
    fetchAndDisplayRollHistory();
    window.currentItemForAttack = null; // Clear the attacking item after the roll is done
};

function populateSpendOptions() {
    const spendSection = document.getElementById('spend-symbols-section');
    const buttonContainer = document.getElementById('ability-activation-buttons');
    if (!spendSection || !buttonContainer) return;

    spendSection.style.display = 'block';
    buttonContainer.innerHTML = ''; // Clear old buttons

    updateRemainingSymbolsDisplay();

    const createButton = (text, cost, action) => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.className = 'ability-btn';
        btn.disabled = currentRollContext.advantage < (cost.advantage || 0) || currentRollContext.triumph < (cost.triumph || 0);
        btn.onclick = () => {
            currentRollContext.advantage -= (cost.advantage || 0);
            currentRollContext.triumph -= (cost.triumph || 0);
            action();
            populateSpendOptions(); // Refresh the UI
        };
        buttonContainer.appendChild(btn);
    };

    // --- Combat Roll Buttons ---
    if (currentRollContext.isCombatRoll && currentRollContext.rollSuccess) {
        const weapon = masterGearList[currentRollContext.weaponId];
        
        // Critical Hit Button
        const critCost = weapon.crit || 1;
        createButton(`Critical Hit (Cost: ${critCost} Adv)`, { advantage: critCost }, () => {
            displayMessage(`Critical Hit triggered!`, 'info', 'save-load-message');
        });

        // Weapon Ability Buttons
        for (const [key, ability] of Object.entries(masterAbilityList)) {
            if (weapon.special?.includes(key) && ability.cost > 0) {
                createButton(`${key} (Cost: ${ability.cost} Adv)`, { advantage: ability.cost }, () => {
                    displayMessage(`${key} activated!`, 'info', 'save-load-message');
                });
            }
            if (weapon.special?.includes(key) && key === "Sunder") {
                 createButton(`Sunder (Cost: 1 Tri)`, { triumph: 1 }, () => {
                    displayMessage(`Sunder activated! Target's item is damaged.`, 'info', 'save-load-message');
                });
            }
        }
    }

    // --- Talent Buttons ---
    if (currentCharacterData.talents) {
        const specTree = specializationTalentTrees[currentCharacterData.specializationTrees.toLowerCase().replace(/\s+/g, '-')];
        if (specTree) {
            currentCharacterData.talents.forEach(talentIndex => {
                const talentId = specTree.layout[talentIndex]?.id;
                const talent = masterTalentsList[talentId];
                if (talent && talent.cost) {
                    const costText = talent.cost.advantage ? `${talent.cost.advantage} Adv` : `${talent.cost.triumph} Tri`;
                    createButton(`${talent.name} (Cost: ${costText})`, talent.cost, () => {
                         displayMessage(`Talent activated: ${talent.name}!`, 'info', 'save-load-message');
                    });
                }
            });
        }
    }
}

function updateRemainingSymbolsDisplay() {
    const display = document.getElementById('remaining-symbols-display');
    if (!display) return;
    display.innerHTML = `Available: ${currentRollContext.advantage} ${resultSymbols.advantage}, ${currentRollContext.triumph} ${resultSymbols.triumph}`;
}

// Add listeners for the custom spend buttons
document.getElementById('custom-advantage-btn')?.addEventListener('click', () => {
    const input = document.getElementById('custom-advantage-spend');
    const amount = parseInt(input.value) || 0;
    if (amount > 0 && currentRollContext.advantage >= amount) {
        currentRollContext.advantage -= amount;
        displayMessage(`Spent ${amount} Advantage for a custom effect.`, 'info', 'save-load-message');
        populateSpendOptions();
        input.value = '';
    }
});

document.getElementById('custom-triumph-btn')?.addEventListener('click', () => {
    const input = document.getElementById('custom-triumph-spend');
    const amount = parseInt(input.value) || 0;
    if (amount > 0 && currentRollContext.triumph >= amount) {
        currentRollContext.triumph -= amount;
        displayMessage(`Spent ${amount} Triumph for a custom effect.`, 'info', 'save-load-message');
        populateSpendOptions();
        input.value = '';
    }
});

async function addDiceRollEntry(rollData) {
    if (!db || !auth.currentUser) return;
    try {
        const rollHistoryCollectionRef = collection(db, `users/${auth.currentUser.uid}/dice_roll_history`);
        await addDoc(rollHistoryCollectionRef, { ...rollData, timestamp: serverTimestamp() });
    } catch (e) { console.error("Error saving dice roll: ", e); }
}

async function fetchAndDisplayRollHistory() {
    const historyList = document.getElementById("history-list");
    if (!historyList || !db || !auth.currentUser) return;
    const q = query(collection(db, `users/${auth.currentUser.uid}/dice_roll_history`), orderBy('timestamp', 'desc'), limit(50));
    try {
        const querySnapshot = await getDocs(q);
        historyList.innerHTML = '';
        if (querySnapshot.empty) {
            historyList.innerHTML = '<li>No roll history found.</li>';
        } else {
            querySnapshot.forEach((doc) => {
                const rollData = doc.data();
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <div class="history-summary">
                        <span class="history-arrow">▶</span>
                        <div><strong>${rollData.characterName}'s</strong> ${rollData.skillName} resulted in <span class="summary-line">${rollData.summary}</span></div>
                    </div>
                    <div class="history-full-results">
                        <strong>Raw Results:</strong> ${rollData.fullResults || 'None'}
                    </div>
                `;
                historyList.appendChild(listItem);
            });
        }
    } catch (e) { console.error("Error fetching roll history: ", e); }
}

function recalculateThresholdsFromTalents(state) {
    const specId = state.specialization;
    if (!specId || !state.talents) {
        return { woundBonus: 0, strainBonus: 0 };
    }

    const treeLayout = specializationTalentTrees[specId]?.layout || [];
    let woundBonus = 0;
    let strainBonus = 0;

    state.talents.forEach(talentIndex => {
        const talentId = treeLayout[talentIndex]?.id;
        const talent = masterTalentsList[talentId];
        if (talent) {
            if (talent.name === 'Toughened') {
                woundBonus += 2;
            } else if (talent.name === 'Grit') {
                strainBonus += 1;
            }
        }
    });
    return { woundBonus, strainBonus };
}

function initializeCreatorWizard() {
    // --- DOM Elements ---
    const nextBtn = document.getElementById('next-step-btn');
    const prevBtn = document.getElementById('prev-step-btn');
    const steps = document.querySelectorAll('.wizard-step');
    const progressSteps = document.querySelectorAll('.progress-step');

    // --- State Management ---
    let currentStep = 1;
    let characterCreatorState = {
        obligation: {
            startingValue: 10,
            types: [{ type: 'debt', value: 10, source: 'starting' }],
            total: 10,
            bonusXp: 0,
            bonusCredits: 0
        },
        talents: [],
        bonusTalents: [],
        skills: {},
        freeSkillRanks: {},
        speciesBonuses: { skills: [], talents: [], choices: {} },
        purchasedGear: {},
        startingCredits: 500
    };
    let initializedSteps = new Set();
    
    if (!masterObligationList.custom) {
        masterObligationList.custom = { name: "Custom Obligation", description: "Enter your own obligation details below." };
    }


    // --- HELPER FUNCTIONS ---
    function setupMasterDetailTabs(listPanelId, detailPanelId) {
        const listPanel = document.getElementById(listPanelId);
        const detailPanel = document.getElementById(detailPanelId);
        if (!listPanel || !detailPanel) return;

        listPanel.addEventListener('click', (e) => {
            if (e.target.classList.contains('master-list-item')) {
                const contentId = e.target.dataset.content;
                listPanel.querySelectorAll('.master-list-item').forEach(item => item.classList.remove('active'));
                e.target.classList.add('active');
                detailPanel.querySelectorAll('.detail-content').forEach(content => {
                    content.style.display = content.id === contentId ? 'block' : 'none';
                });
            }
        });
    }

    function displayTalentTreePreview(specializationId, previewContainer) {
        if (!previewContainer) return;
        previewContainer.innerHTML = '';
        
        const treeData = specializationTalentTrees[specializationId];
        if (!treeData || !treeData.layout) {
            previewContainer.innerHTML = '<p>No talent tree preview available.</p>';
            return;
        }

        const heading = document.createElement('h5');
        heading.textContent = 'Talent Tree Preview';
        previewContainer.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'talent-tree-grid preview';

        treeData.layout.forEach((talentInfo) => {
            const cell = document.createElement('div');
            if (talentInfo && talentInfo.id) {
                const talent = masterTalentsList[talentInfo.id];
                cell.className = 'talent-cell preview';
                cell.innerHTML = `<span class="talent-name">${talent.name}</span>`;
                 if (talentInfo.connects?.down) cell.dataset.connectsDown = 'true';
                 if (talentInfo.connects?.right) cell.dataset.connectsRight = 'true';
            } else {
                 cell.className = 'talent-cell preview';
            }
            grid.appendChild(cell);
        });
        previewContainer.appendChild(grid);
    }

    function applySpeciesBonuses(speciesKey) {
        const species = masterSpeciesList[speciesKey];
        if (!species) return;

        // Clear bonuses from any previously selected species
        if (characterCreatorState.species && characterCreatorState.species !== speciesKey) {
            const oldSpecies = masterSpeciesList[characterCreatorState.species];
            if (oldSpecies && oldSpecies.bonuses) {
                oldSpecies.bonuses.forEach(bonus => {
                    if (bonus.type === 'skill') {
                        delete characterCreatorState.skills[bonus.id];
                        delete characterCreatorState.freeSkillRanks[bonus.id];
                    } else if (bonus.type === 'talent') {
                        characterCreatorState.bonusTalents = characterCreatorState.bonusTalents.filter(t => t !== bonus.id);
                    } else if (bonus.type === 'choice') {
                        bonus.options.forEach(option => {
                            if (option.type === 'skill') {
                                delete characterCreatorState.skills[option.id];
                                delete characterCreatorState.freeSkillRanks[option.id];
                            }
                        });
                    }
                });
            }
        }
        
        characterCreatorState.bonusTalents = []

        if (species.bonuses) {
            species.bonuses.forEach((bonus, index) => {
                if (bonus.type === 'skill') {
                    characterCreatorState.skills[bonus.id] = 1;
                    characterCreatorState.freeSkillRanks[bonus.id] = true;
                } else if (bonus.type === 'talent') {
                    if (!characterCreatorState.bonusTalents.includes(bonus.id)) {
                        characterCreatorState.bonusTalents.push(bonus.id);
                    }
                } else if (bonus.type === 'choice') {
                    // Pre-select the first option by default
                    const defaultChoice = bonus.options[0];
                     if (defaultChoice.type === 'skill') {
                        characterCreatorState.skills[defaultChoice.id] = 1;
                        characterCreatorState.freeSkillRanks[defaultChoice.id] = true;
                    }
                }
            });
        }
    }

    function setupMasterDetailList(config) {
        const listPanel = document.getElementById(config.listPanelId);
        const detailPanel = document.getElementById(config.detailPanelId);
        const searchInput = config.searchInputId ? document.getElementById(config.searchInputId) : null;
        const filterSelect = document.getElementById('species-filter-select'); 

        if (!listPanel || !detailPanel) return;

        const renderDetail = (key) => {
            const item = config.dataSource[key];
            if (!item) {
                detailPanel.innerHTML = '<p>Select an item from the list to see details.</p>';
                return;
            }
            characterCreatorState[config.selectionKey] = key;
            
            if (config.selectionKey === 'species') {
                applySpeciesBonuses(key);
            }

            if(config.onSelectCallback) config.onSelectCallback(key);

            const statsHTML = item.stats ? `<div class="characteristics-display">${Object.entries(item.stats).map(([key, value]) => `<div class="char-item"><div class="char-value">${value}</div><div class="char-label">${key.slice(0,3)}</div></div>`).join('')}</div>` : '';
            
            let otherDataHTML = '<div class="card-details-grid">';
            if (item.woundThreshold) otherDataHTML += `<span class="card-detail-item"><strong>Wound Threshold:</strong> ${item.woundThreshold}</span>`;
            if (item.strainThreshold) otherDataHTML += `<span class="card-detail-item"><strong>Strain Threshold:</strong> ${item.strainThreshold}</span>`;
            if (item.startingXp) otherDataHTML += `<span class="card-detail-item"><strong>Starting XP:</strong> ${item.startingXp}</span>`;
            if (item.freeRanks) otherDataHTML += `<span class="card-detail-item"><strong>Free Skill Ranks:</strong> ${item.freeRanks}</span>`;
            if (item.forceRating) otherDataHTML += `<span class="card-detail-item"><strong>Force Rating:</strong> ${item.forceRating}</span>`;
            otherDataHTML += '</div>';

            let abilitiesHTML = '';
            if (item.specialAbilities) {
                abilitiesHTML = item.specialAbilities.map(ability => {
                    if (ability.title) return `<div class="ability-item"><strong>${ability.title}</strong> ${ability.text}</div>`;
                    return `<div class="ability-item">${ability.text}</div>`;
                }).join('');
                abilitiesHTML = `<div class="abilities-section"><h4>Abilities</h4>${abilitiesHTML}</div>`;
            }
            
            // Generate choice HTML
            let choiceHTML = '';
            if (item.bonuses) {
                item.bonuses.forEach((bonus, index) => {
                    if (bonus.type === 'choice') {
                        choiceHTML += `<div class="species-choice-container" data-choice-index="${index}"><h4>Choose a Bonus</h4>`;
                        bonus.options.forEach(option => {
                            const isChecked = characterCreatorState.speciesBonuses.choices[index] === option.id;
                            choiceHTML += `
                                <label>
                                    <input type="radio" name="species-choice-${index}" value="${option.id}" data-option-type="${option.type}" ${isChecked ? 'checked' : ''}>
                                    1 Rank in ${option.id}
                                </label>
                            `;
                        });
                        choiceHTML += `</div>`;
                    }
                });
            }

            let bottomSectionHTML = '<div class="detail-bottom-section">';
            if (item.homeworld) bottomSectionHTML += `<div class="bottom-info-item"><h4>Homeworld</h4><p>${item.homeworld}</p></div>`;
            if (item.physiology) bottomSectionHTML += `<div class="bottom-info-item"><h4>Physiology</h4><p>${item.physiology}</p></div>`;
            if (item.society) bottomSectionHTML += `<div class="bottom-info-item"><h4>Society</h4><p>${item.society}</p></div>`;
            if (item.language) bottomSectionHTML += `<div class="bottom-info-item"><h4>Language</h4><p>${item.language}</p></div>`;
            if (item.additional) bottomSectionHTML += `<div class="bottom-info-item"><h4>Additional Information</h4><p>${item.additional}</p></div>`;
            bottomSectionHTML += '</div>';


            let skillsHTML = '';
            if(item.careerSkills) {
                skillsHTML = `<div class="card-detail-item skills-list"><strong>Career Skills:</strong> ${item.careerSkills.join(', ')}</div>`;
            }

            detailPanel.innerHTML = `
                <div class="detail-card">
                    <div class="detail-top-section">
                        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" class="detail-card-image">` : ''}
                        <div class="detail-header-content">
                            <h3>${item.name}</h3>
                            <p>${item.description || ''}</p>
                            ${statsHTML}
                            ${otherDataHTML}
                            ${skillsHTML}
                            ${abilitiesHTML}
                            ${choiceHTML}
                        </div>
                    </div>
                    ${bottomSectionHTML}
                </div>`;
            
            detailPanel.querySelectorAll('.species-choice-container').forEach(container => {
                container.addEventListener('change', (e) => {
                    const choiceIndex = e.currentTarget.dataset.choiceIndex;
                    const selectedValue = e.target.value;
                    const speciesData = config.dataSource[characterCreatorState.species];
                    const choiceData = speciesData.bonuses[choiceIndex];
                    
                    choiceData.options.forEach(option => {
                        if (option.type === 'skill') {
                            delete characterCreatorState.skills[option.id];
                            delete characterCreatorState.freeSkillRanks[option.id];
                        }
                    });

                    // Add the new skill choice to state
                    characterCreatorState.skills[selectedValue] = 1;
                    characterCreatorState.freeSkillRanks[selectedValue] = true;
                });
            });
        };

        const populateList = () => {
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const sortValue = filterSelect ? filterSelect.value : 'alpha-asc';

            let filteredItems = Object.entries(config.dataSource).filter(([, item]) => {
                if (config.filterKey === 'career') {
                    const selectedCareerKey = characterCreatorState.career;
                    const selectedCareer = masterCareersList[selectedCareerKey];
                    const specKeys = selectedCareer ? (selectedCareer.specializations || []) : [];
                    const itemNameKey = item.name.toLowerCase().replace(/\s+/g, '-');
                    return specKeys.includes(itemNameKey);
                }

                if (!searchTerm) return true;

                let searchableString = [
                    item.name,
                    item.description,
                    item.homeworld,
                    item.physiology,
                    item.society,
                    item.language,
                    item.additional,
                    item.startingXp,
                    item.woundThreshold,
                    item.strainThreshold,
                    ...(item.stats ? Object.values(item.stats) : []),
                    ...(item.specialAbilities ? item.specialAbilities.map(a => a.text) : []),
                    ...(item.careerSkills ? item.careerSkills : [])
                ].join(' ').toLowerCase();

                return searchableString.includes(searchTerm);
            });

            const [sortKey, sortDir] = sortValue.split('-');
            
            filteredItems.sort(([, a], [, b]) => {
                let valA, valB;

                switch (sortKey) {
                    case 'alpha':
                        return a.name.localeCompare(b.name);
                    case 'xp':
                        valA = a.startingXp || 0;
                        valB = b.startingXp || 0;
                        break;
                    case 'wound':
                    case 'strain':
                        valA = parseInt(a[sortKey + 'Threshold']) || 0;
                        valB = parseInt(b[sortKey + 'Threshold']) || 0;
                        break;
                    default:
                        valA = a.stats?.[sortKey] || 0;
                        valB = b.stats?.[sortKey] || 0;
                        break;
                }

                return sortDir === 'asc' ? valA - valB : valB - valA;
            });

            listPanel.innerHTML = '';
            if (filteredItems.length > 0) {
                filteredItems.forEach(([key, item]) => {
                    const listItem = document.createElement('div');
                    listItem.className = 'master-list-item';
                    listItem.textContent = item.name;
                    listItem.dataset.key = key;
                    listItem.addEventListener('click', () => {
                        listPanel.querySelectorAll('.master-list-item').forEach(el => el.classList.remove('active'));
                        listItem.classList.add('active');
                        renderDetail(key);
                    });
                    listPanel.appendChild(listItem);
                });
                const firstItem = listPanel.querySelector('.master-list-item');
                if (firstItem) {
                    firstItem.classList.add('active');
                    renderDetail(firstItem.dataset.key);
                }
            } else {
                listPanel.innerHTML = '<p>No items match.</p>';
                detailPanel.innerHTML = '';
            }
        };

        if (searchInput) searchInput.addEventListener('input', populateList);
        if (filterSelect) filterSelect.addEventListener('change', populateList);
        
        populateList();
    }
    
    function updateXpDisplay() {
        const xpDisplay = document.getElementById('available-xp-display');
        if (xpDisplay) xpDisplay.textContent = characterCreatorState.availableXp || 0;
    }

    // --- STEP 1: OBLIGATION ---
    function initStep1_Obligation() {
        const listPanel = document.getElementById('obligation-list-panel');
        const detailPanel = document.getElementById('obligation-detail-panel');
        
        listPanel.innerHTML = `
            <div class="master-list-item active" data-content="obligation-rules-content">Obligation Rules</div>
            <div class="master-list-item" data-content="obligation-select-content">Select Obligation</div>
            <div class="master-list-item" data-content="add-obligation-content">Add Obligation</div>
        `;

        detailPanel.innerHTML = `
            <div class="detail-content" id="obligation-rules-content">
<div class="obligation-rules-box">
    <h4>What is Obligation?</h4>
    <p>Obligation is a debt your character owes. It can be tangible (a monetary debt, a bounty on their head) or intangible (a favor owed, a duty to family). This core concept shapes who your character is and can have real effects on gameplay.</p>
    <p>Each Obligation has two parts:</p>
    <ul>
        <li><b>A Narrative Description:</b> The story behind the Obligation, used for roleplaying.</li>
        <li><b>A Numeric Value:</b> The size of the Obligation, which determines its mechanical effects.</li>
    </ul>

    <h4>Starting Obligation</h4>
    <p>Your character's starting Obligation value is based on the number of players in your group. You can choose an Obligation that fits your backstory or create a custom one with your GM's permission.</p>
    <p>You may also choose to increase your starting Obligation value in exchange for additional starting XP or credits. However, you cannot take on more additional Obligation than your starting value. A higher Obligation makes your character more powerful at the start but comes with greater risks during the campaign.</p>

    <h4>Obligation in Play</h4>
    <p>At the beginning of each game session, the GM will make an "Obligation Check" by rolling percentile dice (d100) and comparing it to the entire group's total Obligation value.</p>
    <ul>
        <li>If the roll is <b>higher</b> than the group's total Obligation, nothing happens.</li>
        <li>If the roll is <b>equal to or less than</b> the group's total Obligation, it triggers.</li>
    </ul>

    <h4>Effects of a Triggered Obligation</h4>
    <p>When Obligation triggers, the pressure is on. This has the following effects for the entire session:</p>
    <ul>
        <li>All Player Characters reduce their Strain Threshold by 1.</li>
        <li>The GM will identify which specific character's Obligation was triggered. That character reduces their Strain Threshold by an additional 1 (for a total of -2).</li>
        <li>A narrative event related to the triggered Obligation may occur (e.g., a bounty hunter appears, a debt is called in). This can also be represented as simple mental stress if a story interruption isn't appropriate.</li>
        <li><b>If the dice roll was doubles (11, 22, 33, etc.):</b> The effects are doubled! All characters reduce their Strain Threshold by 2, and the triggered character's is reduced by 4.</li>
    </ul>

    <h4>Managing Your Obligation</h4>
    <p>Over time, you can "settle" your Obligation by spending credits or using other resources to pay it down. Your Obligation value cannot be reduced below 5. Conversely, if your group's total Obligation ever exceeds 100, it will trigger automatically every session, and no one in the group can spend experience points until the total is brought back under 100.</p>
</div>
            </div>
            <div class="detail-content" id="obligation-select-content" style="display: none;">
                <h4>Player Count & Starting Obligation</h4>
                <p>The size of your group determines your starting Obligation value.</p>
                <select id="player-count-select">
                    <option value="2">1-2 Players (20 Obligation)</option>
                    <option value="3">3 Players (15 Obligation)</option>
                    <option value="4">4-5 Players (10 Obligation)</option>
                    <option value="6">6+ Players (5 Obligation)</option>
                </select>
                <hr>
                <div class="obligation-summary">
                    <span>Starting: <b id="starting-obligation-display">10</b></span>
                    <span>Total: <b id="total-obligation-display">10</b></span>
                </div>
                <div id="obligation-selection-container"></div>
            </div>
            <div class="detail-content" id="add-obligation-content" style="display: none;">
                 <h4>Taking on More Obligation</h4>
                    <p>You can voluntarily increase your Obligation to gain more starting XP or credits for your character.</p>
                    <div class="additional-obligation-options">
                        <label><input type="checkbox" id="add-xp-5" data-cost="5" data-xp="5">+5 Obligation for +5 XP</label>
                        <label><input type="checkbox" id="add-xp-10" data-cost="10" data-xp="10">+10 Obligation for +10 XP</label>
                        <label><input type="checkbox" id="add-credits-1000" data-cost="5" data-credits="1000">+5 Obligation for +1000 Credits</label>
                        <label><input type="checkbox" id="add-credits-2500" data-cost="10" data-credits="2500">+10 Obligation for +2500 Credits</label>
                    </div>
                    <div class="obligation-summary">
                        <span>Bonus XP: <b id="bonus-xp-display">0</b></span>
                        <span>Bonus Credits: <b id="bonus-credits-display">0</b></span>
                    </div>
                    <h4 class="obligation-start-value-heading">Starting Obligation: <span id="add-obligation-starting-value">10</span></h4>
                    <hr>
                    <div id="additional-obligation-selectors"></div>
            </div>
        `;

        setupMasterDetailTabs('obligation-list-panel', 'obligation-detail-panel');
        
        const playerCountSelect = document.getElementById('player-count-select');
        const additionalCheckboxes = document.querySelectorAll('.additional-obligation-options input');

        const updateObligationState = () => {
            const state = characterCreatorState.obligation;
            const playerCount = parseInt(playerCountSelect.value);
            if (playerCount <= 2) state.startingValue = 20;
            else if (playerCount === 3) state.startingValue = 15;
            else if (playerCount <= 5) state.startingValue = 10;
            else state.startingValue = 5;

            let additionalValue = 0;
            state.bonusXp = 0;
            state.bonusCredits = 0;
            
            const currentlyChecked = [];
            additionalCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    currentlyChecked.push(checkbox.id);
                    const cost = parseInt(checkbox.dataset.cost);
                    if (additionalValue + cost <= state.startingValue) {
                        additionalValue += cost;
                        state.bonusXp += parseInt(checkbox.dataset.xp || 0);
                        state.bonusCredits += parseInt(checkbox.dataset.credits || 0);
                    } else {
                        checkbox.checked = false;
                        displayMessage(`Cannot gain more additional Obligation than your starting value of ${state.startingValue}.`, 'error', 'save-load-message');
                    }
                }
            });
            
            const previousTypes = [...state.types];
            state.types = state.types.filter(t => t.source === 'starting' || currentlyChecked.includes(t.source));
            
            currentlyChecked.forEach(id => {
                if (!state.types.find(t => t.source === id)) {
                    const checkbox = document.getElementById(id);
                    const previous = previousTypes.find(t => t.source === id);
                    state.types.push(previous || { type: 'debt', value: parseInt(checkbox.dataset.cost), source: id });
                }
            });

            state.total = state.startingValue + additionalValue;
            const startingObl = state.types.find(t => t.source === 'starting');
            if(startingObl) startingObl.value = state.startingValue;

            document.getElementById('starting-obligation-display').textContent = state.startingValue;
            document.getElementById('add-obligation-starting-value').textContent = state.startingValue;
            document.getElementById('total-obligation-display').textContent = state.total;
            document.getElementById('bonus-xp-display').textContent = state.bonusXp;
            document.getElementById('bonus-credits-display').textContent = state.bonusCredits;
        };

        const createObligationSelector = (obl) => {
            const state = characterCreatorState.obligation;
            const div = document.createElement('div');
            div.className = 'obligation-control-group';
            div.dataset.sourceWrapper = obl.source;

            let title = '';
            switch (obl.source) {
                case 'starting': title = `Starting Obligation (${obl.value})`; break;
                case 'add-xp-5': title = `+5 XP / +5 Obligation`; break;
                case 'add-xp-10': title = `+10 XP / +10 Obligation`; break;
                case 'add-credits-1000': title = `+1000 Credits / +5 Obligation`; break;
                case 'add-credits-2500': title = `+2500 Credits / +10 Obligation`; break;
            }

            const usedTypes = state.types.map(t => t.type);
            const optionsHTML = Object.entries(masterObligationList).map(([key, obData]) => {
                const isUsed = usedTypes.includes(key) && key !== 'custom' && key !== obl.type;
                return `<option value="${key}" ${isUsed ? 'disabled' : ''}>${obData.name}</option>`;
            }).join('');

            div.innerHTML = `<label>${title}</label><select data-source="${obl.source}">${optionsHTML}</select><div class="description-box-container"></div>`;
            
            const typeSelect = div.querySelector('select');
            typeSelect.value = obl.type;

            const renderDescriptionBox = (selectedType) => {
                const descContainer = div.querySelector('.description-box-container');
                const obligationToUpdate = state.types.find(o => o.source === obl.source);
                
                if (selectedType === 'custom') {
                    descContainer.innerHTML = `
                        <input type="text" class="custom-obligation-title" placeholder="Custom Obligation Title" value="${obligationToUpdate.customTitle || ''}">
                        <textarea class="custom-obligation-desc" placeholder="Enter custom obligation description...">${obligationToUpdate.customDescription || ''}</textarea>
                    `;
                    descContainer.querySelector('.custom-obligation-title').addEventListener('input', e => obligationToUpdate.customTitle = e.target.value);
                    descContainer.querySelector('.custom-obligation-desc').addEventListener('input', e => obligationToUpdate.customDescription = e.target.value);
                } else {
                    descContainer.innerHTML = `<div class="description-box">${masterObligationList[selectedType].description}</div>`;
                }
            };

            typeSelect.addEventListener('change', (e) => {
                const newType = e.target.value;
                const obligationToUpdate = state.types.find(o => o.source === obl.source);
                if (obligationToUpdate) {
                    obligationToUpdate.type = newType;
                    if(newType !== 'custom') {
                        delete obligationToUpdate.customTitle;
                        delete obligationToUpdate.customDescription;
                    }
                }
                renderDescriptionBox(newType);
                updateAllSelectorOptions();
            });
            
            renderDescriptionBox(obl.type);
            return div;
        };
        
        const updateAllSelectorOptions = () => {
            const state = characterCreatorState.obligation;
            const usedTypes = state.types.map(t => t.type);
            document.querySelectorAll('#obligation-selection-container select, #additional-obligation-selectors select').forEach(select => {
                const source = select.dataset.source;
                const currentSelection = state.types.find(t => t.source === source)?.type;
                select.querySelectorAll('option').forEach(option => {
                    if (option.value !== 'custom') {
                        option.disabled = usedTypes.includes(option.value) && option.value !== currentSelection;
                    }
                });
            });
        };

        const handleCheckboxChange = (checkbox) => {
            updateObligationState();
            const additionalContainer = document.getElementById('additional-obligation-selectors');
            const source = checkbox.id;
            const existingSelector = additionalContainer.querySelector(`[data-source-wrapper="${source}"]`);

            if (checkbox.checked) {
                if (!existingSelector) {
                    const obl = characterCreatorState.obligation.types.find(t => t.source === source);
                    if (obl) {
                        additionalContainer.appendChild(createObligationSelector(obl));
                    }
                }
            } else {
                if (existingSelector) {
                    existingSelector.remove();
                }
            }
            updateAllSelectorOptions();
        };

        const renderStartingSelector = () => {
            const startingContainer = document.getElementById('obligation-selection-container');
            startingContainer.innerHTML = '';
            const startingObl = characterCreatorState.obligation.types.find(t => t.source === 'starting');
            if (startingObl) {
                startingContainer.appendChild(createObligationSelector(startingObl));
            }
            updateAllSelectorOptions();
        };

        playerCountSelect.addEventListener('change', () => {
            updateObligationState();
            renderStartingSelector();
        });

        additionalCheckboxes.forEach(box => {
            box.addEventListener('change', () => handleCheckboxChange(box));
        });
        
        updateObligationState();
        renderStartingSelector();
    }

    // --- STEP 5: CAREER SKILLS ---
    function initStep5_CareerSkills() {
        const career = masterCareersList[characterCreatorState.career];
        const spec = masterSpecializationsList[characterCreatorState.specialization];
        if (!career || !spec) return;

        const listPanel = document.getElementById('free-skills-list-panel');
        const detailPanel = document.getElementById('free-skills-detail-panel');
        
        listPanel.innerHTML = `
            <div class="master-list-item active" data-content="free-career-skills-content">${career.name} Skills</div>
            <div class="master-list-item" data-content="free-spec-skills-content">${spec.name} Skills</div>
        `;

        detailPanel.innerHTML = `
            <div class="detail-content" id="free-career-skills-content">
                <h3>Career Skills (<span id="career-ranks-count">0</span>/${career.freeRanks})</h3>
                <p>Select a free rank in ${career.freeRanks} of your career skills.</p>
                <div class="free-skills-grid" id="free-career-skills-grid"></div>
            </div>
            <div class="detail-content" id="free-spec-skills-content" style="display: none;">
                <h3>Specialization Skills (<span id="spec-ranks-count">0</span>/${spec.freeRanks})</h3>
                <p>Select a free rank in ${spec.freeRanks} of your specialization skills.</p>
                <div class="free-skills-grid" id="free-spec-skills-grid"></div>
            </div>
        `;

        const populateCheckboxes = (gridId, skillList, type, limit, countDisplayId) => {
            const grid = document.getElementById(gridId);
            const countDisplay = document.getElementById(countDisplayId);
            grid.innerHTML = '';
            skillList.forEach(skillName => {
                const label = document.createElement('label');
                label.className = 'free-skill-label';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.dataset.skill = skillName;
                checkbox.dataset.type = type;
                if (characterCreatorState.freeSkillRanks[skillName]) {
                    checkbox.checked = true;
                }
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(` ${skillName}`));
                grid.appendChild(label);
            });

            const updateCount = () => {
                const selected = Array.from(grid.querySelectorAll('input:checked')).length;
                countDisplay.textContent = selected;
                return selected;
            };

            grid.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    if (e.target.checked && updateCount() > limit) {
                        e.target.checked = false;
                    }
                    updateCount();
                    characterCreatorState.freeSkillRanks[e.target.dataset.skill] = e.target.checked;
                }
            });
            updateCount();
        };

        populateCheckboxes('free-career-skills-grid', career.careerSkills, 'career', career.freeRanks, 'career-ranks-count');
        populateCheckboxes('free-spec-skills-grid', spec.careerSkills, 'spec', spec.freeRanks, 'spec-ranks-count');
        setupMasterDetailTabs('free-skills-list-panel', 'free-skills-detail-panel');
    }

    // --- STEP 6: SPEND XP ---
    function initStep6_SpendXP() {
        const listPanel = document.getElementById('xp-list-panel');
        const detailPanel = document.getElementById('xp-detail-panel');

        listPanel.innerHTML = `
            <div class="master-list-item active" data-content="xp-characteristics-content">Characteristics</div>
            <div class="master-list-item" data-content="xp-skills-content">Skills</div>
            <div class="master-list-item" data-content="xp-talents-content">Talents</div>
        `;

        detailPanel.innerHTML = `
            <div class="xp-header">
                <div class="xp-tracker">Available XP: <span id="available-xp-display">0</span></div>
                <div id="xp-spent-summary" class="xp-summary-box"></div>
            </div>
            <div class="detail-content" id="xp-characteristics-content"></div>
            <div class="detail-content" id="xp-skills-content" style="display: none;"></div>
            <div class="detail-content" id="xp-talents-content" style="display: none;"></div>
        `;
        setupMasterDetailTabs('xp-list-panel', 'xp-detail-panel');

        populateCharacteristicsTab();
        populateSkillsTab();
        populateTalentsTab();
        updateXpSummary();
    }

    function populateCharacteristicsTab() {
        const container = document.getElementById('xp-characteristics-content');
        const species = masterSpeciesList[characterCreatorState.species];
        if (!species) return;

        if (!characterCreatorState.characteristics) {
            characterCreatorState.characteristics = { ...species.stats };
            const bonusXp = characterCreatorState.obligation?.bonusXp || 0;
            characterCreatorState.availableXp = (species.startingXp || 0) + bonusXp;
        }

        let gridHTML = '<div class="stats-allocation-grid">';
        Object.entries(characterCreatorState.characteristics).forEach(([key, value]) => {
            gridHTML += `
                <div class="stat-row">
                    <span class="stat-name">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <div class="stat-controls">
                        <button class="stat-btn decrease" data-stat="${key}">-</button>
                        <span class="stat-value">${value}</span>
                        <button class="stat-btn increase" data-stat="${key}">+</button>
                    </div>
                </div>
            `;
        });
        gridHTML += '</div>';
        container.innerHTML = gridHTML;

        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('stat-btn')) {
                const stat = e.target.dataset.stat;
                const direction = e.target.classList.contains('increase') ? 1 : -1;
                handleCharacteristicChange(stat, direction, e.target.parentElement);
            }
        });
        updateXpDisplay();
    }

    function handleCharacteristicChange(stat, direction, controlsDiv) {
        const species = masterSpeciesList[characterCreatorState.species];
        let currentValue = characterCreatorState.characteristics[stat];
        const baseValue = species.stats[stat];

        if (direction === 1) {
            const cost = (currentValue + 1) * 10;
            if (characterCreatorState.availableXp >= cost) {
                characterCreatorState.availableXp -= cost;
                currentValue++;
            }
        } else {
            if (currentValue > baseValue) {
                const refund = currentValue * 10;
                characterCreatorState.availableXp += refund;
                currentValue--;
            }
        }
        characterCreatorState.characteristics[stat] = currentValue;
        controlsDiv.querySelector('.stat-value').textContent = currentValue;
        updateXpDisplay();
        updateXpSummary();
    }

    function populateSkillsTab() {
        const container = document.getElementById('xp-skills-content');
        const career = masterCareersList[characterCreatorState.career];
        const spec = masterSpecializationsList[characterCreatorState.specialization];
        if (!career || !spec) return;

        if (Object.keys(characterCreatorState.skills).length === 0) {
            for (const skillName in characterCreatorState.freeSkillRanks) {
                if (characterCreatorState.freeSkillRanks[skillName]) {
                    characterCreatorState.skills[skillName] = 1;
                }
            }
        }

        const careerSkills = new Set([...career.careerSkills, ...spec.careerSkills]);
        let gridHTML = '<div class="skills-allocation-grid">';
        Object.values(masterSkillsList).flat().forEach(skill => {
            const isCareer = careerSkills.has(skill.name);
            const currentRank = characterCreatorState.skills[skill.name] || 0;
            gridHTML += `
                <div class="skill-alloc-row">
                    <span class="skill-alloc-name ${isCareer ? 'career-skill' : ''}">${skill.name} (${skill.char})</span>
                    <div class="skill-alloc-controls">
                        <button class="skill-btn decrease" data-skill="${skill.name}">-</button>
                        <span class="skill-alloc-value">${currentRank}</span>
                        <button class="skill-btn increase" data-skill="${skill.name}">+</button>
                    </div>
                </div>
            `;
        });
        gridHTML += '</div>';
        container.innerHTML = gridHTML;

        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('skill-btn')) {
                const skill = e.target.dataset.skill;
                const direction = e.target.classList.contains('increase') ? 1 : -1;
                handleSkillChange(skill, direction, e.target.parentElement);
            }
        });
    }
    
    function handleSkillChange(skillName, direction, controlsDiv) {
        const career = masterCareersList[characterCreatorState.career];
        const spec = masterSpecializationsList[characterCreatorState.specialization];
        const careerSkills = new Set([...career.careerSkills, ...spec.careerSkills]);
        const isCareer = careerSkills.has(skillName);
        let currentRank = characterCreatorState.skills[skillName] || 0;
        const isFreeRanked = characterCreatorState.freeSkillRanks[skillName] && currentRank === 1;

        if (direction === 1 && currentRank < 2) {
            const newRank = currentRank + 1;
            const cost = isCareer ? newRank * 5 : (newRank * 5) + 5;
            if (characterCreatorState.availableXp >= cost) {
                characterCreatorState.availableXp -= cost;
                currentRank++;
            }
        } else if (direction === -1 && currentRank > 0) {
            if (!isFreeRanked) {
                const refund = isCareer ? currentRank * 5 : (currentRank * 5) + 5;
                characterCreatorState.availableXp += refund;
                currentRank--;
            }
        }
        characterCreatorState.skills[skillName] = currentRank;
        controlsDiv.querySelector('.skill-alloc-value').textContent = currentRank;
        updateXpDisplay();
        updateXpSummary();
    }

    function populateTalentsTab() {
        const container = document.getElementById('xp-talents-content');
        const specId = characterCreatorState.specialization;
        const treeData = specializationTalentTrees[specId];
        if (!treeData) {
            container.innerHTML = '<p>No talent tree available.</p>';
            return;
        }

        let gridHTML = '<div class="talent-tree-grid">';
        treeData.layout.forEach((talentInfo, index) => {
            if (talentInfo && talentInfo.id) {
                const talent = masterTalentsList[talentInfo.id];
                gridHTML += `
                    <div class="talent-cell" data-index="${index}" data-cost="${talentInfo.cost}">
                        <span class="talent-name">${talent.name}</span>
                        <span class="talent-description">${talent.description}</span>
                        <span class="talent-cost">(${talentInfo.cost} XP)</span>
                    </div>
                `;
            } else {
                gridHTML += '<div class="talent-cell"></div>';
            }
        });
        gridHTML += '</div>';
        container.innerHTML = gridHTML;

        container.addEventListener('click', (e) => {
            if (e.target.closest('.talent-cell')) {
                handleTalentPurchase(e.target.closest('.talent-cell'));
            }
        });
        updateTalentTreeVisuals();
    }
    
    function handleTalentPurchase(cell) {
        const cost = parseInt(cell.dataset.cost);
        const index = parseInt(cell.dataset.index);
        const isPurchased = characterCreatorState.talents.includes(index);

        if (isPurchased) {
            characterCreatorState.availableXp += cost;
            characterCreatorState.talents = characterCreatorState.talents.filter(i => i !== index);
        } else {
            if (characterCreatorState.availableXp >= cost) {
                characterCreatorState.availableXp -= cost;
                characterCreatorState.talents.push(index);
            }
        }
        updateXpDisplay();
        updateXpSummary();
        updateTalentTreeVisuals();
    }
    
    function updateTalentTreeVisuals() {
        const talentGrid = document.querySelector('#xp-talents-content .talent-tree-grid');
        if (!talentGrid) return;
        talentGrid.querySelectorAll('.talent-cell').forEach(cell => {
            const index = parseInt(cell.dataset.index);
            cell.classList.toggle('purchased', characterCreatorState.talents.includes(index));
        });
    }

    function updateXpSummary() {
        const summaryContainer = document.getElementById('xp-spent-summary');
        const species = masterSpeciesList[characterCreatorState.species];
        const career = masterCareersList[characterCreatorState.career];
        const spec = masterSpecializationsList[characterCreatorState.specialization];
        if (!summaryContainer || !species || !career || !spec) return;

        let charXp = 0, skillXp = 0, talentXp = 0;
        
        Object.entries(characterCreatorState.characteristics).forEach(([char, val]) => {
            for (let i = species.stats[char] + 1; i <= val; i++) charXp += i * 10;
        });

        const careerSkills = new Set([...career.careerSkills, ...spec.careerSkills]);
        Object.entries(characterCreatorState.skills).forEach(([skill, rank]) => {
            const isCareer = careerSkills.has(skill);
            for (let i = 1; i <= rank; i++) {
                if (characterCreatorState.freeSkillRanks[skill] && i === 1) continue;
                skillXp += isCareer ? i * 5 : (i * 5) + 5;
            }
        });
        
        const treeLayout = specializationTalentTrees[characterCreatorState.specialization];
        if (treeLayout) {
            characterCreatorState.talents.forEach(index => {
                talentXp += treeLayout.layout[index].cost;
            });
        }

        summaryContainer.innerHTML = `
            <h4>XP Spent</h4>
            <p><strong>Characteristics:</strong> ${charXp} XP</p>
            <p><strong>Skills:</strong> ${skillXp} XP</p>
            <p><strong>Talents:</strong> ${talentXp} XP</p>
        `;
    }

    // --- STEP 7: STARTING GEAR ---
    function initStep7_StartingGear() {
        const detailPanel = document.getElementById('gear-detail-panel');
        detailPanel.innerHTML = `<p>Gear selection will be implemented here.</p>`;
    }
    
    // --- STEP 8: SUMMARY ---
    function initStep8_Summary() {
        const summaryContainer = document.getElementById('character-summary');
        summaryContainer.innerHTML = `<p>Final character summary will be displayed here.</p>`;
    }

    // --- NAVIGATION LOGIC ---
    function showStep(stepNumber) {
        steps.forEach(step => step.classList.remove('active'));
        document.querySelector(`.wizard-step[data-step="${stepNumber}"]`)?.classList.add('active');

        progressSteps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) <= stepNumber);
        });

        prevBtn.style.display = (stepNumber === 1) ? 'none' : 'inline-block';
        document.querySelector('.wizard-navigation').style.justifyContent = (stepNumber === 1) ? 'flex-end' : 'space-between';
        nextBtn.textContent = (stepNumber === steps.length) ? 'Create Character' : 'Next';

        if (!initializedSteps.has(stepNumber)) {
            switch (stepNumber) {
                case 1: initStep1_Obligation(); break;
                case 2: setupMasterDetailList({ listPanelId: 'species-list-panel', detailPanelId: 'species-detail-panel', searchInputId: 'species-search-input', dataSource: masterSpeciesList, selectionKey: 'species' }); break;
                case 3: setupMasterDetailList({ listPanelId: 'career-list-panel', detailPanelId: 'career-detail-panel', dataSource: masterCareersList, selectionKey: 'career', onSelectCallback: () => { characterCreatorState.specialization = null; initializedSteps.delete(4); } }); break;
                case 4: setupMasterDetailList({ listPanelId: 'specialization-list-panel', detailPanelId: 'specialization-detail-panel', dataSource: masterSpecializationsList, selectionKey: 'specialization', filterKey: 'career' }); break;
                case 5: initStep5_CareerSkills(); break;
                case 6: initStep6_SpendXP(); break;
                case 7: initStep7_StartingGear(); break;
                case 8: initStep8_Summary(); break;
            }
            initializedSteps.add(stepNumber);
        }
        
        if (stepNumber === 8) {
            initStep8_Summary();
        }
    }

    nextBtn.addEventListener('click', () => {
        if (currentStep < steps.length) {
            currentStep++;
            showStep(currentStep);
        } else {
            finalizeCharacterCreation(characterCreatorState, new URLSearchParams(window.location.search).get('hubId'));
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });

    showStep(currentStep);
}

async function finalizeCharacterCreation(state, hubId = null) {

    if (!state.species || !state.career || !state.specialization) {
        return displayMessage("Please select a species, career, and specialization.", "error", "character-summary");
    }

    const species = masterSpeciesList[state.species];
    const career = masterCareersList[state.career];
    const specialization = masterSpecializationsList[state.specialization];
    const bonusXp = state.obligation.bonusXp || 0;
    const bonusCredits = state.obligation.bonusCredits || 0;
    const baseCredits = 500;
    const characterNameInput = document.getElementById('summary-char-name');
    const finalCharacterName = characterNameInput && characterNameInput.value ? characterNameInput.value : "Unnamed Character";
    const careerSkills = new Set([...(career.careerSkills || []), ...(specialization.careerSkills || [])]);
    const { woundBonus, strainBonus } = recalculateThresholdsFromTalents(state);

    const calculateBaseThreshold = (formula, brawn, willpower) => {
        if (typeof formula !== 'string') return 0;
        const value = formula.includes('Brawn') ? brawn : willpower;
        const base = parseInt(formula.split(' ')[0]) || 0;
        return base + value;
    };

    const newCharacterData = {
        characterName: finalCharacterName,
        ownerId: userId,
        species: species.name,
        career: career.name,
        specializationTrees: specialization.name,
        totalXP: (species.startingXp || 0) + bonusXp,
        availableXP: state.availableXp,
        characteristics: state.characteristics,
        woundsCurrent: 0,
        woundsThreshold: calculateBaseThreshold(species.woundThreshold, state.characteristics.brawn, state.characteristics.willpower) + woundBonus,
        strainCurrent: 0,
        strainThreshold: calculateBaseThreshold(species.strainThreshold, state.characteristics.brawn, state.characteristics.willpower) + strainBonus,
        skills: Object.entries(state.skills || {}).filter(([name, rank]) => rank > 0).map(([name, rank]) => ({ name, rank, isCareer: careerSkills.has(name) })),
        specializationTalents: state.talents || [],
        bonusTalents: state.bonusTalents || [],
        inventory: Object.entries(state.purchasedGear || {}).map(([id, quantity]) => ({ id, quantity })),
        obligation: state.obligation,
        startingCredits: baseCredits + bonusCredits
    };

    try {
        let newDocRef;
        if (hubId) {
            const hubCharacterCollection = collection(db, `hubs/${hubId}/characters`);
            newDocRef = await addDoc(hubCharacterCollection, newCharacterData);
            window.location.href = `character-sheet.html?id=${newDocRef.id}&hubId=${hubId}`;
        } else {
            const userCharacterCollection = collection(db, `users/${userId}/character_sheets`);
            newDocRef = await addDoc(userCharacterCollection, newCharacterData);
            window.location.href = `character-sheet.html?id=${newDocRef.id}`;
        }
    } catch (e) {
        console.error("Error creating character:", e);
        displayMessage("Failed to create character.", "error", "character-summary");
    }
}

function setupTabNavigation() {
    const tabContainer = document.querySelector('.tabs');
    if (!tabContainer) return;

    tabContainer.addEventListener('click', (e) => {
        if (e.target.matches('.tab-link')) {
            const tabId = e.target.dataset.tab;

            document.querySelectorAll('.tab-link').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            e.target.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        }
    });
}

function clearDicePool() {
    ['ability', 'proficiency', 'boost', 'difficulty', 'challenge', 'setback'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = 0;
    });

    const skillDisplay = document.getElementById('current-skill-display');
    if (skillDisplay) {
        skillDisplay.textContent = 'Skill: Custom roll';
    }
    window.currentSkillForRoll = 'Custom roll';

    const resultsDisplay = document.getElementById('dice-results');
    if (resultsDisplay) {
        resultsDisplay.innerHTML = 'Pool cleared.';
    }
}

function setupSheetForCampaign(hubData, hubId) {
    const campaignHeader = document.getElementById('campaign-info-header');
    const campaignLink = document.getElementById('campaign-link');
    if (campaignHeader && campaignLink) {
        campaignLink.textContent = hubData.hubName;
        campaignLink.href = `campaign-view.html?hubId=${hubId}`;
        campaignHeader.style.display = 'block';
    }

    const checkPermissions = () => {
        const isGm = hubData.gmUserId === userId;
        const isOwner = currentCharacterData.ownerId === userId;

        if (!isGm && !isOwner) {
            // If not the GM or the owner, disable all inputs
            document.querySelectorAll('input, textarea').forEach(el => {
                el.disabled = true;
            });
            displayMessage("Viewing in read-only mode.", "info", "save-load-message");
        }
    };
    
    // We need to wait for the character data to be loaded before we can check the ownerId
    // A simple timeout will work for this.
    setTimeout(checkPermissions, 1000); 
}

// --- PAGE INITIALIZATION ROUTER ---
function initializePage(page) {
    if (page === 'index.html' || page === '') {
        const authSection = document.querySelector('.auth-section');
        const showSignupLink = document.getElementById('show-signup-link');
        const showLoginLink = document.getElementById('show-login-link');
        
        if (showSignupLink && showLoginLink) {
            showSignupLink.addEventListener('click', (e) => { e.preventDefault(); authSection.classList.add('show-signup'); });
            showLoginLink.addEventListener('click', (e) => { e.preventDefault(); authSection.classList.remove('show-signup'); });
        }
        document.getElementById('signup-button')?.addEventListener('click', () => signupUser(document.getElementById('email-signup').value, document.getElementById('password-signup').value));
        document.getElementById('login-button')?.addEventListener('click', () => loginUser(document.getElementById('email-login').value, document.getElementById('password-login').value));

    } else if (page === 'character-sheet.html') {
        setupTabNavigation();
        populateSkills();
        setupAutoSaveListeners();
        
        document.getElementById('logout-button')?.addEventListener('click', logoutUser);
        document.getElementById('back-to-hub-btn')?.addEventListener('click', () => autoSaveCharacter().then(() => window.location.href = 'character-hub.html'));
        document.getElementById('delete-character-btn')?.addEventListener('click', deleteSingleCharacter);
        document.getElementById('roll-dice-button')?.addEventListener('click', () => window.rollDice(window.currentSkillForRoll));
        document.getElementById('clear-pool-button')?.addEventListener('click', clearDicePool);
        document.getElementById('crit-modal-close')?.addEventListener('click', () => {
            document.getElementById('critical-injury-modal').style.display = 'none';
        });

        document.getElementById('toggle-pool-panel')?.addEventListener('click', () => {
            const poolPanel = document.getElementById('dice-pool-panel');
            togglePanel(poolPanel);
            if (poolPanel.classList.contains('open')) {
                window.currentSkillForRoll = 'Custom roll';
                document.getElementById('current-skill-display').textContent = 'Skill: Custom roll';
            }
        });
        document.getElementById('toggle-gear-panel')?.addEventListener('click', () => {
            togglePanel(document.getElementById('gear-panel'));
        });

        function handleAttack(itemId) {
            const weaponDetails = masterGearList[itemId];
            if (!weaponDetails || !weaponDetails.skill) return;
            window.currentItemForAttack = itemId; 

            const skillName = weaponDetails.skill;
            const skillData = Object.values(masterSkillsList).flat().find(s => s.name === skillName);
            if (!skillData) return;
            const charAbbr = skillData.char.toLowerCase();
            const charKey = { br: 'brawn', ag: 'agility', int: 'intellect', cun: 'cunning', will: 'willpower', pr: 'presence' }[charAbbr];
            const charValue = currentCharacterData.characteristics[charKey] || 0;
            const skill = currentCharacterData.skills.find(s => s.name === skillName);
            const skillRank = skill ? skill.rank : 0;
            const abilityDice = Math.max(charValue, skillRank);
            const proficiencyDice = Math.min(charValue, skillRank);
            
            document.getElementById("ability").value = abilityDice - proficiencyDice;
            document.getElementById("proficiency").value = proficiencyDice;
            
            let setbackDice = 0;
            const specialText = weaponDetails.special ? weaponDetails.special.toLowerCase() : '';
            if (specialText.includes('cumbersome')) {
                const cumbersomeRatingMatch = specialText.match(/cumbersome (\d+)/i);
                if (cumbersomeRatingMatch) {
                    const cumbersomeRating = parseInt(cumbersomeRatingMatch[1]);
                    const brawn = currentCharacterData.characteristics.brawn || 0;
                    if (brawn < cumbersomeRating) {
                        setbackDice += cumbersomeRating - brawn;
                    }
                }
            }
            if (specialText.includes('inaccurate')) {
                const inaccurateRatingMatch = specialText.match(/inaccurate (\d+)/i);
                if(inaccurateRatingMatch) {
                    setbackDice += parseInt(inaccurateRatingMatch[1]);
                } else {
                    setbackDice += 1;
                }
            }
            document.getElementById("setback").value = setbackDice;
            if (specialText.includes('inferior')) {
                displayMessage('Reminder: This weapon is Inferior. It generates 1 automatic Threat on use and its base damage is reduced by 1.', 'info', 'save-load-message');
            }
            if (specialText.includes('superior')) {
                displayMessage('Reminder: This weapon is Superior. It generates 1 automatic Advantage on use and its base damage is increased by 1.', 'info', 'save-load-message');
            }
            ['boost', 'difficulty', 'challenge'].forEach(id => document.getElementById(id).value = 0);
            
            openPanel(document.getElementById("dice-pool-panel"));
            window.currentSkillForRoll = skillName;
            document.getElementById('current-skill-display').textContent = `Skill: ${skillName}`;
            displayMessage(`Dice Pool set for ${skillName} attack.`, 'info', 'save-load-message');
        }

        function handleEquipArmor(itemIdToEquip) {
            if (!currentCharacterData.inventory) return;
    
            const currentlyEquipped = currentCharacterData.inventory.find(item => item.equipped && masterGearList[item.id]?.type === 'armor');
            const itemToEquip = currentCharacterData.inventory.find(item => item.id === itemIdToEquip);
    
            if (currentlyEquipped && currentlyEquipped.id === itemIdToEquip) {
                itemToEquip.equipped = false;
            } 
            else if (currentlyEquipped) {
                const currentArmorDetails = masterGearList[currentlyEquipped.id];
                const newArmorDetails = masterGearList[itemIdToEquip];
                if (confirm(`Unequip ${currentArmorDetails.name} and equip ${newArmorDetails.name}?`)) {
                    currentlyEquipped.equipped = false;
                    itemToEquip.equipped = true;
                }
            } 
            else {
                itemToEquip.equipped = true;
            }
    
            renderInventory(currentCharacterData.inventory);
            renderEquippedArmor(currentCharacterData.inventory);
            updateCharacterStats();
            autoSaveCharacter();
        }

        const mainContentWrapper = document.getElementById('main-content-wrapper');
        if (mainContentWrapper) {
            mainContentWrapper.addEventListener('click', (event) => {
                const target = event.target;
                const itemId = target.dataset.itemId;
    
                if (target.classList.contains('equip-btn') && itemId) {
                    handleEquipArmor(itemId);
                }
    
                if (target.classList.contains('attack-btn') && itemId) {
                    handleAttack(itemId);
                }
                
                if (target.classList.contains('remove-item-btn') && itemId) {
                    if (confirm(`Are you sure you want to remove ${masterGearList[itemId]?.name}?`)) {
                        currentCharacterData.inventory = currentCharacterData.inventory.filter(i => i.id !== itemId);
                        renderInventory(currentCharacterData.inventory);
                        renderWeapons(currentCharacterData.inventory);
                        renderEquippedArmor(currentCharacterData.inventory);
                        updateCharacterStats();
                        autoSaveCharacter();
                    }
                }
    
                const skillNameSpan = event.target.closest('.skill-name-clickable');
                if (skillNameSpan) {
                    const skillName = skillNameSpan.textContent.split(' (')[0];
                    const rankContainer = skillNameSpan.closest('.skill-row').querySelector('.rank-circles');
                    const abilityDice = parseInt(rankContainer.getAttribute('data-ability-ranks')) || 0;
                    const proficiencyDice = parseInt(rankContainer.getAttribute('data-proficiency-ranks')) || 0;
                    
                    document.getElementById("ability").value = abilityDice;
                    document.getElementById("proficiency").value = proficiencyDice;
                    
                    let boostDice = 0;
                    const speciesKey = Object.keys(masterSpeciesList).find(key => masterSpeciesList[key].name === currentCharacterData.species);
                    if (speciesKey) {
                        const speciesData = masterSpeciesList[speciesKey];
                        if (speciesData.bonuses) {
                            speciesData.bonuses.forEach(bonus => {
                                if (bonus.type === 'dice_bonus' && bonus.skill === skillName && bonus.dice === 'boost') {
                                    boostDice += bonus.amount;
                                }
                            });
                        }
                    }
                    document.getElementById("boost").value = boostDice;
                    
                    ['difficulty', 'challenge', 'setback'].forEach(id => {
                        if (document.getElementById(id)) document.getElementById(id).value = 0;
                    });
                    openPanel(document.getElementById("dice-pool-panel"));
                    window.currentSkillForRoll = skillNameSpan.textContent;
                    document.getElementById('current-skill-display').textContent = `Skill: ${window.currentSkillForRoll}`;
                    displayMessage(`Dice Pool updated for ${window.currentSkillForRoll}.`, 'info', 'save-load-message');
                }
            });
        }

    } else if (page === 'character-hub.html') {
        document.getElementById('logout-button')?.addEventListener('click', logoutUser);
        document.getElementById('create-campaign-btn')?.addEventListener('click', createCampaign);
        document.getElementById('join-campaign-btn')?.addEventListener('click', joinCampaign);
        document.getElementById('back-to-character-hub-btn')?.addEventListener('click', () => {
            window.location.href = 'character-hub.html';
        });

        displayUserCampaigns();

    } else if (page === 'campaign-view.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const hubId = urlParams.get('hubId');
        
        if (!hubId) {
            window.location.href = 'campaign-hub.html';
            return;
        }

        const hubRef = doc(db, 'hubs', hubId);
        getDoc(hubRef).then(hubDoc => {
            if(hubDoc.exists()) {
                document.getElementById('campaign-view-title').textContent = hubDoc.data().hubName;
            }
        });
        
        document.getElementById('campaign-id-display').textContent = hubId;
        document.getElementById('back-to-campaign-hub-btn').addEventListener('click', () => {
            window.location.href = 'campaign-hub.html';
        });

        const createCharacterLink = document.getElementById('create-new-character-link');
        createCharacterLink.href = `character-creator.html?hubId=${hubId}`;
        displayCampaignCharacters(hubId);
        
    } else if (page === 'character-creator.html') {
        initializeCreatorWizard();
        document.getElementById('creator-back-to-hub-btn')?.addEventListener('click', () => {
            window.location.href = 'character-hub.html';
        });
    } else if (page === 'account.html') { 
        document.getElementById('logout-button')?.addEventListener('click', logoutUser);
        document.getElementById('back-to-hub-btn')?.addEventListener('click', () => {
            window.location.href = 'character-hub.html';
        });
        document.getElementById('update-email-btn')?.addEventListener('click', updateUserEmail);
        document.getElementById('update-password-btn')?.addEventListener('click', updateUserPassword);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname.split("/").pop();

    initializePage(currentPage);
    setupAbilityTooltips(); 

    document.body.addEventListener('click', (e) => {
        if (e.target.id === 'my-account-btn') {
            window.location.href = 'account.html';
        }
    });

    onAuthStateChanged(auth, user => {
        isAuthReady = true;
        if (user) {
            userId = user.uid;
            if (currentPage === 'index.html' || currentPage === '') {
                window.location.href = 'character-hub.html'; 
            } else {
                if (currentPage === 'character-hub.html') {
                    displayUserCharacters(); 
                } else if (currentPage === 'campaign-hub.html') {
                    displayUserCampaigns();
                } else if (currentPage === 'character-sheet.html') {
                    loadCharacter();
                }
            }
        } else {
            userId = null;
            if (currentPage !== 'index.html' && currentPage !== '') {
                window.location.href = 'index.html';
            }
        }
    });
});
