import React, { useState, useEffect, useRef } from 'react';

// Data Pertanyaan Misi Kilat
const FLASH_CARDS = [
  { id: 1, text: "Minum TTD paling efektif dilakukan malam hari sebelum tidur untuk hindari mual.", isCorrect: true },
  { id: 2, text: "Meminum TTD bersamaan dengan teh pekat atau kopi manis mempercepat penyerapan zat besi.", isCorrect: false },
  { id: 3, text: "Vitamin C (seperti air jeruk) sangat membantu tubuh menyerap zat besi dari TTD.", isCorrect: true },
  { id: 4, text: "Remaja putri cukup minum TTD setahun sekali saat merasa pusing saja.", isCorrect: false },
  { id: 5, text: "Konsumsi rutin TTD 1 tablet setiap minggu dianjurkan untuk mencegah anemia.", isCorrect: true },
  { id: 6, text: "Susu sapi segar sangat disarankan sebagai teman minum TTD secara bersamaan.", isCorrect: false }
];

export default function App() {
  // --- STATE VIDEO (STEP 01) ---
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoName, setVideoName] = useState('Belum ada video yang dipilih.');
  const videoRef = useRef(null);

  // --- STATE KUIS & MISI KILAT (STEP 02) ---
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  // --- STATE PENGINGAT (STEP 03) ---
  const [reminderTime, setReminderTime] = useState('19:00');
  const [frequency, setFrequency] = useState('Setiap minggu');
  const [selectedDays, setSelectedDays] = useState(['Sen', 'Rab', 'Jum']);
  const [selectedPattern, setSelectedPattern] = useState('Setelah rutinitas harian');
  const [isReminderActive, setIsReminderActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [checkInCount, setCheckInCount] = useState(0);

  // Load / Setup Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error(err));
    }
  }, []);

  // Di dalam komponen App() pada src/App.jsx:
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Mendengarkan pesan balik dari Service Worker
      const handleSWMessage = (event) => {
        if (event.data && event.data.type === 'CONFIRM_DRINK') {
          setCheckInCount((prev) => prev + 1); // Tambah check-in otomatis[cite: 3]
          alert('Status tercatat: Kamu sudah minum TTD dari notifikasi!');
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    }
  }, []);

  useEffect(() => {
  if (!isReminderActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      // Cocokkan dengan input time pengguna[cite: 3]
      if (currentTime === reminderTime) {
        playAudioChime(); // Mainkan suara nada
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'TRIGGER_NOTIFICATION',
            title: '🌸 Waktunya Minum TTD!',
            body: `Sudah jam ${reminderTime}. Jangan lupa minum Tablet Tambah Darah ya!`
          });
        }
      }
    }, 10000); // Periksa tiap 10 detik

    return () => clearInterval(interval);
  }, [isReminderActive, reminderTime, soundEnabled]);

  // Timer Countdown Misi Kilat
  useEffect(() => {
    let timer;
    if (isGameActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isGameActive) {
      setIsGameActive(false);
      setGameFinished(true);
    }
    return () => clearInterval(timer);
  }, [isGameActive, timeLeft]);

  // Audio Synthesizer Beep
  const playAudioChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.1);
        osc.stop(audioCtx.currentTime + idx * 0.1 + 0.4);
      });
    } catch (e) {
      console.log(e);
    }
  };

  // Navigasi Scroll Halus
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Handler Pilih Video Lokal
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoSrc(URL.createObjectURL(file));
      setVideoName(file.name);
    }
  };

  // Handler Misi Kilat Game
  const handleStartGame = () => {
    setIsGameActive(true);
    setGameFinished(false);
    setTimeLeft(45);
    setScore(0);
    setCurrentCardIdx(0);
  };

  const handleAnswerCard = (userAnswer) => {
    if (!isGameActive) return;
    if (FLASH_CARDS[currentCardIdx].isCorrect === userAnswer) {
      setScore(prev => prev + 1);
    }
    if (currentCardIdx + 1 < FLASH_CARDS.length) {
      setCurrentCardIdx(prev => prev + 1);
    } else {
      setIsGameActive(false);
      setGameFinished(true);
    }
  };

  const handleSkipCard = () => {
    if (!isGameActive) return;
    if (currentCardIdx + 1 < FLASH_CARDS.length) {
      setCurrentCardIdx(prev => prev + 1);
    } else {
      setIsGameActive(false);
      setGameFinished(true);
    }
  };

  // Handler Pengingat TTD
  const toggleReminder = async () => {
    const nextState = !isReminderActive;
    if (nextState) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          playAudioChime();
          const reg = await navigator.serviceWorker.ready;
          reg.active.postMessage({
            type: 'TRIGGER_NOTIFICATION',
            title: '🌸 Teman Ingat TTD Aktif!',
            body: `Pengingat diatur setiap jam ${reminderTime}. Jaga kesehatan darahmu!`
          });
        }
      }
    }
    setIsReminderActive(nextState);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f8fc',
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1e1b4b',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Pastel Blobs */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '-50px',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        backgroundColor: '#fce7f3',
        opacity: 0.8,
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '420px',
        left: '-100px',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        backgroundColor: '#ccfbf1',
        opacity: 0.7,
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* NAVBAR */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 60px',
        maxWidth: '1280px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ fontWeight: '800', fontSize: '18px', color: '#5b21b6' }}>
          Aksi Sehat: Misi TTD
        </div>
        <nav style={{ display: 'flex', gap: '36px', fontSize: '14px', fontWeight: '600', color: '#4b5563' }}>
          <span onClick={() => scrollTo('step-video')} style={{ cursor: 'pointer' }}>Video</span>
          <span onClick={() => scrollTo('step-kuis')} style={{ cursor: 'pointer' }}>Kuis</span>
          <span onClick={() => scrollTo('step-reminder')} style={{ cursor: 'pointer' }}>TTD</span>
        </nav>
      </header>

      {/* CONTAINER HALAMAN */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 40px 100px', position: 'relative', zIndex: 1 }}>
        
        {/* HERO SECTION */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          alignItems: 'center',
          gap: '40px',
          padding: '40px 0 100px'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #e9d5ff',
              color: '#6d28d9',
              fontSize: '13px',
              fontWeight: '700',
              padding: '6px 16px',
              borderRadius: '9999px',
              boxShadow: '0 2px 6px rgba(109, 40, 217, 0.05)',
              marginBottom: '20px'
            }}>
              <span>🤍</span> Sehat bareng, yuk!
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 4.5vw, 50px)',
              fontWeight: '900',
              lineHeight: '1.2',
              letterSpacing: '-0.02em',
              color: '#1e1b4b',
              margin: '0 0 18px 0'
            }}>
              Yuk, Kenali Anemia & TTD!
            </h1>

            <p style={{
              fontSize: '15px',
              lineHeight: '1.6',
              color: '#4b5563',
              maxWidth: '460px',
              margin: '0 0 32px 0'
            }}>
              Kenalan santai sama anemia dan pentingnya minum TTD, biar kamu makin paham cara sayang sama diri sendiri.
            </p>

            <button
              onClick={() => scrollTo('step-video')}
              style={{
                backgroundColor: '#6366f1',
                color: '#ffffff',
                padding: '14px 36px',
                fontSize: '15px',
                fontWeight: '700',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 12px 24px -6px rgba(99, 102, 241, 0.45)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Mulai belajar
            </button>
          </div>

          {/* Ilustrasi Karakter Perempuan Berhijab & Maskot TTD */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg style={{ position: 'absolute', top: '10px', left: '70px', width: '28px', height: '28px', fill: '#8b5cf6' }} viewBox="0 0 24 24">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
            </svg>
            <svg style={{ position: 'absolute', top: '25px', right: '80px', width: '22px', height: '22px', fill: '#f43f5e' }} viewBox="0 0 24 24">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
            </svg>

            {/* Lingkaran Mint Background */}
            <div style={{
              position: 'absolute',
              width: '330px',
              height: '330px',
              borderRadius: '50%',
              backgroundColor: '#cbf8e9',
              zIndex: 0
            }} />

            {/* SVG Karakter Hijab */}
            <svg viewBox="0 0 400 400" style={{ width: '400px', height: '400px', position: 'relative', zIndex: 1 }}>
              <ellipse cx="200" cy="200" rx="86" ry="105" fill="#3b2d69" />
              <path d="M110 390 Q200 290 290 390 Z" fill="#f472b6" />
              <polygon points="200,288 220,308 200,328 180,308" fill="#ffffff" />
              <ellipse cx="200" cy="205" rx="60" ry="68" fill="#fed7aa" />
              <path d="M140 205 Q200 145 260 205 Q200 175 140 205 Z" fill="#fed7aa" />
              <path d="M174 200 Q184 210 194 200" stroke="#3b2d69" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M206 200 Q216 210 226 200" stroke="#3b2d69" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M192 222 Q200 230 208 222" stroke="#be185d" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <rect x="135" y="342" width="34" height="34" rx="8" fill="#6366f1" />
              <path d="M152 350 V368 M143 359 H161" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

              {/* Tablet TTD Lucu */}
              <rect x="290" y="240" width="46" height="74" rx="18" fill="#ffffff" stroke="#06b6d4" strokeWidth="4" />
              <circle cx="304" cy="265" r="2.5" fill="#0f172a" />
              <circle cx="322" cy="265" r="2.5" fill="#0f172a" />
              <path d="M307 278 Q313 286 319 278" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </section>

        {/* STEP 01 • WATCH & LEARN (DENGAN SUPPORT FULLSCREEN) */}
        <section id="step-video" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '50px',
          alignItems: 'center',
          padding: '60px 0 100px'
        }}>
          <div>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#ede9fe',
              color: '#6d28d9',
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.06em',
              padding: '4px 14px',
              borderRadius: '9999px',
              marginBottom: '16px'
            }}>
              STEP 01 • WATCH & LEARN
            </div>

            <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#1e1b4b', margin: '0 0 16px 0' }}>
              Tonton Dulu, Yuk!
            </h2>

            <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#4b5563', maxWidth: '440px', margin: '0 0 24px 0' }}>
              Ambil waktu sebentar buat nonton materi edukasinya. Frame ini siap diisi video vertikal kapan saja.
            </p>

            <div style={{
              display: 'inline-block',
              backgroundColor: '#fdf2f8',
              color: '#9d174d',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '600',
              border: '1px solid #fce7f3'
            }}>
              Tonton videonya sampai habis sebelum lanjut ke bawah
            </div>
          </div>

          {/* Card Mockup Video Smartphone (Fullscreen Supported) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '38px',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.06)',
              border: '1px solid #f1f5f9',
              width: '100%',
              maxWidth: '350px',
              textAlign: 'center'
            }}>
              {/* Box Pemutar Video Vertikal */}
              <div style={{
                position: 'relative',
                backgroundColor: '#262626',
                borderRadius: '28px',
                height: '490px',
                border: '2px dashed #6366f1',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {videoSrc ? (
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    controls
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      boxShadow: '0 8px 18px rgba(0,0,0,0.2)'
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#6366f1">
                        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                      </svg>
                    </div>
                    <div style={{ color: '#818cf8', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                      Masukkan video edukasi
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', maxWidth: '200px', lineHeight: '1.4' }}>
                      Pilih file MP4 atau seret file video ke sini untuk memutarnya.
                    </div>
                  </>
                )}
              </div>

              <div style={{ fontSize: '12px', color: '#0f766e', fontWeight: '600', margin: '14px 0 12px 0' }}>
                {videoName}
              </div>

              <input
                type="file"
                id="upload-video"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleVideoUpload}
              />
              <button
                onClick={() => document.getElementById('upload-video').click()}
                style={{
                  width: '100%',
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px -2px rgba(99, 102, 241, 0.4)'
                }}
              >
                Pilih video
              </button>
            </div>
          </div>
        </section>

        {/* STEP 02 • TANTANGAN MISI TTD & MISI KILAT */}
        <section id="step-kuis" style={{ padding: '60px 0 100px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ color: '#5b21b6', fontSize: '13px', fontWeight: '800', marginBottom: '16px' }}>
              Yuk main kuis seru buat ngetes seberapa paham kamu soal anemia dan TTD!
            </div>
          </div>

          <div style={{
            maxWidth: '740px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '32px',
            padding: '40px',
            boxShadow: '0 12px 40px -10px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9'
          }}>
            {/* Header Tantangan Misi TTD */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#f472b6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: '0 8px 16px rgba(244, 114, 182, 0.35)'
              }}>
                <span style={{ fontSize: '24px', color: '#ffffff' }}>✨</span>
              </div>
              <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1e1b4b', margin: '0 0 10px 0' }}>
                Tantangan Misi TTD
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0' }}>
                Selesaikan 3 tantangan singkat tentang kebiasaan sehat terkait TTD secara aman dan edukatif.
              </p>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '22px' }}>
                <span style={{ backgroundColor: '#fdf2f8', color: '#be185d', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
                  0/3 tantangan
                </span>
                <span style={{ backgroundColor: '#f3e8ff', color: '#6d28d9', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
                  Tanpa timer
                </span>
                <span style={{ backgroundColor: '#fdf2f8', color: '#be185d', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
                  Belajar sambil bermain
                </span>
              </div>

              <button
                onClick={handleStartGame}
                style={{
                  width: '100%',
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  padding: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.4)',
                  marginBottom: '14px'
                }}
              >
                Mulai Misi
              </button>

              <div style={{
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Game ini untuk edukasi, bukan pengganti nasihat tenaga kesehatan.
              </div>
            </div>

            {/* Divider Putus-putus */}
            <div style={{ borderTop: '2px dashed #e2e8f0', margin: '30px 0' }} />

            {/* Bagian Misi Kilat: Tap & Menang */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                fontSize: '11px',
                fontWeight: '800',
                padding: '4px 12px',
                borderRadius: '9999px',
                marginBottom: '12px'
              }}>
                ⚡ Tantangan cepat
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e1b4b', margin: '0 0 6px 0' }}>
                Misi Kilat: Tap & Menang
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                Pilah kebiasaan TTD sebelum waktu habis.
              </p>

              <div style={{ fontSize: '48px', fontWeight: '900', color: '#6366f1', margin: '0 0 16px 0' }}>
                {timeLeft}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', color: '#1e1b4b', marginBottom: '16px' }}>
                <span>Kartu: {currentCardIdx + 1}/{FLASH_CARDS.length}</span>
                <span>Skor: {score}</span>
              </div>

              {/* Box Kartu Pertanyaan */}
              <div style={{
                background: 'linear-gradient(180deg, #fdf4ff 0%, #f0fdfa 100%)',
                border: '1px solid #f1f5f9',
                borderRadius: '20px',
                padding: '36px 24px',
                minHeight: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                fontWeight: '700',
                color: '#1e1b4b',
                lineHeight: '1.5',
                marginBottom: '20px'
              }}>
                {!isGameActive && !gameFinished ? (
                  'Tekan "Mulai Misi" atau jalankan countdown untuk bermain.'
                ) : gameFinished ? (
                  `🎉 Misi Selesai! Skor Akhir Kamu: ${score} dari ${FLASH_CARDS.length}`
                ) : (
                  FLASH_CARDS[currentCardIdx].text
                )}
              </div>

              {/* Tombol Aksi Kuis: Benar & Lewati */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <button
                  onClick={() => handleAnswerCard(true)}
                  disabled={!isGameActive}
                  style={{
                    backgroundColor: '#86efac',
                    color: '#065f46',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: isGameActive ? 'pointer' : 'not-allowed',
                    opacity: isGameActive ? 1 : 0.6
                  }}
                >
                  ✓ Benar
                </button>
                <button
                  onClick={handleSkipCard}
                  disabled={!isGameActive}
                  style={{
                    backgroundColor: '#f8fafc',
                    color: '#64748b',
                    padding: '14px',
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: isGameActive ? 'pointer' : 'not-allowed',
                    opacity: isGameActive ? 1 : 0.6
                  }}
                >
                  Lewati →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 03 • TEMAN INGAT TTD (FORMULIR LENGKAP) */}
        <section id="step-reminder" style={{ padding: '40px 0 60px' }}>
          <div style={{
            maxWidth: '740px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '32px',
            padding: '36px 40px',
            boxShadow: '0 12px 40px -10px rgba(0,0,0,0.04)',
            border: '1px solid #f1f5f9'
          }}>
            {/* Header Teman Ingat TTD */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '28px' }}>
              {/* Maskot Gelas & Tablet */}
              <div style={{ position: 'relative', width: '84px', height: '64px' }}>
                {/* Gelas Mint */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '10px',
                  width: '42px',
                  height: '52px',
                  borderRadius: '6px 6px 10px 10px',
                  border: '3px solid #0d9488',
                  backgroundColor: '#ccfbf1'
                }} />
                {/* Tablet Pink */}
                <div style={{
                  position: 'absolute',
                  right: '4px',
                  top: '4px',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#f472b6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>◡̈</div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1e1b4b', margin: '0 0 6px 0' }}>
                  Jangan Lupa Minum TTD-nya!
                </h3>
                <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#475569', margin: 0 }}>
                  Konsumsi TTD secara rutin adalah salah satu bentuk perhatian kecil buat kesehatan remaja putri. Kamu berharga, jadi yuk rawat diri pelan-pelan!
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#1e1b4b', margin: '0 0 4px 0' }}>
                Teman Ingat TTD
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                Bangun kebiasaan tanpa tekanan, dengan pengingat yang kamu atur sendiri.
              </p>
            </div>

            {/* Grid Form Pengaturan Pengingat */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Kolom Kiri: Waktu, Frekuensi & Hari */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Waktu pengingat
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: '#1e293b',
                    boxSizing: 'border-box',
                    marginBottom: '14px'
                  }}
                />

                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Frekuensi
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    marginBottom: '14px'
                  }}
                >
                  <option value="Setiap hari">Setiap hari</option>
                  <option value="Setiap minggu">Setiap minggu (Dianjurkan)</option>
                </select>

                {/* Checklist Hari */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  {['Sen', 'Rab', 'Jum'].map(day => (
                    <label key={day} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day)}
                        onChange={() => {
                          setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Atur sesuai anjuran tenaga kesehatan.
                </div>
              </div>

              {/* Kolom Kanan: Pola Pendukung */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                  Pilih pola yang mungkin membantu
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {[
                    { title: 'Setelah rutinitas harian', icon: '🥣' },
                    { title: 'Bersama segelas air putih', icon: '🥛' },
                    { title: 'Pengingat kalender', icon: '🔔' }
                  ].map(pola => {
                    const isSelected = selectedPattern === pola.title;
                    return (
                      <div
                        key={pola.title}
                        onClick={() => setSelectedPattern(pola.title)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: isSelected ? '1.5px solid #0d9488' : '1px solid #e2e8f0',
                          backgroundColor: isSelected ? '#f0fdfa' : '#ffffff',
                          color: '#334155',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{pola.icon}</span> {pola.title}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Tidak ada satu metode yang cocok untuk semua orang.
                </div>
              </div>
            </div>

            {/* Toggle Switch Aktifkan Pengingat */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
              backgroundColor: '#f8fafc',
              borderRadius: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Aktifkan pengingat</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {isReminderActive ? 'Pengingat aktif' : 'Pengingat nonaktif'}
                </div>
              </div>
              <div
                onClick={toggleReminder}
                style={{
                  width: '46px',
                  height: '24px',
                  borderRadius: '9999px',
                  backgroundColor: isReminderActive ? '#6366f1' : '#cbd5e1',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: isReminderActive ? '24px' : '2px',
                  transition: 'left 0.2s ease'
                }} />
              </div>
            </div>

            {/* Tiga Tombol Aksi Pengingat */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.3fr', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => {
                  setCheckInCount(prev => prev + 1);
                  alert('Hebat! Check-in minum TTD berhasil dicatat.');
                }}
                style={{
                  backgroundColor: '#2dd4bf',
                  color: '#042f2e',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Sudah minum
              </button>
              <button
                onClick={() => alert('Baik, kami akan ingatkan kembali nanti!')}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Ingatkan nanti
              </button>
              <button
                onClick={() => alert('Silakan konsultasikan dosis dan jadwal ke Puskesmas atau dokter terdekat.')}
                style={{
                  backgroundColor: '#6366f1',
                  color: '#ffffff',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Tanya tenaga kesehatan
              </button>
            </div>

            {/* Checkbox Suara Notifikasi */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', fontWeight: '600', marginBottom: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
              Suara notifikasi
            </label>

            {/* Status Bar */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              color: '#475569',
              marginBottom: '20px'
            }}>
              {isReminderActive
                ? `Pengingat aktif jam ${reminderTime} (${frequency}).`
                : 'Pengingat di halaman ini siap diatur.'}
            </div>

            {/* Konsistensi Minggu Ini Counter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: '800',
                color: '#334155'
              }}>
                {checkInCount}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e1b4b' }}>
                  Konsistensi minggu ini
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {checkInCount} check-in pada sesi ini. Pelan-pelan, yang penting konsisten.
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}