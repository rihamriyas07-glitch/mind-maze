import { SubjectMeta, SyllabusTopic, TimetableEntry, StreamType } from '../types';

export const SUBJECT_METAS: SubjectMeta[] = [
  // Physical Science (Compulsory)
  {
    id: 'combined-maths',
    name: 'Combined Mathematics',
    stream: 'Physical Science',
    icon: '📐',
    color: 'indigo',
    badgeBg: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/40',
    textColor: 'text-indigo-400',
  },
  // Compulsory in both Physical Science & Biological Science
  {
    id: 'physics',
    name: 'Physics',
    stream: 'Both',
    icon: '⚡',
    color: 'cyan',
    badgeBg: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-400',
  },
  // Compulsory in Biological Science; Elective in Physical Science (Chemistry OR ICT)
  {
    id: 'chemistry',
    name: 'Chemistry',
    stream: 'Both',
    icon: '🧪',
    color: 'purple',
    badgeBg: 'bg-purple-500/15',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-400',
  },
  // Elective option in Physical Science (Chemistry OR ICT)
  {
    id: 'ict',
    name: 'ICT',
    stream: 'Physical Science',
    icon: '💻',
    color: 'pink',
    badgeBg: 'bg-pink-500/15',
    borderColor: 'border-pink-500/40',
    textColor: 'text-pink-400',
  },
  // Biological Science (Compulsory - replaces Combined Maths in Bio stream)
  {
    id: 'biology',
    name: 'Biology',
    stream: 'Biological Science',
    icon: '🔬',
    color: 'emerald',
    badgeBg: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
  },
];

/**
 * Returns the exact 3 subjects for the selected stream:
 * - Physical Science: Combined Mathematics, Physics, and either Chemistry OR ICT
 * - Biological Science: Biology, Chemistry, Physics (Combined Maths replaced with Biology)
 */
export function getSubjectsForStream(
  stream: StreamType | string,
  physicalScienceElective: 'Chemistry' | 'ICT' | string = 'Chemistry'
): SubjectMeta[] {
  if (stream === 'Biological Science' || (stream as string) === 'Bio') {
    return SUBJECT_METAS.filter(
      (s) => s.name === 'Biology' || s.name === 'Chemistry' || s.name === 'Physics'
    );
  }

  // Physical Science
  const elective = physicalScienceElective === 'ICT' ? 'ICT' : 'Chemistry';
  return SUBJECT_METAS.filter(
    (s) =>
      s.name === 'Combined Mathematics' ||
      s.name === 'Physics' ||
      s.name === elective
  );
}

export const INITIAL_SYLLABUS_TOPICS: SyllabusTopic[] = [
  // ================= COMBINED MATHEMATICS =================
  {
    id: 'cm-01',
    subject: 'Combined Mathematics',
    unitNumber: 1,
    unitTitle: 'Real Numbers & Functions',
    topicTitle: 'Real Number System, Inequalities & Absolute Values',
    subtopics: ['Properties of Real Numbers', 'Solving Algebraic Inequalities', 'Modulus Equations & Inequalities'],
    status: 'completed',
  },
  {
    id: 'cm-02',
    subject: 'Combined Mathematics',
    unitNumber: 1,
    unitTitle: 'Polynomials & Rational Functions',
    topicTitle: 'Quadratic Functions & Theory of Equations',
    subtopics: ['Roots of Quadratic Equations (alpha & beta)', 'Sign of Quadratic Expressions', 'Remainder & Factor Theorems'],
    status: 'completed',
  },
  {
    id: 'cm-03',
    subject: 'Combined Mathematics',
    unitNumber: 2,
    unitTitle: 'Matrices & Determinants',
    topicTitle: 'Matrix Operations & Inverses',
    subtopics: ['Matrix multiplication', '2x2 and 3x3 Determinants', 'Solving Linear Systems via Cramer & Inverses'],
    status: 'in_progress',
  },
  {
    id: 'cm-04',
    subject: 'Combined Mathematics',
    unitNumber: 3,
    unitTitle: 'Trigonometry',
    topicTitle: 'Compound Angles & Multiple Angles',
    subtopics: ['Addition formulas sin(A±B), cos(A±B)', 'Double & Half angle formulas', 'Transforming products to sums'],
    status: 'in_progress',
  },
  {
    id: 'cm-05',
    subject: 'Combined Mathematics',
    unitNumber: 3,
    unitTitle: 'Trigonometry',
    topicTitle: 'Trigonometric Equations & General Solutions',
    subtopics: ['Solving sin theta = k, cos theta = k', 'General solution formulas', 'Properties of Triangles (Sine & Cosine Rules)'],
    status: 'not_started',
  },
  {
    id: 'cm-06',
    subject: 'Combined Mathematics',
    unitNumber: 4,
    unitTitle: 'Differentiation (Calculus)',
    topicTitle: 'Techniques of Differentiation & Curve Sketching',
    subtopics: ['Product, Quotient, Chain Rule', 'Implicit & Parametric Differentiation', 'Stationary Points & Max/Min Graph Sketching'],
    status: 'in_progress',
  },
  {
    id: 'cm-07',
    subject: 'Combined Mathematics',
    unitNumber: 5,
    unitTitle: 'Integration (Calculus)',
    topicTitle: 'Definite & Indefinite Integrals',
    subtopics: ['Integration by Substitution', 'Integration by Parts', 'Partial Fractions in Integration', 'Area under Curves'],
    status: 'not_started',
  },
  {
    id: 'cm-08',
    subject: 'Combined Mathematics',
    unitNumber: 6,
    unitTitle: 'Applied Maths: Mechanics (Kinematics)',
    topicTitle: 'Straight Line Motion & Velocity-Time Graphs',
    subtopics: ['Equations of motion under constant acceleration', 'Motion under gravity', 'Area and gradient interpretations of (v-t) graphs'],
    status: 'completed',
  },
  {
    id: 'cm-09',
    subject: 'Combined Mathematics',
    unitNumber: 7,
    unitTitle: 'Applied Maths: Mechanics (Vectors & Statics)',
    topicTitle: 'Coplanar Forces & Equilibrium of Rigid Bodies',
    subtopics: ['Resultant of concurrent coplanar forces', 'Lami Theorem & Triangle of Forces', 'Moments and Couples', 'Equilibrium of rods on smooth/rough surfaces'],
    status: 'in_progress',
  },
  {
    id: 'cm-10',
    subject: 'Combined Mathematics',
    unitNumber: 8,
    unitTitle: 'Applied Maths: Projectiles',
    topicTitle: 'Projectiles on Horizontal & Inclined Planes',
    subtopics: ['Trajectory equation', 'Maximum height, time of flight, horizontal range', 'Projectiles on inclined planes'],
    status: 'not_started',
  },
  {
    id: 'cm-11',
    subject: 'Combined Mathematics',
    unitNumber: 9,
    unitTitle: 'Applied Maths: Circular & Simple Harmonic Motion',
    topicTitle: 'Circular Motion & SHM',
    subtopics: ['Centripetal acceleration & conical pendulum', 'Hooke Law & Elastic strings', 'Simple Harmonic Motion equations'],
    status: 'not_started',
  },
  {
    id: 'cm-12',
    subject: 'Combined Mathematics',
    unitNumber: 10,
    unitTitle: 'Probability & Statistics',
    topicTitle: 'Permutations, Combinations & Probability',
    subtopics: ['nPr and nCr calculations', 'Conditional probability & Bayes Theorem', 'Mean, Variance & Normal Distribution'],
    status: 'not_started',
  },

  // ================= PHYSICS =================
  // UNIT 1: MEASUREMENT
  {
    id: 'phy-01',
    subject: 'Physics',
    unitNumber: 1,
    unitTitle: 'Measurement',
    topicTitle: 'Measurement',
    subtopics: [
      '1. Introduction to Physics',
      '2. Physical Quantities and Units',
      '3. Dimensions',
      '4. Measuring Instruments',
      '5. Scalar Quantities and Vector Quantities',
    ],
    status: 'completed',
  },

  // UNIT 2: MECHANICS
  {
    id: 'phy-02',
    subject: 'Physics',
    unitNumber: 2,
    unitTitle: 'Mechanics',
    topicTitle: 'Mechanics',
    subtopics: [
      '1. Kinematics',
      '2. Resultant of a System of Coplanar Forces',
      '3. Force and Motion',
      '4. Equilibrium of Forces',
      '5. Work, Energy and Power',
      '6. Rotational Motion and Circular Motion',
      '7. Hydrostatics',
      '8. Fluid Dynamics',
    ],
    status: 'completed',
  },

  // UNIT 3: WAVES AND OSCILLATIONS
  {
    id: 'phy-03',
    subject: 'Physics',
    unitNumber: 3,
    unitTitle: 'Waves and Oscillations',
    topicTitle: 'Waves and Oscillations',
    subtopics: [
      '1. Oscillations',
      '2. Wave Motion',
      '3. Properties of Waves',
      '4. Stationary Waves in Stretched Strings',
      '5. Transmission of Sound through Gases',
      '6. Doppler Effect',
      '7. Nature of Sound',
      '8. Electromagnetic Waves',
      '9. Geometrical Optics',
      '10. Human Eye',
      '11. Optical Instruments',
    ],
    status: 'in_progress',
  },

  // UNIT 4: THERMAL PHYSICS
  {
    id: 'phy-04',
    subject: 'Physics',
    unitNumber: 4,
    unitTitle: 'Thermal Physics',
    topicTitle: 'Thermal Physics',
    subtopics: [
      '1. Temperature',
      '2. Thermal Expansion of Solids and Liquids',
      '3. Gas Laws',
      '4. Kinetic Theory of Gases',
      '5. Exchange of Heat',
      '6. Change of State',
      '7. Vapor and Humidity',
      '8. Thermodynamics',
      '9. Transfer of Heat',
    ],
    status: 'in_progress',
  },

  // UNIT 5: GRAVITATIONAL FIELD
  {
    id: 'phy-05',
    subject: 'Physics',
    unitNumber: 5,
    unitTitle: 'Gravitational Field',
    topicTitle: 'Gravitational Field',
    subtopics: [
      'Gravitational Force Field',
      'Earth’s Gravitational Field',
    ],
    status: 'not_started',
  },

  // UNIT 6: ELECTROSTATIC FIELD
  {
    id: 'phy-06',
    subject: 'Physics',
    unitNumber: 6,
    unitTitle: 'Electrostatic Field',
    topicTitle: 'Electrostatic Field',
    subtopics: [
      'Electrostatic Force',
      'Flux Model of an Electrostatic Field',
      'Electrostatic Potential',
      'Electric Capacitance',
    ],
    status: 'not_started',
  },

  // UNIT 7: MAGNETIC FIELD
  {
    id: 'phy-07',
    subject: 'Physics',
    unitNumber: 7,
    unitTitle: 'Magnetic Field',
    topicTitle: 'Magnetic Field',
    subtopics: [
      'Magnetic Force',
      'Magnetic Force Field',
      'Torque acting on a Current Loop',
    ],
    status: 'not_started',
  },

  // UNIT 8: CURRENT ELECTRICITY
  {
    id: 'phy-08',
    subject: 'Physics',
    unitNumber: 8,
    unitTitle: 'Current Electricity',
    topicTitle: 'Current Electricity',
    subtopics: [
      'Basic Principles of Current Electricity',
      'Electric Energy and Power',
      'Electromotive Force',
      'Electrical Circuits – Kirchhoff’s Laws',
      'Measurement of Electric Current and Potential Difference',
      'Electromagnetic Induction',
    ],
    status: 'not_started',
  },

  // UNIT 9: ELECTRONICS
  {
    id: 'phy-09',
    subject: 'Physics',
    unitNumber: 9,
    unitTitle: 'Electronics',
    topicTitle: 'Electronics',
    subtopics: [
      'Semiconductors and Uses of Diodes',
      'Transistors',
      'Integrated Circuits and Operational Amplifiers',
      'Digital electronics',
    ],
    status: 'not_started',
  },

  // UNIT 10: MECHANICAL PROPERTIES OF MATTER
  {
    id: 'phy-10',
    subject: 'Physics',
    unitNumber: 10,
    unitTitle: 'Mechanical Properties of Matter',
    topicTitle: 'Mechanical Properties of Matter',
    subtopics: [
      // Subtopic: Elasticity
      'Elasticity: 1.1 Introduction',
      'Elasticity: 1.2 Elastic and inelastic substances',
      'Elasticity: 1.3 Graphical illustration of change in extension values through a wire for different weights applied',
      'Elasticity: 1.4 Hooke’s Law',
      'Elasticity: 1.5 Modulus of elasticity',
      'Elasticity: 1.6 Tensile stress, tensile strain and Young’s modulus',
      'Elasticity: 1.7 Graph of stress against strain',
      'Elasticity: 1.8 Experimental determination of Young’s modulus of a metal wire',
      'Elasticity: 1.9 Energy stored in an extended wire',
      'Elasticity: 1.10 Forces produced in rods and wires clamped at both ends during temperature changes',
      'Elasticity: 1.11 Applications of elasticity in day-to-day life',

      // Subtopic: Viscosity
      'Viscosity: 2.1 Introduction',
      'Viscosity: 2.2 Streamline and turbulent motions',
      'Viscosity: 2.3 Definition of the coefficient of viscosity',
      'Viscosity: 2.4 Poiseuille’s equation',
      'Viscosity: 2.5 Motion of a small spherical body falling freely through a viscous medium',
      'Viscosity: 2.5.1 Stokes’ Law',
      'Viscosity: 2.5.2 Derivation of an expression for the terminal velocity of a small spherical body moving through a viscous liquid',
      'Viscosity: 2.6 Ex-comparison of viscosities of different liquids',
      'Viscosity: 2.7 Application of viscosity',

      // Subtopic: Surface Tension
      'Surface Tension: 3.1 Introduction',
      'Surface Tension: 3.2 Explanation of surface tension using molecular theory',
      'Surface Tension: 3.3 Cohesive forces and adhesive forces',
      'Surface Tension: 3.4 Definition of surface tension',
      'Surface Tension: 3.5 Shapes of liquid surfaces and angle of contact',
      'Surface Tension: 3.6 The work done in increasing the surface area of a soap film',
      'Surface Tension: 3.7 Expression for the pressure difference across a spherical meniscus',
      'Surface Tension: 3.8 Derivation of the expression for capillary rise due to surface tension',
      'Surface Tension: 3.9 Methods of determining surface tension',
      'Surface Tension: 3.10 Applications of surface tension',
    ],
    status: 'not_started',
  },

  // UNIT 11: MATTER AND RADIATION
  {
    id: 'phy-11',
    subject: 'Physics',
    unitNumber: 11,
    unitTitle: 'Matter and Radiation',
    topicTitle: 'Matter and Radiation',
    subtopics: [
      // Subtopic: Quantum Nature of Radiation
      'Quantum Nature of Radiation: 1.1 Thermal radiation',
      'Quantum Nature of Radiation: 1.2 Basic properties of thermal radiation',
      'Quantum Nature of Radiation: 1.3 Thermal equilibrium',
      'Quantum Nature of Radiation: 1.4 Black body radiation',
      'Quantum Nature of Radiation: 1.5 Wien’s displacement law',
      'Quantum Nature of Radiation: 1.6 Stefan’s displacement law',
      'Quantum Nature of Radiation: 1.7 Emissivity of surface',
      'Quantum Nature of Radiation: 1.8 Absorptivity of a surface',
      'Quantum Nature of Radiation: 1.9 Explanation of intensity distribution for the black body radiation',

      // Subtopic: Photoelectric Effect
      'Photoelectric Effect: 2.1 The phenomenon of photoelectric effect',
      'Photoelectric Effect: 2.2 Demonstration of photoelectric effect using a photocell',

      // Subtopic: The Wave Nature of Matter
      'The Wave Nature of Matter: 3.1 Introduction',
      'The Wave Nature of Matter: 3.2 De Broglie relationship for matter waves',
      'The Wave Nature of Matter: 3.3 Diffraction of electrons',
      'The Wave Nature of Matter: 3.4 X-ray diffraction',
      'The Wave Nature of Matter: 3.5 Electron microscope',

      // Subtopic: X-Rays
      'X-Rays: 4.1 Cathode rays',
      'X-Rays: 4.2 X-rays',

      // Subtopic: Radioactivity
      'Radioactivity: 5.1 Introduction',
      'Radioactivity: 5.2 α, β and γ radiation',
      'Radioactivity: 5.3 Radioactive decay',
      'Radioactivity: 5.4 Radioactive isotopes',
      'Radioactivity: 5.5 α-emission (α-decay)',
      'Radioactivity: 5.6 β-emission (β-decay)',
      'Radioactivity: 5.7 γ-emission',
      'Radioactivity: 5.8 Radioactive nuclides',
      'Radioactivity: 5.9 Radioactive disintegration law',
      'Radioactivity: 5.10 Activity of a radioactive element (A)',
      'Radioactivity: 5.11 Radioactive dating or carbon dating',
      'Radioactivity: 5.13 Radiation hazards',
      'Radioactivity: 5.14 Radiation detectors',
    ],
    status: 'not_started',
  },

  // ================= CHEMISTRY =================
  {
    id: 'chem-01',
    subject: 'Chemistry',
    unitNumber: 1,
    unitTitle: 'Atomic Structure & Bonding',
    topicTitle: 'Quantum Numbers, Orbitals & Periodic Trends',
    subtopics: ['Aufbau Principle, Hund Rule & Pauli Principle', 'Electronegativity, Ionization Energy & Electron Affinity trends', 'VSEPR Theory & Molecular Geometries'],
    status: 'completed',
  },
  {
    id: 'chem-02',
    subject: 'Chemistry',
    unitNumber: 2,
    unitTitle: 'Chemical Calculations & Gaseous State',
    topicTitle: 'Mole Concept, Stoichiometry & Real Gases',
    subtopics: ['Titration stoichiometry (Redox & Acid-Base)', 'Dalton Law of Partial Pressures', 'Van der Waals equation of real gases'],
    status: 'completed',
  },
  {
    id: 'chem-03',
    subject: 'Chemistry',
    unitNumber: 3,
    unitTitle: 'Chemical Energetics',
    topicTitle: 'Hess Law, Born-Haber Cycles & Free Energy',
    subtopics: ['Enthalpy changes of formation, combustion, neutralization', 'Born-Haber cycle for ionic crystals', 'Gibbs Free Energy and Spontaneity (Delta G = Delta H - T Delta S)'],
    status: 'in_progress',
  },
  {
    id: 'chem-04',
    subject: 'Chemistry',
    unitNumber: 4,
    unitTitle: 'Inorganic Chemistry (s and p Block)',
    topicTitle: 'Reactions of Group 1, 2, 13, 14, 15, 16, 17, 18',
    subtopics: ['Thermal stability of carbonates, nitrates, hydroxides', 'Anomalous properties of second period elements', 'Halogens and interhalogen compounds', 'Sulfur and Nitrogen oxoacids'],
    status: 'in_progress',
  },
  {
    id: 'chem-05',
    subject: 'Chemistry',
    unitNumber: 5,
    unitTitle: 'Inorganic Chemistry (d Block)',
    topicTitle: 'Transition Metals & Coordination Chemistry',
    subtopics: ['Electronic configurations & variable oxidation states', 'Colors of transition metal ions and complexes', 'Catalytic properties and ligand substitutions'],
    status: 'not_started',
  },
  {
    id: 'chem-06',
    subject: 'Chemistry',
    unitNumber: 6,
    unitTitle: 'Chemical Kinetics & Equilibrium',
    topicTitle: 'Rate of Reactions & Dynamic Equilibrium',
    subtopics: ['Rate equation, order of reaction and Arrhenius equation', 'Kc and Kp calculations for homogeneous and heterogeneous systems', 'Le Chatelier principle applications'],
    status: 'in_progress',
  },
  {
    id: 'chem-07',
    subject: 'Chemistry',
    unitNumber: 7,
    unitTitle: 'Ionic Equilibrium & Phase Equilibria',
    topicTitle: 'pH, Buffer Solutions, Solubility Product (Ksp)',
    subtopics: ['Weak acids/bases dissociation (Ka, Kb, Kw)', 'Buffer action & Henderson-Hasselbalch equation', 'Common ion effect and selective precipitation (Ksp)', 'Raoult Law & Fractional Distillation'],
    status: 'not_started',
  },
  {
    id: 'chem-08',
    subject: 'Chemistry',
    unitNumber: 8,
    unitTitle: 'Organic Chemistry (Hydrocarbons)',
    topicTitle: 'Alkanes, Alkenes, Alkynes & Arenes (Benzene)',
    subtopics: ['Electrophilic addition to alkenes (Markovnikov rule)', 'Electrophilic aromatic substitution on benzene ring', 'Mechanism of nitration, halogenation, Friedel-Crafts alkylation'],
    status: 'completed',
  },
  {
    id: 'chem-09',
    subject: 'Chemistry',
    unitNumber: 9,
    unitTitle: 'Organic Chemistry (Functional Groups)',
    topicTitle: 'Alkyl Halides, Alcohols & Phenols',
    subtopics: ['SN1 and SN2 nucleophilic substitutions', 'Elimination vs substitution (E1, E2)', 'Reactions of phenols vs aliphatic alcohols', 'Distinguishing Lucas test and Victor Meyer'],
    status: 'in_progress',
  },
  {
    id: 'chem-10',
    subject: 'Chemistry',
    unitNumber: 10,
    unitTitle: 'Organic Chemistry (Carbonyls & Carboxylics)',
    topicTitle: 'Aldehydes, Ketones, Carboxylic Acids & Derivatives',
    subtopics: ['Nucleophilic addition to carbonyl group', 'Tollens and Fehling tests', 'Esterification, Amides & Acid Chlorides', 'Synthesis pathway questions in A/L'],
    status: 'not_started',
  },
  {
    id: 'chem-11',
    subject: 'Chemistry',
    unitNumber: 11,
    unitTitle: 'Electrochemistry',
    topicTitle: 'Electrochemical Cells & Electrolysis',
    subtopics: ['Standard electrode potentials & Nernst Equation', 'Faraday Laws of Electrolysis', 'Commercial batteries and prevention of corrosion'],
    status: 'not_started',
  },
  {
    id: 'chem-12',
    subject: 'Chemistry',
    unitNumber: 12,
    unitTitle: 'Environmental & Industrial Chemistry',
    topicTitle: 'Industrial Chemical Processes in Sri Lanka',
    subtopics: ['Manufacture of ammonia (Haber), nitric acid, sulfuric acid', 'Extraction of titanium, salt and soap industries', 'Air and water pollution, BOD and COD'],
    status: 'not_started',
  },

  // ================= BIOLOGY =================
  {
    id: 'bio-01',
    subject: 'Biology',
    unitNumber: 1,
    unitTitle: 'Chemical Basis of Life',
    topicTitle: 'Biomolecules, Water & Enzyme Catalysis',
    subtopics: ['Carbohydrates, Proteins, Lipids & Nucleic Acids', 'Properties of Water sustaining biological systems', 'Enzyme kinetics, inhibitors & cofactors'],
    status: 'completed',
  },
  {
    id: 'bio-02',
    subject: 'Biology',
    unitNumber: 2,
    unitTitle: 'Cell Biology',
    topicTitle: 'Cell Structure, Membrane Transport & Cell Division',
    subtopics: ['Ultrastructure of organelles in plant and animal cells', 'Fluid mosaic model and active/passive transport', 'Mitosis, Meiosis & Regulation of cell cycle'],
    status: 'completed',
  },
  {
    id: 'bio-03',
    subject: 'Biology',
    unitNumber: 3,
    unitTitle: 'Diversity of Organisms',
    topicTitle: 'Five Kingdoms & Characteristic Phylums',
    subtopics: ['Domain Archaea, Bacteria, Eukarya', 'Classification of Plantae and Animalia', 'Key evolutionary adaptations and life cycles'],
    status: 'in_progress',
  },
  {
    id: 'bio-04',
    subject: 'Biology',
    unitNumber: 4,
    unitTitle: 'Plant Form & Function',
    topicTitle: 'Photosynthesis, Water Transport & Plant Nutrition',
    subtopics: ['Light-dependent & Calvin cycle reactions (C3, C4, CAM)', 'Transpiration pull, apoplastic & symplastic pathways', 'Phloem translocation (Pressure-flow hypothesis)', 'Plant hormones (Auxins, Gibberellins, Cytokinins)'],
    status: 'in_progress',
  },
  {
    id: 'bio-05',
    subject: 'Biology',
    unitNumber: 5,
    unitTitle: 'Animal Form & Function',
    topicTitle: 'Human Digestive, Circulatory & Respiratory Systems',
    subtopics: ['Enzymatic digestion & absorption of nutrients', 'Human heart, cardiac cycle & blood pressure regulation', 'Gas exchange in alveoli and transport of O2 & CO2'],
    status: 'not_started',
  },
  {
    id: 'bio-06',
    subject: 'Biology',
    unitNumber: 5,
    unitTitle: 'Animal Form & Function (Control Systems)',
    topicTitle: 'Nervous & Endocrine Coordination, Excretion',
    subtopics: ['Action potential propagation & synaptic transmission', 'Hypothalamus and pituitary hormone feedback', 'Nephron structure, ultrafiltration & osmoregulation'],
    status: 'not_started',
  },
  {
    id: 'bio-07',
    subject: 'Biology',
    unitNumber: 6,
    unitTitle: 'Genetics & Molecular Biology',
    topicTitle: 'Mendelian Genetics, DNA Replication & Gene Expression',
    subtopics: ['Monohybrid and dihybrid crosses with testcrosses', 'Transcription, translation and the genetic code', 'Recombinant DNA technology & PCR in Sri Lanka'],
    status: 'not_started',
  },
  {
    id: 'bio-08',
    subject: 'Biology',
    unitNumber: 7,
    unitTitle: 'Environmental & Applied Biology',
    topicTitle: 'Ecosystems, Biodiversity & Biotechnology',
    subtopics: ['Biomes of Sri Lanka and endemic fauna/flora', 'Threats to biodiversity and in-situ/ex-situ conservation', 'Microbial fermentation, food tech and biopesticides'],
    status: 'not_started',
  },

  // ================= ICT =================
  {
    id: 'ict-01',
    subject: 'ICT',
    unitNumber: 1,
    unitTitle: 'Information & Digital Systems',
    topicTitle: 'Number Systems, Data Representation & Logic Gates',
    subtopics: ['Binary, Octal, Hexadecimal conversions', 'Two-complement & floating point representations', 'Boolean algebra theorems and Karnaugh Maps (K-Maps)'],
    status: 'completed',
  },
  {
    id: 'ict-02',
    subject: 'ICT',
    unitNumber: 2,
    unitTitle: 'Computer Architecture & Operating Systems',
    topicTitle: 'CPU Architecture, Memory Hierarchy & Process Scheduling',
    subtopics: ['Von Neumann architecture, registers & bus system', 'Cache memory, virtual memory & paging', 'OS process states, scheduling algorithms (FCFS, Round Robin)'],
    status: 'in_progress',
  },
  {
    id: 'ict-03',
    subject: 'ICT',
    unitNumber: 3,
    unitTitle: 'Data Communication & Networking',
    topicTitle: 'OSI & TCP/IP Layers, IP Subnetting & Network Security',
    subtopics: ['Functions of 7 OSI layers vs 4 TCP/IP layers', 'IPv4 addressing, subnet masks and CIDR calculations', 'Routing protocols, firewalls and encryption principles'],
    status: 'not_started',
  },
  {
    id: 'ict-04',
    subject: 'ICT',
    unitNumber: 4,
    unitTitle: 'Database Management Systems',
    topicTitle: 'ER Diagrams, Relational Normalization & SQL',
    subtopics: ['Entities, attributes and relationship cardinalities', '1NF, 2NF, 3NF normalization rules', 'SQL DDL, DML and nested query writing'],
    status: 'in_progress',
  },
  {
    id: 'ict-05',
    subject: 'ICT',
    unitNumber: 5,
    unitTitle: 'Programming in Python',
    topicTitle: 'Algorithms, Control Structures & Data Structures',
    subtopics: ['Flowcharts and pseudocode tracing', 'Lists, Dictionaries, Tuples and File Handling', 'Functions, recursion and error handling in Python'],
    status: 'in_progress',
  },
];

export function getInitialTimetableForStream(
  stream: StreamType | string,
  physicalScienceElective: 'Chemistry' | 'ICT' | string = 'Chemistry'
): TimetableEntry[] {
  const isBio = stream === 'Biological Science' || (stream as string) === 'Bio';
  const isIct = !isBio && physicalScienceElective === 'ICT';

  return INITIAL_TIMETABLE_ENTRIES.map((entry) => {
    if (isBio && entry.subject === 'Combined Mathematics') {
      const bioTopicMap: Record<string, string> = {
        'tt-mon-1': 'Plant Form: Photosynthesis & Calvin Cycle',
        'tt-tue-2': 'Genetics: Mendelian Dihybrid Crosses & Testcrosses',
        'tt-wed-2': 'Animal Physiology: Human Nephron & Countercurrent System',
        'tt-thu-3': 'Cell Biology: Mitosis, Meiosis & Cell Cycle Regulation',
        'tt-fri-1': 'Molecular Biology: DNA Replication & Translation',
        'tt-sat-1': 'Full 50 MCQ Past Paper Timed Simulation (Paper I)',
        'tt-sun-1': 'Diversity of Organisms: Kingdom Classification Drill',
      };
      return {
        ...entry,
        id: `bio-${entry.id}`,
        subject: 'Biology',
        topic: bioTopicMap[entry.id] || 'Biology Core Unit Study Block',
        color: 'emerald',
      };
    }

    if (isIct && entry.subject === 'Chemistry') {
      const ictTopicMap: Record<string, string> = {
        'tt-mon-3': 'Number Systems & Karnaugh Maps (K-Maps)',
        'tt-tue-3': 'Computer Architecture & Memory Hierarchy',
        'tt-wed-1': 'Data Communication: TCP/IP & IPv4 Subnetting',
        'tt-thu-2': 'Database Systems: ER Diagrams & 3NF Normalization',
        'tt-fri-3': 'Python Programming: Algorithms, Recursion & File I/O',
        'tt-sat-3': 'Full 50 MCQ Past Paper Timed Simulation & Tracing',
        'tt-sun-3': 'Web Technologies & Network Security Analysis',
      };
      return {
        ...entry,
        id: `ict-${entry.id}`,
        subject: 'ICT',
        topic: ictTopicMap[entry.id] || 'ICT Python & Database Practice',
        color: 'pink',
      };
    }

    return entry;
  });
}

export const INITIAL_TIMETABLE_ENTRIES: TimetableEntry[] = [
  // Monday
  {
    id: 'tt-mon-1',
    dayOfWeek: 'Monday',
    subject: 'Combined Mathematics',
    topic: 'Mechanics: Coplanar Forces & Rod Equilibrium',
    startTime: '06:00',
    endTime: '08:00',
    color: 'indigo',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Solve 2018-2022 Structured Essay questions on friction and tipping',
  },
  {
    id: 'tt-mon-2',
    dayOfWeek: 'Monday',
    subject: 'Physics',
    topic: 'Oscillations & Waves: Resonance & Doppler Shift',
    startTime: '16:00',
    endTime: '18:00',
    color: 'cyan',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Formula recall + 15 past MCQ questions on sound speed',
  },
  {
    id: 'tt-mon-3',
    dayOfWeek: 'Monday',
    subject: 'Chemistry',
    topic: 'Inorganic Chemistry: Group 2 and Group 17 Halogens',
    startTime: '20:00',
    endTime: '22:00',
    color: 'purple',
    reminderEnabled: false,
    reminderOffsetMinutes: 0,
    notes: 'Review precipitation colors & thermal decomposition temperatures',
  },

  // Tuesday
  {
    id: 'tt-tue-1',
    dayOfWeek: 'Tuesday',
    subject: 'Physics',
    topic: 'Mechanics: Rotational Dynamics & Moment of Inertia',
    startTime: '06:00',
    endTime: '08:00',
    color: 'cyan',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Rolling without slipping derivations & kinetic energy conservation',
  },
  {
    id: 'tt-tue-2',
    dayOfWeek: 'Tuesday',
    subject: 'Combined Mathematics',
    topic: 'Integration: Integration by Parts & Partial Fractions',
    startTime: '15:30',
    endTime: '17:30',
    color: 'indigo',
    reminderEnabled: true,
    reminderOffsetMinutes: 10,
    notes: 'Work through 10 standard A/L integral reductions',
  },
  {
    id: 'tt-tue-3',
    dayOfWeek: 'Tuesday',
    subject: 'Chemistry',
    topic: 'Organic Chemistry: Alkene & Benzene Mechanisms',
    startTime: '20:00',
    endTime: '22:00',
    color: 'purple',
    reminderEnabled: false,
    reminderOffsetMinutes: 0,
    notes: 'Draw complete curly arrows for electrophilic aromatic substitutions',
  },

  // Wednesday
  {
    id: 'tt-wed-1',
    dayOfWeek: 'Wednesday',
    subject: 'Chemistry',
    topic: 'Physical Chemistry: Chemical Equilibrium & Kc/Kp',
    startTime: '06:00',
    endTime: '08:00',
    color: 'purple',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Haber process pressure shift & temperature equilibrium shifts',
  },
  {
    id: 'tt-wed-2',
    dayOfWeek: 'Wednesday',
    subject: 'Combined Mathematics',
    topic: 'Calculus: Curve Sketching & Optimization Maxima/Minima',
    startTime: '16:00',
    endTime: '18:00',
    color: 'indigo',
    reminderEnabled: false,
    reminderOffsetMinutes: 0,
    notes: 'Asymptotes and inflection points practice',
  },
  {
    id: 'tt-wed-3',
    dayOfWeek: 'Wednesday',
    subject: 'Physics',
    topic: 'Current Electricity: Potentiometer & Kirchhoff Laws',
    startTime: '20:00',
    endTime: '22:00',
    color: 'cyan',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Review internal resistance calibration circuit diagrams',
  },

  // Thursday
  {
    id: 'tt-thu-1',
    dayOfWeek: 'Thursday',
    subject: 'Physics',
    topic: 'Thermal Physics: Ideal Gas Laws & Thermodynamics Cycles',
    startTime: '06:00',
    endTime: '08:00',
    color: 'cyan',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'P-V indicator diagrams & work done calculations',
  },
  {
    id: 'tt-thu-2',
    dayOfWeek: 'Thursday',
    subject: 'Chemistry',
    topic: 'Organic Chemistry: Aldehydes, Ketones & Tests',
    startTime: '16:00',
    endTime: '18:00',
    color: 'purple',
    reminderEnabled: false,
    reminderOffsetMinutes: 0,
    notes: 'Tollens, Fehling and 2,4-DNP reactions',
  },
  {
    id: 'tt-thu-3',
    dayOfWeek: 'Thursday',
    subject: 'Combined Mathematics',
    topic: 'Applied Maths: Projectiles on Incline Planes',
    startTime: '20:00',
    endTime: '22:30',
    color: 'indigo',
    reminderEnabled: true,
    reminderOffsetMinutes: 30,
    notes: 'Range along the inclined plane formulas',
  },

  // Friday
  {
    id: 'tt-fri-1',
    dayOfWeek: 'Friday',
    subject: 'Combined Mathematics',
    topic: 'Trigonometry: General Solutions & Multiple Angles',
    startTime: '06:00',
    endTime: '08:00',
    color: 'indigo',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Identity transformations and range restrictions',
  },
  {
    id: 'tt-fri-2',
    dayOfWeek: 'Friday',
    subject: 'Physics',
    topic: 'Electronics & Modern Physics: Op-Amps & Diodes',
    startTime: '16:00',
    endTime: '18:00',
    color: 'cyan',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Virtual earth concept & voltage gain calculations',
  },
  {
    id: 'tt-fri-3',
    dayOfWeek: 'Friday',
    subject: 'Chemistry',
    topic: 'Chemical Energetics: Hess Law & Born-Haber Cycles',
    startTime: '20:00',
    endTime: '22:00',
    color: 'purple',
    reminderEnabled: false,
    reminderOffsetMinutes: 0,
    notes: 'Lattice energy vs hydration enthalpy energy level diagrams',
  },

  // Saturday
  {
    id: 'tt-sat-1',
    dayOfWeek: 'Saturday',
    subject: 'Combined Mathematics',
    topic: 'Full 50 MCQ Past Paper Timed Simulation (Paper I)',
    startTime: '08:00',
    endTime: '10:00',
    color: 'indigo',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Strict exam timing: 2 hours, no interruptions',
  },
  {
    id: 'tt-sat-2',
    dayOfWeek: 'Saturday',
    subject: 'Physics',
    topic: 'Full 50 MCQ Past Paper Timed Simulation',
    startTime: '13:30',
    endTime: '15:30',
    color: 'cyan',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Review all incorrect choices immediately after marking',
  },
  {
    id: 'tt-sat-3',
    dayOfWeek: 'Saturday',
    subject: 'Chemistry',
    topic: 'Structured Essay & Essay Writing Drill (Unit 04 & 08)',
    startTime: '16:30',
    endTime: '19:00',
    color: 'purple',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Practice writing structured points for markings scheme accuracy',
  },

  // Sunday
  {
    id: 'tt-sun-1',
    dayOfWeek: 'Sunday',
    subject: 'Combined Mathematics',
    topic: 'Mistake Analysis & Formula Revision Log',
    startTime: '08:30',
    endTime: '11:00',
    color: 'indigo',
    reminderEnabled: false,
    reminderOffsetMinutes: 0,
    notes: 'Re-attempt tricky problems from Saturday MCQ simulation',
  },
  {
    id: 'tt-sun-2',
    dayOfWeek: 'Sunday',
    subject: 'Physics',
    topic: 'Practical Experiments Revision: Spherometer, S.H.C, Potentiometer',
    startTime: '14:00',
    endTime: '16:30',
    color: 'cyan',
    reminderEnabled: true,
    reminderOffsetMinutes: 15,
    notes: 'Draw experimental setups and error calculations',
  },
  {
    id: 'tt-sun-3',
    dayOfWeek: 'Sunday',
    subject: 'Chemistry',
    topic: 'Industrial Chemistry & Environmental Pollution Short Notes',
    startTime: '17:30',
    endTime: '19:30',
    color: 'purple',
    reminderEnabled: false,
    reminderOffsetMinutes: 0,
    notes: 'Summarize chemical equations for Haber, Contact and Solvay processes',
  },
];
