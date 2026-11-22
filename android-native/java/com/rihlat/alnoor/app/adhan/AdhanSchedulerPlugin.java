package com.rihlat.alnoor.app.adhan;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;

@CapacitorPlugin(
    name = "AdhanScheduler",
    permissions = {
        @Permission(
            strings = { Manifest.permission.POST_NOTIFICATIONS },
            alias = "notifications"
        )
    }
)
public class AdhanSchedulerPlugin extends Plugin {
    private BroadcastReceiver stateReceiver;

    @Override
    public void load() {
        super.load();
        stateReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                JSObject payload = new JSObject();
                payload.put("isPlaying", intent.getBooleanExtra("isPlaying", false));
                payload.put("title", intent.getStringExtra("title"));
                payload.put("muezzinRawName", intent.getStringExtra("muezzinRawName"));
                notifyListeners("adhanStateChanged", payload);
            }
        };
        IntentFilter filter = new IntentFilter(AdhanForegroundService.ACTION_ADHAN_STATE_CHANGED);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(stateReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(stateReceiver, filter);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (stateReceiver != null) {
            try {
                getContext().unregisterReceiver(stateReceiver);
            } catch (Exception ignored) {}
            stateReceiver = null;
        }
        super.handleOnDestroy();
    }

    @PluginMethod
    public void scheduleAlarms(PluginCall call) {
        JSArray alarmsArr = call.getArray("alarms");
        if (alarmsArr == null) alarmsArr = new JSArray();
        JSArray expectedArr = call.getArray("expectedRawNames");
        boolean allowDuringAdhan = Boolean.TRUE.equals(call.getBoolean("allowNotificationsDuringAdhan", true));
        boolean playInSilent = Boolean.TRUE.equals(call.getBoolean("playAdhanInSilentMode", false));
        String audioUsage = call.getString("audioUsage", "alarm");
        AdhanAlarmStore.setAllowNotificationsDuringAdhan(getContext(), allowDuringAdhan);
        AdhanAlarmStore.setPlayAdhanInSilentMode(getContext(), playInSilent);
        AdhanAlarmStore.setAudioUsage(getContext(), audioUsage);

        JSONArray jsonAlarms = new JSONArray();
        for (int i = 0; i < alarmsArr.length(); i++) {
            try {
                jsonAlarms.put(alarmsArr.getJSONObject(i));
            } catch (Exception ignored) {}
        }

        int scheduled = AdhanAlarmStore.saveAndScheduleAlarms(getContext(), jsonAlarms);
        AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        boolean exactGranted = AdhanAlarmStore.canUseExactAlarms(am);
        JSArray missing = findMissingRawFiles(expectedArr);

        JSObject ret = new JSObject();
        ret.put("scheduledCount", scheduled);
        ret.put("exactAlarmsGranted", exactGranted);
        ret.put("missingRawFiles", missing);
        call.resolve(ret);
    }

    @PluginMethod
    public void scheduleTestAlarm(PluginCall call) {
        JSObject data = call.getData();
        boolean scheduled = AdhanAlarmStore.scheduleSingleTestAlarm(getContext(), data);
        AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        boolean exactGranted = AdhanAlarmStore.canUseExactAlarms(am);

        JSObject ret = new JSObject();
        ret.put("scheduled", scheduled);
        ret.put("exactAlarmsGranted", exactGranted);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelAllAlarms(PluginCall call) {
        AdhanAlarmStore.cancelStoredAlarms(getContext());
        call.resolve();
    }

    @PluginMethod
    public void playTestAdhan(PluginCall call) {
        String title = call.getString("title", "تجربة الأذان الآن");
        String body = call.getString("body", "اضغط على إيقاف الأذان لإنهاء الصوت");
        String rawName = call.getString("rawName", "");
        String mode = call.getString("mode", "adhan");
        String channelId = call.getString("channelId", "adhan_silent_v2");
        boolean allowDuringAdhan = Boolean.TRUE.equals(call.getBoolean("allowNotificationsDuringAdhan", true));
        boolean playInSilent = Boolean.TRUE.equals(call.getBoolean("playAdhanInSilentMode", false));
        String audioUsage = call.getString("audioUsage", "alarm");

        boolean usedFallback = false;
        if ("adhan".equals(mode) && rawName != null && !rawName.isEmpty()) {
            int resId = getContext().getResources().getIdentifier(rawName, "raw", getContext().getPackageName());
            usedFallback = (resId == 0);
        }

        if ("silent".equals(mode)) {
            Intent rxIntent = new Intent(getContext(), AdhanAlarmReceiver.class);
            rxIntent.setAction(AdhanAlarmReceiver.ACTION_FIRE_ADHAN);
            rxIntent.putExtra("alarm_id", 5997);
            rxIntent.putExtra("title", title);
            rxIntent.putExtra("body", body);
            rxIntent.putExtra("mode", "silent");
            rxIntent.putExtra("channelId", channelId);
            rxIntent.putExtra("allowNotificationsDuringAdhan", allowDuringAdhan);
            getContext().sendBroadcast(rxIntent);
        } else {
            Intent serviceIntent = new Intent(getContext(), AdhanForegroundService.class);
            serviceIntent.putExtra("title", title);
            serviceIntent.putExtra("body", body);
            serviceIntent.putExtra("mode", mode);
            serviceIntent.putExtra("rawName", rawName);
            serviceIntent.putExtra("channelId", channelId);
            serviceIntent.putExtra("allowNotificationsDuringAdhan", allowDuringAdhan);
            serviceIntent.putExtra("playAdhanInSilentMode", playInSilent);
            serviceIntent.putExtra("audioUsage", audioUsage);
            ContextCompat.startForegroundService(getContext(), serviceIntent);
        }

        JSObject ret = new JSObject();
        ret.put("started", true);
        ret.put("usedFallbackSound", usedFallback);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopAdhan(PluginCall call) {
        Intent stopIntent = new Intent(getContext(), AdhanForegroundService.class);
        getContext().stopService(stopIntent);
        call.resolve();
    }

    @PluginMethod
    public void getDiagnostics(PluginCall call) {
        Context ctx = getContext();
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);

        boolean notificationsGranted = NotificationManagerCompat.from(ctx).areNotificationsEnabled();
        boolean exactAlarmsGranted = AdhanAlarmStore.canUseExactAlarms(am);
        boolean batteryIgnored = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && pm != null) {
            batteryIgnored = pm.isIgnoringBatteryOptimizations(ctx.getPackageName());
        }
        boolean dndPolicyGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && nm != null) {
            dndPolicyGranted = nm.isNotificationPolicyAccessGranted();
        }

        JSArray missing = findMissingRawFiles(call.getArray("expectedRawNames"));

        JSObject ret = new JSObject();
        ret.put("nativePluginAvailable", true);
        ret.put("notificationsGranted", notificationsGranted);
        ret.put("exactAlarmsGranted", exactAlarmsGranted);
        ret.put("batteryOptimizationIgnored", batteryIgnored);
        ret.put("dndPolicyAccessGranted", dndPolicyGranted);
        ret.put("isPlaying", AdhanForegroundService.isCurrentlyPlaying);
        ret.put("activeLabel", AdhanForegroundService.currentTitle);
        ret.put("scheduledCount", AdhanAlarmStore.getStoredScheduledCount(ctx));
        ret.put("lastScheduledAt", AdhanAlarmStore.getLastScheduledAt(ctx));
        ret.put("missingRawFiles", missing);
        ret.put("androidSdkInt", Build.VERSION.SDK_INT);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (getPermissionState("notifications") != PermissionState.GRANTED) {
                requestPermissionForAlias("notifications", call, "notificationsPermsCallback");
                return;
            }
        }
        JSObject ret = new JSObject();
        ret.put("granted", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        call.resolve(ret);
    }

    @PermissionCallback
    private void notificationsPermsCallback(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        call.resolve(ret);
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        boolean opened = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                i.setData(Uri.parse("package:" + getContext().getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                opened = true;
            } catch (Exception ignored) {}
        }
        JSObject ret = new JSObject();
        ret.put("opened", opened);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestBatteryOptimizationExemption(PluginCall call) {
        boolean opened = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                i.setData(Uri.parse("package:" + getContext().getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                opened = true;
            } catch (Exception e) {
                try {
                    Intent fallback = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(fallback);
                    opened = true;
                } catch (Exception ignored) {}
            }
        }
        JSObject ret = new JSObject();
        ret.put("opened", opened);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAppNotificationSettings(PluginCall call) {
        boolean opened = false;
        try {
            Intent i = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                i.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                i.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            } else {
                i.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                i.setData(Uri.parse("package:" + getContext().getPackageName()));
            }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            opened = true;
        } catch (Exception ignored) {}

        JSObject ret = new JSObject();
        ret.put("opened", opened);
        call.resolve(ret);
    }

    @PluginMethod
    public void openNotificationPolicySettings(PluginCall call) {
        boolean opened = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent i = new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                opened = true;
            } catch (Exception ignored) {}
        }
        JSObject ret = new JSObject();
        ret.put("opened", opened);
        call.resolve(ret);
    }

    private JSArray findMissingRawFiles(JSArray expectedArr) {
        JSArray missing = new JSArray();
        if (expectedArr == null) return missing;
        for (int i = 0; i < expectedArr.length(); i++) {
            String rawName = expectedArr.optString(i, "");
            if (rawName.isEmpty()) continue;
            int resId = getContext().getResources().getIdentifier(rawName, "raw", getContext().getPackageName());
            if (resId == 0) {
                missing.put(rawName + ".mp3");
            }
        }
        return missing;
    }
}
