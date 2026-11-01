const Engine = (() => {
  const b64ToBytes = (s) => { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
  function decode(meta, b64) {
    const u = b64ToBytes(b64), n = meta.nNodes;
    const F = new Int8Array(u.buffer.slice(0, n));
    const T = new Float64Array(u.buffer.slice(n, n + 8 * n));
    const R = new Uint32Array(u.buffer.slice(9 * n, 13 * n));
    const P = new Float32Array(u.buffer.slice(13 * n, 13 * n + 4 * meta.nProbs * (meta.classes ? meta.classes.length : 0)));
    return { meta, F, T, R, P };
  }
  function scale(meta, raw) {
    const s = meta.scaler, out = new Float32Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = s.kind === 'robust' ? (raw[i] - s.a[i]) / s.b[i] : raw[i] * s.b[i] + s.a[i];
    return out; // le Float32Array reproduit le cast float32 de scikit-learn
  }
  function predict(model, raw) {
    const { meta, F, T, R, P } = model, x = scale(meta, raw), nT = meta.nTrees;
    const k = meta.classes ? meta.classes.length : 0;
    const per = new Float64Array(nT), proba = k ? new Float64Array(k) : null;
    for (let t = 0; t < nT; t++) {
      let i = meta.roots[t];
      while (F[i] >= 0) i = x[F[i]] <= T[i] ? i + 1 : R[i];
      if (k) { const o = T[i] * k; for (let c = 0; c < k; c++) proba[c] += P[o + c] / nT; }
      else per[t] = T[i];
    }
    if (k) { let b = 0; for (let c = 1; c < k; c++) if (proba[c] > proba[b]) b = c; return { label: meta.classes[b], index: b, proba: Array.from(proba) }; }
    const mean = per.reduce((a, v) => a + v, 0) / nT, s = Array.from(per).sort((a, b) => a - b);
    const q = (p) => s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
    return { value: mean, low: q(0.1), high: q(0.9), min: s[0], max: s[s.length - 1] };
  }
  return { decode, predict };
})();
