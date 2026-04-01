import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCamera } from "react-icons/fi";
import { db } from "../firebase";
import { doc, setDoc, getDoc, arrayUnion } from "firebase/firestore";

const Picture: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [openCamera, setOpenCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState<string>("");

  React.useEffect(() => {
    const fetchEventName = async () => {
      if (eventId) {
        try {
          const eventDoc = await getDoc(doc(db, "events", eventId));
          if (eventDoc.exists()) {
            setEventName(eventDoc.data().eventName || "LINK UP Event");
          }
        } catch (err) {
          console.error("Error fetching event:", err);
        }
      }
    };
    fetchEventName();
  }, [eventId]);

  const startCamera = async () => {
    setOpenCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user"
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please ensure you have granted permission.");
      setOpenCamera(false);
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx?.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL("image/png");
    setPhoto(imageDataUrl);

    // Stop camera
    const stream = video.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setOpenCamera(false);
    
    // Save to Firestore (without Storage)
    await savePhotoToFirestore(imageDataUrl);
  };

  const savePhotoToFirestore = async (imageDataUrl: string) => {
    if (!eventId) {
      alert("No event ID found");
      navigate('/');
      return;
    }

    setLoading(true);

    try {
      // Generate a unique ID for the photo
      const photoId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Save the photo metadata and base64 image to Firestore
      const photoDocRef = doc(db, `events/${eventId}/photos`, photoId);
      await setDoc(photoDocRef, {
        photoId: photoId,
        photoUrl: imageDataUrl,
        eventId: eventId,
        eventName: eventName,
        timestamp: new Date().toISOString(),
        createdAt: new Date()
      });

      // Also update the main event document to track number of photos
      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);
      const currentCount = eventDoc.data()?.photoCount || 0;
      await setDoc(eventDocRef, { 
        photoCount: currentCount + 1,
        lastPhotoAt: new Date().toISOString(),
        photoIds: arrayUnion(photoId)
      }, { merge: true });

      console.log("Photo saved successfully to Firestore!");
      
      // Redirect to Lollipop page
      navigate(`/lollipop/${eventId}`);
      
    } catch (err) {
      console.error("Error saving photo:", err);
      alert("Failed to save photo. Please try again.");
      setLoading(false);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  if (loading) {
    return (
      <div style={{
        minHeight: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f5f7fb',
        padding: 'clamp(40px, 8vh, 100px) 20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e8eef5',
            borderTopColor: '#1e4fa3',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#1e4fa3' }}>Saving your photo...</p>
        </div>
      </div>
    );
  }

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

          {/* Animated Glowing Camera Container */}
          <div
            onClick={!photo ? startCamera : undefined}
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
              cursor: !photo ? 'pointer' : 'default',
              overflow: 'hidden',
              position: 'relative',
              animation: !photo ? 'glowPulse 2s ease-in-out infinite, pulse 2s infinite ease-in-out' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            {/* Glowing ring effect */}
            {!photo && (
              <>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-10px',
                  right: '-10px',
                  bottom: '-10px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(30,79,163,0.3) 0%, rgba(30,79,163,0) 70%)',
                  animation: 'glowRing 1.5s ease-in-out infinite'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '-5px',
                  left: '-5px',
                  right: '-5px',
                  bottom: '-5px',
                  borderRadius: '50%',
                  border: '3px solid rgba(30,79,163,0.5)',
                  animation: 'ringPulse 1.5s ease-in-out infinite'
                }} />
              </>
            )}
            
            <div style={{
              width: '70%',
              height: '70%',
              maxWidth: '180px',
              maxHeight: '180px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#e8eef5',
              borderRadius: '50%',
              transition: 'all 0.3s ease',
              animation: !photo ? 'iconGlow 1.5s ease-in-out infinite' : 'none',
              boxShadow: !photo ? '0 0 20px rgba(30,79,163,0.5)' : 'none'
            }}>
              {photo ? (
                <img
                  src={photo}
                  alt="Your photo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%'
                  }}
                />
              ) : (
                <FiCamera 
                  size={80} 
                  color="#1e4fa3"
                  style={{
                    animation: 'cameraPulse 1.5s ease-in-out infinite'
                  }}
                />
              )}
            </div>
          </div>

          <p style={{
            color: '#1e4fa3',
            marginTop: '35px',
            fontSize: 'clamp(16px, 3vw, 20px)',
            animation: !photo ? 'textPulse 1.5s ease-in-out infinite' : 'none'
          }}>
            {photo ? "Your photo has been saved!" : "📸 (TAP TO TAKE A SELFIE TO LINKUP)"}
          </p>

          {photo && (
            <button
              onClick={retakePhoto}
              style={{
                marginTop: '20px',
                background: 'white',
                color: '#1e4fa3',
                border: '2px solid #1e4fa3',
                padding: '10px 20px',
                borderRadius: '50px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e8eef5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              Retake Photo
            </button>
          )}
        </div>
      </div>

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

          <div style={{ display: 'flex', gap: '20px', marginTop: 20 }}>
            <button
              onClick={() => {
                const stream = videoRef.current?.srcObject as MediaStream;
                if (stream) {
                  stream.getTracks().forEach(track => track.stop());
                }
                setOpenCamera(false);
              }}
              style={{
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                background: "#e74c3c",
                color: "white",
                fontSize: 16,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              onClick={takePhoto}
              style={{
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                background: "#1e4fa3",
                color: "white",
                fontSize: 16,
                cursor: "pointer",
                animation: 'buttonGlow 1s ease-in-out infinite'
              }}
            >
              Snap Photo
            </button>
          </div>

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
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* New Glow Animations */
        @keyframes glowPulse {
          0% {
            box-shadow: 0 10px 30px rgba(30, 79, 163, 0.1);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 10px 50px rgba(30, 79, 163, 0.4);
            transform: scale(1.02);
          }
          100% {
            box-shadow: 0 10px 30px rgba(30, 79, 163, 0.1);
            transform: scale(1);
          }
        }

        @keyframes glowRing {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
          100% {
            opacity: 0;
            transform: scale(1.1);
          }
        }

        @keyframes ringPulse {
          0% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
        }

        @keyframes iconGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(30, 79, 163, 0.4);
          }
          50% {
            box-shadow: 0 0 20px 10px rgba(30, 79, 163, 0.6);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(30, 79, 163, 0.4);
          }
        }

        @keyframes cameraPulse {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 0 0px rgba(30, 79, 163, 0));
          }
          50% {
            transform: scale(1.1);
            filter: drop-shadow(0 0 15px rgba(30, 79, 163, 0.8));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 0px rgba(30, 79, 163, 0));
          }
        }

        @keyframes textPulse {
          0% {
            opacity: 0.7;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-2px);
          }
          100% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }

        @keyframes buttonGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(30, 79, 163, 0.4);
          }
          50% {
            box-shadow: 0 0 20px 5px rgba(30, 79, 163, 0.8);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(30, 79, 163, 0.4);
          }
        }
      `}</style>
    </>
  );
};

export default Picture;