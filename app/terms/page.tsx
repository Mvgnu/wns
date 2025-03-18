import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for our community platform',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <p className="text-lg mb-6">
          Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
        <p>
          By accessing or using our platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
        <p>
          Our platform provides a community space for sports enthusiasts to connect, organize events, share content, and engage with others who share similar interests.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
        <p>
          To use certain features of our service, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Provide accurate and complete information when creating your account</li>
          <li>Update your information to keep it current</li>
          <li>Protect your account password and restrict access to your account</li>
          <li>Promptly notify us of any unauthorized use of your account or other security breaches</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. User Content</h2>
        <p>
          Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content you post and its legality, reliability, and appropriateness.
        </p>
        <p className="mt-4">
          By posting content to our platform, you grant us the right to use, modify, publicly perform, publicly display, reproduce, and distribute such content on and through our service. You retain any and all of your rights to any content you submit, post or display and you are responsible for protecting those rights.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Prohibited Uses</h2>
        <p>
          You agree not to use our service for any purpose that is prohibited by these terms. This includes, but is not limited to:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Any unlawful activity</li>
          <li>Soliciting others to perform or participate in unlawful acts</li>
          <li>Violating any regulations, rules, laws, or local ordinances</li>
          <li>Infringing upon or violating our intellectual property rights or the intellectual property rights of others</li>
          <li>Harassing, abusing, insulting, harming, defaming, slandering, disparaging, intimidating, or discriminating based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability</li>
          <li>Submitting false or misleading information</li>
          <li>Uploading or transmitting viruses or any other type of malicious code</li>
          <li>Collecting or tracking the personal information of others</li>
          <li>Spamming, phishing, pharming, pretexting, spidering, crawling, or scraping</li>
          <li>Any obscene or immoral purpose</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property</h2>
        <p>
          Our service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of our company and its licensors. Our service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Termination</h2>
        <p>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including without limitation if you breach the Terms of Service. Upon termination, your right to use the service will immediately cease.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Limitation of Liability</h2>
        <p>
          In no event shall we, our directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us.
        </p>
      </div>
    </div>
  );
} 