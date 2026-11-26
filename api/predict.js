import { readFileSync } from 'fs';
import { join } from 'path';

// Load exported Random Forest & XGBoost decision trees once per cold start
const models = JSON.parse(
  readFileSync(join(process.cwd(), 'api', 'models.json'), 'utf8')
);

function evalRandomForest(features) {
  const trees = models.rf;
  let total = 0;
  for (let i = 0; i < trees.length; i++) {
    const nodes = trees[i];
    let idx = 0;
    while (Array.isArray(nodes[idx])) {
      const [feat, thresh, left, right] = nodes[idx];
      idx = features[feat] <= thresh ? left : right;
    }
    total += nodes[idx];
  }
  return total / trees.length;
}

function evalXGBoost(features) {
  const { base_margin, trees } = models.xgb;
  let margin = base_margin;
  for (let i = 0; i < trees.length; i++) {
    const { lc, rc, si, sc, dc } = trees[i];
    let idx = 0;
    while (lc[idx] !== -1) {
      const feat = si[idx];
      const val = features[feat];
      if (val === null || val === undefined || Number.isNaN(val)) {
        idx = dc[idx] ? lc[idx] : rc[idx];
      } else if (val < sc[idx]) {
        idx = lc[idx];
      } else {
        idx = rc[idx];
      }
    }
    margin += sc[idx];
  }
  return 1 / (1 + Math.exp(-margin));
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'Rebalytix AI Backend (Vercel Serverless)',
      models_loaded: Boolean(models?.rf?.length && models?.xgb?.trees?.length),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    const name = data.name || 'Pasien';
    const gender = data.gender || 'Laki-laki';
    const hb = Number(data.hb ?? 0);
    const cholesterol = Number(data.cholesterol ?? 0);
    const bmi = Number(data.bmi ?? 0);
    const bp = Number(data.bp ?? 0);
    const ureum = Number(data.ureum ?? 0);
    const creatinine = Number(data.creatinine ?? 0);
    const gdp = Number(data.gdp ?? 0);
    const g2h = Number(data.g2h ?? 0);

    // 1. Encoding Hb (Hemoglobin) -> Normal=1, Ringan=2, Sedang=3, Berat=4
    let hb_enc = 1;
    if (gender === 'Laki-laki') {
      if (hb >= 13) hb_enc = 1;
      else if (hb >= 11 && hb < 13) hb_enc = 2;
      else if (hb >= 8 && hb < 11) hb_enc = 3;
      else hb_enc = 4;
    } else {
      if (hb >= 12) hb_enc = 1;
      else if (hb >= 11 && hb < 12) hb_enc = 2;
      else if (hb >= 8 && hb < 11) hb_enc = 3;
      else hb_enc = 4;
    }

    // 2. Encoding Cholesterol -> Normal=1, Borderline=2, Tinggi=3
    let chol_enc = 1;
    if (cholesterol < 200) chol_enc = 1;
    else if (cholesterol >= 200 && cholesterol < 240) chol_enc = 2;
    else chol_enc = 3;

    // 3. Encoding BMI -> Normal=1, Overweight=2, Obesitas=3
    let bmi_enc = 1;
    if (bmi < 25) bmi_enc = 1;
    else if (bmi >= 25 && bmi < 30) bmi_enc = 2;
    else bmi_enc = 3;

    // 4. Encoding Ureum -> Normal=1, Tinggi=4
    const ureum_enc = ureum <= 50 ? 1 : 4;

    // 5. Encoding Creatinine -> Normal=1, Tinggi=4
    const creat_enc = creatinine <= 1.2 ? 1 : 4;

    // 6. Encoding GDP (Gula Darah Puasa) -> Normal=1, Prediabetes=2, Diabetes=4
    let gdp_enc = 1;
    if (gdp <= 100) gdp_enc = 1;
    else if (gdp > 100 && gdp <= 125) gdp_enc = 2;
    else gdp_enc = 4;

    // 7. Encoding G2H (Gula 2 Jam) -> Normal=1, Prediabetes=2, Diabetes=4
    let g2h_enc = 1;
    if (g2h <= 140) g2h_enc = 1;
    else if (g2h > 140 && g2h < 200) g2h_enc = 2;
    else g2h_enc = 4;

    // 8. Encoding BP (Blood Pressure) -> Normal=1, Prehipertensi=2, HT1=3, HT2=4
    let bp_enc = 1;
    if (bp <= 120) bp_enc = 1;
    else if (bp > 120 && bp < 140) bp_enc = 2;
    else if (bp >= 140 && bp < 160) bp_enc = 3;
    else bp_enc = 4;

    const features = [hb_enc, chol_enc, bmi_enc, ureum_enc, creat_enc, gdp_enc, g2h_enc, bp_enc];

    const rfProb = evalRandomForest(features);
    const xgbProb = evalXGBoost(features);
    const ensembleProb = (rfProb + xgbProb) / 2;
    const riskScore = ensembleProb * 100;
    const isHighRisk = riskScore >= 50;

    const rekomendasi = [];
    if (hb_enc > 1) {
      rekomendasi.push('Kadar Hemoglobin (Hb) rendah menunjukkan indikasi anemia yang sering menyertai penurunan fungsi ginjal. Perbanyak konsumsi makanan kaya zat besi seperti sayuran hijau, hati, atau daging merah tanpa lemak.');
    }
    if (chol_enc > 1) {
      rekomendasi.push('Kadar Kolesterol Anda melebihi batas sehat. Hindari gorengan, santan, dan lemak jenuh karena penumpukan plak kolesterol dapat memperburuk aliran darah ke ginjal.');
    }
    if (bmi_enc > 1) {
      rekomendasi.push('Indeks Massa Tubuh (BMI) menunjukkan berat badan berlebih. Lakukan aktivitas fisik minimal 30 menit sehari untuk memperbaiki metabolisme tubuh dan meringankan kerja ginjal.');
    }
    if (bp_enc > 1) {
      rekomendasi.push('Tekanan darah Anda tinggi (indikasi Hipertensi). Segera kurangi makanan asin/tinggi natrium dan hindari stres, karena tekanan darah tinggi secara konsisten akan merusak pembuluh darah ginjal.');
    }
    if (ureum_enc > 1) {
      rekomendasi.push('Kadar Ureum di atas normal menandakan adanya penumpukan limbah nitrogen dalam darah. Jaga asupan air putih yang cukup dan hindari diet protein berlebihan tanpa pengawasan dokter.');
    }
    if (creat_enc > 1) {
      rekomendasi.push('Kadar Kreatinin Anda tinggi. Ini adalah indikator utama penurunan fungsi saringan ginjal. Hindari konsumsi obat pereda nyeri, suplemen sembarangan, atau jamu-jamuan tanpa resep dokter.');
    } else {
      rekomendasi.push('Fungsi penyaringan utama ginjal (Kreatinin) Anda masih terpantau dalam batas wajar. Pertahankan kebiasaan minum air putih yang baik.');
    }
    if (gdp_enc > 1 || g2h_enc > 1) {
      rekomendasi.push('Kadar glukosa darah Anda menunjukkan indikasi prediabetes/diabetes. Diabetes melitus yang tidak terkontrol adalah faktor pemicu kerusakan mikrovaskular nefron ginjal secara permanen (Nefropati Diabetik).');
    }
    rekomendasi.push('Penting: Segera konsultasikan hasil prediksi awal ini dengan dokter spesialis penyakit dalam atau nefrologi untuk evaluasi fungsi ginjal secara menyeluruh.');

    const explanation = isHighRisk
      ? `Berdasarkan analisis Hybrid Ensemble Machine Learning (XGBoost + Random Forest), Pasien ${name} terdeteksi memiliki Risiko Tinggi gagal ginjal kronis. Beberapa indikator kunci terpantau di luar batas sehat dan memerlukan intervensi medis segera.`
      : `Hasil analisis sistem menunjukkan Pasien ${name} berada pada Risiko Rendah. Fungsi filtrasi ginjal dan parameter metabolisme tubuh Anda sebagian besar masih dalam ambang batas sehat. Tetap pertahankan pola hidup sehat untuk mencegah kerusakan di masa depan.`;

    return res.status(200).json({
      status: 'success',
      prediction: isHighRisk ? 'Risiko Tinggi' : 'Risiko Rendah',
      confidence: Math.round(riskScore * 10) / 10,
      explanation,
      recommendations: rekomendasi,
    });
  } catch (err) {
    return res.status(400).json({
      status: 'error',
      message: err instanceof Error ? err.message : 'Invalid request',
    });
  }
}
