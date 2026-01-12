import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Sun,
  Camera,
  Utensils,
  Music,
  Loader2,
  Plane,
  Wifi,
  WifiOff,
  Info,
  Save,
  Palmtree,
  Sunset,
  AlertTriangle,
  Map,
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  getDoc,
} from 'firebase/firestore';

// --- Firebase Configuration ---
// 🔴 PASTE YOUR KEYS HERE 🔴
// You need to replace these values with the ones from your Firebase Console
const firebaseConfig = {
  apiKey: 'AIzaSyC1zixPcvf-XDwXI0ou_q0ccRso5XntvBU',
  authDomain: 'plot-12d13.firebaseapp.com',
  projectId: 'plot-12d13',
  storageBucket: 'plot-12d13.firebasestorage.app',
  messagingSenderId: '529422532398',
  appId: '1:529422532398:web:dc5966f2211a26e60484bf',
};

// --- Logic to handle missing keys gracefully ---
const isConfigured =
  firebaseConfig.apiKey !== 'AIzaSyC1zixPcvf-XDwXI0ou_q0ccRso5XntvBU';

let app, auth, db;
const appId = 'vacation-mexico-2026';

if (isConfigured) {
  // Only initialize if keys are present to prevent crashes
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  // Enable Offline Persistence
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
}

// --- App Constants ---
// Mexico Theme Colors: Teals, Oranges, Pinks
const ACTIVITY_TYPES = [
  {
    id: 'sightseeing',
    icon: Camera,
    label: 'Sightseeing',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  {
    id: 'food',
    icon: Utensils,
    label: 'Tacos & Drinks',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  {
    id: 'activity',
    icon: Sun,
    label: 'Beach/Activity',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  {
    id: 'travel',
    icon: Plane,
    label: 'Travel',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  {
    id: 'nightlife',
    icon: Music,
    label: 'Nightlife',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
  },
];

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
};

export default function App() {
  // If keys aren't pasted, show the setup screen immediately
  if (!isConfigured) {
    return <SetupScreen />;
  }

  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('Auth error (likely offline):', error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  if (!user && isOnline) {
    return (
      <div className="flex h-screen items-center justify-center bg-amber-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50 text-slate-900 pb-24 font-sans">
      {/* BRANDING HEADER: PLOT */}
      <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg sticky top-0 z-20 pb-8 pt-4 px-4 rounded-b-[2.5rem]">
        <div className="max-w-3xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="font-bold text-3xl flex items-center gap-2 tracking-tight">
              <Map className="h-8 w-8 text-yellow-300" />
              Plot
            </h1>
            <div className="flex items-center gap-2 mt-1 ml-1">
              <Palmtree className="h-3 w-3 text-teal-200" />
              <p className="text-teal-100 text-sm opacity-90 font-medium">
                Mexico 2026
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-orange-200" />
                <span className="text-orange-100">Offline</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-6">
        <GeneralInfoBox db={db} appId={appId} />
        <ItineraryList user={user} db={db} appId={appId} />
      </main>
    </div>
  );
}

// --- Setup Screen Component ---
function SetupScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-red-100">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Setup Required
        </h2>
        <p className="text-slate-600 mb-6">
          The app needs your Firebase keys to save data.
        </p>

        <div className="bg-slate-100 p-4 rounded-lg text-left text-sm mb-6 border border-slate-200">
          <p className="font-semibold text-slate-700 mb-2">How to fix this:</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>
              Open{' '}
              <code className="bg-white px-1 py-0.5 rounded border border-slate-300 text-slate-800">
                src/App.jsx
              </code>{' '}
              in your editor.
            </li>
            <li>
              Scroll to the top to find{' '}
              <code className="text-slate-800">firebaseConfig</code>.
            </li>
            <li>
              Replace the "PASTE_YOUR..." placeholders with your actual keys
              from the Firebase Console.
            </li>
          </ol>
        </div>

        <p className="text-xs text-slate-400">
          Once you save the file with the correct keys, this screen will
          disappear automatically.
        </p>
      </div>
    </div>
  );
}

// --- New Component: General Info Box ---
function GeneralInfoBox({ db, appId }) {
  const [info, setInfo] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load General Info
  useEffect(() => {
    const docRef = doc(db, 'artifacts', appId, 'public', 'general_info');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setInfo(docSnap.data().content || '');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db, appId]);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'general_info'), {
        content: info,
        updatedAt: serverTimestamp(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving info:', err);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-5 mb-8 relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -z-0 opacity-50" />

      <div className="flex justify-between items-center mb-3 relative z-10">
        <h3 className="font-bold text-teal-800 flex items-center gap-2">
          <Info className="h-4 w-4 text-orange-500" />
          Trip Details
        </h3>
        {isEditing ? (
          <button
            onClick={handleSave}
            className="text-xs bg-teal-600 text-white px-3 py-1 rounded-full font-medium flex items-center gap-1 hover:bg-teal-700 transition-colors"
          >
            <Save className="h-3 w-3" /> Save
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-teal-600 font-medium hover:text-teal-800 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <textarea
          className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[100px]"
          placeholder="Add flight numbers, hotel address, wifi passwords here..."
          value={info}
          onChange={(e) => setInfo(e.target.value)}
        />
      ) : (
        <div
          className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed min-h-[40px]"
          onClick={() => setIsEditing(true)}
        >
          {info || (
            <span className="text-slate-400 italic">
              Tap to add flight info, hotel address, or notes...
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ItineraryList({ user, db, appId }) {
  const [events, setEvents] = useState([]);
  const [dates, setDates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'itinerary');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(fetched);
        const uniqueDates = [...new Set(fetched.map((e) => e.date))].sort();
        setDates(uniqueDates);
      },
      (err) => {
        console.log('Reading from cache...', err);
      }
    );
    return () => unsubscribe();
  }, [db, appId]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'itinerary', id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="space-y-8">
      {dates.length === 0 && !isModalOpen && (
        <div className="text-center py-12 opacity-60">
          <Sunset className="h-16 w-16 mx-auto text-orange-300 mb-3" />
          <p className="text-slate-500">Your Mexico adventure is blank!</p>
          <p className="text-xs text-slate-400">
            Tap + to add your first taco stop.
          </p>
        </div>
      )}

      {dates.map((date) => {
        const dayEvents = events
          .filter((e) => e.date === date)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        const dateObj = new Date(date + 'T12:00:00');
        const dayName = dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
        });
        const prettyDate = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        return (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-lg text-sm shadow-sm">
                {prettyDate}
              </div>
              <h2 className="text-lg font-bold text-slate-700">{dayName}</h2>
            </div>

            <div className="space-y-3 pl-2 border-l-2 border-orange-100 ml-4">
              {dayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEdit={() => {
                    setEditingEvent(event);
                    setIsModalOpen(true);
                  }}
                  onDelete={() => handleDelete(event.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      <button
        onClick={() => {
          setEditingEvent(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 h-14 w-14 bg-orange-500 text-white rounded-full shadow-xl shadow-orange-500/40 flex items-center justify-center hover:bg-orange-600 active:scale-90 transition-all z-30"
      >
        <Plus className="h-8 w-8" />
      </button>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          eventToEdit={editingEvent}
          user={user}
          db={db}
          appId={appId}
        />
      )}
    </div>
  );
}

function EventCard({ event, onEdit, onDelete }) {
  const typeStyle =
    ACTIVITY_TYPES.find((t) => t.id === event.type) || ACTIVITY_TYPES[2];
  const Icon = typeStyle.icon;

  return (
    <div
      onClick={onEdit}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4 active:bg-slate-50 transition-all relative overflow-hidden"
    >
      <div
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 ${typeStyle.color
          .replace('text-', 'bg-')
          .replace('bg-', 'bg-opacity-20 text-')}`}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-slate-800 leading-tight text-base">
            {event.title}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-slate-300 hover:text-red-500 p-2 -mr-3 -mt-3"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Time Row */}
        <div className="flex items-center gap-2 mt-1.5">
          <Clock className="h-3.5 w-3.5 text-teal-600" />
          <span className="text-sm font-medium text-slate-600">
            {formatTime(event.startTime)}
            {event.endTime && ` - ${formatTime(event.endTime)}`}
          </span>
        </div>

        {/* Address Row */}
        {event.location && (
          <div className="flex items-start gap-2 mt-1.5">
            <MapPin className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
            <span className="text-sm text-slate-500 line-clamp-1">
              {event.location}
            </span>
          </div>
        )}

        {event.notes && (
          <p className="text-xs text-slate-400 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
            {event.notes}
          </p>
        )}
      </div>
    </div>
  );
}

function EventModal({ isOpen, onClose, eventToEdit, user, db, appId }) {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '12:00',
    endTime: '',
    location: '',
    notes: '',
    type: 'activity',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title,
        date: eventToEdit.date,
        startTime: eventToEdit.startTime,
        endTime: eventToEdit.endTime || '',
        location: eventToEdit.location || '',
        notes: eventToEdit.notes || '',
        type: eventToEdit.type || 'activity',
      });
    }
  }, [eventToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;
    setIsSubmitting(true);

    try {
      const data = { ...formData, updatedAt: serverTimestamp() };
      if (eventToEdit) {
        await updateDoc(
          doc(db, 'artifacts', appId, 'public', 'itinerary', eventToEdit.id),
          data
        );
      } else {
        await addDoc(
          collection(db, 'artifacts', appId, 'public', 'itinerary'),
          {
            ...data,
            userId: user?.uid || 'anon',
            createdAt: serverTimestamp(),
          }
        );
      }
      onClose();
    } catch (error) {
      alert('Error saving: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="fixed inset-0 bg-teal-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-teal-50 to-white">
          <h3 className="font-bold text-lg text-teal-900 flex items-center gap-2">
            {eventToEdit ? 'Edit Activity' : 'New Activity'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              What are we doing?
            </label>
            <input
              autoFocus
              type="text"
              required
              placeholder="e.g. Tacos at El Fogón"
              className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                required
                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-white"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Type
              </label>
              <select
                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-white"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3" /> Start
              </label>
              <input
                type="time"
                required
                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-white"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3" /> End
              </label>
              <input
                type="time"
                className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-white"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Address / Location
            </label>
            <input
              type="text"
              placeholder="e.g. Av. Benito Juárez 123"
              className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              rows="3"
              placeholder="Bring cash, reservation #1234, etc."
              className="w-full mt-1 px-4 py-3 rounded-xl border border-slate-200 resize-none"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="pt-4 pb-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex justify-center hover:bg-orange-600"
            >
              {isSubmitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                'Save Plan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
