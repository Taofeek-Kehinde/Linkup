import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaArrowLeft, FaPaperPlane, FaMicrophone, FaCamera, FaStop, FaUserCircle } from 'react-icons/fa';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
  imageUrl?: string;
  audioUrl?: string;
}

const Chat: React.FC = () => {
  const { eventId, participantId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15 * 60 * 60); // 15 hours in seconds
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [sendingImage, setSendingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [participantName, setParticipantName] = useState("");
  const [participantPhoto, setParticipantPhoto] = useState("");
  const [eventTitle, setEventTitle] = useState("");

  useEffect(() => {
    // Get participant info from location state
    if (location.state) {
      setParticipantName(location.state.participantName || "LINKUP User");
      setParticipantPhoto(location.state.participantPhoto || "");
      setEventTitle(location.state.eventName || "LINK UP Event");
    }

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch messages with 3 message limit
  useEffect(() => {
    if (!eventId || !participantId) return;

    const chatId = [eventId, participantId].sort().join('_');
    const messagesRef = collection(db, `chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(3));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList: Message[] = [];
      snapshot.forEach((doc) => {
        messagesList.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(messagesList.reverse());
      setLoading(false);
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [eventId, participantId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const chatId = [eventId, participantId].sort().join('_');
    const messagesRef = collection(db, `chats/${chatId}/messages`);

    try {
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: "currentUser",
        timestamp: serverTimestamp(),
        read: false
      });
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Convert to base64 for storage in Firestore
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          
          const chatId = [eventId, participantId].sort().join('_');
          const messagesRef = collection(db, `chats/${chatId}/messages`);
          
          await addDoc(messagesRef, {
            text: "🎤 Voice message",
            audioUrl: base64Audio,
            senderId: "currentUser",
            timestamp: serverTimestamp()
          });
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSendingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const chatId = [eventId, participantId].sort().join('_');
        const messagesRef = collection(db, `chats/${chatId}/messages`);
        
        await addDoc(messagesRef, {
          text: "📷 Photo",
          imageUrl: base64Image,
          senderId: "currentUser",
          timestamp: serverTimestamp()
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Failed to send image");
    } finally {
      setSendingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const takePhoto = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header with Timer */}
      <div style={{
        background: 'white',
        padding: '15px 20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <button
            onClick={() => navigate(`/gallery/${eventId}`)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#1e4fa3',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaArrowLeft /> Back
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', margin: 0, color: '#333' }}>
              Chat with {participantName}
            </h2>
            <p style={{ fontSize: '12px', margin: '5px 0 0', color: '#7f8c8d' }}>
              {eventTitle}
            </p>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'clamp(24px, 5vw, 32px)',
              fontWeight: '700',
              color: '#e74c3c',
              fontFamily: 'monospace'
            }}>
              {formatTime(timeLeft)}
            </div>
            <p style={{ fontSize: '10px', margin: 0, color: '#7f8c8d' }}>Time Left</p>
          </div>
        </div>
      </div>

      {/* Timer Circle */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(255,255,255,0.1)',
        margin: '10px 20px',
        borderRadius: '20px'
      }}>
        <div style={{
          position: 'relative',
          width: '120px',
          height: '120px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - timeLeft / (15 * 60 * 60))}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {Math.floor(timeLeft / 3600)}h
            </div>
            <div style={{ fontSize: '12px' }}>remaining</div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'white' }}>
            Loading messages...
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.senderId === 'currentUser' ? 'flex-end' : 'flex-start',
                  animation: 'slideIn 0.3s ease-out'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}>
                  {message.senderId !== 'currentUser' && (
                    <div style={{
                      width: '35px',
                      height: '35px',
                      borderRadius: '50%',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {participantPhoto ? (
                        <img src={participantPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <FaUserCircle size={35} color="#1e4fa3" />
                      )}
                    </div>
                  )}
                  
                  <div style={{
                    background: message.senderId === 'currentUser' ? '#667eea' : 'white',
                    color: message.senderId === 'currentUser' ? 'white' : '#333',
                    padding: '10px 15px',
                    borderRadius: message.senderId === 'currentUser' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    maxWidth: '100%',
                    wordWrap: 'break-word'
                  }}>
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Shared"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: '10px',
                          marginBottom: '5px',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(message.imageUrl, '_blank')}
                      />
                    )}
                    {message.audioUrl && (
                      <audio controls style={{ maxWidth: '200px' }}>
                        <source src={message.audioUrl} type="audio/webm" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                    {message.text && message.text !== "🎤 Voice message" && message.text !== "📷 Photo" && (
                      <p style={{ margin: 0, fontSize: '14px' }}>{message.text}</p>
                    )}
                    {message.text === "🎤 Voice message" && <span>🎤 Voice message</span>}
                    {message.text === "📷 Photo" && <span>📷 Photo</span>}
                    <div style={{
                      fontSize: '10px',
                      marginTop: '5px',
                      opacity: 0.7,
                      textAlign: 'right'
                    }}>
                      {message.timestamp?.toDate?.().toLocaleTimeString() || 'Just now'}
                    </div>
                  </div>
                  
                  {message.senderId === 'currentUser' && (
                    <div style={{
                      width: '35px',
                      height: '35px',
                      borderRadius: '50%',
                      background: '#667eea',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <FaUserCircle size={35} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input Area */}
      <div style={{
        background: 'white',
        padding: '15px 20px',
        borderTop: '1px solid #e8eef5',
        position: 'sticky',
        bottom: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Camera Icon - Left */}
          <button
            onClick={takePhoto}
            disabled={sendingImage}
            style={{
              background: '#e8eef5',
              border: 'none',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              cursor: sendingImage ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: '#1e4fa3',
              transition: 'all 0.3s ease',
              opacity: sendingImage ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!sendingImage) e.currentTarget.style.background = '#d1d9e6';
            }}
            onMouseLeave={(e) => {
              if (!sendingImage) e.currentTarget.style.background = '#e8eef5';
            }}
          >
            <FaCamera />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          {/* Message Input - Center */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '12px 18px',
              borderRadius: '50px',
              border: '2px solid #e8eef5',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e8eef5'}
          />

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            style={{
              background: newMessage.trim() ? '#667eea' : '#e8eef5',
              border: 'none',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: newMessage.trim() ? 'white' : '#95a5a6',
              transition: 'all 0.3s ease'
            }}
          >
            <FaPaperPlane />
          </button>

          {/* Voice Recorder - Right */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            style={{
              background: isRecording ? '#e74c3c' : '#e8eef5',
              border: 'none',
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: isRecording ? 'white' : '#1e4fa3',
              transition: 'all 0.3s ease',
              animation: isRecording ? 'pulse 1s infinite' : 'none'
            }}
          >
            {isRecording ? <FaStop /> : <FaMicrophone />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default Chat;