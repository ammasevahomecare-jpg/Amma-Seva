import React from "react";

interface HealthcareSilhouetteBorderProps {
  className?: string;
  fillColor?: string;
  accentColor?: string;
  flip?: boolean;
  opacity?: number;
}

export function HealthcareSilhouetteBorder({
  className = "w-full h-24 sm:h-32 lg:h-40",
  fillColor = "#0b183b",
  accentColor = "#c9a24c",
  flip = false,
  opacity = 1,
}: HealthcareSilhouetteBorderProps) {
  return (
    <div
      className={`relative w-full overflow-hidden select-none pointer-events-none ${flip ? "rotate-180" : ""} ${className}`}
      style={{ opacity }}
    >
      <svg
        viewBox="0 0 1600 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax slice"
        className="w-full h-full block"
      >
        <defs>
          <linearGradient id="vanGradient" x1="450" y1="40" x2="680" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.95" />
            <stop offset="100%" stopColor={fillColor} />
          </linearGradient>
          <linearGradient id="goldGlow" x1="0" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
            <stop offset="30%" stopColor={accentColor} stopOpacity="0.4" />
            <stop offset="50%" stopColor={accentColor} stopOpacity="0.8" />
            <stop offset="70%" stopColor={accentColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ============================================================ */}
        {/* BASELINE GROUND STRIP & GOLD ACCENT LINE                     */}
        {/* ============================================================ */}
        <rect x="0" y="188" width="1600" height="12" fill={fillColor} />
        <rect x="0" y="186" width="1600" height="2" fill="url(#goldGlow)" />

        {/* ============================================================ */}
        {/* SCENE 1: COMMUNITY CARE & REVERENCE (x: 10 - 150)           */}
        {/* Leftmost caregiver handing healthcare kit/support with bowing */}
        {/* ============================================================ */}
        {/* Standing Caregiver Figure */}
        <g fill={fillColor}>
          {/* Head */}
          <circle cx="45" cy="45" r="14" />
          {/* Body & Coat */}
          <path d="M30 65 C30 58, 60 58, 60 65 L68 120 L62 188 L46 188 L47 135 L43 135 L40 188 L25 188 L30 115 Z" />
          {/* Arm extending forward holding healthcare kit */}
          <path d="M52 70 L95 95 L95 105 L52 82 Z" />
          {/* Care Kit Box with cross */}
          <rect x="90" y="86" width="36" height="26" rx="3" fill={fillColor} />
        </g>
        {/* Gold emblem on care kit */}
        <path d="M108 92 L108 106 M101 99 L115 99" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />

        {/* Recipient Figure (Elderly person bowing with hands receiving) */}
        <g fill={fillColor}>
          {/* Head */}
          <circle cx="160" cy="58" r="13" />
          {/* Traditional Robe/Dhoti Body */}
          <path d="M145 76 C145 70, 175 70, 175 76 L180 135 L175 188 L160 188 L160 145 L155 145 L150 188 L138 188 L142 125 Z" />
          {/* Arms stretched outward to receive */}
          <path d="M150 82 L122 96 L123 106 L150 92 Z" />
        </g>

        {/* ============================================================ */}
        {/* SCENE 2: BEDSIDE ELDERLY CARE & ATTENDANT (x: 200 - 320)     */}
        {/* Attendant kneeling/sitting caring for seated senior          */}
        {/* ============================================================ */}
        {/* Seated Senior in Armchair */}
        <g fill={fillColor}>
          {/* Armchair back & seat */}
          <path d="M210 110 L210 188 L220 188 L220 150 L270 150 L270 188 L280 188 L280 140 C280 120, 260 110, 240 110 Z" opacity="0.4" />
          {/* Seated Person Head */}
          <circle cx="238" cy="90" r="12" />
          {/* Seated Body */}
          <path d="M228 106 C228 102, 250 102, 250 106 L254 148 L275 152 L275 188 L260 188 L255 160 L235 160 L230 188 L220 188 Z" />
          {/* Senior Arm resting */}
          <path d="M242 115 L260 135 L280 135 L280 142 L256 142 Z" />
        </g>

        {/* Attendant bending gently & checking pulse */}
        <g fill={fillColor}>
          {/* Head */}
          <circle cx="310" cy="85" r="11" />
          {/* Body bent forward */}
          <path d="M300 100 C300 95, 322 95, 322 100 L320 140 L330 188 L318 188 L312 145 L306 145 L302 188 L290 188 L295 130 Z" />
          {/* Hands holding senior's wrist */}
          <path d="M305 106 L280 133 L280 140 L308 116 Z" />
        </g>

        {/* ============================================================ */}
        {/* SCENE 3: SENIOR WITH CANE & CAREGIVER WALK (x: 350 - 460)   */}
        {/* Compassionate escort supporting grandfather with cane       */}
        {/* ============================================================ */}
        <g fill={fillColor}>
          {/* Grandfather Head with hair/turban profile */}
          <circle cx="375" cy="50" r="13" />
          {/* Grandfather Body (slightly stooped) */}
          <path d="M362 70 C362 64, 390 64, 390 70 L392 130 L395 188 L380 188 L378 140 L372 140 L368 188 L355 188 L360 120 Z" />
          {/* Walking Stick / Cane */}
          <path d="M352 100 L350 188 L354 188 L356 100 C356 94, 348 94, 352 100 Z" />
          {/* Grandfather Hand on cane */}
          <path d="M370 80 L353 100 L357 106 L374 86 Z" />

          {/* Attendant Figure holding grandfather's arm */}
          <circle cx="420" cy="46" r="12" />
          <path d="M408 65 C408 60, 432 60, 432 65 L436 125 L442 188 L428 188 L424 135 L418 135 L414 188 L402 188 L406 115 Z" />
          {/* Attendant supporting arm around grandfather */}
          <path d="M412 75 L385 88 L387 96 L414 83 Z" />
        </g>

        {/* ============================================================ */}
        {/* SCENE 4: AMMA SEVA CARE VEHICLE & TRANSIT (x: 480 - 740)    */}
        {/* Multi-Tasking rapid dispatch medical van with staff loading */}
        {/* ============================================================ */}
        <g>
          {/* Van Silhouette Main Body */}
          <path
            d="M500 175 L500 80 C500 65, 520 55, 545 55 L670 55 C690 55, 715 75, 725 95 L755 125 C762 132, 765 142, 765 155 L765 175 Z"
            fill="url(#vanGradient)"
          />

          {/* Cabin Windshield cutout (light silhouette) */}
          <path d="M718 95 L685 70 L645 70 L645 110 L732 110 Z" fill="#ffffff" fillOpacity="0.85" />
          {/* Passenger Window cutout */}
          <rect x="580" y="70" width="50" height="40" rx="4" fill="#ffffff" fillOpacity="0.85" />
          {/* Rear Window cutout */}
          <rect x="515" y="70" width="50" height="40" rx="4" fill="#ffffff" fillOpacity="0.85" />

          {/* Wheels */}
          <circle cx="550" cy="175" r="22" fill={fillColor} />
          <circle cx="550" cy="175" r="14" fill="#ffffff" fillOpacity="0.9" />
          <circle cx="550" cy="175" r="6" fill={fillColor} />

          <circle cx="705" cy="175" r="22" fill={fillColor} />
          <circle cx="705" cy="175" r="14" fill="#ffffff" fillOpacity="0.9" />
          <circle cx="705" cy="175" r="6" fill={fillColor} />

          {/* Amma Seva Van Side Branding Shield & Text */}
          <g transform="translate(565, 120)">
            {/* Sacred Urn / Kalasam / Cross Gold Icon */}
            <circle cx="16" cy="14" r="12" fill={accentColor} fillOpacity="0.25" stroke={accentColor} strokeWidth="1.5" />
            <path d="M16 6 L16 22 M10 14 L22 14" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" />
            <text x="34" y="12" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.5">
              AMMA SEVA
            </text>
            <text x="34" y="23" fill={accentColor} fontSize="7.5" fontWeight="800" fontFamily="sans-serif" letterSpacing="0.8">
              HOME HEALTHCARE &bull; 24/7
            </text>
          </g>

          {/* Care Assistant at back of van loading medical kit */}
          <circle cx="478" cy="55" r="11" fill={fillColor} />
          <path d="M468 72 C468 66, 488 66, 488 72 L490 120 L496 188 L482 188 L480 135 L474 135 L470 188 L458 188 L462 110 Z" fill={fillColor} />
          {/* Arm holding oxygen / care kit into van */}
          <path d="M482 80 L505 92 L503 100 L480 88 Z" fill={fillColor} />
        </g>

        {/* ============================================================ */}
        {/* SCENE 5: DOCTOR & CLINICAL CONSULTATION (x: 790 - 890)      */}
        {/* Doctor with stethoscope greeting patient                    */}
        {/* ============================================================ */}
        <g fill={fillColor}>
          {/* Doctor with stethoscope */}
          <circle cx="810" cy="42" r="13" />
          {/* Doctor Long White Apron / Coat Silhouette */}
          <path d="M796 62 C796 56, 824 56, 824 62 L828 140 L824 188 L810 188 L810 150 L804 150 L804 188 L792 188 L794 130 Z" />
          {/* Stethoscope around neck */}
          <path d="M802 65 C802 78, 818 78, 818 65" stroke={accentColor} strokeWidth="2" fill="none" />
          <circle cx="810" cy="80" r="3" fill={accentColor} />
          {/* Doctor Clipboard in hand */}
          <path d="M820 75 L842 90 L838 98 L816 82 Z" />
          <rect x="836" y="85" width="14" height="20" rx="2" fill={fillColor} />

          {/* Patient greeting with Namaste / Folded Hands */}
          <circle cx="875" cy="48" r="12" />
          <path d="M864 68 C864 62, 888 62, 888 68 L890 125 L896 188 L882 188 L880 140 L874 140 L870 188 L858 188 L862 115 Z" />
          {/* Folded hands in respect */}
          <path d="M868 76 L855 88 L857 95 L872 82 Z" />
        </g>

        {/* ============================================================ */}
        {/* SCENE 6: WHEELCHAIR REHABILITATION (x: 920 - 1050)          */}
        {/* Attendant pushing senior patient in modern wheelchair       */}
        {/* ============================================================ */}
        <g fill={fillColor}>
          {/* Attendant behind wheelchair */}
          <circle cx="945" cy="45" r="12" />
          <path d="M934 64 C934 58, 956 58, 956 64 L958 120 L964 188 L952 188 L948 135 L942 135 L938 188 L926 188 L930 110 Z" />
          {/* Arms pushing handles */}
          <path d="M948 72 L975 88 L974 95 L946 80 Z" />

          {/* Wheelchair Frame */}
          <path d="M975 88 L975 140 L1015 140 L1015 170 L1025 170 L1025 130 L985 130 L985 88 Z" stroke={fillColor} strokeWidth="4" />
          {/* Big Wheel */}
          <circle cx="995" cy="160" r="26" stroke={fillColor} strokeWidth="3.5" fill="none" />
          <circle cx="995" cy="160" r="5" fill={fillColor} />
          <line x1="995" y1="134" x2="995" y2="186" stroke={fillColor} strokeWidth="1.5" />
          <line x1="969" y1="160" x2="1021" y2="160" stroke={fillColor} strokeWidth="1.5" />
          {/* Small Front Wheel */}
          <circle cx="1025" cy="180" r="8" fill={fillColor} />

          {/* Seated Senior Patient */}
          <circle cx="1005" cy="98" r="12" />
          <path d="M994 115 C994 110, 1016 110, 1016 115 L1018 142 L1035 145 L1035 175 L1022 175 L1022 152 L1000 152 L996 175 L985 175 Z" />
        </g>

        {/* ============================================================ */}
        {/* SCENE 7: MOTHER & NEWBORN BLESSING (x: 1080 - 1190)         */}
        {/* Mother lovingly cradling and lifting newborn infant         */}
        {/* ============================================================ */}
        <g fill={fillColor}>
          {/* Mother Figure */}
          <circle cx="1110" cy="46" r="12" />
          {/* Mother Saree Flowing Silhouette */}
          <path d="M1098 65 C1098 58, 1124 58, 1124 65 L1130 135 L1135 188 L1118 188 L1114 145 L1108 145 L1102 188 L1088 188 L1092 120 Z" />
          {/* Mother arms lifting baby */}
          <path d="M1116 75 L1142 62 L1145 70 L1120 84 Z" />

          {/* Baby in air / swaddled bundle */}
          <circle cx="1150" cy="52" r="7" fill={fillColor} />
          <path d="M1143 58 C1143 54, 1162 54, 1162 60 L1158 76 C1155 80, 1145 80, 1143 74 Z" fill={fillColor} />

          {/* Pediatric Care Specialist standing beside with gentle hands */}
          <circle cx="1185" cy="44" r="11" />
          <path d="M1174 62 C1174 56, 1196 56, 1196 62 L1198 125 L1204 188 L1192 188 L1188 140 L1182 140 L1178 188 L1166 188 L1170 115 Z" />
          {/* Supporting hand towards baby */}
          <path d="M1180 72 L1162 78 L1160 85 L1182 78 Z" />
        </g>

        {/* ============================================================ */}
        {/* SCENE 8: CHILDREN RUNNING & VITALITY (x: 1230 - 1340)       */}
        {/* Joyful kids running and playing, symbolizing life restored  */}
        {/* ============================================================ */}
        <g fill={fillColor}>
          {/* Child 1 Running (Boy with ball) */}
          <circle cx="1255" cy="95" r="9" />
          <path d="M1248 108 C1248 104, 1264 104, 1264 108 L1262 142 L1278 178 L1268 182 L1256 150 L1248 185 L1238 180 L1246 138 Z" />
          {/* Arms swinging in run */}
          <path d="M1252 114 L1236 128 L1240 134 L1256 120 Z" />
          <path d="M1260 114 L1278 108 L1280 115 L1262 122 Z" />
          {/* Floating joy ball / balloon in air */}
          <circle cx="1295" cy="45" r="10" fill={accentColor} />

          {/* Child 2 (Girl leaping in joy) */}
          <circle cx="1325" cy="80" r="9" />
          <path d="M1318 94 C1318 89, 1334 89, 1334 94 L1336 130 L1348 175 L1338 178 L1330 142 L1320 176 L1310 172 L1318 125 Z" />
          {/* Arms raised up in air */}
          <path d="M1322 98 L1308 72 L1314 68 L1328 92 Z" />
          <path d="M1330 98 L1344 72 L1350 76 L1334 94 Z" />
        </g>

        {/* ============================================================ */}
        {/* SCENE 9: CELEBRATION & EMPOWERMENT (x: 1370 - 1580)         */}
        {/* Graduate / healed senior with cap & happy family cheering   */}
        {/* ============================================================ */}
        <g fill={fillColor}>
          {/* Recovered Youth / Graduate Figure with Mortarboard Cap */}
          <circle cx="1405" cy="40" r="12" />
          {/* Mortarboard Hat */}
          <polygon points="1405,20 1425,28 1405,36 1385,28" fill={accentColor} />
          <rect x="1400" y="32" width="10" height="7" fill={fillColor} />
          <line x1="1425" y1="28" x2="1430" y2="46" stroke={accentColor} strokeWidth="2" />

          {/* Body leaping / hands high in triumph */}
          <path d="M1394 58 C1394 52, 1418 52, 1418 58 L1420 120 L1430 188 L1418 188 L1412 135 L1406 135 L1402 188 L1390 188 L1392 110 Z" />
          {/* Both arms raised to sky with scroll in hand */}
          <path d="M1398 64 L1380 32 L1388 28 L1404 60 Z" />
          <path d="M1414 64 L1432 30 L1440 34 L1418 62 Z" />
          {/* Degree scroll in right hand */}
          <rect x="1434" y="22" width="12" height="6" rx="2" fill={accentColor} transform="rotate(30, 1434, 22)" />

          {/* Family Member 1 (Cheering Father / Senior) */}
          <circle cx="1470" cy="46" r="12" />
          <path d="M1458 65 C1458 58, 1482 58, 1482 65 L1485 125 L1492 188 L1478 188 L1474 135 L1468 135 L1464 188 L1452 188 L1456 115 Z" />
          <path d="M1464 72 L1446 50 L1452 46 L1470 66 Z" />
          <path d="M1478 72 L1498 52 L1504 56 L1482 74 Z" />

          {/* Family Member 2 (Cheering Mother / Grandmother) */}
          <circle cx="1530" cy="50" r="12" />
          <path d="M1518 70 C1518 64, 1542 64, 1542 70 L1545 130 L1552 188 L1538 188 L1534 140 L1528 140 L1524 188 L1512 188 L1516 120 Z" />
          <path d="M1524 78 L1505 58 L1511 54 L1528 72 Z" />
          <path d="M1536 78 L1555 60 L1561 64 L1540 80 Z" />

          {/* Rightmost Care Worker with stethoscope giving thumbs up */}
          <circle cx="1575" cy="48" r="11" />
          <path d="M1564 66 C1564 60, 1588 60, 1588 66 L1592 130 L1598 188 L1585 188 L1582 140 L1576 140 L1572 188 L1560 188 L1564 118 Z" />
          <path d="M1570 74 L1555 92 L1558 98 L1574 80 Z" />
        </g>

        {/* Ambient subtle floating stars & heartbeats */}
        <g fill={accentColor} opacity="0.6">
          <circle cx="120" cy="30" r="2.5" />
          <circle cx="450" cy="25" r="3" />
          <circle cx="770" cy="20" r="2.5" />
          <circle cx="1060" cy="28" r="3" />
          <circle cx="1360" cy="22" r="3" />
        </g>
      </svg>
    </div>
  );
}
