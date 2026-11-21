import React from 'react';
import {
  BackdropKind,
  BirdAndNestProp,
  BreadBasketProp,
  BalanceScaleProp,
  CamelProp,
  CatAndBowlProp,
  DoveProp,
  ElderTraveler,
  FriendlyDogProp,
  GazelleProp,
  GoldenLanternProp,
  KidCharacter,
  LuminousFigure,
  OpenBookProp,
  SaplingTreeProp,
  SceneBackdrop,
  WaterPitcherProp,
} from './illustrations/VectorPrimitives';

interface StationIllustrationProps {
  stationId: number;
  stageId: number;
  title: string;
}

const STAGE_BACKDROP: Record<number, BackdropKind> = {
  1: 'home_terrace',
  2: 'day_garden',
  3: 'market_square',
  4: 'courtyard_arch',
  5: 'study_library',
  6: 'courtyard_arch',
  7: 'desert_oasis',
  8: 'mosque_arch',
  9: 'day_garden',
  10: 'home_terrace',
};

function getBackdropForStation(stationId: number, stageId: number): BackdropKind {
  if ([2, 9, 21, 68, 71, 91, 100].includes(stationId)) return 'night_medina';
  if ([4, 34, 38, 81, 89].includes(stationId)) return 'mosque_arch';
  if ([12, 14, 17, 18, 28, 62, 65, 84].includes(stationId)) return 'desert_oasis';
  if ([23, 43, 44, 45, 47, 49, 50, 57, 77, 87].includes(stationId)) return 'study_library';
  if ([22, 25, 27, 72].includes(stationId)) return 'market_square';
  if ([11, 13, 15, 16, 19, 42, 53, 86, 90, 96].includes(stationId)) return 'day_garden';
  return STAGE_BACKDROP[stageId] || 'courtyard_arch';
}

export const StationIllustration: React.FC<StationIllustrationProps> = ({
  stationId,
  stageId,
  title,
}) => {
  const uid = `st-${stationId}`;
  const backdrop = getBackdropForStation(stationId, stageId);

  const renderForegroundScene = () => {
    switch (stationId) {
      // ==================== المرحلة 1: الكرم ومساعدة المحتاجين ====================
      case 1: // إيثار بيت النبوة
        return (
          <g>
            <LuminousFigure x={290} y={210} pose="giving" cloakColor="#047857" uid={`${uid}a`} />
            <LuminousFigure x={210} y={215} scale={0.95} pose="standing" veil cloakColor="#0D9488" uid={`${uid}b`} />
            <BreadBasketProp x={385} y={212} scale={1.15} />
            <ElderTraveler x={505} y={218} robeColor="#64748B" />
            <KidCharacter x={575} y={235} shirtColor="#38BDF8" />
          </g>
        );
      case 2: // سائل في جوف الليل
        return (
          <g>
            <LuminousFigure x={320} y={212} pose="walking_back" cloakColor="#0F766E" uid={uid} />
            <ellipse cx="352" cy="210" rx="22" ry="26" fill="#D97706" />
            <BreadBasketProp x={500} y={248} scale={0.95} />
            <GoldenLanternProp x={180} y={185} scale={0.9} />
          </g>
        );
      case 3: // أعز الثياب هدية
        return (
          <g>
            <LuminousFigure x={280} y={210} pose="giving" veil cloakColor="#047857" uid={uid} />
            {/* Folded Festive Emerald-Gold Robe */}
            <rect x="360" y="198" width="68" height="36" rx="8" fill="#10B981" stroke="#F59E0B" strokeWidth="3" />
            <path d="M368 214 L420 214" stroke="#FDE68A" strokeWidth="3" />
            <ElderTraveler x={520} y={216} robeColor="#78716C" />
          </g>
        );
      case 4: // قصة الخاتم في الصلاة
        return (
          <g>
            <LuminousFigure x={300} y={228} pose="praying" cloakColor="#047857" uid={uid} />
            {/* Shining Golden Ring */}
            <circle cx="385" cy="210" r="14" fill="none" stroke="#F59E0B" strokeWidth="5" />
            <circle cx="385" cy="195" r="5" fill="#10B981" />
            <ElderTraveler x={500} y={216} robeColor="#64748B" />
          </g>
        );
      case 5: // المزرعة وقف للفقراء
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="giving" cloakColor="#059669" uid={uid} />
            <ellipse cx="370" cy="212" rx="18" ry="22" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
            <text x="370" y="218" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="bold">★</text>
            <ElderTraveler x={490} y={218} robeColor="#64748B" />
            <SaplingTreeProp x={645} y={235} scale={1.2} />
          </g>
        );
      case 6: // حطب وخبز للأيتام
        return (
          <g>
            <LuminousFigure x={265} y={215} pose="kneeling" cloakColor="#047857" uid={uid} />
            {/* Warm Clay Oven & Bread */}
            <path d="M345 268 L355 210 Q385 190 415 210 L425 268 Z" fill="#C2410C" />
            <circle cx="385" cy="240" r="16" fill="#FDE68A" />
            <BreadBasketProp x={455} y={248} scale={0.9} />
            <KidCharacter x={540} y={235} shirtColor="#10B981" />
            <KidCharacter x={600} y={240} scale={0.9} shirtColor="#38BDF8" />
          </g>
        );
      case 7: // ضيافة المسافر الغريب
        return (
          <g>
            <LuminousFigure x={255} y={212} pose="giving" cloakColor="#0D9488" uid={uid} />
            <BreadBasketProp x={380} y={242} scale={1.1} />
            <WaterPitcherProp x={435} y={236} />
            <ElderTraveler x={535} y={216} robeColor="#0284C7" />
          </g>
        );
      case 8: // لا تردوا السائل ولو بشق تمرة
        return (
          <g>
            <LuminousFigure x={290} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <circle cx="400" cy="222" r="24" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5" />
            <ellipse cx="394" cy="222" rx="9" ry="5" fill="#92400E" />
            <ellipse cx="408" cy="224" rx="8" ry="5" fill="#78350F" />
            <ElderTraveler x={515} y={218} robeColor="#64748B" />
          </g>
        );
      case 9: // صرة الفرج الخفية
        return (
          <g>
            <LuminousFigure x={265} y={214} pose="walking_back" cloakColor="#0F766E" uid={uid} />
            <GoldenLanternProp x={400} y={195} />
            <ellipse cx="520" cy="252" rx="16" ry="20" fill="#F59E0B" stroke="#92400E" strokeWidth="2" />
            <ellipse cx="554" cy="254" rx="14" ry="18" fill="#FBBF24" stroke="#92400E" strokeWidth="2" />
          </g>
        );
      case 10: // العمل لمساعدة المحتاجين
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="working" cloakColor="#047857" uid={uid} />
            <SaplingTreeProp x={380} y={236} scale={1.35} />
            <WaterPitcherProp x={335} y={235} />
            <KidCharacter x={535} y={235} shirtColor="#F59E0B" />
          </g>
        );

      // ==================== المرحلة 2: الرحمة والرفق بالحيوان والطبيعة ====================
      case 11: // مقاسمة الكلب الجائع
        return (
          <g>
            <LuminousFigure x={295} y={222} pose="kneeling" cloakColor="#059669" uid={uid} />
            <BreadBasketProp x={390} y={252} scale={0.95} />
            <FriendlyDogProp x={495} y={248} scale={1.25} />
          </g>
        );
      case 12: // شفاعة الإمام للغزالة
        return (
          <g>
            <LuminousFigure x={235} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <GazelleProp x={445} y={235} scale={1.25} />
            <GazelleProp x={545} y={252} scale={0.75} />
            <GazelleProp x={595} y={256} scale={0.7} />
          </g>
        );
      case 13: // لا تحزنوا العصفورة الأم
        return (
          <g>
            <LuminousFigure x={240} y={216} pose="giving" cloakColor="#059669" uid={uid} />
            <BirdAndNestProp x={495} y={172} scale={1.45} />
            <KidCharacter x={625} y={236} shirtColor="#10B981" />
          </g>
        );
      case 14: // حماية الجمل المظلوم
        return (
          <g>
            <LuminousFigure x={295} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <CamelProp x={475} y={225} scale={1.35} />
          </g>
        );
      case 15: // لا تؤذوا النملة الصغيرة
        return (
          <g>
            <LuminousFigure x={245} y={215} pose="kneeling" cloakColor="#0D9488" uid={uid} />
            {/* Magnified Gentle Ants Carrying Grain */}
            <g transform="translate(460, 260) scale(1.4)">
              <circle cx="-12" cy="0" r="6" fill="#78350F" />
              <circle cx="0" cy="0" r="5" fill="#78350F" />
              <circle cx="10" cy="-2" r="5.5" fill="#92400E" />
              <ellipse cx="14" cy="-10" rx="7" ry="4" fill="#FBBF24" />
            </g>
            <SaplingTreeProp x={590} y={248} scale={1.1} />
          </g>
        );
      case 16: // غرس الشجرة صدقة جارية
        return (
          <g>
            <LuminousFigure x={275} y={214} pose="working" cloakColor="#047857" uid={uid} />
            <SaplingTreeProp x={420} y={236} scale={1.65} />
            <DoveProp x={450} y={120} />
            <KidCharacter x={555} y={236} shirtColor="#0284C7" />
          </g>
        );
      case 17: // سقاية الماء العذب
        return (
          <g>
            <LuminousFigure x={240} y={212} pose="working" cloakColor="#059669" uid={uid} />
            {/* Desert Well */}
            <rect x="370" y="210" width="110" height="58" rx="8" fill="#94A3B8" stroke="#64748B" strokeWidth="3" />
            <ellipse cx="425" cy="212" rx="50" ry="12" fill="#38BDF8" />
            <WaterPitcherProp x={530} y={240} />
            <DoveProp x={580} y={175} />
          </g>
        );
      case 18: // الرفق في ركوب الدابة
        return (
          <g>
            <LuminousFigure x={265} y={212} pose="giving" cloakColor="#0F766E" uid={uid} />
            <CamelProp x={485} y={228} scale={1.2} />
            <WaterPitcherProp x={380} y={246} />
          </g>
        );
      case 19: // لا تقتلوا الحمام المألوف
        return (
          <g>
            <LuminousFigure x={255} y={214} pose="giving" cloakColor="#047857" uid={uid} />
            <DoveProp x={410} y={160} scale={1.2} />
            <DoveProp x={490} y={215} scale={1.1} />
            <DoveProp x={555} y={252} scale={1} />
            {/* Scattered Seeds */}
            <g fill="#F59E0B">
              <circle cx="445" cy="272" r="3" />
              <circle cx="462" cy="276" r="3" />
              <circle cx="482" cy="270" r="3" />
            </g>
          </g>
        );
      case 20: // الرفق بالهرة العطشى
        return (
          <g>
            <LuminousFigure x={275} y={218} pose="kneeling" cloakColor="#059669" uid={uid} />
            <CatAndBowlProp x={465} y={245} scale={1.45} />
          </g>
        );

      // ==================== المرحلة 3: الصدق والأمانة وحفظ الحقوق ====================
      case 21: // رد الأمانات يوم الهجرة
        return (
          <g>
            <LuminousFigure x={295} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            {/* Treasure Chest & Sealed Trusts */}
            <rect x="380" y="218" width="76" height="48" rx="8" fill="#B45309" stroke="#F59E0B" strokeWidth="3" />
            <rect x="410" y="232" width="16" height="16" rx="3" fill="#FDE68A" />
            <ElderTraveler x={540} y={216} robeColor="#64748B" />
          </g>
        );
      case 22: // قضية الدرع والحكم العادل
        return (
          <g>
            <LuminousFigure x={255} y={212} pose="standing" cloakColor="#047857" uid={uid} />
            <BalanceScaleProp x={400} y={215} scale={1.25} />
            {/* Shield / Armor */}
            <path d="M510 190 L555 190 L555 228 Q532 256 510 228 Z" fill="#94A3B8" stroke="#475569" strokeWidth="3" />
          </g>
        );
      case 23: // إطفاء شمعة بيت المال
        return (
          <g>
            <LuminousFigure x={265} y={215} pose="kneeling" cloakColor="#047857" uid={uid} />
            {/* Desk with One Extinguished Candle & One Lit Candle */}
            <rect x="350" y="220" width="210" height="42" rx="6" fill="#B45309" opacity="0.85" />
            {/* Lit Candle */}
            <rect x="405" y="182" width="16" height="38" rx="3" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
            <ellipse cx="413" cy="172" rx="6" ry="10" fill="#F59E0B" />
            <circle cx="413" cy="172" r="18" fill="#FDE68A" opacity="0.45" />
            {/* Unlit Candle */}
            <rect x="495" y="186" width="16" height="34" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="503" y1="186" x2="503" y2="178" stroke="#475569" strokeWidth="2" />
          </g>
        );
      case 24: // الصادق الأمين قبل البعثة
        return (
          <g>
            <path d="M180 285 L310 190 L440 285 Z" fill="#D9C7A3" />
            <LuminousFigure x={310} y={145} pose="standing" cloakColor="#047857" uid={uid} />
            <KidCharacter x={495} y={235} shirtColor="#0284C7" />
            <ElderTraveler x={565} y={218} robeColor="#64748B" />
          </g>
        );
      case 25: // الأمانة في التجارة والبيع
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="giving" cloakColor="#059669" uid={uid} />
            <BreadBasketProp x={400} y={238} scale={1.15} />
            <BalanceScaleProp x={520} y={222} />
          </g>
        );
      case 26: // إعادة اللقطة لصاحبها
        return (
          <g>
            <KidCharacter x={285} y={235} shirtColor="#10B981" />
            <ellipse cx="395" cy="240" rx="22" ry="26" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />
            <ElderTraveler x={515} y={218} robeColor="#0284C7" />
          </g>
        );
      case 27: // الموازين العادلة في السوق
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="standing" cloakColor="#047857" uid={uid} />
            <BalanceScaleProp x={425} y={212} scale={1.35} />
            <BreadBasketProp x={565} y={244} />
          </g>
        );
      case 28: // الوفاء بالوعد الصادق
        return (
          <g>
            <LuminousFigure x={295} y={214} pose="standing" cloakColor="#047857" uid={uid} />
            <SaplingTreeProp x={400} y={238} scale={1.4} />
            <ElderTraveler x={535} y={218} robeColor="#64748B" />
          </g>
        );
      case 29: // السر أمانة في القلب
        return (
          <g>
            <LuminousFigure x={275} y={214} pose="giving" cloakColor="#0F766E" uid={uid} />
            {/* Sealed Scroll */}
            <rect x="375" y="198" width="84" height="44" rx="10" fill="#FEF3C7" stroke="#D97706" strokeWidth="3" />
            <circle cx="417" cy="220" r="11" fill="#F59E0B" />
            <KidCharacter x={535} y={236} shirtColor="#38BDF8" />
          </g>
        );
      case 30: // الإقرار بالحق وإن كان صعباً
        return (
          <g>
            <LuminousFigure x={295} y={212} pose="standing" cloakColor="#047857" uid={uid} />
            <GoldenLanternProp x={420} y={205} scale={1.3} />
            <OpenBookProp x={535} y={238} scale={1.1} />
          </g>
        );

      // ==================== المرحلة 4: بر الوالدين واحترام الكبير والعطف على الصغير ====================
      case 31: // أم أبيها وحنانها الكبير
        return (
          <g>
            <LuminousFigure x={290} y={212} pose="standing" cloakColor="#047857" uid={`${uid}a`} />
            <LuminousFigure x={410} y={222} scale={0.85} pose="giving" veil cloakColor="#0D9488" uid={`${uid}b`} />
            <WaterPitcherProp x={485} y={240} />
          </g>
        );
      case 32: // إكرام الأم على المائدة
        return (
          <g>
            <LuminousFigure x={265} y={220} pose="kneeling" cloakColor="#0F766E" uid={`${uid}a`} />
            <BreadBasketProp x={400} y={248} scale={1.1} />
            <LuminousFigure x={525} y={218} pose="kneeling" veil cloakColor="#047857" flipX uid={`${uid}b`} />
          </g>
        );
      case 33: // الحسنان والشيخ الكبير
        return (
          <g>
            <LuminousFigure x={215} y={228} scale={0.78} pose="working" cloakColor="#10B981" uid={`${uid}a`} />
            <LuminousFigure x={305} y={230} scale={0.76} pose="working" cloakColor="#059669" uid={`${uid}b`} />
            <WaterPitcherProp x={410} y={238} />
            <ElderTraveler x={545} y={218} robeColor="#64748B" />
          </g>
        );
      case 34: // سجود طويل لراحة الطفل
        return (
          <g>
            <LuminousFigure x={365} y={235} pose="praying" cloakColor="#047857" uid={`${uid}a`} />
            <LuminousFigure x={355} y={205} scale={0.55} pose="kneeling" cloakColor="#10B981" turban={false} uid={`${uid}b`} />
          </g>
        );
      case 35: // تقبيل الأطفال ورحمتهم
        return (
          <g>
            <LuminousFigure x={315} y={222} pose="kneeling" cloakColor="#047857" uid={`${uid}a`} />
            <KidCharacter x={425} y={234} shirtColor="#38BDF8" />
            <KidCharacter x={495} y={238} scale={0.9} shirtColor="#10B981" />
          </g>
        );
      case 36: // القيام احتراماً لابنته
        return (
          <g>
            <LuminousFigure x={305} y={210} pose="giving" cloakColor="#047857" uid={`${uid}a`} />
            <LuminousFigure x={455} y={212} pose="standing" veil cloakColor="#0D9488" flipX uid={`${uid}b`} />
          </g>
        );
      case 37: // السلام على الصغار قبل الكبار
        return (
          <g>
            <LuminousFigure x={265} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <KidCharacter x={420} y={236} shirtColor="#10B981" />
            <KidCharacter x={490} y={232} shirtColor="#F59E0B" />
            <KidCharacter x={560} y={238} shirtColor="#0284C7" />
          </g>
        );
      case 38: // تخفيف الصلاة من أجل بكاء طفل
        return (
          <g>
            <LuminousFigure x={285} y={212} pose="standing" cloakColor="#047857" uid={uid} />
            <LuminousFigure x={485} y={218} pose="kneeling" veil cloakColor="#0284C7" flipX uid={`${uid}m`} />
            <KidCharacter x={440} y={250} scale={0.65} shirtColor="#FDE68A" />
          </g>
        );
      case 39: // رفق الإمام بالطفل اليتيم
        return (
          <g>
            <LuminousFigure x={305} y={222} pose="kneeling" cloakColor="#047857" uid={uid} />
            <KidCharacter x={420} y={235} shirtColor="#F59E0B" />
            <BreadBasketProp x={515} y={248} scale={0.95} />
          </g>
        );
      case 40: // الحديث اللطيف مع الوالدين
        return (
          <g>
            <LuminousFigure x={285} y={212} pose="standing" cloakColor="#047857" uid={uid} />
            <OpenBookProp x={400} y={238} scale={1.1} />
            <KidCharacter x={515} y={234} shirtColor="#10B981" />
          </g>
        );

      // ==================== المرحلة 5: النظافة والنظام وحب العلم ====================
      case 41: // أناقة المظهر والنظافة
        return (
          <g>
            <WaterPitcherProp x={315} y={232} scale={1.2} />
            <SaplingTreeProp x={420} y={240} scale={1.1} />
            <GoldenLanternProp x={520} y={215} />
          </g>
        );
      case 42: // إماطة الأذى ونظافة الطريق
        return (
          <g>
            <KidCharacter x={305} y={234} shirtColor="#10B981" />
            {/* Stone moved cleanly to side */}
            <ellipse cx="475" cy="272" rx="22" ry="12" fill="#94A3B8" />
            <SaplingTreeProp x={580} y={240} scale={1.3} />
          </g>
        );
      case 43: // مدينة العلم وبابها
        return (
          <g>
            <LuminousFigure x={290} y={214} pose="giving" cloakColor="#047857" uid={uid} />
            <OpenBookProp x={435} y={228} scale={1.35} />
            <GoldenLanternProp x={545} y={205} scale={1.1} />
          </g>
        );
      case 44: // مدرسة الإمام الصادق للعلماء
        return (
          <g>
            <LuminousFigure x={255} y={215} pose="kneeling" cloakColor="#059669" uid={uid} />
            <OpenBookProp x={390} y={232} scale={1.2} />
            {/* Science Flask */}
            <path d="M475 215 L485 215 L498 250 L462 250 Z" fill="#38BDF8" opacity="0.8" stroke="#0284C7" strokeWidth="2.5" />
            <KidCharacter x={565} y={235} shirtColor="#0284C7" />
          </g>
        );
      case 45: // تنظيم الوقت والعمل
        return (
          <g>
            <OpenBookProp x={335} y={232} scale={1.25} />
            {/* Hourglass */}
            <g transform="translate(465, 222)">
              <rect x="-18" y="-28" width="36" height="6" rx="2" fill="#92400E" />
              <rect x="-18" y="22" width="36" height="6" rx="2" fill="#92400E" />
              <path d="M-14 -22 L14 -22 L2 0 L14 22 L-14 22 L-2 0 Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
            </g>
            <GoldenLanternProp x={560} y={210} />
          </g>
        );
      case 46: // إتقان العمل لا مجرد إنهائه
        return (
          <g>
            <LuminousFigure x={275} y={214} pose="working" cloakColor="#047857" uid={uid} />
            {/* Neat Brick Wall */}
            <g transform="translate(380, 210)">
              <rect x="0" y="30" width="44" height="20" rx="3" fill="#D97706" stroke="#FFFBEB" strokeWidth="2" />
              <rect x="44" y="30" width="44" height="20" rx="3" fill="#F59E0B" stroke="#FFFBEB" strokeWidth="2" />
              <rect x="88" y="30" width="44" height="20" rx="3" fill="#D97706" stroke="#FFFBEB" strokeWidth="2" />
              <rect x="22" y="10" width="44" height="20" rx="3" fill="#F59E0B" stroke="#FFFBEB" strokeWidth="2" />
              <rect x="66" y="10" width="44" height="20" rx="3" fill="#D97706" stroke="#FFFBEB" strokeWidth="2" />
            </g>
          </g>
        );
      case 47: // عالم وهو طفل صغير
        return (
          <g>
            <LuminousFigure x={315} y={230} scale={0.8} pose="kneeling" cloakColor="#059669" uid={uid} />
            <OpenBookProp x={415} y={236} scale={1.2} />
            <ElderTraveler x={545} y={218} robeColor="#64748B" />
          </g>
        );
      case 48: // النظافة جزء من الإيمان
        return (
          <g>
            <LuminousFigure x={275} y={214} pose="working" cloakColor="#0D9488" uid={uid} />
            <WaterPitcherProp x={390} y={224} scale={1.3} />
            <path d="M350 258 L430 258 L416 276 L364 276 Z" fill="#F59E0B" />
            <BreadBasketProp x={525} y={244} />
          </g>
        );
      case 49: // حفظ العلم بالكتابة
        return (
          <g>
            <LuminousFigure x={270} y={216} pose="kneeling" cloakColor="#047857" uid={uid} />
            <OpenBookProp x={400} y={230} scale={1.3} />
            {/* Feather Quill & Inkpot */}
            <rect x="485" y="228" width="20" height="22" rx="4" fill="#1E293B" />
            <path d="M495 228 Q515 185 535 170 Q515 198 495 228 Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
          </g>
        );
      case 50: // أدب السؤال والإنصات
        return (
          <g>
            <LuminousFigure x={270} y={216} pose="kneeling" cloakColor="#059669" uid={uid} />
            <OpenBookProp x={385} y={235} />
            <KidCharacter x={495} y={235} shirtColor="#0284C7" />
            <KidCharacter x={560} y={238} shirtColor="#10B981" />
          </g>
        );

      // ==================== المرحلة 6: الحِلم وضبط النفس ====================
      case 51: // ابتسامة الحسن للغريب الغاضب
        return (
          <g>
            <LuminousFigure x={285} y={212} pose="giving" cloakColor="#059669" uid={uid} />
            <BreadBasketProp x={390} y={248} scale={0.95} />
            <ElderTraveler x={505} y={216} robeColor="#64748B" />
          </g>
        );
      case 52: // كظم الغيظ عند سقوط الإناء
        return (
          <g>
            <LuminousFigure x={295} y={214} pose="standing" cloakColor="#047857" uid={uid} />
            <WaterPitcherProp x={425} y={245} scale={1.1} />
            <ellipse cx="400" cy="272" rx="35" ry="7" fill="#38BDF8" opacity="0.65" />
            <DoveProp x={525} y={165} scale={1.2} />
          </g>
        );
      case 53: // لماذا لقب بالكاظم
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="giving" cloakColor="#0F766E" uid={uid} />
            <SaplingTreeProp x={420} y={240} scale={1.3} />
            <ElderTraveler x={535} y={218} robeColor="#78716C" />
          </g>
        );
      case 54: // الرد الهادئ على الأعرابي
        return (
          <g>
            <LuminousFigure x={305} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <ElderTraveler x={495} y={218} robeColor="#B45309" />
            <DoveProp x={395} y={135} />
          </g>
        );
      case 55: // الحلم يسبق الندم
        return (
          <g>
            <LuminousFigure x={285} y={212} pose="standing" cloakColor="#047857" uid={uid} />
            <DoveProp x={435} y={155} scale={1.3} />
            <SaplingTreeProp x={545} y={238} scale={1.3} />
          </g>
        );
      case 56: // لا تردوا الشتيمة بمثلها
        return (
          <g>
            <LuminousFigure x={295} y={212} pose="standing" cloakColor="#059669" uid={uid} />
            <DoveProp x={410} y={150} scale={1.25} />
            <ElderTraveler x={515} y={218} robeColor="#64748B" />
          </g>
        );
      case 57: // الصبر في الجدل العلمي
        return (
          <g>
            <LuminousFigure x={275} y={216} pose="kneeling" cloakColor="#047857" uid={uid} />
            <OpenBookProp x={400} y={235} scale={1.2} />
            <KidCharacter x={525} y={234} shirtColor="#F59E0B" />
          </g>
        );
      case 58: // الغضب يضيع الصواب
        return (
          <g>
            <LuminousFigure x={285} y={214} pose="standing" cloakColor="#047857" uid={uid} />
            <GoldenLanternProp x={445} y={205} scale={1.35} />
          </g>
        );
      case 59: // حلم الطفولة المبكرة
        return (
          <g>
            <LuminousFigure x={305} y={226} scale={0.82} pose="standing" cloakColor="#0D9488" uid={uid} />
            <SaplingTreeProp x={465} y={238} scale={1.4} />
          </g>
        );
      case 60: // الاعتذار عند الغضب السريع
        return (
          <g>
            <KidCharacter x={320} y={234} shirtColor="#10B981" />
            <KidCharacter x={465} y={234} shirtColor="#0284C7" />
            <DoveProp x={392} y={150} scale={1.2} />
          </g>
        );

      // ==================== المرحلة 7: العفو عند المقدرة والصفح ====================
      case 61: // اذهبوا فأنتم الطلقاء
        return (
          <g>
            <LuminousFigure x={295} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <DoveProp x={430} y={135} scale={1.3} />
            <DoveProp x={520} y={115} scale={1.1} />
            <ElderTraveler x={540} y={218} robeColor="#64748B" />
          </g>
        );
      case 62: // سقاية جيش الخصم العطشان
        return (
          <g>
            <LuminousFigure x={255} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <WaterPitcherProp x={380} y={236} scale={1.25} />
            <CamelProp x={525} y={228} scale={1.2} />
          </g>
        );
      case 63: // الإحسان لأسير معركة الجمل
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="giving" cloakColor="#059669" uid={uid} />
            <DoveProp x={420} y={145} scale={1.3} />
            <DoveProp x={495} y={120} scale={1.15} />
            <BreadBasketProp x={515} y={248} />
          </g>
        );
      case 64: // حماية عائلة الخصم في بيته
        return (
          <g>
            <LuminousFigure x={285} y={212} pose="giving" cloakColor="#0F766E" uid={uid} />
            <GoldenLanternProp x={410} y={205} scale={1.15} />
            <KidCharacter x={520} y={235} shirtColor="#38BDF8" />
          </g>
        );
      case 65: // صفح النبي عن أهل الطائف
        return (
          <g>
            <LuminousFigure x={295} y={214} pose="standing" cloakColor="#047857" uid={uid} />
            <DoveProp x={450} y={135} scale={1.35} />
            <SaplingTreeProp x={555} y={238} scale={1.35} />
          </g>
        );
      case 66: // قصة الإمام الرضا وحارس المأمون
        return (
          <g>
            <LuminousFigure x={290} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <DoveProp x={415} y={145} scale={1.2} />
            <ElderTraveler x={520} y={218} robeColor="#64748B" />
          </g>
        );
      case 67: // التماس العذر للآخرين
        return (
          <g>
            <LuminousFigure x={295} y={212} pose="standing" cloakColor="#059669" uid={uid} />
            <GoldenLanternProp x={435} y={205} scale={1.2} />
            <KidCharacter x={545} y={236} shirtColor="#0284C7" />
          </g>
        );
      case 68: // عفو السيدة فاطمة عن جارتها
        return (
          <g>
            <LuminousFigure x={305} y={212} pose="standing" veil cloakColor="#0D9488" uid={uid} />
            <GoldenLanternProp x={445} y={200} scale={1.25} />
            <DoveProp x={535} y={145} />
          </g>
        );
      case 69: // رد التحية بأحسن منها
        return (
          <g>
            <LuminousFigure x={285} y={212} pose="giving" cloakColor="#059669" uid={uid} />
            <KidCharacter x={425} y={235} shirtColor="#10B981" />
            <KidCharacter x={500} y={235} shirtColor="#F59E0B" />
          </g>
        );
      case 70: // التساهل في الحقوق الصغيرة
        return (
          <g>
            <KidCharacter x={305} y={234} shirtColor="#10B981" />
            <OpenBookProp x={415} y={236} scale={1.15} />
            <KidCharacter x={525} y={234} shirtColor="#38BDF8" />
          </g>
        );

      // ==================== المرحلة 8: الشجاعة في قول الحق ونصرة المظلوم ====================
      case 71: // المبيت في فراش النبي
        return (
          <g>
            <rect x="275" y="218" width="230" height="44" rx="12" fill="#065F46" />
            <LuminousFigure x={390} y={212} pose="praying" cloakColor="#10B981" uid={uid} />
            <GoldenLanternProp x={560} y={205} />
          </g>
        );
      case 72: // الدفاع عن التاجر المظلوم
        return (
          <g>
            <LuminousFigure x={285} y={212} pose="standing" cloakColor="#047857" uid={uid} />
            <ElderTraveler x={415} y={218} robeColor="#0284C7" />
            <BalanceScaleProp x={535} y={216} scale={1.15} />
          </g>
        );
      case 73: // كلمة الحق بثبات
        return (
          <g>
            <LuminousFigure x={320} y={212} pose="standing" cloakColor="#047857" uid={uid} />
            <GoldenLanternProp x={465} y={195} scale={1.4} />
          </g>
        );
      case 74: // شجاعة الكلمة والحجة
        return (
          <g>
            <LuminousFigure x={340} y={212} pose="standing" veil cloakColor="#065F46" uid={uid} />
            <GoldenLanternProp x={495} y={195} scale={1.3} />
          </g>
        );
      case 75: // شجاعة الطفل أمام الخوف
        return (
          <g>
            <LuminousFigure x={315} y={222} scale={0.88} pose="giving" cloakColor="#059669" uid={uid} />
            <GoldenLanternProp x={465} y={195} scale={1.25} />
          </g>
        );
      case 76: // حراسة حقوق المستضعفين
        return (
          <g>
            <LuminousFigure x={255} y={212} pose="standing" cloakColor="#047857" uid={uid} />
            <BalanceScaleProp x={410} y={210} scale={1.3} />
            <KidCharacter x={545} y={236} shirtColor="#38BDF8" />
          </g>
        );
      case 77: // الاعتراف بالحق فضيلة
        return (
          <g>
            <OpenBookProp x={355} y={228} scale={1.3} />
            <KidCharacter x={505} y={234} shirtColor="#10B981" />
          </g>
        );
      case 78: // الثبات عند تخويف الآخرين
        return (
          <g>
            <LuminousFigure x={305} y={212} pose="standing" cloakColor="#0F766E" uid={uid} />
            <SaplingTreeProp x={485} y={236} scale={1.5} />
          </g>
        );
      case 79: // مساندة الغريب الضعيف
        return (
          <g>
            <KidCharacter x={295} y={234} shirtColor="#10B981" />
            <BreadBasketProp x={400} y={248} />
            <ElderTraveler x={515} y={218} robeColor="#D97706" />
          </g>
        );
      case 80: // التفريق بين الشجاعة والتهور
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="standing" cloakColor="#047857" uid={uid} />
            <KidCharacter x={425} y={234} shirtColor="#0284C7" />
            <KidCharacter x={495} y={236} shirtColor="#10B981" />
          </g>
        );

      // ==================== المرحلة 9: التعاون وخدمة الآخرين والتواضع ====================
      case 81: // النبي يحمل الحجارة مع أصحابه
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="working" cloakColor="#047857" uid={uid} />
            <rect x="380" y="218" width="140" height="48" rx="6" fill="#D97706" opacity="0.85" />
            <KidCharacter x={560} y={234} shirtColor="#0284C7" />
          </g>
        );
      case 82: // العدالة في تقسيم العمل المنزلي
        return (
          <g>
            <LuminousFigure x={295} y={212} pose="working" veil cloakColor="#0D9488" uid={uid} />
            <WaterPitcherProp x={420} y={238} />
            <BreadBasketProp x={505} y={246} />
          </g>
        );
      case 83: // خياطة النعل وحمل المتاع
        return (
          <g>
            <LuminousFigure x={295} y={212} pose="working" cloakColor="#047857" uid={uid} />
            <BreadBasketProp x={430} y={242} scale={1.15} />
          </g>
        );
      case 84: // خدمة الرفقاء في السفر سراً
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="working" cloakColor="#0F766E" uid={uid} />
            <GoldenLanternProp x={400} y={220} />
            <ElderTraveler x={530} y={218} robeColor="#64748B" />
          </g>
        );
      case 85: // الأكل على مائدة واحدة مع العمال
        return (
          <g>
            <LuminousFigure x={255} y={218} pose="kneeling" cloakColor="#047857" uid={uid} />
            <BreadBasketProp x={400} y={246} scale={1.15} />
            <ElderTraveler x={545} y={218} robeColor="#0284C7" />
          </g>
        );
      case 86: // العمل الجماعي في الحديقة
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="working" cloakColor="#059669" uid={uid} />
            <SaplingTreeProp x={410} y={236} scale={1.5} />
            <SaplingTreeProp x={520} y={238} scale={1.3} />
          </g>
        );
      case 87: // لا تستثقل مساعدة غيرك
        return (
          <g>
            <LuminousFigure x={275} y={216} pose="kneeling" cloakColor="#047857" uid={uid} />
            <OpenBookProp x={395} y={234} scale={1.2} />
            <KidCharacter x={515} y={234} shirtColor="#F59E0B" />
          </g>
        );
      case 88: // النبي يشاور أصحابه
        return (
          <g>
            <LuminousFigure x={265} y={214} pose="kneeling" cloakColor="#047857" uid={uid} />
            <OpenBookProp x={400} y={242} scale={1.1} />
            <ElderTraveler x={535} y={218} robeColor="#0284C7" />
          </g>
        );
      case 89: // التواضع في الجلوس والسلام
        return (
          <g>
            <LuminousFigure x={315} y={222} pose="kneeling" cloakColor="#047857" uid={uid} />
            <KidCharacter x={445} y={234} shirtColor="#10B981" />
            <ElderTraveler x={535} y={218} robeColor="#64748B" />
          </g>
        );
      case 90: // بناء الجسر بالتعاون
        return (
          <g>
            <KidCharacter x={265} y={234} shirtColor="#10B981" />
            <KidCharacter x={345} y={234} shirtColor="#0284C7" />
            <KidCharacter x={425} y={234} shirtColor="#F59E0B" />
            <KidCharacter x={505} y={234} shirtColor="#0D9488" />
          </g>
        );

      // ==================== المرحلة 10: حب الجار وبناء المجتمع المترابط ====================
      case 91: // الجار ثم الدار
        return (
          <g>
            <LuminousFigure x={285} y={212} pose="praying" veil cloakColor="#0D9488" uid={uid} />
            <GoldenLanternProp x={440} y={195} scale={1.25} />
            <DoveProp x={530} y={145} />
          </g>
        );
      case 92: // أكثر مرقها وتعاهد جيرانك
        return (
          <g>
            <LuminousFigure x={265} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <BreadBasketProp x={395} y={242} scale={1.15} />
            <ElderTraveler x={525} y={218} robeColor="#0284C7" />
          </g>
        );
      case 93: // ما زال جبريل يوصيني بالجار
        return (
          <g>
            <KidCharacter x={315} y={234} shirtColor="#10B981" />
            <BreadBasketProp x={400} y={248} />
            <ElderTraveler x={515} y={218} robeColor="#64748B" />
          </g>
        );
      case 94: // إكرام الجار وإن اختلفت ديانته
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <KidCharacter x={425} y={234} shirtColor="#F59E0B" />
            <KidCharacter x={495} y={234} shirtColor="#38BDF8" />
          </g>
        );
      case 95: // عيادة المريض من الجيران
        return (
          <g>
            <LuminousFigure x={285} y={212} pose="giving" cloakColor="#059669" uid={uid} />
            <SaplingTreeProp x={420} y={240} scale={1.25} />
            <KidCharacter x={525} y={234} shirtColor="#0284C7" />
          </g>
        );
      case 96: // مئتا بيت في رعاية سرية
        return (
          <g>
            <LuminousFigure x={265} y={212} pose="walking_back" cloakColor="#0F766E" uid={uid} />
            <SaplingTreeProp x={395} y={236} scale={1.3} />
            <SaplingTreeProp x={490} y={238} scale={1.2} />
            <SaplingTreeProp x={575} y={240} scale={1.1} />
          </g>
        );
      case 97: // الابتسامة صدقة في الحي
        return (
          <g>
            <LuminousFigure x={285} y={212} pose="giving" cloakColor="#047857" uid={uid} />
            <KidCharacter x={435} y={234} shirtColor="#10B981" />
            <ElderTraveler x={525} y={218} robeColor="#0284C7" />
          </g>
        );
      case 98: // رد أمانة الجار وحفظ بيته
        return (
          <g>
            <KidCharacter x={305} y={234} shirtColor="#10B981" />
            <rect x="405" y="218" width="66" height="44" rx="8" fill="#D97706" stroke="#FDE68A" strokeWidth="2.5" />
            <ElderTraveler x={545} y={218} robeColor="#64748B" />
          </g>
        );
      case 99: // الصلح بين الجيران والأصدقاء
        return (
          <g>
            <LuminousFigure x={275} y={212} pose="giving" cloakColor="#059669" uid={uid} />
            <KidCharacter x={420} y={234} shirtColor="#0284C7" />
            <KidCharacter x={495} y={234} shirtColor="#F59E0B" />
            <DoveProp x={455} y={140} />
          </g>
        );
      case 100: // سفير النور في كل مكان
      default:
        return (
          <g>
            <LuminousFigure x={300} y={210} pose="standing" cloakColor="#047857" uid={uid} />
            <GoldenLanternProp x={425} y={185} scale={1.5} />
            <DoveProp x={525} y={125} scale={1.2} />
            <KidCharacter x={545} y={236} shirtColor="#10B981" />
          </g>
        );
    }
  };

  return (
    <figure className="relative w-full overflow-hidden bg-gradient-to-b from-[#FAF6EC] to-[#EFE5CC] border-b border-[#B8924A]/50">
      <svg
        viewBox="0 0 800 340"
        className="w-full h-52 sm:h-64 md:h-72 object-cover block"
        role="img"
        aria-label={`رسمة توضيحية لقصة: ${title}`}
      >
        <SceneBackdrop kind={backdrop} uid={uid} />
        {renderForegroundScene()}
      </svg>
      <figcaption className="absolute top-3 right-3 px-3 py-1 rounded-[4px] bg-[#FAF6EC]/92 border border-[#B8924A]/65 text-xs sm:text-sm font-medium text-[#11271F] shadow-xs">
        مشهد القصة · المحطة <span className="tabular-nums">{stationId}</span>
      </figcaption>
    </figure>
  );
};
