import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie-Richtlinie',
  description: 'Cookie-Richtlinie für die WNS Community-Plattform gemäß deutschen und europäischen Datenschutzbestimmungen',
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Cookie-Richtlinie</h1>
      
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <p className="text-lg mb-6">
          Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <p className="mb-6">
          Diese Cookie-Richtlinie erläutert, wie wir Cookies und ähnliche Technologien auf unserer Plattform einsetzen. Sie erklärt, was diese Technologien sind, warum wir sie verwenden und welche Rechte Sie haben, um die Verwendung dieser Technologien zu kontrollieren.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Was sind Cookies?</h2>
        <p className="mb-4">
          Cookies sind kleine Textdateien, die auf Ihrem Computer oder Mobilgerät gespeichert werden, wenn Sie eine Website besuchen. Sie werden häufig verwendet, um Websites effizienter funktionieren zu lassen und den Betreibern der Website Informationen zu liefern.
        </p>
        <p className="mb-4">
          Cookies ermöglichen es einer Website, Ihr Gerät zu erkennen und sich zu merken, ob Sie die Website zuvor besucht haben. Cookies können auch verwendet werden, um Ihre Präferenzen zu speichern, zu analysieren, wie Sie die Website nutzen, und sogar personalisierte Inhalte bereitzustellen.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Arten von Cookies, die wir verwenden</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">2.1 Unbedingt erforderliche Cookies</h3>
        <p className="mb-4">
          Diese Cookies sind für das ordnungsgemäße Funktionieren der Website unerlässlich. Sie ermöglichen grundlegende Funktionen wie die Seitennavigation und den Zugriff auf gesicherte Bereiche der Website. Die Website kann ohne diese Cookies nicht richtig funktionieren.
        </p>
        <p className="mb-4">
          Rechtsgrundlage: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">2.2 Leistungs-Cookies</h3>
        <p className="mb-4">
          Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, indem sie Informationen anonym sammeln und melden. Sie helfen uns, die Funktionsweise unserer Website zu verbessern.
        </p>
        <p className="mb-4">
          Rechtsgrundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">2.3 Funktionalitäts-Cookies</h3>
        <p className="mb-4">
          Diese Cookies ermöglichen es der Website, sich an Entscheidungen zu erinnern, die Sie treffen (wie z.B. Ihren Benutzernamen, Ihre Sprache oder die Region, in der Sie sich befinden), und bieten erweiterte, persönlichere Funktionen.
        </p>
        <p className="mb-4">
          Rechtsgrundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">2.4 Targeting-/Werbe-Cookies</h3>
        <p className="mb-4">
          Diese Cookies werden verwendet, um Werbung zu liefern, die für Sie und Ihre Interessen relevanter ist. Sie werden auch verwendet, um die Häufigkeit, mit der Sie eine Anzeige sehen, zu begrenzen und die Wirksamkeit von Werbekampagnen zu messen.
        </p>
        <p className="mb-4">
          Rechtsgrundlage: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Cookies von Drittanbietern</h2>
        <p className="mb-4">
          Zusätzlich zu unseren eigenen Cookies können wir auch verschiedene Cookies von Drittanbietern verwenden, um Nutzungsstatistiken der Website zu melden, Werbung zu liefern und so weiter. Diese Cookies können umfassen:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Analyse-Cookies von Diensten wie Google Analytics</li>
          <li>Cookies sozialer Medien von Plattformen wie Facebook, Twitter und LinkedIn</li>
          <li>Werbe-Cookies von unseren Werbepartnern</li>
        </ul>
        
        <h3 className="text-xl font-medium mt-6 mb-3">3.1 Google Analytics</h3>
        <p className="mb-4">
          Wir setzen auf Grundlage Ihrer Einwilligung Google Analytics ein, einen Webanalysedienst der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Google verarbeitet die Daten zur Websitenutzung in unserem Auftrag und verpflichtet sich vertraglich zu Maßnahmen, um die Sicherheit und Vertraulichkeit der verarbeiteten Daten zu gewährleisten.
        </p>
        <p className="mb-4">
          Während Ihres Website-Besuchs werden unter anderem folgende Daten aufgezeichnet:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Aufgerufene Seiten</li>
          <li>Die Erreichung von "Website-Zielen" (z.B. Anmeldungen und Formularübermittlungen)</li>
          <li>Ihr Verhalten auf den Seiten (beispielsweise Verweildauer, Klicks, Scrollverhalten)</li>
          <li>Ihr ungefährer Standort (Land)</li>
          <li>Ihre IP-Adresse (in gekürzter Form, sodass keine eindeutige Zuordnung möglich ist)</li>
          <li>Technische Informationen wie Browser, Internetanbieter, Endgerät und Bildschirmauflösung</li>
          <li>Herkunftsquelle Ihres Besuchs (d.h. über welche Website oder über welches Werbemittel Sie zu uns gekommen sind)</li>
        </ul>
        
        <h3 className="text-xl font-medium mt-6 mb-3">3.2 OpenStreetMap</h3>
        <p className="mb-4">
          Auf unserer Website verwenden wir den Kartendienst OpenStreetMap der OpenStreetMap Foundation (OSMF). Wenn Sie eine Seite mit integrierten OpenStreetMap-Karten besuchen, wird eine Verbindung zu den Servern von OpenStreetMap hergestellt. Dabei können Daten über Ihre Nutzung unserer Website (z.B. Ihre IP-Adresse) an OpenStreetMap übertragen, dort gespeichert und unter Umständen verarbeitet werden.
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">3.3 Cloudflare</h3>
        <p className="mb-4">
          Wir nutzen den Dienst Cloudflare zum Schutz unserer Website vor schädlichen Angriffen und zur Verbesserung der Ladezeiten. Bei der Nutzung unserer Website werden Daten an Cloudflare übermittelt, die für die Sicherheits- und Leistungsoptimierung erforderlich sind.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Wie Sie Cookies kontrollieren können</h2>
        <p className="mb-4">
          Sie haben das Recht, selbst zu entscheiden, ob Sie Cookies akzeptieren, blockieren oder löschen möchten. Bei Ihrem ersten Besuch auf unserer Website werden Sie über die Verwendung von Cookies informiert und um Ihre Einwilligung gebeten (mit Ausnahme der unbedingt erforderlichen Cookies, die für die Funktionalität der Website notwendig sind).
        </p>
        <p className="mb-4">
          Sie können Ihre Cookie-Einstellungen jederzeit ändern, indem Sie das Cookie-Banner am unteren Bildschirmrand aufrufen oder den Link "Cookie-Einstellungen" im Footer unserer Website nutzen.
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">4.1 Browser-Einstellungen</h3>
        <p className="mb-4">
          Sie können Cookies auch über Ihre Browser-Einstellungen verwalten. Hier ist, wie Sie dies in gängigen Browsern tun können:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>
            <strong>Chrome:</strong> Einstellungen → Datenschutz und Sicherheit → Cookies und andere Websitedaten
          </li>
          <li>
            <strong>Firefox:</strong> Einstellungen → Datenschutz & Sicherheit → Cookies und Website-Daten
          </li>
          <li>
            <strong>Safari:</strong> Einstellungen → Datenschutz → Cookies und Website-Daten
          </li>
          <li>
            <strong>Edge:</strong> Einstellungen → Websiteberechtigungen → Cookies und Website-Daten
          </li>
        </ul>
        <p className="mb-4">
          Weitere Informationen über Cookies, einschließlich wie Sie sehen können, welche Cookies gesetzt wurden, finden Sie unter <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">www.allaboutcookies.org</a>.
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">4.2 Opt-Out für spezifische Drittanbieter-Cookies</h3>
        <p className="mb-4">
          Für Cookies, die Sie über verschiedene Websites hinweg verfolgen, wie z.B. Werbe-Cookies, können Sie sich über diese Dienste abmelden:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>
            <a href="https://www.youronlinechoices.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Your Online Choices</a> (EU)
          </li>
          <li>
            <a href="https://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Network Advertising Initiative</a> (US)
          </li>
          <li>
            <a href="https://optout.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Digital Advertising Alliance</a> (US)
          </li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Rechtsgrundlage für die Verarbeitung</h2>
        <p className="mb-4">
          Die Rechtsgrundlage für die Verarbeitung Ihrer Daten im Zusammenhang mit Cookies hängt von der jeweiligen Art des Cookies ab:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Unbedingt erforderliche Cookies: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)</li>
          <li>Alle anderen Cookies (Leistungs-, Funktionalitäts-, Targeting-/Werbe-Cookies): Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Änderungen dieser Cookie-Richtlinie</h2>
        <p className="mb-4">
          Wir können diese Cookie-Richtlinie von Zeit zu Zeit aktualisieren, um Änderungen der Technologie, der Vorschriften oder unserer Geschäftspraktiken widerzuspiegeln. Alle Änderungen werden wirksam, wenn wir die überarbeitete Richtlinie auf unserer Website veröffentlichen.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Kontakt</h2>
        <p className="mb-4">
          Wenn Sie Fragen zu unserer Verwendung von Cookies oder dieser Cookie-Richtlinie haben, kontaktieren Sie uns bitte unter:
        </p>
        <p className="mb-2">Magnus Ohle</p>
        <p className="mb-2">E-Mail: info@magnusohle.de</p>
        <p className="mb-2">Telefon: +49 (0) 176 41495195</p>
      </div>
    </div>
  );
} 