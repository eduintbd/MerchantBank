import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '8801324686540';
const WHATSAPP_MESSAGE = encodeURIComponent('Hi, I have a query about Abaci Investments.');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

export function WhatsAppFab() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
      style={{
        background: '#25D366',
        boxShadow: '0 4px 14px rgba(37,211,102,0.4)',
      }}
    >
      <MessageCircle size={26} color="#fff" fill="#fff" />
    </a>
  );
}
