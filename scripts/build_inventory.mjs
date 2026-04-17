// Generates src/data/inventory.json with 50 items distributed across 3 categories.
// 8 items are emitted with imageURL = null to force the Nano Banana fallback at runtime.
// Other items use Picsum Photos (deterministic seed) as a stand-in for Unsplash search results.
//
// Usage: node scripts/build_inventory.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "../src/data/inventory.json");

const items = [
  // ── Fotografía y Video (17 items) ──────────────────────────────────────
  ["fv01", "Cámara Sony A7 IV", "fotografia-video", "Full-frame mirrorless de 33MP ideal para foto y video 4K.", 1200, { Sensor: "Full-frame 33MP", Video: "4K 60p", Estabilización: "5 ejes" }],
  ["fv02", "Cámara Canon EOS R5", "fotografia-video", "Cuerpo profesional 45MP con video 8K RAW.", 1800, { Sensor: "Full-frame 45MP", Video: "8K RAW", ISO: "100-51200" }],
  ["fv03", "Cámara Nikon Z6 II", "fotografia-video", "Mirrorless versátil para foto de acción y video UHD.", 950, { Sensor: "Full-frame 24.5MP", Video: "4K 60p", Enfoque: "273 puntos" }],
  ["fv04", "Cámara Fujifilm X-T5", "fotografia-video", "APS-C de 40MP con color science legendario.", 780, { Sensor: "APS-C 40MP", Video: "6.2K", Peso: "557g" }],
  ["fv05", "Lente Sigma 24-70mm f/2.8", "fotografia-video", "Zoom estándar de apertura constante para retratos y eventos.", 420, { Montura: "Sony E", Apertura: "f/2.8", Rango: "24-70mm" }],
  ["fv06", "Lente Canon RF 70-200mm f/2.8", "fotografia-video", "Telefoto profesional compacto con estabilización.", 650, { Montura: "Canon RF", Apertura: "f/2.8", Rango: "70-200mm" }],
  ["fv07", "Gimbal DJI RS 3 Pro", "fotografia-video", "Estabilizador de 3 ejes para cámaras de cine ligeras.", 380, { Capacidad: "4.5kg", Batería: "12h", Peso: "1.5kg" }],
  ["fv08", "Drone DJI Mavic 3 Pro", "fotografia-video", "Drone cinemático con cámara Hasselblad y triple lente.", 890, { Vuelo: "43min", Video: "5.1K", Alcance: "15km" }],
  ["fv09", "Drone DJI Air 3", "fotografia-video", "Dual-cámara compacto ideal para creadores de contenido.", 450, null],
  ["fv10", "Iluminación Aputure 300x", "fotografia-video", "LED bi-color para producción profesional.", 320, { Potencia: "350W", CCT: "2700-6500K", Índice: "CRI 96+" }],
  ["fv11", "Softbox Godox 120cm", "fotografia-video", "Modificador octagonal para luz suave en retratos.", 85, { Forma: "Octagonal", Tamaño: "120cm", Montura: "Bowens" }],
  ["fv12", "Micrófono Rode NTG5", "fotografia-video", "Shotgun broadcast ligero para producción en campo.", 180, { Patrón: "Supercardioide", Peso: "76g", Salida: "XLR" }],
  ["fv13", "Grabadora Zoom H6", "fotografia-video", "Grabadora de 6 pistas para audio de campo.", 120, null],
  ["fv14", "Tripié Manfrotto 055", "fotografia-video", "Tripié de aluminio con columna central horizontal.", 95, { Altura: "170cm", Carga: "9kg", Material: "Aluminio" }],
  ["fv15", "Slider Edelkrone SliderPLUS", "fotografia-video", "Slider motorizado compacto para tomas dinámicas.", 220, { Longitud: "81cm", Carga: "9kg", Control: "App" }],
  ["fv16", "Monitor Atomos Ninja V", "fotografia-video", "Monitor-grabador 5\" con salida HDR y ProRes.", 280, { Pantalla: "5\" 1000nit", Grabación: "4K ProRes", HDR: "Sí" }],
  ["fv17", "Kit Fondo Blanco Studio", "fotografia-video", "Sistema de fondos plegable con soporte profesional.", 75, { Ancho: "3m", Alto: "2.8m", Peso: "8kg" }],

  // ── Montaña y Camping (17 items) ──────────────────────────────────────
  ["mc01", "Tienda MSR Hubba NX 2", "montana-camping", "Tienda ultraligera para 2 personas de alta montaña.", 180, { Capacidad: "2 personas", Peso: "1.3kg", Temporadas: "3" }],
  ["mc02", "Tienda Big Agnes Copper Spur", "montana-camping", "Referente en peso y espacio para expediciones.", 220, { Capacidad: "3 personas", Peso: "1.7kg", Temporadas: "4" }],
  ["mc03", "Mochila Osprey Atmos 65", "montana-camping", "Mochila de trekking con suspensión ventilada.", 95, { Capacidad: "65L", Peso: "2.1kg", Talla: "M" }],
  ["mc04", "Mochila Deuter Aircontact 60+10", "montana-camping", "Alforjas expandibles para travesías largas.", 110, null],
  ["mc05", "Saco Mountain Hardwear Phantom 15F", "montana-camping", "Saco de plumón 850 para temperaturas bajas.", 140, { Temperatura: "-9°C", Plumón: "850FP", Peso: "780g" }],
  ["mc06", "Aislante Therm-a-Rest NeoAir", "montana-camping", "Aislante de alta R-value ultraligero.", 60, { R: "4.5", Peso: "340g", Grosor: "6cm" }],
  ["mc07", "Botas Salomon Quest 4 GTX", "montana-camping", "Botas de trekking impermeables de corte alto.", 85, { Impermeable: "Gore-Tex", Peso: "650g", Talla: "42" }],
  ["mc08", "Bastones Black Diamond Trail", "montana-camping", "Bastones plegables en aluminio con agarre EVA.", 45, { Material: "Aluminio", Plegado: "38cm", Peso: "490g" }],
  ["mc09", "Estufa Jetboil Flash", "montana-camping", "Sistema de cocción ultra-rápido para montaña.", 55, { Potencia: "2kW", Volumen: "1L", Peso: "370g" }],
  ["mc10", "Filtro Katadyn BeFree", "montana-camping", "Filtro de agua ultracompacto de 1L.", 40, null],
  ["mc11", "Faro Petzl Actik Core", "montana-camping", "Frontal recargable de 450 lúmenes.", 30, { Lúmenes: "450", Batería: "USB", Alcance: "100m" }],
  ["mc12", "Arnés Petzl Corax", "montana-camping", "Arnés de escalada versátil y acolchado.", 50, { Talla: "M/L", Peso: "490g", "Porta-material": "4" }],
  ["mc13", "Cuerda Beal Joker 9.1mm", "montana-camping", "Cuerda dinámica triple certificación.", 140, { Diámetro: "9.1mm", Longitud: "70m", Certificación: "Triple" }],
  ["mc14", "Crampones Grivel G12", "montana-camping", "Crampones 12 puntas para alpinismo técnico.", 75, null],
  ["mc15", "Piolet CAMP Corsa", "montana-camping", "Piolet de travesía ultraligero en aluminio.", 55, { Material: "Aluminio", Longitud: "60cm", Peso: "205g" }],
  ["mc16", "Silla Helinox Chair One", "montana-camping", "Silla plegable ultraligera para campamento.", 35, { Peso: "890g", Carga: "145kg", Plegado: "35cm" }],
  ["mc17", "Cocina Portátil Coleman 2-burner", "montana-camping", "Estufa de 2 quemadores para campismo familiar.", 50, { Quemadores: "2", Combustible: "Propano", BTU: "20,000" }],

  // ── Deportes Acuáticos (16 items) ─────────────────────────────────────
  ["da01", "Kayak Perception Pescador 12", "deportes-acuaticos", "Kayak sit-on-top estable para pesca y recreación.", 180, { Longitud: "3.7m", Carga: "147kg", Peso: "27kg" }],
  ["da02", "Kayak Inflable Intex Challenger", "deportes-acuaticos", "Kayak inflable para 2 personas con remos incluidos.", 90, null],
  ["da03", "SUP Red Paddle Ride 10'6\"", "deportes-acuaticos", "Tabla SUP inflable all-round premium.", 140, { Longitud: "10'6\"", Ancho: "32\"", Peso: "9.5kg" }],
  ["da04", "SUP Starboard Touring 12'6\"", "deportes-acuaticos", "SUP rígida de travesía para largas distancias.", 220, { Longitud: "12'6\"", Ancho: "28\"", Peso: "11kg" }],
  ["da05", "Tabla Surf Channel Islands 6'2\"", "deportes-acuaticos", "Shortboard performance para olas medianas.", 160, { Longitud: "6'2\"", Litros: "32", Nivel: "Intermedio" }],
  ["da06", "Tabla Surf Softtop NSP 8'0\"", "deportes-acuaticos", "Longboard foam ideal para principiantes.", 110, null],
  ["da07", "Wetsuit O'Neill Hyperfreak 3/2", "deportes-acuaticos", "Traje de neopreno ultra-flexible.", 85, { Grosor: "3/2mm", Talla: "M", Cierre: "Zip-free" }],
  ["da08", "Wetsuit Rip Curl E-Bomb 4/3", "deportes-acuaticos", "Traje premium para aguas frías.", 120, { Grosor: "4/3mm", Talla: "L", Neopreno: "E5" }],
  ["da09", "Equipo de Buceo Scubapro Regulator", "deportes-acuaticos", "Regulador balanceado para buceo profesional.", 260, { Etapas: "2", Profundidad: "40m", Peso: "1.1kg" }],
  ["da10", "BCD Cressi Start Pro", "deportes-acuaticos", "Chaleco compensador para buceo recreativo.", 130, { Talla: "M", Bolsillos: "2", Anillas: "4" }],
  ["da11", "Aletas Mares Avanti Quattro", "deportes-acuaticos", "Aletas de alto rendimiento para apnea y buceo.", 55, null],
  ["da12", "Máscara Cressi Big Eyes Evolution", "deportes-acuaticos", "Máscara de campo amplio para snorkel y buceo.", 40, { Campo: "Amplio", Cristal: "Templado", Faldón: "Silicona" }],
  ["da13", "Snorkel Tusa Hyperdry Elite", "deportes-acuaticos", "Snorkel semi-seco con purga.", 30, { Purga: "Sí", Tubo: "Flexible", Boquilla: "Silicona" }],
  ["da14", "Kite Naish Pivot 12m", "deportes-acuaticos", "Kite all-round para kitesurf freeride.", 280, { Tamaño: "12m", Estilo: "Freeride", Año: "2024" }],
  ["da15", "Tabla Kite Duotone Gonzales 140", "deportes-acuaticos", "Tabla de kitesurf freestyle/freeride.", 220, { Longitud: "140cm", Ancho: "42cm", Nivel: "Intermedio" }],
  ["da16", "Chaleco Salvavidas Astral V-Eight", "deportes-acuaticos", "PFD tipo III para kayak y SUP.", 65, { Tipo: "III", Flotación: "7.3kg", Talla: "M" }],
];

const data = items.map(([id, name, category, description, dailyRate, specs]) => {
  const base = {
    id,
    name,
    category,
    description,
    dailyRate,
    imageURL: specs === null ? null : `https://picsum.photos/seed/${id}/1200/800`,
    specs: specs ?? { Nota: "Especificaciones disponibles al entregar" },
    available: true,
  };
  return base;
});

// Sanity checks
const noImageCount = data.filter((i) => i.imageURL === null).length;
const byCat = Object.fromEntries(
  ["fotografia-video", "montana-camping", "deportes-acuaticos"].map((c) => [
    c,
    data.filter((i) => i.category === c).length,
  ])
);

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify(data, null, 2) + "\n", "utf8");

console.log(`Wrote ${data.length} items to ${outPath}`);
console.log(`Items without imageURL (Nano Banana fallback): ${noImageCount}`);
console.log(`Distribution by category:`, byCat);
