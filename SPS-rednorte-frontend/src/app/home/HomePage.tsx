import { PublicHeader } from '../components/layout/PublicHeader';
import { Footer } from '../components/layout/Footer';
import { HeroSlider } from '../home/HeroSlider';
import { BookingSection } from '../home/BookingSection';
import { ServiciosSection } from '../home/ServiciosSection';
import { CentrosSection } from '../home/CentrosSection';
import { FloatingElements } from '../home/FloatingElements';

interface HomePageProps {
  onLogin: () => void;
  onReserva?: () => void;
  onUrgencia?: () => void;
}

export function HomePage({ onLogin, onReserva, onUrgencia }: HomePageProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <PublicHeader onLogin={onLogin} onReserva={onReserva} onUrgencia={onUrgencia} />
      
      <main className="flex-1">
        <HeroSlider onReserva={onReserva} onUrgencia={onUrgencia} />
        <BookingSection onReserva={onReserva} onUrgencia={onUrgencia} />
        <ServiciosSection />
        <CentrosSection />
      </main>

      <Footer />
      <FloatingElements />
    </div>
  );
}