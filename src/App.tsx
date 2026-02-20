import React, { useEffect, useRef, useState } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { FaceMesh, FACEMESH_CONTOURS, FACEMESH_TESSELATION } from '@mediapipe/face_mesh';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Smile, User, Zap, Eye, ShieldCheck, Settings, Info } from 'lucide-react';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFaceMeshOn, setIsFaceMeshOn] = useState(true);
  const [stats, setStats] = useState({
    perfection: 0,
    symmetry: 0,
    status: 'Analyzing...',
    emotion: 'Calculating...',
    smileLevel: 0
  });

  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results) => {
      if (!canvasRef.current || !videoRef.current) return;
      const canvasCtx = canvasRef.current.getContext('2d')!;
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Draw mesh if enabled
        if (isFaceMeshOn) {
          drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#00ffff44', lineWidth: 1 });
          drawConnectors(canvasCtx, landmarks, FACEMESH_CONTOURS, { color: '#00ffff', lineWidth: 1 });
        }

        // Logic for emotion (Smile Detection)
        // 0: left mouth corner, 17: right mouth corner, 13: top lip, 14: bottom lip
        const leftMouth = landmarks[61];
        const rightMouth = landmarks[291];
        const topLip = landmarks[13];
        const bottomLip = landmarks[14];

        const mouthWidth = Math.sqrt(Math.pow(rightMouth.x - leftMouth.x, 2) + Math.pow(rightMouth.y - leftMouth.y, 2));
        const mouthHeight = Math.sqrt(Math.pow(bottomLip.y - topLip.y, 2));
        
        // Pseudo-logic for smile
        const smileValue = Math.min(100, Math.max(0, (mouthWidth * 1.5 - mouthHeight) * 200));
        
        // Logic for Symmetry
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const center = landmarks[1];
        const symmetryScore = Math.max(0, 100 - Math.abs((center.x - leftEye.x) - (rightEye.x - center.x)) * 500);

        setStats({
          perfection: Math.floor(symmetryScore * 0.7 + smileValue * 0.3),
          symmetry: Math.floor(symmetryScore),
          status: smileValue > 15 ? 'Radiant' : 'Neutral',
          emotion: smileValue > 15 ? 'Happy' : (smileValue < 5 ? 'Sad/Focused' : 'Neutral'),
          smileLevel: Math.floor(smileValue)
        });
      }
      canvasCtx.restore();
    });

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current! });
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }
  }, [isFaceMeshOn]);

  return (
    <div className="relative w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden font-sans select-none">
      {/* Background Camera Feed */}
      <video
        ref={videoRef}
        className="absolute w-full h-full object-cover opacity-60 scale-x-[-1]"
        playsInline
        muted
      />
      
      {/* Face Mesh Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute w-full h-full object-cover z-10 scale-x-[-1]"
        width={1280}
        height={720}
      />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-full border border-cyan-500/50">
            <Scan className="text-cyan-400 w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-white">X-RAY FACE AI</h1>
            <p className="text-[10px] uppercase tracking-widest text-cyan-400 opacity-80">v2.4 Quantum Scan</p>
          </div>
        </div>
        <button 
          onClick={() => setIsFaceMeshOn(!isFaceMeshOn)}
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
            isFaceMeshOn ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-transparent border-white/20 text-white'
          }`}
        >
          {isFaceMeshOn ? 'MESH: ACTIVE' : 'MESH: OFF'}
        </button>
      </div>

      {/* Main UI Controls */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-20 space-y-4">
        
        {/* Perfection Meter */}
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Face Perfection</p>
              <h2 className="text-4xl font-black text-white">{stats.perfection}%</h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Status</p>
              <h2 className={`text-lg font-bold ${stats.emotion === 'Happy' ? 'text-green-400' : 'text-cyan-400'}`}>
                {stats.status}
              </h2>
            </div>
          </div>

          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
              initial={{ width: 0 }}
              animate={{ width: `${stats.perfection}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatusCard icon={<Smile size={18} />} label="Emotion" value={stats.emotion} />
          <StatusCard icon={<Zap size={18} />} label="Symmetry" value={`${stats.symmetry}%`} />
          <StatusCard icon={<ShieldCheck size={18} />} label="Quality" value="Optimal" />
        </div>
      </div>

      {/* Decorative HUD Elements */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-6 text-white/20 z-10 pointer-events-none">
        <User size={24} />
        <Settings size={24} />
        <Info size={24} />
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-cyan-500/5 to-transparent z-10" />
      
      {/* Scanning Line Animation */}
      <motion.div 
        className="absolute left-0 w-full h-[1px] bg-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)] z-10"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
};

const StatusCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
    <div className="text-cyan-400 mb-1 opacity-80">{icon}</div>
    <p className="text-[8px] uppercase tracking-widest text-white/40 mb-1">{label}</p>
    <p className="text-xs font-bold text-white truncate w-full">{value}</p>
  </div>
);

export default App;
