import React, { useRef, useState } from "react";
import { FiCamera } from "react-icons/fi";

const Picture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [openCamera, setOpenCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);

  const startCamera = async () => {
    setOpenCamera(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user" 
      }
    });

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx?.drawImage(video, 0, 0);

    const image = canvas.toDataURL("image/png");
    setPhoto(image);

    // stop camera
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());

    setOpenCamera(false);
  };

  return (
    <>
      <div style={{
        minHeight: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fb',
        padding: 'clamp(40px, 8vh, 100px) 20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          width: '100%',
          maxWidth: '420px',
          animation: 'fadeIn 1s ease-in-out'
        }}>

          <h1 style={{
            color: '#1e4fa3',
            letterSpacing: '6px',
            fontWeight: '700',
            fontSize: 'clamp(28px, 5vw, 42px)',
            marginBottom: '5px'
          }}>
            LINK UP
          </h1>

          <p style={{
            color: '#1e4fa3',
            fontStyle: 'italic',
            fontSize: 'clamp(16px, 3vw, 22px)',
            marginBottom: '40px'
          }}>
            in the moment
          </p>

          {/* Circle */}
          <div
            onClick={startCamera}
            style={{
              background: 'white',
              width: 'clamp(200px, 65vw, 280px)',
              height: 'clamp(200px, 65vw, 280px)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              animation: 'pulse 2s infinite ease-in-out',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
          >
            {photo ? (
              <img
                src={photo}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <FiCamera size={80} color="#1e4fa3" />
            )}
          </div>

          <p style={{
            color: '#1e4fa3',
            marginTop: '35px',
            fontSize: 'clamp(16px, 3vw, 20px)'
          }}>
            (Take a photo to linkup)
          </p>
        </div>
      </div>

      {/* Camera Modal */}
      {openCamera && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "black",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 999
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxWidth: "400px",
              borderRadius: "12px"
            }}
          />

          <button
            onClick={takePhoto}
            style={{
              marginTop: 20,
              padding: "12px 20px",
              borderRadius: 8,
              border: "none",
              background: "#1e4fa3",
              color: "white",
              fontSize: 16,
              cursor: "pointer"
            }}
          >
            Snap Photo
          </button>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default Picture;