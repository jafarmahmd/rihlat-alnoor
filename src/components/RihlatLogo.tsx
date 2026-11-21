import React from 'react';
import { ManuscriptCornerBracket } from './IslamicOrnaments';

export const OFFICIAL_LOGO_URL =
  '/assets/aistudio/Gemini_Generated_Image_nrvmafnrvmafnrvm_1d697231.jpg';

interface RihlatLogoProps {
  size?: 'sm' | 'lg';
}

export const RihlatLogo: React.FC<RihlatLogoProps> = ({ size = 'lg' }) => {
  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2.5 select-none">
        <div className="p-0.5 rounded-[5px] border border-[#B8924A]/65 bg-[#FAF6EC] shadow-2xs">
          <img
            src={OFFICIAL_LOGO_URL}
            alt="شعار تطبيق رحلة النور"
            className="h-8 sm:h-9 w-auto object-contain rounded-[3px] bg-white block"
          />
        </div>
        <div className="hidden sm:block text-right leading-none">
          <span className="font-calligraphy font-bold text-lg text-[#0F3D2E] block">
            رحلة النور
          </span>
          <span className="text-[10px] font-medium text-[#7A5E2A] tracking-wide">
            جمعية كشافة الموعود الإسلامية
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center lg:items-start select-none w-full">
      <h1 className="sr-only">
        رحلة النور — أدعية، معرفة أهل البيت، وتعلم ممتع
      </h1>
      <div className="relative p-2 bg-[#F4EEDB] border border-[#B8924A]/65 rounded-[8px] shadow-xs max-w-[270px] sm:max-w-[330px]">
        <ManuscriptCornerBracket position="top-right" className="absolute -top-1.5 -right-1.5" />
        <ManuscriptCornerBracket position="bottom-left" className="absolute -bottom-1.5 -left-1.5" />
        <img
          src={OFFICIAL_LOGO_URL}
          alt="الشعار الرسمي لتطبيق رحلة النور — أدعية، معرفة أهل البيت، وتعلم ممتع"
          className="w-full h-auto object-contain rounded-[4px] bg-white border border-[#B8924A]/30 block"
        />
      </div>
    </div>
  );
};
