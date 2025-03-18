import Link from "next/link";
import { Facebook, Instagram, Twitter, Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-gray-100 bg-white/80 backdrop-blur-sm mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-600">WNS Community</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Eine moderne Community-Plattform für Skater und Hobbysportler zum Vernetzen, Austauschen von Erfahrungen und Zugang zu wertvollen Ressourcen.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-800 uppercase tracking-wider">Entdecken</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/groups" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Gruppen
                </Link>
              </li>
              <li>
                <Link href="/locations" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Orte
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Veranstaltungen
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-800 uppercase tracking-wider">Sportarten</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/sports/skating" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Skateboarding
                </Link>
              </li>
              <li>
                <Link href="/sports/mountain-biking" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Mountainbiken
                </Link>
              </li>
              <li>
                <Link href="/sports/hiking" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Wandern
                </Link>
              </li>
              <li>
                <Link href="/sports/fishing" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Angeln
                </Link>
              </li>
              <li>
                <Link href="/sports/running" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Laufen
                </Link>
              </li>
              <li>
                <Link href="/sports/photography" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Fotografie
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 text-gray-800 uppercase tracking-wider">Rechtliches</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Nutzungsbedingungen
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Datenschutzerklärung
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Cookie-Richtlinie
                </Link>
              </li>
              <li>
                <Link href="/imprint" className="text-gray-600 text-sm hover:text-blue-600 transition-colors">
                  Impressum
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} WNS Community • Mit <Heart className="inline h-3 w-3 text-red-500 fill-red-500" /> erstellt
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-pink-600 transition-colors" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 