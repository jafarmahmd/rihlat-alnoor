import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { TopBar } from './components/TopBar';
import { HomeScreen } from './components/HomeScreen';
import { MapScreen } from './components/MapScreen';
import { StationView } from './components/StationView';
import { StoreScreen } from './components/StoreScreen';
import { DuasScreen } from './components/DuasScreen';
import { MunajatScreen } from './components/MunajatScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { DigitalLibraryScreen } from './components/DigitalLibraryScreen';
import { TasbihScreen } from './components/TasbihScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { AdhanSettingsScreen } from './components/AdhanSettingsScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import {
  OemBatteryAutostartModal,
  hasSeenOemBatteryModal,
} from './components/OemBatteryAutostartModal';
import {
  PermissionManager,
  hasSeenPermissionManager,
} from './components/PermissionManager';
import { Square, Volume2 } from 'lucide-react';
import {
  AdhanPlaybackState,
  getAdhanPlaybackState,
  stopAnyAdhanPlayback,
  subscribeAdhanPlaybackState,
} from './utils/adhanAudioPlayer';
import {
  ReadingFocusSettings,
  ReadingSettingsModal,
  loadReadingFocusSettings,
  saveReadingFocusSettings,
} from './components/ReadingFocusControls';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AppUpdateBanner } from './components/AppUpdateBanner';
import { SpiritualNotificationToast } from './components/SpiritualNotificationToast';
import { SpiritualNotificationsModal } from './components/SpiritualNotificationsModal';
import {
  DispatchedNotificationPayload,
  requestNativeNotificationPermissionOnce,
  startDailyNotificationScheduler,
  subscribeToInAppNotification,
  subscribeToOpenSpiritualEntry,
} from './utils/notificationManager';
import {
  LocationPermissionStatus,
  autoDetectGpsOnAppEnter,
  getLocationPermissionStatus,
  subscribeLocationPermissionStatus,
} from './utils/gpsLocation';
import {
  PrayerLocationPreference,
  loadPrayerLocationPreference,
} from './utils/prayerTimes';
import {
  AppUpdateInfo,
  checkForAppUpdate,
  dismissUpdateTag,
} from './utils/appUpdateChecker';
import { loadHijriOffset } from './data/hijriCalendar';
import {
  exitAndroidAppIfNative,
  initAndroidBackButton,
  registerHardwareBackHandler,
} from './utils/hardwareBack';
import { MASOOMEEN_LIBRARY } from './data/library';
import { STATIONS } from './data/stations';
import { STORE_ITEMS } from './data/storeItems';
import {
  DigitalLibrarySection,
  GameProgress,
  ScreenView,
  StoreItem,
} from './types/game';
import {
  playClickSound,
  playCorrectSound,
  playLockedSound,
  playTryAgainSound,
  playVictorySound,
} from './utils/sound';

const STORAGE_KEY = 'rihlat_alnoor_progress_v2';
const PROFILE_STORAGE_KEY = 'rihlat_alnoor_user_profile_v1';
const READING_STAR_REWARD = 5;

interface SavedUserProfile {
  name: string;
  age: number;
  completed: boolean;
}

function loadSavedProfile(): SavedUserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedUserProfile>;
    if (
      parsed?.completed === true &&
      typeof parsed.name === 'string' &&
      parsed.name.trim().length >= 2 &&
      typeof parsed.age === 'number' &&
      parsed.age >= 4 &&
      parsed.age <= 120
    ) {
      return {
        name: parsed.name.trim(),
        age: Math.round(parsed.age),
        completed: true,
      };
    }
  } catch {
    // Ignore storage read error
  }
  return null;
}

function saveUserProfile(name: string, age: number | null) {
  if (typeof window === 'undefined') return;
  if (!name.trim() || age == null || age < 4 || age > 120) return;
  try {
    const payload: SavedUserProfile = {
      name: name.trim(),
      age: Math.round(age),
      completed: true,
    };
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage write error
  }
}

const DEFAULT_PROGRESS: GameProgress = {
  unlockedStationId: 1,
  completedStations: {},
  completedReadingIds: [],
  spentStars: 0,
  purchasedItemIds: [],
  activeTitleId: null,
  activeFrameId: null,
  activeBackgroundId: null,
  childName: 'بطل النور',
  userAge: null,
  profileCompleted: false,
  lastRead: null,
  bookmarkedIds: [],
};

function loadInitialProgress(): GameProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  const savedProfile = loadSavedProfile();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return savedProfile
        ? {
            ...DEFAULT_PROGRESS,
            childName: savedProfile.name,
            userAge: savedProfile.age,
            profileCompleted: true,
          }
        : DEFAULT_PROGRESS;
    }
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    if (
      typeof parsed?.unlockedStationId === 'number' &&
      parsed.unlockedStationId >= 1 &&
      parsed.unlockedStationId <= STATIONS.length &&
      typeof parsed.completedStations === 'object' &&
      parsed.completedStations !== null
    ) {
      const hasValidAge =
        typeof parsed.userAge === 'number' &&
        parsed.userAge >= 4 &&
        parsed.userAge <= 120;
      const resolvedAge = hasValidAge
        ? Math.round(parsed.userAge as number)
        : savedProfile?.age ?? null;
      const resolvedName =
        typeof parsed.childName === 'string' && parsed.childName.trim()
          ? parsed.childName.trim()
          : savedProfile?.name ?? 'بطل النور';
      const resolvedCompleted =
        Boolean(parsed.profileCompleted && hasValidAge) ||
        Boolean(savedProfile?.completed);

      return {
        unlockedStationId: parsed.unlockedStationId,
        completedStations: parsed.completedStations,
        completedReadingIds: Array.isArray(parsed.completedReadingIds)
          ? parsed.completedReadingIds.filter(
              (id): id is string => typeof id === 'string'
            )
          : [],
        spentStars: typeof parsed.spentStars === 'number' ? parsed.spentStars : 0,
        purchasedItemIds: Array.isArray(parsed.purchasedItemIds)
          ? parsed.purchasedItemIds
          : [],
        activeTitleId:
          typeof parsed.activeTitleId === 'string' ? parsed.activeTitleId : null,
        activeFrameId:
          typeof parsed.activeFrameId === 'string' ? parsed.activeFrameId : null,
        activeBackgroundId:
          typeof parsed.activeBackgroundId === 'string'
            ? parsed.activeBackgroundId
            : null,
        childName: resolvedName,
        userAge: resolvedAge,
        profileCompleted: resolvedCompleted,
        lastRead:
          parsed.lastRead && typeof parsed.lastRead === 'object'
            ? parsed.lastRead
            : null,
        bookmarkedIds: Array.isArray(parsed.bookmarkedIds)
          ? parsed.bookmarkedIds.filter(
              (id): id is string => typeof id === 'string'
            )
          : [],
      };
    }
  } catch {
    // Fallback to clean initial progress
  }
  return savedProfile
    ? {
        ...DEFAULT_PROGRESS,
        childName: savedProfile.name,
        userAge: savedProfile.age,
        profileCompleted: true,
      }
    : DEFAULT_PROGRESS;
}

const STORY_READING_IDS = new Set<string>(
  MASOOMEEN_LIBRARY.flatMap((figure) => figure.stories.map((story) => story.id))
);

function calculateEarnedStars(prog: GameProgress): number {
  const stationStars = Object.values(prog.completedStations).reduce(
    (sum, stars) => sum + stars,
    0
  );
  const storyStars =
    prog.completedReadingIds.filter((id) => STORY_READING_IDS.has(id)).length *
    READING_STAR_REWARD;
  return stationStars + storyStars;
}

export default function App() {
  const [screen, setScreen] = useState<ScreenView>('home');
  const [activeLibrarySection, setActiveLibrarySection] =
    useState<DigitalLibrarySection>('adiyat');
  const [activeLibraryEntryId, setActiveLibraryEntryId] = useState<
    string | null
  >(null);
  const [libraryNavigationNonce, setLibraryNavigationNonce] = useState<number>(0);
  const [hijriOffset, setHijriOffset] = useState<number>(() =>
    loadHijriOffset()
  );
  const [activeStationId, setActiveStationId] = useState<number>(1);
  const [progress, setProgress] = useState<GameProgress>(loadInitialProgress);
  const [muted, setMuted] = useState<boolean>(false);
  const [readingFocusSettings, setReadingFocusSettings] =
    useState<ReadingFocusSettings>(() => loadReadingFocusSettings());
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [activeToast, setActiveToast] = useState<DispatchedNotificationPayload | null>(null);
  const [toastNotificationsOpen, setToastNotificationsOpen] = useState<boolean>(false);
  const [availableUpdate, setAvailableUpdate] = useState<AppUpdateInfo | null>(null);
  const [adhanPlayback, setAdhanPlayback] = useState<AdhanPlaybackState>(
    getAdhanPlaybackState
  );
  const [currentLocation, setCurrentLocation] =
    useState<PrayerLocationPreference>(() => loadPrayerLocationPreference());
  const [locationStatus, setLocationStatus] =
    useState<LocationPermissionStatus>(getLocationPermissionStatus);
  const [oemBatteryModalOpen, setOemBatteryModalOpen] =
    useState<boolean>(false);
  const [permissionManagerOpen, setPermissionManagerOpen] =
    useState<boolean>(() => !hasSeenPermissionManager());

  useEffect(() => {
    saveReadingFocusSettings(readingFocusSettings);
  }, [readingFocusSettings]);

  useEffect(() => {
    return subscribeAdhanPlaybackState(setAdhanPlayback);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  useEffect(() => {
    const stopScheduler = startDailyNotificationScheduler();
    const unsubToast = subscribeToInAppNotification((payload) => {
      setActiveToast(payload);
    });
    const unsubOpen = subscribeToOpenSpiritualEntry(({ section, entryId }) => {
      setShowWelcome(false);
      if (section === 'library' || section === 'tasbih') {
        if (section === 'library') {
          setActiveStoryId(entryId ?? null);
        }
        setScreen(section);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (section === 'duas') {
        setActiveLibrarySection('adiyat');
        setActiveLibraryEntryId(entryId ?? null);
        setLibraryNavigationNonce((n) => n + 1);
        setScreen('digital-library');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (section === 'munajat') {
        setActiveLibrarySection('munajat');
        setActiveLibraryEntryId(entryId ?? null);
        setLibraryNavigationNonce((n) => n + 1);
        setScreen('digital-library');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setActiveLibrarySection(section);
        setActiveLibraryEntryId(entryId ?? null);
        setLibraryNavigationNonce((n) => n + 1);
        setScreen('digital-library');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    return () => {
      stopScheduler();
      unsubToast();
      unsubOpen();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const runCheck = async () => {
      const res = await checkForAppUpdate({
        force: false,
        respectDismissed: true,
      });
      if (!cancelled && res.status === 'update-available' && res.update) {
        setAvailableUpdate(res.update);
      }
    };

    void runCheck();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void runCheck();
      }
    };
    const onOnline = () => {
      void runCheck();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // المزامنة الحية لحالة الموقع الجغرافي وطلب إذن Geolocation API عند فتح التطبيق لأول مرة
  useEffect(() => {
    const syncLocation = () => {
      setCurrentLocation(loadPrayerLocationPreference());
    };
    const unsubPerm = subscribeLocationPermissionStatus(setLocationStatus);
    window.addEventListener('rihlat:prayer-location-updated', syncLocation);

    void autoDetectGpsOnAppEnter().then((result) => {
      if (result?.ok && result.preference) {
        setCurrentLocation(result.preference);
      }
    });

    return () => {
      unsubPerm();
      window.removeEventListener('rihlat:prayer-location-updated', syncLocation);
    };
  }, []);

  useEffect(() => {
    if (!showWelcome) {
      void requestNativeNotificationPermissionOnce();
      if (!hasSeenPermissionManager()) {
        const timer = window.setTimeout(() => {
          setPermissionManagerOpen(true);
        }, 500);
        return () => window.clearTimeout(timer);
      }
      if (
        Capacitor.isNativePlatform() &&
        Capacitor.getPlatform() === 'android' &&
        !hasSeenOemBatteryModal()
      ) {
        const timer = window.setTimeout(() => {
          setOemBatteryModalOpen(true);
        }, 1200);
        return () => window.clearTimeout(timer);
      }
    }
  }, [showWelcome]);

  const totalEarnedStars = calculateEarnedStars(progress);
  const availableStars = Math.max(0, totalEarnedStars - progress.spentStars);
  const completedCount = Object.keys(progress.completedStations).length;

  const activeStation =
    STATIONS.find((s) => s.id === activeStationId) || STATIONS[0];

  const activeBackgroundClass =
    (progress.activeBackgroundId &&
      STORE_ITEMS.find((i) => i.id === progress.activeBackgroundId)?.themeClass) ||
    'noor-canvas';

  const isStarryBg = progress.activeBackgroundId === 'theme-bg-stars';

  const navigateTo = (target: ScreenView) => {
    playClickSound(muted);
    setScreen(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLibrarySection = (
    section: DigitalLibrarySection,
    entryId?: string
  ) => {
    playClickSound(muted);
    setActiveLibrarySection(section);
    setActiveLibraryEntryId(entryId ?? null);
    setLibraryNavigationNonce((n) => n + 1);
    setScreen('digital-library');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Android hardware back button handling via @capacitor/app
  useEffect(() => {
    return initAndroidBackButton(() => {
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      if (toastNotificationsOpen) {
        setToastNotificationsOpen(false);
        return;
      }
      if (showWelcome) {
        exitAndroidAppIfNative();
        return;
      }
      if (screen === 'station') {
        setScreen('map');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (screen !== 'home') {
        setScreen('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      exitAndroidAppIfNative();
    });
  }, [screen, settingsOpen, toastNotificationsOpen, showWelcome]);

  useEffect(() => {
    if (!settingsOpen && !toastNotificationsOpen) return;
    return registerHardwareBackHandler(() => {
      if (settingsOpen) {
        setSettingsOpen(false);
        return true;
      }
      if (toastNotificationsOpen) {
        setToastNotificationsOpen(false);
        return true;
      }
      return false;
    });
  }, [settingsOpen, toastNotificationsOpen]);

  const handleSelectStation = (stationId: number) => {
    playClickSound(muted);
    setActiveStationId(stationId);
    setScreen('station');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteStation = (stationId: number, starsEarned: number) => {
    setProgress((prev) => {
      const existingStars = prev.completedStations[stationId] || 0;
      const nextCompleted = {
        ...prev.completedStations,
        [stationId]: Math.max(existingStars, starsEarned),
      };
      const nextUnlocked = Math.min(
        STATIONS.length,
        Math.max(prev.unlockedStationId, stationId + 1)
      );
      return {
        ...prev,
        unlockedStationId: nextUnlocked,
        completedStations: nextCompleted,
      };
    });
  };

  const handleCompleteReading = (readingId: string): boolean => {
    if (progress.completedReadingIds.includes(readingId)) {
      return false;
    }
    playCorrectSound(muted);
    setProgress((prev) => {
      if (prev.completedReadingIds.includes(readingId)) return prev;
      return {
        ...prev,
        completedReadingIds: [...prev.completedReadingIds, readingId],
      };
    });
    return true;
  };

  const handleBuyItem = (item: StoreItem) => {
    setProgress((prev) => {
      if (prev.purchasedItemIds.includes(item.id)) return prev;
      const earned = calculateEarnedStars(prev);
      const currentAvail = earned - prev.spentStars;
      if (currentAvail < item.price) return prev;

      playVictorySound(muted);
      return {
        ...prev,
        spentStars: prev.spentStars + item.price,
        purchasedItemIds: [...prev.purchasedItemIds, item.id],
      };
    });
  };

  const handleActivateItem = (item: StoreItem) => {
    playCorrectSound(muted);
    setProgress((prev) => {
      if (!prev.purchasedItemIds.includes(item.id)) return prev;
      if (item.category === 'titles') {
        return { ...prev, activeTitleId: item.id };
      }
      if (item.themeKind === 'frame') {
        return { ...prev, activeFrameId: item.id };
      }
      if (item.themeKind === 'background') {
        return { ...prev, activeBackgroundId: item.id };
      }
      return prev;
    });
  };

  const handleDeactivateKind = (kind: 'title' | 'frame' | 'background') => {
    playClickSound(muted);
    setProgress((prev) => {
      if (kind === 'title') return { ...prev, activeTitleId: null };
      if (kind === 'frame') return { ...prev, activeFrameId: null };
      return { ...prev, activeBackgroundId: null };
    });
  };

  const handleUpdateProfile = (name: string, age: number | null) => {
    playClickSound(muted);
    saveUserProfile(name, age);
    setProgress((prev) => ({
      ...prev,
      childName: name,
      userAge: age,
      profileCompleted: true,
    }));
  };

  const handleResetProgress = () => {
    playClickSound(muted);
    setProgress((prev) => ({
      ...DEFAULT_PROGRESS,
      childName: prev.childName,
      userAge: prev.userAge,
      profileCompleted: prev.profileCompleted,
    }));
  };

  const handleSetLastRead = (section: string, itemId: string, title: string) => {
    setProgress((prev) => ({
      ...prev,
      lastRead: {
        section,
        itemId,
        title,
        timestamp: Date.now(),
      },
    }));
  };

  const handleToggleBookmark = (itemId: string) => {
    playClickSound(muted);
    setProgress((prev) => {
      const exists = prev.bookmarkedIds.includes(itemId);
      return {
        ...prev,
        bookmarkedIds: exists
          ? prev.bookmarkedIds.filter((id) => id !== itemId)
          : [...prev.bookmarkedIds, itemId],
      };
    });
  };

  if (showWelcome) {
    return (
      <>
        <WelcomeScreen
          needsProfile={!progress.profileCompleted || progress.userAge == null}
          initialName={progress.profileCompleted ? progress.childName : ''}
          initialAge={progress.userAge ?? null}
          onSaveProfile={handleUpdateProfile}
          onEnterHome={() => {
            setShowWelcome(false);
            navigateTo('home');
          }}
          onEnterScreen={(targetScreen) => {
            setShowWelcome(false);
            navigateTo(targetScreen);
          }}
          onEnterLibrarySection={(section) => {
            setShowWelcome(false);
            openLibrarySection(section);
          }}
        />
        <SpiritualNotificationToast
          notification={activeToast}
          onDismiss={() => setActiveToast(null)}
          onOpenSettings={() => {
            setShowWelcome(false);
            setToastNotificationsOpen(true);
          }}
        />
        <AppUpdateBanner
          update={availableUpdate}
          onDismiss={() => {
            if (availableUpdate) {
              dismissUpdateTag(availableUpdate.tagName);
            }
            setAvailableUpdate(null);
          }}
        />
      </>
    );
  }

  return (
    <div
      dir="rtl"
      className={`min-h-screen flex flex-col relative text-[#11271F] transition-colors duration-500 ${activeBackgroundClass}`}
    >
      {/* Subtle Pattern Background Layer */}
      <div
        className={`fixed inset-0 pointer-events-none ${
          isStarryBg ? 'noor-pattern-stars' : 'noor-pattern'
        }`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex-1 flex flex-col">
        {screen !== 'home' && (
          <TopBar
            currentScreen={screen}
            activeLibrarySection={activeLibrarySection}
            availableStars={availableStars}
            childName={progress.childName}
            userAge={progress.userAge ?? null}
            activeTitleId={progress.activeTitleId}
            activeFrameId={progress.activeFrameId}
            muted={muted}
            onToggleMute={() => setMuted((prev) => !prev)}
            onOpenSettings={() => {
              playClickSound(muted);
              setSettingsOpen(true);
            }}
            onNavigateHome={() => navigateTo('home')}
            onNavigateScreen={navigateTo}
            onOpenLibrarySection={openLibrarySection}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        <div className="flex-1">
          {screen === 'home' && (
            <HomeScreen
              availableStars={availableStars}
              completedCount={completedCount}
              completedReadingIds={progress.completedReadingIds}
              bookmarkedIds={progress.bookmarkedIds}
              hijriOffset={hijriOffset}
              lastRead={progress.lastRead}
              currentLocation={currentLocation}
              locationStatus={locationStatus}
              onStartJourney={() => navigateTo('map')}
              onOpenStore={() => navigateTo('store')}
              onOpenLibrary={(storyId) => {
                setActiveStoryId(storyId ?? null);
                navigateTo('library');
              }}
              onOpenTasbih={() => navigateTo('tasbih')}
              onOpenCalendar={() => navigateTo('calendar')}
              onOpenAdhanSettings={() => navigateTo('adhan-settings')}
              onOpenInfo={() => {
                playClickSound(muted);
                setShowWelcome(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenSettings={() => {
                playClickSound(muted);
                setSettingsOpen(true);
              }}
              onOpenLibrarySection={openLibrarySection}
              onCompleteReading={handleCompleteReading}
              onResumeLastRead={() => {
                if (!progress.lastRead) return;
                const { section, itemId } = progress.lastRead;
                if (
                  section === 'quran' ||
                  section === 'adiyat' ||
                  section === 'sahifa' ||
                  section === 'ziyarat' ||
                  section === 'munajat'
                ) {
                  openLibrarySection(
                    section as DigitalLibrarySection,
                    itemId
                  );
                } else if (section === 'duas') {
                  openLibrarySection('adiyat', itemId);
                } else if (section === 'library') {
                  setActiveStoryId(itemId);
                  navigateTo('library');
                } else {
                  navigateTo('home');
                }
              }}
            />
          )}

          {screen === 'calendar' && (
            <CalendarScreen
              completedReadingIds={progress.completedReadingIds}
              onCompleteReading={handleCompleteReading}
              onOpenLibraryEntry={openLibrarySection}
              onBackHome={() => navigateTo('home')}
              hijriOffset={hijriOffset}
              onChangeHijriOffset={setHijriOffset}
            />
          )}

          {screen === 'tasbih' && (
            <TasbihScreen
              muted={muted}
              completedReadingIds={progress.completedReadingIds}
              onCompleteReading={handleCompleteReading}
              onBackHome={() => navigateTo('home')}
            />
          )}

          {screen === 'duas' && (
            <DuasScreen
              completedReadingIds={progress.completedReadingIds}
              bookmarkedIds={progress.bookmarkedIds}
              focusSettings={readingFocusSettings}
              onOpenSettings={() => {
                playClickSound(muted);
                setSettingsOpen(true);
              }}
              onCompleteReading={handleCompleteReading}
              onToggleBookmark={handleToggleBookmark}
              onBackHome={() => navigateTo('home')}
              onSetLastRead={handleSetLastRead}
            />
          )}

          {screen === 'munajat' && (
            <MunajatScreen
              completedReadingIds={progress.completedReadingIds}
              bookmarkedIds={progress.bookmarkedIds}
              focusSettings={readingFocusSettings}
              onOpenSettings={() => {
                playClickSound(muted);
                setSettingsOpen(true);
              }}
              onCompleteReading={handleCompleteReading}
              onToggleBookmark={handleToggleBookmark}
              onBackHome={() => navigateTo('home')}
              onSetLastRead={handleSetLastRead}
            />
          )}

          {screen === 'library' && (
            <LibraryScreen
              completedReadingIds={progress.completedReadingIds}
              bookmarkedIds={progress.bookmarkedIds}
              initialStoryId={activeStoryId}
              onCompleteReading={handleCompleteReading}
              onToggleBookmark={handleToggleBookmark}
              onSetLastRead={handleSetLastRead}
              onBackHome={() => navigateTo('home')}
            />
          )}

          {screen === 'digital-library' && (
            <DigitalLibraryScreen
              initialSection={activeLibrarySection}
              initialEntryId={activeLibraryEntryId}
              navigationNonce={libraryNavigationNonce}
              completedReadingIds={progress.completedReadingIds}
              bookmarkedIds={progress.bookmarkedIds}
              focusSettings={readingFocusSettings}
              onOpenSettings={() => {
                playClickSound(muted);
                setSettingsOpen(true);
              }}
              onCompleteReading={handleCompleteReading}
              onToggleBookmark={handleToggleBookmark}
              onBackHome={() => navigateTo('home')}
              onOpenTasbih={() => navigateTo('tasbih')}
              onSetLastRead={handleSetLastRead}
            />
          )}

          {screen === 'store' && (
            <StoreScreen
              progress={progress}
              availableStars={availableStars}
              onBuyItem={handleBuyItem}
              onActivateItem={handleActivateItem}
              onDeactivateKind={handleDeactivateKind}
              onBackHome={() => navigateTo('home')}
            />
          )}

          {screen === 'map' && (
            <MapScreen
              progress={progress}
              onSelectStation={handleSelectStation}
              onLockedClick={() => playLockedSound(muted)}
              onBackHome={() => navigateTo('home')}
              onResetProgress={handleResetProgress}
            />
          )}

          {screen === 'adhan-settings' && (
            <AdhanSettingsScreen onBackHome={() => navigateTo('home')} />
          )}

          {screen === 'station' && (
            <StationView
              station={activeStation}
              alreadyCompleted={Boolean(progress.completedStations[activeStation.id])}
              onCompleteStation={handleCompleteStation}
              onBackToMap={() => navigateTo('map')}
              onGoToNextStation={handleSelectStation}
              onCorrectAnswer={() => playCorrectSound(muted)}
              onWrongAnswer={() => playTryAgainSound(muted)}
              onVictory={() => playVictorySound(muted)}
            />
          )}
        </div>
      </div>

      {adhanPlayback.isPlaying && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:left-4 z-40 max-w-md mx-auto sm:mx-0 rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#D9B96A] shadow-xl px-4 py-2.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Volume2 className="w-4 h-4 text-[#D9B96A] shrink-0" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-bold truncate">
              {adhanPlayback.label || 'الأذان قيد التشغيل'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void stopAnyAdhanPlayback()}
            className="btn-gilded min-h-[38px] px-3.5 py-1 text-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" aria-hidden="true" />
            <span>إيقاف الأذان</span>
          </button>
        </div>
      )}

      <ReadingSettingsModal
        isOpen={settingsOpen}
        settings={readingFocusSettings}
        onChange={setReadingFocusSettings}
        onClose={() => setSettingsOpen(false)}
        onOpenAdhanSettings={() => {
          playClickSound(muted);
          setSettingsOpen(false);
          navigateTo('adhan-settings');
        }}
        onOpenWelcome={() => {
          playClickSound(muted);
          setSettingsOpen(false);
          setShowWelcome(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onUpdateFound={(upd) => {
          setSettingsOpen(false);
          setAvailableUpdate(upd);
        }}
      />

      <SpiritualNotificationToast
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
        onOpenSettings={() => setToastNotificationsOpen(true)}
      />

      <AppUpdateBanner
        update={availableUpdate}
        onDismiss={() => {
          if (availableUpdate) {
            dismissUpdateTag(availableUpdate.tagName);
          }
          setAvailableUpdate(null);
        }}
      />

      <SpiritualNotificationsModal
        isOpen={toastNotificationsOpen}
        onClose={() => setToastNotificationsOpen(false)}
        onOpenAdhanSettings={() => {
          setToastNotificationsOpen(false);
          navigateTo('adhan-settings');
        }}
        onOpenSection={(sec, entryId) => {
          if (sec === 'library' || sec === 'tasbih') {
            if (sec === 'library') setActiveStoryId(entryId ?? null);
            navigateTo(sec);
          } else if (sec === 'duas') {
            openLibrarySection('adiyat', entryId);
          } else if (sec === 'munajat') {
            openLibrarySection('munajat', entryId);
          } else {
            openLibrarySection(sec as DigitalLibrarySection, entryId);
          }
        }}
      />

      <PermissionManager
        isOpen={permissionManagerOpen}
        onClose={() => setPermissionManagerOpen(false)}
      />

      <OemBatteryAutostartModal
        isOpen={oemBatteryModalOpen}
        onClose={() => setOemBatteryModalOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
