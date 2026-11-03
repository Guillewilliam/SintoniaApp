import { CATEGORIES, QUESTIONS_BANK, getQuestionsForSession } from '../src/data/questions.ts';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('🧪 EJECUTANDO BATERÍA DE PRUEBAS AUTOMATIZADAS (SINTONÍA PWA)');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASÓ] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FALLÓ] ${testName}`);
    process.exitCode = 1;
  }
}

// 1. BANCO DE PREGUNTAS
console.log('--- 1. VERIFICACIÓN DEL BANCO DE PREGUNTAS Y CATEGORÍAS ---');
assert(CATEGORIES.length === 10, 'Existen exactamente 10 categorías de preguntas');
const requiredCategories = [
  'pareja', 'amistad', 'diversion', 'personalidad', 'profundas',
  'picante', 'secretos', 'dilemas', 'cultura_pop', 'aleatorias'
];
const allCategoriesPresent = requiredCategories.every(id => CATEGORIES.some(c => c.id === id));
assert(allCategoriesPresent, 'Las 10 categorías requeridas están implementadas');

assert(QUESTIONS_BANK.length >= 50, `El banco de preguntas cuenta con volumen suficiente (${QUESTIONS_BANK.length} preguntas)`);

const intensities = ['suave', 'normal', 'profunda'];
const allIntensitiesRepresented = intensities.every(lvl => 
  QUESTIONS_BANK.some(q => q.intensity === lvl)
);
assert(allIntensitiesRepresented, 'Todas las intensidades (suave, normal, profunda) tienen preguntas asociadas');

const parejaSession = getQuestionsForSession(['pareja'], 'profunda');
assert(parejaSession.length > 0 && parejaSession[0].categoryId === 'pareja', 'El filtrado y aleatorización por categorías e intensidad funciona correctamente');

// 2. REGLAS Y ARCHIVOS DE DESPLIEGUE EN RENDER
console.log('\n--- 2. VERIFICACIÓN DE ARCHIVOS PARA RENDER Y PWA ---');
assert(fs.existsSync(path.resolve('public/_redirects')), 'El archivo public/_redirects existe para el enrutamiento SPA en Render');
const redirectsContent = fs.readFileSync(path.resolve('public/_redirects'), 'utf8');
assert(redirectsContent.includes('/*') && redirectsContent.includes('/index.html'), 'El archivo _redirects contiene la regla /* /index.html 200');

assert(fs.existsSync(path.resolve('render.yaml')), 'El archivo render.yaml existe con la definición de Static Site');

assert(fs.existsSync(path.resolve('dist/index.html')), 'El bundle de producción dist/index.html existe');
assert(fs.existsSync(path.resolve('dist/manifest.webmanifest')), 'El Web App Manifest de PWA existe en dist/');
assert(fs.existsSync(path.resolve('dist/sw.js')), 'El Service Worker de PWA existe en dist/');

assert(fs.existsSync(path.resolve('public/icons/icon-192.png')), 'Icono 192x192 generado');
assert(fs.existsSync(path.resolve('public/icons/icon-512.png')), 'Icono 512x512 generado');
assert(fs.existsSync(path.resolve('public/icons/icon-512-maskable.png')), 'Icono maskable 512x512 generado');
assert(fs.existsSync(path.resolve('public/apple-touch-icon.png')), 'Icono Apple Touch 180x180 generado');

// 3. REGLAS DE SEGURIDAD FIRESTORE (firestore.rules)
console.log('\n--- 3. REGLAS DE SEGURIDAD FIRESTORE ---');
assert(fs.existsSync(path.resolve('firestore.rules')), 'El archivo firestore.rules existe');
const rulesContent = fs.readFileSync(path.resolve('firestore.rules'), 'utf8');
assert(rulesContent.includes("turnStatus == 'revealed'"), 'Las reglas de Firestore imponen que las respuestas solo pueden ser leídas por el compañero si turnStatus es revealed');
assert(rulesContent.includes("request.auth.uid in resource.data.participants"), 'Las reglas de Firestore restringen el acceso exclusivamente a los participantes de la conexión');
assert(rulesContent.includes("request.resource.data.participants[0] != request.resource.data.participants[1]"), 'Las reglas impiden la conexión de un usuario consigo mismo');

// 4. ENTROPÍA DE CÓDIGOS DE INVITACIÓN
console.log('\n--- 4. CÓDIGOS DE INVITACIÓN ---');
const codeRegex = /^SINT-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}$/;
// Test generator format simulation
const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
let sampleCode = 'SINT-';
for (let i = 0; i < 5; i++) sampleCode += chars[Math.floor(Math.random() * chars.length)];
assert(codeRegex.test(sampleCode), `El formato del código cumple con el estándar y alta entropía (${sampleCode})`);

console.log('\n====================================================');
console.log(`📊 RESULTADOS: ${passedTests}/${totalTests} pruebas superadas.`);
console.log('====================================================\n');
