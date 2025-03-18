import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung für die WNS Community-Plattform gemäß deutschen und europäischen Datenschutzbestimmungen',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>
      
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <p className="text-lg mb-6">
          Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Verantwortlicher und Kontaktdaten</h2>
        <p className="mb-4">
          Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
        </p>
        <p className="mb-2">Magnus Ohle</p>
        <p className="mb-2">Haaggasse 10</p>
        <p className="mb-2">72070 Tübingen</p>
        <p className="mb-2">Deutschland</p>
        <p className="mb-2">E-Mail: info@magnusohle.de</p>
        <p className="mb-2">Telefon: +49 (0) 176 41495195</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Grundlegendes zum Datenschutz</h2>
        <p className="mb-4">
          Der Schutz Ihrer personenbezogenen Daten ist uns ein wichtiges Anliegen. Diese Datenschutzerklärung informiert Sie darüber, welche personenbezogenen Daten wir erheben, wie wir mit diesen Daten umgehen und welche Rechte Ihnen im Zusammenhang mit Ihren personenbezogenen Daten zustehen. Wir verarbeiten Ihre Daten im Einklang mit den anwendbaren Rechtsvorschriften zum Schutz personenbezogener Daten, insbesondere der Datenschutz-Grundverordnung (DSGVO) und dem Bundesdatenschutzgesetz (BDSG).
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Erhebung und Verarbeitung personenbezogener Daten</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">3.1 Daten, die Sie uns zur Verfügung stellen</h3>
        <p className="mb-4">
          Wir erheben und verarbeiten personenbezogene Daten, die Sie uns aktiv zur Verfügung stellen, insbesondere durch:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Registrierung und Erstellung eines Benutzerkontos</li>
          <li>Erstellung eines Profils</li>
          <li>Teilnahme an Gruppen und Veranstaltungen</li>
          <li>Hochladen von Inhalten (z.B. Fotos, Videos, Beiträge)</li>
          <li>Nutzung der Kontakt- und Kommunikationsfunktionen</li>
          <li>Ausfüllen von Formularen</li>
        </ul>
        <p className="mb-4">
          Zu den personenbezogenen Daten, die wir in diesem Zusammenhang verarbeiten können, gehören:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Vor- und Nachname</li>
          <li>E-Mail-Adresse</li>
          <li>Profilbild</li>
          <li>Standortdaten (falls Sie diese Funktion aktivieren)</li>
          <li>Sportliche Interessen und Präferenzen</li>
          <li>Kommunikationsinhalte</li>
          <li>Informationen zu Ihren Aktivitäten auf unserer Plattform</li>
        </ul>
        
        <h3 className="text-xl font-medium mt-6 mb-3">3.2 Automatisch erhobene Daten</h3>
        <p className="mb-4">
          Bei der Nutzung unserer Website und App erheben wir automatisch bestimmte technische Informationen, darunter:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>IP-Adresse</li>
          <li>Datum und Uhrzeit der Anfrage</li>
          <li>Zeitzonendifferenz zur Greenwich Mean Time (GMT)</li>
          <li>Inhalt der Anforderung (konkrete Seite)</li>
          <li>Zugriffsstatus/HTTP-Statuscode</li>
          <li>Jeweils übertragene Datenmenge</li>
          <li>Website, von der die Anforderung kommt</li>
          <li>Browser und Betriebssystem</li>
          <li>Spracheinstellungen</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Rechtsgrundlagen der Datenverarbeitung</h2>
        <p className="mb-4">
          Wir verarbeiten Ihre personenbezogenen Daten auf Grundlage folgender Rechtsgrundlagen:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Für die Erfüllung eines Vertrags oder zur Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO), wenn Sie unsere Dienste nutzen oder ein Nutzerkonto erstellen.</li>
          <li>Auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), beispielsweise wenn Sie in die Nutzung Ihrer Standortdaten einwilligen.</li>
          <li>Zur Wahrung unserer berechtigten Interessen (Art. 6 Abs. 1 lit. f DSGVO), etwa zur Verbesserung unserer Dienste, zur Gewährleistung der IT-Sicherheit oder zur Verhinderung von Missbrauch.</li>
          <li>Zur Erfüllung rechtlicher Verpflichtungen (Art. 6 Abs. 1 lit. c DSGVO), denen wir unterliegen.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Zwecke der Datenverarbeitung</h2>
        <p className="mb-4">
          Wir verarbeiten Ihre personenbezogenen Daten für folgende Zwecke:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Bereitstellung unserer Plattform und ihrer Funktionen</li>
          <li>Erstellung und Verwaltung von Benutzerkonten</li>
          <li>Ermöglichung der Kommunikation zwischen Nutzern</li>
          <li>Organisation und Verwaltung von Veranstaltungen und Gruppen</li>
          <li>Verbesserung und Personalisierung unserer Dienste</li>
          <li>Gewährleistung der Sicherheit unserer Plattform</li>
          <li>Einhaltung gesetzlicher Pflichten</li>
          <li>Analysen zur Verbesserung der Nutzererfahrung</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Externe Dienste und Datenübermittlung</h2>
        
        <h3 className="text-xl font-medium mt-6 mb-3">6.1 OpenStreetMap</h3>
        <p className="mb-4">
          Auf unserer Plattform nutzen wir OpenStreetMap zur Darstellung von Karten und Standorten. OpenStreetMap ist ein Dienst der OpenStreetMap Foundation. Bei der Nutzung der Kartenfunktion können Daten wie Ihre IP-Adresse und Standortdaten an die Server von OpenStreetMap übermittelt werden. Weitere Informationen zum Datenschutz bei OpenStreetMap finden Sie unter: <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://wiki.osmfoundation.org/wiki/Privacy_Policy</a>
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">6.2 Cloudflare</h3>
        <p className="mb-4">
          Wir nutzen den Dienst Cloudflare zum Schutz unserer Website vor schädlichen Angriffen und zur Verbesserung der Ladezeiten. Betreiber ist die Cloudflare Inc., 101 Townsend St, San Francisco, CA 94107, USA. Cloudflare speichert Cookies auf Ihrem Rechner, um die Sicherheit und Leistung zu optimieren. Die Datenschutzerklärung von Cloudflare finden Sie unter: <a href="https://www.cloudflare.com/de-de/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.cloudflare.com/de-de/privacypolicy/</a>
        </p>
        
        <h3 className="text-xl font-medium mt-6 mb-3">6.3 Vercel</h3>
        <p className="mb-4">
          Unsere Website wird auf Servern von Vercel gehostet. Betreiber ist die Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA. Vercel verarbeitet dabei Server-Logs und andere technische Daten. Die Datenschutzerklärung von Vercel finden Sie unter: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://vercel.com/legal/privacy-policy</a>
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies und ähnliche Technologien</h2>
        <p className="mb-4">
          Wir verwenden auf unserer Plattform Cookies und ähnliche Technologien. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden und bestimmte Informationen enthalten. Wir nutzen sowohl Session-Cookies, die nach dem Schließen Ihres Browsers automatisch gelöscht werden, als auch persistente Cookies, die für einen längeren Zeitraum auf Ihrem Endgerät gespeichert bleiben.
        </p>
        <p className="mb-4">
          Wir verwenden Cookies für folgende Zwecke:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Technisch notwendige Cookies, die für die Funktionalität unserer Website erforderlich sind</li>
          <li>Funktionale Cookies, die es uns ermöglichen, Ihre Präferenzen zu speichern</li>
          <li>Analytische Cookies, die uns helfen, die Nutzung unserer Website zu verstehen und zu verbessern</li>
        </ul>
        <p className="mb-4">
          Detaillierte Informationen zu den von uns verwendeten Cookies finden Sie in unserer <a href="/cookies" className="text-blue-600 hover:underline">Cookie-Richtlinie</a>.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Speicherdauer</h2>
        <p className="mb-4">
          Wir speichern Ihre personenbezogenen Daten nur so lange, wie es für die Zwecke, für die sie erhoben wurden, erforderlich ist oder solange gesetzliche Aufbewahrungsfristen bestehen. Konkret bedeutet dies:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Daten Ihres Nutzerkontos werden gespeichert, solange Ihr Konto besteht.</li>
          <li>Nach Löschung Ihres Kontos werden Ihre Daten innerhalb von 30 Tagen vollständig gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.</li>
          <li>Daten, die für die Abwehr von Rechtsansprüchen benötigt werden, können bis zum Ablauf der entsprechenden Verjährungsfristen gespeichert werden.</li>
          <li>Server-Logs werden in der Regel für einen Zeitraum von maximal 7 Tagen gespeichert.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Ihre Rechte als betroffene Person</h2>
        <p className="mb-4">
          Nach der Datenschutz-Grundverordnung stehen Ihnen folgende Rechte zu:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie haben das Recht, Auskunft über die von uns zu Ihrer Person gespeicherten Daten zu erhalten.</li>
          <li><strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger oder die Vervollständigung unvollständiger Daten verlangen.</li>
          <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können unter bestimmten Voraussetzungen die Löschung Ihrer Daten verlangen.</li>
          <li><strong>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können unter bestimmten Umständen eine Einschränkung der Verarbeitung Ihrer Daten verlangen.</li>
          <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können verlangen, dass wir Ihnen Ihre Daten in einem strukturierten, gängigen und maschinenlesbaren Format übermitteln.</li>
          <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können jederzeit der Verarbeitung Ihrer Daten widersprechen, die auf Grundlage eines berechtigten Interesses erfolgt.</li>
          <li><strong>Recht auf Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Sie können eine erteilte Einwilligung jederzeit widerrufen, ohne dass die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung berührt wird.</li>
        </ul>
        <p className="mb-4">
          Zur Ausübung Ihrer Rechte können Sie sich jederzeit an uns unter den oben angegebenen Kontaktdaten wenden.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Beschwerderecht bei der Aufsichtsbehörde</h2>
        <p className="mb-4">
          Sie haben das Recht, sich bei einer Datenschutzaufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten durch uns zu beschweren. Zuständig ist die Datenschutzaufsichtsbehörde des Bundeslandes, in dem wir unseren Sitz haben, oder die Aufsichtsbehörde Ihres gewöhnlichen Aufenthaltsortes.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">11. Datensicherheit</h2>
        <p className="mb-4">
          Wir treffen angemessene technische und organisatorische Maßnahmen, um Ihre personenbezogenen Daten gegen zufällige oder vorsätzliche Manipulationen, Verlust, Zerstörung oder den Zugriff unberechtigter Personen zu schützen. Unsere Sicherheitsmaßnahmen werden entsprechend der technologischen Entwicklung fortlaufend verbessert.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">12. Datenübermittlung in Drittländer</h2>
        <p className="mb-4">
          Einige der von uns eingesetzten Dienstleister haben ihren Sitz in Ländern außerhalb der Europäischen Union (Drittländer), in denen das geltende Recht nicht das gleiche Datenschutzniveau wie in der Europäischen Union gewährleistet. In solchen Fällen treffen wir geeignete Maßnahmen, um angemessene Garantien zum Schutz Ihrer personenbezogenen Daten sicherzustellen, z.B. durch den Abschluss von EU-Standardvertragsklauseln.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">13. Änderungen dieser Datenschutzerklärung</h2>
        <p className="mb-4">
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen, z.B. bei der Einführung neuer Dienste. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">14. Kontakt zum Datenschutz</h2>
        <p className="mb-4">
          Bei Fragen zur Erhebung, Verarbeitung oder Nutzung Ihrer personenbezogenen Daten, bei Auskünften, Berichtigung, Sperrung oder Löschung von Daten sowie Widerruf erteilter Einwilligungen oder Widerspruch gegen eine bestimmte Datenverwendung wenden Sie sich bitte an:
        </p>
        <p className="mb-2">Magnus Ohle</p>
        <p className="mb-2">E-Mail: info@magnusohle.de</p>
        <p className="mb-2">Telefon: +49 (0) 176 41495195</p>
      </div>
    </div>
  );
} 