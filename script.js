/* ============================================================
   NSC — Number System Converter
   Main Script
   ============================================================
   Struktur:
   1. Konstanta & DOM References
   2. Validasi Input
   3. Algoritma Konversi Manual
   4. Pembuatan Langkah Perhitungan
   5. Fungsi UI (convert, swap, reset, generate)
   6. Event Listeners
   ============================================================ */

// ============================================================
// 1. KONSTANTA & DOM REFERENCES
// ============================================================

/** Nama basis bilangan berdasarkan nilai basis (Bahasa Indonesia) */
const BASE_NAMES = {
  2:  'Biner',
  8:  'Oktal',
  10: 'Desimal',
  16: 'Heksadesimal'
};

/** Karakter digit heksadesimal (indeks = nilai digit) */
const HEX_CHARS = '0123456789ABCDEF';

// Elemen DOM
const inputNumber    = document.getElementById('inputNumber');
const fromBaseSelect = document.getElementById('fromBase');
const toBaseSelect   = document.getElementById('toBase');
const btnConvert     = document.getElementById('btnConvert');
const btnSwap        = document.getElementById('btnSwap');
const btnReset       = document.getElementById('btnReset');
const errorBox       = document.getElementById('errorBox');
const resultsWrapper = document.getElementById('resultsWrapper');
const resOrigValue   = document.getElementById('resOriginalValue');
const resOrigBase    = document.getElementById('resOriginalBase');
const resConvValue   = document.getElementById('resConvertedValue');
const resConvBase    = document.getElementById('resConvertedBase');
const resultsGrid    = document.getElementById('resultsGrid');
const stepsContent   = document.getElementById('stepsContent');
const btnCopyResult  = document.getElementById('btnCopyResult');
const iconCopy       = document.getElementById('iconCopy');
const iconCheck      = document.getElementById('iconCheck');
const copyText       = document.getElementById('copyText');
const navMenu        = document.getElementById('navMenu');
const btnTheme       = document.getElementById('btnTheme');
const iconSun        = document.getElementById('iconSun');
const iconMoon       = document.getElementById('iconMoon');
const historyList    = document.getElementById('historyList');
const historyCount   = document.getElementById('historyCount');
const btnClearHistory = document.getElementById('btnClearHistory');
const btnThemeMobile  = document.getElementById('btnThemeMobile');
const iconSunMobile   = document.getElementById('iconSunMobile');
const iconMoonMobile  = document.getElementById('iconMoonMobile');
const bottomNavLinks  = document.querySelectorAll('.bottom-nav-link');

// ============================================================
// 2. VALIDASI INPUT
// ============================================================

/**
 * Memvalidasi input angka berdasarkan basis yang dipilih.
 *
 * @param {string} value  - String input dari pengguna.
 * @param {number} base   - Basis bilangan (2, 8, 10, atau 16).
 * @returns {Object}      - { valid, cleaned, isNegative, message }
 */
function validateInput(value, base) {
  // Cek kosong
  if (!value || value.trim() === '') {
    return { valid: false, message: 'Mohon masukkan angka terlebih dahulu.' };
  }

  let cleaned = value.trim().toUpperCase();

  // Cek tanda negatif
  let isNegative = false;
  if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.substring(1);
  }

  // Setelah strip tanda, cek lagi kosong
  if (cleaned === '') {
    return { valid: false, message: 'Angka tidak valid setelah tanda negatif.' };
  }

  // Pola regex untuk setiap basis
  const patterns = {
    2:  /^[01]+$/,
    8:  /^[0-7]+$/,
    10: /^[0-9]+$/,
    16: /^[0-9A-F]+$/
  };

  if (!patterns[base]) {
    return { valid: false, message: 'Basis bilangan yang dipilih tidak didukung.' };
  }

  if (!patterns[base].test(cleaned)) {
    // Buat pesan error yang informatif
    const allowed = {
      2:  '0 dan 1',
      8:  '0–7',
      10: '0–9',
      16: '0–9 dan A–F'
    };
    return {
      valid: false,
      message: `Input tidak valid untuk ${BASE_NAMES[base]} (Basis ${base}). Karakter yang diizinkan: ${allowed[base]}.`
    };
  }

  return { valid: true, cleaned: cleaned, isNegative: isNegative };
}

/**
 * Membersihkan string input sehingga hanya berisi karakter yang sah untuk basis yang dipilih.
 * Mempertahankan tanda '-' jika berada di awal string.
 *
 * @param {string} value - String input.
 * @param {number} base  - Basis bilangan (2, 8, 10, atau 16).
 * @returns {string}     - String yang telah dibersihkan.
 */
function sanitizeInputForBase(value, base) {
  if (!value) return '';
  base = parseInt(base);

  // Periksa apakah diawali tanda negatif
  const isNegative = value.trim().startsWith('-');
  // Hapus semua tanda negatif terlebih dahulu
  let cleaned = value.replace(/-/g, '');

  if (base === 2) {
    cleaned = cleaned.replace(/[^01]/g, '');
  } else if (base === 8) {
    cleaned = cleaned.replace(/[^0-7]/g, '');
  } else if (base === 10) {
    cleaned = cleaned.replace(/[^0-9]/g, '');
  } else if (base === 16) {
    cleaned = cleaned.toUpperCase().replace(/[^0-9A-F]/g, '');
  }

  return (isNegative ? '-' : '') + cleaned;
}

/**
 * Memperbarui placeholder, inputmode, dan membersihkan input saat basis asal berubah.
 */
function updateInputAttributesForBase() {
  const base = parseInt(fromBaseSelect.value);
  const placeholders = {
    2:  'cth. 101101, -1100',
    8:  'cth. 755, -42',
    10: 'cth. 255, -45',
    16: 'cth. 2A3, -FF'
  };

  inputNumber.placeholder = placeholders[base] || 'Masukkan angka';

  // Pada mobile: gunakan keypad numerik untuk basis 2, 8, 10
  if (base === 16) {
    inputNumber.setAttribute('inputmode', 'text');
  } else {
    inputNumber.setAttribute('inputmode', 'numeric');
  }

  // Bersihkan nilai input yang ada jika tidak sesuai dengan basis yang baru dipilih
  if (inputNumber.value) {
    const cleaned = sanitizeInputForBase(inputNumber.value, base);
    if (cleaned !== inputNumber.value) {
      inputNumber.value = cleaned;
    }
  }
}

// ============================================================
// 3. ALGORITMA KONVERSI MANUAL
// ============================================================

/**
 * Menghitung nilai digit karakter dalam basis heksadesimal.
 * Contoh: '0' → 0, '9' → 9, 'A' → 10, 'F' → 15
 *
 * @param {string} ch - Satu karakter digit (uppercase).
 * @returns {number}
 */
function digitValue(ch) {
  return HEX_CHARS.indexOf(ch);
}

/**
 * Mengonversi bilangan dari basis apa pun ke Desimal menggunakan
 * metode perkalian posisi (positional notation):
 *   result = d(n) × base^n + d(n-1) × base^(n-1) + ... + d(0) × base^0
 *
 * Menggunakan BigInt untuk mendukung bilangan besar.
 *
 * @param {string} numberStr - String angka (tanpa tanda, uppercase).
 * @param {number} fromBase  - Basis asal (2, 8, 10, 16).
 * @returns {bigint}         - Nilai desimal sebagai BigInt.
 */
function convertToDecimal(numberStr, fromBase) {
  const base = BigInt(fromBase);
  let result = 0n;

  // Iterasi setiap digit dari kiri ke kanan
  for (let i = 0; i < numberStr.length; i++) {
    const dv = BigInt(digitValue(numberStr[i]));
    result = result * base + dv;
  }

  return result;
}

/**
 * Mengonversi bilangan Desimal ke basis tujuan menggunakan
 * metode pembagian berulang (repeated division):
 *   Bagi angka dengan basis, simpan sisa, ulangi sampai habis.
 *   Baca sisa dari bawah ke atas.
 *
 * @param {bigint} decimalValue - Nilai desimal positif sebagai BigInt.
 * @param {number} toBase       - Basis tujuan (2, 8, 10, 16).
 * @returns {string}            - Hasil konversi sebagai string.
 */
function convertFromDecimal(decimalValue, toBase) {
  if (decimalValue === 0n) return '0';

  const base = BigInt(toBase);
  let result = '';
  let value = decimalValue;

  while (value > 0n) {
    const remainder = Number(value % base);
    result = HEX_CHARS[remainder] + result;
    value = value / base; // BigInt division (floor)
  }

  return result;
}

/**
 * Binary → Octal: kelompokkan digit biner menjadi grup 3 bit dari kanan,
 * lalu konversi setiap grup ke digit oktal.
 *
 * @param {string} binaryStr - String biner (tanpa tanda).
 * @returns {string}
 */
function binaryToOctal(binaryStr) {
  // Tambahkan padding nol di kiri agar panjang kelipatan 3
  while (binaryStr.length % 3 !== 0) {
    binaryStr = '0' + binaryStr;
  }

  let result = '';
  for (let i = 0; i < binaryStr.length; i += 3) {
    const group = binaryStr.substring(i, i + 3);
    // Konversi 3 bit ke nilai 0–7 secara manual
    const val = digitValue(group[0]) * 4
              + digitValue(group[1]) * 2
              + digitValue(group[2]) * 1;
    result += val.toString();
  }

  // Hapus leading zeros
  return result.replace(/^0+/, '') || '0';
}

/**
 * Binary → Hexadecimal: kelompokkan digit biner menjadi grup 4 bit dari kanan,
 * lalu konversi setiap grup ke digit heksadesimal.
 *
 * @param {string} binaryStr - String biner (tanpa tanda).
 * @returns {string}
 */
function binaryToHex(binaryStr) {
  // Tambahkan padding nol di kiri agar panjang kelipatan 4
  while (binaryStr.length % 4 !== 0) {
    binaryStr = '0' + binaryStr;
  }

  let result = '';
  for (let i = 0; i < binaryStr.length; i += 4) {
    const group = binaryStr.substring(i, i + 4);
    const val = digitValue(group[0]) * 8
              + digitValue(group[1]) * 4
              + digitValue(group[2]) * 2
              + digitValue(group[3]) * 1;
    result += HEX_CHARS[val];
  }

  return result.replace(/^0+/, '') || '0';
}

/**
 * Octal → Binary: konversi setiap digit oktal ke representasi 3 bit biner.
 *
 * @param {string} octalStr - String oktal (tanpa tanda).
 * @returns {string}
 */
function octalToBinary(octalStr) {
  let result = '';
  for (const ch of octalStr) {
    const val = digitValue(ch);
    // Konversi ke 3 bit secara manual
    result += ((val >> 2) & 1).toString()
            + ((val >> 1) & 1).toString()
            + (val & 1).toString();
  }
  return result.replace(/^0+/, '') || '0';
}

/**
 * Hexadecimal → Binary: konversi setiap digit heksadesimal ke representasi 4 bit biner.
 *
 * @param {string} hexStr - String heksadesimal (tanpa tanda, uppercase).
 * @returns {string}
 */
function hexToBinary(hexStr) {
  let result = '';
  for (const ch of hexStr) {
    const val = digitValue(ch);
    // Konversi ke 4 bit secara manual
    result += ((val >> 3) & 1).toString()
            + ((val >> 2) & 1).toString()
            + ((val >> 1) & 1).toString()
            + (val & 1).toString();
  }
  return result.replace(/^0+/, '') || '0';
}

/**
 * Fungsi utama konversi: menentukan jalur konversi yang tepat.
 *
 * @param {string} numberStr - String angka (tanpa tanda, uppercase).
 * @param {number} fromBase  - Basis asal.
 * @param {number} toBase    - Basis tujuan.
 * @returns {string}         - Hasil konversi.
 */
function convertNumber(numberStr, fromBase, toBase) {
  fromBase = parseInt(fromBase);
  toBase   = parseInt(toBase);

  // Basis sama — tidak perlu konversi
  if (fromBase === toBase) return numberStr;

  // Jalur langsung Binary ↔ Octal
  if (fromBase === 2  && toBase === 8)  return binaryToOctal(numberStr);
  if (fromBase === 8  && toBase === 2)  return octalToBinary(numberStr);

  // Jalur langsung Binary ↔ Hexadecimal
  if (fromBase === 2  && toBase === 16) return binaryToHex(numberStr);
  if (fromBase === 16 && toBase === 2)  return hexToBinary(numberStr);

  // Octal ↔ Hex melalui Binary
  if (fromBase === 8  && toBase === 16) {
    const binary = octalToBinary(numberStr);
    return binaryToHex(binary);
  }
  if (fromBase === 16 && toBase === 8) {
    const binary = hexToBinary(numberStr);
    return binaryToOctal(binary);
  }

  // Konversi melalui Desimal
  const decimal = convertToDecimal(numberStr, fromBase);
  if (toBase === 10) return decimal.toString();

  return convertFromDecimal(decimal, toBase);
}

// ============================================================
// 4. PEMBUATAN LANGKAH PERHITUNGAN
// ============================================================

/**
 * Membuat string HTML berisi superscript untuk pangkat.
 * Contoh: superscript(5) → "<sup>5</sup>"
 */
function sup(n) {
  return '<sup>' + n + '</sup>';
}

/**
 * Langkah: Konversi ke Desimal (metode positional notation).
 * Menampilkan: digit × basis^posisi = nilai
 */
function stepsToDecimal(numberStr, fromBase) {
  const baseName = BASE_NAMES[fromBase];
  const digits = numberStr.split('');
  const len = digits.length;
  const base = BigInt(fromBase);

  let html = '<div class="step-section">';
  html += `<div class="step-heading"><span class="step-num">1</span>Kalikan setiap digit dengan nilai posisinya (Basis ${fromBase})</div>`;

  const values = []; // untuk menyimpan hasil setiap digit

  for (let i = 0; i < len; i++) {
    const pos = len - 1 - i;
    const dv = BigInt(digitValue(digits[i]));
    const power = base ** BigInt(pos);
    const product = dv * power;
    values.push(product);

    html += `<div class="step-equation">${digits[i]} × ${fromBase}${sup(pos)} = ${digits[i]} × ${power.toString()} = <strong>${product.toString()}</strong></div>`;
  }

  html += '</div>';

  // Langkah 2: Jumlahkan
  const total = values.reduce((a, b) => a + b, 0n);
  html += '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">2</span>Jumlahkan semua nilai</div>';
  html += '<div class="step-equation">';
  html += values.map(v => v.toString()).join(' + ');
  html += ` = <strong>${total.toString()}</strong>`;
  html += '</div></div>';

  html += `<div class="step-result">Hasil: ${total.toString()} (Desimal)</div>`;
  return html;
}

/**
 * Langkah: Konversi dari Desimal ke basis tujuan (metode pembagian berulang).
 * Menampilkan: angka ÷ basis = hasil bagi, sisa ...
 */
function stepsFromDecimal(numberStr, toBase) {
  const baseName = BASE_NAMES[toBase];
  let value = BigInt(numberStr);
  const base = BigInt(toBase);

  if (value === 0n) {
    return `<div class="step-note">Input adalah 0. Angka nol di basis mana pun tetap bernilai 0.</div>
            <div class="step-result">Hasil: 0 (${baseName})</div>`;
  }

  let html = '<div class="step-section">';
  html += `<div class="step-heading"><span class="step-num">1</span>Bagi berulang kali dengan ${toBase} dan catat sisa pembagian</div>`;
  html += '<table class="division-table">';

  const remainders = [];

  while (value > 0n) {
    const quotient = value / base;
    const remainder = Number(value % base);
    remainders.push(HEX_CHARS[remainder]);

    html += '<tr>';
    html += `<td>${value.toString()} ÷ ${toBase}</td>`;
    html += `<td>= ${quotient.toString()}</td>`;
    html += `<td>sisa <strong>${HEX_CHARS[remainder]}</strong></td>`;
    html += '</tr>';

    value = quotient;
  }

  html += '</table></div>';

  // Langkah 2: Baca sisa dari bawah ke atas
  const resultStr = remainders.slice().reverse().join('');

  html += '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">2</span>Baca sisa dari bawah ke atas</div>';
  html += '<div class="step-equation">';
  html += remainders.slice().reverse().map(r => `<strong>${r}</strong>`).join(' ');
  html += ` → <strong>${resultStr}</strong>`;
  html += '</div></div>';

  html += `<div class="step-result">Hasil: ${resultStr} (${baseName})</div>`;
  return html;
}

/**
 * Langkah: Binary → Octal (pengelompokan 3 bit).
 */
function stepsBinaryToOctal(binaryStr) {
  // Padding
  let padded = binaryStr;
  while (padded.length % 3 !== 0) padded = '0' + padded;

  const groups = [];
  for (let i = 0; i < padded.length; i += 3) {
    groups.push(padded.substring(i, i + 3));
  }

  let html = '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">1</span>Kelompokkan digit biner menjadi 3 bit dari kanan</div>';
  html += '<div class="bit-groups">';
  groups.forEach(g => { html += `<span class="bit-group">${g}</span>`; });
  html += '</div></div>';

  html += '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">2</span>Konversi setiap grup 3-bit ke digit oktal</div>';

  const octalDigits = [];
  groups.forEach(g => {
    const val = digitValue(g[0]) * 4 + digitValue(g[1]) * 2 + digitValue(g[2]);
    octalDigits.push(val.toString());
    html += `<div class="mapping-row"><span class="bit-group">${g}</span> → <strong>${val}</strong></div>`;
  });

  html += '</div>';

  const result = octalDigits.join('').replace(/^0+/, '') || '0';
  html += `<div class="step-result">Hasil: ${result} (Oktal)</div>`;
  return html;
}

/**
 * Langkah: Binary → Hexadecimal (pengelompokan 4 bit).
 */
function stepsBinaryToHex(binaryStr) {
  let padded = binaryStr;
  while (padded.length % 4 !== 0) padded = '0' + padded;

  const groups = [];
  for (let i = 0; i < padded.length; i += 4) {
    groups.push(padded.substring(i, i + 4));
  }

  let html = '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">1</span>Kelompokkan digit biner menjadi 4 bit dari kanan</div>';
  html += '<div class="bit-groups">';
  groups.forEach(g => { html += `<span class="bit-group">${g}</span>`; });
  html += '</div></div>';

  html += '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">2</span>Konversi setiap grup 4-bit ke digit heksadesimal</div>';

  const hexDigits = [];
  groups.forEach(g => {
    const val = digitValue(g[0]) * 8 + digitValue(g[1]) * 4 + digitValue(g[2]) * 2 + digitValue(g[3]);
    hexDigits.push(HEX_CHARS[val]);
    html += `<div class="mapping-row"><span class="bit-group">${g}</span> → <strong>${HEX_CHARS[val]}</strong></div>`;
  });

  html += '</div>';

  const result = hexDigits.join('').replace(/^0+/, '') || '0';
  html += `<div class="step-result">Hasil: ${result} (Heksadesimal)</div>`;
  return html;
}

/**
 * Langkah: Octal → Binary (ekspansi setiap digit ke 3 bit).
 */
function stepsOctalToBinary(octalStr) {
  let html = '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">1</span>Konversi setiap digit oktal ke representasi biner 3 bit</div>';

  const binaryParts = [];
  for (const ch of octalStr) {
    const val = digitValue(ch);
    const bits = ((val >> 2) & 1).toString()
               + ((val >> 1) & 1).toString()
               + (val & 1).toString();
    binaryParts.push(bits);
    html += `<div class="mapping-row"><strong>${ch}</strong> → <span class="bit-group">${bits}</span></div>`;
  }

  html += '</div>';

  html += '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">2</span>Gabungkan semua grup</div>';
  const combined = binaryParts.join('');
  const result = combined.replace(/^0+/, '') || '0';
  html += `<div class="step-equation">${binaryParts.join(' ')} → <strong>${result}</strong></div>`;
  html += '</div>';

  html += `<div class="step-result">Hasil: ${result} (Biner)</div>`;
  return html;
}

/**
 * Langkah: Hexadecimal → Binary (ekspansi setiap digit ke 4 bit).
 */
function stepsHexToBinary(hexStr) {
  let html = '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">1</span>Konversi setiap digit heksadesimal ke representasi biner 4 bit</div>';

  const binaryParts = [];
  for (const ch of hexStr) {
    const val = digitValue(ch);
    const bits = ((val >> 3) & 1).toString()
               + ((val >> 2) & 1).toString()
               + ((val >> 1) & 1).toString()
               + (val & 1).toString();
    binaryParts.push(bits);
    html += `<div class="mapping-row"><strong>${ch}</strong> → <span class="bit-group">${bits}</span></div>`;
  }

  html += '</div>';

  html += '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">2</span>Gabungkan semua grup</div>';
  const combined = binaryParts.join('');
  const result = combined.replace(/^0+/, '') || '0';
  html += `<div class="step-equation">${binaryParts.join(' ')} → <strong>${result}</strong></div>`;
  html += '</div>';

  html += `<div class="step-result">Hasil: ${result} (Biner)</div>`;
  return html;
}

/**
 * Langkah: Octal → Hexadecimal (melalui Binary).
 * Octal → Binary (3 bit per digit) → kelompokkan 4 bit → Hex
 */
function stepsOctalToHex(octalStr) {
  let html = '<div class="phase-label">Fase 1 — Oktal ke Biner</div>';
  html += stepsOctalToBinaryRaw(octalStr);

  const binaryStr = octalToBinary(octalStr);

  html += '<hr class="phase-divider">';
  html += '<div class="phase-label">Fase 2 — Biner ke Heksadesimal</div>';
  html += stepsBinaryToHex(binaryStr);

  return html;
}

/**
 * Langkah: Hexadecimal → Octal (melalui Binary).
 * Hex → Binary (4 bit per digit) → kelompokkan 3 bit → Octal
 */
function stepsHexToOctal(hexStr) {
  let html = '<div class="phase-label">Fase 1 — Heksadesimal ke Biner</div>';
  html += stepsHexToBinaryRaw(hexStr);

  const binaryStr = hexToBinary(hexStr);

  html += '<hr class="phase-divider">';
  html += '<div class="phase-label">Fase 2 — Biner ke Oktal</div>';
  html += stepsBinaryToOctal(binaryStr);

  return html;
}

/**
 * Versi "raw" tanpa step-result akhir — digunakan sebagai sub-langkah
 * untuk konversi Octal↔Hex melalui Binary.
 */
function stepsOctalToBinaryRaw(octalStr) {
  let html = '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">1</span>Konversi setiap digit oktal ke biner 3 bit</div>';

  const parts = [];
  for (const ch of octalStr) {
    const val = digitValue(ch);
    const bits = ((val >> 2) & 1).toString()
               + ((val >> 1) & 1).toString()
               + (val & 1).toString();
    parts.push(bits);
    html += `<div class="mapping-row"><strong>${ch}</strong> → <span class="bit-group">${bits}</span></div>`;
  }

  const result = parts.join('').replace(/^0+/, '') || '0';
  html += `<div class="step-equation" style="margin-top:8px">Biner: <strong>${result}</strong></div>`;
  html += '</div>';
  return html;
}

function stepsHexToBinaryRaw(hexStr) {
  let html = '<div class="step-section">';
  html += '<div class="step-heading"><span class="step-num">1</span>Konversi setiap digit hex ke biner 4 bit</div>';

  const parts = [];
  for (const ch of hexStr) {
    const val = digitValue(ch);
    const bits = ((val >> 3) & 1).toString()
               + ((val >> 2) & 1).toString()
               + ((val >> 1) & 1).toString()
               + (val & 1).toString();
    parts.push(bits);
    html += `<div class="mapping-row"><strong>${ch}</strong> → <span class="bit-group">${bits}</span></div>`;
  }

  const result = parts.join('').replace(/^0+/, '') || '0';
  html += `<div class="step-equation" style="margin-top:8px">Biner: <strong>${result}</strong></div>`;
  html += '</div>';
  return html;
}

/**
 * Langkah: Non-decimal, non-direct → melalui Desimal.
 * Contoh: Octal → Decimal → langkah 1, lalu Decimal → target → langkah 2
 * (Untuk basis selain binary/octal/hex direct paths)
 */
function stepsThroughDecimal(numberStr, fromBase, toBase) {
  let html = '<div class="phase-label">Fase 1 — ' + BASE_NAMES[fromBase] + ' ke Desimal</div>';
  html += stepsToDecimal(numberStr, fromBase);

  const decimalValue = convertToDecimal(numberStr, fromBase);

  html += '<hr class="phase-divider">';
  html += '<div class="phase-label">Fase 2 — Desimal ke ' + BASE_NAMES[toBase] + '</div>';
  html += stepsFromDecimal(decimalValue.toString(), toBase);

  return html;
}

/**
 * Fungsi utama untuk menghasilkan langkah perhitungan berdasarkan
 * basis asal dan tujuan. Menentukan jalur yang paling edukatif.
 *
 * @param {string} numberStr - Angka input (tanpa tanda, uppercase).
 * @param {number} fromBase  - Basis asal.
 * @param {number} toBase    - Basis tujuan.
 * @returns {string}         - HTML langkah-langkah perhitungan.
 */
function generateCalculationSteps(numberStr, fromBase, toBase) {
  fromBase = parseInt(fromBase);
  toBase   = parseInt(toBase);

  // Basis sama
  if (fromBase === toBase) {
    return '<div class="step-note">Basis asal dan tujuan sama — tidak diperlukan konversi.</div>';
  }

  // Cek jika input adalah 0
  if (/^0+$/.test(numberStr)) {
    return `<div class="step-note">Input adalah 0. Angka nol di sistem bilangan mana pun tetap bernilai 0.</div>
            <div class="step-result">Hasil: 0 (${BASE_NAMES[toBase]})</div>`;
  }

  // Ke Desimal (langsung)
  if (toBase === 10) {
    return stepsToDecimal(numberStr, fromBase);
  }

  // Dari Desimal (langsung)
  if (fromBase === 10) {
    return stepsFromDecimal(numberStr, toBase);
  }

  // Binary ↔ Octal (grouping langsung)
  if (fromBase === 2  && toBase === 8)  return stepsBinaryToOctal(numberStr);
  if (fromBase === 8  && toBase === 2)  return stepsOctalToBinary(numberStr);

  // Binary ↔ Hex (grouping langsung)
  if (fromBase === 2  && toBase === 16) return stepsBinaryToHex(numberStr);
  if (fromBase === 16 && toBase === 2)  return stepsHexToBinary(numberStr);

  // Octal ↔ Hex melalui Binary
  if (fromBase === 8  && toBase === 16) return stepsOctalToHex(numberStr);
  if (fromBase === 16 && toBase === 8)  return stepsHexToOctal(numberStr);

  // Fallback: melalui Desimal
  return stepsThroughDecimal(numberStr, fromBase, toBase);
}

// ============================================================
// 5. FUNGSI UI
// ============================================================

/**
 * Menghasilkan semua konversi ke empat basis sekaligus.
 * Mengembalikan objek dengan key basis dan value string hasil.
 *
 * @param {string} numberStr - Angka input (tanpa tanda, uppercase).
 * @param {number} fromBase  - Basis asal.
 * @returns {Object}         - { 2: '...', 8: '...', 10: '...', 16: '...' }
 */
function generateAllResults(numberStr, fromBase) {
  const results = {};
  const bases = [2, 8, 10, 16];

  bases.forEach(function(b) {
    results[b] = convertNumber(numberStr, fromBase, b);
  });

  return results;
}

/**
 * Menampilkan error ke pengguna.
 */
function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add('visible');
  // Sembunyikan hasil
  resultsWrapper.classList.remove('visible');
}

/**
 * Menyembunyikan error.
 */
function hideError() {
  errorBox.textContent = '';
  errorBox.classList.remove('visible');
}

/**
 * Proses konversi utama — dipanggil saat tombol Convert ditekan.
 * Memvalidasi input dan langsung menampilkan hasil konversi dan langkah perhitungan.
 */
function handleConvert() {
  hideError();

  const rawInput = inputNumber.value;
  const fromBase = parseInt(fromBaseSelect.value);
  const toBase   = parseInt(toBaseSelect.value);

  // Validasi input
  const validation = validateInput(rawInput, fromBase);
  if (!validation.valid) {
    showError(validation.message);
    return;
  }

  const cleaned    = validation.cleaned;
  const isNegative = validation.isNegative;
  const sign       = isNegative ? '-' : '';

  // Lakukan konversi utama
  const convertedRaw = convertNumber(cleaned, fromBase, toBase);
  const converted    = sign + convertedRaw;
  const original     = sign + cleaned;

  // Tampilkan hasil utama
  resOrigValue.textContent = original;
  resOrigBase.textContent  = `${BASE_NAMES[fromBase]} (Basis ${fromBase})`;
  resConvValue.textContent = converted;
  resConvBase.textContent  = `${BASE_NAMES[toBase]} (Basis ${toBase})`;

  // Tampilkan semua konversi
  const allResults = generateAllResults(cleaned, fromBase);
  resultsGrid.innerHTML = '';

  [2, 8, 10, 16].forEach(function(b) {
    const item = document.createElement('div');
    item.className = 'grid-item';
    if (b === toBase) item.classList.add('highlighted');

    const val = sign + allResults[b];

    item.innerHTML = `
      <span class="grid-item-label">${BASE_NAMES[b]}</span>
      <span class="grid-item-value">${val}</span>
      <span class="grid-item-base">Basis ${b}</span>
    `;
    item.title = 'Klik untuk menyalin';
    item.addEventListener('click', function() {
      navigator.clipboard.writeText(val);
      const labelEl = item.querySelector('.grid-item-label');
      const origText = BASE_NAMES[b];
      labelEl.textContent = 'Tersalin!';
      setTimeout(function() {
        labelEl.textContent = origText;
      }, 1200);
    });
    resultsGrid.appendChild(item);
  });

  // Tampilkan langkah perhitungan
  let stepsHTML = generateCalculationSteps(cleaned, fromBase, toBase);

  // Tambahkan catatan untuk bilangan negatif jika ada
  if (isNegative) {
    stepsHTML = '<div class="step-note" style="margin-bottom:16px">Catatan: Input adalah bilangan negatif. Tanda negatif dipertahankan; perhitungan di bawah menampilkan konversi nilai absolutnya.</div>' + stepsHTML;
  }

  stepsContent.innerHTML = stepsHTML;

  // Tampilkan wrapper hasil konversi dengan animasi
  resultsWrapper.classList.add('visible');

  // Simpan ke riwayat konversi
  addHistory({
    input: original,
    fromBase: fromBase,
    fromBaseName: BASE_NAMES[fromBase],
    output: converted,
    toBase: toBase,
    toBaseName: BASE_NAMES[toBase],
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  });

  // Scroll ke hasil konversi
  resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Menukar basis asal dan tujuan.
 */
function swapBases() {
  const temp = fromBaseSelect.value;
  fromBaseSelect.value = toBaseSelect.value;
  toBaseSelect.value = temp;
  updateInputAttributesForBase();
  hideError();
}

/**
 * Menghapus semua input dan hasil.
 */
function resetConverter() {
  inputNumber.value = '';
  fromBaseSelect.value = '10';
  toBaseSelect.value = '2';
  updateInputAttributesForBase();
  hideError();
  resultsWrapper.classList.remove('visible');
  resultsGrid.innerHTML = '';
  stepsContent.innerHTML = '';
  resOrigValue.textContent = '—';
  resOrigBase.textContent = '—';
  resConvValue.textContent = '—';
  resConvBase.textContent = '—';

  // Reset copy button
  if (btnCopyResult) {
    btnCopyResult.classList.remove('copied');
    if (iconCopy) iconCopy.style.display = 'inline-block';
    if (iconCheck) iconCheck.style.display = 'none';
    if (copyText) copyText.textContent = 'Salin';
  }
}

// ============================================================
// 6. RIWAYAT KONVERSI
// ============================================================

const HISTORY_KEY = 'numera_conversion_history';

/**
 * Mengambil riwayat konversi dari localStorage
 */
function getHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Menambahkan entri ke riwayat konversi
 */
function addHistory(entry) {
  const list = getHistory();
  // Cegah duplikasi berturut-turut
  if (list.length > 0 &&
      list[0].input === entry.input &&
      list[0].fromBase === entry.fromBase &&
      list[0].toBase === entry.toBase) {
    return;
  }
  list.unshift(entry);
  if (list.length > 20) list.pop(); // Maksimal 20 item
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch (e) {}
  renderHistory();
}

/**
 * Merender daftar riwayat ke DOM
 */
function renderHistory() {
  if (!historyList) return;
  const list = getHistory();
  if (historyCount) historyCount.textContent = list.length;

  if (list.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty" id="historyEmpty">
        <div class="history-empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
          </svg>
        </div>
        <p class="history-empty-text">Belum ada riwayat konversi</p>
        <p class="history-empty-sub">Lakukan konversi pada formulir di atas untuk melihat riwayat di sini.</p>
      </div>
    `;
    return;
  }

  historyList.innerHTML = '';
  list.forEach(function(item) {
    const row = document.createElement('div');
    row.className = 'history-item';
    row.innerHTML = `
      <div class="history-item-left">
        <div class="history-val-box">
          <span class="history-val">${escapeHTML(item.input)}</span>
          <span class="history-base-badge">${escapeHTML(item.fromBaseName)}</span>
        </div>
        <div class="history-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </div>
        <div class="history-val-box">
          <span class="history-val" style="color:var(--accent-hover)">${escapeHTML(item.output)}</span>
          <span class="history-base-badge">${escapeHTML(item.toBaseName)}</span>
        </div>
      </div>
      <div class="history-item-right">
        <span class="history-time">${escapeHTML(item.timestamp)}</span>
        <button class="btn-use-history" type="button" data-input="${escapeHTML(item.input)}" data-from="${item.fromBase}" data-to="${item.toBase}">
          Gunakan
        </button>
      </div>
    `;
    historyList.appendChild(row);
  });

  // Listener untuk tombol gunakan pada setiap entri riwayat
  historyList.querySelectorAll('.btn-use-history').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const val = this.getAttribute('data-input');
      const from = this.getAttribute('data-from');
      const to = this.getAttribute('data-to');
      inputNumber.value = val;
      fromBaseSelect.value = from;
      toBaseSelect.value = to;
      handleConvert();
      const convSection = document.getElementById('converter');
      if (convSection) {
        convSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/**
 * Sanitasi string sederhana untuk keamanan tampilan HTML
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// Inisialisasi riwayat saat halaman dimuat
renderHistory();

// Tombol Hapus Riwayat
if (btnClearHistory) {
  btnClearHistory.addEventListener('click', function() {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });
}

// ============================================================
// 7. EVENT LISTENERS & NAVIGATION
// ============================================================

// Tombol Convert
btnConvert.addEventListener('click', handleConvert);

// Tombol Swap
btnSwap.addEventListener('click', swapBases);

// Tombol Reset
btnReset.addEventListener('click', resetConverter);

// Filter karakter saat mengetik (hanya angka dan simbol yang sah)
inputNumber.addEventListener('keydown', function(e) {
  // Biarkan tombol aksi & navigasi
  if (['Enter', 'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape'].includes(e.key)) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConvert();
    }
    return;
  }

  // Biarkan kombinasi shortcut (Ctrl/Cmd + A, C, V, X, Z)
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return;
  }

  // Pengecekan karakter yang diketik
  if (e.key.length === 1) {
    const fromBase = parseInt(fromBaseSelect.value);
    const key = e.key;
    const start = inputNumber.selectionStart;

    // Simbol minus '-': hanya boleh di posisi awal (index 0) dan belum ada '-'
    if (key === '-') {
      if (start === 0 && !inputNumber.value.includes('-')) {
        return; // Izinkan tanda minus di awal
      }
      e.preventDefault();
      return;
    }

    // Pengecekan karakter angka/simbol per basis
    let isAllowed = false;
    if (fromBase === 2) {
      isAllowed = /^[01]$/.test(key);
    } else if (fromBase === 8) {
      isAllowed = /^[0-7]$/.test(key);
    } else if (fromBase === 10) {
      isAllowed = /^[0-9]$/.test(key);
    } else if (fromBase === 16) {
      isAllowed = /^[0-9a-fA-F]$/.test(key);
    }

    if (!isAllowed) {
      e.preventDefault();
    }
  }
});

// Sanitasi otomatis saat input berubah (termasuk paste, autofill, keyboard mobile)
inputNumber.addEventListener('input', function() {
  const fromBase = parseInt(fromBaseSelect.value);
  const oldVal = inputNumber.value;
  const sanitized = sanitizeInputForBase(oldVal, fromBase);

  if (oldVal !== sanitized) {
    const selStart = inputNumber.selectionStart;
    const diff = oldVal.length - sanitized.length;
    inputNumber.value = sanitized;
    const newPos = Math.max(0, (selStart || 0) - diff);
    try {
      inputNumber.setSelectionRange(newPos, newPos);
    } catch (err) {}
  }

  // Sembunyikan error saat pengguna mulai mengetik ulang
  if (errorBox.classList.contains('visible')) {
    hideError();
  }
});

// Perubahan basis asal → perbarui placeholder, inputmode, dan sanitasi input
fromBaseSelect.addEventListener('change', function() {
  updateInputAttributesForBase();
  hideError();
});

// Dark mode toggle (Desktop & Mobile)
function updateThemeIcons(isDark) {
  if (iconSun) iconSun.style.display = isDark ? 'block' : 'none';
  if (iconMoon) iconMoon.style.display = isDark ? 'none' : 'block';
  if (iconSunMobile) iconSunMobile.style.display = isDark ? 'block' : 'none';
  if (iconMoonMobile) iconMoonMobile.style.display = isDark ? 'none' : 'block';
}

(function initTheme() {
  const saved = localStorage.getItem('ezzkonversi-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcons(true);
  } else {
    updateThemeIcons(false);
  }
})();

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('ezzkonversi-theme', 'light');
    updateThemeIcons(false);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('ezzkonversi-theme', 'dark');
    updateThemeIcons(true);
  }
}

if (btnTheme) btnTheme.addEventListener('click', toggleTheme);
if (btnThemeMobile) btnThemeMobile.addEventListener('click', toggleTheme);

// Tombol Salin Hasil
if (btnCopyResult) {
  btnCopyResult.addEventListener('click', function() {
    const val = resConvValue.textContent;
    if (!val || val === '—') return;

    function showCopied() {
      btnCopyResult.classList.add('copied');
      if (iconCopy) iconCopy.style.display = 'none';
      if (iconCheck) iconCheck.style.display = 'inline-block';
      if (copyText) copyText.textContent = 'Tersalin!';

      setTimeout(function() {
        btnCopyResult.classList.remove('copied');
        if (iconCopy) iconCopy.style.display = 'inline-block';
        if (iconCheck) iconCheck.style.display = 'none';
        if (copyText) copyText.textContent = 'Salin';
      }, 1600);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(val).then(showCopied).catch(function() {
        fallbackCopy(val);
        showCopied();
      });
    } else {
      fallbackCopy(val);
      showCopied();
    }
  });
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch (err) {}
  document.body.removeChild(ta);
}

// Mobile Bottom Nav link click (hanya link Konverter dan Riwayat)
bottomNavLinks.forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('data-target') || (this.getAttribute('href') || '').replace('#', '');
    const targetSection = document.getElementById(targetId);

    // Update active class
    bottomNavLinks.forEach(b => b.classList.remove('active'));
    this.classList.add('active');

    // Scroll ke target
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Update active nav-link & bottom-nav-link berdasarkan scroll position
window.addEventListener('scroll', function() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY + 140;

  sections.forEach(function(section) {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');

    if (scrollY >= top && scrollY < top + height) {
      // Update desktop menu
      if (navMenu) {
        navMenu.querySelectorAll('.nav-link').forEach(function(link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }

      // Update mobile bottom nav links
      bottomNavLinks.forEach(function(item) {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === id || item.getAttribute('href') === '#' + id) {
          item.classList.add('active');
        }
      });
    }
  });

  // Navbar shadow on scroll (desktop)
  const navbar = document.getElementById('navbar');
  if (navbar) {
    if (window.scrollY > 10) {
      navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
    } else {
      navbar.style.boxShadow = 'none';
    }
  }
});

// Inisialisasi atribut input & placeholder sesuai basis default
updateInputAttributesForBase();
