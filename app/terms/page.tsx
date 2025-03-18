import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Allgemeine Geschäftsbedingungen',
  description: 'Allgemeine Geschäftsbedingungen für die WNS Community-Plattform gemäß deutschen und europäischen Rechtsbestimmungen',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>
      
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <p className="text-lg mb-6">
          Zuletzt aktualisiert: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 1 Geltungsbereich</h2>
        <p className="mb-4">
          (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für die Nutzung der unter wns-community.com (nachfolgend "Plattform") angebotenen Dienste und Funktionen durch registrierte und nicht registrierte Nutzer.
        </p>
        <p className="mb-4">
          (2) Betreiber der Plattform und Vertragspartner des Nutzers ist:
        </p>
        <p className="mb-2">Magnus Ohle</p>
        <p className="mb-2">Haaggasse 10</p>
        <p className="mb-2">72070 Tübingen</p>
        <p className="mb-2">Deutschland</p>
        <p className="mb-2">E-Mail: info@magnusohle.de</p>
        <p className="mb-2">Telefon: +49 (0) 176 41495195</p>
        <p className="mb-4">
          (nachfolgend "Betreiber" oder "wir")
        </p>
        <p className="mb-4">
          (3) Mit der Registrierung und/oder Nutzung unserer Plattform akzeptieren Sie diese AGB und alle weiteren Nutzungsbedingungen, die für spezifische Dienste gelten können. Abweichende Bedingungen des Nutzers finden keine Anwendung, es sei denn, wir haben diesen ausdrücklich zugestimmt.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 2 Leistungsbeschreibung</h2>
        <p className="mb-4">
          (1) Die Plattform dient als Community-Plattform für Sportler und Sportinteressierte, um Kontakte zu knüpfen, Veranstaltungen zu organisieren, Gruppen zu bilden und sportbezogene Inhalte auszutauschen.
        </p>
        <p className="mb-4">
          (2) Die Plattform bietet folgende Hauptfunktionen:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Erstellung und Verwaltung eines persönlichen Profils</li>
          <li>Veröffentlichung und Austausch von sportbezogenen Inhalten</li>
          <li>Organisation und Teilnahme an Sportveranstaltungen</li>
          <li>Gründung von und Beitritt zu Sportgruppen</li>
          <li>Suche und Vernetzung mit anderen Sportlern</li>
          <li>Teilen von Standorten und Sportstätten</li>
        </ul>
        <p className="mb-4">
          (3) Die Nutzung der Plattform ist grundsätzlich kostenlos. Für bestimmte Premium-Funktionen oder Dienste können in Zukunft Gebühren anfallen, über die wir Sie vorab informieren werden.
        </p>
        <p className="mb-4">
          (4) Wir behalten uns das Recht vor, die angebotenen Dienste und Funktionen jederzeit zu ändern, zu erweitern oder einzustellen, sofern dies für den Nutzer zumutbar ist.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 3 Registrierung und Nutzerkonto</h2>
        <p className="mb-4">
          (1) Für die vollständige Nutzung aller Funktionen der Plattform ist eine Registrierung erforderlich. Die Registrierung ist nur voll geschäftsfähigen natürlichen Personen oder juristischen Personen gestattet.
        </p>
        <p className="mb-4">
          (2) Bei der Registrierung sind wahrheitsgemäße und vollständige Angaben zu machen. Die Verwendung von Pseudonymen ist gestattet, solange keine Rechte Dritter verletzt werden.
        </p>
        <p className="mb-4">
          (3) Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und vor dem Zugriff Dritter zu schützen. Eine Weitergabe der Zugangsdaten an Dritte ist nicht gestattet.
        </p>
        <p className="mb-4">
          (4) Der Nutzer haftet grundsätzlich für alle Aktivitäten, die unter Verwendung seines Benutzerkontos vorgenommen werden. Hat der Nutzer den Verdacht, dass sein Konto von Dritten unbefugt genutzt wird, ist er verpflichtet, uns unverzüglich zu informieren.
        </p>
        <p className="mb-4">
          (5) Es besteht kein Anspruch auf Registrierung. Wir behalten uns vor, Registrierungen ohne Angabe von Gründen abzulehnen.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 4 Rechte und Pflichten der Nutzer</h2>
        <p className="mb-4">
          (1) Der Nutzer ist verpflichtet, bei der Nutzung unserer Plattform alle anwendbaren Gesetze und Vorschriften einzuhalten. Insbesondere verpflichtet sich der Nutzer, keine Inhalte zu veröffentlichen oder zu teilen, die:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>gegen geltendes Recht oder diese AGB verstoßen</li>
          <li>rassistische, gewaltverherrlichende, pornografische oder jugendgefährdende Inhalte enthalten</li>
          <li>Rechte Dritter, insbesondere Urheber-, Marken-, Patent- oder Persönlichkeitsrechte verletzen</li>
          <li>beleidigend, belästigend, verleumderisch oder anderweitig anstößig sind</li>
          <li>Schadsoftware oder Viren enthalten</li>
          <li>kommerzielle Werbung ohne unsere vorherige Zustimmung darstellen</li>
        </ul>
        <p className="mb-4">
          (2) Der Nutzer verpflichtet sich, andere Nutzer nicht zu belästigen, zu bedrohen oder zu schädigen.
        </p>
        <p className="mb-4">
          (3) Das automatisierte Auslesen von Daten oder die Nutzung von Bots, Scrapern oder ähnlichen Technologien ist ohne unsere ausdrückliche Zustimmung untersagt.
        </p>
        <p className="mb-4">
          (4) Bei Verstößen gegen diese Pflichten behalten wir uns vor, Inhalte zu entfernen, Nutzerkonten zu sperren oder zu löschen und gegebenenfalls rechtliche Schritte einzuleiten.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 5 Nutzerinhalte und Rechteeinräumung</h2>
        <p className="mb-4">
          (1) Der Nutzer bleibt Inhaber aller Rechte an den von ihm auf der Plattform veröffentlichten Inhalten (Texte, Bilder, Videos, Audiodateien, etc.).
        </p>
        <p className="mb-4">
          (2) Mit dem Hochladen oder der Veröffentlichung von Inhalten räumt der Nutzer dem Betreiber ein einfaches, räumlich unbeschränktes, übertragbares, unterlizenzierbares und unentgeltliches Recht ein, diese Inhalte für die Zwecke des Betriebs der Plattform zu nutzen. Dies umfasst insbesondere das Recht:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>die Inhalte zu speichern, zu hosten und öffentlich zugänglich zu machen</li>
          <li>die Inhalte technisch zu bearbeiten und zu formatieren, um sie auf verschiedenen Geräten und in verschiedenen Formaten darstellen zu können</li>
          <li>die Inhalte innerhalb der Plattform zu teilen und zu verbreiten</li>
        </ul>
        <p className="mb-4">
          (3) Der Nutzer garantiert, dass er über alle erforderlichen Rechte an den von ihm veröffentlichten Inhalten verfügt und dass durch die Veröffentlichung keine Rechte Dritter verletzt werden.
        </p>
        <p className="mb-4">
          (4) Der Nutzer stellt uns von sämtlichen Ansprüchen Dritter frei, die gegen uns aufgrund von Inhalten geltend gemacht werden, die der Nutzer auf der Plattform veröffentlicht hat. Dies gilt nicht, wenn der Nutzer die Rechtsverletzung nicht zu vertreten hat.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 6 Veranstaltungen und Gruppen</h2>
        <p className="mb-4">
          (1) Die Plattform ermöglicht es Nutzern, Veranstaltungen zu erstellen, zu organisieren und daran teilzunehmen sowie Gruppen zu gründen und diesen beizutreten.
        </p>
        <p className="mb-4">
          (2) Ersteller von Veranstaltungen oder Gruppen sind für deren Inhalte, Organisation und Durchführung selbst verantwortlich. Sie verpflichten sich, keine Veranstaltungen oder Gruppen zu erstellen, die gegen geltendes Recht oder diese AGB verstoßen.
        </p>
        <p className="mb-4">
          (3) Die Anmeldung zu einer Veranstaltung oder der Beitritt zu einer Gruppe stellt eine Willenserklärung dar. Der Nutzer verpflichtet sich, im Falle einer Teilnahmeunmöglichkeit sich rechtzeitig abzumelden.
        </p>
        <p className="mb-4">
          (4) Der Betreiber der Plattform ist nicht Vertragspartei der zwischen den Nutzern geschlossenen Vereinbarungen bezüglich der Teilnahme an Veranstaltungen oder Gruppen und übernimmt keine Haftung für deren Durchführung oder Inhalte.
        </p>
        <p className="mb-4">
          (5) Bei der Teilnahme an Sportveranstaltungen oder -aktivitäten ist der Nutzer selbst für seine körperliche Fitness, Gesundheit und Sicherheit verantwortlich. Die Teilnahme erfolgt auf eigenes Risiko.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 7 Verfügbarkeit und Wartung</h2>
        <p className="mb-4">
          (1) Wir bemühen uns, die Plattform jederzeit verfügbar zu halten, können jedoch keine ununterbrochene Verfügbarkeit garantieren. Insbesondere können technische Störungen, Wartungsarbeiten oder Sicherheitsprobleme zu vorübergehenden Einschränkungen oder Unterbrechungen führen.
        </p>
        <p className="mb-4">
          (2) Geplante Wartungsarbeiten werden wir, soweit möglich, rechtzeitig ankündigen. Ein Anspruch auf ständige Verfügbarkeit der Plattform besteht nicht.
        </p>
        <p className="mb-4">
          (3) Wir behalten uns vor, die Plattform jederzeit zu aktualisieren, zu erweitern oder anderweitig zu verändern, soweit dies für den Nutzer zumutbar ist und den Vertragszweck nicht gefährdet.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 8 Datenschutz</h2>
        <p className="mb-4">
          (1) Der Schutz persönlicher Daten ist uns ein wichtiges Anliegen. Wie wir mit Ihren Daten umgehen, erfahren Sie in unserer <a href="/privacy" className="text-blue-600 hover:underline">Datenschutzerklärung</a>.
        </p>
        <p className="mb-4">
          (2) Der Nutzer erklärt sich mit der Erhebung, Verarbeitung und Nutzung seiner personenbezogenen Daten im Rahmen des für die Nutzung der Plattform erforderlichen Umfangs einverstanden.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 9 Haftung</h2>
        <p className="mb-4">
          (1) Für Schäden, die durch uns, unsere gesetzlichen Vertreter oder Erfüllungsgehilfen vorsätzlich oder grob fahrlässig verursacht wurden, haften wir unbeschränkt.
        </p>
        <p className="mb-4">
          (2) Bei leicht fahrlässiger Verletzung einer Hauptleistungspflicht oder einer Nebenpflicht, deren Verletzung die Erreichung des Vertragszwecks gefährdet oder deren Erfüllung die ordnungsgemäße Durchführung des Vertrages überhaupt erst ermöglicht und auf deren Einhaltung der Nutzer vertrauen durfte (wesentliche Nebenpflicht), ist unsere Haftung auf den bei Vertragsschluss vorhersehbaren, vertragstypischen Schaden begrenzt.
        </p>
        <p className="mb-4">
          (3) Bei leicht fahrlässiger Verletzung von Nebenpflichten, die keine wesentlichen Nebenpflichten sind, haften wir nicht.
        </p>
        <p className="mb-4">
          (4) Die vorgenannten Haftungsausschlüsse und -beschränkungen gelten nicht bei arglistigem Verschweigen von Mängeln, bei Übernahme einer Beschaffenheitsgarantie sowie bei Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.
        </p>
        <p className="mb-4">
          (5) Für Inhalte, die von Nutzern auf die Plattform hochgeladen oder dort veröffentlicht werden, übernehmen wir keine Haftung. Dies gilt auch für Inhalte auf verlinkten externen Websites.
        </p>
        <p className="mb-4">
          (6) Wir haften nicht für Schäden, die dem Nutzer durch die Teilnahme an Veranstaltungen oder Aktivitäten entstehen, die über die Plattform organisiert wurden. Die Teilnahme erfolgt auf eigenes Risiko.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 10 Laufzeit und Kündigung</h2>
        <p className="mb-4">
          (1) Die Nutzungsvereinbarung wird auf unbestimmte Zeit geschlossen.
        </p>
        <p className="mb-4">
          (2) Der Nutzer kann sein Nutzerkonto jederzeit ohne Einhaltung einer Frist über die entsprechende Funktion in den Kontoeinstellungen oder durch eine Mitteilung in Textform (z.B. E-Mail) an uns kündigen.
        </p>
        <p className="mb-4">
          (3) Wir können die Nutzungsvereinbarung mit einer Frist von 14 Tagen zum Monatsende kündigen. Das Recht zur Kündigung aus wichtigem Grund bleibt unberührt.
        </p>
        <p className="mb-4">
          (4) Bei schwerwiegenden oder wiederholten Verstößen gegen diese AGB sind wir berechtigt, das Nutzerkonto ohne vorherige Ankündigung zu sperren oder zu löschen.
        </p>
        <p className="mb-4">
          (5) Mit Beendigung der Nutzungsvereinbarung werden alle vom Nutzer hochgeladenen Inhalte nach einer angemessenen Frist gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten bestehen. Der Nutzer ist selbst dafür verantwortlich, vor der Kündigung Kopien seiner Inhalte zu erstellen, wenn er diese behalten möchte.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 11 Änderungen der AGB</h2>
        <p className="mb-4">
          (1) Wir behalten uns vor, diese AGB jederzeit zu ändern, soweit dies aufgrund geänderter Umstände erforderlich ist und der Nutzer hierdurch nicht unangemessen benachteiligt wird. Geänderte Umstände können sich insbesondere ergeben aufgrund geänderter Rechtslage, technischer Änderungen oder Weiterentwicklungen oder sonstiger gleichwertiger Gründe.
        </p>
        <p className="mb-4">
          (2) Über Änderungen der AGB werden wir die Nutzer mindestens 14 Tage vor Inkrafttreten der geänderten AGB per E-Mail informieren.
        </p>
        <p className="mb-4">
          (3) Widerspricht der Nutzer der Geltung der neuen AGB nicht innerhalb von 14 Tagen nach Empfang der Benachrichtigung, gelten die geänderten AGB als akzeptiert. Auf das Widerspruchsrecht und die Rechtsfolgen des Schweigens werden wir in der Änderungsmitteilung besonders hinweisen.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">§ 12 Schlussbestimmungen</h2>
        <p className="mb-4">
          (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts und des internationalen Privatrechts.
        </p>
        <p className="mb-4">
          (2) Erfüllungsort ist unser Geschäftssitz. Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist, soweit gesetzlich zulässig, unser Geschäftssitz.
        </p>
        <p className="mb-4">
          (3) Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit, die unter <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://ec.europa.eu/consumers/odr/</a> abrufbar ist. Wir sind nicht bereit oder verpflichtet, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
        <p className="mb-4">
          (4) Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, so wird dadurch die Gültigkeit der übrigen Bestimmungen nicht berührt. An die Stelle der unwirksamen Bestimmungen tritt in diesem Fall eine wirksame Bestimmung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten kommt. Gleiches gilt für etwaige Regelungslücken.
        </p>
        <p className="mb-4">
          (5) Diese AGB sind in deutscher Sprache verfasst. Bei Widersprüchen zwischen der deutschen und einer übersetzten Version ist die deutsche Version maßgeblich.
        </p>
      </div>
    </div>
  );
} 