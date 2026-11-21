import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const androidMainDir = path.join(rootDir, 'android', 'app', 'src', 'main');
if (!fs.existsSync(androidMainDir)) {
  console.error('مجلد android غير موجود بعد. نفّذ أولاً: npx cap add android');
  process.exit(1);
}

// 1. نسخ ملفات الكود الأصلي (Java) الخاصة بخدمة الأذان والمنبهات
const srcJavaDir = path.join(
  rootDir,
  'android-native',
  'java',
  'com',
  'rihlat',
  'alnoor',
  'app',
  'adhan'
);
const destJavaDir = path.join(
  androidMainDir,
  'java',
  'com',
  'rihlat',
  'alnoor',
  'app',
  'adhan'
);
fs.mkdirSync(destJavaDir, { recursive: true });

for (const fileName of fs.readdirSync(srcJavaDir)) {
  if (!fileName.endsWith('.java')) continue;
  fs.copyFileSync(path.join(srcJavaDir, fileName), path.join(destJavaDir, fileName));
}
console.log('✓ تم نسخ ملفات AdhanSchedulerPlugin و ForegroundService إلى مشروع الأندرويد.');

// 2. تسجيل الإضافة في MainActivity.java تلقائياً
const mainActivityPath = path.join(
  androidMainDir,
  'java',
  'com',
  'rihlat',
  'alnoor',
  'app',
  'MainActivity.java'
);
if (fs.existsSync(mainActivityPath)) {
  let javaSrc = fs.readFileSync(mainActivityPath, 'utf8');
  if (!javaSrc.includes('AdhanSchedulerPlugin')) {
    if (!javaSrc.includes('import android.os.Bundle;')) {
      javaSrc = javaSrc.replace(
        'import com.getcapacitor.BridgeActivity;',
        'import android.os.Bundle;\nimport com.getcapacitor.BridgeActivity;\nimport com.rihlat.alnoor.app.adhan.AdhanSchedulerPlugin;'
      );
    } else {
      javaSrc = javaSrc.replace(
        'import com.getcapacitor.BridgeActivity;',
        'import com.getcapacitor.BridgeActivity;\nimport com.rihlat.alnoor.app.adhan.AdhanSchedulerPlugin;'
      );
    }

    if (javaSrc.includes('onCreate(Bundle savedInstanceState)')) {
      javaSrc = javaSrc.replace(
        'super.onCreate(savedInstanceState);',
        'registerPlugin(AdhanSchedulerPlugin.class);\n    super.onCreate(savedInstanceState);'
      );
    } else {
      javaSrc = javaSrc.replace(
        /public class MainActivity extends BridgeActivity\s*\{/,
        `public class MainActivity extends BridgeActivity {\n  @Override\n  public void onCreate(Bundle savedInstanceState) {\n    registerPlugin(AdhanSchedulerPlugin.class);\n    super.onCreate(savedInstanceState);\n  }`
      );
    }
    fs.writeFileSync(mainActivityPath, javaSrc, 'utf8');
    console.log('✓ تم تسجيل AdhanSchedulerPlugin داخل MainActivity.java.');
  }
}

// 3. نسخ ملفات صوت المؤذنين إلى android/app/src/main/res/raw بدون مسافات أو امتداد مختلف
const rawDestDir = path.join(androidMainDir, 'res', 'raw');
fs.mkdirSync(rawDestDir, { recursive: true });

const audioAssetMappings = [
  ['maytham_altammar_bc42705d.mp3', 'maytham_altammar.mp3'],
  ['farid_alnajafi_197dbbcc.mp3', 'farid_alnajafi.mp3'],
  ['balasem_jalil_44e27923.mp3', 'balasem_jalil.mp3'],
  ['abather_alhalwaji_0bed6602.mp3', 'abather_alhalwaji.mp3'],
  ['amer_alkadhimi_081283b8.mp3', 'amer_alkadhimi.mp3'],
  ['mustafa_alsarraf_72fc2cc7.mp3', 'mustafa_alsarraf.mp3'],
  ['qng16n_ff7ee017.mp3', 'shubbar_almualla.mp3'],
];

for (const [srcName, destName] of audioAssetMappings) {
  const srcPath = path.join(rootDir, 'public', 'assets', 'aistudio', srcName);
  const destPath = path.join(rawDestDir, destName);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  }
}
console.log('✓ تم تجهيز ملفات صوت المؤذنين في android/app/src/main/res/raw/.');

// 4. حقن الصلاحيات والخدمات والمستقبلات في AndroidManifest.xml
const manifestPath = path.join(androidMainDir, 'AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');

const requiredPermissions = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_EXACT_ALARM',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.WAKE_LOCK',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
  'android.permission.ACCESS_NOTIFICATION_POLICY',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.VIBRATE',
];

for (const perm of requiredPermissions) {
  if (!manifest.includes(perm)) {
    manifest = manifest.replace(
      '</manifest>',
      `    <uses-permission android:name="${perm}" />\n</manifest>`
    );
  }
}

if (!manifest.includes('AdhanForegroundService')) {
  const componentsXml = `
        <service
            android:name=".adhan.AdhanForegroundService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />

        <receiver
            android:name=".adhan.AdhanAlarmReceiver"
            android:enabled="true"
            android:exported="false">
            <intent-filter>
                <action android:name="com.rihlat.alnoor.app.FIRE_ADHAN" />
                <action android:name="com.rihlat.alnoor.app.STOP_ADHAN" />
            </intent-filter>
        </receiver>

        <receiver
            android:name=".adhan.AdhanBootReceiver"
            android:enabled="true"
            android:exported="true"
            android:directBootAware="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.LOCKED_BOOT_COMPLETED" />
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
                <action android:name="android.intent.action.TIME_SET" />
                <action android:name="android.intent.action.TIMEZONE_CHANGED" />
            </intent-filter>
        </receiver>
    </application>`;
  manifest = manifest.replace('</application>', componentsXml);
}

fs.writeFileSync(manifestPath, manifest, 'utf8');
console.log('✓ تم تحديث AndroidManifest.xml بصلاحيات وخدمات الأذان وإعادة الإقلاع.');
