package com.rihlat.alnoor.app.adhan;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import androidx.core.app.NotificationCompat;

import java.util.HashMap;
import java.util.Map;

public class AdhanForegroundService extends Service {
    private static final String TAG = "AdhanForegroundService";
    public static final int FOREGROUND_NOTIF_ID = 5901;
    public static final String PLAYBACK_CHANNEL_ID = "adhan_playback_v2";
    public static final String ACTION_ADHAN_STATE_CHANGED = "com.rihlat.alnoor.app.ADHAN_STATE_CHANGED";

    public static volatile boolean isCurrentlyPlaying = false;
    public static volatile String currentTitle = "";
    public static volatile String currentRawName = "";

    private static final Map<String, String> ASSET_AUDIO_FALLBACK_MAP = new HashMap<>();
    static {
        ASSET_AUDIO_FALLBACK_MAP.put("maytham_altammar", "public/assets/aistudio/maytham_altammar_bc42705d.mp3");
        ASSET_AUDIO_FALLBACK_MAP.put("farid_alnajafi", "public/assets/aistudio/farid_alnajafi_197dbbcc.mp3");
        ASSET_AUDIO_FALLBACK_MAP.put("balasem_jalil", "public/assets/aistudio/balasem_jalil_44e27923.mp3");
        ASSET_AUDIO_FALLBACK_MAP.put("abather_alhalwaji", "public/assets/aistudio/abather_alhalwaji_0bed6602.mp3");
        ASSET_AUDIO_FALLBACK_MAP.put("amer_alkadhimi", "public/assets/aistudio/amer_alkadhimi_081283b8.mp3");
        ASSET_AUDIO_FALLBACK_MAP.put("mustafa_alsarraf", "public/assets/aistudio/mustafa_alsarraf_72fc2cc7.mp3");
        ASSET_AUDIO_FALLBACK_MAP.put("shubbar_almualla", "public/assets/aistudio/qng16n_ff7ee017.mp3");
    }

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;

    /**
     * يبحث عن ملف المؤذن الفعلي ويفضّل res/raw، وإذا لم يوجد يفحص assets/public/assets/aistudio.
     * يُرجع "res/raw" أو "assets/public/assets/aistudio" أو "missing".
     */
    public static String resolveAudioSourceFolder(Context context, String rawName) {
        if (context == null || rawName == null || rawName.isEmpty()) {
            return "missing";
        }
        int rawId = context.getResources().getIdentifier(rawName, "raw", context.getPackageName());
        if (rawId != 0) {
            return "res/raw";
        }
        String assetPath = findAssetAudioPath(context, rawName);
        if (assetPath != null) {
            return "assets/public/assets/aistudio";
        }
        return "missing";
    }

    public static String findAssetAudioPath(Context context, String rawName) {
        if (context == null || rawName == null || rawName.isEmpty()) return null;
        String mapped = ASSET_AUDIO_FALLBACK_MAP.get(rawName);
        if (mapped != null) {
            try {
                AssetFileDescriptor afd = context.getAssets().openFd(mapped);
                afd.close();
                return mapped;
            } catch (Exception ignored) {}
        }
        try {
            String[] files = context.getAssets().list("public/assets/aistudio");
            if (files != null) {
                for (String f : files) {
                    if (f != null && f.endsWith(".mp3") && f.startsWith(rawName)) {
                        return "public/assets/aistudio/" + f;
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent != null ? intent.getStringExtra("title") : null;
        if (title == null || title.isEmpty()) title = "حان الآن موعد الصلاة";
        String body = intent != null ? intent.getStringExtra("body") : null;
        if (body == null) body = "اضغط على إيقاف الأذان لإنهاء الصوت";
        String mode = intent != null ? intent.getStringExtra("mode") : "adhan";
        if (mode == null) mode = "adhan";
        String rawName = intent != null ? intent.getStringExtra("rawName") : "";
        if (rawName == null) rawName = "";
        boolean isTest = intent != null && intent.getBooleanExtra("isTest", false);
        boolean allowDuringAdhan = intent != null
            ? intent.getBooleanExtra("allowNotificationsDuringAdhan", AdhanAlarmStore.getAllowNotificationsDuringAdhan(this))
            : AdhanAlarmStore.getAllowNotificationsDuringAdhan(this);
        boolean playInSilentMode = intent != null
            ? intent.getBooleanExtra("playAdhanInSilentMode", AdhanAlarmStore.getPlayAdhanInSilentMode(this))
            : AdhanAlarmStore.getPlayAdhanInSilentMode(this);
        String audioUsage = intent != null ? intent.getStringExtra("audioUsage") : AdhanAlarmStore.getAudioUsage(this);
        if (audioUsage == null) audioUsage = "alarm";

        ensurePlaybackChannel(allowDuringAdhan);
        Notification notification = buildOngoingNotification(title, body);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                FOREGROUND_NOTIF_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            );
        } else {
            startForeground(FOREGROUND_NOTIF_ID, notification);
        }

        acquireWakeLock();
        stopCurrentMedia();

        currentTitle = title;
        currentRawName = rawName;
        isCurrentlyPlaying = true;
        broadcastState(true, title, rawName);

        startAdhanAudio(mode, rawName, title, body, playInSilentMode || isTest, audioUsage);
        return START_NOT_STICKY;
    }

    private void ensurePlaybackChannel(boolean allowDuringAdhan) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        NotificationChannel existing = nm.getNotificationChannel(PLAYBACK_CHANNEL_ID);
        if (existing == null) {
            NotificationChannel ch = new NotificationChannel(
                PLAYBACK_CHANNEL_ID,
                "تشغيل الأذان الكامل",
                NotificationManager.IMPORTANCE_HIGH
            );
            ch.setDescription("تشغيل الأذان كاملاً في الخلفية مع زر إيقاف الأذان (الصوت عبر MediaPlayer)");
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            if (allowDuringAdhan) {
                try {
                    ch.setBypassDnd(true);
                } catch (Exception ignored) {}
            }
            nm.createNotificationChannel(ch);
        }
    }

    private Notification buildOngoingNotification(String title, String body) {
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        Intent stopIntent = new Intent(this, AdhanAlarmReceiver.class);
        stopIntent.setAction(AdhanAlarmReceiver.ACTION_STOP_ADHAN);
        PendingIntent stopPi = PendingIntent.getBroadcast(this, 901, stopIntent, piFlags);

        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentPi = launchIntent != null
            ? PendingIntent.getActivity(this, 902, launchIntent, piFlags)
            : stopPi;

        int iconRes = getApplicationInfo().icon;
        if (iconRes == 0) iconRes = android.R.drawable.ic_lock_idle_alarm;

        // الإشعار صامت (setSilent) بأولوية عالية؛ الصوت يصدر حصراً عبر MediaPlayer
        return new NotificationCompat.Builder(this, PLAYBACK_CHANNEL_ID)
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setSilent(true)
            .setSound(null)
            .setOngoing(true)
            .setContentIntent(contentPi)
            .addAction(android.R.drawable.ic_media_pause, "إيقاف الأذان", stopPi)
            .build();
    }

    private void postStandardVisibleNoticeAfterSilentSkip(String title, String body) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        int iconRes = getApplicationInfo().icon;
        if (iconRes == 0) iconRes = android.R.drawable.ic_lock_idle_alarm;
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentPi = launchIntent != null
            ? PendingIntent.getActivity(this, 5902, launchIntent, piFlags)
            : null;
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, PLAYBACK_CHANNEL_ID)
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body + " (الهاتف في الوضع الصامت)")
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setSilent(true)
            .setAutoCancel(true);
        if (contentPi != null) {
            b.setContentIntent(contentPi);
        }
        try {
            nm.notify(5902, b.build());
        } catch (SecurityException ignored) {}
    }

    private void startAdhanAudio(
        String mode,
        String rawName,
        String title,
        String body,
        boolean playInSilentMode,
        String audioUsage
    ) {
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        int ringerMode = audioManager != null ? audioManager.getRingerMode() : AudioManager.RINGER_MODE_NORMAL;
        boolean dndSilenceAll = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && nm != null) {
            int filter = nm.getCurrentInterruptionFilter();
            if (filter == NotificationManager.INTERRUPTION_FILTER_NONE) {
                dndSilenceAll = true;
            }
        }

        if (!playInSilentMode) {
            if (dndSilenceAll || ringerMode == AudioManager.RINGER_MODE_SILENT) {
                postStandardVisibleNoticeAfterSilentSkip(title, body);
                stopSelfSafely();
                return;
            }
            if (ringerMode == AudioManager.RINGER_MODE_VIBRATE) {
                triggerGentleVibration();
                postStandardVisibleNoticeAfterSilentSkip(title, body);
                stopSelfSafely();
                return;
            }
        }

        boolean useAlarmUsage = playInSilentMode || !"notification".equals(audioUsage);

        try {
            mediaPlayer = new MediaPlayer();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                int usage = useAlarmUsage
                    ? AudioAttributes.USAGE_ALARM
                    : ("adhan".equals(mode) ? AudioAttributes.USAGE_NOTIFICATION_EVENT : AudioAttributes.USAGE_NOTIFICATION);
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(usage)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
                mediaPlayer.setAudioAttributes(attrs);
                requestFocus(attrs);
            } else {
                int stream = useAlarmUsage ? AudioManager.STREAM_ALARM : AudioManager.STREAM_NOTIFICATION;
                mediaPlayer.setAudioStreamType(stream);
            }

            boolean dataSourceSet = false;
            if ("adhan".equals(mode) && rawName != null && !rawName.isEmpty()) {
                // ١) نفضّل res/raw أولاً إن وُجد الملف فيه
                int rawId = getResources().getIdentifier(rawName, "raw", getPackageName());
                if (rawId != 0) {
                    try (AssetFileDescriptor rawAfd = getResources().openRawResourceFd(rawId)) {
                        if (rawAfd != null) {
                            mediaPlayer.setDataSource(
                                rawAfd.getFileDescriptor(),
                                rawAfd.getStartOffset(),
                                rawAfd.getLength()
                            );
                            dataSourceSet = true;
                        }
                    } catch (Exception rawErr) {
                        Log.w(TAG, "openRawResourceFd failed, trying android.resource Uri", rawErr);
                        try {
                            Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + rawId);
                            mediaPlayer.setDataSource(this, soundUri);
                            dataSourceSet = true;
                        } catch (Exception uriErr) {
                            Log.w(TAG, "android.resource Uri failed for " + rawName, uriErr);
                        }
                    }
                }

                // ٢) إن لم يوجد في res/raw أو فشل، نقرأ مباشرة من مجلد الويب المدمج assets/public/assets/aistudio/
                if (!dataSourceSet) {
                    String assetPath = findAssetAudioPath(this, rawName);
                    if (assetPath != null) {
                        try (AssetFileDescriptor afd = getAssets().openFd(assetPath)) {
                            mediaPlayer.setDataSource(
                                afd.getFileDescriptor(),
                                afd.getStartOffset(),
                                afd.getLength()
                            );
                            dataSourceSet = true;
                        } catch (Exception assetErr) {
                            Log.w(TAG, "Asset openFd failed for " + assetPath, assetErr);
                        }
                    }
                }
            }

            if (!dataSourceSet) {
                Uri fallbackUri = useAlarmUsage
                    ? RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                    : RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                if (fallbackUri == null) {
                    fallbackUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                if (fallbackUri == null) {
                    stopSelfSafely();
                    return;
                }
                mediaPlayer.setDataSource(this, fallbackUri);
            }

            mediaPlayer.setOnCompletionListener(mp -> stopSelfSafely());
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.w(TAG, "MediaPlayer error what=" + what + " extra=" + extra);
                stopSelfSafely();
                return true;
            });
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception e) {
            Log.e(TAG, "Failed to start Adhan MediaPlayer", e);
            stopSelfSafely();
        }
    }

    private void requestFocus(AudioAttributes attrs) {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(attrs)
                    .setAcceptsDelayedFocusGain(false)
                    .setOnAudioFocusChangeListener(focusChange -> {
                        if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                            stopSelfSafely();
                        }
                    })
                    .build();
                audioManager.requestAudioFocus(audioFocusRequest);
            } else {
                audioManager.requestAudioFocus(
                    null,
                    AudioManager.STREAM_ALARM,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
                );
            }
        } catch (Exception ignored) {}
    }

    private void abandonFocus() {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
                audioFocusRequest = null;
            } else {
                audioManager.abandonAudioFocus(null);
            }
        } catch (Exception ignored) {}
    }

    private void triggerGentleVibration() {
        try {
            Vibrator vib = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vib == null || !vib.hasVibrator()) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vib.vibrate(VibrationEffect.createWaveform(new long[]{0, 350, 250, 350}, -1));
            } else {
                vib.vibrate(new long[]{0, 350, 250, 350}, -1);
            }
        } catch (Exception ignored) {}
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && wakeLock == null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "rihlat:AdhanPlaybackWakeLock");
                wakeLock.acquire(9 * 60 * 1000L);
            }
        } catch (Exception ignored) {}
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception ignored) {}
        wakeLock = null;
    }

    private void stopCurrentMedia() {
        abandonFocus();
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    private void stopSelfSafely() {
        stopCurrentMedia();
        releaseWakeLock();
        isCurrentlyPlaying = false;
        broadcastState(false, "", "");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        stopSelf();
    }

    private void broadcastState(boolean playing, String title, String rawName) {
        Intent i = new Intent(ACTION_ADHAN_STATE_CHANGED);
        i.setPackage(getPackageName());
        i.putExtra("isPlaying", playing);
        i.putExtra("title", title);
        i.putExtra("muezzinRawName", rawName);
        sendBroadcast(i);
    }

    @Override
    public void onDestroy() {
        stopCurrentMedia();
        releaseWakeLock();
        isCurrentlyPlaying = false;
        broadcastState(false, "", "");
        super.onDestroy();
    }
}
