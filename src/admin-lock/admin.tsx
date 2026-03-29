import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMapMarkerAlt, 
  FaPlusCircle, 
  FaTrashAlt, 
  FaMusic, 
  FaQrcode, 
  FaLock, 
  FaUnlockAlt,
  FaEye,
  FaEyeSlash,
  FaMicrophoneAlt,
  FaMapPin,
  FaInfoCircle,
  FaChevronDown
} from 'react-icons/fa';
import { IoMusicalNotes } from 'react-icons/io5';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Nigeria states array - sorted alphabetically for better organization
const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
].sort();

// Types
interface LocationData {
  id: string;
  name: string;
}

// interface EventData {
//   eventName: string;
//   locations: string[];
//   createdAt: any;
//   eventId: string;
// }

// Admin Lock Component with Encryption
const AdminLock: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleUnlock = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const ENCRYPTION_KEY = "2026";
    if (password === ENCRYPTION_KEY) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid encryption key. Access denied.");
    }
  }, [password]);

  if (!isAuthenticated) {
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
          
          <div style={{
            background: 'white',
            width: 'clamp(200px, 65vw, 280px)',
            height: 'clamp(200px, 65vw, 280px)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '10px',
            margin: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            animation: 'pulse 2s infinite ease-in-out'
          }}>
            <div style={{
              width: '70%',
              height: '70%',
              maxWidth: '180px',
              maxHeight: '180px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#e8eef5',
              borderRadius: '50%'
            }}>
              <FaLock style={{ fontSize: 'clamp(60px, 12vw, 100px)', color: '#1e4fa3' }} />
            </div>
          </div>
          
          <p style={{
            color: '#1e4fa3',
            marginTop: '35px',
            fontSize: 'clamp(16px, 3vw, 20px)',
            marginBottom: '25px'
          }}>
            (Enter master key to unlock)
          </p>
          
          <form onSubmit={handleUnlock} style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 45px 14px 20px',
                  border: error ? '2px solid #e74c3c' : '2px solid #d1d9e6',
                  borderRadius: '50px',
                  fontSize: '16px',
                  outline: 'none',
                  background: 'white',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter master key"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#7f8c8d'
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {error && (
              <p style={{ color: '#e74c3c', fontSize: '13px', marginTop: '-10px', marginBottom: '15px' }}>
                ⚠️ {error}
              </p>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                background: '#1e4fa3',
                color: 'white',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '50px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(30, 79, 163, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#163d7a'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#1e4fa3'}
            >
              <FaUnlockAlt />
              Unlock & Access
            </button>
          </form>
        </div>

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
      </div>
    );
  }

  return <>{children}</>;
};

// Custom Dropdown Component
const CustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}> = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '14px 18px',
          borderRadius: '50px',
          border: '2px solid #e8eef5',
          fontSize: '16px',
          background: '#fafcfd',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          color: value ? '#333' : '#7f8c8d'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1e4fa3'}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = '#e8eef5';
        }}
      >
        <span>{value || placeholder}</span>
        <FaChevronDown style={{ 
          fontSize: '12px', 
          color: '#1e4fa3',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }} />
      </div>
      
      {isOpen && (
        <>
          <div 
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
              background: 'transparent'
            }}
          />
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '1px solid #e8eef5',
            maxHeight: '280px',
            overflowY: 'auto',
            zIndex: 999,
            animation: 'dropdownFadeIn 0.2s ease-out'
          }}>
            <div style={{
              padding: '8px 0',
              background: '#fafcfd',
              borderRadius: '20px'
            }}>
              {options.map((option) => (
                <div
                  key={option}
                  onClick={() => handleSelect(option)}
                  style={{
                    padding: '10px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    color: '#333',
                    background: value === option ? '#e8eef5' : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e8eef5';
                  }}
                  onMouseLeave={(e) => {
                    if (value !== option) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Main LINKUP Generator Component
const LinkupGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationsList, setLocationsList] = useState<LocationData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>("");

  const addLocation = useCallback(() => {
    if (!selectedLocation) return;
    if (locationsList.some(loc => loc.name === selectedLocation)) {
      alert("📍 This location has already been added!");
      return;
    }
    const newLocation: LocationData = {
      id: `${selectedLocation}-${Date.now()}`,
      name: selectedLocation
    };
    setLocationsList(prev => [...prev, newLocation]);
    setSelectedLocation("");
  }, [selectedLocation, locationsList]);

  const removeLocation = useCallback((id: string) => {
    setLocationsList(prev => prev.filter(loc => loc.id !== id));
  }, []);

  const handleGenerateQR = useCallback(async () => {
    if (!eventName.trim()) {
      alert("Please enter your event/show name.");
      return;
    }
    if (locationsList.length === 0) {
      alert("Please add at least one location.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Prepare event data for Firebase
      const eventData = {
        eventName: eventName.trim(),
        locations: locationsList.map(loc => loc.name),
        createdAt: serverTimestamp(),
        totalLocations: locationsList.length
      };

      // Save to Firebase Firestore
      const docRef = await addDoc(collection(db, "events"), eventData);
      
      console.log("Event saved with ID:", docRef.id);
      
      // Store the event ID in sessionStorage to retrieve on the DateQr page
      sessionStorage.setItem('currentEventId', docRef.id);
      sessionStorage.setItem('currentEventName', eventName.trim());
      sessionStorage.setItem('currentEventLocations', JSON.stringify(locationsList.map(loc => loc.name)));
      
      // Redirect to DateQr page with the event ID
      navigate(`/date-qr/${docRef.id}`);
      
    } catch (err) {
      console.error("Error saving event to Firebase:", err);
      setError("Failed to save event. Please try again.");
      setIsGenerating(false);
    }
  }, [eventName, locationsList, navigate]);

  return (
    <div style={{ minHeight: 'auto', background: '#f5f7fb', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(20px, 5vh, 50px) 20px' }}>
        {/* Header with music icon */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '40px',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <div>
            <h1 style={{
              color: '#1e4fa3',
              letterSpacing: '6px',
              fontWeight: '700',
              fontSize: 'clamp(24px, 5vw, 38px)',
              marginBottom: '5px'
            }}>
              LINK UP
            </h1>
            <p style={{
              color: '#1e4fa3',
              fontStyle: 'italic',
              fontSize: 'clamp(12px, 3vw, 16px)'
            }}>
              in the moment
            </p>
          </div>
          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '50%',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IoMusicalNotes style={{ fontSize: '28px', color: '#1e4fa3' }} />
          </div>
        </div>

        {/* Form Section Only */}
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: 'clamp(20px, 4vw, 35px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          animation: 'fadeIn 0.6s ease-out 0.1s both'
        }}>
          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '20px',
              color: '#dc2626',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Enter Name */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1e4fa3',
              fontWeight: '600',
              marginBottom: '10px',
              fontSize: '14px',
              letterSpacing: '1px'
            }}>
              <FaMicrophoneAlt /> ENTER NAME
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '50px',
                border: '2px solid #e8eef5',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                background: '#fafcfd'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#1e4fa3'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e8eef5'}
              placeholder="e.g., Lagos Vibes Fest, Abuja Comedy Night"
            />
          </div>

          {/* Add Location with custom dropdown */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1e4fa3',
              fontWeight: '600',
              marginBottom: '10px',
              fontSize: '14px',
              letterSpacing: '1px'
            }}>
              <FaMapMarkerAlt /> ADD LOCATION(S)
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <CustomSelect
                value={selectedLocation}
                onChange={setSelectedLocation}
                options={NIGERIA_STATES}
                placeholder="Select a state in Nigeria"
              />
              <button
                onClick={addLocation}
                style={{
                  background: '#e8eef5',
                  color: '#1e4fa3',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '50px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d1d9e6'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#e8eef5'}
              >
                <FaPlusCircle /> Add
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#7f8c8d', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaInfoCircle /> Tap the dropdown to select from 37 Nigerian states
            </p>
          </div>

          {/* Added Locations List */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{
              color: '#1e4fa3',
              fontWeight: '600',
              marginBottom: '12px',
              fontSize: '14px',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaMapPin /> Added Locations
            </h3>
            {locationsList.length === 0 ? (
              <div style={{
                background: '#fafcfd',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                color: '#95a5a6',
                fontSize: '13px',
                border: '2px dashed #e8eef5'
              }}>
                No locations added yet
                <br />
                <span style={{ fontSize: '11px' }}>Select a state from the dropdown and tap + to add</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {locationsList.map((loc) => (
                  <div
                    key={loc.id}
                    style={{
                      background: '#e8eef5',
                      borderRadius: '50px',
                      padding: '8px 14px 8px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ color: '#1e4fa3', fontSize: '14px', fontWeight: '500' }}>{loc.name}</span>
                    <button
                      onClick={() => removeLocation(loc.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#e74c3c',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fdecea'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <FaTrashAlt style={{ fontSize: '12px' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Another Location button */}
          {locationsList.length > 0 && (
            <button
              onClick={() => {
                const selectElement = document.querySelector('[data-select-trigger]');
                if (selectElement) (selectElement as HTMLElement).click();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#1e4fa3',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '24px',
                padding: '0'
              }}
            >
              <FaPlusCircle style={{ fontSize: '12px' }} />
              Add Another Location
            </button>
          )}

          {/* Tips */}
          <div style={{
            background: '#fef9e6',
            borderRadius: '16px',
            padding: '16px 20px',
            marginTop: '10px',
            border: '1px solid #f5e6b8'
          }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <FaInfoCircle style={{ fontSize: '20px', color: '#b8860b' }} />
              <div>
                <p style={{ fontWeight: '600', color: '#b8860b', fontSize: '13px', marginBottom: '4px' }}>Tips</p>
                <p style={{ fontSize: '12px', color: '#8b6914', lineHeight: '1.5' }}>
                  Tap the dropdown to view all 37 Nigerian states. Select multiple locations for your event,
                  generate QR code to share with your audience.
                </p>
              </div>
            </div>
          </div>

          {/* Generate QR Button */}
          <button
            onClick={handleGenerateQR}
            disabled={isGenerating}
            style={{
              width: '100%',
              background: '#1e4fa3',
              color: 'white',
              border: 'none',
              padding: '16px 20px',
              borderRadius: '50px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '28px',
              boxShadow: '0 4px 15px rgba(30, 79, 163, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: isGenerating ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) e.currentTarget.style.background = '#163d7a';
            }}
            onMouseLeave={(e) => {
              if (!isGenerating) e.currentTarget.style.background = '#1e4fa3';
            }}
          >
            {isGenerating ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Saving to Firebase...
              </>
            ) : (
              <>
                <FaQrcode style={{ fontSize: '20px' }} />
                Generate QR & Save Event
              </>
            )}
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #e8eef5',
          fontSize: '11px',
          color: '#95a5a6'
        }}>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <FaMusic style={{ color: '#1e4fa3' }} />
            LINKUP Generator — Create QR codes for shows, events & spots across Nigeria
            <FaMusic style={{ color: '#1e4fa3' }} />
          </p>
        </div>
      </div>

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
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export { AdminLock, LinkupGenerator };