import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung für unsere Community-Plattform',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>
      
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <p className="text-lg mb-6">
          Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <p className="mb-6">
          Diese Datenschutzerklärung beschreibt, wie wir Ihre personenbezogenen Daten erheben, verwenden und offenlegen, wenn Sie unsere Plattform nutzen. Wir sind bestrebt, Ihre Privatsphäre zu schützen und Ihnen ein positives Erlebnis auf unserer Plattform zu gewährleisten.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Informationen, die wir sammeln</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">1.1 Informationen, die Sie uns zur Verfügung stellen</h3>
        <p>
          Wir sammeln Informationen, die Sie uns direkt zur Verfügung stellen, wenn Sie:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Ein Konto oder Profil erstellen</li>
          <li>Formulare oder Umfragen ausfüllen</li>
          <li>An Community-Diskussionen teilnehmen</li>
          <li>Mit uns oder anderen Nutzern kommunizieren</li>
          <li>Inhalte, einschließlich Bilder und Videos, veröffentlichen</li>
          <li>Veranstaltungen und Gruppen erstellen oder ihnen beitreten</li>
        </ul>
        <p>
          Diese Informationen können Ihren Namen, Ihre E-Mail-Adresse, Ihr Profilbild, Ihren Standort, Ihre Interessen und alle anderen Informationen umfassen, die Sie angeben möchten.
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">1.2 Informationen, die wir automatisch sammeln</h3>
        <p>
          Wenn Sie unsere Plattform nutzen, erheben wir automatisch bestimmte Informationen über Ihr Gerät und Ihre Nutzung, darunter:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Geräteinformationen (wie Ihre IP-Adresse, Browsertyp, Betriebssystem)</li>
          <li>Nutzungsdaten (wie besuchte Seiten, auf Seiten verbrachte Zeit, angeklickte Links)</li>
          <li>Standortinformationen (wenn Sie diese Funktion aktivieren)</li>
          <li>Cookies und ähnliche Tracking-Technologien</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Wie wir Ihre Informationen verwenden</h2>
        <p>
          Wir verwenden die gesammelten Informationen, um:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Unsere Plattform bereitzustellen, zu unterhalten und zu verbessern</li>
          <li>Ihr Konto zu erstellen und zu verwalten</li>
          <li>Transaktionen zu verarbeiten und zugehörige Informationen zu senden</li>
          <li>Administrative Nachrichten, Updates und Sicherheitshinweise zu senden</li>
          <li>Auf Ihre Kommentare, Fragen und Anfragen zu antworten</li>
          <li>Ihre Erfahrung zu personalisieren und Inhalte und Funktionen bereitzustellen, die zu Ihrem Profil und Ihren Interessen passen</li>
          <li>Trends, Nutzung und Aktivitäten im Zusammenhang mit unserer Plattform zu überwachen und zu analysieren</li>
          <li>Betrügerische Transaktionen und andere illegale Aktivitäten zu erkennen, zu untersuchen und zu verhindern</li>
          <li>Gesetzlichen Verpflichtungen nachzukommen</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Weitergabe von Informationen</h2>
        <p>
          Wir können Ihre Informationen unter folgenden Umständen weitergeben:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Mit anderen Nutzern gemäß Ihren Datenschutzeinstellungen (z.B. Profilinformationen, Beiträge, Veranstaltungsteilnahme)</li>
          <li>Mit Dienstleistern, die Dienstleistungen in unserem Auftrag erbringen</li>
          <li>Als Reaktion auf rechtliche Verfahren oder wenn wir der Meinung sind, dass die Offenlegung notwendig ist, um unsere Rechte, unser Eigentum oder unsere Sicherheit zu schützen</li>
          <li>Im Zusammenhang mit einer Fusion, Übernahme oder dem Verkauf aller oder eines Teils unserer Vermögenswerte</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Ihre Wahlmöglichkeiten</h2>
        <p>
          Sie haben mehrere Möglichkeiten bezüglich der Informationen, die Sie uns zur Verfügung stellen:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Kontoinformationen: Sie können Ihre Kontoinformationen jederzeit aktualisieren, indem Sie auf Ihre Kontoeinstellungen zugreifen</li>
          <li>Profilsichtbarkeit: Sie können die Sichtbarkeit Ihrer Profilinformationen über Ihre Datenschutzeinstellungen steuern</li>
          <li>Kommunikation: Sie können den Empfang von Werbe-E-Mails ablehnen, indem Sie den Anweisungen in diesen E-Mails folgen</li>
          <li>Cookies: Die meisten Webbrowser sind standardmäßig so eingestellt, dass sie Cookies akzeptieren. Sie können Ihren Browser in der Regel so einstellen, dass er Cookies entfernt oder ablehnt</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Datensicherheit</h2>
        <p>
          Wir ergreifen angemessene Maßnahmen, um Ihre personenbezogenen Daten vor Verlust, Diebstahl, Missbrauch, unbefugtem Zugriff, Offenlegung, Änderung und Zerstörung zu schützen. Keine Internet- oder E-Mail-Übertragung ist jedoch jemals vollständig sicher oder fehlerfrei.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Datenschutz für Kinder</h2>
        <p>
          Unsere Plattform richtet sich nicht an Kinder unter 13 Jahren, und wir erheben wissentlich keine personenbezogenen Daten von Kindern unter 13 Jahren. Wenn wir erfahren, dass wir personenbezogene Daten von einem Kind unter 13 Jahren gesammelt haben, werden wir diese Informationen umgehend löschen.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Internationale Datenübertragungen</h2>
        <p>
          Wir können Ihre personenbezogenen Daten in andere Länder übertragen als das Land, in dem Sie leben. Wir setzen geeignete Schutzmaßnahmen ein, um Ihre personenbezogenen Daten bei internationalen Übertragungen zu schützen.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Änderungen dieser Datenschutzerklärung</h2>
        <p>
          Wir können diese Datenschutzerklärung von Zeit zu Zeit ändern. Wenn wir Änderungen vornehmen, werden wir Sie benachrichtigen, indem wir das Datum oben in der Richtlinie aktualisieren und Ihnen in einigen Fällen zusätzliche Hinweise geben.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Kontaktieren Sie uns</h2>
        <p>
          Wenn Sie Fragen zu dieser Datenschutzerklärung haben, kontaktieren Sie uns bitte.
        </p>
      </div>
    </div>
  );
} 